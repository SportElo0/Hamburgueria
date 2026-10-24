---
name: Odair Alves da Silva & Advogados
description: An authenticated document. Fine guilloché, a seal and the office's gold monogram on whole navy fields, with ivory and white reading sections.
colors:
  navy: "#071b2e"
  navy-deep: "#051424"
  blue: "#102c43"
  blue-line: "#23435d"
  gold: "#c6a15a"
  gold-soft: "#d9bf88"
  gold-ink: "#7a5f22"
  ivory: "#f7f5f0"
  paper: "#ffffff"
  graphite: "#252b31"
  muted: "#59616a"
  line: "#e6e8ea"
  line-strong: "#cfd4d9"
  on-navy: "#f7f5f0"
  on-navy-muted: "#b3c1ce"
  alert: "#a63a2f"
  alert-light: "#f2a196"
typography:
  display:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.6rem, 5.6vw, 5.4rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.012em"
    fontFeature: "lnum"
  page-title:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.4rem, 5vw, 4.6rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.012em"
  headline:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.3rem, 4.4vw, 4rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.012em"
  subhead:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2rem, 3.4vw, 2.9rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.012em"
  entry-title:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "1.6rem"
    fontWeight: 500
    lineHeight: 1.04
  numeral:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "2.4rem"
    fontWeight: 500
    lineHeight: 1
    fontFeature: "tnum"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title-sm:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 600
    lineHeight: 1.4
  body-lg:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.16em"
  button:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.14em"
rounded:
  sm: "3px"
  md: "4px"
  full: "9999px"
spacing:
  gutter-mobile: "20px"
  gutter-tablet: "32px"
  gutter-desktop: "48px"
  section-mobile: "80px"
  section-desktop: "128px"
  container: "1440px"
components:
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.navy}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "52px"
  button-gold-hover:
    backgroundColor: "{colors.gold-soft}"
  button-navy:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.ivory}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "52px"
  button-navy-hover:
    backgroundColor: "{colors.blue}"
  button-line:
    textColor: "{colors.navy}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "52px"
  button-line-hover:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.ivory}"
  button-line-light:
    textColor: "{colors.ivory}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "52px"
  button-disabled:
    backgroundColor: "{colors.line}"
    textColor: "{colors.muted}"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.graphite}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "52px"
  area-card-light:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.md}"
    padding: "24px"
  area-card-dark:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.md}"
    padding: "24px"
  form-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.md}"
    padding: "40px"
  icon-control:
    rounded: "{rounded.full}"
    size: "48px"
  pending-tag:
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
---

# Design System: Odair Alves da Silva & Advogados

## Overview

**Creative North Star: "The Certificate"**

The site reads as an authenticated document issued by the office: a certidão or escritura whose seriousness comes from the quality of the line, not from symbols of justice. Whole navy fields carry the opening, the practice areas, the contact and the footer; ivory and white sections carry the reading. Gold is ink, not metal: it lives in hairlines, guilloché, the monogram, numerals, the accent phrase of a heading and the primary button on navy.

The signature material is guilloché generated by formula (overlapping polar waves with shifted phase), drawn as SVG strokes and never as an image. It appears as a large seal around the monogram in the opening, as a smaller rosette unique to each practice area, as a faint watermark behind contact, and as horizontal bands that close a field like the margin of a title deed. Every rosette is decorative; its meaning is always in the text beside it.

Density is generous and calm, built for a tense reader on a phone. Type is a high-contrast Didone for headings over a clear humanist-geometric sans for everything a person must read or press. Motion is a discreet engraving: rings draw themselves on load, the seal turns slowly with scroll, a timeline fills in gold, and everything is static under reduced motion.

**Key Characteristics:**
- Whole navy fields alternating with ivory and white reading sections; no gradients between them.
- Gold as a stroke color, never as a fill surface except the primary button on navy.
- Formula-generated SVG guilloché (rosettes and bands) as the only ornament.
- Bodoni Moda headings, Manrope everything else.
- 1px rules, 3-4px corners, near-zero shadow.
- The office's own monogram rasters carry the brand; no legal clip art.

