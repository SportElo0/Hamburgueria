// Sides, desserts, drinks, combos and floating ingredient sprites.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createNoise, clamp, lerp, smoothstep } from './noise.js';
import * as K from './kit.js';
import { buildStack } from './recipes.js';

const { C, mixC, paint, displace, physical, shadowed, lathe, pixelTexture, hexRGB, mixRGB } = K;
const V2 = THREE.Vector2;

// ───────────── shared pieces ─────────────

function checkerTexture(seed = 3, cells = 10) {
  const n = createNoise(seed);
  const red = hexRGB('#ad2320'), cream = hexRGB('#f3e8d2');
  return pixelTexture(512, (u, v) => {
    const cx = Math.floor(u * cells), cy = Math.floor(v * cells);
    let c = (cx + cy) % 2 ? red : cream;
    const fiber = 0.06 * n.noise3(u * 60, v * 60, 1) + 0.05 * n.noise3(u * 8, v * 8, 2);
    c = mixRGB(c, [255, 255, 255], fiber);
    return mixRGB(c, [80, 40, 20], clamp(-fiber));
  });
}

function fry({ w = 0.42, len = 3.4, seed = 1, crisp = 0.5 }) {
  const n = createNoise(seed);
  const g = new RoundedBoxGeometry(w, w * (0.85 + n.rand() * 0.2), len, 2, w * 0.18);
  const pos = g.attributes.position;
  const bend = (n.rand() - 0.5) * 0.25;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    pos.setX(i, pos.getX(i) + bend * (z / len) * (z / len) * len);
  }
  g.computeVertexNormals();
  const gold = C('#efbd52'), deep = C('#c98428'), pale = C('#f6d98a');
  paint(g, (p) => {
    const end = smoothstep(len * 0.35, len * 0.5, Math.abs(p.z));
    let c = mixC(gold, pale, 0.4 + 0.5 * n.noise3(p.x * 3, p.y * 3, p.z * 1.5));
    c = mixC(c, deep, end * 0.8 + crisp * 0.25 + 0.3 * clamp(n.noise3(p.z * 4, p.x * 6, 7)));
    return c;
  });
  return g;
}

function fryMaterial() {
  return physical({ roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: C('#ffe2a0') });
}

function wireBasket({ bottom = 4.6, top = 6.2, H = 3.4 } = {}) {
  const geos = [];
  const tube = (a, b, r = 0.045) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const g = new THREE.CylinderGeometry(r, r, dir.length(), 6, 1);
    g.translate(0, dir.length() / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
    g.translate(a.x, a.y, a.z);
    geos.push(g);
  };
  const ring = (y, half, r) => {
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z]) => new THREE.Vector3(x * half, y, z * half));
    for (let i = 0; i < 4; i++) tube(c[i], c[(i + 1) % 4], r);
  };
  const halfAt = (y) => lerp(bottom / 2, top / 2, y / H);
  for (let k = 0; k <= 8; k++) ring((k / 8) * H, halfAt((k / 8) * H), k === 8 ? 0.09 : 0.035);
  const steps = 9;
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 2 - 1;
      const pt = (y) => {
        const h = halfAt(y);
        const along = t * h;
        return [[along, -h], [h, along], [-along, h], [-h, -along]][side];
      };
      const [x0, z0] = pt(0), [x1, z1] = pt(H);
      tube(new THREE.Vector3(x0, 0, z0), new THREE.Vector3(x1, H, z1), 0.035);
    }
  }
  for (let i = 0; i <= steps; i++) {
    const t = ((i / steps) * 2 - 1) * (bottom / 2);
    tube(new THREE.Vector3(t, 0, -bottom / 2), new THREE.Vector3(t, 0, bottom / 2), 0.035);
  }
  const mat = new THREE.MeshStandardMaterial({ color: C('#cfc9bf'), metalness: 1, roughness: 0.32 });
  return new THREE.Mesh(mergeGeometries(geos), mat);
}

