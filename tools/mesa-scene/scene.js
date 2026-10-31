// Isometric 3D restaurant for the "pedido na mesa" Reel. Original low-poly diorama:
// wood floor, blue booths, candle-lit tables, seated guests, a waiter and the kitchen pass.
// window.renderFrame(t, w, h) renders time t (seconds) and returns a JPEG data URL.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#06080d');
scene.fog = new THREE.Fog('#06080d', 26, 48);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(24, 9 / 16, 0.5, 200);

// ---------------------------------------------------------------- helpers
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = (x) => { x = clamp(x); const c = 1.8, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, k) => a + (b - a) * k;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o });
const add = (parent, geo, material, x = 0, y = 0, z = 0, cast = true) => {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  parent.add(m);
  return m;
};
const rbox = (w, h, d, r = 0.06) => new RoundedBoxGeometry(w, h, d, 3, r);

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---------------------------------------------------------------- room
const ROOM = { x0: -6.2, x1: 6.2, z0: -3.6, z1: 5 };
const W = ROOM.x1 - ROOM.x0, D = ROOM.z1 - ROOM.z0;

const woodTex = canvasTex(1024, 1024, (g, w, h) => {
  const rows = 16, ph = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = -rnd() * 300;
    while (x < w) {
      const len = 220 + rnd() * 260;
      const l = 30 + rnd() * 8, s = 55 + rnd() * 12, li = 36 + rnd() * 10;
      g.fillStyle = `hsl(${l},${s}%,${li}%)`;
      g.fillRect(x, r * ph, len, ph);
      g.globalAlpha = 0.12;
      for (let k = 0; k < 6; k++) { g.fillStyle = rnd() > 0.5 ? '#000' : '#fff'; g.fillRect(x, r * ph + rnd() * ph, len, 1 + rnd() * 2); }
      g.globalAlpha = 1;
      g.fillStyle = 'rgba(30,14,4,.55)';
      g.fillRect(x, r * ph, 3, ph);
      x += len;
    }
    g.fillStyle = 'rgba(30,14,4,.6)';
    g.fillRect(0, r * ph, w, 3);
  }
});
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
woodTex.repeat.set(W / 4, D / 4);
const floor = add(scene, new THREE.BoxGeometry(W, 0.2, D), mat('#ffffff', { map: woodTex, roughness: 0.55 }), 0, -0.1, (ROOM.z0 + ROOM.z1) / 2, false);
floor.receiveShadow = true;
// Plinth under the diorama.
add(scene, new THREE.BoxGeometry(W + 0.02, 0.5, D + 0.02), mat('#3a2414'), 0, -0.45, (ROOM.z0 + ROOM.z1) / 2, false);

const wallH = 3.4;
const wallMat = mat('#16244a', { roughness: 0.9 });
add(scene, new THREE.BoxGeometry(W, wallH, 0.2), wallMat, 0, wallH / 2, ROOM.z0 - 0.1);
add(scene, new THREE.BoxGeometry(0.2, wallH, D), wallMat, ROOM.x0 - 0.1, wallH / 2, (ROOM.z0 + ROOM.z1) / 2);
// Wainscot.
const wains = mat('#0f1a36', { roughness: 0.8 });
add(scene, new THREE.BoxGeometry(W, 1.0, 0.06), wains, 0, 0.5, ROOM.z0 + 0.03);
add(scene, new THREE.BoxGeometry(0.06, 1.0, D), wains, ROOM.x0 + 0.03, 0.5, (ROOM.z0 + ROOM.z1) / 2);
add(scene, new THREE.BoxGeometry(W, 0.05, 0.1), mat('#c08a4a'), 0, 1.02, ROOM.z0 + 0.05);
add(scene, new THREE.BoxGeometry(0.1, 0.05, D), mat('#c08a4a'), ROOM.x0 + 0.05, 1.02, (ROOM.z0 + ROOM.z1) / 2);

