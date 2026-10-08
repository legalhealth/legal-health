/**
 * Idempotência por chave do cliente.
 *
 * Anexo Técnico I, Parte 1, princípio 3: "Toda escrita é idempotente por chave do cliente
 * (`Idempotency-Key`), para tolerar rede instável em clínica."
 *
 * Limitação registrada, e deliberada: este armazenamento é **em memória e por instância**,
 * portanto não durável e não compartilhado entre instâncias. A alternativa — persistir a
 * chave — exigiria banco, que a ADR-0005 D5.7 exclui expressamente do B-03. A idempotência
 * durável acompanha o B-05.
 *
 * ALCANCE REAL — não confundir com garantia de "zero chamadas" em repetições (demonstrado em
 * `tests/protecao-repeticoes.test.ts`). A proteção só vale quando TODAS as condições abaixo
 * se cumprem; fora delas a repetição chama o provedor de novo e custa de novo:
 *
 *  1. mesma instância: o armazenamento vive na memória de um isolate da Edge Function.
 *     Instâncias simultâneas não o compartilham, e um isolate novo (reinício, reciclagem
 *     depois do limite de duração da plataforma — 150 s no plano gratuito, consulta de
 *     2026-10-08) começa vazio;
 *  2. dentro da validade: `DEFAULT_TTL_MS` (10 min), na prática limitada à vida do isolate;
 *  3. dentro da capacidade: ao exceder `maxEntries` descartam-se as entradas mais antigas. A
 *     poda precede a inserção, logo a capacidade efetiva é `maxEntries + 1`;
 *  4. sem concorrência: a consulta (`get`) precede a chamada ao provedor e o registro (`set`)
 *     só ocorre depois da resposta. Duas requisições idênticas SIMULTÂNEAS passam ambas pela
 *     consulta e ambas chamam o provedor. Não existe deduplicação de chamadas em andamento;
 *  5. com o cabeçalho `Idempotency-Key` (rotas sem cache próprio) ou, em `/ai/research`, com
 *     consulta normalizada idêntica. Sem o cabeçalho, nada é deduplicado.
 *
 * Consequência para o orçamento do aceite: toda repetição deve ser contada como chamada
 * adicional, salvo quando comprovada pelo log (`ai.provider.attempt` ausente).
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
