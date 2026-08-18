import { supabase, LOG, ERR, establecerSesion, cerrarSesionAuth, provisionAlumno, provisionAdmin } from "./cliente.js";
import { COLS_ALUMNO_SIN_FOTO } from "./alumnos.js";

// ──────────────────────────────────────────────────────────────────────
// AUTENTICACION: CODIGO + PIN
// ──────────────────────────────────────────────────────────────────────

async function hashearPIN(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function cambiarPINAlumno(alumno_id, nuevoPIN) {
  LOG("cambiarPINAlumno", `⏳ Cambiando PIN de ${alumno_id}...`);
  try {
    const pin_hash = await hashearPIN(nuevoPIN);
    const { error } = await supabase.from("alumnos").update({ pin_hash }).eq("id", alumno_id);
    if (error) { ERR("cambiarPINAlumno", "No se pudo cambiar el PIN", error); return false; }
    await provisionAlumno(alumno_id, nuevoPIN); // PIN salado (bcrypt) + usuario de Auth
    LOG("cambiarPINAlumno", `✅ PIN actualizado.`);
    return true;
  } catch (e) {
    ERR("cambiarPINAlumno", "Error al hashear PIN", e);
    return false;
  }
}

export async function loginConCodigo(codigo, pin) {
  LOG("loginConCodigo", `⏳ Validando alumno ${codigo}...`);

  try {
    // ilike compara sin distinguir mayúsculas/minúsculas — así "Juan",
    // "juan" y "JUAN" matchean igual sin importar cómo haya quedado
    // guardado el username en la base.
    // Sin "foto": puede pesar megas en base64 y el login no la necesita
    // (la app la hidrata aparte con cargarFotos()).
    // PIN validado server-side + sesión de Auth abierta acá (reemplaza el
    // chequeo sha256 del cliente).
    await establecerSesion(codigo, pin, "alumno");

    const { data: alumno, error } = await supabase
      .from("alumnos")
      .select(COLS_ALUMNO_SIN_FOTO + ", archivado")
      .ilike("codigo", codigo.trim())
      .single();

    if (error || !alumno) {
      throw new Error("No se pudo cargar el alumno");
    }
    // 2026-08-04: un alumno archivado (ver migración 030) no puede loguearse
    // aunque el PIN sea correcto — la RPC de sesión no distingue esto, así
    // que se corta acá, del lado del cliente, apenas se conoce el estado.
    if (alumno.archivado) {
      await cerrarSesionAuth();
      throw new Error("Este usuario ya no está activo");
    }

    LOG("loginConCodigo", `✅ Login exitoso para ${alumno.nombre}`);
    return alumno;
  } catch (e) {
    ERR("loginConCodigo", e.message, e);
    throw e;
  }
}

export async function loginAdmin(codigo, pin) {
  LOG("loginAdmin", `⏳ Validando admin ${codigo}...`);

  try {
    // Valida PIN admin server-side + abre sesión de Auth con rol admin.
    await establecerSesion(codigo, pin, "admin");
    const pinHash = await hashearPIN(pin);

    // La tabla admins ya no se lee directo (services/supabase.js no expone
    // pin_hash al cliente ni permite select("*") anónimo) — el chequeo del
    // PIN corre server-side en login_admin_rpc (migrations/004), que
    // devuelve el admin sin el pin_hash.
    const { data: admin, error } = await supabase.rpc("login_admin_rpc", {
      p_codigo: codigo.toUpperCase(),
      p_pin_hash: pinHash,
    });

    if (error || !admin) {
      throw new Error(error?.message || "Código admin inválido");
    }

    LOG("loginAdmin", `✅ Login admin exitoso para ${admin.nombre}`);
    return admin;
  } catch (e) {
    ERR("loginAdmin", e.message, e);
    throw e;
  }
}

export async function crearAlumnoConPIN(nombre, codigo, pin, altura, peso, fechaNacimiento, tipo, email, modalidad) {
  LOG("crearAlumnoConPIN", `⏳ Creando alumno ${codigo}...`);

  try {
    // Un código repetido rompía el login (dos filas → .single() falla y el
    // alumno ve "código/PIN inválido", caso Franco 2026-07-20). La base
    // ahora tiene índice único sobre upper(codigo); acá avisamos claro.
    const { data: yaExiste } = await supabase
      .from("alumnos")
      .select("id")
      .ilike("codigo", codigo.trim())
      .limit(1);
    if (yaExiste && yaExiste.length > 0) {
      throw new Error(`El código "${codigo.trim().toUpperCase()}" ya está en uso por otro alumno`);
    }

    let nuevoAlumno = {
      nombre,
      codigo: codigo.toUpperCase(),
      altura: parseInt(altura) || 0,
      peso: parseFloat(peso) || 0,
      tipo: tipo || "entrenamiento",
    };
    if (fechaNacimiento) nuevoAlumno.fecha_nacimiento = fechaNacimiento;
    if (email) nuevoAlumno.email = email;
    if (modalidad) nuevoAlumno.modalidad = modalidad;

    try {
      const pinHash = await hashearPIN(pin);
      nuevoAlumno.pin_hash = pinHash;
    } catch (e) {
      LOG("crearAlumnoConPIN", "⚠️ pin_hash no soportado, creando sin PIN");
    }

    let { data, error } = await supabase
      .from("alumnos")
      .insert([nuevoAlumno])
      .select();

    // Si la columna "email" todavía no existe en Supabase (falta correr la
    // migración 008), reintenta sin ese campo para no romper el alta.
    if (error && nuevoAlumno.email && /(column .*email.* does not exist|find the 'email' column)/i.test(error.message || "")) {
      LOG("crearAlumnoConPIN", "⚠️ Columna 'email' no existe todavía (falta migración 008), creando sin email");
      delete nuevoAlumno.email;
      ({ data, error } = await supabase.from("alumnos").insert([nuevoAlumno]).select());
    }

    // Ídem con "modalidad" (falta migración 009): reintenta sin ese campo.
    if (error && nuevoAlumno.modalidad && /(column .*modalidad.* does not exist|find the 'modalidad' column)/i.test(error.message || "")) {
      LOG("crearAlumnoConPIN", "⚠️ Columna 'modalidad' no existe todavía (falta migración 009), creando sin modalidad");
      delete nuevoAlumno.modalidad;
      ({ data, error } = await supabase.from("alumnos").insert([nuevoAlumno]).select());
    }

    if (error) {
      // 23505 = índice único de código (doble submit o código repetido)
      if (error.code === "23505") {
        throw new Error(`El código "${codigo.trim().toUpperCase()}" ya está en uso por otro alumno`);
      }
      throw new Error(error.message || "Error al crear alumno");
    }

    // Crea el usuario de Auth del alumno + PIN salado (necesario para que
    // pueda loguearse con la RLS activa).
    if (data?.[0]?.id) await provisionAlumno(data[0].id, pin);

    LOG("crearAlumnoConPIN", `✅ Alumno ${nombre} creado exitosamente`, data);
    return data?.[0] || nuevoAlumno;
  } catch (e) {
    ERR("crearAlumnoConPIN", e.message, e);
    throw e;
  }
}

export async function crearAdmin(nombre, codigo, pin, email, rol) {
  LOG("crearAdmin", `⏳ Creando admin ${codigo}...`);

  try {
    // La tabla admins tiene RLS sin policies (nadie la toca directo con la
    // anon key) — el INSERT directo fallaba con 42501 y el admin nunca se
    // creaba. El alta corre server-side en crear_admin_rpc (migración 014,
    // rol agregado en 016), mismo patrón que login_admin_rpc.
    const pinHash = await hashearPIN(pin);
    const { data: admin, error } = await supabase.rpc("crear_admin_rpc", {
      p_nombre: nombre,
      p_codigo: codigo,
      p_pin_hash: pinHash,
      p_email: email || "",
      p_rol: rol === "kinesiologa" ? "kinesiologa" : "entrenador",
    });

    if (error || !admin) {
      throw new Error(error?.message || "Error al crear admin");
    }

    // Crea el usuario de Auth del admin + PIN salado (si no, no puede loguearse).
    if (admin?.id) await provisionAdmin(admin.id, pin);

    LOG("crearAdmin", `✅ Admin ${nombre} creado exitosamente`);
    return admin;
  } catch (e) {
    ERR("crearAdmin", e.message, e);
    throw e;
  }
}

// Gestión de administradores con rol (punto 12, ronda 2026-07-21). La
// tabla admins sigue sin policies para anon — ambas funciones pasan por
// RPC SECURITY DEFINER (migración 016), nunca exponen pin_hash.
export async function listarAdmins() {
  LOG("listarAdmins", "⏳ Listando admins...");
  try {
    const { data, error } = await supabase.rpc("listar_admins_rpc");
    if (error) throw error;
    LOG("listarAdmins", `✅ ${(data || []).length} admin(s)`);
    return data || [];
  } catch (e) {
    ERR("listarAdmins", e.message, e);
    return [];
  }
}

export async function actualizarRolAdmin(id, rol) {
  LOG("actualizarRolAdmin", `⏳ Actualizando rol de ${id} a ${rol}...`);
  try {
    const { data, error } = await supabase.rpc("actualizar_rol_admin_rpc", {
      p_id: id,
      p_rol: rol,
    });
    if (error) throw error;
    LOG("actualizarRolAdmin", "✅ Rol actualizado");
    return data;
  } catch (e) {
    ERR("actualizarRolAdmin", e.message, e);
    return null;
  }
}

// Editar admin existente (punto 2, ronda 2026-07-21 #2): nombre/username
// siempre, clave solo si se tipeó una nueva (pin opcional). Mismo patrón
// RPC SECURITY DEFINER (migración 019) — admins no acepta writes directos.
export async function actualizarAdmin(id, nombre, codigo, pin) {
  LOG("actualizarAdmin", `⏳ Actualizando admin ${id}...`);
  try {
    const pinHash = pin && pin.length === 4 ? await hashearPIN(pin) : null;
    const { data: admin, error } = await supabase.rpc("actualizar_admin_rpc", {
      p_id: id,
      p_nombre: nombre,
      p_codigo: codigo,
      p_pin_hash: pinHash,
    });
    if (error || !admin) {
      throw new Error(error?.message || "Error al actualizar admin");
    }
    // Si cambió el PIN, re-salar el bcrypt del admin (lo que valida el login).
    if (pin && pin.length === 4) await provisionAdmin(id, pin);
    LOG("actualizarAdmin", `✅ Admin ${nombre} actualizado`);
    return admin;
  } catch (e) {
    ERR("actualizarAdmin", e.message, e);
    throw e;
  }
}
