/**
 * Timeout na chamada ao provedor, sem retentativa automática.
 *
 * O gateway responde no prazo (envelope `provider_error` com `providerTimeout`) mesmo que o
 * `fetch` ignore o sinal de cancelamento, que o corpo fique pendente, ou que a resposta
 * chegue tarde. Uma resposta tardia é descartada: não gera custo registrado nem entra no
 * cache de idempotência. Os prazos usados aqui são de milissegundos; o de produção é
 * `PROVIDER_TIMEOUT_MS`.
 */

import { describe, expect, it } from 'vitest';
import { createDeps, handleRequest, type GatewayDeps } from '../src/handler.ts';
import { PROVIDER_TIMEOUT_MS } from '../src/provider/anthropic.ts';
import type { LogEntry } from '../src/observability.ts';
import { ANALYZE_BODY, harness, post, TEST_ENV } from './helpers.ts';

const GESTOR = { id: 'u-gestor', app_metadata: { lh_role: 'gestor' } };
const RESPOSTA_OK = {
  model: 'claude-sonnet-4-6',
  content: [{ type: 'text', text: 'resposta tardia' }],
  usage: { input_tokens: 5, output_tokens: 5 },
};
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ComportamentoDoProvedor = (init: RequestInit | undefined) => Promise<Response>;

/** Monta deps com Supabase Auth falso e um comportamento controlado para o provedor. */
function comProvedor(comportamento: ComportamentoDoProvedor, providerTimeoutMs = 30) {
  const logs: LogEntry[] = [];
  const chamadasAoProvedor: Array<RequestInit | undefined> = [];
  const base = harness({ user: GESTOR });
  const fetchFalso = (async (input: unknown, init?: RequestInit) => {
    if (String(input).includes('api.anthropic.com')) {
      chamadasAoProvedor.push(init);
      return comportamento(init);
    }
    return base.deps.fetch(input as string, init);
  }) as unknown as typeof fetch;
  let n = 0;
  const deps: GatewayDeps = {
    ...createDeps({
      env: TEST_ENV,
      fetch: fetchFalso,
      now: () => new Date('2026-10-08T12:00:00.000Z'),
      log: (e) => logs.push(e),
      newRequestId: () => `req-${++n}`,
    }),
    providerTimeoutMs,
  };
  return { deps, logs, chamadasAoProvedor };
}

const ouveCancelamento: ComportamentoDoProvedor = (init) =>
  new Promise((_, reject) => {
    init?.signal?.addEventListener('abort', () =>
      reject(new DOMException('cancelado', 'AbortError')),
    );
  });

describe('o prazo é cumprido', () => {
  it('fetch que honra o cancelamento → 502 provider_error com providerTimeout', async () => {
    const { deps, logs, chamadasAoProvedor } = comProvedor(ouveCancelamento);
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
    const corpo = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(502);
    expect(corpo['code']).toBe('provider_error');
    expect(corpo['details']).toEqual({ providerTimeout: true, timeoutMs: 30 });
    expect(typeof corpo['requestId']).toBe('string');
    expect(chamadasAoProvedor).toHaveLength(1); // sem retentativa
    expect(logs.filter((e) => e.kind === 'ai.provider.attempt')).toHaveLength(1);
    expect(logs.filter((e) => e.kind === 'ai.call.cost')).toHaveLength(0);
    const erro = logs.find((e) => e.kind === 'ai.call.error');
    expect(erro?.kind === 'ai.call.error' && erro.cause).toContain('tempo limite');
    expect(erro?.kind === 'ai.call.error' && erro.promptId).toBe('system-analise');
  });

  it('fetch que IGNORA o cancelamento e nunca responde → ainda assim 502 no prazo', async () => {
    const { deps, chamadasAoProvedor } = comProvedor(() => new Promise<Response>(() => undefined));
    const inicio = Date.now();
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
    expect(res.status).toBe(502);
    expect(Date.now() - inicio).toBeLessThan(1000);
    expect(chamadasAoProvedor).toHaveLength(1);
  });

  it('cabeçalhos chegam e o corpo fica pendente → 502 no prazo', async () => {
    const { deps } = comProvedor(
      async () =>
        ({
          ok: true,
          status: 200,
          json: () => new Promise(() => undefined),
        }) as unknown as Response,
    );
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
    expect(res.status).toBe(502);
  });

  it('o sinal de cancelamento é entregue ao fetch', async () => {
    const { deps, chamadasAoProvedor } = comProvedor(
      async () => new Response(JSON.stringify(RESPOSTA_OK)),
      1000,
    );
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
    expect(chamadasAoProvedor[0]?.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('resposta que chega depois do prazo é descartada', () => {
  it('sem custo registrado e sem entrar na idempotência: o reenvio faz nova chamada', async () => {
    let chamada = 0;
    const { deps, logs, chamadasAoProvedor } = comProvedor(async () => {
      chamada += 1;
      if (chamada === 1) {
        await dormir(80); // chega depois do prazo de 30 ms
      }
      return new Response(JSON.stringify(RESPOSTA_OK));
    });
    const headers = { 'idempotency-key': 'tardia' };

    const r1 = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, headers), deps);
    expect(r1.status).toBe(502);
    await dormir(120); // deixa a resposta tardia chegar

    expect(logs.filter((e) => e.kind === 'ai.call.cost')).toHaveLength(0);

    const r2 = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, headers), deps);
    expect(r2.status).toBe(200); // não foi servida de memória: fez nova chamada
    expect(chamadasAoProvedor).toHaveLength(2);
  });
});

describe('resposta dentro do prazo', () => {
  it('não é afetada pelo temporizador', async () => {
    const { deps, logs } = comProvedor(async () => new Response(JSON.stringify(RESPOSTA_OK)), 1000);
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
    expect(res.status).toBe(200);
    expect(logs.filter((e) => e.kind === 'ai.call.cost')).toHaveLength(1);
  });
});

describe('prazo de produção', () => {
  it('é menor que os 150 s da plataforma (plano gratuito do Supabase)', () => {
    expect(PROVIDER_TIMEOUT_MS).toBe(120_000);
    expect(PROVIDER_TIMEOUT_MS).toBeLessThan(150_000);
  });
});
