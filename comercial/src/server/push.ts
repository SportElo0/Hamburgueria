import { createECDH, hkdfSync } from 'node:crypto';
import webpush from 'web-push';
import { dentroDoLimite, type Ctx } from './contexto';
import { q, um } from './db';
import { ErroDeUso } from './erros';

/**
 * Phone alerts for the installed panel (Web Push). Every internal notification (new request, conversation waiting
 * for a person, task, assignment) also goes to the phones where that person turned alerts on.
 * The alert carries only the title and the panel link: no customer message text on the lock screen.
 */

const b64url = (b: Buffer) => b.toString('base64url');

/** VAPID keys: VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY when set, else derived from SUPABASE_JWT_SECRET (same scheme as chaves.ts). */
export function chavesVapid(): { publica: string; privada: string } | null {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) return { publica: process.env.VAPID_PUBLIC_KEY, privada: process.env.VAPID_PRIVATE_KEY };
  const base = process.env.SUPABASE_JWT_SECRET;
  if (!base || base.length < 32) return null;
  const privada = Buffer.from(hkdfSync('sha256', base, 'growlift-comercial', 'vapid', 32));
  const ecdh = createECDH('prime256v1');
  ecdh.setPrivateKey(privada);
  return { publica: b64url(ecdh.getPublicKey()), privada: b64url(privada) };
}

/** The server POSTs to the endpoint, so only the browsers' own push services are accepted. */
const SERVICOS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^([a-z0-9-]+\.)*push\.apple\.com$/, /^([a-z0-9-]+\.)*notify\.windows\.com$/];

export function endpointValido(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    return u.protocol === 'https:' && !u.port && SERVICOS.some((r) => r.test(u.hostname)) && endpoint.length <= 1000;
  } catch {
    return false;
  }
}

export interface InscricaoEntrada {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
}

export async function salvarInscricao(ctx: Ctx, sub: InscricaoEntrada, aparelho: string) {
  if (ctx.acessoAdmin) throw new ErroDeUso('O acesso da equipe Growlift não liga avisos no celular.');
  const endpoint = String(sub?.endpoint ?? '');
  const p256dh = String(sub?.keys?.p256dh ?? '');
  const authKey = String(sub?.keys?.auth ?? '');
  if (!endpointValido(endpoint) || !/^[A-Za-z0-9_-]{40,120}$/.test(p256dh) || !/^[A-Za-z0-9_-]{10,40}$/.test(authKey)) {
    throw new ErroDeUso('Este navegador não devolveu uma inscrição de aviso válida.');
  }
  // The same phone may have belonged to someone else before: it now alerts only the person logged in.
  await q(
    `insert into inscricoes_push (empresa_id, user_id, endpoint, p256dh, auth, aparelho) values ($1, $2, $3, $4, $5, $6)
     on conflict (endpoint) do update set empresa_id = excluded.empresa_id, user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, aparelho = excluded.aparelho, falhas = 0`,
    [ctx.empresaId, ctx.userId, endpoint, p256dh, authKey, aparelho.slice(0, 80)],
  );
  // Up to 10 devices per person: older ones beyond that are dropped.
  await q(
    `delete from inscricoes_push where user_id = $1 and id not in (select id from inscricoes_push where user_id = $1 order by criado_em desc limit 10)`,
    [ctx.userId],
  );
}

/**
 * What the lock screen shows: the subject only. Titles carry the customer's name after a colon
 * ("Novo pedido: Marina", "Pedido sem atendimento: Marina", "Tarefa vencida há 4 h: ..."), and that name comes
 * from a public form, so only the part before the colon goes out, without control characters.
 */
export function assuntoSeguro(titulo: string): string {
  const limpo = titulo.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim();
  const antes = limpo.split(':')[0].trim();
  return (antes || 'Novo aviso no painel').slice(0, 80);
}

export async function removerInscricao(ctx: Ctx, endpoint: string) {
  await q('delete from inscricoes_push where endpoint = $1 and user_id = $2', [endpoint, ctx.userId]);
}

export async function aparelhosDe(ctx: Ctx) {
  return q<{ id: string; aparelho: string; criado_em: Date; ultimo_envio_em: Date | null }>(
    'select id, aparelho, criado_em, ultimo_envio_em from inscricoes_push where empresa_id = $1 and user_id = $2 order by criado_em desc',
    [ctx.empresaId, ctx.userId],
  );
}

