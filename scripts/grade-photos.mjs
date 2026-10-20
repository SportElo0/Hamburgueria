// Applies one consistent color treatment (warm tone, soft contrast, light vignette) to the
// real pousada photos, so phone photos from different cameras read as one series.
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, "..", "public", "images");

const PHOTOS = ["hero-fachada.jpg", "piscina.jpg", "quarto-verde.jpg", "quarto-amarelo.jpg"];

// A soft radial vignette as an SVG mask, composited as multiply to darken the edges a touch.
function vignetteSvg(width, height) {
  const r = Math.max(width, height) * 0.75;
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="v" cx="50%" cy="46%" r="${(r / width) * 100}%">
          <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.38"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#v)"/>
    </svg>
  `);
}

// A flat warm-amber fill, blended in softly (not `.tint()`, which desaturates toward a duotone).
function warmOverlaySvg(width, height) {
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="#ffb347"/></svg>`);
}

async function grade(file) {
  const input = path.join(IMAGES_DIR, file);
  const output = path.join(IMAGES_DIR, file.replace(/\.jpe?g$/i, "-graded.jpg"));
  const img = sharp(input);
  const meta = await img.metadata();

  await sharp(input)
    // Soft contrast, a touch more saturation.
    .modulate({ saturation: 1.1, brightness: 1.02 })
    .linear(1.05, -6)
    // Warm cast as a soft-light blend (keeps detail and color, just nudges the palette warm).
    .composite([
      { input: warmOverlaySvg(meta.width, meta.height), blend: "soft-light" },
      { input: vignetteSvg(meta.width, meta.height), blend: "multiply" },
    ])
    .jpeg({ quality: 88 })
    .toFile(output);

  console.log(`graded: ${file} -> ${path.basename(output)}`);
}

for (const file of PHOTOS) await grade(file);

// Sample the facade's wall color for the site's accent yellow (a patch clear of doors/shadow).
const facade = sharp(path.join(IMAGES_DIR, "hero-fachada.jpg"));
const { width, height } = await facade.metadata();
const patch = await facade
  .extract({ left: Math.round(width * 0.73), top: Math.round(height * 0.52), width: Math.round(width * 0.08), height: Math.round(height * 0.08) })
  .resize(1, 1)
  .raw()
  .toBuffer();
const [r, g, b] = patch;
const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
console.log(`accent sampled from facade wall: ${hex} (rgb ${r}, ${g}, ${b})`);
