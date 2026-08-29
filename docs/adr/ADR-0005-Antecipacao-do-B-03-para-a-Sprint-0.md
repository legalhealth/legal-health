# ADR-0005 — Antecipação do B-03 para a Sprint 0 e Regime Mínimo de Autenticação

| Campo | Valor |
| --- | --- |
| Identificador | ADR-0005 |
| Título | Antecipação do AI Gateway (B-03) para a Sprint 0, escopo de entrega e regime mínimo de autenticação |
| Status | **ACEITA** — Decisões I (escopo, `SYSTEM_ANALISE`, marco) e IV (acesso) do proprietário, 2026-08-29 |
| Decisor | Fundador (Igor de Lima Salomão) |
| Supersede | **ADR-0001, seção 8, quanto à sprint do BFF/AI Gateway** |
| Superseded by | — |
| Relacionadas | Plano Diretor §8 (B-03), §10 (Fase I) · Anexo Técnico I §1 e §2 · Ordem Oficial S0 §2.1, §2.2, §4 e §5 · Playbook §15.1 · ADR-0004 · NCN-03 |
| Gatilho de obrigatoriedade | Playbook §15.1: "afeta autenticação, autorização, RLS ou retenção de dado"; "introduz dependência externa nova" |

## 1. Contexto

O corpus continha um impasse de execução na Sprint 0, apurado em auditoria e escalado ao fundador:

- **Ordem §2.1 (S0-D)** ordena migrar o artefato "com paridade visual e funcional integral";
- **Ordem §2.1 (S0-I)** ordena "regra automatizada que falha o build ao violar INV-1 e **INV-3**";
- **Ordem §2.2** proíbe construir o gateway: "Nenhum item abaixo pode ser implementado nesta sprint […]
  BFF, AI Gateway, retirada dos prompts do cliente — Sprint 4."

O artefato contém, nas linhas 140 e 151, chamadas diretas a provedor de IA. **INV-3** (Playbook §1.1)
proíbe "qualquer chamada a provedor de IA fora de `ai-gateway`", e essa invariante detalha o princípio 1
do **Anexo Técnico I §1** — "O cliente nunca fala com provedor de IA. Só com o BFF" —, documento de
nível 3. As três determinações da Ordem, somadas, não deixavam destino conforme para essas chamadas, e
o corpus não contém mecanismo geral de exceção.

Acresce a divergência registrada como **CF-7**: o Plano Diretor §10 situa B-03 na **Sprint 1**
("1 | Tornar o produto implantável | B-03 (AI Gateway)"), enquanto a Ordem §2.2 e a ADR-0001 §8 o
situam na **Sprint 4**.

O fundador optou por **eliminar o impasse pela antecipação do gateway**, e não por exceção à invariante.

## 2. Decisão adotada

- **D5.1 — Antecipação.** O **B-03 é antecipado para a Sprint 0**.
- **D5.2 — Completude.** O B-03 é **completo na Sprint 0**. Não existe "B-03 parcialmente iniciado" com
  conclusão posterior. O critério de aceite do Plano Diretor §8 aplica-se integralmente e de uma só vez.
- **D5.3 — Exclusividade de sprint.** A partir desta ADR, **o B-03 deixa de ser entregável da Sprint 1**.
  É vedado que o mesmo item figure simultaneamente em duas sprints (NCN-01 §4).
- **D5.4 — Escopo.** O B-03 entrega **somente as rotas necessárias para colocar os módulos existentes do
  artefato em operação fora do runtime de demonstração**. As rotas `/ai/explain-item` e `/ai/draft-action`
  **não são antecipadas** pelo só fato de constarem do Anexo Técnico I §1: permanecem condicionadas às
  dependências já identificadas — respectivamente o Registro de Riscos (B-08) e o plano determinístico
  (B-09).
- **D5.5 — Critério dos seis módulos.** O critério de aceite do Plano Diretor §8 — **"6 módulos operam
  fora do runtime de demonstração"** — **permanece vigente e íntegro**. Não é reduzido, reinterpretado
  nem parcialmente dispensado.
- **D5.6 — `SYSTEM_ANALISE`.** O sexto módulo (`SYSTEM_ANALISE`, artefato l.212; aba "🔎 Análise de
  risco", l.989; componente `AnaliseRisco`, l.783) recebe **rota própria**. É **vedado** absorvê-lo em
  `/ai/chat` e é **vedado** retirá-lo do critério dos seis módulos.
- **D5.7 — Regime mínimo de autenticação.** É antecipado **exclusivamente o mecanismo mínimo de
  autenticação e autorização necessário para que as rotas do B-03 cumpram os papéis mínimos já definidos
  no Anexo Técnico I §1 e a matriz do §2**. Delimitação expressa: **não** se antecipa o B-05 integral,
  nem banco, persistência ou multi-tenant além do estritamente necessário a essa autenticação e
  autorização.
- **D5.8 — CF-7.** Fica resolvida a divergência: **o marco do B-03 é a Sprint 0**, por antecipação, e
  não a Sprint 1 (Plano Diretor §10) nem a Sprint 4 (Ordem §2.2 e ADR-0001 §8). Esta ADR **supersede a
  ADR-0001 §8 quanto à sprint do BFF/AI Gateway**, mantendo íntegro todo o restante daquela ADR.

## 3. Justificativa

**Quanto à antecipação (D5.1).** O Plano Diretor §8 declara a única dependência de B-03 como **B-01** —
"Projeto Expo versionado, com build e CI" —, que é o entregável da própria Sprint 0 e já se encontra
satisfeito (S0-B e S0-C, com CI verde no tronco). A antecipação é, portanto, coerente com o grafo de
dependências do próprio Plano Diretor, e desloca o item em uma sprint a partir da posição que o
documento superior já lhe atribuía.

**Quanto à preferência pela antecipação em vez da exceção.** INV-3 detalha o Anexo Técnico I §1, de
nível 3; o Playbook §1.1 intitula sua seção "Invariantes — regras que nenhuma revisão pode aprovar
violação"; e o corpus não contém mecanismo geral de exceção (verificado: zero ocorrências de "waiver" e
"transitório"; as ocorrências de "exceção" são proibitivas). A antecipação resolve o impasse **sem abrir
o primeiro precedente de exceção a uma invariante**.

