import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { byteRange } from '@/lib/conteudos';
import { contentFilePath, readContentFile } from '@/lib/conteudos-arquivos';
import { verifyContentLink } from '@/lib/link-publico';

export const runtime = 'nodejs';

/**
 * The file Instagram downloads when it publishes a post: only with a valid, unexpired signature (link-publico.ts), and
 * only files listed in the Conteúdos manifest. `jpg=1` turns an image into JPEG (the only image format the API takes).
 */
export async function GET(request: Request, { params }: { params: Promise<{ caminho: string[] }> }) {
  const { caminho } = await params;
  const url = new URL(request.url);
  // Segments may arrive encoded; a bad escape is just a bad link (403 below), never a crash.
  const rel = caminho
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    })
    .join('/');
  const jpg = url.searchParams.get('jpg') === '1';
  if (!verifyContentLink(rel, url.searchParams.get('e'), url.searchParams.get('s'), jpg)) return new NextResponse('Link inválido ou vencido', { status: 403 });
  const headers: Record<string, string> = {
    'Cache-Control': 'private, max-age=600',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex',
    'Accept-Ranges': 'bytes',
  };

  // Images Instagram needs as JPEG: converted in memory (a few hundred KB).
  if (jpg) {
    const found = await readContentFile(rel, 'arquivo');
    if (!found) return new NextResponse('Não encontrado', { status: 404 });
    let data = found.data;
    let type = found.file.type;
    if (type.startsWith('image/') && type !== 'image/jpeg') {
      const sharp = (await import('sharp')).default;
      data = await sharp(data, { limitInputPixels: 40_000_000 }).resize({ width: 1440, withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer();
      type = 'image/jpeg';
    }
    return new NextResponse(new Uint8Array(data), { headers: { ...headers, 'Content-Type': type, 'Content-Length': String(data.length) } });
  }

  // Originals (Reels up to tens of MB) are streamed from disk, never held whole in memory: a buffered response this
  // big would go over the platform's response size limit.
  const file = await contentFilePath(rel);
  if (!file) return new NextResponse('Não encontrado', { status: 404 });
  const total = (await stat(file.abs)).size;
  const range = byteRange(request.headers.get('range'), total);
  if (range === 'invalida') return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
  const start = range ? range.start : 0;
  const end = range ? range.end : total - 1;
  const body = Readable.toWeb(createReadStream(file.abs, { start, end })) as ReadableStream;
  return new NextResponse(body, {
    status: range ? 206 : 200,
    headers: { ...headers, 'Content-Type': file.type, 'Content-Length': String(end - start + 1), ...(range ? { 'Content-Range': `bytes ${start}-${end}/${total}` } : {}) },
  });
}
