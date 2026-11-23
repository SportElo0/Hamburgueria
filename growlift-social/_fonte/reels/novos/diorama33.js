// Reel 33 · "Quatro estrelas de diferença": our own 3D restaurant (Three.js, rendered frame by frame), built on the
// look of the Reel 10 diorama (wood floor, blue booths). Table 7 is the hero: the customer waits with his hand up, the
// waiter runs past, the 10 tables call at once, the QR card swap, the 3D burger rising on the table at real size,
// the kitchen screen getting "Mesa 7", the burger served. window.dio.draw(t) draws time t (pure function of t);
// window.dio.project(x,y,z) gives screen pixels for overlays; window.ready resolves once the burger GLB is parsed.
// The phone screens are HTML in reel33.mjs (crisp text), drawn over this scene.
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
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b1020');
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.42;
const camera = new THREE.PerspectiveCamera(34, W / H, 0.02, 80);

// ---------------------------------------------------------------- helpers
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const back = (x) => { x = clamp(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, k) => a + (b - a) * k;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0, ...o });
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
  t.userData.canvas = c;
  return t;
}
let seed = 33;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---------------------------------------------------------------- room
const ROOM = { x0: -6, x1: 6, z0: -2.3, z1: 8.2 };
const RW = ROOM.x1 - ROOM.x0, RD = ROOM.z1 - ROOM.z0, CZ = (ROOM.z0 + ROOM.z1) / 2;
const woodTex = canvasTex(1024, 1024, (g, w, h) => {
  const rows = 16, ph = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = -rnd() * 300;
    while (x < w) {
      const len = 220 + rnd() * 260;
      g.fillStyle = `hsl(${30 + rnd() * 8},${55 + rnd() * 12}%,${36 + rnd() * 10}%)`;
      g.fillRect(x, r * ph, len, ph);
      g.globalAlpha = 0.12;
      for (let k = 0; k < 6; k++) { g.fillStyle = rnd() > 0.5 ? '#000' : '#fff'; g.fillRect(x, r * ph + rnd() * ph, len, 1 + rnd() * 2); }
      g.globalAlpha = 1;
      g.fillStyle = 'rgba(30,14,4,.55)'; g.fillRect(x, r * ph, 3, ph);
      x += len;
    }
    g.fillStyle = 'rgba(30,14,4,.6)'; g.fillRect(0, r * ph, w, 3);
  }
});
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
woodTex.repeat.set(RW / 4, RD / 4);
add(scene, new THREE.BoxGeometry(RW, 0.2, RD), mat('#ffffff', { map: woodTex, roughness: 0.5 }), 0, -0.1, CZ, false);

const wallH = 3.4;
const wallMat = mat('#16244a', { roughness: 0.9 });
const wains = mat('#0f1a36', { roughness: 0.8 });
const trim = mat('#c08a4a');
// back (behind the hero), left, right and front walls
add(scene, new THREE.BoxGeometry(RW, wallH, 0.2), wallMat, 0, wallH / 2, ROOM.z0 - 0.1);
add(scene, new THREE.BoxGeometry(0.2, wallH, RD), wallMat, ROOM.x0 - 0.1, wallH / 2, CZ);
add(scene, new THREE.BoxGeometry(0.2, wallH, RD), wallMat, ROOM.x1 + 0.1, wallH / 2, CZ);
add(scene, new THREE.BoxGeometry(RW, wallH, 0.2), wallMat, 0, wallH / 2, ROOM.z1 + 0.1);
add(scene, new THREE.BoxGeometry(RW, 1.0, 0.06), wains, 0, 0.5, ROOM.z0 + 0.03);
add(scene, new THREE.BoxGeometry(RW, 0.05, 0.1), trim, 0, 1.02, ROOM.z0 + 0.05);
add(scene, new THREE.BoxGeometry(0.06, 1.0, RD), wains, ROOM.x0 + 0.03, 0.5, CZ);
add(scene, new THREE.BoxGeometry(0.06, 1.0, RD), wains, ROOM.x1 - 0.03, 0.5, CZ);
add(scene, new THREE.BoxGeometry(RW, 1.0, 0.06), wains, 0, 0.5, ROOM.z1 - 0.03);
// ceiling (only seen from low angles)

