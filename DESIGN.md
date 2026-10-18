---
name: MERCANTIL
description: A living factory brochure for one collection of classic Mercedes-Benz cars. Photographs sit on night plates, text sits on ivory paper, and a colour sample chip is the control.
colors:
  night: "#090a0b"
  graphite: "#17191c"
  navy: "#101a28"
  navy-deep: "#0b121c"
  ivory: "#e8e1d5"
  paper: "#ece6db"
  ink: "#141518"
  ink-soft: "#4a4640"
  silver: "#aab0b7"
  mist: "#858b93"
  wine: "#562c32"
  wine-hi: "#6c3941"
  wine-soft: "#c9a1a6"
  line-dark: "rgb(232 225 213 / 0.14)"
  line-light: "rgb(20 21 24 / 0.16)"
  error-line: "#e0868f"
  error-soft: "#f0a2aa"
  error-ink: "#8c2633"
typography:
  wordmark-hero:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "15.2vw (phone) / min(15.8vw, viewport-fitted) (wide)"
    fontWeight: 400
    lineHeight: 0.8
    letterSpacing: "0.005em"
    fontVariation: "\"opsz\" 96"
  display-page:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.75rem, 7.2vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  headline-statement:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.5rem, 5.2vw, 4.75rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline-section:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.25rem, 5vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  title-sub:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(1.5rem, 2.4vw, 2.125rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1.5vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "\"kern\", \"liga\""
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.01em"
  caption:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0.01em"
rounded:
  swatch: "2px"
  chip: "3px"
  field: "4px"
  sheet: "1.75rem"
  pill: "999px"
spacing:
  gutter: "clamp(1.25rem, 4vw, 3.5rem)"
  nav-h: "4.25rem"
  container: "92rem"
  section: "6rem"
  section-wide: "8rem"
components:
  button-primary:
    backgroundColor: "{colors.wine}"
    textColor: "{colors.ivory}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.5rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.wine-hi}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.5rem"
    height: "3rem"
  button-quiet-paper:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    rounded: "{rounded.chip}"
    padding: "0.35rem 0.9rem 0.35rem 0.4rem"
    height: "2.75rem"
  chip-swatch:
    rounded: "{rounded.swatch}"
    width: "2rem"
    height: "1.75rem"
  field:
    backgroundColor: "rgb(232 225 213 / 0.04)"
    textColor: "{colors.ivory}"
    rounded: "{rounded.field}"
    padding: "0.75rem 0.9rem"
    height: "3rem"
  field-paper:
    backgroundColor: "rgb(255 255 255 / 0.45)"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
  caption-tag:
    backgroundColor: "rgb(9 10 11 / 0.7)"
    textColor: "{colors.silver}"
    typography: "{typography.caption}"
    rounded: "2px"
    padding: "0.25rem 0.5rem"
  nav-bar:
    backgroundColor: "rgb(9 10 11 / 0.86)"
    textColor: "{colors.ivory}"
    height: "{spacing.nav-h}"
---

# Design System: MERCANTIL

## Overview

**Creative North Star: "The Night Prospekt"**

MERCANTIL reads like a period factory brochure (a German *Prospekt*) opened at night. Photographs sit on near-black **night plates**. Text and specifications sit on warm ivory **paper pages**. These two surfaces take turns down every page, the way a brochure spread puts a plate opposite a page of copy. The control unit is the paint-chart sample chip: a small rectangle of colour with its name printed beside it. It handles collection filters, Vision presets and the stage markers. Bodoni Moda sets the brochure voice at a large scale. Archivo carries every caption, spec and control. Silver hairlines do all the dividing.

Density is low and the pace is editorial. The car is always the protagonist, and the interface pulls back to hairlines, small captions and one wine action per view. The site is honest about what its images are. Every image carries a provenance caption marked with a filled square (real photograph) or a hollow square (illustration or AI simulation). Cars without photographs get a plate that says so instead of a stand-in image. Work stage and commercial status are always shown as two separate readouts.

Rejected: the dealership card grid, the gold-on-black luxury hero, and gold accents in general.

**Key Characteristics:**
- Two surfaces only: night (photography) and paper (text and specification), with navy as the chapter variant of night.
- Wine is the only action tint. Everything else is ivory, silver, mist or ink.
- The sample chip (swatch plus printed name) is the single control and identity unit.
- Bodoni Moda at brochure scale with optical sizing. Archivo for all UI.
- Provenance caption on every image. Trajectory bars instead of badges.
- No shadows for structure. Depth comes from tone, hairlines and masks.

## Colors

The palette is a night-and-paper pairing tied to the W111 Charuto: navy body, light roof, wine-red interior. It uses one restrained accent and has no gold.

### Primary
- **Interior Wine** (wine): the single action tint. It fills the primary capsule button and the text-selection highlight on night surfaces, and it is the caret colour on paper fields. One wine primary per view.
- **Lit Wine** (wine-hi): hover state of the primary button only.
- **Faded Wine** (wine-soft): wine that stays legible on night surfaces. Used for the active item in the mobile menu, hover on large display links (journeys, related cars), the "novo" status in admin, and the caret on dark fields.

### Secondary
- **Coupé Navy** (navy): chapter surface for the Vision teaser on the home page.
- **Deep Navy** (navy-deep): the Discover chapter sheet that rises over the hero, and the Vision page canvas.

### Neutral
- **Night Plate** (night): base canvas for the whole site, the admin panel and photographs. Also sets theme-color.
- **Graphite** (graphite): the fill behind images that have not loaded yet, and the status panel when Vision is unavailable.
- **Ivory** (ivory): primary text on night, focus outline, the fill for active segments on trajectory and progress bars, and the comparator divider.
- **Brochure Paper** (paper): background of `on-paper` sections (trajectory, restoration, specification sheet, operations, privacy).
- **Print Ink** (ink): text, focus outline and the selected chip border on paper.
- **Soft Ink** (ink-soft): secondary text on paper.
- **Chrome Silver** (silver): secondary text on night, ledes, and the text of provenance captions.
- **Mist** (mist): tertiary text on night. Used for legends, field placeholders, meta lines and filter labels.
- **Hairline Dark / Hairline Light** (line-dark, line-light): every divider, chip rest border and section rule, on night and on paper respectively.

### Feedback
- **Error** (error-line for invalid field borders and alert borders, error-soft for error text on night, error-ink for error text on paper). These appear only on validation and failure states, never as decoration.

### Named Rules
**The One Tint Rule.** Wine marks action. Only the primary button is filled with wine, and wine-soft appears only for interactive or current-state emphasis. Neutrals carry everything else. If wine shows up on something that cannot be pressed, it is drift.

**The Two Surfaces Rule.** A section is either a night plate or a paper page (`on-paper`), and every control has a variant for each. Paper flips text to ink, hairlines to line-light, focus to ink and selection to ink-on-paper. Don't invent a third surface tone. Navy counts as night.

**The No Gold Rule.** No gold, brass or metallic accents anywhere. The only chrome in the system is the silver text colour.

## Typography

**Display Font:** Bodoni Moda (with Bodoni 72, Didot, Georgia), loaded with the `opsz` axis, roman and italic.
**Body Font:** Archivo (with ui-sans-serif, system-ui), loaded with the `wdth` axis.

**Character:** A high-contrast Didone at brochure scale paired with a sober grotesque. It reads like a period printed spec sheet, where the serif sells the car and the sans tells you its facts.

### Hierarchy
- **Wordmark hero** (400, 15.2vw on phones and up to 15.8vw on wide screens, fitted so the title sits behind the car roof; line-height 0.8; `opsz` 96): MERCANTIL in the home hero only. Letters rise one by one from a clip.
- **Display page** (400, clamp(2.75rem, 7.2vw, 6rem), 0.98, -0.025em): page titles and the Discover opener.
- **Headline statement** (400, clamp(2.5rem, 5.2vw, 4.75rem), 1): single-sentence statements.
- **Headline section** (400, clamp(2.25rem, 5vw, 4.5rem), 1.02): section and chapter titles.
- **Title sub** (400, clamp(1.5rem, 2.4vw, 2.125rem), 1.12): sub-sections and Vision panel titles. Car names in lists use Bodoni at clamp(1.5rem to 2.5rem) with leading-none, and the chassis code is set in silver.
- **Lede** (Archivo 400, clamp(1.125rem, 1.5vw, 1.3125rem), 1.5): intros, held to roughly 34 to 38ch.
- **Body** (Archivo 400, 1.0625rem, 1.6): running text, with `text-wrap: pretty`.
- **Label** (Archivo 500, 0.9375rem, 0.01em): buttons, status readouts and nav links.
- **Caption** (Archivo 400, 0.8125rem, 1.45, 0.01em): provenance, meta, legends, spec rows, footer column heads.

All headings are Bodoni 400 with `text-wrap: balance` and automatic optical sizing. Numbers in specs, years and counts use tabular lining figures.

### Named Rules
**The Italic Epigraph Rule.** Bodoni italic is kept for epigraph lines: the hero line "Clássicos com história.", the footer "A história continua.", car nicknames in quotes, and spec values still "a confirmar". Never use it for UI.

**The Sentence Case Rule.** No uppercase tracking, no small-caps labels and no kicker above headings. The only tracked text is the MERCANTIL wordmark (0.14em in nav and admin, 0.02em in the footer).

**The Operator Voice Rule.** In admin, page headings switch to Archivo 500 (1.75rem titles, 1.125rem section heads) with normal tracking. Bodoni stays only on the wordmark. The panel is a tool, not a brochure.

## Layout

- **Container:** centred, max 92rem, with fluid side gutters (1.25rem to 3.5rem). Running text is held to 30 to 46ch through local max-widths.
- **Section rhythm:** sections are padded 6rem top and bottom on phones and 8rem on large screens (some paper sections use 9rem). Within a section, the stack steps through 0.75, 1, 1.5, 2 and 2.5rem.
- **Fixed nav:** 4.25rem high. Scroll padding accounts for it, and full-height compositions subtract it.
- **Breakpoints:** Tailwind defaults plus `xs` at 26rem, and a custom `wide` condition that applies at 64rem or wider, *or* at 48rem or wider in landscape. Landscape tablets and phones therefore get the desktop hero composition.
- **Hero coordinate system:** the plate, the title and the roof matte all derive from one plate width. On phones the plate is 150vw with the title stacked above it. On wide screens the plate is min(94.6vw, 90% of viewport height × 1.7768), anchored right, and the title sits behind the roof line (24.23% from the plate top). The copy column sits at bottom-left. The hero is sticky, and the next chapter sheet slides over it.
- **Collection:** an editorial 12-column grid on large screens with varied spans and aspect ratios, and the first car spanning two columns. It drops to 2 columns, then 1. A list mode switches to hairline rows (swatch, name, year, stage, status).
- **Chapters (Discover):** on large screens, a 5fr/6fr split with a sticky image frame and chapter text at 86svh each. Below that, the chapters become a stacked image-then-text sequence.
- **Admin:** a 15rem sidebar plus content from md up. On phones the sidebar becomes a horizontal, scrollable top strip.

## Elevation & Depth

The system is flat and tonal. Depth comes from alternating night and paper surfaces, from hairlines, from radial masks and gradients that let photographs come out of the dark, and from translucent night overlays with backdrop blur on the nav and on caption tags. There are no structural shadows.

### Shadow Vocabulary
- **Swatch bevel** (`box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12), inset 0 -6px 10px rgb(0 0 0 / 0.18)`): gives the sample chip swatch the slight curvature of a painted card.
- **Swatch edge** (`box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.14)`): the flat paint rectangles in list rows and on awaiting plates.

### Named Rules
**The Out of Darkness Rule.** Photographs fade into the night through gradient vignettes and masks (hero plate fades: 18 to 22% from the top, 14 to 16% from the bottom, 12 to 22% from the sides). They do not float on drop shadows.

**The Inset Only Rule.** The only shadows are inset ones on paint swatches. Never put a drop shadow on a card, button or panel.

## Shapes

Small, nearly square corners on anything that comes from a printed sheet: swatches at 2px, chips and panels at 3px, fields at 4px, and caption tags and images at 2px. The one rounded silhouette is the **capsule button** (999px), plus the round 44px icon targets (mobile menu toggle, comparator handle). The single large radius is the 1.75rem top corners of the Discover sheet on wide screens, which reads as a page lifting over the sticky hero. Thin bars recur everywhere: 3px segments for the work track, chapter progress and Vision steps, and a 2px progress line.

## Components

### Buttons
Restrained capsules: one confident wine button and quiet outlined companions.
- **Shape:** capsule (999px), at least 3rem tall, 0.8rem × 1.5rem padding, 0.75rem gap to a trailing arrow icon.
- **Primary:** wine fill with ivory label. Hover lightens to wine-hi and the trailing arrow slides 4px right.
- **Quiet:** transparent with a 1px ivory border at 32% opacity. Hover brings the border to full ivory with a 6% ivory wash. On paper the border is ink at 35% opacity and the wash is 4% ink.
- **States:** pressing scales to 0.97. Disabled sits at 45% opacity with a not-allowed cursor. Focus shows a 2px ivory outline offset 3px (ink on paper). Transitions run 0.25s on the out-expo curve.

### Chips (sample chips)
The control unit of the system, shaped like a paint-chart card.
- **Style:** 1px hairline border, 3px corners, at least 2.75rem tall. A leading swatch (2rem × 1.75rem, 2px corners, bevel) and a printed name in 0.875rem.
- **State:** hover raises the border to 40% ivory. Selected (`aria-pressed`, `aria-checked` or a checked input inside) gets a full ivory border and a 7% ivory wash. On paper the selected border is ink with a 5% ink wash.
- **Variants:** filters (decade, body style), view toggles, comparator quick positions (text-only chips), Vision paint, roof and interior presets.

### Inputs / Fields
- **Style:** 3rem minimum height, 4px corners, a 4% ivory fill and a 1px border at 22% ivory. Placeholders are mist. Labels are Archivo 500 at 0.875rem above the field.
- **Hover / Focus:** hover raises the border to 40%. Focus swaps the outline for a full ivory border and a 7% ivory fill. On paper the field is 45% white, rising to 70% white with an ink border on focus.
- **Error:** the invalid border is error-line, with an error message in 0.8125rem below (error-soft on night, error-ink on paper).

### Navigation
- Fixed bar, 4.25rem tall. It is transparent over the home hero until the page scrolls 24px. After that, and on every other route, it becomes 86% night with blur and a bottom hairline. The background change runs over 0.5s.
- Wordmark: Bodoni at 1.375rem with 0.14em tracking. Links: Archivo at 0.9375rem, ivory at 80%, with a hairline underline that draws left to right (0.45s) on hover, on focus and for the current page.
- Mobile: a 44px round toggle opens a full-height night sheet that wipes down from a top clip (0.5s out-expo). It lists links in Bodoni at 2.25rem on hairline rows, staggered 45ms apart, and marks the current page in wine-soft. Escape closes the sheet and returns focus to the toggle.

### Provenance Caption (signature)
A caption-size label led by a square: **filled** for a real photograph, **hollow** for an illustration or AI simulation. It appears on every image. Over a photograph it sits in a tag (night at 70% opacity, blur, 2px corners) in a bottom or top corner. Default wording: "Fotografia real" or "Ilustração conceitual · não é fotografia".

### Work Track and Commercial Status (signature)
Two separate readouts, never merged. **Work Track** shows the stage label (label weight) above a 6-segment row of 3px bars: ivory up to the current stage, 15% ivory after it (ink on paper). If the stage is unknown, every bar stays dim and a caption explains why. **Commercial Status** shows a status label above a tabular caption that reads "Valor sob consulta" unless a price has been authorised.

### Awaiting Plate (signature)
Stands in for a car without photography: a graphite-to-night gradient with a glow of the car's paint colour from below. The chassis code is set huge in Bodoni at 7% ivory. A paint rectangle and colour name sit at top, and the model name and "Fotografias reais em produção" sit at the bottom.

### Comparator (signature)
One component for every state comparison: before/after and original/concept in Vision. The two images are clipped at the split. The divider is a 1px ivory line with a 44px round handle (night at 70% opacity, blur). Caption tags label each side. A native range input handles dragging and the keyboard. A row of three text chips (Antes, Metade, Depois) gives a single-tap alternative.

### Vision Studio
Steps run along a 4-segment 3px bar with numbered captions. The upload area is a dashed hairline frame. While generating, the photo dims (55% brightness) and a light band sweeps across it like a scanner over a print (2.8s in-out-quart loop, removed under reduced motion), with a status line in Bodoni and a 2px progress line. When generation is unavailable, the studio says so in a graphite status panel. It never shows a ready-made result.

### Motion
- Curves: out-expo `cubic-bezier(0.16, 1, 0.3, 1)` for nearly everything, and in-out-quart for the sweep loop.
- Entrance: one shared reveal, a 24px rise from near-full opacity over 0.9s, once per element, triggered 12% before the element enters the viewport.
- Hero sequence: light reveal through a radial mask (2.6s), the plate settling from 1.07 scale (3.2s), wordmark letters rising 55ms apart, then copy, actions and caption. Buttons can be clicked from the first frame. On scroll the plate drifts, the title lifts, the copy fades and a night veil dims the plate.
- Hover: image scales to 1.025 over 1.2s, arrows nudge 4px, underlines draw.
- **Reduced motion:** Motion respects the user setting site-wide. Hero and reveal components skip their initial states and parallax. A global CSS rule shortens every animation and transition to 0.01ms and turns off smooth scrolling. The Vision sweep is not rendered.

## Do's and Don'ts

### Do:
- **Do** caption every image with the provenance square: filled for real photographs, hollow for illustrations and simulations.
- **Do** use one wine primary capsule per view and make every other action a quiet capsule or a hairline link.
- **Do** build controls as sample chips (swatch plus printed name, 3px corners, hairline border, ivory border when selected).
- **Do** alternate night plates for photography with paper pages for text and specification, and give every control its paper variant.
- **Do** show work stage as a 3px segmented track and commercial status as a separate readout, with "Valor sob consulta" when no price is authorised.
- **Do** use the awaiting plate for cars without photography. Never borrow another car's image.
- **Do** keep touch targets at 44px or more (buttons 48px, chips 44px, icon toggles 44px).
- **Do** route all motion through the out-expo curve and keep the reduced-motion paths intact.

### Don't:
- **Don't** use gold, brass or metallic accents, or a gold-on-black luxury hero.
- **Don't** lay out the collection as a uniform dealership card grid with badges.
- **Don't** add uppercase tracked eyebrows or kickers above headings.
- **Don't** put drop shadows on cards, buttons or panels. Only paint swatches get inset bevels.
- **Don't** fill a non-interactive element with wine.
- **Don't** merge work stage and commercial status into one badge, or infer one from the other.
- **Don't** show an AI concept without the hollow-square caption, or present a pre-made image as a Vision result.
- **Don't** use Bodoni for admin headings or UI labels, or Archivo for brochure headlines.
