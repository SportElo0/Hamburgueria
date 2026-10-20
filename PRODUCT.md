# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Viajantes decidindo onde se hospedar em Paraty-RJ, pesquisando pelo celular (Instagram, Google, TripAdvisor) e comparando pousadas antes de reservar. A dona da pousada também usa o site como material de apresentação/venda.

## Product Purpose

Site institucional da Pousada Villa Verano: apresentar a pousada e converter visitantes em contato real pelo WhatsApp. Não há reserva automática online no site (existe um motor de reservas externo, `hbook.hsystem.com.br`, não integrado aqui).

## Positioning

Pousada boutique de fachada amarela e cara colonial, no bairro Caborê, a cerca de 5 minutos do Centro Histórico de Paraty e perto da Praia do Jabaquara. Piscina, jardim, café da manhã no terraço, aceita pets, estacionamento privativo gratuito. O diferencial visual pedido pelo cliente: usar a identidade das portas/arcos coloniais de Paraty como conceito central do site (não genérico de "pousada de praia").

## Operating Context

Construído e operado pela Growlift (agência). O cliente (dona da pousada) ainda não fechou contrato — veio por indicação (mãe do responsável da Growlift) e esse site é a peça de demonstração para fechar o negócio. Por isso ainda não está ligado ao painel compartilhado multi-loja da Growlift (`plataforma/`, em outro branch) nem tem cobrança configurada.

## Capabilities and Constraints

- 3 tipos de quarto reais, extraídos do motor de reservas da própria pousada: Quarto de Casal Deluxe (até 2, cama king, vista jardim, varanda), Quarto para Três Pessoas Deluxe (até 3, cama king + extra), Quarto para Quatro Pessoas (até 4, cama de casal + extras).
- 4 fotos reais disponíveis hoje em `public/images/`: fachada ao entardecer, piscina, dois quartos (um verde, um amarelo). Mais fotos reais serão enviadas pelo cliente e devem substituir/complementar as atuais — nunca gerar foto falsa da pousada nem usar banco de imagens.
- Sem preço fixo publicável (varia por data); CTA de reserva sempre aponta para WhatsApp real, nunca simula checkout.
- Contato: WhatsApp 5511999887127 (escolhido entre 3 números do site antigo — cliente disse que não importa qual), Instagram @villaveranopousada, endereço R. Guapuruvu 193 - Caborê, Paraty-RJ, CEP 23970-000.
- Avaliação real: 4,7 · 163 avaliações no Google, hotel 3 estrelas.

## Brand Commitments

Nome "Pousada Villa Verano". Cor de marca = o amarelo da fachada real (extrair da foto, não usar amarelo genérico). O visual anterior (fundo creme, serifa, botão laranja, fotos pequenas em caixa) foi rejeitado explicitamente pelo cliente e não deve ser reaproveitado nem usado como ponto de partida — só como anti-referência.

## Evidence on Hand

- Fotos reais em `public/images/`: `hero-fachada.jpg`, `piscina.jpg`, `quarto-verde.jpg`, `quarto-amarelo.jpg`.
- Textos e dados reais em `src/lib/site.ts` (endereço, contato, tipos de quarto, comodidades, avaliação).
- Site antigo da pousada (`pousadavillaverano.com.br`) e motor de reservas (`ohotel.com.br`) já pesquisados; não há mais conteúdo real a extrair de lá além do que já está capturado.
- Ausência: nenhuma foto de café da manhã, interior do quarto "casal deluxe" específico, ou do portão/entrada de dia. Não inventar essas cenas — usar o que existe ou placeholder identificado como provisório.

## Product Principles

1. Fotos sempre reais da pousada — nunca geradas por IA, nunca de banco de imagens.
2. Nenhum dado inventado: preço, avaliação, comodidade e contato só os que já existem e foram confirmados.
3. O site é peça de venda para fechar um contrato ainda não assinado — precisa impressionar visualmente tanto quanto os outros sites já entregues pela Growlift (Downtown Burger, Mercantil).
4. CTA de reserva é sempre WhatsApp real; nunca promete reserva automática.

## Accessibility & Inclusion

Requisitos definidos pelo cliente para o novo hero interativo: controle (porta) é um elemento focável com `aria-label` descrevendo a próxima cena; título da cena ativa fica numa região `aria-live`; foco sempre visível; `prefers-reduced-motion` troca a transição por um fade simples, sem zoom/câmera.
