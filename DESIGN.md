---
name: Downtown Burger
description: The printed Downtown menu, made saturated and set in motion around one rendered burger.
colors:
  scene-red: "#a3171c"
  scene-orange: "#cf5a17"
  scene-green: "#2b6638"
  scene-plum: "#561534"
  scene-teal: "#0c6d69"
  brand: "#a61e22"
  brand-deep: "#7a1317"
  mustard: "#f4b740"
  mustard-deep: "#dc9a17"
  cream: "#f3e9d6"
  cream-deep: "#e9dbc0"
  paper: "#fbf6ec"
  ink: "#1d1712"
  ink-soft: "#3d3229"
  ink-mute: "#66564a"
  on-dark: "#fbf3e4"
  on-dark-mute: "#f0dcc4"
typography:
  display:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "clamp(5.4rem, 9vw, 10.5rem)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.01em"
    fontVariation: "\"opsz\" 72"
  headline:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "clamp(3rem, 8vw, 5.6rem)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.01em"
    fontVariation: "\"opsz\" 72"
  title:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.01em"
    fontVariation: "\"opsz\" 72"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Barlow Condensed, Barlow, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.08em"
  price:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 900
    lineHeight: 1
    fontFeature: "\"tnum\", \"lnum\""
rounded:
  tick: "6px"
  field: "16px"
  frame-inner: "22px"
  sheet: "28px"
  frame-outer: "32px"
  pill: "9999px"
spacing:
  gutter-sm: "20px"
  gutter-lg: "40px"
  stack-sm: "24px"
  section-sm: "96px"
  section-lg: "144px"
  container: "1360px"
  header-sm: "60px"
  header-lg: "72px"
components:
  button-action:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "56px"
    padding: "0 36px"
  button-action-hover:
    backgroundColor: "{colors.on-dark}"
  button-commerce:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 24px 0 16px"
  button-commerce-hover:
    backgroundColor: "{colors.brand}"
  button-send:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "60px"
  button-send-hover:
    backgroundColor: "{colors.brand-deep}"
  button-outline-dark:
    backgroundColor: "transparent"
    textColor: "{colors.on-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "56px"
    padding: "0 36px"
  button-outline-dark-hover:
    backgroundColor: "{colors.on-dark}"
    textColor: "{colors.scene-red}"
  chip-category:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  chip-category-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-dark}"
  input-field:
    backgroundColor: "rgb(255 255 255 / 0.6)"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "12px 16px"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
---

# Design System: Downtown Burger

## Overview

**Creative North Star: "The Menu Turned Up Loud"**

Downtown Burger's system is its own printed menu and badge, pushed to signage saturation. Five flat scene fields (red, burnt orange, diner green, plum, teal) carry the story; cream and paper carry the commerce. Everything that sells is set in heavy condensed skyline lettering, and everything that is read is set in a plain grotesque. The burger itself, as a layered 3D render, is the hero of every dark surface; type and rules frame it, never compete with it.

The world borrows the menu's furniture literally: double-line frames, dotted price leaders, ruled grids between products, five-point stars as the only ornament, and the circular skyline badge. Density alternates hard: the story is one object on one colour per viewport, the menu is a ruled, generous paper sheet. Motion is scroll-scrubbed and physical in the story, and short and interruptible everywhere else.

Confirmed rejection, from the direction contract: the split hero with a photo on one side and a card grid below.

**Key Characteristics:**
- One saturated scene colour per viewport on story surfaces; cream or paper on commerce surfaces.
- Uppercase heavy condensed display type, tightly leaded, at poster scale.
- Menu furniture as structure: double rules, dotted leaders, 2px ink rules over hairline dividers.
- Rendered burgers and ingredients float over soft contact shadows; no photography.
- Pills for every control; large soft corners for sheets and frames.
- Native dialogs animated with `@starting-style`; pinned GSAP story with a static reduced-motion twin.

## Colors

A signage palette: five saturated fields, one warm mustard for action on colour, and a cream-and-charcoal paper pair for reading and ordering.

