---
name: Convés Ilhabela
description: A travessia do convés até a água — areia, azul profundo e fios champanhe para um restaurante à beira do canal de Ilhabela.
colors:
  sand: "#f8f5ef"
  paper: "#ffffff"
  shell: "#efe9df"
  sage: "#d8e1d8"
  sea: "#123b53"
  deep: "#102f45"
  deep-2: "#0c2537"
  deep-line: "#2a4a60"
  champagne: "#b49a67"
  champagne-deep: "#76603d"
  champagne-soft: "#d6c4a0"
  ink: "#1d2a33"
  muted: "#5f6660"
  line: "#e6e1d6"
  line-strong: "#d3cbbb"
  on-deep: "#f8f5ef"
  on-deep-muted: "#c3cdd2"
  alert: "#a3332b"
typography:
  display:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "clamp(2.6rem, 5vw, 4.6rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "0.005em"
  headline:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "clamp(2.3rem, 4.6vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "0.005em"
  title:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "2.1rem"
    fontWeight: 400
    lineHeight: 1.05
  caption-title:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "1.6rem"
    fontWeight: 400
    lineHeight: 1.25
  body-lg:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.18em"
  wordmark:
    fontFamily: "Josefin Sans, ui-sans-serif, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 200
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  sm: "2px"
  md: "3px"
  full: "9999px"
spacing:
  gutter-mobile: "20px"
  gutter-tablet: "32px"
  gutter-desktop: "48px"
  container: "1440px"
  section-top-mobile: "64px"
  section-top-desktop: "112px"
  control-height: "52px"
  touch-min: "44px"
components:
  button-gold:
    backgroundColor: "{colors.champagne}"
    textColor: "{colors.deep-2}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 1.6rem"
    height: "3.25rem"
  button-gold-hover:
    backgroundColor: "{colors.champagne-soft}"
  button-deep:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.sand}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 1.6rem"
    height: "3.25rem"
  button-deep-hover:
    backgroundColor: "{colors.sea}"
  button-outline:
    textColor: "{colors.deep}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 1.6rem"
    height: "3.25rem"
  button-outline-hover:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.sand}"
  button-outline-light:
    textColor: "{colors.sand}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 1.6rem"
    height: "3.25rem"
  button-outline-light-hover:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.deep}"
  button-disabled:
    backgroundColor: "{colors.line}"
    textColor: "{colors.muted}"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 1rem"
    height: "3.25rem"
  time-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.deep}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    height: "2.75rem"
  time-chip-selected:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.sand}"
  dish-card:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "2.5rem 2.25rem 1.75rem"
    width: "27rem"
  ticket:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "2.25rem"
  photo-credit:
    backgroundColor: "{colors.deep-2}"
    textColor: "{colors.sand}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  calendar-day-selected:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.sand}"
    rounded: "{rounded.full}"
    size: "2.75rem"
---

# Design System: Convés Ilhabela

## Overview

**Creative North Star: "A travessia"**

O site é o caminho do convés até a água: o visitante desce da varanda coberta de madeira para o gramado e o canal, e o cardápio passa por ele como um barco. Areia e branco quente ocupam o chão; o azul profundo aparece em campos inteiros, de borda a borda, quando a página "entra na água" (Experiência, trilho de destaques, Reserva, rodapé); o champanhe é só fio, casco e o botão principal. As fotos reais do lugar carregam a cor viva; a interface fica calma ao redor delas.

A densidade é editorial e respirada: títulos grandes em Marcellus, texto em Manrope com linhas curtas, listas separadas por fios de 1px em vez de caixas. O único ornamento desenhado é o casco do logo, com mastro e nervuras curvas, e a esteira em SVG que se desenha com o scroll. O movimento (GSAP ScrollTrigger, scrub suave) serve ao lugar: com movimento reduzido tudo fica visível e estático, e nada depende da animação para ser lido.

A página recusa o template de rooftop com fotos de banco de imagem e a planilha de preços. Nada de desfoque, nada de vidro: profundidade vem de camadas de foto, véus de cor sólida e máscaras esfumadas.

**Key Characteristics:**
- Areia no chão, azul profundo em campos inteiros, champanhe só em fios, casco e botão principal.
- Marcellus nos títulos, Manrope no texto, Josefin Sans fina exclusiva da marca "convés".
- Cantos retos com raio mínimo (2–3px); círculos só para controles de ícone, dias do calendário e os recortes do bilhete.
- Fios de 1px e o casco com nervuras como único ornamento; esteira desenhada no scroll.
- Fotos reais e creditadas, nunca imagem de banco; crédito vive dentro da própria foto.
- Movimento guiado pelo scroll, com fallback estático completo.