const nightTex = canvasTex(256, 384, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#0b1636'); gr.addColorStop(1, '#1c2f66');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, rnd() * 1.6 + 0.3, 0, 7); g.fill(); }
  g.fillStyle = '#e8eefc'; g.beginPath(); g.arc(w * 0.72, h * 0.22, 20, 0, 7); g.fill();
});
function windowAt(x, z, ry) {
  const win = new THREE.Group();
  add(win, new THREE.BoxGeometry(1.25, 1.7, 0.12), trim, 0, 0, 0);
  add(win, new THREE.PlaneGeometry(1.1, 1.55), new THREE.MeshBasicMaterial({ map: nightTex }), 0, 0, 0.07, false);
  add(win, new THREE.BoxGeometry(0.04, 1.55, 0.05), trim, 0, 0, 0.09);
  add(win, new THREE.BoxGeometry(1.1, 0.04, 0.05), trim, 0, 0, 0.09);
  win.position.set(x, 2.05, z);
  win.rotation.y = ry;
  scene.add(win);
}
windowAt(ROOM.x0 + 0.02, 1.4, Math.PI / 2);
windowAt(ROOM.x0 + 0.02, 5.2, Math.PI / 2);
windowAt(-3.2, ROOM.z1 - 0.02, Math.PI);
windowAt(3.2, ROOM.z1 - 0.02, Math.PI);
// front door
add(scene, new THREE.BoxGeometry(1.1, 2.3, 0.1), mat('#5a3420'), 0, 1.15, ROOM.z1 - 0.05);
add(scene, new THREE.BoxGeometry(0.06, 0.06, 0.08), mat('#e3c06a', { metalness: 0.8, roughness: 0.3 }), 0.38, 1.1, ROOM.z1 - 0.12);
const artTex = (hue) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f3ecdf'; g.fillRect(0, 0, w, h);
  g.fillStyle = `hsl(${hue},70%,45%)`; g.beginPath(); g.arc(w * 0.5, h * 0.55, w * 0.3, 0, 7); g.fill();
  g.fillStyle = '#16244a'; g.fillRect(w * 0.15, h * 0.2, w * 0.7, h * 0.08);
});
[[-3.4, 215], [-0.9, 28], [1.4, 160]].forEach(([x, hue]) => {
  add(scene, new THREE.BoxGeometry(0.95, 0.95, 0.06), trim, x, 2.15, ROOM.z0 + 0.04);
  add(scene, new THREE.PlaneGeometry(0.8, 0.8), mat('#fff', { map: artTex(hue), roughness: 0.9 }), x, 2.15, ROOM.z0 + 0.08, false);
});

