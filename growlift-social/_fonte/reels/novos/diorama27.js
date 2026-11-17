// Reel 27 · "A estratégia pra clínica não perder paciente no WhatsApp": one 3D world (Three.js, rendered frame by
// frame). A round platform with neon lines, a giant tooth in the middle and six stations around it, one per thing the
// panel really does (answer, schedule, missed call, reminder, pipeline, monthly report). Patients are little blobs.
// window.mundo(t, st) draws the frame for time t; st = { cam: {pos, look}, on: [station states], ... }.
// Everything is a pure function of (t, st), so every frame is reproducible.
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
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x1a1846, 26, 60);
const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 200);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o });
const neon = (color, k = 2.2) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: k, roughness: 0.4 });
const rbox = (w, h, d, m, r = 0.06) => {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1)), m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};
const at = (o, x, y, z) => (o.position.set(x, y, z), o);
const shadowy = (o) => (o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }), o);

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight(0xd6dcff, 0x2a1838, 0.6));
const key = new THREE.DirectionalLight(0xfff3e6, 2.4);
key.position.set(6, 14, 9);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 50 });
key.shadow.bias = -0.0006;
scene.add(key);
const rim = new THREE.DirectionalLight(0x6f8dff, 1.2);
rim.position.set(-8, 6, -10);
scene.add(rim);

// ---------------------------------------------------------------- platform + neon floor
const world = new THREE.Group();
scene.add(world);
const R = 7;
const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.96, 0.7, 96), mat(0x141a36, { roughness: 0.6 }));
base.receiveShadow = true;
world.add(at(base, 0, -0.35, 0));
const top = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.05, R - 0.05, 0.04, 96), mat(0x1c2347, { roughness: 0.55 }));
top.receiveShadow = true;
world.add(at(top, 0, 0.02, 0));
const edge = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 8, 160), neon(0x3d8bff, 2.6));
edge.rotation.x = Math.PI / 2;
world.add(at(edge, 0, 0.04, 0));
const inner = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.04, 8, 96), neon(0x3d8bff, 2));
inner.rotation.x = Math.PI / 2;
world.add(at(inner, 0, 0.05, 0));
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
  const len = R - 1.85;
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, len), neon(0x2f6fff, 1.6));
  line.position.set(Math.sin(a) * (1.8 + len / 2), 0.05, Math.cos(a) * (1.8 + len / 2));
  line.rotation.y = a;
  world.add(line);
}
// far grid below, fading in the fog
const grid = new THREE.GridHelper(120, 60, 0x2a4fb8, 0x1b2f78);
grid.position.y = -4;
scene.add(grid);

// ---------------------------------------------------------------- the giant tooth on its pedestal
const tooth = new THREE.Group();
world.add(at(tooth, 0, 0, 0));
const ped = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.45, 0.5, 64), mat(0x232b52, { roughness: 0.5 })));
tooth.add(at(ped, 0, 0.25, 0));
const pedRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.04, 8, 96), neon(0x6fa8ff, 2.4));
pedRing.rotation.x = Math.PI / 2;
tooth.add(at(pedRing, 0, 0.5, 0));
const enamel = new THREE.MeshPhysicalMaterial({ color: 0xf7f9ff, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2, emissive: 0x1a1a22, emissiveIntensity: 0.1 });
const t3 = new THREE.Group();
tooth.add(at(t3, 0, 0.5, 0));
// crown profile, turned around the axis, then pinched front/back
const prof = [[0.0, 3.25], [0.8, 3.2], [1.25, 3.02], [1.42, 2.62], [1.4, 2.05], [1.22, 1.58], [1.0, 1.3]].map(([r, y]) => new THREE.Vector2(r, y));
const crown = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), enamel);
crown.scale.set(1, 1, 0.86);
t3.add(crown);
for (const [x, z] of [[-0.55, -0.38], [0.55, -0.38], [-0.55, 0.38], [0.55, 0.38]]) {
  const cusp = new THREE.Mesh(new THREE.SphereGeometry(0.66, 32, 16), enamel);
  cusp.scale.set(1, 0.55, 1);
  t3.add(at(cusp, x * 0.92, 2.98, z * 0.8));
}
for (const s of [-1, 1]) {
  const root = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.24, 1.7, 32), enamel);
  root.rotation.z = s * 0.12;
  t3.add(at(root, s * 0.52, 0.98, 0));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 10), enamel);
  t3.add(at(tip, s * 0.63, 0.12, 0));
}
shadowy(t3);
const glow = new THREE.PointLight(0x4f8dff, 6, 9, 1.8);
tooth.add(at(glow, 0, 4.6, -1.2));
tooth.scale.setScalar(0.82);

