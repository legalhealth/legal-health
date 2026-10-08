/**
 * Log de tentativa ao provedor: contável e coerente com a rede.
 *
 * O invariante central: o número de eventos `ai.provider.attempt` é IGUAL ao número de
 * chamadas de rede ao provedor, em todos os cenários. É isso que permite, na operação,
 * comprovar que uma requisição negada não chegou ao provedor sem depender da ausência de um
 * log de custo (que também falta quando o provedor falha).
 */

import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/handler.ts';
import { ROLES, ROUTE_POLICY, type RouteId } from '../src/rbac.ts';
import type { AttemptLogEntry, LogEntry } from '../src/observability.ts';
import {
  ANALYZE_BODY,
  CHAT_BODY,
  DRAFT_BODY,
  harness,
  post,
  READ_BODY,
  RESEARCH_BODY,
  TEST_ENV,
  type Harness,
} from './helpers.ts';

const VALID: Record<RouteId, unknown> = {
  chat: CHAT_BODY,
  'draft-document': DRAFT_BODY,
  'read-document': READ_BODY,
  research: RESEARCH_BODY,
  'analyze-case': ANALYZE_BODY,
};

function tentativas(logs: LogEntry[]): AttemptLogEntry[] {
  return logs.filter((e): e is AttemptLogEntry => e.kind === 'ai.provider.attempt');
}
function chamadasDeRede(h: Harness): number {
  return h.calls.filter((c) => c.url.includes('api.anthropic.com')).length;
}

describe('invariante: tentativas registradas == chamadas de rede ao provedor', () => {
  for (const routeId of Object.keys(ROUTE_POLICY) as RouteId[]) {
    for (const role of ROLES) {
      it(`${ROUTE_POLICY[routeId].path} · ${role}`, async () => {
        const h = harness({ user: { id: `u-${role}`, app_metadata: { lh_role: role } } });
        await handleRequest(post(ROUTE_POLICY[routeId].path, VALID[routeId]), h.deps);
        expect(tentativas(h.logs).length).toBe(chamadasDeRede(h));
      });
    }
  }

  it('falha do provedor: 1 tentativa, 1 chamada, 0 custo', async () => {
    const h = harness({
      user: { id: 'u', app_metadata: { lh_role: 'gestor' } },
      providerStatus: 500,
    });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    expect(tentativas(h.logs)).toHaveLength(1);
    expect(chamadasDeRede(h)).toBe(1);
    expect(h.logs.filter((e) => e.kind === 'ai.call.cost')).toHaveLength(0);
  });
});

describe('o que NÃO gera tentativa', () => {
  it('requisição negada (papel, token, corpo, paciente, rota) → 0 tentativas', async () => {
    const casos: Array<[string, () => Promise<Harness>]> = [
      [
        'papel',
        async () => {
          const h = harness({ user: { id: 'l', app_metadata: { lh_role: 'leitor' } } });
          await handleRequest(post('/ai/chat', CHAT_BODY), h.deps);
          return h;
        },
      ],
      [
        'token',
        async () => {
          const h = harness({ user: null });
          await handleRequest(post('/ai/chat', CHAT_BODY), h.deps);
          return h;
        },
      ],
      [
        'corpo',
        async () => {
          const h = harness({ user: { id: 'o', app_metadata: { lh_role: 'owner' } } });
          await handleRequest(post('/ai/chat', {}), h.deps);
          return h;
        },
      ],
      [
        'paciente',
        async () => {
          const h = harness({ user: { id: 'o', app_metadata: { lh_role: 'owner' } } });
          await handleRequest(
            post('/ai/read-document', { ...READ_BODY, contemDadoDePaciente: true }),
            h.deps,
          );
          return h;
        },
      ],
      [
        'rota',
        async () => {
          const h = harness();
          await handleRequest(post('/ai/explain-item', {}), h.deps);
          return h;
        },
      ],
    ];
    for (const [nome, run] of casos) {
      const h = await run();
      expect(tentativas(h.logs), nome).toHaveLength(0);
      expect(chamadasDeRede(h), nome).toBe(0);
    }
  });

  it('reenvio com a mesma Idempotency-Key (mesma instância) → 1 tentativa no total', async () => {
    const h = harness({ user: { id: 'u', app_metadata: { lh_role: 'gestor' } } });
    const headers = { 'idempotency-key': 'k1' };
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, headers), h.deps);
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, headers), h.deps);
    expect(tentativas(h.logs)).toHaveLength(1);
    expect(chamadasDeRede(h)).toBe(1);
  });

  it('segunda consulta equivalente em /ai/research (mesma instância) → 1 tentativa no total', async () => {
    const h = harness({ user: { id: 'u', app_metadata: { lh_role: 'profissional' } } });
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    expect(tentativas(h.logs)).toHaveLength(1);
  });
});

describe('conteúdo do evento', () => {
  it('traz rota, prompt e identificadores opacos, e nada de credencial ou de entrada', async () => {
    const h = harness({ user: { id: 'u-opaco', app_metadata: { lh_role: 'gestor' } } });
    await handleRequest(
      post('/ai/analyze-case', { texto: 'MARCADOR-DE-ENTRADA-SENSIVEL' }),
      h.deps,
    );
    const [t] = tentativas(h.logs);
    expect(t?.route).toBe('analyze-case');
    expect(t?.promptId).toBe('system-analise');
    expect(t?.userId).toBe('u-opaco');
    const bruto = JSON.stringify(h.logs);
    expect(bruto).not.toContain('MARCADOR-DE-ENTRADA-SENSIVEL');
    expect(bruto).not.toContain(TEST_ENV.anthropicApiKey);
  });

  it('a tentativa precede o custo', async () => {
    const h = harness({ user: { id: 'u', app_metadata: { lh_role: 'gestor' } } });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    const ordem = h.logs.map((e) => e.kind);
    expect(ordem.indexOf('ai.provider.attempt')).toBeLessThan(ordem.indexOf('ai.call.cost'));
  });
});