// ---------------------------------------------------------------- kitchen pass + screen (back right)
const KX = 3.9, KZ = -1.35;
const kitchen = new THREE.Group();
add(kitchen, rbox(2.6, 1.05, 0.6, 0.05), mat('#2a1a10'), 0, 0.525, 0);
add(kitchen, rbox(2.7, 0.07, 0.72, 0.03), mat('#d9d4cc', { roughness: 0.35 }), 0, 1.08, 0);
[-0.8, 0.0].forEach((x) => {
  add(kitchen, new THREE.CylinderGeometry(0.2, 0.17, 0.03, 24), mat('#f5f5f0', { roughness: 0.3 }), x, 1.13, 0.05);
});
add(kitchen, new THREE.SphereGeometry(0.08, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e3c06a', { metalness: 0.8, roughness: 0.25 }), 1.1, 1.11, 0.14);
kitchen.position.set(KX, 0, KZ);
scene.add(kitchen);
// the kitchen screen (orders in arrival order); redrawn when Mesa 7 arrives
const TV = { w: 1.5, h: 0.84 };
let tvState = -1;
const tvTex = canvasTex(1024, 576, () => {});
function drawTv(stage, tSince) {
  const c = tvTex.userData.canvas, g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8eefc'; g.font = '800 44px Inter, sans-serif'; g.textBaseline = 'top';
  g.fillText('Cozinha', 40, 30);
  g.fillStyle = '#8fa0bf'; g.font = '600 26px Inter, sans-serif'; g.fillText('por ordem de chegada', 230, 44);
  const card = (x, mesa, itens, tempo, novo) => {
    g.fillStyle = novo ? '#0f2a1d' : '#152038'; g.beginPath(); g.roundRect(x, 110, 300, 420, 22); g.fill();
    g.strokeStyle = novo ? '#34d27b' : '#2a3a5c'; g.lineWidth = novo ? 6 : 3; g.stroke();
    g.fillStyle = '#ffffff'; g.font = '900 52px Inter, sans-serif'; g.fillText(mesa, x + 24, 136);
    g.fillStyle = '#c7d2e6'; g.font = '600 30px Inter, sans-serif';
    itens.forEach((it, i) => g.fillText(it, x + 24, 220 + i * 46));
    if (novo) { g.fillStyle = '#34d27b'; g.beginPath(); g.roundRect(x + 24, 400, 130, 50, 25); g.fill(); g.fillStyle = '#062012'; g.font = '900 28px Inter, sans-serif'; g.fillText('NOVO', x + 48, 410); }
    g.fillStyle = novo ? '#34d27b' : '#8fa0bf'; g.font = '800 34px Inter, sans-serif'; g.fillText(tempo, x + 24, 470);
  };
  card(40, 'Mesa 3', ['2× X-salada', '1× Suco'], '07:52', false);
  card(362, 'Mesa 5', ['1× Fritas G', '2× Refri'], '03:10', false);
  if (stage >= 1) card(684, 'Mesa 7', ['1× Hambúrguer', '   clássico'], '00:0' + Math.min(9, Math.floor(tSince)), true);
  tvTex.needsUpdate = true;
}
const tvGroup = new THREE.Group();
add(tvGroup, rbox(TV.w + 0.08, TV.h + 0.08, 0.06, 0.02), mat('#05070c', { roughness: 0.4 }), 0, 0, 0);
add(tvGroup, new THREE.PlaneGeometry(TV.w, TV.h), new THREE.MeshBasicMaterial({ map: tvTex }), 0, 0, 0.035, false);
tvGroup.position.set(KX, 2.3, ROOM.z0 + 0.06);
scene.add(tvGroup);

// ---------------------------------------------------------------- people
const SKIN = ['#f1c7a3', '#c98e64', '#8d5a3b', '#e0ac85', '#6e4229'];
const HAIRC = ['#2b1a12', '#5a3a22', '#111', '#b9853c', '#3d2a1e'];
const dark = mat('#1b1b1b');
function person({ shirt, skin = 0, hair = 0, seated = true, long = false, apron = false, chef = false, hero = false }) {
  const g = new THREE.Group();
  const sm = mat(shirt), km = mat(SKIN[skin], { roughness: 0.6 }), hm = mat(HAIRC[hair], { roughness: 0.7 });
  const torsoY = seated ? 0.72 : 1.1;
  const torso = add(g, new THREE.CapsuleGeometry(0.2, 0.3, 6, 14), sm, 0, torsoY, 0);
  torso.scale.set(1.05, 1, 0.8);
  if (apron) add(g, new THREE.BoxGeometry(0.34, 0.5, 0.05), mat('#1a1a1a'), 0, torsoY - 0.12, 0.15);
  const head = new THREE.Group();
  add(head, new THREE.SphereGeometry(0.17, 28, 20), km, 0, 0, 0);
  const cap = add(head, new THREE.SphereGeometry(0.18, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hm, 0, 0.02, -0.01);
  cap.rotation.x = -0.25;
  if (long) add(head, new THREE.CapsuleGeometry(0.15, 0.22, 4, 12), hm, 0, -0.12, -0.08);
  if (hero) for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; add(head, new THREE.SphereGeometry(0.06, 12, 10), hm, Math.cos(a) * 0.11, 0.15 + Math.sin(i * 1.7) * 0.015, Math.sin(a) * 0.09 - 0.02, false); }
  if (chef) { add(head, new THREE.CylinderGeometry(0.15, 0.13, 0.16, 20), mat('#ffffff'), 0, 0.22, -0.01); add(head, new THREE.SphereGeometry(0.17, 20, 14), mat('#ffffff'), 0, 0.33, -0.01); }
  const eyeL = add(head, new THREE.SphereGeometry(0.024, 10, 8), dark, -0.06, 0.01, 0.156, false);
  const eyeR = add(head, new THREE.SphereGeometry(0.024, 10, 8), dark, 0.06, 0.01, 0.156, false);
  const mouth = add(head, new THREE.SphereGeometry(0.03, 14, 10), mat('#4a1d1d', { roughness: 0.5 }), 0, -0.075, 0.152, false);
  mouth.scale.set(1.25, 0.25, 0.4);
  add(head, new THREE.SphereGeometry(0.028, 10, 8), mat('#f08a7e', { transparent: true, opacity: 0.55 }), -0.1, -0.035, 0.13, false).scale.set(1, 0.6, 0.5);
  add(head, new THREE.SphereGeometry(0.028, 10, 8), mat('#f08a7e', { transparent: true, opacity: 0.55 }), 0.1, -0.035, 0.13, false).scale.set(1, 0.6, 0.5);
  const brows = [];
  for (const s of [-1, 1]) { const b = add(head, new THREE.BoxGeometry(0.05, 0.011, 0.01), mat(HAIRC[hair]), s * 0.06, 0.06, 0.158, false); brows.push(b); }
  if (hero) {
    const gm = mat('#121212', { roughness: 0.3 });
    for (const s of [-1, 1]) add(head, new THREE.TorusGeometry(0.042, 0.007, 8, 24), gm, s * 0.062, 0.01, 0.162, false);
    add(head, new THREE.BoxGeometry(0.035, 0.007, 0.007), gm, 0, 0.018, 0.168, false);
  }
  head.position.y = torsoY + 0.4;
  g.add(head);
  const arm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.24, torsoY + 0.17, 0);
    const a = add(pivot, new THREE.CapsuleGeometry(0.06, 0.26, 4, 10), sm, 0, -0.17, 0);
    const hand = add(a, new THREE.SphereGeometry(0.065, 12, 10), km, 0, -0.18, 0);
    g.add(pivot);
    pivot.userData.hand = hand;
    return pivot;
  };
  const armL = arm(-1), armR = arm(1);
  const legs = [];
  if (seated) {
    for (const s of [-1, 1]) { const l = add(g, new THREE.CapsuleGeometry(0.075, 0.32, 4, 10), mat('#26304a'), s * 0.1, 0.5, 0.22); l.rotation.x = Math.PI / 2; }
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
  return { g, head, armL, armR, legs, torso, eyeL, eyeR, mouth, brows };
}

// ---------------------------------------------------------------- tables, booths, guests
const boothMat = mat('#1f4fe0', { roughness: 0.55 });
const boothDark = mat('#173aa8', { roughness: 0.6 });
const topMat = mat('#9a5a2b', { roughness: 0.45 });
const plateMat = mat('#f5f5f0', { roughness: 0.3 });
function booth(parent, z, facing) {
  const b = new THREE.Group();
  add(b, rbox(1.5, 0.42, 0.62, 0.1), boothMat, 0, 0.21, 0);
  add(b, rbox(1.5, 0.75, 0.2, 0.09), boothDark, 0, 0.75, -0.3);
  add(b, rbox(1.5, 0.12, 0.62, 0.06), boothMat, 0, 0.45, 0);
  b.position.z = z;
  b.rotation.y = facing;
  parent.add(b);
}
const lampLights = [];
function pendant(x, z, light) {
  const p = new THREE.Group();
  add(p, new THREE.CylinderGeometry(0.008, 0.008, 1.2, 6), dark, 0, 0.6, 0, false);
  add(p, new THREE.ConeGeometry(0.22, 0.2, 24, 1, true), mat('#1c2b55', { side: THREE.DoubleSide, roughness: 0.5 }), 0, 0, 0, false);
  add(p, new THREE.SphereGeometry(0.06, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffd38a' }), 0, -0.07, 0, false);
  p.position.set(x, 2.15, z);
  scene.add(p);
  if (light) { const L = new THREE.PointLight('#ffc477', 4.5, 4.2, 1.5); L.position.set(x, 1.95, z); scene.add(L); lampLights.push(L); }
}
function table(x, z, guests, { heroTable = false, light = false } = {}) {
  const t = new THREE.Group();
  t.position.set(x, 0, z);
  add(t, rbox(1.25, 0.07, 0.82, 0.03), topMat, 0, 0.76, 0);
  add(t, new THREE.CylinderGeometry(0.05, 0.05, 0.72, 10), dark, 0, 0.37, 0);
  add(t, new THREE.CylinderGeometry(0.28, 0.32, 0.03, 20), dark, 0, 0.015, 0);
  booth(t, -0.78, 0);
  if (!heroTable) booth(t, 0.78, Math.PI);
  else {
    // an empty chair on the camera side
    const ch = new THREE.Group();
    add(ch, rbox(0.46, 0.06, 0.44, 0.02), mat('#c0392b'), 0, 0.46, 0);
    add(ch, rbox(0.46, 0.5, 0.05, 0.02), mat('#c0392b'), 0, 0.74, 0.2);
    for (const [a, b] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) add(ch, new THREE.CylinderGeometry(0.02, 0.02, 0.46, 8), dark, a, 0.23, b);
    ch.position.set(0, 0, 0.82);
    t.add(ch);
  }
  if (!heroTable) {
    add(t, new THREE.CylinderGeometry(0.15, 0.13, 0.02, 20), plateMat, -0.25, 0.81, -0.15);
    add(t, new THREE.CylinderGeometry(0.15, 0.13, 0.02, 20), plateMat, 0.1, 0.81, 0.2);
  }
  const people = guests.map((p, k) => {
    if (!p) return null;
    const o = person(p);
    o.g.position.set(k === 0 ? -0.2 : 0.2, 0, k === 0 ? -0.72 : 0.72);
    o.g.rotation.y = k === 0 ? 0 : Math.PI;
    o.armL.rotation.x = -0.9; o.armR.rotation.x = -0.9;
    t.add(o.g);
    return o;
  });
  scene.add(t);
  pendant(x, z, heroTable || light);
  return { g: t, x, z, people };
}
const hero = table(0, 0, [], { heroTable: true });
const OTHERS = [
  [-3.3, 0.2, [{ shirt: '#e85d75', skin: 0, hair: 1, long: true }, { shirt: '#2e8b57', skin: 2, hair: 2 }]],
  [3.0, 1.0, [{ shirt: '#f2b134', skin: 3, hair: 0 }, { shirt: '#7b61ff', skin: 1, hair: 3, long: true }]],
  [-3.3, 3.6, [{ shirt: '#e0e4ea', skin: 4, hair: 2 }, { shirt: '#ff7a45', skin: 0, hair: 4 }]],
  [0, 3.8, [{ shirt: '#ff5e7e', skin: 0, hair: 1, long: true }, { shirt: '#3fb6a8', skin: 1, hair: 0 }]],
  [3.3, 4.0, [{ shirt: '#4d8dff', skin: 2, hair: 2 }, { shirt: '#f2b134', skin: 3, hair: 1, long: true }]],
  [-1.7, 6.5, [{ shirt: '#9b59b6', skin: 1, hair: 0 }, { shirt: '#e67e22', skin: 3, hair: 2, long: true }]],
  [1.9, 6.5, [{ shirt: '#16a085', skin: 2, hair: 3 }, { shirt: '#c0392b', skin: 0, hair: 1 }]],
];
const others = OTHERS.map(([x, z, gs], i) => table(x, z, gs, { light: i === 1 || i === 3 }));

// the customer at table 7 (sits on the back booth, faces the camera side +z)
const cust = person({ shirt: '#e8a33a', skin: 3, hair: 0, hero: true });
cust.g.position.set(0, 0, -0.72);
hero.g.add(cust.g);
// table 7 props: QR stand (our table card), soda, napkins, an empty plate
const qrTex = canvasTex(320, 420, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#0865fe'; g.fillRect(0, 0, w, 86);
  g.fillStyle = '#ffffff'; g.font = '900 40px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('MESA 7', w / 2, 58);
  const n = 21, s = 11, ox = (w - n * s) / 2, oy = 112;
  let sd = 7; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  g.fillStyle = '#111';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) && r() > 0.5) g.fillRect(ox + x * s, oy + y * s, s, s);
  const finder = (x, y) => { g.fillStyle = '#111'; g.fillRect(ox + x * s, oy + y * s, 7 * s, 7 * s); g.fillStyle = '#fff'; g.fillRect(ox + (x + 1) * s, oy + (y + 1) * s, 5 * s, 5 * s); g.fillStyle = '#111'; g.fillRect(ox + (x + 2) * s, oy + (y + 2) * s, 3 * s, 3 * s); };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  g.fillStyle = '#121826'; g.font = '800 26px Inter, sans-serif'; g.fillText('Peça e pague aqui', w / 2, 384);
});
const qrStand = new THREE.Group();
add(qrStand, new THREE.BoxGeometry(0.16, 0.21, 0.012), mat('#ffffff'), 0, 0.105, 0);
add(qrStand, new THREE.PlaneGeometry(0.152, 0.2), new THREE.MeshStandardMaterial({ map: qrTex, roughness: 0.6 }), 0, 0.105, 0.0075, false);
add(qrStand, new THREE.BoxGeometry(0.17, 0.02, 0.08), dark, 0, 0.01, 0);
qrStand.position.set(0.36, 0.795, -0.12);
qrStand.rotation.set(-0.1, -0.35, 0);
hero.g.add(qrStand);
add(hero.g, new THREE.CylinderGeometry(0.035, 0.03, 0.12, 16), mat('#d9e6ff', { transparent: true, opacity: 0.55, roughness: 0.1 }), -0.42, 0.855, 0.05);
add(hero.g, new THREE.CylinderGeometry(0.031, 0.028, 0.08, 16), mat('#5a2b12', { roughness: 0.3 }), -0.42, 0.835, 0.05, false);
add(hero.g, rbox(0.1, 0.12, 0.06, 0.01), mat('#c9ced8', { metalness: 0.6, roughness: 0.35 }), -0.45, 0.85, -0.25);
const heroPlate = add(hero.g, new THREE.CylinderGeometry(0.15, 0.13, 0.02, 24), plateMat, 0, 0.81, 0.08);

