/**
 * Envelope de resposta das rotas `/ai/*`.
 *
 * Especificação §10.3: "Toda saída de IA carrega `generatedBy`, `model`, `promptVersion`
 * e `timestamp`, e é exibida com indicação de que está sujeita a revisão profissional."
 * Anexo Técnico I, Parte 1, princípio 4: "Toda resposta carrega `catalogVersion` e
 * `engineVersion`."
 *
 * A indicação de revisão profissional é preservada no próprio texto: os prompts migrados
 * do artefato encerram com o aviso "⚠️ … sujeita à revisão do advogado responsável"
 * (ver `prompts/index.ts`).
 *
 * `generatedBy` recebe o identificador do provedor adotado — ADR-0004 D4.1, Anthropic.
 * Leitura registrada para auditoria: a Especificação enumera `generatedBy` ao lado de
 * `model`, o que indica o produtor da saída, e o provedor é o único produtor decidido.
 */

import type { Env } from './env.ts';

export const GENERATED_BY = 'anthropic';

export interface Usage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface AiResponseEnvelope {
  readonly requestId: string;
  readonly generatedBy: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly timestamp: string;
  readonly catalogVersion: string | null;
  readonly engineVersion: string | null;
  readonly content: string;
}

export function buildEnvelope(input: {
  readonly requestId: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly now: Date;
  readonly env: Env;
  readonly content: string;
}): AiResponseEnvelope {
  return {
    requestId: input.requestId,
    generatedBy: GENERATED_BY,
    model: input.model,
    promptVersion: input.promptVersion,
    timestamp: input.now.toISOString(),
    catalogVersion: input.env.catalogVersion,
    engineVersion: input.env.engineVersion,
    content: input.content,
  };
}
