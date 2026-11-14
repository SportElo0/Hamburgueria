import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getManifest, root } from './conteudos';

/*
 * Reading the media files themselves lives here, apart from lib/conteudos.ts, so that only the routes that serve files
 * (arquivo, zip, público) import it. The build's file tracing follows these path.join calls and pulls every file
 * (200+ MB) into whatever imports them; when the list pages carried them too, each became its own Vercel function and
 * the deploy passed the Hobby limit of 12.
 */

/** Only paths listed in the manifest are ever read, so a request can never reach other files. */
export async function readContentFile(rel: string, kind: 'arquivo' | 'miniatura') {
  const m = await getManifest();
  for (const f of m.folders)
    for (const g of f.groups)
      for (const file of g.files) {
        if (kind === 'arquivo' && file.path === rel) return { file, data: await fs.readFile(path.join(root(), 'arquivos', file.path)) };
        if (kind === 'arquivo' && file.cover && file.cover === rel)
          return { file: { ...file, path: file.cover, type: 'image/png' }, data: await fs.readFile(path.join(root(), 'arquivos', file.cover)) };
        if (kind === 'miniatura' && file.thumb === rel) {
          const thumbDir = file.thumb === file.path ? 'arquivos' : 'miniaturas';
          return { file: { ...file, type: thumbDir === 'arquivos' ? file.type : 'image/webp' }, data: await fs.readFile(path.join(root(), thumbDir, file.thumb)) };
        }
      }
  return null;
}

/** Where a listed file is on disk (for streaming big videos), with its declared type; null when not listed. */
export async function contentFilePath(rel: string): Promise<{ abs: string; type: string } | null> {
  const m = await getManifest();
  for (const f of m.folders)
    for (const g of f.groups)
      for (const file of g.files) {
        if (file.path === rel) return { abs: path.join(root(), 'arquivos', file.path), type: file.type };
        if (file.cover && file.cover === rel) return { abs: path.join(root(), 'arquivos', file.cover), type: 'image/png' };
      }
  return null;
}