// the card the customer holds up (PDF menu, then our QR)
const pdfTex = canvasTex(320, 420, (g, w, h) => {
  g.fillStyle = '#efe6d6'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#6b5a45'; g.font = '800 34px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('CARDÁPIO', w / 2, 60);
  let sd = 3; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  g.fillStyle = '#6b5a45';
  for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) if (r() > 0.55) g.fillRect(70 + x * 12, 90 + y * 12, 12, 12);
  g.fillStyle = '#d93025'; g.beginPath(); g.roundRect(100, 300, 120, 56, 10); g.fill();
  g.fillStyle = '#ffffff'; g.font = '900 34px Inter, sans-serif'; g.fillText('PDF', w / 2, 340);
  g.fillStyle = '#8a7a66'; g.font = '600 20px Inter, sans-serif'; g.fillText('cardapio_final_v3.pdf · 18 MB', w / 2, 392);
});
const cardMat = new THREE.MeshStandardMaterial({ map: pdfTex, roughness: 0.7, side: THREE.DoubleSide });
const heldCard = new THREE.Group();
add(heldCard, new THREE.PlaneGeometry(0.3, 0.4), cardMat, 0, 0, 0, false);
cust.armR.userData.hand.add(heldCard);
heldCard.position.set(-0.02, -0.12, 0.05);
heldCard.visible = false;
// phone in the customer's hand (third-person shots)
const phoneScreenTex = canvasTex(180, 360, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#121826'; g.font = '800 18px Inter, sans-serif'; g.fillText('Sua avaliação', 16, 40);
  g.fillStyle = '#fbbc04'; g.font = '30px sans-serif'; g.fillText('★★★★★', 14, 88);
  g.fillStyle = '#4a5568'; g.font = '600 14px Inter, sans-serif'; g.fillText('O lanche, nota 10.', 16, 122);
  g.fillStyle = '#15803d'; g.beginPath(); g.roundRect(16, 300, 148, 36, 18); g.fill(); g.fillStyle = '#fff'; g.font = '800 16px Inter, sans-serif'; g.fillText('Publicado ✓', 40, 324);
});
const custPhone = new THREE.Group();
add(custPhone, rbox(0.075, 0.15, 0.012, 0.01), mat('#0b0f17', { roughness: 0.3 }), 0, 0, 0);
add(custPhone, new THREE.PlaneGeometry(0.066, 0.135), new THREE.MeshBasicMaterial({ map: phoneScreenTex }), 0, 0, 0.007, false);
cust.armR.userData.hand.add(custPhone);
custPhone.position.set(0, -0.06, 0.05);
custPhone.visible = false;

