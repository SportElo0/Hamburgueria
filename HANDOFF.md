# Passagem de bastão

Resumo do que existe neste repositório, onde está no ar e o que ficou pendente.
Escrito para continuar o trabalho em outra conta ou sessão do Claude sem depender
do histórico da conversa.

Branch de trabalho: `claude/downtown-burger-site` (tudo está nela; `master` está atrás).

## Projetos

| Pasta | O que é | No ar |
| --- | --- | --- |
| `src/` (raiz) | Site do Downtown Burger (Next.js, exportação estática) | https://downtown-burger-gilt.vercel.app/ |
| `elpatron/` | Site do El Patron Burger (Osasco), preto e dourado, história em 3D, pedidos próprios | https://el-patron-burger.vercel.app/ |
| `plataforma/` | Painel das lojas: cardápio, pedidos online, tela da loja, relatório, clientes e campanhas | https://painel-lojas-sportelo.vercel.app/ |
| `pousada/` | Site da Pousada Villa Verano (aguarda nova referência do cliente para o redesenho) | ver no Vercel |
| `marketing/` | Apresentações e propostas da Growlift (HTML + PDF) e posts | — |
| `tools/`, `elpatron/tools/` | Estúdio 3D dos burgers (three.js) e tratamento de fotos | — |

Vercel (time `team_YoPHQ4Hb11W9RPG1cwvdMC3G`):
- painel: projeto `prj_RtyR3H3YbwXdXkv9s08IhAQszQvK`
- El Patron: projeto `prj_XMxV4MsDwttCRq96OWsYhcM0AtQc` (diretório raiz `elpatron`)
- publicação: deploy a partir do GitHub `SportElo0/Hamburgueria`, branch `claude/downtown-burger-site`.

Os segredos (SESSION_SECRET, ADMIN_USERS, token do Vercel Blob) ficam nas variáveis de
ambiente dos projetos no Vercel, não no repositório.

## Sistema de pedidos (substituto do MenuDino)

- Site: checkout com entrega/retirada, taxa por bairro, Pix (demonstração ou Mercado Pago),
  cartão/dinheiro na entrega, cupom, aceite de promoções, acompanhamento do pedido.
- Painel → Pedidos online (equipe): ligar pedidos, abrir/fechar loja, bairros e taxas,
  pagamento, token do Mercado Pago, cupons (%, R$, entrega grátis), logins da loja.
- Tela da loja `/loja/<slug>`: alerta sonoro, aceitar/recusar/despachar, imprimir 80 mm,
  esgotados num toque, aviso pronto no WhatsApp, relatório (`/relatorio`), clientes e
  campanhas (`/clientes`).
- Regras de código em `plataforma/src/lib/ordering.ts` (puro) e `orders.ts`, `customers.ts`.
- Testes: `cd plataforma && npx vitest run` (62 testes). Ponta a ponta local:
  `plataforma/scripts/e2e/README.md`.

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
