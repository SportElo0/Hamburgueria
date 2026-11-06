// Builds a simple 3D burger (GLB) to test the "dish in 3D" flow without a real scan.
// It is NOT a real dish: never put it on a real store's menu.
//   node scripts/prato-teste-3d.mjs saida.glb [--textura] [--cm 22]
// --textura adds a 2048 px texture to the top bun, to test the browser's texture reduction.
// --cm N scales it to N cm wide (with the plate), as the panel's upload does; for the public example menu.
import { Document, NodeIO, getBounds } from '@gltf-transform/core';
import sharp from 'sharp';

const [out = 'prato-teste.glb', ...flags] = process.argv.slice(2);
const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('prato-teste');
// Deliberately in the wrong unit (1 unit = 10 cm wide burger, 1.6 units of plate): the upload fixes the size.
const SEG = 64;

function accessor(type, array) {
  return doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
}

/** A closed shape of revolution from a (radius, height) profile, bottom to top. */
function lathe(profile) {
  const pos = [];
  const nor = [];
  const uv = [];
  const idx = [];
  const rings = profile.length;
  for (let r = 0; r < rings; r++) {
    const [rad, y] = profile[r];
    const prev = profile[Math.max(0, r - 1)];
    const next = profile[Math.min(rings - 1, r + 1)];
    const dr = next[0] - prev[0];
    const dy = next[1] - prev[1];
    for (let s = 0; s <= SEG; s++) {
      const a = (s / SEG) * Math.PI * 2;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      pos.push(rad * c, y, rad * sn);
      // Normal of the profile curve, turned around the axis.
      const nx = dy;
      const ny = -dr;
      const len = Math.hypot(nx, ny) || 1;
      nor.push((nx / len) * c, ny / len, (nx / len) * sn);
      uv.push(s / SEG, r / (rings - 1));
    }
  }
  for (let r = 0; r < rings - 1; r++) {
    for (let s = 0; s < SEG; s++) {
      const a = r * (SEG + 1) + s;
      const b = a + SEG + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  return doc
    .createPrimitive()
    .setAttribute('POSITION', accessor('VEC3', new Float32Array(pos)))
    .setAttribute('NORMAL', accessor('VEC3', new Float32Array(nor)))
    .setAttribute('TEXCOORD_0', accessor('VEC2', new Float32Array(uv)))
    .setIndices(accessor('SCALAR', new Uint32Array(idx)));
}

function material(name, rgb, rough = 0.7) {
  return doc.createMaterial(name).setBaseColorFactor([...rgb.map((v) => (v / 255) ** 2.2), 1]).setRoughnessFactor(rough).setMetallicFactor(0);
}

function add(name, prim, mat) {
  prim.setMaterial(mat);
  scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
}

const dome = (r, y0, h, n = 10) => Array.from({ length: n + 1 }, (_, i) => {
  const t = (i / n) * (Math.PI / 2);
  return [Math.max(0.0001, r * Math.cos(t)), y0 + h * Math.sin(t)];
});

add('prato', lathe([[0.0001, 0], [0.8, 0], [0.82, 0.03], [0.8, 0.05], [0.62, 0.04], [0.0001, 0.035]]), material('prato', [240, 240, 236], 0.35));
add('pao-base', lathe([[0.0001, 0.05], [0.46, 0.05], [0.5, 0.08], [0.5, 0.16], [0.0001, 0.16]]), material('pao', [214, 150, 78]));
add('carne', lathe([[0.0001, 0.16], [0.53, 0.16], [0.55, 0.2], [0.53, 0.26], [0.0001, 0.26]]), material('carne', [92, 52, 34], 0.85));
add('queijo', lathe([[0.0001, 0.26], [0.56, 0.26], [0.57, 0.28], [0.0001, 0.285]]), material('queijo', [246, 186, 52], 0.5));
add('alface', lathe([[0.0001, 0.285], [0.58, 0.285], [0.6, 0.3], [0.0001, 0.31]]), material('alface', [96, 168, 60], 0.6));
const topo = material('pao-topo', [206, 132, 58], 0.6);
add('pao-topo', lathe([[0.0001, 0.31], [0.5, 0.31], ...dome(0.5, 0.31, 0.3).slice(1)]), topo);

if (flags.includes('--textura')) {
  const size = 2048;
  const raw = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const o = (y * size + x) * 3;
    const seed = ((x * 73856093) ^ (y * 19349663)) % 997 < 6;
    raw[o] = seed ? 250 : 206; raw[o + 1] = seed ? 240 : 132; raw[o + 2] = seed ? 210 : 58;
  }
  const png = await sharp(raw, { raw: { width: size, height: size, channels: 3 } }).png().toBuffer();
  topo.setBaseColorFactor([1, 1, 1, 1]).setBaseColorTexture(doc.createTexture('gergelim').setImage(new Uint8Array(png)).setMimeType('image/png'));
}

const cmAt = flags.indexOf('--cm');
if (cmAt >= 0) {
  // Same as assentar() in src/lib/modelo3d.ts: widest side seen from above = N cm, centred, resting at height 0.
  const cm = Number(flags[cmAt + 1]);
  const { min, max } = getBounds(scene);
  const f = cm / 100 / Math.max(max[0] - min[0], max[2] - min[2]);
  const raiz = doc.createNode('tamanho-real').setScale([f, f, f]).setTranslation([-((min[0] + max[0]) / 2) * f, -min[1] * f, -((min[2] + max[2]) / 2) * f]);
  for (const child of [...scene.listChildren()]) {
    scene.removeChild(child);
    raiz.addChild(child);
  }
  scene.addChild(raiz);
  const b = getBounds(scene);
  console.log('medidas (cm):', ((b.max[0] - b.min[0]) * 100).toFixed(1), 'x', ((b.max[1] - b.min[1]) * 100).toFixed(1));
}

await new NodeIO().write(out, doc);
console.log('gravado', out);
