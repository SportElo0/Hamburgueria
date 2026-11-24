// Reel 21 · 3D miniature (Three.js, rendered frame by frame): a night street on a floating slab. Bia's building
// (one lit window), the clinic near home (dark at night; in the second night, a small blue light: the AI attendant)
// and another clinic further away. window.diorama(t, story) draws the frame for time t; everything is a pure function
// of t so every frame is reproducible. Bundled by reel21.mjs with esbuild.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 200);

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
const rbox = (w, h, d, m, r = 0.08) => {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1)), m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};
const at = (o, x, y, z) => (o.position.set(x, y, z), o);

// ---------------------------------------------------------------- lights
const hemi = new THREE.HemisphereLight(0x5a6ea8, 0x1a1420, 0.9);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9db4ff, 1.1);
moon.position.set(-6, 12, 7);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
moon.shadow.bias = -0.0008;
scene.add(moon);
const sun = new THREE.DirectionalLight(0xffe2b8, 0);
sun.position.set(7, 10, 4);
scene.add(sun);

// ---------------------------------------------------------------- slab + street
const world = new THREE.Group();
scene.add(world);
const slab = rbox(10, 1.2, 10.5, mat(0x3b2f2a), 0.25);
world.add(at(slab, 0, -0.6, 0));
const grass = rbox(9.7, 0.12, 10.2, mat(0x2f5d3a), 0.05);
world.add(at(grass, 0, 0.02, 0));
const street = rbox(9.72, 0.06, 2.3, mat(0x2a2d35, { roughness: 0.6 }), 0.02);
world.add(at(street, 0, 0.1, 0.4));
for (let i = -4; i <= 4; i++) world.add(at(rbox(0.55, 0.02, 0.1, mat(0xe8e1c8, { emissive: 0x332f20 }), 0.01), i * 1.1, 0.14, 0.4));
for (const z of [-1.15, 1.95]) world.add(at(rbox(9.72, 0.14, 0.8, mat(0x8e8a86), 0.03), 0, 0.12, z));

// windows helper: emissive panes on the +z face
function windows(group, w, h, d, cols, rows, y0, color, lit = []) {
  const panes = [];
  const gx = w / cols, gy = (h - y0) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const on = lit.find(([lr, lc]) => lr === r && lc === c);
    const m = new THREE.MeshStandardMaterial({ color: 0x1b2233, emissive: on ? 0xffc46b : color, emissiveIntensity: on ? 2.2 : 0.35, roughness: 0.3 });
    const p = new THREE.Mesh(new THREE.BoxGeometry(gx * 0.52, gy * 0.5, 0.04), m);
    p.position.set(-w / 2 + gx * (c + 0.5), y0 + gy * (r + 0.5), d / 2 + 0.02);
    group.add(p);
    panes.push({ r, c, m, p });
  }
  return panes;
}

// ---------------------------------------------------------------- Bia's building (back left)
const bia = new THREE.Group();
world.add(at(bia, -2.35, 0.1, -3.1));
bia.add(at(rbox(3.2, 4.6, 2.6, mat(0xc9b39a)), 0, 2.3, 0));
bia.add(at(rbox(3.4, 0.18, 2.8, mat(0x8f7a66)), 0, 4.68, 0));
bia.add(at(rbox(0.9, 0.5, 0.9, mat(0x8f7a66)), 0.8, 5, -0.4));
const biaPanes = windows(bia, 3.2, 4.6, 2.6, 3, 4, 0.55, 0x0d1424, [[2, 1]]);
const biaPane = biaPanes.find((p) => p.r === 2 && p.c === 1);
const biaLight = new THREE.PointLight(0xffb85c, 6, 4.5, 1.6);
biaLight.position.set(-2.35, 3.85, -1.3);
world.add(biaLight);
bia.add(at(rbox(0.8, 0.9, 0.12, mat(0x5b4636)), 0, 0.45, 1.33));

