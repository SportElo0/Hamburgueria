// Prepares a GLB (an AI or scan model) for the 3D menu the way the panel does, on the computer:
// lighter (dedup, weld, textures at 1024 px JPEG) and scaled so its widest side seen from above is N cm.
//   node scripts/assentar-glb.mjs entrada.glb saida.glb 22
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

const [entrada, saida, cmTxt] = process.argv.slice(2);
const cm = Number(cmTxt);
if (!entrada || !saida || !(cm >= 3 && cm <= 100)) throw new Error('uso: node scripts/assentar-glb.mjs entrada.glb saida.glb <cm entre 3 e 100>');
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(entrada);
for (const ext of doc.getRoot().listExtensionsUsed()) {
  if (['EXT_meshopt_compression', 'KHR_draco_mesh_compression'].includes(ext.extensionName)) ext.dispose();
}
await doc.transform(dedup(), prune(), weld(), textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [1024, 1024], quality: 85 }), prune());
if (!doc.getRoot().listTextures().some((t) => t.getMimeType() === 'image/webp')) {
  for (const ext of doc.getRoot().listExtensionsUsed()) if (ext.extensionName === 'EXT_texture_webp') ext.dispose();
}
const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
const { min, max } = getBounds(scene);
const f = cm / 100 / Math.max(max[0] - min[0], max[2] - min[2]);
const raiz = doc.createNode('tamanho-real').setScale([f, f, f]).setTranslation([-((min[0] + max[0]) / 2) * f, -min[1] * f, -((min[2] + max[2]) / 2) * f]);
for (const child of [...scene.listChildren()]) {
  scene.removeChild(child);
  raiz.addChild(child);
}
scene.addChild(raiz);
await io.write(saida, doc);
const b = getBounds(scene);
const fmt = (v) => (v * 100).toFixed(1);
console.log(`ok: ${fmt(Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]))} cm de largura x ${fmt(b.max[1] - b.min[1])} cm de altura`);
