# Growlift Comercial

Plataforma própria da Growlift para empresas de serviços: recebe pedidos de orçamento, atende interessados (com assistente virtual e pessoas) e acompanha as negociações. O primeiro segmento configurado é energia solar.

O objetivo é melhorar o atendimento e o acompanhamento da procura que a empresa já tem. A plataforma não promete clientes, vendas nem posição no Google.

**Estado: demonstração no ar em https://growlift-comercial.vercel.app, com empresas fictícias. A IA, o WhatsApp oficial e a telefonia rodam em simulação até o primeiro cliente; antes de atender gente de verdade, siga os passos do fim deste arquivo.**

## O que existe

| Parte | Onde |
| --- | --- |
| Site da empresa com formulário, chat e privacidade | `/s/<endereço>` |
| Formulário para colocar em um site que já existe | `/incorporar/<chave>` |
| Painel: visão geral, oportunidades (quadro em que os cartões arrastam entre etapas, ou "Mover para" no celular; e lista), atendimento, tarefas, conhecimento, configurações | `/painel` |
| Administração Growlift (cadastro de empresas, saúde das integrações) | `/admin` |
| Convite de avaliação | `/avaliar/<token>` |

Perfis: **administrador Growlift** (cadastra empresas; só vê dados de uma empresa entrando com motivo, por 1 hora, com registro no histórico dela), **administrador da empresa** e **vendedor**.

## Escolhas técnicas (em poucas linhas)

- **Next.js 16 + TypeScript**, um só aplicativo (monólito): é a mesma base dos outros projetos deste repositório.
- **PostgreSQL**: toda tabela de negócio tem `empresa_id`, e as chaves estrangeiras compostas impedem, no próprio banco, que um registro aponte para outra empresa.
- **Better Auth** para login, sessão e redefinição de senha (biblioteca mantida; nada de criptografia própria). Contas só nascem por convite.
- **Fila de trabalhos no próprio banco** + um worker simples (`npm run worker`). Sem filas pagas, sem microsserviços.
- **Adaptadores** para IA e WhatsApp, cada um com um simulador que segue a mesma interface.
- Pasta separada do `plataforma/` (painel dos restaurantes), que é outro produto e usa outro tipo de armazenamento.

## Rodar no seu computador

Precisa de Node 22 e PostgreSQL 16 (instalado direto ou via Docker: `docker run -d --name growlift-pg -e POSTGRES_USER=growlift -e POSTGRES_PASSWORD=growlift -e POSTGRES_DB=growlift_dev -p 5432:5432 -v growlift-pg:/var/lib/postgresql/data postgres:16`). Os testes usam um segundo banco, `growlift_test`.

```
cd comercial
npm install
cp .env.example .env.local      # preencha BETTER_AUTH_SECRET e CHAVE_CREDENCIAIS (openssl rand -base64 32)
npm run migrar                  # cria as tabelas
npm run demo                    # dados fictícios de duas empresas
npm run dev                     # aplicação em http://localhost:3100 (as automações já rodam junto)
```

A fila das automações roda dentro da própria aplicação. O `npm run worker` continua existindo para quem quiser um processo separado em produção (aí use `FILA_EMBUTIDA=0` na aplicação); os dois podem rodar juntos sem repetir nada.

| Comando | O que faz |
| --- | --- |
| `npm test` | 134 testes (incluindo o adaptador real da IA e o envio de e-mail contra servidores falsos locais) de serviço contra o banco de teste |
| `node test/navegador/fluxo.mjs` | percurso principal no navegador, em tela de celular (com `npm run build && npm run start` e os dados de demonstração) |
| `npm run typecheck` / `npm run lint` | conferências de código |
| `npm run reiniciar-banco` | apaga tudo e recria com os dados de demonstração (recusado em produção) |

Logins de demonstração (senha `demonstracao-2026`, tudo fictício): `equipe@growlift.demo`, `admin@lumivale.demo`, `vendas@lumivale.demo`, `admin@soldovale.demo`, `vendas@soldovale.demo`.

## Publicar na Vercel (demonstração)

Projeto `growlift-comercial` (time da Growlift), protegido: só quem tem acesso à conta Vercel abre. Banco: projeto Supabase `growlift-comercial` (plano gratuito), separado do banco do painel dos restaurantes.

1. Na Vercel, ligar o banco Supabase `growlift-comercial` ao projeto `growlift-comercial` (Storage › growlift-comercial › Connect Project). Isso cria `POSTGRES_URL`, `SUPABASE_JWT_SECRET` e outras variáveis, sem ninguém copiar senha.
2. Publicar. O build cria as tabelas e os dados de demonstração.