// Night windows on the left wall (stars).
const nightTex = canvasTex(256, 384, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#0b1636'); gr.addColorStop(1, '#1c2f66');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, rnd() * 1.6 + 0.3, 0, 7); g.fill(); }
  g.fillStyle = '#e8eefc'; g.beginPath(); g.arc(w * 0.72, h * 0.22, 20, 0, 7); g.fill();
});
for (const z of [-1.4, 2.4]) {
  const win = new THREE.Group();
  add(win, new THREE.BoxGeometry(0.12, 1.7, 1.25), mat('#c08a4a'), 0, 0, 0);
  add(win, new THREE.PlaneGeometry(1.1, 1.55), new THREE.MeshBasicMaterial({ map: nightTex }), 0.07, 0, 0, false).rotation.y = Math.PI / 2;
  add(win, new THREE.BoxGeometry(0.05, 1.55, 0.04), mat('#c08a4a'), 0.09, 0, 0);
  add(win, new THREE.BoxGeometry(0.05, 0.04, 1.1), mat('#c08a4a'), 0.09, 0, 0);
  win.position.set(ROOM.x0 + 0.02, 2.05, z);
  scene.add(win);
}
// Frames on the back wall: abstract round art.
const artTex = (hue) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f3ecdf'; g.fillRect(0, 0, w, h);
  g.fillStyle = `hsl(${hue},70%,45%)`; g.beginPath(); g.arc(w * 0.5, h * 0.55, w * 0.3, 0, 7); g.fill();
  g.fillStyle = '#16244a'; g.fillRect(w * 0.15, h * 0.2, w * 0.7, h * 0.08);
});
[[-4.4, 215], [-1.8, 28], [0.9, 215]].forEach(([x, hue]) => {
  add(scene, new THREE.BoxGeometry(0.95, 0.95, 0.06), mat('#c08a4a'), x, 2.15, ROOM.z0 + 0.04);
  add(scene, new THREE.PlaneGeometry(0.8, 0.8), mat('#fff', { map: artTex(hue), roughness: 0.9 }), x, 2.15, ROOM.z0 + 0.08, false);
});
// Wall lamps (warm).
const lampGlow = new THREE.MeshBasicMaterial({ color: '#ffc477' });
[[-3.1, ROOM.z0 + 0.12], [-0.45, ROOM.z0 + 0.12]].forEach(([x, z]) => {
  add(scene, new THREE.CylinderGeometry(0.16, 0.22, 0.24, 20), lampGlow, x, 2.75, z, false);
});

