/**
 * Papéis e autorização das rotas `/ai/*`.
 *
 * Fonte única: Anexo Técnico I, Parte 2 — cinco papéis e matriz de capacidades.
 * A capacidade que governa toda esta superfície é "Usar módulos de IA":
 *
 *   owner ✓ · gestor ✓ · profissional ✓ · leitor — · lh_admin —
 *
 * `leitor` e `lh_admin` são portanto negados em TODAS as rotas de IA, sem exceção.
 * A regra inviolável (c) da mesma Parte 2 reforça: "lh_admin não possui rota de leitura
 * de assessments de cliente identificado".
 *
 * O papel mínimo por rota vem da coluna "Papel mín." da tabela da Parte 1. A leitura de
 * "mínimo" adotada é a que a própria matriz sustenta: para as capacidades ali listadas,
 * `owner` cobre tudo que `gestor` cobre, e `gestor` cobre tudo que `profissional` cobre
 * ("Ver índice, riscos e plano": owner ✓ gestor ✓ profissional ✓; "Executar e marcar
 * ações": owner ✓ gestor ✓ profissional —). Ainda assim, esta implementação NÃO deriva
 * autorização de uma hierarquia numérica: cada rota declara a lista explícita de papéis
 * admitidos, e o que não estiver na lista é negado — Playbook E8, "negar por padrão,
 * permitir por exceção".
 */

import { LhError } from './errors.ts';

export const ROLES = ['owner', 'gestor', 'profissional', 'leitor', 'lh_admin'] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export type RouteId =
  | 'chat'
  | 'draft-document'
  | 'read-document'
  | 'research'
  | 'analyze-case';

export interface RoutePolicy {
  /** Caminho exato, conforme o Anexo Técnico I, Parte 1. */
  readonly path: string;
  /** Único método admitido. */
  readonly method: 'POST';
  /** Coluna "Papel mín." do Anexo. Registrado para rastreabilidade. */
  readonly papelMinimo: Role;
  /** Lista explícita de papéis admitidos. Tudo fora dela é negado. */
  readonly permitidos: readonly Role[];
}

export const ROUTE_POLICY: Readonly<Record<RouteId, RoutePolicy>> = {
  // "Escopado a lacuna, risco ou ação. Janela truncada (B-26)." — profissional
  chat: {
    path: '/ai/chat',
    method: 'POST',
    papelMinimo: 'profissional',
    permitidos: ['owner', 'gestor', 'profissional'],
  },
  // "Minutas e peças, sempre derivadas de ação do plano ou incidente registrado." — gestor
  'draft-document': {
    path: '/ai/draft-document',
    method: 'POST',
    papelMinimo: 'gestor',
    permitidos: ['owner', 'gestor'],
  },
  // "OCR e classificação sugerida. Rejeita na borda documento sinalizado como de
  // paciente." — gestor
  'read-document': {
    path: '/ai/read-document',
    method: 'POST',
    papelMinimo: 'gestor',
    permitidos: ['owner', 'gestor'],
  },
  // "Jurisprudência e jurimetria. Cache obrigatório por consulta normalizada." —
  // profissional. Uma única rota atende SYSTEM_JURIS e SYSTEM_JURIMETRIA, conforme o
  // contrato literal do Anexo.
  research: {
    path: '/ai/research',
    method: 'POST',
    papelMinimo: 'profissional',
    permitidos: ['owner', 'gestor', 'profissional'],
  },
  // Rota decidida pelo proprietário (ADR-0005 D5.6 fixa existência e função; designação e
  // papel mínimo `gestor` são decisão expressa do proprietário). A incorporação formal ao
  // Anexo Técnico I é a pendência P-3, registrada e ainda não executada.
  'analyze-case': {
    path: '/ai/analyze-case',
    method: 'POST',
    papelMinimo: 'gestor',
    permitidos: ['owner', 'gestor'],
  },
};

const PATH_TO_ROUTE: ReadonlyMap<string, RouteId> = new Map(
  (Object.keys(ROUTE_POLICY) as RouteId[]).map((id) => [ROUTE_POLICY[id].path, id]),
);

export function resolveRoute(pathname: string): RouteId | undefined {
  return PATH_TO_ROUTE.get(pathname);
}

/** Autoriza ou lança `forbidden`. Nunca devolve booleano ambíguo. */
export function authorize(routeId: RouteId, role: Role): void {
  const policy = ROUTE_POLICY[routeId];
  if (!policy.permitidos.includes(role)) {
    throw new LhError('forbidden', `papel "${role}" não admitido em ${policy.path}`, {
      route: policy.path,
      papelMinimo: policy.papelMinimo,
    });
  }
}