/** Test alert to the logged-in person's own phones. */
export async function avisoDeTeste(ctx: Ctx): Promise<number> {
  if (!(await dentroDoLimite(`teste-aviso:${ctx.userId}`, 5, 600))) throw new ErroDeUso('Muitos testes seguidos. Espere alguns minutos.');
  if (!(await um('select 1 from inscricoes_push where empresa_id = $1 and user_id = $2', [ctx.empresaId, ctx.userId]))) {
    throw new ErroDeUso('Nenhum celular com avisos ligados. Ligue os avisos neste aparelho primeiro.');
  }
  await q('insert into notificacoes (empresa_id, user_id, titulo, corpo, link) values ($1, $2, $3, $4, $5)', [ctx.empresaId, ctx.userId, 'Aviso de teste', 'Os avisos deste celular estão funcionando.', '/painel/celular']);
  return enviarAvisosCelular();
}

export interface Aviso {
  titulo: string;
  corpo: string;
  link: string;
}
type Remetente = (sub: { endpoint: string; p256dh: string; auth: string }, aviso: Aviso) => Promise<void>;

/** Error with the push service's HTTP status, as web-push throws it. */
const statusDe = (err: unknown) => (typeof err === 'object' && err && 'statusCode' in err ? Number((err as { statusCode: unknown }).statusCode) : 0);

const remetentePadrao: Remetente = async (sub, aviso) => {
  const chaves = chavesVapid();
  if (!chaves) throw new Error('sem chaves VAPID');
  await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(aviso), {
    vapidDetails: { subject: process.env.APP_URL?.startsWith('https://') ? process.env.APP_URL : 'https://growlift.com.br', publicKey: chaves.publica, privateKey: chaves.privada },
    TTL: 3600,
    urgency: 'high',
    timeout: 8000,
  });
};
let remetente: Remetente = remetentePadrao;
/** Tests replace the sender; null restores the real one. */
export function usarRemetenteDeTeste(r: Remetente | null) {
  remetente = r ?? remetentePadrao;
}

/**
 * Sends the alerts of notifications not pushed yet. Each notification is claimed once (at most one alert per phone,
 * even with several workers); notifications older than one hour are skipped, a late alert is worse than none.
 * Returns how many alerts were delivered to the push services.
 */
export async function enviarAvisosCelular(max = 50): Promise<number> {
  if (remetente === remetentePadrao && !chavesVapid()) return 0;
  await q(`update notificacoes set push_em = now() where push_em is null and criado_em < now() - interval '1 hour'`);
  const lote = await q<{ empresa_id: string; user_id: string | null; titulo: string; link: string }>(
    `update notificacoes set push_em = now() where id in (
       select id from notificacoes where push_em is null order by criado_em limit $1 for update skip locked
     ) returning empresa_id, user_id, titulo, link`,
    [max],
  );
  let enviados = 0;
  for (const n of lote) {
    // No recipient = the company's admins. Only active members of that same company receive it.
    const subs = await q<{ id: string; endpoint: string; p256dh: string; auth: string; empresa: string }>(
      `select s.id, s.endpoint, s.p256dh, s.auth, e.nome as empresa
       from inscricoes_push s
       join membros m on m.user_id = s.user_id and m.empresa_id = s.empresa_id and m.ativo
       join empresas e on e.id = s.empresa_id
       where s.empresa_id = $1 and (s.user_id = $2 or ($2::text is null and m.papel = 'admin'))`,
      [n.empresa_id, n.user_id],
    );
    for (const s of subs) {
      try {
        await remetente(s, { titulo: assuntoSeguro(n.titulo), corpo: `${s.empresa} · toque para abrir`, link: n.link.startsWith('/painel') ? n.link : '/painel' });
        await q('update inscricoes_push set ultimo_envio_em = now(), falhas = 0 where id = $1', [s.id]);
        enviados++;
      } catch (err) {
        const st = statusDe(err);
        // 404/410: the phone turned alerts off or the app was removed. Repeated failures: stop trying.
        if (st === 404 || st === 410) await q('delete from inscricoes_push where id = $1', [s.id]);
        else {
          await q('update inscricoes_push set falhas = falhas + 1 where id = $1', [s.id]);
          await q('delete from inscricoes_push where id = $1 and falhas >= 5', [s.id]);
        }
      }
    }
  }
  return enviados;
}
