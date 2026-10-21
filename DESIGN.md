---
name: LM Barbearia
description: Editorial, light barbershop site where Leonardo's real photographs carry the colour and a champagne hairline marks the cut.
colors:
  ground: "#f9f8f5"
  paper: "#ffffff"
  sand: "#f2efe9"
  ink: "#141414"
  graphite: "#343434"
  muted: "#66625b"
  line: "#e9e6e0"
  line-strong: "#d6d0c6"
  champagne: "#ad936e"
  champagne-deep: "#8c7350"
  champagne-text: "#76603f"
  champagne-soft: "#c9b48f"
  night-2: "#1d1c1a"
  night-line: "#34322e"
  night-muted: "#b3ada3"
  alert: "#b3261e"
typography:
  display:
    fontFamily: "Libre Caslon Display, Georgia, serif"
    fontSize: "clamp(3.25rem, 13vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.015em"
    fontFeature: "lnum"
  headline:
    fontFamily: "Libre Caslon Display, Georgia, serif"
    fontSize: "clamp(2.75rem, 8vw, 4.25rem)"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-0.015em"
    fontFeature: "lnum"
  title:
    fontFamily: "Libre Caslon Display, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.06
  signature:
    fontFamily: "Libre Caslon Text, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  none: "0px"
  full: "9999px"
spacing:
  gutter-sm: "20px"
  gutter-md: "32px"
  gutter-lg: "48px"
  section-sm: "96px"
  section-md: "112px"
  section-lg: "144px"
  container: "88rem"
components:
  button-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 25.6px"
    height: "52px"
  button-solid-hover:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.ground}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 25.6px"
    height: "52px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  button-round:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "48px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "52px"
  service-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "24px"
---

# Design System: LM Barbearia

## Overview

**Creative North Star: "The Part Line"**

The page is a quiet, light editorial spread for one barber's chair in Campanário, Diadema. It has no colour of its own beyond warm off-white, ink and a thin champagne. All the saturation comes from Leonardo's real photographs: the red, white and blue striped capes and the dark, hard-edged fades. One gesture repeats: a 1px champagne hairline, *a risca*, drawn under headlines like the hard part line in the cuts. It draws in from the left when it enters the screen.

Density is low and deliberate. Sections breathe (96–144px vertical padding), headlines are large and set in a high-contrast display serif, and the UI text is a clean grotesk set in small, tracked capitals. Depth comes from tonal panels (white on off-white, one ink band, a sand panel), never shadows. Photographs are large, square-cornered and edge-to-edge inside their frames. The hero photo bleeds off the right edge of the viewport and dissolves into the ground on its left. The client rejected the earlier all-dark "escala do degradê" version; this world replaces it entirely.

**Key Characteristics:**
- Warm off-white ground with white and sand panels; one ink feature band.
- Real photographs carry all the saturated colour.
- Champagne only as a hairline, stars, icons and one accent phrase per screen.
- Libre Caslon Display headlines, Manrope body and tracked-caps labels.
- Square corners everywhere except round icon controls and calendar days.
- No shadows, no decorative gradients.

## Colors

A neutral, warm-paper palette with a single metallic accent; the photographs supply every saturated hue.

### Primary
- **Champagne Hairline** (`champagne`): the risca under headlines, rating stars, line icons, the active-nav underline and the progress line of the current booking step. Too light for text on the ground.
- **Deep Champagne** (`champagne-deep`): the one accent phrase in large headlines ("precisão.", "horário.", "próximo corte?"). Large text only.
- **Champagne Ink** (`champagne-text`): small champagne text on the ground (passes AA).
- **Soft Champagne** (`champagne-soft`): champagne on the ink band: the hairline, the signature and the seal.

### Neutral
- **Gallery Ground** (`ground`): the page background, headers and the mobile CTA bar.
- **Paper White** (`paper`): raised panels such as service cards, the booking panel, the FAQ and gallery sections, and inputs.
- **Sand** (`sand`): secondary panels: the reviews band, the About CTA panel, the map placeholder and photo loading backgrounds.
- **Ink** (`ink`): headlines, primary text, solid buttons, the top bar and the About band.
- **Graphite** (`graphite`): body copy and the solid-button hover.
- **Warm Muted** (`muted`): secondary text, captions and notes (AA on ground and paper).
- **Hairline** (`line`) and **Strong Hairline** (`line-strong`): dividers, panel borders, input borders and round-button rings.
- **Night Panel** (`night-2`), **Night Line** (`night-line`), **Night Muted** (`night-muted`): the second column of the ink band, its dividers, and body text on ink.
- **Alert** (`alert`): booking error messages and invalid-field borders.

### Named Rules
**The Photos-Carry-Colour Rule.** No section adds a saturated colour. If something needs to stand out, it gets a photograph, scale or ink, never a new hue.

**The One Accent Rule.** At most one champagne accent phrase per screen. Every other heading stays ink.

## Typography

**Display Font:** Libre Caslon Display (Georgia fallback)
**Signature Font:** Libre Caslon Text Italic, used only for Leonardo's name and quotes
**Body / Label Font:** Manrope

**Character:** A sharp, high-contrast Caslon for editorial headlines, paired with a calm geometric grotesk for everything functional. Caslon was chosen over Cormorant Garamond because its é, ê and ú accents sit correctly in Portuguese.