// ---------------------------------------------------------------- the clinic near home (front right)
const cli = new THREE.Group();
world.add(at(cli, 2.0, 0.1, 3.35));
cli.add(at(rbox(3.0, 1.9, 2.0, mat(0xf2f2ee)), 0, 0.95, 0));
cli.add(at(rbox(3.2, 0.16, 2.2, mat(0x9fb3c8)), 0, 1.98, 0));
const cliPanes = windows(cli, 3.0, 1.9, 2.0, 3, 1, 0.3, 0x0d1424);
cliPanes[1].p.scale.set(0.8, 1.2, 1);
cliPanes[1].p.position.y = 0.72; // the door (glass)
// roof sign facing the camera
function signTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1024, 256);
  g.save(); g.translate(120, 128); g.scale(4.2, 4.2); g.fillStyle = '#1e83ce';
  const tooth = new Path2D('M-14-16c-7 0-11 6-11 13 0 6 3 10 4 15 1 6 2 14 6 14 3 0 4-5 5-10 1-4 2-6 4-6s3 2 4 6c1 5 2 10 5 10 4 0 5-8 6-14 1-5 4-9 4-15 0-7-4-13-11-13-5 0-6 3-8 3s-3-3-8-3z');
  g.fill(tooth); g.restore();
  g.fillStyle = '#16324f'; g.font = '800 92px Inter, sans-serif'; g.textBaseline = 'middle';
  g.fillText('CLÍNICA', 230, 96);
  g.font = '700 54px Inter, sans-serif'; g.fillStyle = '#4b6b8a';
  g.fillText('ODONTOLÓGICA', 232, 186);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const signMat = new THREE.MeshStandardMaterial({ map: signTexture(), emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.5 });
const sm = mat(0xdfe6ee);
const sign = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.75, 0.1), [sm, sm, sm, sm, signMat, sm]);
sign.castShadow = true;
world.add(at(sign, 2.0, 2.62, 3.1));
sign.rotation.y = 0.38;
// AI attendant light: a small glowing orb floating over the clinic, plus its light
const orbMat = new THREE.MeshStandardMaterial({ color: 0x0a2a6e, emissive: 0x2f7bff, emissiveIntensity: 0, roughness: 0.2 });
const orb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 16), orbMat);
world.add(at(orb, 3.75, 2.75, 3.35));
const orbLight = new THREE.PointLight(0x3d8bff, 0, 6, 1.4);
orbLight.position.set(3.4, 2.4, 4.2);
world.add(orbLight);
const orbHalo = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x3d8bff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
world.add(at(orbHalo, 3.75, 2.75, 3.35));

// ---------------------------------------------------------------- the other clinic (far right, back)
const cl2 = new THREE.Group();
world.add(at(cl2, 3.3, 0.1, -3.4));
cl2.add(at(rbox(2.3, 1.9, 2.2, mat(0xd9e6e1)), 0, 0.95, 0));
cl2.add(at(rbox(2.45, 0.14, 2.35, mat(0x5aa38f)), 0, 1.97, 0));
const cl2Panes = windows(cl2, 2.3, 1.9, 2.2, 2, 1, 0.3, 0x0d1424);
const cl2Light = new THREE.PointLight(0xfff0d0, 0, 4, 1.5);
cl2Light.position.set(3.3, 1.2, -2.0);
world.add(cl2Light);

