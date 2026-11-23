// Reel 33 · "Quatro estrelas de diferença", version 2 (23/11): first person, like the reference Antônio sent. The
// camera is the customer's eyes at table 7; we only see his arm, his hand and his phone. Toy-like characters (matte,
// big round heads, dot eyes, pink cheeks): the red-haired waitress with round glasses, mint sweater and white apron,
// the waiter in a black vest, the chef behind the kitchen window, pastel diners. Warm diner: cream walls, brown
// ceiling band, black-and-white checkered floor, red chairs, yellow cone lamps, TV boards on the back wall.
// window.dio.draw(t) draws time t (pure function of t); window.dio.project(x,y,z) gives screen pixels for overlays;
// window.ready resolves once the burger GLB is parsed. Phone screens are HTML in reel33.mjs.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#3a2414');
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.02, 60);
scene.add(camera);

// ---------------------------------------------------------------- helpers
const clamp = (x) => Math.max(0, Math.min(1, x));
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const back = (x) => { x = clamp(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, k) => a + (b - a) * k;
const toy = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...o });
const add = (parent, geo, material, x = 0, y = 0, z = 0, cast = true) => {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  parent.add(m);
  return m;
};
const rbox = (w, h, d, r = 0.04) => new RoundedBoxGeometry(w, h, d, 3, r);
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.userData.canvas = c;
  return t;
}
const UP = new THREE.Vector3(0, 1, 0);
/** A capsule stretched between two points (the sleeve). */
function limb(mesh, a, b, len0) {
  const d = new THREE.Vector3().subVectors(b, a);
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(UP, d.clone().normalize());
  mesh.scale.set(1, d.length() / len0, 1);
}

// ---------------------------------------------------------------- the diner
const ROOM = { x0: -5.5, x1: 5.5, z0: -2.0, z1: 8.4 };
const RW = ROOM.x1 - ROOM.x0, RD = ROOM.z1 - ROOM.z0, CZ = (ROOM.z0 + ROOM.z1) / 2;
let seed = 33;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const checker = canvasTex(1024, 1024, (g, w, h) => {
  const n = 8, s = w / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? '#1c1c1e' : '#f1ede4'; g.fillRect(x * s, y * s, s, s); }
  g.globalAlpha = 0.06; for (let i = 0; i < 4000; i++) { g.fillStyle = rnd() > 0.5 ? '#000' : '#fff'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
});
checker.wrapS = checker.wrapT = THREE.RepeatWrapping;
checker.repeat.set(RW / 2.4, RD / 2.4);
add(scene, new THREE.BoxGeometry(RW, 0.2, RD), toy('#ffffff', { map: checker, roughness: 0.35 }), 0, -0.1, CZ, false);
const wallH = 3.2;
const cream = toy('#efe0bf', { roughness: 0.85 });
const brownBand = toy('#5a3a22', { roughness: 0.8 });
const woodDark = toy('#6b4226', { roughness: 0.6 });
function wall(w, x, z, ry) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(w, 2.25, 0.12), cream, 0, 1.125, 0, false);
  add(g, new THREE.BoxGeometry(w, wallH - 2.25, 0.12), brownBand, 0, 2.25 + (wallH - 2.25) / 2, 0, false);
  add(g, new THREE.BoxGeometry(w, 0.75, 0.16), woodDark, 0, 0.375, 0.02, false);
  add(g, new THREE.BoxGeometry(w, 0.06, 0.2), woodDark, 0, 2.25, 0.04, false);
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
}
wall(RW, 0, ROOM.z1, Math.PI);
wall(RW, 0, ROOM.z0, 0);
wall(RD, ROOM.x0, CZ, Math.PI / 2);
wall(RD, ROOM.x1, CZ, -Math.PI / 2);
add(scene, new THREE.BoxGeometry(RW, 0.12, RD), toy('#3b2414', { roughness: 0.9 }), 0, wallH + 0.06, CZ, false);
for (let z = -1; z < 8; z += 2.2) add(scene, new THREE.BoxGeometry(RW, 0.14, 0.18), toy('#2c1a0e'), 0, wallH - 0.07, z, false);

// framed landscapes on the side walls
const picTex = canvasTex(256, 192, (g, w, h) => {
  g.fillStyle = '#bfe0f2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7fb069'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.35, h * 0.45); g.lineTo(w * 0.6, h * 0.75); g.lineTo(w * 0.8, h * 0.5); g.lineTo(w, h); g.fill();
  g.fillStyle = '#fff5c2'; g.beginPath(); g.arc(w * 0.78, h * 0.25, 18, 0, 7); g.fill();
});
function picture(x, y, z, ry) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.62, 0.48, 0.04), woodDark, 0, 0, 0, false);
  add(g, new THREE.PlaneGeometry(0.52, 0.38), toy('#fff', { map: picTex, roughness: 0.9 }), 0, 0, 0.025, false);
  g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
}
picture(ROOM.x1 - 0.08, 1.75, 2.6, -Math.PI / 2);
picture(ROOM.x0 + 0.08, 1.75, 3.6, Math.PI / 2);
picture(ROOM.x1 - 0.08, 1.75, 5.8, -Math.PI / 2);
picture(-0.8, 1.7, ROOM.z0 + 0.08, 0);

