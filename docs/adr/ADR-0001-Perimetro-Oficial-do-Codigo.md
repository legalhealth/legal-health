# ADR-0001 — Perímetro Oficial do Código

> Transcrição fiel do registro aceito (`ADR-0001-Perimetro-Oficial-do-Codigo.pdf`, neste diretório).
> O PDF é o registro original; esta transcrição acrescenta apenas o preenchimento de campos que a
> decisão deixou em aberto, cada um com atribuição explícita e sem alterar dispositivo algum:
> o endereço do repositório em **D6.1** (Termo de Decisão T-00, decisão (a), 2026-08-05) e a âncora
> da tag em **D7** (decisão D-04 do fundador, 2026-08-23; ver NCN-02/2026).

| Campo | Valor |
| --- | --- |
| Identificador | ADR-0001 |
| Título | Perímetro Oficial do Código — Fonte Única de Verdade |
| Status | **ACEITA** |
| Cenário adotado | A — Repositório oficial existente |
| Data da proposta | 5 de agosto de 2026 |
| Data da aceitação | 5 de agosto de 2026 — Decisão Executiva do fundador |
| Autor | CTO / Principal Software Architect / Engineering Governance Lead |
| Decisor | Fundador (Igor de Lima Salomão) |
| Supersede | — |
| Superseded by | — |
| Relacionadas | Gate Review Sprint 0 (Restrição R1) · Ordem Oficial de Execução Sprint 0 (S0-A) |

## 1. Contexto

A Due Diligence Técnica (Etapa 1) auditou um único artefato: um arquivo JSX de 1.604 linhas contendo
integralmente o componente `LegalHealthApp` e todos os seus módulos. O relatório declarou que não foi
possível comprovar a existência de repositório, projeto Expo, instância Supabase, pipeline de build ou
qualquer infraestrutura fora desse arquivo.

A pergunta — existe código oficial fora do artefato auditado? — foi formulada três vezes: item nº 1 da
investigação da Etapa 2 da Due Diligence, seção 7 do Anexo Técnico I e Restrição R1 do Gate Review.
O Gate Review de 5 de agosto de 2026 classificou a questão como Restrição R1, único item ❌ NO-GO da
matriz (NO-GO de item, não de sprint). Em 5 de agosto de 2026 o fundador respondeu formalmente,
adotando o Cenário A.

Elementos factuais registrados: (i) o artefato refere Supabase e Expo em tempo futuro (l.474 e l.1488)
— intenção declarada, não integração; (ii) existe especificação técnica prévia para conversão a
Expo/React Native/Supabase; (iii) as chamadas à API de IA (l.140 e l.151) operam sem credencial,
funcionando só no runtime de demonstração (PR-01).

## 2. Problema

Sem perímetro declarado e único, três classes de falha de reversão cara: (1) divergência de bases;
(2) correção aplicada à base errada — os itens de saneamento da Sprint 0 eliminam riscos de gravidade
máxima e precisam atingir a base que evolui; (3) perda de rastreabilidade, contradição direta do
posicionamento de auditabilidade. Fator agravante: o runtime de demonstração cria incentivo estrutural
recorrente a "testar rapidamente no artefato" — o mecanismo pelo qual fontes paralelas nascem.

## 3. Alternativas consideradas

- **A1 — Manter o artefato como base e migrar depois.** Rejeitada: perpetua PR-01, mantém o monólito,
  inviabiliza CI, testes e verificação das oito invariantes; adia a fundação sem benefício.
- **A2 — Repositório oficial + artefato como prototipagem paralela autorizada.** Rejeitada: definição
  literal de duas fontes de verdade; o custo é diferido e maior.
- **A3 — Múltiplos repositórios por camada.** Rejeitada: custo de coordenação desproporcional à
  capacidade (Plano Diretor 0.2). O monorepo do Playbook §2 entrega o isolamento com lint de
  dependência. Separação futura permanece possível (licenciamento do `@lh/core`).
- **A4 — Repositório único e oficial, em monorepo, fonte exclusiva de verdade.** **Adotada.**

## 4. Decisão adotada

- **D1.** Existe exatamente um repositório oficial da Legal Health — única fonte de verdade do código.
- **D2.** Todo desenvolvimento ocorre exclusivamente nesse repositório, sem exceção por urgência,
  tamanho ou conveniência de ferramenta.
- **D3.** É proibida a criação de projetos, repositórios, forks de desenvolvimento ou bases alternativas
  sem autorização formal registrada em nova ADR que supersede esta.
- **D4.** Protótipos, experimentos e artefatos externos não substituem nem competem com o repositório
  oficial: não são fonte de implementação, não recebem correção destinada ao produto e não fundamentam
  decisão técnica, salvo autorização formal por ADR.
- **D5.** Toda contribuição respeita integralmente o corpus normativo: Especificação Oficial do LHI v1.0,
  Due Diligence Técnica, Plano Diretor 2.0, Anexo Técnico I, Engineering Playbook v1.0 e a Ordem Oficial
  de Execução da sprint vigente.
- **D6 — Instanciação: Cenário A.** O repositório atual é reconhecido como a única fonte oficial de
  verdade. O artefato auditado passa a integrá-lo como base da refatoração incremental.
