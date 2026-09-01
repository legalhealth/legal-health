/**
 * As cinco rotas operacionais do B-03.
 *
 * Mapeamento módulo → rota, determinado pelo proprietário (2026-09-01) sobre a
 * constatação de auditoria: **seis módulos, cinco rotas**, porque o contrato literal de
 * `/ai/research` no Anexo Técnico I diz "Jurisprudência **e** jurimetria".
 *
 *   SYSTEM_AI          → /ai/chat            (Anexo: profissional)
 *   SYSTEM_PECAS       → /ai/draft-document  (Anexo: gestor)
 *   SYSTEM_DOCS        → /ai/read-document   (Anexo: gestor)
 *   SYSTEM_JURIS       → /ai/research        (Anexo: profissional)
 *   SYSTEM_JURIMETRIA  → /ai/research        (Anexo: profissional)
 *   SYSTEM_ANALISE     → /ai/analyze-case    (decisão do proprietário; P-3 pendente)
 *
 * Fora deste conjunto, por decisão expressa da ADR-0005 D5.4: `/ai/explain-item`
 * (depende de B-08) e `/ai/draft-action` (depende de B-09). Nenhuma delas é implementada.
 *
 * Regra de fronteira do Anexo, Parte 1, integralmente respeitada: nenhuma rota escreve em
 * `assessment_results`, `risk_instances` ou na ordenação de `action_items` — este módulo
 * não possui acesso a banco de espécie alguma (ADR-0005 D5.7).
 */

import { LhError } from './errors.ts';
import type { RouteId } from './rbac.ts';
import type { ProviderRequest } from './provider/anthropic.ts';
import {
  SYSTEM_AI,
  SYSTEM_ANALISE,
  SYSTEM_DOCS,
  SYSTEM_JURIMETRIA,
  SYSTEM_JURIS,
  SYSTEM_PECAS,
  type SystemPrompt,
} from './prompts/index.ts';
import {
  asObject,
  normalizeQuery,
  requiredBoolean,
  requiredEnum,
  requiredText,
} from './validation.ts';

/**
 * Janela do chat. O Anexo remete a truncagem ao item B-26, que ainda não define o número.
 * O limite abaixo é escolha do executor, registrada para auditoria: reversível, sem
 * consequência arquitetural, e substituível quando B-26 for especificado.
 */
export const CHAT_WINDOW_TURNS = 20;

export interface PreparedCall {
  readonly prompt: SystemPrompt;
  readonly request: ProviderRequest;
  /** Chave de cache, quando o contrato da rota a exige. */
  readonly cacheKey: string | null;
}

export type RouteBuilder = (body: unknown) => PreparedCall;

/** `/ai/chat` — "Escopado a lacuna, risco ou ação. Janela truncada (B-26)." */
const buildChat: RouteBuilder = (raw) => {
  const body = asObject(raw);
  const escopo = requiredEnum(body, 'escopo', ['lacuna', 'risco', 'acao'] as const);
  const referencia = requiredText(body, 'referencia', 200);
  const mensagens = body['mensagens'];

  if (!Array.isArray(mensagens) || mensagens.length === 0) {
    throw new LhError('invalid_request', 'campo "mensagens" ausente ou vazio', {
      field: 'mensagens',
    });
  }

  const janela = mensagens.slice(-CHAT_WINDOW_TURNS).map((item, index) => {
    const turn = asObject(item);
    const role = requiredEnum(turn, 'role', ['user', 'assistant'] as const);
    const content = requiredText(turn, 'content');
    if (index === mensagens.length - 1 && role !== 'user') {
      throw new LhError('invalid_request', 'a última mensagem deve ser do usuário');
    }
    return { role, content };
  });

  return {
    prompt: SYSTEM_AI,
    cacheKey: null,
    request: {
      system: `${SYSTEM_AI.text}\n\nEscopo desta conversa: ${escopo} — referência ${referencia}.`,
      messages: janela,
      maxTokens: 1600,
      webSearch: false,
    },
  };
};

/**
 * `/ai/draft-document` — "Minutas e peças, **sempre derivadas de ação do plano ou
 * incidente registrado**." A origem é exigida na requisição: sem banco (D5.7), é o
 * cliente que declara a referência, e a ausência da declaração reprova a chamada.
 */
