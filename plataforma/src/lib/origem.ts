/** The panel's public address, for links that outside services (Instagram) must reach. PAINEL_URL wins when set. */
export function publicOrigin(fallback: string) {
  const env = process.env.PAINEL_URL?.trim();
  if (env && /^https:\/\/[^/]+$/.test(env.replace(/\/$/, ''))) return env.replace(/\/$/, '');
  return new URL(fallback).origin;
}
