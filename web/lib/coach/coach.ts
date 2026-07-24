/**
 * ============================================================
 * COACH IA — motor conversacional del asistente de la app
 * ============================================================
 *
 * Un cerebro, dos caras: esta pieza la usa el widget flotante de la app hoy y
 * (más adelante) el bot de WhatsApp. Combina:
 *   - el método curado de Integral (metodo.ts) → va en `system` con caché
 *   - los datos reales del alumno (Supabase) → contexto del pedido
 *   - el historial de la charla (coach_conversaciones)
 *   - el mensaje nuevo del alumno
 *
 * Modelo: claude-sonnet-5 (elección de Lucas — no Opus, por costo; Sonnet rinde
 * casi igual para un coach anclado en contexto). El bloque grande (el método) se
 * cachea, así cada mensaje sale centavos.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { METODO_INTEGRAL } from './metodo';
import { NUTRICION_INTEGRAL } from './nutricion';

// Un solo bloque de conocimiento curado (método + nutrición) — mismo cache_control.
const CONOCIMIENTO = `${METODO_INTEGRAL}\n\n---\n\n${NUTRICION_INTEGRAL}`;

const MODELO = 'claude-sonnet-5';
const MAX_HISTORIAL = 20; // últimos turnos que se le pasan como memoria

// Lazy: createClient() tira si la URL viene vacía, y Next la evalúa en build
// time al "recolectar page data" — con el módulo top-level eso rompía el
// build entero (`supabaseUrl is required`). Se crea recién en el primer uso.
let _supabase: SupabaseClient | null = null;
function supa(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return _supabase;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type RolCoach = 'user' | 'assistant';

export interface TurnoCoach {
  rol: RolCoach;
  mensaje: string;
}

export interface AlumnoCoach {
  id: string;
  nombre: string | null;
  email: string | null;
  edad: string | null;
  peso: string | null;
  altura: string | null;
  tipo: string | null;
  modalidad: string | null;
  plan_type: string | null;
  fecha_asignacion_plan: string | null;
  rm: unknown;
  bioimpedancia: unknown;
  diario: unknown;
  asistencia: unknown;
  plan_periodizacion: unknown;
  plan_movilidad: unknown;
  plan_calor: unknown;
  plan_activacion: unknown;
}

/**
 * Ejercicios de una rutina con su descripción (array de {nombre, desc}).
 * Devuelve "nombre — desc" por ejercicio, para que el coach pueda EXPLICAR cada
 * uno en detalle. "" si no hay.
 */
function rutinaTexto(arr: unknown): string {
  if (!Array.isArray(arr)) return "";
  return arr
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const e = x as { nombre?: string; desc?: string };
      if (!e.nombre) return null;
      return e.desc ? `${e.nombre} — ${e.desc}` : e.nombre;
    })
    .filter(Boolean)
    .join("\n");
}

/** Semana actual dentro del ciclo de 8 semanas, calculada desde la asignación del plan. */
function semanaDeCiclo(fechaAsignacion: string | null): number | null {
  if (!fechaAsignacion) return null;
  const inicio = new Date(fechaAsignacion).getTime();
  if (Number.isNaN(inicio)) return null;
  const ahora = Date.now();
  const semanas = Math.floor((ahora - inicio) / (7 * 24 * 60 * 60 * 1000));
  if (semanas < 0) return null;
  return (semanas % 8) + 1;
}