function paperLiner({ bottom = 4.6, top = 6.2, H = 3.4, seed = 5 } = {}) {
  const n = createNoise(seed);
  const g = new THREE.PlaneGeometry(2, 2, 90, 90);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i), v = pos.getZ(i);
    const d = Math.max(Math.abs(u), Math.abs(v));
    const corner = Math.min(Math.abs(u), Math.abs(v));
    let x, y, z;
    if (d < 0.5) {
      x = (u / 0.5) * (bottom / 2 - 0.12);
      z = (v / 0.5) * (bottom / 2 - 0.12);
      y = 0.08;
    } else {
      const t = (d - 0.5) / 0.5;
      y = t * (H + 0.25) + corner * 0.7 * t * t;
      const half = lerp(bottom / 2 - 0.12, top / 2 + 0.2, Math.min(1, (t * (H + 0.25)) / H));
      x = (u / d) * half;
      z = (v / d) * half;
    }
    const cr = 0.18 * n.fbm(u * 3, v * 3, 1, 3) * smoothstep(0.3, 1, d);
    pos.setXYZ(i, x + cr, y + cr * 0.6, z - cr);
  }
  g.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ map: checkerTexture(seed, 9), roughness: 0.75, side: THREE.DoubleSide, sheen: 0.3, sheenColor: C('#ffffff') });
  return new THREE.Mesh(g, mat);
}

function friesPile({ count = 46, w = 0.42, len = 3.4, spread = 2.2, base = 0.4, rise = 3.2, seed = 9 } = {}) {
  const n = createNoise(seed);
  const geos = [];
  for (let i = 0; i < count; i++) {
    const g = fry({ w, len: len * (0.75 + n.rand() * 0.45), seed: seed * 100 + i });
    const a = n.rand() * Math.PI * 2, r = Math.sqrt(n.rand()) * spread;
    const lean = 0.12 + n.rand() * 0.45;
    g.rotateX(-Math.PI / 2);
    g.rotateZ(lean * Math.cos(a + (n.rand() - 0.5)));
    g.rotateX(lean * Math.sin(a + (n.rand() - 0.5)));
    g.rotateY((n.rand() - 0.5) * 0.4);
    g.translate(Math.cos(a) * r, base + len * 0.5 + n.rand() * rise, Math.sin(a) * r);
    geos.push(g);
  }
  return new THREE.Mesh(mergeGeometries(geos), fryMaterial());
}

function ramekin({ sauce = '#7a2a12', R = 1.05 } = {}) {
  const group = new THREE.Group();
  const pts = [new V2(0.001, 0), new V2(R * 0.8, 0), new V2(R * 0.92, 0.08), new V2(R, 0.9), new V2(R * 1.04, 0.95), new V2(R * 0.94, 0.95), new V2(R * 0.88, 0.2), new V2(0.001, 0.2)];
  const cup = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), new THREE.MeshStandardMaterial({ color: C('#d9d4ca'), metalness: 1, roughness: 0.25 }));
  const n = createNoise(77);
  const sg = new THREE.CircleGeometry(R * 0.9, 64, 0);
  sg.rotateX(-Math.PI / 2);
  const sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) sp.setY(i, 0.78 + 0.03 * n.noise3(sp.getX(i) * 2, sp.getZ(i) * 2, 1));
  sg.computeVertexNormals();
  const s = new THREE.Mesh(sg, new THREE.MeshPhysicalMaterial({ color: C(sauce), roughness: 0.12, clearcoat: 1 }));
  group.add(cup, s);
  return group;
}

function blob({ r = 0.5, squash = 0.5, seed = 1, rough = 0.2 }) {
  const n = createNoise(seed);
  let g = new THREE.IcosahedronGeometry(r, 5);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g);
  g.scale(1, squash, 1);
  g.computeVertexNormals();
  displace(g, (p) => rough * r * n.fbm(p.x * 2 / r, p.y * 2 / r, p.z * 2 / r, 3));
  return g;
}

function bits({ count, seed, R, y, color, size = 0.22, spread = 0.5 }) {
  const n = createNoise(seed);
  const geos = [];
  for (let i = 0; i < count; i++) {
    const g = new RoundedBoxGeometry(size * (0.7 + n.rand() * 0.8), size * 0.5, size * (0.6 + n.rand() * 0.6), 1, size * 0.12);
    g.rotateY(n.rand() * 6);
    g.rotateX((n.rand() - 0.5) * 0.8);
    const a = n.rand() * Math.PI * 2, r = Math.sqrt(n.rand()) * R;
    g.translate(Math.cos(a) * r, y(r) + n.rand() * spread, Math.sin(a) * r);
    const shade = n.rand();
    paint(g, () => mixC(C(color[0]), C(color[1]), shade));
    geos.push(g);
  }
  return mergeGeometries(geos);
}

function basketWithFries({ thin = false } = {}) {
  const group = new THREE.Group();
  group.add(wireBasket(), paperLiner(), friesPile({ count: thin ? 90 : 60, w: thin ? 0.3 : 0.42, spread: 2.0, base: 0.15, rise: 0.9, seed: thin ? 13 : 9 }));
  return group;
}

