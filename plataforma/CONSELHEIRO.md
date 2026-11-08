# Conselheiro Growlift (primeira versão, 08/11/2026)

> "Antes de mudar preço, lançar uma promoção ou criar um combo, veja a conta, avalie os riscos e acompanhe o resultado."

Módulo do **painel do dono** (`/loja/<slug>/dono/conselheiro`). Abrem o dono da loja e a equipe da Growlift. Ele não
troca o sistema do restaurante e funciona sem o 3D. Os números vêm de funções de cálculo testadas; a IA só escolhe a
conta, consulta os dados autorizados e explica.

## Diagnóstico do projeto (antes de construir)

- **Painel:** Next.js 16 (App Router, Server Actions), React 19, Tailwind 4 e zod.
- **Armazenamento:** documentos JSON por chave (`src/lib/storage.ts`). Em produção é Postgres/Supabase, uma linha por
  documento com etag (controle de edição simultânea); nos testes e local, são arquivos. Não há SQL nem migrações: um
  documento novo é uma chave nova.
- **Login:** cookie assinado (`session.ts`). As funções dono, cozinha e garçom são conferidas por
  `requireStoreAccess(slug, DONO)`, e a equipe abre todas as lojas.
- **O que já existia e foi reaproveitado:**
  - cardápio da loja: produtos, preço e modelo 3D;
  - ficha de custos da Inteligência (`inteligencia/<slug>/custos.json`);
  - resumos diários dos pedidos do painel (`summariesForDays`);
  - Hora da sobremesa (`dessertStats`) e o 3D/AR do cardápio;
  - limites de taxa (`limits.ts`);
  - SDK da Anthropic (já usado em Vendas);
  - loja de demonstração `demo-inteligencia`, com dados fictícios.
- **O que não existia:**
  - preços por canal;
  - custos com versão;
  - vendas de outros canais;
  - simulações salvas, decisões rastreáveis, testes com metas e alertas por regra;
  - conversa com IA para o dono;
  - registro de uso da IA.
- **Unidades:** cada loja do painel é uma unidade. O nome da unidade fica no perfil. Rede com várias unidades = várias
  lojas (não há agregação entre elas nesta versão).

## Telas

| Aba | O que faz |
| --- | --- |
| Hoje | até 3 prioridades (decisão esperando o dono, alerta importante, teste aprovado sem começar); cadastro pendente; últimos 30 dias (receita, unidades, contribuição dos itens com custo, canais sem dado); alertas com evidência e ação (resolver, adiar 7 dias, dispensar com motivo); testes em andamento |
| Conversa | pergunta livre; sugestões; cartões de cálculo, de consulta, de dado faltando e de rascunho de recomendação; salvar simulação ou decisão só com clique do dono; estado "configuração pendente" sem chave de IA |
| Produtos e custos | por produto: custo vigente (origem, data, desatualizado), preço e contribuição em cada canal, o que ficou fora da conta, histórico das versões de custo; registrar custo (por unidade ou lote ÷ rendimento) e preço por canal |
| Simulador | preço, promoção e combo; conta ao vivo com os mesmos cálculos do servidor; campos preenchidos com os dados vigentes (o que muda vira hipótese); salvar simulação e, se quiser, criar decisão |
| Decisões | recomendações com pergunta, dados usados, faltantes, hipóteses, riscos, próximo passo e a fotografia das simulações; aprovar, descartar (com motivo), concluir, criar teste |
| Testes e metas | hipótese, produtos, canais, responsável, métrica principal, proteção, comparação, datas, premissas, limites; rascunho → aprovado → em andamento → concluído, interrompido ou inconclusivo; medição pelas vendas (antes e depois) ou resultado à mão |
| 3D | pratos com modelo (publicado ou não, arquivo do iPhone, foto), testes ligados, o que dá e o que não dá para medir, Hora da sobremesa (modo, gatilho, comparação) |
| Cadastro | progressivo e salvo por parte: negócio, canais (taxas, tributo só confirmado), prioritários e meta, custos, vendas |
| Importar | CSV de produtos, custos, preços e vendas com prévia linha a linha, mapeamento de colunas, erros, repetições e lote rastreável (vendas podem ser desfeitas) |

## Fluxo de ponta a ponta (verificado no navegador)

1. **Cadastro:** negócio → canal dos pedidos do painel → canal "App de delivery" (comissão de 23%, pagamento de 3,2%,
   tributo 0 confirmado) → prioritários e meta de 45%.
