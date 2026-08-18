import { supabase, LOG, ERR, limpiarPayload } from "./cliente.js";

// ══════════════════════════════════════════════════════════════════════
// BIOIMPEDANCIA (archivos)
// ══════════════════════════════════════════════════════════════════════

const BIO_BUCKET = "bioimpedancia-archivos";

// Redimensiona una imagen a máx. 900px de lado y la devuelve como data URL
// JPEG (~100-200KB). Fallback para cuando Storage no está habilitado.
async function _fotoADataUrl(file, maxLado = 900, calidad = 0.8) {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", calidad);
}

async function _ensureBioBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets && buckets.find(b => b.name === BIO_BUCKET)) return;
  await supabase.storage.createBucket(BIO_BUCKET, { public: false });
}

export async function cargarBioimpedancia(alumno_id) {
  const { data, error } = await supabase
    .from("bioimpedancia")
    .select("id, alumno_id, fecha, archivo_url, nombre_archivo, created_at")
    .eq("alumno_id", alumno_id)
    .order("fecha", { ascending: false });
  if (error) { ERR("cargarBioimpedancia", error.message, error); return []; }
  return data || [];
}

export async function guardarBioimpedancia(alumno_id, datos) {
  // datos: { fecha, archivo (File object) }
  let archivo_url = null;
  let nombre_archivo = null;

  if (datos.archivo) {
    await _ensureBioBucket();
    const ext = datos.archivo.name.split(".").pop();
    const key = `${alumno_id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BIO_BUCKET)
      .upload(key, datos.archivo, { cacheControl: "3600", upsert: false });
    if (upErr) { ERR("guardarBioimpedancia/upload", upErr.message, upErr); throw upErr; }
    archivo_url = key; // path del objeto (bucket privado) — signed URL se resuelve al mostrar
    nombre_archivo = datos.archivo.name;
  }

  const row = { alumno_id, fecha: datos.fecha || new Date().toISOString().split("T")[0], archivo_url, nombre_archivo };
  const { data, error } = await supabase.from("bioimpedancia").insert([row]).select().single();
  if (error) { ERR("guardarBioimpedancia", error.message, error); throw error; }
  return data;
}

export async function eliminarBioimpedancia(id, archivo_url) {
  // Eliminar archivo de storage si existe. archivo_url ahora guarda el PATH
  // directo; se contempla el formato viejo (URL pública) y se saltean las
  // fotos embebidas (data:), que no tienen objeto en storage.
  if (archivo_url && !/^data:/i.test(archivo_url)) {
    try {
      const path = archivo_url.includes(`/${BIO_BUCKET}/`)
        ? archivo_url.split(`/${BIO_BUCKET}/`)[1].split("?")[0]
        : archivo_url;
      if (path) await supabase.storage.from(BIO_BUCKET).remove([path]);
    } catch (e) { /* no bloquear si falla el storage */ }
  }
  const { error } = await supabase.from("bioimpedancia").delete().eq("id", id);
  if (error) { ERR("eliminarBioimpedancia", error.message, error); throw error; }
}

// ────────────────────────────────────────────────────────────────────────
// BIOIMPEDANCIA: Guardar medición completa
// ────────────────────────────────────────────────────────────────────────

export async function saveBioimpedanciaCompleta(alumno_id, datos, foto = null) {
  // datos: { fecha, hora, peso, grasa_corporal, masa_muscular, grasa_visceral,
  //          imc, altura, edad, conclusion, objetivo, tipo }
  // foto: File opcional — se sube al bucket y queda linkeada al registro.
  // conclusion/objetivo van en la columna jsonb `metadata` (no requieren migración).
  // 2026-07-30: datos.tipo es opcional — "estudio_anterior" marca un registro
  // que es solo la foto de un estudio externo con su fecha, sin medición
  // numérica propia (pedido de Lucas). No agrega columna: es un valor más
  // dentro del mismo `metadata` jsonb que ya usan conclusion/objetivo.

  let archivo_url = null;
  let nombre_archivo = null;
  if (foto) {
    try {
      await _ensureBioBucket();
      const ext = (foto.name.split(".").pop() || "jpg").toLowerCase();
      const key = `${alumno_id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BIO_BUCKET)
        .upload(key, foto, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      archivo_url = key; // path del objeto (bucket privado) — signed URL al mostrar
      nombre_archivo = foto.name;
    } catch (e) {
      // Storage puede estar bloqueado por RLS (ver migrations/006). Mientras
      // tanto la foto se guarda embebida en el registro, redimensionada para
      // que no pese: mismo patrón que ya usa la foto de perfil del alumno.
      LOG("saveBioimpedanciaCompleta", "⚠️ Storage bloqueado, guardando foto embebida.", e?.message);
      archivo_url = await _fotoADataUrl(foto);
      nombre_archivo = foto.name;
    }
  }

  const metadata = {};
  if (datos.conclusion) metadata.conclusion = datos.conclusion;
  if (datos.objetivo) metadata.objetivo = datos.objetivo;
  // Requerimiento energético estimado (bloque 7 del protocolo). Viene ya
  // calculado y validado por src/utils/energia.js, o viene null si el bloque
  // estaba incompleto — en ese caso no se guarda nada, ni parcial ni NaN.
  if (datos.requerimiento) metadata.requerimiento = datos.requerimiento;
  if (datos.tipo) metadata.tipo = datos.tipo;
  // Scan corporal (2 fotos + IA): mismo patrón que el resto de metadata,
  // solo se guardan si vienen — no agregan columnas nuevas a la tabla.
  if (datos.medidas_estimadas) metadata.medidas_estimadas = datos.medidas_estimadas;
  if (datos.masa_magra_kg != null && datos.masa_magra_kg !== "") metadata.masa_magra_kg = Number(datos.masa_magra_kg);
  if (datos.masa_grasa_kg != null && datos.masa_grasa_kg !== "") metadata.masa_grasa_kg = Number(datos.masa_grasa_kg);

  const payload = limpiarPayload({
    alumno_id,
    fecha: datos.fecha || new Date().toISOString().split("T")[0],
    hora: datos.hora,
    peso: datos.peso ? Number(datos.peso) : null,
    grasa_corporal: datos.grasa_corporal ? Number(datos.grasa_corporal) : null,
    masa_muscular: datos.masa_muscular ? Number(datos.masa_muscular) : null,
    grasa_visceral: datos.grasa_visceral ? Number(datos.grasa_visceral) : null,
    imc: datos.imc ? Number(datos.imc) : null,
    altura: datos.altura ? Number(datos.altura) : null,
    edad: datos.edad ? Number(datos.edad) : null,
    archivo_url,
    nombre_archivo,
    metadata: Object.keys(metadata).length ? metadata : undefined,
  });

  LOG("saveBioimpedanciaCompleta", `⏳ Guardando bioimpedancia para ${alumno_id}...`, payload);

  const { data, error } = await supabase
    .from("bioimpedancia")
    .insert([payload])
    .select()
    .single();

  if (error) {
    ERR("saveBioimpedanciaCompleta", "Error guardando bioimpedancia", error);
    throw error;
  }

  LOG("saveBioimpedanciaCompleta", `✅ Bioimpedancia guardada`, data);
  return data;
}

