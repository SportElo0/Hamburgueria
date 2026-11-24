import { ambiente } from './config';
import { buscarComPrazo } from './erros';

/**
 * Voice notes become text, so the assistant (and the team) read them like any message. The model itself does not take
 * audio, so this is a separate speech-to-text service, called through the common "audio/transcriptions" format
 * (Groq by default; OpenAI works with the same code by changing the address and model). Without a key: the simulator
 * outside production; in production, audio goes to the team as before.
 *
 * Price checked on 24/11/2026 (pages of the providers, without taxes): Groq whisper-large-v3-turbo US$ 0.04 per hour of
 * audio (minimum 10 s per request); OpenAI gpt-4o-mini-transcribe about US$ 0.003 per minute. Check before contracting.
 */
export interface Transcritor {
  simulado: boolean;
  transcrever(audio: Uint8Array, tipo: string): Promise<string>;
}

/** Voice notes up to this size (an Opus voice note uses a few KB per second: this is several minutes). */
export const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const MAX_TEXTO = 4000;

const g = globalThis as unknown as { __transcritorTeste?: Transcritor | null };
/** Tests replace the service (for example, one that always fails). */
export const usarTranscritorDeTeste = (t: Transcritor | null) => (g.__transcritorTeste = t);

const EXTENSAO: Record<string, string> = { 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/aac': 'm4a', 'audio/amr': 'amr', 'audio/webm': 'webm', 'audio/wav': 'wav' };

function transcritorReal(chave: string): Transcritor {
  // Explicit address and model: nothing inherited from whoever runs the app.
  const endereco = process.env.TRANSCRICAO_URL || 'https://api.groq.com/openai/v1/audio/transcriptions';
  const modelo = process.env.TRANSCRICAO_MODELO || 'whisper-large-v3-turbo';
  return {
    simulado: false,
    async transcrever(audio, tipo) {
      if (!endereco.startsWith('https://')) throw new Error('TRANSCRICAO_URL precisa ser https.');
      if (audio.byteLength > MAX_AUDIO_BYTES) throw new Error('Áudio grande demais para transcrever.');
      const base = tipo.split(';')[0].trim().toLowerCase();
      const fd = new FormData();
      fd.append('file', new Blob([new Uint8Array(audio)], { type: base || 'audio/ogg' }), `audio.${EXTENSAO[base] ?? 'ogg'}`);
      fd.append('model', modelo);
      fd.append('language', 'pt');
      fd.append('response_format', 'json');
      const res = await buscarComPrazo(fetch, endereco, { method: 'POST', headers: { Authorization: `Bearer ${chave}` }, body: fd }, 40_000);
      const json = (await res.json().catch(() => null)) as { text?: string; error?: { message?: string } } | null;
      if (!res.ok) throw new Error(`Transcrição recusada (${res.status}): ${json?.error?.message ?? 'sem detalhe'}`.slice(0, 300));
      return String(json?.text ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXTO);
    },
  };
}

/** Simulator (never in production): says what it would have done. */
const simulado: Transcritor = {
  simulado: true,
  async transcrever(audio) {
    return `(transcrição simulada de um áudio de ${Math.max(1, Math.round(audio.byteLength / 1024))} KB)`;
  },
};

export function transcritor(): Transcritor | null {
  if (g.__transcritorTeste !== undefined) return g.__transcritorTeste;
  const chave = process.env.TRANSCRICAO_API_KEY;
  if (chave) return transcritorReal(chave);
  return ambiente() === 'producao' ? null : simulado;
}
