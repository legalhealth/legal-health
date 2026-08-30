# Ata de Revisão — Plano Diretor 2.0 · P-1 e P-2

| Campo | Valor |
| --- | --- |
| **Fonte** | `docs/spec/Plano_Diretor_Legal_Health_2.0.pdf` — **registro original aprovado, não modificado** |
| Versão do documento-fonte | Plano Diretor Legal Health 2.0 · Versão 1.0 · 5 de agosto de 2026 |
| Natureza desta ata | **Ata de revisão por seção.** Não é transcrição do PDF. Registra exclusivamente as seções alteradas por decisão já tomada. |
| Rito aplicável | Playbook §15.2, Plano Diretor: "Mudança de arquitetura-alvo, de prioridade estratégica ou **de sequenciamento** → Revisão versionada. Documento aprovado não se altera em silêncio." |
| Pendências atendidas | **P-1** e **P-2** (NCN-03/2026 §4) |
| Data | 29 de agosto de 2026 |
| Relacionadas | ADR-0005 (D5.1, D5.3, D5.8) · NCN-03/2026 · Ordem de destravamento da Fase P |

> **Natureza preparatória e relação com o PDF original.** O PDF permanece o registro aprovado e **não
> foi modificado**. Esta ata **não altera o corpus e não possui eficácia normativa própria**: ela apenas
> **registra** a alteração já decidida pelo proprietário e **prepara** a revisão formal do
> documento-fonte. **O efeito normativo somente nascerá quando a revisão formal do Plano Diretor for
> efetivamente incorporada e aprovada pelo rito do Playbook §15.2** — "Revisão versionada. Documento
> aprovado não se altera em silêncio." Até lá, o Plano Diretor rege-se integralmente pelo PDF, inclusive
> nas seções aqui tratadas. Esta ata **não cria hierarquia normativa nova**.

> **Leitura das seções "Alteração".** Cada seção "Alteração" desta ata enuncia a redação
> **proposta para a revisão formal** do documento-fonte. Nenhuma delas descreve alteração já
> efetuada: o corpus permanece como está até que a revisão formal seja incorporada e aprovada.

> **Ressalva de fidelidade.** As seções alteradas são tabelas. A extração de texto disponível neste
> ambiente colapsa colunas de tabela. Onde reconstruo a leitura por coluna, isso está **assinalado como
> reconstrução**, e o PDF permanece a referência para conferência.

---

## P-1 — Parte 10, Fase I: retirada do B-03 da Sprint 1

### Seção

**Parte 10 — Roadmap Executivo por Sprints · Fase I — Fundação e conformidade (Sprints 0–3)**, linha da
**Sprint 1**.

### Texto original relevante

Cabeçalho da tabela, literal:

> `Sprint | Objetivo | Entregáveis | Módulos afetados | Critérios de aceite | Riscos`

Linha da Sprint 1 — texto literal extraído, com as colunas colapsadas pela extração:

> `1Tornar o produto implantávelB-03 (AI Gateway)6 módulos de IA;Zero credencial no cliente;Custo de IA sem limite`
> `promptsIA operante fora do runtimedefinido — mitigar com quota`
> `de demonstraçãodesde o dia 1`

Leitura por coluna — **reconstrução**, a conferir no PDF:

| Sprint | Objetivo | Entregáveis | Módulos afetados | Critérios de aceite | Riscos |
| --- | --- | --- | --- | --- | --- |
| 1 | Tornar o produto implantável | **B-03 (AI Gateway)** | 6 módulos de IA; prompts | Zero credencial no cliente; IA operante fora do runtime de demonstração | Custo de IA sem limite definido — mitigar com quota desde o dia 1 |

### Alteração

**O item `B-03 (AI Gateway)` deixa de constar como entregável da Sprint 1.**

O B-03 passa a ser entregável da **Sprint 0**, de forma **completa**, conforme a ADR-0005 (D5.1 e D5.2).
A linha da Sprint 0 passa a ler-se, na coluna "Entregáveis": **`B-01, B-02, B-03`**.

Para referência, a linha da Sprint 0 no original — texto literal extraído, colunas colapsadas:

> `0Existir como projetoB-01, B-02Todos (migração);Build reproduzível nas 3Atrito de migração do`
> `correções pontuaisplataformas; 6 defeitosambiente artifact para Expo`
> `triviais eliminados`

