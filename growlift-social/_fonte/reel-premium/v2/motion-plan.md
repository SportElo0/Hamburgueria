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
| 4 | 09 → **10** → 11 | o **líquido**: espuma da onda → bebida quente caindo na xícara | zoom + desfoque na espuma; a bebida é a **animação real do site da Fornada** (canvas que roda com a rolagem), gravada quadro a quadro com o motor; fusão com máscara em gradiente | 1,0 s |
| 5 | 11 → **12** → 13 | o **símbolo da Growlift** recorta as quatro telas e depois se preenche de azul | máscara com o vetor oficial; grade 2×2 recuando | 1,6 s |

## Higgsfield: uso econômico

**Gasto nesta fase: zero.** Saldo: 197,25 créditos.

Nenhuma transição precisa do Higgsfield. A única que pedia (espuma → bebida) agora usa a animação real do site da Fornada, o que é melhor porque não distorce o site. Fica documentado só como plano B:

| Campo | Plano B (só com autorização) |
| --- | --- |
| Objetivo | morph líquido espuma → bebida, se a fusão em código não convencer |
| Quadro de entrada | `keyframes/09-swellclub.png` (recorte da espuma) |
| Quadro de saída | `assets/_recortes/fornada-bebida.png` |
| Modelo | MiniMax H3 Max (quadro inicial e final, 9:16, 768p, mínimo de 5 s) ou FLUX 3 Video (720p, mínimo de 5 s) |
| Duração usada | ~1 s dos 5 gerados |
| Prompt | "Ocean wave foam in extreme close-up slowly turns into hot chocolate pouring into a white ceramic cup, continuous liquid motion, macro, shallow depth of field, cinematic, no text" |
| Custo | **não verificado**: o catálogo do Higgsfield (`models_explore`) não mostra preço e não há ferramenta de orçamento sem gerar. O custo só aparece na geração, que pede confirmação; estimo na faixa de outros vídeos curtos, a confirmar na hora |
| Alternativa sem crédito | a do plano principal (gravação real + máscara) |
| Risco de distorcer o site | baixo: não mexe em nenhuma interface, só no líquido |

Regra: nada de geração antes da aprovação dos quadros; uma tentativa em resolução baixa antes da final; teto de 25 créditos para o Reel inteiro.
