# NCN-03/2026 — Nota de Conciliação Normativa da Formalização do B-03

| Campo | Valor |
| --- | --- |
| Identificador | NCN-03/2026 |
| Status | **HOMOLOGADA** pelo fundador — Decisões I a V, 2026-08-29 |
| Natureza | Nota de conciliação documental. Não altera escopo, critério de aceite nem decisão aprovada. Registra o que foi formalizado, o que permanece pendente e por qual instrumento. |
| Relacionadas | Playbook §1.1 (INV-3), §11, §15.1 e §15.2 · Anexo Técnico I §1, §2, §6 e §7 · Plano Diretor §8 e §10 · Ordem Oficial S0 §2.1, §2.2, §4 e §5 · ADR-0001 · ADR-0004 · ADR-0005 · NCN-01 · NCN-02 |
| Instrumento | NCN-01 §4: colisões e conciliações futuras são trazidas a nova NCN, "nunca resolvidas por inferência (Playbook IA-9)". |

## 1. Decisões homologadas

| # | Decisão | Conteúdo aprovado |
| --- | --- | --- |
| **I** | Escopo do B-03 | **A2** — somente as rotas necessárias para colocar os módulos existentes do artefato em operação fora do runtime de demonstração |
| **I** | `SYSTEM_ANALISE` | **B1** — rota própria. Vedado absorver em `/ai/chat`; vedado retirar do critério dos seis módulos |
| **I** | Marco | **C1** — B-03 **completo** na Sprint 0; deixa de ser entregável da Sprint 1; não há B-03 parcialmente iniciado |
| **II** | Provedor · modelo · busca web | **Anthropic** · **`claude-sonnet-4-6`** · **E1**, busca web pelo mecanismo integrado do provedor, sem provedor separado |
| **III** | Infraestrutura | **F1** — Supabase confirmado como plataforma de execução; o gateway é **Supabase Edge Function** |
| **IV** | Acesso | **G1** — antecipar **somente o mecanismo mínimo** de autenticação/autorização das rotas do B-03; não antecipar o B-05 integral, nem banco ou multi-tenant além do estritamente necessário |
| **V** | INV-3 / ESLint | **H3** — substituir o mecanismo de detecção de literal de host por mecanismo de enforcement coerente com a norma. Não mascarar a violação; não remover a proteção para o CI passar |

## 2. O que foi formalizado neste ato

| Decisão | Instrumento | Fundamento do instrumento |
| --- | --- | --- |
| II e III | **ADR-0004** | Playbook §15.1: "introduz dependência externa nova"; "toca a fronteira determinístico × IA"; "tem custo recorrente relevante em infraestrutura ou IA" |
| I e IV | **ADR-0005** | Playbook §15.1: "afeta autenticação, autorização, RLS ou retenção de dado". Supersede a **ADR-0001 §8** quanto à sprint do BFF — Playbook §15.2: "ADR não se edita: substitui-se por outro que o supersede" |

## 3. D-V — INV-3: a norma permanece, o mecanismo muda

**A norma não é alterada.** Permanece, na íntegra e sem exceção:

> **INV-3 — "Nenhuma chamada a provedor de IA fora de `ai-gateway`."** (Playbook §1.1)

E permanece o princípio que ela detalha:

> "**O cliente nunca fala com provedor de IA. Só com o BFF.**" (Anexo Técnico I §1, princípio 1)

**O que muda é exclusivamente o mecanismo de verificação**, registrado nos três estados:

| Estado | Conteúdo | Situação |
| --- | --- | --- |
| **Verificação declarada** | Playbook §1.1, coluna "Verificação": **"Lint de importação"** | **Insuficiente para a própria norma.** Verificado por execução: o artefato tem um único `import` — `react` (l.3) — e chama o provedor por `fetch` global (l.140, l.151). Um lint de importação **não** detecta essa chamada |
| **Mecanismo vigente** | Regra de literal de host em `eslint.config.mjs`, introduzida em S0-I | **Mecanismo adicional além do declarado.** Detecta a chamada real, mas por endereço, não pela norma |
| **Mecanismo decidido (H3)** | Enforcement coerente com a regra normativa real | **A implementar em etapa própria e autorizada.** Não implementado por esta NCN |

**Registro da Alternativa D.** Em deliberação anterior o fundador adotou a Alternativa D, segundo a qual
a regra de literal de host "não deve ser tratada como requisito normativo independente". Essa adoção
**nunca havia sido formalmente registrada**. Fica registrada aqui, e **superada pela Decisão V**: a
regra de literal de host não é requisito normativo autônomo, e será substituída por mecanismo que
verifique a norma — não removida.

**Efeito imediato:** nenhum. `eslint.config.mjs` **não foi alterado** neste ato. Até a substituição, o
mecanismo vigente permanece ativo, e a consequência já apurada permanece: a migração das linhas 140 e
151 para fora de `ai-gateway` reprova o CI, e portanto o critério A1.

## 4. Pendências de formalização — atos que esta nota **não** executa

Os atos abaixo recaem sobre documentos cujo rito o Playbook §15.2 atribui a revisão versionada, e que
**não podem ser praticados por ADR nem por NCN**. Sem eles, **a implementação do B-03 não está
autorizada**.

