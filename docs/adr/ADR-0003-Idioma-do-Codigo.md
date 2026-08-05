# ADR-0003 — Idioma do Código

| Campo | Valor |
| --- | --- |
| Identificador | ADR-0003 |
| Status | **ACEITA** — formaliza decisão já fixada no Engineering Playbook v1.0 §3.1, aprovado |
| Data | 5 de agosto de 2026 |
| Relacionadas | Playbook §3 · Ordem Oficial Sprint 0 (S0-J) |

## 1. Contexto

A Ordem S0-J exige ADR sobre o idioma do código. A decisão substantiva já consta do Playbook §3.1;
esta ADR a formaliza no corpus de decisões arquiteturais, sem alterá-la (hierarquia normativa: o
Playbook prevalece sobre ADRs).

## 2. Decisão

**Conceitos de domínio em português; estrutura técnica em inglês.**

- Entidades, funções de caso de uso e vocabulário do domínio em português:
  `calcularJuriscore(respostas: Resposta[]): ResultadoIndice` · `Assessment · Pilar · Risco · Evidencia`.
- Estrutura técnica (arquivos, diretórios, hooks, sufixos de DTO, nomes de pacote) em inglês/convenção:
  kebab-case para arquivos e diretórios; `PascalCase.tsx` para componentes; `use-*.ts` para hooks;
  sufixos `Input`/`Output` em `@lh/contracts`; `*.schema.ts` ao lado do DTO; `*.test.ts` ao lado do código.

## 3. Justificativa

O domínio é o direito médico brasileiro e o vocabulário é compartilhado com advogados e médicos que
revisam a metodologia. Traduzir "pilar", "evidência" ou "parcialmente" criaria imposto de tradução
permanente entre a Especificação e o código, fonte de erro em revisões metodológicas.

## 4. Consequências

- Revisões jurídicas leem o código de domínio sem glossário.
- A verificação de aderência é objetiva em code review (Playbook §3.1, tabela de convenções).
- Bibliotecas e infraestrutura permanecem no idioma do ecossistema, sem fricção com ferramentas.
