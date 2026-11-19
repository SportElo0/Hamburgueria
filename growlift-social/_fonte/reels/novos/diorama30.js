// Reel 30 · "Quem acende o farol à noite?": a 3D night sea (Three.js, frame by frame). A striped lighthouse on a rocky
// island sweeps its beam over moving water; across the bay, a small clinic ("Clínica Exemplo") whose windows go dark at
// 18h. window.farol(t, st) draws the frame; st = { cam, beam (0 off … 1 on), beamColor [r,g,b], clinicLights (0..1),
// keeper (0..1 lamp in the keeper's window), boats } — everything is a pure function of (t, st).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a1530, 30, 110);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 400);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.25;

let seed = 5;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, ...o });
const at = (o, x, y, z) => (o.position.set(x, y, z), o);

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight(0x5d7bc4, 0x070b18, 0.55));
const moonL = new THREE.DirectionalLight(0xbcd0ff, 1.1);
moonL.position.set(-20, 30, -40);
scene.add(moonL);

// ---------------------------------------------------------------- stars + moon
{
  const N = 1800, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const th = rnd() * Math.PI * 2, ph = Math.acos(rnd() * 0.95), r = 200;
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.2, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false, fog: false })));
}
const moon = new THREE.Mesh(new THREE.SphereGeometry(4, 32, 16), new THREE.MeshBasicMaterial({ color: 0xf4f1e3, fog: false }));
scene.add(at(moon, -60, 48, -150));
const moonGlow = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.MeshBasicMaterial({ color: 0x9fb8ff, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
moonGlow.lookAt(0, 0, 0);
scene.add(at(moonGlow, -60, 48, -151));

// ---------------------------------------------------------------- sea (vertex waves, updated per frame)
const SEA = 200, SEG = 150;
const seaGeo = new THREE.PlaneGeometry(SEA, SEA, SEG, SEG);
seaGeo.rotateX(-Math.PI / 2);
const base = seaGeo.attributes.position.array.slice();
const seaMat = new THREE.MeshStandardMaterial({ color: 0x0b2552, roughness: 0.18, metalness: 0.35, envMapIntensity: 0.6 });
const sea = new THREE.Mesh(seaGeo, seaMat);
scene.add(sea);
function waves(t) {
  const p = seaGeo.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) {
    const x = base[i], z = base[i + 2];
    p[i + 1] = 0.18 * Math.sin(x * 0.35 + t * 1.1) + 0.12 * Math.sin(z * 0.5 - t * 0.9) + 0.06 * Math.sin((x + z) * 0.9 + t * 1.7);
  }
  seaGeo.attributes.position.needsUpdate = true;
  seaGeo.computeVertexNormals();
}
// moon path on the water
const glint = new THREE.Mesh(new THREE.PlaneGeometry(6, 80), new THREE.MeshBasicMaterial({ color: 0x9fb8ff, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending }));
glint.rotation.x = -Math.PI / 2;
glint.rotation.z = -0.35;
scene.add(at(glint, -14, 0.25, -50));

// ---------------------------------------------------------------- island + lighthouse
const island = new THREE.Group();
scene.add(island);
const rock = M(0x3b3f4a, { roughness: 0.95, flatShading: true });
const rock2 = M(0x4a4f5c, { roughness: 0.95, flatShading: true });
for (let i = 0; i < 9; i++) {
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + rnd() * 1.6, 0), i % 2 ? rock : rock2);
  const a = rnd() * Math.PI * 2, d = rnd() * 2.6;
  r.scale.set(1, 0.55 + rnd() * 0.4, 1);
  r.rotation.set(rnd(), rnd() * 3, rnd());
  island.add(at(r, Math.cos(a) * d, 0.2 + rnd() * 0.4, Math.sin(a) * d));
}
const grass = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.9, 0.9, 12), M(0x2f4a35, { roughness: 1, flatShading: true }));
island.add(at(grass, 0, 1.0, 0));
const tower = new THREE.Group();
island.add(at(tower, 0, 1.4, 0));
const TH = 7.2, rB = 1.05, rT = 0.72, bands = 6;
for (let i = 0; i < bands; i++) {
  const y0 = (i / bands) * TH, y1 = ((i + 1) / bands) * TH;
  const r0 = rB + (rT - rB) * (y0 / TH), r1 = rB + (rT - rB) * (y1 / TH);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, y1 - y0, 40), M(i % 2 ? 0xf3f1ea : 0xd6342f, { roughness: 0.6 }));
  tower.add(at(b, 0, (y0 + y1) / 2, 0));
}
// keeper's window (a lamp that goes out)
const keeperWin = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.5), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffc46b, emissiveIntensity: 0 }));
tower.add(at(keeperWin, 0, 2.4, 0.97));
const gallery = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.14, 40), M(0x22262f, { metalness: 0.4, roughness: 0.5 }));
tower.add(at(gallery, 0, TH + 0.07, 0));
const rail = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.03, 6, 48), M(0x22262f));
rail.rotation.x = Math.PI / 2;
tower.add(at(rail, 0, TH + 0.45, 0));
const lanternMat = new THREE.MeshStandardMaterial({ color: 0x1a1406, emissive: 0xffd27a, emissiveIntensity: 2, transparent: true, opacity: 0.92, roughness: 0.2 });
const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.95, 24), lanternMat);
tower.add(at(lantern, 0, TH + 0.62, 0));
const dome = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.7, 24), M(0xd6342f, { roughness: 0.5 }));
tower.add(at(dome, 0, TH + 1.45, 0));
const lamp = new THREE.PointLight(0xffd27a, 0, 30, 1.6);
tower.add(at(lamp, 0, TH + 0.62, 0));
// the beam: two long soft cones, additive
const beamMat = new THREE.ShaderMaterial({
  uniforms: { col: { value: new THREE.Color(0xffe1a0) }, k: { value: 1 } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY=uv.y; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
  fragmentShader: 'uniform vec3 col; uniform float k; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float edge=pow(abs(dot(vN,vV)),1.5); float a=pow(vY,0.9)*(0.35+0.65*edge)*1.1*k; gl_FragColor=vec4(col*a,a); }',
});
const beam = new THREE.Group();
tower.add(at(beam, 0, TH + 0.62, 0));
for (const s of [1, -1]) {
  const g = new THREE.ConeGeometry(5.0, 40, 40, 1, true);
  g.translate(0, -20, 0);
  const c = new THREE.Mesh(g, beamMat);
  c.rotation.z = s * Math.PI / 2;
  c.rotation.y = 0;
  c.position.y = 0;
  beam.add(c);
}
island.position.set(-6, -0.2, -14);

// ---------------------------------------------------------------- the clinic on the shore
const shore = new THREE.Group();
scene.add(shore);
const sand = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 9), M(0x5a5240, { roughness: 1 }));
shore.add(at(sand, 0, -0.1, 0));
const pier = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 7), M(0x5b4330, { roughness: 0.9 }));
shore.add(at(pier, -4.5, 0.55, 6));
const clinic = new THREE.Group();
shore.add(at(clinic, 2, 0.5, -0.5));
const wall = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.4, 3.6), M(0xeef1f6, { roughness: 0.7 }));
clinic.add(at(wall, 0, 1.7, 0));
const roof = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.3, 4.0), M(0x2a3a66, { roughness: 0.6 }));
clinic.add(at(roof, 0, 3.55, 0));
const winMat = new THREE.MeshStandardMaterial({ color: 0x1a2235, emissive: 0xffd89a, emissiveIntensity: 0 });
for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
  if (r === 0 && (c === 1 || c === 2)) continue;
  const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), winMat);
  clinic.add(at(w, -2.25 + c * 1.5, 1.05 + r * 1.35, 1.81));
}
const door = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.5), winMat);
clinic.add(at(door, 0, 0.75, 1.81));
// sign drawn on a canvas
const sc = document.createElement('canvas'); sc.width = 1024; sc.height = 192;
{
  const x = sc.getContext('2d');
  x.fillStyle = '#0865fe'; x.fillRect(0, 0, 1024, 192);
  x.fillStyle = '#fff'; x.font = '800 92px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('Clínica Exemplo', 512, 100);
}
const signTex = new THREE.CanvasTexture(sc); signTex.colorSpace = THREE.SRGBColorSpace;
const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.8 });
const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.79), signMat);
clinic.add(at(sign, 0, 3.05, 1.83));
const porch = new THREE.PointLight(0xffd89a, 0, 9, 1.8);
clinic.add(at(porch, 0, 2.2, 3.2));
shore.position.set(5, 0, 6);
// palm-ish posts and a street lamp
for (const [x, z] of [[-6, -1], [8, 0.5]]) {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.6, 8), M(0x3d2f22));
  shore.add(at(p, x, 1.8, z));
  for (let k = 0; k < 5; k++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.8, 6), M(0x1f5a35, { flatShading: true })); l.rotation.set(Math.PI / 2.4, (k / 5) * Math.PI * 2, 0); shore.add(at(l, x + Math.cos((k / 5) * Math.PI * 2) * 0.7, 3.6, z + Math.sin((k / 5) * Math.PI * 2) * 0.7)); }
}

