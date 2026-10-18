# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + Motion, as named in the brief. Hosting delegated: portable Node deploy, Vercel-ready. Persistent data goes through a storage adapter (local filesystem driver for development/Node hosting; Vercel Blob driver for serverless). AI provider: OpenAI Images API (server-side only), behind a provider interface. Admin: custom password-protected panel.

## Users

1. **Collectors and enthusiasts** looking to buy a classic Mercedes-Benz. They browse slowly, often on a phone, and want to judge whether a specific car is worth a conversation.
2. **Owners of classic cars** who want to restore, repaint or refinish their car and need confidence before requesting an evaluation.
3. **The owner/operator** (Mercantil), who updates vehicles, statuses and answers requests without programming.

## Product Purpose

MERCANTIL is a digital showroom for a collection of classic Mercedes-Benz cars in different stages of preparation and restoration, plus the restoration services. Success = qualified WhatsApp conversations about a specific car (Journey A) and evaluation requests from owners (Journey B), including requests that start from an AI concept in MERCANTIL VISION.

## Positioning

A real, small collection of Mercedes classics shown honestly by stage of work, from the same hands that restore them, with a tool that lets an owner see a concept of their own car's next chapter before talking to the atelier.

## Operating Context

- Commercial conversations happen on WhatsApp. No checkout, no online prices; "Valor sob consulta".
- The owner also publishes on Instagram as Lelo Imports, where many posts are labeled "Conteúdo de IA" (two-tone colour proposals called "saia e blusa"). These are concepts, never evidence of stock or finished work.
- Restoration stage and commercial availability are independent facts and must never be conflated.

## Capabilities and Constraints

- Catalog of 9 vehicles (see brief); years are approximate and pending validation; prices unpublished without approval.
- AI visualization requires an OpenAI API key with credits (not a ChatGPT subscription). Without it, the UI must state generation is unavailable; never show a pre-made image as a result.
- Uploads/contact data stored only with explicit consent; temporary files deleted per retention policy.
- Undecided: official WhatsApp number, e-mail, address, confirmed service list, team/facility photos, founding facts.

## Brand Commitments

- Name: MERCANTIL (primary). "Lelo Imports" only as commercial signature after confirmation.
- Positioning line: "Automóveis que atravessam gerações." Editorial concept: "A história continua."
- Hero lines pinned by the brief: "Clássicos com história." / "Acervo de automóveis clássicos e projetos de restauração." / CTAs "Explorar acervo", "Restaurar meu carro".
- Brief-suggested palette: #090A0B, #17191C, #101A28, #E8E1D5, #AAB0B7, #562C32 (navy and wine tied to the W111). Avoid excessive gold and luxury clichés.
- Editorial serif display + highly legible sans for UI.

## Evidence on Hand

- `public/media/charuto/` — one real photograph of the 1966-ish Mercedes-Benz 250 SE Coupé W111 "Charuto" (navy, light roof, red interior), plates must be hidden.
- One AI-generated concept image of the Charuto in a dark showroom: illustrative only, never proof of restoration or of a real space.
- No real photos yet of the other 8 vehicles, restoration processes, workshop, team, or before/after pairs. Do not fabricate any of these; use clearly labeled placeholders.
- No testimonials, numbers of restorations, years of experience or certifications.

## Product Principles

1. Truth over spectacle: every image is labeled as real photograph or illustration/simulation.
2. The car is the protagonist; interface recedes.
3. Explore, interact, imagine: visitors act, not just look (inherited principle from the owner's previous sites: each has one signature interaction that carries choices into a pre-filled WhatsApp message).
4. Stage of work ≠ commercial status, always displayed separately.
5. Mobile-first performance; motion communicates, never decorates.

## Accessibility & Inclusion

WCAG 2.2 AA: contrast, keyboard operation (including slider alternatives), prefers-reduced-motion, visible focus, labeled forms. Portuguese (pt-BR).
