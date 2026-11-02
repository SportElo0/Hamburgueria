# Isolar Production, Preview e Development (proposta, aguarda autorização)

## O problema

Na Vercel, `POSTGRES_URL` (e as outras variáveis do Supabase: `POSTGRES_*`, `SUPABASE_*`) estão marcadas para
**Production, Preview e Development**. O HANDOFF diz que deveria ser só Production. Na prática:

- toda prévia (cada push na branch gera uma) lê e grava **os dados reais**: pedidos, lojas, clientes, Oportunidades;
- quem abrir uma prévia e mexer em algo altera o painel de produção;
- `vercel env pull` (Development) traria a senha do banco real para o computador de quem rodar.

As variáveis vieram da integração Supabase da Vercel, que costuma marcar os três ambientes.
`BLOB_READ_WRITE_TOKEN` também está nos três (o Blob foi suspenso; o HANDOFF manda apagar depois da cópia).

## Trava no painel inteiro (feita em 02/11/2026, autorizada)

`src/lib/ambiente.ts` decide: grava só **fora da Vercel** (local e testes) ou em **Production** (`VERCEL_ENV=production`).
Em Preview e Development (inclusive `vercel dev`) o painel lê os dados reais, mas não muda nada.

**Pontos de escrita encontrados** (todos passam por `storage()` em `src/lib/storage.ts`, que agora embrulha o banco
num modo "só leitura" fora da produção):
- `writeJSON`, `writeFile` e `remove` em 23 módulos: lojas, rascunhos e publicação (`stores.ts`), pedidos (`orders.ts`),
  clientes e ofertas (`customers.ts`, `subscribers.ts`), mesas, fila, reservas e pagamento na mesa, Pix e token do
  Mercado Pago (`pix.ts`), PDV Saipos (`pdv.ts`), logins da loja (`operators.ts`), diagnósticos, indicações,
  Conteúdos e Agenda do Instagram (`conteudos.ts`, `agenda.ts`, `instagram.ts`), Inteligência, Oportunidades, Vendas,
  contadores de limite (`limits.ts`) e mídia (`painel/actions.ts`, `DocBody.tsx`);
- a cópia antiga do Blob para o banco (`migracao.ts`, via `legacyBlob()`), que agora só existe em Production.

**Efeitos fora do banco também travados na prévia:** abrir, devolver ou cancelar Pix real do Mercado Pago (`pix.ts`):
o pedido seria cobrado sem poder ser salvo. O Pix de demonstração continua. Saipos, Instagram, Google e crons já não
rodam na prévia porque as chaves (`SAIPOS_*`, `INSTAGRAM_TOKEN`, `GOOGLE_MAPS_API_KEY`, `CRON_SECRET`) só existem em
Production.

**Riscos e como ficaram:**
- Login na prévia: a senha errada grava um contador; na prévia o contador é ignorado (sem erro, sem gravação).
- Qualquer "Salvar" na prévia mostra erro ("versão de prévia"). Uma faixa no topo do painel avisa.
- Telas da loja (`/loja/...`) na prévia também não salvam (não têm a faixa).
- A prévia ainda **mostra** os dados reais (pedidos, clientes) para quem tiver login; a trava não esconde nada.
- Production: nenhuma mudança de comportamento (testado: grava normalmente; Agenda, crons e Meta rodam só lá).
- `/api/saude` agora diz `gravacao: true/false`, sem dado nenhum, para conferir cada ambiente.

## Ainda recomendado (precisa de autorização para mexer em variáveis)


1. **Tirar o banco das prévias (recomendado, 5 minutos, feito por vocês):**
   na integração Supabase da Vercel (Vercel → Storage/Integrations → Supabase → projeto `painel-lojas` → ambientes),
   deixar só **Production**. Se a integração não deixar escolher, remover de Preview e Development as variáveis
   `POSTGRES_*` e `SUPABASE_*` (só nesses dois ambientes; Production fica igual).
   Sem `POSTGRES_URL`, o painel cai no Blob (suspenso) ou nos arquivos; por isso o passo 2 vem junto.
2. ~~**Trava no código para todo o painel.**~~ Feita (acima). Texto original: em `src/lib/storage.ts`, quando
   `VERCEL_ENV` não for `production`, nunca usar o Postgres de produção nem o Blob: usar um schema separado
   `painel_previa` no mesmo banco (se a variável continuar lá) ou recusar gravações. Assim, mesmo que alguém marque
   o ambiente errado no futuro, a prévia não toca nos dados reais. Vem com teste.
3. **Banco de prévia de verdade (opcional, depois):** um projeto Supabase grátis separado só para prévias, com
   dados de demonstração, ligado só a Preview.
4. **Apagar `BLOB_READ_WRITE_TOKEN`** quando a cópia Blob → Postgres estiver confirmada (o próprio painel mostra).

Nada disso mexe em Production, no domínio, nos tokens do Instagram ou no cron.
