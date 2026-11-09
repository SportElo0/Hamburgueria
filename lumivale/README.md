# Lumivale Energia Solar · projeto conceito

Site one-page de uma **empresa fictícia** de energia solar, feito pela Growlift para o portfólio. Nada aqui é cliente real: nomes, números (marcados "exemplo"), fotos (geradas por IA) e depoimentos (marcados "ilustrativo") são de exemplo. O site não aparece no Google (`noindex` no HTML, no `vercel.json` e no `robots.txt`).

## Arquivos

- `index.html`: as 11 seções, cada uma com um comentário numerado.
- `styles.css`: cores no bloco `:root`, depois uma parte por seção e, no fim, celular e movimento reduzido.
- `main.js`: no topo, a lista do que trocar (nome, WhatsApp, cores, textos, fotos). Cada animação tem um comentário curto.
- `vendor/`: GSAP 3.12.5 (com ScrollTrigger e MotionPathPlugin) e Lenis 1.1.13, guardados aqui para não depender de CDN.
- `fonts/`: Inter Tight (latim).
- `img/`: ilha da capa (fundo transparente) e fotos de telhados, todas geradas no Higgsfield em 09/11/2026 (custo total: 9,25 créditos).

## Como funciona

- O pré-carregamento e a entrada da capa são em CSS, para aparecerem antes de o JavaScript carregar.
- `gsap.matchMedia()`: no computador as seções "Por que solar", "Como funciona" e "Obras" ficam presas na tela; no celular (até 768 px) viram listas com entradas leves.
- Com "reduzir movimento" ligado no aparelho: sem rolagem suave, sem seções presas, conteúdo parado e visível.
- O formulário não calcula economia nem guarda dados: só monta a mensagem e abre o WhatsApp (`CONFIG.whatsapp` em `main.js`, hoje um número fictício).

## Testar

```
cd lumivale && python3 -m http.server 4310
```

Testado em 390, 768, 1280 e 1440 px, sem rolagem lateral. Lighthouse (celular, servidor local sem compressão): desempenho 84, acessibilidade 100, boas práticas 100.
