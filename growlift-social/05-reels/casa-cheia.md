# Série "Casa Cheia" (Reels 17 em diante, 05/11)

**A ideia:** uma série fixa, com os mesmos personagens em todo episódio, que ensina gestão de restaurante sem jargão. Cada episódio é uma situação do dia a dia da Panela da Rosa e explica **um nome difícil** (CMV, engenharia de cardápio, CRM, ticket médio, fechamento do mês). O valor vem primeiro; o Scale aparece no máximo numa frase, e só quando faz sentido.

Tudo é inventado: restaurante, pessoas, pratos e números. Os bonequinhos são desenhados em código pela Growlift (`_fonte/reels/novos/elenco.mjs`), sem foto e sem marca real.

## O elenco

| Personagem | Quem é | Jeito | Aparece em |
| --- | --- | --- | --- |
| **Rosa** | Dona da Panela da Rosa, cozinha de bairro em São Paulo. Herdou as receitas da mãe. | Manda muito bem no tempero, se perde nas contas. Bordão: "Mas vendeu tanto…" | todos |
| **Mel** | Filha da Rosa, estuda administração. | Explica os nomes difíceis com a calculadora na mão, sem enrolar. | todos |
| **Beto** | Garçom, jovem, rápido e simpático. | "Já tô indo!" Esquece a comanda no bolso. | ep. 3 e próximos |
| **Seu Juca** | Cozinheiro há 30 anos, de bigode e chapéu. | Ranzinza com letra ruim na comanda: "Que letra é essa?" | próximos |
| **Dona Cida** | Cliente fiel, toda sexta na mesa 4. | Pede sempre frango com quiabo. | ep. 3 |
| **Os pratos** | Picanha (de óculos escuros), Parmegiana (suando), Risoto (tímido), Sopa (de coroa de abacaxi). | Viram os papéis da engenharia de cardápio. | ep. 2 |

Cores: Rosa de avental vermelho; Mel de roxo, de óculos; Beto de colete preto e gravata borboleta vermelha; Dona Cida de rosa, cabelo branco.

## Regras da série

- Mesmo visual dos Reels de história (fundo escuro, legenda grande, selo "CASA CHEIA · EP. N" no topo, "Comenta PALAVRA" no fim).
- Números só de exemplo, dentro da história, e marcados "exemplo" quando parecem dado real. Nunca "aumenta vendas" nem resultado prometido. Sugestão é "teste", não promessa.
- Mensagem para cliente sempre **só para quem aceitou**, com **SAIR**, no máximo uma por mês.
- Voz "Andre" (ElevenLabs v4 pelo Higgsfield, 2,07 créditos cada, custo conferido antes). Na legenda: "Narração com voz gerada por inteligência artificial." e o rótulo de IA ligado.
- Para refazer um episódio: `cd growlift-social/_fonte/reels/novos && node render.mjs 17` (ou 18, 19, 20). Quadros para conferir: `node render.mjs 17 --still 2,10,20`.

## Episódios prontos

### Ep. 1 · Reel 17 · "Vendeu tanto. Cadê o dinheiro?" (CMV)
- **Arquivo:** `17-cade-o-dinheiro.mp4` (31 s, com voz) e `17-cade-o-dinheiro-mudo.mp4`.
- **História:** sexta, 23h, a parmegiana vendeu como nunca. No dia 31, o caixa não fecha. A Mel faz a conta: R$ 22 de ingrediente num prato de R$ 39,90. Isso é o CMV, e aqui é mais da metade (55%).
- **Narração:** "Sexta, onze da noite. A Rosa fecha a Panela feliz: a parmegiana vendeu como nunca. Mas no fim do mês... cadê o dinheiro? A Mel, filha dela, faz a conta. Ingrediente da parmegiana: vinte e dois reais. Preço: trinta e nove e noventa. Isso é o CMV: a parte do preço que vai embora em ingrediente. Aqui, mais da metade! Quanto maior, menos sobra pra pagar a casa. Quer a conta passo a passo? Comenta MARGEM!"
- **Palavra:** MARGEM.

