// Reel 38 · "Montando o atendimento": plataformas escuras flutuando no vazio, bordas de luz azul, bonequinhos lisos e
// bolinhas de luz (os contatos) andando. Feito do zero (Three.js + bloom). window.cena38(t, st) desenha o quadro.
// st: { cam:{pos,look,fov}, floors (1..4 andares visíveis), people:[{x,z,floor,show}], ia (0..1), orbs:[{x,y,z,c,a,s}],
//       slots:{floor, filled:[0/1...]}, ring (0..1) }
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x010204);
scene.fog = new THREE.Fog(0x010204, 18, 60);
const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 200);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.55, 0.3, 0.62));
composer.addPass(new OutputPass());

const BLUE = 0x2f7dff, BLUE_L = 0x7fb2ff;
const at = (o, x, y, z) => (o.position.set(x, y, z), o);
scene.add(new THREE.HemisphereLight(0x6f8fd0, 0x000000, 0.2));
const key = new THREE.DirectionalLight(0xdfe8ff, 1.8); key.position.set(4, 10, 6); scene.add(key);

// ------------------------------------------------------------ andares (plataformas no vácuo, borda de luz)
const FLOOR_Y = [0, 1.7, 3.4, 5.1];
const FLOOR_Z = [0, -2.9, -5.8, -8.7];
window.STEP = { y: FLOOR_Y, z: FLOOR_Z };
const floors = FLOOR_Y.map((y, i) => {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 2.8), new THREE.MeshStandardMaterial({ color: 0x07090f, roughness: 0.7, metalness: 0.2 }));
  g.add(slab);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(8.02, 0.32, 2.82)), new THREE.LineBasicMaterial({ color: BLUE_L }));
  g.add(edge);
  const strip = at(new THREE.Mesh(new THREE.BoxGeometry(8.04, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: BLUE })), 0, 0.16, 1.41);
  g.add(strip);
  // trilho por onde os contatos passam
  const lane = at(new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.02, 0.5), new THREE.MeshBasicMaterial({ color: 0x0d2150 })), 0, 0.16, 0.55);
  g.add(lane);
  const laneL = at(new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.025, 0.025), new THREE.MeshBasicMaterial({ color: BLUE })), 0, 0.17, 0.3); g.add(laneL);
  const laneR = at(new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.025, 0.025), new THREE.MeshBasicMaterial({ color: BLUE })), 0, 0.17, 0.8); g.add(laneR);
  // degrau de ligação (rampa de luz) para o próximo andar
  const ramp = at(new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.7, 0.06), new THREE.MeshBasicMaterial({ color: BLUE_L })), 3.8, 0.85, -1.4); g.add(ramp);
  // mesa
  const desk = at(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.9), new THREE.MeshStandardMaterial({ color: 0x141a26, roughness: 0.5 })), 0, 0.42, -0.6);
  g.add(desk);
  const deskLine = at(new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: BLUE })), 0, 0.68, -0.14);
  g.add(deskLine);
  g.position.set(0, y, FLOOR_Z[i]); g.userData.edge = edge; g.userData.desk = desk; g.userData.deskLine = deskLine; g.userData.ramp = ramp; scene.add(g); return g;
});
// pilar de luz ligando os andares
const pillar = at(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 11, 24, 1, true), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.08, side: THREE.DoubleSide })), 3.4, 5, -1.8);
scene.add(pillar);

// ------------------------------------------------------------ bonequinhos lisos (estilo peão)
const pawnMat = new THREE.MeshStandardMaterial({ color: 0xeef2ff, roughness: 0.35, emissive: 0xdfe7ff, emissiveIntensity: 0.22 });
function pawn() {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.32, 0], [0.32, 0.06], [0.22, 0.12], [0.2, 0.55], [0.26, 0.62], [0.12, 0.7], [0, 0.7]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 24), pawnMat));
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), pawnMat), 0, 0.88, 0));
  g.scale.setScalar(1.25); return g;
}
const people = [0, 1, 2].map(() => { const p = pawn(); scene.add(p); return p; });
// IA: um cérebro 3D (dois hemisférios com dobras), casca translúcida azul, malha de luz e faíscas passando
const ia = new THREE.Group();
function hemisphere(side) {
  const g = new THREE.SphereGeometry(0.5, 160, 120);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    // dobras (giros): soma de ondas que dão a textura de cérebro
    const w1 = Math.sin(n.z * 11 + Math.sin(n.y * 6 + n.x * 3) * 1.6), w2 = Math.sin(n.y * 9 + Math.sin(n.z * 5) * 1.4);
    const fold = -0.035 * Math.pow(Math.abs(w1 * 0.7 + w2 * 0.5), 3);
    let r = 0.5 + fold;
    v.copy(n.multiplyScalar(r));
    v.x *= 0.62; v.y *= 0.78; v.z *= 1.18;   // formato alongado
    if (side * v.x < 0) v.x *= 0.25;           // achata o lado do meio (fissura)
    p.setXYZ(i, v.x + side * 0.3, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
const brainMat = new THREE.MeshStandardMaterial({ color: 0x3d6fd8, emissive: 0x1a4fc0, emissiveIntensity: 0.35, roughness: 0.45, metalness: 0.05 });
const wireMat = new THREE.MeshBasicMaterial({ color: BLUE_L, wireframe: true, transparent: true, opacity: 0.0 });
const brain = new THREE.Group();
for (const side of [-1, 1]) { const g = hemisphere(side); brain.add(new THREE.Mesh(g, brainMat)); const w = new THREE.Mesh(g, wireMat); w.scale.setScalar(1.01); brain.add(w); }
// tronco
brain.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.35, 16), brainMat), 0, -0.42, -0.15));
brain.position.y = 0.95; brain.scale.setScalar(1.25); ia.add(brain);
const brainL = new THREE.PointLight(0x7fb2ff, 6, 4); brainL.position.set(0.6, 1.6, 1.2); ia.add(brainL);
// faíscas (sinapses) em volta
const sparkGeo = new THREE.SphereGeometry(0.03, 8, 6), sparks = [];
for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: 0xdce8ff, transparent: true })); ia.add(m); sparks.push(m); }
// halo no chão
const iaRing = at(new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.025, 8, 64), new THREE.MeshBasicMaterial({ color: BLUE_L, transparent: true, opacity: 0.7 })), 0, 0.05, 0);
iaRing.rotation.x = Math.PI / 2; ia.add(iaRing);
const iaCube = brain; // compatibilidade com o código de animação
scene.add(ia);

