# Diagnóstico automático e resumo das 6h30

Quando alguém pede o diagnóstico grátis pelo site, o painel abre **uma vez** a página inicial do site que a pessoa
escreveu (o mesmo verificador seguro do Lead Finder: nunca abre endereço interno, limite de tamanho e de tempo) e
guarda uma lista do que melhorar: cadeado (HTTPS), versão para celular, velocidade, título e descrição para o Google,
cardápio (em PDF ou ausente), preços, botão de WhatsApp, mapa, horário, dados estruturados e link do Instagram.
Sem IA e sem API paga. Quem não tem site (ou só tem Instagram) aparece como "Não tem site: fazer a prévia".

- A análise aparece em **Painel → Pedidos de diagnóstico**.
- **Todo dia às 6h30** (horário de São Paulo), se chegou pedido novo desde o último resumo, sai **uma** mensagem no
  Telegram da equipe: nome do negócio, ramo, cidade, site e o que melhorar. Sem telefone e sem o texto livre do
  cliente (esses ficam só no painel). Sem pedido novo, não sai nada.
- Quem dispara é o mesmo pinger de 5 em 5 minutos da Agenda (`/api/instagram/tick`); se ele parar, o cron diário da
  Vercel (9h17) manda o resumo atrasado.

## Configurar o Telegram (uma vez, feito por vocês; nunca colar o token no chat)

1. No Telegram, falar com **@BotFather** → `/newbot` → escolher nome e usuário. Ele devolve o **token**.
2. Mandar qualquer mensagem para o bot novo (de quem vai receber; ou criar um grupo e adicionar o bot).
3. Abrir no navegador `https://api.telegram.org/bot<TOKEN>/getUpdates` e copiar o número de `"chat":{"id": ...}`.
4. Na Vercel (projeto do painel → Settings → Environment Variables), só em **Production**:
   `TELEGRAM_BOT_TOKEN` = o token e `TELEGRAM_CHAT_ID` = o número. Vale a partir do próximo deploy.

Código: `src/lib/diagnostico-auto.ts`; testes: `test/diagnostico-auto.test.ts`. Revisão de segurança feita em 03/11
(ajustes aplicados: sem texto livre no Telegram; mensagem cortada por pedido inteiro).

## Bolinha vermelha de diagnósticos novos (08/11/2026)

- O menu do painel mostra "Diagnósticos" com uma bolinha vermelha e o número de pedidos ainda em **Novo, sem resposta**. O número também aparece no título da aba e é conferido a cada 1 minuto (`/api/painel/diagnosticos-novos`, só equipe).
- **Sai da contagem quando:**
  - alguém toca no botão do WhatsApp do pedido (ele passa para "Conversando / montando o plano", e o WhatsApp abre com uma mensagem inicial pronta);
  - ou alguém muda a situação.
- **Índice:** `diagnosticos/novos.json` guarda só os ids em "novo" (últimos 60 dias). Se sumir ou falhar, é refeito a partir dos pedidos. Código: `countNewDiagnoses` em `src/lib/diagnostics.ts`; testes em `test/diagnostics.test.ts`.
