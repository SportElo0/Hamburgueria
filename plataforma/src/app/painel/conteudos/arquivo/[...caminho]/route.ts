import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { isTeam } from '@/lib/session';
import { byteRange, downloadName, readContentFile } from '@/lib/conteudos';

// ?mini=1: the WebP thumbnail; ?baixar=1: download the original instead of opening it.
// Byte ranges are honoured because phones (Safari above all) only play video that way.
export async function GET(request: Request, { params }: { params: Promise<{ caminho: string[] }> }) {
  const user = await currentUser();
  if (!user || !isTeam(user)) return new NextResponse('Não autorizado', { status: 401 });
  const { caminho } = await params;
  const url = new URL(request.url);
  const found = await readContentFile(caminho.map(decodeURIComponent).join('/'), url.searchParams.has('mini') ? 'miniatura' : 'arquivo');
  if (!found) return new NextResponse('Não encontrado', { status: 404 });
  const headers: Record<string, string> = {
    'Content-Type': found.file.type,
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  };
  if (url.searchParams.has('baixar')) headers['Content-Disposition'] = `attachment; filename="${downloadName(found.file.path)}"`;
  const total = found.data.length;
  const range = byteRange(request.headers.get('range'), total);
  if (range === 'invalida') return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
  if (range) {
    headers['Content-Range'] = `bytes ${range.start}-${range.end}/${total}`;
    return new NextResponse(new Uint8Array(found.data.subarray(range.start, range.end + 1)), { status: 206, headers });
  }
  return new NextResponse(new Uint8Array(found.data), { headers });
}

