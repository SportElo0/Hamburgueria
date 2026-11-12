import { after } from 'next/server';
import { escreverNoChatSite, lerChatSite } from '@/server/conversas';
import { empresaPorChave } from '@/server/empresas';
import { ErroDeUso } from '@/server/erros';
import { CORS, json, lerCorpo, respostaDeErro } from '@/server/publico';
import { enviarAvisosCelular } from '@/server/push';
import { ipHash } from '@/server/sessao';

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });

/** Site chat. The conversation is opened and read only with its own token, sent in the body (never in the address). */
export async function POST(req: Request) {
  try {
    const corpo = await lerCorpo(req, 6_000);
    const empresa = await empresaPorChave(String(corpo.chave ?? ''));
    if (!empresa) throw new ErroDeUso('Chave da empresa inválida.', 404);
    const token = typeof corpo.token === 'string' && corpo.token ? corpo.token : null;
    if (corpo.acao === 'ler') {
      if (!token) throw new ErroDeUso('Conversa não encontrada.', 404);
      return json(await lerChatSite(empresa, token));
    }
    const r = await escreverNoChatSite(empresa, token, String(corpo.texto ?? ''), await ipHash());
    // A hand-off to a person creates a notification: alert the phones right after answering.
    after(() => enviarAvisosCelular().catch(() => {}));
    return json(r);
  } catch (err) {
    return respostaDeErro(err);
  }
}
