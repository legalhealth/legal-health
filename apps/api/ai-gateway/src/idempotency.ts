/**
 * Idempotência por chave do cliente.
 *
 * Anexo Técnico I, Parte 1, princípio 3: "Toda escrita é idempotente por chave do cliente
 * (`Idempotency-Key`), para tolerar rede instável em clínica."
 *
 * Limitação registrada, e deliberada: este armazenamento é **em memória e por instância**,
 * portanto não durável e não compartilhado entre instâncias. A alternativa — persistir a
 * chave — exigiria banco, que a ADR-0005 D5.7 exclui expressamente do B-03. A idempotência
 * durável acompanha o B-05. O que esta camada garante hoje é o caso que o princípio nomeia:
 * reenvio por rede instável dentro da mesma instância não duplica a chamada ao provedor.
 */

export interface IdempotencyStore<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
}

interface Slot<T> {
  readonly value: T;
  readonly expiresAt: number;
}

export const DEFAULT_TTL_MS = 10 * 60 * 1000;

export function createIdempotencyStore<T>(
  now: () => Date,
  ttlMs: number = DEFAULT_TTL_MS,
  maxEntries = 500,
): IdempotencyStore<T> {
  const slots = new Map<string, Slot<T>>();

  const prune = (nowMs: number): void => {
    for (const [key, slot] of slots) {
      if (slot.expiresAt <= nowMs) slots.delete(key);
    }
    while (slots.size > maxEntries) {
      const oldest = slots.keys().next();
      if (oldest.done === true) break;
      slots.delete(oldest.value);
    }
  };

  return {
    get(key) {
      const nowMs = now().getTime();
      const slot = slots.get(key);
      if (slot === undefined) return undefined;
      if (slot.expiresAt <= nowMs) {
        slots.delete(key);
        return undefined;
      }
      return slot.value;
    },
    set(key, value) {
      const nowMs = now().getTime();
      prune(nowMs);
      slots.set(key, { value, expiresAt: nowMs + ttlMs });
    },
  };
}

/**
 * Chave efetiva: o cabeçalho isolado seria compartilhável entre usuários, então é
 * escopado ao usuário autenticado. Ausência do cabeçalho desativa a deduplicação — não
 * recusa a requisição: o princípio 3 institui idempotência, não a exige como obrigação
 * do cliente.
 */
export function idempotencyKey(headers: Headers, userId: string): string | null {
  const raw = headers.get('idempotency-key');
  if (raw === null || raw.trim() === '') return null;
  return `${userId}:${raw.trim()}`;
}