// ---------------------------------------------------------------- boats
function boat(color) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.7), M(color, { roughness: 0.6 }));
  g.add(at(hull, 0, 0.2, 0));
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.5), M(0xf3f1ea));
  g.add(at(cab, -0.2, 0.62, 0));
  const lightB = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
  g.add(at(lightB, -0.2, 0.92, 0));
  scene.add(g);
  return g;
}
const boats = [boat(0x2f7bff), boat(0xff9f1c)];

// ---------------------------------------------------------------- frame
window.farolScreen = (what = 'lantern') => {
  const v = (what === 'clinic' ? clinic.localToWorld(new THREE.Vector3(0, 3.6, 1.8)) : tower.localToWorld(new THREE.Vector3(0, TH + 0.62, 0))).project(camera);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};
window.farol = (t, st = {}) => {
  waves(t);
  const on = st.beam ?? 1;
  beam.rotation.y = t * 0.9;
  const bc = st.beamColor || [1, 0.88, 0.63];
  beamMat.uniforms.col.value.setRGB(...bc);
  beamMat.uniforms.k.value = on;
  lanternMat.emissive.setRGB(...bc);
  lanternMat.emissiveIntensity = 0.15 + 2.2 * on;
  lamp.color.setRGB(...bc);
  lamp.intensity = 14 * on;
  keeperWin.material.emissiveIntensity = 1.6 * (st.keeper || 0);
  const cl = st.clinicLights ?? 1;
  winMat.emissiveIntensity = 1.5 * cl;
  porch.intensity = 6 * cl;
  signMat.emissiveIntensity = 0.25 + 0.6 * cl;
  boats.forEach((b, i) => {
    const p = (st.boats ?? 0) * (i ? 0.7 : 1);
    const x = i ? 18 - 10 * p : -16 + 12 * p, z = i ? -6 + 4 * p : -2 + 5 * p;
    b.position.set(x, 0.05 + Math.sin(t * 1.4 + i) * 0.08, z);
    b.rotation.set(Math.sin(t * 1.1 + i) * 0.06, i ? Math.PI * 0.85 : 0.3, Math.sin(t * 0.9 + i) * 0.05);
  });
  const c = st.cam || { pos: [8, 6, 22], look: [-2, 3, -8], fov: 40 };
  camera.position.set(...c.pos);
  camera.lookAt(new THREE.Vector3(...c.look));
  camera.fov = c.fov || 40;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
};