// ---------------------------------------------------------------- blobs (patients and the assistant)
function blob(color, { assistant = false, s = 1 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 40, 24), mat(color, { roughness: 0.45 }));
  body.scale.set(1, 0.95, 1);
  g.add(at(body, 0, 0.34, 0));
  for (const x of [-0.11, 0.11]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 12), mat(0xffffff, { roughness: 0.3 }));
    g.add(at(eye, x, 0.42, 0.29));
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 8), mat(0x111111, { roughness: 0.2 }));
    g.add(at(pupil, x, 0.42, 0.36));
  }
  if (assistant) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 8, 40, Math.PI), mat(0x10162e));
    g.add(at(band, 0, 0.36, 0));
    for (const x of [-0.33, 0.33]) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 8), mat(0x10162e)), x, 0.36, 0));
    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8), mat(0x10162e));
    mic.rotation.z = Math.PI / 2.6;
    g.add(at(mic, 0.22, 0.26, 0.18));
  }
  g.scale.setScalar(s);
  return shadowy(g);
}

// ---------------------------------------------------------------- the six stations
const STATIONS = 6, SR = 4.55;
const stations = [];
function pad(group) {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.1, 0.12, 48), mat(0x232b52, { roughness: 0.5 }));
  p.receiveShadow = true;
  group.add(at(p, 0, 0.06, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.025, 8, 64), neon(0x3d8bff, 1.6));
  ring.rotation.x = Math.PI / 2;
  group.add(at(ring, 0, 0.12, 0));
  return ring;
}
const screenMat = () => new THREE.MeshStandardMaterial({ color: 0x0b1530, emissive: 0x2f7bff, emissiveIntensity: 0.9, roughness: 0.3 });
const builders = [
  // 0 · answer on the spot: a phone with chat bubbles above it
  (g) => {
    const ph = rbox(0.62, 1.15, 0.1, mat(0x0f1428, { roughness: 0.3 }), 0.08);
    g.add(at(ph, 0, 0.75, 0));
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 1.0), screenMat());
    g.add(at(sc, 0, 0.75, 0.056));
    const bubbles = [];
    [[-0.25, 1.62, 0xffffff, 0.62], [0.28, 1.95, 0x9fd0ff, 0.7]].forEach(([x, y, c, w]) => {
      const b = rbox(w, 0.24, 0.08, mat(c, { roughness: 0.4 }), 0.1);
      g.add(at(b, x, y, 0.05));
      bubbles.push(b);
    });
    const as = blob(0x2f7bff, { assistant: true });
    g.add(at(as, 0.72, 0.12, 0.35));
    const pa = blob(0xffa45c);
    g.add(at(pa, -0.72, 0.12, 0.35));
    return { bubbles, phoneScreen: sc, assistant: as, patient: pa };
  },
  // 1 · schedule: a calendar board with slots, one booked
  (g) => {
    const board = rbox(1.5, 1.15, 0.1, mat(0xf4f6fb, { roughness: 0.5 }), 0.06);
    g.add(at(board, 0, 0.95, 0));
    const head = rbox(1.5, 0.22, 0.12, mat(0x2f7bff, { roughness: 0.5 }), 0.05);
    g.add(at(head, 0, 1.43, 0.01));
    const slots = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const busy = (r * 4 + c) % 3 === 0;
      const s = rbox(0.28, 0.2, 0.05, mat(busy ? 0xc7cfdf : 0xffffff, { roughness: 0.5 }), 0.03);
      g.add(at(s, -0.51 + c * 0.34, 1.13 - r * 0.27, 0.07));
      slots.push(s);
    }
    const as = blob(0x2f7bff, { assistant: true });
    g.add(at(as, 0.85, 0.12, 0.45));
    return { slots };
  },
  // 2 · missed call: a desk phone with rings
  (g) => {
    const body = rbox(0.9, 0.32, 0.7, mat(0xff6b5b, { roughness: 0.45 }), 0.12);
    g.add(at(body, 0, 0.32, 0));
    const hs = rbox(0.95, 0.16, 0.22, mat(0xe2574a, { roughness: 0.45 }), 0.08);
    g.add(at(hs, 0, 0.56, -0.12));
    const rings = [0, 1, 2].map((i) => {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.55 + i * 0.25, 0.02, 8, 64, Math.PI * 0.6), neon(0xff8a5c, 2));
      r.rotation.z = Math.PI * 0.2;
      g.add(at(r, 0, 0.75, 0));
      return r;
    });
    return { rings };
  },
  // 3 · reminder: an alarm clock
  (g) => {
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.22, 48), mat(0xffd23f, { roughness: 0.45 }));
    face.rotation.x = Math.PI / 2;
    g.add(at(shadowy(face), 0, 0.72, 0));
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.4, 48), mat(0xffffff, { roughness: 0.5 }));
    g.add(at(dial, 0, 0.72, 0.112));
    for (const s of [-1, 1]) g.add(at(shadowy(new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffd23f))), s * 0.3, 1.13, 0));
    const hand1 = rbox(0.04, 0.28, 0.02, mat(0x10162e), 0.01);
    g.add(at(hand1, 0, 0.84, 0.13));
    const hand2 = rbox(0.04, 0.2, 0.02, mat(0x10162e), 0.01);
    hand2.rotation.z = -1.1;
    g.add(at(hand2, 0.07, 0.75, 0.13));
    for (const s of [-1, 1]) g.add(at(rbox(0.08, 0.22, 0.08, mat(0x10162e), 0.03), s * 0.28, 0.2, 0));
    return { hand1 };
  },
  // 4 · pipeline: a board with three columns of cards
  (g) => {
    const board = rbox(1.6, 1.1, 0.08, mat(0x10162e, { roughness: 0.5 }), 0.06);
    g.add(at(board, 0, 0.95, 0));
    const cols = [0xff8a5c, 0xffd23f, 0x4ade80];
    const cards = [];
    cols.forEach((c, i) => {
      for (let k = 0; k < 3 - i; k++) {
        const cd = rbox(0.42, 0.18, 0.04, mat(0xffffff, { roughness: 0.5 }), 0.03);
        g.add(at(cd, -0.52 + i * 0.52, 1.25 - k * 0.24, 0.06));
        const tag = rbox(0.1, 0.12, 0.02, mat(c, { roughness: 0.5 }), 0.02);
        g.add(at(tag, -0.68 + i * 0.52, 1.25 - k * 0.24, 0.085));
        cards.push(cd);
      }
    });
    return { cards };
  },
  // 5 · monthly report: bars
  (g) => {
    const bars = [0.5, 0.8, 0.65, 1.15].map((h, i) => {
      const b = rbox(0.26, h, 0.26, mat(i === 3 ? 0x2f7bff : 0x6b7cb8, { roughness: 0.45 }), 0.05);
      g.add(at(b, -0.5 + i * 0.34, 0.12 + h / 2, 0));
      return b;
    });
    return { bars };
  },
];
for (let i = 0; i < STATIONS; i++) {
  const a = (i / STATIONS) * Math.PI * 2;
  const g = new THREE.Group();
  g.position.set(Math.sin(a) * SR, 0, Math.cos(a) * SR);
  g.rotation.y = a; // the front of each station faces outwards
  world.add(g);
  const ring = pad(g);
  const parts = builders[i](g);
  stations.push({ g, a, ring, parts });
}
// a few patients wandering around the platform
const walkers = [0xffffff, 0xffa45c, 0x7fe3ff, 0xffffff, 0xffd23f].map((c, i) => {
  const b = blob(c, { s: 0.85 });
  world.add(b);
  return { b, a0: i * 1.27 + 0.4, r: 2.6 + (i % 2) * 0.45, v: 0.12 + (i % 3) * 0.03 };
});

