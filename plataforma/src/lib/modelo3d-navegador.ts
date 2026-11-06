import { MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import type { Document } from '@gltf-transform/core';
import { dedup, prune, simplify, weld } from '@gltf-transform/functions';
import { MAX_BYTES, MAX_TRIANGULOS, Modelo3dError, io, medidas, triangulos } from './modelo3d';

/**
 * Every texture to at most 1024 px, as JPEG (quality 0.85), or PNG when the dish uses transparency
 * (the iPhone's USDZ only takes JPEG or PNG). 1024 px is sharp at a dish's size on a phone.
 */
async function reduzirImagens(doc: Document, transparente: boolean) {
  const tipo = transparente ? 'image/png' : 'image/jpeg';
  for (const t of doc.getRoot().listTextures()) {
    const img = t.getImage();
    const mime = t.getMimeType();
    if (!img || !/^image\/(png|jpeg|webp)$/.test(mime)) continue; // KTX2 or unknown: left as is, the server checks it
    const bmp = await createImageBitmap(new Blob([img as BlobPart], { type: mime }));
    const f = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * f));
    const h = Math.max(1, Math.round(bmp.height * f));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Modelo3dError('Este navegador não conseguiu reduzir as imagens do 3D. Use o Chrome.');
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, tipo, 0.85));
    if (!blob) throw new Modelo3dError('Não deu para reduzir as imagens do 3D.');
    const novo = new Uint8Array(await blob.arrayBuffer());
    if (f === 1 && mime === tipo && novo.byteLength >= img.byteLength) continue; // already small: keep the original
    t.setImage(novo).setMimeType(tipo).setURI('');
  }
  // WebP images became JPEG/PNG: drop the extension so viewers without WebP open the file.
  if (!doc.getRoot().listTextures().some((t) => t.getMimeType() === 'image/webp')) {
    for (const ext of doc.getRoot().listExtensionsUsed()) if (ext.extensionName === 'EXT_texture_webp') ext.dispose();
  }
}

/**
 * Runs in the team's browser before the upload: a phone scan (often 10–60 MB, millions of triangles,
 * 4K textures) becomes a light GLB a table's phone opens quickly. Loaded only when someone picks a file.
 * The real-size scaling is not done here: the server does it, so the stored size is always the checked one.
 */
export async function prepararNoNavegador(file: File) {
  if (!/\.glb$/i.test(file.name)) throw new Modelo3dError('Envie o arquivo .glb (no Polycam ou no KIRI: Exportar › GLB).');
  if (file.size > 200 * 1024 * 1024) throw new Modelo3dError('O arquivo passa de 200 MB. Exporte com qualidade média e tente de novo.');

  await Promise.all([MeshoptDecoder.ready, MeshoptSimplifier.ready]);
  const reader = io().registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  let doc;
  try {
    doc = await reader.readBinary(new Uint8Array(await file.arrayBuffer()));
  } catch (err) {
    const draco = String(err).includes('draco');
    throw new Modelo3dError(draco ? 'Exporte o GLB sem compressão Draco e tente de novo.' : 'Não deu para abrir o arquivo 3D. Exporte de novo em GLB.');
  }

  // Compressed meshes are decoded on read; drop the extensions so the file opens in every AR viewer.
  for (const ext of doc.getRoot().listExtensionsUsed()) {
    if (ext.extensionName === 'EXT_meshopt_compression' || ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  }
  const antes = triangulos(doc);
  const transparente = doc.getRoot().listMaterials().some((m) => m.getAlphaMode() !== 'OPAQUE');
  await doc.transform(
    dedup(),
    prune(),
    weld(),
    ...(antes > MAX_TRIANGULOS ? [simplify({ simplifier: MeshoptSimplifier, ratio: MAX_TRIANGULOS / antes, error: 0.002 })] : []),
    prune(),
  );
  await reduzirImagens(doc, transparente);
  const bytes = await io().writeBinary(doc);
  if (bytes.byteLength > MAX_BYTES) {
    throw new Modelo3dError(`Mesmo reduzido, o 3D ficou com ${(bytes.byteLength / 1048576).toFixed(1)} MB (máximo 4 MB). Exporte com menos detalhe e tente de novo.`);
  }
  // A LiDAR scan already comes in real size: suggest it, the team confirms with a ruler.
  let sugestaoCm: number | null = null;
  try {
    const { larguraCm } = medidas(doc);
    if (larguraCm >= 3 && larguraCm <= 100) sugestaoCm = Math.round(larguraCm * 2) / 2;
  } catch {
    // An empty scene fails on the server with a clear message.
  }
  return { bytes, triangulos: triangulos(doc), trianguloAntes: antes, sugestaoCm };
}
