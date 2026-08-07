// ============================================================
// SERVERLESS scan-corporal — Fase 1 de "Scan Corporal"
// ============================================================
// Estima composición corporal a partir de 2 fotos (frontal + lateral) usando
// visión de Claude para medir circunferencias corporales, y la fórmula de la
// Marina de EE.UU. (determinística, NO la calcula la IA) para el %grasa.
//
// PRIVACIDAD: las fotos llegan en el body (base64), se usan una sola vez para
// la llamada a Claude y se descartan al terminar el request — este archivo no
// las escribe a disco ni las sube a ningún storage. Solo el JSON resultado
// (medidas + %grasa + masas) vuelve al cliente para que él decida guardarlo.
//
// Reutiliza ANTHROPIC_API_KEY, la misma variable de entorno que ya usa el
// resto del proyecto para llamar a Claude (ver web/lib/coach/coach.ts,
// web/app/api/coalition/route.ts, etc.).
import Anthropic from "@anthropic-ai/sdk";

// Corregido 2026-08-03: el agente que escribió este archivo copió el ID
// "claude-sonnet-4-6" de web/lib/llm/multi-llm-executor.ts, pero ese modelo no
// existe — la API lo habría rechazado y el scan nunca habría funcionado.
// claude-sonnet-5 es el modelo con visión vigente.
const MODEL = "claude-sonnet-5";

function log10(n) {
  return Math.log(n) / Math.LN10;
}

// %grasa corporal — fórmula de la Marina de EE.UU. Determinística: la IA solo
// estima las circunferencias en cm, esta función hace la matemática.
function calcularGrasaNavy({ genero, cinturaCm, cuelloCm, caderaCm, alturaCm }) {
  if (genero === "femenino") {
    const suma = cinturaCm + caderaCm - cuelloCm;
    if (suma <= 0) return null;
    return 495 / (1.29579 - 0.35004 * log10(suma) + 0.221 * log10(alturaCm)) - 450;
  }
  const diff = cinturaCm - cuelloCm;
  if (diff <= 0) return null;
  return 495 / (1.0324 - 0.19077 * log10(diff) + 0.15456 * log10(alturaCm)) - 450;
}

function extraerJson(texto) {
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function imagenAContenido(foto) {
  // Acepta data URL completa ("data:image/jpeg;base64,...") o { base64, mime }.
  if (typeof foto === "string") {
    const m = foto.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!m) return null;
    return { media_type: m[1], data: m[2] };
  }
  if (foto && typeof foto === "object" && foto.base64) {
    return { media_type: foto.mime || "image/jpeg", data: foto.base64.replace(/^data:.*;base64,/, "") };
  }
  return null;
}

// Tamaño máximo por foto, ya comprimida por el cliente. Una foto de celular sin comprimir puede
// pasar los 5 MB, y como acá cada imagen se paga en tokens de visión, alguien mandando dos fotos
// enormes multiplica la factura de una sola llamada. El cliente ya comprime a ~1024px; 2 MB deja
// margen de sobra para eso y corta el abuso.
const MAX_BYTES_FOTO = 2 * 1024 * 1024;

/**
 * Confirma que quien llama tiene una sesión válida de Supabase.
 *
 * Este endpoint estaba ABIERTO: cualquiera con la URL podía mandar dos fotos y disparar una
 * llamada a Claude con visión, que se paga con la cuenta de Lucas. Hallazgo crítico de la ronda
 * del 2026-08-07.
 *
 * Se valida contra `/auth/v1/user` de Supabase en vez de decodificar el JWT a mano: es la
 * autoridad real (contempla expiración, revocación y sesiones cerradas) y no necesita ninguna
 * dependencia nueva ni el service_role acá.
 */
async function sesionValida(req) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return { ok: false, motivo: "El servidor no tiene configurado Supabase." };

  const auth = req.headers?.authorization || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  // Fail-closed: sin token no se gasta un centavo.
  if (!token) return { ok: false, motivo: "Necesitás iniciar sesión para usar el scan." };
  // El anon key también es un JWT y Supabase lo acepta en este endpoint: hay que rechazarlo
  // explícitamente, si no cualquiera lo copia del frontend y pasa el control.
  if (token === anon) return { ok: false, motivo: "Necesitás iniciar sesión para usar el scan." };

  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anon },
    });
    if (!r.ok) return { ok: false, motivo: "Tu sesión venció. Volvé a entrar y probá de nuevo." };
    const u = await r.json();
    if (!u?.id) return { ok: false, motivo: "Tu sesión venció. Volvé a entrar y probá de nuevo." };
    return { ok: true, usuario: u.id };
  } catch {
    return { ok: false, motivo: "No se pudo validar la sesión contra Supabase." };
  }
}

