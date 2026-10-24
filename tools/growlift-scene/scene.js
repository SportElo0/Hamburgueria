// Growlift scroll scene: a dark field of small buildings (local businesses) lights up in a blue
// wave while the two pieces of the Growlift mark assemble and lift. window.renderFrame(t, w, h)
// renders progress t (0..1) and returns a PNG data URL.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const BG = new THREE.Color('#06080d');
const BLUE = new THREE.Color('#0865fe');
const BLUE_HOT = new THREE.Color('#5c9bff');

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = BG;
scene.fog = new THREE.FogExp2(BG, 0.0011);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(35, 16 / 9, 1, 6000);

// Seeded random so every render is identical.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// --- City field -------------------------------------------------------------------------
const GRID = 46;
const STEP = 46;
const blocks = [];
for (let i = 0; i < GRID; i++) {
  for (let j = 0; j < GRID; j++) {
    const x = (i - GRID / 2 + 0.5) * STEP + (rand() - 0.5) * 8;
    const z = (j - GRID / 2 + 0.5) * STEP + (rand() - 0.5) * 8;
    const r = Math.hypot(x, z);
    if (r < 150 || rand() < 0.16) continue; // plaza under the mark, and some empty lots
    const h = 8 + Math.pow(rand(), 2.2) * 70 * (0.5 + Math.min(1, r / 700));
    const w = 22 + rand() * 14;
    const d = 22 + rand() * 14;
    blocks.push({ x, z, h, w, d, r, delay: rand() });
  }
}
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
boxGeo.translate(0, 0.5, 0);
const bodyMat = new THREE.MeshStandardMaterial({ color: '#0d121c', roughness: 0.55, metalness: 0.35 });
const bodies = new THREE.InstancedMesh(boxGeo, bodyMat, blocks.length);
const roofGeo = new THREE.PlaneGeometry(1, 1);
roofGeo.rotateX(-Math.PI / 2);
const roofMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
const roofs = new THREE.InstancedMesh(roofGeo, roofMat, blocks.length);
// Window strips: a thin emissive band near the top of each building.
const bandMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
const bands = new THREE.InstancedMesh(boxGeo, bandMat, blocks.length);
const m = new THREE.Matrix4();
blocks.forEach((b, k) => {
  m.compose(new THREE.Vector3(b.x, 0, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d));
  bodies.setMatrixAt(k, m);
  m.compose(new THREE.Vector3(b.x, b.h + 0.4, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w * 0.7, 1, b.d * 0.7));
  roofs.setMatrixAt(k, m);
  m.compose(new THREE.Vector3(b.x, b.h * 0.62, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w + 0.6, Math.max(1.4, b.h * 0.05), b.d + 0.6));
  bands.setMatrixAt(k, m);
});
bodies.receiveShadow = true;
scene.add(bodies, roofs, bands);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(2400, 96),
  new THREE.MeshStandardMaterial({ color: '#070a11', roughness: 0.35, metalness: 0.6 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Plaza ring under the mark.
const ring = new THREE.Mesh(new THREE.RingGeometry(118, 122, 128), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true }));
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.5;
scene.add(ring);

// --- The mark (two pieces from the logo SVG, viewBox 50 40 530 415) ---------------------
const S = 0.5; // svg units -> world
const P = (x, y) => new THREE.Vector2((x - 315) * S, -(y - 250) * S);
const barShape = new THREE.Shape([P(280, 48), P(410, 48), P(190, 450), P(55, 450)]);
const triShape = new THREE.Shape([P(470, 130), P(570, 450), P(258, 450)]);
triShape.holes.push(new THREE.Path([P(418, 220), P(309, 380), P(480, 380)]));
const extrude = { depth: 26, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.4, bevelSegments: 4, curveSegments: 1 };
const markMat = new THREE.MeshPhysicalMaterial({
  color: BLUE,
  metalness: 0.25,
  roughness: 0.18,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  emissive: BLUE,
  emissiveIntensity: 0.2,
});
const makePiece = (shape) => {
  const g = new THREE.ExtrudeGeometry(shape, extrude);
  g.translate(0, 0, -extrude.depth / 2);
  const mesh = new THREE.Mesh(g, markMat);
  mesh.castShadow = true;
  const pivot = new THREE.Group();
  pivot.add(mesh);
  return pivot;
};
const mark = new THREE.Group();
const bar = makePiece(barShape);
const tri = makePiece(triShape);
mark.add(bar, tri);
scene.add(mark);

