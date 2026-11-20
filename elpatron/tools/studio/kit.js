// Procedural ingredient kit for Downtown Burger illustrative renders.
// Every builder returns { group, height, radius, label } where height is the
// vertical space the ingredient occupies once stacked.
import * as THREE from 'three';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createNoise, clamp, lerp, smoothstep } from './noise.js';

const V2 = THREE.Vector2;
export const C = (hex) => new THREE.Color(hex);
export const mixC = (a, b, t) => a.clone().lerp(b, clamp(t));

export function lathe(points, segments = 256) {
  let g = new THREE.LatheGeometry(points, segments);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);
  g.computeVertexNormals();
  return g;
}

export function displace(geom, fn) {
  const pos = geom.attributes.position;
  const nor = geom.attributes.normal;
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const d = fn(p, n, i);
    pos.setXYZ(i, p.x + n.x * d, p.y + n.y * d, p.z + n.z * d);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
}

export function paint(geom, fn) {
  const pos = geom.attributes.position;
  const nor = geom.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const c = fn(p, n, i);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

export function physical(opts) {
  return new THREE.MeshPhysicalMaterial({ vertexColors: true, ...opts });
}

export function shadowed(obj) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return obj;
}

// Raycast straight down onto a mesh to place surface details.
const _ray = new THREE.Raycaster();
function dropOnto(mesh, x, z) {
  _ray.set(new THREE.Vector3(x, 50, z), new THREE.Vector3(0, -1, 0));
  const hit = _ray.intersectObject(mesh, false)[0];
  if (!hit) return null;
  const normal = hit.face.normal.clone().transformDirection(mesh.matrixWorld);
  return { point: hit.point, normal };
}

function scatterInstances(geometry, material, target, count, rng, { maxR, minR = 0, lift = 0.01, align = true, scale = [1, 1] }) {
  const inst = new THREE.InstancedMesh(geometry, material, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const q2 = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  let placed = 0;
  target.updateMatrixWorld(true);
  let guard = 0;
  while (placed < count && guard++ < count * 6) {
    const r = Math.sqrt(lerp(minR * minR, maxR * maxR, rng()));
    const a = rng() * Math.PI * 2;
    const hit = dropOnto(target, Math.cos(a) * r, Math.sin(a) * r);
    if (!hit) continue;
    if (align) q.setFromUnitVectors(up, hit.normal);
    else q.identity();
    q2.setFromAxisAngle(up, rng() * Math.PI * 2);
    q.multiply(q2);
    const s = lerp(scale[0], scale[1], rng());
    m.compose(hit.point.clone().addScaledVector(hit.normal, lift), q, new THREE.Vector3(s, s, s));
    inst.setMatrixAt(placed++, m);
  }
  inst.count = placed;
  inst.instanceMatrix.needsUpdate = true;
  return inst;
}

export function canvasTexture(size, draw, { repeat = false } = {}) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function pixelTexture(size, fn, { colorSpace = THREE.SRGBColorSpace } = {}) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a = 255] = fn(x / size, y / size);
      const i = (y * size + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = colorSpace;
  tex.anisotropy = 8;
  return tex;
}