Sem `BETTER_AUTH_SECRET`, `CHAVE_CREDENCIAIS` e `CRON_SECRET`, as três são derivadas de `SUPABASE_JWT_SECRET` (uma chave diferente para cada uso). Para cliente real, defina as três e também `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY`, só nas variáveis da Vercel (nunca no repositório). Trocar `BETTER_AUTH_SECRET` tira todos do login; trocar `CHAVE_CREDENCIAIS` obriga a salvar de novo os tokens de WhatsApp; trocar as VAPID obriga cada pessoa a ligar os avisos de novo.

**Node 22** (fixado em `engines` no `package.json`).

**Fila das automações de 5 em 5 minutos.** O agendamento da Vercel no plano grátis roda só uma vez por dia (`vercel.json`, fica como reserva). Por isso o `npm run migrar`, quando roda no build de produção da Vercel (`VERCEL_ENV=production`; as prévias usam o mesmo banco e não mexem na tarefa) com `APP_URL` em https, liga no Supabase o agendador do próprio banco (`pg_cron` + `pg_net`): a cada 5 minutos o banco chama `/api/cron/fila` com o `CRON_SECRET`. O log do build mostra uma linha `agendador do banco: …` dizendo se ligou ou por que não. Desligar: `FILA_NO_BANCO=0` e apagar a tarefa `growlift-fila` em `cron.job`. O segredo fica guardado na tabela de tarefas do agendador, que só o administrador do banco lê. Código: `src/server/agendador-banco.ts`.

## E-mail (convites e senha)

Com `RESEND_API_KEY` e `EMAIL_REMETENTE` (ex.: `Growlift <nao-responda@growlift.com.br>`) nas variáveis da Vercel, convites da equipe e links de redefinir senha (válidos por 1 hora) saem pelo Resend (`src/server/email.ts`). Passos: criar a conta no Resend, adicionar o domínio e colocar no DNS os registros que ele pedir (SPF/DKIM), criar a chave de API e salvar as duas variáveis. Sem elas: fora de produção vira “e-mail simulado” (lista na área `/admin`); em produção não sai nada e o link do convite aparece na tela para copiar. Se o provedor recusar, o convite continua valendo e a tela avisa para copiar o link. No HTML, só o link da própria plataforma vira clicável. Limite: 20 convites por empresa por dia. “Esqueci a senha” responde sempre igual e no mesmo tempo (cerca de 0,8 s), exista o e-mail ou não; o e-mail sai depois da resposta; limite de 5 pedidos por 15 minutos por endereço de internet e 3 por hora por e-mail.

## Ambientes

`AMBIENTE` vale `desenvolvimento`, `demonstracao` ou `producao`, cada um com o seu banco (`DATABASE_URL`).

- Em **produção** os simuladores ficam desligados: sem chave de IA, a conversa vai direto para a equipe; sem WhatsApp oficial, nada é enviado. Os dados de demonstração e o `--zerar` são recusados.
- Fora de produção, o que é simulado aparece na tela como “Simulação — nenhuma mensagem externa enviada”.

## Automações

Tela **Automações** (administrador): o que está ligado, o que está agendado e o que já rodou, com o motivo de cada cancelamento.

| Automação | Dispara quando | O que faz |
| --- | --- | --- |
| Pedido novo | chega um pedido | tarefa para o responsável e aviso; alerta aos administradores se ninguém atender no prazo |
| Confirmação ao cliente | logo depois do pedido | mensagem pelo WhatsApp, só para quem autorizou |
| Assistente virtual | a cada mensagem do cliente | responde, anota dados, chama uma pessoa |
| Retorno da proposta | etapa “Proposta enviada” | tarefa do vendedor e até duas mensagens ao cliente, canceladas se ele responder, pedir SAIR, alguém assumir ou a etapa mudar |
| Convite de avaliação | serviço marcado como concluído | convite neutro com o link público |
| Lembrete de manutenção | N meses depois do serviço concluído (padrão 12; desligado por padrão) | uma mensagem por serviço perguntando se o cliente quer agendar a manutenção; só para quem aceitou a autorização versão 2 (que inclui a manutenção); ligar a regra não manda nada para serviços concluídos há mais de N meses + 30 dias |
| Tarefa vencida sobe | tarefa aberta passou do prazo há mais de X horas (padrão 4; 0 desliga) | aviso aos administradores com o nome do responsável, uma vez por tarefa |
| Resumo do dia | todo dia a partir da hora escolhida (padrão 8h) | aviso no painel: pedidos novos (24 h), tarefas de hoje e vencidas de cada pessoa; para administradores, da empresa toda e quantas estão sem responsável; nada quando não há nada |