/** Arma el bloque de contexto del alumno para el pedido a Claude. */
function contextoAlumno(a: AlumnoCoach): string {
  const partes: string[] = [];
  partes.push(`Nombre: ${a.nombre ?? 'sin nombre'}`);
  if (a.edad) partes.push(`Edad: ${a.edad}`);
  if (a.peso) partes.push(`Peso: ${a.peso}`);
  if (a.altura) partes.push(`Altura: ${a.altura}`);
  if (a.tipo) partes.push(`Tipo de alumno: ${a.tipo}`);
  if (a.modalidad) partes.push(`Modalidad / objetivo: ${a.modalidad}`);
  if (a.plan_type) partes.push(`Plan actual: ${a.plan_type}`);

  const semana = semanaDeCiclo(a.fecha_asignacion_plan);
  if (semana) {
    const seriesReps = ['2×6', '3×6', '2×8', '3×8', '2×4', '3×4', '2×6', '3×6'][semana - 1];
    const intensidad = ['70%', '75%', '80%', '80%', '85%', '85%', '70%', '75%'][semana - 1];
    partes.push(
      `Semana de periodización: ${semana} de 8 → hoy le tocan ${seriesReps} al ${intensidad} en los ejercicios principales (según la periodización base; si tiene una periodización propia cargada, respetá esa).`
    );
  }

  const rm = a.rm as { movilidad_default?: string } | null;
  if (rm && typeof rm === 'object' && Object.keys(rm).length > 0) {
    partes.push(`Máximos (RM) por ejercicio: ${JSON.stringify(rm)}`);
    if (rm.movilidad_default) {
      partes.push(`Versión de movilidad por defecto de este alumno: ${rm.movilidad_default} (superrapida / corta / completa).`);
    }
  }
  if (a.plan_periodizacion && typeof a.plan_periodizacion === 'object') {
    partes.push(`Periodización propia cargada: ${JSON.stringify(a.plan_periodizacion)}`);
  }

  // Rutinas cargadas del alumno (lo que ve en la app), con la descripción de
  // cada ejercicio. La movilidad "completa" es EXACTAMENTE esta lista.
  const movi = rutinaTexto(a.plan_movilidad);
  if (movi) partes.push(`Movilidad cargada (versión COMPLETA de este alumno) — nombre y cómo se hace cada uno:\n${movi}`);
  const banda = rutinaTexto(a.plan_calor);
  if (banda) partes.push(`Entrada en calor con banda cargada:\n${banda}`);
  const peso = rutinaTexto(a.plan_activacion);
  if (peso) partes.push(`Entrada en calor con peso cargada:\n${peso}`);

  // Bioimpedancia: solo la más reciente si es un array.
  if (Array.isArray(a.bioimpedancia) && a.bioimpedancia.length > 0) {
    partes.push(`Última bioimpedancia: ${JSON.stringify(a.bioimpedancia[a.bioimpedancia.length - 1])}`);
  }
  // Diario: últimas 3 entradas.
  if (Array.isArray(a.diario) && a.diario.length > 0) {
    partes.push(`Últimas entradas del diario: ${JSON.stringify(a.diario.slice(-3))}`);
  }
  if (Array.isArray(a.asistencia)) {
    partes.push(`Sesiones registradas: ${a.asistencia.length}`);
  }

  return partes.join('\n');
}

const INSTRUCCIONES_COACH = `
Sos el coach personal de este alumno dentro de la app de Integral. Trabajás con SU información real (arriba) y con el método de Integral.

Cómo respondés — MUY IMPORTANTE:
- Pensá que del otro lado hay una persona que NO sabe nada de entrenamiento, quizás un adulto mayor que nunca entrenó. Explicá TODO de forma simple, detallada y paciente, como si fuera la primera vez. Nada de jerga; si usás una palabra técnica, explicala.
- Guialo de a UN ejercicio por vez, no le tires la lista entera de golpe. Para cada ejercicio decí: (1) el nombre, (2) cómo se hace paso a paso, en palabras fáciles, (3) qué tiene que sentir y qué NO tiene que doler, (4) cuántas repeticiones. Después preguntá si lo entendió o si quiere pasar al siguiente.
- Cercano, argentino, de vos, tranquilo y alentador. Podés extenderte lo que haga falta para que se entienda — acá la claridad importa más que ser breve.
- Ofrecé el video: después de explicar un ejercicio, preguntale "¿querés que te muestre el video de cómo se hace?". IMPORTANTE: hoy los videos todavía NO están cargados en la app (dice "Video próximamente"). Si el alumno dice que sí, avisale con cariño que el video de ese ejercicio todavía se está preparando, y mientras tanto explicáselo tú con más detalle o con una comparación fácil de la vida cotidiana.
- Usás los datos del alumno: su plan, su semana de periodización, sus máximos. Cuando le digas una carga, calculala desde su máximo y el % que le toca esta semana (nunca inventes un peso; si no tenés su máximo de ese ejercicio, decíselo y guialo por sensación de esfuerzo, bien simple).
- Modo entrenador en vivo: si te pide arrancar la sesión o "qué me toca hoy", guialo de a un ejercicio por vez siguiendo la estructura fija (movilidad → calor con banda → calor con peso → principales), explicando cada uno como arriba.
- MOVILIDAD: cuando quiera arrancar la movilidad, NO dictes una lista genérica. Primero preguntale qué versión quiere — superrápida (~3'), corta (~8') o completa (~15') — mencionando cuál tiene por defecto y qué es cada una. Recién cuando elige, empezás a guiar de a un ejercicio por vez: la COMPLETA son EXACTAMENTE los ejercicios que tiene cargados en su app (te los paso arriba en "Movilidad cargada", con la descripción de cada uno — usala para explicar), en ese orden; la corta y la superrápida son las del método. Lo mismo con la entrada en calor (banda / peso).
- Seguridad primero: si menciona dolor, frenás, le decís que no siga con ese ejercicio y que lo hable con el entrenador (o Griselda si hay lesión). Nunca le digas que aguante el dolor.
- No cambies el plan que le armó el entrenador. Podés explicar, guiar y motivar, pero si quiere cambiar ejercicios lo derivás a Lucas o Ari.
- Si no sabés algo de este alumno en particular, decílo con honestidad en vez de inventar.
`;

