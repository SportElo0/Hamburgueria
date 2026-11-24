// Product shots for the Reel 33 menu (Brasa Burger, a Growlift concept brand): our own 3D burger and dessert (the
// demo menu's GLB files) and simple 3D fries and soda, lit like a studio photo. window.shot(kind) renders one.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
const S = 720;
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setSize(S, S, false); renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.6;
const bgTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); const gr = g.createRadialGradient(256, 220, 20, 256, 256, 380); gr.addColorStop(0, '#3a2414'); gr.addColorStop(1, '#0c0705'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
scene.background = bgTex;
const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
const key = new THREE.DirectionalLight('#fff1dc', 2.6); key.position.set(-1.2, 2, 1.6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
const rim = new THREE.DirectionalLight('#ff9a3c', 2.2); rim.position.set(1.5, 1, -1.5); scene.add(rim);
scene.add(new THREE.HemisphereLight('#ffe6c8', '#2a1608', 0.5));
const board = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShadowMaterial({ opacity: 0.45 }));
board.rotation.x = -Math.PI / 2; board.receiveShadow = true; scene.add(board);
const root = new THREE.Group(); scene.add(root);
const load = (b64) => new Promise((res) => { const bin = atob(b64), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i); new GLTFLoader().parse(buf.buffer, '', (g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); const box = new THREE.Box3().setFromObject(g.scene); g.scene.position.y -= box.min.y; res(g.scene); }); });
let burger, dessert;
window.ready = (async () => { burger = await load(window.BURGER); dessert = await load(window.DESSERT); })();
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...o });
function fries() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.036, 0.075, 4, 1, true), mat('#c8102e', { side: THREE.DoubleSide })); box.rotation.y = Math.PI / 4; box.position.y = 0.0375; g.add(box);
  let s = 5; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) { const f = new THREE.Mesh(new RoundedBoxGeometry(0.009, 0.075 + r() * 0.03, 0.009, 2, 0.003), mat('#f2b631', { roughness: 0.45 })); f.position.set((r() - 0.5) * 0.05, 0.07 + r() * 0.015, (r() - 0.5) * 0.05); f.rotation.set((r() - 0.5) * 0.5, r() * 3, (r() - 0.5) * 0.5); f.castShadow = true; g.add(f); }
  return g;
}
function soda() {
  const g = new THREE.Group();
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 48), mat('#b3141f', { metalness: 0.6, roughness: 0.25 })); can.position.y = 0.06; can.castShadow = true; g.add(can);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.033, 0.008, 48), mat('#d9dde3', { metalness: 0.9, roughness: 0.25 })); top.position.y = 0.124; g.add(top);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0335, 0.0335, 0.03, 48), mat('#f5f5f5', { metalness: 0.3, roughness: 0.35 })); band.position.y = 0.06; g.add(band);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.1, 40), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transmission: 0.9, thickness: 0.01, transparent: true, opacity: 0.35 })); glass.position.set(0.06, 0.05, 0.03); g.add(glass);
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.027, 0.07, 40), mat('#3a120a', { roughness: 0.2, transparent: true, opacity: 0.9 })); liquid.position.set(0.06, 0.037, 0.03); g.add(liquid);
  return g;
}
window.shot = async (kind) => {
  await window.ready;
  root.clear();
  let obj, d = 0.42, h = 0.06;
  if (kind === 'classico') { obj = burger.clone(true); obj.rotation.y = 0.5; d = 0.36; h = 0.05; }
  if (kind === 'sobremesa') { obj = dessert.clone(true); obj.rotation.y = 0.3; d = 0.36; h = 0.045; }
  if (kind === 'fritas') { obj = fries(); d = 0.34; h = 0.06; }
  if (kind === 'refri') { obj = soda(); d = 0.36; h = 0.07; }
  root.add(obj);
  // fit the camera to the object (it fills about 70% of the frame), seen a little from above
  const sph = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere());
  const dist = sph.radius / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2)) * 0.95;
  const dir = new THREE.Vector3(0, 0.42, 1).normalize();
  cam.position.copy(sph.center).addScaledVector(dir, dist); cam.lookAt(sph.center);
  key.position.copy(sph.center).add(new THREE.Vector3(-1.2, 2, 1.6)); key.target.position.copy(sph.center); key.target.updateMatrixWorld();
  key.shadow.camera.left = key.shadow.camera.bottom = -0.3; key.shadow.camera.right = key.shadow.camera.top = 0.3; key.shadow.camera.updateProjectionMatrix();
  renderer.render(scene, cam);
};
