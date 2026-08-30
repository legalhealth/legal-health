# Ata de Revisão — Ordem Oficial de Execução da Sprint 0 · P-4 e P-6

| Campo | Valor |
| --- | --- |
| **Fonte** | `docs/sprints/sprint-0/Sprint_0_Ordem_Oficial_de_Execucao.pdf` — **registro original aprovado, não modificado** |
| Natureza desta ata | **Ata de revisão por seção.** Não é transcrição do PDF. Registra exclusivamente as seções alteradas por decisão já tomada. |
| Rito aplicável | Revisão da Ordem da sprint vigente |
| Pendências atendidas | **P-4** e **P-6** (NCN-03/2026 §4) |
| Data | 29 de agosto de 2026 |
| Relacionadas | ADR-0004 (D4.4) · ADR-0005 (D5.1, D5.4, D5.6, D5.7) · NCN-03/2026 · Ata de Revisão do Anexo Técnico I (P-3) |

> **Natureza preparatória e relação com o PDF original.** O PDF permanece o registro aprovado e **não
> foi modificado**. Esta ata **não altera o corpus e não possui eficácia normativa própria**: ela apenas
> **registra** as alterações já decididas pelo proprietário e **prepara** a revisão formal do
> documento-fonte. **O efeito normativo somente nascerá quando a revisão formal da Ordem Oficial for
> efetivamente incorporada e aprovada pelo rito correspondente.** Até lá, a Ordem rege-se integralmente
> pelo PDF — incluindo os itens S0-A a S0-K, o item S0-03, os critérios A1 a A12, a Definition of Done
> (§6), os testes obrigatórios (§7) e o checklist C01 a C20 — inclusive nas seções aqui tratadas. Esta
> ata **não cria hierarquia normativa nova**.

> **Leitura das seções "Alteração".** Cada seção "Alteração" desta ata enuncia a redação
> **proposta para a revisão formal** do documento-fonte. Nenhuma delas descreve alteração já
> efetuada: o corpus permanece como está até que a revisão formal seja incorporada e aprovada.

> **Ressalva de fidelidade.** As seções alteradas são tabelas e listas cujas colunas a extração deste
> ambiente colapsa. Onde reconstruo a leitura por coluna, isso está **assinalado como reconstrução**.

---

## P-4.a — §2.2: retirada do AI Gateway do rol de fora de escopo

### Seção

**§2.2 — Explicitamente fora do escopo.**

### Texto original relevante

Cabeçalho da seção, literal:

> "Nenhum item abaixo pode ser implementado nesta sprint, ainda que pareça trivial ou oportuno."

Item pertinente, literal:

> "**BFF, AI Gateway, retirada dos prompts do cliente — Sprint 4.**"

### Alteração

A revisão formal deverá substituir o item acima por:

> **Retirada dos prompts do cliente — Sprint 4.**
> *(O BFF / AI Gateway — item B-03 — foi antecipado para a Sprint 0 e deixa de figurar fora de escopo;
> ver ADR-0005, dispositivos D5.1 e D5.3.)*

**Delimitações expressas:**

1. **Somente o BFF / AI Gateway sai do rol.** A "retirada dos prompts do cliente" **permanece** fora do
   escopo da Sprint 0, diferida à Sprint 4, exatamente como no PDF.
2. **Nenhum outro item do §2.2 é alterado.** Permanecem fora de escopo, nos termos literais do PDF:
   qualquer alteração no cálculo do índice além de S0-H; extração do `@lh/core` e implementação do motor
   (Sprint 1); catálogo v1.0, itens novos e assessment em duas etapas (Sprint 2); Registro de Riscos,
   Risk Engine e plano determinístico (Sprints 5–6); Contexto, exposição, Cₑ, RBAC, evidências,
   histórico e telemetria; mobile, PWA, área administrativa e billing; qualquer alteração visual além do
   vocabulário das faixas; e refatoração oportunista fora dos itens listados (Playbook IA-4).
3. A frase de abertura da seção — "Nenhum item abaixo pode ser implementado nesta sprint, ainda que
   pareça trivial ou oportuno" — **permanece integralmente em vigor** para os itens que restam.