**Quanto ao escopo (D5.4).** `/ai/explain-item` "fundamenta-se no Registro" e `/ai/draft-action` recebe
"ação já priorizada" (Anexo I §1). Ambos os insumos nascem em sprints posteriores — B-08 e B-09,
conforme o Plano Diretor §10, Fase II. Antecipá-las exigiria antecipar duas sprints da Fase II ou
inventar seus insumos.

**Quanto a `SYSTEM_ANALISE` (D5.6).** O módulo é uma das seis abas da tela `inteligencia` e a metade de
origem da única integração módulo-a-módulo do artefato (`onUsarNoRedator`, l.818 → l.1018–1026), que o
Plano Diretor §1 manda **"Preservar como padrão"**, citando a l.1023. Absorvê-lo em `/ai/chat`
contrariaria a delimitação literal daquela rota — "Escopado a lacuna, risco ou ação" —, já que
`AnaliseRisco` opera sobre "texto de uma intimação, citação, notificação, reclamação ou relato de caso".
Retirá-lo do critério descumpriria o "6 módulos" do Plano Diretor §8.

**Quanto ao regime mínimo (D5.7).** O Anexo Técnico I §1 atribui papel mínimo a cada rota `/ai/*` e o §2
fixa a matriz de cinco papéis. Operar as rotas sem verificar papel descumpriria documento de nível 3 e o
princípio E8 do Playbook ("Negar por padrão, permitir por exceção"). O mecanismo é o já nomeado pelo
Plano Diretor §7.1 — **Supabase Auth**. A antecipação é deliberadamente **mínima**: destina-se a tornar
as rotas conformes, não a antecipar o B-05.

## 4. Alcance e limites desta decisão

Esta ADR **não implementa nada**. Nenhum código, diretório `apps/api`, endpoint, função, autenticação ou
migração é criado por ela.

**Esta ADR não substitui, e não pode substituir, os atos que o Playbook §15.2 atribui a documentos
superiores.** Em particular, permanecem **pendentes de execução pelo fundador**, e sem eles a
implementação não está autorizada:

| Ato pendente | Documento | Rito exigido (Playbook §15.2) |
| --- | --- | --- |
| Sequenciamento: B-03 sai da Sprint 1 e passa à Sprint 0 | **Plano Diretor §10** | "Revisão versionada. Documento aprovado não se altera em silêncio." |
| Contrato da nova rota de `SYSTEM_ANALISE`, com papel mínimo | **Anexo Técnico I §1 e §2** | "Novo contrato de API, papel, ambiente ou modelo de custo → Novo anexo ou revisão do existente." |
| Retirada do gateway do rol de fora de escopo; novo item, árvore e critério de aceite | **Ordem Oficial S0 §2.1, §2.2, §4 e §5** | Revisão da Ordem da sprint vigente |

Estas pendências estão registradas na **NCN-03/2026**.

**Sobre a designação da nova rota.** Esta ADR fixa a *existência* e a *função* da rota — atender
`SYSTEM_ANALISE`, cujo prompt (l.212) recebe "o texto de uma intimação, citação, notificação, reclamação
ou relato de caso" e produz "análise estratégica estruturada". **A designação, o contrato e o papel
mínimo são fixados pela revisão do Anexo Técnico I**, instrumento próprio segundo o Playbook §15.2. Esta
ADR **não os inventa**.

## 5. Consequências

- O impasse de execução da Sprint 0 é eliminado **sem exceção a invariante**: as chamadas das linhas 140
  e 151 passam a ter destino lícito dentro de `ai-gateway`.
- **PR-01** — "Camada de IA inoperante fora do runtime […] 6 módulos mortos em qualquer deploy",
  classificado P0 pela Due Diligence — é eliminado na Sprint 0.
- A Sprint 0 recebe um item adicional, de esforço **M** e risco **Médio** conforme o Plano Diretor §8.
- A Sprint 1 fica sem o seu único entregável declarado no Plano Diretor §10. **A recomposição do escopo
  da Sprint 1 é matéria da revisão versionada do Plano Diretor** e não é decidida aqui.
- A superfície `/ai/*` da Sprint 0 passa a ter uma rota a mais que as seis do Anexo Técnico I §1, o que
  torna a revisão daquele documento condição da implementação.
- INV-3 permanece **integralmente vigente**, sem exceção, prazo ou flexibilização.

## 6. Critérios de revisão futura

Esta decisão vigora até que se verifique: (1) impossibilidade técnica de concluir o B-03 dentro da
Sprint 0, hipótese em que a completude exigida por D5.2 obriga a reabrir o marco por nova ADR — jamais
por conclusão parcial silenciosa; (2) alteração do critério de aceite do B-03, que é matéria do Plano
Diretor §8 e exige revisão versionada daquele documento; (3) alteração do regime de autenticação além do
mínimo de D5.7, que reabre a fronteira com o B-05. ADR não se edita: a revisão exige nova ADR que
expressamente supersede esta (Playbook §15.2).
