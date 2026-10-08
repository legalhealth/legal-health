/**
 * Fronteira do provedor — prova, por contagem de chamadas, de quais requisições alcançam a
 * Anthropic.
 *
 * Estes testes sustentam o plano de testes operacionais: antes de qualquer consumo real de
 * IA, é preciso demonstrar (e não apenas afirmar) que uma requisição negada não chega ao
 * provedor, que não há retentativa automática, e que a deduplicação por `Idempotency-Key`
 * é escopada ao usuário. O proxy de `fetch` registra cada chamada; o provedor é identificado
 * pelo host.
 *
 * Arquivo aditivo: não altera o gateway nem os testes existentes.
 */

import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/handler.ts';
import { ROLES, ROUTE_POLICY, type Role, type RouteId } from '../src/rbac.ts';
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

const ROUTES = Object.keys(ROUTE_POLICY) as RouteId[];

const VALID_BODY: Record<RouteId, unknown> = {
  chat: CHAT_BODY,
  'draft-document': DRAFT_BODY,
  'read-document': READ_BODY,
  research: RESEARCH_BODY,
  'analyze-case': ANALYZE_BODY,
};

/**
 * Expectativa INDEPENDENTE do gateway, transcrita do Anexo Técnico I, Parte 1 (papel mínimo
 * por rota) e Parte 2 (capacidade "Usar módulos de IA": owner ✓ gestor ✓ profissional ✓
 * leitor — lh_admin —). Derivar o esperado de `ROUTE_POLICY` tornaria o teste circular: uma
 * regra enfraquecida mudaria código e expectativa juntos e o teste continuaria verde.
 */
const ESPERADO: Record<RouteId, readonly Role[]> = {
  chat: ['owner', 'gestor', 'profissional'],
  'draft-document': ['owner', 'gestor'],
  'read-document': ['owner', 'gestor'],
  research: ['owner', 'gestor', 'profissional'],
  'analyze-case': ['owner', 'gestor'],
};

function providerCalls(h: Harness): number {
  return h.calls.filter((c) => c.url.includes('api.anthropic.com')).length;
}

function asRole(role: Role) {
  return { id: `user-${role}`, app_metadata: { lh_role: role } };
}

describe('provedor só é alcançado por requisição autenticada, autorizada e válida', () => {
  for (const routeId of ROUTES) {
    const policy = ROUTE_POLICY[routeId];

    for (const role of ROLES) {
      const permitido = ESPERADO[routeId].includes(role);

      it(`${policy.path} · ${role} → ${permitido ? '1' : '0'} chamada(s) ao provedor`, async () => {
        const h = harness({ user: asRole(role) });
        await handleRequest(post(policy.path, VALID_BODY[routeId]), h.deps);
        expect(providerCalls(h)).toBe(permitido ? 1 : 0);
      });
    }

    it(`${policy.path} · sem Authorization → 401 e 0 chamadas ao provedor`, async () => {
      const h = harness();
      const req = new Request(`https://gateway.test${policy.path}`, {
        method: 'POST',
        body: JSON.stringify(VALID_BODY[routeId]),
      });
      const res = await handleRequest(req, h.deps);
      expect(res.status).toBe(401);
      expect(providerCalls(h)).toBe(0);
    });

    it(`${policy.path} · token recusado pelo Supabase Auth → 401 e 0 chamadas ao provedor`, async () => {
      const h = harness({ user: null });
      const res = await handleRequest(post(policy.path, VALID_BODY[routeId]), h.deps);
      expect(res.status).toBe(401);
      expect(providerCalls(h)).toBe(0);
    });

    it(`${policy.path} · papel permitido com corpo inválido → 400 e 0 chamadas ao provedor`, async () => {
      const permitido = ESPERADO[routeId][0] as Role;
      const h = harness({ user: asRole(permitido) });
      const res = await handleRequest(post(policy.path, {}), h.deps);
      expect(res.status).toBe(400);
      expect(providerCalls(h)).toBe(0);
    });
  }

  it('rota inexistente → 404 antes até da autenticação: 0 chamadas ao provedor e ao Supabase Auth', async () => {
    const h = harness();
    const res = await handleRequest(post('/ai/explain-item', {}), h.deps);
    expect(res.status).toBe(404);
    expect(h.calls).toHaveLength(0);
  });

  it('método incorreto → 405 antes da autenticação: 0 chamadas', async () => {
    const h = harness();
    const req = new Request('https://gateway.test/ai/chat', {
      method: 'GET',
      headers: { authorization: 'Bearer t' },
    });
    expect((await handleRequest(req, h.deps)).status).toBe(405);
    expect(h.calls).toHaveLength(0);
  });
});

