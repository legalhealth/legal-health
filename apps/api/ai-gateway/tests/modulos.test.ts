/**
 * Os seis módulos de IA do artefato, servidos por cinco rotas.
 *
 * Critério de aceite do B-03 (Plano Diretor, Parte 8): "6 módulos operam fora do runtime
 * de demonstração". ADR-0005 D5.5 declara o critério íntegro; D5.6 veda absorver
 * `SYSTEM_ANALISE` em `/ai/chat`.
 *
 * Este arquivo prova a cobertura dos seis prompts pelo conjunto de rotas. **Não prova a
 * operação fora do runtime de demonstração**, que exige ambiente provisionado — matéria
 * não decidida pela ADR-0004 §4 e registrada como pendência do gate de aceite.
 */

import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/handler.ts';
import { ROUTE_BUILDERS } from '../src/routes.ts';
import {
  SYSTEM_AI,
  SYSTEM_ANALISE,
  SYSTEM_DOCS,
  SYSTEM_JURIMETRIA,
  SYSTEM_JURIS,
  SYSTEM_PECAS,
} from '../src/prompts/index.ts';
import {
  ANALYZE_BODY,
  CHAT_BODY,
  DRAFT_BODY,
  harness,
  post,
  READ_BODY,
  RESEARCH_BODY,
} from './helpers.ts';

const MAPEAMENTO = [
  { modulo: 'SYSTEM_AI', prompt: SYSTEM_AI, rota: 'chat', body: CHAT_BODY },
  { modulo: 'SYSTEM_PECAS', prompt: SYSTEM_PECAS, rota: 'draft-document', body: DRAFT_BODY },
  { modulo: 'SYSTEM_DOCS', prompt: SYSTEM_DOCS, rota: 'read-document', body: READ_BODY },
  { modulo: 'SYSTEM_JURIS', prompt: SYSTEM_JURIS, rota: 'research', body: RESEARCH_BODY },
  {
    modulo: 'SYSTEM_JURIMETRIA',
    prompt: SYSTEM_JURIMETRIA,
    rota: 'research',
    body: { modo: 'jurimetria', consulta: 'judicialização em cirurgia plástica' },
  },
  { modulo: 'SYSTEM_ANALISE', prompt: SYSTEM_ANALISE, rota: 'analyze-case', body: ANALYZE_BODY },
] as const;

describe('seis módulos → cinco rotas', () => {
  it('cada módulo é servido pela rota mapeada, com o seu próprio prompt', () => {
    for (const item of MAPEAMENTO) {
      const prepared = ROUTE_BUILDERS[item.rota](item.body);
      expect(prepared.prompt.id).toBe(item.prompt.id);
      expect(prepared.request.system).toContain(item.prompt.text.slice(0, 60));
    }
  });

  it('os seis módulos usam exatamente cinco rotas distintas', () => {
    expect(new Set(MAPEAMENTO.map((m) => m.rota)).size).toBe(5);
    expect(MAPEAMENTO).toHaveLength(6);
  });

  it('SYSTEM_ANALISE tem rota própria e não é absorvido por /ai/chat (D5.6)', () => {
    const analise = ROUTE_BUILDERS['analyze-case'](ANALYZE_BODY);
    const chat = ROUTE_BUILDERS['chat'](CHAT_BODY);
    expect(analise.prompt.id).toBe('system-analise');
    expect(chat.prompt.id).toBe('system-ai');
    expect(chat.request.system).not.toContain(SYSTEM_ANALISE.text);
  });

  it('os prompts permanecem no servidor: nenhum texto de prompt sai na resposta', async () => {
    const h = harness({ user: { id: 'u', app_metadata: { lh_role: 'owner' } } });
    for (const item of MAPEAMENTO) {
      const path = item.rota === 'research' ? '/ai/research' : `/ai/${item.rota}`;
      const res = await handleRequest(post(path, item.body), h.deps);
      expect(res.status).toBe(200);
      const bruto = JSON.stringify(await res.json());
      expect(bruto).not.toContain(item.prompt.text.slice(0, 60));
    }
  });

  it('todo prompt declara versão, exigida pela Especificação §10.3', () => {
    for (const item of MAPEAMENTO) {
      expect(item.prompt.version).toMatch(/^\d+$/);
    }
  });
});

describe('/ai/draft-document exige origem em ação do plano ou incidente', () => {
  it('sem origem declarada, reprova', async () => {
    const h = harness();
    const res = await handleRequest(
      post('/ai/draft-document', { referencia: 'X', instrucao: 'algo' }),
      h.deps,
    );
    expect(res.status).toBe(400);
  });
});

describe('/ai/chat trunca a janela (B-26)', () => {
  it('envia no máximo o número declarado de turnos', () => {
    const mensagens = Array.from({ length: 50 }, (_, i) => ({
      role: 'user' as const,
      content: `m${i}`,
    }));
    const prepared = ROUTE_BUILDERS['chat']({ ...CHAT_BODY, mensagens });
    expect(prepared.request.messages.length).toBeLessThanOrEqual(20);
    expect(prepared.request.messages.at(-1)?.content).toBe('m49');
  });
});