// cadeiras / horários (agenda)
const slots = [];
for (let i = 0; i < 8; i++) {
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), new THREE.MeshStandardMaterial({ color: 0x0b1530, emissive: BLUE, emissiveIntensity: 0 }));
  scene.add(s); slots.push(s);
}
// anel de retomada
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.035, 8, 96), new THREE.MeshBasicMaterial({ color: BLUE_L, transparent: true }));
ring.rotation.x = Math.PI / 2; scene.add(ring);
// bolinhas (contatos)
const orbGeo = new THREE.SphereGeometry(0.13, 20, 14);
const orbs = Array.from({ length: 70 }, () => { const m = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({ color: BLUE_L, transparent: true })); scene.add(m); return m; });

window.cena38 = (t, st = {}) => {
  const nf = st.floors ?? 1;
  floors.forEach((f, i) => { f.visible = i < nf; f.userData.edge.material.opacity = 1; });
  pillar.visible = false;
  floors.forEach((f, i) => { f.userData.ramp.visible = i < nf - 1; f.userData.desk.visible = i === 0; f.userData.deskLine.visible = i === 0; });
  people.forEach((p, i) => { const d = (st.people || [])[i]; p.visible = !!(d && d.show); if (d) p.position.set(d.x, FLOOR_Y[d.floor || 0] + 0.15, FLOOR_Z[d.floor || 0] + d.z); });
  const k = st.ia ?? 0; ia.visible = k > 0.01; ia.scale.setScalar(Math.max(0.01, k)); ia.position.set(st.iaX ?? 1.6, FLOOR_Y[st.iaFloor || 0] + 0.15, FLOOR_Z[st.iaFloor || 0] + (st.iaZ ?? -0.3));
  brain.rotation.y = t * 0.6; brain.position.y = 0.95 + Math.sin(t * 2) * 0.05;
  iaRing.scale.setScalar(1 + 0.08 * Math.sin(t * 3));
  brainMat.emissiveIntensity = 0.3 + 0.2 * (0.5 + 0.5 * Math.sin(t * 5));
  sparks.forEach((sp, i) => { const a = i * 2.39 + t * (1.2 + (i % 3) * .4), r = 0.55 + (i % 4) * 0.06; sp.position.set(Math.cos(a) * r * 0.7, 0.95 + Math.sin(a * 1.7 + i) * 0.4, Math.sin(a) * r); sp.material.opacity = 0.5 + 0.5 * Math.sin(t * 8 + i); });
  const sl = st.slots; slots.forEach((s, i) => { s.visible = !!sl; if (!sl) return; s.position.set(-0.8 + (i % 4) * 1.0, FLOOR_Y[sl.floor] + 0.2, FLOOR_Z[sl.floor] + (i < 4 ? -0.9 : -0.2)); s.material.emissiveIntensity = sl.filled[i] ? 1.4 : 0.03; });
  ring.visible = (st.ring ?? 0) > 0.01; ring.material.opacity = st.ring ?? 0; ring.position.set(st.ringX ?? 2.2, FLOOR_Y[st.ringFloor || 0] + 0.3, FLOOR_Z[st.ringFloor || 0] + 0.55); ring.rotation.z = t * 0.6;
  orbs.forEach((o, i) => { const d = (st.orbs || [])[i]; o.visible = !!d && d.a > 0.01; if (!o.visible) return; o.position.set(d.x, d.y, d.z); o.material.color.setHex(d.c ?? BLUE_L); o.material.opacity = d.a; o.scale.setScalar(d.s ?? 1); });
  const c = st.cam; camera.position.set(...c.pos); camera.lookAt(new THREE.Vector3(...c.look)); camera.fov = c.fov || 36; camera.updateProjectionMatrix();
  composer.render();
};
