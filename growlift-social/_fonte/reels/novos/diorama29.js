// Reel 29 · "Quanto sobra da marmita?": a 3D aluminium lunch box on a glowing platform (Three.js, frame by frame).
// The food goes in item by item (chicken, rice and beans, salad and farofa) while the reel's cost card subtracts each
// cost. window.marmita(t, st) draws the frame; st = { cam, items: {frango, arroz, feijao, salada, farofa} (0..1),
// spin, glow, red } — everything is a pure function of (t, st).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
scene.environmentIntensity = 0.9;

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, ...o });
const at = (o, x, y, z) => (o.position.set(x, y, z), o);
const shadow = (o) => (o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }), o);

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x0b1430, 0.55));
const key = new THREE.SpotLight(0xfff1e0, 60, 30, 0.55, 0.6, 1.4);
key.position.set(2.5, 8, 5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0004;
scene.add(key);
scene.add(key.target);
const rim = new THREE.DirectionalLight(0x6f9bff, 1.6);
rim.position.set(-5, 3, -6);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xffffff, 0.5);
fill.position.set(-3, 2, 6);
scene.add(fill);

// ---------------------------------------------------------------- platform
const plat = new THREE.Group();
scene.add(plat);
const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.75, 0.32, 96), M(0x16224a, { roughness: 0.45, metalness: 0.2 }));
disc.receiveShadow = true;
plat.add(at(disc, 0, -0.16, 0));
const discTop = new THREE.Mesh(new THREE.CircleGeometry(2.58, 96), M(0x1d2c5e, { roughness: 0.35, metalness: 0.25 }));
discTop.rotation.x = -Math.PI / 2;
discTop.receiveShadow = true;
plat.add(at(discTop, 0, 0.001, 0));
const neonMat = new THREE.MeshStandardMaterial({ color: 0, emissive: 0x3d8bff, emissiveIntensity: 2.4 });
const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.035, 10, 160), neonMat);
ring.rotation.x = Math.PI / 2;
plat.add(at(ring, 0, 0.005, 0));
const halo = new THREE.Mesh(new THREE.RingGeometry(2.62, 3.6, 96), new THREE.MeshBasicMaterial({ color: 0x2f6fff, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
halo.rotation.x = -Math.PI / 2;
plat.add(at(halo, 0, -0.3, 0));

// ---------------------------------------------------------------- the aluminium box
const box = new THREE.Group();
plat.add(box);
const alu = new THREE.MeshStandardMaterial({ color: 0xd9dde4, metalness: 0.95, roughness: 0.32, side: THREE.DoubleSide });
const BW = 1.9, BD = 1.3, BH = 0.42, slope = 0.12;
// tapered walls: a 4-sided open cylinder turned 45°, then stretched to a rectangle
const wallGeo = new THREE.CylinderGeometry(Math.SQRT1_2 * 1, Math.SQRT1_2 * (1 - slope), BH, 4, 6, true);
wallGeo.rotateY(Math.PI / 4);
{ // crinkle: tiny ripples like pressed foil
  const p = wallGeo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 + 0.012 * Math.sin(y * 60) * (0.6 + 0.4 * Math.sin(i)); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  wallGeo.computeVertexNormals();
}
const walls = new THREE.Mesh(wallGeo, alu);
walls.scale.set(BW, 1, BD);
box.add(at(walls, 0, BH / 2 + 0.02, 0));
const bottom = new THREE.Mesh(new THREE.PlaneGeometry(BW * (1 - slope) * 1.0, BD * (1 - slope) * 1.0), alu);
bottom.rotation.x = -Math.PI / 2;
box.add(at(bottom, 0, 0.022, 0));
// flat rim around the top
const rimMat = alu;
for (const [w, d, x, z] of [[BW + 0.16, 0.1, 0, BD / 2 + 0.03], [BW + 0.16, 0.1, 0, -BD / 2 - 0.03], [0.1, BD + 0.06, BW / 2 + 0.03, 0], [0.1, BD + 0.06, -BW / 2 - 0.03, 0]]) {
  const r = new THREE.Mesh(new RoundedBoxGeometry(w, 0.03, d, 2, 0.012), rimMat);
  box.add(at(r, x, BH + 0.03, z));
}
shadow(box);

// ---------------------------------------------------------------- food helpers
function mound(rx, ry, rz, color, o = {}) {
  const g = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 1 + (o.bump ?? 0.06) * (Math.sin(x * 9 + z * 7) * 0.5 + Math.sin(x * 17 - z * 13) * 0.3 + Math.sin(z * 23 + x * 5) * 0.2);
    p.setXYZ(i, x * rx * n, y * ry * n, z * rz * n);
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, M(color, { roughness: o.rough ?? 0.85, ...(o.mat || {}) }));
}
function grains(n, geo, mat, place) {
  const m = new THREE.InstancedMesh(geo, mat, n);
  const d = new THREE.Object3D();
  for (let i = 0; i < n; i++) { place(d, i); d.updateMatrix(); m.setMatrixAt(i, d.matrix); }
  m.castShadow = true;
  return m;
}
const food = {};
const FY = 0.2; // food sits high, a full box
// rice: left half
{
  const g = new THREE.Group();
  const base = mound(0.46, 0.2, 0.5, 0xf3efe6, { bump: 0.05, rough: 0.9 });
  g.add(base);
  const geo = new THREE.CapsuleGeometry(0.012, 0.03, 2, 6);
  const mat = M(0xfbf8f1, { roughness: 0.7 });
  g.add(grains(420, geo, mat, (d, i) => {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
    const x = Math.cos(a) * r * 0.44, z = Math.sin(a) * r * 0.48;
    const y = 0.2 * Math.sqrt(Math.max(0, 1 - (x / 0.46) ** 2 - (z / 0.5) ** 2)) + 0.004;
    d.position.set(x, y, z); d.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
  }));
  g.position.set(-0.43, FY, 0.02);
  box.add(shadow(g));
  food.arroz = g;
}
// beans: right front
{
  const g = new THREE.Group();
  g.add(mound(0.36, 0.13, 0.26, 0x3b2116, { bump: 0.05, rough: 0.45, mat: { metalness: 0.05 } }));
  const geo = new THREE.SphereGeometry(0.03, 10, 8);
  geo.scale(1.5, 0.8, 1);
  const mat = M(0x5a2f1d, { roughness: 0.35 });
  g.add(grains(70, geo, mat, (d) => {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
    const x = Math.cos(a) * r * 0.33, z = Math.sin(a) * r * 0.23;
    const y = 0.13 * Math.sqrt(Math.max(0, 1 - (x / 0.36) ** 2 - (z / 0.26) ** 2)) + 0.01;
    d.position.set(x, y, z); d.rotation.set(0, rnd() * 3, rnd() * 0.5);
  }));
  g.position.set(0.42, FY, 0.3);
  box.add(shadow(g));
  food.feijao = g;
}
// chicken: two grilled fillets, right back
{
  const g = new THREE.Group();
  const meat = M(0xc98a4b, { roughness: 0.55 });
  const mark = M(0x5a3015, { roughness: 0.7 });
  [[-0.02, 0.0, -0.08, 0.25], [0.12, 0.07, 0.06, -0.2]].forEach(([x, y, z, ry]) => {
    const f = new THREE.Group();
    const geo = new RoundedBoxGeometry(0.62, 0.09, 0.28, 4, 0.045);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const X = p.getX(i); p.setY(i, p.getY(i) + 0.02 * Math.sin(X * 6)); p.setZ(i, p.getZ(i) * (1 - 0.25 * Math.abs(X) / 0.31)); }
    geo.computeVertexNormals();
    f.add(new THREE.Mesh(geo, meat));
    for (let k = -2; k <= 2; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.3), mark); s.rotation.y = 0.7; f.add(at(s, k * 0.11, 0.05 + 0.02 * Math.sin(k * 0.66), 0)); }
    f.rotation.set(0.05, ry, 0.04);
    g.add(at(f, x, y + 0.05, z));
  });
  g.position.set(0.38, FY, -0.26);
  box.add(shadow(g));
  food.frango = g;
}
// salad: lettuce + tomato on the rice edge, front left corner
{
  const g = new THREE.Group();
  const leaf = M(0x5fbf4a, { roughness: 0.6 });
  const leaf2 = M(0x3f9a35, { roughness: 0.6 });
  for (let i = 0; i < 7; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 10), i % 2 ? leaf : leaf2);
    l.scale.set(1.4, 0.25, 1);
    l.rotation.set(rnd() * 0.6, rnd() * 3, rnd() * 0.6);
    g.add(at(l, (rnd() - 0.5) * 0.24, 0.05 + rnd() * 0.05, (rnd() - 0.5) * 0.16));
  }
  const tom = M(0xe2442f, { roughness: 0.4 });
  const seedM = M(0xf5c26b, { roughness: 0.5 });
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 24), tom);
    s.rotation.set(0.25 + rnd() * 0.3, 0, rnd() * 0.3);
    g.add(at(s, -0.08 + i * 0.09, 0.12 + i * 0.01, 0.04 - i * 0.03));
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.027, 16), seedM);
    c.rotation.copy(s.rotation);
    g.add(at(c, -0.08 + i * 0.09, 0.121 + i * 0.01, 0.04 - i * 0.03));
  }
  g.position.set(-0.55, FY + 0.1, 0.4);
  box.add(shadow(g));
  food.salada = g;
}
// farofa: small golden mound between beans and chicken
{
  const g = new THREE.Group();
  g.add(mound(0.2, 0.09, 0.16, 0xd8b06a, { bump: 0.1, rough: 0.95 }));
  const geo = new THREE.SphereGeometry(0.012, 6, 4);
  g.add(grains(120, geo, M(0xc9963f, { roughness: 0.95 }), (d) => {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
    const x = Math.cos(a) * r * 0.19, z = Math.sin(a) * r * 0.15;
    d.position.set(x, 0.09 * Math.sqrt(Math.max(0, 1 - (x / 0.2) ** 2 - (z / 0.16) ** 2)) + 0.004, z);
  }));
  g.position.set(0.72, FY, 0.02);
  box.add(shadow(g));
  food.farofa = g;
}
const home = Object.fromEntries(Object.entries(food).map(([k, g]) => [k, g.position.clone()]));

