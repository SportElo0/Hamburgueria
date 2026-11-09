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

## Planos enxutos (31/10/2026)

Base: `reports/Enxugar os planos 2026-10-31.md`; rotina em `marketing/rotina-mensal/`.
- Planos no site: Start R$ 247, Grow R$ 597, Scale "em breve" (sem preço até o piloto). O Grow não promete mais posts nem fotos mensais.
- **Cardápio pela loja:** `/loja/<slug>/cardapio`. O lojista muda nome, descrição e preço; vai direto ao `publicado.json` e ao rascunho, registra "Feita pela loja" (não conta alteração), limite de 60 por hora. Foto, item novo e o resto viram pedido (canal "Painel da loja") na aba Pedidos da equipe.
- **Avaliação no Google:** Configurar → Pedidos pelo site → "Link de avaliação do Google" (só links do Google). Aparece no rastreio do pedido concluído (campo `review`, hoje usado pelo site do El Patron) e na mesa quando pede a conta e quando a conta fecha. Para todos os clientes, sem brinde.
- **Campanha:** 12 modelos em `plataforma/src/lib/campanhas.ts`, escolhidos na aba Clientes (sugere o do mês).
- **Scale:** plano B na tela do salão; `/api/saude` para um monitor gratuito (ex.: UptimeRobot) avisar se o painel cair. O monitor ainda precisa ser criado por vocês.

## Mapa do salão e reservas (31/10/2026)

Detalhes em `plataforma/MESAS.md`. Mapa ao vivo e tempo nas mesas em `/loja/<loja>/mapa`; movimento público em
`/movimento/<loja>`; reservas com sinal em `/reservar/<loja>`. A equipe liga e configura em Configurar → Pedido na mesa.
Reservas com Pix real precisam do token do Mercado Pago da loja.

## Fila de espera, pagar na mesa e PDV Saipos (01/11/2026)

Detalhes em `plataforma/MESAS.md`. Fila pelo QR da porta (`/fila/<loja>`), pagar a conta da mesa pelo Pix (inteira ou
dividida, fecha a mesa sozinha) e envio dos pedidos aceitos ao Saipos. Tudo desligado por padrão em cada loja.
**Pendente:** o Saipos só funciona depois da parceria (eles dão `SAIPOS_PARTNER_ID` e `SAIPOS_SECRET`, que vão nas
variáveis de ambiente da Vercel) e com o código da loja no Saipos.
**Antes de vender o Scale** (revisão legal de 01/11): atualizar `growlift/privacidade.html` e `growlift/termos.html`
(hoje dizem que o Scale não está à venda e não citam Mercado Pago nem Saipos) e pôr no contrato com cada restaurante
a cláusula de operador de dados (quem é controlador, o que vai ao Saipos, Pix direto na conta do restaurante).
Vale uma passada de advogado.

## Agenda automática do Instagram (01/11/2026)

`/painel/conteudos/agenda`: os posts preparados em `growlift-social/agenda.json` aparecem como "Para aprovar"; a equipe aprova e o painel publica sozinho no Instagram na hora marcada (API oficial com login do Instagram). Código em `plataforma/src/lib/instagram.ts`, `agenda.ts`, `link-publico.ts` e `src/app/api/instagram/tick`. Passo a passo para conectar em `growlift-social/07-planejamento/agenda-automatica.md`.
**Pendente (vocês):** gerar o token na Meta e pôr `INSTAGRAM_TOKEN` e `CRON_SECRET` na Vercel, e criar o despertador de 5 minutos no cron-job.org. `PAINEL_URL` já está configurado. O carrossel fixado "Serviços" ainda mostra o plano Lift e não deve ser postado até ser refeito.

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

## Vendas (Growlift Sales Agent, fase 1, 02/11/2026)

`/painel/oportunidades/vendas`: CRM comercial ligado a Oportunidades. Contato com fonte verificável (nunca o Google),
funil, histórico por empresa, rascunhos de e-mail (simulador sem IA por padrão; IA econômica `claude-haiku-5-5` só com
`VENDAS_IA=claude` + `ANTHROPIC_API_KEY`, que não existem), fila de aprovação, lista de bloqueio e página pública
`/descadastro`. **Não envia e-mail nem WhatsApp.** Assinatura: "Equipe Comercial | Growlift". Detalhes em
`plataforma/VENDAS.md`; plano da fase 2 (e-mail pela Umbler, ainda não autorizada) em `plataforma/VENDAS-FASE2.md`.
**No ar em produção desde 02/11/2026** (deploy `dpl_EdHN3ovDkL6DPEy9yTrTtks5vf3S`, commit 70c47b0).

## Prévias só leem (02/11/2026)

