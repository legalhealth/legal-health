/**
 * Autenticação e derivação de papel.
 *
 * Decisão C.1 do proprietário (2026-09-01): **validação via `auth.getUser()` do Supabase
 * Auth, com o papel lido de claim**. A plataforma já estava fixada pelo Plano Diretor
 * §7.1 ("Supabase Auth"); o regime mínimo, pela ADR-0005 D5.7 — sem banco, sem
 * persistência e sem multi-tenant além do estritamente necessário.
 *
 * `auth.getUser()` é aqui exercido pela sua forma de transporte — `GET /auth/v1/user` do
 * próprio Supabase Auth — e não pelo SDK. O motivo é normativo, não estético: adotar
 * `@supabase/supabase-js` introduziria dependência externa nova, o que o Playbook §15.1
 * classifica como gatilho de ADR obrigatória. Nenhuma dependência é introduzida.
 *
 * Nenhuma consulta a banco ocorre neste caminho, em conformidade com D5.7.
 */

import { LhError } from './errors.ts';
import type { Env } from './env.ts';
import { isRole, type Role } from './rbac.ts';

/**
 * Claim que transporta o papel da organização. Escolha de nomenclatura do executor,
 * registrada para auditoria: reversível, sem consequência arquitetural. O papel é
 * provisionado no `app_metadata` — nunca no `user_metadata`, que é editável pelo próprio
 * usuário e serviria de escalada de privilégio.
 */
export const ROLE_CLAIM = 'lh_role';

export interface Principal {
  readonly userId: string;
  readonly role: Role;
}

interface SupabaseUser {
  readonly id?: unknown;
  readonly app_metadata?: Record<string, unknown> | null;
}

export function extractBearerToken(headers: Headers): string {
  const raw = headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  if (!match || match[1] === undefined || match[1].trim() === '') {
    throw new LhError('unauthorized', 'cabeçalho Authorization ausente ou malformado');
  }
  return match[1].trim();
}

/**
 * Verifica o token junto ao Supabase Auth e deriva o papel do claim.
 * Nega por padrão (Playbook E8): token inválido, resposta inesperada, claim ausente ou
 * papel desconhecido resultam em recusa — nunca em papel presumido.
 */
export async function authenticate(
  headers: Headers,
  env: Env,
  fetchImpl: typeof fetch,
): Promise<Principal> {
  const token = extractBearerToken(headers);

  let response: Response;
  try {
    response = await fetchImpl(`${env.supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.supabaseAnonKey,
      },
    });
  } catch (cause) {
    throw new LhError(
      'unauthorized',
      `falha de rede ao verificar sessão: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }

  if (!response.ok) {
    throw new LhError('unauthorized', `Supabase Auth respondeu ${response.status}`);
  }

  let user: SupabaseUser;
  try {
    user = (await response.json()) as SupabaseUser;
  } catch {
    throw new LhError('unauthorized', 'resposta de Supabase Auth não é JSON válido');
  }

  if (typeof user.id !== 'string' || user.id === '') {
    throw new LhError('unauthorized', 'resposta de Supabase Auth sem identificador');
  }

  const claim = user.app_metadata?.[ROLE_CLAIM];
  if (!isRole(claim)) {
    throw new LhError(
      'forbidden',
      `claim app_metadata.${ROLE_CLAIM} ausente ou desconhecida`,
    );
  }

  return { userId: user.id, role: claim };
}
