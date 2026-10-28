import { NextResponse } from 'next/server';
import { pedidoSchema, textoDoPedido } from '@/lib/cotacao';
import { dentroDoLimite, enviarEmail, envioConfigurado, origemValida } from '@/lib/envio';

/** The page asks first, so it can show the right buttons before anyone fills the form. */
export function GET() {
  return NextResponse.json({ configurado: envioConfigurado() });
}

export async function POST(req: Request) {
  if (!origemValida(req)) return NextResponse.json({ erro: 'Origem não permitida.' }, { status: 403 });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!dentroDoLimite(`cotacao:${ip}`)) return NextResponse.json({ erro: 'Muitas solicitações seguidas. Tente de novo em alguns minutos.' }, { status: 429 });

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Pedido inválido.' }, { status: 400 });
  }
  const r = pedidoSchema.safeParse(corpo);
  if (!r.success) {
    // the anti-bot fields get a generic answer, so a script cannot tell which one caught it
    const campo = String(r.error.issues[0]?.path[0]);
    const erro = campo === 'site' || campo === 'tempo' ? 'Não foi possível enviar.' : (r.error.issues[0]?.message ?? 'Dados inválidos.');
    return NextResponse.json({ erro }, { status: 400 });
  }

  if (!envioConfigurado()) {
    return NextResponse.json({ erro: 'O envio automático ainda não está configurado. Use o WhatsApp ou o e-mail ao lado.', configurado: false }, { status: 503 });
  }
  try {
    await enviarEmail({
      assunto: `Orçamento · ${r.data.contato.empresa} (${r.data.itens.length} ${r.data.itens.length === 1 ? 'item' : 'itens'})`,
      texto: textoDoPedido(r.data.itens, r.data.contato),
      responderPara: r.data.contato.email,
    });
  } catch (e) {
    console.error('cotacao: envio falhou', e instanceof Error ? e.message : e);
    return NextResponse.json({ erro: 'Não conseguimos enviar agora. Use o WhatsApp ou o e-mail ao lado; seu pedido continua salvo aqui.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
