/**
 * Configuração do gateway, lida exclusivamente do ambiente do servidor.
 *
 * Playbook §10: "Somente variáveis de ambiente do servidor. […] Chave de provedor de IA
 * existe apenas no `ai-gateway`." Playbook E8: "Segredo nunca no cliente."
 * Nenhum valor default é fornecido para segredo: ausência é falha de configuração, não
 * degradação silenciosa.
 */

import { LhError } from './errors.ts';

export interface Env {
  /** Credencial do provedor. ADR-0004 D4.1 — Anthropic. */
  readonly anthropicApiKey: string;
  /** Projeto Supabase que emite e valida a sessão. Plano Diretor §7.1 — Supabase Auth. */
  readonly supabaseUrl: string;
  /** Chave publicável usada como `apikey` na chamada de verificação. Não é segredo. */
  readonly supabaseAnonKey: string;
  /**
   * Anexo Técnico I, Parte 1, princípio 4: "Toda resposta carrega `catalogVersion` e
   * `engineVersion`." Os artefatos correspondentes ainda não existem — catálogo é B-06 e
   * motor é B-04, ambos fora do B-03. O campo é sempre emitido; o valor vem do ambiente
   * quando declarado e é `null` enquanto não houver catálogo ou motor versionados.
   * Emitir `null` é registro honesto de inexistência; inventar um número seria decidir
   * matéria de metodologia, vedado ao executor.
   */
  readonly catalogVersion: string | null;
  readonly engineVersion: string | null;
}

export type EnvReader = (key: string) => string | undefined;

function required(read: EnvReader, key: string): string {
  const value = read(key);
  if (value === undefined || value.trim() === '') {
    throw new LhError('internal_error', `variável de ambiente ausente: ${key}`);
  }
  return value;
}

function optional(read: EnvReader, key: string): string | null {
  const value = read(key);
  return value === undefined || value.trim() === '' ? null : value;
}

export function loadEnv(read: EnvReader): Env {
  return {
    anthropicApiKey: required(read, 'ANTHROPIC_API_KEY'),
    supabaseUrl: required(read, 'SUPABASE_URL').replace(/\/+$/, ''),
    supabaseAnonKey: required(read, 'SUPABASE_ANON_KEY'),
    catalogVersion: optional(read, 'LH_CATALOG_VERSION'),
    engineVersion: optional(read, 'LH_ENGINE_VERSION'),
  };
}
