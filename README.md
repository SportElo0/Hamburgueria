# LM Barbearia — site

Site da LM Barbearia (Leonardo Miguel), Rua Cotovia, 130 — Campanário, Diadema – SP.

Página única, feita para o celular, com agendamento que monta a mensagem e abre o WhatsApp do Leonardo. Não existe agenda online: o pedido só vale depois que o Leonardo confirma pelo WhatsApp, e o site diz isso em todas as etapas.

**Tecnologia:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · lucide-react. Sem banco de dados, sem rastreamento, sem APIs pagas. A página é gerada estática.

---

## Antes de publicar: o que falta confirmar

Rode `npm run check:config` para ver a lista atualizada. Hoje faltam:

| Item | Situação | Onde mudar |
| --- | --- | --- |
| Horários | Provisórios, copiados da bio do Instagram (ter–sáb 10h–20h, dom 10h–16h, seg fechado). O Google mostrava "fecha 19:00". | `config/site.ts` → `hours` |
| Fotos dos cortes (6) | Placeholders marcados como "FOTO TEMPORÁRIA" | `config/site.ts` → `gallery` |
| Foto principal | Placeholder | `config/site.ts` → `hero.photo` |
| Foto do Leonardo | Placeholder | `config/site.ts` → `about.photo` |
| Texto "Sobre" | Provisório, com etiqueta de revisão | `config/site.ts` → `about` |
| Preços e durações | Não informados (o site mostra "Valor no WhatsApp") | `config/site.ts` → `services` |
| Logotipo original | Usando marca tipográfica "LM Barbearia" | `components/brand.tsx` |
| Avaliações | 5,0 com 16 avaliações, conferido no Google em 21/10/2026. Não atualiza sozinho. | `config/site.ts` → `reviews` |
| Endereço do site | `https://lm-barbearia.vercel.app` (provisório) | variável `NEXT_PUBLIC_SITE_URL` na Vercel |
| Indexação no Google | **Desligada** (`noindex`) para a versão com fotos temporárias não aparecer nas buscas | variável `NEXT_PUBLIC_ALLOW_INDEXING=true` na Vercel |

---

## Rodar no computador

Precisa do Node.js 20.9 ou mais novo.

```bash
npm install
npm run dev          # abre em http://localhost:3000
```

Outros comandos:

```bash
npm run build        # build de produção (o mesmo que a Vercel faz)
npm run start        # serve o build localmente
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run check:config # lista as pendências de conteúdo
```

---

## Como alterar o conteúdo

Tudo que muda com frequência está em **`config/site.ts`**. Os componentes só leem esse arquivo, então não é preciso mexer em layout.

### Trocar fotos

1. Coloque as fotos em `public/fotos/` (JPG ou WebP, de preferência com 1600 px ou mais no lado maior). Use só fotos do próprio Leonardo ou autorizadas por ele.
2. Em `config/site.ts`, preencha `src` com o caminho a partir de `public`:

```ts
gallery: [
  { src: "/fotos/degrade-risca.jpg", alt: "Degradê com risca lateral", caption: "Degradê com risca" },
  // ...
],
```

O placeholder some sozinho quando `src` deixa de ser `null`. O Next.js gera versões otimizadas (AVIF/WebP) de cada foto. A primeira foto da galeria aparece maior; coloque a melhor nela. Para a foto principal (`hero.photo`), prefira uma foto vertical e bem iluminada de um corte.

Pode adicionar ou remover itens da galeria; o layout repete o padrão a cada 6 fotos.

### Alterar preços

Em `services`, troque `price: null` pelo valor em reais (número, sem "R$"):

```ts
{ id: "corte", name: "Corte masculino", price: 40, durationMinutes: 40, ... }
```

Com `price: null`, o card mostra "Valor no WhatsApp". A duração só aparece quando for preenchida.

### Alterar horários

Em `hours.week`, cada dia da semana tem `{ open, close }` ou `null` (fechado). `0` é domingo, `6` é sábado.

```ts
hours: {
  confirmed: true, // mude para true depois que o Leonardo confirmar
  week: {
    0: { open: "10:00", close: "16:00" },
    1: null,
    // ...
  },
},
```

O calendário do agendamento usa esses horários para bloquear dias fechados e sugerir horários de preferência (de 30 em 30 minutos; ajuste em `booking`). Com `confirmed: true`:

- some o aviso "sujeito a confirmação";
- os horários passam a entrar nos dados estruturados para o Google.

### Alterar WhatsApp, Instagram ou endereço

```ts
whatsapp: { number: "5511913392818", display: "(11) 91339-2818" },
```

`number` leva só dígitos, com 55 (Brasil) e DDD. Instagram e endereço ficam logo abaixo, no mesmo arquivo.