// Light that travels with the mark and spills onto the city.
const glow = new THREE.PointLight(BLUE_HOT, 0, 700, 1.8);
scene.add(glow);
const key = new THREE.DirectionalLight('#cfe0ff', 1.6);
key.position.set(-300, 600, 400);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -300, right: 300, top: 300, bottom: -300, near: 10, far: 2000 });
scene.add(key);
const rim = new THREE.DirectionalLight('#4d8dff', 2.2);
rim.position.set(400, 200, -500);
scene.add(rim);
scene.add(new THREE.HemisphereLight('#2a3a5a', '#05070b', 0.5));

// Vertical beam of light under the mark in the final act.
const beamMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uAmount: { value: 0 }, uColor: { value: BLUE_HOT } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader:
    'uniform float uAmount; uniform vec3 uColor; varying vec2 vUv; void main(){ float edge = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 3.0); float fade = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y)); gl_FragColor = vec4(uColor, edge * fade * uAmount * 0.22); }',
});
const beam = new THREE.Mesh(new THREE.CylinderGeometry(26, 60, 1, 48, 1, true), beamMat);
scene.add(beam);

// Soft halo behind the mark.
const haloMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uAmount: { value: 0 }, uColor: { value: BLUE } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform float uAmount; uniform vec3 uColor; varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2); gl_FragColor = vec4(uColor, a * uAmount * 0.32); }',
});
const halo = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), haloMat);
scene.add(halo);

