import { NextResponse } from 'next/server';
import { byteRange, readContentFile } from '@/lib/conteudos';
import { verifyContentLink } from '@/lib/link-publico';

export const runtime = 'nodejs';

/**
 * The file Instagram downloads when it publishes a post: only with a valid, unexpired signature (link-publico.ts), and
 * only files listed in the Conteúdos manifest. `jpg=1` turns an image into JPEG (the only image format the API takes).
 */
export async function GET(request: Request, { params }: { params: Promise<{ caminho: string[] }> }) {
  const { caminho } = await params;
  const url = new URL(request.url);
  const rel = caminho.map(decodeURIComponent).join('/');
  const jpg = url.searchParams.get('jpg') === '1';
  if (!verifyContentLink(rel, url.searchParams.get('e'), url.searchParams.get('s'), jpg)) return new NextResponse('Link inválido ou vencido', { status: 403 });
  const found = await readContentFile(rel, 'arquivo');
  if (!found) return new NextResponse('Não encontrado', { status: 404 });

  let data = found.data;
  let type = found.file.type;
  if (jpg && type.startsWith('image/') && type !== 'image/jpeg') {
    const sharp = (await import('sharp')).default;
    data = await sharp(data).resize({ width: 1440, withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer();
    type = 'image/jpeg';
  }
  const headers: Record<string, string> = {
    'Content-Type': type,
    'Cache-Control': 'private, max-age=600',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex',
    'Accept-Ranges': 'bytes',
  };
  const total = data.length;
  const range = byteRange(request.headers.get('range'), total);
  if (range === 'invalida') return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
  if (range) {
    headers['Content-Range'] = `bytes ${range.start}-${range.end}/${total}`;
    return new NextResponse(new Uint8Array(data.subarray(range.start, range.end + 1)), { status: 206, headers });
  }
  return new NextResponse(new Uint8Array(data), { headers });
}
