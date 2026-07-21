/**
 * ============================================================
 * API AUTH — Gate por Bearer token para endpoints de tooling
 * ============================================================
 *
 * Protege los endpoints que se llaman de forma programática (bot de
 * WhatsApp, scripts, /charles) y NO desde el navegador — sobre todo los
 * que gastan tokens de la ANTHROPIC_API_KEY o escriben datos.
 *
 * Modelo: fail-closed. Si BRAIN_API_KEY no está seteada en el server, el
 * endpoint queda cerrado (401) — es la opción segura por defecto. Se activa
 * el acceso agregando BRAIN_API_KEY en Vercel y mandando el header:
 *
 *     Authorization: Bearer <BRAIN_API_KEY>
 *   (también se acepta el header  x-api-key: <BRAIN_API_KEY>)
 *
 * NO usar en endpoints que llame el navegador (coalition/stream, responder,
 * orchestrator, monitor): un token en JS de cliente no es secreto. Esos van
 * detrás de un login de página, no de este gate.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/** Comparación en tiempo constante para no filtrar la key por timing. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Devuelve una NextResponse 401/500 si el request NO está autorizado, o
 * null si SÍ lo está (seguir con el handler).
 *
 * Uso en una route:
 *   const denied = requireApiKey(request);
 *   if (denied) return denied;
 */
export function requireApiKey(request: NextRequest): NextResponse | null {
  const expected = process.env.BRAIN_API_KEY;

  // Fail-closed: sin key configurada en el server, el endpoint está cerrado.
  if (!expected) {
    return NextResponse.json(
      {
        status: 'error',
        message:
          'Endpoint protegido: falta configurar BRAIN_API_KEY en el server (Vercel).',
      },
      { status: 401 }
    );
  }

  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const provided = bearer || request.headers.get('x-api-key') || '';

  if (!provided || !safeEqual(provided, expected)) {
    return NextResponse.json(
      { status: 'error', message: 'API key inválida o ausente.' },
      { status: 401 }
    );
  }

  return null;
}
