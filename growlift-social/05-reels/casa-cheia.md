# Série "Casa Cheia" (Reels 17 em diante, 05/11)

**A ideia:** uma série fixa, com os mesmos personagens em todo episódio, que ensina gestão de restaurante sem jargão. Cada episódio é uma situação do dia a dia da Panela da Rosa e explica **um nome difícil** (CMV, engenharia de cardápio, CRM, ticket médio, fechamento do mês). O valor vem primeiro; a série não vende o Scale (ele ainda não está à venda).

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
- **Nada simplificado a ponto de ficar errado.** Fala só do que a gente sabe; quando o assunto tem mais partes (como o lucro), mostra todas. Sem "regra de mercado" ou porcentagem ideal que a gente não tenha como provar.
- Números só de exemplo, dentro da história, e marcados "exemplo" quando parecem dado real. Nunca "aumenta vendas" nem resultado prometido. Sugestão é "teste", não promessa.
- Mensagem para cliente sempre **só para quem aceitou de forma clara**, identificando o restaurante, com **SAIR**, e com pouca frequência (a gente sugere no máximo uma por mês).
- Todas as respostas do direct terminam com "Para sair, responda SAIR." e o link de privacidade.
- Antes de lançar: conferir no INPI e no Google se não existe restaurante "Panela da Rosa".
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

Faz a conta com o prato que mais sai aí: custo dos ingredientes ÷ preço. Quanto maior o resultado, menos sobra pra pagar o resto: aluguel, salários, contas e impostos (isso fica pro episódio 4).

Quer a conta passo a passo? Comenta MARGEM.

Casa Cheia é a nossa série sobre gestão de restaurante.
Narração com voz gerada por inteligência artificial.

#restaurante #gestaoderestaurante #cmv #donoderestaurante #cardapio
```

### Ep. 2 · Reel 18 · "Cada prato tem um papel" (engenharia de cardápio)
- **Arquivo:** `18-cada-prato-um-papel.mp4` (34 s).
- **História:** os pratos da Rosa ganham rosto. Picanha: vende muito e sobra muito, a **Estrela** (não mexe). Parmegiana: vende muito e sobra pouco, o **Cavalo de batalha** (rever a porção). Risoto: sobra muito e pouca gente pede, o **Quebra-cabeça** (precisa de destaque). Sopa: vende pouco e sobra pouco, o **Abacaxi** (troca ou tira). No fim, os quatro no quadro.
- **Palavra:** MARGEM. Na tela, os selos de ação são "Mantém!" e "Testar trocar" (sugestão, não ordem).

Legenda:
```
Todo prato do seu cardápio tem um papel. Você sabe qual é o de cada um? ⭐🐴🧩🍍

⭐ Estrela: vende muito e sobra muito. Destaque e mantém.
🐴 Cavalo de batalha: vende muito, sobra pouco. Revê porção ou custo.
🧩 Quebra-cabeça: sobra muito, pouca gente pede. Precisa de destaque.
🍍 Abacaxi: vende pouco e sobra pouco. Vale testar trocar ou tirar.

Isso se chama engenharia de cardápio. Quer descobrir o papel dos seus pratos? Comenta MARGEM.

Casa Cheia é a nossa série sobre gestão de restaurante.
Narração com voz gerada por inteligência artificial.

#restaurante #engenhariadecardapio #cardapio #gestaoderestaurante #donoderestaurante
```

### Ep. 3 · Reel 19 · "Ela vem toda sexta" (CRM)
- **Arquivo:** `19-ela-vem-toda-sexta.mp4` (28 s).
- **História:** toda sexta a dona Cida senta na mesa 4 e pede frango com quiabo. Um dia ela para de vir, e no meio da correria ninguém percebe. A Mel explica: CRM é a memória do restaurante (quem veio, quando, do que gosta), numa lista só, com a permissão de cada cliente. Aí dá para mandar um "sentimos sua falta" só para quem aceitou, com a opção SAIR.
- **Palavra:** CLIENTE. O cartão diz "Aceitou receber mensagens do restaurante" e a mensagem se identifica ("Aqui é a Panela da Rosa").

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

### Ep. 4 · Reel 20 · "Dia 31: quanto sobrou de verdade?" (fechamento do mês e lucro)
- **Arquivo:** `20-dia-31.mp4` (35 s). Versão 2, refeita em 05/11 a pedido dos sócios: a primeira resumia o mês em três números e deixava de fora aluguel, salários e contas, o que não é o fechamento de verdade.
- **História:** a Panela vendeu R$ 50 mil no mês. A Mel faz a conta com tudo: sai o ingrediente (R$ 17 mil), as taxas do cartão e dos aplicativos (R$ 2.500), o aluguel (R$ 6 mil), os salários com encargos, inclusive o da própria Rosa (R$ 14 mil), luz, gás e água (R$ 3 mil), impostos e contador (R$ 4 mil). Sobram R$ 3.500, 7% do que vendeu. Vender bem não é o mesmo que sobrar.
- **Números:** de exemplo, marcados "números de exemplo" na tela. Não dizer que é a média dos restaurantes: cada casa tem a sua conta.
- **Narração:** "Dia trinta e um. A Panela vendeu cinquenta mil reais no mês. Mas quanto sobrou de verdade? A Mel faz a conta com tudo. Das vendas, sai o ingrediente. Saem as taxas do cartão e dos aplicativos. O aluguel. Os salários com os encargos, inclusive o da própria Rosa. Luz, gás, água, impostos e o contador. O que fica no fim é o lucro. Aqui, três mil e quinhentos. Vender bem não é o mesmo que sobrar. Quer o modelo dessa conta? Comenta RELATÓRIO!"
- **Palavra:** RELATÓRIO (cadastrar também RELATORIO, sem acento, no ManyChat). Não cita o Scale.

Legenda:
```
Vendeu R$ 50 mil no mês. Quanto sobrou de verdade? 📦