// TV boards and the kitchen window on the back wall (in front of the customer)
const menuTex = canvasTex(512, 300, (g) => {
  g.fillStyle = '#0d1b33'; g.fillRect(0, 0, 512, 300);
  g.fillStyle = '#ffd166'; g.font = '800 40px Inter, sans-serif'; g.fillText('Hamburgueria', 26, 56);
  g.fillStyle = '#e8eefc'; g.font = '600 26px Inter, sans-serif';
  ['Clássico ........ 34,90', 'Duplo bacon ..... 42,90', 'Smash salada .... 29,90', 'Fritas .......... 14,00'].forEach((l, i) => g.fillText(l, 26, 116 + i * 44));
});
function tv(x, y, z, tex, w = 0.95, h = 0.56) {
  const g = new THREE.Group();
  add(g, rbox(w + 0.06, h + 0.06, 0.05, 0.015), toy('#0a0a0c', { roughness: 0.4 }), 0, 0, 0, false);
  add(g, new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }), 0, 0, 0.03, false);
  g.position.set(x, y, z); g.rotation.y = Math.PI; scene.add(g);
  return g;
}
tv(-2.3, 2.45, ROOM.z1 - 0.1, menuTex);
let tvState = -1;
const kTex = canvasTex(1024, 576, () => {});
function drawK(stage, since) {
  const c = kTex.userData.canvas, g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8eefc'; g.font = '800 46px Inter, sans-serif'; g.textBaseline = 'top'; g.fillText('Cozinha', 40, 28);
  g.fillStyle = '#8fa0bf'; g.font = '600 26px Inter, sans-serif'; g.fillText('por ordem de chegada', 236, 44);
  const card = (x, mesa, itens, tempo, novo) => {
    g.fillStyle = novo ? '#0f2a1d' : '#152038'; g.beginPath(); g.roundRect(x, 108, 300, 430, 22); g.fill();
    g.strokeStyle = novo ? '#34d27b' : '#2a3a5c'; g.lineWidth = novo ? 7 : 3; g.stroke();
    g.fillStyle = '#ffffff'; g.font = '900 54px Inter, sans-serif'; g.fillText(mesa, x + 24, 132);
    g.fillStyle = '#c7d2e6'; g.font = '600 30px Inter, sans-serif'; itens.forEach((it, i) => g.fillText(it, x + 24, 218 + i * 44));
    if (novo) { g.fillStyle = '#34d27b'; g.beginPath(); g.roundRect(x + 24, 398, 140, 52, 26); g.fill(); g.fillStyle = '#062012'; g.font = '900 30px Inter, sans-serif'; g.fillText('NOVO', x + 50, 408); }
    g.fillStyle = novo ? '#34d27b' : '#8fa0bf'; g.font = '800 34px Inter, sans-serif'; g.fillText(tempo, x + 24, 470);
  };
  card(40, 'Mesa 3', ['2× X-salada', '1× Suco'], '07:52', false);
  card(362, 'Mesa 5', ['1× Fritas G', '2× Refri'], '03:10', false);
  if (stage) card(684, 'Mesa 7', ['1× Clássico'], '00:0' + Math.min(9, Math.floor(since)), true);
  kTex.needsUpdate = true;
}
const KX = 1.5;
tv(KX, 2.52, ROOM.z1 - 0.1, kTex, 1.4, 0.79);
// kitchen window (a warm lit opening), the pass counter in front of it, pans, the sign
add(scene, new THREE.BoxGeometry(1.9, 0.95, 0.02), new THREE.MeshBasicMaterial({ color: '#f6e7c8' }), KX, 1.45, ROOM.z1 - 0.07, false);
add(scene, new THREE.BoxGeometry(2.05, 0.08, 0.1), woodDark, KX, 1.95, ROOM.z1 - 0.11, false);
for (const s of [-1, 1]) add(scene, new THREE.BoxGeometry(0.08, 1.0, 0.1), woodDark, KX + s * 0.98, 1.45, ROOM.z1 - 0.11, false);
add(scene, new THREE.BoxGeometry(2.1, 0.06, 0.32), toy('#cfd4da', { roughness: 0.3, metalness: 0.3 }), KX, 1.02, ROOM.z1 - 0.62);
add(scene, new THREE.BoxGeometry(2.05, 0.99, 0.26), woodDark, KX, 0.495, ROOM.z1 - 0.62);
for (let i = 0; i < 4; i++) add(scene, new THREE.CylinderGeometry(0.09, 0.09, 0.02, 20), toy('#2b2b2e', { roughness: 0.4, metalness: 0.5 }), KX - 0.6 + i * 0.4, 1.78, ROOM.z1 - 0.1, false).rotation.x = Math.PI / 2;
const cozTex = canvasTex(256, 64, (g, w) => { g.fillStyle = '#2c1a0e'; g.fillRect(0, 0, w, 64); g.fillStyle = '#ffd166'; g.font = '800 36px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('COZINHA', w / 2, 46); });
add(scene, new THREE.PlaneGeometry(0.7, 0.18), new THREE.MeshBasicMaterial({ map: cozTex }), KX - 1.6, 2.0, ROOM.z1 - 0.07, false).rotation.y = Math.PI;

// yellow cone lamps
const lampLights = [];
function lamp(x, z, light) {
  const p = new THREE.Group();
  add(p, new THREE.CylinderGeometry(0.008, 0.008, 0.9, 6), toy('#111'), 0, 0.45, 0, false);
  add(p, new THREE.ConeGeometry(0.2, 0.17, 28, 1, true), toy('#f4b400', { side: THREE.DoubleSide, roughness: 0.45, emissive: '#5a3a00', emissiveIntensity: 0.4 }), 0, 0, 0, false);
  add(p, new THREE.SphereGeometry(0.06, 14, 10), new THREE.MeshBasicMaterial({ color: '#fff1c4' }), 0, -0.06, 0, false);
  p.position.set(x, wallH - 1.02, z);
  scene.add(p);
  if (light) { const L = new THREE.PointLight('#ffd08a', 5, 4.5, 1.5); L.position.set(x, wallH - 1.25, z); scene.add(L); lampLights.push(L); }
}

// ---------------------------------------------------------------- toy people
const SKIN = { a: '#f3d2b3', b: '#e7b48e', c: '#c98e64' };
const black = toy('#151515', { roughness: 0.5 });
const cheek = toy('#f29b9b', { roughness: 0.8 });
function toyPerson(o) {
  const { seated = false, shirt = '#9db7e8', skin = SKIN.a, hair = null, hairColor = '#2b1a12', kind = 'diner', pants = '#2e3a55' } = o;
  const g = new THREE.Group();
  const sk = toy(skin, { roughness: 0.7 }), sm = toy(shirt), hm = toy(hairColor, { roughness: 0.7 });
  const torsoY = seated ? 0.66 : 0.78;
  const torso = add(g, new THREE.CapsuleGeometry(0.165, 0.26, 8, 18), kind === 'waiter' ? black : sm, 0, torsoY, 0);
  torso.scale.set(1.05, 1, 0.82);
  if (kind === 'waiter') {
    const v = new THREE.Shape(); v.moveTo(-0.06, 0.13); v.lineTo(0.06, 0.13); v.lineTo(0, -0.04); v.closePath();
    add(g, new THREE.ShapeGeometry(v), toy('#f4f4f2'), 0, torsoY + 0.04, 0.142, false);
    add(g, new THREE.ConeGeometry(0.025, 0.05, 10), black, -0.026, torsoY + 0.16, 0.15, false).rotation.z = -Math.PI / 2;
    add(g, new THREE.ConeGeometry(0.025, 0.05, 10), black, 0.026, torsoY + 0.16, 0.15, false).rotation.z = Math.PI / 2;
  }
  if (kind === 'waitress') add(g, rbox(0.27, 0.72, 0.03, 0.012), toy('#f7f3ea'), 0, torsoY - 0.22, 0.14);
  if (kind === 'chef') add(g, rbox(0.24, 0.32, 0.03, 0.01), toy('#ffffff'), 0, torsoY - 0.1, 0.14);
  add(g, new THREE.CylinderGeometry(0.06, 0.07, 0.08, 14), sk, 0, torsoY + 0.24, 0, false);
  const head = new THREE.Group();
  add(head, new THREE.SphereGeometry(0.2, 32, 24), sk, 0, 0, 0);
  for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.045, 12, 10), sk, s * 0.195, -0.01, 0, false);
  const eyes = [-1, 1].map((s) => add(head, new THREE.SphereGeometry(0.022, 12, 10), black, s * 0.07, 0.02, 0.185, false));
  for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.035, 12, 10), cheek, s * 0.115, -0.045, 0.16, false).scale.set(1, 0.65, 0.4);
  const smile = add(head, new THREE.TorusGeometry(0.035, 0.008, 8, 20, Math.PI), black, 0, -0.06, 0.188, false);
  smile.rotation.z = Math.PI;
  const mouthO = add(head, new THREE.SphereGeometry(0.022, 12, 10), toy('#5a1d1d'), 0, -0.07, 0.19, false);
  mouthO.scale.set(1, 1.2, 0.4);
  mouthO.visible = false;
  const brows = [-1, 1].map((s) => add(head, rbox(0.05, 0.012, 0.01, 0.005), hm, s * 0.07, 0.075, 0.19, false));
  if (hair === 'bun') {
    const cap = add(head, new THREE.SphereGeometry(0.212, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.52), hm, 0, 0.015, -0.01);
    cap.rotation.x = -0.32;
    add(head, new THREE.SphereGeometry(0.085, 20, 16), hm, 0, 0.22, -0.04);
    add(head, new THREE.SphereGeometry(0.11, 18, 14), hm, -0.07, 0.11, 0.1, false).scale.set(1.2, 0.5, 0.6);
    for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.014, 8, 6), toy('#f4c430', { metalness: 0.6, roughness: 0.3 }), s * 0.2, -0.06, 0.01, false);
  } else if (hair === 'bowl') {
    const cap = add(head, new THREE.SphereGeometry(0.214, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), hm, 0, 0.03, 0);
    cap.rotation.x = -0.12;
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI - Math.PI; add(head, new THREE.SphereGeometry(0.006, 6, 4), toy('#3a2a20'), Math.cos(a) * 0.09, -0.1 + Math.sin(a) * 0.04, 0.17, false); }
  } else if (hair === 'chef') {
    add(head, new THREE.CylinderGeometry(0.16, 0.15, 0.18, 22), toy('#ffffff'), 0, 0.23, -0.01);
    add(head, new THREE.SphereGeometry(0.19, 22, 16), toy('#ffffff'), 0, 0.36, -0.01);
    for (const s of [-1, 1]) add(head, new THREE.CapsuleGeometry(0.018, 0.06, 4, 8), toy('#3a2416'), s * 0.04, -0.035, 0.19, false).rotation.z = s * 1.2;
  } else if (hair) {
    add(head, new THREE.SphereGeometry(0.212, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), hm, 0, 0.02, -0.01).rotation.x = -0.2;
  }
  if (o.glasses) {
    const gm = toy(o.glasses, { roughness: 0.35 });
    for (const s of [-1, 1]) add(head, new THREE.TorusGeometry(0.045, 0.008, 8, 24), gm, s * 0.07, 0.02, 0.195, false);
    add(head, new THREE.BoxGeometry(0.04, 0.008, 0.008), gm, 0, 0.03, 0.205, false);
  }
  head.position.y = torsoY + 0.47;
  g.add(head);
  const arm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.2, torsoY + 0.14, 0);
    const a = add(pivot, new THREE.CapsuleGeometry(0.052, 0.28, 6, 12), kind === 'waiter' ? toy('#f4f4f2') : sm, 0, -0.17, 0);
    add(a, new THREE.SphereGeometry(0.062, 14, 12), sk, 0, -0.18, 0);
    g.add(pivot);
    return pivot;
  };
  const armL = arm(-1), armR = arm(1);
  const legs = [];
  if (seated) {
    for (const s of [-1, 1]) { const l = add(g, new THREE.CapsuleGeometry(0.065, 0.3, 4, 10), toy(pants), s * 0.08, 0.46, 0.18); l.rotation.x = Math.PI / 2; }
  } else {
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.085, 0.5, 0);
      add(pivot, new THREE.CapsuleGeometry(0.068, 0.36, 4, 10), toy(pants), 0, -0.24, 0);
      add(pivot, rbox(0.11, 0.07, 0.18, 0.03), black, 0, -0.47, 0.03);
      g.add(pivot);
      legs.push(pivot);
    }
  }
  return { g, head, armL, armR, legs, eyes, smile, mouthO, brows };
}
const face = (p, mood) => {
  p.smile.visible = mood !== 'o' && mood !== 'worried';
  p.mouthO.visible = mood === 'o';
  p.brows.forEach((b, i) => { b.rotation.z = mood === 'worried' || mood === 'o' ? (i ? -0.35 : 0.35) : 0; b.position.y = mood === 'o' ? 0.09 : 0.075; });
  p.smile.scale.setScalar(mood === 'big' ? 1.45 : 1);
};

