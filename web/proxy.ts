import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, hasValidSession } from '@/lib/session-auth';

export async function proxy(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (await hasValidSession(cookie)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname.includes('/api/')) {
    return NextResponse.json(
      { status: 'error', message: 'No autorizado. Iniciá sesión en /charles-login.' },
      { status: 401 }
    );
  }

  const loginUrl = new URL('/charles-login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/coalition/:path*',
    '/monitor/:path*',
    '/responder/:path*',
    '/studios/:path*',
    '/api/coalition/:path*',
    '/api/orchestrator/:path*',
    '/api/responder',
  ],
};
