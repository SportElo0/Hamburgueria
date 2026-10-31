# Passagem de bastão

Resumo do que existe neste repositório, onde está no ar e o que ficou pendente.
Escrito para continuar o trabalho em outra conta ou sessão do Claude sem depender
do histórico da conversa. As regras do projeto ficam em `CLAUDE.md`; publicar: skill `/publicar`.

Branch de trabalho: `claude/downtown-burger-site` (tudo está nela; `master` está atrás).

## Projetos

| Pasta | O que é | No ar |
| --- | --- | --- |
| `src/` (raiz) | Site do Downtown Burger (Next.js, exportação estática) | https://downtown-burger-gilt.vercel.app/ |
| `elpatron/` | Site do El Patron Burger (Osasco), preto e dourado, história em 3D, pedidos próprios | https://el-patron-burger.vercel.app/ |
| `plataforma/` | Painel das lojas: cardápio, pedidos online, tela da loja, relatório, clientes e campanhas | https://painel-lojas-sportelo.vercel.app/ |
| `pousada/` | Site da Pousada Villa Verano (aguarda nova referência do cliente para o redesenho) | ver no Vercel |
| `growlift/` | Site da Growlift (HTML estático), no ar desde 26/10/2026 | https://growlift.com.br (DNS no Registro.br: endereço do site = `216.198.79.1`) |
| `growlift-social/` | Instagram e WhatsApp da Growlift: imagens, 9 Reels em vídeo, legendas | aba Conteúdos do painel |
| `bacchi/` | Site novo e catálogo digital da Bacchi (clips, desde 1937): catálogo das 13 linhas, cotação, representantes. Versão de teste com faixa "não é o site oficial" e fora do Google; o site atual da Bacchi não foi mexido. Ver `bacchi/README.md` | https://bacchi-teste.vercel.app |
| `marketing/` | Apresentações e propostas da Growlift (HTML + PDF) e posts | — |
| `tools/`, `elpatron/tools/` | Estúdio 3D dos burgers (three.js) e tratamento de fotos | — |

Vercel (time `team_YoPHQ4Hb11W9RPG1cwvdMC3G`):
- painel: projeto `prj_RtyR3H3YbwXdXkv9s08IhAQszQvK`
- El Patron: projeto `prj_XMxV4MsDwttCRq96OWsYhcM0AtQc` (diretório raiz `elpatron`)
- Growlift: projeto `prj_6Bem4OwJHw2dAY96xpcLyZCbUbZt`
- Downtown: projeto `prj_nyFCGwrqD9IQayLYrweIi5Rg6JEz`
- Bacchi (teste): projeto `prj_UVUjMXxWuY4y3p8k0hGGgWhsuPJm` (diretório raiz `bacchi`; publicar com `create_deployment` target production e o sha)
- publicação: deploy a partir do GitHub `SportElo0/Hamburgueria`, branch `claude/downtown-burger-site`.

Os segredos (SESSION_SECRET, ADMIN_USERS, POSTGRES_URL do Supabase) ficam nas variáveis de
ambiente dos projetos no Vercel, não no repositório.

## Onde o painel guarda os dados

- Banco Postgres no Supabase (`POSTGRES_URL`, posta pela integração Supabase da Vercel), uma tabela só:
  `painel.documentos` (chave, dados JSON ou arquivo, etag). O schema `painel` fica fora da API pública do
  Supabase, com RLS ligado e sem acesso para `anon`/`authenticated`. A tabela se cria sozinha no primeiro acesso.
- Antes era o Vercel Blob, que foi suspenso em 10/2026 por passar da cota grátis (cada leitura conta).
  Enquanto `BLOB_READ_WRITE_TOKEN` e `POSTGRES_URL` existirem juntos e a cópia não tiver terminado, a página
  `/painel` mostra "Copiar dados": copia tudo do Blob para o banco, nunca sobrescreve, pode clicar de novo.
  Depois que terminar, apagar `BLOB_READ_WRITE_TOKEN` da Vercel.
