@AGENTS.md

# Growlift: regras deste repositório

Agência de sites da Growlift (Lucas e Antônio, São Paulo). Respostas para eles em português simples e direto.
Detalhes de cada projeto, onde está no ar e o que ficou pendente: `HANDOFF.md`.

## Projetos e publicação

| Pasta | O que é | Onde publica |
| --- | --- | --- |
| `growlift/` | Site da Growlift (HTML estático) | Vercel `prj_6Bem4OwJHw2dAY96xpcLyZCbUbZt` (domínio growlift.com.br) |
| `plataforma/` | Painel das lojas (Next.js) + aba Conteúdos | Vercel `prj_RtyR3H3YbwXdXkv9s08IhAQszQvK` |
| `elpatron/` | Site do El Patron | Vercel `prj_XMxV4MsDwttCRq96OWsYhcM0AtQc` |
| `src/` (raiz) | Site do Downtown Burger | Vercel `prj_nyFCGwrqD9IQayLYrweIi5Rg6JEz` |
| `pousada/` | Pousada Villa Verano | Vercel (`pousada-villa-verano` ou `villa-verano`: confirme no projeto antes) |
| `bacchi/` | Site e catálogo da Bacchi (Next.js) | ainda não publicado (ver `bacchi/README.md`) |
| `growlift-social/` | Instagram e WhatsApp da Growlift (imagens, Reels, textos) | aparece no painel, aba Conteúdos |

- Time da Vercel: `team_YoPHQ4Hb11W9RPG1cwvdMC3G`. Deploy a partir do GitHub `SportElo0/Hamburgueria`, branch `claude/downtown-burger-site`.
- Para publicar, use a skill `/publicar`. Conteúdo novo de redes sociais: skill `novo-conteudo`.
- Não abrir pull request sem pedido.

## Checagens antes de publicar

- Raiz e `plataforma/`: `npm test`, `npm run typecheck`, `npm run lint` (na pasta do app que mudou).
- `growlift/`: abrir no navegador (Playwright) em celular e computador; não há build.
- `plataforma/`: `npm run build` roda antes `scripts/conteudos.mjs`, que copia `../growlift-social` para o painel.

## Regras do negócio (não negociáveis)

- **Nada inventado:** nenhum cliente, depoimento, número de vendas, resultado ou prazo que não esteja confirmado no site, no contrato ou por eles.
- **Marcas de terceiros:** sites feitos para negócios reais (El Patron, Downtown etc.) não aparecem em material público sem autorização por escrito. Modelos de portfólio são fictícios e marcados "Projeto conceito".
- **CPF nunca é salvo** em arquivo, commit ou documento (o hook `.claude/hooks/proteger.mjs` bloqueia).
- **Senhas:** nunca usar senha pessoal deles; segredos ficam nas variáveis de ambiente da Vercel, nunca no repositório nem impressos na conversa.
- **Artes com link (stories):** deixar na arte um espaço livre para o adesivo de link (sem texto embaixo, o Instagram não sobrepõe texto) e, ao entregar, mandar sempre na mensagem o link e o texto do adesivo de cada uma.
- **Instagram e WhatsApp:** nada é publicado sem aprovação. Sem envio em massa, sem robô fingindo ser pessoa, sem sorteio falso. Campanhas só para quem aceitou, no máximo uma por mês, com opção SAIR. Nada de vender ou cobrar sozinho pelo WhatsApp.
- **Imagem de pessoas:** só de quem autorizou. O Antônio é menor de idade; a foto dele está autorizada pela mãe por e-mail.
- **Lead Finder (aba Oportunidades):** nunca guardar nem exportar nome, endereço, telefone ou site vindos do Google (só o place ID); nenhuma pesquisa paga sem mostrar o custo e ter aprovação. Detalhes em `plataforma/LEAD-FINDER.md`.
- **Higgsfield:** conferir o custo (`get_cost`) antes de gerar; não gastar crédito à toa. O que der para fazer em código (HTML, Playwright, ffmpeg) não vai para o Higgsfield.
- **Revisões:** antes de publicar algo com login, pagamento ou dados pessoais, rode o subagente `revisor-seguranca`; antes de publicar oferta, campanha ou site de cliente, o `revisor-legal`.