### Hierarchy
- **Display** (400, clamp 3.25–6rem, 0.98): the hero headline only, two lines.
- **Headline** (400, clamp 2.75–4.25rem, 1.06): section titles.
- **Title** (400, 1.75–2.75rem): card names, booking step questions, the reviews line and the map label.
- **Signature** (italic 400, about 1.75rem): "Leonardo Miguel" and testimonial quotes.
- **Body** (400, 17px, 1.625; max about 46ch): paragraphs and answers.
- **Body small** (400, 15.2px, 1.6): card descriptions, footer links, summaries and notes.
- **Label** (600, 13px, 0.14em, uppercase): navigation, buttons and small headings. Never below 13px.

### Named Rules
**The Lining Numerals Rule.** Serif numerals use lining figures (5,0 / 130), and times and dates use tabular figures.

**The Thirteen Floor Rule.** No text on a phone is smaller than 13px.

## Layout

Content sits in an 88rem container with 20px, 32px and 48px side gutters (phone, tablet and desktop) on a 12-column grid at ≥1024px. Every section grid declares a single minmax(0,1fr) column on mobile so carousels and long words cannot widen the page.

- **Hero:** text in the left 46%; the photo is absolutely positioned across the right 57% at full hero height. On phones the photo comes first (4:5), fades into the ground and the headline overlaps the fade.
- **Services:** title and intro in 4 columns, a horizontal snap carousel in 8 (about 2.6 cards visible on desktop, 78% width on phones) with round previous/next buttons.
- **Gallery:** an asymmetric 12-column grid with 12.5–14rem rows. A tall band holds two 3-row photos and a split column; a short band holds four photos of 4/3/2/3 columns. Phones alternate full-width photos with pairs.
- **About:** a three-panel band: ink text (5 columns), a graphite photo frame (4 columns) and a sand CTA (3 columns), stacked on phones.

Section rhythm is 96px, 112px and 144px vertical padding, with more space above headings than below them.

## Elevation & Depth

The system is flat. Depth comes only from tonal layering: white panels on the off-white ground, sand for secondary panels, and one ink band that inverts the page. The only gradient is the photo-to-ground fade on the hero photo.

### Named Rules
**The No-Shadow Rule.** Nothing casts a shadow. Separation comes from a lighter or darker panel, or a 1px hairline.

## Shapes

Corners are square (0px) for buttons, cards, inputs, panels and photographs, as precise as a razor line. Full circles appear only on icon controls (carousel arrows, social links, the FAQ toggle, calendar days and the map pin) and on the LM seal, which echoes the shop's real circular logo. Borders are 1px hairlines throughout.

## Components

### Buttons
- **Shape:** square-cornered (0px), 52px tall, labels in uppercase tracked caps.
- **Solid:** ink fill with ground text. Hover: graphite. The trailing arrow nudges 4px right.
- **Outline:** a 1px ink border with ink text. Hover: fills ink and the text turns ground.
- **On ink:** a light fill, or an outline in night-muted.
- **Round:** a 48px circle with a 1px ink ring, used for carousel and calendar navigation. Hover: fills ink. Disabled: a hairline ring with a pale icon.
- **Focus:** a 2px ink outline offset by 3px.

### Cards / Containers
- **Service card:** a white panel with a hairline border and square corners. A 4:5 photo zooms to 1.05 on hover over 1.2s. The serif name and muted description follow, and a hairline separates "Valor no WhatsApp" from the "Agendar →" text link. A service with no photo shows an ink card with the LM seal and a signature line.
- **Booking panel:** a white panel with a hairline border, padded 20–48px.

### Inputs / Fields
- **Style:** a white field with a 1px strong-hairline border, square corners and 52px height. Labels sit above in uppercase tracked caps.
- **Focus:** the border turns ink.
- **Error:** the border turns alert, and the message appears directly under the field in alert, linked with aria-describedby.

### Navigation
- **Top bar:** an ink strip with ground tracked caps: "Agende seu horário pelo WhatsApp".
- **Header:** sticky on the ground, with a hairline border once the page scrolls. The LM monogram sits left, the uppercase tracked links are centred, and the solid "Agendar" button sits right. The active link gets a champagne underline that scales in from the left.
- **Mobile:** the monogram, a compact "Agendar" button and a menu button. The menu sheet sits below the header and lists the sections as large serif links on hairlines.

### A Risca (Signature Component)
A 56px by 1px champagne hairline under the hero headline and every section title. It scales in from the left (scaleX, 1.1–1.2s, ease-out-expo) on load or when it enters the viewport, and it is static under reduced motion.

### Booking Stepper
Three numbered steps ("01 Serviço · 02 Data e horário · 03 Seu nome e envio"), each above a hairline. Completed steps fill the line in ink, and the current step fills it in champagne. On phones only the numbers show, with "Etapa X de 3 · …" underneath.

## Do's and Don'ts

### Do:
- **Do** let a real photograph of Leonardo's work lead every image slot, cropped with an explicit focus point.
- **Do** draw the champagne risca under a section title instead of adding a label above it.
- **Do** keep buttons and photo frames square-cornered and borders at 1px.
- **Do** use the ink band for at most one feature section per page.
- **Do** respect reduced motion: content is visible without JavaScript and reveals are static.

### Don't:
- **Don't** add drop shadows, glows or decorative gradients.
- **Don't** introduce a new saturated colour; the photographs carry colour.
- **Don't** set a champagne accent word in more than one heading per screen.
- **Don't** use Cormorant Garamond or any face whose Portuguese accents (é, ê, ú) sit off their letters.
- **Don't** show placeholder or generic stock imagery as if it were Leonardo's work.