**Não são alterados**, na linha da Sprint 0: o objetivo ("Existir como projeto"), os módulos afetados,
os critérios de aceite ("Build reproduzível nas 3 plataformas; 6 defeitos triviais eliminados") nem os
riscos. O acréscimo é exclusivamente do identificador `B-03` à coluna "Entregáveis".

**Não é alterado** o item **B-03 na Parte 8** (backlog): objetivo, prioridade P0, impacto, dependência
B-01, esforço M, risco Médio e critério de aceite — "Zero credencial no bundle; 6 módulos operam fora do
runtime de demonstração; custo por chamada registrado" — permanecem **exatamente como no PDF**.

### Fundamento

Decisão I do proprietário, marco **C1**: *"B-03 será COMPLETO na Sprint 0. […] B-03 deixa de ser
entregável da Sprint 1."* Formalizada na **ADR-0005**, dispositivos D5.1, D5.2 e D5.3.

Fundamento material registrado na ADR-0005 §3: o Plano Diretor, Parte 8, declara a única dependência de
B-03 como **B-01** — "Projeto Expo versionado, com build e CI" —, que é entregável da própria Sprint 0 e
já se encontra satisfeito. A antecipação é coerente com o grafo de dependências do próprio documento.

### Identificação da origem

**Esta alteração decorre de decisão já tomada pelo proprietário** (Decisão I, marco C1), formalizada na
ADR-0005 e registrada na NCN-03/2026 §1. **Não é conclusão do executor** nem inferência a partir do
texto do Plano Diretor.

---

## P-2 — Parte 10, Fase I: situação da Sprint 1 após a antecipação

### Seção

**Parte 10 — Roadmap Executivo por Sprints · Fase I**, linha da **Sprint 1**.

### Texto original relevante

A Sprint 1 tem, no PDF, **um único entregável declarado**: `B-03 (AI Gateway)`. Retirado esse item por
força de P-1, a coluna "Entregáveis" da Sprint 1 fica vazia.

### Alteração

A **Sprint 1 permanece no roadmap, sem entregável declarado neste momento**, nos seguintes termos:

- **Entregáveis:** *nenhum entregável declarado.* O único que constava — B-03 — foi **antecipado para a
  Sprint 0** (P-1). A ausência de entregável é **consequência do ato aprovado**, não escolha
  independente: vedadas a invenção e a redistribuição, nada resta a declarar.
- **Objetivo, critérios de aceite e riscos da linha da Sprint 1:** **não são objeto desta ata.** A
  decisão aprovada alcançou exclusivamente o **entregável**. Esta ata **não transfere, não realoca e não
  reatribui** a outra sprint o objetivo declarado ("Tornar o produto implantável"), os critérios de
  aceite ("Zero credencial no cliente; IA operante fora do runtime de demonstração") nem os riscos
  ("Custo de IA sem limite definido — mitigar com quota desde o dia 1") que constam da linha da
  Sprint 1. **O destino dessas três células permanece matéria da revisão formal do Plano Diretor e da
  decisão do proprietário.**

**Delimitações expressas:**

1. **Nenhum entregável novo foi criado.**
2. **Nenhum item de outra sprint foi redistribuído** para a Sprint 1.
3. **Não há renumeração.** As **Sprints 2 e 3** conservam numeração, objetivo, entregáveis, módulos
   afetados, critérios de aceite e riscos **exatamente como no PDF**. O Portão I e as Fases II, III e IV
   permanecem inalterados.
4. A Sprint 1 **não é suprimida** do roadmap: fica registrada como **encurtada/absorvida**, sem
   entregável próprio.

### Fundamento

Ordem de destravamento da Fase P, expressa:

> "Após a retirada de B-03 da Sprint 1, **não inventar ou redistribuir outro entregável**. Formalizar a
> Sprint 1 como **encurtada/absorvida**, caso essa seja a consequência estrutural necessária, preservando
> as demais sprints exatamente como definidas pelo corpus."

E, na confirmação da matriz:

> "Sprint 1: permanece **sem entregável próprio, sem renumeração das Sprints 2 e 3**. Registre
> explicitamente que o B-03 foi antecipado e que a Sprint 1 fica sem entregável declarado neste momento.
> **Não invente ou redistribua qualquer outro item.**"