// ---------------------------------------------------------------- kitchen pass (back right)
const kitchen = new THREE.Group();
add(kitchen, rbox(2.6, 1.05, 0.7, 0.05), mat('#2a1a10'), 0, 0.525, 0);
add(kitchen, rbox(2.7, 0.07, 0.8, 0.03), mat('#d9d4cc', { roughness: 0.35 }), 0, 1.08, 0);
add(kitchen, new THREE.BoxGeometry(2.4, 0.1, 0.5), new THREE.MeshBasicMaterial({ color: '#ffb35c' }), 0, 2.45, -0.05, false);
const signTex = canvasTex(512, 128, (g, w, h) => {
  g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffb35c'; g.font = '800 64px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('COZINHA', w / 2, h / 2 + 4);
});
add(kitchen, new THREE.BoxGeometry(1.7, 0.45, 0.06), mat('#0b1220'), 0, 2.85, -0.3);
add(kitchen, new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: signTex }), 0, 2.85, -0.26, false);
// Plates waiting on the pass.
[-0.7, 0.1, 0.8].forEach((x) => {
  add(kitchen, new THREE.CylinderGeometry(0.2, 0.17, 0.03, 24), mat('#f5f5f0', { roughness: 0.3 }), x, 1.13, 0.05);
  add(kitchen, new THREE.CylinderGeometry(0.11, 0.12, 0.09, 20), mat('#a8571f'), x, 1.19, 0.05);
});
// Bell.
add(kitchen, new THREE.SphereGeometry(0.08, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e3c06a', { metalness: 0.8, roughness: 0.25 }), 1.15, 1.11, 0.12);
kitchen.position.set(4.3, 0, ROOM.z0 + 0.45);
scene.add(kitchen);

// ---------------------------------------------------------------- people
const SKIN = ['#f1c7a3', '#c98e64', '#8d5a3b', '#e0ac85', '#6e4229'];
const HAIR = ['#2b1a12', '#5a3a22', '#111', '#b9853c', '#3d2a1e'];
function person({ shirt, skin = 0, hair = 0, seated = true, long = false, apron = false }) {
  const g = new THREE.Group();
  const sm = mat(shirt), km = mat(SKIN[skin], { roughness: 0.6 }), hm = mat(HAIR[hair], { roughness: 0.7 });
  const torsoY = seated ? 0.72 : 1.1;
  const torso = add(g, new THREE.CapsuleGeometry(0.2, 0.3, 6, 14), sm, 0, torsoY, 0);
  torso.scale.set(1.05, 1, 0.8);
  if (apron) add(g, new THREE.BoxGeometry(0.34, 0.5, 0.05), mat('#1a1a1a'), 0, torsoY - 0.12, 0.15);
  const head = new THREE.Group();
  add(head, new THREE.SphereGeometry(0.17, 24, 18), km, 0, 0, 0);
  const cap = add(head, new THREE.SphereGeometry(0.18, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hm, 0, 0.02, -0.01);
  cap.rotation.x = -0.25;
  if (long) add(head, new THREE.CapsuleGeometry(0.15, 0.22, 4, 12), hm, 0, -0.12, -0.08);
  add(head, new THREE.SphereGeometry(0.022, 8, 6), mat('#1b1b1b'), -0.06, 0.0, 0.155, false);
  add(head, new THREE.SphereGeometry(0.022, 8, 6), mat('#1b1b1b'), 0.06, 0.0, 0.155, false);
  head.position.y = torsoY + 0.4;
  g.add(head);
  const arm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.24, torsoY + 0.17, 0);
    const a = add(pivot, new THREE.CapsuleGeometry(0.06, 0.26, 4, 10), sm, 0, -0.17, 0);
    add(a, new THREE.SphereGeometry(0.06, 10, 8), km, 0, -0.18, 0);
    g.add(pivot);
    return pivot;
  };
  const armL = arm(-1), armR = arm(1);
  const legs = [];
  if (seated) {
    for (const s of [-1, 1]) {
      const l = add(g, new THREE.CapsuleGeometry(0.075, 0.32, 4, 10), mat('#26304a'), s * 0.1, 0.5, 0.22);
      l.rotation.x = Math.PI / 2;
    }
  } else {
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.1, 0.78, 0);
      add(pivot, new THREE.CapsuleGeometry(0.08, 0.5, 4, 10), mat('#1d2233'), 0, -0.36, 0);
      add(pivot, new THREE.BoxGeometry(0.12, 0.08, 0.2), mat('#111'), 0, -0.72, 0.04);
      g.add(pivot);
      legs.push(pivot);
    }
  }
  return { g, head, armL, armR, legs, torso };
}
function phoneProp(color = '#0b0f17') {
  const p = new THREE.Group();
  add(p, rbox(0.1, 0.19, 0.015, 0.012), mat(color, { roughness: 0.3 }), 0, 0, 0);
  add(p, new THREE.PlaneGeometry(0.088, 0.17), new THREE.MeshBasicMaterial({ color: '#f3c46a' }), 0, 0, 0.009, false);
  return p;
}