// ---------------------------------------------------------------- tables and chairs
const tableWood = toy('#8a5530', { roughness: 0.5 });
const chairRed = toy('#8e1f1f', { roughness: 0.55 });
function chair(parent, x, z, ry) {
  const c = new THREE.Group();
  add(c, rbox(0.42, 0.05, 0.4, 0.015), chairRed, 0, 0.45, 0);
  add(c, rbox(0.42, 0.42, 0.05, 0.015), chairRed, 0, 0.7, -0.19);
  for (const [a, b] of [[-0.17, -0.16], [0.17, -0.16], [-0.17, 0.16], [0.17, 0.16]]) add(c, new THREE.CylinderGeometry(0.018, 0.018, 0.45, 8), toy('#3a1010'), a, 0.225, b);
  c.position.set(x, 0, z); c.rotation.y = ry; parent.add(c);
}
const breadMat = toy('#f2c14e', { roughness: 0.6 });
function breadBasket(parent, x, z) {
  const b = new THREE.Group();
  add(b, new THREE.CylinderGeometry(0.11, 0.08, 0.06, 20, 1, true), toy('#a8682f', { side: THREE.DoubleSide }), 0, 0.03, 0);
  add(b, new THREE.CylinderGeometry(0.08, 0.08, 0.01, 20), toy('#a8682f'), 0, 0.005, 0);
  [[-0.035, 0.0], [0.04, 0.02], [0.0, -0.045]].forEach(([a, c]) => add(b, new THREE.SphereGeometry(0.045, 14, 10), breadMat, a, 0.06, c).scale.set(1.2, 0.8, 1));
  b.position.set(x, 0.79, z); parent.add(b);
}
function table(x, z, guests, light) {
  const t = new THREE.Group();
  t.position.set(x, 0, z);
  add(t, rbox(0.85, 0.05, 0.85, 0.015), tableWood, 0, 0.75, 0);
  add(t, new THREE.CylinderGeometry(0.04, 0.04, 0.72, 10), toy('#2c1a0e'), 0, 0.37, 0);
  add(t, new THREE.CylinderGeometry(0.24, 0.27, 0.03, 20), toy('#2c1a0e'), 0, 0.015, 0);
  breadBasket(t, 0.18, -0.15);
  const people = guests.map((p, k) => {
    const side = k === 0 ? -1 : 1;
    chair(t, side * 0.6, 0, side * -Math.PI / 2);
    if (!p) return null;
    const o = toyPerson({ ...p, seated: true });
    o.g.position.set(side * 0.62, 0, 0);
    o.g.rotation.y = side * -Math.PI / 2;
    o.armL.rotation.x = -0.9; o.armR.rotation.x = -0.9;
    t.add(o.g);
    return o;
  });
  scene.add(t);
  lamp(x, z, light);
  return { g: t, x, z, people };
}
const PASTEL = ['#e8a0b4', '#9db7e8', '#a8d8b9', '#f4c97a', '#c6a8e8', '#f2a37a'];
const HEADS = [SKIN.a, '#f6e2cf', SKIN.b, '#efe6dc'];
const OTHERS = [[-2.0, 2.3], [2.1, 2.0], [-3.3, 4.6], [0.3, 4.3], [3.3, 4.7], [-1.6, 6.4], [3.4, 6.9]];
const others = OTHERS.map(([x, z], i) => table(x, z, [
  { shirt: PASTEL[i % 6], skin: HEADS[i % 4], hair: i % 3 === 0 ? 'short' : null, hairColor: '#5a3a22' },
  i % 2 ? { shirt: PASTEL[(i + 3) % 6], skin: HEADS[(i + 1) % 4], hair: i % 4 === 1 ? 'bun' : null, hairColor: '#3d2a1e' } : null,
], i === 0 || i === 1 || i === 3));

