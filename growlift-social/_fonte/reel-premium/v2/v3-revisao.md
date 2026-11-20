# Reel 001 · v3 de revisão (27/10/2026)

**Versão para vocês avaliarem. Não é a versão comercial final.** Não foi publicada nem copiada para `05-reels/`. A v2 entregue continua intacta como versão de segurança: `renders/sua-marca-merece-mais.mp4` e `05-reels/09-sua-marca-merece-mais.mp4`.

- **Vídeo:** `renders/v3/revisao-v3.mp4`, com a capa em `revisao-v3-capa.png`.
- **Formato:** 30,6 s, 1080×1920, 30 fps, H.264 High + som AAC 48 kHz estéreo, −15,7 LUFS.
- **Storyboard novo:** `previews/v3-storyboard.png`, com os 17 momentos e o que mudou em cada um. A ficha está em `storyboard-v3.json`.
- **Antes e depois:** `previews/v3-antes-depois.png`, com a v2 ao lado da v3.2, cena a cena.
- **Quadros em tamanho real:** `renders/v3/quadros/01…17.png`, com os tempos em `tempos.json`.
- **Gasto:** zero. Nenhum crédito do Higgsfield foi usado; o saldo continua 194,50.

## v3.2: sem o Swell Club e com o Chapa 77 mais devagar (pedido de vocês)

- **Três projetos:** Salinho (ver a peça), Chapa 77 (pedido e Pix) e Fornada (reserva do café da manhã). O Swell Club saiu inteiro.
- **Chapa 77 mais devagar:**
  - As três gravações rodam a 85% da velocidade real; antes era 115% a 135%.
  - Há pausas nos momentos que contam a história: os dois adicionais marcados com o total em R$ 66, a sacola, o QR code do Pix, "Pix confirmado" e o pedido chegando na loja.
  - O trecho passou de 8,2 s para 14,5 s.
- **Chapa 77 → Fornada:** a tela da loja apaga e o cartão creme cresce até ocupar a tela, virando a página creme da Fornada. O retângulo cresce; não há zoom.
- **Fornada:** igual, só mais tarde no tempo.
- **Grade final:** no lugar da tela do surf entra a tela do Pix do Chapa 77 (`assets/chapa77/cel-pix.png`).
- **Duração:** 30,6 s. Os nomes das seções abaixo valem para a v3.1, exceto o que fala do Swell Club.

## v3.1: pagamento e tela da loja no Chapa 77 (pedido de vocês)

**O fim do Chapa 77 mudou.** A mensagem em "modo demonstração" saiu. No lugar:
- Sacola → Finalizar (retirada no local) → Pix → QR code → "Pedido recebido · Pix confirmado".
- O celular sai pela esquerda e entra a tela da loja: o pedido chega em Novos com "Pix pago", a loja toca em Aceitar e ele vai para Em preparo.

**De onde vem, e por que é seguro:**
- O site do Downtown (a base do Chapa 77) só manda o pedido pelo WhatsApp. O pagamento que aparece é o do **sistema de pedidos da Growlift**: o checkout feito para o El Patron e o painel das lojas (`plataforma/`).
- Esse sistema rodou **só nesta máquina** (`source/loja-demo.mjs`), com uma loja fictícia "Chapa 77", cliente "Cliente de teste", telefone (11) 90000-0000 e o **Pix em modo de demonstração**.
- O QR code só contém o texto "PIX DE DEMONSTRACAO" e não paga nada. Nenhum pedido chegou a uma loja de verdade, nada foi cobrado e nenhum site no ar foi tocado.
- O checkout está com as cores e a fonte do Chapa 77 e com os nomes trocados. A gravação confere quadro a quadro que não aparece "El Patron", nem nomes do cardápio dele, nem "Downtown".
- O pagamento foi confirmado pelo atalho de teste do sistema. Na loja real, quem confirma é o Mercado Pago, e a página do cliente se atualiza sozinha. Os avisos de "demonstração" e o botão "Simular pagamento" ficaram fora do quadro.

**Tempo:**
- O Chapa 77 passou de 5,4 s para 8,2 s.
- O Swell Club perdeu 1,1 s: abertura mais curta e um arrasto nas pranchas, em vez de dois.
- A Fornada ficou igual.
- O vídeo foi de 25,5 s para 26,95 s.

**Para a revisão legal antes de postar:**
- As legendas novas são "Pagamento por Pix no próprio site" e "O pedido chega pago na tela da loja". Isso é o que o sistema faz de verdade, com o Mercado Pago da loja ligado.
- Não falamos de taxa, comissão nem de confirmação automática.

## Diagnóstico da v2 e o que foi feito