// ───────────── desserts & drinks ─────────────

function plate(R = 4.4) {
  const pts = [new V2(0.001, 0), new V2(R * 0.55, 0), new V2(R * 0.62, 0.05), new V2(R * 0.6, 0.12), new V2(R * 0.92, 0.22), new V2(R, 0.38), new V2(R * 0.98, 0.42), new V2(R * 0.9, 0.3), new V2(R * 0.6, 0.2), new V2(0.001, 0.2)];
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 96), new THREE.MeshPhysicalMaterial({ color: C('#f1ebe0'), roughness: 0.15, clearcoat: 1 }));
}

function glassMaterial(tint = '#ffffff', opacity = 0.16) {
  return new THREE.MeshPhysicalMaterial({ color: C(tint), roughness: 0.04, metalness: 0, clearcoat: 1, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.6 });
}

function tumbler({ liquid, fill = 0.82, opacity = 0.9, bubbles = false, ice = true, seed = 1, juice = false }) {
  const n = createNoise(seed);
  const group = new THREE.Group();
  const R0 = 1.55, R1 = 1.85, H = 4.6;
  const outer = [new V2(0.001, 0), new V2(R0, 0), new V2(R0 + 0.05, 0.08), new V2(R1, H), new V2(R1 - 0.07, H), new V2(R0 - 0.05, 0.42), new V2(0.001, 0.42)];
  const glass = new THREE.Mesh(new THREE.LatheGeometry(outer, 96), glassMaterial());
  glass.renderOrder = 3;
  const lh = 0.42 + (H - 0.42) * fill;
  const rAt = (y) => lerp(R0 - 0.06, R1 - 0.09, y / H);
  const liq = [new V2(0.001, 0.43), new V2(rAt(0.43), 0.43), new V2(rAt(lh), lh), new V2(0.001, lh)];
  const lm = juice
    ? new THREE.MeshPhysicalMaterial({ color: C(liquid), roughness: 0.25, clearcoat: 0.6, sheen: 0.5, sheenColor: C(liquid) })
    : opacity >= 0.8
      ? new THREE.MeshPhysicalMaterial({ color: C(liquid), roughness: 0.05, clearcoat: 1 })
      : new THREE.MeshPhysicalMaterial({ color: C(liquid), roughness: 0.05, clearcoat: 1, transparent: true, opacity, depthWrite: false });
  const lq = new THREE.Mesh(new THREE.LatheGeometry(liq, 96), lm);
  lq.renderOrder = 1;
  group.add(lq);
  if (ice) {
    const im = new THREE.MeshPhysicalMaterial({ color: C('#f4fbff'), roughness: 0.12, clearcoat: 1, transparent: true, opacity: 0.55, depthWrite: false });
    for (let i = 0; i < 4; i++) {
      const cube = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.85, 0.95, 2, 0.16), im);
      cube.position.set((n.rand() - 0.5) * 1.3, lh - 0.25 - i * 0.5, (n.rand() - 0.5) * 1.3);
      cube.rotation.set(n.rand(), n.rand() * 3, n.rand());
      cube.renderOrder = 2;
      group.add(cube);
    }
  }
  if (bubbles) {
    const bm = new THREE.MeshPhysicalMaterial({ color: C('#ffffff'), roughness: 0.1, transparent: true, opacity: 0.7, depthWrite: false });
    const bg = new THREE.SphereGeometry(0.05, 8, 6);
    const inst = new THREE.InstancedMesh(bg, bm, 160);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 160; i++) {
      const y = 0.5 + n.rand() * (lh - 0.6);
      const a = n.rand() * Math.PI * 2, r = Math.sqrt(n.rand()) * rAt(y) * 0.95;
      const s = 0.5 + n.rand() * 1.4;
      m.compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
      inst.setMatrixAt(i, m);
    }
    inst.renderOrder = 2;
    group.add(inst);
  }
  group.add(glass);
  return group;
}

