/**
 * Entrypoint da Supabase Edge Function (ADR-0004 D4.4).
 *
 * Deliberadamente fino: toda a lógica vive em módulos puros, com `fetch`, relógio, log e
 * geração de identificador injetados — é o que permite exercer cada caminho em teste sem
 * rede e sem credencial. Este arquivo é a única superfície acoplada ao runtime.
 *
 * ADR-0004 §4 não decide "região, nome de projeto, organização ou ambiente Supabase" nem
 * "configuração de produção, domínio, endpoint externo ou mecanismo de implantação".
 * Nenhum desses itens é fixado aqui: o arquivo lê o ambiente que lhe for fornecido.
 */

import { loadEnv } from './env.ts';
import { createDeps, handleRequest, type GatewayDeps } from './handler.ts';
import { consoleLogger } from './observability.ts';

let deps: GatewayDeps | null = null;

function resolveDeps(): GatewayDeps {
  if (deps === null) {
    deps = createDeps({
      env: loadEnv((key) => Deno.env.get(key)),
      fetch: globalThis.fetch.bind(globalThis),
      now: () => new Date(),
      log: consoleLogger,
      newRequestId: () => globalThis.crypto.randomUUID(),
    });
  }
  return deps;
}

Deno.serve((request: Request) => handleRequest(request, resolveDeps()));
