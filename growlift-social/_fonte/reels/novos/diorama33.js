// Reel 33 · "Quatro estrelas de diferença", version 3 (23/11): one continuous first-person shot, like the reference
// Antônio sent. The camera is the customer's eyes at table 7: his hand goes up, the waiter rushes past, the phone
// comes up in his hand (a 3D phone whose screens are drawn on a canvas, and whose camera shows the real table for the
// QR scan and the dish in 3D), the waitress panics, the menu card is picked up and swapped for the QR card, the order
// flies to the kitchen screen, the waiter brings the burger, he takes a bite, pays and reviews; then the camera leaves
// his eyes for the side view. Toy-like characters; warm diner with checkered floor. window.dio.draw(t) draws time t
// (pure function of t); window.ready resolves once the burger and the menu photos are loaded.
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
renderer.localClippingEnabled = true;

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
const OTHERS = [[-2.0, 2.3], [2.1, 2.0], [-3.3, 4.6], [-0.7, 4.4], [3.3, 4.7], [-1.6, 6.4], [3.4, 6.9]];
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
add(T7, new THREE.BoxGeometry(0.42, 0.006, 0.3), toy('#b3261e', { roughness: 0.75 }), 0, 0.793, -0.04);
lamp(0, 0.1, true);
breadBasket(T7, -0.3, 0.12);
add(T7, new THREE.CylinderGeometry(0.04, 0.045, 0.24, 18), toy('#3b8fd6', { roughness: 0.25, transparent: true, opacity: 0.85 }), 0.33, 0.91, 0.18);
add(T7, new THREE.CylinderGeometry(0.02, 0.025, 0.04, 12), toy('#2b6aa8'), 0.33, 1.05, 0.18);
add(T7, new THREE.CylinderGeometry(0.022, 0.025, 0.07, 12), toy('#e9eef3', { roughness: 0.3 }), 0.22, 0.825, 0.25);
for (const s of [-1, 1]) add(T7, rbox(0.015, 0.004, 0.18, 0.002), toy('#c9ced8', { metalness: 0.7, roughness: 0.3 }), s * 0.24, 0.797, -0.04);
const plate = add(T7, new THREE.CylinderGeometry(0.14, 0.12, 0.02, 28), toy('#fbfbf8', { roughness: 0.25 }), 0, 0.805, -0.04);
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
// the card on the table: the PDF menu card at first; the hand swaps it for our QR card
const cardMat = new THREE.MeshStandardMaterial({ map: pdfTex, roughness: 0.6 });
function tableCard2(m) {
  const c = new THREE.Group();
  add(c, rbox(0.15, 0.03, 0.06, 0.008), woodDark, 0, 0.015, 0);
  add(c, new THREE.BoxGeometry(0.13, 0.18, 0.006), toy('#ffffff'), 0, 0.12, 0);
  add(c, new THREE.PlaneGeometry(0.124, 0.172), m, 0, 0.12, 0.004, false);
  return c;
}
const TCARD = new THREE.Vector3(0.14, 0.79, 0.3);
const tcard = tableCard2(cardMat);
tcard.position.copy(TCARD);
tcard.rotation.y = Math.PI;
tcard.scale.setScalar(0.85);
T7.add(tcard);