As prévias da Vercel usam o banco de produção (`POSTGRES_URL` e chaves do Supabase estão em Preview e Development).
Desde 02/11 o painel inteiro só grava em Production ou local (`plataforma/src/lib/ambiente.ts`); na prévia nada é salvo,
Pix real não abre e uma faixa avisa. `/api/saude` mostra `gravacao: true` (produção) ou `false` (prévia).
Conferido nos ambientes reais em 02/11. Recomendado e ainda pendente (vocês): tirar `POSTGRES_*` e `SUPABASE_*` de
Preview e Development. Detalhes em `plataforma/ISOLAR-AMBIENTES.md`.

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

## Estado em 02/11/2026 (para continuar em outra sessão ou conta)

- Painel em produção: commit 70c47b0 (02/11, Sales Agent fase 1 + trava de prévia). Build com a agenda de 29 posts e 177 imagens e vídeos em Conteúdos.
- Painel: botão "Adicionar à tela inicial" (manifesto + ícones em `plataforma/public/icons`) e telas de carregamento instantâneas (`loading.tsx`); a Agenda carrega o status do Instagram depois dos posts. Último deploy de produção: commit 08919c4.
- Instagram: Reel 11 postou sozinho em 02/11 (cron-job.org chama `/api/instagram/tick` a cada 5 min). Agenda de 02 a 15/11 pronta (carrossel 10h + Reel 15h por dia); posts já aprovados precisam ser cancelados e aprovados de novo para pegar as legendas novas, sem avisos.
- Reels no estilo história: `growlift-social/_fonte/reels/novos/` (ver `growlift-social/05-reels/novo-estilo-historias.md`). Carrosséis: `growlift-social/_fonte/carrosseis.mjs`.
- Ainda abertos: decidir sobre o "responda SAIR" nos directs; limite de hashtags ainda é 30 no painel (o Instagram aceita 5); antes de 16/11, tirar vídeos e imagens do pacote da função (Blob) para não estourar o limite da Vercel Hobby.

## Estado em 05/11/2026: sistema do restaurante (Scale)

Painel em produção: commit e22d999. Tudo testado (314 testes) e publicado; nada pendente no código.

- **Logins por função** (dono, cozinha, garçom), lidos do armazenamento a cada acesso. Logins antigos valem como dono. Detalhes em `plataforma/PAINEL-DONO.md`.
- **Painel do dono** `/loja/<loja>/dono`: Resumo, Preços e custos, Mesas. Outras telas abrem na mesma aba com "← Painel do dono" (no iPad não há como voltar de outra aba).
- **Cadastro de restaurante** na tela de entrar ("Sou restaurante › Sou novo"); a equipe aprova em Painel › Cadastros. Aviso de privacidade em `/cadastro/privacidade`.
- **O dono monta sozinho**: quantas mesas, ocupar/liberar mesa, itens e custos (mesmo sem cardápio no ar), taxa de serviço e couvert.
- **Garçom lança pedido** pelo celular (tela do salão e Mesas do dono); vai direto para a cozinha.
- **Taxa de serviço e couvert** na conta (celular da mesa, salão, Pix da mesa); garçom pode tirar a taxa (fica registrado quem).
- **Bar e cozinha** separados na tela de pedidos (escolha por aparelho) com "Imprimir sozinho" (Chrome com `--kiosk-printing` para não abrir a janela).
- **Fechamento do dia** `/loja/<loja>/fechamento`: Pix, cartão, dinheiro, taxa, couvert, por canal, em aberto.
- **Importar cardápio de foto ou PDF** em Preços e custos (via Claude: pedido pronto → colar resposta → prévia → importar).
- **Dados para o Claude** (Painel › Dados p/ Claude): documento por período, por restaurante ou de todos, para o projeto "Consultor de restaurantes" no Claude (instruções na mesma tela). Sem IA no painel: `ANTHROPIC_API_KEY` não está configurada.
- **Dados de teste** numa loja que nunca foi ao ar (Lojas › loja › Pedidos online › Dados de teste) e demonstração com mesas abertas ("Ver como o dono vê" em Inteligência).
- **Roteiro de visita** ao restaurante em Conteúdos › Planejamento.
- Autorização dos sócios (05/11): publicar sem perguntar a cada vez depois de testar.

Ainda a decidir (dependem de serviço de fora):
- Cartão pelo celular na mesa: Mercado Pago (Checkout); precisa de uma conta de teste do Mercado Pago para testar.
- Nota fiscal (NFC-e): preferir a integração com o PDV do restaurante (Saipos pronto, falta credencial de parceiro) a um emissor próprio.
- Pedidos de aplicativos de entrega: exige cadastro da Growlift como integradora.
- Domínio `painel.growlift.com.br` (falta saber onde o growlift.com.br está registrado).

## Prato em 3D no tamanho real (05/11/2026)

