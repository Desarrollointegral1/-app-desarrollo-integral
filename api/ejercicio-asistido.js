// ============================================================
// SERVERLESS ejercicio-asistido — armador de ejercicios con ayuda del modelo
// ============================================================
// Muchos planes son personalizados: se arranca de una plantilla pero se cambian
// ejercicios, o directamente hay que cargar uno que no está en el catálogo.
// Este endpoint acompaña ese momento: mientras el profe escribe el nombre le
// sugiere candidatos (primero los 1343 del catálogo auditado, recién después
// nombres nuevos), le redacta la descripción en el mismo tono rioplatense con
// el que se reescribió el catálogo, y le arma el prompt de la ilustración.
//
// Seguridad: copiado tal cual de api/scan-corporal.js. Ese endpoint estuvo
// ABIERTO y cualquiera con la URL podía gastar la cuenta de Anthropic de Lucas
// (hallazgo crítico del 2026-08-07). Acá se valida la sesión ANTES de tocar el
// modelo, y se rechaza el anon key explícitamente porque también es un JWT que
// /auth/v1/user acepta.
import Anthropic from "@anthropic-ai/sdk";
import { buscarEnCatalogo, ordenarSugerencias, normalizarGrupo, GRUPOS_DI } from "../src/utils/ejercicioAsistido.js";
import { pasosDeInstrucciones } from "../src/utils/pasosInstrucciones.js";

const MODEL = "claude-sonnet-5";

// Topes de entrada. Nadie escribe el nombre de un ejercicio en 300 caracteres:
// lo único que se consigue con un texto gigante es inflar la factura de tokens.
const MAX_TEXTO = 80;
const MAX_NOMBRE = 140;
const MAX_PROMPT_IMAGEN = 1200;

const MAX_SUGERENCIAS = 6;
// Debajo de esto el catálogo no alcanza y se le pide nombres nuevos al modelo.
const MINIMO_CATALOGO = 3;

// Ejemplos reales de catalogo_ejercicios (editado = true). El tono no se
// describe con adjetivos: se le muestran dos instrucciones ya aprobadas y el
// modelo copia la estructura posición → ejecución → pausa → retorno → repetí.
const EJEMPLOS_TONO = [
  "Enganchá la barra recta en la polea baja y pará frente a la máquina con los pies al ancho de los hombros. Agarrá la barra con las palmas hacia arriba y las manos juntas en el centro, bien por dentro del ancho de los hombros. Mantené los codos pegados al torso y quietos. Subí la barra hacia los hombros contrayendo los bíceps, sin abrir los codos. Hacé una pausa breve arriba. Bajá lentamente hasta extender los brazos por completo, manteniendo la tensión del cable. Repetí el número de repeticiones deseado.",
  "Sentate en un banco y apoyá el antebrazo sobre el muslo con la palma mirando hacia adentro y el pulgar hacia arriba, dejando la muñeca por fuera de la rodilla. Sostené la mancuerna con esa mano y el otro brazo apoyado para estabilizar. Con el antebrazo quieto, dejá caer la muñeca hacia abajo y después subila al máximo manteniendo el pulgar arriba, sin rotar el antebrazo. Hacé una pausa breve arriba. Bajá lento hasta la posición inicial. Repetí el número de repeticiones deseado y después cambiá de mano.",
];

// Formato de imagen pedido expresamente por Lucas: dos figuras del MISMO cuerpo,
// partida y fase media, lado a lado. Si el implemento no se dibuja de forma
// inconfundible el ejercicio no se entiende (un disco de canto con su agujero,
// una mancuerna de perfil con sus dos cabezas).
const REGLAS_IMAGEN =
  "Ilustración anatómica de estudio con DOS figuras del mismo cuerpo en la misma imagen, lado a lado: " +
  "a la izquierda la posición de partida, a la derecha la fase media del movimiento. " +
  "Fondo blanco puro. Músculo principal en rojo saturado, músculos secundarios en rojo apagado. " +
  "Sin texto, sin flechas, sin números, sin logos, sin marcas de agua. " +
  "El implemento tiene que ser inconfundible: un disco se dibuja de canto mostrando su agujero, " +
  "una mancuerna de perfil con sus dos cabezas, una barra recta con los discos visibles.";

