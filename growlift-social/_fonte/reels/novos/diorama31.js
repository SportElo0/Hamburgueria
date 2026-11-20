// Reel 31 · "Você acabou de assistir um hambúrguer": a 3D burger on a dark board and a chef's knife coming down very
// slowly (the tension hook), then the burger bursts into its layers and they come back together, smaller and
// spinning, inside a phone screen (the 3D menu). window.burger(t, st) draws the frame; st = { cam:{pos,look,fov},
// knife (y of the tip), burst (0..1+ seconds since the burst), gather (0..1), spin, board (0..1 visible) }.
// Everything is a pure function of (t, st), so every frame is reproducible.
import * as THREE from 'three';
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
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
scene.environmentIntensity = 0.7;

let seed = 31;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0, ...o });
const shadow = (o) => (o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }), o);

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight(0xffe9d6, 0x120806, 0.35));
const key = new THREE.SpotLight(0xffe7c8, 90, 30, 0.42, 0.7, 1.3);
key.position.set(1.5, 9, 3.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0004;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0xff6a2b, 2.4);
rim.position.set(-4, 3, -5);
scene.add(rim);
const fill = new THREE.DirectionalLight(0x9fb6ff, 0.35);
fill.position.set(5, 2, 4);
scene.add(fill);

// ---------------------------------------------------------------- board
const board = new THREE.Group();
{
  const wood = M(0x3a2316, { roughness: 0.62 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.55, 0.22, 96), wood);
  disc.position.y = -0.11;
  board.add(disc);
  // rings of the wood grain, barely visible
  for (let i = 1; i <= 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42 * i, 0.006, 6, 120), M(0x2c1910, { roughness: 0.7 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.001;
    board.add(ring);
  }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshStandardMaterial({ color: 0x0b0807, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.22;
  board.add(floor);
}
scene.add(shadow(board));

// ---------------------------------------------------------------- burger (layers are separate groups so they can burst)
const lathe = (pts, seg = 96) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
const layers = [];
const addLayer = (mesh, y) => {
  const g = new THREE.Group();
  g.add(mesh);
  g.userData.y = y;
  layers.push(g);
  return g;
};

// bottom bun
{
  const pts = [[0, 0], [0.9, 0], [1.02, 0.05], [1.07, 0.16], [1.05, 0.3], [0.96, 0.36], [0, 0.36]];
  addLayer(new THREE.Mesh(lathe(pts), M(0xd9893a, { roughness: 0.55 })), 0.0);
}
// patty (bumpy edge)
{
  const geo = new THREE.CylinderGeometry(1.12, 1.1, 0.34, 120, 4);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
    if (r > 0.5) { const a = Math.atan2(z, x); const k = 1 + 0.025 * Math.sin(a * 13) + 0.018 * Math.sin(a * 29 + 1.3); p.setX(i, x * k); p.setZ(i, z * k); }
    p.setY(i, p.getY(i) + 0.012 * Math.sin(x * 9) * Math.cos(z * 7));
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, M(0x4a2414, { roughness: 0.9 }));
  m.position.y = 0.17;
  addLayer(m, 0.36);
}
// cheese: a square slice that droops at the corners
{
  const geo = new THREE.PlaneGeometry(2.3, 2.3, 30, 30);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
    p.setY(i, -Math.max(0, r - 0.95) * 0.55);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, M(0xffb21f, { roughness: 0.4, side: THREE.DoubleSide }));
  m.rotation.y = 0.5;
  m.position.y = 0.02;
  addLayer(m, 0.7);
}
// lettuce: a wavy ruffled ring
{
  const geo = new THREE.CylinderGeometry(1.2, 1.15, 0.08, 160, 1, false);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z);
    if (r > 0.6) p.setY(i, p.getY(i) + 0.06 * Math.sin(a * 17) + 0.03 * Math.sin(a * 41));
    if (r > 0.6) { const k = 1 + 0.04 * Math.sin(a * 23); p.setX(i, x * k); p.setZ(i, z * k); }
  }
  geo.computeVertexNormals();
  addLayer(new THREE.Mesh(geo, M(0x5fbf3a, { roughness: 0.5 })), 0.76);
}
// tomato: two slices
{
  const g = new THREE.Group();
  [[-0.42, 0.1], [0.45, -0.12]].forEach(([x, z]) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 64), M(0xe0372a, { roughness: 0.35 }));
    s.position.set(x, 0, z);
    g.add(s);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.102, 48), M(0xf06a4a, { roughness: 0.4 }));
    core.position.set(x, 0, z);
    g.add(core);
  });
  g.position.y = 0.05;
  addLayer(g, 0.84);
}
// top bun with sesame
{
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * (Math.PI / 2);
    pts.push([1.1 * Math.cos(a) + (i === 0 ? 0 : 0), 0.08 + 0.78 * Math.sin(a) * (1 - 0.1 * Math.cos(a))]);
  }
  pts.unshift([1.04, 0]);
  pts.unshift([0, 0]);
  pts.push([0, 0.86]);
  const bun = new THREE.Mesh(lathe(pts.map(([x, y]) => [Math.max(0, x), y])), M(0xd47d2e, { roughness: 0.45 }));
  const g = new THREE.Group();
  g.add(bun);
  const seedGeo = new THREE.SphereGeometry(0.05, 10, 8);
  seedGeo.scale(1, 0.45, 0.6);
  const seedMat = M(0xfff1cf, { roughness: 0.6 });
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2, el = 0.35 + rnd() * 1.05;
    const x = Math.cos(el) * Math.cos(a) * 1.08, z = Math.cos(el) * Math.sin(a) * 1.08, y = 0.08 + Math.sin(el) * 0.78;
    const s = new THREE.Mesh(seedGeo, seedMat);
    s.position.set(x, y, z);
    s.lookAt(x * 2, y * 2 + 0.3, z * 2);
    s.rotateZ(rnd() * Math.PI);
    g.add(s);
  }
  addLayer(g, 0.9);
}
const burger = new THREE.Group();
layers.forEach((l) => { l.position.y = l.userData.y; burger.add(l); });
scene.add(shadow(burger));