## Colors

Paleta costeira de baixa saturação: areia quente, azul de canal à noite e um dourado gasto que aparece pouco.

### Primary
- **Azul profundo** (deep): campo de seção inteira (Experiência, trilho de destaques, Reserva, rodapé), botão escuro, texto dos títulos sobre areia, estado selecionado de horário e de dia no calendário.
- **Azul-mar** (sea): só como hover do botão escuro e fundo da seleção de texto. Não é cor de campo.
- **Azul noturno** (deep-2): texto do botão champanhe, véus de legenda sobre foto (a 55–85% de opacidade) e o fundo da galeria ampliada.
- **Fio do mar** (deep-line): fios e divisórias sobre azul; o casco gigante em marca-d'água nos campos azuis.

### Secondary
- **Champanhe** (champagne): fundo do botão principal, fios do divisor com casco, sublinhado do item de navegação ativo e da categoria selecionada, a esteira, o casco pequeno. Decorativo ou de preenchimento; nunca texto corrido sobre areia.
- **Champanhe escuro** (champagne-deep): a versão legível do champanhe como texto sobre areia (segunda frase do título da abertura, rótulo pinado, categoria do prato, cursor e anel de foco). Escurecido de #8a7246 para alcançar 4,5:1 sobre areia.
- **Champanhe claro** (champagne-soft): hover do botão principal, rótulos e casco sobre azul, traço secundário da esteira.

### Tertiary
- **Sálvia** (sage): faixa calma da seção Eventos e o lampejo de destaque de um prato ao chegar nele pelo trilho. Nunca em botões ou texto.

### Neutral
- **Areia** (sand): fundo da página, do cabeçalho, da barra fixa móvel, dos cartões de prato e do bilhete.
- **Papel** (paper): interior dos campos de formulário e das opções de horário; a faixa Social.
- **Concha** (shell): fundo de espera das fotos, placa de contato e o ladrilho provisório da galeria.
- **Tinta** (ink): texto corrido, normalmente a 85% sobre areia.
- **Cinza-sálvia** (muted): texto secundário, dicas e placeholders.
- **Fio** (line) e **Fio forte** (line-strong): divisórias de lista e bordas de campo, respectivamente; line-strong também pinta o picote do bilhete.
- **Sobre o azul** (on-deep, on-deep-muted): texto principal e secundário em campos azuis; o secundário é areia acinzentada, nunca cinza puro.
- **Alerta** (alert): borda de campo inválido e mensagem de erro.

### Named Rules
**The Champagne Thread Rule.** O champanhe é fio, casco e botão principal. Quando precisa ser texto sobre areia, usa champagne-deep; o champanhe base nunca carrega leitura.

**The Whole Field Rule.** O azul profundo entra como campo de borda a borda, nunca como cartão azul solto sobre areia.

## Typography