## Colors

A two-field palette: deep navy and paper-warm ivory, joined by a single gold that behaves like engraver's ink.

### Primary
- **Notarial Navy** (navy): the ground of every whole field (opening, areas, contact, footer, page heads, header, mobile menu) and the primary button color on light sections. It is also the `html` background and theme color.
- **Engraver's Gold** (gold): guilloché strokes, seal rings, the accent phrase of display headings on navy, icons on navy, the active-nav underline, the carousel progress, the focus ring, text selection, and the filled primary button on navy.

### Secondary
- **Institutional Blue** (blue): the dark alternate area card and the hover of the navy button.
- **Field Line Blue** (blue-line): every hairline on navy (header separator, index strip dividers, contact rows, footer rule, card borders on navy, scrollbar thumb).
- **Deep Navy** (navy-deep): the demo notice strip above the header only.

### Tertiary
- **Gold Ink** (gold-ink): gold for text and small marks on ivory and white, where the bright gold fails contrast: labels, timeline numerals, light-card rosettes, link hovers, caret.
- **Soft Gold** (gold-soft): hover of the gold button and gold icon controls.
- **Alert Brick** (alert): field error borders and error messages on light grounds; **Alert Light** (alert-light) is its counterpart on navy.

### Neutral
- **Ivory** (ivory): the default reading ground (`body`), and the text color on navy (on-navy is the same value).
- **Paper White** (paper): alternate reading sections (approach, FAQ, other-areas nav), the light area card, the contact form sheet, input fills.
- **Graphite** (graphite): long-form body text on light grounds.
- **Slate Muted** (muted): secondary text on light grounds, placeholders, pending tags.
- **Mist Blue** (on-navy-muted): secondary text on navy. Always this blue-grey, never a neutral grey.
- **Hairline** (line) and **Hairline Strong** (line-strong): row dividers, field borders, dashed pending borders on light grounds.

### Named Rules
**The Gold Is Ink Rule.** Gold is a stroke, a numeral, a phrase or a button on navy; it never becomes a background panel, a gradient or a metallic sheen. The monogram raster is the only gold-textured object.

**The Ink Swap Rule.** On ivory or white, gold text and small marks use gold-ink, never the bright gold. Bright gold on light grounds is reserved for 1px timeline lines, the timeline dot, guilloché bands at reduced opacity, and field hover borders.

**The Two Fields Rule.** A section is either a whole navy field or a light reading field (ivory or paper). Adjacent light sections alternate ivory and paper; there is no third ground.

## Typography

**Display Font:** Bodoni Moda (with Bodoni 72, Didot, Georgia), optical sizing on
**Body Font:** Manrope (with ui-sans-serif, system-ui)

**Character:** An engraved Didone for the voice of the document, held at medium weight with tight tracking and lining numerals; a plain, open sans for every sentence a stressed reader must understand and every control they must press.

### Hierarchy
- **Display** (500, clamp(2.6rem, 5.6vw, 5.4rem), 1.04): the opening statement only, max about 15ch, second sentence in gold.
- **Page Title** (500, clamp(2.4rem, 5vw, 4.6rem), 1.04): the heading of inner page heads, max about 18ch.
- **Headline** (500, clamp(2.3rem, 4.4vw, 4rem), 1.04): section headings; on navy fields the scale opens to 4.6vw / 4.2rem. Max 12-16ch.
- **Subhead** (500, clamp(2rem, 3.4vw, 2.9rem)): long-page section headings on area and article pages.
- **Entry Title** (500, 1.6rem rising to 1.9rem): article titles in content lists, and the Didone item names of the mobile menu (1.85rem).
- **Numeral** (500, 2.4rem, line-height 1, tabular): numbered steps, in gold-ink.
- **Title** (Manrope 600, 1.375rem, tight, -0.01em): area card names. **Title Small** (600, 1.1875rem): step titles, area subsections, form headings at 1.25rem.
- **Body Large** (400, 1.0625rem, 1.625): lead paragraphs and page prose, 42-66ch.
- **Body** (400, 1rem, 1.625) and **Body Small** (400, 0.9375rem, 1.625): answers, card summaries, footer and list text.
- **Label** (700, 0.75rem, 0.16em, uppercase): definition terms, metadata, footer column headings, in-page section names inside a reading column. Never below 12px.

