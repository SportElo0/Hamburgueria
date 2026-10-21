---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

# Surface: home (single-page site) — LM Barbearia

Scope: the whole public site at `/` (header, hero, serviços, cortes, sobre, agendamento, avaliações, localização, FAQ, footer). Visitor mode: **Persuade**.

Audience/job: neighborhood clients on a phone (often from Instagram or Google Maps) who want to see the cuts, pick a service, and send Leonardo a booking request on WhatsApp. Proof: real cut photos (pending; placeholders now), Google 5,0 / 16 avaliações at capture time. Constraints: no invented prices, durations, bios, testimonials; booking is a request, never a confirmation; hours provisional from Instagram.

Build path: code-led (no image generation available). Roll ran degraded (no challengers, no quality-bar boards).

## Direction contract

THESIS: The site is cut like a skin fade. Clipper-guard numbers (#0, #½, #1, #1½, #2, #3) are the measuring system, and grounds step in hard tonal bands from deep black to graphite, the way a fade climbs the head. Refuses the category default: black-and-gold "luxury barber" page with a centred headline over three equal service cards.

OWN-WORLD: Pinned palette: #0B0C0E base, #17191D graphite, two intermediate steps between them and one above, warm white #F5F2ED ink, metallic #A6A8AD secondary, blue #436BD9 only for actions and selection, a barber-pole red used as a 2px detail at most. Hard-edged stepped bands (never smooth gradients), 1px hairlines, near-square corners (2–4px, blade-precise). Display: Archivo at condensed width, heavy, uppercase. Body/UI: Manrope. Tabular numerals for times and dates. Guard tags are small condensed labels like "#1½".

STORY: Visitor sees a real cut and a confident line, understands this is Leonardo's chair in Campanário, browses services and cuts, then builds a request (service → date → preferred time → name → review) and opens WhatsApp with the message ready; the site says plainly that Leonardo confirms.

FIRST VIEWPORT: Full-bleed cut photo (placeholder field until supplied). From the bottom, five opaque stepped bands rise over it like a fade; a vertical guard ruler on the right labels each band #0 → #3. "O ESTILO COMEÇA NO DETALHE." sits on the bands, bottom-left, ~56px mobile / up to 6rem desktop. Below it the subtitle, then a working service picker (chips: Corte, Barba, Corte + Barba, Sobrancelha, Navalha) that jumps into the booking flow preselected, plus "Agendar meu horário" (blue, primary) and "Conhecer os cortes" (ghost). Header on top: LM wordmark left, links + "Agendar" right; compact menu on mobile.

FORM: Guard-scale fade system, candidate 1 of my grounded list (user picked my top candidate over the assigned #3 "porta de aço"). Signature interaction: the bands "cut" upward on load in a 600ms stagger, and the booking progress is a six-step guard scale that fills band by band. Motion grammar: transform/opacity/clip-path, ease-out-expo, content visible by default, reduced-motion = static. seed:1f94b60369935e28

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Real photos (hero, gallery, Leonardo portrait), logo file, prices, confirmed hours.
