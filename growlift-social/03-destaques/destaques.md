# Destaques

**Ordem no perfil:** Projetos, Serviços, Contato. "Clientes" só entra quando houver um cliente real com autorização (ver abaixo). Os destaques Design e Processo saíram (decisão de 26/10/2026).

**Como deixar nessa ordem:** o Instagram põe na frente o destaque criado ou atualizado por último. Então criem **Contato primeiro, depois Serviços e Projetos por último**. Adicionar um story a um destaque antigo o joga para a frente de novo.

## Capas

Usem as capas da **direção A** (`capas/direcao-A/`): fundo azul-marinho, ícone azul de traço fino e um anel discreto. A direção B (`capas/direcao-B/`) fica de registro.

**Por que a A:**
- **Combina com o site:** os ícones do site também são azuis e de traço fino.
- **Funciona pequena:** no círculo do perfil (cerca de 64 pt), a grade e o losango da B somem.

**Como trocar a capa no app:** abram o destaque, toquem em "Editar destaque" e depois em "Editar capa". Escolham a imagem e deixem o ícone no centro do círculo.

## Como publicar

1. Postem os stories de cada pasta em ordem (01 primeiro, o último por último): o destaque mostra do mais antigo para o mais novo.
2. Depois juntem todos no destaque.
3. Adesivo de link: só nos stories abaixo. Os outros ficam sem link.

| Destaque | Story | Endereço do link | Texto do adesivo |
| --- | --- | --- | --- |
| Projetos | 06 (o nosso próprio site, computador e celular) | `https://growlift.com.br` | Ver o site ao vivo (por cima do botão azul desenhado na arte) |
| Serviços | 06 (peça um diagnóstico grátis) | `https://growlift.com.br/#diagnostico` | Pedir diagnóstico |
| Contato | 01 (chama no WhatsApp) | `https://wa.me/5511994463234` | Chamar no WhatsApp (por cima do botão azul) |
| Contato | 02 (diagnóstico grátis) | `https://growlift.com.br/#diagnostico` | Pedir diagnóstico grátis (por cima do botão azul) |

   Nas artes novas, o lugar do link já vem desenhado: um botão azul do tamanho do adesivo. Ponham o adesivo exatamente em cima dele.
   No Instagram: adesivos › **Link** › colem o endereço › **Personalizar texto do adesivo**. Ponham o adesivo num espaço vazio, nunca na barra de baixo ("Enviar mensagem").

## 1 · Projetos (6 stories)

| Arquivo | O que mostra |
| --- | --- |
| 01 | Abertura: "Um visual para cada ramo." |
| 02 a 05 | Brasa Burger, Varanda Bistrô, Doce Ateliê e Aurora Advocacia, cada um marcado **"Projeto conceito · nome fictício"**, com 3 funcionalidades |
| 06 | **Projeto real:** o site da Growlift no computador e no celular, com o botão "Ver o site ao vivo" para o adesivo de link |

Os quatro modelos são fictícios e estão identificados como tal. Os sites feitos para negócios reais (El Patron, Downtown e outros) **ficam de fora**: foram demonstrações, não clientes, e não temos autorização para mostrar a marca deles.

## 2 · Serviços (6 stories)

1. Abertura.
2. Site feito do zero.
3. Achado no Google.
4. Pedido e Pix no site.
5. Clientes que voltam.
6. Chamada para o diagnóstico grátis.

Tudo o que aparece está nos planos do site. Não incluí nada que vocês ainda não entregam, como agendamento online ou relatórios de marketing.

## 3 · Clientes (estrutura pronta, **não publicar ainda**)

- `3-clientes/_modelo-nao-publicar.png` é só o modelo, com a marca d'água "NÃO PUBLICAR".
- Quando houver o primeiro cliente, preencham com o depoimento **nas palavras dele, com autorização por escrito**, o nome do negócio e o print do site entregue. Eu gero a peça final.
- Até lá, não criem esse destaque.

## 6 · Contato (2 stories)

| Arquivo | O que mostra |
| --- | --- |
| 01 | "Chama no WhatsApp.", a marca de vidro, o número (11) 99446-3234 e o botão **Chamar no WhatsApp**. Sem fotos de pessoas nos destaques (decisão de 26/10/2026) |
| 02 | Diagnóstico grátis em 3 passos (conte sobre o negócio, receba a prévia em até 2 dias úteis, decida com calma), com o botão **Pedir diagnóstico grátis** |

## Editar

- Os textos de todas as peças ficam em `../_fonte/gerar.mjs`.
- Para gerar tudo de novo: `node growlift-social/_fonte/gerar.mjs`.
