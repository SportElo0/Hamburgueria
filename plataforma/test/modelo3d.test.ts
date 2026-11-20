import { describe, expect, it } from 'vitest';
import { Document } from '@gltf-transform/core';
import { assentar, cabecalhoGlb, io, medidas, Modelo3dError } from '@/lib/modelo3d';
import { itemSchema, modelo3dSchema, toPublic, emptyStore } from '@/lib/schema';

/** A box `w × h × d` in file units, off-centre and floating, like a scan in an arbitrary unit. */
function caixa(w: number, h: number, d: number, at: [number, number, number] = [3, 2, -5]) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const pos = new Float32Array([0, 0, 0, w, 0, 0, w, h, 0, 0, h, 0, 0, 0, d, w, 0, d, w, h, d, 0, h, d]);
  const idx = new Uint16Array([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7]);
  const prim = doc
    .createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(pos).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(idx).setBuffer(buffer));
  const node = doc.createNode('caixa').setMesh(doc.createMesh().addPrimitive(prim)).setTranslation(at);
  doc.createScene().addChild(node);
  return doc;
}

describe('prato em 3D', () => {
  it('coloca o maior lado visto de cima na largura real, centrado e apoiado na mesa', async () => {
    const doc = caixa(2, 0.5, 1.2); // widest side 2 units, whatever the unit was
    const m = assentar(doc, 18);
    expect(m).toEqual({ larguraCm: 18, alturaCm: 4.5, profundidadeCm: 10.8 });

    // Survives writing and reading back as GLB, as the server stores it.
    const bytes = await io().writeBinary(doc);
    expect(cabecalhoGlb(bytes)).toBe(true);
    const back = await io().readBinary(bytes);
    expect(medidas(back)).toEqual(m);
    const { getBounds } = await import('@gltf-transform/core');
    const { min, max } = getBounds(back.getRoot().listScenes()[0]);
    expect(min[1]).toBeCloseTo(0, 6); // resting on the table
    expect((min[0] + max[0]) / 2).toBeCloseTo(0, 6);
    expect((min[2] + max[2]) / 2).toBeCloseTo(0, 6);
  });

  it('usa o lado mais largo mesmo quando ele é a profundidade', () => {
    expect(assentar(caixa(0.3, 0.1, 0.6), 30).larguraCm).toBe(30);
  });

  it('recusa largura fora de 3 a 100 cm e arquivo sem objeto', () => {
    expect(() => assentar(caixa(1, 1, 1), 2)).toThrow(Modelo3dError);
    expect(() => assentar(caixa(1, 1, 1), 101)).toThrow(Modelo3dError);
    expect(() => assentar(caixa(1, 1, 1), Number.NaN)).toThrow(Modelo3dError);
    const vazio = new Document();
    vazio.createScene();
    expect(() => assentar(vazio, 20)).toThrow(Modelo3dError);
  });

  it('só aceita GLB 2.0 com o tamanho do cabeçalho certo', async () => {
    const bytes = await io().writeBinary(caixa(1, 1, 1));
    expect(cabecalhoGlb(bytes)).toBe(true);
    expect(cabecalhoGlb(bytes.slice(0, bytes.byteLength - 4))).toBe(false);
    expect(cabecalhoGlb(new TextEncoder().encode('{"asset":{"version":"2.0"}}'))).toBe(false);
    const v1 = bytes.slice();
    new DataView(v1.buffer).setUint32(4, 1, true);
    expect(cabecalhoGlb(v1)).toBe(false);
  });

  it('o item só guarda arquivo .glb da própria pasta de mídia, e itens antigos continuam válidos', () => {
    const ok = { src: 'midia/downtown/abc123.glb', larguraCm: 18, alturaCm: 9, profundidadeCm: 18 };
    expect(modelo3dSchema.safeParse(ok).success).toBe(true);
    for (const src of ['https://x.com/a.glb', 'midia/downtown/abc.png', 'midia/../x.glb', '/midia/a/b.glb']) {
      expect(modelo3dSchema.safeParse({ ...ok, src }).success).toBe(false);
    }
    const antigo = { id: 'x', name: 'X', description: '', price: 100, priceLabel: '', image: '', imageAlt: '', available: true, featured: false, tags: [], options: [] };
    expect(itemSchema.safeParse(antigo).success).toBe(true);
  });

  it('o 3D não vai para a API pública dos sites (só a mesa usa por enquanto)', () => {
    const store = emptyStore('teste', 'Teste', 'restaurante');
    store.catalog.categories = [
      {
        id: 'c',
        name: 'C',
        description: '',
        items: [{ id: 'i', name: 'I', description: '', price: 100, priceLabel: '', image: '', imageAlt: '', available: true, featured: false, tags: [], options: [], modelo3d: { src: 'midia/teste/a1.glb', larguraCm: 18, alturaCm: 9, profundidadeCm: 18 } }],
      },
    ];
    const pub = toPublic(store, null, '/m');
    expect(pub.catalog.categories[0].items[0]).not.toHaveProperty('modelo3d');
  });
});
