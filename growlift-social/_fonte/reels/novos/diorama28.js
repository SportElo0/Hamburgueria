// Reel 28 · "O que acontece se você gritar no espaço?": a 3D space scene (Three.js, frame by frame).
// A cute astronaut floats above the Earth (procedural texture, night lights, atmosphere glow); a scream makes sound
// rings that die at once (no air), then a radio link carries the voice to a second astronaut as glowing arcs.
// window.espaco(t, st) draws the frame; st = { cam:{pos,look,fov}, scream, radio, mouth, earthSpin, night, ... }.
// Everything is a pure function of (t, st), so every frame is reproducible.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x02040c, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 400);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

// ---------------------------------------------------------------- deterministic noise
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const P = new Uint8Array(512);
{ const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
const fade = (t) => t * t * (3 - 2 * t);
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (a, b) => P[(P[a & 255] + b) & 255] / 255;
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  const u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// wraps horizontally (period px) so the texture seam does not show
function fbm(x, y, period) {
  let s = 0, amp = 0.5, f = 1;
  for (let o = 0; o < 5; o++) {
    const px = period * f, X = ((x * f) % px + px) % px;
    const n0 = vnoise(X, y * f), n1 = vnoise(X - px, y * f);
    const k = X / px; s += amp * (n0 * (1 - k) + n1 * k);
    amp *= 0.5; f *= 2;
  }
  return s;
}

// ---------------------------------------------------------------- Earth textures (drawn once)
const TW = 1024, TH = 512;
function earthMaps() {
  const day = document.createElement('canvas'); day.width = TW; day.height = TH;
  const nig = document.createElement('canvas'); nig.width = TW; nig.height = TH;
  const cld = document.createElement('canvas'); cld.width = TW; cld.height = TH;
  const d = day.getContext('2d').createImageData(TW, TH), n = nig.getContext('2d').createImageData(TW, TH), c = cld.getContext('2d').createImageData(TW, TH);
  const per = 8;
  for (let y = 0; y < TH; y++) {
    const lat = Math.abs(y / TH - 0.5) * 2;
    for (let x = 0; x < TW; x++) {
      const u = (x / TW) * per, v = (y / TH) * 4;
      const h = fbm(u, v, per) - lat * 0.18;
      const i = (y * TW + x) * 4;
      let r, g, b;
      if (lat > 0.9 + 0.05 * fbm(x / TW * per * 3, 1, per * 3)) { r = 228; g = 236; b = 246; }
      else if (h > 0.52) {
        const k = Math.min(1, (h - 0.52) * 5);
        const dry = fbm(u * 2 + 9, v * 2, per * 2);
        r = 60 + 90 * dry * k + 20; g = 118 + 40 * (1 - dry) - 20 * k; b = 62 + 20 * dry;
        // night lights: dots on land, more near coasts
        const L = fbm(u * 9 + 3, v * 9, per * 9);
        const coast = 1 - Math.min(1, (h - 0.52) * 7);
        const lit = L > 0.6 - coast * 0.12 ? Math.min(1, (L - 0.5) * 4) : 0;
        n.data[i] = 255 * lit; n.data[i + 1] = 196 * lit; n.data[i + 2] = 110 * lit; n.data[i + 3] = 255;
      } else {
        const k = Math.max(0, (h - 0.3) / 0.22);
        r = 12 + 20 * k; g = 52 + 60 * k; b = 120 + 70 * k;
        n.data[i + 3] = 255;
      }
      d.data[i] = r; d.data[i + 1] = g; d.data[i + 2] = b; d.data[i + 3] = 255;
      const cl = fbm(u * 1.6 + 20, v * 1.6 + 5, per * 1.6);
      const a = Math.max(0, Math.min(1, (cl - 0.5) * 3.2));
      c.data[i] = 255; c.data[i + 1] = 255; c.data[i + 2] = 255; c.data[i + 3] = 255 * a;
    }
  }
  day.getContext('2d').putImageData(d, 0, 0); nig.getContext('2d').putImageData(n, 0, 0); cld.getContext('2d').putImageData(c, 0, 0);
  const tex = (cv, srgb = true) => { const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  return { day: tex(day), night: tex(nig), clouds: tex(cld) };
}
const maps = earthMaps();

// ---------------------------------------------------------------- lights
const sun = new THREE.DirectionalLight(0xfff4e8, 3.0);
sun.position.set(-30, 18, 20);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x30406a, 0.35));
const rimL = new THREE.DirectionalLight(0x5f8cff, 1.4);
rimL.position.set(20, 6, -20);
scene.add(rimL);

// ---------------------------------------------------------------- stars
{
  const N = 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = 150 + rnd() * 60;
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
    const w = 0.6 + rnd() * 0.4, tint = rnd();
    col.set([w * (tint > 0.85 ? 1 : 0.85), w * 0.9, w * (tint < 0.2 ? 0.8 : 1)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.1, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.95, depthWrite: false })));
}