// ---------------------------------------------------------------- frame
const clamp = (x) => Math.max(0, Math.min(1, x));
const back = (x) => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
window.marmita = (t, st = {}) => {
  const items = st.items || {};
  for (const [k, g] of Object.entries(food)) {
    const v = items[k] ?? 1;
    g.visible = v > 0.001;
    const drop = 1 - clamp(v / 0.6);
    g.position.copy(home[k]).add(new THREE.Vector3(0, drop * 1.4, 0));
    const s = 0.6 + 0.4 * back(v);
    g.scale.setScalar(Math.max(0.001, s));
  }
  plat.rotation.y = (st.spin ?? 0) + Math.sin(t * 0.5) * 0.18;
  const red = st.red || 0;
  neonMat.emissive.setRGB(0.24 + 0.76 * red, 0.55 - 0.35 * red, 1 - 0.75 * red);
  neonMat.emissiveIntensity = 2.2 + (st.glow || 0) * 1.5;
  halo.material.color.setRGB(0.18 + 0.8 * red, 0.43 - 0.3 * red, 1 - 0.8 * red);
  const c = st.cam || { pos: [0, 3.2, 6.4], look: [0, 0.25, 0], fov: 30 };
  camera.position.set(...c.pos);
  camera.lookAt(new THREE.Vector3(...c.look));
  camera.fov = c.fov || 30;
  camera.updateProjectionMatrix();
  key.target.position.set(0, 0, 0);
  renderer.render(scene, camera);
};