4. O item "Banco de dados, migrações, autenticação real, persistência, multi-tenant — Sprint 3" recebe
   tratamento próprio em **P-6**, abaixo, e **não é removido**.

### Fundamento

Decisão I do proprietário, marco **C1**, formalizada na **ADR-0005** (D5.1, D5.3). O impasse de execução
que a Ordem produzia — S0-D ordena migrar o artefato, S0-I ordena reprovar violação de INV-3, e §2.2
proibia construir o único destino lícito — está registrado na ADR-0005 §1 e na NCN-03/2026.

### Identificação da origem

**Decorre de decisão já tomada pelo proprietário.** Não é conclusão do executor.

---

## P-4.b — §2.1: inclusão do B-03 entre os itens da Sprint 0

### Seção

**§2.1 — Itens de entrega da Sprint 0** (tabela `Item | Entrega | Detalhamento`).

### Texto original relevante

A tabela relaciona, no PDF, os itens **S0-A** a **S0-K**, aos quais o Termo de Decisão T-00, decisão (d),
acrescentou **S0-03** (PR-14). Itens pertinentes, literais:

> "**S0-D** | Migração do artefato | Código atual para `apps/web`, decomposto em arquivos, com paridade
> visual e funcional integral"

> "**S0-I** | Lint de fronteira | Regra automatizada que falha o build ao violar INV-1 e INV-3"

### Alteração

Acrescenta-se **um item** à tabela do §2.1:

| Item | Entrega | Detalhamento |
| --- | --- | --- |
| **B-03** | **AI Gateway com credencial no servidor** | Implementado como Supabase Edge Function (ADR-0004, D4.4), em `apps/api/ai-gateway/`. Entrega **somente as rotas necessárias** para colocar os módulos existentes do artefato em operação fora do runtime de demonstração (ADR-0005, D5.4). Critério de aceite do Plano Diretor, Parte 8: "Zero credencial no bundle; 6 módulos operam fora do runtime de demonstração; custo por chamada registrado" |

**Delimitações expressas:**

1. **O identificador permanece `B-03`**, conforme a taxonomia da NCN-01/2026 §2, que reserva `S0-xx` ao
   saneamento e infraestrutura da Sprint 0 e preserva `B-01..B-24` com fidelidade ao Plano Diretor.
   **Nenhum identificador novo foi criado.**
2. **`/ai/explain-item` e `/ai/draft-action` não são antecipadas.** Permanecem condicionadas ao Registro
   de Riscos (B-08) e ao plano determinístico (B-09), conforme ADR-0005, D5.4.
3. **S0-I e INV-3 são preservados.** O item S0-I — "Regra automatizada que falha o build ao violar INV-1
   e **INV-3**" — permanece **exatamente como no PDF**. A norma INV-3 **não é alterada, excepcionada nem
   flexibilizada**; ver a Ata de Revisão do Engineering Playbook (P-5), que trata **apenas** do mecanismo
   de verificação.
4. **Todos os demais itens permanecem intactos**: S0-A, S0-B, S0-C, S0-D, S0-E, S0-F, S0-G, S0-H, S0-I,
   S0-J, S0-K e S0-03, com entrega e detalhamento exatamente como no PDF.

### Fundamento

Decisão I do proprietário — escopo **A2**, marco **C1** —, formalizada na **ADR-0005** (D5.1, D5.2, D5.4)
e na **ADR-0004** (D4.4, plataforma de execução).

### Identificação da origem

**Decorre de decisão já tomada pelo proprietário.** Não é conclusão do executor.

---

## P-4.c — §4: árvore de arquivos esperada ao final da sprint

### Seção

**§4 — Arquivos esperados ao final da sprint.**

### Texto original relevante

Nota de abertura da seção, literal — **inalterada**:

> "Estrutura de organização esperada. Nomes de arquivos de tela e componente podem variar conforme a
> decomposição, desde que respeitem as convenções do Playbook §3."

Trecho pertinente da árvore, literal:

> `├── apps/`
> `│ └── web/`

### Alteração

A árvore do §4 passa a contemplar, sob `apps/`, além de `web/`:

```
├── apps/
│   ├── api/
│   │   └── ai-gateway/     B-03 — BFF · prompts · cache · cotas · custo (Playbook §2)
│   │                       Supabase Edge Function (ADR-0004, D4.4)
│   └── web/                (inalterado)
```

