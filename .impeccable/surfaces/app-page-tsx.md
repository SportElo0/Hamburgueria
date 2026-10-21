---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

# Surface: home (single-page site) — LM Barbearia · redesign

Scope: the whole public site at `/`. Visitor mode: **Persuade**. Replaces the rejected dark "escala do degradê" world (v1, kept on branch claude/lm-barbearia-website-4gcw05).

Audience/job: neighborhood clients on a phone, coming from Instagram/Google Maps, who want to see Leonardo's cuts and send a booking request on WhatsApp; Leonardo judges the first impression. Proof: real photos of his cuts (public/fotos), Google 5,0 / 16 avaliações (21/10/2026). Constraints: no invented prices, durations, promotions, client counts, bios; booking is a request confirmed by Leonardo; hours provisional (Instagram).

Build path: code-led (no image generation). Roll ran degraded (no challengers, no quality-bar boards). Direction is brief-pinned by the client's reference image (MANE Barbershop mockup), palette and type.

## Direction contract

THESIS: A light, editorial barbershop page where Leonardo's real photographs carry all the colour (the red-white-blue capes, the hard part lines) on a quiet off-white page, and a single champagne hairline, "a risca", is the one recurring gesture: it draws under the headline and section titles like the part line in the photos. Refuses the dark gamer-barbershop look and the SaaS page of icon cards.

OWN-WORLD: Background #F9F8F5, white #FFFFFF panels, ink #141414, graphite #343434, borders #E9E6E0, champagne #AD936E only for rules, stars and icons; darker champagne #8C7350 for the large accent word and #7A6243 for small champagne text. One ink (#141414) feature band (About). Libre Caslon Display for headlines (Cormorant Garamond was tried first, as the client suggested, and dropped because its é/ê/ú accents sit off their letters in Portuguese); Libre Caslon Text italic only for the signature, Manrope for text and small tracked uppercase UI (never below 13px on phones). Square-cornered buttons (black fill / 1px black outline), 1px hairlines, no shadows, no gradients except the photo-to-ground fade in the hero. A typographic LM seal echoes the shop's real circular logo.

STORY: The visitor sees a real fade and "Seu estilo. Nossa precisão.", understands this is Leonardo's chair in Campanário, scrolls through photo service cards and an editorial portfolio, meets Leonardo in the dark band, and books in three compact steps (serviço → data e horário → nome e envio) that open WhatsApp with the message ready; the site says plainly Leonardo confirms.

FIRST VIEWPORT: Black top bar ("Agende seu horário pelo WhatsApp · (11) 91339-2818"). Header: LM monogram left, nav centred, black "Agendar" right. Desktop hero: left 5/12 on off-white with a short location line, the two-line serif headline at up to 6rem with "precisão." in champagne (upright), the champagne risca, one-line subtitle, black "Agendar horário" + outline "Ver serviços", and the real Google rating; right 7/12 the low-fade photo bleeding to the viewport edge and full hero height, fading into the ground on its left edge. Mobile: the photo first at full width (4:5) fading into the ground, headline overlapping the fade, buttons full width.

FORM: Brief-pinned editorial direction (client reference), not from my ordered list; the roll assigned my candidate 5 (the striped barber cape), translated as: the capes inside the real photos are the only saturated colour on the page, no added stripe decoration. Signature interaction: the risca hairline drawing in (scaleX) on load and on scroll; hero photo reveals with a clip from the right and a slow scale-down. Motion: opacity/transform/clip-path, ease-out-expo, content visible without JS, reduced-motion static. seed:952a91984c3bc693

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Client-pinned exceptions

- The short location line above the hero H1 stays: the client's brief explicitly asks for it ("Pequeno texto superior"). It is the only label above a heading on the page.

## Unresolved

- High-resolution originals for the five small Instagram crops; a usable photo of the shop interior; original logo file; prices; confirmed hours.