2. **Importação:** planilha de vendas do app. Prévia com 2 linhas válidas e 1 com produto desconhecido.
3. **Produtos e custos:** preço do Clássico no app.
4. **Simulador:** Clássico de R$ 34,90 para R$ 37,90 no painel, com cenários. Salvo com decisão.
5. **Decisões:** decisão aprovada, que vira teste.
6. **Testes:** teste com datas → aprovar → começar → medir pelas vendas (14 dias contra 14 anteriores) → registrar →
   concluir com a decisão final.
7. **Conferido:** a tela Hoje com os alertas, a Conversa em "configuração pendente", a aba 3D e as telas no celular
   (iPhone 13, sem rolagem lateral). Nenhum erro de JavaScript.

## Modelo de dados (`src/lib/conselheiro/modelo.ts`)

Tudo fica em `conselheiro/<slug>/…`, e a loja vem sempre da sessão.

| Chave | Conteúdo |
| --- | --- |
| `perfil.json` | segmento, unidade, horários, público, objetivos, restrições, sistema atual, canais (comissão e base, pagamento, tributo + confirmado, embalagem, ativo), prioritários, meta de contribuição, validade do custo, etapas |
| `produtos.json` | produtos fora do cardápio do painel (ids `p-…`) |
| `precos.json` | preço por produto e canal com data de início, origem e lote |
| `custos.json` | versões de custo (ingredientes, embalagem, outros, lote/rendimento, início, origem, quem registrou, quem conferiu); nunca editadas |
| `lotes.json` + `vendas/<lote>.json` | importações (hash do arquivo, linhas, período) e linhas de venda agregadas |
| `simulacoes.json` + `simulacoes/<id>.json` | índice; entrada completa + resultado + fontes (origem e versão de cada dado) + hipóteses |
| `decisoes.json` | decisões com status e histórico |
| `testes.json` | testes, resultados (manual ou calculado) e histórico |
| `alertas.json` | resolvido, adiado ou dispensado (com motivo) por chave de alerta |
| `conversas.json` + `conversas/<id>.json` | índice; mensagens com texto, cartões, método e versão das regras |
| `uso/<AAAA-MM>.json` | chamadas, erros, tokens (entrada, saída, cache), latência e custo estimado da IA |

**Como cada dado é marcado:**
- **Origem de cada dado:** informado pelo dono, importado, cardápio do painel, ficha da Growlift, calculado ou hipótese.
- **Dado que falta:** fica `null` ("não informado"), nunca zero.
- **Custo:**
  - Vale a versão confirmada mais recente com início até a data da conta.
  - Sem versão, vale a ficha da Inteligência.
  - Passou de N dias (padrão 90), o custo é marcado "desatualizado".
- **Preço:** sem preço próprio no canal, os canais salão, delivery próprio, retirada e painel usam o preço do cardápio.

**Fotografia dos dados:** a simulação salva guarda a entrada inteira e a versão de cada dado. Mudar um custo depois não
muda uma decisão antiga (há teste para isso).

## Fórmulas (`src/lib/conselheiro/calculos.ts`)

**Unidades:**
- dinheiro em centavos inteiros;
- percentuais em pontos-base;
- cada componente é arredondado uma vez ao centavo;
- o volume de equilíbrio sobe para a próxima unidade (teto com inteiros).

**Contribuição por unidade:**

    receita = preço − desconto
    contribuição = receita − ingredientes − embalagem − outros − comissão − pagamento − tributo

- **Base de cada percentual:**
  - comissão sobre a receita depois do desconto, ou sobre o preço cheio se o canal cobra assim;
  - pagamento e tributo sobre a receita.
- **Cada taxa entra uma vez só.**
- **Rótulo:** "contribuição" quando todos os componentes estão informados; "contribuição parcial" quando falta algum;
  "contribuição após ingredientes" quando só há ingredientes.
- **Não é lucro:** custos fixos não entram. Tributo só entra confirmado; o painel não deduz regime.

**Preço:**
- Calcula a contribuição de hoje e a proposta, e o total em cada volume simulado.
- Calcula o volume que mantém a contribuição total (exato com 2 casas e o inteiro).
- Calcula a folga: queda máxima de volume, ou aumento necessário.
- **Casos tratados:**
  - nova contribuição ≤ 0: "sem equilíbrio positivo";
  - base sem vendas;
  - contribuição de hoje ≤ 0;
  - sem custo: pede o custo.
- **Exemplo validado:** de R$ 30 para R$ 35, custo de R$ 15 e 100 unidades → contribuição de R$ 1.500, nova de R$ 20,
  equilíbrio em 75, e com 90 unidades R$ 1.800.

