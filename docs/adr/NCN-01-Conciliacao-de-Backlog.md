# NCN-01/2026 — Nota de Conciliação Normativa de Backlog

| Campo | Valor |
| --- | --- |
| Identificador | NCN-01/2026 |
| Status | **RATIFICADA INTEGRALMENTE** pelo fundador — Termo de Decisão T-00, decisão (c), 2026-08-05 |
| Natureza | Nota de conciliação documental. Não altera escopo, critério de aceite nem decisão aprovada. |
| Relacionadas | Plano Diretor Parte 8 · Ordem Oficial Sprint 0 · ADR-0001 · Gate Review Sprint 0 · Anexo I |

## 1. Problema conciliado

O corpus normativo continha três leituras concorrentes da numeração `B-xx` e duas referências órfãs:

1. Plano Diretor, Parte 8: backlog **B-01 a B-24** (B-01 = projeto versionado; B-02 = correções triviais).
2. Ordem Oficial S0 e ADR-0001: **B-01 a B-04** designando as quatro correções de gravidade máxima.
3. Gate Review: "B-01 a B-05" em terceira leitura.
4. Referências órfãs: **B-26** (Anexo I §1, janela truncada do chat) e **B-30** (ADR-0001 A3/§9,
   licenciamento do `@lh/core` em repositório próprio) — inexistentes no backlog original.

## 2. Taxonomia ratificada

| Faixa | Uso |
| --- | --- |
| **S0-xx** | Reservado às tarefas de saneamento emergencial e infraestrutura da Sprint 0. As quatro correções passam a ser referidas por S0-xx ou pelo identificador de problema (PR-08, PR-07, PR-15, PR-13) — nunca mais por "B-01..B-04". |
| **B-01 a B-24** | Preservado com fidelidade absoluta ao escopo e à ordem do Plano Diretor 2.0, Parte 8. |
| **B-25 a B-30** | Formalizados para cobrir a expansão do backlog, conforme abaixo. |

### Itens formalizados B-25 a B-30

| ID | Item | Origem normativa |
| --- | --- | --- |
| B-25 | Backup e recuperação de desastre (RPO/RTO) | Gate Review R4 |
| B-26 | Notificação de incidente de segurança — LGPD art. 48 | Gate Review R4/pendências |
| B-27 | Multi-Tenancy Avançado | Plano Diretor §7.4 (evolução) |
| B-28 | Benchmarking Setorial | Plano Diretor B-23 (desdobramento por coorte setorial) |
| B-29 | Offline-First | Plano Diretor B-22 (aprofundamento) |
| B-30 | Audit Trail Criptográfico | Playbook §12 (auditoria append-only, endurecimento) |

## 3. Erratas de referência histórica

As menções antigas a seguir **não** apontam para os novos B-25–B-30 e ficam remapeadas:

| Referência histórica | Onde aparece | Leitura correta sob esta NCN |
| --- | --- | --- |
| "B-26" (janela truncada do chat) | Anexo I §1, rota `/ai/chat` | Controle de custo de IA do Anexo I §6, executado na reancoragem dos módulos de IA (B-18) e no AI Gateway (B-03). |
| "B-30" (licenciamento do core em repositório próprio) | ADR-0001, alternativa A3 e §9 | Hipótese da fase Enterprise vinculada a B-24 (API pública) e aos critérios de revisão futura do ADR-0001 §9. |
| "B-01 a B-04/B-05" como correções da Sprint 0 | Ordem S0 §2.1 · ADR-0001 §2 · Gate Review | Ler como S0-xx / PR-08, PR-07, PR-15, PR-13 (+ PR-14, incluído pela decisão (d) do Termo T-00 como **S0-03**). |

## 4. Efeito

A partir desta NCN, toda rastreabilidade de PR, commit e Definition of Ready usa exclusivamente esta
taxonomia. Colisões futuras de numeração são defeito documental e devem ser trazidas a nova NCN — nunca
resolvidas por inferência (Playbook IA-9).
