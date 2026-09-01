/**
 * Adaptador do provedor de IA.
 *
 * ADR-0004: D4.1 provedor **Anthropic**; D4.2 modelo **`claude-sonnet-4-6`**; D4.3 busca
 * web pelo **mecanismo integrado do próprio provedor**, sem provedor de busca separado.
 *
 * Este é o único ponto do monorepo autorizado a falar com provedor de IA — INV-3,
 * "Nenhuma chamada a provedor de IA fora de `ai-gateway`". A exceção correspondente já
 * está declarada em `eslint.config.mjs` para `apps/api/ai-gateway/**`.
 *
 * A credencial vem exclusivamente do ambiente do servidor (Playbook §10) e nunca aparece
 * em corpo, URL, log ou resposta. `fetch` é injetado para que os testes exerçam todos os
 * caminhos sem rede e sem credencial real.
 */

import { LhError } from '../errors.ts';
import type { Env } from '../env.ts';
import type { Usage } from '../envelope.ts';

/** ADR-0004 D4.2. Alteração exige nova ADR e o rito do Playbook §11.2. */
export const MODEL = 'claude-sonnet-4-6';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';

/** Versão de API do provedor. Constante do fornecedor, não decisão de produto. */
const API_VERSION = '2023-06-01';

/** ADR-0004 D4.3 — busca web integrada, mesma ferramenta empregada no artefato (l.158). */
const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search' } as const;

export interface ProviderMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface ProviderRequest {
  readonly system: string;
  readonly messages: readonly ProviderMessage[];
  readonly maxTokens: number;
  readonly webSearch: boolean;
}

export interface ProviderResult {
  readonly content: string;
  readonly model: string;
  readonly usage: Usage;
}

interface AnthropicBlock {
  readonly type?: unknown;
  readonly text?: unknown;
}

interface AnthropicResponse {
  readonly content?: unknown;
  readonly model?: unknown;
  readonly usage?: { readonly input_tokens?: unknown; readonly output_tokens?: unknown };
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export async function callProvider(
  request: ProviderRequest,
  env: Env,
  fetchImpl: typeof fetch,
): Promise<ProviderResult> {
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: request.maxTokens,
    system: request.system,
    messages: request.messages,
  };
  if (request.webSearch) body['tools'] = [WEB_SEARCH_TOOL];

  let response: Response;
  try {
    response = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.anthropicApiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new LhError(
      'provider_error',
      `falha de rede ao chamar o provedor: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }

  if (!response.ok) {
    // O corpo de erro do provedor não é propagado: pode ecoar o conteúdo enviado, e o
    // princípio 5 do Anexo manda mensagem genérica na UI.
    throw new LhError('provider_error', `provedor respondeu ${response.status}`, {
      providerStatus: response.status,
    });
  }

  let parsed: AnthropicResponse;
  try {
    parsed = (await response.json()) as AnthropicResponse;
  } catch {
    throw new LhError('provider_error', 'resposta do provedor não é JSON válido');
  }

  if (!Array.isArray(parsed.content)) {
    throw new LhError('provider_error', 'resposta do provedor sem bloco de conteúdo');
  }

  const content = (parsed.content as AnthropicBlock[])
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text as string)
    .join('\n');

  if (content === '') {
    throw new LhError('provider_error', 'resposta vazia do provedor');
  }

  return {
    content,
    model: typeof parsed.model === 'string' ? parsed.model : MODEL,
    usage: {
      inputTokens: count(parsed.usage?.input_tokens),
      outputTokens: count(parsed.usage?.output_tokens),
    },
  };
}