/**
 * Genera la respuesta del coach para un alumno, dado su mensaje y el historial.
 * NO persiste nada — de eso se encarga el endpoint.
 */
export async function responderCoach(
  alumno: AlumnoCoach,
  historial: TurnoCoach[],
  mensaje: string,
  opts?: { modoVoz?: boolean }
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [];

  // Historial previo como turnos user/assistant.
  for (const t of historial.slice(-MAX_HISTORIAL)) {
    messages.push({ role: t.rol, content: t.mensaje });
  }

  const instruccionVoz = opts?.modoVoz
    ? '\n\nMODO VOZ: esta charla es hablada en vivo (vos hablás por voz y el alumno te contesta hablando). Respondé CORTO — máximo 2 o 3 oraciones por turno, UNA sola idea o ejercicio a la vez, y después preguntá o esperá antes de seguir. Nada de listas, nada de markdown, nada de números de puntos: es para que se escuche como una charla natural, no como un texto leído.'
    : '';

  // El mensaje nuevo: contexto del alumno + instrucciones + lo que escribió.
  messages.push({
    role: 'user',
    content: `DATOS DE ESTE ALUMNO:\n${contextoAlumno(alumno)}\n${INSTRUCCIONES_COACH}${instruccionVoz}\n\nMensaje del alumno: ${mensaje}`,
  });

  const response = await anthropic.messages.create({
    model: MODELO,
    max_tokens: opts?.modoVoz ? 400 : 2000, // en voz, tope bajo fuerza respuestas cortas
    thinking: { type: 'disabled' }, // chat rápido; el conocimiento ya está en el contexto
    system: [
      {
        type: 'text',
        text: CONOCIMIENTO,
        cache_control: { type: 'ephemeral' }, // el conocimiento es estable → se cachea
      },
    ],
    messages,
  });

  const texto = response.content.find((b) => b.type === 'text');
  return texto && texto.type === 'text'
    ? texto.text
    : 'Perdoná, no pude generar una respuesta. Probá de nuevo.';
}

/** Trae el alumno por id (service_role, del lado del server). null si no existe. */
export async function traerAlumno(alumnoId: string): Promise<AlumnoCoach | null> {
  const { data, error } = await supa()
    .from('alumnos')
    .select(
      'id, nombre, email, edad, peso, altura, tipo, modalidad, plan_type, fecha_asignacion_plan, rm, bioimpedancia, diario, asistencia, plan_periodizacion, plan_movilidad, plan_calor, plan_activacion'
    )
    .eq('id', alumnoId)
    .maybeSingle();

  if (error || !data) return null;
  return data as AlumnoCoach;
}

/** Historial de la charla de un alumno, cronológico. */
export async function traerHistorial(alumnoId: string): Promise<TurnoCoach[]> {
  const { data, error } = await supa()
    .from('coach_conversaciones')
    .select('rol, mensaje')
    .eq('alumno_id', alumnoId)
    .order('creado_en', { ascending: true })
    .limit(MAX_HISTORIAL);

  if (error || !data) return [];
  return data as TurnoCoach[];
}

/** Cuántos mensajes mandó hoy el alumno (para el tope diario). */
export async function mensajesDeHoy(alumnoId: string): Promise<number> {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);
  const { count } = await supa()
    .from('coach_conversaciones')
    .select('*', { count: 'exact', head: true })
    .eq('alumno_id', alumnoId)
    .eq('rol', 'user')
    .gte('creado_en', inicioDia.toISOString());
  return count ?? 0;
}

/** Guarda el turno del alumno y la respuesta del coach. */
export async function guardarTurno(
  alumnoId: string,
  mensajeAlumno: string,
  respuestaCoach: string
): Promise<void> {
  await supa().from('coach_conversaciones').insert([
    { alumno_id: alumnoId, rol: 'user', mensaje: mensajeAlumno },
    { alumno_id: alumnoId, rol: 'assistant', mensaje: respuestaCoach },
  ]);
}