/** Peso real de una imagen en base64, sin decodificarla. */
function bytesDeBase64(foto) {
  const s = typeof foto === "string" ? foto : foto?.base64 || "";
  const crudo = s.replace(/^data:.*;base64,/, "");
  return Math.floor(crudo.length * 0.75);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  // Antes que nada: quién sos. Todo lo de abajo cuesta plata.
  const sesion = await sesionValida(req);
  if (!sesion.ok) {
    res.status(401).json({ error: sesion.motivo });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY no configurada en el servidor." });
    return;
  }

  const { fotoFrontal, fotoLateral, peso, altura, genero, edad } = req.body || {};

  if (bytesDeBase64(fotoFrontal) > MAX_BYTES_FOTO || bytesDeBase64(fotoLateral) > MAX_BYTES_FOTO) {
    res.status(413).json({ error: "Las fotos son muy pesadas. Sacalas de nuevo desde la app, que las comprime sola." });
    return;
  }

  const pesoKg = Number(peso);
  const alturaCm = Number(altura);
  const edadAnios = Number(edad);
  const generoNorm = genero === "femenino" ? "femenino" : "masculino";

  if (!pesoKg || pesoKg <= 0 || !alturaCm || alturaCm <= 0 || !edadAnios || edadAnios <= 0) {
    res.status(400).json({ error: "Faltan datos (peso, altura o edad inválidos)." });
    return;
  }

  const frontal = imagenAContenido(fotoFrontal);
  const lateral = imagenAContenido(fotoLateral);
  if (!frontal || !lateral) {
    res.status(400).json({ error: "Faltan las dos fotos (frontal y lateral) en formato válido." });
    return;
  }

  const pideCadera = generoNorm === "femenino";
  const prompt =
    `Sos un asistente que estima medidas antropométricas visibles en fotos, para un cálculo de composición ` +
    `corporal. Te paso dos fotos de la misma persona: FRONTAL y LATERAL, de pie, en ropa ajustada o mínima. ` +
    `Datos conocidos: altura ${alturaCm} cm, peso ${pesoKg} kg, género ${generoNorm}, edad ${edadAnios} años. ` +
    `Usá la altura conocida como referencia de escala para estimar en CENTÍMETROS:\n` +
    `- cuello_cm: circunferencia del cuello\n` +
    `- cintura_cm: circunferencia de cintura (a la altura del ombligo)\n` +
    (pideCadera ? `- cadera_cm: circunferencia de cadera (punto más ancho)\n` : "") +
    `\nEstas son ESTIMACIONES visuales aproximadas, no una medición exacta — dá tu mejor estimación ` +
    `aunque haya incertidumbre. Respondé ÚNICAMENTE con un objeto JSON, sin texto adicional ni markdown, con esta forma ` +
    `exacta: {"cuello_cm": number, "cintura_cm": number${pideCadera ? ', "cadera_cm": number' : ""}}`;

  let respuestaTexto;
  try {
    const anthropic = new Anthropic({ apiKey });
    const mensaje = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "text", text: "Foto frontal:" },
            { type: "image", source: { type: "base64", media_type: frontal.media_type, data: frontal.data } },
            { type: "text", text: "Foto lateral:" },
            { type: "image", source: { type: "base64", media_type: lateral.media_type, data: lateral.data } },
          ],
        },
      ],
    });
    const bloque = mensaje.content.find((c) => c.type === "text");
    respuestaTexto = bloque?.text || "";
  } catch (e) {
    res.status(502).json({ error: "Error consultando el modelo de visión: " + (e?.message || "desconocido") });
    return;
  }
  // A partir de acá las fotos ya no se necesitan más — quedan solo en las
  // variables locales `frontal`/`lateral` de este request, que el runtime
  // descarta al terminar. No se escriben a disco ni se suben a ningún lado.

  const medidas = extraerJson(respuestaTexto);
  const cuelloCm = Number(medidas?.cuello_cm);
  const cinturaCm = Number(medidas?.cintura_cm);
  const caderaCm = pideCadera ? Number(medidas?.cadera_cm) : null;

  if (!cuelloCm || !cinturaCm || (pideCadera && !caderaCm)) {
    res.status(422).json({ error: "No se pudieron estimar las medidas a partir de las fotos. Probá con fotos más claras, de cuerpo entero y buena luz." });
    return;
  }

  const porcentajeGrasa = calcularGrasaNavy({
    genero: generoNorm,
    cinturaCm,
    cuelloCm,
    caderaCm,
    alturaCm,
  });

  if (porcentajeGrasa == null || !isFinite(porcentajeGrasa) || porcentajeGrasa <= 0 || porcentajeGrasa >= 70) {
    res.status(422).json({ error: "Las medidas estimadas dieron un resultado fuera de rango. Probá de nuevo con otras fotos." });
    return;
  }

  const masaMagraKg = pesoKg * (1 - porcentajeGrasa / 100);
  const masaGrasaKg = pesoKg - masaMagraKg;
  const alturaM = alturaCm / 100;
  const imc = pesoKg / (alturaM * alturaM);

  res.status(200).json({
    porcentajeGrasa: Math.round(porcentajeGrasa * 10) / 10,
    masaMagraKg: Math.round(masaMagraKg * 10) / 10,
    masaGrasaKg: Math.round(masaGrasaKg * 10) / 10,
    imc: Math.round(imc * 10) / 10,
    medidasEstimadas: {
      cintura: Math.round(cinturaCm * 10) / 10,
      cuello: Math.round(cuelloCm * 10) / 10,
      cadera: caderaCm != null ? Math.round(caderaCm * 10) / 10 : null,
    },
  });
}