export const hexRGB = (hex) => {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
export const mixRGB = (a, b, t) => {
  t = clamp(t);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
};

// ───────────────────────────────── Buns ─────────────────────────────────

const BUN_PALETTES = {
  brioche: {
    under: '#9a5a26', ring: '#dea258', side: '#b8661f', crown: '#7c300b', top: '#5a2207', spot: '#421a06',
    crumb: '#e2b273', toast: '#a86226',
  },
  australiano: {
    under: '#3a1b0c', ring: '#5b2c14', side: '#3e1c0d', crown: '#3a190b', top: '#2e1408', spot: '#21100a',
    crumb: '#6e3d20', toast: '#4a2412',
  },
};

export function bunTop({ R = 5.25, H = 2.85, style = 'brioche', seed = 11, seeds = style === 'brioche', label } = {}) {
  const n = createNoise(seed);
  const pal = BUN_PALETTES[style];
  const base = -0.3;
  const pts = [new V2(0.001, base)];
  for (let i = 1; i <= 14; i++) pts.push(new V2((R * 0.88 * i) / 14, base));
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    pts.push(new V2(R * 0.88 + R * 0.12 * Math.sin(a), base + (0.12 - base) * (1 - Math.cos(a))));
  }
  const ne = 2.35;
  for (let i = 1; i <= 70; i++) {
    const phi = (Math.PI / 2) * (1 - i / 70);
    const r = R * Math.pow(Math.sin(phi), 2 / ne);
    const y = 0.12 + (H - 0.12) * Math.pow(Math.cos(phi), 2 / ne);
    pts.push(new V2(Math.max(r, 0.001), y));
  }
  const g = lathe(pts, 320);
  // Organic asymmetry + gentle surface undulation.
  displace(g, (p, nn) => {
    const ang = Math.atan2(p.z, p.x);
    const lump = 0.035 * n.fbm(Math.cos(ang) * 1.3, p.y * 0.25, Math.sin(ang) * 1.3, 3);
    const fine = 0.004 * n.noise3(p.x * 2.4, p.y * 2.4, p.z * 2.4);
    return p.y > base + 0.02 ? lump + fine : 0;
  });
  const cU = C(pal.under), cR = C(pal.ring), cS = C(pal.side), cCr = C(pal.crown), cT = C(pal.top), cSp = C(pal.spot);
  paint(g, (p) => {
    if (p.y < base + 0.03) return cU;
    const h = clamp((p.y - 0.12) / (H - 0.12));
    const mott = n.fbm(p.x * 0.7, p.y * 0.7, p.z * 0.7, 3);
    let c;
    if (h < 0.1) c = mixC(cR, cS, smoothstep(0.0, 0.1, h + mott * 0.04));
    else if (h < 0.42) c = mixC(cS, cCr, smoothstep(0.1, 0.42, h + mott * 0.12));
    else c = mixC(cCr, cT, smoothstep(0.42, 0.85, h + mott * 0.12));
    const spot = n.noise3(p.x * 1.6 + 7, p.y * 1.6, p.z * 1.6);
    if (spot > 0.55) c = mixC(c, cSp, (spot - 0.55) * 0.9);
    const pale = n.noise3(p.x * 0.9 - 3, p.y, p.z * 0.9);
    if (pale > 0.5 && h > 0.2) c = mixC(c, cS, (pale - 0.5) * 0.9);
    return c;
  });
  const glossy = style === 'brioche';
  const mesh = new THREE.Mesh(
    g,
    physical({
      roughness: glossy ? 0.48 : 0.66,
      clearcoat: glossy ? 0.38 : 0.12,
      clearcoatRoughness: glossy ? 0.38 : 0.55,
      sheen: 0.35,
      sheenRoughness: 0.55,
      sheenColor: C(glossy ? '#ffcf96' : '#a87048'),
    }),
  );
  const group = new THREE.Group();
  group.add(mesh);
  const rng = n.rand;
  if (seeds) {
    const seedGeo = new THREE.SphereGeometry(1, 16, 10);
    const sp = seedGeo.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i);
      sp.setXYZ(i, x * 0.17, sp.getY(i) * 0.05, sp.getZ(i) * 0.095 * (1 - 0.45 * Math.max(0, x)));
    }
    seedGeo.computeVertexNormals();
    const seedMat = new THREE.MeshPhysicalMaterial({
      color: C('#f1e2b8'), roughness: 0.42, clearcoat: 0.3, sheen: 0.4, sheenColor: C('#fff4d6'),
    });
    group.add(scatterInstances(seedGeo, seedMat, mesh, 210, rng, { maxR: R * 0.84, lift: 0.012, scale: [0.85, 1.15] }));
  } else if (style !== 'brioche') {
    // Australiano: flour flecks. A plain brioche top stays smooth and glossy.
    const fleck = new THREE.IcosahedronGeometry(0.045, 0);
    const fleckMat = new THREE.MeshStandardMaterial({ color: C('#d6b06c'), roughness: 0.9 });
    group.add(scatterInstances(fleck, fleckMat, mesh, 1400, rng, { maxR: R * 0.97, lift: 0.0, scale: [0.6, 1.4] }));
  }
  group.position.y = -base;
  const outer = new THREE.Group().add(shadowed(group));
  return { group: outer, height: H - base, radius: R, label: label ?? (style === 'brioche' ? 'Pão brioche' : 'Pão australiano') };
}

export function bunBottom({ R = 5.1, H = 1.35, style = 'brioche', seed = 21, label } = {}) {
  const n = createNoise(seed);
  const pal = BUN_PALETTES[style];
  const pts = [new V2(0.001, 0)];
  for (let i = 1; i <= 10; i++) pts.push(new V2(((R - 0.55) * i) / 10, 0));
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    pts.push(new V2(R - 0.55 + 0.55 * Math.sin(a), 0.55 - 0.55 * Math.cos(a)));
  }
  for (let i = 1; i <= 6; i++) pts.push(new V2(R + 0.04 * Math.sin((i / 6) * Math.PI), 0.55 + (0.42 * i) / 6));
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push(new V2(R - 0.38 + 0.38 * Math.cos(a), 0.97 + 0.33 * Math.sin(a)));
  }
  for (let i = 1; i <= 36; i++) {
    const r = (R - 0.38) * (1 - i / 36);
    pts.push(new V2(Math.max(r, 0.001), H - 0.05 * Math.sin((i / 36) * Math.PI)));
  }
  const g = lathe(pts, 320);
  displace(g, (p) => {
    const top = p.y > H - 0.12;
    if (top) return 0.035 * n.ridged(p.x * 2.2, p.z * 2.2, 3, 3) - 0.02;
    const ang = Math.atan2(p.z, p.x);
    return 0.05 * n.fbm(Math.cos(ang) * 1.5, p.y * 0.4, Math.sin(ang) * 1.5, 3);
  });
  const cCrumb = C(pal.crumb), cToast = C(pal.toast), cSide = C(pal.side), cRing = C(pal.ring), cUnder = C(pal.under);
  paint(g, (p) => {
    const r = Math.hypot(p.x, p.z);
    if (p.y > H - 0.18 && r < R - 0.3) {
      const t = n.fbm(p.x * 0.6, 3, p.z * 0.6, 4);
      const edge = smoothstep(R - 1.6, R - 0.3, r);
      return mixC(cCrumb, cToast, clamp(0.35 + t * 0.9 + edge * 0.5));
    }
    const h = clamp(p.y / H);
    const m = n.fbm(p.x * 0.8, p.y, p.z * 0.8, 3);
    const blotch = n.fbm(p.x * 0.5 + 9, p.y * 0.8, p.z * 0.5, 3);
    if (h < 0.3) return mixC(cUnder, cSide, h * 3.3 + m * 0.3);
    const c = mixC(cSide, cRing, smoothstep(0.45, 0.98, h) * 0.85 + m * 0.15);
    return mixC(c, cUnder, clamp(blotch * 0.7));
  });
  const mesh = new THREE.Mesh(
    g,
    physical({ roughness: style === 'brioche' ? 0.62 : 0.72, clearcoat: 0.12, clearcoatRoughness: 0.55, sheen: 0.3, sheenColor: C(style === 'brioche' ? '#e8b67a' : '#6a3a1e') }),
  );
  const group = new THREE.Group();
  group.add(mesh);
  return { group: shadowed(group), height: H, radius: R, label: label ?? (style === 'brioche' ? 'Pão brioche (base)' : 'Pão australiano (base)') };
}