**Display Font:** Marcellus (com Georgia, serif)
**Body Font:** Manrope (com ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** Josefin Sans 200/300, só na marca "convés"

**Character:** Uma serifa de inscrição, de peso único, com a elegância de placa entalhada, contra uma sans humanista clara e espaçada. A geométrica fina do logo fica reservada à marca.

### Hierarchy
- **Display** (400, clamp(2.6rem, 5vw, 4.6rem), 1.04): o título da abertura, em duas frases em linhas próprias; a segunda em champagne-deep.
- **Headline** (400, clamp(2.3rem, 4.6vw, 4rem), 1.08): títulos de seção, com balanceamento de linha e largura de 16–18ch.
- **Title** (400, 2.1rem, 1.05): nome do prato nos cartões de destaque; 2rem no título do bilhete; 1.9rem nos itens do menu móvel.
- **Caption title** (400, 1.6rem): legendas da travessia sobre foto.
- **Body** (400, 1rem–1.125rem, 1.625): parágrafos em 40–44ch; 0.9375rem para texto de apoio e dicas.
- **Label** (700, 0.75rem, 0.18em, maiúsculas): navegação, rótulos de campo, títulos de coluna do rodapé, termos do bilhete; os botões usam a mesma voz a 0.16em.
- **Wordmark** (Josefin Sans 200, 1.85–2.1rem): só "convés", com "ILHABELA" em versalete 0.5625rem a 0.5em embaixo.

### Named Rules
**The One Pinned Label Rule.** Nenhum rótulo pequeno acima de título. A única exceção é o texto pinado pelo cliente na abertura ("Ilhabela • Perequê • Gastronomia à beira-mar"); ela não se estende a outras seções nem a novas páginas.

**The Wordmark-Only Rule.** Josefin Sans existe só na marca "convés". Títulos são Marcellus; todo o resto é Manrope.

## Layout

Contêiner máximo de 90rem com margens de 20px no celular, 32px a partir de 640px e 48px a partir de 1024px. Seções em grade de 12 colunas no desktop: título em 6–7 colunas e texto de apoio deslocado para a direita (colunas 8–12 ou 9–12). Respiro vertical de 64–80px no celular e 96–112px no desktop.

A página corre: Abertura → O Convés (com esteira) → Experiência (travessia) → Cardápio (trilho de destaques preso + cardápio completo abrindo em "Peixes", com busca em todas as categorias) → Galeria → Reserva (bilhete) → Eventos (calendário compartilhado) → Social → Contato (com esteira de novo) → Rodapé. Areia e azul se alternam como chão e água.

Abertura: no desktop, a foto do gramado em sangria total com véu de areia vindo da esquerda (sólido até 30%, 80% em 55%, transparente depois) sob o texto; no celular, foto 4:3 no topo, véu embaixo e texto abaixo, com o título dentro da primeira tela.

Cenas presas começam logo abaixo do cabeçalho recolhido (4.75rem desktop, 4.25rem celular). Busca e categorias do cardápio ficam presas no mesmo ponto. No celular, uma barra fixa com "Solicitar reserva" e ligar aparece depois da abertura e some quando a Reserva está na tela. Alvos de toque nunca abaixo de 44px; controles de formulário em 52px.

### Named Rules
**The Static Fallback Rule.** Toda cena tem um layout estático completo: com movimento reduzido ou sem JS, a travessia vira duas fotos emolduradas lado a lado, cada uma com legenda e crédito, e o trilho de destaques vira rolagem horizontal com encaixe.

## Elevation & Depth

O sistema é plano. Profundidade vem de campos de cor alternados, fotos em camadas, véus sólidos em gradiente (areia sobre a foto da abertura, azul noturno sob legendas) e da máscara esfumada da travessia. Não há desfoque nem vidro em lugar nenhum: o cabeçalho é areia sólida e, rolado, ganha só um fio de 1px.

### Shadow Vocabulary
- **Fio do cabeçalho** (`box-shadow: 0 1px 0 var(--color-line)`): borda inferior do cabeçalho rolado ou com menu aberto. É um fio, não uma sombra.
- **Bilhete sobre a água** (`box-shadow: 0 40px 80px -40px rgb(0 0 0 / 0.6)`): só no cartão de reserva sobre o campo azul, como papel pousado.
- **Foco de campo** (`box-shadow: 0 0 0 1px var(--color-deep)`): dobra a borda do campo em foco.

### Named Rules
**The No-Blur Rule.** Nada de backdrop-filter nem desfoque. Superfícies sobre foto ou sobre conteúdo são sólidas ou gradientes de cor sólida.

**The One Lifted Object Rule.** O bilhete de reserva é o único objeto com sombra difusa. Cartões de prato e placas ficam planos.

## Shapes

Cantos retos com raio mínimo: 2px em botões, campos, opções de horário, fotos e créditos; 3px nos objetos maiores (cartão de prato, bilhete, formulário de eventos). Círculos aparecem só onde a forma é funcional: dias do calendário, botões de ícone da galeria e da placa de contato, e os dois recortes semicirculares do bilhete, que mordem a borda com a cor do campo azul.

O ornamento é desenhado, não ilustrado: o casco com mastro e nervuras (traço 1.4) como marca, divisor e marcador de lista; o mesmo casco gigante e de traço finíssimo (0.35–0.6) como marca-d'água no canto dos campos azuis e dos cartões de prato, como no cardápio impresso; e a esteira, duas ondas champanhe que se desenham pelo scroll com o casco à frente. O picote do bilhete é uma linha de pontos de 8px.

## Components

### Buttons
Firmes e baixos, com voz de rótulo.
- **Shape:** quase retos (2px), altura 52px (44–48px no cabeçalho e na barra móvel), padding horizontal 1.6rem, rótulo 0.75rem 700 em maiúsculas a 0.16em.
- **Primary (gold):** champanhe com texto azul noturno; é a ação de reserva em todo lugar. Hover: champanhe claro.
- **Deep:** azul profundo com texto areia; ações de avanço (conhecer o cardápio, revisar solicitação). Hover: azul-mar.
- **Outline / Outline light:** borda de 1px em azul profundo (sobre areia) ou on-deep-muted (sobre azul); hover preenche com a cor da borda e inverte o texto.
- **Hover / Focus:** transição de cor em 240ms (ease-out-quart); seta com classe nudge anda 4px; pressionado desce 1px. Foco: contorno de 2px champagne-deep afastado 3px.
- **Disabled:** fundo line, texto muted.

### Links
Sublinhado de 1px desenhado por gradiente que recolhe para a direita no hover (420ms, ease-out-expo); texto 600 em azul profundo.

### Chips (categorias e horários)
- **Categorias do cardápio:** texto sem caixa; a selecionada fica 600 em azul profundo com um fio champanhe de 2px que se estende por baixo.
- **Horários da reserva:** caixas de 2px de raio e 44px de altura, papel com borda line-strong; selecionado em azul profundo com texto areia.

### Cards / Containers
- **Cartão de prato (trilho):** areia sobre o campo azul, 3px, 26–27rem de largura, casco em marca-d'água champanhe a 25%; nome em Marcellus, categoria em champagne-deep com traço de 24px, rodapé separado por fio com "Ver no cardápio".
- **Placas de contato:** concha, 2px, padding 28–36px, sem borda nem sombra.
- **Ladrilho provisório:** borda tracejada line-strong sobre concha a 60%, rotulado como provisório; marca o lugar das fotos de pratos que ainda não existem.

### Inputs / Fields
- **Style:** papel, borda de 1px line-strong, 2px de raio, 52px de altura, texto 1rem; o select é nativo, sem aparência, com chevron azul.
- **Hover:** borda champanhe.
- **Focus:** borda azul profundo dobrada por sombra de 1px.
- **Error:** borda alert e mensagem ligada por aria-describedby.

### Navigation
Cabeçalho preso em areia sólida, 96px no desktop (76px no celular) que recolhe para 76px (68px) ao rolar, ganhando o fio inferior. Itens em voz de rótulo, ink a 75%; o atual vira azul profundo com fio champanhe que se estende da esquerda. Seções sem item no menu (como Reserva) limpam o estado atual. Abaixo de 1280px, menu em folha de areia de altura total com itens em Marcellus 1.9rem e setas champanhe, reserva e ligar no rodapé da folha.

### Travessia (componente assinatura)
Cena presa da varanda até a água. A foto da varanda fica embaixo; a do gramado vem por cima por uma fresta de quatro bordas esfumadas (5% vertical, 4% horizontal) aberta entre os pilares e sob o telhado. No primeiro terço do scroll a fresta alarga até a abertura real da varanda; depois toma a tela. As legendas trocam uma de cada vez, uma sai antes da outra entrar, sobre um véu azul noturno. Cada camada leva seu próprio crédito no canto superior direito.

### Bilhete de reserva
O formulário vira um bilhete: dados em cima (termos em rótulo muted, valores em Marcellus azul), um picote pontilhado com dois recortes circulares na cor do campo, e o canhoto com ligar e copiar mensagem. Campo azul por trás, única sombra do sistema.

### Esteira
Duas linhas champanhe (traço 1.4, sem escala) que se desenham com o scroll, com o casco entrando pela esquerda e parando à direita. Aparece depois de O Convés e de Contato.

### Crédito de foto
0.75rem sobre azul noturno a 55%, raio 2px, sempre dentro da foto que credita, com "imagem provisória" quando for o caso.

## Do's and Don'ts

### Do:
- **Do** usar areia (#f8f5ef) como chão e azul profundo (#102f45) como campo de seção inteira.
- **Do** usar champagne-deep (#76603d) sempre que o champanhe precisar ser lido como texto sobre areia.
- **Do** manter os cantos em 2px (controles, fotos) e 3px (cartões, bilhete).
- **Do** usar o casco com nervuras e a esteira como o único ornamento desenhado.
- **Do** creditar cada foto dentro dela mesma e marcar as provisórias.
- **Do** entregar o layout estático completo com movimento reduzido: fotos lado a lado, cada uma com sua legenda e crédito.
- **Do** separar listas e linhas de dados com fios de 1px em vez de caixas.

### Don't:
- **Don't** usar backdrop-filter ou desfoque; o cabeçalho é areia sólida.
- **Don't** colocar rótulos pequenos acima de títulos; o rótulo pinado da abertura é a única exceção.
- **Don't** usar Josefin Sans fora da marca "convés".
- **Don't** usar o champanhe base (#b49a67) como texto sobre areia.
- **Don't** dar sombra difusa a nada além do bilhete de reserva.
- **Don't** usar imagem de banco ou fotos que não sejam do Convés; onde falta foto, um ladrilho provisório rotulado.
- **Don't** usar raios acima de 3px em retângulos.