Toda mensagem iniciada pela empresa respeita o horário configurado e a regra do WhatsApp: sem conversa nas últimas 24 horas, só sai com **modelo aprovado pela Meta** cadastrado em Configurações › WhatsApp. Sem modelo, vira tarefa para uma pessoa em vez de falhar em silêncio.

### Construtor de fluxos (automações próprias)

Em **Automações › Seus fluxos**, o administrador monta fluxos no estilo do HighLevel, sem assinatura de terceiros:

- **Gatilho:** pedido novo, oportunidade entrou em uma etapa (a escolher), serviço concluído, o cliente mandou uma mensagem (com palavra-chave opcional, sem diferença de acento ou maiúscula) ou a oportunidade aberta ficou N dias sem interação (verificado a cada 5 minutos, junto com as rotinas de tarefa vencida e resumo do dia; de novo só depois de uma nova interação seguida de outro período parado).
- **Passos** (até 12 por fluxo, até 20 fluxos por empresa): esperar (minutos, horas ou dias), **parar se** e **se… ir para o passo N** (ramificação: se a condição vale, pula; senão, segue), **ir para o passo N** ou terminar, com as condições: o cliente respondeu / a etapa mudou / a oportunidade foi ganha ou perdida / uma pessoa assumiu a conversa / tem autorização de WhatsApp / tem responsável; enviar WhatsApp (com `{{nome}}` e `{{empresa}}`), criar tarefa, avisar a equipe, anotar no histórico, **atribuir responsável** (a uma pessoa escolhida ou ao vendedor com menos oportunidades abertas, mantendo quem já está se você quiser) e **mover para uma etapa do meio** (novo, em atendimento, qualificado, proposta enviada, negociação).
- **Modelos prontos** (nascem desligados): proposta sem resposta, boas-vindas ao pedido, pós-venda, cliente pediu visita e orçamento parado (com ramificação).
- **Desenho do fluxo** no editor: o gatilho no topo, cada passo em uma caixa ligada à próxima e os desvios marcados (“Sim → passo 4”, “Sim → para aqui”).
- **Histórico** de cada execução, passo a passo, com o motivo de cada pulo ou parada.

Regras que valem para todo fluxo, no servidor e conferidas de novo a cada passo: mensagem só sai para quem autorizou o WhatsApp, dentro do horário da empresa, sem pessoa na conversa e sem pedido de parar (SAIR); fora das 24 horas da última mensagem do cliente só com modelo aprovado pela Meta (sem modelo, vira tarefa para uma pessoa); cada passo é um trabalho da fila com chave única (reiniciar não repete nada); editar um fluxo não muda as execuções em andamento, e desligar para as que estão rodando. **Nenhum passo marca venda como ganha ou perdida nem muda o valor**: isso continua sendo decisão de uma pessoa. Quando um fluxo muda a etapa, valem os mesmos retornos de proposta de quando uma pessoa muda, mas isso não conta como atendimento humano, não reabre oportunidade encerrada e não começa outros fluxos (sem reação em cadeia).

Limites desta versão: os pulos só vão para a frente (o fluxo sempre termina e cada passo roda no máximo uma vez por execução), não há gatilho por data do calendário (aniversário, data marcada), e o desenho mostra o fluxo mas a edição ainda é pela lista de campos (não se arrasta caixas).

## Configurar uma empresa nova

1. Entrar como equipe Growlift em `/admin` e cadastrar a empresa (nome, endereço, segmento). Ela nasce com o formulário do segmento e conteúdo em branco; nada é copiado de outra empresa.
2. Entrar na empresa com um motivo e, em Configurações › Equipe, criar o convite do administrador dela. Enquanto o envio de e-mail não está ligado, o link aparece na tela para copiar.
3. O administrador preenche **Conhecimento** (o que a assistente pode dizer), **Configurações › Site**, as **regras de acompanhamento** e quem recebe os pedidos novos.

Um segmento novo é uma entrada em `SEGMENTOS` (`src/server/config.ts`) com as perguntas extras do formulário; o resto do sistema não muda.

## Ligar ao site que a empresa já tem

**Formulário incorporado**: colar o `<iframe>` mostrado em Configurações › Formulário no seu site.