**Consequência estrutural verificada:** a Sprint 1 possuía exatamente um entregável (B-03). Retirado
ele, e vedadas a invenção e a redistribuição, a ausência de entregável é a única leitura possível.

### Identificação da origem

**Esta alteração decorre de decisão já tomada pelo proprietário**, registrada na NCN-03/2026 §1 e na
ordem de destravamento da Fase P. **Não é conclusão do executor.**

O preenchimento futuro da Sprint 1 — se houver — **permanece decisão do proprietário** e não é objeto
desta ata.

---

## E1 — Parte 7.1: adaptador "Provedor de busca web"

> **Nota de escopo.** Esta seção **não integra P-1 nem P-2** — trata da Parte 7.1, não da Parte 10. Foi
> acrescida por instrução expressa do proprietário (item 5 da ordem de ajustes), para que a arquitetura
> declarada não permaneça contraditória com decisão já formalizada. **Nenhuma decisão nova é tomada
> aqui.**

### Seção

**Parte 7.1 — Princípio organizador**, bloco **INFRAESTRUTURA (adaptadores)** do diagrama de camadas.

### Texto original relevante

O bloco INFRAESTRUTURA relaciona, entre seus adaptadores, duas entradas distintas — literal:

> `AI Gateway (Edge Function)`
> `Provedor de busca web`

### Alteração

Registra-se que o adaptador **"Provedor de busca web"** é, **neste momento**, materializado pela
**capacidade de busca web integrada ao provedor de IA adotado**, acessada exclusivamente através do AI
Gateway — e **não** por fornecedor distinto.

**Delimitações expressas:**

1. **Nenhum nome de serviço é introduzido.** O provedor de IA adotado é o da ADR-0004 (D4.1); nenhum
   segundo fornecedor é nomeado ou criado.
2. **O adaptador não é suprimido da arquitetura.** Permanece como posição arquitetural do diagrama; o
   que se registra é **por que meio ele está preenchido neste momento**. A decisão formalizada foi "não
   adotar provedor de busca web separado **neste momento**" (ADR-0004, D4.3) — o que não veda que venha
   a sê-lo.
3. **O escopo funcional de `/ai/research` não é alterado.** Permanece "Jurisprudência e jurimetria.
   Cache obrigatório por consulta normalizada", nos termos do Anexo Técnico I, Parte 1.
4. **Nada mais da Parte 7 é alterado.** Os demais adaptadores, as quatro camadas, o princípio de
   dependência unidirecional e a Parte 7.2 permanecem exatamente como no PDF.

### Fundamento

**ADR-0004, D4.3** — decisão já formalizada:

> "A capacidade de busca web é atendida pelo **mecanismo integrado do próprio provedor de IA**. **Não se
> adota provedor de busca web separado neste momento.**"

Fundamento material registrado na ADR-0004 §3: o artefato auditado não emprega provedor de busca
distinto — `callClaudeSearch` utiliza a ferramenta embutida do próprio provedor, declarada no campo
`tools` da requisição.

### Identificação da origem

**Decorre de decisão já tomada pelo proprietário** (Decisão II, item busca web — **E1**), formalizada na
ADR-0004, D4.3. **Não é conclusão do executor** nem decisão nova.

---

## Efeito consolidado — *após a revisão formal, não a partir desta ata*

| Sprint | Antes (PDF) | Após a revisão formal |
| --- | --- | --- |
| **0** | B-01, B-02 | **B-01, B-02, B-03** |
| **1** | B-03 (AI Gateway) | **sem entregável declarado.** Objetivo, critérios de aceite e riscos da linha: **não tratados por esta ata** |
| **2** | B-04, B-14 (parcial) | **inalterada** |
| **3** | B-05, B-12, B-11 | **inalterada** |
| Fases II, III, IV · Portão I | — | **inalteradas** |

**Não alterados por esta ata:** Parte 8 (backlog B-01..B-24, incluindo o item B-03 e seu critério de
aceite), Parte 7 (arquitetura-alvo), Parte 9 (estratégia de refatoração), Partes 1 a 6 e qualquer outra
seção do Plano Diretor.
