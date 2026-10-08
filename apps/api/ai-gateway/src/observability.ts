/**
 * Log estruturado do gateway — custo por chamada e causa de erro.
 *
 * Decisão C.2 do proprietário (2026-09-01), sobre a divergência registrada como R-05:
 * o critério de aceite do B-03 no Plano Diretor Parte 8 — "custo por chamada registrado"
 * — é satisfeito pelo **registro estruturado do custo de cada chamada no log da própria
 * chamada**, ficando a agregação "por organização, por operação e por mês" do Anexo
 * Técnico I §6 para a Sprint 4. A decisão preserva a ADR-0005 D5.7, que exclui banco,
 * persistência e multi-tenant do escopo do B-03.
 *
 * INV-5 — "Nenhuma tabela, log ou prompt recebe dado de paciente identificável": nenhuma
 * entrada de log desta camada carrega conteúdo enviado pelo usuário nem texto produzido
 * pelo provedor. Os campos são exclusivamente identificadores, contadores e códigos. Isso
 * é verificado por teste.
 */

import type { ErrorCode } from './errors.ts';
import type { RouteId } from './rbac.ts';
import type { Usage } from './envelope.ts';

export interface CostLogEntry {
  readonly kind: 'ai.call.cost';
  readonly requestId: string;
  readonly route: RouteId;
  readonly model: string;
  /**
   * Identificador do prompt de sistema que produziu a saída (ex.: `system-juris`). Distingue
   * `SYSTEM_JURIS` de `SYSTEM_JURIMETRIA`, que compartilham a rota `/ai/research` e a mesma
   * `promptVersion`. É um identificador fixo do código, nunca conteúdo de entrada.
   */
  readonly promptId: string;
  readonly promptVersion: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  /** Buscas web cobradas nesta chamada (0 nas rotas sem busca). */
  readonly webSearchRequests: number;
  readonly latencyMs: number;
  readonly timestamp: string;
  /** Identificador opaco do usuário. Não é dado de paciente. */
  readonly userId: string;
}

export interface ErrorLogEntry {
  readonly kind: 'ai.call.error';
  readonly requestId: string;
  readonly route: RouteId | null;
  /** Prompt da rota quando o erro ocorre depois da preparação da chamada; `null` antes. */
  readonly promptId: string | null;
  readonly code: ErrorCode;
  /** Causa técnica. Nunca contém corpo de requisição nem saída do provedor. */
  readonly cause: string;
  readonly timestamp: string;
}

export type LogEntry = CostLogEntry | ErrorLogEntry;

export type Logger = (entry: LogEntry) => void;

export function costEntry(input: {
  readonly requestId: string;
  readonly route: RouteId;
  readonly model: string;
  readonly promptId: string;
  readonly promptVersion: string;
  readonly usage: Usage;
  readonly latencyMs: number;
  readonly now: Date;
  readonly userId: string;
}): CostLogEntry {
  return {
    kind: 'ai.call.cost',
    requestId: input.requestId,
    route: input.route,
    model: input.model,
    promptId: input.promptId,
    promptVersion: input.promptVersion,
    inputTokens: input.usage.inputTokens,
    outputTokens: input.usage.outputTokens,
    webSearchRequests: input.usage.webSearchRequests,
    latencyMs: input.latencyMs,
    timestamp: input.now.toISOString(),
    userId: input.userId,
  };
}

/** Logger padrão do runtime. Uma linha JSON por evento. */
export const consoleLogger: Logger = (entry) => {
  console.log(JSON.stringify(entry));
};
