import Anthropic from '@anthropic-ai/sdk';
import { promptDoSistema } from './prompt';
import { FERRAMENTAS, type AdaptadorIA, type Executar, type PedidoIA, type RespostaIA } from './tipos';

/** Models that take the server-side refusal fallback. */
const COM_FALLBACK = /^claude-(opus-5|sonnet-5-5|fable-5)/;

/**
 * Real assistant through the Anthropic API (the company's/Growlift's own API key, never the developer tool's access).
 * Not exercised against the live API in this version: it needs IA_ANTHROPIC_API_KEY.
 */
export function iaAnthropic(apiKey: string): AdaptadorIA {
  // Explicit key and address: the app must not inherit credentials from the environment of whoever runs it.
  const client = new Anthropic({ apiKey, baseURL: 'https://api.anthropic.com', maxRetries: 1, timeout: 40_000 });
  return {
    simulada: false,
    async responder(p: PedidoIA, executar: Executar): Promise<RespostaIA> {
      const { fixo, variavel } = promptDoSistema(p.contexto);
      const messages: Anthropic.Beta.BetaMessageParam[] = p.historico.map((m) => ({ role: m.de === 'contato' ? 'user' : 'assistant', content: m.texto }));
      const fallback = COM_FALLBACK.test(p.modelo);
      let entrada = 0;
      let saida = 0;
      const partes: string[] = [];
      // A short loop: answer, or ask for an action, get its result and answer.
      for (let volta = 0; volta < 4; volta++) {
        const r = await client.beta.messages.create({
          model: p.modelo,
          // Room for the model's own reasoning on top of the short visible answer.
          max_tokens: p.maxTokens + 2000,
          output_config: { effort: 'low' },
          system: [
            { type: 'text', text: fixo, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: variavel },
          ],
          tools: FERRAMENTAS,
          messages,
          ...(fallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
        });
        entrada += r.usage.input_tokens + (r.usage.cache_read_input_tokens ?? 0) + (r.usage.cache_creation_input_tokens ?? 0);
        saida += r.usage.output_tokens;
        if (r.stop_reason === 'refusal') throw new Error('O modelo recusou a resposta.');
        for (const b of r.content) if (b.type === 'text' && b.text.trim()) partes.push(b.text.trim());
        const usos = r.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
        if (r.stop_reason !== 'tool_use' || !usos.length) break;
        messages.push({ role: 'assistant', content: r.content as Anthropic.Beta.BetaContentBlockParam[] });
        const resultados: Anthropic.Beta.BetaToolResultBlockParam[] = [];
        for (const u of usos) {
          const saidaFerramenta = await executar(u.name, u.input);
          resultados.push({ type: 'tool_result', tool_use_id: u.id, content: saidaFerramenta, is_error: saidaFerramenta.startsWith('erro') });
        }
        messages.push({ role: 'user', content: resultados });
      }
      const texto = partes.join('\n').trim();
      if (!texto) throw new Error('O modelo não devolveu texto.');
      return { texto: texto.slice(0, 1500), tokensEntrada: entrada, tokensSaida: saida, modelo: p.modelo };
    },
  };
}