describe('uma negação deixa rastro de erro e nunca de custo', () => {
  const NEGACOES: ReadonlyArray<{
    nome: string;
    code: string;
    run: () => Promise<{ h: Harness; status: number }>;
  }> = [
    {
      nome: 'papel não admitido',
      code: 'forbidden',
      run: async () => {
        const h = harness({ user: asRole('leitor') });
        const res = await handleRequest(post('/ai/chat', CHAT_BODY), h.deps);
        return { h, status: res.status };
      },
    },
    {
      nome: 'claim ausente',
      code: 'forbidden',
      run: async () => {
        const h = harness({ user: { id: 'sem-role', app_metadata: {} } });
        const res = await handleRequest(post('/ai/chat', CHAT_BODY), h.deps);
        return { h, status: res.status };
      },
    },
    {
      nome: 'token recusado',
      code: 'unauthorized',
      run: async () => {
        const h = harness({ user: null });
        const res = await handleRequest(post('/ai/chat', CHAT_BODY), h.deps);
        return { h, status: res.status };
      },
    },
    {
      nome: 'documento de paciente',
      code: 'patient_data_rejected',
      run: async () => {
        const h = harness({ user: asRole('gestor') });
        const res = await handleRequest(
          post('/ai/read-document', { ...READ_BODY, contemDadoDePaciente: true }),
          h.deps,
        );
        return { h, status: res.status };
      },
    },
  ];

  for (const caso of NEGACOES) {
    it(`${caso.nome} → ${caso.code}: 1 log de erro, 0 logs de custo, 0 chamadas ao provedor`, async () => {
      const { h, status } = await caso.run();
      expect(status).toBeGreaterThanOrEqual(400);
      expect(h.logs.filter((e) => e.kind === 'ai.call.cost')).toHaveLength(0);
      const erros = h.logs.filter((e) => e.kind === 'ai.call.error');
      expect(erros).toHaveLength(1);
      expect(erros[0]?.kind === 'ai.call.error' && erros[0].code).toBe(caso.code);
      expect(providerCalls(h)).toBe(0);
    });
  }
});

describe('uma chamada por requisição: nenhuma retentativa automática', () => {
  for (const providerStatus of [401, 429, 500, 529]) {
    it(`provedor responde ${providerStatus} → 502, exatamente 1 chamada, sem vazar a chave`, async () => {
      const h = harness({
        user: asRole('gestor'),
        providerStatus,
        providerBody: { error: 'ecoa-conteudo-do-usuario' },
      });
      const res = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
      const corpo = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(corpo['code']).toBe('provider_error');
      expect((corpo['details'] as Record<string, unknown>)['providerStatus']).toBe(providerStatus);
      expect(providerCalls(h)).toBe(1);

      const bruto = JSON.stringify(corpo) + JSON.stringify(h.logs);
      expect(bruto).not.toContain(TEST_ENV.anthropicApiKey);
      expect(bruto).not.toContain('ecoa-conteudo-do-usuario');
      // falha do provedor não gera registro de custo (nenhum uso foi devolvido)
      expect(h.logs.filter((e) => e.kind === 'ai.call.cost')).toHaveLength(0);
    });
  }
});

describe('Idempotency-Key é escopada ao usuário', () => {
  it('mesma chave, usuários diferentes → cada um faz a sua chamada; o reenvio do primeiro não faz outra', async () => {
    const a = harness({ user: asRole('gestor') });
    const b = harness({ user: { id: 'outro-usuario', app_metadata: { lh_role: 'gestor' } } });
    // B compartilha os repositórios de idempotência e cache de A, e o gerador de requestId.
    const depsB = { ...a.deps, fetch: b.deps.fetch };
    const headers = { 'idempotency-key': 'chave-compartilhada' };

    const r1 = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, headers), a.deps);
    const r2 = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, headers), depsB);
    const r3 = await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, headers), a.deps);

    const [c1, c2, c3] = (await Promise.all([r1.json(), r2.json(), r3.json()])) as Array<
      Record<string, unknown>
    >;

    expect(providerCalls(a)).toBe(1); // o reenvio de A foi servido pela deduplicação
    expect(providerCalls(b)).toBe(1); // B NÃO herdou a resposta de A
    expect(c2?.['requestId']).not.toBe(c1?.['requestId']);
    expect(c3?.['requestId']).toBe(c1?.['requestId']);
  });

  it('sem o cabeçalho, nenhuma deduplicação ocorre: repetir uma rota fora do cache chama o provedor de novo', async () => {
    const h = harness({ user: asRole('gestor') });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    expect(providerCalls(h)).toBe(2);
  });
});
