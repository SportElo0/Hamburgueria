# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + lucide-react, deploy na Vercel; mesma base dos sites LM Barbearia e Regiane Camilo deste repositório (pedido do cliente: "utilize nossos sites já feitos para base"). Animações de scroll com GSAP ScrollTrigger (licença padrão sem custo). Sem banco de dados, sem login, sem pagamento, sem API paga.

## Users

- **Quem está em Ilhabela ou planejando ir**, quase sempre no celular: turista procurando onde almoçar ou jantar perto da balsa/Perequê, ou morador escolhendo um lugar para uma ocasião. Quer ver o ambiente, saber o que tem no cardápio e pedir uma mesa.
- **Quem organiza um evento** (aniversário, confraternização) e quer saber se o espaço atende.
- **A administração do Convés**, que vai receber o site como demonstração comercial e precisa reconhecer o próprio restaurante.

## Product Purpose

Site de apresentação do Restaurante Convés Ilhabela: mostrar o ambiente real à beira da água (árvores, gramado, varanda coberta de madeira, mesas ao ar livre), transformar o cardápio impresso num cardápio digital pesquisável e levar o visitante a uma **solicitação** de reserva ou de evento que o restaurante confirma depois. Sucesso: o visitante entende o lugar em segundos, encontra o prato que quer e chega ao restaurante com data, horário e número de pessoas já organizados.

## Positioning

Restaurante brasileiro com destaque para peixes e frutos do mar (moquecas, caldeirada, camarões) e carnes, num espaço aberto e arborizado de frente para o canal de Ilhabela, no Perequê. Não é rooftop nem casa de luxo: é madeira, sombra de árvore, gramado e água.

## Operating Context

- Reserva **não** é confirmada pelo site: não há agenda integrada. O site monta a mensagem; a confirmação depende do restaurante.
- Canal de reserva (decisão do cliente nesta fase): **ligação** para (12) 3896-2058 + **copiar mensagem**. O WhatsApp fica preparado no código e só é ligado quando o restaurante confirmar o número.
- Cardápio impresso fotografado por clientes (avaliações do Google, há cerca de 6 meses) e catálogo Kyte (https://convesilhabela.catalog.kyte.site/) com preços divergentes. Nenhuma fonte foi confirmada pelo restaurante.
- Enquanto for proposta não contratada, o site é **demonstração**: prévia protegida (login Vercel), fora do Google, identificada como tal.

## Capabilities and Constraints

- Cardápio digital com busca e filtro por categoria, dados num arquivo central (`data/menu.ts`) com fonte e estado de confirmação por item.
- **Preços ocultos** até confirmação (decisão do cliente); ficam registrados nos dados e aparecem ao ligar uma opção.
- Bebidas alcoólicas transcritas mas não exibidas até confirmação (o briefing restringe categorias que dependem de normas aplicáveis).
- Formulário de solicitação de reserva (nome, data, horário de preferência, pessoas, observações) e de interesse em evento (nome, tipo, data, convidados, observações). Sem datas passadas, sem disponibilidade simulada, sem "reserva confirmada".
- **Não confirmados (não inventar):** horários de funcionamento, história, anos de funcionamento, equipe, prêmios, política de reservas, capacidade e pacotes de eventos, música ao vivo, acesso à praia, pizzaria napolitana (citada no Instagram, não verificada), WhatsApp, preços atuais, nota e número de avaliações do Google (capturas indicavam cerca de 4,7 e 2,1 mil, sem verificação).

## Brand Commitments

- Nome: **Restaurante Convés Ilhabela**.
- Endereço: Av. São João, 198 — Perequê, Ilhabela — SP, 11630-000.
- Telefone público: (12) 3896-2058. Instagram: @convesilhabela — https://www.instagram.com/convesilhabela/
- Logotipo (visto no cardápio impresso): "convés" em minúsculas de traço fino geométrico, com o "v" cortado por um mastro sobre um casco de barco com nervuras curvas, e "ILHABELA" em versalete condensado fino. A mesma forma de casco aparece como marca-d'água repetida nas páginas do cardápio. Sem arquivo original: o site usa uma versão tipográfica provisória inspirada nele.
- Referência visual principal pinada pelo cliente: site "Azure Terrace" (fundo areia, azul profundo, detalhes champanhe, tipografia editorial, foto panorâmica). Adaptar ao Convés real, sem copiar rooftop, fotos ou depoimentos da referência.
- Paleta pedida: areia #F8F5EF, azul-mar #123B53, azul profundo #102F45, champanhe #B49A67, sálvia #D8E1D8, grafite #2D302B, branco, bordas #E6E1D6. Areia e branco quente predominam; azul para mar e contraste; champanhe discreto.
- Pedido explícito: "tem que ter um scroll trigger legal".

## Evidence on Hand

- Foto externa (avaliação Google de Deia Domitti): gramado, caminho de pedra, árvores, bananeiras, mesas sob guarda-sóis, mar e montanhas ao fundo; carimbo "26 de novembro de 2025" no canto.
- Foto da varanda coberta (avaliação Google de Ramon Silva): forro de madeira, pilares de pedra com arandelas, tronco de árvore atravessando o deck, mesas e cadeiras de madeira escura, vista para a água. Pessoas pequenas e não identificáveis ao fundo.
- Uso das duas fotos (decisão do cliente): só em prévia protegida, creditadas e marcadas como provisórias até chegarem fotos oficiais.
- Cardápio fotografado: Carnes (7), Peixes (12), Camarões (8), Porções (14), Bebidas/Sucos/Refrigerantes/Cervejas, card de Pratos Promocionais individuais.
- Ausentes e proibidos de fabricar: fotos de pratos, depoimentos, fotos de clientes, história, horários.

## Product Principles

1. **O lugar é o argumento.** A beira d'água, as árvores e a madeira vêm antes de qualquer adjetivo.
2. **Solicitar não é confirmar.** Reserva e evento são pedidos; quem confirma é o restaurante.
3. **Cardápio fiel ao impresso.** Nome e descrição como estão; o que não foi confirmado fica marcado, nunca "arrumado".
4. **Celular primeiro.** Quem decide onde comer em Ilhabela está com o celular na mão.
5. **Movimento a serviço do lugar.** O scroll conta o caminho da varanda até a água; nada que atrase o acesso ao conteúdo.

## Accessibility & Inclusion

WCAG 2.2 AA: contraste, foco visível, teclado, textos alternativos, formulários com rótulos e erros claros, `prefers-reduced-motion` desliga as animações de scroll sem esconder conteúdo.
