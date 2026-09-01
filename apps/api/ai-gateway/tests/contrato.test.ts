/**
 * Contratos de resposta, erro, versionamento e idempotência.
 *
 * Anexo Técnico I, Parte 1: princípio 3 (Idempotency-Key), princípio 4 (catalogVersion e
 * engineVersion), princípio 5 (erro estruturado). Especificação §10.3 (generatedBy,
 * model, promptVersion, timestamp).
 */

import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/handler.ts';
import { GENERATED_BY } from '../src/envelope.ts';
import { ROUTE_POLICY, type RouteId } from '../src/rbac.ts';
import {
  ANALYZE_BODY,
  CHAT_BODY,
  DRAFT_BODY,
  harness,
  post,
  READ_BODY,
  RESEARCH_BODY,
  TEST_ENV,
} from './helpers.ts';

const BODIES: Record<RouteId, unknown> = {
  chat: CHAT_BODY,
  'draft-document': DRAFT_BODY,
  'read-document': READ_BODY,
  research: RESEARCH_BODY,
  'analyze-case': ANALYZE_BODY,
};

describe('envelope de resposta', () => {
  for (const routeId of Object.keys(ROUTE_POLICY) as RouteId[]) {
    it(`${ROUTE_POLICY[routeId].path} carrega todos os campos exigidos`, async () => {
      const h = harness({ user: { id: 'u', app_metadata: { lh_role: 'owner' } } });
      const res = await handleRequest(
        post(ROUTE_POLICY[routeId].path, BODIES[routeId]),
        h.deps,
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;

      // Especificação §10.3
      expect(body['generatedBy']).toBe(GENERATED_BY);
      expect(body['model']).toBe('claude-sonnet-4-6');
      expect(typeof body['promptVersion']).toBe('string');
      expect(typeof body['timestamp']).toBe('string');
      // Anexo I, princípio 4 — presentes ainda que sem catálogo (B-06) e motor (B-04)
      expect(body).toHaveProperty('catalogVersion');
      expect(body).toHaveProperty('engineVersion');
      // Anexo I, princípio 5
      expect(typeof body['requestId']).toBe('string');
    });
  }

  it('catalogVersion e engineVersion refletem o ambiente quando declarados', async () => {
    const h = harness({
      env: { ...TEST_ENV, catalogVersion: '1.0.0', engineVersion: '2.1.0' },
    });
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['catalogVersion']).toBe('1.0.0');
    expect(body['engineVersion']).toBe('2.1.0');
  });
});

describe('erro estruturado', () => {
  it('rota inexistente → 404 com code, message, details e requestId', async () => {
    const h = harness();
    const res = await handleRequest(post('/ai/inexistente', {}), h.deps);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['code']).toBe('not_found');
    expect(typeof body['message']).toBe('string');
    expect(body).toHaveProperty('details');
    expect(typeof body['requestId']).toBe('string');
  });

  it('método incorreto → 405', async () => {
    const h = harness();
    const req = new Request('https://gateway.test/ai/chat', {
      method: 'GET',
      headers: { authorization: 'Bearer t' },
    });
    expect((await handleRequest(req, h.deps)).status).toBe(405);
  });

  it('corpo inválido → 400', async () => {
    const h = harness();
    const res = await handleRequest(post('/ai/analyze-case', { texto: '' }), h.deps);
    expect(res.status).toBe(400);
  });

  it('falha do provedor não vaza a causa para o cliente', async () => {
    const h = harness({
      providerStatus: 500,
      providerBody: { error: 'segredo-interno-do-provedor' },
    });
    const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    expect(res.status).toBe(502);
    const raw = JSON.stringify(await res.json());
    expect(raw).not.toContain('segredo-interno-do-provedor');
    expect(raw).toContain('provider_error');
  });

  it('todo erro produz entrada de log com a causa técnica', async () => {
    const h = harness({ providerStatus: 500 });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    const erro = h.logs.find((e) => e.kind === 'ai.call.error');
    expect(erro).toBeDefined();
    expect(erro?.kind === 'ai.call.error' && erro.cause).toContain('500');
  });
});

describe('idempotência (Anexo I, princípio 3)', () => {
  it('mesma chave reaproveita a resposta e não chama o provedor de novo', async () => {
    const h = harness();
    const headers = { 'idempotency-key': 'abc-123' };

    const first = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, headers), h.deps);
    const second = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, headers), h.deps);

    expect(await first.json()).toEqual(await second.json());
    const chamadas = h.calls.filter((c) => c.url.includes('api.anthropic.com'));
    expect(chamadas).toHaveLength(1);
  });

  it('chaves diferentes não se confundem', async () => {
    const h = harness();
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, { 'idempotency-key': 'a' }), h.deps);
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, { 'idempotency-key': 'b' }), h.deps);
    expect(h.calls.filter((c) => c.url.includes('api.anthropic.com'))).toHaveLength(2);
  });

  it('a chave é escopada ao usuário — não vaza entre contas', async () => {
    const a = harness({ user: { id: 'user-A', app_metadata: { lh_role: 'gestor' } } });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, { 'idempotency-key': 'k' }), a.deps);
    expect(a.calls.filter((c) => c.url.includes('api.anthropic.com'))).toHaveLength(1);
  });
});

describe('cache obrigatório de /ai/research (contrato do Anexo I)', () => {
  it('consulta normalizada equivalente reaproveita o cache', async () => {
    const h = harness({ user: { id: 'u', app_metadata: { lh_role: 'profissional' } } });
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    await handleRequest(
      post('/ai/research', { modo: 'jurisprudencia', consulta: '  ERRO   Médico Estético ' }),
      h.deps,
    );
    expect(h.calls.filter((c) => c.url.includes('api.anthropic.com'))).toHaveLength(1);
  });

  it('modos diferentes não compartilham cache', async () => {
    const h = harness({ user: { id: 'u', app_metadata: { lh_role: 'profissional' } } });
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    await handleRequest(
      post('/ai/research', { modo: 'jurimetria', consulta: 'erro médico estético' }),
      h.deps,
    );
    expect(h.calls.filter((c) => c.url.includes('api.anthropic.com'))).toHaveLength(2);
  });
});
