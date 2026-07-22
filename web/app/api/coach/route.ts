import { NextRequest, NextResponse } from 'next/server';
import {
  responderCoach,
  traerAlumno,
  traerHistorial,
  mensajesDeHoy,
  guardarTurno,
} from '@/lib/coach/coach';

/**
 * POST /api/coach — Coach IA de la app (widget flotante).
 * Body: { alumnoId: string, mensaje: string }
 * Respuesta: { respuesta: string }
 *
 * SEGURIDAD (v1): este endpoint lo llama el NAVEGADOR (la app logueada), no un
 * script server-to-server, así que NO usa el gate de BRAIN_API_KEY (un token en
 * el front no es secreto). El gate de v1 es:
 *   - el alumnoId tiene que existir en la tabla `alumnos` (si no → 404),
 *   - tope diario de mensajes por alumno (si se pasa → 429), para que nadie
 *     queme tokens de la API.
 * Endurecer con una sesión firmada del login es un próximo paso, no v1.
 */

const TOPE_DIARIO = 60; // mensajes por alumno por día

function esUuid(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { alumnoId, mensaje } = body as { alumnoId?: unknown; mensaje?: unknown };

    if (!esUuid(alumnoId)) {
      return NextResponse.json(
        { status: 'error', message: 'Falta alumnoId válido.' },
        { status: 400 }
      );
    }
    if (typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Falta el mensaje.' },
        { status: 400 }
      );
    }
    if (mensaje.length > 4000) {
      return NextResponse.json(
        { status: 'error', message: 'El mensaje es demasiado largo.' },
        { status: 400 }
      );
    }

    // Gate 1: el alumno tiene que existir.
    const alumno = await traerAlumno(alumnoId);
    if (!alumno) {
      return NextResponse.json(
        { status: 'error', message: 'Alumno no encontrado.' },
        { status: 404 }
      );
    }

    // Gate 2: tope diario por alumno.
    const hoy = await mensajesDeHoy(alumnoId);
    if (hoy >= TOPE_DIARIO) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Llegaste al límite de mensajes por hoy. Seguimos mañana 💪',
        },
        { status: 429 }
      );
    }

    const historial = await traerHistorial(alumnoId);
    const respuesta = await responderCoach(alumno, historial, mensaje.trim());

    // Persistir el turno (no bloquea la respuesta si falla el insert).
    await guardarTurno(alumnoId, mensaje.trim(), respuesta);

    return NextResponse.json({ status: 'success', respuesta });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
