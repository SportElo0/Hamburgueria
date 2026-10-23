# Restaurante Convés Ilhabela — site

Demonstração comercial do site do Restaurante Convés, no Perequê, em Ilhabela (SP): o ambiente à beira
d'água, o cardápio digital transcrito do impresso e solicitações de mesa e de evento.

> **Demonstração aberta, fora do Google.** A prévia em https://conves-ilhabela.vercel.app é pública (sem
> login) para apresentar ao restaurante. Usa duas fotos de clientes publicadas no Google, creditadas e
> marcadas como provisórias, por isso o site continua com noindex. Troque pelas fotos oficiais antes de
> liberar a indexação.

## Como rodar

```bash
cd conves-ilhabela
npm install
npm run dev          # http://localhost:3000
npm run build && npm run start
npm run lint
npm run typecheck
npm run check:config # o que ainda depende do restaurante
```

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, lucide-react e GSAP 3.15 com ScrollTrigger
(licença padrão sem custo). Mesma base dos sites `regiane-camilo/` e LM Barbearia deste repositório.

## As cenas de scroll

Ficam todas em `components/scroll-scenes.tsx`:

1. **Abertura:** a foto panorâmica se aproxima devagar e o texto sobe enquanto a página desce.
2. **Esteira:** duas linhas de onda se desenham na seção "O Convés" e de novo antes do rodapé, com o casco do logo à frente.
3. **Destaques do cardápio:** no desktop, a seção fica presa e os pratos passam na horizontal. No celular,
   o trilho desliza com o dedo.
4. **A travessia:** a cena fica presa na seção "Experiência". A foto do gramado aparece pela faixa entre o telhado e o deck da varanda, com bordas esfumadas, e se abre
   até tomar a tela, com as legendas trocando uma de cada vez.

Com **movimento reduzido** (ajuste do sistema) nada disso roda: as duas fotos aparecem lado a lado,
estáticas, e todo o conteúdo fica visível.

## Cardápio (`data/menu.ts`)

- 74 itens transcritos das fotos do cardápio impresso e do card de pratos promocionais (61 visíveis; as 13 cervejas ficam ocultas). Cada um tem
  categoria, descrição, acompanhamentos, porções (1 pessoa, 2 pessoas, individual), **fonte** e **estado**
  (`confirmado`, `cardapio-fotografado`, `catalogo-digital`, `divergente`, `revisar`).
- A grafia foi normalizada (por exemplo, "champgnom" virou "champignon" e "Belle Muniere" virou "belle
  meunière"). Nomes, ingredientes e acompanhamentos seguem o impresso.
- **Preços:** guardados no arquivo e ocultos no site (`menuSettings.showPrices = false`). O catálogo Kyte
  tem valores diferentes. Depois que o restaurante confirmar, atualize os valores e mude para `true`.
- **Cervejas:** transcritas e ocultas (`showAlcohol = false`). No impresso, os valores ficam meia linha
  acima dos nomes, por isso estão marcadas para revisão.
- **Pratos individuais/promocionais:** estado `revisar`; podem ser só de almoço ou de dias específicos.
- **Destaques da página:** `highlightIds` (hoje: moqueca caiçara, bolinho de sororoca, bobó de camarão,
  salmão marroquino).

Para adicionar um prato, copie um item, mude o `id`, preencha os campos e o `status`. Ele aparece na
busca e na categoria certa automaticamente.

## Reservas e eventos

- O site **não** confirma mesa: monta a solicitação (nome, data, horário de preferência, pessoas,
  observações), mostra um bilhete para revisão e leva ao canal do restaurante.
- Hoje o canal é **ligação** para (12) 3896-2058, mais **copiar mensagem**. Para ativar o WhatsApp
  depois que o restaurante confirmar o número, preencha em `config/site.ts`:

  ```ts
  whatsapp: { number: "551238962058", display: "(12) 3896-2058" },
  ```

  Os botões passam a abrir `https://wa.me/<número>?text=<mensagem>` (com `encodeURIComponent`).
- Datas passadas ficam bloqueadas. No dia de hoje só aparecem horários futuros. Os horários sugeridos
  ficam em `site.reservation.times`: ajuste aos horários reais.
- O pedido de evento só solicita informações. Capacidade, pacotes e valores não aparecem.

## O que atualizar em `config/site.ts`

| Campo | Para quê |
|---|---|
| `photos` | Trocar as fotos (arquivo em `public/fotos/`, `alt`, `credit`, `provisional: false`). |
| `gallery` | Recortes da galeria (foto, foco, ampliação, legenda). |
| `hours` | Horários, quando confirmados (hoje: "Consulte pelo telefone"). |
| `rating` | Nota e total do Google com data de conferência (hoje: só o link). |
| `whatsapp` | Canal de reserva por WhatsApp (hoje: `null`). |
| `demo` | `false` quando o site deixar de ser demonstração. |

## Publicação na Vercel

Projeto separado, com **Root Directory = `conves-ilhabela`**. A proteção por login da Vercel foi
desligada para a demonstração; enquanto usar fotos de terceiros, mantenha `NEXT_PUBLIC_ALLOW_INDEXING`
desligada.

| Variável | Para quê |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Endereço público (canonical, sitemap, Open Graph). |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `true` libera o Google; só depois da aprovação e das fotos oficiais. |

## Pendências com o restaurante

Rode `npm run check:config`. Em resumo:

1. Fotos oficiais (ambiente e pratos) e autorização de uso.
2. Arquivo original do logotipo (o site usa uma versão tipográfica provisória com o casco).
3. Cardápio e preços atuais (impresso × Kyte), cervejas e pratos promocionais.
4. Horários de funcionamento e horários de reserva.
5. Se (12) 3896-2058 atende WhatsApp para reservas.
6. Nota e número de avaliações do Google, com data.
7. Informações de eventos (o que pode ser divulgado).
8. Se a pizzaria napolitana citada no Instagram faz parte do cardápio.
