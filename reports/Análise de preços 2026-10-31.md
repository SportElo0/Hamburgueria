# Análise rigorosa dos preços da Growlift (31/10/2026)

Planos analisados: **Start R$ 247**, **Grow R$ 597**, **Scale R$ 897** (+ implantação de R$ 1.500 isenta no lançamento) e a oferta em inglês (**US$ 40 × 12 + US$ 47/mês**). Base: o documento "Planos da Growlift para restaurantes" (29/10), o relatório de preços de 28/10 (`reports/Preços dos planos Growlift.md`) e pesquisa nova de mercado.

Tudo que é **suposição** está marcado assim. O principal: as horas de trabalho por cliente são estimativas minhas, porque vocês ainda não mediram. O primeiro passo prático é anotar as horas reais dos próximos clientes.

## Resumo em 8 pontos

1. **O Start (R$ 247) é o plano que mais paga por hora**, cerca de R$ 120 por hora depois que o site está pronto. Grow e Scale pagam a metade disso, perto de R$ 60 por hora (suposição de horas). Ou seja: hoje, quanto "maior" o plano, pior a hora de vocês.
2. **Grow (R$ 597) está no preço certo de mercado, mas é muito trabalho pelo preço.** A soma do que ele substitui (sistema de pedido + gestão do Google + site) fica entre R$ 550 e R$ 1.050. O problema não é o preço, é a quantidade de horas da rotina mensal. Solução: padronizar e automatizar (modelos de resposta, relatório automático) antes de subir preço.
3. **O Scale (R$ 897) está barato para o que promete, mas metade do que promete ainda não existe.** Pagar na mesa, quiz, fechamento do dia e IA não estão prontos. Só dá para cobrar pelo que existe: pedido na mesa + tudo do Grow + revisão mensal.
4. **Recomendação para o Scale:** lançar a R$ 897 como **preço de fundador, garantido por 12 meses, para os primeiros 5 restaurantes**, e anunciar que o preço cheio será R$ 1.097 quando pagar na mesa e a IA estiverem prontos.
5. **Implantação de R$ 1.500: o valor é justo** (15 a 25 horas de trabalho, suposição) **e a isenção no lançamento funciona**, desde que: a taxa seja cobrada de verdade depois; e quem sair antes dos 4 meses pague a parte proporcional, como já é feito com a criação do site.
6. **A oferta em inglês está barata para a Islândia.** O primeiro ano sai cerca de 45% mais barato que um site simples islandês com manutenção. Dá para subir, mas eu manteria o preço para os 3 primeiros clientes (vocês ainda não têm nenhum caso lá) e subiria depois para US$ 49 × 12 + US$ 59/mês.
7. **O limite do MEI chega rápido.** São R$ 81 mil por ano (R$ 6.750 por mês, em média). 3 Scale + 4 Grow + 3 Start já somam R$ 5.820 por mês, e uma implantação de R$ 1.500 no mesmo mês passa do teto. Passar de 20% acima do teto tira o MEI com efeito retroativo. Precisam de contador **antes** do lançamento do Scale. (Com as horas de hoje, essa mistura também não caberia no tempo de vocês: seria uns 90 horas por mês.)
8. **Três riscos que não são de preço, mas podem custar caro:** (a) não está claro se criação de sites é atividade permitida ao MEI; (b) o plano grátis da Vercel não permite uso comercial; (c) o banco grátis do Supabase não faz backup. Os três têm solução barata (abaixo).

## 1. Quanto cada plano paga por hora de trabalho

Horas por mês e de implantação são **suposições** (não medidas). Troquem pelos números reais assim que tiverem.

