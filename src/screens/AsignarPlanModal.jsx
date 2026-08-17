import { useEffect, useState } from "react";
import { BookOpen, Check, X } from "lucide-react";
import { crearPlanAlumno, listarPlanesPredeterminados } from "../../services/supabase.js";
import { DiasEditor } from "../components/editores/DiasEditor.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import { uid } from "../utils/helpers.js";
import { S, card, inp } from "../utils/theme.js";

// ── ASIGNAR PLAN (punto 6, 2026-07-21) ──────────────────────────────────
// Modal en 2 pasos, disparado desde Admin → Alumno → "＋ Asignar plan":
//   1) Elegir una PLANTILLA (planes_predeterminados) + el día de la
//      semana al que se asigna.
//   2) Preview EDITABLE (mismo DiasEditor que usa Plan x día/Armador):
//      Lucas puede tocar cualquier ejercicio de la COPIA antes de
//      confirmar — la plantilla original queda intacta, lo editado acá
//      es la instancia de ESE alumno (coherente con el punto 1: cada
//      instancia asignada es independiente).
const DIAS_ASIGNAR = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
export function AsignarPlanModal({ al, biblioteca, onGuardarBiblioteca, onGuardarParaTodos, showToast, onClose, onAsignado }) {
  const [plantillas, setPlantillas] = useState(null); // null = cargando
  const [plantillaSel, setPlantillaSel] = useState(null);
  // Ronda 18: MULTI-SELECT de días — se pueden elegir varios (ej. Lunes +
  // Miércoles + Viernes) y al confirmar se asigna la misma plantilla como
  // copias INDEPENDIENTES a cada día elegido, en una sola pasada.
  const [diasSel, setDiasSel] = useState(new Set(["Lunes"]));
  const [nombreInstancia, setNombreInstancia] = useState("");
  const [diasEditables, setDiasEditables] = useState(null); // paso 2: copia editable
  const [guardando, setGuardando] = useState(false);
  const toggleDia = (d) =>
    setDiasSel((prev) => {
      const s = new Set(prev);
      s.has(d) ? s.delete(d) : s.add(d);
      return s;
    });

  useEffect(() => {
    listarPlanesPredeterminados().then(setPlantillas);
  }, []);

  const elegirPlantilla = (p) => {
    setPlantillaSel(p);
    setNombreInstancia(p.nombre);
    // Copia con ids NUEVOS por ejercicio — desacoplada de la plantilla y
    // de cualquier otra instancia ya asignada (mismo criterio que
    // asignarPlanPredeterminado en services/supabase.js).
    const copia = (p.dias || []).map((d) => ({
      dia: d.dia || "Sesion",
      subtitulo: d.subtitulo || "",
      ejercicios: (d.ejercicios || []).map((ej) => ({ ...ej, id: uid() })),
    }));
    setDiasEditables(copia.length > 0 ? copia : [{ dia: "Sesion", subtitulo: "", ejercicios: [] }]);
  };

  const confirmarAsignacion = async () => {
    if (!diasEditables) return;
    const dias = DIAS_ASIGNAR.filter((d) => diasSel.has(d));
    if (dias.length === 0) { showToast && showToast("Elegí al menos un día"); return; }
    setGuardando(true);
    try {
      // Una copia INDEPENDIENTE por día: ids de ejercicio nuevos en cada
      // día para que editar el plan de un día no toque el de otro.
      for (const diaSemana of dias) {
        const copiaDia = diasEditables.map((d) => ({
          ...d,
          ejercicios: (d.ejercicios || []).map((ej) => ({ ...ej, id: uid() })),
        }));
        const r = await crearPlanAlumno(al.id, diaSemana, { nombre: nombreInstancia.trim() || "Plan", dias: copiaDia }, "catalogo_v2");
        if (!r.ok) throw new Error(`No se pudo asignar el plan al día ${diaSemana}`);
      }
      showToast && showToast(dias.length > 1 ? `Plan asignado a ${dias.length} días` : "Plan asignado");
      onAsignado && onAsignado();
    } catch (e) {
      showToast && showToast("Error: " + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const grupos = plantillas ? [...new Set(plantillas.map((p) => p.grupo || "Sin grupo"))] : [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 230, background: "rgba(0,0,0,0.7)", overflowY: "auto", padding: "24px 12px 40px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, maxWidth: 460, margin: "0 auto", background: S.bg, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: S.white, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
            {diasEditables ? `Asignar a ${al.nombre}` : "Elegí una plantilla"}
          </div>
          <button onClick={onClose} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 18, cursor: "pointer" }}><X size={16} /></button>
        </div>

        {!diasEditables ? (
          // Paso 1: elegir plantilla
          !plantillas ? (
            // Patrón de Instagram: la silueta del contenido que viene, en vez
            // del texto "Cargando…". Se siente más rápido aunque tarde igual.
            <div style={{ padding: "4px 0" }}><SkeletonCard /><SkeletonCard /></div>
          ) : plantillas.length === 0 ? (
            <div style={{ color: S.gray, fontSize: 13, textAlign: "center", padding: 20 }}>
              Todavía no hay plantillas — creá una desde <BookOpen size={13} style={{ verticalAlign: "-2px" }} /> Biblioteca → + Crear plan de entrenamiento.
            </div>
          ) : (
            grupos.map((g) => (
              <div key={g} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, color: S.gray, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{g}</div>
                {plantillas.filter((p) => (p.grupo || "Sin grupo") === g).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => elegirPlantilla(p)}
                    style={{ width: "100%", textAlign: "left", background: S.card2, border: "1px solid " + S.border, borderRadius: 8, padding: "10px 12px", marginBottom: 6, cursor: "pointer" }}
                  >
                    <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{p.nombre}</div>
                    <div style={{ color: S.gray, fontSize: 15, marginTop: 3 }}>
                      {(p.dias || []).reduce((n, d) => n + (d.ejercicios || []).length, 0)} ejercicio(s)
                    </div>
                  </button>
                ))}
              </div>
            ))
          )
        ) : (
          // Paso 2: preview editable antes de confirmar
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>
                Días de la semana <span style={{ color: S.lgray, textTransform: "none", letterSpacing: 0 }}>(podés elegir varios)</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DIAS_ASIGNAR.map((d) => {
                  const on = diasSel.has(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDia(d)}
                      style={{ background: on ? S.white : S.card2, color: on ? S.bg : S.gray, border: "1px solid " + (on ? S.white : S.border2), borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                    >
                      {on && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>Nombre para {al.nombre}</div>
              <input value={nombreInstancia} onChange={(e) => setNombreInstancia(e.target.value)} style={inp} />
            </div>
            <div style={{ fontSize: 14, color: S.lgray, marginBottom: 10 }}>
              Esto es una COPIA de la plantilla — podés tocar cualquier ejercicio para este alumno sin afectar la plantilla original ni a otros alumnos.
            </div>
            <DiasEditor
              dias={diasEditables}
              onChange={setDiasEditables}
              biblioteca={biblioteca}
              onGuardarBiblioteca={onGuardarBiblioteca}
              onGuardarParaTodos={onGuardarParaTodos}
              ocultarAgregarDia
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => setDiasEditables(null)} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: "12px 16px", cursor: "pointer" }}>
                ‹ Volver
              </button>
              <button
                onClick={confirmarAsignacion}
                disabled={guardando}
                style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontWeight: 900, cursor: "pointer", opacity: guardando ? 0.6 : 1 }}
              >
                {guardando ? "ASIGNANDO..." : "ASIGNAR"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
