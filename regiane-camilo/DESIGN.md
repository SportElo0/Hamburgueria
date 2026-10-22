---
name: Bolos e Doces Regiane Camilo
description: O pedido como um convite que a cliente preenche para a Regiane, com os bolos reais na frente.
colors:
  cherry: "#b73439"
  cocoa: "#63341f"
  cocoa-deep: "#4b2616"
  cocoa-line: "#7a4a33"
  rose: "#eba1bb"
  blush: "#f1d2c8"
  blush-deep: "#e8bfb2"
  cream: "#fff7ef"
  paper: "#ffffff"
  ink: "#36251f"
  muted: "#76665f"
  line: "#eadfd7"
  line-strong: "#d9c8bc"
  on-cocoa-muted: "#e9cfc3"
typography:
  display:
    fontFamily: "Castoro, Georgia, serif"
    fontSize: "clamp(2.6rem, 4.5vw, 4.4rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.012em"
  headline:
    fontFamily: "Castoro, Georgia, serif"
    fontSize: "clamp(2.25rem, 4.4vw, 3.6rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Castoro, Georgia, serif"
    fontSize: "1.2rem"
    fontWeight: 400
    lineHeight: 1.25
  invitation:
    fontFamily: "Castoro, Georgia, serif"
    fontSize: "1.45rem"
    fontWeight: 400
    lineHeight: 1.75
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.16em"
  button:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    letterSpacing: "0.1em"
  signature:
    fontFamily: "Norican, cursive"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1
rounded:
  field: "14px"
  choice: "16px"
  card: "18px"
  dialog: "24px"
  panel: "28px"
  pill: "999px"
spacing:
  gutter-mobile: "20px"
  gutter-tablet: "32px"
  gutter-desktop: "48px"
  section-mobile: "80px"
  section-desktop: "112px"
  container: "1440px"
components:
  button-primary:
    backgroundColor: "{colors.cocoa}"
    textColor: "{colors.cream}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.cocoa-deep}"
    textColor: "{colors.cream}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.cocoa}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-outline-hover:
    backgroundColor: "{colors.cocoa}"
    textColor: "{colors.cream}"
  button-cream:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.cocoa-deep}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "52px"
  button-cream-hover:
    backgroundColor: "{colors.blush}"
  input-field:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 16px"
    height: "52px"
  order-choice:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    rounded: "{rounded.choice}"
    padding: "12px 16px"
    height: "64px"
  order-choice-selected:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.cocoa}"
  style-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  invitation-card:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.invitation}"
    rounded: "{rounded.card}"
    padding: "56px 40px 40px"
---

# Design System: Bolos e Doces Regiane Camilo

## Overview

**Creative North Star: "O Convite da Confeitaria"**

O site é uma confeitaria de bairro bem apresentada, não uma loja virtual. O chão é creme de confeitaria; sobre ele, campos inteiros de chocolate e de rosa suave se alternam em faixas de largura total, e as fotos reais dos bolos da Regiane (sempre no cenário dela: parede clara, letras rosé, gramadinho) são a cor principal da página. O pedido não é um formulário de etapas cinza: é um cartão-convite em papel creme, com borda recortada em ondinhas e o selo da Regiane carimbado no canto, cujas lacunas pontilhadas se preenchem enquanto a cliente escolhe.

A densidade é calma e generosa: títulos grandes em Castoro, texto corrido em Figtree com folga de linha, muito ar entre seções. A tipografia carrega a voz: a serifada fala como uma carta escrita à mão, a cursiva Norican assina, o versalete espaçado ecoa o "·BOLOS·" do selo. O movimento é de papel e tinta: a foto da abertura é revelada de baixo para cima, o conteúdo sobe suavemente, e cada palavra nova do convite "assenta" como tinta.

Rejeições confirmadas: vitrine de e-commerce com carrinho e preços, formulário de etapas cinza, estética infantil.

**Key Characteristics:**
- Creme como chão; chocolate e rosa suave como campos inteiros, nunca como faixas decorativas finas.
- Cereja raríssima: só a palavra de destaque da abertura e o anel de foco.
- Castoro para títulos e para o convite; Norican só na assinatura "Regiane Camilo"; Figtree para todo o resto.
- Cantos suaves e generosos, fio fino quente, sombras quentes, baixas e difusas.
- O selo original como carimbo do convite e como peça da seção Sobre.

## Colors

Paleta quente de confeitaria: creme, chocolate e rosas, com a cereja guardada para um único destaque.