function whipped({ R = 1.55, H = 1.7, seed = 4 }) {
  const n = createNoise(seed);
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    pts.push(new V2(Math.max(0.001, R * Math.pow(1 - t, 0.75)), H * t));
  }
  pts.unshift(new V2(0.001, 0));
  const g = lathe(pts, 240);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const r = Math.hypot(x, z);
    const ridge = 1 + 0.12 * Math.cos(a * 8 + y * 5.5) + 0.03 * n.noise3(x * 3, y * 3, z * 3);
    pos.setXYZ(i, x * ridge, y + 0.18 * Math.sin(a + y * 2) * (r / R), z * ridge);
  }
  g.computeVertexNormals();
  paint(g, () => C('#fbf5ea'));
  return new THREE.Mesh(g, physical({ roughness: 0.38, clearcoat: 0.3, sheen: 0.8, sheenColor: C('#ffffff') }));
}

function milkshake(flavor) {
  const colors = { morango: '#f2a0b3', nutella: '#7b4a2e', baunilha: '#f3e3be' };
  const group = new THREE.Group();
  const H = 6.2;
  const prof = (k) => [0, 0.6, 1.4, 2.6, 4, 5.2, H].map((y) => new V2(k * (0.75 + 0.8 * Math.pow(y / H, 1.4)) + (y < 0.6 ? 0.5 : 0), y));
  const glassPts = [new V2(0.001, 0), new V2(1.5, 0), new V2(1.5, 0.15), new V2(0.35, 0.35), new V2(0.3, 1.3), ...prof(1).map((p) => new V2(p.x, p.y + 1.3))];
  const glass = new THREE.Mesh(new THREE.LatheGeometry(glassPts, 96), glassMaterial('#ffffff', 0.18));
  glass.renderOrder = 3;
  const fillTop = H + 1.15;
  const shakePts = [new V2(0.001, 1.45), ...prof(0.94).filter((p) => p.y + 1.3 <= fillTop).map((p) => new V2(p.x, Math.max(1.45, p.y + 1.3))), new V2(0.001, fillTop)];
  const shake = new THREE.Mesh(new THREE.LatheGeometry(shakePts, 96), new THREE.MeshPhysicalMaterial({ color: C(colors[flavor]), roughness: 0.42, clearcoat: 0.25, sheen: 0.7, sheenColor: C('#ffffff') }));
  const cream = whipped({ R: 1.6, H: 1.9 });
  cream.position.y = fillTop - 0.05;
  const straw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 6.5, 24, 1, true),
    new THREE.MeshPhysicalMaterial({
      map: pixelTexture(256, (u, v) => (Math.floor((v * 10 + u * 2) % 2) ? hexRGB('#b3261e') : hexRGB('#f6efe2'))),
      roughness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide,
    }),
  );
  straw.position.set(0.5, fillTop + 1.4, 0.2);
  straw.rotation.z = -0.32;
  group.add(shake, cream, straw, glass);
  return group;
}

function longNeck() {
  const group = new THREE.Group();
  const pts = [new V2(0.001, 0), new V2(1.05, 0), new V2(1.12, 0.12), new V2(1.12, 4.6), new V2(1.0, 5.3), new V2(0.55, 6.4), new V2(0.42, 7.6), new V2(0.45, 7.9), new V2(0.42, 8.1), new V2(0.001, 8.1)];
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 96),
    new THREE.MeshPhysicalMaterial({ color: C('#6a3208'), roughness: 0.06, clearcoat: 1, transparent: true, opacity: 0.94, envMapIntensity: 1.8 }),
  );
  const capG = new THREE.CylinderGeometry(0.5, 0.52, 0.32, 21, 1);
  const cp = capG.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const a = Math.atan2(cp.getZ(i), cp.getX(i));
    const k = 1 + 0.05 * Math.sign(Math.sin(a * 10.5));
    if (cp.getY(i) < 0.1) { cp.setX(i, cp.getX(i) * k); cp.setZ(i, cp.getZ(i) * k); }
  }
  capG.computeVertexNormals();
  const cap = new THREE.Mesh(capG, new THREE.MeshStandardMaterial({ color: C('#c7c2b8'), metalness: 1, roughness: 0.3 }));
  cap.position.y = 8.2;
  // Condensation droplets
  const n = createNoise(8);
  const dm = new THREE.MeshPhysicalMaterial({ color: C('#ffffff'), roughness: 0.05, transparent: true, opacity: 0.45 });
  const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), dm, 220);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 220; i++) {
    const a = n.rand() * Math.PI * 2, y = 0.3 + n.rand() * 4.2;
    const s = 0.6 + n.rand() * 1.2;
    m.compose(new THREE.Vector3(Math.cos(a) * 1.13, y, Math.sin(a) * 1.13), new THREE.Quaternion(), new THREE.Vector3(s, s * 1.3, s * 0.5));
    inst.setMatrixAt(i, m);
  }
  group.add(glass, cap);
  return group;
}