// waiter and chef
const waiter = person({ shirt: '#f4f6fa', skin: 1, hair: 2, seated: false, apron: true });
scene.add(waiter.g);
const tray = new THREE.Group();
add(tray, new THREE.CylinderGeometry(0.22, 0.22, 0.02, 24), mat('#c9ced8', { metalness: 0.7, roughness: 0.3 }), 0, 0, 0);
add(tray, new THREE.CylinderGeometry(0.06, 0.05, 0.14, 12), mat('#e8a03c', { transparent: true, opacity: 0.9 }), 0.08, 0.08, 0.02);
add(tray, new THREE.CylinderGeometry(0.06, 0.05, 0.14, 12), mat('#7a2a12', { transparent: true, opacity: 0.9 }), -0.07, 0.08, -0.04);
waiter.armR.add(tray); tray.position.set(0.05, -0.38, 0.14);
const tray2 = tray.clone(); waiter.armL.add(tray2); tray2.position.set(-0.05, -0.38, 0.14);
const servePlate = new THREE.Group();
add(servePlate, new THREE.CylinderGeometry(0.15, 0.13, 0.02, 24), plateMat, 0, 0, 0);
waiter.armR.add(servePlate); servePlate.position.set(0.04, -0.4, 0.16);
const chef = person({ shirt: '#ffffff', skin: 2, hair: 2, seated: false, chef: true });
chef.g.position.set(KX + 0.4, 0, KZ - 0.55);
scene.add(chef.g);