Legenda:
```
Vender muito não é a mesma coisa que sobrar dinheiro. 🍝

A parmegiana da Rosa sai toda noite. Mas, de cada R$ 39,90, R$ 22 vão embora em ingrediente. Esse número tem nome: CMV, o custo da mercadoria vendida.

Faz a conta com o prato que mais sai aí: custo dos ingredientes ÷ preço. Quanto maior o resultado, menos sobra pra pagar a casa.

Quer a conta passo a passo? Comenta MARGEM.

Casa Cheia é a nossa série sobre gestão de restaurante.
Narração com voz gerada por inteligência artificial.

#restaurante #gestaoderestaurante #cmv #donoderestaurante #cardapio
```

### Ep. 2 · Reel 18 · "Cada prato tem um papel" (engenharia de cardápio)
- **Arquivo:** `18-cada-prato-um-papel.mp4` (34 s).
- **História:** os pratos da Rosa ganham rosto. Picanha: vende muito e sobra muito, a **Estrela** (não mexe). Parmegiana: vende muito e sobra pouco, o **Cavalo de batalha** (rever a porção). Risoto: sobra muito e pouca gente pede, o **Quebra-cabeça** (precisa de destaque). Sopa: vende pouco e sobra pouco, o **Abacaxi** (troca ou tira). No fim, os quatro no quadro.
- **Palavra:** MARGEM.

Legenda:
```
Todo prato do seu cardápio tem um papel. Você sabe qual é o de cada um? ⭐🐴🧩🍍

⭐ Estrela: vende muito e sobra muito. Destaque e não mexe.
🐴 Cavalo de batalha: vende muito, sobra pouco. Revê porção ou custo.
🧩 Quebra-cabeça: sobra muito, pouca gente pede. Precisa de destaque.
🍍 Abacaxi: vende pouco e sobra pouco. Troca ou tira.

Isso se chama engenharia de cardápio. Quer descobrir o papel dos seus pratos? Comenta MARGEM.

Casa Cheia é a nossa série sobre gestão de restaurante.
Narração com voz gerada por inteligência artificial.

#restaurante #engenhariadecardapio #cardapio #gestaoderestaurante #donoderestaurante
```

### Ep. 3 · Reel 19 · "Ela vem toda sexta" (CRM)
- **Arquivo:** `19-ela-vem-toda-sexta.mp4` (28 s).
- **História:** toda sexta a dona Cida senta na mesa 4 e pede frango com quiabo. Um dia ela para de vir, e no meio da correria ninguém percebe. A Mel explica: CRM é a memória do restaurante (quem veio, quando, do que gosta), numa lista só, com a permissão de cada cliente. Aí dá para mandar um "sentimos sua falta" só para quem aceitou, com a opção SAIR.
- **Palavra:** CLIENTE.

Legenda:
```
Quantas "donas Cida" pararam de vir aí, e ninguém percebeu? 🪑

CRM é um nome chique para uma coisa simples: a memória do restaurante. Quem é cliente, quando veio pela última vez e do que gosta. Tudo numa lista só, com a permissão de cada um.

Com isso, dá pra mandar um "sentimos sua falta" só pra quem aceitou receber, sempre com a opção de sair.

Quer um modelo dessa mensagem? Comenta CLIENTE.

Casa Cheia é a nossa série sobre gestão de restaurante.
Narração com voz gerada por inteligência artificial.

#restaurante #crm #fidelizacao #gestaoderestaurante #donoderestaurante
```

### Ep. 4 · Reel 20 · "Dia 31" (fechamento do mês, ticket médio)
- **Arquivo:** `20-dia-31.mp4` (33 s).
- **História:** dia 31, a Rosa abre a caixa de comandas e não sabe quanto vendeu nem quanto sobrou. A Mel resume em três números (vendas, custo dos ingredientes, ticket médio) e tira três testes para o mês seguinte: combo do almoço com bebida, picanha no topo do cardápio e rever a porção da parmegiana. Teste, não promessa: no outro mês, mede de novo. Fecho: no Scale, que está chegando, esse relatório vem pronto todo mês.
- **Palavra:** RELATÓRIO (cadastrar também RELATORIO, sem acento, no ManyChat).
- **Atenção:** é o único episódio que cita o Scale. Mantém "está chegando": o Scale ainda não está à venda, sem preço nem data.

