// Reel 37 · "13 anos de espera": diorama 3D próprio (Three.js, quadro a quadro). Uma cidade de praia ao pôr do sol
// (genérica, nada do jogo), uma loja com uma fila enorme de bonequinhos esperando um lançamento, e um escritório com
// as mesas vazias. window.cena37(t, st) desenha o quadro; st = { cam:{pos,look,fov}, sunset 0..1, queueWave,
// officeLights 0..1, chairsSpin, glow 0..1 (a caixa única acesa), only (true: só a caixa no escuro) }.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 500);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

let seed = 37;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0, ...o });
const at = (o, x, y, z) => (o.position.set(x, y, z), o);
const box = (w, h, d, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.castShadow = true; b.receiveShadow = true; return b; };

// ------------------------------------------------------------ céu de pôr do sol (gradiente num domo)
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  uniforms: { top: { value: new THREE.Color(0x2a1460) }, mid: { value: new THREE.Color(0xff4f8b) }, low: { value: new THREE.Color(0xffb36b) }, dim: { value: 0 } },
  vertexShader: 'varying vec3 vp; void main(){ vp=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: 'uniform vec3 top,mid,low; uniform float dim; varying vec3 vp; void main(){ float y=vp.y; vec3 c=y>0.12?mix(mid,top,smoothstep(.12,.6,y)):mix(low,mid,smoothstep(-.05,.12,y)); gl_FragColor=vec4(c*(1.-dim),1.); }',
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat));
const sun = at(new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.MeshBasicMaterial({ color: 0xffe2a8 })), 0, 18, -260);
scene.add(sun);

const hemi = new THREE.HemisphereLight(0xffb1d0, 0x2a1840, 0.9);
scene.add(hemi);
const sunL = new THREE.DirectionalLight(0xffc28a, 2.2);
sunL.position.set(-30, 25, -40); sunL.castShadow = true;
sunL.shadow.mapSize.set(2048, 2048);
Object.assign(sunL.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 150 });
scene.add(sunL);

// ------------------------------------------------------------ chão, rua, calçada, mar
const ground = at(box(200, 0.2, 200, M(0x3a2a4a)), 0, -0.1, 0); scene.add(ground);
const road = at(box(200, 0.05, 10, M(0x1f1a2a, { roughness: 0.6 })), 0, 0.02, 8); scene.add(road);
for (let x = -90; x < 90; x += 6) scene.add(at(box(2.4, 0.06, 0.25, M(0xffd36b, { emissive: 0x664400 })), x, 0.05, 8));
const walk = at(box(200, 0.25, 6, M(0x8a7090)), 0, 0.12, 0); scene.add(walk);
const sea = at(new THREE.Mesh(new THREE.PlaneGeometry(400, 160), M(0x5b3c8a, { roughness: 0.25, metalness: 0.4 })), 0, 0.01, -110);
sea.rotation.x = -Math.PI / 2; scene.add(sea);

// ------------------------------------------------------------ prédios com janelas
const neonCols = [0xff4f8b, 0x2fd5ff, 0xb36bff, 0xffb36b];
const buildings = new THREE.Group(); scene.add(buildings);
const winMats = [];
function building(x, z, w, d, h, col) {
  const g = new THREE.Group();
  g.add(at(box(w, h, d, M(col, { roughness: 0.9 })), 0, h / 2, 0));
  const wm = M(0x1a1030, { emissive: 0xffc28a, emissiveIntensity: 0 });
  winMats.push(wm);
  for (let y = 2; y < h - 1; y += 2.2) for (let xx = -w / 2 + 1; xx < w / 2 - 0.6; xx += 1.6)
    if (rnd() > 0.35) g.add(at(box(0.9, 1.1, 0.1, wm), xx + 0.4, y, d / 2 + 0.05));
  if (rnd() > 0.4) { const n = M(neonCols[Math.floor(rnd() * 4)], { emissive: neonCols[Math.floor(rnd() * 4)], emissiveIntensity: 2 }); g.add(at(box(w * 0.8, 0.25, 0.15, n), 0, h - 1.2, d / 2 + 0.12)); }
  g.position.set(x, 0, z); buildings.add(g);
}
for (let i = -12; i <= 12; i++) { if (Math.abs(i) <= 1) continue; building(i * 7 + (rnd() - .5) * 2, -12 - rnd() * 18, 5 + rnd() * 2, 5, 8 + rnd() * 26, [0x4a3060, 0x5a3a70, 0x3a2a55, 0x6a4a7a][i & 3]); }

