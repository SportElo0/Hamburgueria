# Produto para restaurante: sobremesa em 3D depois de comer + IA de engenharia do cardápio (07/11/2026)

Decisão dos sócios: o produto de restaurante fica só com duas peças.
1. **Hora da sobremesa:** a sobremesa em 3D aparece no fim da refeição.
2. **Engenharia do cardápio com IA:** mostra o que vende, o que dá margem e o que mudar.

Este relatório analisa se as duas fecham um produto e como montar.

## A conclusão em uma frase

Sozinhas, as duas peças são fracas. A engenharia do cardápio já vem grátis em vários sistemas, e outros já fazem
cardápio 3D. Juntas, viram um ciclo que não achei em nenhum concorrente:

- **A engenharia escolhe** o que empurrar: sobremesas e itens de margem alta que vendem pouco.
- **O 3D empurra** isso na hora certa.
- **O painel mede** se mudou.

O dono compra o resultado medido, não o 3D nem o relatório.

## 1. O que já existe no painel (fase 1 pronta)

A aba Inteligência (`plataforma/INTELIGENCIA.md`) já tem:
- **Ficha de custos:** insumos, ficha técnica, embalagem e taxa de cada forma de pagamento.
- **Matriz do cardápio por categoria:** Estrela, Cavalo de batalha, Quebra-cabeça, Abacaxi (método Kasavana e
  Smith, 1982).
- **Margem por item.**
- **Recomendações:** "teste isto, meça aquilo", com a decisão do dono registrada.
- **Demonstração** com dados fictícios.

O pedido na mesa por QR já mostra prato em 3D e realidade aumentada.

**O que ainda não existe:**
- a hora certa da sobremesa;
- a medição da taxa de sobremesa por mesa;
- vendas de fora do painel (iFood e o sistema de caixa do restaurante);
- a parte de IA.

## 2. O que a pesquisa mostra

### Sobremesa em 3D

**A favor**
- **Estudo de campo num restaurante:**
  - pediu sobremesa 41,2% de quem viu o cardápio de sobremesas em realidade aumentada, contra 18,0% de quem viu o
    cardápio comum;
  - quem viu em realidade aumentada também gastou mais com sobremesa.
  - Fonte: Fritz, Hadi e Stephen, 2022/2023 ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9792938/)).
