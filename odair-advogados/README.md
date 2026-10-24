# Odair Alves da Silva & Advogados — site institucional

Demonstração comercial do site do escritório Odair Alves da Silva & Advogados, com atuação no Estado de São
Paulo: o escritório, as cinco áreas de atuação (cada uma com página própria), a organização do atendimento,
conteúdos jurídicos, perguntas frequentes e contato.

> **Demonstração não oficial.** Link aberto, fora do Google (noindex), com aviso discreto no topo e no rodapé.
> Os textos institucionais são provisórios e precisam da aprovação do Dr. Odair antes de qualquer publicação
> oficial (Código de Ética e Disciplina da OAB e Provimento 205/2021).

## Como rodar

```bash
cd odair-advogados
npm install
npm run dev          # http://localhost:3000
npm run build && npm run start
npm run lint
npm run typecheck
npm run check:config # o que ainda depende do escritório
```

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, lucide-react, next/image e next/font (Bodoni Moda
nos títulos, Manrope no texto). Nenhuma biblioteca de animação: o movimento é CSS (animações ligadas ao scroll
onde o navegador suporta) e as transições entre páginas usam o `<ViewTransition>` do React.

## Identidade: "a certidão"

O site se apresenta como um documento autenticado do escritório: guilhochê fino, selo e monograma.

- **Logotipo:** recortado da imagem enviada, sem redesenho (`public/marca/`): monograma, nome e assinatura
  completa, em dourado (fundos escuros) e marinho (fundos claros). O script `scripts/recortar-logo.py` refaz os
  recortes. **Quando chegar o arquivo vetorial original**, substitua os PNGs mantendo os nomes (ou ajuste
  `brand` em `config/site.ts`).
- **Guilhochê:** rosetas e faixas desenhadas em SVG por fórmula (`lib/guilloche.ts`). Cada área tem a sua
  roseta (`rosette` em `data/areas.ts`).
- **Abertura com scroll (GSAP ScrollTrigger, `components/scroll-scenes.tsx`):** o escritório ao fundo e o selo
  do monograma; a cena fica presa e as cinco áreas entram uma de cada vez enquanto a foto se aproxima e o selo
  gira. O índice ao lado (desktop) e os traços no topo (celular) mostram em que área se está. Com movimento
  reduzido, as áreas aparecem em lista logo abaixo, sem cena presa.
- **Outros movimentos:** a roseta da abertura se grava anel a anel; o fio da linha do tempo se preenche ao entrar
  na tela; a roseta de cada área "viaja" até a página da área.

### Foto da abertura

Hoje é **ilustrativa** (gerada por IA, sem pessoas) e aparece marcada como "Imagem ilustrativa". Ela é baixada no
build pelo script `scripts/baixar-foto.mjs` (roda sozinho antes de `next build`). Para trocar pela foto real do
escritório: coloque o arquivo em `public/fotos/`, aponte `heroPhoto.src` para ele em `config/site.ts`, use
`remote: null` e `illustrative: false`.

## Onde mudar cada coisa

| Arquivo | O quê |
|---|---|
| `config/site.ts` | Nome, responsável, OAB, telefone, WhatsApp, e-mail, endereço, cidade, redes, foto, `demo`. |
| `data/areas.ts` | As cinco áreas: nome, resumo, assuntos, informações gerais, perguntas, legislação, SEO. |
| `data/articles.ts` | Conteúdos jurídicos (título, resumo, roteiro, conteúdo, autor, datas, fontes, situação). |
| `components/about.tsx` | Texto do escritório (provisório). |
| `components/approach.tsx` | Etapas do atendimento (provisórias). |
| `components/faq.tsx` | Perguntas frequentes da página inicial. |
| `app/privacidade/page.tsx` | Minuta da política de privacidade. |

Campos `null` em `config/site.ts` aparecem como "a confirmar"/"a informar" e nunca são preenchidos com dados
fictícios. **WhatsApp confirmado: (11) 99751-9752.** Os botões "Falar no WhatsApp" abrem a conversa com a
mensagem neutra: "Olá, gostaria de obter informações sobre o atendimento do escritório Odair Alves da Silva &
Advogados." (nas páginas de área, com o nome da área).

### Publicar um artigo

Em `data/articles.ts`, escreva `content` (lista de parágrafos), preencha `author`, `publishedAt`, `updatedAt`
(AAAA-MM-DD) e `sources`, e mude `status` para `"publicado"`. Rascunhos ficam fora do sitemap e com noindex.

## Formulário de contato

Pede só nome, e-mail ou telefone, área (opcional) e mensagem breve. A validação acontece no servidor
(`app/actions/contact.ts`). **Nada é gravado.** Com `site.contactDelivery = "whatsapp"`, o formulário monta a
mensagem, mostra para revisão e o botão "Enviar pelo WhatsApp" abre a conversa com o escritório. Com `null`, volta
ao modo demonstração (confere e não envia).

## Publicação na Vercel

Projeto separado com **Root Directory = `odair-advogados`**. Endereço da demonstração:
`odair-advogados.vercel.app` (sem domínio do escritório).

| Variável | Para quê |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Endereço público (canonical, sitemap, Open Graph). |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `true` libera o Google; só depois da aprovação e dos dados confirmados. |

## Pendências com o escritório

Rode `npm run check:config`. Em resumo:

1. Número de inscrição na OAB (e da sociedade, se houver).
2. Telefone fixo, e-mail, endereço e cidade da sede (o WhatsApp já está configurado).
3. Foto profissional autorizada do Dr. Odair (opcional; hoje a abertura usa o monograma).
4. Arquivo vetorial original do logotipo.
5. Aprovação dos textos: escritório, áreas, abordagem, perguntas frequentes e política de privacidade.
6. Encarregado de dados (LGPD).
8. Foto real do escritório para a abertura (hoje ilustrativa).
7. Redes sociais, se houver.