// ---------------------------------------------------------------- staff and the customer (seen only from outside)
const waitress = toyPerson({ kind: 'waitress', shirt: '#5cc8a8', skin: SKIN.a, hair: 'bun', hairColor: '#d4582a', glasses: '#c8323c' });
scene.add(waitress.g);
const waiter = toyPerson({ kind: 'waiter', skin: SKIN.a, hair: 'bowl', hairColor: '#3a2416', pants: '#151515' });
scene.add(waiter.g);
const chef = toyPerson({ kind: 'chef', shirt: '#ffffff', skin: SKIN.b, hair: 'chef', pants: '#ffffff' });
chef.g.position.set(KX + 0.2, 0.12, ROOM.z1 - 0.3);
chef.g.rotation.y = Math.atan2(-(KX + 0.2), -(ROOM.z1 - 0.3 + 0.52));
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
const arBurger = new THREE.Group(), tableBurger = new THREE.Group(), servedBurger = new THREE.Group(), heldBurger = new THREE.Group();
T7.add(arBurger); arBurger.position.set(0, 0.816, -0.04);
T7.add(tableBurger); tableBurger.position.set(0, 0.816, -0.04); tableBurger.rotation.y = 0.6;
servePlate.add(servedBurger); servedBurger.position.set(0, 0.012, 0);
// the bite: two clipping planes (in the burger's own space) that remove a notch on its +x side
const BITE = [new THREE.Plane(new THREE.Vector3(-1, 0, 1).normalize(), 0.026 / Math.SQRT2 * 1.4), new THREE.Plane(new THREE.Vector3(-1, 0, -1).normalize(), 0.026 / Math.SQRT2 * 1.4)];
const biteWorld = [new THREE.Plane(), new THREE.Plane()];
const heldMats = [];
const FOTOS = {};
window.ready = (async () => {
  await Promise.all(Object.entries(window.FOTOS || {}).map(([k, src]) => new Promise((res) => { const im = new Image(); im.onload = () => { FOTOS[k] = im; res(); }; im.onerror = res; im.src = src; })));
  const b64 = window.BURGER_B64;
  if (!b64) return;
  const bin = atob(b64), buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  await new Promise((resolve) => new GLTFLoader().parse(buf.buffer, '', (gltf) => {
    burgerProto = gltf.scene;
    burgerProto.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const box = new THREE.Box3().setFromObject(burgerProto);
    burgerProto.position.y -= box.min.y;
    const a = burgerProto.clone(true);
    a.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; } });
    arBurger.add(a);
    tableBurger.add(burgerProto.clone(true));
    servedBurger.add(burgerProto.clone(true));
    const h = burgerProto.clone(true);
    h.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.side = THREE.DoubleSide; heldMats.push(o.material); } });
    heldBurger.add(h);
    resolve();
  }, () => resolve()));
})();
const ringMat = new THREE.MeshBasicMaterial({ color: '#4d8dff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
const arRing = add(T7, new THREE.RingGeometry(0.085, 0.1, 64), ringMat, 0, 0.818, -0.04, false);
arRing.rotation.x = -Math.PI / 2;

// ---------------------------------------------------------------- first person: hands, sleeves, phone
const POVSKIN = toy('#ecc9a2', { roughness: 0.55 });
const SLEEVE = toy('#3fa66a', { roughness: 0.75 });
const CUFF = toy('#2f8a55');
const pov = new THREE.Group();
camera.add(pov);
function makeHand(side) {
  const h = new THREE.Group();
  add(h, rbox(0.1, 0.11, 0.038, 0.018), POVSKIN, 0, 0, 0, false);
  const fingers = [];
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Group();
    f.position.set(side * (-0.036 + i * 0.024), 0.055, 0);
    add(f, new THREE.CapsuleGeometry(0.0115, 0.035, 4, 10), POVSKIN, 0, 0.025, 0, false);
    const j = new THREE.Group(); j.position.set(0, 0.05, 0); f.add(j);
    add(j, new THREE.CapsuleGeometry(0.011, 0.028, 4, 10), POVSKIN, 0, 0.02, 0, false);
    h.add(f);
    fingers.push({ f, j });
  }
  const thumb = new THREE.Group();
  thumb.position.set(side * -0.055, -0.01, 0.01);
  add(thumb, new THREE.CapsuleGeometry(0.013, 0.04, 4, 10), POVSKIN, 0, 0.03, 0, false);
  thumb.rotation.z = side * 0.7;
  h.add(thumb);
  const sleeve = add(new THREE.Group(), new THREE.CapsuleGeometry(0.075, 0.5, 8, 16), SLEEVE, 0, 0, 0, false);
  const cuff = add(new THREE.Group(), new THREE.CylinderGeometry(0.068, 0.07, 0.05, 20), CUFF, 0, 0, 0, false);
  return { h, fingers, thumb, sleeve, cuff };
}
const R = makeHand(1), L = makeHand(-1);
for (const k of [R, L]) pov.add(k.h, k.sleeve, k.cuff);
const wristV = new THREE.Vector3(), elbowV = new THREE.Vector3();
/** Hand k at (camera space) position/rotation, finger curl per finger, sleeve from `from` (below the frame). */
function pose(k, pos, rot, curls, from, thumbCurl = 0) {
  k.h.visible = k.sleeve.visible = k.cuff.visible = true;
  k.h.position.set(...pos);
  k.h.rotation.set(...rot);
  k.fingers.forEach((o, i) => { const c = Array.isArray(curls) ? curls[i] : curls; o.f.rotation.x = c; o.j.rotation.x = c * 1.2; });
  k.thumb.rotation.x = thumbCurl;
  wristV.set(0, -0.07, 0).applyEuler(k.h.rotation).add(k.h.position);
  elbowV.set(...from);
  limb(k.sleeve, elbowV, wristV, 0.65);
  k.cuff.position.copy(wristV);
  k.cuff.quaternion.copy(k.sleeve.quaternion);
}
const hide = (k) => { k.h.visible = k.sleeve.visible = k.cuff.visible = false; };

// the phone: body, the camera feed (render target) and the drawn screen on top, held in a gripping right hand
const PW = 0.066, PH = 0.143, SW = 540, SH = 1170;
const phone = new THREE.Group();
pov.add(phone);
add(phone, rbox(PW + 0.007, PH + 0.009, 0.009, 0.008), toy('#0d0f14', { roughness: 0.3, metalness: 0.3 }), 0, 0, 0, false);
const rt = new THREE.WebGLRenderTarget(SW / 2, SH / 2, { samples: 2 });
rt.texture.colorSpace = THREE.SRGBColorSpace;
const feed = add(phone, new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: rt.texture, toneMapped: false }), 0, 0, 0.0048, false);
const uiCanvas = document.createElement('canvas'); uiCanvas.width = SW; uiCanvas.height = SH;
const ui = uiCanvas.getContext('2d');
const uiTex = new THREE.CanvasTexture(uiCanvas); uiTex.colorSpace = THREE.SRGBColorSpace; uiTex.anisotropy = 8;
add(phone, new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: uiTex, transparent: true, toneMapped: false }), 0, 0, 0.005, false);
// gripping hand (part of the phone): palm behind, fingers around the right edge, thumb on the left edge
const grip = new THREE.Group();
phone.add(grip);
add(grip, rbox(0.085, 0.1, 0.03, 0.016), POVSKIN, 0.005, -0.055, -0.022, false);
for (let i = 0; i < 4; i++) {
  const f = add(grip, new THREE.CapsuleGeometry(0.0115, 0.03, 4, 10), POVSKIN, PW / 2 + 0.006, -0.065 + i * 0.024, -0.004, false);
  f.rotation.z = Math.PI / 2 + 0.25;
}
const gthumb = add(grip, new THREE.CapsuleGeometry(0.0125, 0.04, 4, 10), POVSKIN, -PW / 2 - 0.004, -0.045, 0.004, false);
gthumb.rotation.z = -0.35;
const gsleeve = add(phone, new THREE.CapsuleGeometry(0.075, 0.5, 8, 16), SLEEVE, 0, 0, 0, false);
const gcuff = add(phone, new THREE.CylinderGeometry(0.068, 0.07, 0.05, 20), CUFF, 0, 0, 0, false);
limb(gsleeve, new THREE.Vector3(0.1, -0.5, -0.12), new THREE.Vector3(0.012, -0.11, -0.03), 0.65);
gcuff.position.set(0.012, -0.11, -0.03); gcuff.quaternion.copy(gsleeve.quaternion);
const phoneCam = new THREE.PerspectiveCamera(62, SW / SH, 0.02, 40);
scene.add(phoneCam);
const screenPoint = (px, py) => new THREE.Vector3((px / SW - 0.5) * PW, (0.5 - py / SH) * PH, 0.012);

