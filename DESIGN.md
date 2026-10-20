# Design — Villa Verano

<!-- impeccable:design-schema 1 -->

## World

Dark, cinematic, Persuade-mode. The subject is a Paraty colonial doorway, not a stock travel-site hero: a hand-drawn SVG arch — whitewashed jamb, a painted trim band, two swung-open shutters — sits fixed at the center of the hero, and the scene visible through it changes as the visitor clicks, swipes, or lets it autoplay. The rest of the page carries the same world forward: near-black ground, full-bleed real photography, no boxed cards.

## Palette

- `--ink` `#0a0908` — page ground.
- `--ink-raised` `#15120f` — the gallery section's slightly lifted ground.
- `--paper` `#f5f2ec` / `--paper-mute` `#c9c2b6` — text on dark.
- `--accent` `#f6b429` (`--accent-deep` `#d99412` on hover) — the pousada's own ochre-yellow, sampled from the real facade photo. One accent, used consistently: eyebrows, the door's trim band, dots, CTA buttons, line-icon strokes.
- Door shutters: a fixed deep teal `#1e3a44` (`#142a32` for its linework) — a second, non-accent color reserved only for the door, so the shutters read as a material (painted wood) rather than UI chrome.

## Type

- Display: **Space Grotesk** (`--font-display`), geometric sans, weights 500/600/700 — titles, the eyebrow labels, the scene counter.
- Body: **Inter** (`--font-sans`), weights 400/500/600.
- Both loaded via `next/font/google` in `src/app/layout.tsx`; no hosted stylesheet.

## Signature interaction — the Portal (`src/components/Portal.tsx` + `src/components/Door.tsx`)

The door's opening is a real SVG `<clipPath>`; the active scene's photo lives inside the same `<svg>`, clipped to it, so frame and photo can never drift apart at any size — a single `viewBox` is the source of truth, CSS only scales the box.

Navigating (click the door, the arrow/dot controls, `←`/`→` keys, or a horizontal swipe) runs a ~1.4s GSAP timeline: the door scales up (~0.65s) until its opening fills the viewport — the current scene's photo becomes the whole screen — then the background crossfades to the next scene and the door's own photo swaps (both invisible at that scale), then the door scales back down (~0.55s) now showing the new scene, and the text block (which faded out at the start) fades back in with the new scene's copy. Autoplay advances every 7s, paused on hover, focus, or touch. `prefers-reduced-motion` replaces the whole timeline with a plain opacity crossfade — no scale, no "camera" move.

Mouse parallax on the photo inside the door runs via `gsap.quickTo`-style tweens on a forwarded ref to the SVG's inner `<g>`, never through React state, so it costs no re-renders.

Accessibility: the door is a real `<button aria-label="Próximo lugar: …">`; the active scene's title sits in an `aria-live="polite"` region; focus rings are visible (`globals.css`'s `:focus-visible`, never suppressed).

## Photography

Four real photos (`public/images/*-graded.jpg`), one consistent treatment applied once by `scripts/grade-photos.mjs` (sharp: mild saturation/contrast lift, a warm-amber overlay blended with `soft-light` — not `.tint()`, which desaturates toward a duotone — plus a soft radial vignette). Source files stay in `public/images/*.jpg` for reference; only the `-graded` output ships on the page.

## Page structure

Portal (hero) → Quartos (each room: one big edge-to-edge photo + its data beside it, alternating sides) → Comodidades (two-column list, thin-stroke line icons from `src/components/icons.tsx`, no emoji) → Galeria (click opens `src/components/Lightbox.tsx`, a fullscreen viewer with arrows, swipe, and Escape) → Localização (address + embedded map) → closing CTA. A sitewide fixed WhatsApp bar (`src/components/MobileWhatsappBar.tsx`) sits at the bottom on mobile only; every other section's bottom chrome keeps clear of it.

## What a future surface should keep

The one-accent-on-near-black palette, Space Grotesk/Inter, full-bleed real photography with no card chrome, and the door-as-signature-motif if more pages are added (e.g. a repeated small door glyph as a section divider) — never a second unrelated hero treatment competing with the portal.