// table 7: the customer's table (white cloth, red placemat, bread, water, the QR card)
const T7 = new THREE.Group();
scene.add(T7);
const cloth = toy('#f7f2e8', { roughness: 0.85 });
add(T7, rbox(0.95, 0.04, 0.95, 0.012), cloth, 0, 0.77, 0);
add(T7, new THREE.BoxGeometry(0.95, 0.22, 0.02), cloth, 0, 0.67, 0.47);
for (const s of [-1, 1]) add(T7, new THREE.BoxGeometry(0.02, 0.22, 0.95), cloth, s * 0.47, 0.67, 0);
add(T7, new THREE.CylinderGeometry(0.04, 0.04, 0.6, 10), toy('#2c1a0e'), 0, 0.3, 0);
add(T7, new THREE.BoxGeometry(0.42, 0.006, 0.3), toy('#b3261e', { roughness: 0.75 }), 0, 0.793, -0.2);
lamp(0, 0.1, true);
breadBasket(T7, -0.3, 0.12);
add(T7, new THREE.CylinderGeometry(0.04, 0.045, 0.24, 18), toy('#3b8fd6', { roughness: 0.25, transparent: true, opacity: 0.85 }), 0.33, 0.91, 0.18);
add(T7, new THREE.CylinderGeometry(0.02, 0.025, 0.04, 12), toy('#2b6aa8'), 0.33, 1.05, 0.18);
add(T7, new THREE.CylinderGeometry(0.022, 0.025, 0.07, 12), toy('#e9eef3', { roughness: 0.3 }), 0.22, 0.825, 0.25);
for (const s of [-1, 1]) add(T7, rbox(0.015, 0.004, 0.18, 0.002), toy('#c9ced8', { metalness: 0.7, roughness: 0.3 }), s * 0.24, 0.797, -0.2);
const plate = add(T7, new THREE.CylinderGeometry(0.14, 0.12, 0.02, 28), toy('#fbfbf8', { roughness: 0.25 }), 0, 0.805, -0.2);
const qrTex = canvasTex(320, 440, (g, w) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 440);
  g.fillStyle = '#0865fe'; g.fillRect(0, 0, w, 88);
  g.fillStyle = '#ffffff'; g.font = '900 40px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('MESA 7', w / 2, 60);
  const n = 21, s = 11, ox = (w - n * s) / 2, oy = 112;
  let sd = 7; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  g.fillStyle = '#111';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) && r() > 0.5) g.fillRect(ox + x * s, oy + y * s, s, s);
  const finder = (x, y) => { g.fillStyle = '#111'; g.fillRect(ox + x * s, oy + y * s, 7 * s, 7 * s); g.fillStyle = '#fff'; g.fillRect(ox + (x + 1) * s, oy + (y + 1) * s, 5 * s, 5 * s); g.fillStyle = '#111'; g.fillRect(ox + (x + 2) * s, oy + (y + 2) * s, 3 * s, 3 * s); };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  g.fillStyle = '#121826'; g.font = '800 26px Inter, sans-serif'; g.fillText('Escaneie e peça', w / 2, 400);
});
const pdfTex = canvasTex(320, 440, (g, w) => {
  g.fillStyle = '#f3ead9'; g.fillRect(0, 0, w, 440);
  g.fillStyle = '#6b5a45'; g.font = '800 38px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('CARDÁPIO', w / 2, 62);
  let sd = 3; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  g.fillStyle = '#7d6a52';
  for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) if (r() > 0.55) g.fillRect(70 + x * 12, 92 + y * 12, 12, 12);
  g.fillStyle = '#d93025'; g.beginPath(); g.roundRect(100, 302, 120, 56, 10); g.fill();
  g.fillStyle = '#ffffff'; g.font = '900 34px Inter, sans-serif'; g.fillText('PDF', w / 2, 342);
  g.fillStyle = '#8a7a66'; g.font = '600 22px Inter, sans-serif'; g.fillText('mesa 7', w / 2, 396);
});
function tableCard(tex) {
  const c = new THREE.Group();
  add(c, rbox(0.15, 0.03, 0.06, 0.008), woodDark, 0, 0.015, 0);
  add(c, new THREE.BoxGeometry(0.13, 0.18, 0.006), toy('#ffffff'), 0, 0.12, 0);
  add(c, new THREE.PlaneGeometry(0.124, 0.172), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), 0, 0.12, 0.004, false);
  return { c };
}
const qrCard = tableCard(qrTex);
qrCard.c.position.set(0.36, 0.79, 0.34);
qrCard.c.rotation.y = Math.PI + 0.35;
qrCard.c.scale.setScalar(0.85);
T7.add(qrCard.c);

