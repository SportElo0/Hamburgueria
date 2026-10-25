# Prompts

Os prompts que geraram as imagens e o vídeo que estão no site da Growlift, no Higgsfield. Ficam aqui para refazer, variar ou usar de base em peças novas.

As peças do Instagram (stories, carrosséis, capas) **não** saíram de prompt: são montadas em código com as cores e a fonte do site (`_fonte/gerar.mjs`), por isso ficam iguais entre si e não gastam crédito.

## Fundo da capa do site (imagem)

Modelo `gpt_image_2_5`, 16:9. Virou `growlift/img/hero.webp`.

```
Ultra-minimal premium 3D render for a website hero background. Two floating translucent electric-blue glass objects (#0865FE): a long slanted parallelogram bar and a triangle with a triangular cut-out in its centre, leaning together side by side like a stylised letter A, with subtle internal refraction, soft caustics and a thin bright rim light. Seamless deep navy-to-black studio background (#06080d), soft volumetric glow behind the objects, faint reflection on an almost invisible glossy floor. The objects sit in the right third of the frame; the left two thirds are calm, empty dark space for headline text. Very clean, generous negative space, Apple keynote aesthetic, photoreal render. No text, no letters, no logos, no watermark.
```

## Vídeo da capa do site (animação em loop)

Modelo `kling4_0`, imagem para vídeo, 5 s, 1080p. A imagem acima entra como primeiro **e** último quadro, para o vídeo emendar sem corte. Virou `growlift/img/hero.webm` e `hero.mp4`.

```
Seamless looping hero background. The two blue glass objects stay perfectly still in place, same shape, same position. Only the light moves: a soft band of bright light sweeps slowly across the glass from left to right, refractions and caustics shimmer gently inside the glass, the blue glow behind breathes softly, and the reflection on the floor ripples very subtly. Locked-off static camera, no camera movement, no zoom. Calm, minimal, premium. No text, no new objects.
```

## Fotos dos modelos fictícios

Modelo `gpt_image_2_5`. Usadas nos sites conceito Brasa Burger, Varanda Bistrô, Doce Ateliê e Aurora Advocacia.

**Hamburgueria (1:1)**
```
Studio food photograph of a gourmet double smash burger with melted cheddar, crispy bacon and a glossy brioche bun, floating slightly, on a pure deep black background with warm golden rim light and a few flying sesame seeds and crumbs. Centered, dramatic, appetising, sharp detail. No text, no logos, no hands, no plate.
```

**Restaurante (3:2)**
```
Bright airy photograph of a charming small restaurant terrace at lunchtime: wooden tables set with white linen, rattan chairs, lush tropical plants, natural daylight, soft shadows, inviting atmosphere. No people, no text, no signs, no logos. Editorial lifestyle photography.
```

**Confeitaria (4:5)**
```
Elegant two-tier celebration cake with smooth cream frosting, fresh strawberries, raspberries and delicate chocolate shards on top, on a light ceramic cake stand, soft cream background, gentle natural window light. Bakery product photography, clean and refined. No text, no logos, no people.
```

**Escritório de advocacia (16:9)**
```
Interior of a modern, elegant law office at dusk: dark navy walls, tall wooden bookshelves with leather-bound books, a large window with a city view, warm brass lamps, refined and trustworthy atmosphere. No people, no text, no logos, no visible titles on books. Architectural photography, cinematic.
```

## Pedir um conteúdo novo para o Claude

Copiem, troquem o que está entre colchetes e mandem na conversa. O que eu fizer aparece aqui no painel depois da publicação.

```
Cria [um carrossel / 3 stories / um roteiro de Reel] para o Instagram da Growlift sobre [tema].
Público: [ex.: donos de restaurante em São Paulo].
Objetivo: [ex.: pedir o diagnóstico grátis].
Segue o guia visual e o tom de voz de growlift-social/01-identidade. Nada de resultado, cliente ou depoimento inventado.
Quando terminar, manda para a aba Conteúdos do painel.
```

## Regras para prompts novos

- Sempre terminar com "no text, no letters, no logos": a IA escreve errado e inventa marca.
- Nada de pessoa que pareça cliente real, nem rosto de alguém sem autorização.
- Conferir o custo antes de gerar. Imagem simples custa bem menos que imagem em alta qualidade, e vídeo custa mais que as duas.