### Named Rules
**The Didone Speaks, Sans Explains Rule.** Bodoni Moda is for headings, numerals and menu entries only; any paragraph, control, field or label is Manrope.

**The Gold Phrase Rule.** A display heading on navy may carry one gold phrase, always its closing words. Headings on light grounds stay navy throughout.

## Layout

A 12-column grid in a centered container (max 90rem) with gutters of 20px, 32px from `sm`, 48px from `lg`. Sections breathe at 80px vertical padding on mobile and 128px from `lg`; inner pages use 64px / 96px. Section openers pair a headline (6 columns) with a lead paragraph offset to columns 8-12, aligned to the baseline. Reading sections place a heading or sticky aside in 4-5 columns and the text in 6-7 columns starting at column 6 or 7.

The opening splits 7/5 (statement left, seal right) and closes with a full-width index of the five areas: one column on mobile, two on `sm`, five on `lg`, divided by blue-line hairlines. On mobile the text comes first and the seal follows below. The areas section breaks the container with a horizontal snap track whose padding matches the gutter. The header is sticky, 76px tall (96px on `lg`), shrinking to 68px / 76px after scroll; full navigation appears at `xl`, below which a full-height navy sheet opens.

Lists read as ledgers: a navy top rule, line-strong row dividers, generous row padding (16-28px). Long text never exceeds about 68ch.

## Elevation & Depth

Flat. Depth comes from the change of field (navy against ivory and paper), from hairlines, and from guilloché opacity, not from shadows. Cards on navy are distinguished by tone (blue against navy) and a 1px border.

### Shadow Vocabulary
- **Header seam** (`box-shadow: 0 1px 0 var(--color-blue-line)`): appears under the sticky header only once the page scrolls or the menu opens. It is a hairline, not a blur.
- **Field focus** (`box-shadow: 0 0 0 1px var(--color-navy)`): doubles the navy border of a focused input.

### Named Rules
**The No-Blur Rule.** No blurred drop shadows anywhere. If something needs separation, it gets a 1px line or a change of field.

## Shapes

Document corners: buttons, fields, notices and the header nav group at 3px; cards and the form sheet at 4px. Circles are reserved for icon-only controls (carousel arrows, the area-card arrow badge) and for the timeline dots, echoing the round seal. Borders are 1px; dashed 1px borders mark anything pending or demonstrative. The rosette is a seal: double outer ring (1px and 0.6px at 60%), an inner field ring, and, on the opening seal only, an engraved circular caption. Guilloché bands run edge to edge at 32px tall as field closers.

## Components

### Buttons
Uppercase, tracked, quiet; they press 1px on active and their arrow icon nudges 4px on hover.
- **Shape:** document corner (3px), 52px minimum height, 24px side padding, 12px icon gap.
- **Gold:** gold fill, navy text, soft-gold hover. The primary action on navy fields only.
- **Navy:** navy fill, ivory text, blue hover. The primary action on light fields.
- **Line:** 1px navy outline, navy text, fills navy on hover. Secondary on light fields.
- **Line Light:** 1px gold outline at 70%, ivory text, full-gold border and a 12% gold wash on hover. Secondary on navy, including the header contact action (44px tall there).
- **Disabled:** hairline fill and muted text, not-allowed cursor.
- **Focus:** global 2px gold outline, 3px offset.

### Text Links
- **Ruled link:** a 1px underline drawn with a background that retracts right to left on hover (420ms, expo out). Used for inline calls to action and contact values.
- **Plain links** on navy go from mist blue to ivory on hover.

### Cards / Containers
- **Area card:** 4px corners, 24px padding (28px on `lg`), alternating light (paper, paper border, gold-ink rosette) and dark (blue, blue-line border, gold rosette). Hover turns the border gold, rotates the rosette 10deg over 1400ms, and fills the round arrow badge (navy on light, gold on dark). The whole card is one link.
- **Form sheet:** white, 4px corners, 24px to 40px padding, set on navy beside the contact text.
- **Note box:** paper or ivory fill, 3px corners, 20px padding, muted body-small text.
- **Shadow Strategy:** none (see Elevation & Depth).

