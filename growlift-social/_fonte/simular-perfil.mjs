// Simulates the Instagram profile header: profile photo + highlight circles at real display size.
import sharp from 'sharp';
import path from 'node:path';
const [dir, out] = process.argv.slice(2);
const names = ['Projetos', 'Serviços', 'Clientes', 'Design', 'Processo', 'Contato'];
const files = ['1-projetos', '2-servicos', '3-clientes', '4-design', '5-processo', '6-contato'].map((f) => path.join(dir, f + '.png'));
const D = 64 * 2; // 64pt circles at 2x
const circle = (buf, d) => sharp(buf).resize(d, d).composite([{ input: Buffer.from(`<svg width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}"/></svg>`), blend: 'dest-in' }]).png().toBuffer();
const cropCentre = (f) => sharp(f).extract({ left: 0, top: 420, width: 1080, height: 1080 }).toBuffer();
const items = await Promise.all(files.map(async (f) => circle(await cropCentre(f), D)));
const ring = (d) => Buffer.from(`<svg width="${d + 12}" height="${d + 12}"><circle cx="${(d + 12) / 2}" cy="${(d + 12) / 2}" r="${d / 2 + 4}" fill="none" stroke="#3a3f47" stroke-width="2"/></svg>`);
const prof = await circle(await sharp(path.join(dir, '../../../02-instagram-perfil/foto-perfil.png')).toBuffer(), 172);
const W = 750, H = 420;
const comps = [{ input: prof, left: 32, top: 40 }];
items.forEach((b, i) => {
  const x = 24 + i * 120, y = 250;
  comps.push({ input: ring(D), left: x - 6, top: y - 6 }, { input: b, left: x, top: y });
  comps.push({ input: Buffer.from(`<svg width="130" height="40"><text x="65" y="26" font-family="Helvetica,Arial" font-size="22" fill="#f5f5f5" text-anchor="middle">${names[i]}</text></svg>`), left: x - 1, top: y + D + 8 });
});
comps.push({ input: Buffer.from(`<svg width="500" height="140"><text x="0" y="40" font-family="Helvetica,Arial" font-weight="700" font-size="30" fill="#f5f5f5">Growlift | Sites &amp; Marketing</text><text x="0" y="82" font-family="Helvetica,Arial" font-size="24" fill="#a8a8a8">Agência de marketing</text></svg>`), left: 230, top: 70 });
await sharp({ create: { width: W, height: H, channels: 3, background: '#000000' } }).composite(comps).png().toFile(out);
console.log(out);
