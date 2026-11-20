import type { ContentFile } from '@/lib/conteudos';

const base = (p: string) => '/painel/conteudos/arquivo/' + p.split('/').map(encodeURIComponent).join('/');

/**
 * Link to a content file. The browser keeps files for an hour, so when the size is known it goes in the link (`v`):
 * a file replaced under the same name (a Reel that got its narration) shows up right away instead of the old copy.
 */
export function fileUrl(f: Pick<ContentFile, 'path' | 'thumb'> & { size?: number }, kind: 'ver' | 'mini' | 'baixar' = 'ver') {
  const q = new URLSearchParams();
  if (kind === 'mini') q.set('mini', '1');
  if (kind === 'baixar') q.set('baixar', '1');
  if (f.size) q.set('v', String(f.size));
  const s = q.toString();
  return base(kind === 'mini' ? f.thumb : f.path) + (s ? `?${s}` : '');
}