// ---------------------------------------------------------------- Earth
const earth = new THREE.Group();
earth.position.set(0, -16, -12);
earth.rotation.set(0.65, 0, 0.25);
scene.add(earth);
const ER = 11;
const sunDirW = sun.position.clone().normalize();
const earthMat = new THREE.ShaderMaterial({
  uniforms: { day: { value: maps.day }, night: { value: maps.night }, sunDir: { value: sunDirW }, nightBoost: { value: 0 } },
  vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform sampler2D day; uniform sampler2D night; uniform vec3 sunDir; uniform float nightBoost; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ float l=dot(normalize(vN),normalize(sunDir)); float k=smoothstep(-0.15,0.25,l);
      vec3 dc=texture2D(day,vUv).rgb; vec3 nc=texture2D(night,vUv).rgb*(1.6+nightBoost*1.6);
      vec3 c=mix(nc+dc*0.04,dc*(0.25+0.95*max(l,0.)),k);
      float spec=pow(max(dot(reflect(-normalize(sunDir),normalize(vN)),vV),0.),40.)*0.35*k*(1.-step(0.25,dc.g-dc.b));
      float rim=pow(1.-max(dot(normalize(vN),vV),0.),3.);
      c+=vec3(0.3,0.55,1.)*rim*0.6*(0.3+0.7*k)+spec;
      gl_FragColor=vec4(c,1.); }`,
});
const globe = new THREE.Mesh(new THREE.SphereGeometry(ER, 96, 64), earthMat);
earth.add(globe);
const clouds = new THREE.Mesh(new THREE.SphereGeometry(ER * 1.012, 96, 64), new THREE.MeshLambertMaterial({ map: maps.clouds, transparent: true, opacity: 0.75, depthWrite: false }));
earth.add(clouds);
const atmo = new THREE.Mesh(new THREE.SphereGeometry(ER * 1.09, 96, 64), new THREE.ShaderMaterial({
  side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f=pow(0.72-dot(vN,vV),4.); gl_FragColor=vec4(0.32,0.6,1.0,1.)*f*2.4; }`,
}));
earth.add(atmo);

// ---------------------------------------------------------------- astronauts
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0, ...o });
const at = (o, x, y, z) => (o.position.set(x, y, z), o);
function astronaut(accent) {
  const g = new THREE.Group();
  const suit = M(0xf3f5fa, { roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 28), suit);
  body.scale.set(1, 1.08, 0.92);
  g.add(at(body, 0, -0.55, 0));
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.95, 0.38), M(0xd9dee8));
  g.add(at(pack, 0, -0.45, -0.52));
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 10, 48), M(accent));
  belt.rotation.x = Math.PI / 2;
  g.add(at(belt, 0, -0.75, 0));
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.06), M(0x1b2340));
  g.add(at(panel, 0, -0.42, 0.56));
  for (const [x, c] of [[-0.09, 0xff5a5a], [0, 0x37d67a], [0.09, 0x4d8dff]]) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshStandardMaterial({ color: 0, emissive: c, emissiveIntensity: 2 })), x, -0.42, 0.6));
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 8, 16), suit);
    a.position.y = -0.28;
    arm.add(a);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), M(accent));
    hand.position.y = -0.58;
    arm.add(hand);
    arm.position.set(s * 0.6, -0.3, 0);
    arm.rotation.z = s * 0.5;
    g.add(arm);
    arms.push(arm);
  }
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.32, 8, 16), suit);
    leg.position.set(s * 0.25, -1.2, 0.02);
    leg.rotation.z = s * 0.15;
    g.add(leg);
    const boot = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 12), M(0x2a3150));
    boot.scale.set(1, 0.7, 1.25);
    g.add(at(boot, s * 0.29, -1.5, 0.06));
  }
  // head inside the helmet
  const head = new THREE.Group();
  g.add(at(head, 0, 0.45, 0));
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.48, 40, 28), M(0xffb889, { roughness: 0.5 }));
  head.add(face);
  for (const x of [-0.16, 0.16]) {
    head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), M(0xffffff, { roughness: 0.25 })), x, 0.08, 0.4));
    head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 10), M(0x111111, { roughness: 0.2 })), x, 0.08, 0.485));
  }
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), M(0x5a1820, { roughness: 0.6 }));
  mouth.scale.set(1.2, 0.25, 0.5);
  head.add(at(mouth, 0, -0.17, 0.44));
  for (const x of [-0.27, 0.27]) head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), M(0xff8a7a, { roughness: 0.6, transparent: true, opacity: 0.6 })), x, -0.07, 0.38));
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.78, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0xcfe4ff, roughness: 0.04, metalness: 0, transmission: 0, transparent: true, opacity: 0.22, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, depthWrite: false }));
  g.add(at(helmet, 0, 0.42, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.09, 12, 48), M(accent));
  ring.rotation.x = Math.PI / 2;
  g.add(at(ring, 0, -0.08, 0));
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8), M(0x9aa3b8));
  g.add(at(antenna, 0.5, 0.95, -0.4));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff3b3b, emissiveIntensity: 2.5 }));
  g.add(at(tip, 0.5, 1.2, -0.4));
  return { g, head, mouth, arms, tip, helmet };
}
const A = astronaut(0x2f7bff);
scene.add(A.g);
const B = astronaut(0xff9f1c);
B.g.position.set(4.2, 2.6, -3.5);
B.g.rotation.y = -0.7;
scene.add(B.g);

