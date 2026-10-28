import { NextResponse } from 'next/server';
import { z } from 'zod';
import { contatoSchema } from '@/lib/cotacao';
import { dentroDoLimite, enviarEmail, envioConfigurado, origemValida } from '@/lib/envio';

const schema = z.object({
  contato: contatoSchema.extend({ mensagem: z.string().trim().min(5, 'Escreva a sua mensagem.').max(2000) }),
  site: z.string().max(0).optional(),
  tempo: z.number().min(3000),
});

export function GET() {
  return NextResponse.json({ configurado: envioConfigurado() });
}

export async function POST(req: Request) {
  if (!origemValida(req)) return NextResponse.json({ erro: 'Origem não permitida.' }, { status: 403 });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!dentroDoLimite(`contato:${ip}`)) return NextResponse.json({ erro: 'Muitas mensagens seguidas. Tente de novo em alguns minutos.' }, { status: 429 });
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Mensagem inválida.' }, { status: 400 });
  }
  const r = schema.safeParse(corpo);
  if (!r.success) return NextResponse.json({ erro: r.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  if (!envioConfigurado()) return NextResponse.json({ erro: 'O envio automático ainda não está configurado. Use o telefone, o WhatsApp ou o e-mail ao lado.', configurado: false }, { status: 503 });
  const c = r.data.contato;
  try {
    await enviarEmail({
      assunto: `Contato pelo site · ${c.empresa}`,
      texto: [`Nome: ${c.nome}`, `Empresa: ${c.empresa}`, `E-mail: ${c.email}`, `Telefone: ${c.telefone}`, `Local: ${c.cidade} – ${c.uf}`, '', c.mensagem].join('\n'),
      responderPara: c.email,
    });
  } catch (e) {
    console.error('contato: envio falhou', e instanceof Error ? e.message : e);
    return NextResponse.json({ erro: 'Não conseguimos enviar agora. Use o telefone, o WhatsApp ou o e-mail ao lado.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
