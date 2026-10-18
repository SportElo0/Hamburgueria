# MERCANTIL — Clássicos com história

Showroom digital do acervo de Mercedes-Benz clássicos da Mercantil, dos serviços de restauração e do **Mercantil Vision**
(visualização de projetos com IA).

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Motion · OpenAI Images API (server-side).

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha o necessário (ver abaixo)
npm run dev                  # http://localhost:3000
npm run build && npm start   # produção
npm run typecheck
```

Testes ponta a ponta (com o servidor rodando e `ADMIN_PASSWORD` igual ao do `.env.local`):

```bash
node scripts/e2e.mjs          # formulários, Vision (provedor simulado na rede, só no teste), painel admin
node scripts/shoot.mjs http://localhost:3000/ .impeccable/review home --full   # capturas desktop + mobile
```

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/content/` | **Dados iniciais** (veículos, serviços, contatos, cartela do Vision), separados da interface |
| `src/app/(site)/` | Páginas públicas: início, acervo, carro, restauração, projetos, Vision, atelier, contato, privacidade |
| `src/app/admin/` | Painel administrativo (login, veículos, fotos, solicitações, contatos e serviços) |
| `src/app/api/` | `vision` (geração com IA), `leads` (solicitações), `cron/purge` (retenção), `admin/file` (arquivos privados) |
| `src/lib/storage/` | Adaptador de armazenamento: `fs` (disco local) ou `blob` (Vercel Blob) |
| `src/lib/vision/` | Contrato de provedor de IA + implementação OpenAI |
| `public/media/` | Fotografia real do W111 (placas ocultadas) e ilustração conceitual (identificada como IA) |
| `PRODUCT.md` / `DESIGN.md` | Verdade do produto e sistema visual |

## Variáveis de ambiente

Veja `.env.example`. Resumo:

| Variável | Para quê |
|---|---|
| `ADMIN_PASSWORD`, `SESSION_SECRET` (32+ caracteres) | Habilitam o painel `/admin`. Sem elas, o painel fica desativado. |
| `STORAGE_DRIVER` | `fs` (padrão; precisa de disco persistente) ou `blob` (Vercel/serverless) + `BLOB_READ_WRITE_TOKEN` |
| `OPENAI_API_KEY` | Ativa o Mercantil Vision. **Precisa de créditos de API** — a assinatura do ChatGPT não inclui uso de API. |
| `OPENAI_IMAGE_MODEL`, `OPENAI_IMAGE_QUALITY`, `OPENAI_INPUT_FIDELITY` | Modelo (padrão `gpt-image-1`), qualidade e fidelidade à foto original |
| `VISION_ENABLED` | `false` pausa a geração sem remover a chave |
| `VISION_PER_IP_DAILY`, `VISION_DAILY_BUDGET` | Limite por visitante/dia e teto diário global (controle de gasto) |
| `VISION_MAX_UPLOAD_MB`, `VISION_RETENTION_DAYS` | Tamanho máximo de upload; prazo para apagar solicitações e imagens |
| `CRON_SECRET` | Protege `/api/cron/purge` (o `vercel.json` agenda a limpeza diária) |
| `NEXT_PUBLIC_SITE_URL` | URL pública (SEO, sitemap, verificação de origem dos formulários) |

## Publicar (Vercel recomendado)

1. Importe o repositório na Vercel.
2. Crie um Blob Store (Storage → Blob) e defina `STORAGE_DRIVER=blob` — a Vercel injeta `BLOB_READ_WRITE_TOKEN`.
3. Defina `ADMIN_PASSWORD`, `SESSION_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL` e, quando houver créditos, `OPENAI_API_KEY`.
4. Entre em `/admin` → **Contatos e serviços** e cadastre o WhatsApp oficial. Até lá, os botões de interesse abrem o formulário do site (as mensagens chegam ao painel).

Em um servidor Node próprio (VPS), `STORAGE_DRIVER=fs` grava em `./.data` — mantenha essa pasta em disco persistente e com backup.

## Mercantil Vision — como funciona

- Gerar uma simulação **não exige** nome nem telefone.
- A foto é reduzida no aparelho, validada no servidor (tipo real pelo conteúdo, tamanho, dimensões), tem metadados removidos (incluindo GPS) e é enviada à OpenAI (`/v1/images/edits`). **A chave nunca vai ao navegador.**
- O prompt prioriza preservar modelo, proporções, perspectiva e fundo, e altera só o que foi escolhido; proíbe logotipos e textos inventados.
- Nada é guardado após a geração. Foto e simulação só são armazenadas (de forma privada) se o visitante enviar uma solicitação **e** marcar a autorização de imagens; são apagadas após `VISION_RETENTION_DAYS`.
- Proteções: verificação de origem, limite por minuto e por dia (por IP com hash), teto diário global, honeypot, tempo máximo de 110 s.
- Sem chave configurada, a interface informa que a geração está indisponível e nunca mostra imagem pronta como resultado.
- Para trocar de provedor, implemente `ImageEditProvider` em `src/lib/vision/` e selecione com `VISION_PROVIDER`.

## O que ainda depende da Mercantil

Itens deixados com marcação explícita no site, sem informação inventada:

- **Fotografias reais** dos outros 8 carros (hoje: placa “Fotografias reais em produção”), do processo de restauração, do espaço e da equipe.
- **Pares antes/depois** reais (o comparador já existe; a seção mostra o estado “aguardando a conclusão do projeto”).
- **Anos e dados de cada exemplar** (estão como “a confirmar”), preços (só se autorizados no painel).
- **WhatsApp, e-mail, Instagram, cidade/endereço** (cadastrar no painel).
- **Confirmação dos serviços** oferecidos (painel → marcar “confirmado”) e **textos institucionais** do Atelier (marcados como provisórios).
- Uso da assinatura **Lelo Imports** (não aparece no site até confirmação).
- Revisão jurídica da página de privacidade.