**Chat no site da empresa**: colar `<script src="<plataforma>/chat.js" data-chave="pk_..." async></script>` antes de `</body>` (a linha pronta está em Configurações › Formulário no seu site). Aparece um botão no canto; o chat abre num iframe da plataforma (em tela cheia no celular), então os estilos do site não interferem e nada do site é lido. Opcional: `data-texto` e `data-cor`.

**Integração** (`POST /api/publico/pedidos`, JSON):

```json
{
  "chave": "pk_... (chave pública da empresa)",
  "nome": "Nome", "telefone": "(11) 91234-5678", "cidade": "Campinas",
  "necessidade": "O que a pessoa precisa",
  "preferencia_contato": "WhatsApp",
  "aceite_whatsapp": true,
  "chave_idempotencia": "um-identificador-unico-por-envio",
  "extras": { "tipo_imovel": "Casa", "gasto_mensal": "450" },
  "campanha": { "utm_source": "google" }
}
```

Respostas: `201` (salvo; `repetido: true` se o mesmo envio já tinha chegado), `422` com `campos` dizendo o que corrigir, `429` quando há envios demais. A chave pública só identifica a empresa; não dá acesso a dados. Só marque `aceite_whatsapp` se a pessoa viu e aceitou o texto de autorização. Proteções: validação no servidor, limite por endereço e por empresa, campo-isca contra robôs e a chave de idempotência.

## Proposta online

Na página da oportunidade, **Proposta online**: título, itens (descrição | quantidade | valor), condições (pagamento, prazo, garantia, o que não está incluso, despesas adicionais), validade em dias a contar do envio e se o cliente é pessoa comprando para si (mostra o direito de desistir em 7 dias, CDC art. 49) ou empresa. **Gerar link** cria um endereço secreto (só o hash fica guardado), move a oportunidade para “Proposta enviada” e grava o valor. Só funciona com razão social, CNPJ, endereço e um contato preenchidos em Configurações › Site (Decreto 7.962/2013).

- O cliente abre (`/p/<link>`), vê empresa, itens, total, condições e validade, e aceita digitando o nome e marcando “Li a proposta e aceito…”, ou recusa (motivo opcional). O vendedor é avisado quando o link é aberto pela primeira vez e vê quantas vezes foi aberto.
- Aceite: grava nome, data/hora, hash do acesso, navegador, o texto do aceite e um hash do conteúdo mostrado; move para “Negociação”, cancela os retornos automáticos e cria a tarefa de combinar o fechamento. Nunca marca a venda como ganha. O cliente pode imprimir ou salvar a página como comprovante.
- Proposta enviada não muda (o banco recusa alterar itens, valor, condições e validade); link novo mantém o mesmo conteúdo. Para corrigir, cancele e faça outra. Proposta cancelada mostra “cancelada pela empresa”.
- Gatilho de fluxo “Quando o cliente aceita a proposta online”.

## Resultado dos anúncios

Menu **Anúncios** (administrador): pedidos do mês separados pelo anúncio que trouxe cada um (`utm_source` e `utm_campaign` do link, ou o identificador de clique do Google/Meta), quantos viraram venda e o valor delas. O administrador informa quanto gastou em cada anúncio no mês; o painel mostra custo por pedido, custo por venda e quanto voltou em vendas para cada R$ 1 (valor informado pelos vendedores, não é lucro). Sem o gasto, as colunas de custo ficam vazias: nada é estimado. Conta pelo mês em que o pedido chegou. Limitação: o formulário dentro de iframe não vê o link da página de fora; use o site da plataforma ou a integração para levar a marcação.

## Limpeza automática de dados

Configurações › Dados: prazo em meses (padrão 24; 0 = nunca). Uma vez por dia, junto com as outras rotinas, o sistema apaga contatos que nunca fecharam negócio e não tiveram pedido, conversa, ligação nem visita nesse período, com tudo o que é deles (oportunidades, conversas, autorizações, ligações, visitas, histórico). Clientes (venda ganha) e quem tem visita marcada não são apagados. O histórico da empresa registra só quantos foram apagados. A página de privacidade mostra o prazo. Também limpa sobras técnicas (contadores, avisos da Meta com mais de 30 dias, trabalhos e avisos lidos com mais de 180 dias).

## Agenda de visitas

