# Termo de Decisão Formal do Fundador — Task T-00 (Fase 0)

**Legal Health Engineering Governance**
Data de homologação: 5 de agosto de 2026 · Projeto: `legalhealth/legal-health`
Origem: Task T-00 (Portão Decisório Bloqueante) · Status: **HOMOLOGADO — DECISÕES VINCULANTES**
Impacto: desbloqueio imediato da Fase 0 — liberação para execução das Tasks T-01, T-02, T-03 e T-16.

## Decisão (a) — Endereço oficial do repositório (ADR-0001 D6.1)

**HOMOLOGADO.** O campo D6.1 da ADR-0001 fica preenchido com a URL exata
<https://github.com/legalhealth/legal-health> (identificador interno: `legalhealth/legal-health`).
Ação técnica: registrado em `docs/adr/ADR-0001-Perimetro-Oficial-do-Codigo.md`.

## Decisão (b) — Destino dos ativos de negócio (valuation + 6 criativos)

**REESTRUTURAÇÃO E ISOLAMENTO DA ÁRVORE DA MAIN.**

- **Não expurgar o histórico Git**: o commit inicial `29f890b` não contém segredos, chaves ou senhas;
  não há necessidade de reescrita (`git filter-repo`), preservando a integridade da baseline.
- **Limpeza da raiz**: `Criativos/*.png` e `legal-health-valuation-10anos.xlsx` movidos para
  `docs/assets/business/`.
- Justificativa: repositório limpo para CI/CD e builds, sem poluir a raiz do monorepo, preservando a
  rastreabilidade histórica do material institucional.

## Decisão (c) — Conciliação da numeração B-xx e referências órfãs (B-26/B-30)

**RATIFICAÇÃO INTEGRAL DA NOTA NCN-01/2026** (`docs/adr/NCN-01-Conciliacao-de-Backlog.md`):
`S0-xx` reservado ao saneamento/infraestrutura da Sprint 0; `B-01..B-24` preservados com fidelidade
absoluta ao Plano Diretor 2.0; `B-25..B-30` formalizados (Backup/DR, Notificação LGPD art. 48,
Multi-Tenancy Avançado, Benchmarking Setorial, Offline-First, Audit Trail Criptográfico).

## Decisão (d) — Inclusão do PR-14 no escopo da Sprint 0

**INCLUIR NO ESCOPO DA SPRINT 0 (S0-03).** O problema PR-14 (três sistemas concorrentes de faixas de
corte) deve ser saneado imediatamente na Sprint 0 sob o item S0-03. Justificativa: sistemas de corte
conflitantes comprometem a consistência do motor matemático; unificar as regras garante validação de
fronteiras determinística e alinhada à Spec LHI v1.0 §8.

## Decisão (e) — Alvo de build e arquitetura (ADR-0002)

**ESTRATÉGIA UNIVERSAL "WEB-FIRST" VIA EXPO / REACT NATIVE WEB.** Base sobre o monorepo Expo
(React Native) conforme o Plano Diretor (B-01); alvo primário e obrigatório de build/deploy da Sprint 0
à Sprint 3 é a plataforma Web (Expo Web / Universal Web App), atendendo à Ordem Oficial §4; targets
nativos (iOS/Android) derivam da mesma base e são ativados no pipeline a partir da Sprint 6.
Reconciliação registrada no `docs/adr/ADR-0002-Stack-e-Monorepo.md` (regra IA-9).

## Matriz de conciliação — destino documental

| Item | Objeto | Decisão homologada | Destino documental |
| --- | --- | --- | --- |
| (a) | Endereço oficial D6.1 | `legalhealth/legal-health` | `docs/adr/ADR-0001-Perimetro-Oficial-do-Codigo.md` |
| (b) | Ativos de negócio | Mover para `docs/assets/business/` | Estrutura de diretórios (commit de reorganização) |
| (c) | Numeração B-xx | Taxonomia NCN-01/2026 | `docs/adr/NCN-01-Conciliacao-de-Backlog.md` |
| (d) | PR-14 na Sprint 0 | Incluído como S0-03 | Checklist da Sprint 0 / `@lh/core` |
| (e) | Alvo de build | Web-First via monorepo Expo | `docs/adr/ADR-0002-Stack-e-Monorepo.md` |

## Declaração de liberação do portão decisório (critério C20)

Com o registro destas cinco decisões, o Portão Decisório T-00 está oficialmente **encerrado e
aprovado**. As lacunas documentais e contradições de arquitetura foram resolvidas. A equipe de
engenharia está autorizada a prosseguir com a execução encadeada das Tasks **T-01, T-02, T-03 e T-16**.
