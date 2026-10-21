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

- Name: LM Barbearia (also "Leonardo Miguel Barbearia"). Logo: circular badge with serif "LM", "BARBEARIA", "LEONARDO MIGUEL", crossed comb, razor and scissors, "DESDE 2024" on the badge.
- Client-pinned palette: deep black #0B0C0E, graphite #17191D, warm white #F5F2ED, metallic gray #A6A8AD, accent blue #436BD9; minimal barber-pole red and blue details allowed, never overdone.
- Premium but authentic: a neighborhood barbershop, not a fictional luxury brand.
- Voice: Brazilian Portuguese, direct, warm, close ("do seu jeito").

## Evidence on Hand

- Google Maps capture: 5.0 stars, 16 reviews at the time of capture (not dynamic, must cite Google and the capture context).
- Instagram capture: 33 posts, flyer listing services and WhatsApp (11) 91339-2818, photos of fades, a beard trim, curly top, freestyle design.
- No original high-resolution photos supplied yet; no photo of Leonardo. Placeholders must be clearly marked as temporary.
- No individual testimonials authorized. Do not fabricate testimonials, years of experience, certifications, biography, prices, or results.

## Product Principles

1. The work is the proof: photos of real cuts lead, words support.
2. Honest booking: a request, never a promise; the barber confirms.
3. One tap to Leonardo: every path ends in a clear WhatsApp action.
4. Owner-editable: facts live in config, not in components.
5. Phone first: built for one-handed use on iPhone and Android.

## Accessibility & Inclusion

Respect prefers-reduced-motion, keyboard navigation with visible focus, WCAG AA contrast on the dark ground, comfortable touch targets (≥44px).
