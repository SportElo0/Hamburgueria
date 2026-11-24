import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, isTeam, verifySession } from './lib/session';

export async function proxy(request: NextRequest) {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('volta', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  // A store's staff only ever sees its own order screen.
  if (!isTeam(session) && !request.nextUrl.pathname.startsWith(`/loja/${session.slug}`)) {
    return NextResponse.redirect(new URL(`/loja/${session.slug}`, request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/painel/:path*', '/loja/:path*'] };