// the card the hand picks up, and the order that flies to the kitchen
const heldCard = tableCard2(cardMat);
heldCard.scale.setScalar(1.1);
pov.add(heldCard);
pov.add(heldBurger);
const orderTex = canvasTex(400, 220, (g) => {
  g.fillStyle = '#0d2a1c'; g.beginPath(); g.roundRect(6, 6, 388, 208, 26); g.fill();
  g.strokeStyle = '#34d27b'; g.lineWidth = 8; g.stroke();
  g.fillStyle = '#ffffff'; g.font = '900 64px Inter, sans-serif'; g.fillText('Mesa 7', 34, 92);
  g.fillStyle = '#bfe9d1'; g.font = '700 40px Inter, sans-serif'; g.fillText('1× Clássico', 34, 160);
});
const order = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.11), new THREE.MeshBasicMaterial({ map: orderTex, transparent: true, toneMapped: false, depthTest: false }));
order.renderOrder = 20;
scene.add(order);
const glowTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(120,200,255,1)'); gr.addColorStop(1, 'rgba(120,200,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const glows = Array.from({ length: 10 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthTest: false, blending: THREE.AdditiveBlending })); s.renderOrder = 19; scene.add(s); return s; });

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

// ---------------------------------------------------------------- the phone screens (drawn on a canvas)
const rr = (x, y, w, h, r, fill) => { ui.beginPath(); ui.roundRect(x, y, w, h, r); ui.fillStyle = fill; ui.fill(); };
const txt = (s, x, y, size, color, weight = 700, align = 'left') => { ui.font = `${weight} ${size}px Inter, sans-serif`; ui.fillStyle = color; ui.textAlign = align; ui.textBaseline = 'alphabetic'; ui.fillText(s, x, y); };
function wrap(s, x, y, w, size, color, lh, weight = 500) {
  ui.font = `${weight} ${size}px Inter, sans-serif`; ui.fillStyle = color; ui.textAlign = 'left';
  let line = '', yy = y;
  for (const word of s.split(' ')) { const tst = line ? line + ' ' + word : word; if (ui.measureText(tst).width > w && line) { ui.fillText(line, x, yy); line = word; yy += lh; } else line = tst; }
  if (line) ui.fillText(line, x, yy);
}
const star = (cx, cy, r, on, color = '#fbbc04') => {
  ui.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r * 0.45 : r; ui.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
  ui.closePath();
  if (on) { ui.fillStyle = color; ui.fill(); } else { ui.strokeStyle = '#9aa0a6'; ui.lineWidth = 3; ui.stroke(); }
};
const statusBar = (dark, hora) => { txt(hora, 40, 46, 22, dark ? '#fff' : '#111', 700); rr(SW / 2 - 70, 18, 140, 38, 19, '#000'); txt('●●● ', SW - 40, 46, 16, dark ? '#fff' : '#111', 700, 'right'); };
const cover = (img, x, y, w, h, r) => {
  if (!img) { rr(x, y, w, h, r, '#3a2414'); return; }
  ui.save(); ui.beginPath(); ui.roundRect(x, y, w, h, r); ui.clip();
  const s = Math.max(w / img.width, h / img.height); ui.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
  ui.restore();
};
const GOLD = '#f2b632', DARK = '#120c08', CARD = '#211610';
function scrReview(t, five) {
  ui.fillStyle = '#ffffff'; ui.fillRect(0, 0, SW, SH);
  statusBar(false, five ? '23:59' : '23:12');
  txt('←', 36, 120, 34, '#3c4043', 700); txt('Sua avaliação', 90, 120, 30, '#202124', 800);
  rr(36, 160, SW - 72, 110, 22, '#f1f3f4');
  cover(FOTOS.duplo, 54, 178, 74, 74, 16);
  txt('Brasa Burger', 148, 210, 28, '#202124', 800); txt('Hamburgueria · Avaliação no Google', 148, 246, 18, '#5f6368', 600);
  txt('Sua nota', 40, 330, 22, '#5f6368', 700);
  const n = five ? [43.12, 43.32, 43.52, 43.72, 43.92].filter((x) => t >= x).length : t >= 4.25 ? 1 : 0;
  for (let i = 0; i < 5; i++) star(84 + i * 92, 400, 36, i < n);
  rr(36, 470, SW - 72, 250, 20, '#ffffff'); ui.strokeStyle = '#dadce0'; ui.lineWidth = 3; ui.beginPath(); ui.roundRect(36, 470, SW - 72, 250, 20); ui.stroke();
  const msg = five ? 'O lanche, nota 10. E não esperei ninguém.' : 'Meia hora esperando. Ninguém me atendeu.';
  const k = clamp(five ? (t - 44.0) / 0.9 : (t - 4.5) / 1.1);
  wrap(msg.slice(0, Math.floor(k * msg.length)) + (k < 1 && Math.floor(t * 3) % 2 ? '|' : ''), 60, 520, SW - 120, 28, '#202124', 38, 600);
  const pub = five && t >= 45.15;
  rr(36, 760, SW - 72, 84, 42, pub ? '#1e8e3e' : '#1a73e8');
  txt(pub ? 'Publicada ✓' : 'Publicar', SW / 2, 815, 30, '#ffffff', 800, 'center');
  txt(pub ? 'Visível no Google Maps' : 'Sua avaliação é pública', SW / 2, 890, 20, '#80868b', 600, 'center');
}
function scrScan(t) {
  ui.clearRect(0, 0, SW, SH);
  ui.fillStyle = 'rgba(0,0,0,.35)'; ui.fillRect(0, 0, SW, 130); ui.fillRect(0, SH - 210, SW, 210);
  statusBar(true, '23:15');
  txt('Aponte para o QR da mesa', SW / 2, 110, 24, '#ffffff', 700, 'center');
  ui.strokeStyle = '#ffffff'; ui.lineWidth = 9; ui.lineCap = 'round';
  const x0 = 110, y0 = 360, w = 320, h = 320, c = 64;
  for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x0 + w, y0, -1, 1], [x0, y0 + h, 1, -1], [x0 + w, y0 + h, -1, -1]]) { ui.beginPath(); ui.moveTo(x + dx * c, y); ui.lineTo(x, y); ui.lineTo(x, y + dy * c); ui.stroke(); }
  const ly = y0 + 20 + ((t * 1.4) % 1) * (h - 40);
  ui.fillStyle = 'rgba(106,164,255,.9)'; ui.fillRect(x0 + 16, ly, w - 32, 5);
  if (t >= 17.25) { const k = eo((t - 17.25) / 0.25); rr(SW / 2 - 190, SH - 170 + (1 - k) * 30, 380, 84, 42, '#ffffff'); txt('Mesa 7 · Abrir cardápio', SW / 2, SH - 116 + (1 - k) * 30, 26, '#0865fe', 800, 'center'); }
}
const MENU = [
  ['duplo', 'Brasa Duplo', 'Dois blends de 160 g, cheddar, bacon e pão brioche.', 'R$ 39,90', false],
  ['classico', 'Clássico', 'Blend de 160 g, queijo, alface, tomate e molho da casa.', 'R$ 34,90', true],
  ['fritas', 'Fritas da casa', 'Batata rústica com páprica e maionese verde.', 'R$ 16,90', false],
  ['refri', 'Refrigerante lata', '350 ml, bem gelado.', 'R$ 7,00', false],
  ['sobremesa', 'Petit gâteau', 'Com sorvete de creme.', 'R$ 22,90', false],
];
function scrMenu(t) {
  ui.fillStyle = DARK; ui.fillRect(0, 0, SW, SH);
  const scroll = eio((t - 18.5) / 1.0) * 120;
  ui.save(); ui.translate(0, -scroll);
  cover(FOTOS.duplo, 0, 0, SW, 300, 0);
  const gr = ui.createLinearGradient(0, 120, 0, 300); gr.addColorStop(0, 'rgba(18,12,8,0)'); gr.addColorStop(1, DARK); ui.fillStyle = gr; ui.fillRect(0, 120, SW, 182);
  txt('BRASA', 36, 250, 50, GOLD, 900); txt('BURGER', 196, 250, 50, '#ffffff', 900);
  txt('Mesa 7 · peça e pague pelo celular', 36, 286, 20, '#cbb9a6', 600);
  ['Burgers', 'Porções', 'Bebidas', 'Sobremesas'].forEach((c, i) => { const x = 36 + [0, 128, 246, 360][i]; rr(x, 316, [112, 106, 102, 150][i], 46, 23, i ? CARD : GOLD); txt(c, x + [56, 53, 51, 75][i], 346, 19, i ? '#e8dccf' : DARK, 800, 'center'); });
  MENU.forEach(([img, nome, desc, preco, d3], i) => {
    const y = 390 + i * 168;
    rr(24, y, SW - 48, 152, 24, CARD);
    cover(FOTOS[img], 36, y + 12, 128, 128, 18);
    txt(nome, 184, y + 46, 26, '#ffffff', 800);
    wrap(desc, 184, y + 78, SW - 230, 17, '#bfae9b', 22, 500);
    txt(preco, 184, y + 136, 24, GOLD, 900);
    if (d3) { rr(SW - 106, y + 108, 70, 32, 16, '#0865fe'); txt('3D', SW - 71, y + 131, 18, '#ffffff', 900, 'center'); }
  });
  ui.restore();
  statusBar(true, '23:15');
}
function scrDetail(t) {
  ui.fillStyle = DARK; ui.fillRect(0, 0, SW, SH);
  cover(FOTOS.classico, 0, 0, SW, 520, 0);
  statusBar(true, '23:16');
  rr(24, 70, 64, 64, 32, 'rgba(0,0,0,.45)'); txt('←', 56, 113, 30, '#fff', 800, 'center');
  rr(SW - 140, 464, 112, 40, 20, '#0865fe'); txt('3D · real', SW - 84, 491, 18, '#fff', 900, 'center');
  txt('Clássico', 36, 590, 44, '#ffffff', 900);
  wrap('Blend de 160 g, queijo, alface, tomate e molho da casa no pão brioche.', 36, 636, SW - 72, 22, '#cbb9a6', 32, 500);
  txt('R$ 34,90', 36, 744, 36, GOLD, 900);
  ui.strokeStyle = GOLD; ui.lineWidth = 4; ui.beginPath(); ui.roundRect(36, 800, SW - 72, 88, 44); ui.stroke();
  txt('Ver na minha mesa · 3D', SW / 2, 856, 28, GOLD, 800, 'center');
  rr(36, 910, SW - 72, 92, 46, GOLD); txt('Pedir · Mesa 7', SW / 2, 968, 30, DARK, 900, 'center');
}
function scrAR(t) {
  ui.clearRect(0, 0, SW, SH);
  ui.fillStyle = 'rgba(0,0,0,.3)'; ui.fillRect(0, 0, SW, 120);
  statusBar(true, '23:16');
  if (t >= 24.0) { const k = eo((t - 24.0) / 0.3); rr(SW / 2 - 150, 150 - (1 - k) * 20, 300, 56, 28, 'rgba(8,101,254,.92)'); txt('12 cm · tamanho real', SW / 2, 187 - (1 - k) * 20, 22, '#fff', 800, 'center'); }
  rr(24, SH - 250, SW - 48, 220, 30, 'rgba(18,12,8,.92)');
  txt('Clássico', 52, SH - 196, 30, '#fff', 900); txt('R$ 34,90', SW - 52, SH - 196, 28, GOLD, 900, 'right');
  const sent = t >= 27.4;
  rr(52, SH - 160, SW - 104, 96, 48, sent ? '#1e8e3e' : GOLD);
  txt(sent ? 'Pedido enviado ✓ · Mesa 7' : 'Pedir · Mesa 7', SW / 2, SH - 100, 28, sent ? '#fff' : DARK, 900, 'center');
}
function scrBill(t) {
  ui.fillStyle = DARK; ui.fillRect(0, 0, SW, SH);
  statusBar(true, '23:58');
  if (t >= 39.95) {
    const k = back((t - 39.95) / 0.35);
    ui.beginPath(); ui.arc(SW / 2, 470, 90 * k, 0, 7); ui.fillStyle = '#1e8e3e'; ui.fill();
    ui.strokeStyle = '#fff'; ui.lineWidth = 16; ui.lineCap = 'round'; ui.beginPath(); ui.moveTo(SW / 2 - 40 * k, 470); ui.lineTo(SW / 2 - 10 * k, 500); ui.lineTo(SW / 2 + 45 * k, 440); ui.stroke();
    txt('Pago pelo Pix', SW / 2, 640, 40, '#fff', 900, 'center'); txt('Mesa 7 · R$ 41,90', SW / 2, 690, 24, '#cbb9a6', 600, 'center');
    return;
  }
  txt('Sua conta', 36, 130, 40, '#fff', 900); txt('Mesa 7 · Brasa Burger', 36, 172, 22, '#cbb9a6', 600);
  rr(24, 210, SW - 48, 300, 26, CARD);
  [['1× Clássico', 'R$ 34,90'], ['1× Refrigerante', 'R$ 7,00']].forEach(([a, b], i) => { txt(a, 52, 270 + i * 70, 26, '#e8dccf', 600); txt(b, SW - 52, 270 + i * 70, 26, '#e8dccf', 600, 'right'); });
  ui.fillStyle = '#3a2a1f'; ui.fillRect(52, 400, SW - 104, 2);
  txt('Total', 52, 460, 32, '#fff', 900); txt('R$ 41,90', SW - 52, 460, 32, GOLD, 900, 'right');
  txt('Pagamento', 36, 570, 22, '#cbb9a6', 700);
  rr(36, 590, 150, 56, 28, GOLD); txt('Pix', 111, 627, 22, DARK, 900, 'center');
  rr(200, 590, 150, 56, 28, CARD); txt('Cartão', 275, 627, 22, '#e8dccf', 700, 'center');
  const busy = t >= 39.3;
  rr(36, 860, SW - 72, 96, 48, GOLD);
  if (busy) { ui.strokeStyle = DARK; ui.lineWidth = 7; ui.beginPath(); ui.arc(SW / 2, 908, 22, t * 9, t * 9 + 4.5); ui.stroke(); }
  else txt('Pagar com Pix', SW / 2, 920, 30, DARK, 900, 'center');
}
function scrThanks(t) {
  ui.fillStyle = DARK; ui.fillRect(0, 0, SW, SH);
  statusBar(true, '23:59');
  ui.beginPath(); ui.arc(96, 240, 52, 0, 7); ui.fillStyle = '#1e8e3e'; ui.fill();
  ui.strokeStyle = '#fff'; ui.lineWidth = 10; ui.lineCap = 'round'; ui.beginPath(); ui.moveTo(74, 240); ui.lineTo(90, 258); ui.lineTo(120, 224); ui.stroke();
  txt('Conta fechada.', 36, 380, 44, '#fff', 900); txt('Obrigado pela visita!', 36, 434, 44, '#fff', 900);
  rr(24, 500, SW - 48, 330, 28, CARD);
  wrap('Sua avaliação no Google ajuda outras pessoas a conhecer a casa.', 56, 566, SW - 112, 26, '#e8dccf', 38, 600);
  rr(56, 700, SW - 112, 92, 46, GOLD); txt('Avaliar no Google', SW / 2, 758, 30, DARK, 900, 'center');
}
function scrChat(t) {
  ui.fillStyle = '#0b141a'; ui.fillRect(0, 0, SW, SH);
  rr(0, 0, SW, 170, 0, '#1f2c33');
  statusBar(true, '00:04');
  ui.beginPath(); ui.arc(84, 124, 32, 0, 7); ui.fillStyle = '#f2b134'; ui.fill(); txt('R', 84, 135, 30, '#3a2a00', 900, 'center');
  txt('Rafa', 132, 118, 28, '#e9edef', 800); txt('Hamburgueria', 132, 148, 19, '#8696a0', 600);
  if (t >= 53.4) { const k = eo((t - 53.4) / 0.3); ui.globalAlpha = k; rr(SW - 380, 220, 350, 520, 22, '#005c4b'); cover(FOTOS.duplo, SW - 368, 232, 326, 420, 16); ui.beginPath(); ui.arc(SW - 205, 442, 46, 0, 7); ui.fillStyle = 'rgba(0,0,0,.55)'; ui.fill(); ui.beginPath(); ui.moveTo(SW - 222, 418); ui.lineTo(SW - 222, 466); ui.lineTo(SW - 182, 442); ui.closePath(); ui.fillStyle = '#fff'; ui.fill(); wrap('Olha isso pro teu restaurante', SW - 360, 692, 300, 23, '#e9edef', 30, 500); ui.globalAlpha = 1; }
  if (t >= 54.0 && t < 54.6) { rr(30, 770, 120, 64, 22, '#202c33'); for (let i = 0; i < 3; i++) { ui.beginPath(); ui.arc(64 + i * 26, 802, 7, 0, 7); ui.fillStyle = i === Math.floor(t * 6) % 3 ? '#e9edef' : '#8696a0'; ui.fill(); } }
  if (t >= 54.6) { const k = back((t - 54.6) / 0.3); rr(30, 770, 220 * k, 72, 22, '#202c33'); if (k > 0.8) txt('Eu quero!', 56, 818, 28, '#e9edef', 700); }
}
let lastScreen = '';
function drawScreen(t) {
  let s = '';
  if (t < 6) { scrReview(t, false); s = 'r1'; }
  else if (t < 17.75) { scrScan(t); s = 'scan'; }
  else if (t < 20.05) { scrMenu(t); s = 'menu'; }
  else if (t < 23.45) { scrDetail(t); s = 'det'; }
  else if (t < 28.5) { scrAR(t); s = 'ar'; }
  else if (t < 41.9) { scrBill(t); s = 'bill'; }
  else if (t < 42.85) { scrThanks(t); s = 'thx'; }
  else if (t < 50) { scrReview(t, true); s = 'r5'; }
  else { scrChat(t); s = 'chat'; }
  uiTex.needsUpdate = true;
  lastScreen = s;
}
// taps: [time, screen x, y]
const TAPS = [[4.25, 84, 400], [19.95, 270, 514], [23.35, 270, 846], [27.3, 270, SH - 112], [39.2, 270, 908], [42.75, 270, 746], [43.12, 84, 400], [43.32, 176, 400], [43.52, 268, 400], [43.72, 360, 400], [43.92, 452, 400], [45.05, 270, 802]];

