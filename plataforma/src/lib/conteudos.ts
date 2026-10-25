import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ConflictError, storage } from './storage';

/**
 * The Growlift social kit (../growlift-social), copied into conteudos-gerados/ by
 * scripts/conteudos.mjs at build time. Only the approval status lives in the store.
 */

export interface ContentFile {
  path: string;
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  format: string;
  thumb: string;
  doNotPublish: boolean;
}
export interface ContentGroup {
  id: string;
  title: string;
  files: ContentFile[];
}
export interface ContentDoc {
  file: string;
  title: string;
  intro: string;
  sections: { id: string; title: string; html: string }[];
}
export interface ContentFolder {
  slug: string;
  title: string;
  blurb: string;
  sectionStatus: boolean;
  groups: ContentGroup[];
  docs: ContentDoc[];
}
export interface Manifest {
  generatedAt: string;
  folders: ContentFolder[];
}

export const CONTENT_STATUSES = ['rascunho', 'aprovado', 'postado'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export interface StatusEntry {
  status: ContentStatus;
  by: string;
  at: string;
}

export class ContentError extends Error {}

const root = () => path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.CONTEUDOS_GERADOS_DIR || 'conteudos-gerados');

let cached: Manifest | null = null;
export async function getManifest(): Promise<Manifest> {
  if (cached && process.env.NODE_ENV === 'production') return cached;
  try {
    cached = JSON.parse(await fs.readFile(path.join(root(), 'manifest.json'), 'utf8')) as Manifest;
  } catch {
    cached = { generatedAt: '', folders: [] };
  }
  return cached;
}

/** Everything a status can be set on: image groups, and doc sections in folders that track them (Reels). */
export function statusKeys(m: Manifest): Set<string> {
  const keys = new Set<string>();
  for (const f of m.folders) {
    for (const g of f.groups) keys.add(g.id);
    if (f.sectionStatus) for (const d of f.docs) for (const s of d.sections) keys.add(sectionKey(d, s.id));
  }
  return keys;
}
export const sectionKey = (doc: Pick<ContentDoc, 'file'>, id: string) => `${doc.file}#${id}`;

/** Only paths listed in the manifest are ever read, so a request can never reach other files. */
export async function readContentFile(rel: string, kind: 'arquivo' | 'miniatura') {
  const m = await getManifest();
  for (const f of m.folders)
    for (const g of f.groups)
      for (const file of g.files) {
        if (kind === 'arquivo' && file.path === rel) return { file, data: await fs.readFile(path.join(root(), 'arquivos', file.path)) };
        if (kind === 'miniatura' && file.thumb === rel) {
          const thumbDir = file.thumb === file.path ? 'arquivos' : 'miniaturas';
          return { file: { ...file, type: thumbDir === 'arquivos' ? file.type : 'image/webp' }, data: await fs.readFile(path.join(root(), thumbDir, file.thumb)) };
        }
      }
  return null;
}

export async function findGroup(id: string) {
  const m = await getManifest();
  for (const f of m.folders) for (const g of f.groups) if (g.id === id) return g;
  return null;
}

/** 03-destaques/1-projetos/01.png → growlift-destaques-projetos-01.png */
export const downloadName = (rel: string) =>
  'growlift-' + rel.split('/').map((p) => p.replace(/^\d+-/, '')).join('-').replace(/[^a-zA-Z0-9.-]+/g, '-');

const STATUS_KEY = 'conteudos/status.json';

export async function getStatuses(): Promise<Record<string, StatusEntry>> {
  return (await storage().readJSON<Record<string, StatusEntry>>(STATUS_KEY))?.data ?? {};
}

export async function setContentStatus(key: string, status: ContentStatus, by: string, now = new Date()) {
  if (!CONTENT_STATUSES.includes(status) || !statusKeys(await getManifest()).has(key)) throw new ContentError('Conteúdo inválido.');
  for (let attempt = 0; ; attempt++) {
    const doc = await storage().readJSON<Record<string, StatusEntry>>(STATUS_KEY);
    const next = { ...(doc?.data ?? {}) };
    if (status === 'rascunho') delete next[key];
    else next[key] = { status, by, at: now.toISOString() };
    try {
      await storage().writeJSON(STATUS_KEY, next, doc ? doc.etag : null);
      return;
    } catch (err) {
      // Someone else marked another piece at the same moment: re-read and apply on top.
      if (!(err instanceof ConflictError) || attempt >= 3) throw err;
    }
  }
}
