# ADR-0002 — Stack e Estrutura do Monorepo

| Campo | Valor |
| --- | --- |
| Identificador | ADR-0002 |
| Status | **ACEITA** — decisões estruturais homologadas no Termo de Decisão T-00 (2026-08-05); componentes de toolchain registrados nesta ADR, sujeitos a ratificação na revisão da Sprint 0 |
| Data | 5 de agosto de 2026 |
| Decisor | Fundador (decisões b, e do Termo T-00) · Engenharia (toolchain) |
| Relacionadas | ADR-0001 · Ordem Oficial Sprint 0 (S0-B, S0-J) · Playbook §2 e §3 · Plano Diretor B-01 e Parte 7 |

## 1. Contexto

A Sprint 0 exige monorepo com toolchain operante (S0-B). Havia contradição documental sobre o alvo de
build — "projeto Expo, 3 plataformas" (Plano Diretor B-01) × `apps/web` React (Ordem §4 / Playbook §2)
— levada ao fundador por IA-9 e resolvida no Termo T-00, decisão (e). Havia ainda a definição pendente
do local de documentos de governança de sprint e dos ativos de negócio (decisão b).

## 2. Decisões

### 2.1 Arquitetura de aplicação — "Web-First via Expo / React Native Web" (homologada, T-00 e)

1. A base é o **monorepo Expo (React Native)**, conforme o Plano Diretor (B-01).
2. O **alvo primário e obrigatório de build/deploy da Sprint 0 à Sprint 3 é a plataforma Web**
   (Expo Web / Universal Web App), atendendo a entrega rápida e preview imediato (Ordem §4).
3. Os targets nativos (iOS e Android) derivam da mesma base de código e são ativados no pipeline
   **a partir da Sprint 6**.

Justificativa: elimina o conflito documental, evita reescrita futura e garante entrega web imediata sem
desviar da arquitetura-alvo multi-plataforma.

### 2.2 Estrutura de diretórios

Conforme Playbook §2 e Ordem §4, com os complementos decididos:

```
legal-health/
├── package.json            workspaces npm: packages/* + apps/*
├── tsconfig.base.json      TypeScript estrito comum
├── eslint.config.mjs       ESLint 9 flat config (fronteira INV-1/INV-3 ativa na T-04/S0-I)
├── .prettierrc · .gitignore
├── packages/
│   ├── core/               @lh/core — domínio puro; esqueleto na Sprint 0; motor na Sprint 1
│   ├── contracts/          @lh/contracts — vazio na Sprint 0
│   └── ui/                 @lh/ui — vazio na Sprint 0; primitivos migram na Sprint 1
├── apps/web/               Expo SDK 57, alvo web (react-native-web)
├── db/                     vazio na Sprint 0; migrações a partir da Sprint 3
└── docs/
    ├── spec/               Especificação LHI v1.0 · Plano Diretor 2.0 · Anexo I · Due Diligence
    ├── playbook/           Engineering Playbook v1.0
    ├── adr/                ADRs (PDF original + transcrições .md) · NCN
    ├── sprints/sprint-0/   Ordem Oficial · Gate Review · Termo T-00 (governança por sprint)
    ├── artifact-baseline/  artefato auditado, preservado byte a byte (tag artifact-baseline)
    ├── assets/business/    valuation e criativos (Termo T-00, decisão b — sem expurgo de histórico)
    └── notas/              material não normativo
```

`docs/sprints/<sprint>/` fica fixado como local canônico de ordens de execução, gate reviews e termos
de decisão — preenche a lacuna estrutural apontada no inventário oficial.

### 2.3 Toolchain (registro de engenharia)

| Componente | Escolha | Justificativa |
| --- | --- | --- |
| Gerenciador de workspaces | npm workspaces (npm 10) | Já presente no ambiente; zero dependência nova (Playbook §10). |
| Linguagem | TypeScript estrito (`tsconfig.base.json`) | Exigido por S0-B; `noUncheckedIndexedAccess` previne a classe de erro `answers[key] || 0`. |
| App | Expo SDK 57 · React 19.2 · RN 0.86 · react-native-web 0.21 | Decisão 2.1; versões do `bundledNativeModules.json` do SDK. |
| Lint | ESLint 9 flat config + typescript-eslint | Base da regra de fronteira da T-04; `no-empty` sem catch vazio (Playbook §3.3). |
| Formatação | Prettier | Convenção única, sem debate de estilo. |
| Testes | vitest | Executor TS-nativo e rápido para domínio puro; golden cases da Sprint 1 rodam nele. |
| Licença | Nenhuma licença open-source no repositório | Código proprietário confidencial; LICENSE MIT do template Expo removida. |

## 3. Consequências

- Um único código produz web agora e mobile a partir da Sprint 6, sem reescrita.
- O bundle web de referência do template exporta com ~96 KB gzip — folga de ~200 KB para a migração do
  artefato dentro do orçamento A9 (300 KB gzip).
- Restrição assumida: a paridade A2 da Sprint 0 é verificada **no alvo web**; paridade nativa será
  critério das sprints que ativarem iOS/Android.
- O proxy do ambiente de execução bloqueia a API de compatibilidade da Expo (`expo install --check`);
  as versões são fixadas pelo `bundledNativeModules.json` do SDK — registrado como limitação operacional.