Legenda:
```
Dia 31: você sabe quanto vendeu e quanto sobrou? 📦

A Rosa tinha uma caixa de sapato cheia de comandas. A Mel resumiu em 3 números:
1. Vendas do mês
2. Custo dos ingredientes (o CMV)
3. Ticket médio: quanto cada mesa gastou, em média

Desses números saem 3 testes pro mês que vem. Teste, não promessa: no outro mês, mede de novo.

Quer o modelo do relatório? Comenta RELATÓRIO.

Casa Cheia é a nossa série sobre gestão de restaurante.
Narração com voz gerada por inteligência artificial.

#restaurante #gestaoderestaurante #ticketmedio #fechamentodecaixa #donoderestaurante
```

## Respostas do direct (ManyChat)

Falam como a Growlift ("a gente"), sem nome de pessoa e sem dizer que é mensagem automática.

**MARGEM** (eps. 1 e 2):
```
Opa! Que bom que você curtiu a série Casa Cheia 🙌

A conta do CMV, passo a passo:
1. Escolha o prato que mais sai.
2. Liste os ingredientes de UMA porção, com a quantidade (ex.: 180 g de carne, 80 g de queijo).
3. Some quanto custa cada um nessa quantidade.
4. Divida pelo preço do prato. Ex.: R$ 22 ÷ R$ 39,90 = 55% de CMV.
5. Preço − custo = o que sobra do prato pra pagar a casa.

Faz isso com os 5 pratos que mais saem e compara. Aí aparecem as estrelas, os cavalos de batalha, os quebra-cabeças e os abacaxis do seu cardápio.

Quer ajuda pra montar a conta do seu? Responde aqui que a gente te ajuda.
```

**CLIENTE** (ep. 3):
```
Opa! Aqui vai o modelo da série Casa Cheia 👇

"Oi, [nome]! Sentimos sua falta por aqui. [Dia] tem [prato que a pessoa gosta]. Esperamos você!
Para não receber mais mensagens, responda SAIR."

Três regras pra não virar spam:
✅ Só pra quem aceitou receber mensagens do restaurante
✅ No máximo uma por mês
✅ Sempre com a opção de sair, e quem pediu SAIR sai da lista na hora

Quer ajuda pra organizar a lista de clientes do seu restaurante? Responde aqui.
```

**RELATÓRIO** (ep. 4):
```
Opa! Aqui vai o modelo do relatório do mês, da série Casa Cheia 👇

📊 3 números
1. Vendas do mês (e do mês anterior, pra comparar)
2. Custo dos ingredientes ÷ vendas (o CMV, em %)
3. Ticket médio: total vendido ÷ número de contas

🧪 3 testes pro mês que vem
Cada um com: o que fazer, o número que justifica e como medir no fim do mês.

No plano Scale da Growlift, esse relatório vem pronto todo mês. Ele ainda não está à venda: quer ser avisado quando abrir? Responde AVISA.
```

## Próximos episódios (roteiros para aprovar)

5. **"Que letra é essa?"** (pedido errado e desperdício): o Beto anota "X-bac s/ ceb… mal?", o Seu Juca faz errado, o prato volta e vai pro lixo. A Mel conta quanto custa um prato refeito (ingrediente + gás + tempo). Lição: pedido que chega escrito, do jeito que o cliente escolheu. Palavra: MESA.
6. **"Vai uma bebida?"** (ticket médio): duas mesas iguais, uma com o Beto sugerindo bebida e sobremesa. A Mel mostra o ticket médio das duas. Lição: sugestão ativa, sem empurrar. Palavra: MARGEM.
7. **"Segunda vazia"** (dia fraco): o salão vazio na segunda e lotado na sexta. Promoção só no dia fraco, nunca no dia cheio. Palavra: RELATÓRIO.
8. **"O preço que termina em 90"** (preço e âncora): por que R$ 39,90 e não R$ 40; o prato mais caro no topo faz os outros parecerem acessíveis. Palavra: MARGEM.
9. **"Casa cheia, porta vazia"** (movimento ao vivo e reserva): o cliente desiste de ir achando que está lotado. O site mostra o movimento e os horários livres para reservar. Palavra: MESA.
10. **"10% esquecidos"** (taxa de serviço e couvert): a conta sai sem a taxa porque ninguém lembrou. Taxa e couvert avisados no cardápio e já entrando na conta. Palavra: MESA.
