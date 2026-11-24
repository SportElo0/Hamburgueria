import { randomUUID } from 'node:crypto';
import type { CanalWhatsApp, ModeloMensagem, ResultadoEnvio } from './tipos';

/**
 * Local WhatsApp simulator: nothing leaves the machine. Tests script the next results
 * (refusal, no answer) to exercise the same paths a real provider would take.
 */
interface EstadoSimulador {
  fila: ResultadoEnvio[];
  enviados: { para: string; corpo: string; modelo?: string }[];
  midias: Map<string, { dados: Uint8Array; tipo: string }>;
}
const g = globalThis as unknown as { __waSim?: EstadoSimulador };
export const simulador = (): EstadoSimulador => (g.__waSim ??= { fila: [], enviados: [], midias: new Map() });

export function canalSimulado(): CanalWhatsApp {
  const registrar = async (para: string, corpo: string, modelo?: string): Promise<ResultadoEnvio> => {
    const proximo = simulador().fila.shift();
    if (proximo) return proximo;
    simulador().enviados.push({ para, corpo, modelo });
    return { tipo: 'aceito', idProvedor: `sim_${randomUUID()}` };
  };
  return {
    simulado: true,
    enviarTexto: (para, corpo) => registrar(para, corpo),
    enviarModelo: (para, m: ModeloMensagem) => registrar(para, `[modelo ${m.nome}] ${m.variaveis.join(' | ')}`, m.nome),
    // Tests put files in simulador().midias; any other id is a short fake voice note.
    async baixarMidia(id) {
      return simulador().midias.get(id) ?? { dados: new Uint8Array(4096), tipo: 'audio/ogg; codecs=opus' };
    },
  };
}