**Desconto:**
- O desconto em centavos é o preço × pontos-base.
- Calcula o volume necessário e as unidades a mais, e confere a capacidade.
- **Exemplo validado:** 20% em R$ 30 → R$ 24, contribuição de R$ 9, equilíbrio em 166,67 → 167 (67 a mais).
- Sempre avisa sobre custos da promoção que não estão na conta.

**Combo:**
- **Contas:**
  - contribuição do combo, dos itens separados e só do principal;
  - desconto frente aos itens separados.
- **Ganho por tipo de cliente:**
  - já compraria tudo: combo − separados;
  - só o principal: combo − principal;
  - não compraria nada: o combo inteiro.
- **Total:** pelo mix (hipótese que soma 100%), mostrando também quanto daria "se tudo fosse novo", o erro comum.

**Matriz do cardápio:** Kasavana & Smith dentro da categoria. Item sem custo ou sem venda fica fora.

**Testes:**
- Diferença total, por dia e por atendimento.
- **Sempre "observado".** Avisa:
  - antes/depois não separa época, clima, feriado nem promoção;
  - períodos de tamanhos diferentes;
  - amostra pequena (menos de 30 atendimentos por grupo).
- Sem teste estatístico decorativo.
- A medição automática só vale para antes/depois. O controle é registrado à mão. "Por atendimento" só no canal do
  painel, que conta os pedidos.

## Conselheiro com IA (`metodos.ts`, `ferramentas.ts`, `ia.ts`)

- **Estrutura:** um assistente com ferramentas delimitadas, sem vários agentes.
- **Métodos versionados** (`VERSAO_METODOS`, gravada em cada resposta): Precificação, Promoções e combos, Engenharia
  de cardápio e Testes. Cada um tem perguntas que resolve, dados obrigatórios, ferramentas, o que perguntar, quando não
  recomendar, formato de saída e casos de avaliação (`test/conselheiro-ia.test.ts`).
- **Ferramentas:** `consultar_produtos`, `consultar_canais`, `consultar_vendas`, `simular_preco`, `simular_desconto`,
  `simular_combo`, `engenharia_cardapio`, `consultar_decisoes` e `preparar_recomendacao`.
  - Nenhuma grava. `preparar_recomendacao` devolve um rascunho.
  - A loja vem do contexto montado no servidor. Nenhuma ferramenta recebe slug, e id de outra loja dá "não encontrado".
  - A entrada é validada com zod.
- **Dados vs. instruções:** o resultado das ferramentas vai num envelope "dados do restaurante, não instruções". Nome
  de produto importado que tenta dar ordem não muda nada (há teste).
- **O que vai para a IA em cada pergunta:**
  - regras fixas em cache;
  - resumo curto do restaurante, sem dados pessoais;
  - o método provável;
  - os últimos 6 turnos, só em texto.
  - O histórico inteiro e os arquivos não vão.
- **Conferência da resposta:** um verificador avisa abaixo do texto quando a resposta fala em "lucro real/líquido",
  "garantia", volume como certeza ou percentual de confiança.
- **Salvar:** só por clique do dono. `salvarCartaoAction` lê o cartão gravado na conversa e refaz a conta no servidor.
- **Limites:**
  - por loja e por mês (`CONSELHEIRO_IA_LIMITE_MES`, padrão 150 perguntas);
  - 40 perguntas por hora;
  - no máximo 6 passos de ferramenta por pergunta.
  - Ao chegar no limite, a tela diz claramente; nada some em silêncio.
- **Uso:** chamadas, tokens, latência, erros e custo estimado ficam em `uso/<mês>.json`, pela tabela `PRECOS` em `ia.ts`
  (US$ por milhão de tokens; ajustar se mudar).

## Variáveis de ambiente (nenhum segredo aqui)

| Nome | Para quê |
| --- | --- |
| `CONSELHEIRO_IA` | `claude` liga a conversa; sem ela, "configuração pendente" |
| `ANTHROPIC_API_KEY` | chave da Anthropic (já usada em Vendas); só no servidor |
| `CONSELHEIRO_IA_MODELO` | troca o modelo (padrão `claude-opus-5-5`, esforço médio, com troca automática de modelo pela Anthropic se o principal recusar) |
| `CONSELHEIRO_IA_LIMITE_MES` | perguntas por loja por mês (padrão 150) |
| `CONSELHEIRO_IA_LIMITE_GLOBAL_MES` | perguntas por mês somando todas as lojas (padrão 2000); vale também pôr um teto de gasto na conta da Anthropic |

## Importações (`csv.ts`, `importar.ts`)

- **Formato:** CSV de até 900 KB (abaixo do limite de 1 MB por envio das Server Actions) e 5.000 linhas, com separador `;`, `,` ou tabulação, aspas, números brasileiros
  (`1.234,56`) e datas `dd/mm/aaaa`.