| Plano | Preço | Horas/mês (suposição) | R$ por hora (rotina) | Horas da criação/implantação (suposição) | R$ por hora no período de fidelidade, contando a criação |
|---|---|---|---|---|---|
| Start | R$ 247 | 2 h (2 alterações, conferência, horários, WhatsApp) | **R$ 123** | 12 h (site + Google), diluídas em 6 meses | R$ 62 |
| Grow | R$ 597 | 10 h (4 alterações, avaliações, 4 posts no Google, fotos, relatório, campanha, suporte do pedido) | **R$ 60** | 20 h, diluídas em 4 meses | R$ 40 |
| Scale com implantação isenta | R$ 897 | 15 h (Grow + mesa + revisão mensal) | **R$ 60** | 20 h, diluídas em 4 meses | R$ 45 |
| Scale com implantação paga | R$ 897 + R$ 1.500 | 15 h | R$ 60 | 20 h | R$ 64 |

Como ler: no primeiro período, o Grow paga cerca de R$ 40 por hora. Isso é pouco para quem faz site, Google, campanha e atendimento. **O que mais muda essa conta não é o preço, é cortar horas**:

- respostas de avaliação com modelos por tipo (elogio, reclamação de demora, preço), personalizadas em 2 minutos;
- relatório mensal gerado sozinho pelo painel (já existem os dados de pedido; falta puxar os do Google);
- campanha com 3 modelos que se revezam, mudando só a oferta;
- alteração pedida por formulário, não por áudio de WhatsApp.

Se o Grow cair de 10 para 6 horas por mês, ele passa a pagar R$ 100 por hora sem mudar o preço.

## 2. Capacidade: quantos clientes vocês aguentam

**Suposição:** 60 horas por mês para atender clientes. Vocês são dois, o Antônio estuda, e uma parte do tempo vai para vendas e conteúdo.

| Se fosse só um plano | Clientes possíveis | Faturamento mensal |
|---|---|---|
| Só Start (2 h) | 30 | R$ 7.410 (passa do MEI) |
| Só Grow (10 h) | 6 | R$ 3.582 |
| Só Scale (15 h) | 4 | R$ 3.588 |
| Mistura: 8 Start + 2 Grow + 1 Scale (51 h) | 11 | R$ 4.067 |

Conclusão: com as horas de hoje, **o teto de faturamento de vocês é de R$ 3.500 a R$ 4.500 por mês**, a não ser que o Start vire a maior parte ou que as rotinas fiquem mais rápidas. Isso também mostra que a oferta do Scale deve ser **por vagas** ("5 restaurantes neste lançamento"), porque é verdade: não cabem mais.

## 3. Start, R$ 247

**Mercado:** site por assinatura de R$ 60 (IN9, mais ativação) a R$ 147 (Izynet, mais R$ 997 de implantação). A configuração do Google, avulsa, custa R$ 800 a R$ 2.000 uma vez. Gestão do perfil por freelancer: R$ 120 a R$ 200 por mês.

**Análise:** o Start está acima de "só site", mas inclui o Perfil do Google configurado e conferido todo mês, sem cobrar implantação. É coerente. Para um MEI no teto, R$ 247 é 3,7% do faturamento: pesado, mas possível.

**Veredito: manter.** É o plano mais lucrativo por hora e o mais fácil de vender. Proteger com regra clara do que é alteração (já está escrito no documento dos planos).

## 4. Grow, R$ 597

**Mercado:** Anota AI de R$ 99,99 a R$ 299,99; Goomer de R$ 99,90 a R$ 299,90; gestão do Google a partir de R$ 299 em agência; pacote de agência "Google + SEO + anúncios" a R$ 597. Somando site, Google e pedido, fica entre R$ 550 e R$ 1.050.

**Análise:** o preço está na parte de baixo da soma das partes, o que é bom para vender. O risco está nas horas (seção 1). Para o restaurante, o Grow se paga quando cerca de R$ 4.200 por mês em vendas saem do iFood Básico para o site, uns 70 pedidos de R$ 60 (conta do relatório de 28/10). Mais da metade dos restaurantes quase não usa app de delivery, então para esses o valor está no Google e na campanha, não na comissão.

**Veredito: manter R$ 597 agora.** Rever para R$ 697 depois de 3 clientes com relatório mensal de verdade, e só se a rotina estiver cumprida todo mês. Cortar horas é mais urgente que subir preço.