### Primary
- **Downtown Red** (scene-red): the opening field, the nav overlay, the theme colour. The brand's first impression.
- **Menu Red** (brand): prices, stars, error text and the order-send button on cream. Its deep twin (brand-deep) is only the hover of that button.

### Secondary
- **Mustard** (mustard): the action colour on dark and saturated surfaces: hero pills, the menu trigger, the add-to-cart disc, scene-dot active state, text selection, focus ring on dark. Mustard-deep is reserved for pressed or shaded mustard.

### Tertiary
- **Scene Fields** (scene-orange, scene-green, scene-plum, scene-teal): one per story beat (flavour, layers, signature four, inside). Teal also becomes the header fill after the story and the location frame. Each is a flat fill with a single soft white radial glow behind the burger.

### Neutral
- **Cream** (cream): the page and menu ground, always with the print-grain noise overlay.
- **Cream Deep** (cream-deep): thumbnail wells, included-item chips, empty-state discs.
- **Paper** (paper): dialogs, sheets and the cart drawer, one step lighter than the page.
- **Charcoal Ink** (ink): text on cream, commerce buttons, 2px structural rules, dark sections (story history, footer). Also the root `html` background.
- **Ink Soft / Ink Mute** (ink-soft, ink-mute): descriptions and secondary meta on cream.
- **On-Dark / On-Dark Mute** (on-dark, on-dark-mute): text on fields and ink. Mute is for supporting copy only.

### Named Rules
**The One Field Rule.** A viewport shows one scene colour at a time. Fields wipe over one another; they never sit side by side as tiles.

**The Action Contrast Rule.** On colour or ink, the primary action is a mustard pill with ink text. On cream or paper, it is an ink pill that turns menu red on hover. The final send-the-order button alone is solid menu red.

**The Grain Rule.** Cream commerce surfaces (body, location, product sheet, cart drawer) carry the faint fractal-noise print grain. Scene fields and ink surfaces stay flat.

## Typography

**Display Font:** Big Shoulders, variable, optical size pinned at 72 (with Arial Narrow)
**Body Font:** Barlow (with system-ui)
**Label Font:** Barlow Condensed (with Barlow)

**Character:** Chicago-skyline signage lettering over a plain, slightly industrial grotesque. Display shouts; condensed labels speak like menu headings; Barlow just explains.

### Hierarchy
- **Display** (900, clamp(5.4rem, 9vw, 10.5rem) desktop and clamp(3.6rem, 15vw, 6rem) mobile, 0.86): story headlines and section titles. The menu title runs larger, up to clamp(4.4rem, 15vw, 11rem). Always uppercase, -0.01em, `text-wrap: balance`.
- **Headline** (900, clamp(3rem, 8vw, 5.6rem), 0.86): menu category headings, each led by a red star.
- **Title** (900, 2.35 to 3.4rem, 0.86): product names, dialog titles; 1.5 to 1.6rem for cart lines and fieldset legends.
- **Body** (400, 1.0625rem, 1.55): running copy. Descriptions cap at 46 to 52ch; long-form story copy uses 1.12rem at 1.7 and caps at 64ch.
- **Label** (500 to 700, 0.95 to 1.25rem, 0.04 to 0.14em tracking, uppercase): buttons, chips, taglines, list item names, field labels.
- **Price** (display 900 with tabular lining figures): currency set in condensed bold at 0.42em top-aligned, cents at 0.5em raised. In lists, prices drop to condensed bold tabular at 1.2 to 1.25rem in menu red.

### Named Rules
**The Two Voices Rule.** Display face for names, headings and totals; condensed for anything a person taps or scans. Barlow body never goes uppercase.

**The Tabular Rule.** Every price, count and total uses tabular lining numerals.

## Layout

Content sits in a 1360px container with 20px gutters on mobile and 40px from 768px; the header spans to 1600px. Sections breathe at 96px vertical padding on mobile and 144px on desktop; category blocks step at 80px and 112px. The fixed header is 72px (60px under 768px), and anchor scrolling pads by header height plus 56px.

