# Análise do preço do Scale (R$ 897/mês + implantação de R$ 1.500)

31/10/2026. O Scale é o plano da casa com salão: tudo do Grow, mais pedido na mesa pelo QR, números do restaurante inteiro, perguntas à IA e uma revisão mensal com vocês. Proposta: fidelidade de 4 meses, sem teste grátis, e implantação de R$ 1.500, isenta no lançamento.

**Suposição** marca o que é estimativa minha (principalmente horas e custos de vocês).

## Veredito

1. **R$ 897 é o preço certo para o Scale de hoje.** Não é barato nem caro: é o Grow (R$ 597) mais R$ 300, e esses R$ 300 cobrem o sistema da mesa (R$ 70 a R$ 180 no mercado) e a revisão mensal feita por gente.
2. **Não dá para justificar mais que isso agora.** Metade do que o documento dos planos promete ainda não existe: pagar na mesa, quiz, fechamento do dia e IA. E o pedido na mesa, sozinho, já se compra por R$ 70 por mês sem taxa de instalação.
3. **Lançamento:** R$ 897 de fundador, garantido por 12 meses, para 5 restaurantes. Depois do piloto e das peças que faltam, **R$ 997** para clientes novos. R$ 1.097 só se a IA e a revisão mensal mostrarem valor claro no piloto.
4. **Implantação de R$ 1.500: cuidado.** Os concorrentes do pedido na mesa não cobram instalação e dão até 60 dias grátis. Isentar no lançamento é ótimo. Depois, R$ 1.500 vira uma barreira: sugiro **R$ 997, parcelável em 3 vezes**, mantendo o R$ 1.500 só se a implantação incluir coisa física e presencial (placas de acrílico em todas as mesas e treino no restaurante).
5. **O maior custo escondido do Scale é o suporte na hora do movimento.** Se o pedido na mesa falhar num sábado às 21h, o salão para. Isso exige alguém de plantão nos horários de pico e a infraestrutura paga (Vercel Pro e Supabase Pro). É o que mais justifica o Scale custar mais que o Grow.
6. **O piloto é a pesquisa de preço que falta.** Antes de abrir as vendas, meçam no restaurante parceiro, por 4 semanas, antes e depois: tempo até o primeiro pedido, ticket médio por mesa, pedidos errados e mesas atendidas no pico. Sem esses números, o valor do Scale é promessa.

## 1. O que o Scale tem hoje e o que ainda não tem

| Peça do Scale | Situação no código |
|---|---|
| Tudo do Grow (site, pedido, Pix, Google, campanha) | pronto |
| Pedido na mesa pelo QR (código da mesa, garçom confirma, chamar garçom, pedir a conta) | **pronto e testado** (sem restaurante usando ainda) |
| Tela do salão no celular do garçom e QR para imprimir | pronto |
| Custo de cada produto e resumo do mês (Inteligência) | primeira parte pronta |
| Pagar na mesa pelo celular, com conta dividida | **não existe** |
| Quiz entre as mesas | **não existe** |
| Fechamento do dia (balcão, delivery, telefone) | **não existe** |
| Números do restaurante inteiro e combos sugeridos | parcial |
| Perguntas à IA | **não existe** |
| Revisão mensal com vocês | é trabalho, não código: pode começar já |

Regra: **só se vende e se anuncia o que está pronto.** O Scale do lançamento é "Grow + pedido na mesa + custos + revisão mensal". O resto entra no preço quando existir.

## 2. Quanto o Scale custa no mercado, parte por parte

| Parte | Preço de mercado | De onde vem |
|---|---|---|
| Tudo do Grow | R$ 360 a R$ 1.050 (meio da faixa: ~R$ 700) | `reports/Análise do Grow 2026-10-31.md` |
| Pedido na mesa com QR, garçom pelo celular, painel da cozinha e CMV por prato | **R$ 69,90 a R$ 99,90**, sem taxa de instalação, sem fidelidade, 60 dias grátis | QRCode na Mesa |
| Plataforma de pedido na mesa com treino da equipe | a partir de R$ 179 (cardápio com QR grátis) | Menus Online |
| Pedido na mesa dentro de um cardápio digital maior | R$ 99,90 a R$ 299,90 (modo mesa: a mesa toda numa conta só) | Goomer |
| Faixa geral de sistemas de mesa para casa pequena | R$ 80 a R$ 180 | Sisfood, Rei do Delivery |
| Revisão mensal dos números com alguém | não achei preço público de consultoria mensal para restaurante | — |
| **Soma do Scale de hoje** | **R$ 430 a R$ 1.230**, mais a revisão | |

**O que isso mostra:** o pedido na mesa sozinho é **commodity barata**. Um restaurante consegue por R$ 70 por mês, sem instalação e sem fidelidade. O Scale não pode ser vendido como "sistema de mesa". Tem que ser vendido como **o restaurante inteiro feito por gente**: site, Google, campanha, mesa e uma conversa por mês sobre os números, tudo num lugar só.

