import { after, NextResponse, type NextRequest } from 'next/server';
import { createDiagnosisRequest, DiagnosisError, saveDiagnosisAnalysis } from '@/lib/diagnostics';
import { analisarPedido } from '@/lib/diagnostico-auto';

/** Room for the one-page site check that runs after the answer (diagnostico-auto.ts). */
export const maxDuration = 30;

// Public: the Growlift site's free-diagnosis form posts here.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

export async function POST(request: NextRequest) {
  const text = await request.text();
  if (text.length > 10_000) return NextResponse.json({ error: 'Envio grande demais.' }, { status: 413, headers: CORS });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Envio inválido.' }, { status: 400, headers: CORS });
  }
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
    const created = await createDiagnosisRequest(body, request.headers.get('origin') ?? '', new Date(), ip);
    // The free first look at the site, after the person already has the answer. If it fails, the 6:30 run retries.
    after(async () => {
      try {
        await saveDiagnosisAnalysis(created.id, await analisarPedido(created));
      } catch (err) {
        console.error('diagnostico: análise ao receber', err instanceof Error ? err.message : err);
      }
    });
    return NextResponse.json({ id: created.id }, { status: 201, headers: CORS });
  } catch (err) {
    if (err instanceof DiagnosisError) return NextResponse.json({ error: err.message }, { status: 422, headers: CORS });
    console.error('createDiagnosisRequest', err);
    return NextResponse.json({ error: 'Não foi possível enviar agora. Tente de novo em instantes.' }, { status: 500, headers: CORS });
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