- **Sugestão do garçom:** pesquisa com garçons de restaurantes familiares testou meta, retorno e reconhecimento para
  eles sugerirem entrada, drinque e sobremesa
  ([The Effect of Suggestive Selling on Sales](https://www.researchgate.net/publication/275019814_The_Effect_of_Suggestive_Selling_on_Sales)).
  - Em outro levantamento, com 101 restaurantes, a sugestão do garçom variou muito
    ([Foodservice and Hospitality](https://www.foodserviceandhospitality.com/special-report-perceptions-of-suggestive-selling-in-restaurants/)).
  - **Leitura:** a sobremesa depende de alguém lembrar de oferecer. Por isso, um lembrete que não depende do humor
    do garçom vale a pena.

**Cuidados**
- **O estudo é um só:** durou duas noites, usou tablet e deu desconto para participar. Não dá para prometer o
  número; dá para repetir o teste.
- **Sem prova de exposição:** não achei estudo controlado sobre mostrar foto ou bandeja de sobremesa. Os "+16%" e
  "+30%" de blogs de sistema não têm fonte.

### Engenharia do cardápio

**A favor**
- **O método é antigo e aceito:** cruza o quanto o item vende com a margem que deixa.
- **Um estudo sério melhorou o método:**
  - Dados de 2 anos de 48 restaurantes de uma rede de churrascaria nos EUA.
  - Levar em conta que um prato "rouba" venda do outro da mesma categoria aumentou a receita líquida num
    experimento de campo.
  - Fonte: "Menu engineering re-engineered", International Journal of Hospitality Management, 2020
    ([ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0278431920300566)).
  - **Lição:** não basta classificar item por item; mexer em um mexe nos vizinhos.

**Contra (o que não prometer)**
- **"Aumenta o lucro em 10% a 15%":** número de fornecedor (Saipos e outros), sem teste controlado
  ([Saipos](https://saipos.com/cardapio/engenharia-de-cardapio)).
- **"Ponto doce" do cardápio:** o lugar do cardápio onde o olho bate primeiro é mito. O estudo com rastreamento do
  olhar mostrou que as pessoas leem o cardápio em ordem, como um livro (Yang, 2012)
  ([EurekAlert](https://www.eurekalert.org/news-releases/829582), [artigo](https://nicoletcollege.pressbooks.pub/app/uploads/sites/84/2024/05/Eye-Movement-2012-article.pdf)).
  Nada de vender "posição mágica".
- **"Nomes descritivos vendem 27% mais":** vem de pesquisas de um autor com vários artigos retirados (Wansink).
  Não usar.

### Concorrência

| Quem | O que faz |
|---|---|
| Saipos, Sistema Pallas, SisFood, Consumer | Relatório de engenharia de cardápio dentro do sistema de caixa, sem custo extra ([Saipos](https://saipos.com/cardapio/engenharia-de-cardapio), [SisFood](https://www.sisfood.com.br/saiba-mais/cardapio/engenharia-de-cardapio)) |
| Alô Chefia | IA no WhatsApp: compras, estoque, ficha técnica e CMV por texto ou áudio; recebeu investimento ([Startupi](https://startupi.com.br/alo-chefia-recebe-aporte-acelera-food-service/)) |
| Chateau.ia, ARK, Cardapia | Cardápio 3D ou de realidade aumentada |

Ninguém achado junta a escolha do item pela margem, o 3D na hora da sobremesa e a medição do resultado.
**Conclusão:** "engenharia de cardápio" não se vende sozinha (já é grátis). Vende como o cérebro que decide onde o 3D
entra e prova se funcionou.

## 3. Os três problemas que decidem se dá certo

1. **Custo dos pratos.** Sem custo não existe margem, e a maioria dos donos não tem ficha técnica atualizada.
   - **Saída com IA:**
     - o dono **fala** a receita em áudio ("o Cheese Salada leva um pão, 150 g de blend, duas fatias de cheddar...");
     - a IA monta a ficha técnica;
     - o preço dos insumos vem do XML ou da foto da nota fiscal de compra;
     - o dono confere e aprova.
   - **Começar só pelos itens** que somam 80% da venda. O painel já avisa quando a cobertura de custo está abaixo
     disso.
2. **Vendas que o painel não vê.**
   - Hoje a análise só enxerga pedidos que passam pelo painel.
   - Se o garçom lança no sistema de caixa (Saipos etc.) ou o pedido vem do iFood, a matriz fica cega.
   - **Saída:** importar a planilha de vendas que o dono exporta do sistema de caixa e do iFood (Financeiro >
     Exportar), sem senha, guardando só item, quantidade, preço e data, sem dados do cliente.
3. **O cliente abrir o 3D depois de comer.**
   - Ninguém pega o celular sozinho para ver sobremesa. Precisa de um gatilho:
     - **Na mesa com QR:**
       - 15 a 20 minutos depois que o prato principal sai da cozinha, a página da mesa mostra "Hora da sobremesa"
         no topo, com a sobremesa girando em 3D;
       - aparece também quando pedem a conta, antes de fechar;
       - uma vez só, fácil de fechar.
     - **Para o garçom:**
       - a tela do salão avisa "Mesa 4 terminou o prato há 15 min: oferecer sobremesa";
       - um cartãozinho com QR "Sobremesa em 3D" é deixado na mesa quando ele recolhe os pratos;
       - funciona até em mesa que pediu pelo garçom.

## 4. O que a IA faz de verdade

Regra do painel: **nenhum número vem da IA.** As contas continuam fixas no código. A IA entra onde é trabalho de
gente:

| Tarefa | Hoje | Com IA |
|---|---|---|
| Montar ficha técnica | Dono preenche planilha (não preenche) | Fala em áudio; IA monta e ele aprova |
| Preço dos insumos | Digitar um por um | Lê a nota fiscal de compra |
| Explicar o resultado | Tabela que o dono não lê | Resumo mensal em áudio, em português simples, com os números já calculados |
| Responder dúvidas | Ligar para a Growlift | "Quanto me sobra no X-Bacon no iFood?", respondido com os dados da loja |
| Escolher o que testar | Equipe olha a matriz | Sugere 1 teste por mês (ex.: "3D no Brownie, que dá 68% de margem e vende pouco"); a Growlift revisa e o dono aprova |

**Ideia nova que sai daqui: margem por canal.**
- O mesmo lanche deixa uma margem no salão e outra bem menor no iFood. Lá a comissão e as taxas vão de cerca de
  15% a 27%, somando 3,2% de pagamento online ([Jefe](https://www.chejefe.com/pt-br/blog/comissao-ifood-restaurantes-2026)).
- **O que a matriz mostra por canal:**
  - "este lanche é Estrela no salão e Abacaxi no iFood";
  - o preço no iFood que mantém a margem. O acordo do iFood com o Cade proíbe exigir preço igual em todos os canais
    ([CNN](https://www.cnnbrasil.com.br/economia/mercado/ifood-assina-termo-de-compromisso-com-cade-para-reduzir-concentracao-de-mercado/)).
- Aproveita o que foi pesquisado no Repasse Certo, sem auditoria nem contestação.

## 5. O produto fechado (proposta)

**Nome de trabalho:** Cardápio que Vende

**Entrega**
1. **Montagem:**
   - custo dos 10 itens mais vendidos (áudio + nota fiscal);
   - importação de 3 meses de vendas (painel, caixa e iFood);
   - a primeira matriz.
2. **Até 3 sobremesas ou itens escolhidos pela matriz em 3D:** escaneados com o iPhone, sem gastar crédito, a
   confirmar no teste.
3. **Hora da sobremesa:** na página da mesa, na tela do garçom e no cartão com QR.
4. **Todo mês:**
   - taxa de sobremesa por mesa;
   - margem a mais;
   - matriz por canal;
   - um teste sugerido;
   - resumo em áudio para o dono;
   - um vídeo do 3D para o Instagram.

**Preço (hipótese a testar):** R$ 497 de implantação + R$ 297/mês. Item em 3D extra: R$ 49.
- **Comparação:** o Mesa 3D sozinho estava em R$ 397 + R$ 197.
- **A conta para o dono:** se a sobremesa deixa uns R$ 12 de margem, cerca de 25 sobremesas a mais por mês pagam
  a mensalidade. Isso é conta, não promessa.

**Ao vender, não dizer:** "aumenta X%", "posição mágica no cardápio". **Dizer:** "a gente mede antes e depois e
mostra o número; se não mudar nada em 60 dias, cancela sem multa" (passar pelo `revisor-legal`).

## 6. O que construir (em ordem)

1. **Medição** (vem antes de tudo, senão não há prova):
   - taxa de sobremesa por mesa nas contas fechadas (o histórico das mesas já guarda os pedidos de cada mesa);
   - comparar mesas com e sem o cartão.
2. **Hora da sobremesa:**
   - aviso na página da mesa (depois do prato principal e ao pedir a conta);
   - aviso na tela do garçom;
   - cartão com QR para imprimir;
   - liga e desliga por loja e escolhe quais itens aparecem.
3. **Importar vendas:** planilha do iFood e do sistema de caixa para a matriz, mais a margem por canal.
4. **IA da ficha técnica:** áudio para ficha e nota fiscal para preço do insumo, sempre com aprovação do dono.
   Usa a IA que o painel já tem, com teto de gasto.
5. **Resumo mensal em áudio** e perguntas do dono (voz brasileira, ouvir amostra antes).

**Revisões:**
- `revisor-seguranca` antes do item 3 (planilhas) e do 4 (notas fiscais);
- `revisor-legal` na oferta e na garantia.

## 7. Teste antes de vender para muitos (4 semanas, The Burguest)

1. **Semanas 1 e 2:** medir a taxa de mesas que pedem sobremesa, sem mudar nada (relatório do caixa ou do painel).
2. **Preparação:** montar o custo dos itens principais e escanear 2 sobremesas (Chocolamour) com o iPhone.
3. **Semanas 3 e 4:** ligar a Hora da sobremesa em metade das mesas, sorteadas, e medir as duas metades.
4. **Seguir se:**
   - a taxa subir pelo menos 5 pontos ou saírem pelo menos 20 sobremesas a mais no mês;
   - e o dono quiser pagar.

## Limites

- O estudo de realidade aumentada é um só, curto e fora do Brasil.
- Não achei estudo controlado sobre mostrar a sobremesa no fim da refeição; o teste com metade das mesas é o que vai
  responder.
- Preços dos concorrentes de IA (Alô Chefia) não são públicos.
- Preços sugeridos são hipóteses.
