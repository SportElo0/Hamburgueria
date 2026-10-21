---
name: LM Barbearia
description: A one-chair neighborhood barbershop site cut like a skin fade, measured in clipper guards.
colors:
  fade-0: "#0b0c0e"
  fade-1: "#101215"
  fade-2: "#141619"
  fade-3: "#17191d"
  fade-4: "#1d2025"
  fade-5: "#252930"
  line: "#2a2e35"
  line-strong: "#3b4048"
  paper: "#f5f2ed"
  steel: "#a6a8ad"
  steel-dim: "#85888e"
  blue: "#436bd9"
  blue-hover: "#5679dd"
  blue-ink: "#8ea8f0"
  pole: "#c8323a"
  alert: "#ff8a8f"
typography:
  display:
    fontFamily: "Archivo, Arial Narrow, ui-sans-serif, sans-serif"
    fontSize: "clamp(3.4rem, 15.5vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 66"
  headline:
    fontFamily: "Archivo, Arial Narrow, ui-sans-serif, sans-serif"
    fontSize: "clamp(3rem, 11vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 66"
  title:
    fontFamily: "Archivo, Arial Narrow, ui-sans-serif, sans-serif"
    fontSize: "clamp(2rem, 7.5vw, 3rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 66"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: "'ss01' on"
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  guard:
    fontFamily: "Archivo, Arial Narrow, ui-sans-serif, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
    fontFeature: "'tnum' on"
    fontVariation: "'wdth' 80"
rounded:
  hair: "1px"
  tag: "2px"
  control: "3px"
  panel: "4px"
spacing:
  gutter-mobile: "16px"
  gutter-tablet: "24px"
  gutter-desktop: "40px"
  section-mobile: "80px"
  section-tablet: "112px"
  section-desktop: "144px"
  container: "90rem"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 1.4rem"
    height: "3.25rem"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 1.4rem"
    height: "3.25rem"
  button-ghost-hover:
    backgroundColor: "{colors.fade-3}"
  button-disabled:
    backgroundColor: "{colors.fade-4}"
    textColor: "{colors.steel-dim}"
  chip-service:
    backgroundColor: "{colors.fade-0}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 0.875rem"
    height: "2.5rem"
  slot:
    backgroundColor: "{colors.fade-3}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "3rem"
  slot-selected:
    backgroundColor: "{colors.blue}"
    textColor: "#ffffff"
  input:
    backgroundColor: "{colors.fade-0}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "3.25rem"
  guard-tag:
    textColor: "{colors.steel}"
    typography: "{typography.guard}"
    rounded: "{rounded.tag}"
    padding: "0.375rem 0.5rem"
---

# Design System: LM Barbearia

## Overview

**Creative North Star: "The Skin Fade"**

The site is cut the way Leonardo cuts hair. Grounds climb in hard tonal steps from near-black to graphite, and every step carries the number of the clipper guard that would cut it: #0, #½, #1, #1½, #2, #3. The guard scale is the measuring system for everything: the hero bands, the mobile menu, the booking progress, the little five-step mark next to each service. Nothing blends; each step is a clean line.

The material is dark, matte and blade-precise. Surfaces are flat colour fields separated by 1px hairlines and near-square corners. The voice is a condensed, heavy, uppercase Archivo, like shop signage, set against a calm Manrope body. One blue does all the asking (actions and selection); a barber-pole red appears only as a tiny detail. It reads premium without pretending to be a luxury brand: no gold, no ornament, no glow.

Motion is a cut, not a float. Bands scale up from their bottom edge, headline lines are revealed by a clip from below, panels rise a few pixels. Everything eases out-expo, content is visible without JavaScript, and reduced motion means a static page.

