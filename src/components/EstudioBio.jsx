import { useEffect, useState } from "react";
import { BarChart3, Sparkles } from "lucide-react";
import { S, tabN2 } from "../utils/theme.js";
import { actualizarBioimpedancia, cargarBioimpedanciaCompleta, eliminarBioimpedancia, saveBioimpedanciaCompleta } from "../../services/supabase.js";
import { ScanCorporalForm } from "./ScanCorporal.jsx";
import { EstudioAnteriorForm } from "./estudio-bio/EstudioAnteriorForm.jsx";
import { EstudioBioForm } from "./estudio-bio/EstudioBioForm.jsx";
import { EstudioBioHistorial } from "./estudio-bio/EstudioBioHistorial.jsx";
// Re-export: EstudioBioForm y EstudioBioHistorial seguían siendo públicos desde este archivo.
export { EstudioBioForm } from "./estudio-bio/EstudioBioForm.jsx";
export { EstudioBioHistorial } from "./estudio-bio/EstudioBioHistorial.jsx";

// Sección completa: formulario + historial, conectada a Supabase.
// La usan tal cual el panel admin (sección Bioimp.) y la vista del alumno.
/**
 * `readOnly`  — el alumno sólo mira (como estaba hasta el 2026-08-08).
 * `puedeCargar` — 2026-08-09, pedido de Lucas: "el alumno tiene que poder
 *   registrar el scan corporal y la bioimpedancia/balanza". Con readOnly +
 *   puedeCargar el alumno CARGA y CORRIGE lo suyo, pero:
 *     · no puede ELIMINAR registros (borrar historial queda del lado del
 *       entrenador, que es quien lo usa para decidir);
 *     · no ve el requerimiento energético ni la alerta de disponibilidad.
 *       Eso es un veto de seguridad anterior y sigue en pie: un número de
 *       kcal mostrado al alumno se lee como prescripción, y la alerta de
 *       RED-S tiene que derivar a un profesional, no aparecer en pantalla.
 */