// ---------------------------------------------------------------- frame
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
window.stationPos = (i) => { const s = stations[i]; return [s.g.position.x, 0, s.g.position.z, s.a]; };
window.mundo = (t, st = {}) => {
  t3.rotation.y = t * 0.35;
  glow.intensity = 6 + Math.sin(t * 2) * 1.5;
  // where the horizon falls on screen (0 = top, 1 = bottom), for the sky gradient behind the canvas
  const c0 = st.cam || { pos: [0, 13, 15], look: [0, 1, 0] };
  const pitch = Math.atan2(c0.look[1] - c0.pos[1], Math.hypot(c0.look[0] - c0.pos[0], c0.look[2] - c0.pos[2]));
  const hz = 0.5 - Math.tan(-pitch) / (2 * Math.tan(((c0.fov || 36) * Math.PI) / 360));
  document.body.style.setProperty('--hz', (Math.max(0.02, Math.min(0.9, hz)) * 100).toFixed(1) + '%');
  for (const w of walkers) {
    const a = w.a0 + t * w.v;
    w.b.position.set(Math.sin(a) * w.r, 0.04 + Math.abs(Math.sin(t * 6 + w.a0)) * 0.06, Math.cos(a) * w.r);
    w.b.rotation.y = a + Math.PI / 2;
  }
  stations.forEach((s, i) => {
    const on = st.on ? st.on[i] ?? 1 : 1;
    s.ring.material.emissiveIntensity = 0.6 + 2.2 * on;
    s.g.scale.setScalar(0.001 + 0.999 * ease(on * 1.4));
  });
  const p = stations[0].parts;
  p.assistant.visible = !st.hideAssistant;
  p.bubbles[1].visible = !st.hideAssistant;
  p.bubbles.forEach((b, k) => { const k2 = ease((t - 0.3 - k * 0.5) / 0.4); b.scale.setScalar(0.001 + k2); });
  stations[2].parts.rings.forEach((r, k) => { r.material.emissiveIntensity = 1 + 2 * Math.max(0, Math.sin(t * 6 - k * 0.8)); });
  stations[3].parts.hand1.rotation.z = -t * 1.2;
  stations[5].parts.bars.forEach((b, k) => { const k2 = 0.15 + 0.85 * ease((t - k * 0.15) / 0.6); b.scale.y = k2; });
  const slots = stations[1].parts.slots;
  slots.forEach((s, k) => { if (k === 6) { s.material.color.set(st.booked ? 0x2f7bff : 0xffffff); } });
  const c = st.cam || { pos: [0, 13, 15], look: [0, 1, 0] };
  camera.position.set(...c.pos);
  camera.lookAt(new THREE.Vector3(...c.look));
  camera.fov = c.fov || 36;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
};
