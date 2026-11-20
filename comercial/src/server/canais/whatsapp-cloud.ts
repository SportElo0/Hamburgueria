import { createHmac } from 'node:crypto';
import { iguais } from '../segredos';
import type { CanalWhatsApp, ModeloMensagem, ResultadoEnvio } from './tipos';

/**
 * Official WhatsApp Business Platform (Cloud API, Meta). No WhatsApp Web automation.
 * Not validated against a real account in this version: it needs the company's credentials (see README).
 */
export interface CredenciaisCloud {
  phoneNumberId: string;
  accessToken: string;
}

export function canalCloud(c: CredenciaisCloud, buscar: typeof fetch = fetch): CanalWhatsApp {
  const versao = process.env.WHATSAPP_GRAPH_VERSION;
  async function enviar(corpo: Record<string, unknown>): Promise<ResultadoEnvio> {
    if (!versao) return { tipo: 'recusado', erro: 'WHATSAPP_GRAPH_VERSION não configurada.', repetir: false };
    let res: Response;
    try {
      res = await buscar(`https://graph.facebook.com/${versao}/${encodeURIComponent(c.phoneNumberId)}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${c.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...corpo }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      // The request may or may not have reached Meta: we do not know, so we do not resend.
      return { tipo: 'incerto', erro: `Sem resposta do WhatsApp: ${err instanceof Error ? err.message : String(err)}` };
    }
    const json = (await res.json().catch(() => null)) as { messages?: { id?: string }[]; error?: { message?: string; code?: number } } | null;
    if (res.ok) {
      const id = json?.messages?.[0]?.id;
      return id ? { tipo: 'aceito', idProvedor: id } : { tipo: 'incerto', erro: 'O WhatsApp respondeu sem o identificador da mensagem.' };
    }
    const erro = `WhatsApp recusou (${res.status}${json?.error?.code ? `, código ${json.error.code}` : ''}): ${json?.error?.message ?? 'sem detalhe'}`;
    return { tipo: 'recusado', erro, repetir: res.status === 429 || res.status >= 500 };
  }
  return {
    simulado: false,
    enviarTexto: (para, texto) => enviar({ to: para, type: 'text', text: { preview_url: false, body: texto } }),
    enviarModelo: (para, m: ModeloMensagem) =>
      enviar({
        to: para,
        type: 'template',
        template: { name: m.nome, language: { code: m.idioma }, components: m.variaveis.length ? [{ type: 'body', parameters: m.variaveis.map((text) => ({ type: 'text', text })) }] : [] },
      }),
  };
}

/** Meta signs each webhook body with the app secret (header X-Hub-Signature-256). */
export function assinaturaValida(corpoBruto: string, cabecalho: string | null, appSecret: string | undefined): boolean {
  if (!appSecret || !cabecalho?.startsWith('sha256=')) return false;
  const esperado = createHmac('sha256', appSecret).update(corpoBruto, 'utf8').digest('hex');
  return iguais(esperado, cabecalho.slice(7));
}

export interface EntradaWebhook {
  phoneNumberId: string;
  mensagens: { id: string; de: string; nome: string; texto: string | null; tipo: string; quando: Date }[];
  estados: { id: string; estado: 'sent' | 'delivered' | 'read' | 'failed'; erro: string | null; quando: Date }[];
}

/** Flattens a webhook payload into what we use, per receiving phone number. Unknown shapes are ignored. */
export function lerWebhook(payload: unknown): EntradaWebhook[] {
  const out: EntradaWebhook[] = [];
  const p = payload as { object?: string; entry?: { changes?: { field?: string; value?: Record<string, unknown> }[] }[] };
  if (p?.object !== 'whatsapp_business_account' || !Array.isArray(p.entry)) return out;
  for (const e of p.entry) {
    for (const ch of e.changes ?? []) {
      const v = ch.value as { metadata?: { phone_number_id?: string }; contacts?: { wa_id?: string; profile?: { name?: string } }[]; messages?: Record<string, unknown>[]; statuses?: Record<string, unknown>[] } | undefined;
      const phoneNumberId = v?.metadata?.phone_number_id;
      if (ch.field !== 'messages' || !phoneNumberId) continue;
      const nomes = new Map((v.contacts ?? []).map((c) => [c.wa_id ?? '', c.profile?.name ?? '']));
      const quando = (t: unknown) => new Date((Number(t) || Date.now() / 1000) * 1000);
      out.push({
        phoneNumberId,
        mensagens: (v.messages ?? [])
          .filter((m) => typeof m.id === 'string' && typeof m.from === 'string')
          .map((m) => ({
            id: m.id as string,
            de: m.from as string,
            nome: nomes.get(m.from as string) ?? '',
            tipo: String(m.type ?? ''),
            texto: m.type === 'text' ? String((m.text as { body?: string })?.body ?? '') : m.type === 'button' ? String((m.button as { text?: string })?.text ?? '') : null,
            quando: quando(m.timestamp),
          })),
        estados: (v.statuses ?? [])
          .filter((s) => typeof s.id === 'string' && ['sent', 'delivered', 'read', 'failed'].includes(String(s.status)))
          .map((s) => ({
            id: s.id as string,
            estado: s.status as 'sent' | 'delivered' | 'read' | 'failed',
            erro: Array.isArray(s.errors) && s.errors[0] ? `${(s.errors[0] as { code?: number }).code ?? ''} ${(s.errors[0] as { title?: string }).title ?? ''}`.trim() : null,
            quando: quando(s.timestamp),
          })),
      });
    }
  }
  return out;
}
