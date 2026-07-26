import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionValue,
  verifyPassword,
} from '@/lib/session-auth';

export async function POST(request: NextRequest) {
  const secret = process.env.CHARLES_SESSION_SECRET;
  if (!secret || !process.env.CHARLES_ADMIN_PASSWORD) {
    return NextResponse.json(
      {
        status: 'error',
        message:
          'Login no configurado: faltan CHARLES_SESSION_SECRET / CHARLES_ADMIN_PASSWORD en el server.',
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!verifyPassword(password)) {
    return NextResponse.json(
      { status: 'error', message: 'Contraseña incorrecta.' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ status: 'ok' });
  response.cookies.set(SESSION_COOKIE, await createSessionValue(secret), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
