import { Document, WebIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

/**
 * The 3D dish file (GLB), used by the team's upload in the browser and checked again on the server.
 * glTF is in metres: after `assentar` the widest side seen from above is exactly the dish's real width,
 * so every AR viewer (iPhone Quick Look, Android Scene Viewer, WebXR) shows it at real size.
 */

/** What the server accepts. A body over 4.5 MB never reaches a Vercel function, so stay under it. */
export const MAX_BYTES = 4 * 1024 * 1024;
/** Enough detail for a dish on a phone; scans come with millions and are simplified down to this. */
export const MAX_TRIANGULOS = 150_000;
export const LARGURA_MIN_CM = 3;
export const LARGURA_MAX_CM = 100;

export class Modelo3dError extends Error {}

export const io = () => new WebIO().registerExtensions(ALL_EXTENSIONS);

/** A binary glTF 2.0 whose header length matches the file (anything else is refused before parsing). */
export function cabecalhoGlb(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 20) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(0, true) === 0x46546c67 /* glTF */ && view.getUint32(4, true) === 2 && view.getUint32(8, true) === bytes.byteLength;
}

function cena(doc: Document) {
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  if (!scene || !scene.listChildren().length) throw new Modelo3dError('O arquivo não tem nenhum objeto 3D.');
  return scene;
}

export function triangulos(doc: Document): number {
  let total = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const n = prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION')?.getCount() ?? 0;
      // Mode 4 = triangles; strips and fans are rare in scans, counted roughly the same.
      total += prim.getMode() === 4 ? n / 3 : Math.max(0, n - 2);
    }
  }
  return Math.round(total);
}

/** Size of what the file shows, in centimetres (glTF units are metres). Width = widest side seen from above. */
export function medidas(doc: Document) {
  const { min, max } = getBounds(cena(doc));
  const [dx, dy, dz] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  if (![dx, dy, dz].every(Number.isFinite) || Math.max(dx, dz) <= 0) throw new Modelo3dError('Não deu para medir o objeto 3D.');
  const cm = (m: number) => Math.round(m * 1000) / 10;
  return { larguraCm: cm(Math.max(dx, dz)), alturaCm: cm(dy), profundidadeCm: cm(Math.min(dx, dz)) };
}

/**
 * Scales the whole scene so its widest side seen from above is `larguraCm`, centres it and rests it on the
 * table (lowest point at height 0). Wraps the scene in one new root node; the original nodes are untouched.
 */
export function assentar(doc: Document, larguraCm: number) {
  if (!Number.isFinite(larguraCm) || larguraCm < LARGURA_MIN_CM || larguraCm > LARGURA_MAX_CM) {
    throw new Modelo3dError(`A largura real precisa estar entre ${LARGURA_MIN_CM} e ${LARGURA_MAX_CM} cm.`);
  }
  const scene = cena(doc);
  const { min, max } = getBounds(scene);
  const largura = Math.max(max[0] - min[0], max[2] - min[2]);
  if (!Number.isFinite(largura) || largura <= 0) throw new Modelo3dError('Não deu para medir o objeto 3D.');
  const f = larguraCm / 100 / largura;
  const cx = (min[0] + max[0]) / 2;
  const cz = (min[2] + max[2]) / 2;
  const raiz = doc.createNode('tamanho-real').setScale([f, f, f]).setTranslation([-cx * f, -min[1] * f, -cz * f]);
  for (const child of [...scene.listChildren()]) {
    scene.removeChild(child);
    raiz.addChild(child);
  }
  scene.addChild(raiz);
  return medidas(doc);
}
