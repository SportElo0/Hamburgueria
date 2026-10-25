import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { useFileStorage } from '@/lib/storage';
import { byteRange, ContentError, downloadName, getStatuses, readContentFile, setContentStatus, type Manifest } from '@/lib/conteudos';
import { zip } from '@/lib/zip';

const file = (p: string) => ({ path: p, name: path.basename(p), type: 'image/png', size: 3, width: 1080, height: 1920, format: 'Story', thumb: p.replace('.png', '.webp'), doNotPublish: false });
const manifest: Manifest = {
  generatedAt: '2026-10-25T12:00:00.000Z',
  folders: [
    { slug: '03-destaques', title: 'Stories', blurb: '', sectionStatus: false, groups: [{ id: '03-destaques/1-projetos', title: 'Projetos', files: [file('03-destaques/1-projetos/01.png')] }], docs: [] },
    { slug: '05-reels', title: 'Reels', blurb: '', sectionStatus: true, groups: [], docs: [{ file: '05-reels/roteiros.md', title: 'Roteiros', intro: '', sections: [{ id: '1-gancho', title: '1. Gancho', html: '' }] }] },
  ],
};

let dir: string;
beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'conteudos-store-')));
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'conteudos-'));
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  fs.mkdirSync(path.join(dir, 'arquivos/03-destaques/1-projetos'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'arquivos/03-destaques/1-projetos/01.png'), 'png');
  fs.writeFileSync(path.join(dir, 'segredo.txt'), 'não');
  process.env.CONTEUDOS_GERADOS_DIR = dir;
});

describe('conteúdos', () => {
  it('só lê arquivos que estão na lista', async () => {
    expect((await readContentFile('03-destaques/1-projetos/01.png', 'arquivo'))?.data.toString()).toBe('png');
    expect(await readContentFile('../segredo.txt', 'arquivo')).toBeNull();
    expect(await readContentFile('segredo.txt', 'arquivo')).toBeNull();
  });

  it('marca aprovado e postado, e volta para rascunho', async () => {
    await setContentStatus('03-destaques/1-projetos', 'aprovado', 'Lucas');
    await setContentStatus('05-reels/roteiros.md#1-gancho', 'postado', 'Antônio');
    const s = await getStatuses();
    expect(s['03-destaques/1-projetos']).toMatchObject({ status: 'aprovado', by: 'Lucas' });
    expect(s['05-reels/roteiros.md#1-gancho'].status).toBe('postado');
    await setContentStatus('03-destaques/1-projetos', 'rascunho', 'Lucas');
    expect((await getStatuses())['03-destaques/1-projetos']).toBeUndefined();
  });

  it('recusa conteúdo ou situação que não existem', async () => {
    await expect(setContentStatus('03-destaques/9-nada', 'aprovado', 'Lucas')).rejects.toThrow(ContentError);
    await expect(setContentStatus('03-destaques/1-projetos', 'publicado' as never, 'Lucas')).rejects.toThrow(ContentError);
  });

  it('entrega a capa junto com o vídeo, e só ela', async () => {
    const m = structuredClone(manifest);
    m.folders[1].groups = [{ id: '05-reels', title: 'Vídeos', files: [{ ...file('05-reels/01.mp4'), type: 'video/mp4', cover: '05-reels/01-capa.png' }] }];
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(m));
    fs.mkdirSync(path.join(dir, 'arquivos/05-reels'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'arquivos/05-reels/01.mp4'), 'mp4');
    fs.writeFileSync(path.join(dir, 'arquivos/05-reels/01-capa.png'), 'capa');
    expect((await readContentFile('05-reels/01-capa.png', 'arquivo'))?.file.type).toBe('image/png');
    expect((await readContentFile('05-reels/01.mp4', 'arquivo'))?.data.toString()).toBe('mp4');
    expect(await readContentFile('05-reels/02-capa.png', 'arquivo')).toBeNull();
  });

  it('responde a pedidos de trecho do vídeo', () => {
    expect(byteRange(null, 1000)).toBeNull();
    expect(byteRange('bytes=0-1', 1000)).toEqual({ start: 0, end: 1 });
    expect(byteRange('bytes=500-', 1000)).toEqual({ start: 500, end: 999 });
    expect(byteRange('bytes=-100', 1000)).toEqual({ start: 900, end: 999 });
    expect(byteRange('bytes=900-5000', 1000)).toEqual({ start: 900, end: 999 });
    expect(byteRange('bytes=1000-', 1000)).toBe('invalida');
    expect(byteRange('bytes=0-1,5-6', 1000)).toBeNull();
  });

  it('dá nomes claros aos downloads', () => {
    expect(downloadName('03-destaques/1-projetos/01.png')).toBe('growlift-destaques-projetos-01.png');
    expect(downloadName('03-destaques/capas/direcao-A')).toBe('growlift-destaques-capas-direcao-A');
  });

  it('monta um .zip que abre', () => {
    const out = path.join(dir, 'teste.zip');
    fs.writeFileSync(out, zip([{ name: '01.png', data: Buffer.from('um') }, { name: '02.png', data: Buffer.alloc(5000, 7) }]));
    const listing = execFileSync('unzip', ['-t', out]).toString();
    expect(listing).toMatch(/No errors detected/);
    expect(listing).toMatch(/01\.png/);
  });
});
