// ============================================================
// Capa de datos — Desarrollo Integral (Supabase)
// ------------------------------------------------------------
// Barrel: el código vive en services/supabase/, un archivo por dominio. Los
// importadores siguen haciendo `import { ... } from ".../services/supabase.js"`
// y no saben de la partición. El cliente y el test de conexión que corre al
// importar están en supabase/cliente.js (se ejecuta una sola vez, como antes).
//
// cliente.js, planes.js y alumnos.js exportan además helpers INTERNOS para
// los módulos hermanos (LOG, ERR, _savePlanDias, COLS_ALUMNO_SIN_FOTO…): por
// eso se re-exportan con lista explícita y no con `export *`, para que la
// superficie pública siga siendo exactamente la misma de siempre.
// ============================================================

export { supabase, desactivarAdmin, cerrarSesionAuth } from "./supabase/cliente.js";
export {
  cargarDatos, cargarFotos, guardarFotoAlumno, insertAlumno, payloadAlumno,
  _columnasCambiadas, guardarDatos, deleteAlumno, restaurarAlumno,
  cargarAlumnosArchivados, getAlumno,
} from "./supabase/alumnos.js";
export {
  getPlanDias, getPlanEjercicios, cargarPlanesXDia, getPlanDiasPorAlumnoPlan,
  eliminarPlanDia, renombrarPlanAlumno, guardarPeriodizacionDia, crearPlanAlumno,
  actualizarPlanAlumnoDias, assignPlanToStudent,
} from "./supabase/planes.js";
export * from "./supabase/planesPredeterminados.js";
export * from "./supabase/registros.js";
export * from "./supabase/auth.js";
export * from "./supabase/storage.js";
export * from "./supabase/bioimpedancia.js";
export * from "./supabase/evaluaciones.js";
export * from "./supabase/biblioteca.js";
export * from "./supabase/novedades.js";
export * from "./supabase/reportes.js";
export * from "./supabase/config.js";