function at(obj, x, y, z) {
  obj.position.set(x, y, z);
  return obj;
}

// ───────────── floating sprites ─────────────

function rotated(obj, x, y, z) {
  obj.rotation.set(x, y, z);
  obj.updateMatrixWorld(true);
  const center = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
  obj.position.sub(center);
  return new THREE.Group().add(obj);
}

function single(builder, rot) {
  const { group } = builder();
  return rotated(group, ...rot);
}

const spriteCam = { dist: 40, elev: 10, ty: 0 };

// ───────────── registry ─────────────

const ALL = {
  'classic-fries': () => {
    const g = basketWithFries();
    g.add(at(ramekin({}), 4.6, 0, 1.6));
    return { object: shadowed(g), camera: { dist: 44, elev: 24, ty: 2.4 } };
  },
  'bacon-cheddar-fries': () => {
    const g = basketWithFries({ thin: true });
    const n = createNoise(17);
    const sauces = [];
    for (let i = 0; i < 9; i++) {
      const b = blob({ r: 0.9 + n.rand() * 0.6, squash: 0.32, seed: 40 + i, rough: 0.15 });
      const a = n.rand() * Math.PI * 2, r = Math.sqrt(n.rand()) * 1.9;
      b.translate(Math.cos(a) * r, 3.0 + n.rand() * 0.9, Math.sin(a) * r);
      sauces.push(b);
    }
    const sauce = new THREE.Mesh(mergeGeometries(sauces), new THREE.MeshPhysicalMaterial({ color: C('#f0901c'), roughness: 0.18, clearcoat: 1, sheen: 0.4, sheenColor: C('#ffc060') }));
    const bacon = new THREE.Mesh(bits({ count: 70, seed: 3, R: 2.3, y: () => 3.4, color: ['#5a1a0c', '#9a3a1e'], spread: 0.8 }), physical({ roughness: 0.4, clearcoat: 0.6 }));
    g.add(sauce, bacon);
    return { object: shadowed(g), camera: { dist: 44, elev: 26, ty: 2.6 } };
  },
  'croc-canoa': () => {
    const group = new THREE.Group();
    const R = 3.4;
    const boatPts = [new V2(0.001, 0), new V2(R * 0.8, 0), new V2(R * 0.95, 0.35), new V2(R, 1.1), new V2(R * 0.97, 1.12), new V2(R * 0.92, 0.42), new V2(R * 0.78, 0.08), new V2(0.001, 0.08)];
    const boatG = new THREE.LatheGeometry(boatPts, 96);
    boatG.scale(1.55, 1, 1);
    const boat = new THREE.Mesh(boatG, new THREE.MeshPhysicalMaterial({ color: C('#ad2320'), roughness: 0.55, clearcoat: 0.4, side: THREE.DoubleSide }));
    group.add(boat);
    const n = createNoise(23);
    const wedges = [];
    for (let i = 0; i < 24; i++) {
      // Canoe cut: a half-ellipsoid hull with skin underneath and a flat golden cut face.
      const L = 1.3 + n.rand() * 0.35;
      const hull = new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      hull.scale(L, 0.55, 0.52);
      const cap = new THREE.CircleGeometry(1, 28);
      cap.rotateX(-Math.PI / 2);
      cap.scale(L, 1, 0.52);
      let g = mergeGeometries([hull.toNonIndexed(), cap.toNonIndexed()].map((x) => { x.deleteAttribute('uv'); return x; }));
      g.computeVertexNormals();
      paint(g, (p) => (p.y > -0.02 ? mixC(C('#f2c463'), C('#d99a3a'), clamp(0.3 + n.noise3(p.x * 3, 1, p.z * 3))) : mixC(C('#b8752a'), C('#7a4416'), clamp(0.4 + n.noise3(p.x * 4, p.y * 4, p.z * 4)))));
      g.rotateZ((n.rand() - 0.5) * 1.6);
      g.rotateX((n.rand() - 0.5) * 1.2);
      g.rotateY(n.rand() * 6);
      const a = n.rand() * Math.PI * 2, r = Math.sqrt(n.rand());
      g.translate(Math.cos(a) * r * 3.4, 0.7 + n.rand() * 0.9 * (1.3 - r), Math.sin(a) * r * 1.8);
      wedges.push(g);
    }
    group.add(new THREE.Mesh(mergeGeometries(wedges), fryMaterial()));
    const cc = [];
    for (let i = 0; i < 8; i++) {
      const b = blob({ r: 0.6 + n.rand() * 0.35, squash: 0.55, seed: 60 + i, rough: 0.12 });
      const a = n.rand() * Math.PI * 2, r = Math.sqrt(n.rand());
      b.translate(Math.cos(a) * r * 2.8, 2.2 + n.rand() * 0.4, Math.sin(a) * r * 1.4);
      cc.push(b);
    }
    group.add(new THREE.Mesh(mergeGeometries(cc), new THREE.MeshPhysicalMaterial({ color: C('#fbf7ef'), roughness: 0.25, clearcoat: 0.8, sheen: 0.6, sheenColor: C('#ffffff') })));
    group.add(new THREE.Mesh(bits({ count: 50, seed: 8, R: 2.8, y: () => 2.3, color: ['#5a1a0c', '#9a3a1e'], spread: 0.6 }), physical({ roughness: 0.4, clearcoat: 0.6 })));
    const chives = [];
    for (let i = 0; i < 70; i++) {
      const g = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8);
      g.rotateX(Math.PI / 2 + (n.rand() - 0.5));
      g.rotateY(n.rand() * 6);
      const a = n.rand() * Math.PI * 2, r = Math.sqrt(n.rand()) * 3;
      g.translate(Math.cos(a) * r, 2.5 + n.rand() * 0.6, Math.sin(a) * r * 0.55);
      paint(g, () => mixC(C('#3f8a2a'), C('#6cb240'), n.rand()));
      chives.push(g);
    }
    group.add(new THREE.Mesh(mergeGeometries(chives), physical({ roughness: 0.35, clearcoat: 0.5 })));
    return { object: shadowed(group), camera: { dist: 42, elev: 30, ty: 1.4 } };
  },
  'downtown-nuggets': () => {
    const group = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.BoxGeometry(9, 0.05, 6.5, 40, 1, 30), new THREE.MeshPhysicalMaterial({ map: checkerTexture(4, 8), roughness: 0.7 }));
    group.add(paper);
    const spots = [[-2.8, -0.9], [-0.8, -1.4], [1.1, -0.6], [-2.0, 1.2], [0.2, 1.0]];
    spots.forEach(([x, z], i) => {
      const n = createNoise(90 + i);
      let g = new THREE.IcosahedronGeometry(1, 6);
      g.deleteAttribute('uv');
      g.deleteAttribute('normal');
      g = mergeVertices(g);
      g.scale(1.15 + n.rand() * 0.3, 0.72, 0.9 + n.rand() * 0.2);
      g.computeVertexNormals();
      const hs = new Float32Array(g.attributes.position.count);
      displace(g, (p, _n, k) => {
        const h = 0.2 * n.ridged(p.x * 3.4, p.y * 3.4, p.z * 3.4, 4) + 0.16 * n.fbm(p.x * 0.9, p.y, p.z * 0.9, 2);
        hs[k] = h;
        return h - 0.05;
      });
      paint(g, (p, _nn, k) => mixC(mixC(C('#8a4610'), C('#d4953a'), smoothstep(0.04, 0.2, hs[k])), C('#f0c060'), smoothstep(0.22, 0.3, hs[k])));
      const m = new THREE.Mesh(g, physical({ roughness: 0.7, clearcoat: 0.2, sheen: 0.4, sheenColor: C('#ffd890') }));
      m.position.set(x, 0.5, z);
      m.rotation.y = n.rand() * 6;
      group.add(m);
    });
    group.add(at(ramekin({}), 2.9, 0.05, 0.6));
    return { object: shadowed(group), camera: { dist: 36, elev: 32, ty: 0.6 } };
  },
  brownie: () => {
    const group = new THREE.Group();
    group.add(plate(4.6));
    const n = createNoise(55);
    let g = new THREE.BoxGeometry(4.0, 1.6, 4.0, 90, 30, 90);
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    g = mergeVertices(g);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const top = y > 0.6 ? 1 : 0;
      pos.setY(i, y + top * (0.3 * n.ridged(x * 1.1, 0, z * 1.1, 4) - 0.15) + 0.06 * n.noise3(x * 4, y * 4, z * 4));
      pos.setX(i, x + 0.05 * n.noise3(1, y * 2, z * 2));
      pos.setZ(i, z + 0.05 * n.noise3(x * 2, y * 2, 2));
    }
    g.computeVertexNormals();
    paint(g, (p) => (p.y > 0.62 ? mixC(C('#2a1208'), C('#6a3a20'), clamp(n.ridged(p.x * 1.1, 0, p.z * 1.1, 4) * 1.6 - 0.3)) : mixC(C('#3f1f0f'), C('#1e0c06'), clamp(n.noise3(p.x * 9, p.y * 9, p.z * 9) * 0.8 + 0.45))));
    const b = new THREE.Mesh(g, physical({ roughness: 0.6, clearcoat: 0.3, sheen: 0.3, sheenColor: C('#8a5a3a') }));
    b.position.y = 1.0;
    b.rotation.y = 0.5;
    group.add(b);
    const scoop = blob({ r: 1.35, squash: 0.85, seed: 12, rough: 0.12 });
    const sp = scoop.attributes.position;
    for (let i = 0; i < sp.count; i++) if (sp.getY(i) < -0.55) sp.setY(i, -0.55 - 0.08 * Math.random());
    scoop.computeVertexNormals();
    const ice = new THREE.Mesh(scoop, new THREE.MeshPhysicalMaterial({ color: C('#f6ebd2'), roughness: 0.5, sheen: 0.8, sheenColor: C('#ffffff'), clearcoat: 0.2 }));
    ice.position.set(0.1, 2.55, 0.1);
    group.add(ice);
    return { object: shadowed(group), camera: { dist: 34, elev: 26, ty: 1.6 } };
  },
  'milkshake-morango': () => ({ object: shadowed(milkshake('morango')), camera: { dist: 44, elev: 12, ty: 4.6 } }),
  'milkshake-nutella': () => ({ object: shadowed(milkshake('nutella')), camera: { dist: 44, elev: 12, ty: 4.6 } }),
  'milkshake-baunilha': () => ({ object: shadowed(milkshake('baunilha')), camera: { dist: 44, elev: 12, ty: 4.6 } }),
  'little-downtown-laranja': () => littleCombo('#f39a1a'),
  'little-downtown-uva': () => littleCombo('#4a0f2e'),
  'drink-agua': () => drink({ liquid: '#e8f4fa', opacity: 0.18 }),
  'drink-agua-gas': () => drink({ liquid: '#e8f4fa', opacity: 0.18, bubbles: true }),
  'drink-cola': () => drink({ liquid: '#2b0e05', opacity: 0.94, bubbles: true }),
  'drink-tonica': () => drink({ liquid: '#eef6f2', opacity: 0.22, bubbles: true }),
  'drink-tubaina': () => drink({ liquid: '#9a3a12', opacity: 0.88, bubbles: true }),
  'drink-citrus': () => drink({ liquid: '#f1e7a8', opacity: 0.55, bubbles: true }),
  'drink-guarana': () => drink({ liquid: '#c9701e', opacity: 0.82, bubbles: true }),
  'drink-laranja': () => drink({ liquid: '#f39a1a', juice: true, ice: false }),
  'drink-pink-lemonade': () => drink({ liquid: '#f4a3b8', opacity: 0.85, ice: true }),
  'longneck': () => ({ object: shadowed(longNeck()), camera: { dist: 46, elev: 8, ty: 4.0 } }),
  // Floating sprites
  'float-fry-a': () => ({ object: rotated(new THREE.Mesh(fry({ len: 3.6, seed: 4 }), fryMaterial()), 0.6, 0.4, 0.9), camera: spriteCam }),
  'float-fry-b': () => ({ object: rotated(new THREE.Mesh(fry({ len: 3.0, seed: 8 }), fryMaterial()), -0.3, 1.2, -0.5), camera: spriteCam }),
  'float-tomato': () => ({ object: single(() => K.tomato({ slices: 1 }), [0.75, 0.3, 0.25]), camera: spriteCam }),
  'float-onion': () => ({ object: single(() => K.redOnion({ slices: 1 }), [0.55, 0.0, -0.35]), camera: spriteCam }),
  'float-lettuce': () => ({ object: single(() => K.lettuce({ R: 2.6, layers: 1, seed: 7 }), [0.9, 0.5, 0.4]), camera: spriteCam }),
  'float-arugula': () => ({ object: single(() => K.arugula({ count: 3, R: 1.2, seed: 5 }), [0.8, 1.0, 0.2]), camera: spriteCam }),
  'float-bacon': () => ({ object: single(() => K.bacon({ strips: 1, R: 1.8, seed: 9 }), [0.5, 0.6, 0.3]), camera: spriteCam }),
  'float-cheese': () => ({ object: single(() => K.cheese({ kind: 'prato', size: 3.2, dropR: 0.9, sag: 0.35 }), [0.7, 0.5, 0.3]), camera: spriteCam }),
  'float-sesame': () => ({ object: sesameCluster(), camera: spriteCam }),
};

