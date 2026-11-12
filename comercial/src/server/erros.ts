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