// ------------------------------------------------------------ palmeiras
function palm(x, z, h = 7) {
  const g = new THREE.Group();
  const trunkM = M(0x6b4a3a);
  for (let i = 0; i < 8; i++) { const s = at(new THREE.Mesh(new THREE.CylinderGeometry(0.22 - i * .012, 0.26 - i * .012, h / 8, 8), trunkM), Math.sin(i * .25) * .4, i * h / 8 + h / 16, 0); s.castShadow = true; g.add(s); }
  const leafM = M(0x1f6b4a, { side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.5, 4, 4, 1, true), leafM);
    leaf.position.set(Math.sin(2.2) * .4, h, 0); leaf.rotation.set(0, i / 7 * Math.PI * 2, Math.PI / 2.4); leaf.translateY(1.8); leaf.castShadow = true;
    g.add(leaf);
  }
  g.position.set(x, 0, z); scene.add(g); return g;
}
const palms = [];
for (let x = -60; x <= 60; x += 9) if (Math.abs(x) > 8) palms.push(palm(x + (rnd() - .5) * 2, 3.2));

// ------------------------------------------------------------ a loja (lançamento) com letreiro genérico
const store = new THREE.Group(); scene.add(store);
store.add(at(box(14, 9, 8, M(0x2a1840)), 0, 4.5, -10));
const glassM = M(0xffe0f0, { emissive: 0xff8ac0, emissiveIntensity: 1.2, roughness: 0.2 });
store.add(at(box(10, 5, 0.2, glassM), 0, 3, -5.9));
const signM = M(0xffffff, { emissive: 0xff4f8b, emissiveIntensity: 3 });
store.add(at(box(9, 1.3, 0.3, signM), 0, 7.6, -5.8));
// relógio de contagem em cima do letreiro (só um disco que brilha)
const doorL = new THREE.PointLight(0xff6ab0, 40, 25); doorL.position.set(0, 4, -3); scene.add(doorL);

// ------------------------------------------------------------ bonequinhos (fila)
const skins = [0xf1c39c, 0xd9a07a, 0xa8714e, 0x7a4e32, 0xe8b590];
const shirts = [0x2fd5ff, 0xff4f8b, 0xffd36b, 0x6bff9e, 0xb36bff, 0xffffff, 0x2f7dff, 0xff7a3d];
function boneco(shirt, skin) {
  const g = new THREE.Group();
  const body = at(new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.7, 4, 12), M(shirt)), 0, 0.95, 0); body.castShadow = true; g.add(body);
  const head = at(new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), M(skin)), 0, 1.75, 0); head.castShadow = true; g.add(head);
  const hair = at(new THREE.Mesh(new THREE.SphereGeometry(0.31, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2.2), M([0x2b2118, 0x5a3a1a, 0x111111, 0xc9a060][Math.floor(rnd() * 4)])), 0, 1.79, 0); g.add(hair);
  const eyeM = M(0x111111);
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeM), -0.1, 1.78, 0.27));
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeM), 0.1, 1.78, 0.27));
  const legM = M(0x23203a);
  g.add(at(box(0.18, 0.55, 0.2, legM), -0.13, 0.27, 0)); g.add(at(box(0.18, 0.55, 0.2, legM), 0.13, 0.27, 0));
  // celular na mão (a tela acende)
  const ph = at(box(0.14, 0.26, 0.03, M(0x111111, { emissive: 0x9fd8ff, emissiveIntensity: 0.0 })), 0.25, 1.15, 0.3);
  g.add(ph); g.userData.phone = ph.material;
  return g;
}
const queue = [];
{ // fila serpenteando pela calçada até a porta
  let x = 0, z = -4.6;
  for (let i = 0; i < 70; i++) {
    const b = boneco(shirts[Math.floor(rnd() * shirts.length)], skins[Math.floor(rnd() * skins.length)]);
    const row = Math.floor(i / 14), k = i % 14;
    x = (row % 2 === 0 ? 1 : -1) * (k * 1.05) + (row % 2 === 0 ? 1.2 : -1.2) * 0 + (rnd() - .5) * .2;
    z = -4.2 + row * 1.25 + (rnd() - .5) * .2;
    b.position.set(row % 2 === 0 ? 1.2 + k * 1.05 : -1.2 - k * 1.05, 0.25, z);
    b.rotation.y = Math.PI + (rnd() - .5) * .6;
    b.userData.ph = rnd() * 6;
    scene.add(b); queue.push(b);
  }
}