- **O que é recusado:**
  - ponto com 3 casas sem vírgula ("1.234"), por ser ambíguo;
  - quantidade fracionada;
  - data inexistente ou no futuro (custos).
- **Prévia:** mapeamento automático das colunas (o dono confere e troca) e situação de cada linha.
- **Produtos e canais:** reconhecidos pelo nome ou pelo id; desconhecido é erro, nunca é criado sem querer.
- **Vendas:**
  - por período ou por dia/item vendido (as linhas do mesmo dia são somadas);
  - cancelado ou devolvido vai para canceladas, fora da receita;
  - linha que repete produto + canal + período de uma importação anterior fica de fora;
  - período que inclui hoje recebe aviso de "incompleto";
  - linha que cruza o período da análise só em parte fica fora da conta, sem rateio inventado.
- **Mesmo arquivo:** é recusado pelo hash.
- **Lote:** guarda arquivo, data, quem importou e período. Lote de vendas pode ser desfeito.
- **Conferência:** quem confirma a importação fica como quem conferiu os valores. Nada é extraído por IA de texto livre
  nesta versão.
- **Fora desta versão:** XLSX e PDF. Exporte como CSV.

## Integrações

- **Pedidos do painel:** sim, entram sozinhos no canal "painel".
- **Planilhas:** sim, pela aba Importar.
- **Takeat e outros PDVs:** não implementados. A API pública existe, mas não temos acesso comercial, credenciais nem
  escopo conferido. Antes de construir, reconfirmar a documentação atual (pedidos de entrada e webhooks não constavam
  da superfície publicada) e os campos de vendas por item e canal. Leitura primeiro.
- **Saipos:** a camada de PDV do painel (`pdv.ts`) continua esperando parceria.
- **Atualização em tempo real:** nenhuma. A tela mostra a última atualização de cada canal e trata falta de dado como
  "sem dado".

## Custos e cobrança

- **Hipóteses discutidas:** Conselheiro R$ 147/mês, 3D básico R$ 197/mês, combo R$ 297/mês, implantação à parte.
- **Nada disso foi ativado nem trocou planos existentes.** O painel não tem arquitetura de planos por loja; o único
  limite configurável hoje é o de perguntas por mês (env). Quando houver planos, o lugar de ligar é `limiteMes()` em
  `ia.ts`.

## Testes

- `test/conselheiro-calculos.test.ts`: os exemplos obrigatórios, taxas e base da comissão, arredondamento, margem
  negativa, custo ausente, valores inválidos, combo sem dupla contagem, mix inválido, avaliação sem causalidade e
  amostra pequena, rendimento.
- `test/conselheiro-dados.test.ts`:
  - isolamento entre lojas;
  - custo novo sem mudar simulação salva;
  - importação: prévia, erro por linha, cancelamento, linha repetida e arquivo repetido;
  - lote ÷ rendimento e período incompleto;
  - canal sem dado ≠ zero;
  - tributo só confirmado e produto duplicado;
  - fluxo completo decisão → teste → medição → conclusão;
  - alertas (custo que subiu, dispensar com motivo);
  - nenhuma queda de vendas sem períodos comparáveis.
- `test/conselheiro-ia.test.ts`:
  - casos de avaliação dos métodos;
  - verificador de resposta;
  - nenhuma ferramenta grava nem recebe slug;
  - ids de outra loja;
  - falta de custo vira lacuna;
  - envelope contra instrução importada;
  - sem chave = configuração pendente;
  - limite mensal;
  - erro da IA;
  - uso e custo registrados;
  - nada salvo sem clique.
  - Usa um cliente falso: nenhuma chamada real à IA.
- **Navegador:** o fluxo acima, em 1366 px e no iPhone 13.

## Limitações conhecidas

- **Conversa com IA real:** não testada (sem chave neste ambiente). O laço, as ferramentas e os limites foram testados
  com cliente falso.
- **Variantes de produto:** opções e adicionais do cardápio não têm preço nem custo próprios aqui. Cada item do
  cardápio é um produto.
- **Medição 3D:** não há eventos de visualização, carregamento ou toque em AR; a aba 3D diz isso.
- **Grupo de controle:** sem medição automática.
- **Combo:** usa como embalagem a maior entre a dos itens, e o preço avulso vem de cada item no canal.
- **Alerta de queda de vendas:** só com 30+ unidades no período anterior, períodos do mesmo tamanho e dado até o fim
  dos dois.
- **Conversa mais longa:** as mensagens antigas ficam guardadas, mas só os últimos 6 turnos vão para a IA.