// burst: each layer flies off on its own path; plus crumbs and seeds
layers.forEach((l, i) => {
  const a = i * 2.1 + 0.6;
  l.userData.v = new THREE.Vector3(Math.cos(a) * (1.4 + i * 0.25), 2.2 + i * 0.7, Math.sin(a) * (1.1 + i * 0.2));
  l.userData.w = new THREE.Vector3((rnd() - 0.5) * 6, (rnd() - 0.5) * 5, (rnd() - 0.5) * 6);
});
const crumbs = new THREE.Group();
{
  const cols = [0xd9893a, 0xffb21f, 0x5fbf3a, 0xe0372a, 0x4a2414, 0xfff1cf];
  for (let i = 0; i < 70; i++) {
    const s = 0.04 + rnd() * 0.09;
    const m = new THREE.Mesh(new THREE.TetrahedronGeometry(s, 0), M(cols[i % cols.length], { roughness: 0.6 }));
    const a = rnd() * Math.PI * 2, up = 0.4 + rnd();
    m.userData.v = new THREE.Vector3(Math.cos(a) * (2 + rnd() * 3), 1.5 + up * 3, Math.sin(a) * (2 + rnd() * 3));
    m.userData.w = new THREE.Vector3(rnd() * 9, rnd() * 9, rnd() * 9);
    m.userData.y = 0.4 + rnd() * 0.6;
    crumbs.add(m);
  }
}
crumbs.visible = false;
scene.add(crumbs);

// ---------------------------------------------------------------- chef's knife (blade points down)
const knife = new THREE.Group();
{
  const s = new THREE.Shape();
  // blade profile in (x, y): tip at (0,0), spine on the right, edge curving on the left; height 3.2
  s.moveTo(0, 0);
  s.quadraticCurveTo(-0.62, 0.9, -0.66, 3.2);
  s.lineTo(0.12, 3.2);
  s.lineTo(0.12, 0.6);
  s.quadraticCurveTo(0.1, 0.2, 0, 0);
  const blade = new THREE.Mesh(
    new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2, curveSegments: 24 }),
    new THREE.MeshStandardMaterial({ color: 0xe8edf2, metalness: 0.85, roughness: 0.26, envMapIntensity: 2.4 }),
  );
  blade.position.z = -0.018;
  knife.add(blade);
  const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.14, 0.12), new THREE.MeshStandardMaterial({ color: 0xb9c0c8, metalness: 1, roughness: 0.25 }));
  bolster.position.set(-0.27, 3.27, 0);
  knife.add(bolster);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.7, 0.2), M(0x111214, { roughness: 0.35 }));
  handle.position.set(-0.27, 4.18, 0);
  knife.add(handle);
  [3.75, 4.6].forEach((y) => {
    const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 1, roughness: 0.2 }));
    rivet.rotation.x = Math.PI / 2;
    rivet.position.set(-0.27, y, 0);
    knife.add(rivet);
  });
}
knife.rotation.y = -0.35;
scene.add(shadow(knife));

// ---------------------------------------------------------------- frame
const clamp = (x) => Math.max(0, Math.min(1, x));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

/** Screen position (px) of a world point, for the HTML overlays. */
window.burgerScreen = (x, y, z) => {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};

window.burger = (t, st = {}) => {
  const c = st.cam;
  camera.position.set(...c.pos);
  camera.fov = c.fov;
  camera.updateProjectionMatrix();
  camera.lookAt(...c.look);

  // knife: tip height above the board (top of the bun is ~1.76)
  knife.position.set(0.05, st.knife ?? 6, 0);
  knife.visible = (st.knife ?? 6) < 9;

  const b = st.burst ?? -1; // seconds since the burst
  const g = clamp(st.gather ?? 0);
  board.visible = (st.board ?? 1) > 0.01;
  const spin = st.spin ?? 0;
  burger.rotation.y = spin;
  burger.position.set(...(st.burgerPos || [0, 0, 0]));
  burger.scale.setScalar(st.burgerScale ?? 1);
  layers.forEach((l) => {
    const y0 = l.userData.y;
    if (b > 0) {
      const tt = b * (1 - g);
      const v = l.userData.v, w = l.userData.w;
      const e = eio(g);
      l.position.set(v.x * tt * (1 - e), (y0 + v.y * tt - 2.2 * tt * tt) * (1 - e) + y0 * e, v.z * tt * (1 - e));
      l.rotation.set(w.x * tt * (1 - e), w.y * tt * (1 - e), w.z * tt * (1 - e));
    } else {
      // a tiny squash as the blade gets close
      const press = st.press ?? 0;
      l.position.set(0, y0 * (1 - 0.06 * press), 0);
      l.rotation.set(0, 0, 0);
    }
  });
  crumbs.visible = b > 0 && g < 1;
  if (crumbs.visible) {
    crumbs.children.forEach((m) => {
      const v = m.userData.v, w = m.userData.w, tt = b;
      m.position.set(v.x * tt, m.userData.y + v.y * tt - 4.9 * tt * tt, v.z * tt);
      m.rotation.set(w.x * tt, w.y * tt, w.z * tt);
      m.scale.setScalar(Math.max(0.001, 1 - g * 1.5));
    });
  }
  renderer.setClearColor(0x000000, 0);
  renderer.render(scene, camera);
};
