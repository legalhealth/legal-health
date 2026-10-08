/**
 * Observabilidade: o log de custo identifica o prompt e as buscas web, sem conteúdo.
 *
 * Os seis módulos do critério de aceite do B-03 são servidos por cinco rotas, porque
 * `SYSTEM_JURIS` e `SYSTEM_JURIMETRIA` compartilham `/ai/research` e a mesma `promptVersion`.
 * Só o `promptId` distingue os dois no log, o que sustenta a "evidência individual" exigida
 * pela ADR-0006 D6.17.
 */

import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/handler.ts';
import type { CostLogEntry, ErrorLogEntry, LogEntry } from '../src/observability.ts';
import {
  ANALYZE_BODY,
  CHAT_BODY,
  DRAFT_BODY,
  harness,
  post,
  READ_BODY,
  RESEARCH_BODY,
} from './helpers.ts';

const OWNER = { id: 'u-owner', app_metadata: { lh_role: 'owner' } };

function custo(logs: LogEntry[]): CostLogEntry {
  const entry = logs.find((e): e is CostLogEntry => e.kind === 'ai.call.cost');
  if (entry === undefined) throw new Error('log de custo ausente');
  return entry;
}

function erro(logs: LogEntry[]): ErrorLogEntry {
  const entry = logs.find((e): e is ErrorLogEntry => e.kind === 'ai.call.error');
  if (entry === undefined) throw new Error('log de erro ausente');
  return entry;
}

describe('promptId no log de custo: um por módulo', () => {
  const MODULOS: ReadonlyArray<{ modulo: string; path: string; body: unknown; promptId: string }> =
    [
      { modulo: 'SYSTEM_AI', path: '/ai/chat', body: CHAT_BODY, promptId: 'system-ai' },
      {
        modulo: 'SYSTEM_PECAS',
        path: '/ai/draft-document',
        body: DRAFT_BODY,
        promptId: 'system-pecas',
      },
      {
        modulo: 'SYSTEM_DOCS',
        path: '/ai/read-document',
        body: READ_BODY,
        promptId: 'system-docs',
      },
      {
        modulo: 'SYSTEM_JURIS',
        path: '/ai/research',
        body: { modo: 'jurisprudencia', consulta: 'erro médico' },
        promptId: 'system-juris',
      },
      {
        modulo: 'SYSTEM_JURIMETRIA',
        path: '/ai/research',
        body: { modo: 'jurimetria', consulta: 'erro médico' },
        promptId: 'system-jurimetria',
      },
      {
        modulo: 'SYSTEM_ANALISE',
        path: '/ai/analyze-case',
        body: ANALYZE_BODY,
        promptId: 'system-analise',
      },
    ];

  for (const m of MODULOS) {
    it(`${m.modulo} → ${m.path} registra promptId=${m.promptId}`, async () => {
      const h = harness({ user: OWNER });
      const res = await handleRequest(post(m.path, m.body), h.deps);
      expect(res.status).toBe(200);
      expect(custo(h.logs).promptId).toBe(m.promptId);
    });
  }

  it('JURIS e JURIMETRIA têm a MESMA rota e a MESMA promptVersion, e só o promptId os separa', async () => {
    const a = harness({ user: OWNER });
    const b = harness({ user: OWNER });
    await handleRequest(post('/ai/research', { modo: 'jurisprudencia', consulta: 'x' }), a.deps);
    await handleRequest(post('/ai/research', { modo: 'jurimetria', consulta: 'x' }), b.deps);
    const ca = custo(a.logs);
    const cb = custo(b.logs);
    expect(ca.route).toBe(cb.route);
    expect(ca.promptVersion).toBe(cb.promptVersion);
    expect(ca.promptId).not.toBe(cb.promptId);
  });
});

describe('buscas web contabilizadas', () => {
  it('registra web_search_requests devolvido pelo provedor', async () => {
    const h = harness({
      user: OWNER,
      providerBody: {
        model: 'claude-sonnet-4-6',
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 10, output_tokens: 20, server_tool_use: { web_search_requests: 3 } },
      },
    });
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    expect(custo(h.logs).webSearchRequests).toBe(3);
  });

  it('é 0 quando o provedor não informa buscas', async () => {
    const h = harness({ user: OWNER });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    expect(custo(h.logs).webSearchRequests).toBe(0);
  });
});

describe('promptId no log de erro', () => {
  it('é null quando o erro ocorre antes da preparação da chamada (autorização)', async () => {
    const h = harness({ user: { id: 'l', app_metadata: { lh_role: 'leitor' } } });
    await handleRequest(post('/ai/chat', CHAT_BODY), h.deps);
    expect(erro(h.logs).promptId).toBeNull();
  });

  it('é null quando a validação do corpo falha (o prompt ainda não foi escolhido)', async () => {
    const h = harness({ user: OWNER });
    await handleRequest(post('/ai/chat', {}), h.deps);
    expect(erro(h.logs).promptId).toBeNull();
  });

  it('identifica o prompt quando o provedor falha', async () => {
    const h = harness({ user: OWNER, providerStatus: 500 });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    expect(erro(h.logs).promptId).toBe('system-analise');
  });
});

describe('INV-5: o log nunca carrega conteúdo de entrada ou de saída', () => {
  it('nem o promptId nem os demais campos ecoam o texto enviado', async () => {
    const h = harness({ user: OWNER });
    await handleRequest(
      post('/ai/analyze-case', { texto: 'MARCADOR-DE-ENTRADA-SENSIVEL' }),
      h.deps,
    );
    const h2 = harness({ user: OWNER, providerStatus: 500 });
    await handleRequest(
      post('/ai/analyze-case', { texto: 'MARCADOR-DE-ENTRADA-SENSIVEL' }),
      h2.deps,
    );
    const bruto = JSON.stringify([...h.logs, ...h2.logs]);
    expect(bruto).not.toContain('MARCADOR-DE-ENTRADA-SENSIVEL');
    expect(bruto).not.toContain('conteúdo de teste');
  });
});