// ───────────────────────────────── Patties ─────────────────────────────────

export function patty({ R = 4.95, H = 1.45, seed = 31, variant = 'beef', label = 'Blend bovino 180 g' } = {}) {
  const n = createNoise(seed);
  const rc = Math.min(0.55, H * 0.42);
  const pts = [new V2(0.001, 0)];
  for (let i = 1; i <= 24; i++) pts.push(new V2(((R - rc) * i) / 24, 0));
  for (let i = 1; i <= 14; i++) {
    const a = (i / 14) * (Math.PI / 2);
    pts.push(new V2(R - rc + rc * Math.sin(a), rc - rc * Math.cos(a)));
  }
  for (let i = 1; i <= 10; i++) pts.push(new V2(R, rc + ((H - 2 * rc) * i) / 10));
  for (let i = 1; i <= 14; i++) {
    const a = (i / 14) * (Math.PI / 2);
    pts.push(new V2(R - rc + rc * Math.cos(a), H - rc + rc * Math.sin(a)));
  }
  for (let i = 1; i <= 30; i++) pts.push(new V2(Math.max((R - rc) * (1 - i / 30), 0.001), H));
  const g = lathe(pts, 420);
  // Irregular outline (pushed horizontally), then meaty surface relief along normals.
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 0.01) continue;
    const ang = Math.atan2(z, x);
    const w = smoothstep(R * 0.3, R, r);
    const dr = 0.28 * n.fbm(Math.cos(ang) * 1.4, y * 0.15, Math.sin(ang) * 1.4, 3) * w;
    const k = (r + dr) / r;
    pos.setXYZ(i, x * k, y + 0.06 * n.noise3(x * 0.4, 2, z * 0.4) * (y > H / 2 ? 1 : -1), z * k);
  }
  g.computeVertexNormals();
  const crisp = variant === 'beef' ? 1 : 0.6;
  displace(g, (p) => 0.055 * crisp * n.fbm(p.x * 1.7, p.y * 1.7, p.z * 1.7, 4) + 0.04 * crisp * (n.ridged(p.x * 3.1, p.y * 3.1, p.z * 3.1, 3) - 0.45));
  const pal =
    variant === 'beef'
      ? { base: '#4a2314', char: '#1f0e07', light: '#7a3c1e', side: '#5a2a16', fat: '#9a5a33' }
      : variant === 'chicken'
        ? { base: '#c48a4a', char: '#7a4a1e', light: '#e6b77a', side: '#d9a466', fat: '#f0cf9a' }
        : { base: '#4b2a19', char: '#2a160c', light: '#7a4a2a', side: '#5a331e', fat: '#86593a' };
  const cB = C(pal.base), cCh = C(pal.char), cL = C(pal.light), cS = C(pal.side), cF = C(pal.fat);
  paint(g, (p) => {
    const t = n.fbm(p.x * 0.9, p.y * 0.9, p.z * 0.9, 4);
    const isTop = p.y > H - 0.15 || p.y < 0.15;
    let c = isTop ? mixC(cB, cCh, 0.35 + t * 0.9) : mixC(cS, cB, 0.4 + t * 0.6);
    const fleck = n.noise3(p.x * 6.5, p.y * 6.5, p.z * 6.5);
    if (fleck > 0.55) c = mixC(c, cL, (fleck - 0.55) * 1.8);
    const fat = n.noise3(p.x * 9 + 4, p.y * 9, p.z * 9);
    if (fat > 0.72) c = mixC(c, cF, (fat - 0.72) * 2.4);
    return c;
  });
  const mesh = new THREE.Mesh(
    g,
    physical({ roughness: 0.64, clearcoat: 0.22, clearcoatRoughness: 0.45, sheen: 0.25, sheenColor: C('#7a3a1a') }),
  );
  return { group: shadowed(new THREE.Group().add(mesh)), height: H, radius: R, label };
}

