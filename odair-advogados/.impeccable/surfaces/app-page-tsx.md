---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/areas/[slug]/page.tsx"]
---

# Surface: página inicial (app/page.tsx) e páginas de área

Mode: Persuade (institucional e sóbrio). Visitante no celular, em São Paulo, com um problema jurídico pessoal ou empresarial; quer saber se o escritório atua na sua área, se é sério e como falar com ele. Ação: identificar a área (cards e páginas próprias) e chegar ao contato. Prova: a identidade real (monograma) e a delimitação clara das cinco áreas; nenhum número, avaliação, foto ou depoimento. Restrições: Provimento 205/2021 e Código de Ética da OAB; contatos, OAB e endereço pendentes; formulário em demonstração identificada; textos institucionais provisórios para aprovação do Dr. Odair; demonstração não oficial, link aberto, noindex.

Memorable moment: a roseta guilhochê que se grava em volta do monograma na abertura, e cada área com sua própria roseta.

Páginas relacionadas: app/areas/[slug]/page.tsx, app/conteudos, app/privacidade.

## Direction contract

THESIS: O site é um documento autenticado do escritório: guilhochê fino, selo e monograma como numa certidão ou escritura, transmitindo seriedade pela qualidade do traço. Recusa o template jurídico de balança, martelo, foto de banco e números de êxito.

OWN-WORLD: Marinho #071B2E e azul institucional #102C43 em campos inteiros (abertura, áreas, rodapé); marfim #F7F5F0 e branco nas seções de leitura; dourado #C6A15A só em fios guilhochê, no monograma, em numerais e no botão principal; grafite #252B31 no texto; bordas #E6E8EA. Bodoni Moda (didone de documento gravado) nos títulos, Manrope em subtítulos, rótulos e texto. Fios de 1px, rosetas e faixas guilhochê geradas em SVG por fórmula, cantos de 2–4px, sombras quase nulas.

STORY: Entende que é um escritório de advocacia em São Paulo com cinco áreas delimitadas, reconhece a marca, encontra sua área, lê uma explicação sóbria e sabe como o primeiro contato funciona e como iniciá-lo.

FIRST VIEWPORT: (Revisado a pedido do usuário: "hero com um escritório de advocacia ... as áreas de trabalho ... com scroll trigger", escolha "Abertura presa, áreas em sequência"; imagem "bonita genérica" até a foto real.) Campo inteiro com a foto de um escritório ao fundo (ilustrativa, marcada como tal), véu marinho denso à esquerda e leve sobre a janela; header com monograma e nome, links ao centro, "Falar no WhatsApp" à direita. Esquerda (7 col): título em Bodoni Moda (segunda frase em dourado), subtítulo, botões "Conheça as áreas de atuação" (dourado) e "Conversar pelo WhatsApp" (contorno). Direita (5 col): o selo, roseta guilhochê gravando-se em volta do monograma, com "ADVOCACIA • SÃO PAULO" como legenda no anel externo. Mobile: foto com véu, texto e botões na base, sem o selo.
FORM: "A certidão", candidato 3 da lista própria, atribuído pelo sorteio (rodada degradada, sem desafiantes); seed:11b413651335bb97. Interação assinatura: a abertura fica presa (GSAP ScrollTrigger) e as cinco áreas entram uma de cada vez sobre o escritório (nome em Bodoni, resumo, assuntos, "Saiba mais"), enquanto a foto se aproxima, o selo recua e gira um passo por área; índice clicável no desktop e traços de progresso no celular; sem movimento, as áreas ficam em lista. Também: gravação da roseta na abertura, linha do tempo da abordagem que se preenche no scroll, roseta de cada área que vira cabeçalho da página da área. Movimento discreto, scrub suave.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