### Inputs / Fields
- **Style:** white fill, 1px line-strong border, 3px corners, 52px height, 16px side padding, 16px text; labels above in Manrope 600 at 15px with a muted optional hint.
- **Hover:** border turns gold.
- **Focus:** border and 1px ring in navy, no outline.
- **Error:** alert border, message below in alert with an icon. Select uses a custom navy chevron; textarea grows from 128px.

### Navigation
- **Header:** navy, signature lockup (monogram plus name raster) left; at `xl` the links sit inside a 3px blue-line bordered group, 14px Manrope 500, mist blue to ivory, the current section marked by a gold 1px underline that scales in from the left. Contact action right as a Line Light button.
- **Mobile sheet:** full-height navy, slides down 8px over 420ms; entries in Bodoni at 1.85rem divided by blue-line rules, the current one in gold; a full-width gold button at the bottom.
- **Breadcrumb:** 14px mist blue on page heads, gold chevrons, current item in ivory.

### Pending Tag
- **Style:** dashed 1px border, 3px corners, 13px italic muted text with a small icon. Marks every fact not yet confirmed by the office; never styled to look final.

### Guilloché Rosette (signature)
A formula rosette of 3-5 rings, each made of several phase-shifted copies, stroked in currentColor with ring opacity rising from 50% to 100% outward. The opening seal holds the gold monogram at 34% of its width, engraves ring by ring on load (2600ms per ring, 260ms stagger, seal fades in at 900ms) and turns 14deg across the first 120vh of scroll. Each practice area owns a distinct rosette (its own lobes and seed) and reuses it on the card and on its page head, shared through a view transition. A large rosette at 30% gold sits as a watermark at the corner of the contact field.

### Guilloché Band
A 32px horizontal band of phase-shifted waves, stroked in gold at reduced opacity (about 55% on ivory, 35% on navy), opening the about section and the footer.

### Area Index Strip
The full-width base of the opening: five links in a ruled row, mist blue at 15px rising to ivory on hover, each with a gold up-right arrow that shifts 2px diagonally.

### Approach Timeline
Four numbered steps on a line-strong hairline (vertical on mobile, horizontal on `lg`), a gold line filling over it as it scrolls into view, gold-ringed dots on paper, and gold-ink Bodoni numerals.

### Disclosure (FAQ)
Ledger rows: navy top rule, line-strong dividers (blue-line and a 60% gold top rule on navy), 17px semibold question, a plus that rotates 45deg on open, answer in body at max 68ch.

## Do's and Don'ts

### Do:
- **Do** keep every section on one of two grounds: whole navy, or ivory/paper for reading.
- **Do** use gold as ink: 1px lines, guilloché strokes, numerals, a closing gold phrase in a display heading on navy, and the gold button on navy.
- **Do** switch gold text to gold-ink (#7a5f22) on ivory and white.
- **Do** generate ornament from the guilloché formulas and stroke it in currentColor; give every new practice area its own rosette seed.
- **Do** use the navy button as the primary action on light fields and the gold button as the primary action on navy.
- **Do** mark every unconfirmed fact with the dashed pending tag.
- **Do** keep motion an engraving: ease-out (expo or quart), short travel (8-14px), and fully static under reduced motion.

### Don't:
- **Don't** use scales, gavels, stock legal photos, OAB symbols or a redrawn logo; the office's monogram rasters are the only brand mark.
- **Don't** add a statistics or success-numbers band where the area index stands.
- **Don't** render gold as a gradient, foil or sheen, or as a large filled panel.
- **Don't** use blurred drop shadows; separation is a hairline or a change of field.
- **Don't** round corners beyond 4px; circles are only for icon controls and timeline dots.
- **Don't** set paragraphs, labels or controls in Bodoni, or headings in Manrope weight below 600.
- **Don't** use neutral grey for secondary text on navy; use the mist blue (on-navy-muted).