// ---------------------------------------------------------------- staff and the customer (seen only from outside)
const waitress = toyPerson({ kind: 'waitress', shirt: '#5cc8a8', skin: SKIN.a, hair: 'bun', hairColor: '#d4582a', glasses: '#c8323c' });
scene.add(waitress.g);
const waiter = toyPerson({ kind: 'waiter', skin: SKIN.a, hair: 'bowl', hairColor: '#3a2416', pants: '#151515' });
scene.add(waiter.g);
const chef = toyPerson({ kind: 'chef', shirt: '#ffffff', skin: SKIN.b, hair: 'chef', pants: '#ffffff' });
chef.g.position.set(KX + 0.2, 0, ROOM.z1 - 0.3);
chef.g.rotation.y = Math.PI;
scene.add(chef.g);
const customer = toyPerson({ shirt: '#3fa66a', skin: '#ecc9a2', hair: 'short', hairColor: '#3a2416', seated: true });
customer.g.position.set(0, 0, -0.62);
customer.armL.rotation.x = -1.0; customer.armR.rotation.x = -1.0;
scene.add(customer.g);
const tray = new THREE.Group();
add(tray, new THREE.CylinderGeometry(0.17, 0.17, 0.015, 24), toy('#c9ced8', { metalness: 0.6, roughness: 0.3 }), 0, 0, 0);
add(tray, new THREE.CylinderGeometry(0.045, 0.04, 0.12, 12), toy('#e8a03c', { transparent: true, opacity: 0.9 }), 0.06, 0.065, 0.02);
add(tray, new THREE.CylinderGeometry(0.045, 0.04, 0.12, 12), toy('#7a2a12', { transparent: true, opacity: 0.9 }), -0.05, 0.065, -0.03);
const trayW = tray.clone(); waiter.armR.add(trayW); trayW.position.set(0.04, -0.37, 0.12);
const trayA = tray.clone(); trayA.scale.setScalar(0.72); waitress.armR.add(trayA); trayA.position.set(0.04, -0.37, 0.12);
const trayB = tray.clone(); trayB.scale.setScalar(0.72); waitress.armL.add(trayB); trayB.position.set(-0.04, -0.37, 0.12);
const servePlate = new THREE.Group();
add(servePlate, new THREE.CylinderGeometry(0.14, 0.12, 0.02, 28), toy('#fbfbf8', { roughness: 0.25 }), 0, 0, 0);
waiter.armR.add(servePlate); servePlate.position.set(0.03, -0.38, 0.16);