| # | Ato pendente | Documento | Rito exigido | Origem |
| --- | --- | --- | --- | --- |
| **P-1** | Sequenciamento: B-03 sai da Sprint 1 e passa à Sprint 0 | **Plano Diretor §10** | "Mudança de arquitetura-alvo, de prioridade estratégica ou **de sequenciamento** → Revisão versionada. Documento aprovado não se altera em silêncio." | Decisão I (marco) |
| **P-2** | Recomposição do escopo da Sprint 1, que fica sem entregável declarado | **Plano Diretor §10** | Idem | Consequência de P-1 |
| **P-3** | Contrato, designação e papel mínimo da nova rota de `SYSTEM_ANALISE` | **Anexo Técnico I §1 e §2** | "**Novo contrato de API**, papel, ambiente ou modelo de custo → Novo anexo ou revisão do existente." | Decisão I (`SYSTEM_ANALISE` = B1) |
| **P-4** | Retirar "BFF, AI Gateway" do rol de fora de escopo; incluir o novo item; atualizar a árvore de arquivos e o critério de aceite | **Ordem Oficial S0 §2.1, §2.2, §4 e §5** | Revisão da Ordem da sprint vigente | Decisões I e IV |
| **P-5** | Atualizar a coluna "Verificação" de INV-3, hoje "Lint de importação" | **Engineering Playbook §1.1** | "Nova convenção, novo limite, nova invariante → Nova versão do Playbook, com registro do que mudou." | Decisão V |
| **P-6** | Delimitar, no documento próprio, a fronteira entre o mínimo de autenticação antecipado e o B-05 | **Ordem Oficial S0** (escopo) | Revisão da Ordem | Decisão IV (G1) |

**Observação sobre P-3.** A nova rota é acréscimo à superfície de API do Anexo Técnico I, que hoje
enumera exatamente seis rotas `/ai/*`. A ADR-0005 fixou a *existência* e a *função* da rota; **a
designação e o contrato pertencem à revisão do Anexo**, e não foram inventados.

## 5. Lacuna de hierarquia — registrada, não resolvida

A hierarquia do Playbook §0 é literal:

> "Especificação LHI® > Plano Diretor > Anexo Técnico > Engineering Playbook > ADR. Conflito resolve-se
> sempre para cima. Nenhum documento inferior pode flexibilizar regra de documento superior; pode apenas
> detalhá-la."

**A Ordem Oficial de Execução não figura nessa enumeração.** Sem posto declarado, não é possível
determinar documentalmente se a Ordem está acima ou abaixo do Playbook.

Esta NCN **não atribui posto à Ordem**. Fazê-lo seria alterar a hierarquia do Playbook §0 — ato que,
pelo próprio §15.2, exige nova versão do Playbook, e que uma nota de conciliação não pode praticar. A
lacuna **permanece aberta** e é trazida a registro conforme a NCN-01 §4.

Registra-se que a questão **não bloqueia** as decisões desta NCN: nenhuma delas depende de resolver a
precedência entre Ordem e Playbook, porque em nenhuma há conflito entre esses dois documentos.

## 6. Aspectos jurídicos — remissão

A adoção do provedor de IA foi decidida pelo proprietário (ADR-0004 §2). Esta NCN **não declara
resolvido** nenhum fundamento jurídico e **não afirma conformidade**. Os aspectos jurídicos e
contratuais apontados pela Due Diligence — envio "a operador terceiro (API Anthropic) sem base legal
documentada, sem aviso, sem consentimento e sem contrato de tratamento visível" — devem ser tratados
antes da disponibilização real do processamento de dados, na medida em que o corpus o exigir. Ver
ADR-0004 §5.

## 7. Registros técnicos sem efeito normativo

Mantidos por continuidade com a NCN-02, Anexo A. **Não são decisões, não são critérios de aceite e não
bloqueiam etapa alguma.**

| ID | Registro | Situação |
| --- | --- | --- |
| R-04 | Divergência entre a tag local `artifact-baseline` (objeto `88701b4b`, tagger `Claude <noreply@anthropic.com>`) e a remota (objeto `23ad6733`, tagger `legalhealth`). Ambas anotadas; **ambas ancoram o mesmo commit `a3a07c8`** | Inócua quanto à âncora. **Não corrigida** — a tag não foi tocada |
| R-05 | Plano Diretor §8 exige, como critério de aceite de B-03, "custo por chamada registrado"; o Anexo Técnico I §6 declara "Instrumentação **desde a Sprint 4**" | Divergência de calendário. O Plano Diretor prevalece (Playbook §0). **Não conciliada por ato próprio** |
| R-06 | O Plano Diretor §7.1 lista "Provedor de busca web" como adaptador **distinto** do AI Gateway; a Decisão II (E1) atende a função pelo mecanismo integrado do provedor de IA, colapsando dois adaptadores em um | Registrado para ciência na revisão versionada do Plano Diretor. **Não altera a decisão** |

## 8. Efeito

A partir desta NCN, e sem alterar nenhum documento superior:

- as Decisões I a V do proprietário ficam registradas e rastreáveis;
- as Decisões II e III estão formalizadas pela ADR-0004; as Decisões I e IV, pela ADR-0005;
- a ADR-0001 §8 está superada quanto à sprint do BFF, e **CF-7 fica resolvido**: o marco do B-03 é a
  Sprint 0;
- **INV-3 permanece íntegra, sem exceção**; apenas seu mecanismo de verificação será substituído;
- as pendências **P-1 a P-6** condicionam a autorização da implementação;
- nenhuma implementação está autorizada por este ato.

Conciliações futuras seguem a regra da NCN-01 §4: nova NCN, nunca inferência (Playbook IA-9).