**Delimitações expressas:**

1. A localização `apps/api/ai-gateway/` **não é criação desta ata**: já consta da estrutura do
   **Playbook §2** e é a exceção declarada de INV-3 em `eslint.config.mjs`. Esta ata apenas a traz para
   a árvore esperada da Sprint 0, em consequência da antecipação.
2. **Nenhuma alteração em `apps/web/`.** A subárvore `src/{app.tsx, components/, charts/, screens/, ai/,
   domain-temp/}` e `public/assets/` permanece **exatamente como no PDF**, inclusive a anotação
   "`ai/` prompts (permanecem no cliente até a Sprint 4)".
3. A nota sobre `domain-temp/` — "Diretório deliberadamente provisório […] Nenhum código novo entra ali"
   — permanece **inalterada**.
4. A linha "`eslint.config.*` inclui regra de fronteira de dependência (INV-1, INV-3)" permanece
   **inalterada**.
5. **Nenhum outro ramo da árvore é alterado**: `packages/{core,contracts,ui}`, `db/`, `docs/`,
   `.github/workflows/ci.yml`, `README.md`, `tsconfig.base.json`, `.prettierrc` e `.gitignore` seguem
   como no PDF.

### Fundamento

Consequência direta de P-4.b, ADR-0005 (D5.1) e ADR-0004 (D4.4). A superfície de rotas — sete, após a
inclusão de `/ai/analyze-case` — é fixada pela **Ata de Revisão do Anexo Técnico I (P-3)**, e não por
esta ata.

### Identificação da origem

**Decorre de decisão já tomada pelo proprietário.** Não é conclusão do executor.

---

## P-4.d — §5: critério de aceite do B-03

### Seção

**§5 — Critérios de aceite** (tabela `Nº | Critério | Verificação`).

### Texto original relevante

Critérios pertinentes, literais — **inalterados**:

> "**A1** | CI verde no tronco | Build, lint e testes passam em execução limpa"
> "**A2** | Paridade integral com o artefato | Sete telas conferidas visual e funcionalmente; nenhuma diferença percebida pelo usuário"
> "**A8** | Fronteira de dependência ativa | Importar React ou cliente HTTP em `packages/core` falha o build"

### Alteração

Acrescenta-se **um critério** à tabela do §5, com o seguinte conteúdo:

| Nº *(proposto)* | Critério | Verificação |
| --- | --- | --- |
| *(a definir)* | **AI Gateway operante** | Zero credencial no bundle; os 6 módulos de IA operam fora do runtime de demonstração; custo por chamada registrado |

**Delimitações expressas:**

1. O **conteúdo** do critério é **transcrição literal do critério de aceite de B-03** já constante do
   Plano Diretor, Parte 8. **Nenhum critério foi inventado, ampliado ou reduzido.** A semântica do
   critério de B-03 **não é alterada**.
2. **A identificação `A13` NÃO é decisão do proprietário.** É **proposta de organização desta ata**,
   sugerida por dar sequência a A1–A12. **Não constitui requisito normativo já decidido.** **A
   identificação final do novo critério será definida pela revisão formal da Ordem Oficial.**
3. **Os doze critérios existentes permanecem exatamente como no PDF** — A1 a A12 —, incluindo A9
   ("Logotipo fora do bundle… bundle inicial abaixo de 300 KB comprimido") e A12 ("Reprodutibilidade").
4. **A Definition of Done (§6) e os testes obrigatórios (§7) não são alterados** por esta ata.

### Efeitos secundários a endereçar na revisão formal

Registrados, **não resolvidos por esta ata**:

| # | Efeito secundário | Texto afetado |
| --- | --- | --- |
| **E2** | O **§10, item 1** refere, literal: "Os **doze** critérios de aceite da seção 5 verificados como atendidos." Com o acréscimo do novo critério, passam a ser **treze**. A contagem no §10 fica desatualizada. Registra-se também que o **título do §10** — "Critérios de aprovação e liberação da **Sprint 1**" — merece exame, dado que a Sprint 1 fica sem entregável declarado (ver Ata de Revisão do Plano Diretor, P-2) | Ordem §10 |
| **E3** | O **checklist do §8 (C01–C20)** **não possui item correspondente** ao novo critério. A Ordem passaria a ter treze critérios de aceite e vinte itens de checklist que não cobrem o novo | Ordem §8 |

