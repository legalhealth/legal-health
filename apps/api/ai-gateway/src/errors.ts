/**
 * Erro estruturado do AI Gateway.
 *
 * Anexo Técnico I, Parte 1, princípio 5: "Erro é sempre estruturado:
 * `{ code, message, details, requestId }`. Mensagem genérica na UI, causa no log."
 *
 * A separação é literal: `message` é o texto genérico devolvido ao cliente;
 * `logCause` nunca sai desta camada — vai só para o log (ver `cost.ts`/`handler.ts`).
 * Playbook §3.3 proíbe catch silencioso; todo caminho de erro produz um `LhError`.
 */

export type ErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_request'
  | 'method_not_allowed'
  | 'not_found'
  | 'patient_data_rejected'
  | 'provider_error'
  | 'internal_error';

const HTTP_STATUS: Record<ErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  invalid_request: 400,
  method_not_allowed: 405,
  not_found: 404,
  patient_data_rejected: 422,
  provider_error: 502,
  internal_error: 500,
};

/** Mensagens devolvidas ao cliente. Genéricas por exigência do princípio 5. */
const CLIENT_MESSAGE: Record<ErrorCode, string> = {
  unauthorized: 'Autenticação necessária.',
  forbidden: 'Acesso não autorizado para este papel.',
  invalid_request: 'Requisição inválida.',
  method_not_allowed: 'Método não permitido para esta rota.',
  not_found: 'Rota não encontrada.',
  patient_data_rejected: 'Conteúdo rejeitado na borda.',
  provider_error: 'Falha ao processar a solicitação.',
  internal_error: 'Falha ao processar a solicitação.',
};

export type ErrorDetails = Readonly<Record<string, string | number | boolean>>;

export class LhError extends Error {
  readonly code: ErrorCode;
  /** Detalhes seguros para o cliente: nunca contêm conteúdo enviado pelo usuário. */
  readonly details: ErrorDetails;
  /** Causa técnica. Destina-se exclusivamente ao log; jamais à resposta. */
  readonly logCause: string;

  constructor(code: ErrorCode, logCause: string, details: ErrorDetails = {}) {
    super(CLIENT_MESSAGE[code]);
    this.name = 'LhError';
    this.code = code;
    this.details = details;
    this.logCause = logCause;
  }

  get status(): number {
    return HTTP_STATUS[this.code];
  }
}

export interface ErrorBody {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details: ErrorDetails;
  readonly requestId: string;
}

export function toErrorBody(error: LhError, requestId: string): ErrorBody {
  return {
    code: error.code,
    message: CLIENT_MESSAGE[error.code],
    details: error.details,
    requestId,
  };
}

/** Normaliza qualquer exceção em `LhError`, sem vazar a mensagem original ao cliente. */
export function asLhError(thrown: unknown): LhError {
  if (thrown instanceof LhError) return thrown;
  const cause = thrown instanceof Error ? thrown.message : String(thrown);
  return new LhError('internal_error', cause);
}