### Primary
- **Chocolate do Selo** (cocoa): o campo inteiro da seção de pedido e do rodapé, o botão principal ("Encomendar meu bolo"), a faixa de mensagem acima do cabeçalho e o texto de ênfase (nomes de bolos, links de ação). É a cor do selo da Regiane.
- **Chocolate Amargo** (cocoa-deep): hover do botão principal, fundo dos ícones das escolhas não selecionadas no pedido, véu do modal da galeria (a 75%).
- **Fio de Chocolate** (cocoa-line): bordas e divisórias sobre o chocolate (escolhas do pedido, trilho do stepper, linha final do rodapé).

### Secondary
- **Rosa Confeitaria** (rose): o pontinho separador do selo, sublinhado da navegação ativa, traço à mão da anotação da foto, sublinhado da palavra preenchida no convite, barra de progresso do stepper, foco e erro dos campos, títulos das colunas do rodapé, seleção de texto.
- **Rosa Suave** (blush): campos inteiros das seções "Nossos Bolos" e Instagram, painéis da seção Sobre e do mapa, fundo de espera das fotos.
- **Rosa Suave Fundo** (blush-deep): hover da borda dos campos de texto.

### Tertiary
- **Cereja** (cherry): somente a palavra "doçura" em itálico no título da abertura e o anel de foco (`outline: 2px solid`, deslocado 3px) e o cursor dos campos.

### Neutral
- **Creme de Confeitaria** (cream): chão da página, papel do convite, fundo dos campos do pedido, texto sobre chocolate.
- **Papel** (paper): cartões de estilo e os círculos dos atalhos de ocasião.
- **Tinta Quente** (ink): texto principal e títulos sobre fundos claros.
- **Texto Secundário** (muted): subtítulos, legendas, placeholders e lacunas vazias do convite.
- **Fio Fino** (line): divisórias e linhas de listas; sombra de 1px do cabeçalho ao rolar.
- **Fio Marcado** (line-strong): bordas dos círculos de ícone, pontilhado das lacunas, barra de rolagem.
- **Rosa sobre Chocolate** (on-cocoa-muted): texto secundário sobre o chocolate, nunca cinza.

### Named Rules
**The Uma Cereja Rule.** A cereja aparece em um único ponto do conteúdo por página (a palavra de destaque da abertura) e no foco. Nenhum botão, ícone, título ou estado de navegação é cereja.

**The Campo Inteiro Rule.** Chocolate e rosa suave entram como seções de largura total que mudam o chão da página. O pedido e o rodapé são os mesmos campos de chocolate; "Nossos Bolos" e Instagram são campos de rosa suave.

**The Secundário Rosado Rule.** Sobre o chocolate, o texto secundário é on-cocoa-muted e os títulos de coluna são rose. Cinza nunca entra sobre chocolate.

## Typography

**Display Font:** Castoro, regular e itálico (com Georgia, serif)
**Body Font:** Figtree (com ui-sans-serif, system-ui)
**Signature Font:** Norican (com cursive), só na assinatura

**Character:** Uma serifada de carta, calorosa e levemente antiga, sobre uma sem serifa limpa e redonda. O itálico de Castoro é a voz manuscrita: palavra de destaque, nome do bolo na anotação da foto, lacunas do convite.

### Hierarchy
- **Display** (Castoro 400, clamp(2.6rem, 4.5vw, 4.4rem), 1.04): só o título da abertura.
- **Headline** (Castoro 400, clamp(2.25rem, 4.4vw, 3.6rem), 1.08): títulos de seção; variam entre clamp(2.1rem…3.1rem) e clamp(2.4rem…3.8rem) conforme o peso da seção.
- **Title** (Castoro 400, 1.2rem a 1.5rem): nomes de bolos nos cartões e na anotação, endereço, despedida do convite. Os títulos de etapa do pedido usam clamp(1.9rem, 3vw, 2.4rem).
- **Convite** (Castoro 400, 1.3rem a 1.45rem, entrelinha 1.75): a frase do convite, com folga de linha para as lacunas sublinhadas.
- **Body** (Figtree 400, 1.0625rem, 1.625): texto corrido, em medida de 34 a 56ch. Subtítulo da abertura em 1.125–1.1875rem.
- **Body small** (Figtree, 0.9375rem): textos de apoio, rótulos de escolha, links do rodapé; 0.8125rem para notas e legendas.
- **Label** (Figtree 600, 0.8125rem, 0.16em, maiúsculas): versalete do selo; no rótulo pinado da abertura e nos títulos das colunas do rodapé.
- **Button** (Figtree 700, 0.8125rem, 0.1em, maiúsculas).
- **Signature** (Norican 400, 1.7rem a 2.25rem, entrelinha 1): "Regiane Camilo" na marca, sobre "Bolos & Doces" em versalete.

### Named Rules
**The Assinatura Única Rule.** Norican escreve apenas o nome "Regiane Camilo". Nenhum título, botão ou frase usa a cursiva.