export function friedChicken({ seed = 41, R = 5.35, H = 1.55, label = 'Sobrecoxa empanada', tone = 'gold' } = {}) {
  const n = createNoise(seed);
  const rc = Math.min(0.6, H * 0.4);
  const pts = [new V2(0.001, 0)];
  for (let i = 1; i <= 24; i++) pts.push(new V2(((R - rc) * i) / 24, 0));
  for (let i = 1; i <= 16; i++) {
    const a = (i / 16) * Math.PI;
    pts.push(new V2(R - rc + rc * Math.sin(a), H / 2 - (H / 2) * Math.cos(a)));
  }
  for (let i = 1; i <= 30; i++) pts.push(new V2(Math.max((R - rc) * (1 - i / 30), 0.001), H));
  const g = lathe(pts, 420);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 0.01) continue;
    const ang = Math.atan2(z, x);
    const w = smoothstep(R * 0.2, R, r);
    const dr = 0.75 * n.fbm(Math.cos(ang) * 0.9, 0.3, Math.sin(ang) * 0.9, 3) * w;
    const k = (r + dr) / r;
    const dome = 0.25 * (1 - smoothstep(0, R, r)) * (y > H / 2 ? 1 : 0);
    pos.setXYZ(i, x * k * 1.06, y + dome, z * k * 0.95);
  }
  g.computeVertexNormals();
  const heights = new Float32Array(pos.count);
  displace(g, (p, _n, i) => {
    const h = 0.11 * n.ridged(p.x * 2.6, p.y * 2.6, p.z * 2.6, 4) + 0.06 * n.fbm(p.x * 6, p.y * 6, p.z * 6, 2);
    heights[i] = h;
    return h - 0.05;
  });
  const [cGold, cDeep, cHi] = (tone === 'dark' ? ['#b8742a', '#6e3a10', '#d9a050'] : tone === 'pale' ? ['#e8bf62', '#b98030', '#f7dc8a'] : ['#d99a35', '#9a5414', '#f0c060']).map(C);
  paint(g, (p, _n, i) => {
    const h = heights[i];
    let c = mixC(cDeep, cGold, smoothstep(0.03, 0.12, h));
    c = mixC(c, cHi, smoothstep(0.12, 0.17, h));
    return mixC(c, cDeep, clamp(n.fbm(p.x * 0.5, p.y, p.z * 0.5) * 0.6));
  });
  const mesh = new THREE.Mesh(g, physical({ roughness: 0.68, clearcoat: 0.25, clearcoatRoughness: 0.5, sheen: 0.4, sheenColor: C('#ffd890') }));
  return { group: shadowed(new THREE.Group().add(mesh)), height: H + 0.1, radius: R, label };
}

// ───────────────────────────────── Cheese ─────────────────────────────────

const CHEESE = {
  prato: { base: '#f4cd5c', edge: '#e9b23a', sheen: '#ffe08a', glow: '#3a2400', label: 'Queijo prato' },
  cheddar: { base: '#f7a01a', edge: '#e9800c', sheen: '#ffc04a', glow: '#3a1c00', label: 'Queijo cheddar' },
  mussarela: { base: '#f6ecd0', edge: '#ecd9a8', sheen: '#fff6dc', glow: '#2a2010', label: 'Queijo mussarela' },
  presunto: { base: '#eba7a0', edge: '#d98a84', sheen: '#ffd6d0', glow: '#2a0a08', label: 'Presunto' },
};

export function cheese({ kind = 'prato', size = 9.0, dropR = 4.6, seed = 51, sag = 0.55, label } = {}) {
  const k = CHEESE[kind];
  const n = createNoise(seed);
  const g = new THREE.BoxGeometry(size, 0.12, size, 110, 1, 110);
  g.rotateY(Math.PI / 4 + 0.12);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const d = Math.hypot(x, z);
    const wob = n.fbm(x * 0.35, 0, z * 0.35, 3);
    const over = Math.max(0, d - dropR - wob * 0.4);
    y -= sag * Math.pow(over, 1.55) + 0.05 * wob;
    // Melted corners pull back in and thicken slightly.
    const pull = 1 - 0.06 * over;
    x *= pull;
    z *= pull;
    y += 0.03 * n.noise3(x * 1.4, 0, z * 1.4);
    pos.setXYZ(i, x, y, z);
  }
  g.deleteAttribute('uv');
  g.computeVertexNormals();
  const base = C(k.base);
  const edge = C(k.edge);
  paint(g, (p) => {
    const d = Math.hypot(p.x, p.z);
    return mixC(base, edge, smoothstep(dropR - 0.5, dropR + 1.5, d) * 0.7 + n.fbm(p.x, 0, p.z) * 0.15);
  });
  const mesh = new THREE.Mesh(
    g,
    physical({ roughness: 0.38, clearcoat: 0.3, clearcoatRoughness: 0.3, sheen: 0.6, sheenColor: C(k.sheen), emissive: C(k.glow), emissiveIntensity: 0.25 }),
  );
  return { group: shadowed(new THREE.Group().add(mesh)), height: 0.12, radius: dropR + 0.8, label: label ?? k.label };
}