// ------------------------------------------------------------ carro esportivo genérico (abertura "dentro do jogo")
const car = new THREE.Group(); scene.add(car);
{
  const paint = M(0xff2f7a, { roughness: 0.25, metalness: 0.6 });
  const dark = M(0x111118, { roughness: 0.4 });
  const glass = M(0x1a2440, { roughness: 0.05, metalness: 0.8 });
  const body = at(box(4.4, 0.7, 1.9, paint), 0, 0.75, 0); car.add(body);
  const nose = at(box(1.2, 0.45, 1.85, paint), 2.4, 0.62, 0); car.add(nose);
  const cab = at(box(2.0, 0.6, 1.6, glass), -0.2, 1.35, 0); car.add(cab);
  const roof = at(box(1.5, 0.12, 1.5, paint), -0.35, 1.68, 0); car.add(roof);
  const spoiler = at(box(0.4, 0.08, 1.9, dark), -2.15, 1.45, 0); car.add(spoiler);
  car.add(at(box(0.1, 0.4, 0.1, dark), -2.15, 1.2, 0.7)); car.add(at(box(0.1, 0.4, 0.1, dark), -2.15, 1.2, -0.7));
  const wheelG = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 20);
  car.userData.wheels = [];
  for (const [x, z] of [[1.5, 0.95], [1.5, -0.95], [-1.5, 0.95], [-1.5, -0.95]]) { const w = at(new THREE.Mesh(wheelG, dark), x, 0.42, z); w.rotation.x = Math.PI / 2; w.castShadow = true; car.add(w); car.userData.wheels.push(w); }
  const tail = M(0xff2020, { emissive: 0xff2020, emissiveIntensity: 3 });
  car.add(at(box(0.08, 0.15, 0.5, tail), -2.22, 0.85, 0.6)); car.add(at(box(0.08, 0.15, 0.5, tail), -2.22, 0.85, -0.6));
  const head = M(0xffffff, { emissive: 0xfff2cc, emissiveIntensity: 3 });
  car.add(at(box(0.08, 0.15, 0.45, head), 3.02, 0.7, 0.6)); car.add(at(box(0.08, 0.15, 0.45, head), 3.02, 0.7, -0.6));
  const under = M(0xff4fd8, { emissive: 0xff4fd8, emissiveIntensity: 2.5 });
  car.add(at(box(4.0, 0.03, 1.6, under), 0, 0.33, 0));
  car.position.set(-60, 0, 6.5);
}