Menu **Agenda** (todos) e Configurações › Agenda (administrador): dias da semana com horário próprio para cada dia (ex.: sábado das 8 às 12), dias sem visita (feriados, férias, folgas: “25/12/2026 Natal” ou “02/01/2027 a 10/01/2027 Férias”), duração, quantas visitas ao mesmo tempo, antecedência mínima e quantos dias à frente.

- **A assistente marca:** quando o cliente pede visita, ela oferece até 3 horários livres (só da lista calculada pelo servidor) e reserva o escolhido. Uma pessoa confirma o endereço: a reserva cria a tarefa “Confirmar a visita”. A assistente diz “reservei o horário”, nunca “confirmado”. Limites: uma visita ativa por cliente e 20 por dia pela assistente.
- **O cliente remarca ou cancela pelo WhatsApp:** com visita marcada, se ele pede para remarcar, a assistente oferece outros horários livres e muda a visita; se pede para cancelar, ela confirma antes. O lembrete acompanha e o responsável recebe o aviso.
- **A equipe marca** na página da oportunidade (qualquer horário), confirma, marca como realizada ou “cliente faltou”, remarca e cancela.
- **Lembrete um dia antes** pelo WhatsApp (modelo aprovado “lembrete de visita”). Depois de reservar pelo WhatsApp, o sistema pergunta, com texto fixo, se o cliente quer o lembrete; só grava a autorização se ele responder SIM. Também vale se ele pediu à equipe (caixa na oportunidade, registrada com o nome de quem marcou) ou aceitou o texto do formulário versão 4. Visita a menos de um dia: sem lembrete. Cancelar ou remarcar cancela/refaz o lembrete.
- **Google Agenda:** cada pessoa cria um endereço secreto (Agenda › “Criar meu link da agenda”) e assina no Google Agenda (“Do URL”). Administrador vê as visitas da empresa; vendedor, as dele. Mostra só o primeiro nome e o endereço. O Google atualiza esse tipo de agenda a cada algumas horas. Cada visita também tem “Pôr no Google Agenda”. Sincronização em tempo real com o Google (login com a conta Google) fica para depois.
- Gatilho de fluxo “Quando uma visita é marcada”.

## Ligação não atendida → WhatsApp

Quando alguém liga para a empresa e ninguém atende, a plataforma responde pelo WhatsApp, abre a oportunidade e cria a tarefa de retornar a ligação (Configurações › Ligações não atendidas; texto e liga/desliga em Regras).

- **Precisa de um serviço de telefonia na internet** com um número que toca nos celulares da equipe e avisa quando a ligação não foi atendida. O WhatsApp não avisa sobre ligações perdidas no telefone comum. Ainda não há serviço escolhido nem adaptador específico: a entrada aceita um formato simples e os campos mais comuns desses serviços.
- **Entrada:** `POST /api/webhooks/telefonia` com a chave da empresa em `Authorization: Bearer <chave>` (ou como senha do acesso básico). A chave é criada pela equipe Growlift dentro da empresa e aparece uma vez só. Campos (JSON ou formulário): `de` (ou `From`), `id` (ou `CallSid`), `status` (ou `DialCallStatus`/`CallStatus`: `nao_atendida`, `no-answer`, `busy`, `missed`, `canceled`, `failed`) e `aceite_whatsapp` (mande `true` só quando a pessoa apertou 1 no menu de autorização; um `Digits=1` de outro menu não vale). Outros status são ignorados.
- **Autorização:** a mensagem só vai para celular de quem apertou 1 no menu daquela ligação (“Se ninguém puder atender, quer receber uma mensagem da {empresa} no WhatsApp, neste número? Aperte 1.”, frase versão 1, gravada com horário e id da chamada) ou autorizou no formulário com o texto versão 3, que inclui “retornar minhas ligações”. O aceite da ligação vale só para a resposta dela: nunca para fluxos, confirmações, retornos de proposta ou manutenção. Sem isso, telefone fixo ou quem pediu SAIR: só a tarefa.
- Sai na hora, também à noite, com o texto de fora do horário (que não promete hora). No máximo uma mensagem por número a cada 24 horas e 40 por empresa por hora; ligações seguidas em 2 horas contam como uma (uma tarefa); o mesmo aviso repetido não faz nada; resposta parada mais de 2 horas na fila não sai.
- Fora da janela de 24 horas precisa do modelo aprovado “resposta a ligação não atendida” (Configurações › WhatsApp).
- Gatilho “Quando uma ligação não é atendida” no construtor de fluxos, com o modelo pronto “Ligação não atendida” (distribui e avisa a equipe se ninguém assumir em 30 minutos).
- Na demonstração, “Simular ligação” em Configurações mostra tudo sem serviço de telefonia.

