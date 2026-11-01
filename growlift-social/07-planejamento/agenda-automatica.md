# Agenda automática do Instagram

O painel publica sozinho, no dia e na hora marcados, os posts que vocês aprovarem em **Conteúdos → Agenda do Instagram**. Nada sai sem aprovação.

**Como fica a semana de vocês:**
1. O Claude prepara os posts da semana (vídeo, capa, legenda, dia e hora) e eles aparecem na Agenda como **Para aprovar**.
2. Vocês assistem, ajustam a legenda ou o horário se quiserem e tocam em **Aprovar e agendar**.
3. Na hora, o painel publica e o post vira **Postado**, com o botão "Ver no Instagram".
4. Antes de cada Reel com "Comenta…", liguem a palavra no ManyChat. Depois de publicar um post fixado, fixem pelo app (a automação não fixa).

Botões que existem em cada post: **Salvar agendamento** (mudou legenda ou hora), **Publicar agora**, **Cancelar agendamento** (volta para aprovação). Se algo der errado, o post fica como **Deu erro** com o motivo, e dá para tentar de novo. Se o publicador ficar parado e passar mais de 3 horas do horário, o post fica como **Atrasado** e espera vocês decidirem (para nunca sair de madrugada sem ninguém ver).

## Conectar o Instagram (uma vez só, uns 20 minutos)

### 1. Conta profissional
No app do Instagram do @growlift.ai: **Configurações → Tipo de conta e ferramentas → Mudar para conta profissional** (Empresa). Se já for profissional, pule.

### 2. App na Meta e o token
1. Entrem em **developers.facebook.com** com o Facebook de um de vocês e criem um app: **Meus apps → Criar app**. No caso de uso, escolham o do **Instagram** (gerenciar mensagens e conteúdo / API do Instagram).
2. No app, abram **API do Instagram com login do Instagram** e, em "Gerar tokens de acesso", toquem em **Adicionar conta** e entrem com o @growlift.ai.
3. Confiram que as permissões incluem `instagram_business_basic` e `instagram_business_content_publish`.
4. Toquem em **Gerar token** e copiem o token. **Não mandem o token por WhatsApp, e-mail ou para o Claude**: ele vai direto na Vercel (passo 3).
5. O app pode ficar em "modo de desenvolvimento": só a conta da Growlift usa, então não precisa de revisão da Meta.

(Os nomes dos menus da Meta mudam de vez em quando. Se algo estiver diferente, peçam ao Claude para conferir o caminho atual.)

**Dois tipos de token.** Se o token que a Meta der **começar com IG**, vale como está. Se **começar com EAA** (é o caso de apps novos, com "login unificado"), também funciona: o painel usa o endereço do Facebook e acha a conta do Instagram pela Página do Facebook ligada a ela. Nesse caso a conta do Instagram precisa estar ligada a uma Página do Facebook. O token EAA o painel não renova sozinho: guardem a data e gerem outro antes de 60 dias (a Agenda avisa quando der erro).

### 3. Variáveis na Vercel
No projeto **painel-lojas** → **Settings → Environment Variables**, em Production, criem:

| Nome | Valor |
| --- | --- |
| `INSTAGRAM_TOKEN` | o token do passo 2 (marquem como *Sensitive*) |
| `CRON_SECRET` | uma senha longa inventada na hora, só para isso (por exemplo, 40 letras e números aleatórios). Não usem senha pessoal |
| `INSTAGRAM_USER_ID` | **Só se precisar:** o número da conta do Instagram, se a Agenda disser que não achou a conta (aparece na página do app, no passo "Gerar tokens de acesso", ao lado da conta). Não é segredo |
| `PAINEL_URL` | `https://painel-lojas-sportelo.vercel.app` (já configurado pelo Claude) |

Depois, **Deployments → ⋯ → Redeploy** no último deploy, para o painel ler as variáveis.

### 4. O relógio que dispara a publicação (a cada 5 minutos)
O plano gratuito da Vercel só deixa rodar o publicador uma vez por dia (já está configurado como reserva). Para publicar na hora certa, usem um despertador grátis:

1. Criem uma conta em **cron-job.org**.
2. **Create cronjob**:
   - URL: `https://painel-lojas-sportelo.vercel.app/api/instagram/tick`
   - Execution schedule: **a cada 5 minutos**
   - Em **Advanced → Headers**, adicionem: `Authorization` = `Bearer ` + o mesmo `CRON_SECRET` do passo 3 (com a palavra Bearer, um espaço e a senha).
3. Salvem e toquem em **Test run**: a resposta deve começar com `{"started":`. Se vier "Não autorizado", o cabeçalho está diferente do `CRON_SECRET`.

Abrir a Agenda ou tocar em **Verificar agora** também faz o publicador andar, então dá para usar mesmo antes do passo 4.

### 5. Testar
Abram a Agenda: no topo deve aparecer **Conectado como @growlift.ai**. Escolham um post, aprovem e toquem em **Publicar agora**. Em 1 a 3 minutos ele vira **Postado** (toquem em "Verificar agora" para atualizar).

## Bom saber

- **Token:** o painel renova sozinho toda semana. Se um dia aparecer erro de token (por exemplo, trocaram a senha do Instagram), gerem um novo no passo 2 e troquem na Vercel.
- **Limite do Instagram:** 100 posts pela API a cada 24 horas (um carrossel conta como um). O topo da Agenda mostra quanto já foi usado.
- **Rótulo de IA:** vai marcado nos Reels com voz gerada por computador (dá para desmarcar ou marcar em cada post).
- **O que só dá pelo app:** música da biblioteca do Instagram, fixar no perfil, marcar produtos.
- **Arquivos:** o Instagram baixa o vídeo do painel por um link que vence em 3 horas e só funciona para aquele arquivo.
- **Para tirar um post do ar:** apaguem pelo app do Instagram (o painel não apaga).