// ---------------------------------------------------------------- tables, booths, guests
const BLUE = '#1f4fe0';
const boothMat = mat(BLUE, { roughness: 0.55 });
const boothDark = mat('#173aa8', { roughness: 0.6 });
const topMat = mat('#9a5a2b', { roughness: 0.45 });
function booth(parent, z, facing) {
  const b = new THREE.Group();
  add(b, rbox(1.5, 0.42, 0.62, 0.1), boothMat, 0, 0.21, 0);
  add(b, rbox(1.5, 0.75, 0.2, 0.09), boothDark, 0, 0.75, -0.3);
  add(b, rbox(1.5, 0.12, 0.62, 0.06), boothMat, 0, 0.45, 0);
  b.position.z = z;
  b.rotation.y = facing;
  parent.add(b);
  return b;
}
const tables = [];
const TABLES = [[-3.8, -1.6], [-0.7, -1.6], [2.2, -1.2], [-3.8, 2.3], [-0.7, 2.3], [2.6, 2.6]];
const GUESTS = [
  [{ shirt: '#e85d75', skin: 0, hair: 1, long: true }, { shirt: '#2e8b57', skin: 2, hair: 2 }],
  [{ shirt: '#f2b134', skin: 3, hair: 0 }, null],
  [{ shirt: '#7b61ff', skin: 1, hair: 3, long: true }, { shirt: '#e0e4ea', skin: 4, hair: 2 }],
  [null, { shirt: '#ff7a45', skin: 0, hair: 4 }],
  [{ shirt: '#ff5e7e', skin: 0, hair: 1, long: true }, { shirt: '#3fb6a8', skin: 1, hair: 0 }],
  [{ shirt: '#4d8dff', skin: 2, hair: 2 }, { shirt: '#f2b134', skin: 3, hair: 1, long: true }],
];
const candleLights = [];
TABLES.forEach(([x, z], i) => {
  const t = new THREE.Group();
  t.position.set(x, 0, z);
  add(t, rbox(1.25, 0.07, 0.82, 0.03), topMat, 0, 0.76, 0);
  add(t, new THREE.CylinderGeometry(0.05, 0.05, 0.72, 10), mat('#1b1b1b'), 0, 0.37, 0);
  add(t, new THREE.CylinderGeometry(0.28, 0.32, 0.03, 20), mat('#1b1b1b'), 0, 0.015, 0);
  booth(t, -0.78, 0);
  booth(t, 0.78, Math.PI);
  // Candle.
  add(t, new THREE.CylinderGeometry(0.045, 0.05, 0.1, 14), mat('#f4ead6'), 0.3, 0.85, -0.12);
  const flame = add(t, new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffcf7a' }), 0.3, 0.93, -0.12, false);
  flame.scale.y = 1.6;
  if (i % 2 === 0 || i === 4) {
    const L = new THREE.PointLight('#ffb35c', 3.2, 3.2, 1.6);
    L.position.set(0.3, 1.1, -0.12);
    t.add(L);
    candleLights.push({ L, flame, i });
  } else candleLights.push({ L: null, flame, i });
  // Plates.
  add(t, new THREE.CylinderGeometry(0.15, 0.13, 0.02, 20), mat('#f5f5f0', { roughness: 0.3 }), -0.25, 0.81, -0.15);
  if (i !== 4) add(t, new THREE.CylinderGeometry(0.15, 0.13, 0.02, 20), mat('#f5f5f0', { roughness: 0.3 }), -0.1, 0.81, 0.2);
  const people = GUESTS[i].map((p, k) => {
    if (!p) return null;
    const o = person(p);
    o.g.position.set(k === 0 ? -0.2 : 0.2, 0.0, k === 0 ? -0.72 : 0.72);
    o.g.rotation.y = k === 0 ? 0 : Math.PI;
    o.armL.rotation.x = -0.9; o.armR.rotation.x = -0.9;
    t.add(o.g);
    return o;
  });
  scene.add(t);
  tables.push({ g: t, x, z, people });
});
const T5 = tables[4];
// Table 5: the QR stand and the guests' phones.
const qrTex = canvasTex(256, 320, (g, w, h) => {
  g.fillStyle = '#f6f3ee'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#111'; g.font = '800 46px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('MESA 5', w / 2, 56);
  const n = 21, s = 9, ox = (w - n * s) / 2, oy = 80;
  let sd = 5; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const finder = (x, y) => { g.fillStyle = '#111'; g.fillRect(ox + x * s, oy + y * s, 7 * s, 7 * s); g.fillStyle = '#fff'; g.fillRect(ox + (x + 1) * s, oy + (y + 1) * s, 5 * s, 5 * s); g.fillStyle = '#111'; g.fillRect(ox + (x + 2) * s, oy + (y + 2) * s, 3 * s, 3 * s); };
  g.fillStyle = '#fff'; g.fillRect(ox - s, oy - s, (n + 2) * s, (n + 2) * s);
  g.fillStyle = '#111';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) && r() > 0.5) g.fillRect(ox + x * s, oy + y * s, s, s);
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
});
const qr = new THREE.Group();
add(qr, new THREE.BoxGeometry(0.2, 0.26, 0.012), mat('#f6f3ee'), 0, 0.13, 0);
const qrFace = add(qr, new THREE.PlaneGeometry(0.19, 0.24), new THREE.MeshStandardMaterial({ map: qrTex, emissive: '#4d8dff', emissiveIntensity: 0 }), 0, 0.13, 0.008, false);
qr.position.set(0.22, 0.8, 0.12);
qr.rotation.x = -0.12;
T5.g.add(qr);
const scanBeam = add(T5.g, new THREE.PlaneGeometry(0.26, 0.012), new THREE.MeshBasicMaterial({ color: '#6aa4ff', transparent: true, opacity: 0 }), 0.22, 0.93, 0.135, false);
const ringMat = new THREE.MeshBasicMaterial({ color: '#4d8dff', transparent: true, opacity: 0 });
const ring5 = add(scene, new THREE.RingGeometry(1.75, 1.9, 64), ringMat, T5.x, 0.012, T5.z, false);
ring5.rotation.x = -Math.PI / 2;
const [guestA, guestB] = T5.people;
const phoneA = phoneProp(); guestA.armR.add(phoneA); phoneA.position.set(0, -0.36, 0.05); phoneA.rotation.x = -0.4; phoneA.visible = false;
const phoneB = phoneProp('#3a2f8f'); guestB.armR.add(phoneB); phoneB.position.set(0, -0.36, 0.05); phoneB.rotation.x = -0.4; phoneB.visible = false;

