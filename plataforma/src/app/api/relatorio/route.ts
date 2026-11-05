import { NextResponse, type NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { isTeam } from '@/lib/session';
import { isSlug } from '@/lib/slug';
import { listStores } from '@/lib/stores';
import { ExportError, documentoDoRestaurante, validarPeriodo } from '@/lib/relatorio/exportar';
import { INSTRUCOES_CLAUDE } from '@/lib/relatorio/instrucoes';

export const runtime = 'nodejs';
export const maxDuration = 60;

const baixar = (texto: string, arquivo: string) =>
  new NextResponse(texto, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${arquivo}"`,
      'Cache-Control': 'no-store',
    },
  });

/**
 * Documento com os dados de um restaurante (?loja=slug) ou de todos (?loja=todos) no período (?de=&ate=), para o
 * projeto do Claude. ?instrucoes=1 baixa o texto das instruções do projeto. Só a equipe da Growlift.
 */
export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user || !isTeam(user)) return NextResponse.json({ error: 'Sem acesso.' }, { status: 401 });
  const q = request.nextUrl.searchParams;
  if (q.get('instrucoes') === '1') return baixar(INSTRUCOES_CLAUDE, 'instrucoes-consultor-restaurantes.md');
  const loja = q.get('loja') ?? '';
  const de = q.get('de') ?? '';
  const ate = q.get('ate') ?? '';
  try {
    validarPeriodo(de, ate);
    if (loja === 'todos') {
      const lojas = (await listStores()).filter((s) => s.segment === 'restaurante');
      const partes: string[] = [];
      for (const l of lojas) {
        try {
          partes.push((await documentoDoRestaurante(l.slug, de, ate)).texto);
        } catch (err) {
          console.error('relatorio todos', l.slug, err instanceof Error ? err.message : err);
        }
      }
      if (!partes.length) return NextResponse.json({ error: 'Nenhum restaurante para exportar.' }, { status: 404 });
      return baixar(partes.join('\n---\n\n'), `dados-restaurantes-${de}-a-${ate}.md`);
    }
    if (!isSlug(loja)) return NextResponse.json({ error: 'Loja inválida.' }, { status: 400 });
    const doc = await documentoDoRestaurante(loja, de, ate);
    return baixar(doc.texto, `dados-${loja}-${de}-a-${ate}.md`);
  } catch (err) {
    if (err instanceof ExportError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error('relatorio', err);
    return NextResponse.json({ error: 'Não foi possível gerar o documento.' }, { status: 500 });
  }
}
