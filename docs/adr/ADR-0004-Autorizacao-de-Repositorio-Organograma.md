# ADR-0004 — Autorização de Repositório Separado para o Sistema Organograma (Cabedelo/PB)

| Campo | Valor |
| --- | --- |
| Identificador | ADR-0004 |
| Título | Autorização de Repositório Separado para o Sistema Organograma — Delimitação do Perímetro da ADR-0001 |
| Status | **PROPOSTA** — aguardando Decisão Executiva do fundador |
| Data da proposta | 5 de novembro de 2026 |
| Autor | Engenharia (sessão Claude Code), a pedido do fundador |
| Decisor | Fundador (Igor de Lima Salomão) |
| Supersede | **ADR-0001 — Perímetro Oficial do Código** |
| Superseded by | — |
| Relacionadas | ADR-0001 (D3, §9) · ADR-0002 §2.1 · NCN-02/2026 · Prompt de Auditoria do Organograma v2 §16 |

> **Por que esta ADR existe.** A ADR-0001, **D3**, proíbe "a criação de projetos, repositórios, forks
> de desenvolvimento ou bases alternativas **sem autorização formal registrada em nova ADR que
> supersede esta**". A §9 acrescenta que nem mesmo as condições de revisão ali previstas autorizam base
> paralela: "autorizam apenas nova ADR que supersede esta". Logo, autorizar um repositório novo exige
> exatamente este instrumento. Esta ADR supersede a ADR-0001 **sem revogar nenhum de seus dispositivos**:
> D1 a D8 são reafirmados integralmente na §4.2, acrescidos apenas da delimitação de alcance e da
> autorização pontual da §4.3.

## 1. Contexto

O fundador determinou a construção de um sistema web de **auditoria diária do organograma do município
de Cabedelo/PB**: leitura do Diário Oficial municipal, acompanhamento da ocupação de cargos
comissionados e funções gratificadas, e comparação do ocupado com o quantitativo da Lei nº 2.275/2023.

A sessão de engenharia foi iniciada com o repositório `legalhealth/legal-health` anexado. Verificou-se
que esse repositório não contém qualquer referência ao Organograma, a Cabedelo ou a cargos
comissionados: ele é, conforme a ADR-0001 D6.1, o monorepo oficial do produto **Legal Health 2.0**.

A questão de perímetro foi levada ao fundador antes de qualquer linha de código, conforme a regra IA-9
do Playbook (não resolver colisão normativa por inferência). O fundador decidiu pelo repositório
separado com registro em ADR.

### 1.1 Elementos factuais apurados

1. **Divergência de produto.** O Organograma não é módulo, camada nem funcionalidade do Legal Health.
   Tem outro domínio (gestão de pessoal público municipal), outro usuário e outro ciclo de vida.
2. **Divergência de stack.** A ADR-0002 §2.1 homologou, pelo Termo T-00 (e), **monorepo Expo /
   React Native Web** para o Legal Health. O Organograma é especificado em **Next.js (App Router) +
   Supabase + Vercel**. São árvores de dependência, toolchains e alvos de build distintos.
3. **Divergência de regime de visibilidade — determinante.** O repositório `legalhealth/legal-health`
   é **público**. O Organograma trata **dados pessoais de servidores municipais** (nome, cargo,
   lotação) e seu documento normativo exige, de forma expressa, **repositório privado**, `/data` fora
   do versionamento e fixtures anonimizadas. Alojar o Organograma no monorepo atual implicaria
   publicar, ou manter sob risco permanente de publicação, dados pessoais de terceiros.

O item 3 é, por si só, suficiente: enquadra-se na condição (4) da §9 da ADR-0001 — "restrição
regulatória ou de auditoria impondo separação física" —, que a própria ADR-0001 reconhece como motivo
legítimo de nova ADR superseding.

## 2. Problema