No cardápio da mesa (QR), o prato com 3D ganha um selo **3D**. O cliente toca, vê o prato girando com a medida e, em "Ver na minha mesa", abre a câmera (iPhone: Quick Look; Android: Scene Viewer ou WebXR) com o tamanho travado (`ar-scale="fixed"`). Só na mesa; a API dos sites não recebe o 3D.

- **Quem envia:** só a equipe (Painel › Lojas › loja › Cardápio › item › Prato em 3D). O navegador reduz o escaneamento (menos de 150 mil triângulos, imagens de no máximo 1024 px em JPEG). O servidor confere o GLB e o **reescala para a largura medida com régua**: as medidas guardadas saem do arquivo, nunca digitadas. Também guarda quem enviou, quando e quem mediu (Growlift ou dono por vídeo).
- **Código:** `plataforma/src/lib/modelo3d.ts` (escala, medidas), `modelo3d-navegador.ts` (redução), `components/mesa/Prato3D.tsx` (visualizador, `@google/model-viewer` carregado sob demanda), `components/editor/Modelo3dField.tsx`, ação `ver3d` na rota da mesa (contagem mensal por prato, sem dado pessoal; aparece no painel do item).
- **Guia:** `growlift-social/07-planejamento/prato-3d.md` (como escanear, roteiro de vídeo para o dono, testes no iPhone e no Android, o que dizer na venda). Termo de piloto ganhou a cláusula 11 (3D).
- **Teste:** `node plataforma/scripts/prato-teste-3d.mjs saida.glb` gera um hambúrguer de teste (não é prato real; nunca em loja de verdade).
- **Falta:** escanear um prato de verdade com o iPhone Pro (13 Pro ou 16 Pro Max) e testar a câmera no iPhone e no Android. Arquivos 3D trocados ou removidos ficam no armazenamento (não são apagados).

## Apresentação do Scale e série Casa Cheia (05/11/2026)

- **Apresentação do plano Scale** (24 slides, fundo claro, com animações): https://claude.ai/artifact/Lf867V7uadSyimr3o7sv6C (privada; para mostrar a alguém, compartilhar pelo menu Share). Baixa em PDF ou PowerPoint. Revisada pelo `revisor-legal` e corrigida. Preço decidido em 05/11: **R$ 997/mês + implantação R$ 1.500**; o site saiu do Scale e virou condição de fechamento (falada pessoalmente, fora da apresentação; detalhes em `growlift-social/07-planejamento/lancamento-scale.md`). **Falta preencher** os meses de contrato, a data da condição e o que acontece com domínio e hospedagem depois de 12 meses e só usar com preço depois do piloto e do site mudar. O 3D aparece como "em teste".
- **Série de Reels "Casa Cheia"** (Reels 17 a 20): restaurante e personagens inventados (Rosa, Mel, Beto, Seu Juca, Dona Cida), um nome difícil por episódio (CMV, engenharia de cardápio, CRM, fechamento do mês). Roteiros, legendas, respostas do direct (MARGEM, CLIENTE, RELATÓRIO) e próximos 6 episódios em `growlift-social/05-reels/casa-cheia.md`. Fonte: `growlift-social/_fonte/reels/novos/reel17.mjs` a `reel20.mjs` e o elenco em `elenco.mjs`. As palavras novas precisam ser cadastradas no ManyChat.
- O ambiente da sessão ganhou o host `d8j0ntlcm91z4.cloudfront.net` (arquivos do Higgsfield) para baixar as narrações.

## Lumivale Energia Solar, site conceito (09/11/2026)

- Site one-page de uma instaladora de energia solar **fictícia** para o portfólio: https://lumivale-conceito.vercel.app (aberto, `noindex`). Projeto Vercel `prj_fNpaVGA4Mg240asPTrD0gbHjCgzK`, pasta `lumivale/` (HTML, CSS e JS puros; GSAP 3.12.5, ScrollTrigger, MotionPathPlugin e Lenis guardados em `lumivale/vendor/`).
- Imagens geradas no Higgsfield (9,25 créditos). Números com etiqueta "exemplo", depoimentos "ilustrativos", WhatsApp fictício (`CONFIG.whatsapp` em `main.js`). Revisado pelo `revisor-legal`; o título da capa e a chamada final ("conta de luz menor", "deixar o sol pagar a conta") ficaram como pedido no briefing, e o README avisa que num site real viram estimativa.

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

- **Só português do Brasil (05/11):** nada de Reel com voz ou palavras de Portugal. Ouvir uma amostra da voz antes de narrar; na dúvida, gravar com a voz de um dos sócios.

- Não inventar dados do negócio; não afirmar resultado sem testar.
- Não criar PR sem pedido. Commits terminam com as linhas de coautoria do Claude.
- Não usar as senhas pessoais dos usuários para entrar no painel.
- Campanhas só para quem marcou o aceite; nada de "sorteio" falso.
