/**
 * Segurança, fronteiras e custo.
 *
 * Playbook §10 e E8 — segredo nunca no cliente; credencial só no `ai-gateway`.
 * Playbook §15.3 — prompts permanecem no servidor.
 * INV-3 — nenhuma chamada a provedor de IA fora de `ai-gateway`.
 * INV-5 — nenhuma tabela, log ou prompt recebe dado de paciente identificável.
 * Anexo I, Parte 1 — regra de fronteira `/ai/*` e rejeição de borda de `/ai/read-document`.
 * Decisão C.2 (R-05) — custo registrado por chamada.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/handler.ts';
import { MODEL } from '../src/provider/anthropic.ts';
import { ROUTE_POLICY, type RouteId } from '../src/rbac.ts';
import { ANALYZE_BODY, harness, post, READ_BODY, RESEARCH_BODY, TEST_ENV } from './helpers.ts';

describe('credencial do provedor', () => {
  it('viaja apenas no header x-api-key, nunca em URL ou corpo', async () => {
    const h = harness();
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    const call = h.calls.find((c) => c.url.includes('api.anthropic.com'));
    expect(call).toBeDefined();

    const headers = call?.init?.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe(TEST_ENV.anthropicApiKey);
    expect(headers['anthropic-version']).toBeTruthy();
    expect(call?.url).not.toContain(TEST_ENV.anthropicApiKey);
    expect(String(call?.init?.body ?? '')).not.toContain(TEST_ENV.anthropicApiKey);
  });

  it('nunca aparece na resposta ao cliente', async () => {
    const h = harness();
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    expect(JSON.stringify(await res.json())).not.toContain(TEST_ENV.anthropicApiKey);
  });

  it('nunca aparece em log', async () => {
    const h = harness({ providerStatus: 401 });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    expect(JSON.stringify(h.logs)).not.toContain(TEST_ENV.anthropicApiKey);
  });

  it('modelo é o decidido na ADR-0004 D4.2', () => {
    expect(MODEL).toBe('claude-sonnet-4-6');
  });
});

describe('INV-5 — nenhum conteúdo do usuário em log', () => {
  it('o log de custo não carrega entrada nem saída', async () => {
    const h = harness();
    await handleRequest(
      post('/ai/analyze-case', { texto: 'PACIENTE JOÃO DA SILVA, CPF 000' }),
      h.deps,
    );
    const bruto = JSON.stringify(h.logs);
    expect(bruto).not.toContain('JOÃO DA SILVA');
    expect(bruto).not.toContain('conteúdo de teste');
  });

  it('o log de erro não carrega o corpo da requisição', async () => {
    const h = harness({ providerStatus: 500 });
    await handleRequest(post('/ai/analyze-case', { texto: 'SEGREDO-DO-USUARIO' }), h.deps);
    expect(JSON.stringify(h.logs)).not.toContain('SEGREDO-DO-USUARIO');
  });

  it('detalhes de erro de validação não ecoam o valor recebido', async () => {
    const h = harness();
    const res = await handleRequest(
      post('/ai/read-document', { contemDadoDePaciente: false, documento: '' }),
      h.deps,
    );
    expect(res.status).toBe(400);
    expect(JSON.stringify(await res.json())).not.toContain('documento":"');
  });
});

describe('rejeição de borda de /ai/read-document', () => {
  it('documento sinalizado como de paciente é recusado antes do provedor', async () => {
    const h = harness();
    const res = await handleRequest(
      post('/ai/read-document', { ...READ_BODY, contemDadoDePaciente: true }),
      h.deps,
    );
    expect(res.status).toBe(422);
    expect(((await res.json()) as Record<string, unknown>)['code']).toBe(
      'patient_data_rejected',
    );
    expect(h.calls.some((c) => c.url.includes('api.anthropic.com'))).toBe(false);
  });

  it('a sinalização é obrigatória — ausência reprova', async () => {
    const h = harness();
    const res = await handleRequest(
      post('/ai/read-document', { documento: 'texto' }),
      h.deps,
    );
    expect(res.status).toBe(400);
  });
});

describe('superfície e fronteira', () => {
  it('expõe exatamente as cinco rotas do conjunto operativo', () => {
    const caminhos = (Object.keys(ROUTE_POLICY) as RouteId[])
      .map((id) => ROUTE_POLICY[id].path)
      .sort();
    expect(caminhos).toEqual([
      '/ai/analyze-case',
      '/ai/chat',
      '/ai/draft-document',
      '/ai/read-document',
      '/ai/research',
    ]);
  });

  it('não expõe as rotas excluídas pela ADR-0005 D5.4 nem superfícies de outras sprints', async () => {
    const h = harness();
    for (const path of [
      '/ai/explain-item',
      '/ai/draft-action',
      '/catalog/current',
      '/assessments/1/submit',
      '/action-items/1',
      '/evidence/1/accept',
      '/organizations/1/timeline',
      '/admin/catalogs',
    ]) {
      expect((await handleRequest(post(path, {}), h.deps)).status).toBe(404);
    }
  });

  it('o gateway não importa cliente de banco algum (D5.7)', () => {
    const proibidos = ['@supabase/', 'postgres', 'drizzle', 'prisma', 'knex'];
    for (const arquivo of ['src/handler.ts', 'src/routes.ts', 'src/auth.ts']) {
      const caminho = fileURLToPath(new URL(`../${arquivo}`, import.meta.url));
      const fonte = readFileSync(caminho, 'utf8');
      const imports = fonte.match(/^import .*$/gm) ?? [];
      for (const linha of imports) {
        for (const proibido of proibidos) {
          expect(linha).not.toContain(proibido);
        }
      }
    }
  });
});

describe('custo por chamada (decisão C.2 sobre R-05)', () => {
  it('toda chamada bem-sucedida registra custo estruturado', async () => {
    const h = harness();
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    const custo = h.logs.find((e) => e.kind === 'ai.call.cost');
    expect(custo).toBeDefined();
    if (custo?.kind !== 'ai.call.cost') throw new Error('entrada de custo ausente');
    expect(custo.route).toBe('analyze-case');
    expect(custo.model).toBe('claude-sonnet-4-6');
    expect(custo.inputTokens).toBe(11);
    expect(custo.outputTokens).toBe(22);
    expect(custo.promptVersion).toBe('1');
    expect(typeof custo.timestamp).toBe('string');
  });

  it('resposta servida de cache não duplica o registro de custo', async () => {
    const h = harness({ user: { id: 'u', app_metadata: { lh_role: 'profissional' } } });
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    expect(h.logs.filter((e) => e.kind === 'ai.call.cost')).toHaveLength(1);
  });
});

describe('busca web (ADR-0004 D4.3)', () => {
  it('/ai/research declara a ferramenta integrada do provedor', async () => {
    const h = harness({ user: { id: 'u', app_metadata: { lh_role: 'profissional' } } });
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    const call = h.calls.find((c) => c.url.includes('api.anthropic.com'));
    const body = JSON.parse(String(call?.init?.body ?? '{}')) as Record<string, unknown>;
    expect(JSON.stringify(body['tools'])).toContain('web_search');
  });

  it('as demais rotas não ativam busca web', async () => {
    const h = harness();
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    const call = h.calls.find((c) => c.url.includes('api.anthropic.com'));
    const body = JSON.parse(String(call?.init?.body ?? '{}')) as Record<string, unknown>;
    expect(body['tools']).toBeUndefined();
  });
});
