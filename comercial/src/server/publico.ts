import { ErroDeUso } from './erros';
import { ErroDeFormulario } from './pedidos';

/** Public endpoints are called from other sites (embedded form, integrations). They carry no cookies. */
export const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };

export const json = (corpo: unknown, status = 200) => Response.json(corpo, { status, headers: { ...CORS, 'Cache-Control': 'no-store' } });

/** Reads a small JSON body; anything bigger or malformed is refused before touching the database. */
export async function lerCorpo(req: Request, limite = 20_000): Promise<Record<string, unknown>> {
  const texto = await req.text();
  if (texto.length > limite) throw new ErroDeUso('Pedido grande demais.', 413);
  try {
    const v = JSON.parse(texto);
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error();
    return v as Record<string, unknown>;
  } catch {
    throw new ErroDeUso('Formato inválido: envie JSON.', 400);
  }
}

export function respostaDeErro(err: unknown): Response {
  if (err instanceof ErroDeFormulario) return json({ erro: err.message, campos: err.campos }, 422);
  if (err instanceof ErroDeUso) return json({ erro: err.message }, err.status);
  console.error('[publico]', err);
  return json({ erro: 'Não foi possível concluir agora. Tente de novo em instantes.' }, 500);
}