// ───────────────────────────────── Bacon ─────────────────────────────────

function baconTexture(seed) {
  const n = createNoise(seed);
  const meat = hexRGB('#8c2a17'), meatDark = hexRGB('#5c170b'), fat = hexRGB('#ecc9a0'), fatCrisp = hexRGB('#c7894f'), char = hexRGB('#3a1206');
  return pixelTexture(512, (u, v) => {
    const wv = v + 0.05 * n.noise3(u * 8, v * 2, 1);
    const band = Math.sin(wv * Math.PI * 5.2 + 0.6) * 0.5 + 0.5;
    const isFat = band > 0.68 || wv < 0.12 || wv > 0.9;
    const crisp = clamp(0.4 + n.fbm(u * 6, v * 3, 2, 4) * 0.9);
    let c = isFat ? mixRGB(fat, fatCrisp, crisp) : mixRGB(meat, meatDark, crisp * 0.8);
    const burn = n.noise3(u * 14, v * 6, 5);
    if (burn > 0.5) c = mixRGB(c, char, (burn - 0.5) * 1.1);
    const edge = Math.min(v, 1 - v);
    if (edge < 0.06) c = mixRGB(c, char, 0.5 * (1 - edge / 0.06));
    return c;
  });
}

export function bacon({ strips = 3, seed = 61, R = 4.8 } = {}) {
  const n = createNoise(seed);
  const group = new THREE.Group();
  const tex = baconTexture(seed);
  for (let s = 0; s < strips; s++) {
    const L = 2 * R + 1.6;
    const g = new THREE.BoxGeometry(L, 0.1, 1.75, 220, 1, 14);
    const ph = n.rand() * 6;
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      y += 0.24 * Math.sin(x * 1.2 + ph) + 0.08 * n.noise3(x * 1.2, z, s) + 0.08 * Math.sin(z * 2.2 + x);
      z *= 1 + 0.1 * n.noise3(x * 2.2, s * 3, 0);
      z += 0.18 * Math.sin(x * 0.55 + ph * 2);
      const over = Math.max(0, Math.abs(x) - R * 0.9);
      y -= 0.22 * over * over;
      pos.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25, sheen: 0.3, sheenColor: C('#ffb27a') }));
    mesh.rotation.y = (s / strips) * Math.PI * 0.9 + 0.35 + n.rand() * 0.2;
    mesh.position.y = 0.3 + s * 0.16;
    mesh.position.x = (n.rand() - 0.5) * 0.6;
    mesh.position.z = (n.rand() - 0.5) * 0.6;
    group.add(mesh);
  }
  return { group: shadowed(group), height: 0.42 + strips * 0.08, radius: R, label: 'Bacon' };
}

// ───────────────────────────────── Greens ─────────────────────────────────

export function polarSheet({ Rfn, yfn, rings = 44, segs = 420 }) {
  const verts = [];
  const idx = [];
  for (let i = 0; i <= rings; i++) {
    for (let j = 0; j <= segs; j++) {
      const t = i / rings;
      const a = (j / segs) * Math.PI * 2;
      const r = t * Rfn(a);
      verts.push(Math.cos(a) * r, yfn(r, a, t), Math.sin(a) * r);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j;
      const b = a + segs + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function lettuce({ R = 5.75, seed = 71, layers = 2 } = {}) {
  const n = createNoise(seed);
  const group = new THREE.Group();
  const pale = C('#f0f4d2'), mid = C('#cfe39a'), edge = C('#86b648'), vein = C('#f6f9e4');
  for (let l = 0; l < layers; l++) {
    const ph = l * 1.7;
    const scale = 1 - l * 0.06;
    const g = polarSheet({
      Rfn: (a) => scale * (R + 0.45 * n.fbm(Math.cos(a) * 1.6 + ph, Math.sin(a) * 1.6, l, 3)),
      yfn: (r, a, t) => {
        const amp = 0.04 + 0.62 * Math.pow(t, 2.4);
        const warp = 3.5 * n.noise3(Math.cos(a) * 2, Math.sin(a) * 2, ph);
        const ruffle = Math.sin(a * 13 + warp) * 0.45 + Math.sin(a * 31 + warp * 1.7 + r) * 0.25 + 0.45 * n.noise3(Math.cos(a) * 7, r * 0.9, ph);
        return amp * ruffle + 0.12 * n.fbm(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, ph) - 0.2 * Math.pow(t, 3) + l * 0.12;
      },
    });
    paint(g, (p) => {
      const r = Math.hypot(p.x, p.z);
      const t = clamp(r / (R * scale));
      let c = t < 0.55 ? mixC(pale, mid, t / 0.55) : mixC(mid, edge, (t - 0.55) / 0.45);
      c = mixC(c, edge, clamp(-p.y * 0.8));
      const a = Math.atan2(p.z, p.x);
      const v = Math.abs(Math.sin(a * 11 + 2 * n.noise3(p.x * 0.4, l, p.z * 0.4)));
      if (v < 0.07 && t > 0.2) c = mixC(c, vein, 0.6 * (1 - v / 0.07));
      return c;
    });
    const mesh = new THREE.Mesh(g, physical({ roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.3, side: THREE.DoubleSide, sheen: 0.4, sheenColor: C('#f2ffd0') }));
    mesh.rotation.y = l * 0.9;
    group.add(mesh);
  }
  return { group: shadowed(group), height: 0.45, radius: R, label: 'Alface americana' };
}

export function leafGeometry(n, len = 2.6, seedOff = 0) {
  const shape = new THREE.Shape();
  const N = 40;
  const right = [];
  const left = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const lobes = 1 + 0.42 * Math.sin(t * Math.PI * 5 + seedOff);
    const w = 0.55 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.75) * lobes * (0.6 + 0.4 * t);
    right.push([t * len, w]);
    left.push([t * len, -w * (0.9 + 0.2 * n.noise3(t * 4, seedOff, 1))]);
  }
  shape.moveTo(0, 0);
  right.forEach(([x, y]) => shape.lineTo(x, y));
  left.reverse().forEach(([x, y]) => shape.lineTo(x, y));
  const g = new THREE.ShapeGeometry(shape, 6);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const t = x / len;
    pos.setY(i, 0.35 * Math.sin(Math.PI * t) * (0.6 + n.noise3(seedOff, t * 3, 2) * 0.4) + 0.25 * z * z + 0.06 * n.noise3(x * 2, z * 2, seedOff));
  }
  g.computeVertexNormals();
  return g;
}