// ------------------------------------------------------------ escritório (em outro ponto do mundo, x = 120)
const office = new THREE.Group(); office.position.set(120, 0, 0); scene.add(office);
office.add(at(box(30, 0.2, 24, M(0x9aa3b8)), 0, 0.1, 0));
office.add(at(box(30, 8, 0.4, M(0xd9dde6)), 0, 4, -12));
office.add(at(box(0.4, 8, 24, M(0xc9cfdb)), -15, 4, 0));
const ceilLights = [];
const chairs = [];
for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
  const x = -9 + c * 6, z = -7 + r * 6;
  office.add(at(box(3.6, 0.15, 1.8, M(0xffffff)), x, 1.5, z));
  office.add(at(box(0.15, 1.5, 0.15, M(0x777777)), x - 1.6, 0.75, z - .7)); office.add(at(box(0.15, 1.5, 0.15, M(0x777777)), x + 1.6, 0.75, z - .7));
  office.add(at(box(0.15, 1.5, 0.15, M(0x777777)), x - 1.6, 0.75, z + .7)); office.add(at(box(0.15, 1.5, 0.15, M(0x777777)), x + 1.6, 0.75, z + .7));
  const mon = at(box(1.6, 1, 0.1, M(0x111111, { emissive: 0x2f7dff, emissiveIntensity: 0.6 })), x, 2.2, z - .5); office.add(mon);
  const chair = new THREE.Group();
  chair.add(at(box(1, 0.15, 1, M(0x2f7dff)), 0, 1, 0)); chair.add(at(box(1, 1.1, 0.15, M(0x2f7dff)), 0, 1.6, 0.45));
  chair.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), M(0x555555)), 0, 0.5, 0));
  chair.position.set(x, 0, z + 1.4); office.add(chair); chairs.push(chair);
}
for (let i = 0; i < 4; i++) { const l = at(box(5, 0.1, 0.8, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1.5 })), -9 + i * 6, 7.9, 0); office.add(l); ceilLights.push(l.material); }
const officeL = new THREE.PointLight(0xffffff, 120, 40); officeL.position.set(120, 7, 0); scene.add(officeL);

// ------------------------------------------------------------ a caixa única acesa no escuro (x = -120)
const solo = new THREE.Group(); solo.position.set(-120, 0, 0); scene.add(solo);
const soloBox = at(box(1.5, 2.0, 0.35, M(0x111111, { emissive: 0xff4f8b, emissiveIntensity: 0 })), 0, 2.6, 0); solo.add(soloBox);
const soloL = new THREE.PointLight(0xff6ab0, 0, 18); soloL.position.set(0, 3, 3); solo.add(soloL);

const world = [];
window.cena37 = (t, st = {}) => {
  if (!world.length) scene.children.forEach((o) => { if (o !== solo && o !== camera) world.push(o); });
  world.forEach((o) => { if (o.isLight) return; o.visible = !st.only; });
  solo.rotation.y = Math.sin(t * 0.8) * 0.35;
  const sunset = st.sunset ?? 1;
  skyMat.uniforms.dim.value = st.only ? 1 : 0;
  sun.visible = !st.only;
  winMats.forEach((m, i) => (m.emissiveIntensity = (0.4 + 0.6 * ((i * 7) % 5) / 5) * sunset));
  // fila: gente balançando, olhando o celular
  queue.forEach((b, i) => {
    const p = b.userData.ph;
    b.children[0].rotation.z = Math.sin(t * 2 + p) * 0.04;
    b.position.y = 0.25 + Math.abs(Math.sin(t * 3 + p)) * 0.03 * (st.queueWave ?? 0);
    b.userData.phone.emissiveIntensity = (Math.sin(t * 1.3 + p) > 0.2 ? 1.6 : 0.2);
  });
  palms.forEach((p, i) => (p.rotation.z = Math.sin(t * 1.1 + i) * 0.03));
  // carro andando pela avenida (x cresce com t)
  if (st.carX !== undefined) { car.position.x = st.carX; car.userData.wheels.forEach((w) => (w.rotation.y = st.carX * 2)); car.position.y = Math.sin(t * 20) * 0.015; }
  // escritório
  const ol = st.officeLights ?? 1;
  ceilLights.forEach((m) => (m.emissiveIntensity = 1.5 * ol));
  officeL.intensity = 120 * ol;
  chairs.forEach((c, i) => (c.rotation.y = (st.chairsSpin ?? 0) * (1 + i * 0.37) + i));
  // caixa única
  soloBox.material.emissiveIntensity = 2.5 * (st.glow ?? 0);
  soloL.intensity = 60 * (st.glow ?? 0);
  hemi.intensity = st.only ? 0.05 : 0.9;
  const c = st.cam;
  camera.position.set(...c.pos);
  camera.lookAt(new THREE.Vector3(...c.look));
  camera.fov = c.fov || 40;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
};