**O que o Scale tem de melhor que o barato** (verificado no código):
- o primeiro pedido de cada mesa só vai para a cozinha depois que o garçom confirma (evita pedido de trote);
- o código da mesa expira quando a conta fecha (foto do QR não serve para pedir de fora);
- tudo no mesmo painel do delivery, dos cupons e dos clientes.

**O que o barato tem e o Scale ainda não:**
- pagamento online no pedido da mesa (a Goomer já tem);
- controle de estoque;
- 60 dias grátis.

## 3. O Scale vale a pena para o restaurante?

No salão não tem comissão de iFood para economizar. O valor está em outro lugar: tempo da equipe, mesa girando mais rápido, menos pedido errado. **Nada disso foi medido ainda.** Os fornecedores dizem que pedido pelo QR aumenta o ticket, mas não achei estudo independente.

Um jeito de pensar no tamanho do preço, **só para conta interna**: o piso de um garçom em São Paulo é de R$ 1.804 (com reajuste em andamento para R$ 1.874). Com os encargos da CLT, o custo para o restaurante fica perto de R$ 3.000 a R$ 4.000 por mês. O Scale custa cerca de um quarto disso.

**Isso não pode virar promessa.** O documento dos planos já proíbe prometer redução de equipe. O argumento honesto é: "nos dias cheios, a mesma equipe dá conta de mais mesas". E só depois de o piloto mostrar isso com números.

**Para quem o Scale é:** casa com salão e movimento. Com faturamento de R$ 50 mil por mês, R$ 897 são 1,8%. Uma casa pequena só de balcão não precisa do Scale.

## 4. Quanto o Scale custa para vocês

**Horas por mês (suposição):**

| Tarefa | Horas/mês |
|---|---|
| Rotina do Grow | 10 (6, se cortarem horas como na análise do Grow) |
| Suporte do pedido na mesa (dúvidas, mesas, QR novo) | 1 |
| Preparar e fazer a revisão mensal | 2,5 |
| Plantão nos horários de pico (estar disponível, não trabalhando o tempo todo) | ver abaixo |
| **Total** | **~13,5 h** (ou ~9,5 h com o Grow enxuto) |

**Implantação (suposição):** 15 a 25 horas, com cardápio no sistema, QR de todas as mesas, configuração do salão e da cozinha, treino da equipe e acompanhamento no primeiro dia de uso.

**Dinheiro que sai do bolso:**

| Custo | Valor |
|---|---|
| Placas de QR em acrílico | R$ 5 a R$ 15 por mesa (15 mesas: R$ 75 a R$ 225), uma vez |
| Deslocamento para treino e primeiro dia | R$ 100 a R$ 300 por implantação (suposição) |
| IA (quando existir) | poucos reais por cliente, com limite de perguntas (conferir preço da API) |
| Infraestrutura confiável (Vercel Pro + Supabase Pro) | ~R$ 250 por mês no total, dividido entre todos os clientes |

**O plantão é o ponto mais importante.** O Grow pode esperar até o dia seguinte. O Scale, não: se o pedido na mesa parar numa sexta à noite, o restaurante fica sem pedido no salão. Antes de vender, decidam:
- **horário de suporte:** por exemplo, sexta e sábado das 18h às 23h, com resposta em até 15 minutos;
- **plano B no contrato:** se o sistema cair, o garçom volta ao pedido no papel ou pela tela do salão, e vocês resolvem até o dia seguinte;
- **quem fica de plantão:** o Antônio é menor de idade, então o plantão da noite não deveria ficar com ele.

**Quanto sobra por hora:**

| Situação | Conta | Por hora |
|---|---|---|
| Rotina, com o Grow como hoje | R$ 897 ÷ 13,5 h | **R$ 66** |
| Rotina, com o Grow enxuto | R$ 897 ÷ 9,5 h | **R$ 94** |
| 4 meses, implantação isenta | R$ 3.588 ÷ (20 + 54 h) | R$ 48 |
| 4 meses, implantação de R$ 1.500 paga | R$ 5.088 ÷ (20 + 54 h) | R$ 69 |
| 4 meses, implantação de R$ 997 paga | R$ 4.585 ÷ (20 + 54 h) | R$ 62 |

## 5. A implantação de R$ 1.500

**A favor:**
- o trabalho existe (15 a 25 horas);
- funciona como âncora: "R$ 1.500 de implantação, isenta para os 5 fundadores" é uma oferta forte e verdadeira;
- protege vocês de quem quer experimentar sem compromisso.

**Contra:**
- QRCode na Mesa e Menus Online não cobram instalação, e o primeiro dá 60 dias grátis;
- somando com o primeiro mês, são R$ 2.397 para começar. Para restaurante, é pedir muito antes de ver funcionando.

**Sugestão:**
- **Lançamento:** isenta para os 5 fundadores. Quem sair antes dos 4 meses paga a parte proporcional dos R$ 1.500 (como já é feito com a criação do site).
- **Depois:** R$ 997, parcelável em 3 vezes, ou R$ 1.500 só se a implantação incluir as placas de acrílico em todas as mesas e o treino presencial. O que estiver incluído vai escrito na proposta.
- **A taxa tem que ser cobrada de verdade depois do lançamento.** Senão a "isenção" vira desconto falso.

