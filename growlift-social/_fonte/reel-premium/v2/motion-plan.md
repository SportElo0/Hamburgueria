# Plano de motion e transições (como foi feito)

## Ferramenta

**O mesmo jeito do motor dos 8 Reels, sem trocar de stack.** O vídeo é uma página HTML (`source/reel.mjs`) com uma função `window.render(t)` que posiciona cada camada no tempo `t`. O Playwright fotografa os 750 quadros (30 por segundo) e o ffmpeg monta o MP4: H.264 High, yuv420p, CRF 17, `faststart`.

As telas dos sites não são imagens paradas. São **gravações quadro a quadro dos sites de verdade** (`source/gravacoes.mjs`), feitas com o `captureSite` do motor dos Reels (`_fonte/reels/motor.mjs`), já anonimizadas:

| Gravação | O que mostra | Quadros |
| --- | --- | --- |
| `rec-salinho` | celular: dois toques nas miniaturas (camisa → short → calça), a página muda de cor | 69 |
| `rec-chapa77` | computador: a história do lanche na rolagem (vermelho, laranja, verde, roxo, verde-água, lanche em camadas), com os renders 3D da Growlift no lugar das fotos do cardápio e sem preços | 78 |
| `rec-swellclub` | celular: "A vida pede mar." → "A gente vive isso.", com o surfista genérico no lugar do dono | 66 |
| `rec-fornada` | celular: a reserva do café da manhã, com toque no dia 30, rolagem até os produtos e dois "Adicionar" (só interface) | 96 |

| | Motor próprio (usado) | HyperFrames | Remotion | Lemo-Opuscar |
| --- | --- | --- | --- | --- |
| Formato | HTML + `render(t)` + Playwright + ffmpeg | HTML + animação buscável → MP4 | React | estilos artísticos |
| Grava os sites quadro a quadro | sim | não pronto | não | não |
| Por que sim ou não | já fez os 8 Reels; os quadros da pré-produção já eram HTML | mesmo paradigma; fica de alternativa se quisermos um estúdio visual | trocaria de stack sem ganho | só referência; nenhum estilo aplicado |

**Movimento:**
- Saídas e entradas com curva exponencial (ease-out).
- Trocas de lugar com in-out.
- Só o carrossel e a aproximação da Salinho são lineares.
- Uma coisa se move por vez.
- Não há zoom em toda cena: só na Salinho (aproximação lenta) e na prancha amarela (ponte da transição 3 para o Swell Club).

## As 5 transições

| # | Origem → intermediário → destino | Elemento que liga | Técnica | Tempo |
| --- | --- | --- | --- | --- |
| 1 | 01 → **02** → 03 | o **ponto azul** de MAIS.: medido na própria fonte, cresce exatamente a partir dele e vira a tela arredondada | retângulo animado (posição, tamanho, cantos), anel azul que some | 2,0–2,8 s |
| 2 | 05 → **06** → 07 | o **botão "Reserve minha peça"** sobe, ocupa a largura e se abre para baixo numa janela vermelha com o lanche | o mesmo elemento muda de tamanho; a janela vira a carta da frente do 07 | 8,0–8,8 s |
| 3 | 07 → **08** → 09 | o **verde-água**: o último capítulo do Chapa 77 e a seção de pranchas da Swell Club têm quase a mesma cor | a carta cresce até o lanche em camadas tomar a tela (sem fusão de imagens); linha diagonal com `clip-path`; zoom na prancha amarela leva à prancha amarela do surfista | 11,3–12,9 s |
| 4 | 09 → **10** → 11 | o **creme**: rodapé da Swell Club (#f3f0e5) e página da Fornada (#f4ede0) | o último cartão do carrossel cresce até cobrir a tela, com o SWELL gigante dentro dele; SWELL sai pelo alto e o título da reserva e o cartão da seleção sobem no mesmo creme | 14,65–16,2 s |
| 5 | 11 → **12** → 13 | o **símbolo da Growlift** | a página da Fornada encolhe para uma grade 2×2; o vetor oficial da marca recorta as quatro telas e se enche de azul | 19,3–21,0 s |

Nenhuma transição funde duas imagens diferentes no mesmo retângulo: onde isso aparecia nos testes (computador → celular e Chapa 77 → verde-água), o movimento foi refeito.

## Selo de projeto conceito

"Projeto conceito · nome fictício" é uma pílula escura translúcida no pé da área segura (x 96, y 1530), visível de 3,0 a 19,4 s. As legendas de cada projeto ficam logo acima dela.

## Higgsfield

**Gasto: 2,75 créditos**, na foto do surfista genérico, autorizada por vocês e com o custo conferido antes (`get_cost`). Saldo: 194,50.

- A ponte espuma → bebida, que era o plano B em vídeo, não foi usada. A transição 4 ficou sendo a do creme.
- Nenhum vídeo foi gerado.
- O prompt está em `growlift-social/08-prompts/prompts.md`.
