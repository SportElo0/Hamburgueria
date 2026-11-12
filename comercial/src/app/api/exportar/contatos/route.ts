import { ErroDeUso } from '@/server/erros';
import { exportarContatos } from '@/server/oportunidades';
import { sessao } from '@/server/sessao';

/** CSV of the company's contacts. Only the company admin of the session; the company never comes from the request. */
export async function GET() {
  const s = await sessao();
  if (!s?.ctx) return new Response('Entre para exportar.', { status: 401 });
  try {
    const csv = await exportarContatos(s.ctx);
    return new Response(`﻿${csv}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="contatos-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' } });
  } catch (err) {
    if (err instanceof ErroDeUso) return new Response(err.message, { status: err.status });
    throw err;
  }
}
