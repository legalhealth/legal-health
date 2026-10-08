/**
 * Custo desconhecido: uma tentativa sem uso devolvido NUNCA é custo zero.
 *
 * Timeout, falha de rede, resposta de erro do provedor e corpo ilegível terminam sem `usage`,
 * mas o provedor pode ter processado e cobrado. O gateway registra `ai.call.cost_unknown`
 * com `reconciliation: pending`. Invariante central: para cada `ai.provider.attempt` existe
 * exatamente um `ai.call.cost` (custo observado) OU um `ai.call.cost_unknown`.
 */

import { describe, expect, it } from 'vitest';
import { createDeps, handleRequest, type GatewayDeps } from '../src/handler.ts';
import type {
  AttemptLogEntry,
  CostLogEntry,
  LogEntry,
  UnknownCostLogEntry,
} from '../src/observability.ts';
import { ANALYZE_BODY, harness, post, TEST_ENV } from './helpers.ts';

const GESTOR = { id: 'u-gestor', app_metadata: { lh_role: 'gestor' } };

const tentativas = (l: LogEntry[]) =>
  l.filter((e): e is AttemptLogEntry => e.kind === 'ai.provider.attempt');
const observados = (l: LogEntry[]) => l.filter((e): e is CostLogEntry => e.kind === 'ai.call.cost');
const desconhecidos = (l: LogEntry[]) =>
  l.filter((e): e is UnknownCostLogEntry => e.kind === 'ai.call.cost_unknown');

/** deps com provedor sob controle e Supabase Auth falso. */
function comProvedor(
  comportamento: (init: RequestInit | undefined) => Promise<Response>,
  providerTimeoutMs = 30,
) {
  const logs: LogEntry[] = [];
  const base = harness({ user: GESTOR });
  const fetchFalso = (async (input: unknown, init?: RequestInit) =>
    String(input).includes('api.anthropic.com')
      ? comportamento(init)
      : base.deps.fetch(input as string, init)) as unknown as typeof fetch;
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
  return { deps, logs };
}