export function arugula({ seed = 81, R = 6.4, count = 44 } = {}) {
  const n = createNoise(seed);
  const geos = [];
  for (let i = 0; i < count; i++) {
    const g = leafGeometry(n, 2.8 + n.rand() * 1.4, i * 1.3);
    const a = (i / count) * Math.PI * 2 + n.rand() * 0.3;
    const r = R * (0.55 + 0.4 * n.rand());
    g.rotateY(-a + (n.rand() - 0.5) * 0.9);
    g.rotateZ((n.rand() - 0.5) * 0.25);
    g.translate(Math.cos(a) * r * 0.6, n.rand() * 0.25, Math.sin(a) * r * 0.6);
    const shade = n.rand();
    paint(g, (p) => mixC(C('#2c6a1c'), C('#4f8f2a'), shade * 0.7 + 0.15 * n.noise3(p.x, p.y, p.z)));
    geos.push(g);
  }
  const merged = mergeGeometries(geos);
  const mesh = new THREE.Mesh(merged, physical({ roughness: 0.42, clearcoat: 0.45, side: THREE.DoubleSide, sheen: 0.3, sheenColor: C('#c8ff9a') }));
  return { group: shadowed(new THREE.Group().add(mesh)), height: 0.4, radius: R, label: 'Rúcula' };
}

// ───────────────────────────────── Tomato & onion ─────────────────────────────────

function tomatoTexture(seed) {
  const n = createNoise(seed);
  const skin = hexRGB('#a8170f'), wall = hexRGB('#d8301f'), gel = hexRGB('#f0633a'), core = hexRGB('#e85a3a'), seedC = hexRGB('#f7dc8e');
  return pixelTexture(512, (u, v) => {
    const x = u * 2 - 1, y = v * 2 - 1;
    const r = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    if (r > 1) return [0, 0, 0, 0];
    if (r > 0.93) return mixRGB(skin, wall, (1 - r) / 0.07);
    const loc = Math.cos(a * 4 + 0.4 + 0.25 * n.noise3(x * 3, y * 3, 1));
    const inLocule = r > 0.28 && r < 0.78 && loc > -0.25 + 0.15 * n.noise3(x * 5, y * 5, 3);
    let c;
    if (r < 0.26) c = mixRGB(core, wall, 0.3 + 0.3 * n.noise3(x * 6, y * 6, 2));
    else if (inLocule) {
      c = mixRGB(gel, wall, 0.25 * (1 - loc));
      const sd = n.noise3(x * 22, y * 22, 4);
      if (sd > 0.62 && r > 0.4 && r < 0.72) c = mixRGB(c, seedC, (sd - 0.62) * 3);
    } else c = mixRGB(wall, skin, 0.15 + 0.2 * n.noise3(x * 4, y * 4, 5));
    return c;
  });
}

export function tomato({ seed = 91, slices = 3, sliceR = 2.65 } = {}) {
  const n = createNoise(seed);
  const group = new THREE.Group();
  const tex = tomatoTexture(seed);
  const offsets = slices === 3 ? [[-2.3, 1.2], [2.4, 1.0], [0.1, -2.0]] : [[-1.9, 0.6], [1.9, 0.8]];
  offsets.slice(0, slices).forEach(([ox, oz], s) => {
    const g = new THREE.CylinderGeometry(sliceR, sliceR, 0.36, 128, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const k = 1 + 0.04 * n.noise3(Math.cos(a) * 2, Math.sin(a) * 2, s);
      pos.setX(i, x * k);
      pos.setZ(i, z * k);
    }
    g.computeVertexNormals();
    const side = new THREE.MeshPhysicalMaterial({ color: C('#9c140b'), roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.12 });
    const top = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.2, envMapIntensity: 0.35 });
    const mesh = new THREE.Mesh(g, [side, top, top]);
    mesh.position.set(ox, 0.18 + s * 0.04, oz);
    mesh.rotation.set((n.rand() - 0.5) * 0.12, n.rand() * 6, (n.rand() - 0.5) * 0.12);
    group.add(mesh);
  });
  return { group: shadowed(group), height: 0.42, radius: 5.0, label: 'Tomate' };
}

