import { createClient } from "@supabase/supabase-js";

// ── CONFIGURACION ──────────────────────────────────────────────────────
const SUPABASE_URL      = "https://tlxkghpytznkxgqslqzj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KGJ75gHqy1gnVLpuf-7SyQ_IuByH1G8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── AUTH SEGURO (Edge Function auth-bridge) ────────────────────────────
// El login ya no valida el PIN en el cliente (era sha256 reversible y con
// las políticas abiertas cualquiera bajaba la base). Ahora el PIN se valida
// server-side (bcrypt + rate-limit) en la Edge Function `auth-bridge`, que
// devuelve un token con el que el cliente abre una sesión real de Supabase
// Auth — necesaria para que la RLS por-alumno funcione.
const AUTH_BRIDGE_URL = `${SUPABASE_URL}/functions/v1/auth-bridge`;

async function establecerSesion(codigo, pin, tipo) {
  const r = await fetch(AUTH_BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ action: "login", codigo: String(codigo).trim(), pin, tipo }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.token_hash) {
    throw new Error(data.error || (tipo === "admin" ? "Código admin o PIN inválido" : "Código o PIN inválido"));
  }
  const { error } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "email" });
  if (error) throw new Error("No se pudo iniciar sesión: " + error.message);
}

// Crea (si falta) el usuario de Auth del alumno y le setea el PIN salado.
// Operación de admin — manda el token de sesión del admin logueado.
async function provisionAlumno(alumnoId, pin) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || SUPABASE_ANON_KEY;
  const r = await fetch(AUTH_BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "provision", alumnoId, pin }),
  });
  if (!r.ok) { const d = await r.json().catch(() => ({})); ERR("provisionAlumno", d.error || "provision falló", d); }
}

// Crea (si falta) el usuario de Auth de un ADMIN + PIN salado. Sin esto, un
// admin nuevo no puede loguearse (el login busca el usuario de Auth por user_id).
async function provisionAdmin(adminId, pin) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || SUPABASE_ANON_KEY;
  const r = await fetch(AUTH_BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "provision", id: adminId, pin, tipo: "admin" }),
  });
  if (!r.ok) { const d = await r.json().catch(() => ({})); ERR("provisionAdmin", d.error || "provision admin falló", d); }
}

export async function desactivarAdmin(id, activo) {
  const { data, error } = await supabase.rpc("desactivar_admin_rpc", { p_id: id, p_activo: activo });
  if (error) { ERR("desactivarAdmin", error.message, error); throw new Error(error.message); }
  return data;
}

export async function cerrarSesionAuth() {
  try { await supabase.auth.signOut(); } catch (e) { ERR("cerrarSesionAuth", "signOut falló", e); }
}

// ── LOGGING ────────────────────────────────────────────────────────────
const LOG = (fn, msg, data) =>
  console.log(`%c[SUPABASE:${fn}]`, "color:#6ee7b7;font-weight:bold", msg, data ?? "");

// ERR muestra TODOS los campos que devuelve Supabase para no perder nada
const ERR = (fn, msg, err) => {
  console.group(`%c[SUPABASE:${fn}] ❌ ${msg}`, "color:#f87171;font-weight:bold");
  console.error("message :", err?.message  ?? err);
  console.error("code    :", err?.code);
  console.error("hint    :", err?.hint);
  console.error("details :", err?.details);
  console.error("status  :", err?.status);
  console.error("objeto  :", err);
  console.groupEnd();
};

// ── UTILIDAD: UUID ────────────────────────────────────────────────────
const makeUuid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){const r=Math.random()*16|0;const v=c==='x'?r:(r&0x3|0x8);return v.toString(16);});
const isUuid  = id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id||''));

// ── UTILIDAD: LIMPIAR PAYLOAD ─────────────────────────────────────────
// Elimina cualquier clave con valor undefined antes de enviar a Supabase.
// Evita errores "column X does not exist" cuando mandamos campos que la DB
// todavía no tiene o que el objeto de origen no trajo.
// Mantiene: null, "", 0, [], {} — solo saca undefined.
function limpiarPayload(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

// ── TEST DE CONEXION (corre al importar el módulo) ─────────────────────
// Buscá "[SUPABASE:init]" en consola al arrancar la app.
(async () => {
  console.log("%c[SUPABASE:init] 🔌 Probando conexión a Supabase...", "color:#fbbf24;font-weight:bold");
  try {
    const { data, error } = await supabase.from("alumnos").select("id").limit(1);
    if (error) {
      ERR("init", "Falló la prueba de conexión. Verificá URL, ANON KEY y que la tabla 'alumnos' exista.", error);
    } else {
      console.log(
        "%c[SUPABASE:init] ✅ Conexión OK. Tabla 'alumnos' accesible.",
        "color:#6ee7b7;font-weight:bold",
        `(${data?.length ?? 0} fila/s de prueba)`
      );
    }
  } catch (e) {
    ERR("init", "Error de red al conectar con Supabase", e);
  }
})();

// ──────────────────────────────────────────────────────────────────────
// SCHEMA SQL  →  Supabase Dashboard → SQL Editor
// ──────────────────────────────────────────────────────────────────────
//
// create table if not exists alumnos (
//   id                 text        primary key,
//   nombre             text        not null,
//   username           text,
//   codigo             text,
//   peso               text,
//   altura             text,
//   edad               text,
//   foto               text        default '',
//   horarios           jsonb       default '[]',
//   bioimpedancia      jsonb       default '[]',
//   rm                 jsonb       default '{}',
//   asistencia         jsonb       default '[]',
//   diario             jsonb       default '[]',
//   plan_movilidad     jsonb       default '[]',
//   plan_calor         jsonb       default '[]',
//   plan_activacion    jsonb       default '[]',
//   plan_periodizacion jsonb       default '[]',
//   created_at         timestamptz default now()
// );
//
// create table if not exists plan_dias (
//   id         uuid  primary key default gen_random_uuid(),
//   alumno_id  text  references alumnos(id) on delete cascade,
//   dia        text,
//   subtitulo  text,
//   orden      int   default 0
// );
//
// create table if not exists plan_ejercicios (
//   id           text  primary key,
//   plan_dia_id  uuid  references plan_dias(id) on delete cascade,
//   nombre       text,
//   descripcion  text  default '',
//   video        text  default '',
//   media_local  text  default '',
//   orden        int   default 0
// );
//
// create table if not exists historial_pesos (
//   id            uuid      primary key default gen_random_uuid(),
//   alumno_id     text      references alumnos(id) on delete cascade,
//   ejercicio_id  text      not null,
//   peso          numeric   not null,
//   serie         int       default 1,
//   fecha         date      default current_date,
//   created_at    timestamptz default now()
// );
//
// -- Si tenés RLS activado, agregá estas políticas para desarrollo:
// alter table alumnos         enable row level security;
// alter table plan_dias       enable row level security;
// alter table plan_ejercicios enable row level security;
// alter table historial_pesos enable row level security;
// create policy "allow all" on alumnos         for all using (true) with check (true);
// create policy "allow all" on plan_dias       for all using (true) with check (true);
// create policy "allow all" on plan_ejercicios for all using (true) with check (true);
// create policy "allow all" on historial_pesos for all using (true) with check (true);
// ──────────────────────────────────────────────────────────────────────

// Internos compartidos por los módulos de services/supabase/ (no salen por el barrel).
export { SUPABASE_URL, SUPABASE_ANON_KEY, establecerSesion, provisionAlumno, provisionAdmin, LOG, ERR, makeUuid, isUuid, limpiarPayload };