The story is a full-viewport pinned stage (about 6.4 viewport heights of scroll on desktop, 5.6 on mobile). The burger frame is `min(58svh, 44vw)` on desktop and `min(88vw, 47svh)` on mobile, centred at half the small viewport height; copy alternates left, right and centre around it, and floating ingredients keep to the edges.

The menu is a ruled sheet: burgers in a 3-column grid (2 at tablet, 1 on mobile), sides in 4 columns at xl, desserts in 2, drinks as two side-by-side board lists. A sticky category bar sits under the header on translucent cream. On mobile a full-width ink cart bar docks to the bottom above the safe area.

Breakpoints follow Tailwind defaults plus an extra 380px step.

## Elevation & Depth

Flat by default. Depth belongs to the rendered food, not the interface: burgers and ingredients carry soft drop shadows and float over blurred elliptical contact shadows, and some background ingredients are blurred to suggest depth of field. Interface chrome stays flat; only overlays lift.

### Shadow Vocabulary
- **Contact shadow** (`radial-gradient(closest-side, rgb(0 0 0 / 0.42), rgb(0 0 0 / 0.18) 55%, transparent)` on the story stage; `bg-ink/25` blurred ellipse under menu items): grounds a floating render.
- **Render drop** (`drop-shadow(0 18px 18px rgb(0 0 0 / 0.28))`, `drop-shadow(0 30px 30px rgb(0 0 0 / 0.35))` in the product sheet): on cut-out renders only.
- **Floating bar** (`0 18px 40px -12px rgb(0 0 0 / 0.55 to 0.6)`): toast and mobile cart bar.
- **Sheet lift** (`0 -20px 60px -20px rgb(0 0 0 / 0.5)`): the product sheet over its backdrop.
- **Backdrop** (`rgb(20 12 8 / 0.55)` with 6px blur): every modal dialog.

### Named Rules
**The Food Floats Rule.** Shadows describe the food sitting in space. Cards, buttons and rules never cast shadows.

## Shapes

Two families. Controls are fully round pills or circles (44 to 60px tall). Containers use large soft corners: 28px for sheets and drawers (top corners only on mobile bottom sheets), 16px for fields, thumbnails and notices, 6px for checkboxes and the 18+ tag.

Borders come from the printed menu:
- **Double rule**: two 1.5px lines 6px apart in current colour, under section titles and product headings; the cart header uses a 5px CSS `double` border.
- **Double frame**: a 3px outer stroke and a 1.5px inner stroke with a 6px gap and concentric radii (28/22px, 32/26px), around the add-ons board and the location panel.
- **Ruled grid**: 2px ink rules top and bottom, 1px ink-at-15% hairlines between cells.
- **Dotted leader**: a 2px dotted rule at 35% ink between an item name and its price.
- **Outline ghost word**: a giant display word with a 1.5px stroke at 22% on-dark behind the burger.

The five-point star is the only ornament; the circular skyline badge is the only emblem.

## Components

### Buttons
Big, round and confident; every label is condensed, bold and uppercase.
- **Shape:** pill (9999px), minimum 44px, usually 48 to 60px.
- **Action (on colour):** mustard with ink text, 56px, hover to on-dark.
- **Commerce (on cream):** ink with on-dark text and a leading plus icon, 48px, hover to menu red, press to 0.97 scale.
- **Send order:** menu red, 60px, full width, hover to brand-deep.
- **Outline on colour:** 2px on-dark at 70%, fills on-dark with field-coloured text on hover.
- **Text action:** underlined condensed label, 2px decoration, hover to menu red.
- **Icon discs:** 40 to 48px circles; mustard on dark, ink on cream, translucent black with blur over renders.
- **Focus:** 3px solid outline offset 3px, ink on light and mustard inside `surface-dark`.

### Chips
- **Category tabs:** transparent condensed pills, 44px; hover 8% ink; current tab solid ink with on-dark text (`aria-current`).
- **Included items:** cream-deep pills with small condensed uppercase text.
- **Placeholder tags:** dashed 2px ink-at-35% pill, for facts the restaurant has not confirmed yet.