const buildDraftDocument: RouteBuilder = (raw) => {
  const body = asObject(raw);
  const origem = requiredEnum(body, 'origem', [
    'acao_do_plano',
    'incidente_registrado',
  ] as const);
  const referencia = requiredText(body, 'referencia', 200);
  const instrucao = requiredText(body, 'instrucao');

  return {
    prompt: SYSTEM_PECAS,
    cacheKey: null,
    request: {
      system: SYSTEM_PECAS.text,
      messages: [
        {
          role: 'user',
          content: `Origem: ${origem} (${referencia}).\n\n${instrucao}`,
        },
      ],
      maxTokens: 4000,
      webSearch: false,
    },
  };
};

/**
 * `/ai/read-document` — "OCR e classificação sugerida. **Rejeita na borda documento
 * sinalizado como de paciente.**" A rejeição é literal e ocorre antes de qualquer chamada
 * ao provedor, cumprindo INV-5.
 */
const buildReadDocument: RouteBuilder = (raw) => {
  const body = asObject(raw);
  const contemDadoDePaciente = requiredBoolean(body, 'contemDadoDePaciente');
  if (contemDadoDePaciente) {
    throw new LhError(
      'patient_data_rejected',
      'documento sinalizado como de paciente, rejeitado na borda (Anexo I §1; INV-5)',
    );
  }
  const documento = requiredText(body, 'documento');

  return {
    prompt: SYSTEM_DOCS,
    cacheKey: null,
    request: {
      system: SYSTEM_DOCS.text,
      messages: [{ role: 'user', content: documento }],
      maxTokens: 2500,
      webSearch: false,
    },
  };
};

/**
 * `/ai/research` — "Jurisprudência e jurimetria. **Cache obrigatório por consulta
 * normalizada.**" Atende `SYSTEM_JURIS` e `SYSTEM_JURIMETRIA` através do campo `modo`.
 * A busca web é a integrada do provedor (ADR-0004 D4.3).
 */
const buildResearch: RouteBuilder = (raw) => {
  const body = asObject(raw);
  const modo = requiredEnum(body, 'modo', ['jurisprudencia', 'jurimetria'] as const);
  const consulta = requiredText(body, 'consulta', 4000);

  const prompt = modo === 'jurisprudencia' ? SYSTEM_JURIS : SYSTEM_JURIMETRIA;
  const conteudo =
    modo === 'jurisprudencia'
      ? `Tema da pesquisa de jurisprudência (Direito Médico/Saúde, Brasil): ${consulta}`
      : `Tema da análise de jurimetria (Direito Médico/Saúde, Brasil): ${consulta}`;

  return {
    prompt,
    cacheKey: `${modo}:${prompt.version}:${normalizeQuery(consulta)}`,
    request: {
      system: prompt.text,
      messages: [{ role: 'user', content: conteudo }],
      maxTokens: 2200,
      webSearch: true,
    },
  };
};

/**
 * `/ai/analyze-case` — atende `SYSTEM_ANALISE`. Existência e função fixadas pela
 * ADR-0005 D5.6; designação e papel mínimo `gestor` são decisão expressa do proprietário.
 * A incorporação ao Anexo Técnico I é a pendência **P-3**, registrada e não executada.
 * D5.6 veda absorver este módulo em `/ai/chat`, e esta rota é o cumprimento dessa vedação.
 */
const buildAnalyzeCase: RouteBuilder = (raw) => {
  const body = asObject(raw);
  const texto = requiredText(body, 'texto');

  return {
    prompt: SYSTEM_ANALISE,
    cacheKey: null,
    request: {
      system: SYSTEM_ANALISE.text,
      messages: [{ role: 'user', content: texto }],
      maxTokens: 1800,
      webSearch: false,
    },
  };
};

export const ROUTE_BUILDERS: Readonly<Record<RouteId, RouteBuilder>> = {
  chat: buildChat,
  'draft-document': buildDraftDocument,
  'read-document': buildReadDocument,
  research: buildResearch,
  'analyze-case': buildAnalyzeCase,
};
