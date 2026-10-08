/**
 * Alcance real da idempotência e do cache: o que NÃO protegem.
 *
 * Estes testes fixam, com o comportamento atual, os limites descritos em `idempotency.ts`.
 * Os casos marcados "LIMITAÇÃO CONHECIDA" documentam um comportamento que o plano de aceite
 * deve contar no orçamento; eles não declaram que o comportamento é desejável. Se a
 * deduplicação de chamadas em andamento vier a ser implementada (B-05), esses casos devem
 * ser revistos.
 */

import { describe, expect, it } from 'vitest';
import { createDeps, handleRequest, type GatewayDeps } from '../src/handler.ts';
import { createIdempotencyStore, DEFAULT_TTL_MS } from '../src/idempotency.ts';
import { ANALYZE_BODY, harness, post, RESEARCH_BODY, TEST_ENV } from './helpers.ts';

const GESTOR = { id: 'u-gestor', app_metadata: { lh_role: 'gestor' } };
const PROFISSIONAL = { id: 'u-prof', app_metadata: { lh_role: 'profissional' } };
const chamadasAoProvedor = (h: { calls: Array<{ url: string }> }) =>
  h.calls.filter((c) => c.url.includes('api.anthropic.com')).length;
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('dentro das condições: a repetição NÃO chama o provedor', () => {
  it('mesma instância, dentro da validade, com Idempotency-Key', async () => {
    const h = harness({ user: GESTOR });
    const k = { 'idempotency-key': 'a' };
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, k), h.deps);
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, k), h.deps);
    expect(chamadasAoProvedor(h)).toBe(1);
  });
});

describe('LIMITAÇÃO CONHECIDA: concorrência', () => {
  it('duas requisições idênticas SIMULTÂNEAS com a mesma chave chamam o provedor duas vezes', async () => {
    const h = harness({ user: GESTOR });
    // atrasa o provedor para que as duas passem pela consulta antes de qualquer registro
    const original = h.deps.fetch;
    const lento = (async (input: unknown, init?: RequestInit) => {
      if (String(input).includes('api.anthropic.com')) await dormir(40);
      return original(input as string, init);
    }) as unknown as typeof fetch;
    const deps: GatewayDeps = { ...h.deps, fetch: lento };
    const k = { 'idempotency-key': 'simultanea' };

    const [r1, r2] = await Promise.all([
      handleRequest(post('/ai/analyze-case', ANALYZE_BODY, k), deps),
      handleRequest(post('/ai/analyze-case', ANALYZE_BODY, k), deps),
    ]);
    expect([r1.status, r2.status]).toEqual([200, 200]);
    expect(chamadasAoProvedor(h)).toBe(2);
  });

  it('o mesmo vale para /ai/research: consultas idênticas simultâneas ignoram o cache', async () => {
    const h = harness({ user: PROFISSIONAL });
    const original = h.deps.fetch;
    const lento = (async (input: unknown, init?: RequestInit) => {
      if (String(input).includes('api.anthropic.com')) await dormir(40);
      return original(input as string, init);
    }) as unknown as typeof fetch;
    const deps: GatewayDeps = { ...h.deps, fetch: lento };
    await Promise.all([
      handleRequest(post('/ai/research', RESEARCH_BODY), deps),
      handleRequest(post('/ai/research', RESEARCH_BODY), deps),
    ]);
    expect(chamadasAoProvedor(h)).toBe(2);
  });
});

describe('LIMITAÇÃO CONHECIDA: expiração', () => {
  it('passada a validade, a repetição chama o provedor de novo (idempotência e cache)', async () => {
    const h = harness({ user: PROFISSIONAL });
    const k = { 'idempotency-key': 'expira' };
    await handleRequest(post('/ai/research', RESEARCH_BODY, k), h.deps);
    h.advance(DEFAULT_TTL_MS + 1);
    await handleRequest(post('/ai/research', RESEARCH_BODY, k), h.deps);
    expect(chamadasAoProvedor(h)).toBe(2);
  });

  it('um instante antes da validade ainda protege', async () => {
    const h = harness({ user: PROFISSIONAL });
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    h.advance(DEFAULT_TTL_MS - 1000);
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    expect(chamadasAoProvedor(h)).toBe(1);
  });
});

describe('LIMITAÇÃO CONHECIDA: reinicialização e múltiplas instâncias', () => {
  it('uma instância nova (reinício, reciclagem ou segunda instância) começa sem memória', async () => {
    const h = harness({ user: GESTOR });
    const k = { 'idempotency-key': 'entre-instancias' };
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, k), h.deps);

    // segunda instância: mesma configuração e mesma rede, repositórios vazios
    const instanciaNova: GatewayDeps = createDeps({
      env: TEST_ENV,
      fetch: h.deps.fetch,
      now: h.deps.now,
      log: h.deps.log,
      newRequestId: h.deps.newRequestId,
    });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY, k), instanciaNova);
    expect(chamadasAoProvedor(h)).toBe(2);
  });

  it('o cache de /ai/research também não atravessa instâncias', async () => {
    const h = harness({ user: PROFISSIONAL });
    await handleRequest(post('/ai/research', RESEARCH_BODY), h.deps);
    const instanciaNova = createDeps({
      env: TEST_ENV,
      fetch: h.deps.fetch,
      now: h.deps.now,
      log: h.deps.log,
      newRequestId: h.deps.newRequestId,
    });
    await handleRequest(post('/ai/research', RESEARCH_BODY), instanciaNova);
    expect(chamadasAoProvedor(h)).toBe(2);
  });
});

describe('LIMITAÇÃO CONHECIDA: capacidade', () => {
  it('ao exceder maxEntries descartam-se as mais antigas; a poda precede a inserção (capacidade efetiva = maxEntries + 1)', () => {
    const relogio = () => new Date('2026-10-08T12:00:00.000Z');
    const loja = createIdempotencyStore<string>(relogio, DEFAULT_TTL_MS, 2);
    loja.set('a', '1');
    loja.set('b', '2');
    loja.set('c', '3'); // a poda ocorre ANTES de inserir: ainda cabem 3
    expect(loja.get('a')).toBe('1');
    loja.set('d', '4'); // agora a poda vê 3 > 2 e descarta a mais antiga
    expect(loja.get('a')).toBeUndefined();
    expect(loja.get('b')).toBe('2');
    expect(loja.get('c')).toBe('3');
    expect(loja.get('d')).toBe('4');
  });
});

describe('sem o cabeçalho, nada é deduplicado fora de /ai/research', () => {
  it('repetir sem Idempotency-Key chama o provedor a cada vez', async () => {
    const h = harness({ user: GESTOR });
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    await handleRequest(post('/ai/analyze-case', ANALYZE_BODY), h.deps);
    expect(chamadasAoProvedor(h)).toBe(2);
  });
});
