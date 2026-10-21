# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, lucide-react for icons, Motion only where an animation is justified, next/image for images. Pinned by the client brief; hosting target is Vercel.

## Users

Men and boys (and parents booking for their sons) living or working around Campanário, Diadema – SP. They arrive mostly on a phone, often from Instagram (@lm_barbearia130) or Google Maps, wanting to see whether the cuts are good, what services exist, where the shop is, and to ask for a time slot without calling.

Secondary audience: Leonardo Miguel himself, who will judge the site the first time he opens the link and later needs to edit hours, prices, and photos without touching components.

## Product Purpose

Website for LM Barbearia, a one-chair neighborhood barbershop run by Leonardo Miguel. It shows the work, lists services, and turns intent into a WhatsApp booking request. Success: a visitor finds a service, picks a desired date and preferred time, reviews it, and opens WhatsApp with a ready-written request in under a minute.

## Positioning

The barber is the brand: one professional, Leonardo Miguel, whose skin fades, designs (freestyle) and razor finishing are visible in his own photos. Booking goes straight to his WhatsApp, not to a booking marketplace.

## Operating Context

- No real-time agenda. Every booking is a request that Leonardo confirms on WhatsApp. The site never claims availability or a confirmed reservation.
- WhatsApp deep link: `https://wa.me/5511913392818?text=` with an `encodeURIComponent` message. App on mobile, WhatsApp Web on desktop.
- Address: Rua Cotovia, 130 — Campanário, Diadema — SP, 09931-530.
- Instagram: @lm_barbearia130.

## Capabilities and Constraints

- Services confirmed (from the shop's own flyer): Corte masculino, Barba, Sobrancelha, Acabamento na navalha. Corte + Barba requested by the client for the site.
- Other services appear on the Google profile (e.g. alisamento, barba com navalha); not confirmed, not shown.
- Prices: unknown. Hidden until the owner provides them; cards say the value is given on WhatsApp.
- Durations and promotions: unknown; never invented.
- Hours: sources diverge. Provisional value from Instagram (Tue–Sat 10:00–20:00, Sun 10:00–16:00, Mon closed); Google showed "closes 19:00" for one day. Must be confirmed by the owner before publishing. All hours live in one config file.
- Everything editable lives in a central config (brand, WhatsApp, Instagram, address, hours, services, prices, photos, links, review data).

## Brand Commitments

- Name: LM Barbearia (also "Leonardo Miguel Barbearia"). Logo: circular badge with serif "LM", "BARBEARIA", "LEONARDO MIGUEL", crossed comb, razor and scissors, "DESDE 2024" on the badge. Original logo file not supplied yet.
- Visual direction (client-pinned, Oct 2026 redesign; the first dark version was rejected): contemporary premium barbershop, editorial, minimal, sophisticated, light. Reference image: "MANE Barbershop" mockup (aesthetic reference only, never copied literally; its "10% off" offer, "1K+ clients", price list and claims do not belong to LM).
- Client-pinned palette: background #F9F8F5, white #FFFFFF, black #141414, graphite #343434, champagne #AD936E (details), borders #E9E6E0. One graphite/dark feature section allowed. Avoid all-dark pages, SaaS cards, flashy gradients, heavy rounding, oversized icons, exaggerated motion.
- Client-pinned type: elegant serif for headlines (Cormorant Garamond suggested) + clean sans for text (Inter or Manrope). No tiny type on mobile.
- Hero headline chosen by the client: "Seu estilo. Nossa precisão."
- Premium but authentic: a neighborhood barbershop, not a fictional luxury brand.
- Voice: Brazilian Portuguese, direct, warm, close ("do seu jeito").

## Evidence on Hand

- Google Maps capture: 5.0 stars, 16 reviews at the time of capture (21/10/2026; not dynamic, must cite Google and the capture date).
- Real photos of Leonardo's work in `public/fotos/`, cropped from screenshots the client supplied of the shop's own Google Business photos (posted by "Leonardo Miguel" / "LM Barbearia") and Instagram posts (@lm_barbearia130). Four are ~760×890 px (low fade with risca, risca lateral, desenho na nuca, risca em cabelo descolorido); five are small Instagram crops upscaled 2× (barba, Leonardo atendendo, cacheado, degradê social, low fade infantil). Originals in high resolution are still pending from the owner.
- Several photos show children and teenagers; the client confirmed they may be used because the shop already published them.
- Only one photo shows Leonardo himself (small Instagram crop). No photo of the shop interior in usable resolution.
- No individual testimonials authorized. Do not fabricate testimonials, client counts, years of experience, certifications, biography, prices, promotions or results.

## Product Principles

1. The work is the proof: photos of real cuts lead, words support.
2. Honest booking: a request, never a promise; the barber confirms.
3. One tap to Leonardo: every path ends in a clear WhatsApp action.
4. Owner-editable: facts live in config, not in components.
5. Phone first: built for one-handed use on iPhone and Android.

## Accessibility & Inclusion

Respect prefers-reduced-motion, keyboard navigation with visible focus, WCAG AA contrast (champagne is too light for small text on the off-white ground; use a darker champagne for text), comfortable touch targets (≥44px).
