import { NextResponse, type NextRequest } from 'next/server';
import { ConflictError } from '@/lib/storage';
import { conferirPin, criarPin, gravarDados, lerDados } from '@/lib/viagem';

/** API do "Caixa Portugal" (ver src/lib/viagem.ts). Tudo pede o PIN no cabeçalho x-pin, menos criar o PIN. */
export const dynamic = 'force-dynamic';

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

async function acesso(req: NextRequest) {
  const r = await conferirPin(req.headers.get('x-pin') ?? '');
  if (r === 'sem-pin') return json({ semPin: true });
  if (r === 'travado') return json({ erro: 'Muitas tentativas erradas. Espere 15 minutos.' }, 429);
  if (r === 'errado') return json({ erro: 'PIN errado.' }, 401);
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const bloqueio = await acesso(req);
    if (bloqueio) return bloqueio;
    return json(await lerDados());
  } catch (err) {
    console.error('viagem GET', err instanceof Error ? err.message : 'erro');
    return json({ erro: 'Não foi possível acessar os dados agora.' }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { acao?: unknown; pin?: unknown } | null;
    if (body?.acao !== 'criar-pin') return json({ erro: 'Pedido inválido.' }, 400);
    const r = await criarPin(String(body.pin ?? ''));
    if (r === 'invalido') return json({ erro: 'O PIN precisa ter de 6 a 12 números.' }, 400);
    if (r === 'existe') return json({ erro: 'O PIN já foi criado. Use o PIN combinado.' }, 409);
    return json({ ok: true });
  } catch (err) {
    console.error('viagem POST', err instanceof Error ? err.message : 'erro');
    return json({ erro: 'Não foi possível criar o PIN agora.' }, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const bloqueio = await acesso(req);
    if (bloqueio) return bloqueio;
    const texto = await req.text();
    if (texto.length > 200_000) return json({ erro: 'Dados grandes demais.' }, 413);
    let body: { dados?: unknown; etag?: unknown };
    try {
      body = JSON.parse(texto);
    } catch {
      return json({ erro: 'Pedido inválido.' }, 400);
    }
    if (typeof body.etag !== 'string') return json({ erro: 'Pedido inválido.' }, 400);
    try {
      return json(await gravarDados(body.dados, body.etag));
    } catch (err) {
      if (err instanceof ConflictError) return json({ erro: 'Outra pessoa salvou antes.' }, 409);
      throw err;
    }
  } catch (err) {
    console.error('viagem PUT', err instanceof Error ? err.message : 'erro');
    return json({ erro: 'Não foi possível salvar agora.' }, 500);
  }
}