## 5. Scale, R$ 897

**Mercado do pedido na mesa:** sistemas só de QR e pedido na mesa custam de R$ 80 a R$ 300 por mês (Goomer de R$ 99,90 a R$ 299,90 com modo mesa; Consumer com QR na mesa a partir de R$ 44,90 no plano anual; outros a R$ 99,90 e R$ 180). Algumas plataformas cobram comissão de 5% a 15% por pedido em vez de mensalidade. O valor de implantação dos sistemas grandes (Saipos, Consumer, Colibri) não é público.

**Soma do que o Scale entrega hoje:** Grow (R$ 550 a R$ 1.050 em mercado) + pedido na mesa (R$ 80 a R$ 300) + revisão mensal com gente = **R$ 630 a R$ 1.350**. R$ 897 está no meio.

**O que pesa contra cobrar mais agora:**
- Pagar na mesa, quiz, fechamento do dia e IA **não existem ainda**. Não dá para cobrar (nem anunciar) o que não está pronto.
- Ainda não tem piloto. Sem número real do piloto, o valor do pedido na mesa (menos erro, mesa mais rápida) é promessa.
- O salto do Grow para o Scale é de só R$ 300 (1,5x), contra 2,4x do Start para o Grow. Isso faz o Scale parecer barato perto do Grow.

**Veredito:**
- **Lançamento:** R$ 897 como preço de fundador, garantido por 12 meses, para os primeiros 5 restaurantes. É verdade (vocês só aguentam uns 4 ou 5) e cria motivo para decidir na hora.
- **Depois:** R$ 1.097 quando pagar na mesa e a IA estiverem prontos e testados. Fica abaixo de R$ 1.100, mantém o padrão do 7 e deixa a escada mais equilibrada (247 → 597 → 1.097).
- **Fidelidade:** 4 meses, sem teste grátis (como no documento).

## 6. Implantação de R$ 1.500

**É justa?** Sim. São 15 a 25 horas (suposição): cardápio no sistema, QR impressos, configuração do salão, treino da equipe e acompanhamento no primeiro dia. Isso dá de R$ 60 a R$ 100 por hora. Como referência, a Izynet cobra R$ 997 só para implantar um site.

**Custos que saem do bolso de vocês em cada implantação (suposição):**
- QR em acrílico: R$ 5 a R$ 15 por mesa; 15 mesas são R$ 75 a R$ 225;
- deslocamento para o treino presencial: R$ 100 a R$ 300.

**A isenção no lançamento funciona se:**
1. a taxa for cobrada de verdade depois (senão é desconto falso, propaganda enganosa);
2. o contrato disser: "implantação isenta para quem cumprir os 4 meses; quem sair antes paga a parte proporcional de R$ 1.500". Isso protege vocês do cliente que entra só pela isenção;
3. a oferta tiver prazo ou vagas reais.

**Conta para vocês:** com a isenção, os 4 meses de fidelidade rendem R$ 3.588 por cerca de 80 horas (20 de implantação + 60 de rotina), uns R$ 45 por hora. Cobrando a implantação, o mesmo cliente rende R$ 5.088, uns R$ 64 por hora. A isenção é investimento em ter os primeiros casos; não vale para sempre.

## 7. Oferta em inglês (US$ 40 × 12 + US$ 47/mês)

**Islândia (câmbio de ~122 coroas por dólar, outubro de 2026):**

| Referência islandesa | Preço | Em dólar |
|---|---|---|
| Site institucional simples (Herrabyte) | 179.000 ISK uma vez | ~US$ 1.470 |
| Site pequeno (Kvika Studio) | a partir de 190.000 ISK | ~US$ 1.560 |
| Site por assinatura (Vefsson) | 19.990 ISK/mês, 6 meses de fidelidade | ~US$ 164/mês |
| Manutenção (55.is) | 5.990 ISK/mês | ~US$ 49/mês |
| Hora de desenvolvimento (Kvika) | 11.500 ISK + IVA | ~US$ 94/h |
| Wix ou Squarespace, o próprio dono monta | US$ 17 a 39/mês | — |

