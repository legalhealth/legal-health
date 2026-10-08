/**
 * Respostas incompletas do provedor não são apresentadas como resultado íntegro.
 *
 * Contrato oficial do `stop_reason` (consulta de 2026-10-08, "Handling stop reasons"): só
 * `end_turn` indica que o modelo terminou. `max_tokens` e `model_context_window_exceeded`
 * truncam; `pause_turn` interrompe o laço de ferramentas do servidor; `refusal` é recusa.
 * O provedor devolve todos como HTTP 200. O gateway:
 *  - responde 502 `provider_incomplete`, sem o texto parcial;
 *  - NÃO continua a conversa nem faz chamada adicional;
 *  - registra o custo OBSERVADO (os tokens foram gerados);
 *  - não memoriza o resultado (idempotência e cache).
 */

import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/handler.ts';
import type { CostLogEntry, LogEntry } from '../src/observability.ts';
import { ANALYZE_BODY, harness, post, RESEARCH_BODY } from './helpers.ts';

const GESTOR = { id: 'u-gestor', app_metadata: { lh_role: 'gestor' } };
const PROFISSIONAL = { id: 'u-prof', app_metadata: { lh_role: 'profissional' } };
const TEXTO_PARCIAL = 'TEXTO-PARCIAL-NAO-DEVE-SAIR';

function corpo(stopReason: unknown, extra: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = {
    model: 'claude-sonnet-4-6',
    content: [{ type: 'text', text: TEXTO_PARCIAL }],
    usage: { input_tokens: 7, output_tokens: 9 },
    ...extra,
  };
  if (stopReason !== undefined) base['stop_reason'] = stopReason;
  return base;
}
const chamadas = (h: { calls: Array<{ url: string }> }) =>
  h.calls.filter((c) => c.url.includes('api.anthropic.com')).length;
const custos = (logs: LogEntry[]) =>
  logs.filter((e): e is CostLogEntry => e.kind === 'ai.call.cost');

describe('stop_reason diferente de end_turn → 502 provider_incomplete', () => {
  for (const stopReason of [
    'max_tokens',
    'pause_turn',
    'refusal',
    'model_context_window_exceeded',
    'stop_sequence',
    'tool_use',
  ]) {
    it(`${stopReason}: erro explícito, sem texto parcial, sem continuação, custo observado`, async () => {
      const h = harness({ user: GESTOR, providerBody: corpo(stopReason) });
      const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
      const texto = await res.text();
      const json = JSON.parse(texto) as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(json['code']).toBe('provider_incomplete');
      expect(json['details']).toEqual({ stopReason });
      expect(texto).not.toContain(TEXTO_PARCIAL);
      expect(chamadas(h)).toBe(1); // nenhuma continuação automática

      const [custo] = custos(h.logs);
      expect(custos(h.logs)).toHaveLength(1); // custo observado registrado
      expect(custo?.stopReason).toBe(stopReason);
      expect(custo?.inputTokens).toBe(7);
      expect(custo?.outputTokens).toBe(9);
    });
  }

  it('pause_turn em /ai/research não entra no cache: a consulta seguinte chama o provedor', async () => {
    const h = harness({ user: PROFISSIONAL, providerBody: corpo('pause_turn') });
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    expect(chamadas(h)).toBe(2);
  });

  it('incompleta não entra na idempotência: o reenvio com a mesma chave chama de novo', async () => {
    const h = harness({ user: GESTOR, providerBody: corpo('max_tokens') });
    const k = { 'idempotency-key': 'incompleta' };
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, k), h.deps);
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, k), h.deps);
    expect(chamadas(h)).toBe(2);
  });
});

describe('stop_reason ausente ou desconhecido: nega por padrão, sem ecoar o valor', () => {
  it('ausente → details.stopReason = missing', async () => {
    const h = harness({ user: GESTOR, providerBody: corpo(undefined) });
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    const json = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(502);
    expect(json['details']).toEqual({ stopReason: 'missing' });
  });

  it('valor fora da lista → unknown, e o texto do provedor nunca é repassado', async () => {
    const h = harness({ user: GESTOR, providerBody: corpo('<script>alert(1)</script>') });
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    const texto = await res.text();
    expect(texto).toContain('unknown');
    expect(texto).not.toContain('script');
    expect(JSON.stringify(h.logs)).not.toContain('script');
  });
});

describe('erro da ferramenta de busca dentro de uma resposta 200', () => {
  for (const codigo of ['max_uses_exceeded', 'too_many_requests', 'unavailable']) {
    it(`${codigo} com end_turn → 502 provider_incomplete`, async () => {
      const h = harness({
        user: PROFISSIONAL,
        providerBody: corpo('end_turn', {
          content: [
            { type: 'text', text: TEXTO_PARCIAL },
            {
              type: 'web_search_tool_result',
              tool_use_id: 's',
              content: { type: 'web_search_tool_result_error', error_code: codigo },
            },
          ],
          usage: { input_tokens: 7, output_tokens: 9, server_tool_use: { web_search_requests: 1 } },
        }),
      });
      const res = await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
      const texto = await res.text();
      expect(res.status).toBe(502);
      expect(JSON.parse(texto)['details']).toEqual({
        stopReason: 'end_turn',
        searchToolError: codigo,
      });
      expect(texto).not.toContain(TEXTO_PARCIAL);
      expect(custos(h.logs)[0]?.webSearchRequests).toBe(1);
    });
  }

  it('código de erro desconhecido → unknown, sem ecoar', async () => {
    const h = harness({
      user: PROFISSIONAL,
      providerBody: corpo('end_turn', {
        content: [
          { type: 'text', text: TEXTO_PARCIAL },
          {
            type: 'web_search_tool_result',
            tool_use_id: 's',
            content: { type: 'web_search_tool_result_error', error_code: 'codigo-inventado' },
          },
        ],
      }),
    });
    const res = await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    const texto = await res.text();
    expect(texto).toContain('"searchToolError":"unknown"');
    expect(texto).not.toContain('codigo-inventado');
  });
});

describe('controles positivos: o que continua sendo sucesso', () => {
  it('end_turn com texto → 200 e o texto é entregue', async () => {
    const h = harness({ user: GESTOR, providerBody: corpo('end_turn') });
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    const json = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(json['content']).toBe(TEXTO_PARCIAL);
    expect(custos(h.logs)[0]?.stopReason).toBe('end_turn');
  });

  it('busca web BEM-SUCEDIDA (resultado em lista) com end_turn → 200, sem falso positivo', async () => {
    const h = harness({
      user: PROFISSIONAL,
      providerBody: corpo('end_turn', {
        content: [
          { type: 'server_tool_use', id: 's', name: 'web_search', input: { query: 'q' } },
          {
            type: 'web_search_tool_result',
            tool_use_id: 's',
            content: [{ type: 'web_search_result', url: 'https://x.test', title: 't' }],
          },
          { type: 'text', text: 'Pesquisa concluída.' },
        ],
        usage: { input_tokens: 7, output_tokens: 9, server_tool_use: { web_search_requests: 1 } },
      }),
    });
    const res = await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    expect(res.status).toBe(200);
  });

  it('end_turn sem nenhum texto → provider_incomplete (emptyContent), e não um sucesso vazio', async () => {
    const h = harness({ user: GESTOR, providerBody: corpo('end_turn', { content: [] }) });
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    const json = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(502);
    expect(json['details']).toEqual({ stopReason: 'end_turn', emptyContent: true });
  });
});
