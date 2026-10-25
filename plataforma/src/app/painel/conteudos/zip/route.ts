import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { isTeam } from '@/lib/session';
import { downloadName, findGroup, readContentFile } from '@/lib/conteudos';
import { zip } from '@/lib/zip';

// One group of pieces (a highlight, a carousel) as a single download, in posting order.
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user || !isTeam(user)) return new NextResponse('Não autorizado', { status: 401 });
  const group = await findGroup(new URL(request.url).searchParams.get('grupo') ?? '');
  if (!group) return new NextResponse('Não encontrado', { status: 404 });
  const files = [];
  for (const f of group.files) {
    const found = await readContentFile(f.path, 'arquivo');
    if (found) files.push({ name: f.name, data: found.data });
  }
  return new NextResponse(new Uint8Array(zip(files)), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${downloadName(group.id)}.zip"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