function drink(opts) {
  return { object: shadowed(tumbler(opts)), camera: { dist: 34, elev: 14, ty: 2.4 } };
}

function littleCombo(juice) {
  const group = new THREE.Group();
  const { root } = buildStack('little-downtown');
  root.scale.setScalar(0.62);
  root.position.set(-1.6, 0, 1.2);
  const fries = basketWithFries();
  fries.scale.setScalar(0.62);
  fries.position.set(2.6, 0, -2.0);
  const glass = tumbler({ liquid: juice, juice: true, ice: false, seed: 3 });
  glass.scale.setScalar(0.85);
  glass.position.set(3.9, 0, 1.6);
  group.add(root, fries, glass);
  return { object: shadowed(group), camera: { dist: 46, elev: 18, ty: 2.0 } };
}

function sesameCluster() {
  const n = createNoise(3);
  const g = new THREE.SphereGeometry(1, 16, 10);
  const sp = g.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i);
    sp.setXYZ(i, x * 0.34, sp.getY(i) * 0.1, sp.getZ(i) * 0.19 * (1 - 0.45 * Math.max(0, x)));
  }
  g.computeVertexNormals();
  const group = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: C('#f1e2b8'), roughness: 0.42, sheen: 0.4, sheenColor: C('#fff4d6') });
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(g, mat);
    m.position.set((n.rand() - 0.5) * 2.2, (n.rand() - 0.5) * 1.6, (n.rand() - 0.5) * 1.2);
    m.rotation.set(n.rand() * 6, n.rand() * 6, n.rand() * 6);
    group.add(m);
  }
  return group;
}

