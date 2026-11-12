/**
 * What a provider told us about one send. Only "aceito" may become "enviada";
 * "incerto" (no answer, connection dropped) is never retried blindly.
 */
export type ResultadoEnvio =
  | { tipo: 'aceito'; idProvedor: string }
  | { tipo: 'recusado'; erro: string; repetir: boolean }
  | { tipo: 'incerto'; erro: string };

export interface ModeloMensagem {
  nome: string;
  idioma: string;
  variaveis: string[];
}

/** Same interface for the official WhatsApp API and for the local simulator. */
export interface CanalWhatsApp {
  simulado: boolean;
  enviarTexto(para: string, corpo: string): Promise<ResultadoEnvio>;
  enviarModelo(para: string, modelo: ModeloMensagem): Promise<ResultadoEnvio>;
}