A conta do fechamento tem que ter TUDO:
– ingredientes
– taxas do cartão e dos aplicativos
– aluguel
– salários e encargos, inclusive o seu (o dono também precisa de salário)
– luz, gás e água
– impostos e contador

O que fica no fim é o lucro. No exemplo da Panela, R$ 3.500. Vender bem não é o mesmo que sobrar.

Quer o modelo dessa conta? Comenta RELATÓRIO.

Casa Cheia é a nossa série sobre gestão de restaurante.
Narração com voz gerada por inteligência artificial.

#restaurante #gestaoderestaurante #fechamentodecaixa #lucro #donoderestaurante
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

Para sair, responda SAIR.
Seus dados: growlift.com.br/privacidade.html
```

**CLIENTE** (ep. 3):
```
Opa! Aqui vai o modelo da série Casa Cheia 👇

"Oi, [nome]! Aqui é o [restaurante]. Sentimos sua falta por aqui. [Dia] tem [prato]. Esperamos você!
Para não receber mais mensagens, responda SAIR."

Três regras pra não virar spam:
✅ Só pra quem aceitou, de forma clara, receber mensagens do restaurante (anota quando e como)
✅ Sempre com a opção SAIR, e quem pediu sai da lista na hora
✅ Pouca frequência: a gente sugere no máximo uma por mês

No WhatsApp Business, mensagem fora da janela de 24 h precisa de modelo aprovado pelo WhatsApp.

Para sair, responda SAIR.
Seus dados: growlift.com.br/privacidade.html
```

**RELATÓRIO** (ep. 4):
```
Opa! Aqui vai o modelo do fechamento do mês, da série Casa Cheia 👇

Vendas do mês
– Ingredientes e bebidas que você comprou pra vender
– Taxas do cartão, do Pix e dos aplicativos de entrega
– Aluguel
– Salários e encargos da equipe
– O seu salário (pró-labore): o dono também é custo
– Luz, gás, água, internet
– Impostos e contador
– Outras contas fixas (manutenção, sistema, embalagem)
= Lucro (o que sobrou de verdade)

Dica: use os valores que saíram do caixa no mês, com as notas e os boletos na mão. Se não souber algum, anota "não sei" em vez de chutar, e pergunta pro seu contador.

Quer ajuda pra montar o do seu restaurante? Responde aqui que a gente te ajuda.

Para sair, responda SAIR.
Seus dados: growlift.com.br/privacidade.html
```

## Próximos episódios (roteiros para aprovar)

5. **"Que letra é essa?"** (pedido errado e desperdício): o Beto anota "X-bac s/ ceb… mal?", o Seu Juca faz errado, o prato volta e vai pro lixo. A Mel conta quanto custa um prato refeito (ingrediente + gás + tempo). Lição: pedido que chega escrito, do jeito que o cliente escolheu. Palavra: MESA.
6. **"Vai uma bebida?"** (ticket médio): duas mesas iguais, uma com o Beto sugerindo bebida e sobremesa. A Mel mostra o ticket médio das duas. Lição: sugestão ativa, sem empurrar. Palavra: MARGEM.
7. **"Segunda vazia"** (dia fraco): o salão vazio na segunda e lotado na sexta. Promoção só no dia fraco, nunca no dia cheio, sempre com validade e regras claras. Palavra: RELATÓRIO.
8. **"Quanto custa o seu prato de verdade?"** (ficha técnica): o Seu Juca pesa cada ingrediente de uma porção e a Mel soma; o desperdício e o que estraga também entram. Lição: sem ficha técnica, o CMV é chute. Palavra: MARGEM.
9. **"Casa cheia, porta vazia"** (movimento ao vivo e reserva): o cliente desiste de ir achando que está lotado. O site mostra o movimento e os horários livres para reservar. Só gravar quando o Scale estiver à venda e o site listar isso. Palavra: MESA.
10. **"10% esquecidos"** (taxa de serviço e couvert): a conta sai sem a taxa porque ninguém lembrou. Ensinar: taxa e couvert avisados no cardápio; a taxa de serviço é opcional e o cliente pode pedir para tirar. Palavra: MESA.