- `POSTGRES_URL` só no ambiente Production (preview não pode mexer nos dados reais).
- Local e testes: arquivos em `.data/`. Testar no Postgres: `TEST_POSTGRES_URL='postgres://…?sslmode=disable' npm test`.
- Pendente: verificar o certificado do Supabase (hoje TLS sem checar o certificado, `ssl: 'require'`).

## Sistema de pedidos (substituto do MenuDino)

- Site: checkout com entrega/retirada, taxa por bairro, Pix (demonstração ou Mercado Pago),
  cartão/dinheiro na entrega, cupom, aceite de promoções, acompanhamento do pedido.
- Painel → Pedidos online (equipe): ligar pedidos, abrir/fechar loja, bairros e taxas,
  pagamento, token do Mercado Pago, cupons (%, R$, entrega grátis), logins da loja.
- Tela da loja `/loja/<slug>`: alerta sonoro, aceitar/recusar/despachar, imprimir 80 mm,
  esgotados num toque, aviso pronto no WhatsApp, relatório (`/relatorio`), clientes e
  campanhas (`/clientes`).
- Regras de código em `plataforma/src/lib/ordering.ts` (puro) e `orders.ts`, `customers.ts`.
- Testes: `cd plataforma && npx vitest run` (95 testes). Ponta a ponta local:
  `plataforma/scripts/e2e/README.md`.

## Conteúdos da Growlift no painel

- `/painel/conteudos` mostra `growlift-social/`: imagens em galeria (abrir, baixar, .zip por grupo), `.md` com botão de copiar, e a situação de cada peça (Para aprovar, Aprovado, Postado), guardada no banco em `conteudos/status.json`.
- O build do painel roda `scripts/conteudos.mjs`, que copia `../growlift-social` para `conteudos-gerados/` (fora do git) com miniaturas WebP. Só arquivos listados no manifesto podem ser lidos.
- **Todo conteúdo novo** (story, carrossel, roteiro, legenda, prompt) vai em `growlift-social/NN-pasta/`; depois commit, push e novo deploy do painel. Se for uma pasta nova, dar nome e descrição em `FOLDERS`, no script.

## Lista de ofertas pelo site (plano Grow)

O site do cliente manda o cadastro para o painel; aparece em `/loja/<slug>/clientes` junto com quem pediu pelo site.

```js
fetch('https://painel-lojas-sportelo.vercel.app/api/public/lojas/<slug>/ofertas', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, phone, consent: true /* caixinha marcada pela pessoa */, website: '' /* campo isca */ }),
});
```
Texto da caixinha: "Quero receber ofertas da <loja> no WhatsApp (no máximo uma mensagem por mês; para sair, responda SAIR)." Nunca pré-marcada.

## Pedidos de diagnóstico (site da Growlift)

`growlift/` posta em `/api/public/diagnosticos`; a lista fica em `/painel/diagnosticos`. Limite: 300 por dia e 5 por endereço por dia.

## Oportunidades (Growlift Lead Finder)

`/painel/oportunidades`: pesquisa negócios por cidade, bairro e segmento na Places API (New) do Google, classifica a presença digital e exporta CSV. Tudo em `plataforma/LEAD-FINDER.md`.
- Precisa da variável `GOOGLE_MAPS_API_KEY` na Vercel. A chave é criada pelo Lucas, em projeto próprio no Google Cloud, com cotas e alerta de gasto.
- Toda pesquisa mostra o custo e pede aprovação. O painel limita as chamadas por mês (padrão 200 buscas e 300 consultas), abaixo da parte grátis do Google.
- Guarda só o place ID e as conclusões da equipe; nome, endereço, telefone e site do Google não são guardados nem exportados (termos do Google).
- Não envia mensagem. "Sem website" só é confirmado depois de 2 fontes públicas conferidas à mão.

## Inteligência (Growlift Intelligence, fase 1)

`/painel/inteligencia`: custos por item, margem de contribuição, matriz do cardápio e recomendações por regras, com a decisão
registrada pela equipe. Sem IA: todos os números são calculados pelo painel, em centavos. Detalhes em `plataforma/INTELIGENCIA.md`.
- Só a equipe vê. A loja `demo-inteligencia` tem dados fictícios e o painel recusa publicá-la.
- Usa só os pedidos que chegam pelo site da loja (não vê iFood, balcão nem telefone).
- Plano Scale (R$ 897) e Inteligência continuam **proposta**: não anunciar antes de testar com um restaurante-piloto.

