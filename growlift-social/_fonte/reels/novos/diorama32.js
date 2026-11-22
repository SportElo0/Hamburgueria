// Reel 32 · "O balão": a glossy orange latex balloon and a chrome needle pressing its skin, very slowly (the tension
// hook), shot like a macro lens (depth of field), then the same balloon as a wireframe ("it is not even real") and,
// at the end, the pop: the skin tears into curled shreds. Our own 3D scene, rendered frame by frame (Three.js).
// window.balao(t, st) draws the frame; st = { cam:{pos,look,fov}, focus, aperture, press (0..1 depth of the dimple),
// wire (0..1), pop (seconds since the pop, or -1), hide (hide the balloon) }. Pure function of (t, st).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050302);
const camera = new THREE.PerspectiveCamera(30, W / H, 0.01, 100);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.02).texture;
scene.environmentIntensity = 0.55;

// ---------------------------------------------------------------- lights: a big soft box above-left (the curved
// highlight on the latex), a warm rim from behind, a dim fill.
const box = new THREE.RectAreaLight(0xfff4ea, 9, 3.2, 1.4);
box.position.set(-1.6, 3.2, 2.6);
box.lookAt(0, 0.2, 0);
scene.add(box);
const rim = new THREE.SpotLight(0xff7a30, 60, 20, 0.6, 0.8, 1.4);
rim.position.set(1.5, 2.5, -4);
rim.target.position.set(0, 0, 0);
scene.add(rim, rim.target);
const under = new THREE.PointLight(0xff5a1a, 6, 6, 1.6);
under.position.set(0, -2.2, 1.2);
scene.add(under);
scene.add(new THREE.HemisphereLight(0x2a1a14, 0x000000, 0.25));

// ---------------------------------------------------------------- balloon (unit-ish radius 1, top at y=1.0)
const SEG = 240;
const geo = new THREE.SphereGeometry(1, SEG, SEG);
{
  // balloon shape: a bit taller, narrowing to the knot at the bottom
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = y < 0 ? 1 - 0.22 * Math.pow(-y, 2.2) : 1;
    x *= k; z *= k; y = y < 0 ? y * 1.12 : y * 1.0;
    p.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
}
const base = Float32Array.from(geo.attributes.position.array);
const latex = new THREE.MeshPhysicalMaterial({
  color: 0xff4a10,
  roughness: 0.3,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.07,
  sheen: 0.6,
  sheenColor: new THREE.Color(0xffa070),
  sheenRoughness: 0.4,
  emissive: new THREE.Color(0x3a0800),
  emissiveIntensity: 0.6,
});
const balloon = new THREE.Mesh(geo, latex);
const knot = new THREE.Group();
{
  const m = new THREE.MeshPhysicalMaterial({ color: 0xe0400c, roughness: 0.35, clearcoat: 0.8 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.13, 0.16, 32), m);
  neck.position.y = -1.2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.035, 16, 40), m);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.3;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), m);
  tip.position.y = -1.36;
  knot.add(neck, ring, tip);
}
const group = new THREE.Group();
group.add(balloon, knot);
scene.add(group);

// wireframe twin ("it is not even real")
const wireMat = new THREE.MeshBasicMaterial({ color: 0xff6a2a, wireframe: true, transparent: true, opacity: 0 });
const wireGeo = new THREE.SphereGeometry(1, 64, 48);
const wire = new THREE.Mesh(wireGeo, wireMat);
const wireBase = Float32Array.from(wireGeo.attributes.position.array);
{
  const p = wireGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = y < 0 ? 1 - 0.22 * Math.pow(-y, 2.2) : 1;
    p.setXYZ(i, x * k, y < 0 ? y * 1.12 : y, z * k);
  }
  wireBase.set(p.array);
}
group.add(wire);

// ---------------------------------------------------------------- needle (chrome, tip pointing down)
const needle = new THREE.Group();
{
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xf2f4f7, metalness: 1, roughness: 0.12, clearcoat: 1, envMapIntensity: 1.6 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 6, 32), chrome);
  shaft.position.y = 3.0 + 0.09;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.09, 32), chrome);
  tip.rotation.x = Math.PI;
  tip.position.y = 0.045;
  needle.add(shaft, tip);
}
scene.add(needle);
const needleWire = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.0005, 6, 8, 12), new THREE.MeshBasicMaterial({ color: 0xff8a50, wireframe: true, transparent: true, opacity: 0 }));
needleWire.position.y = 3.0;
scene.add(needleWire);

