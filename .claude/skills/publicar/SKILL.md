---
name: publicar
description: Publica um dos projetos deste repositório (growlift, painel, elpatron, downtown, pousada) na Vercel, com as checagens, o commit, o push e a confirmação do deploy. Use só quando o usuário pedir /publicar.
disable-model-invocation: true
argument-hint: "[growlift | painel | elpatron | downtown | pousada]"
---

# Publicar

Publica o projeto pedido em `$ARGUMENTS`. Se não vier nenhum, pergunte qual.

| Projeto | Pasta | Projeto na Vercel |
| --- | --- | --- |
| growlift | `growlift/` | `prj_6Bem4OwJHw2dAY96xpcLyZCbUbZt` |
| painel | `plataforma/` (inclui a aba Conteúdos, que lê `growlift-social/`) | `prj_RtyR3H3YbwXdXkv9s08IhAQszQvK` |
| elpatron | `elpatron/` | `prj_XMxV4MsDwttCRq96OWsYhcM0AtQc` |
| downtown | raiz (`src/`) | `prj_nyFCGwrqD9IQayLYrweIi5Rg6JEz` |
| pousada | `pousada/` | há dois projetos (`pousada-villa-verano` e `villa-verano`): confirme com o usuário qual está em uso antes do primeiro deploy |

Time: `team_YoPHQ4Hb11W9RPG1cwvdMC3G`. Repositório `SportElo0/Hamburgueria`, branch `claude/downtown-burger-site`.

## Passos

1. **Ver o que mudou:** `git status` e `git diff --stat`. Confirme que tudo pertence ao projeto pedido; se houver mudança de outro projeto, pergunte antes de incluir.
2. **Checar**, na pasta do projeto:
   - Next.js (painel, elpatron, downtown, pousada): `npm test` (se existir), `npm run typecheck` (ou `npx tsc --noEmit`), `npm run lint`, `npm run build`.
   - growlift: abrir as páginas alteradas com o Playwright em 390 px e 1366 px, sem rolagem lateral e sem erro no console.
   - Se algo falhar, pare, mostre o erro e corrija antes de seguir. Nunca pule teste para publicar.
3. **Revisões quando couber:** mudança em login, sessão, pagamento, Pix ou dados pessoais → subagente `revisor-seguranca`. Mudança em preço, oferta, plano, campanha ou texto de venda → `revisor-legal`. Resolva o que eles apontarem como bloqueante.
4. **Commit** com mensagem em português dizendo o que mudou e por quê, terminando com as linhas de atribuição que a sessão indicar.
5. **Push:** `git push -u origin claude/downtown-burger-site` (repetir até 4 vezes, com espera crescente, só se falhar por rede).
6. **Deploy** com o MCP da Vercel (`create_deployment`):
   ```json
   { "teamId": "team_YoPHQ4Hb11W9RPG1cwvdMC3G",
     "requestBody": { "name": "<nome do projeto>", "project": "<id da tabela>", "target": "production",
       "gitSource": { "type": "github", "org": "SportElo0", "repo": "Hamburgueria",
                      "ref": "claude/downtown-burger-site", "sha": "<git rev-parse HEAD>" } } }
   ```
7. **Confirmar:** consulte o deploy até `READY` (QUEUED e BUILDING só pedem espera). Se der `ERROR`, leia o log (`list_deployment_events`) e corrija. No painel, confirme no log a linha `conteudos: …` com o número de imagens e vídeos.
8. **Avisar** o usuário em poucas linhas: o que foi publicado, o endereço, e o que não deu para conferir (por exemplo, páginas que pedem login).

## Nunca

- Publicar com teste, tipo ou lint falhando.
- Imprimir segredos ou variáveis de ambiente.
- Abrir pull request sem pedido.
- Colocar `noindex` de volta no site da Growlift (ele está no ar em growlift.com.br e deve aparecer no Google).