A ADR-0001 foi redigida para extinguir a multiplicidade de fontes de verdade **do código do Legal
Health**. Sua D1 ("existe exatamente um repositório oficial da Legal Health") e sua D2 ("todo
desenvolvimento ocorre exclusivamente nesse repositório") não distinguem, no texto, entre
"desenvolvimento do produto Legal Health" e "desenvolvimento de qualquer software pela organização".

Dessa ambiguidade decorrem duas leituras, ambas indesejadas:

- **Leitura ampla:** nenhum software da organização pode nascer fora do monorepo — o que obrigaria a
  alojar ali um produto de outro domínio, outra stack e outro regime de sigilo, degradando justamente
  a fonte única que a ADR-0001 protege, e expondo dados pessoais em repositório público.
- **Leitura estrita sem registro:** criar o repositório novo "porque é outro produto" — o que viola a
  literalidade da D3 e reabre, por precedente, a porta das bases paralelas que a ADR-0001 fechou.

A saída correta não é escolher uma leitura: é **declarar o alcance** e **registrar a autorização**.

## 3. Alternativas consideradas

- **A1 — Organograma como `apps/organograma` no monorepo atual.** Rejeitada. Mistura dois produtos no
  repositório declarado fonte única de verdade de um deles; impõe convivência de Expo e Next.js na
  mesma árvore; e, decisivamente, colocaria dados pessoais de servidores em repositório **público**,
  contra exigência expressa do documento normativo do Organograma e contra a LGPD.
- **A2 — Tornar o monorepo privado e alojar o Organograma nele.** Rejeitada. Altera unilateralmente o
  regime de visibilidade de um produto por necessidade de outro, sem que o Legal Health tenha pedido;
  e mantém intactas as divergências de stack e de ciclo de vida.
- **A3 — Repositório novo sem ADR.** Rejeitada: viola a D3 literal e cria precedente de base paralela
  não registrada — exatamente a classe de falha que a ADR-0001 existe para impedir.
- **A4 — ADR superseding que delimita o alcance da ADR-0001 e autoriza um repositório privado
  específico para o Organograma.** **Adotada.**

## 4. Decisão adotada

### 4.1 Delimitação de alcance

- **D1'.** O perímetro instituído pela ADR-0001 é o perímetro do **produto Legal Health**. Suas regras
  alcançam todo código destinado ao Legal Health, e somente esse código.
- **D2'.** Produto distinto, com domínio, stack, usuários e ciclo de vida próprios, **não** integra
  esse perímetro e **não** é por ele regido — mas só pode existir mediante autorização expressa nesta
  ADR ou em ADR posterior, nominal e individualizada, nunca por analogia a esta.

### 4.2 Reafirmação integral da ADR-0001

As decisões **D1 a D8** da ADR-0001 permanecem **em pleno vigor, sem alteração de conteúdo**, lidas
com o alcance da §4.1 acima. Em especial e sem prejuízo das demais:

- há **exatamente um** repositório oficial do Legal Health — `legalhealth/legal-health` (D1, D6.1);
- **todo** desenvolvimento do Legal Health ocorre nele, sem exceção por urgência, tamanho ou
  conveniência de ferramenta (D2, D8);
- permanece **proibida** a criação de base alternativa **do Legal Health** sem nova ADR superseding (D3);
- protótipos e artefatos externos **não** são fonte de implementação do Legal Health (D4);
- o corpus normativo do Legal Health segue integralmente aplicável às suas contribuições (D5);
- a regra de reconciliação D6.2 e a tag `artifact-baseline` (D7) permanecem válidas e inalteradas.

### 4.3 Autorização

- **D3'.** Fica autorizada a criação de **um** repositório, **privado**, destinado exclusivamente ao
  Sistema de Auditoria do Organograma de Cabedelo/PB.
- **D3'.1 — Visibilidade.** O repositório é **privado desde a criação** e assim permanece. Tornar o
  repositório público exige nova ADR. Fundamento: tratamento de dados pessoais de servidores.
- **D3'.2 — Conteúdo vedado.** Não são versionados: planilhas e documentos de origem (`/data`), nomes
  ou e-mails de pessoas, segredos e credenciais. Fixtures de teste são anonimizadas.
- **D3'.3 — Fonte única do Organograma.** O repositório autorizado é, para o Organograma, a única
  fonte de verdade. As razões da ADR-0001 valem aqui com igual força: dentro do perímetro do
  Organograma, base paralela segue proibida.
- **D3'.4 — Não extensão.** Esta autorização é **específica e exaurível**: alcança o Organograma e
  nada mais. Não constitui precedente, não autoriza repositório para qualquer outro produto e não
  flexibiliza a D3 da ADR-0001 em nenhuma outra hipótese.
- **D3'.5 — Corpus normativo aplicável.** O Organograma **não** é regido pela Especificação Oficial do
  LHI, pelo Plano Diretor 2.0, pelo Anexo Técnico I nem pelas Ordens de Execução do Legal Health. Rege-se
  por seu próprio documento normativo e pelas ADRs que vier a produzir, em numeração própria.
- **D3'.6 — Identificação do repositório.** O endereço do repositório autorizado é
  **<https://github.com/igorsalomaoadv/SEAD>** (identificador: `igorsalomaoadv/SEAD`).
  *Campo preenchido por designação do fundador, 2026-11-05, à maneira da D6.1 da ADR-0001.*
  O repositório fica sob conta **externa à organização `legalhealth`**, o que reforça — e não
  apenas satisfaz — a separação de perímetros desta ADR.
- **D3'.7 — Verificações pendentes de homologação.** Antes do primeiro commit de produto, devem
  ser confirmados: (i) que o repositório é **privado** (D3'.1); (ii) que o `.gitignore` exclui
  `/data` e todo arquivo com dados pessoais (D3'.2); (iii) que a credencial de trabalho alcança
  o repositório. Nenhuma dessas verificações foi possível em 2026-11-05: a credencial do GitHub
  da sessão alcança apenas a organização `legalhealth`, e o acesso a `igorsalomaoadv/SEAD` foi
  recusado. **Enquanto a visibilidade privada não for confirmada, nenhum dado de servidor pode
  ser versionado.**

## 5. Justificativa técnica

A ADR-0001 protege uma propriedade: **para um dado produto, o código tem uma e apenas uma origem**.
Essa propriedade é preservada integralmente por esta ADR — e é preservada *melhor* com a separação do
que sem ela. Alojar dois produtos de stacks incompatíveis no mesmo monorepo não cria fonte única:
cria uma fonte com dois centros de gravidade, em que as oito invariantes do Playbook §1.1, o lint de
fronteira de dependência (INV-1/INV-3) e o CI passam a precisar distinguir, a cada execução, a qual
produto cada regra se aplica. O risco que a ADR-0001 combate — "correção aplicada à base errada" —
aumenta, não diminui, quando bases de produtos diferentes compartilham árvore.

A visibilidade decide o resto. O monorepo é público; o Organograma trata dados pessoais sob LGPD e
exige sigilo. Não há arranjo de diretórios que concilie as duas coisas com segurança: `.gitignore` é
uma convenção, não um controle de acesso, e um único commit distraído publica dados de servidores de
forma irreversível. A separação física é, aqui, o controle.

## 6. Consequências positivas

Perímetro do Legal Health preservado e agora **explícito** quanto ao alcance, eliminando a ambiguidade
que esta sessão encontrou · dados pessoais do Organograma fora de repositório público, por construção ·
CI, toolchain e invariantes de cada produto independentes e verificáveis · ciclos de release
desacoplados · histórico de cada produto íntegro e auditável · precedente **fechado** (D3'.4), de modo
que a autorização não erode a D3.

## 7. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| A autorização virar precedente para novas bases | D3'.4: específica, exaurível, sem analogia |
| Diluição da governança em dois repositórios | D3'.5: cada produto com corpus e numeração de ADR próprios |
| Vazamento de dados pessoais | D3'.1 e D3'.2: privado desde a criação, `/data` e nomes fora do versionamento |
| Duplicação de infraestrutura | Aceita conscientemente: as stacks já são distintas (Expo × Next.js) |
| Reaparecimento de base paralela no Organograma | D3'.3: fonte única também vale lá |

## 8. Impactos

**Legal Health:** nenhum impacto em sprint, escopo, critério de aceite ou decisão aprovada. Nenhum
dispositivo da ADR-0001 é revogado ou restringido; apenas se declara o alcance que sempre teve e se
registra uma autorização externa a ele. As ADR-0002, ADR-0003, NCN-01 e NCN-02 permanecem íntegras.

**Organograma:** fica desbloqueado o início da Fase 1 de seu plano, tão logo o repositório privado
exista e seu endereço seja homologado na D3'.6.

## 9. Critérios de revisão futura

Esta decisão deve ser revista se: (1) o Organograma passar a compartilhar código de produto com o
Legal Health, hipótese em que a extração de um pacote comum exige ADR própria em ambos os perímetros;
(2) o monorepo do Legal Health deixar de ser público, o que remove o fundamento determinante da §1.1
item 3 — sem, porém, remover os de stack e ciclo de vida; (3) surgir terceiro produto, que exigirá ADR
nominal própria, jamais a aplicação analógica desta.

## 10. Registro de aceitação

*A preencher pelo fundador.* Esta ADR só produz efeitos após Decisão Executiva registrada aqui. Até
lá, permanece **PROPOSTA**, e a D3 da ADR-0001 segue plenamente aplicável — nenhum repositório novo
deve ser criado antes da homologação.