// A red chilli: tapered, curved pod with a green cap (El Chapo is the spicy one).
function chilli() {
  const n = createNoise(17);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.9, 0.5, 0), new THREE.Vector3(-0.8, 0.1, 0.1), new THREE.Vector3(0.4, -0.15, 0), new THREE.Vector3(1.5, -0.5, -0.1), new THREE.Vector3(2.2, -1.1, 0),
  ]);
  const g = new THREE.TubeGeometry(curve, 120, 0.5, 48, false);
  const pos = g.attributes.position;
  const pts = curve.getSpacedPoints(120);
  for (let i = 0; i < pos.count; i++) {
    const seg = Math.floor(i / 49);
    const t = seg / 120;
    const c = pts[Math.min(seg, 120)];
    const k = Math.pow(1 - t, 0.75) * (1 + 0.04 * n.noise3(pos.getX(i) * 3, pos.getY(i) * 3, pos.getZ(i) * 3)) + 0.04;
    pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * k, c.y + (pos.getY(i) - c.y) * k, c.z + (pos.getZ(i) - c.z) * k);
  }
  g.computeVertexNormals();
  const pod = new THREE.Mesh(g, physical({ color: C('#c4160c'), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.3, sheenColor: C('#ff7a5a') }));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.32, 32), physical({ color: C('#3d7a22'), roughness: 0.5 }));
  cap.position.set(-1.95, 0.52, 0);
  cap.rotation.z = Math.PI / 2 + 0.35;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.9, 16), physical({ color: C('#4f8a2c'), roughness: 0.55 }));
  stem.position.set(-2.45, 0.85, 0);
  stem.rotation.z = Math.PI / 2 + 0.9;
  const group = new THREE.Group().add(pod, cap, stem);
  group.rotation.set(0.5, 0.3, 0.2);
  return shadowed(group);
}

// El Patron's floating ingredients only; the Downtown sides and drinks stay out of this kit.
export const SCENES = {
  ...Object.fromEntries(Object.entries(ALL).filter(([id]) => id.startsWith('float-') && id !== 'float-arugula')),
  'float-chilli': () => ({ object: chilli(), camera: spriteCam }),
  'float-mussarela': () => ({ object: single(() => K.cheese({ kind: 'mussarela', size: 3.2, dropR: 0.9, sag: 0.35 }), [0.7, 0.5, 0.3]), camera: spriteCam }),
  'float-cheddar': () => ({ object: single(() => K.cheese({ kind: 'cheddar', size: 3.2, dropR: 0.9, sag: 0.35, seed: 57 }), [0.6, 1.1, -0.3]), camera: spriteCam }),
};