**The Título Sem Sobretítulo Rule.** Títulos de seção não levam rótulo acima. A única exceção é o rótulo "Bolos para momentos especiais" da abertura, pinado pelo cliente, em versalete chocolate com o pontinho rosa.

**The Itálico Tem Motivo Rule.** O itálico de Castoro marca só a palavra de destaque, o nome do bolo na anotação e as lacunas do convite.

## Layout

Contêiner de até 1440px centralizado, com margens laterais de 20px no celular, 32px a partir de 640px e 48px a partir de 1024px. Seções respiram 80px em cima e embaixo no celular e 112px no desktop. No desktop as seções usam grade de 12 colunas, com título à esquerda (cerca de 6 colunas) e texto de apoio deslocado para a direita (5 colunas a partir da 8ª).

A abertura é dividida no desktop: texto à esquerda (≈45%) e a foto em retrato à direita (≈55%, altura min(74svh, 42rem)). No celular a foto vem primeiro, em 1:1 (4:5 empurrava o título para fora da primeira tela em 390×844), depois texto e ações; de 640px em diante a foto fica 5:4. Os atalhos de ocasião ficam em 2 colunas no celular e 4 a partir de 640px.

No pedido, o desktop usa 7 colunas para as etapas e o convite completo ao lado; no celular, uma versão compacta do convite (só a frase) fica acima das escolhas de cada etapa. A navegação principal aparece só a partir de 1280px; abaixo disso, menu em painel de tela cheia.

O mapa da seção Contato é uma fachada compacta (painel rosa com endereço e botão "Mostrar mapa") até ser clicado; só então o iframe carrega.

## Elevation & Depth

O sistema é quase plano: a profundidade vem da troca de campos de cor (creme, rosa suave, chocolate). Sombras existem só em peças de papel que "pousam" sobre um campo, e são sempre quentes (tom chocolate), baixas, difusas e com espalhamento negativo, nunca deslocadas e duras.

### Shadow Vocabulary
- **Papel em repouso** (`box-shadow: 0 14px 30px -26px rgb(75 38 22 / 0.6)`): cartões de estilo.
- **Papel levantado** (`box-shadow: 0 24px 40px -26px rgb(75 38 22 / 0.7)`): hover dos cartões de estilo, com subida de 4px.
- **Convite sobre chocolate** (`box-shadow: 0 30px 60px -30px rgb(20 8 4 / 0.7)`): o cartão-convite completo; a versão compacta usa `0 20px 40px -26px rgb(20 8 4 / 0.8)`.
- **Carimbo** (`box-shadow: 0 8px 18px -10px rgb(75 38 22 / 0.6)`): o selo no convite; na seção Sobre, `0 24px 50px -28px rgb(75 38 22 / 0.6)`.
- **Botão principal no hover** (`box-shadow: 0 10px 24px -14px rgb(75 38 22 / 0.7)`).
- **Fio do cabeçalho** (`box-shadow: 0 1px 0 var(--color-line)`): aparece só depois de rolar 40px.

### Named Rules
**The Sombra Quente Rule.** Toda sombra é tingida de chocolate e tem espalhamento negativo. Sombra cinza, preta neutra ou deslocada em bloco não existe neste mundo.

## Shapes

Cantos suaves e generosos, crescendo com o tamanho da peça: campos de texto 14px, escolhas do pedido 16px, cartões e fotos 18px (`--radius-card`), modal da galeria 24px, painéis rosa grandes (Sobre, mapa) 28px. Botões, círculos de ícone e o pontinho separador são totalmente redondos.

A silhueta assinatura é a **borda em ondinhas** (máscara radial de 11px, como o friso de bico pitanga dos bolos): no topo do rodapé, que avança 11px sobre a seção anterior, e no topo do convite, que fica com cantos arredondados só embaixo. O convite completo ainda leva uma moldura interna de fio rosa a 50%, como papel de carta. O selo original redondo entra girado 8° como carimbo.

## Components

### Buttons
Pílulas firmes, em versalete espaçado, com seta que avança no hover.
- **Shape:** pílula (999px), altura mínima 52px (44–48px no cabeçalho).
- **Primary (chocolate):** fundo cocoa, texto cream, padding lateral 28px; hover escurece para cocoa-deep com sombra quente; a seta desliza 4px.
- **Outline:** borda e texto cocoa; hover preenche de chocolate com texto creme.
- **Sobre chocolate:** variante creme (hover rosa suave) e variante contorno creme (borda on-cocoa-muted; hover preenche de creme).
- **Active / Disabled:** desce 1px ao pressionar; desabilitado vira fio fino com texto muted.
- **Link de texto:** sublinhado de 1px que recua da esquerda para a direita no hover (420ms).

