# Bolos e Doces Regiane Camilo — site

Site de apresentação e pedidos da confeitaria da Regiane Camilo, em São Sebastião (SP).
Mostra os bolos reais publicados no Instagram [@re.camilo](https://www.instagram.com/re.camilo/)
e monta um **pedido de orçamento** que a cliente envia pelo WhatsApp (12) 99625-8593.

> **Demonstração.** Enquanto a proposta não for contratada, o site se identifica como
> demonstração no rodapé (`site.demo`) e fica fora do Google (sem `NEXT_PUBLIC_ALLOW_INDEXING`).

## Como rodar

```bash
cd regiane-camilo
npm install
npm run dev          # http://localhost:3000
npm run build        # build de produção
npm run start        # serve o build
npm run lint
npm run typecheck
npm run check:config # lista o que ainda depende da Regiane
```

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · lucide-react · next/font · next/image.
Sem banco de dados, login ou pagamento: o pedido termina no WhatsApp da cliente.

## O que tem na página

| Seção | O que faz |
|---|---|
| Linha superior + cabeçalho | Assinatura "Regiane Camilo", menu (Início, Nossos Bolos, Personalize, Galeria, Sobre, Contato) e botão **Fazer encomenda**. Menu de tela cheia no celular. |
| Abertura | Título, subtítulo, **Encomendar meu bolo** / **Conhecer nossos bolos**, atalhos de ocasião (já abrem o pedido preenchido) e a foto do bolo de morangos com "Quero um parecido". |
| Nossos bolos | Cards de estilo com recorte de detalhe da foto. Tocar filtra a galeria. |
| Galeria | Bolos reais com filtro por estilo. Cada bolo abre uma ficha (foto grande, descrição, valor "Consultar orçamento", tamanhos/sabores "a combinar", setas, deslize, Esc) com **Quero um bolo parecido**. |
| Personalize (pedido) | 5 etapas: ocasião → estilo → detalhes → data e nome → conferir e enviar. O **convite** ao lado se preenche ao vivo e vira a mensagem do WhatsApp. |
| Sobre | Texto provisório (marcado como tal) e o selo original da marca. |
| Instagram | Recortes das fotos + **Ver no Instagram** (sem feed automático). |
| Contato | Endereço (fonte: Instagram), WhatsApp, Instagram, **Como chegar** (Google Maps) e mapa que só carrega quando pedido. |
| Rodapé | Chocolate com borda em ondinhas, navegação, contato e o aviso de demonstração. |

### O pedido pelo WhatsApp

- Não aceita datas passadas nem "hoje" (antecedência mínima em `site.order.minDaysAhead`), nem datas a mais de um ano.
- Não mostra disponibilidade: a data e o valor são confirmados pela Regiane.
- Só pede o primeiro nome. O telefone não é necessário, porque a mensagem sai do WhatsApp da própria cliente.
- A mensagem é montada só com o que foi preenchido e codificada com `encodeURIComponent` em
  `https://wa.me/5512996258593?text=…` (`lib/order.ts`).
- Depois do clique, o site diz que a mensagem está pronta e que **o pedido ainda não está confirmado**.

## Como atualizar

Tudo fica em **`config/site.ts`**.

- **Trocar uma foto:** coloque o arquivo em `public/fotos/` e ajuste `src`, `width`, `height` e `alt`
  no objeto `photos`. `focus` define o enquadramento (ex.: `"50% 40%"`) e `detail` o recorte usado
  nos cards de estilo. Quando chegar a foto original, mude `fromScreenshot` para `false`.
  Dica: se a foto nova tiver o mesmo nome da antiga, apague `.next/cache/images` antes de testar.
- **Adicionar um bolo:** acrescente um item em `products` (copie um existente). Campos:
  `id`, `name`, `style`, `description` (só o que aparece na foto), `photo`, `price` (`null` mostra
  "Consultar orçamento"), `sizes`, `flavors`, `fillings`, `customization`, `availability`, `notes`, `featured`.
  O bolo aparece na galeria, no filtro do estilo e na etapa "Estilo" do pedido.
- **Remover um bolo:** apague o item de `products`.
- **Adicionar preço, tamanhos ou sabores:** preencha os campos do bolo. A ficha passa a mostrar o valor e as listas.
- **Estilos/categorias:** edite `styles` (nome, texto curto e foto de capa).
- **WhatsApp, Instagram, endereço:** `site.whatsapp`, `site.instagram`, `site.address` e `site.links`.
- **Horário:** preencha `site.hours` (texto) quando a Regiane confirmar.
- **Textos da abertura e do Sobre:** `site.hero` e `site.about` (mude `about.draft` para `false` após a aprovação).

Visual (cores, fontes, botões) fica em `app/globals.css`. Regras de design em `DESIGN.md`.

## Publicação na Vercel

Projeto independente nesta subpasta. Na Vercel, use **Root Directory = `regiane-camilo`**.

Variáveis de ambiente:

| Variável | Para quê |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Endereço público (canonical, sitemap, Open Graph). Padrão: `https://regiane-camilo.vercel.app`. |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `true` libera o Google. Só depois da aprovação e com `site.demo = false`. |

Não aponte nenhum domínio oficial da confeitaria sem autorização da Regiane.

## SEO local

Título e descrição com "bolos personalizados em São Sebastião", Open Graph com a foto do bolo de morangos,
`sitemap.xml`, `robots.txt`, `manifest`, ícones e dados estruturados `Bakery` (nome, endereço, WhatsApp,
Instagram e os bolos). Sem horário, preço ou avaliações inventados.

## Pendências com a Regiane

Rode `npm run check:config` para a lista atualizada. Hoje:

1. Fotos originais em boa resolução (as atuais são capturas do Instagram; a de laços é uma miniatura de vídeo).
2. Confirmar quais estilos/categorias ela oferece.
3. Preços, tamanhos, sabores e recheios (até lá: "Consultar orçamento" / "a combinar").
4. Antecedência mínima para encomendas e horário de atendimento.
5. Revisão do texto "Sobre" (e, se quiser, uma foto dela).
6. Como funcionam retirada e entrega.
7. Depoimentos reais autorizados, se ela quiser uma seção de avaliações (hoje não existe nenhuma no site).
8. Arquivo original do logotipo (o selo foi recortado da foto de perfil).
