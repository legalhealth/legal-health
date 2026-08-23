# NCN-02/2026 — Nota de Conciliação Normativa de Hierarquia e Escopo

| Campo | Valor |
| --- | --- |
| Identificador | NCN-02/2026 |
| Status | **HOMOLOGADA** pelo fundador — decisões D-03, D-04 e D-05, 2026-08-23 |
| Natureza | Nota de conciliação documental. Não altera escopo, critério de aceite nem decisão aprovada. |
| Relacionadas | Playbook §0 · Plano Diretor §8 e §10 · Ordem Oficial Sprint 0 (§2.1, §5, §8.4) · ADR-0001 (D7) · ADR-0002 (§2.1, §2.3, §3) · NCN-01/2026 |
| Instrumento | NCN-01 §4: colisões e conciliações futuras são trazidas a nova NCN, "nunca resolvidas por inferência (Playbook IA-9)". |

## 1. Problemas conciliados

A auditoria de prontidão da Sprint 0 (2026-08-23) identificou três questões que os documentos, isolados,
não resolviam:

1. **CF-2 — alvo de build.** Plano Diretor §10 fixa como critério de aceite da Sprint 0 "build
   reproduzível nas 3 plataformas"; a ADR-0002 §2.1 declara a plataforma Web como alvo primário e
   obrigatório das Sprints 0 a 3, e a §3 restringe a verificação da paridade A2 ao alvo web. Um
   documento de nível inferior aparentava restringir critério de documento superior.
2. **Proteção declarada × proteção aplicada.** A ADR-0002 §2.3 justifica `noUncheckedIndexedAccess`
   como prevenção da classe de erro `answers[key] || 0` — que é o defeito PR-13 (item S0-H). O
   `tsconfig.base.json` do monorepo aplica a flag, mas `apps/web/tsconfig.json` estende
   `expo/tsconfig.base` e não a herda. O destino do código a ser migrado em S0-D ficava fora da
   proteção que a ADR declara.
3. **CF-6 — PR-21.** O Plano Diretor §8 inclui PR-21 (logotipo em base64 no bundle) entre os seis
   problemas de B-02, e o §10 exige "6 defeitos triviais eliminados" na Sprint 0. A Ordem Oficial
   §2.1 não lista PR-21 entre S0-E e S0-H, e o Termo T-00 (d) acrescentou apenas PR-14.

## 2. D-03 — Hierarquia normativa e alvo de build

**Decisão homologada.** O Termo de Decisão T-00, enquanto ato formal do fundador — o mesmo decisor que
aprovou a Especificação e a ADR-0001 —, possui força decisória suficiente para definir a **estratégia
operacional** da Sprint 0, desde que não altere silenciosamente requisito da Especificação, do Plano
Diretor ou do Anexo Técnico.

**Leitura correta da relação entre os documentos:**

```text
Plano Diretor / requisito superior
        ↓  define o critério de aceite
ADR-0002
        ↓  define a estratégia de implementação
Web-first na Sprint 0
        ↓  demais plataformas conforme roadmap
```

**Regra de conflito.** A ADR-0002 **não pode reduzir** critério de documento superior. Pode definir
*como* alcançá-lo e *quando* cada alvo será implementado, desde que compatível com o cronograma e com o
critério normativo aplicável.

**Consequência operacional.** A estratégia web-first da ADR-0002 é válida como estratégia de
implementação da Sprint 0. Ela **não** elimina, nem em definitivo nem por antecipação, o requisito
superior de compatibilidade e paridade das três plataformas quando este for critério normativo de
aceite. A ADR-0002 §3 deve ser lida como diferimento de verificação, não como supressão de requisito.

**Não decorre desta nota** qualquer alteração no Plano Diretor, na Especificação, no Anexo Técnico ou na
ADR-0002. Nenhum desses documentos foi editado.

## 3. D-05 — Herança de `tsconfig` em `apps/web`

**Decisão homologada.** `apps/web` passa a herdar `tsconfig.base.json` do monorepo.

**Fundamento.** É a única configuração coerente com o que a ADR-0002 §2.3 já declara: se
`noUncheckedIndexedAccess` existe para prevenir `answers[key] || 0` (PR-13 / S0-H), e o código que
contém esse padrão será migrado para `apps/web` em S0-D, manter `apps/web` fora da base cria
divergência entre a proteção declarada pela ADR e a proteção efetivamente aplicada ao destino do
código.

**Natureza.** Esta decisão **não altera** a decisão da ADR-0002 — alinha a implementação ao que ela já
determina. Por isso é registrada por conciliação, e não por ADR nova.