describe('desfechos sem uso devolvido → custo DESCONHECIDO, reconciliação pendente', () => {
  it('timeout', async () => {
    const { deps, logs } = comProvedor(() => new Promise<Response>(() => undefined));
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
    expect(res.status).toBe(502);
    expect(observados(logs)).toHaveLength(0);
    const [d] = desconhecidos(logs);
    expect(desconhecidos(logs)).toHaveLength(1);
    expect(d?.reason).toBe('timeout');
    expect(d?.providerStatus).toBeNull();
    expect(d?.reconciliation).toBe('pending');
    expect(d?.promptId).toBe('system-analise');
  });

  for (const status of [400, 401, 429, 500, 529]) {
    it(`provedor responde ${status}`, async () => {
      const { deps, logs } = comProvedor(async () => new Response('{}', { status }));
      await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
      const [d] = desconhecidos(logs);
      expect(desconhecidos(logs)).toHaveLength(1);
      expect(d?.reason).toBe('provider_status');
      expect(d?.providerStatus).toBe(status);
      expect(observados(logs)).toHaveLength(0);
    });
  }

  it('falha de rede (fetch rejeita sem ser o nosso timeout)', async () => {
    const { deps, logs } = comProvedor(async () => {
      throw new TypeError('connection reset');
    }, 1000);
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
    expect(desconhecidos(logs)[0]?.reason).toBe('network_error');
    expect(desconhecidos(logs)[0]?.providerStatus).toBeNull();
  });

  it('200 com corpo que não é JSON', async () => {
    const { deps, logs } = comProvedor(async () => new Response('não é json'), 1000);
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
    expect(desconhecidos(logs)[0]?.reason).toBe('unreadable_response');
  });

  it('200 sem bloco de conteúdo', async () => {
    const { deps, logs } = comProvedor(async () => new Response('{"usage":{}}'), 1000);
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
    expect(desconhecidos(logs)[0]?.reason).toBe('unreadable_response');
  });

  it('resposta que chega DEPOIS do prazo continua desconhecida: nenhum custo é registrado depois', async () => {
    const { deps, logs } = comProvedor(async () => {
      await new Promise((r) => setTimeout(r, 80));
      return new Response(
        JSON.stringify({
          model: 'claude-sonnet-4-6',
          content: [{ type: 'text', text: 'tardia' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 5, output_tokens: 5 },
        }),
      );
    });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
    await new Promise((r) => setTimeout(r, 150));
    expect(desconhecidos(logs)).toHaveLength(1);
    expect(observados(logs)).toHaveLength(0);
  });
});

describe('o que NÃO é custo desconhecido', () => {
  it('sucesso → custo observado, nenhum desconhecido', async () => {
    const h = harness({ user: GESTOR });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    expect(observados(h.logs)).toHaveLength(1);
    expect(desconhecidos(h.logs)).toHaveLength(0);
  });

  it('resposta incompleta (uso devolvido) → custo OBSERVADO, nenhum desconhecido', async () => {
    const h = harness({
      user: GESTOR,
      providerBody: {
        model: 'claude-sonnet-4-6',
        content: [{ type: 'text', text: 'parcial' }],
        stop_reason: 'max_tokens',
        usage: { input_tokens: 5, output_tokens: 1600 },
      },
    });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    expect(observados(h.logs)).toHaveLength(1);
    expect(observados(h.logs)[0]?.outputTokens).toBe(1600);
    expect(desconhecidos(h.logs)).toHaveLength(0);
  });

  it('requisição negada antes do provedor → nenhum custo, nem desconhecido', async () => {
    const h = harness({ user: { id: 'l', app_metadata: { lh_role: 'leitor' } } });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    expect(tentativas(h.logs)).toHaveLength(0);
    expect(observados(h.logs)).toHaveLength(0);
    expect(desconhecidos(h.logs)).toHaveLength(0);
  });
});

describe('invariante: cada tentativa tem exatamente um registro de custo', () => {
  const CENARIOS: ReadonlyArray<[string, () => Promise<LogEntry[]>]> = [
    [
      'sucesso',
      async () => {
        const h = harness({ user: GESTOR });
        await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
        return h.logs;
      },
    ],
    [
      'provedor 500',
      async () => {
        const h = harness({ user: GESTOR, providerStatus: 500 });
        await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
        return h.logs;
      },
    ],
    [
      'timeout',
      async () => {
        const { deps, logs } = comProvedor(() => new Promise<Response>(() => undefined));
        await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), deps);
        return logs;
      },
    ],
    [
      'incompleta',
      async () => {
        const h = harness({
          user: GESTOR,
          providerBody: {
            model: 'claude-sonnet-4-6',
            content: [{ type: 'text', text: 'x' }],
            stop_reason: 'pause_turn',
            usage: { input_tokens: 1, output_tokens: 1 },
          },
        });
        await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
        return h.logs;
      },
    ],
  ];

  for (const [nome, executar] of CENARIOS) {
    it(nome, async () => {
      const logs = await executar();
      expect(tentativas(logs)).toHaveLength(1);
      expect(observados(logs).length + desconhecidos(logs).length).toBe(1);
    });
  }
});

describe('INV-5: a entrada de custo desconhecido não carrega conteúdo nem credencial', () => {
  it('só identificadores, motivo e status', async () => {
    const { deps, logs } = comProvedor(async () => new Response('{}', { status: 500 }));
    await handleRequest(post('/ai/analyze-case', { texto: 'MARCADOR-SENSIVEL' }), deps);
    const bruto = JSON.stringify(desconhecidos(logs));
    expect(bruto).not.toContain('MARCADOR-SENSIVEL');
    expect(bruto).not.toContain(TEST_ENV.anthropicApiKey);
  });
});