// ---------------------------------------------------------------- the burger (GLB of the demo menu)
let burgerProto = null;
const arBurger = new THREE.Group(), servedBurger = new THREE.Group(), heldBurger = new THREE.Group();
T7.add(arBurger); arBurger.position.set(0, 0.816, -0.2);
servePlate.add(servedBurger); servedBurger.position.set(0, 0.012, 0);
window.ready = new Promise((resolve) => {
  const b64 = window.BURGER_B64;
  if (!b64) return resolve();
  const bin = atob(b64), buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  new GLTFLoader().parse(buf.buffer, '', (gltf) => {
    burgerProto = gltf.scene;
    burgerProto.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const box = new THREE.Box3().setFromObject(burgerProto);
    burgerProto.position.y -= box.min.y;
    const a = burgerProto.clone(true);
    a.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; } });
    arBurger.add(a);
    servedBurger.add(burgerProto.clone(true));
    heldBurger.add(burgerProto.clone(true));
    resolve();
  }, () => resolve());
});
const ringMat = new THREE.MeshBasicMaterial({ color: '#4d8dff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
const arRing = add(T7, new THREE.RingGeometry(0.085, 0.1, 64), ringMat, 0, 0.818, -0.2, false);
arRing.rotation.x = -Math.PI / 2;
const discMat = new THREE.MeshBasicMaterial({ color: '#4d8dff', transparent: true, opacity: 0, depthWrite: false });
const arDisc = add(T7, new THREE.CircleGeometry(0.085, 48), discMat, 0, 0.817, -0.2, false);
arDisc.rotation.x = -Math.PI / 2;

// ---------------------------------------------------------------- the customer's arm and hand (first person)
const POVSKIN = toy('#ecc9a2', { roughness: 0.55 });
const pov = new THREE.Group();
camera.add(pov);
const sleeve = add(pov, new THREE.CapsuleGeometry(0.075, 0.5, 8, 16), toy('#3fa66a', { roughness: 0.75 }), 0, 0, 0, false);
const cuff = add(pov, new THREE.CylinderGeometry(0.068, 0.07, 0.05, 20), toy('#2f8a55'), 0, 0, 0, false);
const hand = new THREE.Group();
pov.add(hand);
add(hand, rbox(0.1, 0.11, 0.038, 0.018), POVSKIN, 0, 0, 0, false);
const fingers = [];
for (let i = 0; i < 4; i++) {
  const f = new THREE.Group();
  f.position.set(-0.036 + i * 0.024, 0.055, 0);
  add(f, new THREE.CapsuleGeometry(0.0115, 0.035, 4, 10), POVSKIN, 0, 0.025, 0, false);
  const j = new THREE.Group(); j.position.set(0, 0.05, 0); f.add(j);
  add(j, new THREE.CapsuleGeometry(0.011, 0.028, 4, 10), POVSKIN, 0, 0.02, 0, false);
  hand.add(f);
  fingers.push({ f, j });
}
const thumb = new THREE.Group();
thumb.position.set(-0.055, -0.01, 0.01);
add(thumb, new THREE.CapsuleGeometry(0.013, 0.04, 4, 10), POVSKIN, 0, 0.03, 0, false);
thumb.rotation.z = 0.7;
hand.add(thumb);
const heldCard = new THREE.Group();
const heldPdf = tableCard(pdfTex), heldQr = tableCard(qrTex);
heldCard.add(heldPdf.c, heldQr.c);
heldCard.scale.setScalar(1.15);
pov.add(heldCard);
pov.add(heldBurger);
const wristV = new THREE.Vector3(), elbowV = new THREE.Vector3();
/** Places the hand (camera space) and stretches the sleeve from below the frame to the wrist. */
function arm(hx, hy, hz, rx, ry, rz, curl, from) {
  pov.visible = true;
  hand.position.set(hx, hy, hz);
  hand.rotation.set(rx, ry, rz);
  fingers.forEach((o, i) => { o.f.rotation.x = curl; o.j.rotation.x = curl * 1.2; o.f.rotation.z = (i - 1.5) * 0.06 * (1 - curl); });
  thumb.rotation.x = curl * 0.6;
  wristV.set(0, -0.07, 0).applyEuler(hand.rotation).add(hand.position);
  elbowV.set(...from);
  limb(sleeve, elbowV, wristV, 0.65);
  cuff.position.copy(wristV);
  cuff.quaternion.copy(sleeve.quaternion);
}

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight('#fff1dc', '#3a2414', 0.9));
const key = new THREE.DirectionalLight('#ffe6c2', 1.3);
key.position.set(3, 6, -2);
key.target.position.set(0, 0, 3);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 7, bottom: -4, near: 1, far: 20 });
key.shadow.bias = -0.0005;
scene.add(key, key.target);