function extraerJson(texto) {
  const match = String(texto || "").match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

/** Confirma que quien llama tiene una sesión válida de Supabase. Fail-closed. */
async function sesionValida(req) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return { ok: false, motivo: "El servidor no tiene configurado Supabase." };

  const auth = req.headers?.authorization || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return { ok: false, motivo: "Necesitás iniciar sesión para usar el armador." };
  // El anon key es un JWT que Supabase acepta en /auth/v1/user: sin este corte
  // cualquiera lo copia del frontend y entra gratis.
  if (token === anon) return { ok: false, motivo: "Necesitás iniciar sesión para usar el armador." };

  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anon },
    });
    if (!r.ok) return { ok: false, motivo: "Tu sesión venció. Volvé a entrar y probá de nuevo." };
    const u = await r.json();
    if (!u?.id) return { ok: false, motivo: "Tu sesión venció. Volvé a entrar y probá de nuevo." };
    return { ok: true, usuario: u.id, url, anon, token };
  } catch {
    return { ok: false, motivo: "No se pudo validar la sesión contra Supabase." };
  }
}

// Cache del catálogo por instancia de la función. El filtrado se hace en JS y no
// con `ilike` de PostgREST a propósito: ilike es sensible a las tildes, así que
// "bulgara" nunca encontraría "búlgara" — que es exactamente lo que el profe
// escribe. Son ~1343 nombres, se traen una vez cada 10 minutos por instancia.
let cacheCatalogo = null;
let cacheVence = 0;
const CACHE_MS = 10 * 60 * 1000;

async function cargarCatalogo({ url, anon, token }) {
  if (cacheCatalogo && Date.now() < cacheVence) return cacheCatalogo;
  const r = await fetch(
    `${url}/rest/v1/catalogo_ejercicios?select=id,nombre_es,nombre_en,gif_url,image&limit=3000`,
    { headers: { Authorization: `Bearer ${token}`, apikey: anon } }
  );
  if (!r.ok) throw new Error("No se pudo leer el catálogo de ejercicios.");
  cacheCatalogo = await r.json();
  cacheVence = Date.now() + CACHE_MS;
  return cacheCatalogo;
}

async function pedirleAlModelo(apiKey, prompt, maxTokens) {
  const anthropic = new Anthropic({ apiKey });
  const mensaje = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
  });
  return mensaje.content.find((c) => c.type === "text")?.text || "";
}

// ── acción: sugerir ─────────────────────────────────────────────
async function accionSugerir({ req, res, sesion, apiKey }) {
  const texto = String(req.body?.texto || "").trim();
  if (!texto) {
    res.status(400).json({ error: "Falta el texto a completar." });
    return;
  }
  if (texto.length > MAX_TEXTO) {
    res.status(413).json({ error: `El nombre no puede tener más de ${MAX_TEXTO} caracteres.` });
    return;
  }

  let delCatalogo = [];
  try {
    delCatalogo = buscarEnCatalogo(await cargarCatalogo(sesion), texto, MAX_SUGERENCIAS);
  } catch (e) {
    res.status(502).json({ error: e?.message || "No se pudo leer el catálogo." });
    return;
  }

  // Si el catálogo ya responde, no se gasta una llamada al modelo.
  if (delCatalogo.length >= MINIMO_CATALOGO) {
    res.status(200).json({ sugerencias: ordenarSugerencias(delCatalogo, [], MAX_SUGERENCIAS) });
    return;
  }

  const faltan = MAX_SUGERENCIAS - delCatalogo.length;
  const prompt =
    `Un profesor de gimnasio está escribiendo el nombre de un ejercicio en el buscador de su app y ` +
    `escribió hasta ahora: "${texto}".\n` +
    `Proponé ${faltan} nombres de ejercicios REALES de gimnasio que empiecen o coincidan con eso, en ` +
    `castellano rioplatense, con la tilde correcta. El nombre incluye el implemento cuando corresponde ` +
    `("Sentadilla búlgara con mancuernas", "Remo con barra"). No repitas estos, que ya están en el ` +
    `catálogo: ${delCatalogo.map((s) => s.nombre).join(" | ") || "(ninguno)"}.\n` +
    `Respondé ÚNICAMENTE con JSON, sin markdown: {"nombres": ["...", "..."]}`;

  let nuevos = [];
  try {
    const json = extraerJson(await pedirleAlModelo(apiKey, prompt, 300));
    nuevos = Array.isArray(json?.nombres) ? json.nombres.filter((n) => typeof n === "string") : [];
  } catch (e) {
    // Que el modelo falle no puede tumbar la búsqueda: lo del catálogo ya sirve.
    nuevos = [];
  }

  res.status(200).json({ sugerencias: ordenarSugerencias(delCatalogo, nuevos, MAX_SUGERENCIAS) });
}