// ---------------------------------------------------------------- waiter
const waiter = person({ shirt: '#f4f6fa', skin: 1, hair: 2, seated: false, apron: true });
scene.add(waiter.g);
const tray = new THREE.Group();
add(tray, new THREE.CylinderGeometry(0.22, 0.22, 0.02, 24), mat('#c9ced8', { metalness: 0.7, roughness: 0.3 }), 0, 0, 0);
add(tray, new THREE.CylinderGeometry(0.06, 0.05, 0.14, 12), mat('#e8a03c', { transparent: true, opacity: 0.9 }), 0.07, 0.08, 0);
waiter.armR.add(tray); tray.position.set(0.05, -0.36, 0.12);
const phoneW = phoneProp('#111'); waiter.armL.add(phoneW); phoneW.position.set(0, -0.36, 0.06); phoneW.rotation.x = -0.5; phoneW.visible = false;

// Waiter route: a polyline in the aisle (x,z), time-mapped below.
const R = {
  rush: [[4.3, -1.9], [3.6, 0.5], [0.9, 0.4], [-2.2, 0.5], [-2.3, -0.3], [-2.2, 0.5], [0.9, 0.6], [1.6, 4.0], [4.3, 4.1]],
  toKitchen: [[4.3, -1.9]],
  serve: [[4.3, -1.9], [3.4, 0.5], [0.8, 0.6], [0.35, 1.55]],
};
const polyAt = (pts, k) => {
  if (pts.length === 1) return { p: pts[0], dir: [0, 1] };
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(d); total += d; }
  let s = clamp(k) * total;
  for (let i = 0; i < seg.length; i++) {
    if (s <= seg[i] || i === seg.length - 1) {
      const f = Math.min(1, s / seg[i]);
      const a = pts[i], b = pts[i + 1];
      return { p: [lerp(a[0], b[0], f), lerp(a[1], b[1], f)], dir: [b[0] - a[0], b[1] - a[1]] };
    }
    s -= seg[i];
  }
};

