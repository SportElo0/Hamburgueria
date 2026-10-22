---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

# Surface: página inicial (app/page.tsx)

Mode: Persuade. Visitante no celular, em Ilhabela ou planejando ir, decide onde comer. Ações: ver o ambiente, consultar o cardápio, solicitar mesa (ligação ou mensagem copiada; WhatsApp desligado até confirmação). Prova: as duas fotos reais (provisórias, creditadas) e o cardápio impresso transcrito. Restrições: preços ocultos, nada de história, horários, capacidade, depoimentos ou nota inventados; demonstração protegida e fora do Google.

Exceção pinada pelo cliente: o texto pequeno acima do título da abertura ("Ilhabela • Perequê • Gastronomia à beira-mar") veio do briefing; é o único rótulo acima de título.

Memorable moment: a travessia no scroll, da varanda de madeira até o gramado e a água.

## Direction contract

THESIS: O site é a travessia do convés até a água: o scroll leva o visitante da varanda coberta para o gramado e o canal, e o cardápio passa como um barco. Recusa o template de rooftop com fotos de banco de imagem e a planilha de preços.

OWN-WORLD: Areia #F8F5EF e branco quente dominam; azul profundo #102F45 e azul-mar #123B53 em campos inteiros (abertura em overlay, travessia, reserva, rodapé); champanhe #B49A67 só em fios, casco e botão principal; sálvia #D8E1D8 em faixas calmas. Marcellus nos títulos, Josefin Sans fina na marca "convés", Manrope no texto. Fios finos, casco com nervuras do logo como ornamento, cantos retos com raio pequeno (2–6px), linha de esteira desenhada em SVG.

STORY: Entende que é um restaurante à beira d'água em Ilhabela, sente o lugar pelas fotos reais, escolhe pratos no cardápio pesquisável e envia uma solicitação de mesa sabendo que o restaurante confirma.

FIRST VIEWPORT: Foto panorâmica do gramado e da água em sangria total; à esquerda, sobre véu areia que dissolve a foto, o rótulo pinado, o título em Marcellus "O sabor de Ilhabela. A beleza do mar." (segunda frase em champanhe), subtítulo e os botões "Conhecer o cardápio" e "Solicitar reserva" (champanhe). Mobile: foto no topo em 4:3, véu inferior, texto e botões abaixo, título dentro da primeira tela.

FORM: Travessia de barco, candidato 6 da lista própria, atribuído pelo sorteio (rodou sem desafiantes); seed:e1c07de12b381ee9. Interação assinatura: cena fixa (pin) da varanda que se abre por máscara até o gramado e a água, com legendas que trocam; destaques do cardápio em trilho horizontal guiado pelo scroll; esteira SVG que se desenha. Movimento: GSAP ScrollTrigger, scrub suave, tudo visível e estático com movimento reduzido.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
