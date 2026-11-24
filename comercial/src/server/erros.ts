/** Errors whose message is safe to show to the person using the screen. */
export class ErroDeUso extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}
export class NaoAutorizado extends ErroDeUso {
  constructor(message = 'Você não tem acesso a isso.') {
    super(message, 403);
  }
}
export class NaoEncontrado extends ErroDeUso {
  constructor(message = 'Registro não encontrado.') {
    super(message, 404);
  }
}

/** A failure of an outside service that may work if tried again a bit later (network, timeout, 429, 5xx). */
export class ErroTemporario extends Error {}
/** Fetch with a deadline; network failures and 429/5xx answers become ErroTemporario. */
export async function buscarComPrazo(buscar: typeof fetch, url: string, init: RequestInit, ms: number): Promise<Response> {
  let res: Response;
  try {
    res = await buscar(url, { ...init, signal: AbortSignal.timeout(ms) });
  } catch (err) {
    throw new ErroTemporario(`Sem resposta do serviço: ${err instanceof Error ? err.message : String(err)}`.slice(0, 300));
  }
  if (res.status === 429 || res.status >= 500) throw new ErroTemporario(`Serviço indisponível (${res.status}).`);
  return res;
}