// ── acción: completar ───────────────────────────────────────────
async function accionCompletar({ req, res, apiKey }) {
  const nombre = String(req.body?.nombre || "").trim();
  if (!nombre) {
    res.status(400).json({ error: "Falta el nombre del ejercicio." });
    return;
  }
  if (nombre.length > MAX_NOMBRE) {
    res.status(413).json({ error: `El nombre no puede tener más de ${MAX_NOMBRE} caracteres.` });
    return;
  }

  const prompt =
    `Sos el redactor del catálogo de ejercicios de un gimnasio argentino. Te doy el nombre de un ` +
    `ejercicio y devolvés su ficha.\n\n` +
    `EJERCICIO: "${nombre}"\n\n` +
    `La descripción se escribe en VOSEO rioplatense ("Ponete", "Bajá", "Sostené", "Repetí"), en un solo ` +
    `párrafo corrido de oraciones cortas separadas por punto, siguiendo esta estructura: posición inicial, ` +
    `ejecución, pausa, retorno, y cierra con "Repetí el número de repeticiones deseado.". Nunca uses "tú" ` +
    `ni "usted". Entre 4 y 9 oraciones.\n` +
    `Así están escritas las del catálogo, copiá exactamente ese tono:\n` +
    EJEMPLOS_TONO.map((e, i) => `${i + 1}) ${e}`).join("\n") +
    `\n\ngrupo_di tiene que ser EXACTAMENTE uno de esta lista, sin inventar ninguno: ${GRUPOS_DI.join(", ")}.\n` +
    `target_es es el músculo principal y equipment_es el implemento (por ejemplo "Mancuerna", "Barra", ` +
    `"Polea", "Peso corporal", "Máquina", "Kettlebell", "Banda"), los dos en castellano.\n` +
    `prompt_imagen es la descripción visual para generar la ilustración: empezá describiendo la persona y ` +
    `el movimiento concreto de ESTE ejercicio (postura, ángulos, qué músculo se marca) y respetá estas ` +
    `reglas fijas: ${REGLAS_IMAGEN}\n\n` +
    `Respondé ÚNICAMENTE con JSON, sin markdown, con esta forma exacta:\n` +
    `{"nombre": "...", "descripcion": "...", "grupo_di": "...", "target_es": "...", "equipment_es": "...", "prompt_imagen": "..."}`;

  let ficha;
  try {
    ficha = extraerJson(await pedirleAlModelo(apiKey, prompt, 1200));
  } catch (e) {
    res.status(502).json({ error: "Error consultando el modelo: " + (e?.message || "desconocido") });
    return;
  }

  const descripcion = String(ficha?.descripcion || "").trim();
  const grupo = normalizarGrupo(ficha?.grupo_di);
  // La descripción tiene que poder renderizarse como pasos numerados en la app
  // (src/utils/pasosInstrucciones.js). Si no se parte en pasos, el modelo
  // escribió un bloque que no sigue el formato del catálogo: no se guarda.
  if (!descripcion || !grupo || !pasosDeInstrucciones(descripcion)) {
    res.status(422).json({ error: "El modelo no devolvió una ficha usable. Probá de nuevo o escribí el nombre más completo." });
    return;
  }

  res.status(200).json({
    nombre: String(ficha.nombre || nombre).trim(),
    descripcion,
    grupo_di: grupo,
    target_es: String(ficha.target_es || "").trim(),
    equipment_es: String(ficha.equipment_es || "").trim(),
    prompt_imagen: String(ficha.prompt_imagen || "").trim().slice(0, MAX_PROMPT_IMAGEN),
  });
}