// ---------------------------------------------------------------- shots
// [start, pos, look, fov]; two keys at almost the same time = a cut. The customer's eye: EYE.
const S = (t, p, q, f) => ({ t, p, q, f });
const EYE = [0, 1.16, -0.52];
const PHONE = (t) => S(t, EYE, [0.05, 0.98, 2.2], 52);
const SHOTS = [
  S(0, EYE, [0.25, 1.1, 2.5], 54), S(2.14, EYE, [0.35, 1.1, 2.5], 54),
  PHONE(2.15), PHONE(3.74),
  S(3.75, EYE, [0.1, 1.05, 2.3], 50), S(6.09, EYE, [0.05, 1.05, 2.3], 48),
  S(6.1, EYE, [0.2, 1.05, 2.4], 50), S(10.39, EYE, [0.12, 1.05, 2.4], 47),
  S(10.4, EYE, [0.05, 1.0, 2.3], 50), S(14.49, EYE, [0.05, 1.0, 2.3], 48),
  S(14.5, EYE, [0.12, 0.8, 0.35], 52), S(18.39, EYE, [0.12, 0.8, 0.35], 52),
  S(18.4, [0, 1.12, -0.6], [0, 0.82, -0.12], 44), S(23.59, [0, 1.07, -0.58], [0, 0.83, -0.14], 40),
  PHONE(23.6), PHONE(25.09),
  S(25.1, [KX - 0.15, 1.7, ROOM.z1 - 3.7], [KX, 1.88, ROOM.z1], 46), S(26.89, [KX - 0.1, 1.7, ROOM.z1 - 3.3], [KX, 1.9, ROOM.z1], 44),
  S(26.9, EYE, [0.15, 1.1, 2.2], 52), S(28.39, EYE, [0.1, 1.05, 2.0], 50),
  S(28.4, EYE, [0, 0.78, 0.1], 50), S(30.19, EYE, [0, 0.8, 0.1], 48),
  PHONE(30.2), PHONE(41.29),
  S(41.3, [-2.1, 1.28, -0.1], [0.3, 0.98, -0.1], 54), S(45.59, [-2.6, 1.45, -0.05], [0.3, 0.98, -0.1], 54),
  PHONE(45.6), PHONE(47.99),
  S(48.0, [-2.6, 1.45, -0.05], [0.3, 0.98, -0.1], 54), S(60, [-2.8, 1.5, 0], [0.3, 0.98, -0.1], 54),
];
function cameraAt(t) {
  let i = 0;
  while (i < SHOTS.length - 1 && SHOTS[i + 1].t <= t) i++;
  const A = SHOTS[i], B = SHOTS[Math.min(i + 1, SHOTS.length - 1)];
  const k = B.t - A.t < 0.05 ? 1 : eio((t - A.t) / (B.t - A.t));
  return { p: A.p.map((v, j) => lerp(v, B.p[j], k)), q: A.q.map((v, j) => lerp(v, B.q[j], k)), f: lerp(A.f, B.f, k) };
}
const polyAt = (pts, k) => {
  const seg = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(d); total += d; }
  let s = clamp(k) * total;
  for (let i = 0; i < seg.length; i++) {
    if (s <= seg[i] || i === seg.length - 1) { const f = Math.min(1, s / seg[i]); const a = pts[i], b = pts[i + 1]; return { p: [lerp(a[0], b[0], f), lerp(a[1], b[1], f)], dir: [b[0] - a[0], b[1] - a[1]] }; }
    s -= seg[i];
  }
};
function walk(p, pts, k, t, speed = 12) {
  const { p: xy, dir } = polyAt(pts, clamp(k));
  p.g.visible = true;
  const moving = k < 1;
  p.g.position.set(xy[0], moving ? Math.abs(Math.sin(t * speed)) * 0.025 : 0, xy[1]);
  p.g.rotation.y = Math.atan2(dir[0], dir[1]);
  p.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(t * speed + i * Math.PI) * 0.45 : 0; });
}
const faceCam = (p) => { p.g.rotation.y = Math.atan2(camera.position.x - p.g.position.x, camera.position.z - p.g.position.z); };