**Nenhum dos dois é resolvido aqui.** Ambos são levados à revisão formal da Ordem Oficial, junto com a
definição da identificação do novo critério (delimitação 2, acima).

### Fundamento

Consequência de P-4.b. O conteúdo do critério provém integralmente do Plano Diretor, Parte 8, item B-03.

### Identificação da origem

**Decorre de decisão já tomada pelo proprietário.** Não é conclusão do executor.

---

## P-6 — §2.2: delimitação da autenticação mínima do B-03

### Seção

**§2.2 — Explicitamente fora do escopo**, item relativo à Sprint 3.

### Texto original relevante

Item pertinente, literal:

> "Banco de dados, migrações, **autenticação real**, persistência, multi-tenant — Sprint 3."

### Alteração

O item **permanece em vigor**, com a seguinte delimitação acrescida:

> Banco de dados, migrações, autenticação real, persistência, multi-tenant — Sprint 3.
>
> **Ressalva (ADR-0005, D5.7).** Antecipa-se, **exclusivamente**, o mecanismo **mínimo** de autenticação
> e autorização necessário para que as rotas do B-03 cumpram os papéis mínimos definidos no Anexo
> Técnico I, Parte 1, e a matriz de autorização da Parte 2. O mecanismo é o já designado pelo Plano
> Diretor, Parte 7.1 — **Supabase Auth**.
>
> **Esta ressalva NÃO antecipa:** o item **B-05** em sua integralidade; banco de dados completo;
> persistência; multi-tenant; migrações; RLS além do necessário à autorização das rotas do B-03; nem
> qualquer outro item da Sprint 3. Tudo o que exceder a proteção das rotas do B-03 **permanece na
> Sprint 3**.

**Delimitações expressas:**

1. **Nenhum mecanismo novo foi inventado.** Supabase Auth já constava do Plano Diretor, Parte 7.1, e a
   plataforma foi confirmada pela ADR-0004 (D4.4).
2. **Nenhuma implementação é autorizada por esta ata.** A ressalva delimita **escopo**, não executa nada.
3. A dependência declarada no Plano Diretor, Parte 8 — **B-05 depende de B-01 e B-03** — permanece
   registrada e **não é invertida**: antecipa-se apenas o mínimo de autenticação, não o item B-05.
4. **Os papéis não são alterados.** A matriz da Parte 2 do Anexo Técnico I permanece intacta; a
   capacidade aplicável continua sendo "Usar módulos de IA".

### Fundamento

Decisão IV do proprietário — **G1** —, formalizada na **ADR-0005** (D5.7):

> "Antecipar o mecanismo **MÍNIMO** de autenticação necessário para proteger as rotas do B-03. **NÃO**
> antecipar integralmente o B-05. Não antecipar banco/multi-tenant além do estritamente necessário para
> autenticação e autorização das rotas do B-03."

### Identificação da origem

**Decorre de decisão já tomada pelo proprietário.** Não é conclusão do executor.

---

## Efeito consolidado — *após a revisão formal, não a partir desta ata*

| Seção | Antes (PDF) | Após a revisão formal |
| --- | --- | --- |
| §2.1 — itens | S0-A..S0-K + S0-03 | **+ B-03** |
| §2.2 — fora de escopo | "BFF, AI Gateway, retirada dos prompts do cliente — Sprint 4" | "**Retirada dos prompts do cliente — Sprint 4**" |
| §2.2 — Sprint 3 | "Banco…, autenticação real, … — Sprint 3" | **mantido, com ressalva do mínimo de auth do B-03** |
| §4 — árvore | `apps/web/` | **`apps/api/ai-gateway/` + `apps/web/` (inalterado)** |
| §5 — critérios | A1..A12 | **A1..A12 inalterados + 1 novo critério, identificação a definir na revisão formal** |
| §2.1 S0-I · INV-3 | — | **preservados, sem exceção** |
| §6, §7, §8 (C01–C20), §9, §10 | — | **inalterados**, salvo a contagem de critérios no §10 |
| Demais itens de §2.2 | — | **inalterados** |
