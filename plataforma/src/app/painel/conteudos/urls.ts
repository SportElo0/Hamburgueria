import type { ContentFile } from '@/lib/conteudos';

const base = (p: string) => '/painel/conteudos/arquivo/' + p.split('/').map(encodeURIComponent).join('/');

export function fileUrl(f: Pick<ContentFile, 'path' | 'thumb'>, kind: 'ver' | 'mini' | 'baixar' = 'ver') {
  if (kind === 'mini') return base(f.thumb) + '?mini=1';
  return base(f.path) + (kind === 'baixar' ? '?baixar=1' : '');
}