**Execução.** A alteração física de `apps/web/tsconfig.json` **não foi realizada** neste ato. Deve
ocorrer em etapa autorizada própria, **antes de S0-D**, para que eventuais erros revelados pela flag
sejam distinguíveis de regressão de migração (critério S3).

## 4. D-04 — Âncora de `artifact-baseline` (remissão)

**Decisão homologada:** a tag `artifact-baseline` ancora o commit
`a3a07c83f5716878300864751ee63a4a8147a189`.

**Fundamento:** leitura literal da Ordem Oficial §8.4 — o artefato deve ser "mantido em `docs/`" e
marcado "no primeiro commit" do marco da Sprint 0. Apenas `a3a07c8` satisfaz as duas condições
cumulativamente. O estado original `29f890b` mantém o artefato em `Legal Health/`, fora de `docs/`.

**Evidência verificada:** `a3a07c8` é movimentação pura (17 renomeações, zero inserções e zero
deleções); o artefato existe em `docs/artifact-baseline/codigo-mvp-lh.jsx.txt` com blob
`9bc2af8c4dd20f6f11b8273219b89eb80fcda8f0`, **idêntico** ao de `29f890b` e ao do tronco atual.

**Registro normativo:** o dispositivo está em `docs/adr/ADR-0001-Perimetro-Oficial-do-Codigo.md`, no
campo **D7**, pelo mesmo mecanismo já usado para D6.1 — preenchimento de campo deixado em aberto, com
atribuição explícita, sem alterar a decisão. O PDF original permanece intocado.

## 5. CF-6 — PR-21 no escopo da Sprint 0

**Conciliação.** PR-21 **integra o escopo da Sprint 0**, com dois fundamentos convergentes e
independentes:

1. **Plano Diretor §8 e §10** — PR-21 consta de B-02, e o critério de aceite da Sprint 0 exige "6
   defeitos triviais eliminados". Com PR-08, PR-07, PR-15, PR-13 e PR-14 chega-se a cinco; PR-21 é o
   sexto.
2. **Ordem Oficial §5, critério A9** — "Logotipo fora do bundle. Servido como arquivo; bundle inicial
   abaixo de 300 KB comprimido". É exatamente o conteúdo de PR-21, exigido pela própria Ordem como
   critério de aceite.

**Consequência.** Executar PR-21 não configura refatoração oportunista vedada pela Ordem §2.2: é
cumprimento de critério de aceite expresso. **Nada foi executado neste ato** — o logotipo, o bundle e o
artefato permanecem inalterados.

## 6. Efeito

A partir desta NCN, e sem alterar nenhum documento superior:

- a estratégia web-first é lida como estratégia de implementação, não como supressão de requisito (§2);
- `apps/web` deve herdar `tsconfig.base.json`, com execução diferida para antes de S0-D (§3);
- a tag `artifact-baseline` ancora `a3a07c8`, registrada em ADR-0001 D7 (§4);
- PR-21 integra o escopo da Sprint 0 sob o critério A9 (§5).

Conciliações futuras seguem a regra da NCN-01 §4: nova NCN, nunca inferência (Playbook IA-9).

## Anexo A — Registros técnicos sem efeito normativo

Registrados por determinação do fundador para avaliação posterior. **Não são decisões, não são
critérios de aceite e não bloqueiam etapa alguma** sem evidência normativa que os qualifique.

| ID | Registro | Evidência | Situação |
| --- | --- | --- | --- |
| R-01 | `npm run format` (`prettier --check`) reprova com exit code 1 em 6 arquivos: os cinco `.md` de `docs/adr` e `docs/sprints`, mais o `README.md`. Causa raiz: inexistência de `.prettierignore` — o ESLint ignora `docs/**`, o Prettier não. | Execução local de 2026-08-23, item S0-C. | Pendência técnica fora de escopo. Não integra o pipeline de CI, que executa build, lint, testes e invariantes conforme a Ordem §2.1. **Não corrigida.** |
| R-02 | `npm ci` reporta 21 vulnerabilidades de dependência (13 moderate, 7 high, 1 critical). | Execução local de 2026-08-23, item S0-C. | Risco técnico pendente de avaliação. **Não corrigido**; `npm audit fix` não executado, dependências e lockfile intocados. |
| R-03 | Coexistem duas instalações de TypeScript: `5.7.3` na raiz e `6.0.3` em `apps/web/node_modules`. `npm run typecheck` passa nos quatro workspaces. | Execução local e CI verdes de 2026-08-23. | Divergência sem falha atual (T-1). Avaliar na ratificação do toolchain da ADR-0002. **Não harmonizada.** |
