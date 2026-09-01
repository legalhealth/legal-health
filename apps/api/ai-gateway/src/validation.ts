/**
 * Validação de entrada das rotas `/ai/*`.
 *
 * Playbook §3.3 proíbe catch silencioso; Anexo Técnico I, princípio 5, exige erro
 * estruturado. Toda falha de validação vira `LhError('invalid_request', …)` com causa no
 * log e mensagem genérica ao cliente.
 *
 * Os `details` devolvidos ao cliente carregam apenas o nome do campo e o limite violado —
 * nunca o valor recebido, que poderia ecoar conteúdo sensível (INV-5).
 */

import { LhError } from './errors.ts';

/** Teto defensivo de tamanho. Não é cota de plano — cota é matéria do Anexo §6/Sprint 4. */
export const MAX_TEXT_LENGTH = 200_000;

export function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new LhError('invalid_request', 'corpo da requisição não é um objeto JSON');
  }
  return value as Record<string, unknown>;
}

export function requiredText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number = MAX_TEXT_LENGTH,
): string {
  const value = body[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new LhError('invalid_request', `campo "${field}" ausente ou vazio`, { field });
  }
  if (value.length > maxLength) {
    throw new LhError('invalid_request', `campo "${field}" excede o tamanho máximo`, {
      field,
      maxLength,
    });
  }
  return value;
}

export function requiredBoolean(body: Record<string, unknown>, field: string): boolean {
  const value = body[field];
  if (typeof value !== 'boolean') {
    throw new LhError('invalid_request', `campo "${field}" deve ser booleano`, { field });
  }
  return value;
}

export function requiredEnum<T extends string>(
  body: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
): T {
  const value = body[field];
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw new LhError('invalid_request', `campo "${field}" fora do domínio admitido`, {
      field,
      admitidos: allowed.join(', '),
    });
  }
  return value as T;
}

/** Normalização usada na chave de cache de `/ai/research` (Anexo: "consulta normalizada"). */
export function normalizeQuery(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}
