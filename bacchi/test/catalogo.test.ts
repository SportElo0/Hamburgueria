import { describe, expect, it } from 'vitest';
import { ACABAMENTOS, FAMILIAS, PRODUTOS, opcoesEmbalagem, produto, textoBusca, normalizar, variacoesQueCasam } from '@/data/catalogo';
import { REPRESENTANTES, ESTADOS } from '@/data/representantes';

describe('catálogo (fonte: Catálogo Bacchi novo.pdf)', () => {
  it('tem as 13 linhas pedidas, cada uma em uma família, com foto e ficha', () => {
    const slugs = PRODUTOS.map((p) => p.slug);
    expect(slugs).toEqual([
      'clips', 'clips-linha-leve', 'grampos', 'grampos-trancados', 'alfinetes-para-costura', 'alfinetes-de-seguranca', 'alfinetes-para-etiquetas',
      'alfinetes-para-mapas', 'encadernadores', 'colchetes', 'pranchetas', 'espatula-extratora', 'percevejos',
    ]);
    for (const p of PRODUTOS) {
      expect(FAMILIAS.some((f) => f.id === p.familia)).toBe(true);
      expect(p.imagens.length).toBeGreaterThan(0);
      expect(p.variacoes.length).toBeGreaterThan(0);
      for (const a of p.acabamentos) expect(ACABAMENTOS[a]).toBeDefined();
    }
  });

  it('confere os números das tabelas do PDF', () => {
    const clips = produto('clips')!;
    expect(clips.variacoes.map((v) => v.modelo)).toEqual(['5', '4', '3', '2', '1', '1/0 (0)', '2/0 (00)', '3/0', '4/0', '6/0', '8/0', '10/0', '12/0']);
    expect(clips.variacoes.find((v) => v.modelo === '2/0 (00)')!.valores).toEqual({ altura: '32', largura: '11', pequena: '100', grande: '720', blister: '100', plastica: '50' });
    expect(clips.variacoes.find((v) => v.modelo === '12/0')!.valores).toEqual({ altura: '70', largura: '26', pequena: '12', grande: '105', blister: '8', plastica: '-' });
    expect(produto('clips-linha-leve')!.variacoes.find((v) => v.modelo === '3/0')!.valores.grande).toBe('450');
    const grampos = produto('grampos')!;
    expect(grampos.variacoes).toHaveLength(37); // 18 + 19 rows in the two tables of page 3
    expect(grampos.variacoes.find((v) => v.modelo === '23/24')!.valores).toEqual({ furacao: '170 a 200', aplicacao: 'Gráfica / Escritório', caixas: '1.000' });
    expect(grampos.variacoes.filter((v) => v.acabamentos!.includes('cobreado')).map((v) => v.modelo)).toEqual(['26/6', '26/8', 'TOT']);
    expect(grampos.resumo).toContain(`${grampos.variacoes.length} grampos`);
    expect(produto('colchetes')!.variacoes.map((v) => v.valores.folhas)).toEqual(['60', '80', '110', '120', '140', '180', '200', '210', '240', '270', '360', '400', '450']);
    expect(produto('alfinetes-de-seguranca')!.variacoes.filter((v) => v.acabamentos!.includes('latonado')).map((v) => v.modelo)).toEqual(['000', '00', '0']);
    expect(produto('pranchetas')!.variacoes.map((v) => `${v.modelo} ${v.valores.altura}×${v.valores.largura}`)).toEqual(['Memorando 240×140', 'Ofício 340×240', 'Meio ofício 340×120']);
  });

  it('não traz preço, estoque nem código inventado', () => {
    const tudo = JSON.stringify(PRODUTOS).toLowerCase();
    for (const proibido of ['r$', 'estoque', 'sku', 'código']) expect(tudo).not.toContain(proibido);
    // "preço" só aparece no produto "suportes para preços" (nome e termo de busca)
    expect(tudo.replace(/suportes? para preços?|"preço"/g, '')).not.toContain('preç');
  });

  it('gera as opções de embalagem a partir da tabela', () => {
    const clips = produto('clips')!;
    expect(opcoesEmbalagem(clips, clips.variacoes.find((v) => v.modelo === '6/0')!)).toEqual([
      'Caixa pequena · 25 un.', 'Caixa pequena · 50 un.', 'Caixa grande · 220 un.', 'Blister box · 25 un.', 'Caixa plástica · 12 un.',
    ]);
    expect(opcoesEmbalagem(clips, clips.variacoes.find((v) => v.modelo === '4')!)).toEqual(['Caixa pequena · 100 un.', 'Caixa grande · 2.200 un.']);
    for (const p of PRODUTOS) for (const v of p.variacoes) expect(opcoesEmbalagem(p, v).length).toBeGreaterThan(0);
  });

  it('a busca acha por número, linha, aplicação e sinônimo', () => {
    const acha = (q: string) => PRODUTOS.filter((p) => normalizar(q).split(' ').every((t) => textoBusca(p).includes(t))).map((p) => p.slug);
    expect(acha('26/6')).toContain('grampos');
    expect(acha('2/0')).toEqual(expect.arrayContaining(['clips', 'clips-linha-leve']));
    expect(acha('tapecaria')).toEqual(['grampos']);
    expect(acha('romeu e julieta')).toEqual(['encadernadores']);
    expect(acha('tachinha')).toEqual(['percevejos']);
    expect(variacoesQueCasam(produto('grampos')!, 'catu').map((v) => v.modelo)).toEqual(['CATU 1X', 'CATU 2X', 'CATU 3X', 'CATU 4X']);
  });
});

describe('representantes (fonte: clipsbacchi.com.br/representantes)', () => {
  it('cobre os 27 estados, com as 34 representações publicadas', () => {
    expect(new Set(REPRESENTANTES.map((r) => r.uf)).size).toBe(27);
    expect(REPRESENTANTES).toHaveLength(34);
    for (const r of REPRESENTANTES) {
      expect(ESTADOS[r.uf]).toBeDefined();
      expect(r.telefones.length).toBeGreaterThan(0);
      for (const t of r.telefones) expect(t.numero.replace(/\D/g, '').length).toBeGreaterThanOrEqual(10);
    }
  });

  it('só marca WhatsApp onde a página original diz WhatsApp', () => {
    const zap = REPRESENTANTES.flatMap((r) => r.telefones.filter((t) => t.whatsapp).map((t) => `${r.uf} ${t.numero}`));
    expect(zap).toEqual(['DF (62) 98123-7317', 'ES (27) 99765-6953', 'GO (62) 98123-7317', 'RS (51) 3361-4335']);
  });
});