**Comparação do primeiro ano:** Growlift US$ 1.044. Site simples islandês com manutenção, uns US$ 1.900 (US$ 1.470 + 9 meses a US$ 49). **A Growlift sai cerca de 45% mais barata**, e por mês custa metade do site por assinatura islandês.

**Quanto sobra para vocês (taxas oficiais do Stripe Brasil):** cartão nacional 3,99% + R$ 0,39; cartão estrangeiro +2%; assinatura (Billing) +0,7%. No total, uns 6,7% por cobrança, mais a diferença de câmbio na hora de converter para real.
- US$ 87 → sobram uns **US$ 81** por mês no primeiro ano.
- US$ 47 → sobram uns **US$ 44** por mês depois. Em reais, é parecido com um Start, mas com atendimento em inglês e fuso diferente.

**Veredito:** está barato. Mas vocês não têm nenhum cliente, nenhum caso e nenhuma prova lá, e o desconto compensa a desconfiança de contratar uma agência estrangeira remota. **Manter para os 3 primeiros clientes e depois subir para US$ 49 × 12 + US$ 59/mês** (US$ 108 por mês no primeiro ano, ainda abaixo da assinatura islandesa). Quem já contratou fica no preço contratado.

## 8. Custos fixos de vocês

Câmbio usado: **R$ 5,50 por dólar (suposição; confiram)**.

| Custo | Quando | Por mês | Por quê |
|---|---|---|---|
| Vercel Pro | **já** | ~R$ 110 (US$ 20 por membro) | O plano grátis (Hobby) proíbe uso comercial, e os sites de clientes são uso comercial |
| Supabase Pro | assim que o painel tiver dados de clientes | ~R$ 138 (US$ 25) | O grátis pausa o banco depois de 1 semana parado, não faz backup e tem 500 MB |
| ManyChat pago | se o Reel passar de 25 pessoas por mês | ~R$ 90 a 100 (US$ 15 a 17, conferir) | O grátis atende só 25 contatos |
| DAS do MEI | já | ~R$ 80 a 90 (suposição) | Imposto fixo do MEI |
| Domínio .com.br | por cliente | ~R$ 3,40 (R$ 40 por ano) | O site promete domínio por conta da Growlift |
| IA do Scale | por cliente do Scale | estimativa de poucos reais, com limite de perguntas | Conferir o preço da API escolhida antes |

**Total: uns R$ 420 a 480 por mês.** Dois clientes Start pagam tudo.

## 9. O limite do MEI

- O teto é de R$ 81 mil por ano, R$ 6.750 por mês em média. Até 20% acima (R$ 97.200), vocês continuam MEI até dezembro, pagando a diferença. Acima disso, perdem o MEI com efeito retroativo.
- Um projeto de lei (PLP 186/2026) que sobe o teto para R$ 110 mil em 2027 e R$ 140 mil em 2028 passou pelo Congresso e aguarda sanção, segundo uma notícia de 28/10. Ainda não vale.
- Exemplos perto do teto:
  - 3 Scale + 4 Grow + 3 Start = R$ 5.820 por mês;
  - com uma implantação de R$ 1.500 em algum mês, passa de R$ 6.750.
- Hoje o tempo de vocês trava antes do MEI (seção 2). Mas, se as rotinas ficarem mais rápidas ou se o Start crescer, o MEI vira o limite.
- **Atividade:** as fontes não concordam se criação de sites é permitida ao MEI. Algumas dizem que "desenvolvedor de sites" está na lista; outras dizem que programação de sites está vetada. Um contador precisa conferir o CNAE do CNPJ do Lucas.
- **Exterior:** a receita da Islândia também precisa ser vista pelo contador (como entra no limite, nota de exportação).

**Recomendação:** contratar um contador antes do lançamento do Scale, já planejando a passagem para ME no Simples Nacional. Nesse momento, a carga vai depender do CNAE e do pró-labore (fator R).

## 10. O que eu faria, em ordem