### Aprovar o texto "Sobre"

Edite `about.title`, `about.paragraphs` e `about.commitments` e mude `about.draft` para `false`. A etiqueta "texto provisório" desaparece.

### Avaliações

`reviews.rating` e `reviews.count` são números copiados à mão do Google, com a data em `checkedAt`. Atualize de vez em quando ou use `show: false` para esconder a seção. Depoimentos individuais (`testimonials`) só com autorização de quem escreveu.

---

## Como funciona o agendamento

1. Serviço → 2. Data → 3. Horário de preferência → 4. Primeiro nome e observação → 5. Revisão (mostra a mensagem exata) → 6. Botão "Solicitar agendamento pelo WhatsApp".

- Datas passadas, dias fechados e datas fora do período (`booking.daysAhead`) ficam bloqueados.
- No mesmo dia, horários a menos de 1 hora (`booking.minNoticeMinutes`) não aparecem.
- Datas e horários são calculados no fuso de São Paulo, independente do fuso do celular do cliente.
- O link é `https://wa.me/5511913392818?text=...` com a mensagem codificada por `encodeURIComponent`. No celular abre o app; no computador, o WhatsApp Web ou o app de desktop.
- Nada é enviado automaticamente: o cliente precisa tocar em enviar dentro do WhatsApp. Depois do clique, o site mostra "Pedido pronto no WhatsApp" e lembra que o horário só vale com a confirmação do Leonardo.

Exemplo de mensagem gerada:

```
Olá, Leonardo! Vim pelo site da LM Barbearia e gostaria de solicitar um agendamento.

Nome: João
Serviço: Corte + Barba
Data desejada: sábado, 24/10/2026
Horário de preferência: 15:00

Você consegue confirmar esse horário?
```

---

## Publicar na Vercel

1. Crie uma conta em [vercel.com](https://vercel.com) e conecte o GitHub.
2. **Add New → Project**, escolha este repositório. A Vercel detecta o Next.js; não mude os comandos.
3. Em **Settings → Environment Variables**, crie `NEXT_PUBLIC_SITE_URL` com o endereço final (por exemplo `https://lmbarbearia.com.br`). Ela é usada no sitemap, no Open Graph e nos dados estruturados.
   Quando fotos, horários e textos estiverem aprovados, crie também `NEXT_PUBLIC_ALLOW_INDEXING` = `true` para liberar o Google (sem ela o site fica com `noindex`).
4. Clique em **Deploy**. A cada `git push` na branch principal, a Vercel publica de novo.

### Domínio próprio (depois)

1. Registre o domínio (por exemplo em [registro.br](https://registro.br) para `.com.br`).
2. Na Vercel: **Project → Settings → Domains → Add**, digite o domínio.
3. A Vercel mostra os registros DNS (normalmente um `A` para o domínio e um `CNAME` para o `www`). Cadastre-os no painel do registro.br.
4. Atualize `NEXT_PUBLIC_SITE_URL` para o domínio novo e faça um novo deploy.
5. Cadastre o domínio no [Google Search Console](https://search.google.com/search-console) e envie `https://seudominio/sitemap.xml`. Vale também colocar o link do site no perfil do Google Maps e na bio do Instagram.

---

## SEO local

- Título, descrição e Open Graph em `lib/seo.ts`; imagem de compartilhamento gerada em `app/opengraph-image.tsx`.
- `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, favicon (`app/icon.svg`) e ícone da Apple gerados pelo Next.js.
- Dados estruturados `BarberShop` (schema.org) só com informações verificadas; horários entram quando `hours.confirmed` for `true`.
- Nenhuma promessa de posicionamento: o que mais pesa para "barbearia em Diadema" é o perfil do Google Maps bem cuidado, com fotos e avaliações, apontando para este site.

---

## Estrutura

```
config/site.ts          conteúdo editável (marca, contatos, horários, serviços, fotos, textos)
app/                    layout, página, globals.css (design system), SEO
components/             seções da página
components/booking/     fluxo de agendamento (calendário, horários, etapas)
lib/schedule.ts         datas, horários e fuso de São Paulo
lib/whatsapp.ts         montagem da mensagem e do link wa.me
lib/seo.ts              metadados e dados estruturados
scripts/check-config.mts lista de pendências
```

### Design

A identidade visual é a **escala do degradê**: os fundos sobem em degraus do preto ao grafite, como um skin fade, e os números dos pentes da máquina (#0, #½, #1, #1½, #2, #3) marcam a régua da abertura, o menu e as etapas do agendamento. Cores e fontes estão definidas em `app/globals.css` (Archivo comprimida nos títulos, Manrope no texto). As animações respeitam a opção "reduzir movimento" do aparelho.