// ---------------------------------------------------------------- the burger (GLB from the panel's demo menu)
let burgerProto = null;
const arBurger = new THREE.Group(), servedBurger = new THREE.Group();
hero.g.add(arBurger);
arBurger.position.set(0, 0.822, 0.08);
servePlate.add(servedBurger);
servedBurger.position.set(0, 0.012, 0);
window.ready = new Promise((resolve) => {
  const b64 = window.BURGER_B64;
  if (!b64) return resolve();
  const bin = atob(b64), buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  new GLTFLoader().parse(buf.buffer, '', (gltf) => {
    burgerProto = gltf.scene;
    burgerProto.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.material = o.material.clone(); } });
    // sit it on its base (the file is centred on its middle)
    const box = new THREE.Box3().setFromObject(burgerProto);
    burgerProto.position.y -= box.min.y;
    const a = burgerProto.clone(true);
    a.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; } });
    arBurger.add(a);
    servedBurger.add(burgerProto.clone(true));
    resolve();
  }, () => resolve());
});
// AR helpers on the table: scan ring and a soft beam
const ringMat = new THREE.MeshBasicMaterial({ color: '#4d8dff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
const arRing = add(hero.g, new THREE.RingGeometry(0.09, 0.105, 64), ringMat, 0, 0.824, 0.08, false);
arRing.rotation.x = -Math.PI / 2;
const discMat = new THREE.MeshBasicMaterial({ color: '#4d8dff', transparent: true, opacity: 0, depthWrite: false });
const arDisc = add(hero.g, new THREE.CircleGeometry(0.09, 48), discMat, 0, 0.823, 0.08, false);
arDisc.rotation.x = -Math.PI / 2;
const beamMat = new THREE.MeshBasicMaterial({ color: '#8fb8ff', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
const arBeam = add(hero.g, new THREE.CylinderGeometry(0.085, 0.09, 0.22, 40, 1, true), beamMat, 0, 0.93, 0.08, false);

// call bubbles (a bell) above the tables that are waiting
function bubbleTex(kind) {
  return canvasTex(256, 300, (g, w) => {
    g.fillStyle = kind === 'ok' ? '#16a34a' : '#0865fe';
    g.beginPath(); g.roundRect(18, 18, w - 36, 200, 56); g.fill();
    g.beginPath(); g.moveTo(w / 2 - 30, 214); g.lineTo(w / 2, 262); g.lineTo(w / 2 + 30, 214); g.fill();
    g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
    g.save(); g.translate(w / 2 - 66, 52); g.scale(5.5, 5.5); g.lineWidth = 2.2;
    g.stroke(new Path2D(kind === 'ok' ? 'm5 12.5 4.5 4.5L19 7.5' : 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20.5a2 2 0 0 0 4 0'));
    g.restore();
  });
}
const BELL = bubbleTex('bell');
const bells = [hero, ...others].map((tb) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: BELL, transparent: true, depthTest: false }));
  s.position.set(tb.x, 2.0, tb.z);
  s.renderOrder = 10;
  s.scale.set(0, 0, 0);
  scene.add(s);
  return s;
});

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight('#bcd0ff', '#2a1a10', 0.8));
const key = new THREE.DirectionalLight('#ffe2b8', 1.6);
key.position.set(4, 7, 6);
key.target.position.set(0, 0, 1.5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 20 });
key.shadow.bias = -0.0004;
scene.add(key, key.target);
const fill = new THREE.PointLight('#9fb8ff', 2.2, 6, 1.6);
fill.position.set(-1.2, 1.6, 1.8);
scene.add(fill);

