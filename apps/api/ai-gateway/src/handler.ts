/**
 * Orquestração de uma requisição ao AI Gateway.
 *
 * Sequência, na ordem em que o corpus a exige:
 *   1. `requestId` — Anexo I, princípio 5.
 *   2. Rota e método — negar por padrão (Playbook E8).
 *   3. Autenticação — Supabase Auth (PD §7.1; decisão C.1).
 *   4. Autorização — matriz do Anexo I, Parte 2.
 *   5. Validação de entrada e rejeição de borda (INV-5).
 *   6. Idempotência (princípio 3) e cache de `/ai/research` (contrato da rota).
 *   7. Chamada ao provedor — único ponto autorizado por INV-3.
 *   8. Registro estruturado de custo — decisão C.2 sobre R-05.
 *   9. Envelope versionado — princípio 4 e Especificação §10.3.
 *
 * Toda dependência de efeito é injetada: nenhum teste toca rede, relógio real ou
 * credencial.
 */

import { asLhError, LhError, toErrorBody } from './errors.ts';
import type { Env } from './env.ts';
import { authenticate, type Principal } from './auth.ts';
import { authorize, resolveRoute, ROUTE_POLICY, type RouteId } from './rbac.ts';
import { ROUTE_BUILDERS } from './routes.ts';
import {
  assessCompleteness,
  callProvider,
  normalizeStopReason,
  ProviderCallError,
  type ProviderResult,
} from './provider/anthropic.ts';
import { buildEnvelope, type AiResponseEnvelope } from './envelope.ts';
import { attemptEntry, costEntry, unknownCostEntry, type Logger } from './observability.ts';
import {
  createIdempotencyStore,
  idempotencyKey,
  type IdempotencyStore,
} from './idempotency.ts';

export interface GatewayDeps {
  readonly env: Env;
  readonly fetch: typeof fetch;
  readonly now: () => Date;
  readonly log: Logger;
  readonly newRequestId: () => string;
  /** Deduplicação por `Idempotency-Key`. Em memória, por instância (ver idempotency.ts). */
  readonly idempotency: IdempotencyStore<AiResponseEnvelope>;
  /** Cache obrigatório de `/ai/research`, por consulta normalizada (Anexo I, Parte 1). */
  readonly researchCache: IdempotencyStore<AiResponseEnvelope>;
  /** Prazo do provedor em ms. Ausente = `PROVIDER_TIMEOUT_MS`. Existe para testes. */
  readonly providerTimeoutMs?: number;
}

export function createDeps(
  base: Omit<GatewayDeps, 'idempotency' | 'researchCache'>,
): GatewayDeps {
  return {
    ...base,
    idempotency: createIdempotencyStore<AiResponseEnvelope>(base.now),
    researchCache: createIdempotencyStore<AiResponseEnvelope>(base.now),
  };
}

function json(payload: unknown, status: number, requestId: string): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', 'x-request-id': requestId },
  });
}