## Formulários de anúncio do Google

Quem preenche o formulário de um anúncio do Google (lead form) entra direto no funil como pedido, com origem “Formulário de anúncio do Google”, a campanha (`utm_source=google`, `utm_campaign` = número da campanha, `gclid`) e a tarefa do primeiro contato; os fluxos de “pedido recebido” disparam como num pedido do site (Configurações › Formulários de anúncio do Google; código em `src/server/google-ads.ts`).

- **Entrada:** `POST /api/webhooks/google-ads`, no formato do Google Ads (`lead_id`, `google_key`, `is_test`, `campaign_id`, `gcl_id`, `user_column_data` com `FULL_NAME`/`FIRST_NAME`/`LAST_NAME`, `PHONE_NUMBER`, `CITY`, `EMAIL` e as perguntas próprias). A chave vai no campo `google_key`, como o Google exige: o administrador da empresa cria em Configurações, ela aparece uma vez só e o banco guarda só o hash. Resposta `200 {}`; erro 4xx o Google não reenvia, 5xx ele tenta de novo.
- O mesmo `lead_id` entregue duas vezes não cria nada novo. Os “dados de teste” do Google só marcam na tela o horário do teste.
- **Telefone obrigatório:** sem telefone válido o lead é recusado (422) com a explicação. Deixe o telefone como pergunta obrigatória no formulário do anúncio.
- **Nenhuma mensagem automática:** o formulário do Google não pede autorização de WhatsApp, então a plataforma não confirma pelo WhatsApp; a equipe faz o primeiro contato. O e-mail fica nos dados do contato.
- As perguntas próprias do formulário viram o texto da necessidade (“Pergunta: resposta”). Limite: 300 leads por hora por empresa.

## App no celular (avisos)

O painel instala como aplicativo no celular (PWA): em **App no celular**, cada pessoa vê o passo a passo (iPhone: Safari › Compartilhar › Adicionar à Tela de Início; Android: Chrome › Instalar app) e liga os avisos daquele aparelho.

- Toda notificação do painel (pedido novo, cliente esperando uma pessoa, tarefa, oportunidade atribuída, resumo do dia) também vai como aviso para os celulares de quem ela é; sem responsável, para os administradores ativos da empresa.
- A tela bloqueada mostra só o assunto (o que vem antes de “:” no título, como “Novo pedido”) e o nome da empresa. Nome e mensagens do cliente ficam no painel.
- Os avisos saem logo depois de cada ação (`after()`) e sempre que a fila roda. Aviso com mais de 1 hora não é mandado.
- iPhone: só no app instalado e com iOS 16.4 ou mais novo.
- Chaves: `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` (gere com `npx web-push generate-vapid-keys`). Sem elas, saem do segredo do Supabase, como as outras chaves. Trocar as chaves obriga cada pessoa a ligar os avisos de novo.
- Arquivos: `public/manifest.webmanifest`, `public/sw.js` (só mostra avisos, não guarda nada), `src/server/push.ts`, `src/componentes/app-celular.tsx`.

## Ativar a IA

Sem chave, a assistente roda no **simulador** (respostas por regras, marcadas como simulação). Para o modelo real: `IA_ANTHROPIC_API_KEY` no servidor (chave da API da Anthropic contratada para este fim; o acesso usado para programar não serve para atender clientes). Modelo padrão: `claude-haiku-5-5`, o mais barato (decidido em 12/11/2026; troca em `IA_MODELO_PADRAO`), e cada empresa pode escolher o seu em Configurações › Assistente, junto com o limite mensal de respostas.

O adaptador real (`src/server/ia/anthropic.ts`) já foi testado **contra uma API falsa local** (pedido montado, chave enviada, prompt com cache, só as 3 ações permitidas, telefone fora do pedido, ação executada no servidor, recusa e erro da API viram atendimento humano). **Ainda não foi exercitado contra a API real:** este ambiente de desenvolvimento não aceita chave para os endereços da Anthropic, e o acesso usado para programar não é usado para atender clientes.

Para conferir com o modelo real, depois de pôr `IA_ANTHROPIC_API_KEY` no servidor:
- na área da equipe Growlift (`/admin`), botão **Testar a assistente real**: 8 situações (pergunta do conteúdo, uma pergunta por vez, preço, desconto, dúvida técnica, visita, tentativa de burlar, “você é robô?”), com a resposta de cada uma e o custo estimado (limite de 4 testes por hora);
- ou no terminal: `npm run testar-ia [modelo]`.