## 6. Fidelidade e teste grátis

- **4 meses sem teste grátis é razoável**, porque cada cliente custa a implantação inteira. Mas os concorrentes dão 60 dias grátis, então vocês precisam de outra garantia para tirar o medo:
  - **7 dias para desistir sem multa** (já está no padrão do site);
  - **"o primeiro mês só começa a contar quando o pedido na mesa estiver funcionando no salão"**, o que é justo e mostra confiança.
- Plano anual: 12 vezes de R$ 807 (10% de desconto), com 12 meses de fidelidade e a implantação isenta. Bom para quem já conhece vocês pelo Grow.
- **Cliente do Grow que sobe para o Scale:** implantação com desconto, porque site, Google e cardápio já estão prontos (só falta a parte da mesa).

## 7. Outros preços possíveis

| Preço | A favor | Contra |
|---|---|---|
| R$ 797 | Mais fácil de vender | Só R$ 200 acima do Grow, e o salto parece não valer o plantão |
| **R$ 897 (lançamento)** | Grow + sistema de mesa + revisão, preço de mercado | Paga uns R$ 66 por hora com o Grow como está hoje |
| **R$ 997 (depois do piloto)** | Abaixo de R$ 1.000; cobre o plantão; escada 247 → 597 → 997 | Precisa de prova do piloto e das peças que faltam |
| R$ 1.097 | Margem boa | Só com IA e revisão mostrando valor; perto de R$ 1.100 a venda fica mais difícil |

Sobre a escada: Start R$ 247 → Grow R$ 597 (2,4x) → Scale R$ 897 (1,5x). O salto pequeno do Grow para o Scale ajuda a vender upgrade para quem já é Grow. Com R$ 997 ele fica em 1,67x, ainda suave.

## 8. Oferta de lançamento recomendada

- **Scale Fundador: R$ 897/mês, garantido por 12 meses, para 5 restaurantes.**
- **Implantação de R$ 1.500 isenta**, com a parte proporcional se sair antes de 4 meses.
- **O que está incluído, por escrito:** tudo do Grow; pedido na mesa com QR para todas as mesas; tela do salão no celular do garçom; custos de cada produto; revisão mensal de uma conversa; suporte nos horários combinados.
- **O que não está incluído e virá depois, sem custo para os fundadores:** pagar na mesa e perguntas à IA, quando estiverem prontos. Só prometam isso se tiverem certeza de que vão fazer.
- **Depois dos 5:** R$ 997 e implantação de R$ 997 (ou R$ 1.500 com acrílico e treino presencial).
- Revisão legal da oferta, do contrato e do anúncio antes de publicar.

## 9. O que medir no piloto

Por 4 semanas, com uma semana antes do QR para comparar:

| Métrica | Como medir |
|---|---|
| Tempo do sentar ao primeiro pedido | horário em que a mesa abre × primeiro pedido (já fica registrado no sistema) |
| Ticket médio por mesa | total da mesa ao fechar a conta |
| Pedidos por mesa | contagem no sistema |
| Pedidos errados ou devolvidos | anotação da cozinha |
| Mesas atendidas no horário de pico | contagem por noite |
| Chamados de garçom e tempo até atender | registro do sistema |
| O que a equipe e os clientes acharam | 5 perguntas no fim do piloto |

Esses números, **com autorização por escrito do restaurante**, viram o conteúdo do lançamento e a base para decidir entre R$ 997 e R$ 1.097.

## Fontes

- Planos: documento "Planos da Growlift para restaurantes" (29/10/2026); `reports/Análise do Grow 2026-10-31.md`; código em `plataforma/` (mesas, salão, Inteligência).
- Pedido na mesa: [QRCode na Mesa](https://qrcodenamesa.com.br/); [Menus Online](https://menusonline.com.br/); [Consumer](https://consumer.com.br/cardapio-qr-code-na-mesa); [Saipos sobre a Goomer](https://saipos.com/cardapio-digital/goomer); [Goomer, modo mesa](https://ajuda.goomer.com.br/goomergo/painel/naloja/meus-qr-codes/modo-de-operacao-mesa); [Sisfood](https://www.sisfood.com.br/saiba-mais/sistema-pdv/quanto-custa-sistema-restaurante); [Rei do Delivery](https://reidodelivery.com.br/blog/quanto-custa-cardapio-digital); [Tabres](https://tabres.com/articles/how-much-does-a-qr-code-menu-cost).
- Garçom: [Salário Brasil](https://www.salario.com.br/profissao/garcom-cbo-513405/); [Barbieri Advogados, piso regional 2026](https://www.barbieriadvogados.com/?p=8836); [IOB](https://noticias.iob.com.br/?p=88449); [TJSP, estudo de composição de preços](https://www.tjsp.jus.br/Download/Transparencia/Licitacoes/Estudo-Tecnico-de-Composicao-de-Precos-Copeiro-e-Garcom-MAIO-2025.pdf).
- Infraestrutura: [Supabase](https://supabase.com/pricing); [Vercel Pro](https://vercel.com/docs/accounts/plans/pro).