| # | Problema | O que a v3 faz |
| --- | --- | --- |
| P01 | Zoom demais (Salinho, ponte verde-água, carrossel do Swell) | Só translação lateral ou vertical em escala fixa. A única coisa que cresce é a forma que vira o vermelho do Chapa 77. |
| P02 | O Chapa 77 só mostrava a rolagem das cores, sem o pedido | Gravação nova do cardápio real, no celular: Personalizar o Duplo 77 → Cheddar cremoso e Maionese artesanal → Adicionar → Ver sacola → Gerar mensagem do pedido. Aparece a prévia em **modo demonstração** do próprio site ("nenhum pedido é enviado"). Nenhum pedido foi enviado e nada foi pago. Os preços são de exemplo (R$ 58 + 4 + 4 = R$ 66), diferentes dos reais. As fotos são os renders 3D da Growlift. |
| P03 | O botão "Reserve minha peça" aparecia por cima do restaurante | O texto do botão some primeiro; só a forma verde cresce, ocupa a tela e muda de cor até o vermelho do Chapa 77. |
| P04 | "SWELL" disputava o quadro com a Fornada | As letras saem (17,25–17,55 s) antes de o título da Fornada entrar (17,6 s). No Swell, o nome só aparece como contorno ao fundo. |
| P05 | A cópia analisada tinha 512×910 | Essa era a cópia reduzida da conversa. O arquivo real já tinha 1080×1920, e a v3 também tem (conferido no ffprobe). Para avaliar, abram o MP4 do repositório, não a prévia do chat. |
| P06 | Sem som | Trilha e efeitos feitos aqui, nota por nota, em código (`source/audio3.py`). Não há amostra, música de biblioteca nem efeito de terceiros, então não depende de licença. Detalhes abaixo. |
| P07 | Fecho com "Peça seu diagnóstico grátis" em forma de botão | "GROWLIFT / SEU PRÓXIMO SITE COMEÇA AQUI. / growlift.com.br", em etapas (23,15 · 23,5 · 24,0 s), com uma luz atravessando a marca e uma subida lenta. Nenhum botão. |
| P08 | Leitura no celular | Nome do projeto em 96 px e descrição em 36 px (no máximo duas linhas); selo em 24 px. Ficam acima do selo e longe dos botões do Instagram. No Chapa 77, a tela do site ocupa 87% da largura, para os nomes e valores serem lidos. |
| — | Swell com aproximação | Câmera lateral: a faixa com três telas (abertura, pranchas com dois arrastos reais, aluguel) desliza em escala constante. |

**Preservado:**
- A abertura "SUA MARCA MERECE MAIS." com a mesma frase, paleta e hierarquia.
- A Salinho, com a mesma entrada, a troca das peças, "Leve por natureza" e a composição. Mudaram só o enquadramento (deslize lateral no lugar da aproximação) e as saídas.
- A Fornada, idêntica à v2. Só mudou de lugar no tempo (+2,15 s).
- A ideia da grade virando o símbolo da Growlift.

## Som

**Trilha:**
- 110 BPM, em lá menor (Am9 · Fmaj7 · Cmaj7 · G6).
- Abertura forte: três impactos, um por palavra (0,0 · 0,34 · 0,72 s).
- Por baixo das demonstrações, um pulso mais leve com arpejo suave.
- Na assinatura, um acorde com sino.

**Efeitos:**
- Os toques nos sites são sincronizados com as gravações: 2 na Salinho, 6 no Chapa 77 e 3 na Fornada.
- Os 2 arrastos no Swell e as transições também têm som.

**Volume e licença:**
- O volume foi ajustado para o padrão dos Reels: −14 LUFS no alvo, medido −15,4 LUFS, com pico abaixo de −1,5 dB.
- Licença: é tudo nosso, sem obra de terceiros, e pode ser usado comercialmente.
- Se preferirem música do Instagram, postem sem som e coloquem a música lá. Não usem as duas juntas.

## Autoconferência

- [x] 1080×1920, 30 fps, 26,95 s, com faixa de som (ffprobe).
- [x] Os zooms saíram. Só a forma da transição P03 cresce, e ela é o elemento de ligação.
- [x] Salinho e Fornada preservadas (comparadas no antes e depois).
- [x] O fluxo do Chapa 77 se lê: o total muda de 58 para 62 para 66, aparece a sacola com o item e a mensagem.
- [x] Nenhum nome real nos textos de nenhum quadro gravado. A gravação confere isso quadro a quadro.
- [x] Selo "Projeto conceito · nome fictício" de 3,0 até 22,9 s.
- [x] Nenhum botão clicável no fecho e nenhuma oferta de diagnóstico grátis.
- [x] Dentro da área segura: nada importante nos 220 px de cima nem nos 380 px de baixo.
- [x] Nenhum site em produção foi alterado e nenhum pedido ou pagamento real foi feito.

## Pendências (dependem de vocês)

1. **Aprovar ou pedir ajustes na v3.** Depois da aprovação:
   - render da versão comercial;
   - cópia para `05-reels/09-…` (troca a v2);
   - revisão do subagente `revisor-legal`, obrigatória antes de postar;
   - ajuste da legenda do item 9 em `05-reels/roteiros.md`, que hoje fala da v2.
2. **Som:** manter a trilha própria ou trocar por uma música do Instagram na hora de postar.
3. **Repositório público:** como já avisado, o GitHub `SportElo0/Hamburgueria` é público. Recomendo deixá-lo privado.

## Refazer

```
(cd plataforma && npm run build)                                          # painel, para a loja local
(cd elpatron && NEXT_PUBLIC_CATALOG_URL=http://localhost:3121/api/public/lojas/chapa-77 npx next build)   # checkout apontando para ela
node growlift-social/_fonte/reel-premium/v2/source/gravacoes.mjs        # gravações (inclui chapa77pedido, chapa77painel, chapa77pagamento e swellpranchas)
python3 growlift-social/_fonte/reel-premium/v2/source/audio3.py          # trilha → renders/v3/trilha-v3.wav
node growlift-social/_fonte/reel-premium/v2/source/reel3.mjs             # vídeo de revisão + capa (~2 min)
node growlift-social/_fonte/reel-premium/v2/source/reel3.mjs 10.6 24.6   # só alguns quadros, para conferir
node growlift-social/_fonte/reel-premium/v2/source/reel3.mjs --quadros   # os 20 momentos
node growlift-social/_fonte/reel-premium/v2/source/pranchas3.mjs         # storyboard v3 e antes/depois
```
