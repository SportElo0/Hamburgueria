import "server-only";
import { siteUrl } from "./site-url";

/**
 * Same-origin check for public POST endpoints (basic CSRF/abuse filter). Requests without an
 * Origin header (some privacy setups) fall back to Referer; anything cross-site is refused.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const allowed = new Set([new URL(siteUrl()).host, host].filter(Boolean) as string[]);
    return allowed.has(o.host);
  } catch {
    return false;
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
