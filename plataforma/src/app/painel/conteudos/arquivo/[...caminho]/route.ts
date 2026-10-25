import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { isTeam } from '@/lib/session';
import { downloadName, readContentFile } from '@/lib/conteudos';

// ?mini=1: the WebP thumbnail; ?baixar=1: download the original instead of opening it.
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
  };
  if (url.searchParams.has('baixar')) headers['Content-Disposition'] = `attachment; filename="${downloadName(found.file.path)}"`;
  return new NextResponse(new Uint8Array(found.data), { headers });
}