// ---------------------------------------------------------------- props: trees, lamps, car
const treeM = mat(0x2e7d4f), trunkM = mat(0x5b3d2a);
for (const [x, z, s] of [[-4.2, 3.6, 1], [-3.0, 4.3, 0.8], [0.2, -3.6, 0.9], [-4.4, -1.6, 0.7], [4.4, 1.0, 0.75], [0.6, 4.4, 0.7]]) {
  const t = new THREE.Group();
  t.add(at(rbox(0.16, 0.6, 0.16, trunkM, 0.04), 0, 0.3, 0));
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), treeM);
  crown.material.flatShading = true;
  crown.castShadow = true;
  t.add(at(crown, 0, 0.95, 0));
  t.scale.setScalar(s);
  world.add(at(t, x, 0.1, z));
}
const lampHeads = [];
for (const [x, z] of [[-0.6, -1.05], [3.9, 1.85]]) {
  world.add(at(rbox(0.07, 1.6, 0.07, mat(0x3a3f4a), 0.03), x, 0.9, z));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 8), new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffc46b, emissiveIntensity: 2.5 }));
  world.add(at(head, x, 1.72, z));
  const l = new THREE.PointLight(0xffc46b, 4, 3.2, 1.6);
  l.position.set(x, 1.6, z);
  world.add(l);
  lampHeads.push(l);
}
const car = new THREE.Group();
car.add(at(rbox(1.1, 0.32, 0.55, mat(0xd94c3d, { roughness: 0.4 }), 0.1), 0, 0.3, 0));
car.add(at(rbox(0.62, 0.26, 0.5, mat(0x9fc2e8, { roughness: 0.1 }), 0.08), -0.05, 0.55, 0));
for (const [x, z] of [[-0.35, 0.26], [0.35, 0.26], [-0.35, -0.26], [0.35, -0.26]]) {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16), mat(0x111111));
  w.rotation.x = Math.PI / 2;
  car.add(at(w, x, 0.13, z));
}
world.add(at(car, -1.3, 0.12, 1.0));

// ---------------------------------------------------------------- sound wave particles (additive sprites)
function glowTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.25, 'rgba(255,255,255,.7)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const GLOW = glowTex();
orbHalo.material.map = GLOW;
const sprite = (color, s) => {
  const m = new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const sp = new THREE.Sprite(m);
  sp.scale.setScalar(s);
  world.add(sp);
  return sp;
};
const BIA_WIN = new THREE.Vector3(-2.35, 3.6, -1.75);
const CLI = new THREE.Vector3(3.75, 2.75, 3.35);
const CL2 = new THREE.Vector3(3.3, 1.2, -2.15);
const arc = (a, b, h) => new THREE.QuadraticBezierCurve3(a, new THREE.Vector3((a.x + b.x) / 2, Math.max(a.y, b.y) + h, (a.z + b.z) / 2), b);
const ROUTES = { toCli: arc(BIA_WIN, CLI, 2.4), toCl2: arc(BIA_WIN, CL2, 2.0), back: arc(CLI, BIA_WIN, 2.4) };
const N = 28;
const waves = {};
for (const [k, color] of [['a', 0xffc46b], ['b', 0xffc46b], ['c', 0x5aa0ff], ['d', 0x5aa0ff], ['e', 0x5aa0ff], ['f', 0x5aa0ff]]) {
  waves[k] = Array.from({ length: N }, (_, i) => sprite(color, i === 0 ? 0.75 : 0.42 - i * 0.008));
}
const clamp = (x) => Math.max(0, Math.min(1, x));
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const L = (a, b, x) => a + (b - a) * x;
/** Wave k travels along route from time a to b; after b it either fades at the target or falls (drop=true). */
function wave(k, route, s, a, b, { drop = false, tail = 0.5 } = {}) {
  const ps = waves[k];
  const head = (s - a) / (b - a);
  ps.forEach((sp, i) => {
    const u = head - i * 0.02;
    if (s < a || u < 0 || (head > 1 + tail && !drop)) { sp.visible = false; return; }
    sp.visible = true;
    const uu = Math.min(1, u);
    const pos = route.getPoint(uu);
    let o = (1 - i / N) * (u > 1 ? Math.max(0, 1 - (head - 1) / tail) : 1);
    if (drop && head > 1) {
      const f = (s - b) - i * 0.012;
      pos.y -= Math.max(0, f) * Math.max(0, f) * 6;
      pos.x += Math.sin(i * 1.7) * Math.max(0, f) * 0.6;
      o = (1 - i / N) * Math.max(0, 1 - Math.max(0, f) / 0.9);
    }
    sp.position.copy(pos);
    sp.material.opacity = o;
  });
}

