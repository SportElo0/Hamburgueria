# Pousada Areia Clara · projeto conceito

Site one-page de uma **pousada fictícia** pé na areia em Juquehy (litoral norte de SP), feito pela Growlift para demonstrar a oferta para pousadas (viagem a Juquehy em 21 e 22/11/2026). Nada aqui é cliente real: suítes, números, horários, regras e conversas são exemplos; fotos e vídeo foram gerados por IA. O nome foi pesquisado em 16/11/2026 e não encontramos pousada real com ele ("Maré Mansa" existe e foi descartado). O site não aparece no Google (`noindex` no HTML, no `vercel.json` e no `robots.txt`).

Inspiração visual: referência de site de glamping de luxo que o Antônio mandou do Pinterest (letra serifada, muito respiro, fotos ao entardecer). Layout, textos e imagens são originais.

## Arquivos

- `index.html`: 8 partes numeradas (abertura, capa, a pousada, suítes, panorama, um dia aqui, como chegar, cotação), rodapé e a conversa de demonstração.
- `styles.css`: cores no `:root`, uma parte por seção; no fim, celular e movimento reduzido.
- `main.js`: animações (GSAP + ScrollTrigger + Lenis), conversa de demonstração (`RESPOSTAS`) e formulário.
- `vendor/`: GSAP 3.12.5 com ScrollTrigger (licença padrão GreenSock) e Lenis 1.1.13 (MIT), os mesmos do site da Lumivale.
- `fonts/`: Fraunces (títulos) e Inter Tight (texto), ambas OFL; licenças na própria pasta.
- `img/`, `video/`: 8 fotos e 1 vídeo de 4 s em loop, gerados no Higgsfield em 16/11/2026 (custo: 8 créditos nas fotos, GPT Image 2.6 média 2k, e 7,5 no vídeo, Kling 3.0 padrão sem som).

## Como funciona

- Abertura: uma onda se desenha, o nome sobe e a cortina abre (CSS, antes do JavaScript).
- Capa com vídeo em loop (sem som), título palavra por palavra e barra de datas que leva os dados para a cotação.
- A frase da pousada acende palavra por palavra na rolagem; os números contam.
- No computador, as suítes passam de lado com a seção presa; no celular viram carrossel com toque.
- O panorama da piscina cresce de uma janela até a tela inteira.
- "Um dia aqui": a seção prende e a página vai da manhã (areia) à tarde e à noite (fundo escuro).
- O caminho de São Paulo até Juquehy se desenha no mapa ilustrativo.
- Cotação: valida datas, nome, WhatsApp e aceite; **não envia nada**. Mostra o recibo e abre a conversa, em que a assistente (Clara) repete o pedido e diz que passou para a equipe.
- Conversa de demonstração: respostas prontas (pet, check-in, estacionamento, cotação, falar com a equipe). Se perguntarem "você é um robô?", ela responde que é a assistente virtual e oferece chamar alguém, como manda a regra do produto.
- Com "reduzir movimento" ligado: sem rolagem suave, sem vídeo, sem seções presas, tudo visível.

## Antes de reaproveitar para uma pousada real

- Trocar nome, fotos (só da pousada, com autorização de quem aparecer), suítes, regras, horários e números por dados reais confirmados.
- Ligar o formulário e a conversa ao Growlift Comercial e ao WhatsApp oficial da pousada; disponibilidade e preço só com integração ao motor de reservas dela.
- Pôr CNPJ, endereço e política de privacidade; tirar o `noindex` só se a pousada quiser aparecer no Google.

## Testar

```bash
cd areia-clara && python3 -m http.server 4173
# abrir http://localhost:4173 no celular (390 px) e no computador (1440 px)
```
