# Isolar Production, Preview e Development (proposta, aguarda autorização)

## O problema

Na Vercel, `POSTGRES_URL` (e as outras variáveis do Supabase: `POSTGRES_*`, `SUPABASE_*`) estão marcadas para
**Production, Preview e Development**. O HANDOFF diz que deveria ser só Production. Na prática:

- toda prévia (cada push na branch gera uma) lê e grava **os dados reais**: pedidos, lojas, clientes, Oportunidades;
- quem abrir uma prévia e mexer em algo altera o painel de produção;
- `vercel env pull` (Development) traria a senha do banco real para o computador de quem rodar.

As variáveis vieram da integração Supabase da Vercel, que costuma marcar os três ambientes.
`BLOB_READ_WRITE_TOKEN` também está nos três (o Blob foi suspenso; o HANDOFF manda apagar depois da cópia).

## O que já está protegido (sem mexer em credenciais)

- Testes automáticos e execução local usam arquivos em pasta temporária ou `.data/`; não há `POSTGRES_URL` neste
  ambiente de trabalho.
- A área nova de **Vendas** só grava em Production ou localmente (`gravacaoPermitida`); na prévia fica só leitura.

## Proposta (em ordem; cada passo precisa da autorização de vocês)

1. **Tirar o banco das prévias (recomendado, 5 minutos, feito por vocês):**
   na integração Supabase da Vercel (Vercel → Storage/Integrations → Supabase → projeto `painel-lojas` → ambientes),
   deixar só **Production**. Se a integração não deixar escolher, remover de Preview e Development as variáveis
   `POSTGRES_*` e `SUPABASE_*` (só nesses dois ambientes; Production fica igual).
   Sem `POSTGRES_URL`, o painel cai no Blob (suspenso) ou nos arquivos; por isso o passo 2 vem junto.
2. **Trava no código para todo o painel (eu faço, depois da autorização):** em `src/lib/storage.ts`, quando
   `VERCEL_ENV` não for `production`, nunca usar o Postgres de produção nem o Blob: usar um schema separado
   `painel_previa` no mesmo banco (se a variável continuar lá) ou recusar gravações. Assim, mesmo que alguém marque
   o ambiente errado no futuro, a prévia não toca nos dados reais. Vem com teste.
3. **Banco de prévia de verdade (opcional, depois):** um projeto Supabase grátis separado só para prévias, com
   dados de demonstração, ligado só a Preview.
4. **Apagar `BLOB_READ_WRITE_TOKEN`** quando a cópia Blob → Postgres estiver confirmada (o próprio painel mostra).

Nada disso mexe em Production, no domínio, nos tokens do Instagram ou no cron.