## Propostas

- `marketing/apresentacao/deck-restaurantes.html` → `Growlift-Apresentacao-Restaurantes.pdf`
  (planos Site Cardápio R$ 247 e Pedidos Próprios R$ 597; marketing Presença +R$ 150 e Crescimento +R$ 650).
- `marketing/apresentacao/deck-el-patron.html` → `Growlift-Proposta-El-Patron.pdf`
  (15 slides; Combo Chefão R$ 497/mês, de R$ 747; site R$ 997 e implantação R$ 1.497 grátis com
  fidelidade de 12 meses; Clube do Chefão com no máximo uma campanha por mês).
- Gerar PDF: `node marketing/apresentacao/render.mjs <html absoluto> <pdf> <pasta>`.
- Evitar texto com degradê (background-clip) nos títulos: o leitor de PDF do iPad mostra blocos.

## Pendências

El Patron (aguardando o dono):
- endereço, horário, se faz entrega e retirada, Instagram, grafia de "Gúzman";
- bairros atendidos e taxa de cada um (hoje sem bairros: taxa "a combinar");
- conta do Mercado Pago para o Pix real (hoje em modo demonstração; Pix real nunca testado com dinheiro);
- qual PDV usam (provavelmente Consumer) e se têm impressora na cozinha.
- Objeção provável: o MenuDino é ligado ao PDV deles; o nosso pedido não entra no PDV,
  só na tela da loja e na impressão.

Reel premium "Sua marca merece mais." (`growlift-social/05-reels/09-…`, fonte em `growlift-social/_fonte/reel-premium/v2/`):
- Pronto e revisado pelo `revisor-legal`, com as correções em `v2/audit.md`, aguardando a aprovação dos sócios. Pendências deles: busca dos nomes no INPI, "ok" por escrito dos quatro donos (recomendado), rótulo de IA e música comercial ao postar.
- O repositório no GitHub é **público** e os commits antigos têm a foto do dono da Swell Club. Recomendação: deixar o repositório privado. Vai para o painel no próximo `/publicar painel` (as miniaturas da aba Conteúdos passaram para 960 px).
- Os quatro projetos aparecem com nome fictício (Salinho, Chapa 77, Swell Club, Fornada). Para usar os nomes reais é preciso autorização por escrito de cada negócio.
- A foto do dono da Swell Club nunca entra: a captura troca por um surfista gerado por IA (`swapPhotos`). A prévia v1 (`_fonte/reel-premium/styleframes/`) ainda tem a foto do dono e não deve ser usada.

Bacchi (`bacchi/README.md`, aguardando a Bacchi):
- aprovar as frases de destaque copiadas do site atual ("a mais antiga", "homologados", "escolhida por todos"), o WhatsApp (11) 95089-2731 e o e-mail do PDF;
- conta no Resend e e-mail que recebe as cotações (sem isso o site manda pelo WhatsApp/e-mail, sem fingir envio);
- revisões de segurança e legal feitas em 28/10 para a versão de teste; para a versão final faltam autorização por escrito da Bacchi, CNPJ, política de privacidade e conferência dos representantes (lista no README).

Outros:
- Pousada Villa Verano: redesenho aguarda referência nova; WhatsApp (5511999887127) e nota não confirmados.
- Growlift: WhatsApp e e-mail ainda "[preencher]" nas apresentações.
- Propostas antigas em Claude Docs ainda com preços antigos.
- A correção da gaveta da sacola (`overflow-clip`) no Downtown só vai ao ar no próximo deploy dele.
- Impeccable 4.6.0 instalado (há 4.7.0); o MCP do Playwright (`.mcp.json`) pede aprovação em sessão nova.

## Regras combinadas

- Não inventar dados do negócio; não afirmar resultado sem testar.
- Não criar PR sem pedido. Commits terminam com as linhas de coautoria do Claude.
- Não usar as senhas pessoais dos usuários para entrar no painel.
- Campanhas só para quem marcou o aceite; nada de "sorteio" falso.
