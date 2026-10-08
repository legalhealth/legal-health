/**
 * Limite explícito de buscas web (`max_uses`) em `/ai/research`.
 *
 * ADR-0004 D4.3 mantém a busca integrada do provedor; o teto limita QUANTAS buscas o modelo
 * pode fazer por chamada. Não limita o gasto total (ver comentário em `WEB_SEARCH_MAX_USES`).
 */

import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/handler.ts';
import { WEB_SEARCH_MAX_USES } from '../src/provider/anthropic.ts';
import { ANALYZE_BODY, CHAT_BODY, harness, post, READ_BODY, DRAFT_BODY } from './helpers.ts';

const PROFISSIONAL = { id: 'u-prof', app_metadata: { lh_role: 'profissional' } };
const OWNER = { id: 'u-owner', app_metadata: { lh_role: 'owner' } };

function corpoEnviado(h: ReturnType<typeof harness>): Record<string, unknown> {
  const chamada = h.calls.find((c) => c.url.includes('api.anthropic.com'));
  return JSON.parse(String(chamada?.init?.body ?? '{}')) as Record<string, unknown>;
}

describe('max_uses na ferramenta de busca', () => {
  it('o teto declarado é 3 (escolha do executor, a ratificar)', () => {
    expect(WEB_SEARCH_MAX_USES).toBe(3);
  });

  for (const modo of ['jurisprudencia', 'jurimetria'] as const) {
    it(`/ai/research (${modo}) envia web_search com max_uses=${WEB_SEARCH_MAX_USES}`, async () => {
      const h = harness({ user: PROFISSIONAL });
      await handleRequest(post('/ai/research', { modo, consulta: 'erro médico' }), h.deps);
      const tools = corpoEnviado(h)['tools'] as Array<Record<string, unknown>>;
      expect(tools).toHaveLength(1);
      expect(tools[0]?.['name']).toBe('web_search');
      expect(tools[0]?.['max_uses']).toBe(WEB_SEARCH_MAX_USES);
    });
  }

  it('as demais rotas não enviam nenhuma ferramenta', async () => {
    const casos: Array<[string, unknown]> = [
      ['/ai/chat', CHAT_BODY],
      ['/ai/draft-document', DRAFT_BODY],
      ['/ai/read-document', READ_BODY],
      ['/ai/analyze-case', ANALYZE_BODY],
    ];
    for (const [path, body] of casos) {
      const h = harness({ user: OWNER });
      await handleRequest(post(path, body), h.deps);
      expect(corpoEnviado(h)['tools'], path).toBeUndefined();
    }
  });
});

describe('limite excedido: o provedor responde 200 com erro dentro do resultado da busca', () => {
  it('o gateway devolve o texto produzido e contabiliza as buscas feitas', async () => {
    const h = harness({
      user: PROFISSIONAL,
      providerBody: {
        model: 'claude-sonnet-4-6',
        content: [
          { type: 'text', text: 'Primeira parte.' },
          { type: 'server_tool_use', id: 's1', name: 'web_search', input: { query: 'q' } },
          {
            type: 'web_search_tool_result',
            tool_use_id: 's1',
            content: { type: 'web_search_tool_result_error', error_code: 'max_uses_exceeded' },
          },
          { type: 'text', text: 'Segunda parte, com o que foi possível apurar.' },
        ],
        usage: {
          input_tokens: 1000,
          output_tokens: 300,
          server_tool_use: { web_search_requests: WEB_SEARCH_MAX_USES },
        },
      },
    });
    const res = await handleRequest(
      post('/ai/research', { modo: 'jurimetria', consulta: 'erro médico' }),
      h.deps,
    );
    const corpo = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(corpo['content']).toBe('Primeira parte.\nSegunda parte, com o que foi possível apurar.');
    const custo = h.logs.find((e) => e.kind === 'ai.call.cost');
    expect(custo?.kind === 'ai.call.cost' && custo.webSearchRequests).toBe(WEB_SEARCH_MAX_USES);
  });
});