// ---------------------------------------------------------------- sound rings (die at once) and radio arcs
const ringMat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
const rings = [0, 1, 2, 3].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 96), ringMat()); scene.add(r); return r; });
const arcs = [0, 1, 2, 3, 4].map(() => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.045, 8, 48, Math.PI * 0.9), new THREE.MeshBasicMaterial({ color: 0x6fb2ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(m);
  return m;
});
const beamMat = new THREE.MeshBasicMaterial({ color: 0x3d8bff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), beamMat);
scene.add(beam);

const clamp = (x) => Math.max(0, Math.min(1, x));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);

window.astroScreen = (which = 'A', dy = 0.45) => {
  const v = (which === 'A' ? A : B).g.localToWorld(new THREE.Vector3(0, dy, 0)).project(camera);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};

window.espaco = (t, st = {}) => {
  // float
  A.g.position.set(0 + Math.sin(t * 0.6) * 0.08, 1 + Math.sin(t * 0.9) * 0.12, 0);
  A.g.rotation.set(Math.sin(t * 0.5) * 0.06, (st.turnA ?? 0.35) + Math.sin(t * 0.4) * 0.08, Math.sin(t * 0.7) * 0.06);
  B.g.position.y = 2.6 + Math.sin(t * 0.8 + 1) * 0.12;
  B.g.rotation.z = Math.sin(t * 0.6 + 2) * 0.07;
  A.arms[0].rotation.z = -0.5 - (st.armsUp || 0) * 1.6 + Math.sin(t * 1.3) * 0.08;
  A.arms[1].rotation.z = 0.5 + (st.armsUp || 0) * 1.6 + Math.sin(t * 1.1) * 0.08;
  B.arms[1].rotation.z = 0.5 + (st.waveB || 0) * (1.8 + Math.sin(t * 9) * 0.3);
  // mouth: 0 closed smile … 1 wide scream
  const m = st.mouth || 0;
  A.mouth.scale.set(1.2 - 0.3 * m, 0.25 + 1.25 * m, 0.5 + 0.2 * m);
  A.tip.material.emissiveIntensity = 1.5 + (st.radio ? 2 * Math.max(0, Math.sin(t * 10)) : 0);
  // scream rings: born at the mouth, then shrink and vanish (no air to carry them)
  const sc = st.scream ?? -1;
  const mouthW = A.head.localToWorld(new THREE.Vector3(0, -0.17, 0.6));
  rings.forEach((r, k) => {
    const p = sc - k * 0.12;
    const alive = p > 0 && p < 1;
    r.visible = alive;
    if (!alive) return;
    const grow = eo(p / 0.35), die = clamp((p - 0.25) / 0.5);
    r.position.copy(mouthW);
    r.lookAt(camera.position);
    const s = 0.12 + grow * (0.45 + k * 0.16) * (1 - 0.7 * die);
    r.scale.setScalar(s);
    r.material.opacity = (1 - die) * 0.85;
  });
  // radio arcs travel from A's antenna to B
  const ra = st.radio ?? -1;
  const from = A.tip.getWorldPosition(new THREE.Vector3()), to = B.tip.getWorldPosition(new THREE.Vector3());
  const dir = to.clone().sub(from);
  arcs.forEach((a, k) => {
    const p = ((ra * 1.6 - k * 0.22) % 1.1 + 1.1) % 1.1;
    const on = ra > 0 && ra < 1.05 && ra * 1.6 - k * 0.22 > 0;
    a.visible = on;
    if (!on) return;
    a.position.copy(from).addScaledVector(dir, p);
    a.lookAt(to);
    a.rotateZ(Math.PI / 2 - Math.PI * 0.45);
    a.scale.setScalar(0.6 + p * 1.2);
    a.material.opacity = Math.sin(Math.PI * clamp(p)) * 0.95;
  });
  // the line linking both antennas while the radio is on
  const bo = ra > 0 && ra < 1.05 ? Math.min(1, ra * 4) * 0.35 : 0;
  beam.visible = bo > 0;
  if (bo > 0) {
    beam.position.copy(from).addScaledVector(dir, 0.5);
    beam.scale.set(1, dir.length(), 1);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    beamMat.opacity = bo;
  }
  B.g.visible = st.showB ?? true;
  A.g.visible = st.showA ?? true;
  globe.rotation.y = (st.earthSpin ?? 0) + t * 0.02;
  clouds.rotation.y = globe.rotation.y * 1.15 + t * 0.006;
  earthMat.uniforms.nightBoost.value = st.night || 0;
  const c = st.cam || { pos: [1.5, 1.6, 6.5], look: [0, 0.6, 0], fov: 38 };
  camera.position.set(...c.pos);
  camera.lookAt(new THREE.Vector3(...c.look));
  camera.fov = c.fov || 38;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
};