export function EstudioBioSeccion({ alumnoId, alumno, showToast, readOnly = false, puedeCargar = false }) {
  // Puede operar los formularios: el admin siempre; el alumno sólo si se le
  // habilitó explícitamente.
  const cargaHabilitada = !readOnly || puedeCargar;
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  // 2026-07-30: registro en edición — al setearlo, el formulario de "nuevo
  // estudio" se reemplaza por el mismo EstudioBioForm precargado (pedido de
  // Lucas: "falta poder modificar lo que grabé"). null = modo alta normal.
  const [editando, setEditando] = useState(null);
  // 2026-08-04, pedido de Lucas: Bioimpedancia pasa a tener 2 módulos con
  // selector arriba (antes todo apilado: form manual + estudio anterior +
  // scan corporal, uno abajo del otro) — "Estudio manual" (con el link chico
  // de "Subir estudio anterior" adentro, no cuenta como módulo aparte) y
  // "Scan corporal (IA)".
  const [modulo, setModulo] = useState("manual"); // 'manual' | 'scan'

  useEffect(() => {
    if (!alumnoId) return;
    setCargando(true);
    cargarBioimpedanciaCompleta(alumnoId).then((d) => {
      setRegistros(d);
      setCargando(false);
    });
  }, [alumnoId]);

  // Alta y edición comparten esta función: `datos.id` presente = UPDATE
  // (actualizarBioimpedancia) sobre ese registro, ausente = INSERT nuevo
  // (saveBioimpedanciaCompleta). Un solo lugar, no dos handlers duplicados.
  const guardar = async (datos, foto, quitarFoto = false) => {
    setGuardando(true);
    try {
      if (datos.id) {
        const actualizado = await actualizarBioimpedancia(datos.id, datos, foto, quitarFoto);
        setRegistros((prev) => prev.map((r) => (r.id === actualizado.id ? actualizado : r)));
        setEditando(null);
        showToast && showToast("Estudio actualizado");
      } else {
        const nuevo = await saveBioimpedanciaCompleta(alumnoId, datos, foto);
        setRegistros((prev) => [nuevo, ...prev]);
        showToast && showToast("Estudio guardado");
      }
      return true;
    } catch (e) {
      console.error("[EstudioBio] Error guardando:", e);
      showToast && showToast("Error al guardar el estudio");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (bio) => {
    if (!window.confirm(`¿Eliminar el estudio del ${bio.fecha}?`)) return;
    try {
      await eliminarBioimpedancia(bio.id, bio.archivo_url);
      setRegistros((prev) => prev.filter((r) => r.id !== bio.id));
      showToast && showToast("Estudio eliminado");
    } catch (e) {
      showToast && showToast("Error al eliminar");
    }
  };

  return (
    <div>
      {/* 2026-08-04, pedido de Lucas: "Estudio manual" pasa a llamarse
          "Balanza" (es más claro para qué es: cargar el número que da la
          báscula de bioimpedancia física).
          2026-08-09: el selector deja de ser solo-admin. Lucas lo había
          abierto al alumno, lo revirtió el 04/08, y ahora lo pidió de nuevo
          explícitamente ("el alumno tiene que poder registrar el scan
          corporal y la bioimpedancia balanza"). Se habilita con puedeCargar,
          no sacando readOnly, para que el alumno siga sin poder borrar
          registros ni ver el requerimiento energético. */}
      {cargaHabilitada && !editando && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => setModulo("manual")} style={{ ...tabN2(modulo === "manual"), display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <BarChart3 size={15} strokeWidth={2} />Balanza
          </button>
          <button onClick={() => setModulo("scan")} style={{ ...tabN2(modulo === "scan"), display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Sparkles size={15} strokeWidth={2} />Scan corporal (IA)
          </button>
        </div>
      )}
      {cargaHabilitada && editando ? (
        <EstudioBioForm
          key={editando.id}
          alumno={alumno}
          registroExistente={editando}
          onGuardar={guardar}
          onCancelar={() => setEditando(null)}
          guardando={guardando}
        />
      ) : (
        cargaHabilitada &&
        modulo === "manual" && (
          <>
            <EstudioBioForm key="nuevo" alumno={alumno} onGuardar={guardar} guardando={guardando} historialAlumno={registros} />
            {/* Estudio anterior: solo fecha + foto, sin medición — pedido
                explícito de Lucas de que viva separado del formulario de
                estudio nuevo, pero adentro del módulo Balanza (no es un
                módulo aparte). */}
            <EstudioAnteriorForm onGuardar={guardar} guardando={guardando} />
          </>
        )
      )}
      {/* Scan corporal (Fase 1): composición corporal estimada por IA a
          partir de 2 fotos, sin balanza. Guarda en la misma tabla con
          metadata.tipo="scan_2fotos" para distinguirlo de una medición manual.
          Abierto al alumno desde el 2026-08-09 (ver puedeCargar arriba). */}
      {cargaHabilitada && !editando && modulo === "scan" && (
        <ScanCorporalForm alumno={alumno} onGuardar={guardar} />
      )}
      {/* El requerimiento energético y la alerta de disponibilidad son
          entrenador-only por veto de seguridad: un número de kcal mostrado al
          alumno se lee como prescripción, y la alerta es un indicador de
          riesgo RED-S que debe derivar a un profesional, no mostrarse. */}
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><BarChart3 size={16} strokeWidth={2} />Estudios registrados</span>
      </div>
      {cargando ? (
        <div style={{ color: S.gray, fontSize: 12, padding: 16, textAlign: "center" }}>Cargando...</div>
      ) : (
        <EstudioBioHistorial
          registros={registros}
          onEliminar={readOnly ? null : eliminar}
          onEditar={cargaHabilitada ? setEditando : null}
          alumnoFlyer={readOnly ? null : alumno}
          showToast={showToast}
          mostrarRequerimiento={!readOnly}
        />
      )}
    </div>
  );
}

