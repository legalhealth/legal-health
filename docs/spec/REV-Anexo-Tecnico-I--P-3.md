# Ata de Revisão — Anexo Técnico I · P-3

| Campo | Valor |
| --- | --- |
| **Fonte** | `docs/spec/Anexo_Tecnico_I_Contratos_de_Execucao.pdf` — **registro original aprovado, não modificado** |
| Versão do documento-fonte | Anexo Técnico I — Contratos de Execução · 5 de agosto de 2026 |
| Natureza desta ata | **Ata de revisão por seção.** Não é transcrição do PDF. Registra exclusivamente a seção alterada por decisão já tomada. |
| Rito aplicável | Playbook §15.2, Anexo Técnico: "**Novo contrato de API**, papel, ambiente ou modelo de custo → Novo anexo ou revisão do existente." |
| Pendência atendida | **P-3** (NCN-03/2026 §4) |
| Data | 29 de agosto de 2026 |
| Relacionadas | ADR-0005 (D5.6) · NCN-03/2026 · Ordem de destravamento da Fase P |

> **Natureza preparatória e relação com o PDF original.** O PDF permanece o registro aprovado e **não
> foi modificado**. Esta ata **não altera o corpus e não possui eficácia normativa própria**: ela apenas
> **registra** a alteração já decidida pelo proprietário e **prepara** a revisão formal do
> documento-fonte. **O efeito normativo somente nascerá quando a revisão formal do Anexo Técnico I for
> efetivamente incorporada e aprovada pelo rito do Playbook §15.2** — "Novo contrato de API, papel,
> ambiente ou modelo de custo → Novo anexo ou revisão do existente." Até lá, o Anexo Técnico I rege-se
> integralmente pelo PDF, inclusive quanto à superfície `/ai/*`, que segue com **seis** rotas. Esta ata
> **não cria hierarquia normativa nova**.

> **Leitura das seções "Alteração".** Cada seção "Alteração" desta ata enuncia a redação
> **proposta para a revisão formal** do documento-fonte. Nenhuma delas descreve alteração já
> efetuada: o corpus permanece como está até que a revisão formal seja incorporada e aprovada.

> **Ressalva de fidelidade.** A tabela de rotas é renderizada em colunas que a extração deste ambiente
> colapsa. A leitura por coluna abaixo está **assinalada como reconstrução**, e o PDF permanece a
> referência para conferência.

---

## P-3 — Parte 1: sétima rota `/ai/analyze-case`

### Seção

**Parte 1 — Superfície de API e contratos do BFF**, tabela de rotas (`Mét. | Rota | Papel mín. | Contrato`).

### Texto original relevante

Os cinco princípios da Parte 1, literais — **inalterados e integralmente aplicáveis à nova rota**:

> 1. O cliente nunca fala com provedor de IA. Só com o BFF.
> 2. O servidor recalcula todo índice antes de gravar. O valor enviado pelo cliente é descartado; divergência gera evento de auditoria.
> 3. Toda escrita é idempotente por chave do cliente (Idempotency-Key), para tolerar rede instável em clínica.
> 4. Toda resposta carrega `catalogVersion` e `engineVersion`.
> 5. Erro é sempre estruturado: `{ code, message, details, requestId }`. Mensagem genérica na UI, causa no log.

Regra de fronteira da mesma Parte 1, literal — **inalterada e integralmente aplicável à nova rota**:

> Regra de fronteira, verificável em revisão de código. **Nenhuma rota sob `/ai/*` pode escrever em
> `assessment_results`, `risk_instances` ou na ordenação de `action_items`.** Se uma rota de IA precisar
> de acesso de escrita a essas tabelas, o desenho está errado.

Rotas `/ai/*` existentes — leitura por coluna, **reconstrução** a conferir no PDF:

| Mét. | Rota | Papel mín. | Contrato |
| --- | --- | --- | --- |
| POST | `/ai/draft-action` | gestor | Redige o texto de uma ação já priorizada. Recebe o item, não decide o item. |
| POST | `/ai/explain-item` | profissional | Explica pergunta e norma. Fundamenta-se no Registro; proibido citar fora dele. |
| POST | `/ai/read-document` | gestor | OCR e classificação sugerida. Rejeita na borda documento sinalizado como de paciente. |
| POST | `/ai/research` | profissional | Jurisprudência e jurimetria. Cache obrigatório por consulta normalizada. |
| POST | `/ai/chat` | profissional | Escopado a lacuna, risco ou ação. Janela truncada (B-26). |
| POST | `/ai/draft-document` | gestor | Minutas e peças, sempre derivadas de ação do plano ou incidente registrado. |

### Alteração

Acrescenta-se **uma sétima linha** à tabela de rotas da Parte 1:

