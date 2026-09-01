/**
 * Apoio dos testes do gateway.
 *
 * Nenhum teste toca rede, relógio real ou credencial verdadeira. A chave usada aqui é um
 * literal de teste sem valor, e existe apenas para provar que ela nunca escapa do
 * adaptador do provedor.
 */

import { createDeps, type GatewayDeps } from '../src/handler.ts';
import type { Env } from '../src/env.ts';
import type { LogEntry } from '../src/observability.ts';

export const TEST_ENV: Env = {
  anthropicApiKey: 'chave-de-teste-sem-valor',
  supabaseUrl: 'https://projeto.supabase.test',
  supabaseAnonKey: 'anon-de-teste',
  catalogVersion: null,
  engineVersion: null,
};

export interface Recorded {
  readonly url: string;
  readonly init: RequestInit | undefined;
}

export interface Harness {
  readonly deps: GatewayDeps;
  readonly logs: LogEntry[];
  readonly calls: Recorded[];
  advance(ms: number): void;
}

export interface HarnessOptions {
  /** Resposta de `GET /auth/v1/user`. `null` produz 401. */
  readonly user?: { id: string; app_metadata?: Record<string, unknown> } | null;
  /** Resposta do provedor. Quando omitida, devolve um texto fixo. */
  readonly providerStatus?: number;
  readonly providerBody?: unknown;
  readonly env?: Env;
}

const DEFAULT_PROVIDER_BODY = {
  model: 'claude-sonnet-4-6',
  content: [{ type: 'text', text: 'conteúdo de teste' }],
  usage: { input_tokens: 11, output_tokens: 22 },
};

export function harness(options: HarnessOptions = {}): Harness {
  const logs: LogEntry[] = [];
  const calls: Recorded[] = [];
  let clock = Date.parse('2026-09-01T12:00:00.000Z');
  let counter = 0;

  const fakeFetch = (async (input: unknown, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    calls.push({ url, init });

    if (url.includes('/auth/v1/user')) {
      const user = options.user === undefined ? { id: 'user-1' } : options.user;
      if (user === null) {
        return new Response('{"msg":"invalid"}', { status: 401 });
      }
      const payload = {
        id: user.id,
        app_metadata: user.app_metadata ?? { lh_role: 'gestor' },
      };
      return new Response(JSON.stringify(payload), { status: 200 });
    }

    const status = options.providerStatus ?? 200;
    const body = options.providerBody ?? DEFAULT_PROVIDER_BODY;
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;

  const deps = createDeps({
    env: options.env ?? TEST_ENV,
    fetch: fakeFetch,
    now: () => new Date(clock),
    log: (entry) => logs.push(entry),
    newRequestId: () => `req-${++counter}`,
  });

  return {
    deps,
    logs,
    calls,
    advance(ms) {
      clock += ms;
    },
  };
}

export function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://gateway.test${path}`, {
    method: 'POST',
    headers: { authorization: 'Bearer token-de-teste', ...headers },
    body: JSON.stringify(body),
  });
}

export const CHAT_BODY = {
  escopo: 'risco',
  referencia: 'RISK-1',
  mensagens: [{ role: 'user', content: 'Qual o prazo?' }],
};

export const ANALYZE_BODY = { texto: 'Intimação recebida do CRM.' };
export const READ_BODY = { contemDadoDePaciente: false, documento: 'Texto do documento.' };
export const DRAFT_BODY = {
  origem: 'acao_do_plano',
  referencia: 'ACAO-7',
  instrucao: 'Redigir defesa prévia.',
};
export const RESEARCH_BODY = { modo: 'jurisprudencia', consulta: 'erro médico estético' };