// ---------------------------------------------------------------- timeline: where the eye looks, the phone, the hands
const EYE = new THREE.Vector3(0, 1.16, -0.52);
// [t, look x,y,z, fov]
const LOOK = [
  [0, 0.15, 1.12, 2.5, 54], [3.3, 0.1, 1.0, 2.2, 54], [3.7, 0.04, 0.95, 2.2, 54], [5.6, 0.04, 0.95, 2.2, 54],
  [6.0, 0.06, 1.1, 2.3, 50], [12.4, 0.06, 1.02, 2.2, 50], [12.9, 0.06, 0.92, 1.6, 52], [16.2, 0.08, 0.88, 1.4, 52],
  [16.6, 0.04, 0.84, 0.9, 54], [27.9, 0.04, 0.84, 0.9, 54],
  [28.7, 1.5, 2.4, 8.3, 30], [29.3, 1.55, 2.3, 8.3, 21], [31.2, 1.55, 2.3, 8.3, 21],
  [31.9, 0.3, 1.1, 2.0, 50], [33.9, 0.22, 1.02, 1.6, 50], [34.6, 0.02, 0.86, 0.35, 52], [37.5, 0.02, 0.86, 0.35, 52],
  [37.9, 0.04, 0.95, 2.2, 54], [45.6, 0.04, 0.95, 2.2, 54], [46.1, 0.15, 1.08, 1.7, 52], [48.1, 0.15, 1.08, 1.7, 52],
];
function lookAt(t) {
  let i = 0;
  while (i < LOOK.length - 1 && LOOK[i + 1][0] <= t) i++;
  const A = LOOK[i], B = LOOK[Math.min(i + 1, LOOK.length - 1)];
  const k = B[0] - A[0] < 0.01 ? 1 : eio((t - A[0]) / (B[0] - A[0]));
  return { q: [lerp(A[1], B[1], k), lerp(A[2], B[2], k), lerp(A[3], B[3], k)], f: lerp(A[4], B[4], k) };
}
// phone windows [in, out]: it rises from below the frame and goes back down
const PHONE = [[3.55, 5.75], [16.45, 28.05], [37.7, 48.1], [52.96, 60]];
function phoneUp(t) {
  for (const [a, b] of PHONE) if (t >= a - 0.01 && t < b + 0.4) return Math.min(eo((t - a) / 0.38), 1 - eio((t - b) / 0.38));
  return 0;
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
const faceCam = (p) => { p.g.rotation.y = Math.atan2(EYE.x - p.g.position.x, EYE.z - p.g.position.z); };
const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
const toPov = (v) => camera.worldToLocal(v.clone());
const TIP = new THREE.Vector3(0.036, 0.16, 0);

function update(t) {
  // ---- camera: the customer's eyes (a tiny head motion), the pull-back at the end
  const L0 = lookAt(t);
  camera.position.copy(EYE).add(tmpV.set(Math.sin(t * 0.9) * 0.004, Math.sin(t * 1.3) * 0.003, 0));
  camera.fov = L0.f;
  camera.lookAt(...L0.q);
  if (t >= 48.16 && t < 52.96) {
    const k = eio((t - 48.16) / 3.2);
    camera.position.set(lerp(EYE.x, -2.5, k), lerp(EYE.y, 1.42, k), lerp(EYE.z, -0.05, k));
    camera.fov = lerp(52, 58, k);
    camera.lookAt(lerp(0.15, 0.2, k), lerp(1.08, 0.98, k), lerp(1.7, -0.25, k));
  }
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const pov1 = !(t >= 48.16 && t < 52.96);
  pov.visible = pov1;
  customer.g.visible = !pov1;

  // ---- defaults (the table card shows our QR once the hand has swapped it)
  const cm = t >= 15.3 ? qrTex : pdfTex;
  if (cardMat.map !== cm) { cardMat.map = cm; cardMat.needsUpdate = true; }
  hide(R); hide(L); heldCard.visible = false; heldBurger.visible = false; tcard.visible = true;
  waitress.g.visible = false; waiter.g.visible = false;
  trayW.visible = true; servePlate.visible = false; trayA.visible = false; trayB.visible = false;
  for (const p of [waitress, waiter]) { p.armL.rotation.set(0, 0, 0); p.armR.rotation.set(0, 0, 0); p.head.rotation.set(0, 0, 0); p.legs.forEach((l) => l.rotation.set(0, 0, 0)); face(p, 'smile'); }
  order.visible = false; glows.forEach((g) => (g.visible = false));

  // ---- phone in the hand
  const up = phoneUp(t);
  phone.visible = up > 0.001;
  const lowered = t >= 46.0 && t < 48.2 ? eio((t - 46.0) / 0.5) * 0.09 : 0;
  phone.position.set(0.006 + Math.sin(t * 1.1) * 0.002, lerp(-0.3, -0.036, up) - lowered, -0.3);
  phone.rotation.set(-0.12 + (1 - up) * 0.5, 0.05, -0.03 + Math.sin(t * 0.8) * 0.01);
  phone.updateMatrix();
  if (phone.visible) drawScreen(t);
  const feedOn = phone.visible && ((t >= 16.45 && t < 17.75) || (t >= 23.45 && t < 28.5));
  feed.visible = feedOn;

  // ---- story
  if (t < 3.6) {
    // half an hour with the hand up; the waiter rushes past ("já tô indo aí!")
    pose(R, [0.15, 0.09 + Math.sin(t * 6) * 0.01, -0.58], [-0.15, -0.25, 0.12], 0.05, [0.42, -0.72, -0.3]);
    if (t > 3.2) R.h.position.y -= eio((t - 3.2) / 0.4) * 0.4;
    walk(waiter, [[-0.6, 2.5], [0.05, 1.55], [0.75, 1.5], [1.35, 2.7]], t / 3.4, t);
    waiter.armR.rotation.set(-1.5, 0, 0); waiter.armL.rotation.set(t > 2.2 ? -1.0 : Math.sin(t * 12) * 0.4, 0, t > 2.2 ? 0.6 : 0);
    waiter.head.rotation.y = t > 2.0 ? 0.9 : -0.6;
    waitress.g.visible = true; waitress.g.position.set(1.1, 0, 6.4); waitress.g.rotation.y = Math.PI * 0.85; waitress.armR.rotation.set(-1.4, 0, 0); trayA.visible = true;
  } else if (t < 12.6) {
    // the waitress sees the one star and panics; then she listens; the waiter crosses behind her
    waitress.g.visible = true;
    const inK = eo((t - 5.35) / 0.55);
    waitress.g.position.set(lerp(1.4, 0.1, inK), inK < 1 ? Math.abs(Math.sin(t * 14)) * 0.03 : 0, lerp(2.4, 1.5, inK));
    faceCam(waitress);
    if (t < 5.35) waitress.g.visible = false;
    if (t >= 5.85 && t < 7.2) {
      const k = eo((t - 5.85) / 0.25);
      waitress.armR.rotation.set(0, 0, 2.7 * k + Math.sin(t * 9) * 0.1); waitress.armL.rotation.set(0, 0, -2.7 * k - Math.sin(t * 9 + 1) * 0.1);
      face(waitress, 'o');
    } else if (t >= 7.2) {
      waitress.armR.rotation.set(-0.9, 0, -0.35); waitress.armL.rotation.set(-0.9, 0, 0.35);
      face(waitress, 'worried');
      if (t >= 11.4) { const k = eo((t - 11.4) / 0.3); waitress.armR.rotation.set(-1.3 * k, 0, 0.5 * k); waitress.armL.rotation.set(-1.3 * k, 0, -0.5 * k); waitress.head.rotation.x = 0.15; }
    }
    if (t >= 9.6 && t < 11.6) { walk(waiter, [[-2.0, 2.6], [2.2, 2.4]], (t - 9.6) / 2.0, t); waiter.armR.rotation.set(-1.5, 0, 0); waiter.armL.rotation.set(-1.5, 0, 0); }
  } else if (t < 16.45) {
    // the hand picks up the PDF menu card, shows it, swaps it for our QR card and puts it back on the table
    waitress.g.visible = true; waitress.g.position.set(-0.35, 0, 2.2); faceCam(waitress); face(waitress, 'worried');
    const onTable = toPov(tmpV.copy(TCARD).applyMatrix4(T7.matrixWorld));
    const held = new THREE.Vector3(0.04, -0.12, -0.42);
    const k = t < 13.3 ? eio((t - 12.75) / 0.55) : t < 15.95 ? 1 : 1 - eio((t - 15.95) / 0.45);
    if (t >= 12.75) {
      tcard.visible = false; heldCard.visible = true;
      heldCard.position.lerpVectors(onTable, held, k);
      heldCard.rotation.set(lerp(-0.45, 0.05, k), 0.12 * k, 0);
      const flip = t >= 15.1 && t < 15.5 ? Math.abs(Math.cos(((t - 15.1) / 0.4) * Math.PI)) : 1;
      heldCard.scale.set(1.1 * Math.max(0.03, flip), 1.1, 1.1);
      pose(R, [heldCard.position.x + 0.03, heldCard.position.y - 0.02, heldCard.position.z + 0.02], [-0.3, 0.1, 0.1], 0.9, [0.4, -0.72, -0.22], 0.6);
    }
    if (t >= 16.4) { tcard.visible = true; heldCard.visible = false; }
  } else if (t >= 31.4 && t < 34.6) {
    // a little later: the waiter brings the plate ("com licença! hambúrguer clássico")
    walk(waiter, [[1.3, 6.8], [0.6, 3.0], [0.38, 0.95]], eo((t - 31.4) / 2.1), t);
    if (t > 33.5) faceCam(waiter);
    trayW.visible = false; servePlate.visible = t < 34.25;
    waiter.armR.rotation.set(t < 33.9 ? -1.45 : lerp(-1.45, -0.95, clamp((t - 33.9) / 0.3)), 0, 0);
    waitress.g.visible = true; waitress.g.position.set(-1.2, 0, 2.9); faceCam(waitress); face(waitress, 'big');
  } else if (t >= 45.6 && t < 48.16) {
    // she sees the five stars and is delighted
    waitress.g.visible = true; waitress.g.position.set(0.18, 0, 1.25); faceCam(waitress); face(waitress, 'big');
    const k = eo((t - 45.7) / 0.3);
    waitress.armR.rotation.set(-1.9 * k, 0, -0.75 * k); waitress.armL.rotation.set(-1.9 * k, 0, 0.75 * k);
    waitress.head.rotation.z = Math.sin(t * 4) * 0.08;
  } else if (t >= 48.16 && t < 52.96) {
    // the same table from the side: he eats, she walks by smiling
    waitress.g.visible = true;
    walk(waitress, [[1.5, 0.9], [0.75, 0.45]], (t - 48.16) / 2.0, t, 10);
    if (t > 50.2) { waitress.g.rotation.y = -Math.PI / 2 - 0.8; } face(waitress, 'big');
  }
  if (t >= 16.45 && t < 31.4) { waitress.g.visible = true; waitress.g.position.set(-0.55, 0, 1.9); faceCam(waitress); face(waitress, t >= 24 ? 'big' : 'smile'); waitress.armR.rotation.set(-1.4, 0, 0); trayA.visible = true; }

  // ---- taps with the other hand (index finger out)
  const tp = TAPS.find(([a]) => t >= a - 0.32 && t < a + 0.28);
  if (phone.visible && up > 0.9 && tp) {
    const target = screenPoint(tp[1], tp[2]).applyMatrix4(phone.matrix);
    const k = t < tp[0] ? eo((t - (tp[0] - 0.32)) / 0.32) : 1 - eio((t - tp[0]) / 0.28);
    const rest = new THREE.Vector3(-0.32, -0.42, -0.28);
    const rot = new THREE.Euler(-0.35, 0.15, 0.4);
    const tipNow = TIP.clone().applyEuler(rot);
    const press = t >= tp[0] && t < tp[0] + 0.08 ? 0.004 : 0.012;
    const hp = target.clone().add(new THREE.Vector3(0, 0, press)).sub(tipNow);
    hp.lerpVectors(rest, hp, k);
    pose(L, [hp.x, hp.y, hp.z], [rot.x, rot.y, rot.z], [0, 1.25, 1.25, 1.25], [-0.45, -0.75, -0.2], 0.8);
  }

  // ---- AR preview on the plate (only through the phone), the real burger later, the bite
  plate.visible = true;
  tableBurger.visible = !!burgerProto && t >= 34.25 && !(t >= 35.15 && t < 48.16);
  arBurger.visible = false;
  const kAr = eo((t - 23.8) / 1.0);
  arBurger.scale.setScalar(0.75 + 0.25 * back((t - 23.8) / 0.8));
  arBurger.rotation.y = (t - 23.8) * 0.5;
  arBurger.traverse((o) => { if (o.isMesh && o.material.transparent) o.material.opacity = kAr; });
  ringMat.opacity = 0;
  if (t >= 35.15 && t < 37.7 && burgerProto) {
    // he lifts the burger towards his mouth and takes a bite
    const from = toPov(tmpV.set(0, 0.816, -0.04).applyMatrix4(T7.matrixWorld));
    const k = eo((t - 35.15) / 0.7), down = t > 37.2 ? eio((t - 37.2) / 0.5) : 0;
    heldBurger.visible = true;
    heldBurger.position.lerpVectors(from, new THREE.Vector3(0.0, -0.075, -0.27), k * (1 - down));
    heldBurger.rotation.set(0.35 * k, -Math.PI / 2 + 0.25, 0.1 * k);
    heldBurger.updateMatrixWorld();
    const bitten = t >= 36.25;
    heldMats.forEach((m) => { m.clippingPlanes = bitten ? biteWorld : null; m.clipIntersection = true; m.needsUpdate = m.userData.b !== bitten; m.userData.b = bitten; });
    if (bitten) BITE.forEach((p, i) => biteWorld[i].copy(p).applyMatrix4(heldBurger.children[0] ? heldBurger.children[0].matrixWorld : heldBurger.matrixWorld));
    pose(L, [heldBurger.position.x - 0.01, heldBurger.position.y - 0.085, heldBurger.position.z + 0.03], [-1.35, 0.15, 0.15], 0.7, [-0.4, -0.8, -0.2], 0.5);
  }

  // ---- the order flies from the phone to the kitchen screen
  if (t >= 27.95 && t < 29.15) {
    const k = eio((t - 27.95) / 1.15);
    const a = new THREE.Vector3(); phone.getWorldPosition(a);
    const b = new THREE.Vector3(KX + 0.35, 2.52, ROOM.z1 - 0.18);
    const p = a.clone().lerp(b, k); p.y += Math.sin(k * Math.PI) * 0.9;
    order.visible = true; order.position.copy(p); order.quaternion.copy(camera.quaternion);
    order.scale.setScalar(lerp(0.6, 3.2, k) * (k > 0.92 ? 1 - (k - 0.92) / 0.08 : 1));
    glows.forEach((g, i) => { const kk = clamp(k - i * 0.03); const q = a.clone().lerp(b, kk); q.y += Math.sin(kk * Math.PI) * 0.9; g.visible = kk > 0.04; g.position.copy(q); g.scale.setScalar(q.distanceTo(camera.position) * 0.07 * (1 - i / 12)); g.material.opacity = 0.32 * (1 - i / 10); });
  }

  // ---- diners: hands up while the customer waits
  others.forEach((tb, i) => tb.people.forEach((p, k) => {
    if (!p) return;
    const upd = t < 12.6 && (i + k) % 2 === 0;
    p.armR.rotation.set(upd ? 0 : -0.9, 0, upd ? 2.6 + Math.sin(t * 5 + i) * 0.12 : 0);
    p.head.rotation.y = Math.sin(t * 0.7 + i * 2) * 0.2;
  }));

  // ---- kitchen screen and the chef
  const stage = t >= 29.05 ? 1 : 0;
  const keyS = stage * 100 + (stage ? Math.floor((t - 29.05) * 2) : 0);
  if (keyS !== tvState) { tvState = keyS; drawK(stage, Math.max(0, t - 29.05)); }
  const cheer = t >= 29.2 && t < 31.3;
  chef.armR.rotation.set(cheer ? 0 : -1.0 + Math.sin(t * 3) * 0.2, 0, cheer ? 2.6 + Math.sin(t * 8) * 0.1 : 0);
  chef.armL.rotation.set(cheer ? -1.6 : -1.0 - Math.sin(t * 3) * 0.2, 0, 0);
  face(chef, cheer ? 'big' : 'smile');
  lampLights.forEach((Lt, i) => { Lt.intensity = 5 + Math.sin(t * 2 + i) * 0.15; });

  // ---- the phone's camera (scan and the dish in 3D on the plate)
  if (feedOn) {
    const ar = t >= 23.45;
    phone.getWorldPosition(tmpV);
    phoneCam.position.copy(tmpV);
    const tgt = ar ? tmpV2.set(0, 0.85, -0.04).applyMatrix4(T7.matrixWorld) : tmpV2.copy(TCARD).add(new THREE.Vector3(0, 0.1, 0)).applyMatrix4(T7.matrixWorld);
    phoneCam.lookAt(tgt);
    phoneCam.fov = ar ? 58 : 36;
    phoneCam.updateProjectionMatrix();
    pov.visible = false;
    arBurger.visible = ar && !!burgerProto;
    ringMat.opacity = ar ? (1 - (((t - 23.8) % 1.4) / 1.4)) * 0.9 : 0;
    arRing.scale.setScalar(1 + (((t - 23.8) % 1.4) / 1.4) * 1.4);
    renderer.setRenderTarget(rt);
    renderer.render(scene, phoneCam);
    renderer.setRenderTarget(null);
    arBurger.visible = false; ringMat.opacity = 0;
    pov.visible = pov1;
  }
}

const v3 = new THREE.Vector3();
window.dio = {
  draw(t) { update(t); renderer.render(scene, camera); },
  project(x, y, z) { v3.set(x, y, z); v3.project(camera); return { x: (v3.x * 0.5 + 0.5) * W, y: (-v3.y * 0.5 + 0.5) * H }; },
};
