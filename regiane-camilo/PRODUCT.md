# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + lucide-react, deploy na Vercel. Pedido explícito do cliente no briefing. Sem banco de dados, sem login, sem pagamento online.

## Users

- **Quem encomenda um bolo**, quase sempre pelo celular, depois de ver um post no Instagram ou de receber o link no WhatsApp. Está planejando uma data (aniversário, festa infantil, casamento, comemoração) e quer saber se a Regiane faz o que imagina e como pedir.
- **A própria Regiane Camilo**, que vai receber o site como proposta de apresentação. Precisa reconhecer imediatamente os próprios bolos e a própria marca.

## Product Purpose

Site de apresentação e pedidos da confeitaria **Bolos e Doces Regiane Camilo**, em São Sebastião (litoral de SP). Mostra os bolos reais da Regiane e transforma o interesse em um pedido de orçamento bem preenchido no WhatsApp dela. Sucesso: a cliente chega ao WhatsApp com ocasião, estilo, quantidade de pessoas, tema e data já escritos, e a Regiane só precisa responder com possibilidades e valores.

## Positioning

Bolos personalizados feitos pela Regiane, com decoração em chantilly/creme trabalhada à mão (frisos, rosetas, bicos, aplicações), fotografados sempre no mesmo cenário: parede clara com o nome e o WhatsApp dela em letras espelhadas rosé, sobre gramado sintético. O site é uma vitrine dessas peças reais, não um e-commerce.

## Operating Context

- O pedido acontece no WhatsApp da cliente: o site monta a mensagem (wa.me + encodeURIComponent) e a cliente envia. Nada é aceito ou confirmado automaticamente; data, tamanho e valor dependem da resposta da Regiane.
- O Instagram @re.camilo é a vitrine diária (mais de 3 mil posts). Não há integração com o feed: a seção de Instagram é estática e aponta para o perfil.
- Enquanto a proposta não for contratada, o site é uma **demonstração**: prévia sem indexação, identificada como tal, sem se apresentar como canal oficial.

## Capabilities and Constraints

- Fluxo de pedido guiado: ocasião → estilo/referência → detalhes (pessoas, tema, sabor livre, mensagem no bolo, observações) → data desejada (sem datas passadas, sem afirmar disponibilidade) → nome → resumo → WhatsApp.
- Catálogo estruturado em arquivo de configuração (id, nome, categoria, descrição, imagem, preço opcional, tamanhos, sabores, recheios, personalização, disponibilidade, destaque). Sem dados confirmados, mostra "Consultar orçamento".
- Sem carrinho enquanto não houver produtos e preços confirmados.
- **Não confirmados (não inventar):** horários, preços, tamanhos, sabores, recheios, formas de pagamento, entrega/retirada, atendimento presencial, tempo de experiência, formação, história, quantidade de clientes, categorias realmente oferecidas.

## Brand Commitments

- Nome: **Bolos e Doces Regiane Camilo**. Proprietária: Regiane Camilo.
- Instagram: @re.camilo — https://www.instagram.com/re.camilo/
- WhatsApp: (12) 99625-8593 — integração 5512996258593.
- Endereço informado no Instagram: Rua José Ferro, 307 — São Sebastião, SP.
- Logotipo atual: selo redondo marrom-chocolate com cupcake rosa e branco, duas cerejas, "·BOLOS·" em versalete espaçado, faixa creme com "Regiane Camilo" em letra cursiva condensada e o WhatsApp no arco inferior. Decisão do cliente: o site usa uma **assinatura tipográfica** inspirada nele ("Regiane Camilo" cursiva + "Bolos & Doces" em versalete) e mostra o **selo original** no rodapé e na seção Sobre.
- Paleta pedida no briefing: creme #FFF7EF, branco, rosa suave #F1D2C8, rosa confeitaria #EBA1BB, chocolate #63341F, cereja #B73439, texto #36251F, texto secundário #76665F, bordas #EADFD7. Predominantemente claro, detalhes de chocolate e rosa, nada infantil.
- Referência visual principal: site "The Cake Haven" (inspiração de composição, não cópia de nome, preços, produtos ou depoimentos).
- Voz: português brasileiro natural, acolhedor e comercial.

## Evidence on Hand

Capturas de tela do Instagram @re.camilo enviadas pelo cliente em 21/10/2026, **com autorização de uso** para a demonstração (provisórias até chegarem os originais):

1. Bolo branco com frisos, estrela-do-mar, concha e pérolas (tema marinho).
2. Bolo branco com rosetas de chocolate e creme, morangos, raspas de chocolate e calda escorrendo.
3. Bolo branco com borda de chantilly azul e degradê azul na lateral.
4. Bolo de chocolate com brigadeiros e granulado, lateral em babados de chocolate.
5. Bolo temático de futebol, gramado verde em bico, jogadores, bola, chuteira e faixa "GABRIEL" com número 9 (cliente decidiu manter o nome).
6. Grade do perfil (re-mostra 1, 2, 3 e outros dois não identificáveis com segurança) e o logotipo redondo (~680 px).

Ausentes, e que não podem ser fabricados: depoimentos, avaliações, nota, número de clientes, foto da Regiane, história da marca, preços, sabores, horários.

## Product Principles

1. **Os bolos reais são o argumento.** Cada foto é um trabalho da Regiane; nenhuma imagem genérica entra como se fosse dela.
2. **Pedido é pedido de orçamento.** O site organiza a conversa; quem confirma data, tamanho e valor é a Regiane.
3. **Só o que foi confirmado.** Campo sem dado vira "a combinar", nunca um valor plausível.
4. **Celular primeiro.** A cliente chega pelo Instagram/WhatsApp; o fluxo inteiro precisa caber no polegar.
5. **Fácil de manter.** Trocar foto, adicionar bolo ou preço é editar um arquivo de configuração.

## Accessibility & Inclusion

WCAG 2.2 AA: contraste, foco visível, navegação por teclado, textos alternativos descritivos nas fotos, formulários com rótulos e erros claros, respeito a prefers-reduced-motion.