O que a assistente pode fazer está limitado no servidor a três ações (guardar dados do orçamento, registrar interesse em visita, chamar uma pessoa). Ela não muda etapa, não fecha venda e não informa preço que não esteja em “Preços autorizados”. O telefone do cliente não é enviado ao modelo.

## Ativar o WhatsApp

Só a API oficial (WhatsApp Business Platform, da Meta), com o número da própria empresa, que paga a Meta. Passos:

1. Criar o aplicativo e a conta do WhatsApp Business na Meta e aprovar os modelos de mensagem (confirmação, retorno, avaliação).
2. No servidor: `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` e `WHATSAPP_GRAPH_VERSION` (a versão atual da Graph API, conferida na documentação da Meta no dia).
3. Na Meta, apontar o webhook para `<APP_URL>/api/webhooks/whatsapp` com o mesmo token de verificação.
4. Na empresa, Configurações › WhatsApp: modo Oficial, ID do número, token de acesso (guardado cifrado) e os nomes dos modelos.

**Limite importante:** o adaptador (`src/server/canais/whatsapp-cloud.ts`) foi escrito conforme o formato conhecido da API e testado com a rede simulada. A documentação da Meta não pôde ser aberta do ambiente em que isto foi construído e **nenhum envio real foi feito**. Antes do primeiro cliente: conferir endereço, campos, assinatura do webhook e regras de janela na documentação atual, e testar só com números próprios ou destinatários de teste autorizados.

Regras já aplicadas no servidor: assinatura do webhook verificada antes de ler o conteúdo; cada evento processado uma vez; mensagem só vira “enviada” com o identificador devolvido pela Meta; sem resposta da Meta vira “sem confirmação” e não é reenviada; texto livre só até 24 horas depois da última mensagem do cliente (fora disso, modelo aprovado ou tarefa para uma pessoa); SAIR bloqueia envios automáticos e revoga a autorização.

## Dados pessoais, exportação, exclusão e guarda

- O formulário não pede CPF, documentos, dados bancários nem endereço completo.
- Cada autorização de WhatsApp guarda o texto exato aceito, a data, a origem e a versão do texto. A versão 2 inclui avaliação e lembrete de manutenção; quem aceitou a versão 1 não recebe o lembrete.
- **Exportar**: Configurações › Dados (só administrador da empresa; fica registrado).
- **Excluir**: na oportunidade, “Excluir este contato” apaga contato, oportunidades, conversas, tarefas e histórico ligados a ele, e cancela envios pendentes. Fica só o registro anônimo de que houve uma exclusão.
- **Guarda**: esta versão não apaga nada sozinha. O prazo de guarda é decisão de cada empresa com orientação jurídica; a limpeza automática por prazo é um próximo passo. Contadores de abuso e identificadores de webhook são apagados pelo worker (1 e 30 dias).
- A política de privacidade é o texto que a empresa escrever. A plataforma não garante adequação à lei.

## Backup e restauração

Local: `pg_dump -Fc growlift_dev > backup.dump` e `pg_restore --clean -d growlift_dev backup.dump`. Em produção, usar um Postgres gerenciado com backup diário e restauração por ponto no tempo, e **testar uma restauração** antes do primeiro cliente. Guardar `CHAVE_CREDENCIAIS` fora do banco: sem ela, os tokens das empresas não podem ser lidos (e precisariam ser cadastrados de novo).

## Dependências externas e custos

Nenhuma mensalidade é necessária para rodar o núcleo no computador. Em produção:

| Item | Tipo | O que se sabe |
| --- | --- | --- |
| Hospedagem da aplicação + processo do worker | fixo | Não cotado. O worker precisa de um processo que fique ligado (ou uma chamada agendada frequente). |
| PostgreSQL gerenciado | fixo | Não cotado. |
| IA (Anthropic) | variável, por uso | Preços de tabela por milhão de tokens (entrada / saída), referência de 03/11/2026 do material da Anthropic usado no desenvolvimento: Opus 5.5 US$ 4 / US$ 20; Sonnet 5.5 US$ 2 / US$ 10; Haiku 5.5 US$ 0,10 / US$ 0,50. Conferir a página de preços antes de fechar valores. |
| WhatsApp (Meta) | variável, por mensagem | Pago pela empresa cliente à Meta. Preços não verificados (documentação inacessível daqui). |
| E-mail transacional (convites, senha) | fixo ou por uso | Ainda não integrado. |
| Domínio | fixo | Não cotado. |

