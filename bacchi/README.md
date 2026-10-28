# Bacchi: site institucional e catálogo digital

Novo site da Bacchi Indústria e Comércio de Artefatos de Ferro Ltda. (desde 1937), feito a partir do site atual
(clipsbacchi.com.br) e do PDF "Catálogo Bacchi (novo)". **Ainda não está publicado.** O site atual da Bacchi não
foi alterado.

Next.js 16 (App Router) · TypeScript · Tailwind 4 · GSAP + ScrollTrigger · zod · vitest.

## Páginas

| Rota | O que tem |
| --- | --- |
| `/` | Abertura com o vídeo real do clip, os 13 clips desenhados em escala, capítulo 1937 (preto e branco → cor), as 4 famílias em rolagem lateral, fábrica, mapa de representantes, fechamento |
| `/produtos` | Catálogo com busca (nome ou número: 2/0, 26/6, colchete 9…), filtro por família e acabamento; o filtro fica no endereço (dá para compartilhar) |
| `/produtos/[linha]` | As 13 linhas, cada uma com fotos, especificações, ficha técnica do PDF e o botão "Adicionar" por modelo |
| `/cotacao` | Lista de orçamento (fica salva no navegador), formulário e envio |
| `/representantes` | 34 representações em 27 estados: mapa por estado, lista e busca |
| `/sobre` | História, com os textos e as fotos históricas do site atual |
| `/contato` | Endereço, telefone, WhatsApp, e-mail e formulário |
| `/catalogo-bacchi.pdf` | O PDF do catálogo para baixar |

Também: `sitemap.xml`, `robots.txt`, imagem de compartilhamento (`/og.jpg`), dados estruturados (Organization,
Product sem preço, BreadcrumbList), página 404.

## Rodar

```bash
cd bacchi
npm install
npm run dev          # http://localhost:3000
npm test             # 14 testes: números do catálogo, representantes, cotação
npm run typecheck
npm run lint
npm run build && npm start
```

As imagens já estão em `public/`. Para refazer a partir do site atual: `npm run imagens` (Python 3 com Pillow
e ffmpeg). O script baixa as fotos e o vídeo publicados em clipsbacchi.com.br, converte para WebP/MP4/WebM e
copia `assets/catalogo-bacchi.pdf` para `public/`.

## Envio da cotação e do contato

O envio automático usa o Resend (e-mail). **Sem as variáveis abaixo o site não finge que enviou:** o botão
mostra "Envio automático ainda não configurado" e a pessoa manda o mesmo pedido pelo WhatsApp, por e-mail ou
copiando a lista. Com as variáveis, o pedido chega no e-mail da Bacchi com "responder para" o cliente.

| Variável (na Vercel) | Exemplo |
| --- | --- |
| `RESEND_API_KEY` | chave criada no Resend (nunca no repositório) |
| `COTACAO_REMETENTE` | `Site Bacchi <site@dominio-da-bacchi>` (domínio verificado no Resend) |
| `COTACAO_DESTINO` | `bacchivendas@uol.com.br` (vários: separar por vírgula) |
| `NEXT_PUBLIC_SITE_URL` | endereço final do site, para sitemap e compartilhamento |

Proteções: mesma origem, limite de 5 envios a cada 10 minutos por IP, campo-armadilha para robôs, tempo mínimo
de preenchimento, validação de cada item contra o catálogo, aceite obrigatório. Nada é guardado no servidor.

## Publicar na Vercel (só com autorização)

1. Novo projeto na Vercel, repositório `SportElo0/Hamburgueria`, **Root Directory `bacchi`**, framework Next.js.
2. Variáveis da tabela acima (pode publicar sem o Resend; o site avisa que o envio é pelo WhatsApp/e-mail).
3. Antes de apontar o domínio: rodar os revisores `revisor-seguranca` e `revisor-legal` e ter a aprovação da
   Bacchi nos itens abaixo.
4. Domínio: só quando a Bacchi decidir trocar o site atual. Não mexer no DNS de clipsbacchi.com.br sem ordem.

## Precisa de aprovação da Bacchi

Textos copiados do site atual, que são afirmações da empresa (a Bacchi precisa confirmar que pode comprovar):
- "Sendo a mais antiga e tradicional empresa do setor…"
- "…é hoje a empresa escolhida por todos os mais importantes distribuidores…"
- "Nossos produtos são homologados nas principais empresas e órgãos públicos…"
- "pioneira na produção de clips, alfinetes…"

Dados de contato:
- WhatsApp (11) 95089-2731: tirado do botão do site atual. Confirmar se é o número comercial.
- E-mail bacchivendas@uol.com.br: tirado do PDF (o site atual não mostra e-mail).
- Representantes: os 34 contatos foram copiados do site atual. Corrigi a grafia de algumas cidades (ex.:
  acentos). Só marquei WhatsApp onde o site atual diz que é WhatsApp (DF/GO, ES e RS); os outros números
  aparecem só como telefone.
- Crédito das fotos e vídeos: "Eduardo Sardinha", tirado do nome do arquivo do vídeo no site atual.

Dados de produto:
- Encadernador plástico estendido: o PDF não diz as cores. Aparece "A confirmar".
- Cores dos alfinetes para mapas e dos percevejos coloridos: tiradas da ilustração do PDF.
- Nomes de algumas fotos do site atual dizem 2250 e 1800 unidades; a tabela do PDF diz 2.200 e 1.750. O site usa
  o PDF.

## Fotos que faltam

- Pranchetas: uma foto de cada tamanho (memorando, ofício, meio ofício). Hoje há uma foto das três juntas.
- Embalagens de grampos e alfinetes, e a caixa master (o PDF não traz).
- Legendas e anos das fotos históricas (hoje dizem só "Acervo Bacchi").
- Fábrica atual em Cotia: o site não afirma que as fotos de máquinas são de Cotia, só "fábrica Bacchi".

## Higgsfield (nenhum crédito gasto)

O vídeo da abertura e todas as fotos são reais, do site atual. Se a Bacchi quiser, propostas para aprovar antes de
gastar crédito: (1) vídeo macro de um clip girando em fundo escuro, feito a partir de uma foto real do produto,
para a abertura; (2) passagem de câmera lenta sobre uma caixa de clips aberta. Nada gerado seria apresentado como
foto da fábrica.