- **D6.1 — Identificação do repositório.** O endereço do repositório oficial é
  **<https://github.com/legalhealth/legal-health>** (identificador interno: `legalhealth/legal-health`).
  *Campo preenchido por homologação do fundador — Termo de Decisão T-00, decisão (a), 2026-08-05.*
- **D6.2 — Regra de reconciliação repositório × artefato** (aplicada sem exercício de julgamento):
  | Conteúdo encontrado no repositório | Ação obrigatória |
  | --- | --- |
  | Vazio, ou apenas esqueleto e documentação | O artefato é a base. Prosseguir conforme a Ordem Oficial. |
  | Código equivalente ao artefato auditado | Usar o código do repositório; verificar paridade contra `artifact-baseline`; registrar diferenças. |
  | Código que diverge materialmente | **PARAR E ESCALAR** (regras IA-1 e IA-9). Nova questão de perímetro; exige ADR complementar. |
  *Registro de aplicação (Sprint 0):* o reconhecimento de 2026-08-05 verificou que o repositório continha
  apenas documentação e o próprio artefato — primeira linha da tabela. O artefato é a base.
- **D7.** O artefato auditado é preservado sob a tag `artifact-baseline` no repositório oficial, como
  referência histórica de paridade (critério A2; checklist C16).
  **A tag ancora o commit `a3a07c83f5716878300864751ee63a4a8147a189`**, no qual o artefato passa a
  existir em `docs/artifact-baseline/codigo-mvp-lh.jsx.txt` (blob
  `9bc2af8c4dd20f6f11b8273219b89eb80fcda8f0`, idêntico ao do estado original `29f890b`).
  Fundamento: leitura literal da Ordem Oficial §8.4 — artefato "mantido em `docs/`" e marcado "no
  primeiro commit" do marco da Sprint 0.
  *Âncora definida por homologação do fundador — decisão D-04, 2026-08-23. Ver NCN-02/2026 §4.*
- **D8.** A partir do primeiro commit, nenhuma alteração destinada ao produto ocorre fora do repositório
  oficial, sob nenhuma circunstância.

## 5. Justificativa técnica

Fonte única elimina uma classe inteira de defeitos (divergência deixa de ter onde ocorrer). A
rastreabilidade do código é pré-condição da rastreabilidade do produto (carimbos da Spec §12 e
re-scoring retroativo exigem histórico único e íntegro). As oito invariantes do Playbook §1.1 só são
verificáveis com base única em CI. O golden dataset (Anexo I §3) pressupõe linha única de código. A
governança exige um objeto sobre o qual ser exercida. O Cenário A preserva o trabalho já realizado,
observada a regra D6.2.

## 6. Consequências positivas

Eliminação estrutural de múltiplas fontes de verdade; histórico íntegro e auditável (condição da
certificação futura do motor); CI exequível com invariantes automatizadas; rollback confiável;
onboarding reduzido a um endereço; preservação do trabalho anterior; base preparada para separação
futura do `@lh/core` se o licenciamento a exigir.

## 7. Riscos mitigados

Divergência entre bases (R1 do Gate Review) · correção na base errada · duplicidade dentro do próprio
repositório (D6.2) · retrabalho integral da Sprint 0 · erosão silenciosa das invariantes · alteração
silenciosa da metodologia · impossibilidade de certificação do motor · retorno ao acoplamento com o
runtime de demonstração (PR-01).

## 8. Impactos para as próximas sprints

Sprint 0: S0-A com conteúdo determinado (adotar o repositório existente; tag `artifact-baseline`
obrigatória). Sprint 1: extração do `@lh/core` e golden cases dependem de base única. Sprint 2:
catálogo versionado exige repositório para migrações e seeds. Sprint 3: auth, persistência e
multi-tenant sobre base única. Sprint 4: o BFF elimina PR-01 e retira os prompts do cliente; o artefato
original perde utilidade operacional remanescente. Sprints 5+: Registro de Riscos, evidências e trilha
de auditoria pressupõem histórico contínuo e íntegro.

## 9. Critérios de revisão futura

Esta decisão vigora até que se verifique: (1) licenciamento do `@lh/core` a terceiros exigindo
repositório e publicação independentes; (2) crescimento de equipe que torne ciclos de release por
camada vantajosos; (3) exigência contratual de instância isolada, segregação de código ou custódia de
fonte; (4) restrição regulatória ou de auditoria impondo separação física. Nenhuma dessas condições
autoriza base paralela: autorizam apenas nova ADR que supersede esta.

## Registro de aceitação

Em 5 de agosto de 2026, por Decisão Executiva do fundador, aprovada a ADR-0001 com status ACEITA,
Cenário A, e autorizado o início da Sprint 0, observados os documentos normativos integralmente.

## Nota de conciliação documental

A Ordem S0-J previa ADR-0001 de escopo "perímetro, stack e estrutura" e ADR-0002 "idioma do código".
Dada a precedência da questão de perímetro, a numeração fica: **ADR-0001** Perímetro Oficial do Código
(esta) · **ADR-0002** Stack e estrutura do monorepo · **ADR-0003** Idioma do código. Ajuste de
organização documental, sem alteração de escopo, critério de aceite ou decisão aprovada.
