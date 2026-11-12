import { after } from 'next/server';
import { processarFila } from '@/server/trabalhos';
import { abrirChatDoPedido } from '@/server/conversas';
import { empresaPorChave } from '@/server/empresas';
import { ErroDeUso } from '@/server/erros';
import { receberPedido } from '@/server/pedidos';
import { CORS, json, lerCorpo, respostaDeErro } from '@/server/publico';
import { ipHash } from '@/server/sessao';

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });

/**
 * Receives a quote request from the company's site, the embedded form or an integration.
 * The company comes from its public key, checked here; the answer only says "received" after everything is saved.
 */
export async function POST(req: Request) {
  try {
    const corpo = await lerCorpo(req);
    const empresa = await empresaPorChave(String(corpo.chave ?? ''));
    if (!empresa) throw new ErroDeUso('Chave da empresa inválida.', 404);
    // Only our own pages may label a request as coming from the site or the embedded form.
    const nosso = !!process.env.APP_URL && req.headers.get('origin') === new URL(process.env.APP_URL).origin;
    const origem = nosso && corpo.origem === 'formulario_incorporado' ? 'formulario_incorporado' : nosso ? 'site' : 'api';
    const r = await receberPedido(empresa, corpo, { origem, ipHash: await ipHash() });
    if ('descartado' in r) return json({ ok: true, repetido: false, chat: null, whatsapp: '' }, 201);
    let chat: string | null = null;
    if (!r.repetido && empresa.config.ia.ativa) {
      const extras = (corpo.extras ?? {}) as Record<string, string>;
      chat = await abrirChatDoPedido(empresa, r, { nome: String(corpo.nome ?? '').trim(), telefone: 'informado no formulário', cidade: String(corpo.cidade ?? '').trim(), necessidade: String(corpo.necessidade ?? '').trim(), ...Object.fromEntries(empresa.config.campos.filter((c) => extras[c.id]).map((c) => [c.id, String(extras[c.id])])) }).catch(() => null);
    }
    // Without a permanent worker (serverless), run what is due shortly after answering the visitor.
    if (!r.repetido) after(async () => { await new Promise((ok) => setTimeout(ok, 6000)); await processarFila(10).catch(() => {}); });
    return json({ ok: true, repetido: r.repetido, chat, whatsapp: empresa.config.site.whatsapp }, 201);
  } catch (err) {
    return respostaDeErro(err);
  }
}
