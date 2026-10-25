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
- **Nada é publicado** no Instagram nem no WhatsApp: vocês entregam a peça, quem aprova e posta são eles.

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
