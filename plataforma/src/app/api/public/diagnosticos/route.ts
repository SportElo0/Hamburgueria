import { NextResponse, type NextRequest } from 'next/server';
import { createDiagnosisRequest, DiagnosisError } from '@/lib/diagnostics';

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
    const created = await createDiagnosisRequest(body, request.headers.get('origin') ?? '');
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