**Ainda desconhecido** (por isso não há estimativa de custo por cliente): quantas conversas por mês cada empresa terá, quantas mensagens por conversa, o tamanho do conteúdo de cada empresa e quantas mensagens iniciadas pela empresa (modelos) serão enviadas. O painel já mede respostas e tokens por empresa por mês, para calcular isso com dados reais do primeiro cliente. A oferta de R$ 1.200 por mês é contexto comercial e não foi validada contra esses custos.

## Limitações de segurança conhecidas

- Não há revisão de segurança independente nem teste de invasão.
- O isolamento entre empresas é feito pelo código (toda consulta leva a empresa da sessão) e pelas chaves estrangeiras; não há políticas de linha (RLS) no banco como segunda barreira.
- Sem verificação em duas etapas no login.
- Os limites contra abuso usam o endereço IP informado pelo servidor de borda; atrás de um proxy mal configurado, podem ser contornados. Não há CAPTCHA.
- Sem `RESEND_API_KEY`, o e-mail não sai: convites e links de senha aparecem para copiar (e, fora de produção, na lista de e-mails simulados).
- Um só segredo de aplicativo da Meta para todas as empresas (modelo de um aplicativo Growlift).
- Avisos de entrega que chegarem antes de a plataforma gravar o identificador da mensagem são ignorados.
- A resistência da assistente a mensagens maliciosas foi testada no simulador e na camada do servidor (que recusa qualquer ação fora da lista); o comportamento do modelo real não foi avaliado.

## Revisões feitas e o que ficou aberto

Em 12/11/2026 rodaram as revisões de segurança e legal do repositório (automáticas; **não substituem advogado nem teste de invasão**). O que era correção de código foi feito. O que continua aberto:

- **Número do cliente não é verificado:** quem marca a autorização no formulário com o telefone de outra pessoa pode fazer a empresa mandar a mensagem de confirmação para ela. Mitigado (nome limpo na mensagem, limite de envios, texto fixo, um só envio), não resolvido. A solução de verdade é confirmar o número antes (por exemplo, a pessoa responde primeiro). Decisão de produto.
- **Como a assistente se apresenta (decidido em 12/11/2026):** tem nome (padrão "Ana", muda em Configurações › Assistente), fala como alguém da equipe e não anuncia que é robô. Se perguntarem a sério, não mente: diz que é a assistente da empresa e oferece chamar uma pessoa. O aviso de que o atendimento usa IA de empresa terceira fica na página de Privacidade.
- **Login de apoio da Growlift** tem poderes de administrador da empresa na hora de apoio (inclusive convidar gente e trocar o token do WhatsApp); fica tudo registrado.
- Sem CSP nos cabeçalhos, sem CAPTCHA, limites por empresa que um robô pode esgotar, avisos de entrega que chegam antes da gravação do identificador da mensagem são ignorados.
- Jurídico, antes de vender: contrato com cláusulas de operador (LGPD), termos de uso, política da Growlift, encarregado, prazo de guarda com apagamento automático, busca de marca no INPI para "Lumivale" e "Sol do Vale", e conferir a política da Meta sobre IA no atendimento.

## Fora desta versão (sem telas que finjam funcionar)

Aplicativo nativo, construtor visual de sites, disparos de prospecção, campanhas de anúncios, central telefônica, gestão financeira, contratos, pagamentos e cobrança automática de assinaturas. Também: envio de mídia e formulários de anúncio da Meta (Facebook/Instagram).

## Próximos passos para o primeiro cliente em produção

1. Escolher e contratar hospedagem e Postgres gerenciado (decisão e custo de vocês); configurar as variáveis e rodar `npm run migrar`.
2. Ligar o envio de e-mail: conta no Resend, domínio verificado e as variáveis `RESEND_API_KEY` e `EMAIL_REMETENTE` (o código já está pronto).
3. Conferir o adaptador do WhatsApp na documentação atual da Meta e testar com número próprio.
4. Contratar a chave da API de IA, escolher o modelo e testar a assistente real com o conteúdo do cliente (incluindo tentativas de burlar as regras).
5. Rodar as revisões de segurança e legal do repositório (`revisor-seguranca`, `revisor-legal`) e corrigir o que apontarem.
6. Testar backup e restauração.
7. Com o cliente: texto de privacidade revisado por advogado, conteúdo aprovado, modelos de mensagem aprovados na Meta, equipe convidada.
