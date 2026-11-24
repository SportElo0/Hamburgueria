import { after } from 'next/server';
import { ambiente } from './config';
import { q } from './db';

/**
 * Transactional e-mail (invitations and password reset). With RESEND_API_KEY and EMAIL_REMETENTE set, it goes out
 * through Resend's HTTP API; otherwise, outside production, it is stored as a simulated e-mail shown to the Growlift
 * admin. Nothing else in the platform sends e-mail.
 */
export type ResultadoEmail = 'enviado' | 'simulado' | 'falhou' | 'desligado';

export const emailLigado = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_REMETENTE);

const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Plain HTML version: the text paragraph by paragraph. Only the platform's own link becomes clickable, so a URL
 * typed into a company name never turns into a link in an e-mail sent from the Growlift domain. */
export function htmlDoTexto(texto: string, link?: string): string {
  const alvo = link?.startsWith('https://') ? escapar(link) : null;
  const corpo = texto
    .split(/\n{2,}/)
    .map((p) => {
      let h = escapar(p);
      if (alvo) h = h.split(alvo).join(`<a href="${alvo}">${alvo}</a>`);
      return `<p>${h.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111a2c">${corpo}</div>`;
}

export async function enviarEmail(m: { para: string; assunto: string; texto: string; link?: string }): Promise<ResultadoEmail> {
  if (!emailLigado()) {
    if (ambiente() === 'producao') return 'desligado';
    await q('insert into emails_simulados (para, assunto, corpo) values ($1, $2, $3)', [m.para, m.assunto, m.texto]);
    return 'simulado';
  }
  try {
    const r = await fetch((ambiente() !== 'producao' && process.env.RESEND_URL) || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_REMETENTE, to: [m.para], subject: m.assunto, text: m.texto, html: htmlDoTexto(m.texto, m.link) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (r.ok) return 'enviado';
    console.error('e-mail recusado pelo provedor', r.status);
    return 'falhou';
  } catch (e) {
    console.error('e-mail não enviado', (e as Error).name);
    return 'falhou';
  }
}

/** Runs a send after the answer has gone out (inside a request), or detached elsewhere (scripts, tests). Never throws. */
export function emSegundoPlano(fn: () => Promise<unknown>): void {
  const rodar = () => fn().then(() => undefined, (e: unknown) => console.error('[e-mail em segundo plano]', (e as Error)?.name));
  try {
    after(rodar);
  } catch {
    void rodar();
  }
}
