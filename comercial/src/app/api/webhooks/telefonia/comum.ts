/** Shared by the telephony webhooks (not a route: only route.ts files are). */

/** The company's key, sent as "Authorization: Bearer <key>" or as the password of HTTP Basic auth (services that only allow a URL). */
export function chaveDe(req: Request): string {
  const h = req.headers.get('authorization') ?? '';
  if (/^bearer /i.test(h)) return h.slice(7).trim();
  if (/^basic /i.test(h)) {
    try {
      const t = Buffer.from(h.slice(6).trim(), 'base64').toString('utf8');
      return t.slice(t.indexOf(':') + 1);
    } catch {
      return '';
    }
  }
  return '';
}
