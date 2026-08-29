# ADR-0004 — Fornecedor de IA e Plataforma de Execução do AI Gateway

| Campo | Valor |
| --- | --- |
| Identificador | ADR-0004 |
| Título | Fornecedor de IA, modelo, busca web e plataforma de execução do AI Gateway |
| Status | **ACEITA** — Decisões I e III do proprietário, 2026-08-29 |
| Decisor | Fundador (Igor de Lima Salomão) |
| Supersede | — |
| Superseded by | — |
| Relacionadas | Plano Diretor §7.1 e §7.2 · Anexo Técnico I §1 e §6 · Playbook §10, §11 e §15.1 · ADR-0002 · ADR-0005 |
| Gatilho de obrigatoriedade | Playbook §15.1: "introduz dependência externa nova"; "toca a fronteira determinístico × IA"; "tem custo recorrente relevante em infraestrutura ou IA" |

## 1. Contexto

O Plano Diretor §7.1 fixa, no bloco INFRAESTRUTURA da arquitetura-alvo, o adaptador
**"AI Gateway (Edge Function)"**, e o §7.2 descreve suas responsabilidades: "Toda chamada passa por
Edge Function que guarda a credencial, aplica limites de uso, registra custo, versiona prompts e valida
esquema de saída." O Anexo Técnico I §1, princípio 1, determina: "O cliente nunca fala com provedor de
IA. Só com o BFF."

O corpus, porém, **nunca elegeu um fornecedor de IA nem um modelo**. A Especificação §10.3 exige que
toda saída de IA carregue `generatedBy`, `model`, `promptVersion` e timestamp — pressupondo uma escolha
que nenhum documento faz. As ocorrências de Anthropic e `claude-sonnet-4-6` no artefato (l.140, l.143,
l.151, l.155) são **registro do estado auditado**, não decisão: a Due Diligence as trata como achado,
inclusive apontando que o envio ocorre "sem base legal documentada, sem aviso, sem consentimento e sem
contrato de tratamento visível".

Da mesma forma, o Plano Diretor §7.1 nomeia **Supabase** para "Postgres + RLS" e "Auth · Storage", mas
lista "AI Gateway (Edge Function)" como entrada distinta, **sem escrever "Supabase Edge Function"**. A
plataforma de execução do gateway era, portanto, inferível — e a inferência é vedada pela regra IA-1.

## 2. Decisão adotada

- **D4.1 — Provedor de IA.** O provedor oficial da plataforma é a **Anthropic**.
- **D4.2 — Modelo.** O modelo oficial é **`claude-sonnet-4-6`**, registrado em toda saída conforme a
  Especificação §10.3 (`model`).
- **D4.3 — Busca web.** A capacidade de busca web é atendida pelo **mecanismo integrado do próprio
  provedor de IA**. **Não se adota provedor de busca web separado neste momento.**
- **D4.4 — Plataforma de execução.** O AI Gateway é implementado como **Supabase Edge Function**,
  confirmando o Supabase como plataforma de execução do adaptador que o Plano Diretor §7.1 já designava
  como "AI Gateway (Edge Function)".

## 3. Justificativa

**Quanto a D4.1–D4.2.** Anthropic e `claude-sonnet-4-6` são as únicas opções presentes no corpus, ainda
que por registro factual. A adoção formal converte um estado de fato auditado em decisão rastreável,
satisfazendo a exigência da Especificação §10.3 e permitindo instanciar a tabela de custo relativo do
Anexo Técnico I §6.

**Quanto a D4.3.** O artefato não emprega provedor de busca web distinto: `callClaudeSearch` (l.150–161)
utiliza a ferramenta embutida do próprio provedor, declarada em `tools`. Adotar o mecanismo integrado
preserva o comportamento auditado, evita segundo contrato, segunda base legal e segunda linha de custo,
e mantém `/ai/research` — que atende os módulos de jurisprudência e jurimetria — dentro de um único
fornecedor.

**Quanto a D4.4.** Nenhuma razão documental contrária foi localizada. A categoria já estava fixada pelo
Plano Diretor; o Supabase já é a plataforma adotada para persistência, autenticação e armazenamento
(§7.1). Confirmá-lo para a Edge Function reduz a superfície de fornecedores e alinha o gateway à
infraestrutura já decidida.

## 4. Alcance e limites desta decisão

Esta ADR **decide exclusivamente** os quatro itens da seção 2. Em particular, **não decide e não
autoriza**:

- região, nome de projeto, organização ou ambiente Supabase;
- configuração de produção, domínio, endpoint externo ou mecanismo de implantação;
- criação, rotação ou armazenamento concreto de qualquer segredo — o regime aplicável permanece o do
  Playbook §10: "Somente variáveis de ambiente do servidor. […] Chave de provedor de IA existe apenas no
  `ai-gateway`";
- qualquer implementação. Nenhum código, diretório `apps/api`, função ou endpoint é criado por esta ADR.

## 5. Aspectos jurídicos e contratuais — remissão, não parecer

A adoção do provedor foi decidida pelo proprietário. Esta ADR **não declara resolvido** nenhum
fundamento jurídico e **não afirma conformidade**.

A Due Diligence Técnica registrou que os dados são "enviados a operador terceiro (API Anthropic) sem
base legal documentada, sem aviso, sem consentimento e sem contrato de tratamento visível". Os aspectos
jurídicos e contratuais ali apontados **devem ser tratados antes da disponibilização real do
processamento de dados**, na medida em que o corpus o exigir — notadamente o Playbook §10 (LGPD:
"Finalidade declarada por campo coletado. Retenção por categoria, conforme decisão do fundador") e a
INV-5 ("Nenhuma tabela, log ou prompt recebe dado de paciente identificável").

Registra-se ainda, sem resolvê-la, a pendência declarada no Anexo Técnico I §7: "Teto de custo de IA
como % da receita — Bloqueia: Sprint 4 — Financeira". Ela não integra os critérios de aceite de B-03.

## 6. Consequências

- A Especificação §10.3 passa a ser satisfazível: existe `model` a registrar.
- A tabela de custo relativo do Anexo Técnico I §6 torna-se instanciável, com os controles obrigatórios
  ali declarados (cache por item e versão de catálogo; janela truncada; cache por consulta normalizada;
  limite de páginas; cota por plano).
- `/ai/research` fica atendido sem fornecedor adicional, com o cache obrigatório do Anexo I §6.
- A superfície de fornecedores externos da plataforma passa a ser: Anthropic (IA, incluindo busca web) e
  Supabase (Postgres + RLS, Auth, Storage e Edge Function).

## 7. Critérios de revisão futura

Esta decisão vigora até que se verifique: (1) alteração de modelo — que, pelo Playbook §11.2, exige a
execução prévia do conjunto de avaliação por prompt, sendo "troca de modelo sem essa execução […]
proibida"; (2) inadequação contratual ou de base legal apurada no tratamento devido conforme a seção 5;
(3) custo recorrente incompatível com o teto a ser fixado pelo fundador (Anexo I §6 e §7); (4)
indisponibilidade ou descontinuidade do provedor ou da plataforma. Nenhuma dessas condições autoriza
alteração silenciosa: exigem nova ADR que expressamente supersede esta (Playbook §15.2).
