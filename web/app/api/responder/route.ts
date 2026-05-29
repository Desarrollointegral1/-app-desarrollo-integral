/**
 * POST /api/responder
 * ──────────────────────────────
 * Genera un mensaje (WhatsApp o mail) en el estilo del equipo de Giver,
 * listo para enviar. El usuario pega el mensaje del cliente O escribe una
 * instrucción corta de qué quiere decir.
 *
 * - persona: 'lucas' (coordina agenda/pagos/seguimiento, habla de Caro en
 *   tercera persona) o 'caro' (la cara de la agencia, firma como Caro).
 * - channel: 'whatsapp' (corto, sin firma formal) o 'mail' (con saludo/cierre).
 *
 * Memoria: estilo base de fábrica (BASELINE_EXAMPLES) + ejemplos aprendidos
 * que envía el front (learnedExamples).
 *
 * Usa Gemini (gratis); si no hay clave, OpenAI (gpt-4o-mini) como respaldo.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const RequestSchema = z.object({
  input: z.string().min(2, 'Escribí algo primero').max(6000, 'El texto es demasiado largo'),
  persona: z.enum(['lucas', 'caro']).optional().default('lucas'),
  channel: z.enum(['whatsapp', 'mail']).optional().default('whatsapp'),
  learnedExamples: z
    .array(z.object({ input: z.string().max(3000), reply: z.string().max(4000) }))
    .max(40)
    .optional(),
});

interface BaselineExample {
  persona: 'lucas' | 'caro';
  channel: 'whatsapp' | 'mail';
  input: string;
  reply: string;
}

// Ejemplos de fábrica: capturan la voz real del equipo (de conversaciones reales)
const BASELINE_EXAMPLES: BaselineExample[] = [
  {
    persona: 'lucas',
    channel: 'whatsapp',
    input:
      'Fernando invita a Caro a dar una charla para un espacio de mujeres en 25 de Mayo. Rechazar amablemente por agenda y dejar la puerta abierta.',
    reply:
      'Hola Fernando! Cómo estás?\n\nMuchas gracias por pensar en Caro para el espacio.\n\nHoy estamos bastante ajustados con la agenda por temas de agencia y nuevos clientes, así que por el momento no vamos a poder comprometernos con nuevas charlas o eventos.\n\nPero quedemos en contacto para más adelante.',
  },
  {
    persona: 'lucas',
    channel: 'whatsapp',
    input: 'Fernando pregunta si se puede hacer la charla en formato virtual. Rechazar también, pero abrir a futuro y pedirle un mail.',
    reply:
      'Hoy por el momento no lo estamos organizando tampoco Fernando, porque Caro viene bastante ajustada con la agenda general.\n\nPero más adelante seguramente volvamos a abrir espacios de ese estilo.\n\nBuenísimo, pasame un mail y te mando.',
  },
  {
    persona: 'caro',
    channel: 'whatsapp',
    input: 'Rechazar la invitación de Fernando a una charla, por agenda, dejando la puerta abierta.',
    reply:
      'Hola Fernando, muchas gracias por pensar en Caro para el espacio. Hoy estamos bastante ajustados con la agenda por temas de la agencia y nuevos clientes, así que por el momento no vamos a poder comprometernos con nuevas charlas o eventos. Quedemos en contacto para más adelante.',
  },
  {
    persona: 'caro',
    channel: 'mail',
    input: 'Primer contacto con una candidata: contarle de la posición de Email Marketing y pedirle CV y remuneración.',
    reply:
      'Hola Johanna, cómo estás?\n\nTe cuento un poco más, en Giver estamos buscando un perfil de Email Marketing Ssr/Sr para sumarse al equipo y trabajar con marcas de ecommerce.\n\nLa posición es híbrida, de 6 horas diarias, con base en Buenos Aires. El rol implica trabajar con 8 a 10 cuentas de ecommerce desarrollando estrategia y ejecución de campañas, automatizaciones, tests A/B y optimización de flows en Klaviyo y Perfit, con bastante autonomía.\n\nSi te interesa avanzar, mandame tu CV junto con tu remuneración pretendida así evaluamos el fit.\n\nSaludos,\nCaro',
  },
  {
    persona: 'caro',
    channel: 'mail',
    input: 'Agendar entrevista, contar el esquema híbrido (lunes oficina, resto remoto) y proponer lunes 1 a las 13:00h.',
    reply:
      'Hola Ana, cómo estás?\n\nPerfecto, gracias por la info y por enviarme el CV.\n\nCon respecto al esquema híbrido, trabajamos los lunes desde la oficina y el resto de la semana remoto.\n\nMe gustaría coordinar una entrevista para el lunes 1 de junio a las 13:00h. Confirmame si te queda bien y te mando el Meet.\n\nSaludos,\nCaro',
  },
  {
    persona: 'caro',
    channel: 'mail',
    input: 'Confirmar el horario coordinado y mandar el link del Meet (martes 2 a las 13:00).',
    reply:
      'Hola Mailen,\n\nPerfecto, entonces coordinamos para el martes 2 a las 13:00 hs.\n\nTe dejo el link del Meet:\nmeet.google.com/dnt-dcnh-qdt\n\nSaludos,\nCaro',
  },
];

const TONE_RULES = `TONO Y ESTRUCTURA (regla de oro, respetala siempre):
- Corto y natural. Profesional pero humano.
- Sin exageraciones.
- Sin validaciones innecesarias (nada de "está buenísimo", "me encanta", "gran propuesta").
- Sin frases artificiales (nada de "te soy sincero", "quedo atento", "charlalo tranquilo").
- Sin exceso de formalidad.
- Como un WhatsApp real de alguien que coordina negocios.
- Siempre intentá cerrar con un próximo paso concreto.

FORMATO IDEAL:
1. Saludo corto.
2. Contexto breve, solo si hace falta.
3. Respuesta clara.
4. Próximo paso natural.`;

function personaBlock(persona: 'lucas' | 'caro'): string {
  if (persona === 'lucas') {
    return `QUIÉN ESCRIBE: Lucas, parte del equipo de Giver. Coordina agenda, pagos, seguimiento y coordinación. Cuando corresponde, habla de Caro en tercera persona (ej: "Caro viene ajustada con la agenda"). No firma con nombre en WhatsApp.`;
  }
  return `QUIÉN ESCRIBE: Caro (Carolina Dubiansky), la cara de la agencia Giver. Habla en primera persona. En mail cierra con "Saludos," y "Caro" debajo.`;
}

function channelBlock(channel: 'whatsapp' | 'mail'): string {
  if (channel === 'whatsapp') {
    return `CANAL: WhatsApp. Mensaje corto y directo, como se escribe en el celular. Saltos de línea cortos entre ideas. NO uses firma formal ("Saludos, ...") salvo que sea totalmente natural. Nada de asunto.`;
  }
  return `CANAL: Mail. Podés abrir con "Hola [Nombre], cómo estás?" y cerrar con "Saludos," + el nombre de quien escribe. Igual mantené el tono corto y natural, sin formalidad de más.`;
}

function buildSystemPrompt(
  persona: 'lucas' | 'caro',
  channel: 'whatsapp' | 'mail',
  learnedExamples?: { input: string; reply: string }[]
): string {
  let prompt = `Sos el asistente de redacción del equipo de Giver Solutions (agencia de marketing).
Tu trabajo es escribir EL MENSAJE COMPLETO listo para enviar tal cual, sin explicaciones.

${personaBlock(persona)}

${channelBlock(channel)}

${TONE_RULES}

CÓMO INTERPRETAR LA ENTRADA:
- Puede ser el mensaje que mandó el cliente (respondé a eso), o una instrucción corta de qué decir (ej: "rechazá la charla por agenda pero dejá la puerta abierta"). En ambos casos devolvés el mensaje final.
- Si en la entrada aparece el nombre de la persona, usalo en el saludo. Si no, usá un saludo neutro.

REGLAS DE SALIDA:
- Devolvé SOLO el texto del mensaje. Sin comillas, sin asunto, sin notas, sin aclaraciones.
- No inventes datos que no estén en la entrada (links, horarios, montos, mails). Si falta un dato clave, dejá la frase para que se complete fácil o pedí esa info.`;

  // Priorizar ejemplos del mismo canal/persona, luego el resto
  const relevant = BASELINE_EXAMPLES.filter((e) => e.persona === persona && e.channel === channel);
  const others = BASELINE_EXAMPLES.filter((e) => !(e.persona === persona && e.channel === channel));
  const ordered = [...relevant, ...others];

  prompt += `\n\nEJEMPLOS REALES DEL EQUIPO (entrada → mensaje enviado):`;
  ordered.forEach((ex, i) => {
    prompt += `\n\n--- Ejemplo ${i + 1} [${ex.persona} · ${ex.channel}] ---\nEntrada: ${ex.input}\nMensaje:\n${ex.reply}`;
  });

  if (learnedExamples && learnedExamples.length > 0) {
    prompt += `\n\nEJEMPLOS QUE APRENDIÓ DE TUS CORRECCIONES (priorizá este estilo):`;
    learnedExamples.forEach((ex, i) => {
      prompt += `\n\n--- Aprendido ${i + 1} ---\nEntrada: ${ex.input}\nMensaje:\n${ex.reply}`;
    });
  }

  return prompt;
}

async function generateWithClaude(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    temperature: 0.7,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  });
  const content = res.content[0];
  if (content.type === 'text') {
    return content.text.trim();
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const claudeKey = process.env.ANTHROPIC_API_KEY;

    if (!claudeKey) {
      return NextResponse.json(
        { error: 'No hay clave de Anthropic configurada en el servidor' },
        { status: 500 }
      );
    }

    const { input, persona, channel, learnedExamples } = parsed.data;
    const systemPrompt = buildSystemPrompt(persona, channel, learnedExamples);
    const userPrompt = `Entrada:\n${input}\n\nEscribí el mensaje completo.`;

    const reply = await generateWithClaude(claudeKey, systemPrompt, userPrompt);

    if (!reply) {
      return NextResponse.json({ error: 'El modelo no devolvió respuesta' }, { status: 502 });
    }

    return NextResponse.json({ success: true, reply, provider: 'claude' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: `Error generando respuesta: ${message}` }, { status: 500 });
  }
}