| Mét. | Rota | Papel mín. | Contrato |
| --- | --- | --- | --- |
| POST | **`/ai/analyze-case`** | **gestor** | Recebe um caso jurídico ou relato estruturado e produz análise jurídica estruturada, contemplando, no mínimo: identificação do contexto, questões relevantes, riscos e pontos de atenção, e elementos necessários para orientar a elaboração do plano de ação. |

**A rota atende exclusivamente a função hoje representada por `SYSTEM_ANALISE`** (artefato auditado,
l.212; aba "🔎 Análise de risco", l.989; componente `AnaliseRisco`, l.783).

**Delimitações expressas:**

1. **Não é `/ai/chat`.** A rota `/ai/chat` conserva integralmente seu contrato original — "Escopado a
   lacuna, risco ou ação. Janela truncada (B-26)" — e **não absorve** `SYSTEM_ANALISE`.
2. **Nenhum campo além do mínimo.** O contrato acima é o papel mínimo autorizado; nada foi acrescido.
3. **Nenhuma regra de negócio nova.** A rota preserva a semântica do módulo existente.
4. **Sujeita a todos os princípios da Parte 1** (1 a 5, acima) e à **regra de fronteira**: não escreve em
   `assessment_results`, `risk_instances` nem na ordenação de `action_items` — em conformidade com INV-4.
5. **Nenhuma outra rota é criada, alterada ou removida.** As seis existentes permanecem exatamente como
   no PDF, incluindo método, papel mínimo e contrato.
6. **A Parte 2** (papéis e matriz de autorização) **não é alterada**: a nova rota opera sob a capacidade
   já existente "Usar módulos de IA", cuja matriz permanece `owner ✓ · gestor ✓ · profissional ✓ ·
   leitor — · lh_admin —`.

### Fundamento

Ordem de destravamento da Fase P, expressa:

> "A sétima capacidade de IA deverá ser formalizada como uma rota própria para a função atualmente
> representada por `SYSTEM_ANALISE`. **Nome da rota:** `/ai/analyze-case`."

E, na confirmação da matriz:

> "`/ai/analyze-case`: **`gestor`**."

Fundamento material registrado na ADR-0005 §3: `SYSTEM_ANALISE` é uma das seis abas da tela
`inteligencia` e integra o critério de aceite de B-03 — "6 módulos operam fora do runtime de
demonstração" (Plano Diretor, Parte 8). É, ainda, a metade de origem da única integração módulo-a-módulo
do artefato (`onUsarNoRedator`, l.818 → l.1023), que o Plano Diretor, Parte 1, manda "Preservar como
padrão".

### Identificação da origem — registro expresso

**Tanto a designação `/ai/analyze-case` quanto o papel mínimo `gestor` são DECISÃO DO PROPRIETÁRIO.**

Registra-se, por determinação expressa do proprietário:

> **Nem a designação `/ai/analyze-case` nem o papel `gestor` decorrem do texto do Anexo Técnico I, nem
> foram inferidos pelo executor a partir do vocabulário do corpus.**

Consignação de origem, para que corpus e decisão não se confundam:

- O executor havia **parado** antes desta revisão precisamente por não poder inferir com segurança a
  designação da rota a partir do vocabulário existente — os verbos `analyze`, `assess` e `review` **não
  ocorrem** nas rotas do Anexo.
- O executor havia **igualmente apontado** que o valor da coluna "Papel mín." não estava determinado
  pelo corpus, apresentando `gestor` e `profissional` como candidatos e **não escolhendo entre eles**.
- **Ambos os pontos foram decididos pelo proprietário**, e é essa decisão — não o corpus — que fundamenta
  esta linha.

---

## Efeito consolidado — *após a revisão formal, não a partir desta ata*

| Item | Antes (PDF) | Após a revisão formal |
| --- | --- | --- |
| Rotas `/ai/*` | **6** | **7** |
| `/ai/analyze-case` | não existe | **POST · gestor**, atendendo `SYSTEM_ANALISE` |
| `/ai/chat` | Escopado a lacuna, risco ou ação | **inalterada** — não absorve `SYSTEM_ANALISE` |
| Demais rotas `/ai/*` e rotas não-IA | — | **inalteradas** |
| Princípios 1–5 da Parte 1 | — | **inalterados**, aplicáveis à nova rota |
| Regra de fronteira `/ai/*` | — | **inalterada**, aplicável à nova rota |
| Parte 2 — papéis e matriz | — | **inalterada** |
| Partes 3, 4, 5, 6 e 7 | — | **inalteradas** |

**Não alteradas por esta ata:** a Parte 6 (modelo de custo de IA) e a Parte 7 (pendências que dependem
do fundador) permanecem exatamente como no PDF, inclusive quanto ao teto de custo de IA — "número a ser
definido pelo fundador", "Bloqueia: Sprint 4".
