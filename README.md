# Downtown Burger — site

Cinematic, scroll-driven website and working order cart for **Downtown Burger**
("Burguer artesanal feito com qualidade."). Built with Next.js (App Router), React, TypeScript,
Tailwind CSS v4 and GSAP ScrollTrigger.

## Run it

```bash
npm install
cp .env.example .env.local   # optional: set NEXT_PUBLIC_WHATSAPP_NUMBER to go live
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
npm test                     # cart, prices and order-message unit tests
npm run typecheck && npm run lint
```

## What's on the page

1. **Cinematic story** (`src/components/story/CinematicStory.tsx`): one pinned stage with five colour
   fields (red → orange → green → burgundy → teal) that wipe upward while The Bacon Street splits and
   re-stacks, joins the signature lineup and explodes into labelled layers. It has separate desktop and
   mobile choreography (`gsap.matchMedia`). Native scrolling is kept, and the CTAs are always reachable.
   With `prefers-reduced-motion`, a static version (`StaticStory.tsx`) replaces it.
2. **Cardápio** (`src/components/menu/`): all 41 menu items with exact prices; burgers presented as objects,
   drinks on a menu board with dotted leaders. Product sheet with add-ons, the Little Downtown included juice
   (free), required milkshake flavour, notes, quantity, edit mode and a "Ver por dentro" exploded view per burger.
3. **Sacola** (`src/components/cart/CartDrawer.tsx`): edit, remove (with undo), subtotal/total, name and
   notes, an 18+ self-declaration when long necks are in the cart, and the WhatsApp handoff.
4. **Nossa História, Localização/Contato/Instagram, footer** (`src/components/sections/InfoSections.tsx`).
5. **Fullscreen navigation** (`src/components/nav/NavOverlay.tsx`): native `<dialog>`, so Escape, focus
   trapping and focus return are built in.

## Deploy on Cloudflare

The site is a static export (`next build` writes `out/`), so it needs no server.

**Workers (recommended)**: Workers & Pages → Create → Import a repository, then:
- Production branch: `claude/downtown-burger-site` (or the branch you merge into)
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy` (reads `wrangler.jsonc`, which serves `./out`)

**Pages**: Framework preset "Next.js (Static HTML Export)", build command `npm run build`, output directory `out`.

Under *Variables* (build time) set `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits only, e.g. `5511999999999`) and
`NEXT_PUBLIC_SITE_URL` (your final URL, used for the Open Graph image). They are baked in at build, so
redeploy after changing them. Local check of the production output: `npm run preview`.

## Editing content

- **Menu, prices, add-ons, options:** `src/content/menu.ts`. Prices are integer centavos (`4490` = R$ 44,90).
  The UI and the order message read only this file. It's structured so it can be swapped for a CMS fetch.
- **Business facts:** `src/content/restaurant.ts`. Every field that is `null` renders as an
  "Em breve" placeholder. Nothing is invented.
- **Logo:** `src/components/brand/Brand.tsx` holds a faithful digital treatment of the menu badge. Put the
  official vector at `public/brand/logo.svg` and set `OFFICIAL_LOGO = '/brand/logo.svg'` to replace it everywhere.

## Images

All food imagery is **illustrative procedural 3D** rendered offline by `tools/studio` (Three.js in headless
Chromium → sharp → WebP). Each burger is built from its menu description, layer by layer, so its exploded
view contains only its real ingredients. These are not product photographs, and the site labels them "imagem ilustrativa".

```bash
npm run render:assets              # re-render everything into public/renders + src/content/renders.json
node tools/studio/render.mjs preview the-bacon-street   # quick look → tools/studio/out/
```

To use real photography later: replace a product's `image` in `menu.ts`. For the story's exploded view, supply
transparent PNG/WebP layers and update `src/content/renders.json` (each layer has a frame box and anchor).

## Going live checklist

- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER`: until set, checkout runs in demonstration mode.
- [ ] Address, city, hours, maps link, phone, e-mail, Instagram handle (`restaurant.ts`).
- [ ] Official logo vector and, ideally, real product photography.
- [ ] Real brand story (the current copy only uses confirmed positioning).
- [ ] CNPJ/legal details if they should appear in the footer.
- [ ] Delivery fees, delivery area and payment methods: not modelled; the cart says they are agreed with the restaurant.
- [ ] Real age verification for alcohol, if required: the cart only collects a self-declaration.

## QA scripts

`tools/qa/shoot.mjs` (desktop + mobile screenshots of every scene plus an end-to-end cart flow),
`tools/qa/reduced.mjs` (reduced-motion check), `tools/qa/og.mjs` (Open Graph image). They need a running dev server.