**Key Characteristics:**
- Six-step fade ramp (#0 to #3) as grounds, always in hard steps
- Guard tags (#1½) as the labelling and measuring device
- Condensed, heavy, uppercase display; quiet Manrope body
- Blue reserved for action and selection
- 1px hairlines and 1–4px corners
- Clip-path and transform motion on ease-out-expo

## Colors

A cool near-black fade ramp, warm white ink, metallic grey secondary text, one action blue and a pinch of barber-pole red.

### Primary
- **Chair Blue** (blue): the only action colour. Primary buttons, selected date and time slots, the active booking step, selected service cards (as a 12% tint with a blue border), the location pin and text selection.
- **Chair Blue Lifted** (blue-hover): hover state of primary buttons.
- **Blue Ink** (blue-ink): blue as a line or text on dark. Focus rings, caret, active nav underline, completed booking steps (at 70%), link hover, hover border on service chips.

### Tertiary
- **Barber Pole Red** (pole): a detail colour, used on the footer's 8px address dot. It never fills a surface or carries text.

### Neutral
- **Fade #0 to #3** (fade-0 to fade-5): the ground ramp. fade-0 is the page and the deepest band; fade-1 and fade-2 are alternating section grounds; fade-3 is the booking ground and the resting fill of slots; fade-4 is the review strip and the disabled button; fade-5 is the brightest step (placeholder tops, hover on slots, unreached booking steps).
- **Hairline** (line): section and list dividers, header border when solid.
- **Hairline Strong** (line-strong): control strokes (ghost buttons, chips, inputs, icon buttons), the wordmark divider, scrollbar thumb.
- **Paper** (paper): primary text and display type. Used at 85–90% opacity for long body copy on dark.
- **Steel** (steel): secondary text, guard labels, ghost-button hover border.
- **Steel Dim** (steel-dim): placeholders, weekday labels, disabled text.
- **Alert** (alert): inline error messages in the booking flow.

### Named Rules
**The One Blue Rule.** Blue means "do this" or "this is chosen". It never decorates a heading, a band or a background.

**The Pole Pinch Rule.** Barber-pole red stays a detail of 8px or less. If it is wider than a dot or a line, it is wrong.

**The Hard Step Rule.** Grounds change in hard steps of the fade ramp. Adjacent sections take different steps; bands over a photo are stacked opaque or translucent fade-0 layers with a 1px paper/7% top edge. No smooth gradients.

## Typography

**Display Font:** Archivo, condensed through its width axis (wdth 66), with Arial Narrow fallback
**Body Font:** Manrope (with ui-sans-serif, system-ui), stylistic set ss01 on
**Label Font:** Archivo at wdth 80 for guard tags

**Character:** Shop-sign display against a friendly, legible grotesk. The display is loud and short; Manrope does the explaining.

### Hierarchy
- **Display** (800, clamp(3.4rem, 15.5vw, 6rem), 0.98): the hero headline only, uppercase, revealed line by line.
- **Headline** (800, clamp(2.6rem–3rem, 9–11vw, 4.6rem–5.5rem), 0.98): section titles (Serviços, Cortes, Agendar, FAQ), uppercase.
- **Title** (800, clamp(2rem, 7.5vw, 3rem), 0.98): service names, booking step headings, the mobile menu items (2.6rem), gallery captions (1.35–1.7rem).
- **Body** (400, 1rem–1.125rem, 1.625): paragraphs in steel or paper at 85–90%, held to 34–58ch.
- **Label** (600, 0.875–0.95rem): buttons (700, 0.95rem), nav links, form labels, chip text.
- **Guard** (600, 0.75rem, 0.06em tracking, tabular, uppercase when it is a word): clipper numbers, placeholder notices, weekday headers, the wordmark's BARBEARIA line.

### Named Rules
**The Sign Rule.** Archivo appears only condensed, heavy and uppercase (or as a guard tag). Never set body copy or buttons in it.

**The Tabular Rule.** Times, dates, counters and prices use tabular numerals.

## Layout

A single scrolling page in a 90rem container with gutters of 16px, 24px and 40px (mobile, sm, lg). Sections stack on alternating fade steps with vertical padding of 80px, 112px and 144px; the review strip is the one shorter band (64/80/96px). On large screens content sits on a 12-column grid, usually a 7/5 split with the display title on the left and the explaining paragraph bottom-aligned on the right. Lists (services, about commitments, FAQ) are full-width rows divided by hairlines rather than cards. On mobile everything stacks, buttons go full-width, and a fixed bottom bar with the primary action and WhatsApp appears once the hero has left the screen and hides while booking is visible. Touch targets are at least 40px, mostly 44–52px.

## Elevation & Depth

Flat. There are no box shadows. Depth comes from the fade ramp: a raised or active thing takes a brighter step (fade-3 to fade-5), and layers over photos are translucent fade-0 bands. The fixed header and mobile bar are the only blurred surfaces: fade-0 at 92–94% with a medium backdrop blur and a hairline edge, so they read as part of the ground.

### Named Rules
**The No-Shadow Rule.** Lift is a lighter fade step or a hairline, never a shadow.

## Shapes

Near-square everywhere: 3px on controls, slots, photos and panels, 2px on guard tags and focus rings, 1px on fade marks and step bars, 4px on the map panel. Full circles are reserved for small markers (the selection check, the location pin, the pole dot). Edges are 1px hairlines; dashed hairlines mark provisional content. The recurring silhouette is the staircase: bands stacked bottom-up, bars of rising height.

## Components

### Buttons
Firm, compact, blade-cut.
- **Shape:** near-square (3px), 52px tall, 1.4rem side padding, 700 weight Manrope at 0.95rem.
- **Primary:** Chair Blue with white text; hover lifts to Chair Blue Lifted.
- **Ghost:** transparent with a Hairline Strong 1px stroke and Paper text; hover brightens the stroke to Steel and fills fade-3. Over photos or bands it sits on fade-0.
- **States:** pressing nudges down 1px; a trailing arrow nudges 3px right on hover; disabled is fade-4 with Steel Dim text. Transitions 180ms ease-out-quart.

### Chips
- **Style:** service quick-picks in the hero. 40px tall, 3px corners, Hairline Strong stroke over fade-0 at 60%, Paper semibold text.
- **State:** hover turns the stroke Blue Ink and the fill fade-3. They are actions (jump into booking preselected), not filters.

### Cards / Containers
- **Corner Style:** 3px.
- **Background:** booking service options sit on fade-2 with a Hairline Strong stroke; selected becomes a blue border with a 12% blue fill and a filled blue check circle.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Internal Padding:** 12–16px.

### Inputs / Fields
- **Style:** 52px tall, fade-0 fill, Hairline Strong 1px stroke, 3px corners, 1rem Paper text, Steel Dim placeholder.
- **Focus:** stroke turns Blue Ink.
- **Error:** an Alert-coloured message below, announced as an alert.

### Date and Time Slots
Tabular, semibold, 3px corners, fade-3 at rest, fade-5 on hover, Chair Blue with white text when chosen. Today carries a 2px Blue Ink underbar. Closed days are struck through in Steel Dim.

### Navigation
Header is transparent over the hero and turns solid fade-0/92 with blur and a hairline once scrolled. Desktop links are Steel, turning Paper on hover; the current section gets a 1px Blue Ink underline that scales in from the left. On mobile a 44px square menu button opens a full-height sheet (clipped down from the top) whose items are stacked fade bands from #3 to #½, each a Title-size uppercase link with its guard number on the right.

### Guard Scale (signature)
The fade expressed as a measuring device. In the hero, five bands rise from the bottom over the photo with a right-hand ruler (#½ to #2) of steel guard tags and short steel hairlines; they scale in from the bottom in a 70ms stagger. The booking progress is six bars of rising height (10px + 5px per step) labelled #0 to #3: unreached fade-5, done Blue Ink at 70%, current Chair Blue. Each service has a Fade Mark: five 5px bars of rising height with the worked zones lit Steel (Blue Ink on hover).

### Photo Slot
Real photos fill with object-cover inside 3px corners. Until a photo exists the slot is an honest placeholder: stacked fade steps, a 7% paper diagonal hatch, a camera icon with the caption, and a guard tag reading FOTO TEMPORÁRIA. Gallery tiles darken their foot with three translucent fade-0 bands under the caption.

## Do's and Don'ts

### Do:
- **Do** change grounds in hard fade steps and label steps with guard numbers when the scale is shown.
- **Do** keep blue for actions, selection, focus and progress.
- **Do** set titles in condensed (wdth 66), 800-weight, uppercase Archivo at 0.98 line height.
- **Do** use 3px corners for controls and imagery, 1px hairlines for division, and tabular numerals for times and dates.
- **Do** animate with transform, opacity and clip-path on ease-out-expo, with content visible by default and a static page under reduced motion.
- **Do** mark placeholder photos and draft copy as temporary with a guard tag.

### Don't:
- **Don't** use smooth gradients, gold, glows or box shadows.
- **Don't** let barber-pole red grow past an 8px detail or carry text.
- **Don't** round controls or surfaces beyond 4px; full circles are for small markers only.
- **Don't** set Archivo at normal width, light weight or in sentence case for headings.
- **Don't** box lists into grids of equal cards; services, commitments and FAQ are full-width rows divided by hairlines.
