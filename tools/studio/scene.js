import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RECIPES, buildStack } from './recipes.js';
import { SCENES } from './props.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

function makeScene() {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const key = new THREE.DirectionalLight('#fff0d8', 3.9);
  key.position.set(-7, 12, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -10;
  key.shadow.camera.right = key.shadow.camera.top = 10;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 50;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);

  const rim = new THREE.DirectionalLight('#ffe2bd', 4.6);
  rim.position.set(8, 6, -10);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight('#fff4e6', 1.6);
  rim2.position.set(-9, 4, -8);
  scene.add(rim2);
  const fill = new THREE.DirectionalLight('#e4ecff', 0.55);
  fill.position.set(9, 2, 7);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight('#fff6e8', '#3a1408', 0.3));
  return scene;
}

function makeCamera({ dist = 46, elev = 15, ty = 3.6, fov = 20, yaw = 0 }) {
  const cam = new THREE.PerspectiveCamera(fov, 1, 1, 400);
  const e = (elev * Math.PI) / 180;
  const y = (yaw * Math.PI) / 180;
  cam.position.set(Math.sin(y) * dist * Math.cos(e), ty + dist * Math.sin(e), Math.cos(y) * dist * Math.cos(e));
  cam.lookAt(0, ty, 0);
  cam.updateMatrixWorld();
  return cam;
}

function project(cam, v, size) {
  const p = v.clone().project(cam);
  return { x: ((p.x + 1) / 2) * size, y: ((1 - p.y) / 2) * size };
}

function snapshot(scene, cam) {
  renderer.render(scene, cam);
  return renderer.domElement.toDataURL('image/png');
}

window.studio = {
  // Burger renders: full composite (with inter-layer shadows) or one image per layer, all in one shared frame.
  burger({ recipe, size = 1600, mode = 'composite', camera = {}, scale = 1 }) {
    renderer.setSize(size, size);
    const scene = makeScene();
    const { root, layers, height } = buildStack(recipe);
    root.scale.setScalar(scale);
    scene.add(root);
    const cam = makeCamera({ ty: (height * scale) / 2 + 0.2, ...camera });
    if (mode === 'composite') return [{ name: 'composite', data: snapshot(scene, cam), height }];
    const out = [];
    layers.forEach((layer, i) => {
      layers.forEach((l, j) => (l.group.visible = j === i));
      const mid = ((layer.y0 + layer.y1) / 2) * scale;
      const right = project(cam, new THREE.Vector3(layer.radius * scale * 0.92, mid, 0), size);
      const left = project(cam, new THREE.Vector3(-layer.radius * scale * 0.92, mid, 0), size);
      const center = project(cam, new THREE.Vector3(0, mid, 0), size);
      out.push({ name: `${String(i).padStart(2, '0')}-${layer.key}`, key: layer.key, label: layer.label, anchor: { left, right, center }, data: snapshot(scene, cam) });
    });
    return out;
  },
  // Single props: sides, desserts, drinks, floating ingredients.
  prop({ id, size = 1200, camera = {} }) {
    renderer.setSize(size, size);
    const scene = makeScene();
    const spec = SCENES[id]();
    scene.add(spec.object);
    const cam = makeCamera({ ...spec.camera, ...camera });
    return [{ name: id, data: snapshot(scene, cam) }];
  },
  list() {
    return { burgers: Object.keys(RECIPES), props: Object.keys(SCENES) };
  },
};
window.studioReady = true;