// ── acción: imagen ──────────────────────────────────────────────
// Genera la ilustración con Gemini (el mismo modelo que usa el script local
// C:\Users\lucas\.claude\scripts\gen-imagen.py) y la sube al bucket público
// catalogo-ejercicios, carpeta ia-generadas/.
const MODELO_IMAGEN = "gemini-3.1-flash-image";
const BUCKET = "catalogo-ejercicios";

async function accionImagen({ req, res, sesion }) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiKey) {
    // Verificado 2026-08-09 con `vercel env ls production`: producción sólo
    // tiene VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY y ANTHROPIC_API_KEY.
    // No se inventa una key ni se cambia de proveedor por cuenta propia.
    res.status(501).json({
      error:
        "Falta la variable de entorno GEMINI_API_KEY (o GOOGLE_API_KEY) en Vercel. " +
        "Cargala en el dashboard del proyecto (Settings → Environment Variables, entorno Production) " +
        "con una key de https://aistudio.google.com/apikey y la generación de imágenes queda operativa.",
      falta: "GEMINI_API_KEY",
    });
    return;
  }

  const promptImagen = String(req.body?.prompt_imagen || "").trim();
  if (!promptImagen) {
    res.status(400).json({ error: "Falta prompt_imagen." });
    return;
  }
  if (promptImagen.length > MAX_PROMPT_IMAGEN) {
    res.status(413).json({ error: `El prompt no puede tener más de ${MAX_PROMPT_IMAGEN} caracteres.` });
    return;
  }

  let base64;
  let mime = "image/png";
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_IMAGEN}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": geminiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptImagen }] }] }),
      }
    );
    if (!r.ok) throw new Error(`Gemini respondió ${r.status}`);
    const json = await r.json();
    const parte = json?.candidates?.[0]?.content?.parts?.find((p) => p?.inlineData?.data);
    base64 = parte?.inlineData?.data;
    mime = parte?.inlineData?.mimeType || mime;
  } catch (e) {
    res.status(502).json({ error: "Error generando la imagen: " + (e?.message || "desconocido") });
    return;
  }
  if (!base64) {
    res.status(422).json({ error: "El modelo no devolvió ninguna imagen. Probá de nuevo." });
    return;
  }

  const ext = mime.includes("jpeg") ? "jpg" : "png";
  const path = `ia-generadas/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  try {
    const bytes = Buffer.from(base64, "base64");
    const up = await fetch(`${sesion.url}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sesion.token}`,
        apikey: sesion.anon,
        "Content-Type": mime,
      },
      body: bytes,
    });
    if (!up.ok) throw new Error(`Storage respondió ${up.status}`);
  } catch (e) {
    res.status(502).json({ error: "La imagen se generó pero no se pudo subir: " + (e?.message || "desconocido") });
    return;
  }

  res.status(200).json({ url: `${sesion.url}/storage/v1/object/public/${BUCKET}/${path}`, path });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  // Chequeo de salud, ANTES de pedir sesión y a propósito. Es la única forma de
  // saber desde afuera si al deploy le falta configurar una clave sin tener que
  // loguearse (así se descubrió que producción no tenía GEMINI_API_KEY). No
  // expone nada: devuelve booleanos, nunca el valor, ni un prefijo, ni el largo
  // de ninguna clave, y no dispara ninguna llamada paga.
  if (String(req.body?.accion || "").trim() === "estado") {
    res.status(200).json({
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      imagen: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      modelo_imagen: MODELO_IMAGEN,
    });
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

  const accion = String(req.body?.accion || "").trim();
  if (accion === "sugerir") return accionSugerir({ req, res, sesion, apiKey });
  if (accion === "completar") return accionCompletar({ req, res, apiKey });
  if (accion === "imagen") return accionImagen({ req, res, sesion });

  res.status(400).json({ error: 'Acción inválida. Usá "sugerir", "completar" o "imagen".' });
}
