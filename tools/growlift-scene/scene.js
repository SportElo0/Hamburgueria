// Growlift scroll scene, clean version: the two glass pieces of the Growlift mark drift in,
// lock together over a soft pool of light, catch a sweep of light and lift slightly.
// window.renderFrame(t, w, h) renders progress t (0..1) and returns a PNG data URL.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const BG = new THREE.Color('#06080d');
const BLUE = new THREE.Color('#0865fe');
const BLUE_HOT = new THREE.Color('#6aa4ff');

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = BG;
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;

const camera = new THREE.PerspectiveCamera(32, 16 / 9, 1, 5000);

// --- No floor: a soft pool of blue light under the mark grounds it ---------------------
const poolMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uAmount: { value: 0 }, uColor: { value: BLUE } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform float uAmount; uniform vec3 uColor; varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 3.0); gl_FragColor = vec4(uColor, a * uAmount * 0.5); }',
});
const pool = new THREE.Mesh(new THREE.PlaneGeometry(620, 620), poolMat);
pool.rotation.x = -Math.PI / 2;
scene.add(pool);

// --- The mark (two pieces from the logo SVG, viewBox 50 40 530 415) ---------------------
const S = 0.5; // svg units -> world
const P = (x, y) => new THREE.Vector2((x - 315) * S, -(y - 250) * S);
const barShape = new THREE.Shape([P(280, 48), P(410, 48), P(190, 450), P(55, 450)]);
const triShape = new THREE.Shape([P(470, 130), P(570, 450), P(258, 450)]);
triShape.holes.push(new THREE.Path([P(418, 220), P(309, 380), P(480, 380)]));
const extrude = { depth: 30, bevelEnabled: true, bevelThickness: 4, bevelSize: 3, bevelSegments: 5, curveSegments: 1 };
const markMat = new THREE.MeshPhysicalMaterial({
  color: BLUE,
  metalness: 0,
  roughness: 0.08,
  transmission: 0.55,
  thickness: 40,
  ior: 1.45,
  attenuationColor: BLUE,
  attenuationDistance: 60,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
  emissive: BLUE,
  emissiveIntensity: 0.15,
});
const makePiece = (shape) => {
  const g = new THREE.ExtrudeGeometry(shape, extrude);
  g.translate(0, 0, -extrude.depth / 2);
  const pivot = new THREE.Group();
  pivot.add(new THREE.Mesh(g, markMat));
  return pivot;
};
const mark = new THREE.Group();
const bar = makePiece(barShape);
const tri = makePiece(triShape);
mark.add(bar, tri);
scene.add(mark);

// --- Light ------------------------------------------------------------------------------
scene.add(new THREE.HemisphereLight('#3a5a9a', '#05070b', 0.6));
const key = new THREE.DirectionalLight('#dbe8ff', 1.4);
key.position.set(-300, 500, 500);
scene.add(key);
const rim = new THREE.DirectionalLight('#4d8dff', 2.4);
rim.position.set(300, 250, -500);
scene.add(rim);
// The sweep: a bright point that travels across the front of the mark once.
const sweep = new THREE.PointLight('#cfe1ff', 0, 520, 2);
scene.add(sweep);
const glow = new THREE.PointLight(BLUE_HOT, 0, 600, 1.8);
scene.add(glow);

// Soft halo behind the mark.
const haloMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uAmount: { value: 0 }, uColor: { value: BLUE } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform float uAmount; uniform vec3 uColor; varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.4); gl_FragColor = vec4(uColor, a * uAmount * 0.38); }',
});
const halo = new THREE.Mesh(new THREE.PlaneGeometry(760, 760), haloMat);
scene.add(halo);

// --- Animation -------------------------------------------------------------------------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const lerp = (a, b, k) => a + (b - a) * k;

function pose(t, aspect) {
  const come = easeOut(seg(t, 0, 0.5)); // pieces drift in and lock
  const shine = seg(t, 0.42, 0.78); // light sweep
  const lift = ease(seg(t, 0.6, 1)); // gentle rise and glow

  bar.position.set(lerp(-160, 0, come), lerp(70, 0, come), lerp(-80, 0, come));
  bar.rotation.set(lerp(0.5, 0, come), lerp(1.1, 0, come), lerp(-0.7, 0, come));
  tri.position.set(lerp(150, 0, come), lerp(-40, 0, come), lerp(-60, 0, come));
  tri.rotation.set(lerp(-0.4, 0, come), lerp(-1.2, 0, come), lerp(0.6, 0, come));

  mark.position.y = 118 + lift * 34;
  mark.rotation.y = lerp(-0.35, 0, ease(seg(t, 0, 0.7))) + 0.06 * Math.sin(lift * Math.PI);
  markMat.emissiveIntensity = 0.12 + 0.2 * come + 0.35 * lift;

  sweep.position.set(lerp(-320, 320, ease(shine)), mark.position.y + 40, 170);
  sweep.intensity = Math.sin(shine * Math.PI) * 9000;
  glow.position.set(0, mark.position.y + 90, -220);
  glow.intensity = (0.2 + 0.6 * come + 1.0 * lift) * 9000;

  pool.position.y = mark.position.y - 112;
  poolMat.uniforms.uAmount.value = 0.15 + 0.4 * come + 0.3 * lift;
  halo.position.set(0, mark.position.y + 6, -120);
  haloMat.uniforms.uAmount.value = 0.12 + 0.35 * come + 0.6 * lift;

  // Camera: almost still, a slow push-in. The copy sits left on wide screens, low on tall ones.
  const portrait = aspect < 1;
  const push = ease(seg(t, 0, 1));
  const dist = portrait ? 1.55 : 1.2;
  camera.position.set(lerp(-60, -20, push) * dist, lerp(150, 130, push) * dist, lerp(820, 700, push) * dist);
  camera.lookAt(0, mark.position.y - 6, 0);
  camera.fov = portrait ? 44 : 32;
  camera.aspect = aspect;
  if (portrait) camera.setViewOffset(1000, 1000 / aspect, 0, (1000 / aspect) * 0.13, 1000, 1000 / aspect);
  else camera.setViewOffset(1000 * aspect, 1000, -1000 * aspect * 0.17, 0, 1000 * aspect, 1000);
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
  bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.5, 0.8);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}

window.renderFrame = (t, w, h) => {
  setSize(w, h);
  pose(t, w / h);
  halo.quaternion.copy(camera.quaternion);
  bloom.strength = 0.4 + 0.35 * ease(seg(t, 0.5, 1));
  composer.render();
  return renderer.domElement.toDataURL('image/png');
};
window.sceneReady = true;