1. **Agora:** passar a Vercel para o Pro e marcar contador.
2. **Agora:** começar a anotar as horas de cada cliente. Em 1 mês, esta análise fica com números reais em vez de suposições.
3. **Antes do lançamento do Scale:** cortar horas do Grow com modelos e relatório automático.
4. **Lançamento do Scale:** R$ 897 de fundador por 12 meses, 5 vagas, implantação de R$ 1.500 isenta com a cláusula da parte proporcional. Revisão legal da oferta antes de publicar.
5. **Depois do piloto e de pagar na mesa/IA prontos:** Scale a R$ 1.097 para clientes novos.
6. **Inglês:** manter até 3 clientes, depois US$ 49 × 12 + US$ 59/mês.
7. **Grow:** rever para R$ 697 depois de 3 clientes com relatório mensal cumprido.
8. **Start:** não mexer.

## Fontes

- Planos e relatório anterior: documento "Planos da Growlift para restaurantes" (29/10/2026); `reports/Preços dos planos Growlift.md` (28/10/2026), com as fontes de Anota AI, Goomer, iFood, IN9, Izynet, Foco SEO e outras.
- Pedido na mesa: [Rei do Delivery](https://reidodelivery.com.br/blog/quanto-custa-cardapio-digital); [Consumer, QR na mesa](https://consumer.com.br/cardapio-qr-code-na-mesa); [Sisfood](https://www.sisfood.com.br/saiba-mais/sistema-pdv/quanto-custa-sistema-restaurante); [Tabres](https://tabres.com/articles/how-much-does-a-qr-code-menu-cost); [Saipos sobre a Goomer](https://saipos.com/cardapio-digital/goomer); [Goomer, modo mesa](https://ajuda.goomer.com.br/goomergo/painel/naloja/meus-qr-codes/modo-de-operacao-mesa).
- Implantação de sistemas: [Saipos](https://saipos.com/sistema/restaurante/melhor-sistema-para-restaurante); [Sisfood](https://www.sisfood.com.br/saiba-mais/sistema-pdv/melhor-sistema-restaurante-otimizado) (valores de implantação não são públicos).
- Google: [Asaas, Gestão Completa Local](https://www.asaas.com/c/i5f7lu7xu7jbqpwb); [Workana](https://www.workana.com/job/preciso-de-alguem-para-cuidar-dos-gmns-google-meu-negocio-dos-meus-clientes).
- Islândia: [Kvika Studio](https://kvika.studio/en/thjonusta/vefsidugerd); [Herrabyte](https://herrabyte.is/verdskra/); [Vefsson](https://vefsson.is/); [55.is](https://55.is/vefsidugerd); [Creatif](https://creatif.agency/how-much-does-it-cost-to-design-a-website-in-iceland/); câmbio: [Money Exchange Rate](https://moneyexchangerate.org/currencyexchange/isk/usd/1500); Wix e Squarespace: [Style Factory](https://www.stylefactoryproductions.com/blog/squarespace-vs-wix).
- Stripe Brasil: [stripe.com/br/pricing](https://stripe.com/br/pricing).
- Vercel: [Vercel Pro](https://vercel.com/docs/accounts/plans/pro); [Livemy](https://livemy.app/blog/vercel-pricing). Supabase: [supabase.com/pricing](https://supabase.com/pricing). ManyChat: [Blotato](https://www.blotato.com/blog/manychat-pricing).
- MEI: [Contmatic](https://simplifique.contmatic.com.br/blogs/mei-2026-limite-faturamento-o-que-muda); [Mix Vale, PLP 186/2026](https://www.mixvale.com.br/2026/10/28/mei-mantem-teto-de-r-81-mil-em-2026-e-plp-186-2026-aguarda-sancao/); atividade de sites: [Contabilidade Zen](https://www.contabilidadezen.com.br/blog/dev-mei-limites-atividades-2026/), [Meu Contador Online](https://www.meucontadoronline.com.br/blog/mei-em-ti-atividades-permitidas-riscos-fiscais).