export function redOnion({ seed = 101, slices = 3 } = {}) {
  const n = createNoise(seed);
  const geos = [];
  const purple = C('#4e0c3c'), white = C('#f3e2ee'), mid = C('#9c3f78');
  const places = [[-2.4, 2.2], [2.2, 2.6], [0.2, -1.8], [2.6, -1.4]];
  for (let s = 0; s < slices; s++) {
    const [ox, oz] = places[s];
    const rings = 3 + Math.floor(n.rand() * 2);
    for (let r = 0; r < rings; r++) {
      const rad = 0.7 + r * 0.46 + n.rand() * 0.05;
      const w = 0.11, h = 0.2;
      // Rounded band profile revolved: each ring is one onion layer of a crosswise slice.
      const prof = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        prof.push(new V2(rad + w * Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.5), h / 2 + (h / 2) * Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.5)));
      }
      const full = r < rings - 1 || n.rand() > 0.5;
      const arc = full ? Math.PI * 2 : Math.PI * (1.1 + n.rand() * 0.6);
      const g = new THREE.LatheGeometry(prof, 120, n.rand() * 6, arc);
      g.deleteAttribute('uv');
      g.computeVertexNormals();
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) + 0.06 * n.noise3(pos.getX(i) * 0.8, pos.getZ(i) * 0.8, s));
      g.computeVertexNormals();
      paint(g, (p) => {
        const rr = Math.hypot(p.x, p.z);
        const t = clamp((rr - (rad - w)) / (2 * w));
        // Skin colour lives on the outer face of each layer; the cut face is white with a violet rim.
        return t > 0.6 ? mixC(mid, purple, (t - 0.6) / 0.4) : mixC(white, mid, smoothstep(0.2, 0.6, t));
      });
      g.translate(ox, 0.04 + s * 0.04, oz);
      geos.push(g);
    }
  }
  const mesh = new THREE.Mesh(mergeGeometries(geos), physical({ roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.12, sheen: 0.4, sheenColor: C('#ffd6f0') }));
  return { group: shadowed(new THREE.Group().add(mesh)), height: 0.26, radius: 5.0, label: 'Cebola roxa' };
}

export function caramelizedOnion({ seed = 111, count = 130, R = 5.0, colors = ['#5a250a', '#9a5016'], label = 'Cebola caramelizada', step = 0.38, thick = 0.12, segs = 4, height = 0.48 } = {}) {
  const n = createNoise(seed);
  const geos = [];
  for (let i = 0; i < count; i++) {
    const a = n.rand() * Math.PI * 2;
    const r = Math.sqrt(n.rand()) * R;
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    const pts = [];
    let dir = n.rand() * Math.PI * 2;
    let x = cx, z = cz;
    for (let k = 0; k < segs; k++) {
      pts.push(new THREE.Vector3(x, 0.1 + n.rand() * (height - 0.2) * (1 - r / (R + 1)), z));
      dir += (n.rand() - 0.5) * 1.2;
      x += Math.cos(dir) * step;
      z += Math.sin(dir) * step;
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, 20, thick + n.rand() * thick * 0.5, 8, false);
    g.scale(1, 0.6, 1);
    const shade = n.rand();
    paint(g, () => mixC(C(colors[0]), C(colors[1]), shade));
    geos.push(g);
  }
  const mesh = new THREE.Mesh(mergeGeometries(geos), physical({ roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.12, sheen: 0.3, sheenColor: C('#ffbf7a') }));
  return { group: shadowed(new THREE.Group().add(mesh)), height, radius: R, label };
}

// ───────────────────────────────── Sauces & slaw ─────────────────────────────────

export function mayo({ seed = 121, R = 4.3, label = 'Maionese da casa', color = '#f6eed4', sheen = '#fffbe8' } = {}) {
  const n = createNoise(seed);
  const drips = [0.6, 2.2, 3.9, 5.1].map((a) => a + n.rand() * 0.4);
  const g = polarSheet({
    rings: 30,
    segs: 360,
    Rfn: (a) => {
      let r = R + 0.4 * n.fbm(Math.cos(a) * 1.8, Math.sin(a) * 1.8, 0, 3);
      drips.forEach((d) => {
        const dd = Math.atan2(Math.sin(a - d), Math.cos(a - d));
        r += 0.9 * Math.exp(-(dd * dd) / 0.012);
      });
      return r;
    },
    yfn: (r, a, t) => 0.16 * (1 - Math.pow(t, 3)) + 0.05 * n.noise3(Math.cos(a) * r, Math.sin(a) * r, 1) - Math.max(0, r - R) * 0.55,
  });
  paint(g, () => C(color));
  const mesh = new THREE.Mesh(g, physical({ roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide, sheen: 0.5, sheenColor: C(sheen) }));
  return { group: shadowed(new THREE.Group().add(mesh)), height: 0.16, radius: R, label };
}