// ---------------------------------------------------------------- timeline
// camera shots [start, pos, look, fov]; two keys at almost the same time = a cut
const S = (t, p, q, f) => ({ t, p, q, f });
const POV = (t) => S(t, [0, 1.18, -0.6], [0, 0.88, 1.6], 50);
const SHOTS = [
  S(0, [0.95, 1.32, 2.5], [-0.05, 1.18, -0.6], 44), S(2.14, [0.82, 1.3, 2.2], [-0.05, 1.18, -0.6], 42),
  POV(2.15), POV(3.74),
  S(3.75, [-1.3, 1.2, 1.7], [0.1, 1.08, -0.6], 36), S(6.09, [-1.12, 1.18, 1.42], [0.1, 1.08, -0.6], 33),
  S(6.1, [1.2, 7.8, 10.9], [0, 0.2, 2.9], 54), S(10.39, [0.5, 7.2, 10.2], [0, 0.2, 2.7], 50),
  S(10.4, [0.05, 1.12, 1.55], [0.02, 1.0, -0.62], 36), S(14.49, [0.02, 1.11, 1.3], [0.02, 1.0, -0.62], 34),
  S(14.5, [0, 1.18, -0.6], [0.12, 0.8, 0.3], 50), S(18.39, [0, 1.18, -0.6], [0.12, 0.8, 0.3], 50),
  S(18.4, [0.6, 1.04, 0.8], [0, 0.86, 0.07], 34), S(23.59, [0.28, 0.99, 0.56], [0, 0.86, 0.07], 30),
  POV(23.6), POV(25.09),
  S(25.1, [3.72, 1.95, 0.45], [KX, 2.12, ROOM.z0], 60), S(26.89, [3.8, 1.97, 0.25], [KX, 2.14, ROOM.z0], 56),
  S(26.9, [-1.25, 1.38, 2.1], [0.36, 1.05, -0.2], 44), S(28.39, [-1.1, 1.34, 1.85], [0.32, 1.05, -0.25], 42),
  S(28.4, [0.24, 1.12, 0.92], [0, 1.06, -0.62], 32), S(30.19, [0.2, 1.11, 0.8], [0, 1.06, -0.62], 30),
  POV(30.2), POV(39.09),
  S(39.1, [-0.22, 1.14, 1.02], [0, 1.03, -0.6], 32), S(41.29, [-0.16, 1.12, 0.9], [0, 1.03, -0.6], 30),
  S(41.3, [0.3, 1.22, 1.3], [0, 0.96, -0.4], 34), S(45.59, [0.9, 3.3, 5.6], [0, 0.8, 0], 34),
  POV(45.6), POV(47.99),
  S(48.0, [0.9, 3.3, 5.6], [0, 0.8, 0], 34), S(60, [1.6, 3.6, 6.4], [0, 0.8, 0], 34),
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
// waiter routes per shot [t0, t1, points]
const ROUTES = [
  [0.0, 2.15, [[2.3, -1.7], [-2.3, -1.7]]],
  [3.75, 6.1, [[0.7, 1.0], [2.6, 0.9], [3.2, -0.5]]],
  [6.1, 10.4, [[2.9, -0.6], [1.6, 2.2], [-1.6, 2.2], [-2.0, 5.2], [0.6, 5.3], [1.6, 2.4]]],
  [26.9, 28.0, [[2.6, 1.2], [0.85, -0.05]]],
];
const BOCA = window.BOCA || [];
const voice = (t) => BOCA[Math.min(BOCA.length - 1, Math.max(0, Math.floor(t * 30)))] || 0;
const SPEAKS = [[3.75, 6.1], [10.4, 14.5], [28.4, 30.2], [39.1, 41.3]];

function update(t) {
  const c = cameraAt(t);
  camera.position.set(...c.p);
  camera.fov = c.f;
  camera.updateProjectionMatrix();
  camera.lookAt(...c.q);

  // ---- customer
  const A = cust;
  A.armL.rotation.set(-0.9, 0, 0); A.armR.rotation.set(-0.9, 0, 0);
  A.head.rotation.set(0, 0, 0);
  A.eyeL.scale.set(1, 1, 1); A.eyeR.scale.set(1, 1, 1);
  A.brows.forEach((b, i) => { b.position.y = 0.06; b.rotation.z = 0; });
  heldCard.visible = false; custPhone.visible = false;
  const speaking = SPEAKS.some(([a, b]) => t >= a && t < b);
  A.mouth.scale.y = speaking ? 0.25 + voice(t) * 0.55 : 0.25;
  if (t < 2.15) {
    // hand up for half an hour (a tired wave), head following the waiter
    A.armR.rotation.set(0, 0, 2.75 + Math.sin(t * 7) * 0.12);
    A.head.rotation.y = lerp(0.5, -0.5, clamp(t / 2.1));
    A.brows.forEach((b, i) => { b.rotation.z = i ? -0.25 : 0.25; });
  } else if (t < 3.75) {
    A.armL.rotation.set(-1.2, 0, 0.2); A.armR.rotation.set(-1.2, 0, -0.2);
    A.head.rotation.x = 0.35;
  } else if (t < 6.1) {
    // "pera, pera!": both arms waving at the waiter who walks away
    const w = Math.sin(t * 11);
    A.armR.rotation.set(0, 0, 2.3 + w * 0.35);
    A.armL.rotation.set(0, 0, -2.3 + w * 0.35);
    A.head.rotation.y = 0.45;
    A.brows.forEach((b) => { b.position.y = 0.072; });
  } else if (t >= 10.4 && t < 14.5) {
    // holding the card up to the viewer
    heldCard.visible = true;
    A.armR.rotation.set(-1.75, 0, -0.55);
    const flip = t < 12.75 ? 1 : t < 13.05 ? Math.cos(((t - 12.75) / 0.3) * Math.PI) : 1;
    if (t >= 12.9 && cardMat.map !== qrTex) { cardMat.map = qrTex; cardMat.needsUpdate = true; }
    if (t < 12.9 && cardMat.map !== pdfTex) { cardMat.map = pdfTex; cardMat.needsUpdate = true; }
    heldCard.scale.x = Math.abs(flip) < 0.02 ? 0.02 : Math.abs(flip);
    heldCard.rotation.set(0.15, 0.2, 0.62);
    A.brows.forEach((b, i) => { b.rotation.z = t < 12.9 ? (i ? 0.2 : -0.2) : 0; b.position.y = t < 12.9 ? 0.06 : 0.07; });
    A.head.rotation.z = t < 12.9 ? 0.12 : -0.08;
  } else if (t >= 28.4 && t < 30.2) {
    // "hmm, que delícia": eyes closed, head tilted
    A.eyeL.scale.y = 0.2; A.eyeR.scale.y = 0.2;
    A.head.rotation.z = Math.sin((t - 28.4) * 3) * 0.12;
    A.armR.rotation.set(-2.05, 0, -0.75);
  } else if (t >= 39.1 && t < 41.3) {
    custPhone.visible = true;
    A.armR.rotation.set(-1.45, 0, -0.5);
    A.head.rotation.z = -0.1;
    A.brows.forEach((b, i) => { b.rotation.z = i ? 0.2 : -0.2; });
  } else if (t >= 41.3) {
    A.armL.rotation.set(-0.7, 0, 0); A.armR.rotation.set(-0.7, 0, 0);
  }

  // ---- waiter
  waiter.g.visible = false;
  servePlate.visible = false; tray.visible = true; tray2.visible = false;
  for (const [t0, t1, pts] of ROUTES) {
    if (t >= t0 && t < t1 + (t0 === 26.9 ? 3.3 : 0)) {
      const k = clamp((t - t0) / (t1 - t0));
      const kk = t0 === 26.9 ? eo(k) : k;
      const { p, dir } = polyAt(pts, kk);
      waiter.g.visible = true;
      waiter.g.position.set(p[0], Math.abs(Math.sin(t * 12)) * (k < 1 ? 0.03 : 0), p[1]);
      waiter.g.rotation.y = Math.atan2(dir[0], dir[1]);
      const walking = k < 1;
      waiter.legs.forEach((l, i) => { l.rotation.x = walking ? Math.sin(t * 12 + i * Math.PI) * 0.5 : 0; });
      waiter.armR.rotation.set(-1.45, 0, 0); waiter.armL.rotation.set(walking ? Math.sin(t * 12) * 0.4 : 0, 0, 0);
      waiter.head.rotation.y = 0;
      if (t0 === 6.1) { tray2.visible = true; waiter.armL.rotation.set(-1.45, 0, 0); }
      if (t0 === 0) waiter.head.rotation.y = 0.9;
      if (t0 === 26.9) {
        tray.visible = false;
        // arrives, faces the table and puts the plate down at 27.9
        if (k >= 1) waiter.g.rotation.y = -Math.PI / 2;
        servePlate.visible = t < 27.95;
        waiter.armR.rotation.set(t < 27.6 ? -1.45 : lerp(-1.45, -0.9, clamp((t - 27.6) / 0.35)), 0, 0);
      }
    }
  }
  // the burger on the table once served (and before, the AR one)
  const served = t >= 27.95 && t < 48;
  heroPlate.visible = true;

  // ---- AR burger on table 7 (18.4–23.6)
  const ar = t >= 18.8 && t < 24.6;
  arBurger.visible = (ar && !!burgerProto) || (served && !!burgerProto);
  const kAr = served ? 1 : eo((t - 19.0) / 1.4);
  arBurger.scale.setScalar(served ? 1 : 0.7 + 0.3 * back((t - 19.0) / 1.0));
  arBurger.rotation.y = served ? 0.4 : (t - 19) * 0.55;
  arBurger.position.y = 0.822 + (served ? 0 : (1 - kAr) * 0.06);
  arBurger.traverse((o) => { if (o.isMesh) o.material.opacity = served ? 1 : kAr; });
  const rk = ((t - 19.0) % 1.4) / 1.4;
  ringMat.opacity = ar && !served ? (1 - rk) * 0.9 : 0;
  arRing.scale.setScalar(1 + rk * 1.4);
  discMat.opacity = ar && !served ? 0.22 * clamp((t - 18.9) / 0.5) * (t > 23.2 ? clamp((24 - t) / 0.8) : 1) : 0;
  beamMat.opacity = ar && !served ? 0.35 * (1 - clamp((t - 19.0) / 1.6)) : 0;

  // ---- call bells (hero waiting at the start; every table at once in the wide shot)
  bells.forEach((s, i) => {
    let k = 0;
    if (i === 0 && t < 2.15) k = back(t / 0.4);
    if (t >= 6.1 && t < 10.4) k = back((t - 6.3 - i * 0.22) / 0.4) * (1 + Math.sin(t * 8 + i) * 0.05);
    const sz = i === 0 && t < 2.15 ? 0.32 : 0.55;
    s.scale.set(sz * k, sz * 1.17 * k, 1);
    s.position.y = (i === 0 && t < 2.15 ? 1.75 : 2.0) + Math.sin(t * 3 + i) * 0.03;
  });
  // other guests raise a hand in the wide shot
  others.forEach((tb, i) => tb.people.forEach((p, k) => {
    if (!p) return;
    const up = t >= 6.1 && t < 10.4 && (i + k) % 2 === 0;
    p.armR.rotation.set(up ? 0 : -0.9, 0, up ? 2.7 + Math.sin(t * 6 + i) * 0.1 : 0);
  }));

  // ---- kitchen
  const stage = t >= 25.6 ? 1 : 0;
  const since = Math.floor((t - 25.6) * 2);
  const key2 = stage * 100 + (stage ? since : 0);
  if (key2 !== tvState) { tvState = key2; drawTv(stage, Math.max(0, t - 25.6)); }
  chef.head.rotation.x = t >= 25.7 && t < 26.6 ? Math.sin((t - 25.7) * 9) * 0.18 : 0;
  chef.armR.rotation.set(-1.0 + Math.sin(t * 3) * 0.2, 0, 0);
  chef.armL.rotation.set(-1.0 - Math.sin(t * 3) * 0.2, 0, 0);
  lampLights.forEach((L, i) => { L.intensity = 4.5 + Math.sin(t * 2 + i) * 0.15; });
}

const v3 = new THREE.Vector3();
window.dio = {
  draw(t) { update(t); renderer.render(scene, camera); },
  project(x, y, z, local) {
    v3.set(x, y, z);
    if (local) hero.g.localToWorld(v3);
    v3.project(camera);
    return { x: (v3.x * 0.5 + 0.5) * W, y: (-v3.y * 0.5 + 0.5) * H, behind: v3.z > 1 };
  },
  waiterHead() { const p = new THREE.Vector3(); waiter.head.getWorldPosition(p); return this.project(p.x, p.y, p.z); },
};
