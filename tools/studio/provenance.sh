#!/usr/bin/env sh
# Embeds origin metadata into every rendered raster (Impeccable provenance). Run after render.mjs.
B=.claude/skills/impeccable/scripts/impeccable
[ -x "$B" ] || { echo "impeccable CLI not found, skipping provenance"; exit 0; }
find public/renders -name '*.webp' | while read -r f; do
  name=$(basename "$f" .webp); dir=$(basename "$(dirname "$f")")
  case "$f" in *burgers*) src="burger recipe '$dir' (tools/studio/recipes.js), output '$name'";; *) src="prop scene '$name' (tools/studio/props.js)";; esac
  "$B" embed-prompt "$f" --prompt "Origin: procedural 3D render, not a photograph and not AI-generated. Rendered offline by tools/studio/render.mjs (Three.js in headless Chromium, post-processed with sharp) from $src. Illustrative image for Downtown Burger; ingredients follow the printed menu description." >/dev/null
done
"$B" embed-prompt --scan public/renders | tail -1
