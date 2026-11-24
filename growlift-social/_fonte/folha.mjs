// Contact sheet: node _fonte/folha.mjs <out.png> <cols> <thumbWidth> <files...>
import sharp from 'sharp';
const [out, colsArg, twArg, ...files] = process.argv.slice(2);
const cols = Number(colsArg), tw = Number(twArg);
const metas = await Promise.all(files.map((f) => sharp(f).metadata()));
const th = Math.round((tw * metas[0].height) / metas[0].width);
const gap = 16, rows = Math.ceil(files.length / cols);
const thumbs = await Promise.all(files.map((f) => sharp(f).resize(tw, th).toBuffer()));
await sharp({ create: { width: cols * tw + (cols + 1) * gap, height: rows * th + (rows + 1) * gap, channels: 3, background: '#2a2d33' } })
  .composite(thumbs.map((b, i) => ({ input: b, left: gap + (i % cols) * (tw + gap), top: gap + Math.floor(i / cols) * (th + gap) })))
  .png().toFile(out);
console.log(out);
