/**
 * Autorização — Anexo Técnico I, Parte 2.
 *
 * A capacidade "Usar módulos de IA" admite `owner`, `gestor` e `profissional`, e nega
 * `leitor` e `lh_admin`. O papel mínimo por rota vem da coluna "Papel mín." da Parte 1.
 * Playbook E8: negar por padrão.
 */

import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/handler.ts';
import { ROUTE_POLICY, ROLES, type Role, type RouteId } from '../src/rbac.ts';
import {
  ANALYZE_BODY,
  CHAT_BODY,
  DRAFT_BODY,
  harness,
  post,
  READ_BODY,
  RESEARCH_BODY,
} from './helpers.ts';

const BODIES: Record<RouteId, unknown> = {
  chat: CHAT_BODY,
  'draft-document': DRAFT_BODY,
  'read-document': READ_BODY,
  research: RESEARCH_BODY,
  'analyze-case': ANALYZE_BODY,
};

const ESPERADO: Record<RouteId, readonly Role[]> = {
  chat: ['owner', 'gestor', 'profissional'],
  'draft-document': ['owner', 'gestor'],
  'read-document': ['owner', 'gestor'],
  research: ['owner', 'gestor', 'profissional'],
  'analyze-case': ['owner', 'gestor'],
};

describe('matriz de autorização das rotas /ai/*', () => {
  for (const routeId of Object.keys(ROUTE_POLICY) as RouteId[]) {
    const policy = ROUTE_POLICY[routeId];

    for (const role of ROLES) {
      const permitido = ESPERADO[routeId].includes(role);

      it(`${policy.path} · ${role} → ${permitido ? '200' : '403'}`, async () => {
        const h = harness({ user: { id: 'u', app_metadata: { lh_role: role } } });
        const res = await handleRequest(post(policy.path, BODIES[routeId]), h.deps);
        expect(res.status).toBe(permitido ? 200 : 403);
      });
    }
  }

  it('leitor e lh_admin são negados em todas as rotas de IA', () => {
    for (const routeId of Object.keys(ROUTE_POLICY) as RouteId[]) {
      expect(ROUTE_POLICY[routeId].permitidos).not.toContain('leitor');
      expect(ROUTE_POLICY[routeId].permitidos).not.toContain('lh_admin');
    }
  });

  it('o papel mínimo declarado consta da lista de permitidos', () => {
    for (const routeId of Object.keys(ROUTE_POLICY) as RouteId[]) {
      const policy = ROUTE_POLICY[routeId];
      expect(policy.permitidos).toContain(policy.papelMinimo);
    }
  });

  it('papel desconhecido na claim é negado, não presumido', async () => {
    const h = harness({ user: { id: 'u', app_metadata: { lh_role: 'superadmin' } } });
    const res = await handleRequest(post('/ai/chat', CHAT_BODY), h.deps);
    expect(res.status).toBe(403);
  });

  it('claim ausente é negada', async () => {
    const h = harness({ user: { id: 'u', app_metadata: {} } });
    const res = await handleRequest(post('/ai/chat', CHAT_BODY), h.deps);
    expect(res.status).toBe(403);
  });
});

describe('autenticação', () => {
  it('sem cabeçalho Authorization → 401', async () => {
    const h = harness();
    const req = new Request('https://gateway.test/ai/chat', {
      method: 'POST',
      body: JSON.stringify(CHAT_BODY),
    });
    const res = await handleRequest(req, h.deps);
    expect(res.status).toBe(401);
  });

  it('token recusado pelo Supabase Auth → 401', async () => {
    const h = harness({ user: null });
    const res = await handleRequest(post('/ai/chat', CHAT_BODY), h.deps);
    expect(res.status).toBe(401);
  });

  it('a verificação usa GET /auth/v1/user com Bearer e apikey (decisão C.1)', async () => {
    const h = harness();
    await handleRequest(post('/ai/chat', CHAT_BODY), h.deps);
    const authCall = h.calls.find((c) => c.url.includes('/auth/v1/user'));
    expect(authCall).toBeDefined();
    const headers = authCall?.init?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer token-de-teste');
    expect(headers['apikey']).toBe('anon-de-teste');
  });

  it('nenhuma chamada ao provedor ocorre antes da autorização', async () => {
    const h = harness({ user: { id: 'u', app_metadata: { lh_role: 'leitor' } } });
    await handleRequest(post('/ai/chat', CHAT_BODY), h.deps);
    expect(h.calls.some((c) => c.url.includes('api.anthropic.com'))).toBe(false);
  });
});