// ---------------------------------------------------------------- floating bubbles (sprites)
function bubbleTex(kind) {
  return canvasTex(256, 300, (g, w) => {
    const col = kind === 'conta' ? '#16a34a' : kind === 'ok' ? '#16a34a' : '#0865fe';
    g.fillStyle = col;
    g.beginPath(); g.roundRect(18, 18, w - 36, 200, 56); g.fill();
    g.beginPath(); g.moveTo(w / 2 - 30, 214); g.lineTo(w / 2, 262); g.lineTo(w / 2 + 30, 214); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round';
    g.save(); g.translate(w / 2 - 66, 52); g.scale(5.5, 5.5);
    g.lineWidth = 2.2;
    const p = new Path2D(kind === 'conta' ? 'M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z M9 8h6M9 12h6M9 16h3' : kind === 'ok' ? 'm5 12.5 4.5 4.5L19 7.5' : 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20.5a2 2 0 0 0 4 0');
    g.stroke(p); g.restore();
  });
}
const TEX = { bell: bubbleTex('bell'), conta: bubbleTex('conta'), ok: bubbleTex('ok') };
function bubble(kind, x, y, z) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX[kind], transparent: true, depthTest: false }));
  s.position.set(x, y, z);
  s.renderOrder = 10;
  scene.add(s);
  return s;
}
const rushBubbles = [[0, 0], [2, 1], [5, 0], [3, 2]].map(([i]) => bubble('bell', tables[i].x, 2.25, tables[i].z));
const callBell = bubble('bell', T5.x - 0.35, 2.35, T5.z);
const callBill = bubble('conta', T5.x + 0.4, 2.35, T5.z);
const freeOk = bubble('ok', T5.x, 2.35, T5.z);
const showBubble = (s, t, t0, t1, size = 0.7) => {
  const on = t >= t0 && t < t1;
  const k = on ? back((t - t0) / 0.45) * (1 - smooth((t - (t1 - 0.3)) / 0.3)) : 0;
  s.visible = k > 0.001;
  const sz = size * Math.max(0, k);
  s.scale.set(sz, sz * 300 / 256, 1);
  s.material.rotation = on ? Math.sin((t - t0) * 20) * 0.18 * Math.exp(-(t - t0) * 2) : 0;
};

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight('#9fb6ff', '#3a2414', 0.55));
const key = new THREE.DirectionalLight('#ffe2bd', 2.1);
key.position.set(6, 12, 8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
scene.add(key);
const fill = new THREE.DirectionalLight('#6f8cff', 0.5);
fill.position.set(-8, 6, 6);
scene.add(fill);
const kitchenLight = new THREE.PointLight('#ffb35c', 6, 5, 1.5);
kitchenLight.position.set(4.3, 2.2, ROOM.z0 + 1.0);
scene.add(kitchenLight);

// ---------------------------------------------------------------- camera keys [t, pos, target, fov]
const C = (t, p, q, fov) => ({ t, p: new THREE.Vector3(...p), q: new THREE.Vector3(...q), fov });
const CAM = [
  C(0, [15, 17, 19], [0, 0.2, 0.9], 34),
  C(4.0, [13.5, 15.5, 19.5], [0, 0.2, 1.0], 33),
  C(5.6, [2.0, 3.0, 5.4], [-0.45, 0.9, 2.45], 34),
  C(7.0, [1.3, 3.5, 6.3], [-0.2, 0.8, 2.3], 34),
  C(16.2, [1.7, 3.9, 7.1], [-0.15, 0.75, 2.3], 34),
  C(17.6, [-2.4, 5.0, 7.6], [-0.75, -0.3, 3.4], 34),
  C(22.0, [-2.0, 5.4, 8.2], [-0.7, -0.3, 3.4], 34),
  C(23.2, [7.0, 4.4, 3.4], [5.4, 1.0, -1.3], 34),
  C(26.4, [7.4, 4.8, 3.8], [5.2, 1.0, -1.0], 34),
  C(29.6, [2.4, 6.2, 8.8], [0.8, 0.5, 2.2], 34),
  C(31.2, [2.6, 6.6, 9.4], [0.7, 0.4, 2.2], 34),
  C(35.5, [15, 17.5, 19.5], [0, -0.6, 0.9], 34),
];
function cameraAt(t) {
  let i = 0;
  while (i < CAM.length - 2 && t > CAM[i + 1].t) i++;
  const a = CAM[i], b = CAM[i + 1];
  const k = ease((t - a.t) / (b.t - a.t));
  camera.position.lerpVectors(a.p, b.p, k);
  const q = new THREE.Vector3().lerpVectors(a.q, b.q, k);
  camera.fov = lerp(a.fov, b.fov, k);
  camera.lookAt(q);
  camera.updateProjectionMatrix();
}

// ---------------------------------------------------------------- the timeline
function update(t) {
  cameraAt(t);
  // Candles flicker.
  candleLights.forEach(({ L, flame, i }) => {
    const f = 1 + 0.12 * Math.sin(t * 13 + i * 2.1) + 0.07 * Math.sin(t * 29 + i);
    if (L) L.intensity = 3.2 * f;
    flame.scale.set(f, 1.6 * f, f);
  });
  // Guests: idle breathing, small head turns.
  tables.forEach(({ people }, ti) => people.forEach((p, k) => {
    if (!p) return;
    p.torso.scale.y = 1 + 0.015 * Math.sin(t * 2 + ti + k);
    p.head.rotation.y = 0.25 * Math.sin(t * 0.7 + ti * 1.7 + k * 2);
    p.head.rotation.x = 0.06 * Math.sin(t * 1.1 + ti);
  }));
  // Rush hour hands: guests at the calling tables raise an arm.
  [[0, 1.0], [2, 1.35], [5, 1.7], [3, 2.05]].forEach(([ti, t0]) => {
    const p = tables[ti].people.find(Boolean);
    const up = t >= t0 && t < 4.2 ? back((t - t0) / 0.4) : 0;
    p.armR.rotation.x = lerp(-0.9, -2.9, up);
    p.armR.rotation.z = up * 0.25 * Math.sin(t * 14);
  });
  rushBubbles.forEach((b, i) => showBubble(b, t, 1.0 + i * 0.35, 4.2, 0.75));

  // Guest A picks up the phone and scans the QR; keeps it up while ordering.
  const aUp = smooth((t - 4.4) / 0.5) * (1 - smooth((t - 16.4) / 0.6));
  phoneA.visible = t > 4.4 && t < 17;
  guestA.armR.rotation.x = lerp(-0.9, -1.55, aUp);
  guestA.armR.rotation.z = -0.25 * aUp;
  guestA.head.rotation.x = 0.3 * aUp;
  const scan = clamp((t - 5.1) / 0.9);
  scanBeam.material.opacity = t > 5.1 && t < 6.0 ? 1 : 0;
  scanBeam.position.y = lerp(1.03, 0.82, (1 - Math.cos(scan * Math.PI * 2)) / 2);
  qrFace.material.emissiveIntensity = t > 4.6 && t < 7.4 ? 0.35 + 0.25 * Math.sin(t * 9) : 0;
  // Friend B joins with the code.
  const bUp = smooth((t - 16.6) / 0.5) * (1 - smooth((t - 21.6) / 0.5));
  phoneB.visible = t > 16.6 && t < 22.2;
  guestB.armR.rotation.x = lerp(-0.9, -1.55, bUp);
  guestB.head.rotation.x = 0.3 * bUp;
  // Ring of "mesma conta" under table 5 while both are in.
  const ringK = t > 19 && t < 22 ? smooth((t - 19) / 0.5) * (1 - smooth((t - 21.5) / 0.5)) : t > 30.2 ? smooth((t - 30.2) / 0.5) : 0;
  ringMat.opacity = ringK * (0.6 + 0.3 * Math.sin(t * 6));
  ringMat.color.set(t > 30 ? '#22c55e' : '#4d8dff');

  // Calls from table 5 and the waiter.
  showBubble(callBell, t, 24.6, 27.4, 0.62);
  showBubble(callBill, t, 25.1, 30.0, 0.62);
  showBubble(freeOk, t, 30.2, 36, 0.7);

  // Waiter: rush around (0–4.4), at the pass checking the phone (from 22), walks to table 5 (26.6–29.4).
  let route, k, moving;
  if (t < 4.6) { route = R.rush; k = clamp((t - 0.2) / 4.4); moving = true; }
  else if (t < 26.6) { route = R.toKitchen; k = 0; moving = false; }
  else { route = R.serve; k = ease((t - 26.6) / 2.8); moving = t < 29.4; }
  const { p, dir } = polyAt(route, k);
  waiter.g.position.set(p[0], 0, p[1]);
  waiter.g.rotation.y = t >= 4.6 && t < 26.6 ? 0.47 : Math.atan2(dir[0], dir[1]);
  if (t >= 29.4) waiter.g.rotation.y = Math.atan2(T5.x - p[0], T5.z - p[1]);
  const step = moving ? Math.sin(t * (t < 4.6 ? 16 : 11)) : 0;
  waiter.legs[0].rotation.x = 0.6 * step;
  waiter.legs[1].rotation.x = -0.6 * step;
  waiter.g.position.y = moving ? Math.abs(step) * 0.05 : 0;
  const onPhone = t > 22.4 && t < 26.6;
  phoneW.visible = onPhone || (t > 29.4 && t < 31.5);
  waiter.armL.rotation.x = onPhone || (t > 29.4 && t < 31.5) ? -1.5 : -0.2 + 0.4 * step;
  waiter.armR.rotation.x = -1.4;
  tray.visible = t < 4.6 || t > 26.6;
  waiter.head.rotation.x = onPhone ? 0.35 : 0;
}

// ---------------------------------------------------------------- render API
window.renderFrame = (t, w, h) => {
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  update(t);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/jpeg', 0.92);
};
await document.fonts.load('800 64px Inter');
signTex.needsUpdate = true;
window.sceneReady = true;
