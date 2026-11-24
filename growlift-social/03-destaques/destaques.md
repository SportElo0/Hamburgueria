# Destaques

**Ordem no perfil:** Projetos, Serviços, Contato. "Clientes" só entra quando houver um cliente real com autorização (ver abaixo). Os destaques Design e Processo saíram (decisão de 26/10/2026).

**Como deixar nessa ordem:** o Instagram põe na frente o destaque criado ou atualizado por último. Então criem **Contato primeiro, depois Serviços e Projetos por último**. Adicionar um story a um destaque antigo o joga para a frente de novo.

## Capas

Uma por destaque, em `capas/`: `1-projetos.png`, `2-servicos.png`, `6-contato.png` (e `3-clientes.png` para quando houver cliente). Quadradas (2160×2160), azul da marca até a borda e ícone branco grosso, sem texto: o nome do destaque o Instagram já escreve embaixo do círculo.

**Como trocar a capa no app:** abram o destaque › "Editar destaque" › "Editar capa" › escolham a imagem da galeria e deixem o ícone no centro do círculo.

## Como publicar

1. Postem os stories de cada pasta em ordem (01 primeiro, o último por último): o destaque mostra do mais antigo para o mais novo.
2. Depois juntem todos no destaque.
3. Adesivo de link: só nos stories abaixo. Os outros ficam sem link.

| Destaque | Story | Endereço do link | Texto do adesivo |
| --- | --- | --- | --- |
| Projetos | 06 (o nosso próprio site, computador e celular) | `https://growlift.com.br` | Ver o site ao vivo |
| Serviços | 12 (qual desses resolve o seu problema?) | `https://growlift.com.br/#diagnostico` | Pedir diagnóstico grátis |
| Contato | 01 (chama no WhatsApp) | `https://wa.me/5511942279336` | Chamar no WhatsApp |
| Contato | 02 (diagnóstico grátis) | `https://growlift.com.br/#diagnostico` | Pedir diagnóstico grátis |

   Nas artes novas, o lugar do link já vem desenhado: uma frase "Toque no link…" com uma setinha e, embaixo, uma área de luz azul **sem texto**. Ponham o adesivo dentro dessa luz (o Instagram não deixa pôr o adesivo por cima de texto da imagem).
   No Instagram: adesivos › **Link** › colem o endereço › **Personalizar texto do adesivo**. Ponham o adesivo num espaço vazio, nunca na barra de baixo ("Enviar mensagem").

## 1 · Projetos (6 stories)

| Arquivo | O que mostra |
| --- | --- |
| 01 | Abertura: "Um visual para cada ramo." |
| 02 a 05 | Brasa Burger, Varanda Bistrô, Doce Ateliê e Aurora Advocacia, cada um marcado **"Projeto conceito · nome fictício"**, com 3 funcionalidades |
| 06 | **Projeto real:** o site da Growlift no computador e no celular, com o botão "Ver o site ao vivo" para o adesivo de link |

Os quatro modelos são fictícios e estão identificados como tal. Os sites feitos para negócios reais (El Patron, Downtown e outros) **ficam de fora**: foram demonstrações, não clientes, e não temos autorização para mostrar a marca deles.

## 2 · Serviços (12 stories, novos em 24/11/2026)

10 serviços diferentes, um por story, no formato do story antigo "Achado no Google": selo, título curto, o problema em uma frase, a imagem da demonstração (dados fictícios) e 3 checks. Cada story numa cor. Só entram serviços que existem (prontos ou que só falta ligar no número do cliente); as ideias da aba Serviços ficam de fora até ficarem prontas.

| Arquivo | Serviço |
| --- | --- |
| 01 | Abertura: "10 coisas que a gente monta pro seu negócio." (marca em 3D) |
| 02 | Site que responde (site com chat de IA) |
| 03 | Resposta na hora (atendente de IA no WhatsApp) |
| 04 | Ninguém atendeu? (ligação perdida vira WhatsApp) |
| 05 | Quem sumiu volta (retomada) |
| 06 | Certo no Google (perfil no Google + SEO) |
| 07 | Convite para avaliar (avaliações no Google) |
| 08 | Cardápio no QR |
| 09 | Delivery próprio |
| 10 | Quem parou de comprar (app de clientes) |
| 11 | Quanto sobra no prato (painéis de números) |
| 12 | "Qual desses resolve o seu problema?", com o lugar do link para o diagnóstico grátis |

**Antes de postar, apaguem do destaque os stories antigos.** Para gerar de novo: `node growlift-social/_fonte/servicos-v3.mjs` (imagens em `plataforma/public/servicos/`).

## 3 · Clientes (estrutura pronta, **não publicar ainda**)

- `3-clientes/_modelo-nao-publicar.png` é só o modelo, com a marca d'água "NÃO PUBLICAR".
- Quando houver o primeiro cliente, preencham com o depoimento **nas palavras dele, com autorização por escrito**, o nome do negócio e o print do site entregue. Eu gero a peça final.
- Até lá, não criem esse destaque.

## 6 · Contato (2 stories)

| Arquivo | O que mostra |
| --- | --- |
| 01 | "Chama no WhatsApp.", a marca de vidro, o número (11) 94227-9336 e o botão **Chamar no WhatsApp**. Sem fotos de pessoas nos destaques (decisão de 26/10/2026) |
| 02 | Diagnóstico grátis em 3 passos (conte sobre o negócio, receba a prévia em até 2 dias úteis, decida com calma), com o botão **Pedir diagnóstico grátis** |

## Editar

- Os textos de todas as peças ficam em `../_fonte/gerar.mjs`.
- Para gerar tudo de novo: `node growlift-social/_fonte/gerar.mjs`.