export function coleslaw({ seed = 131, R = 4.5, count = 700 } = {}) {
  const n = createNoise(seed);
  const base = mayo({ seed: seed + 1, R: R - 0.2, label: '' }).group;
  const shred = new THREE.BoxGeometry(1.25, 0.05, 0.16, 6, 1, 1);
  { const sp = shred.attributes.position; for (let i = 0; i < sp.count; i++) sp.setY(i, sp.getY(i) + 0.08 * Math.sin(sp.getX(i) * 2.5)); shred.computeVertexNormals(); }
  const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.15 });
  const inst = new THREE.InstancedMesh(shred, mat, count);
  const m = new THREE.Matrix4();
  const colors = [C('#e9efcf'), C('#dde8b4'), C('#f2f4e2'), C('#6a2a5e'), C('#ec8a2a')];
  for (let i = 0; i < count; i++) {
    const a = n.rand() * Math.PI * 2;
    const r = Math.sqrt(n.rand()) * R;
    const h = 0.7 * (1 - Math.pow(r / R, 2)) * n.rand() + 0.12;
    const e = new THREE.Euler((n.rand() - 0.5) * 0.9, n.rand() * Math.PI * 2, (n.rand() - 0.5) * 0.9);
    m.compose(new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(e), new THREE.Vector3(1 + n.rand() * 0.6, 1, 1));
    inst.setMatrixAt(i, m);
    const roll = n.rand();
    inst.setColorAt(i, roll < 0.8 ? colors[Math.floor(n.rand() * 3)] : roll < 0.92 ? colors[3] : colors[4]);
  }
  const group = new THREE.Group().add(base, inst);
  return { group: shadowed(group), height: 0.75, radius: R, label: 'Coleslaw com maionese da casa' };
}

// ───────────────────────────────── El Patron extras ─────────────────────────────────

/** Diced topping (vinaigrette): small glossy cubes in the given colours over a thin wet base. */
export function diced({ seed = 141, R = 4.6, count = 520, colors = ['#c3220f', '#e8e2c4', '#3f8a2a'], weights = [0.55, 0.25, 0.2], label = 'Vinagrete' } = {}) {
  const n = createNoise(seed);
  const cube = new THREE.BoxGeometry(0.36, 0.3, 0.36);
  const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.1 });
  const inst = new THREE.InstancedMesh(cube, mat, count);
  const m = new THREE.Matrix4();
  const cols = colors.map(C);
  for (let i = 0; i < count; i++) {
    const a = n.rand() * Math.PI * 2;
    const r = Math.sqrt(n.rand()) * R;
    const h = 0.55 * (1 - Math.pow(r / R, 2)) * n.rand() + 0.12;
    const e = new THREE.Euler(n.rand() * 3, n.rand() * 3, n.rand() * 3);
    const sc = 0.7 + n.rand() * 0.6;
    m.compose(new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(e), new THREE.Vector3(sc, sc, sc));
    inst.setMatrixAt(i, m);
    let roll = n.rand(), k = 0;
    while (k < weights.length - 1 && roll > weights[k]) roll -= weights[k++];
    inst.setColorAt(i, cols[k]);
  }
  return { group: shadowed(new THREE.Group().add(inst)), height: 0.7, radius: R, label };
}

/** Pepperoni: thin cured slices fanned over the stack. */
export function pepperoni({ seed = 151, slices = 6 } = {}) {
  const n = createNoise(seed);
  const group = new THREE.Group();
  const meat = C('#a3261a'), dark = C('#5e1009'), fat = C('#e7a07a');
  const places = [[-2.6, 1.4], [0.1, 2.9], [2.7, 1.2], [-2.2, -1.9], [0.6, -0.2], [2.4, -2.2], [-0.4, -3.0]];
  for (let s = 0; s < slices; s++) {
    const g = new THREE.CylinderGeometry(1.75, 1.75, 0.12, 96, 1);
    g.deleteAttribute('uv');
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const d = Math.hypot(x, z);
      pos.setY(i, pos.getY(i) + 0.08 * (d / 1.75) * Math.sin(Math.atan2(z, x) * 2 + s) - 0.05 * d * d * 0.1);
    }
    g.computeVertexNormals();
    paint(g, (p) => {
      const f = n.noise3(p.x * 3.2 + s, p.y, p.z * 3.2);
      let c = mixC(meat, dark, clamp(0.3 + n.fbm(p.x * 0.8 + s, 0, p.z * 0.8) * 0.8));
      if (f > 0.45) c = mixC(c, fat, (f - 0.45) * 1.6);
      return mixC(c, dark, smoothstep(1.45, 1.75, Math.hypot(p.x, p.z)) * 0.7);
    });
    const mesh = new THREE.Mesh(g, physical({ roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.18, sheen: 0.3, sheenColor: C('#ff9a7a') }));
    const [ox, oz] = places[s];
    mesh.position.set(ox, 0.08 + s * 0.035, oz);
    mesh.rotation.set((n.rand() - 0.5) * 0.15, n.rand() * 6, (n.rand() - 0.5) * 0.15);
    group.add(mesh);
  }
  return { group: shadowed(group), height: 0.36, radius: 4.8, label: 'Pepperoni' };
}
