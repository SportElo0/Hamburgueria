/** Canned Messages API answers for the fake local server used in ia-real.test.ts. */
const mensagem = (content: unknown[], stop_reason: string) => ({
  status: 200,
  body: { id: `msg_${Math.random().toString(36).slice(2)}`, type: 'message', role: 'assistant', model: 'claude-opus-5-5', content, stop_reason, stop_sequence: null, usage: { input_tokens: 1200, output_tokens: 40, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } },
});

export const fluxoDeTeste = {
  salvarNomeDepoisResponder: (nome: string, texto: string) => [
    () => mensagem([{ type: 'tool_use', id: 'toolu_1', name: 'salvar_dados', input: { nome } }], 'tool_use'),
    () => mensagem([{ type: 'text', text: texto }], 'end_turn'),
  ],
  acaoProibida: () => [
    () => mensagem([{ type: 'tool_use', id: 'toolu_2', name: 'marcar_como_pago', input: { valor: 100 } }], 'tool_use'),
    () => mensagem([{ type: 'text', text: 'Não consigo fazer isso por aqui.' }], 'end_turn'),
  ],
  recusa: () => () => mensagem([], 'refusal'),
  erro: (status: number) => () => ({ status, body: { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } } }),
};
