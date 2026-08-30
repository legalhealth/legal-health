# Ata de Revisão — Engineering Playbook v1.0 · P-5

| Campo | Valor |
| --- | --- |
| **Fonte** | `docs/playbook/Legal_Health_2.0_Engineering_Playbook_v1.0.pdf` — **registro original aprovado, não modificado** |
| Versão do documento-fonte | Legal Health · Engineering Playbook v1.0 · 5 de agosto de 2026 |
| Natureza desta ata | **Ata de revisão por seção.** Não é transcrição do PDF. Registra exclusivamente a célula alterada por decisão já tomada. |
| Rito aplicável | Playbook §15.2, Engineering Playbook: "Nova convenção, novo limite, nova invariante → Nova versão do Playbook, **com registro do que mudou**." |
| Pendência atendida | **P-5** (NCN-03/2026 §4) |
| Data | 29 de agosto de 2026 |
| Relacionadas | Decisão V do proprietário (**H3**) · NCN-03/2026 §3 · ADR-0005 |

> **Natureza preparatória e relação com o PDF original.** O PDF permanece o registro aprovado e **não
> foi modificado**. Esta ata **não altera o corpus e não possui eficácia normativa própria**: ela apenas
> **registra** a alteração já decidida pelo proprietário e **prepara** a revisão formal do
> documento-fonte, limitada a **uma única célula** da tabela do §1.1 — a coluna "Verificação" da INV-3.
> **O efeito normativo somente nascerá quando a revisão formal do Engineering Playbook for efetivamente
> incorporada e aprovada pelo rito do Playbook §15.2** — "Nova versão do Playbook, com registro do que
> mudou." Até lá, o Playbook rege-se integralmente pelo PDF, inclusive nessa célula. Esta ata **não cria
> hierarquia normativa nova**.

> **Leitura das seções "Alteração".** Cada seção "Alteração" desta ata enuncia a redação
> **proposta para a revisão formal** do documento-fonte. Nenhuma delas descreve alteração já
> efetuada: o corpus permanece como está até que a revisão formal seja incorporada e aprovada.

---

## P-5 — §1.1: mecanismo de verificação da INV-3

### Seção

**§1.1 — Invariantes**, cujo título literal é:

> "**1.1. Invariantes — regras que nenhuma revisão pode aprovar violação**"

Linha da **INV-3**, tabela `ID | Invariante | Verificação`.

### Texto original relevante

Literal, no PDF:

> `INV-3 | Nenhuma chamada a provedor de IA fora de ai-gateway. | Lint de importação`

### A NORMA NÃO MUDA

Registra-se, antes de qualquer outra coisa:

> ### **INV-3 — "Nenhuma chamada a provedor de IA fora de `ai-gateway`."**
>
> **Permanece íntegra, vigente e sem exceção.** Não é alterada, flexibilizada, prazoada nem
> excepcionada por esta ata.

Permanece igualmente íntegro o dispositivo de nível superior que a INV-3 detalha — **Anexo Técnico I,
Parte 1, princípio 1**: "O cliente nunca fala com provedor de IA. Só com o BFF."

Permanece íntegro o título da seção: as invariantes seguem sendo "regras que nenhuma revisão pode
aprovar violação".

### Alteração — exclusivamente a coluna "Verificação"

A célula "Verificação" da linha INV-3 passa a ler-se:

> **Verificação automatizada no CI de que nenhum caminho de código fora de `ai-gateway` invoca provedor
> de IA — seja por importação de SDK de provedor, seja por requisição de rede a endereço de provedor,
> seja por qualquer outra forma de invocação. A verificação deve cobrir a regra enunciada, não uma de
> suas manifestações. Falha de verificação reprova o build.**

**O que esta redação deliberadamente NÃO prescreve:**

- nenhuma expressão regular específica;
- nenhum arquivo de configuração específico;
- nenhuma técnica de análise específica — AST, análise de fluxo, varredura textual ou outra;
- nenhum plugin, biblioteca ou ferramenta específica.

A norma descreve **o que precisa ser verificado**; a escolha de **como** verificar é da implementação, e
será feita em etapa própria e autorizada.

### Fundamento

Decisão V do proprietário — **H3**:

> "Substituir o mecanismo atual de detecção literal de host por mecanismo de enforcement coerente com a
> norma INV-3. A regra deve verificar a **REGRA NORMATIVA REAL**: nenhuma chamada a provedor de IA fora
> de `ai-gateway`. **Não mascarar a violação. Não simplesmente remover a proteção para fazer o CI
> passar.**"

**Fundamento material — insuficiência da verificação declarada, apurada por execução.** Registrado na
NCN-03/2026 §3:

- O artefato auditado possui **um único `import`** — `react`, linha 3 — e invoca o provedor de IA por
  `fetch` global, nas linhas 140 e 151.
- Verificado por execução: uma verificação restrita a **importações** **não detecta** essa chamada.
- A verificação declarada no PDF — "Lint de importação" — é, portanto, **insuficiente para a própria
  norma que declara verificar**. A norma proíbe a *chamada*; o mecanismo declarado inspeciona apenas
  *importações*.

### Registro do estado anterior e da Alternativa D

Para que a mudança fique rastreável, conforme exige o rito ("com registro do que mudou"):

| Estado | Conteúdo | Situação |
| --- | --- | --- |
| **Verificação declarada no PDF** | "Lint de importação" | **Substituída** por esta ata — insuficiente para a norma |
| **Mecanismo vigente na implementação** | Regra de literal de endereço de provedor, introduzida em S0-I | **Mecanismo adicional além do declarado.** Detecta a chamada real, mas por endereço, não pela norma. **Permanece ativo até a substituição** |
| **Mecanismo decidido (H3)** | Enforcement coerente com a regra normativa real, nos termos acima | **A implementar em etapa própria e autorizada** |

**Alternativa D.** Em deliberação anterior o proprietário adotou a Alternativa D, segundo a qual a regra
de literal de endereço "não deve ser tratada como requisito normativo independente". Essa adoção nunca
havia sido formalmente registrada; foi registrada na NCN-03/2026 §3 e é **superada pela Decisão V**: a
regra de literal de endereço não é requisito normativo autônomo, e será **substituída** por mecanismo
que verifique a norma — **não removida**.

### Efeito imediato

**Nenhum.** Esta ata **não altera `eslint.config.mjs`** e **não implementa** o novo mecanismo. Até a
substituição, o mecanismo vigente permanece ativo, e permanece a consequência já apurada: enquanto
houver chamada a provedor de IA fora de `ai-gateway`, o CI reprova — e é isso que a Decisão V determina
que continue acontecendo, em vez de ser mascarado.

### Identificação da origem

**Decorre de decisão já tomada pelo proprietário** (Decisão V, H3), registrada na NCN-03/2026 §1 e §3.
**Não é conclusão do executor.**

---

## Efeito consolidado — *após a revisão formal, não a partir desta ata*

| Item | Antes (PDF) | Após a revisão formal |
| --- | --- | --- |
| **INV-3 — norma** | "Nenhuma chamada a provedor de IA fora de `ai-gateway`." | **INALTERADA** |
| **INV-3 — verificação** | "Lint de importação" | Verificação automatizada no CI da regra enunciada, agnóstica de técnica |
| Título do §1.1 | "regras que nenhuma revisão pode aprovar violação" | **inalterado** |
| INV-1, INV-2, INV-4 a INV-8 | — | **inalteradas**, norma e verificação |
| §2 a §16 do Playbook | — | **inalterados** |
| `eslint.config.mjs` | — | **não alterado por esta ata** |
