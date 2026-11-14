import { ambiente } from '../config';
import { iaAnthropic } from './anthropic';
import { iaSimulada } from './simulador';
import type { AdaptadorIA } from './tipos';

const g = globalThis as unknown as { __iaTeste?: AdaptadorIA | null };
/** Tests replace the adapter (for example, one that always fails). */
export const usarIaDeTeste = (a: AdaptadorIA | null) => (g.__iaTeste = a);

/** With an API key: the real model. Without: the simulator (never in production, where the assistant just hands off). */
export function adaptadorIA(): AdaptadorIA | null {
  if (g.__iaTeste) return g.__iaTeste;
  const chave = process.env.IA_ANTHROPIC_API_KEY;
  if (chave) return iaAnthropic(chave);
  return ambiente() === 'producao' ? null : iaSimulada;
}

export const modeloPadrao = () => process.env.IA_MODELO_PADRAO || 'claude-haiku-5-5';