### Chips
- **Filtros da galeria:** pílulas de 44px em papel com borda line-strong e texto ink (hover: borda chocolate); o filtro ativo é preenchido de chocolate com texto creme.
- **Atalhos de ocasião (abertura):** círculo de 48px em papel com borda line-strong e ícone de traço chocolate; no hover o círculo preenche de chocolate.

### Cards / Containers
- **Cartão de estilo:** papel branco, 18px, sombra "papel em repouso"; foto quadrada que amplia 6% no hover; nome em Castoro, dica em muted, e um círculo de 32px com seta.
- **Painéis rosa:** blush, 28px, padding 28–36px, sem sombra.
- **Fotos:** sempre recortadas em 18px, com fundo blush enquanto carregam.

### Inputs / Fields
- **Style:** papel creme sobre o chocolate, 14px, altura 52px, borda de 2px transparente, texto ink, placeholder muted, cursor cereja.
- **Hover / Focus:** borda blush-deep no hover; borda rose no foco (o campo troca o anel de foco global pela borda).
- **Error:** borda rose e mensagem de erro associada.
- **Escolhas do pedido:** botões de 64px, 16px de canto, borda cocoa-line com texto creme; selecionada vira creme com texto chocolate e o ícone vira um check em círculo chocolate.

### Navigation
- **Cabeçalho:** creme a 95% com leve desfoque, fixo; marca à esquerda, links Figtree 500 em ink a 80%, item ativo em chocolate com sublinhado rosa de 2px que cresce do centro. Botão "Fazer encomenda" chocolate à direita.
- **Faixa superior:** chocolate, texto creme 0.8125rem com pontinhos rosa.
- **Menu móvel:** painel creme de tela cheia abaixo do cabeçalho, itens em Castoro 2rem separados por fio fino, seta rosa; ações (encomenda, WhatsApp, Instagram) no pé do painel.
- **Stepper do pedido:** trilhos de 3px (rosa quando alcançado, cocoa-line quando não) com número tabular e rótulo; no celular, "Etapa N de 5" e uma única barra de progresso.

### O Convite (signature)
O cartão em papel creme com borda superior em ondinhas, moldura interna de fio rosa e o selo carimbado no canto superior direito, girado 8°. A frase "Olá, Regiane! Gostaria de um bolo para…" em Castoro tem lacunas: vazias, são itálico muted sobre pontilhado line-strong; preenchidas, viram texto chocolate reto com sublinhado rosa de 2px e entram com o efeito de tinta (700ms: desfoque 4px para nítido). Abaixo, sabor e mensagem no bolo em lista de duas colunas, a despedida "Com carinho," e a nota "Valor a combinar com a confeitaria". Com movimento reduzido, a palavra aparece já assentada.

### Movimento
Curvas `cubic-bezier(0.16, 1, 0.3, 1)` (expo) para entradas e `cubic-bezier(0.25, 1, 0.5, 1)` (quart) para estados. Abertura: conteúdo sobe 18px em cascata (900ms), a foto é revelada de baixo para cima (1400ms) enquanto a imagem assenta de 107% para 100% (2400ms). No scroll, blocos sobem 22px e fotos se revelam por recorte; tudo é visível por padrão e o JS arma o efeito. `prefers-reduced-motion` desliga revelações, tinta do convite e rolagem suave.

## Do's and Don'ts

### Do:
- **Do** alternar campos inteiros de creme, rosa suave e chocolate para marcar seções.
- **Do** usar as fotos reais da Regiane, no cenário dela, com cantos de 18px.
- **Do** usar Castoro para títulos e para o convite, Figtree para texto e controles, Norican só para "Regiane Camilo".
- **Do** usar o selo original redondo como carimbo girado (convite) e como peça da seção Sobre, do ícone e da imagem de compartilhamento.
- **Do** usar a borda em ondinhas no topo do rodapé e do convite.
- **Do** manter o texto secundário sobre chocolate em on-cocoa-muted e os destaques sobre chocolate em rose.
- **Do** usar ícones de traço fino (1.4–1.6) em círculos, nunca emoji ou glifos de texto.

### Don't:
- **Don't** usar cereja fora da palavra de destaque da abertura e do anel de foco.
- **Don't** colocar rótulos ou sobretítulos acima de títulos; o único é o rótulo pinado da abertura.
- **Don't** usar Norican em títulos, botões ou frases.
- **Don't** criar sombras cinzas, neutras ou deslocadas em bloco; toda sombra é quente e difusa.
- **Don't** mostrar carrinho, preço, sabor, prazo ou disponibilidade como se estivessem confirmados; campo sem dado fica "a combinar".
- **Don't** usar cinza como texto sobre chocolate.