export async function handleRequest(
  request: Request,
  deps: GatewayDeps,
): Promise<Response> {
  const requestId = deps.newRequestId();
  let routeId: RouteId | null = null;
  let promptId: string | null = null;

  try {
    routeId = resolveRoute(new URL(request.url).pathname) ?? null;
    if (routeId === null) {
      throw new LhError('not_found', `rota inexistente: ${new URL(request.url).pathname}`);
    }

    const policy = ROUTE_POLICY[routeId];
    if (request.method !== policy.method) {
      throw new LhError('method_not_allowed', `método ${request.method} em ${policy.path}`);
    }

    const principal: Principal = await authenticate(
      request.headers,
      deps.env,
      deps.fetch,
    );
    authorize(routeId, principal.role);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new LhError('invalid_request', 'corpo da requisição não é JSON válido');
    }

    const prepared = ROUTE_BUILDERS[routeId](body);
    promptId = prepared.prompt.id;

    const idemKey = idempotencyKey(request.headers, principal.userId);
    if (idemKey !== null) {
      const replayed = deps.idempotency.get(idemKey);
      if (replayed !== undefined) return json(replayed, 200, replayed.requestId);
    }

    if (prepared.cacheKey !== null) {
      const cached = deps.researchCache.get(prepared.cacheKey);
      if (cached !== undefined) return json(cached, 200, cached.requestId);
    }

    const startedAt = deps.now().getTime();
    // Registra a TENTATIVA antes de sair para a rede, qualquer que seja o desfecho.
    deps.log(
      attemptEntry({
        requestId,
        route: routeId,
        promptId: prepared.prompt.id,
        promptVersion: prepared.prompt.version,
        now: deps.now(),
        userId: principal.userId,
      }),
    );
    let result: ProviderResult;
    try {
      result = await callProvider(
        prepared.request,
        deps.env,
        deps.fetch,
        deps.providerTimeoutMs,
      );
    } catch (failure) {
      // Tentativa que já saiu para a rede e não devolveu uso: custo DESCONHECIDO, nunca zero.
      if (failure instanceof ProviderCallError) {
        const failedAt = deps.now();
        deps.log(
          unknownCostEntry({
            requestId,
            route: routeId,
            promptId: prepared.prompt.id,
            promptVersion: prepared.prompt.version,
            reason: failure.reason,
            providerStatus: failure.providerStatus,
            latencyMs: failedAt.getTime() - startedAt,
            now: failedAt,
            userId: principal.userId,
          }),
        );
      }
      throw failure;
    }
    const finishedAt = deps.now();

    // Decisão C.2 (R-05): custo registrado por chamada, no momento da chamada.
    deps.log(
      costEntry({
        requestId,
        route: routeId,
        model: result.model,
        promptId: prepared.prompt.id,
        promptVersion: prepared.prompt.version,
        usage: result.usage,
        stopReason: normalizeStopReason(result.stopReason),
        latencyMs: finishedAt.getTime() - startedAt,
        now: finishedAt,
        userId: principal.userId,
      }),
    );

    // O custo já foi registrado (tokens gerados são cobrados), mas uma resposta incompleta
    // NÃO é apresentada como sucesso, não é memorizada e não dispara nova chamada.
    const incomplete = assessCompleteness(result);
    if (incomplete !== null) {
      throw new LhError(
        'provider_incomplete',
        `resposta incompleta do provedor: ${incomplete.logCause}`,
        incomplete.details,
      );
    }

    const envelope = buildEnvelope({
      requestId,
      model: result.model,
      promptVersion: prepared.prompt.version,
      now: finishedAt,
      env: deps.env,
      content: result.content,
    });

    if (idemKey !== null) deps.idempotency.set(idemKey, envelope);
    if (prepared.cacheKey !== null) deps.researchCache.set(prepared.cacheKey, envelope);

    return json(envelope, 200, requestId);
  } catch (thrown) {
    const error = asLhError(thrown);
    deps.log({
      kind: 'ai.call.error',
      requestId,
      route: routeId,
      promptId,
      code: error.code,
      cause: error.logCause,
      timestamp: deps.now().toISOString(),
    });
    return json(toErrorBody(error, requestId), error.status, requestId);
  }
}

/**
 * Dependências do invólucro de inicialização (ver `createRequestHandler`).
 */
export interface BootstrapDeps {
  /** Resolve a configuração e monta as dependências; pode lançar se faltar variável. */
  readonly resolveDeps: () => GatewayDeps;
  readonly newRequestId: () => string;
  readonly now: () => Date;
  readonly log: Logger;
}

/**
 * Invólucro do ponto de entrada: falha de configuração vira resposta estruturada.
 *
 * Antes, `loadEnv` era chamado fora do `try` de `handleRequest`; uma variável ausente
 * (`ANTHROPIC_API_KEY`, `SUPABASE_URL` ou `SUPABASE_ANON_KEY`, ADR-0006 D6.11) escapava como
 * exceção não tratada e o cliente recebia um 500 genérico da plataforma, sem `requestId` e
 * sem causa observável. Agora:
 *
 * - o cliente recebe o envelope do Anexo Técnico I, princípio 5 — `code: internal_error`,
 *   mensagem genérica, `details` vazio e `requestId` — SEM nomear a variável ausente;
 * - o log recebe `ai.call.error` com a causa técnica (o NOME da variável, nunca valor);
 * - a falha NÃO é memorizada: `resolveDeps` é reavaliado a cada requisição, de modo que a
 *   função se recupera sozinha assim que a configuração for corrigida.
 *
 * Nenhuma chamada ao Supabase Auth nem ao provedor ocorre neste caminho.
 */
export function createRequestHandler(
  boot: BootstrapDeps,
): (request: Request) => Promise<Response> {
  return async (request) => {
    let deps: GatewayDeps;
    try {
      deps = boot.resolveDeps();
    } catch (thrown) {
      const requestId = boot.newRequestId();
      const error = asLhError(thrown);
      boot.log({
        kind: 'ai.call.error',
        requestId,
        route: null,
        promptId: null,
        code: error.code,
        cause: error.logCause,
        timestamp: boot.now().toISOString(),
      });
      return json(toErrorBody(error, requestId), error.status, requestId);
    }
    return handleRequest(request, deps);
  };
}