// ---------------------------------------------------------------- shreds for the pop
const shreds = new THREE.Group();
let seed = 32;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 240; i++) {
  const w = 0.1 + rnd() * 0.3, h = 0.05 + rnd() * 0.16;
  const g = new THREE.PlaneGeometry(w, h, 6, 2);
  const p = g.attributes.position;
  for (let j = 0; j < p.count; j++) p.setZ(j, Math.sin((p.getX(j) / w) * Math.PI * 1.5) * h * 0.6);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: 0xff4a10, roughness: 0.35, clearcoat: 1, side: THREE.DoubleSide, emissive: 0x5a1200 }));
  // start on the balloon surface
  const th = rnd() * Math.PI * 2, ph = Math.acos(1 - 2 * rnd());
  const dir = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
  m.userData = { dir, sp: 1.6 + rnd() * 3.2, w: new THREE.Vector3(rnd() * 14, rnd() * 14, rnd() * 14) };
  shreds.add(m);
}
shreds.visible = false;
scene.add(shreds);

// ---------------------------------------------------------------- post: macro depth of field
const composer = new EffectComposer(renderer);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 4, aperture: 0.004, maxblur: 0.012 });
composer.addPass(bokeh);
composer.addPass(new OutputPass());

const clamp = (x) => Math.max(0, Math.min(1, x));
window.balaoScreen = (x, y, z) => {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};

function dimple(posAttr, src, depth) {
  // push the skin in around the north pole (where the needle is), with a soft raised rim
  const a = posAttr.array;
  for (let i = 0; i < a.length; i += 3) {
    const x = src[i], y = src[i + 1], z = src[i + 2];
    const r = Math.hypot(x, z); // distance from the axis
    if (y < 0.55 || depth <= 0) { a[i] = x; a[i + 1] = y; a[i + 2] = z; continue; }
    const s = 0.16 + depth * 0.5; // the dimple gets wider as it gets deeper
    const g = Math.exp(-Math.pow(r / s, 2));
    const ring = 0.05 * depth * Math.exp(-Math.pow((r - s * 1.3) / (s * 0.5), 2));
    const dy = -depth * g + ring * 0.4;
    a[i] = x * (1 - 0.05 * depth * g); a[i + 1] = y + dy; a[i + 2] = z * (1 - 0.05 * depth * g);
  }
  posAttr.needsUpdate = true;
}

window.balao = (t, st = {}) => {
  const c = st.cam;
  camera.position.set(...c.pos);
  camera.fov = c.fov;
  camera.updateProjectionMatrix();
  camera.lookAt(...c.look);

  const press = clamp(st.press ?? 0) * 0.42; // world units of the dimple
  dimple(geo.attributes.position, base, press);
  geo.computeVertexNormals();
  dimple(wireGeo.attributes.position, wireBase, press);
  // the tip sits right in the bottom of the dimple
  const tipY = 1.0 - press + 0.004;
  needle.position.set(0, tipY + (st.needleUp ?? 0), 0);
  needleWire.position.y = tipY + 3.0;

  const wireK = clamp(st.wire ?? 0);
  wireMat.opacity = wireK;
  needleWire.material.opacity = wireK;
  latex.opacity = 1 - wireK;
  latex.transparent = wireK > 0;
  balloon.visible = wireK < 0.999;
  knot.visible = wireK < 0.5;
  needle.visible = wireK < 0.999 && (st.needle ?? true);
  wire.visible = wireK > 0.001;
  needleWire.visible = wireK > 0.001;

  const pop = st.pop ?? -1;
  group.visible = pop < 0 && !st.hide;
  shreds.visible = pop >= 0 && pop < 2.2;
  if (shreds.visible) {
    shreds.children.forEach((m) => {
      const u = m.userData, d = u.sp * pop * (1 - Math.min(0.6, pop * 0.25));
      m.position.copy(u.dir).multiplyScalar(1 + d);
      if (u.dir.y < 0) m.position.y *= 1.12;
      m.position.y -= 1.5 * pop * pop;
      m.rotation.set(u.w.x * pop, u.w.y * pop, u.w.z * pop);
      m.scale.setScalar(Math.max(0.001, 1 - Math.pow(pop / 2.2, 2)));
    });
  }
  group.rotation.y = st.spin ?? 0;

  bokeh.uniforms.focus.value = st.focus ?? camera.position.distanceTo(new THREE.Vector3(0, 1, 0));
  bokeh.uniforms.aperture.value = st.aperture ?? 0.002;
  bokeh.uniforms.maxblur.value = st.maxblur ?? 0.01;
  composer.render();
};
