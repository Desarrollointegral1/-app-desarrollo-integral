import { supabase, LOG, ERR } from "./cliente.js";

// ──────────────────────────────────────────────────────────────────────
// VIDEO UPLOADS (Supabase Storage)
// ──────────────────────────────────────────────────────────────────────

export async function subirVideo(archivo) {
  LOG("subirVideo", `⏳ Subiendo video ${archivo.name}...`);

  try {
    if (!archivo) throw new Error("No hay archivo");

    const nombreArchivo = `${Date.now()}_${archivo.name.replace(/\s+/g, "_")}`;

    const { data, error: uploadError } = await supabase.storage
      .from("ejercicios-videos")
      .upload(nombreArchivo, archivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || "Error al subir video");
    }

    const { data: urlData } = supabase.storage
      .from("ejercicios-videos")
      .getPublicUrl(nombreArchivo);

    LOG("subirVideo", `✅ Video subido: ${nombreArchivo}`, urlData);
    return urlData.publicUrl;
  } catch (e) {
    ERR("subirVideo", e.message, e);
    throw e;
  }
}

// ══════════════════════════════════════════════════════════════════════
// STORAGE PRIVADO — URLs firmadas (2026-07-24)
// Los buckets bioimpedancia-archivos y rehab-media son PRIVADOS. En la base
// se guarda el PATH del objeto (no una URL pública), y se resuelve una signed
// URL on-demand al mostrar. Las signed URLs expiran, por eso NUNCA se persisten.
// ══════════════════════════════════════════════════════════════════════

export async function getSignedUrl(bucket, path, expirySeconds = 3600) {
  if (!path) return null;
  // Ya renderizable tal cual: URL externa/YouTube (http) o foto embebida (data:).
  if (/^(https?:|data:)/i.test(path)) return path;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expirySeconds);
  if (error) { ERR("getSignedUrl", error.message, error); return null; }
  return data.signedUrl;
}

// ──────────────────────────────────────────────────────────────────────
// MEDIA GRABADA CON EL CELULAR — bucket privado "rehab-media"
//
// El bucket se llama así porque nació con la rehabilitación (migración 010,
// 2026-07-20). Desde el 2026-08-09 la rehabilitación es su propia app
// (rehab/, ver services/rehab.js) y esta función quedó acá porque la usan las
// dos: el video de movilidad del alumno "solo video" y el armador asistido de
// la app de entrenamiento, y la foto/video del ejercicio en Rehab Integral.
// El bucket NO se renombra: renombrarlo invalidaría los paths ya guardados.
// ──────────────────────────────────────────────────────────────────────

const REHAB_BUCKET = "rehab-media";

// Tope real de Storage en este proyecto (verificado el 2026-08-12 subiendo un
// archivo de 60 MB: responde 413 "The object exceeded the maximum allowed
// size"). Se chequea ACÁ antes de mandar nada: si no, el celular sube el video
// entero por datos móviles para que el servidor lo rechace al final, y el
// mensaje que le llega a Lucas está en inglés.
const REHAB_MAX_BYTES = 50 * 1024 * 1024;
// A partir de acá el video es incómodo por datos móviles: el de Ángel pesaba
// 37,5 MB (3:23 a 1,47 Mbps) y en el celular tardaba tanto en abrir que Lucas
// lo dio por roto. No se bloquea — se avisa, con qué hacer.
const REHAB_AVISO_BYTES = 20 * 1024 * 1024;

// 2026-08-13 — QUE EL NAVEGADOR PUEDA REPRODUCIRLO, NO SOLO SUBIRLO.
// Un mp4 grabado con un celular puede venir en H.265/HEVC (o AV1): sube
// perfecto, pesa lo que tiene que pesar, y después Chrome y Firefox no lo
// reproducen — pantalla negra y nadie entiende por qué. En vez de adivinar
// codecs leyendo bytes, se le pregunta al propio navegador: se monta el
// archivo en un <video> y se espera a que saque los metadatos. Si no puede,
// tampoco va a poder el alumno, así que no se sube.
function navegadorPuedeReproducir(archivo) {
  return new Promise((resolve) => {
    if (typeof document === "undefined" || !/^video\//i.test(archivo.type || "")) return resolve(true);
    const v = document.createElement("video");
    const url = URL.createObjectURL(archivo);
    const fin = (ok) => { URL.revokeObjectURL(url); v.removeAttribute("src"); resolve(ok); };
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () => fin(v.videoWidth > 0);
    v.onerror = () => fin(false);
    // Si el navegador se queda pensando, no se traba la subida: se deja pasar.
    setTimeout(() => fin(true), 8000);
    v.src = url;
  });
}

export async function subirMediaRehab(archivo, onAviso) {
  LOG("subirMediaRehab", `⏳ Subiendo ${archivo.name} (${Math.round(archivo.size / 1024)} KB)...`);
  if (archivo.size > REHAB_MAX_BYTES) {
    throw new Error(
      `El video pesa ${Math.round(archivo.size / 1024 / 1024)} MB y el máximo es 50 MB. Grabá uno más corto o mandalo por WhatsApp y subilo desde la compu.`
    );
  }
  if (!(await navegadorPuedeReproducir(archivo))) {
    throw new Error(
      "Este video no se puede reproducir en el navegador (suele pasar con los grabados en HEVC / \"alta eficiencia\"). En el celular, poné Cámara → Formatos → \"Más compatible\" y volvé a grabarlo, o exportalo como MP4 H.264."
    );
  }
  if (archivo.size > REHAB_AVISO_BYTES && onAviso) {
    onAviso(
      `Ojo: pesa ${Math.round(archivo.size / 1024 / 1024)} MB y va a tardar en abrir con datos móviles. Conviene uno más corto o comprimido.`
    );
  }
  // 2026-08-12 — BUG REAL: Lucas subió tres veces el video de Ángel desde el
  // celular y las tres el POST no llegó NUNCA al servidor (en los logs de
  // Supabase quedó el preflight OPTIONS 200 y ningún POST, ni siquiera un
  // error). Eso pasa cuando el navegador no puede leer el archivo al armar el
  // cuerpo del request: en Android el File que devuelve un <input type=file>
  // es un puntero a un archivo del proveedor de contenido (Galería/Fotos), y
  // si ese puntero se suelta o el archivo se toca, el fetch se cae antes de
  // salir a la red — sin request, sin log, sin mensaje entendible.
  // La solución es leer el archivo A MEMORIA acá, en el primer momento, y
  // subir esa copia: a partir de la línea de abajo la subida ya no depende de
  // que el archivo del celular siga estando accesible.
  let datos;
  try {
    datos = new Blob([await archivo.arrayBuffer()], { type: archivo.type || "application/octet-stream" });
  } catch (e) {
    ERR("subirMediaRehab", "No se pudo leer el archivo del dispositivo", e);
    throw new Error("No se pudo leer el video del celular. Volvé a elegirlo (si lo grabaste recién, esperá a que termine de guardarse).");
  }
  const ext = (archivo.name.split(".").pop() || "bin").toLowerCase();
  const key = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(REHAB_BUCKET)
    .upload(key, datos, { cacheControl: "3600", upsert: false, contentType: datos.type });
  if (error) { ERR("subirMediaRehab", error.message, error); throw new Error(error.message || "Error al subir"); }
  LOG("subirMediaRehab", `✅ Subido: ${key}`);
  return key; // path del objeto (bucket privado) — signed URL se resuelve al mostrar
}
