/**
 * Falha de configuração: resposta sanitizada, com `requestId`, sem vazar nada.
 *
 * Exercita o invólucro de inicialização (`createRequestHandler`) com o `loadEnv` REAL e um
 * leitor de ambiente controlado, de modo que a ausência de cada variável de ADR-0006 D6.11
 * seja provada, e não suposta.
 */

import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env.ts';
import { createDeps, createRequestHandler, type GatewayDeps } from '../src/handler.ts';
import type { LogEntry } from '../src/observability.ts';
import { ANALYZE_BODY, post } from './helpers.ts';

const AMBIENTE_COMPLETO: Record<string, string> = {
  ANTHROPIC_API_KEY: 'chave-de-teste-sem-valor',
  SUPABASE_URL: 'https://projeto.supabase.test',
  SUPABASE_ANON_KEY: 'anon-de-teste',
};

function montar(ambiente: Record<string, string | undefined>) {
  const logs: LogEntry[] = [];
  const chamadas: string[] = [];
  let contador = 0;
  const fetchFalso = (async (input: unknown) => {
    chamadas.push(String(input));
    return new Response('{}', { status: 200 });
  }) as unknown as typeof fetch;

  const handler = createRequestHandler({
    resolveDeps: (): GatewayDeps =>
      createDeps({
        env: loadEnv((k) => ambiente[k]),
        fetch: fetchFalso,
        now: () => new Date('2026-10-08T12:00:00.000Z'),
        log: (e) => logs.push(e),
        newRequestId: () => `req-${++contador}`,
      }),
    newRequestId: () => `boot-${++contador}`,
    now: () => new Date('2026-10-08T12:00:00.000Z'),
    log: (e) => logs.push(e),
  });
  return { handler, logs, chamadas };
}

describe('variável obrigatória ausente → 500 estruturado', () => {
  for (const nome of Object.keys(AMBIENTE_COMPLETO)) {
    it(`sem ${nome}: envelope, requestId, sem vazar o nome, sem tocar a rede`, async () => {
      const { handler, logs, chamadas } = montar({ ...AMBIENTE_COMPLETO, [nome]: undefined });
      const res = await handler(post('/ai/analyze-case', ANALYZE_BODY));
      const corpo = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(500);
      expect(corpo['code']).toBe('internal_error');
      expect(corpo['message']).toBe('Falha ao processar a solicitação.');
      expect(corpo['details']).toEqual({});
      expect(typeof corpo['requestId']).toBe('string');
      expect(res.headers.get('x-request-id')).toBe(corpo['requestId']);

      // a resposta ao cliente não nomeia a variável nem nenhum valor
      const bruto = JSON.stringify(corpo);
      expect(bruto).not.toContain(nome);
      expect(bruto).not.toContain('chave-de-teste-sem-valor');

      // o log recebe a causa técnica: o NOME da variável, nunca valor
      const erro = logs.find((e) => e.kind === 'ai.call.error');
      expect(erro?.kind === 'ai.call.error' && erro.cause).toContain(nome);
      expect(erro?.kind === 'ai.call.error' && erro.route).toBeNull();
      expect(JSON.stringify(logs)).not.toContain('chave-de-teste-sem-valor');

      // nada saiu para a rede: nem Supabase Auth, nem provedor
      expect(chamadas).toHaveLength(0);
    });
  }

  it('valor em branco conta como ausente', async () => {
    const { handler } = montar({ ...AMBIENTE_COMPLETO, SUPABASE_ANON_KEY: '   ' });
    const res = await handler(post('/ai/analyze-case', ANALYZE_BODY));
    expect(res.status).toBe(500);
  });

  it('o 500 vale para qualquer rota e também para requisição sem autenticação', async () => {
    const { handler } = montar({ ...AMBIENTE_COMPLETO, ANTHROPIC_API_KEY: undefined });
    const req = new Request('https://gateway.test/ai/chat', { method: 'POST', body: '{}' });
    expect((await handler(req)).status).toBe(500);
  });
});

describe('variáveis opcionais e recuperação', () => {
  it('LH_CATALOG_VERSION e LH_ENGINE_VERSION ausentes NÃO são falha (viram null)', async () => {
    const { handler } = montar(AMBIENTE_COMPLETO);
    // chega ao fluxo normal: sem token válido, falha em 401, e não em 500 de configuração
    const res = await handler(
      new Request('https://gateway.test/ai/chat', { method: 'POST', body: '{}' }),
    );
    expect(res.status).toBe(401);
  });

  it('a falha não é memorizada: corrigida a configuração, a função se recupera', async () => {
    const ambiente: Record<string, string | undefined> = {
      ...AMBIENTE_COMPLETO,
      SUPABASE_URL: undefined,
    };
    const { handler } = montar(ambiente);
    const req = () => new Request('https://gateway.test/ai/chat', { method: 'POST', body: '{}' });

    expect((await handler(req())).status).toBe(500);
    ambiente['SUPABASE_URL'] = AMBIENTE_COMPLETO['SUPABASE_URL'];
    expect((await handler(req())).status).toBe(401);
  });
});

describe('exceção inesperada na inicialização', () => {
  it('não vaza a mensagem ao cliente; a causa vai ao log', async () => {
    const logs: LogEntry[] = [];
    const handler = createRequestHandler({
      resolveDeps: () => {
        throw new TypeError('detalhe-interno-que-nao-deve-sair');
      },
      newRequestId: () => 'boot-x',
      now: () => new Date('2026-10-08T12:00:00.000Z'),
      log: (e) => logs.push(e),
    });
    const res = await handler(post('/ai/chat', {}));
    const bruto = await res.text();
    expect(res.status).toBe(500);
    expect(bruto).not.toContain('detalhe-interno-que-nao-deve-sair');
    expect(bruto).toContain('boot-x');
    const erro = logs.find((e) => e.kind === 'ai.call.error');
    expect(erro?.kind === 'ai.call.error' && erro.cause).toContain('detalhe-interno');
  });
});
