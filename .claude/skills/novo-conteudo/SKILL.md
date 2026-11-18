---
name: novo-conteudo
description: Cria ou altera conteúdo do Instagram e do WhatsApp da Growlift (stories, destaques, carrosséis, posts, Reels, legendas, respostas do WhatsApp, prompts) seguindo a identidade visual e as regras da marca, e manda para a aba Conteúdos do painel. Use quando pedirem post, story, carrossel, Reel, legenda, texto de WhatsApp ou qualquer peça para as redes da Growlift.
argument-hint: "[o que criar e sobre o quê]"
---

# Novo conteúdo da Growlift

Tudo mora em `growlift-social/` e aparece no painel (`/painel/conteudos`) depois que o painel é publicado.

## Antes de criar

1. Leia `growlift-social/01-identidade/guia-visual.md` (cores, fonte Inter, margens, tom de voz) e o `README.md` da pasta.
2. Confira o que já existe na pasta certa para não repetir:
   - `02-instagram-perfil/`, `03-destaques/`, `04-posts-fixados/`, `05-reels/`, `06-whatsapp-business/`, `07-planejamento/`, `08-prompts/`.
   - Pasta nova: `NN-nome/` e um título em `FOLDERS`, em `plataforma/scripts/conteudos.mjs`.

## Regras da marca

- **Nada inventado:** nenhum cliente, depoimento, número de vendas ou resultado. Prazos e planos só como estão no site e no contrato (site no ar em até 7 dias úteis; alterações: Start 1, Grow 2, Lift 4 por mês, cada uma em até 2 dias úteis).
- **Portfólio:** só os projetos conceito (Brasa Burger, Varanda Bistrô, Doce Ateliê, Aurora Advocacia), sempre marcados "Projeto conceito · nome fictício", e o próprio site da Growlift. Marcas reais de clientes só com autorização por escrito.
- **Pessoas:** só fotos autorizadas (Lucas e Antônio já estão em `_fonte/assets/`).
- **Preço em post:** só com as condições junto (regra do consumidor); prefira mandar para o site.
- **Nunca prometer** faturamento, posição no Google, "melhor" ou "líder".
- **Só português do Brasil:** narração e textos sempre em português brasileiro. Nenhuma voz com sotaque de Portugal (as vozes prontas da ElevenLabs costumam soar portuguesas: os sócios já reprovaram). Antes de narrar um Reel, gere uma amostra curta com a voz escolhida e mande para os sócios ouvirem; só narre o Reel depois do "ok" deles.
- **Nada é publicado** no Instagram nem no WhatsApp: vocês entregam a peça, quem aprova e posta são eles.

## Gancho forte nos 3 primeiros segundos (todo Reel e todo anúncio)

Pedido do Antônio (18/11): sem gancho forte, o resto do vídeo não importa.
- **Abra com uma pergunta firme ou uma afirmação curiosa**, falada pela voz já na primeira palavra e escrita em letra grande na tela (ex.: "O que acontece se você gritar no espaço?", Reel 28). Nada de logo, apresentação ou "olá" antes.
- **A imagem já responde no primeiro quadro:** a cena começa em movimento, mostrando o assunto da pergunta.
- **A voz precisa soar viva:** tom de conversa, sem leitura robótica. Na ElevenLabs, estabilidade baixa (0,2 a 0,3) e texto com pausa e pergunta. Os sócios querem uma voz o mais humana possível (clonar só voz de quem autorizou por escrito, ex.: o Lucas).
- **Gancho de curiosidade** (Reels orgânicos): um fato curioso e verdadeiro, com fonte, que vira metáfora do negócio. Sempre entregue a resposta antes de virar para a Growlift, senão a pessoa se sente enganada.
- **Em anúncio**, a curiosidade fica ligada ao problema de quem compra (ex.: "O que acontece com a mensagem que chega na sua clínica às 23h?"), para não atrair só curioso.
- Nunca afirme fato sobre o negócio de quem assiste ("você perde clientes"): use pergunta ou hipótese.

## Final dos Reels: "Comenta PALAVRA e ganha…" (pedido do Antônio, 18/11)

- No fim dos Reels orgânicos, prefira oferecer um **presente gratuito** a quem comentar ("Comenta MARGEM que eu te mando a planilha grátis") em vez de "quer ver a demonstração?".
- **O presente precisa existir antes do Reel ir ao ar** (PDF, planilha, checklist em `growlift-social/`), e o ManyChat precisa entregá-lo pela palavra, testado. Nada prometido que não esteja pronto.
- Vai para **todos** que comentarem, sem sorteio, sem exigir seguir, marcar amigo ou comprar. A mensagem do ManyChat fala como "Growlift"/"a gente", sem "mensagem automática", com opção SAIR; comentar não põe ninguém em lista de campanha.
- Anúncios continuam com o botão do WhatsApp (o "comenta" não funciona em anúncio).

## Como produzir

- **Imagens** (story 1080×1920, post 1080×1350): modelos em `_fonte/pecas.mjs`, textos em `_fonte/gerar.mjs`. Rode `node growlift-social/_fonte/gerar.mjs` e confira as imagens geradas.
- **Reels** (MP4 1080×1920, 30 fps, sem som): `_fonte/reels/gerar-reels.mjs` (cenas em HTML; gravações do site real com `captureSite`). Rode só o que mudou: `node growlift-social/_fonte/reels/gerar-reels.mjs 3`. Para o Reel 8, `npm run build` em `plataforma/` antes.
- **Textos** (legendas, roteiros, mensagens): em `.md` na pasta certa. Cada texto para copiar vai num bloco de código, porque o painel transforma cada bloco num botão "Copiar".
- **Imagem gerada por IA** só se o código não resolver: confira o custo antes e anote o prompt em `08-prompts/prompts.md`.

## Conferir e entregar

1. Olhe as peças prontas (folha de contato ou quadros do vídeo): texto dentro da área segura, nada cortado, nada parecendo marca real.
2. Atualize o `.md` da pasta: o que é cada peça, em que ordem postar e a legenda.
3. O conteúdo chega ao painel quando ele é publicado. Diga ao usuário para rodar `/publicar painel`, ou siga os passos de `.claude/skills/publicar/SKILL.md` se ele já pediu para publicar.
4. Avise em poucas linhas o que ficou pronto e onde ver.
5. **Story com link:** a arte deixa um espaço livre para o adesivo (frase "Toque no link…", setinha e área de luz azul, sem texto embaixo: o Instagram não põe o adesivo por cima de texto). Na mensagem de entrega, mande sempre, para cada story com link, o **link** e o **texto do adesivo**, prontos para copiar.