// ---------------------------------------------------------------- the frame
const v = new THREE.Vector3();
window.project = (p) => {
  v.copy(p).applyMatrix4(world.matrixWorld).project(camera);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};
window.ANCHORS = { cli: new THREE.Vector3(2.0, 3.05, 3.1), cl2: new THREE.Vector3(3.3, 2.6, -3.4), bia: new THREE.Vector3(-2.35, 5.4, -3.1) };

/** story: { mode: 'A' | 'B', s } (s = story time in seconds), day: 0 night … 1 day, sleep: 0…1 Bia's light off, cam: {...} */
window.diorama = (t, st) => {
  // camera: slow orbit on a high angle, framed into the top part of the screen
  const c = st.cam;
  const ang = c.ang, dist = c.dist;
  camera.position.set(Math.sin(ang) * dist, c.h, Math.cos(ang) * dist);
  camera.lookAt(0, c.ly, 0);
  camera.setViewOffset(W, H, 0, c.off, W, H);
  camera.updateProjectionMatrix();
  world.rotation.y = 0;
  world.position.y = Math.sin(t * 0.8) * 0.06;
  world.updateMatrixWorld(true);

  // day/night
  const d = st.day;
  hemi.intensity = L(0.9, 1.6, d);
  hemi.color.setHex(d > 0.5 ? 0xbfd8ff : 0x5a6ea8);
  moon.intensity = L(1.1, 0.4, d);
  sun.intensity = L(0, 2.6, d);
  for (const l of lampHeads) l.intensity = L(4, 0.4, d);

  // Bia's window light
  const lit = 1 - st.sleep;
  biaPane.m.emissiveIntensity = 2.2 * lit + 0.35 * (1 - lit);
  biaPane.m.emissive.setHex(lit > 0.5 ? 0xffc46b : 0x0d1424);
  biaLight.intensity = 6 * lit;

  // waves and the clinics
  for (const k in waves) waves[k].forEach((sp) => (sp.visible = false));
  const s = st.s;
  let cl2On = 0, ai = 0, flash = 0;
  if (st.mode === 'A') {
    wave('a', ROUTES.toCli, s, 2.5, 6.3, { drop: true });
    wave('b', ROUTES.toCl2, s, 7.75, 8.9, {});
    cl2On = eo((s - 8.9) / 0.4);
  } else {
    ai = st.ai;
    wave('c', ROUTES.toCli, s, 14.6, 15.6, {});
    flash = Math.max(0, 1 - Math.abs(s - 15.7) / 0.35);
    wave('d', ROUTES.back, s, 15.9, 16.9, {});
    wave('e', ROUTES.back, s, 20.7, 21.7, {});
    wave('f', ROUTES.toCli, s, 22.2, 23.0, {});
    flash = Math.max(flash, Math.max(0, 1 - Math.abs(s - 23.1) / 0.3));
  }
  cl2Panes.forEach((p) => { p.m.emissive.setHex(cl2On > 0.5 ? 0xfff0d0 : 0x0d1424); p.m.emissiveIntensity = L(0.35, 2, cl2On); });
  cl2Light.intensity = 5 * cl2On;
  const pulse = 0.85 + 0.15 * Math.sin(t * 4);
  orbMat.emissiveIntensity = (3 * ai + 4 * flash) * pulse;
  orb.scale.setScalar(0.6 + 0.4 * ai + 0.3 * flash);
  orbLight.intensity = (7 * ai + 10 * flash) * pulse;
  orbHalo.material.opacity = Math.min(1, 0.9 * ai + flash) * pulse;
  orbHalo.scale.setScalar(1.6 + 0.8 * flash);
  const aiOn = ai > 0 || flash > 0;
  cliPanes.forEach((p) => { p.m.emissive.setHex(aiOn ? 0x2f7bff : 0x0d1424); p.m.emissiveIntensity = 0.35 + 0.9 * ai * pulse + 1.6 * flash; });
  signMat.emissiveIntensity = 0;
  signMat.color.setScalar(L(0.35, 1, Math.max(d, ai * 0.9)));

  renderer.render(scene, camera);
};
