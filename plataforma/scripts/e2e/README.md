# Testes de ponta a ponta e capturas (local)

Scripts usados para testar o fluxo de pedidos e gerar as capturas das apresentações.
Rodam contra o painel e o site do El Patron na própria máquina, com dados de teste
(as senhas abaixo só existem nesses dados locais).

## Subir o ambiente

```sh
# 1. Dados de teste: El Patron publicado, pedidos ligados, loja aberta, cupons e login da loja
node plataforma/scripts/e2e/e2e-seed.mjs /tmp/dados plataforma/seed/el-patron-burger.json
# opcional: 29 dias de vendas de demonstração (relatório e clientes)
node plataforma/scripts/e2e/demo-history.mjs /tmp/dados

# 2. Login da equipe de teste (equipe@teste.local / equipe-teste-123)
node -e "const c=require('crypto');const s=c.randomBytes(16);const h=c.pbkdf2Sync('equipe-teste-123',s,210000,32,'sha256');console.log(JSON.stringify([{email:'equipe@teste.local',name:'Equipe Teste',hash:'pbkdf2.210000.'+s.toString('base64url')+'.'+h.toString('base64url')}]))" > /tmp/equipe.json

# 3. Painel
cd plataforma && npx next build && ADMIN_USERS="$(cat /tmp/equipe.json)" PLATAFORMA_DATA_DIR=/tmp/dados npx next start -p 3100

# 4. Site do El Patron apontando para o painel local
cd elpatron && NEXT_PUBLIC_CATALOG_URL=http://localhost:3100/api/public/lojas/el-patron-burger npx next build && npx serve -l 4313 out
```

Login da loja nos dados de teste: `caixa@teste.local` / `teste-1234-loja`.

## Scripts

| Script | O que faz |
| --- | --- |
| `e2e-extras.mjs <pasta>` | Cupom no checkout, esgotado, aviso no WhatsApp, relatório e cupons da equipe |
| `clube-e2e.mjs <pasta>` | Aceite de promoções, cupom de entrega grátis, página Clientes, contatos .vcf e descadastro |
| `deck3-shots.mjs <pasta>` | Capturas da proposta do El Patron (site, Pix, tela da loja, esgotados, relatório) |
| `clientes-shot.mjs <pasta>` | Captura da página de campanhas |

Os scripts importam o Playwright de `/opt/node22/lib/node_modules/playwright` e usam o
Chromium em `/opt/pw-browsers/chromium` (ambiente do Claude Code na nuvem). Em outra
máquina, troque esses dois caminhos.

A apresentação vira PDF com `node marketing/apresentacao/render.mjs <html absoluto> <pdf> <pasta de imagens>`.