// Motes of light rising from the city in the final act.
const MOTES = 420;
const motePos = new Float32Array(MOTES * 3);
const moteSeed = [];
for (let i = 0; i < MOTES; i++) {
  const a = rand() * Math.PI * 2;
  const r = 60 + Math.pow(rand(), 0.7) * 520;
  moteSeed.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, off: rand(), speed: 0.6 + rand() * 0.9 });
}
const moteGeo = new THREE.BufferGeometry();
moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
const moteTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(160,200,255,0.6)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const moteMat = new THREE.PointsMaterial({ size: 7, map: moteTex, color: BLUE_HOT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
const motes = new THREE.Points(moteGeo, moteMat);
scene.add(motes);

// --- Animation -------------------------------------------------------------------------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const lerp = (a, b, k) => a + (b - a) * k;
const tmp = new THREE.Color();
const dark = new THREE.Color('#0a0f18');
const dim = new THREE.Color('#141c2b');

function pose(t, aspect) {
  const assemble = ease(seg(t, 0.08, 0.5));
  const lift = ease(seg(t, 0.5, 0.92));
  const wave = seg(t, 0.1, 1);

  // Pieces: start apart and lying on the plaza, end interlocked and upright, then rise.
  bar.position.set(lerp(-150, 0, assemble), 0, lerp(40, 0, assemble));
  bar.rotation.set(lerp(-Math.PI / 2, 0, assemble), lerp(0.6, 0, assemble), lerp(-0.4, 0, assemble));
  tri.position.set(lerp(150, 0, assemble), 0, lerp(-30, 0, assemble));
  tri.rotation.set(lerp(-Math.PI / 2, 0, assemble), lerp(-0.7, 0, assemble), lerp(0.5, 0, assemble));
  const baseY = lerp(16, 140, assemble);
  mark.position.y = baseY + lift * 170;
  mark.rotation.y = lerp(-0.5, 0, ease(seg(t, 0.2, 0.75))) + Math.sin(t * Math.PI) * 0.06;
  markMat.emissiveIntensity = 0.1 + 0.25 * assemble + 0.2 * lift;

  glow.position.set(0, mark.position.y - 150, -40);
  glow.intensity = (0.3 + 1.2 * assemble + 1.6 * lift) * 9000;

  beamMat.uniforms.uAmount.value = lift;
  beam.scale.set(1, Math.max(1, mark.position.y), 1);
  beam.position.y = mark.position.y / 2;

  halo.position.set(0, mark.position.y, -70);
  haloMat.uniforms.uAmount.value = seg(t, 0.45, 0.7) * (0.6 + 0.4 * lift);
  const haloSize = Math.min(2.1, Math.max(0.2, (mark.position.y - 20) / 230));
  halo.scale.set(haloSize, haloSize, 1);

  const rise = seg(t, 0.35, 1);
  moteMat.opacity = Math.min(1, rise * 2.5) * 0.9;
  moteSeed.forEach((q, i) => {
    const y = ((q.off + t * q.speed * 1.6) % 1) * 520;
    const pull = clamp(y / 520) * 0.35 * rise;
    motePos[i * 3] = q.x * (1 - pull);
    motePos[i * 3 + 1] = y;
    motePos[i * 3 + 2] = q.z * (1 - pull);
  });
  moteGeo.attributes.position.needsUpdate = true;

  ring.material.color.copy(BLUE_HOT).multiplyScalar(0.4 + 2.2 * assemble);
  ring.material.opacity = 0.25 + 0.75 * assemble;

  // City: a wave of light spreads from the plaza outward.
  const reach = 120 + wave * wave * 1300;
  blocks.forEach((b, k) => {
    // Only some buildings light up, and each with its own strength.
    const lit = b.delay < 0.7 ? 1 : 0;
    const on = lit * clamp((reach - b.r + b.delay * 160) / 180);
    const pulse = on * (0.35 + 0.65 * ((b.delay * 7.3) % 1));
    tmp.copy(dim).lerp(BLUE_HOT, pulse).multiplyScalar(1 + 1.1 * pulse);
    roofs.setColorAt(k, tmp);
    tmp.copy(dark).lerp(BLUE, pulse).multiplyScalar(0.25 + 0.9 * pulse);
    bands.setColorAt(k, tmp);
  });
  roofs.instanceColor.needsUpdate = true;
  bands.instanceColor.needsUpdate = true;

  // Camera: high overhead → three-quarter → low, looking up at the lifted mark.
  const k1 = ease(seg(t, 0, 0.55));
  const k2 = ease(seg(t, 0.5, 1));
  const portrait = aspect < 1;
  const dist = portrait ? 1.6 : 1.22;
  const camPos = new THREE.Vector3(
    lerp(lerp(60, -260, k1), -170, k2),
    lerp(lerp(980, 330, k1), 240, k2),
    lerp(lerp(260, 620, k1), 640, k2),
  ).multiplyScalar(dist);
  camera.position.copy(camPos);
  const look = new THREE.Vector3(0, lerp(lerp(0, 120, k1), mark.position.y - 35, k2), 0);
  camera.lookAt(look);
  camera.fov = portrait ? 46 : 35;
  camera.aspect = aspect;
  // Leave room for the copy: the scene sits right of centre on wide screens, high on tall ones.
  if (portrait) camera.setViewOffset(1000, 1000 / aspect, 0, (1000 / aspect) * 0.12, 1000, 1000 / aspect);
  else camera.setViewOffset(1000 * aspect, 1000, -1000 * aspect * 0.16, 0, 1000 * aspect, 1000);
  camera.updateProjectionMatrix();
}

let composer;
let bloom;
let size = [0, 0];
function setSize(w, h) {
  if (size[0] === w && size[1] === h) return;
  size = [w, h];
  renderer.setSize(w, h);
  composer = new EffectComposer(renderer);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.6, 0.45, 0.78);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}

window.renderFrame = (t, w, h) => {
  setSize(w, h);
  pose(t, w / h);
  halo.quaternion.copy(camera.quaternion);
  bloom.strength = 0.45 + 0.35 * ease(seg(t, 0.3, 1));
  composer.render();
  return renderer.domElement.toDataURL('image/png');
};
window.sceneReady = true;