function update(t) {
  const c = cameraAt(t);
  camera.position.set(...c.p);
  camera.fov = c.f;
  camera.updateProjectionMatrix();
  camera.lookAt(...c.q);

  // defaults
  pov.visible = false; heldCard.visible = false; heldBurger.visible = false;
  waitress.g.visible = false; waiter.g.visible = false;
  customer.g.visible = t >= 41.3;
  trayW.visible = true; servePlate.visible = false; trayA.visible = false; trayB.visible = false;
  for (const p of [waitress, waiter]) { p.armL.rotation.set(0, 0, 0); p.armR.rotation.set(0, 0, 0); p.head.rotation.set(0, 0, 0); p.legs.forEach((l) => l.rotation.set(0, 0, 0)); face(p, 'smile'); }

  if (t < 2.15) {
    // half an hour with the hand up; the waiter rushes past ("já vou!")
    arm(0.15, 0.1 + Math.sin(t * 6) * 0.01, -0.6, -0.15, -0.25, 0.12, 0.05, [0.42, -0.72, -0.3]);
    walk(waiter, [[-1.6, 2.6], [-0.3, 1.5], [1.4, 1.0], [2.6, 0.9]], t / 2.15, t);
    waiter.armR.rotation.set(-1.5, 0, 0); waiter.armL.rotation.set(Math.sin(t * 12) * 0.4, 0, 0);
    waiter.head.rotation.y = -0.8;
    waitress.g.visible = true; waitress.g.position.set(1.0, 0, 6.6); waitress.g.rotation.y = Math.PI * 0.85;
    waitress.armR.rotation.set(-1.4, 0, 0); trayA.visible = true;
  } else if (t >= 3.75 && t < 6.1) {
    // "pera, pera!": the waitress in front, both arms up, flustered; the hand waves at her
    const w = Math.sin(t * 10);
    arm(0.17 + w * 0.025, 0.0, -0.6, -0.1, -0.25, 0.15 + w * 0.25, 0.05, [0.45, -0.74, -0.3]);
    waitress.g.visible = true; waitress.g.position.set(0.12, 0, 1.55); faceCam(waitress);
    const up = eo((t - 3.9) / 0.35);
    waitress.armR.rotation.set(0, 0, lerp(0, 2.75, up) + Math.sin(t * 7) * 0.08);
    waitress.armL.rotation.set(0, 0, -lerp(0, 2.75, up) - Math.sin(t * 7 + 1) * 0.08);
    face(waitress, 'o');
    waitress.head.rotation.z = Math.sin(t * 3) * 0.06;
    walk(waiter, [[2.6, 3.4], [-2.4, 3.2]], (t - 3.75) / 2.35, t); waiter.armR.rotation.set(-1.5, 0, 0);
  } else if (t >= 6.1 && t < 10.4) {
    // "não é culpa da garçonete: são dez mesas e duas mãos"
    waitress.g.visible = true;
    const moving = t < 7.7;
    waitress.g.position.set(moving ? lerp(0.95, -0.12, eio((t - 6.1) / 1.6)) : -0.12, 0, 1.7);
    if (moving) { waitress.g.rotation.y = -Math.PI / 2; waitress.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 12 + i * Math.PI) * 0.45; }); }
    else faceCam(waitress);
    trayA.visible = t < 9.25; trayB.visible = t < 9.25;
    waitress.armR.rotation.set(-1.5, 0, 0); waitress.armL.rotation.set(-1.5, 0, 0);
    if (t >= 9.25) { const s = eo((t - 9.25) / 0.3); waitress.armR.rotation.set(-1.25 * s, 0, 0.55 * s); waitress.armL.rotation.set(-1.25 * s, 0, -0.55 * s); }
    face(waitress, t < 9.25 ? 'worried' : 'o');
    walk(waiter, [[2.4, 4.2], [-0.6, 3.0], [-2.6, 3.4]], (t - 6.1) / 4.3, t); waiter.armR.rotation.set(-1.5, 0, 0);
  } else if (t >= 10.4 && t < 14.5) {
    // the hand shows the PDF menu card, then flips it for our QR card
    heldCard.visible = true;
    arm(0.06, -0.25, -0.58, -0.25, 0.1, 0.05, 0.85, [0.45, -0.78, -0.25]);
    heldCard.position.set(0.05, -0.22, -0.6);
    heldCard.rotation.set(0.05, 0.15, 0);
    const flip = t < 12.75 ? 1 : t < 13.05 ? Math.abs(Math.cos(((t - 12.75) / 0.3) * Math.PI)) : 1;
    heldCard.scale.set(1.15 * Math.max(0.02, flip), 1.15, 1.15);
    heldPdf.c.visible = t < 12.9; heldQr.c.visible = t >= 12.9;
    waitress.g.visible = true; waitress.g.position.set(-0.45, 0, 2.6); faceCam(waitress); face(waitress, 'worried');
    waitress.armR.rotation.set(-1.4, 0, 0); trayA.visible = true;
  } else if (t >= 26.9 && t < 28.4) {
    // the waiter brings the plate towards the camera ("com licença!") and puts it down
    const k = (t - 26.9) / 1.15;
    walk(waiter, [[0.6, 3.6], [0.35, 1.7], [0.3, 1.02]], eo(k), t);
    if (k >= 1) faceCam(waiter);
    trayW.visible = false;
    servePlate.visible = t < 28.1;
    waiter.armR.rotation.set(t < 27.75 ? -1.45 : lerp(-1.45, -0.95, clamp((t - 27.75) / 0.3)), 0, 0);
  } else if (t >= 28.4 && t < 30.2) {
    // "hmm, que delícia": the hand lifts the burger a little towards the camera
    const k = eo((t - 28.45) / 0.8);
    heldBurger.visible = !!burgerProto;
    heldBurger.position.set(0.0, lerp(-0.3, -0.13, k), lerp(-0.6, -0.48, k));
    heldBurger.rotation.set(0.5, 0.4, 0);
    arm(0.03, lerp(-0.35, -0.18, k), lerp(-0.58, -0.46, k), -1.2, 0, 0, 0.7, [0.4, -0.8, -0.2]);
  } else if (t >= 39.1 && t < 41.3) {
    // phone up, the waitress smiling behind it
    waitress.g.visible = true; waitress.g.position.set(0.35, 0, 1.45); faceCam(waitress); face(waitress, 'big');
    waitress.armL.rotation.set(-0.5, 0, -0.2);
  } else if (t >= 41.3) {
    // the same table from the side: the customer eating, the waitress beside it smiling
    waitress.g.visible = true; waitress.g.position.set(0.78, 0, 0.42); waitress.g.rotation.y = -Math.PI / 2 - 0.9; face(waitress, 'big');
    waitress.armR.rotation.set(-0.3, 0, 0.1);
  }

  // the table's plate: empty while waiting, with the 3D burger preview, then the real one served
  plate.visible = t < 26.9 || t >= 28.1;
  const ar = t >= 18.8 && t < 23.6;
  const served = t >= 28.1;
  arBurger.visible = !!burgerProto && (ar || (served && !(t >= 28.4 && t < 30.2)));
  const kAr = served ? 1 : eo((t - 19.0) / 1.3);
  arBurger.scale.setScalar(served ? 1 : 0.7 + 0.3 * back((t - 19.0) / 1.0));
  arBurger.rotation.y = served ? 0.5 : (t - 19) * 0.5;
  arBurger.position.y = 0.816 + (served ? 0 : (1 - kAr) * 0.05);
  arBurger.traverse((o) => { if (o.isMesh && o.material.transparent) o.material.opacity = served ? 1 : kAr; });
  const rk = ((t - 19.0) % 1.4) / 1.4;
  ringMat.opacity = ar ? (1 - rk) * 0.9 : 0;
  arRing.scale.setScalar(1 + rk * 1.4);
  discMat.opacity = ar ? 0.22 * clamp((t - 18.9) / 0.5) * (t > 23.0 ? clamp((23.6 - t) / 0.6) : 1) : 0;

  // diners: some keep a hand up while the customer waits
  others.forEach((tb, i) => tb.people.forEach((p, k) => {
    if (!p) return;
    const up = t < 10.4 && (i + k) % 2 === 0;
    p.armR.rotation.set(up ? 0 : -0.9, 0, up ? 2.6 + Math.sin(t * 5 + i) * 0.12 : 0);
    p.head.rotation.y = Math.sin(t * 0.7 + i * 2) * 0.2;
  }));

  // kitchen
  const stage = t >= 25.6 ? 1 : 0;
  const keyS = stage * 100 + (stage ? Math.floor((t - 25.6) * 2) : 0);
  if (keyS !== tvState) { tvState = keyS; drawK(stage, Math.max(0, t - 25.6)); }
  const cheer = t >= 25.75 && t < 26.9;
  chef.armR.rotation.set(cheer ? 0 : -1.0 + Math.sin(t * 3) * 0.2, 0, cheer ? 2.6 : 0);
  chef.armL.rotation.set(cheer ? 0 : -1.0 - Math.sin(t * 3) * 0.2, 0, cheer ? -2.6 : 0);
  face(chef, cheer ? 'big' : 'smile');
  lampLights.forEach((L, i) => { L.intensity = 5 + Math.sin(t * 2 + i) * 0.15; });
}

const v3 = new THREE.Vector3();
window.dio = {
  draw(t) { update(t); renderer.render(scene, camera); },
  project(x, y, z, local) {
    v3.set(x, y, z);
    if (local) T7.localToWorld(v3);
    v3.project(camera);
    return { x: (v3.x * 0.5 + 0.5) * W, y: (-v3.y * 0.5 + 0.5) * H };
  },
  waiterHead() { const p = new THREE.Vector3(); waiter.head.getWorldPosition(p); return this.project(p.x, p.y, p.z); },
};
