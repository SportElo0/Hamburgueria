# Plano de motion e transições

## Ferramenta: recomendação

**Animar no motor que já existe, `growlift-social/_fonte/reels/motor.mjs`.** Ele renderizou os 8 Reels. Cada Reel é uma página HTML com uma linha do tempo; o motor fotografa cada quadro com `window.render(t)` e o ffmpeg monta o MP4. Ele também já grava os sites quadro a quadro, que é o que a transição 4 precisa. Os 13 quadros desta pasta são HTML no mesmo formato, então viram as cenas da animação sem reescrever nada.

| | Motor próprio | HyperFrames | Remotion | Lemo-Opuscar |
| --- | --- | --- | --- | --- |
| Formato | HTML + linha do tempo + Playwright + ffmpeg | HTML + animação buscável (GSAP) → MP4 determinístico | React | biblioteca de estilos artísticos |
| Já usado aqui | sim, 8 Reels | não | não | não |
| Grava os sites quadro a quadro | sim | não pronto | não | não |
| Custo de adotar | zero | baixo (mesmo paradigma) | alto (reescrever em React) | não se aplica |
| Uso | **renderização** | alternativa se quisermos o estúdio visual de linha do tempo | não recomendado: troca de stack sem ganho | só referência de direção; estilos não aplicados |

Um sistema só. Se o motor próprio esbarrar em algo (por exemplo, edição visual da linha do tempo), a migração natural é para o HyperFrames, porque a página continua sendo HTML. Ainda não rodei o HyperFrames neste projeto: a decisão acima é pela arquitetura, não por teste.

Movimento: curvas exponenciais de saída (ease-out), nunca linear, exceto o carrossel e o líquido. Uma coisa se move por vez. Nada de zoom em toda cena: só o 03 (dolly) e o 09/10 (zoom na espuma).

## As 5 transições

Cada uma tem quadro de origem, quadro intermediário (o quadro de transição) e quadro de destino. O elemento que liga os dois lados vem dos próprios sites.

| # | Origem → intermediário → destino | Elemento que liga | Técnica (código) | Duração |
| --- | --- | --- | --- | --- |
| 1 | 01 → **02** → 03 | o **ponto azul** de MAIS. vira a tela arredondada | escala + `border-radius` animado; o hero da Salinho já está dentro da moldura | 0,8 s |
| 2 | 05 → **06** → 07 | o **botão "Reserve minha peça"** da Salinho estica e vira a janela do Chapa 77 | altura do retângulo animada, máscara; verde → vermelho | 0,8 s |
| 3 | 07 → **08** → 09 | o **verde-água**: o último capítulo do Chapa 77 (#0c6d69) e a seção de pranchas da Swell Club (#086d75) têm quase a mesma cor | wipe diagonal com `clip-path`, linha de luz fina | 0,8 s |
| 4 | 09 → **10** → 11 | o **creme**: o rodapé da Swell Club (#f3f0e5) e a página da Fornada (#f4ede0) têm quase a mesma cor | o último cartão do carrossel cresce até cobrir a tela; no mesmo creme, SWELL sai pelo alto e o bloco da Fornada sobe (translação vertical, a velocidade cai de rápida para lenta) | 1,0 s |
| 5 | 11 → **12** → 13 | o **símbolo da Growlift** recorta as quatro telas e depois se preenche de azul | máscara com o vetor oficial; grade 2×2 recuando | 1,6 s |

## Higgsfield: uso econômico

**Gasto nesta fase: zero.** Saldo: 197,25 créditos.

Nenhuma transição precisa do Higgsfield. A ideia da espuma da onda virando bebida saiu: a espuma vinha da foto do dono da Swell Club. A bebida quente continua no Reel, como a animação real do site da Fornada (canvas que roda com a rolagem), dentro do celular do quadro 11.

**Opcional, só com autorização: um surfista genérico.** Uma imagem nova (pessoa que não existe, surfando onda com espuma, 16:10) entraria no lugar da foto do dono **dentro da página, na hora da captura**, como já fazemos com nomes e logos. O layout continua real; só a foto muda. Isso devolve ao Reel o hero "A vida pede mar.", o quadro mais enérgico da Swell Club, e permitiria voltar com a ponte espuma → bebida.

| Campo | Surfista genérico |
| --- | --- |
| Objetivo | trocar a foto do dono no hero da Swell Club |
| Modelo | `gpt_image_2_5`, 2k, qualidade alta (o mesmo da marca de vidro) |
| Custo | **2,75 créditos**: o que essa conta pagou pela última imagem nesse modelo e configuração |
| Prompt | "Editorial surf photograph: a surfer (adult, generic, face not identifiable, back three-quarter view) riding a turquoise wave on a yellow shortboard, big white spray, sunny, shot from the water with a telephoto lens, 16:10, no text, no logos" |
| Uso | hero desktop e celular na captura, quadros 09 e 10 |
| Alternativa sem crédito | a versão atual (pranchas + ponte do creme) |
| Risco de distorcer o site | nenhum no layout; a foto é nova |

Regra: nada de geração sem a autorização de vocês; uma tentativa por vez; teto de 25 créditos para o Reel inteiro.