// ────────────────────────────────────────────────────────────────────────
// BIOIMPEDANCIA: Modificar un registro ya guardado
// ────────────────────────────────────────────────────────────────────────
// 2026-07-30, pedido de Lucas: "hoy solo me deja eliminar o generar flyer,
// falta poder modificar lo que grabé". UPDATE en vez de INSERT sobre el
// mismo id. `foto` es opcional: si no se pasa una nueva, se conserva el
// archivo_url que ya tenía el registro (no se pierde la foto por editar un
// número). `quitarFoto` permite sacarla explícitamente sin subir otra.
export async function actualizarBioimpedancia(id, datos, foto = null, quitarFoto = false) {
  let archivo_url = datos.archivo_url_actual ?? null;
  let nombre_archivo = datos.nombre_archivo_actual ?? null;

  if (quitarFoto) {
    archivo_url = null;
    nombre_archivo = null;
  } else if (foto) {
    try {
      await _ensureBioBucket();
      const ext = (foto.name.split(".").pop() || "jpg").toLowerCase();
      const key = `${datos.alumno_id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BIO_BUCKET)
        .upload(key, foto, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      archivo_url = key;
      nombre_archivo = foto.name;
    } catch (e) {
      LOG("actualizarBioimpedancia", "⚠️ Storage bloqueado, guardando foto embebida.", e?.message);
      archivo_url = await _fotoADataUrl(foto);
      nombre_archivo = foto.name;
    }
  }

  const metadata = {};
  if (datos.conclusion) metadata.conclusion = datos.conclusion;
  if (datos.objetivo) metadata.objetivo = datos.objetivo;
  if (datos.requerimiento) metadata.requerimiento = datos.requerimiento;
  if (datos.tipo) metadata.tipo = datos.tipo;
  if (datos.medidas_estimadas) metadata.medidas_estimadas = datos.medidas_estimadas;
  if (datos.masa_magra_kg != null && datos.masa_magra_kg !== "") metadata.masa_magra_kg = Number(datos.masa_magra_kg);
  if (datos.masa_grasa_kg != null && datos.masa_grasa_kg !== "") metadata.masa_grasa_kg = Number(datos.masa_grasa_kg);

  const payload = limpiarPayload({
    fecha: datos.fecha,
    hora: datos.hora,
    peso: datos.peso ? Number(datos.peso) : null,
    grasa_corporal: datos.grasa_corporal ? Number(datos.grasa_corporal) : null,
    masa_muscular: datos.masa_muscular ? Number(datos.masa_muscular) : null,
    grasa_visceral: datos.grasa_visceral ? Number(datos.grasa_visceral) : null,
    imc: datos.imc ? Number(datos.imc) : null,
    altura: datos.altura ? Number(datos.altura) : null,
    edad: datos.edad ? Number(datos.edad) : null,
    archivo_url,
    nombre_archivo,
    metadata: Object.keys(metadata).length ? metadata : null,
  });

  const { data, error } = await supabase
    .from("bioimpedancia")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    ERR("actualizarBioimpedancia", "Error actualizando bioimpedancia", error);
    throw error;
  }

  LOG("actualizarBioimpedancia", `✅ Bioimpedancia ${id} actualizada`, data);
  return data;
}

// ────────────────────────────────────────────────────────────────────────
// BIOIMPEDANCIA: Cargar historial completo
// ────────────────────────────────────────────────────────────────────────

export async function cargarBioimpedanciaCompleta(alumno_id, limit = 50) {
  const { data, error } = await supabase
    .from("bioimpedancia")
    .select("*")
    .eq("alumno_id", alumno_id)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false })
    .limit(limit);

  if (error) {
    ERR("cargarBioimpedanciaCompleta", "Error cargando bioimpedancia", error);
    return [];
  }

  return data || [];
}