### Cards / Containers
There are no cards. Products sit in ruled grid cells with no background.
- **Product cell:** render with contact shadow, display name and red price on one baseline, description, then the commerce button. On hover the render lifts 12px and tilts -2 degrees, and its shadow narrows.
- **Sheets:** paper ground, 28px corners, double rule under the title.

### Inputs / Fields
- **Style:** 2px ink-at-15% stroke, 16px radius, white at 60% over paper.
- **Focus:** the stroke turns solid ink.
- **Choices:** custom 24px ink-bordered circle (single) or 6px-radius square (multiple), focus ring passed through from the hidden native input.
- **Error:** semibold menu red text with `role="alert"`.

### Navigation
- **Header:** transparent over the story, then fills cream, ink or teal with the section under it (500ms colour transition). Badge lockup left; condensed menu link, outlined cart pill with tabular count (pops mustard when an item is added), mustard menu disc right.
- **Overlay menu:** a full-screen red dialog that opens as a circular clip from the menu button (0.75s out-expo, 0.38s in-quart close). Display-size links rise in with 60ms stagger and gain a mustard star on hover.
- **Scene dots:** left edge, 8px on-dark at 45%, active 12px mustard.

### Burger Stack (signature)
The rendered burger as transparent layer images in a square frame. Exploding moves each layer vertically from the stack's centre; layers stagger by 35ms from the top. Leader-line labels alternate right and left: a 8px hollow ring, a 1px line at 70%, then a condensed uppercase label. On the story stage the timeline drives the explosion; in the product sheet a toggle drives it with a 0.9s out-expo transition.

### Dialogs, Drawer and Toast
Native `<dialog>` with focus trap, Escape and backdrop close. Enter with `@starting-style`: 12% rise on mobile bottom sheets, 24px rise at 0.98 scale for the desktop product sheet, a 16% slide from the right for the desktop cart drawer, all 0.5s out-expo. Exit is quicker (0.26s in-quart) via `data-state="closing"`. The page underneath stops scrolling. Toasts are ink pills with a mustard tick disc and an on-dark action pill.

### Story Stage
A pinned stage scrubbed at 0.7. Each field wipes up over the last with a power2 in-out ease; the ghost word drifts horizontally; copy leaves upward and enters from below; the burger splits on each wipe and restacks. Under `prefers-reduced-motion` the cinematic section is replaced by a static, stacked version of the same five beats and all transitions collapse.

## Do's and Don'ts

### Do:
- **Do** give each story or overlay surface exactly one scene field, with ink and on-dark text only.
- **Do** set every heading, name and total in uppercase Big Shoulders 900 at opsz 72 with 0.86 line height.
- **Do** use the menu's own furniture (double rule, double frame, ruled grid, dotted leader) for structure before reaching for a container.
- **Do** keep controls as pills of at least 44px with condensed uppercase labels.
- **Do** label generated imagery as illustrative, give layered renders true ingredient labels, and keep decorative renders `alt=""`.
- **Do** enter with out-expo (`cubic-bezier(0.16, 1, 0.3, 1)`) and leave faster with in-quart (`cubic-bezier(0.5, 0, 0.75, 0)`), and give every scrubbed or looping motion a reduced-motion state.
- **Do** keep supporting text on any scene field at 4.5:1 or above; switch from on-dark-mute to on-dark wherever the field is too light to hold it.

### Don't:
- **Don't** build a split hero with a photo on one side and a card grid below.
- **Don't** put product cards on tinted boxes or shadows; products live in ruled cells.
- **Don't** add ornaments beyond the five-point star and the badge, and draw the star as SVG, not as a text glyph.
- **Don't** use mustard as a fill on cream surfaces for primary commerce; there the action is ink.
- **Don't** cast shadows from interface chrome; shadows belong to the food and to overlays.
- **Don't** use photography or stock imagery; imagery is the procedural render set.
