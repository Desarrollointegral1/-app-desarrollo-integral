import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { actualizarPlanAlumnoDias, cargarPlanesXDia, eliminarPlanDia, renombrarPlanAlumno } from "../../services/supabase.js";
import { DiasEditor } from "../components/editores/DiasEditor.jsx";
import { ORDEN_DIAS } from "../utils/helpers.js";
import { S, card, inp, smallBtn } from "../utils/theme.js";

// ── PLAN → PRINCIPALES: días reales del alumno con su plan asignado ───
// Muestra directamente LOS DÍAS QUE EL ALUMNO YA ENTRENA (los elegidos en el
// alta) con el plan que cada uno tiene, para retocar ejercicios puntuales.
// Agregar un día nuevo queda como acción secundaria (deriva a Plan Día).
export function PlanesPrincipales({ al, alumnos, onUpdate, biblioteca, onGuardarBiblioteca, onGuardarParaTodos, showToast, onIrPlanDia, initialPlanId, diasModo = "nombres", onSetDiasModo }) {
  const planes = [...(al.planes || [])].sort(
    (a, b) => (ORDEN_DIAS[a.dia_semana] || 9) - (ORDEN_DIAS[b.dia_semana] || 9),
  );
  // initialPlanId (ronda 7): venir desde "Planes asignados" de la ficha abre
  // directamente ESE plan para editarlo (el componente se re-monta por key).
  const [selPlanId, setSelPlanId] = useState(
    initialPlanId && planes.some((p) => p.id === initialPlanId) ? initialPlanId : planes[0] && planes[0].id,
  );
  const plan = planes.find((p) => p.id === selPlanId) || planes[0];

  // ── Edición por día específico (punto 1, ronda 2026-07-21) ──
  // La ronda anterior (bug Vic) había hecho que editar un ejercicio con el
  // chip de un día seleccionado propagara automáticamente a TODOS los otros
  // días del mismo alumno que compartieran el nombre de plan. Lucas pidió
  // revertir eso: quiere poder tener un ejercicio distinto un día y otro
  // distinto otro día, aunque el plan se llame igual. Ahora el guardado
  // afecta SOLO el día que se está editando. Para replicar un cambio a
  // TODOS los alumnos que tengan ese ejercicio (por código), sigue existiendo
  // el botón explícito "Guardar para todos" (onGuardarParaTodos más abajo,
  // que llama a propagarEjercicioATodos — mecanismo aparte, no tocado).
  const guardarDias = (nuevosDias) => {
    if (!plan) return;
    onUpdate(alumnos.map((a) => a.id === al.id
      ? {
          ...a,
          planes: (a.planes || []).map((p) => (p.id === plan.id ? { ...p, dias: nuevosDias } : p)),
          // El plan sintético "Fijo" (sin fila en alumno_planes) se persiste
          // por el camino viejo: al.plan.dias → _guardarAlumno → plan_dias.
          plan: plan._sintetico ? { ...a.plan, dias: nuevosDias } : a.plan,
        }
      : a));
    if (!plan._sintetico) {
      actualizarPlanAlumnoDias(plan.id, nuevosDias).then(async (ok) => {
        if (ok) return;
        // El plan pudo haber sido reemplazado/borrado desde otra sesión (id
        // stale → FK 23503). Recargar los planes reales de la base para que
        // el estado deje de apuntar a un id muerto.
        showToast && showToast("Ese plan cambió en otra sesión. Recargando planes");
        try {
          const planesFrescos = await cargarPlanesXDia(al.id, al);
          onUpdate((prev) => (Array.isArray(prev) ? prev : []).map((a) =>
            a.id === al.id ? { ...a, planes: planesFrescos } : a));
        } catch (e) {
          console.error("[guardarDias] No se pudieron recargar los planes:", e);
        }
      });
    }
  };

  // Renombrar el plan asignado (punto 7, ronda 2026-07-21 #2): al lado de
  // "Cambiar plan" — no toca días/ejercicios, solo el nombre visible.
  const [renombrando, setRenombrando] = useState(false);
  const [nuevoNombrePlan, setNuevoNombrePlan] = useState("");
  const abrirRenombrar = () => {
    setNuevoNombrePlan(plan?.nombre || "");
    setRenombrando(true);
  };
  const guardarRenombre = async () => {
    if (!plan || !nuevoNombrePlan.trim()) return;
    const nombreLimpio = nuevoNombrePlan.trim();
    if (plan._sintetico) {
      // Plan "Fijo" sin fila en alumno_planes: se guarda como el resto del
      // camino viejo (al.plan), no hay id para el UPDATE directo.
      onUpdate(alumnos.map((a) => a.id === al.id ? { ...a, plan: { ...a.plan, nombre: nombreLimpio } } : a));
      setRenombrando(false);
      showToast && showToast("Plan renombrado");
      return;
    }
    const ok = await renombrarPlanAlumno(plan.id, nombreLimpio);
    if (!ok) { showToast && showToast("Error al renombrar . Revisá la consola"); return; }
    onUpdate(alumnos.map((a) => a.id === al.id
      ? { ...a, planes: (a.planes || []).map((p) => (p.id === plan.id ? { ...p, nombre: nombreLimpio } : p)) }
      : a));
    setRenombrando(false);
    showToast && showToast("Plan renombrado");
  };

  // Eliminar directamente un día ya creado, sin pasar por Planificación
  // (punto 7, ronda 12). Solo aplica a planes REALES (no al sintético "Fijo",
  // que no tiene fila propia en alumno_planes).
  const eliminarDia = async (p) => {
    if (p._sintetico) return;
    if (!window.confirm(`¿Eliminar el día "${p.dia_semana}" (${p.nombre || "plan"}) de ${al.nombre}? Se pierde el plan asignado ese día.`)) return;
    const ok = await eliminarPlanDia(al.id, p.dia_semana);
    if (!ok) { showToast && showToast("Error al eliminar el día . Revisá la consola"); return; }
    const restantes = planes.filter((x) => x.id !== p.id);
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, planes: restantes } : a)));
    if (selPlanId === p.id) setSelPlanId(restantes[0] && restantes[0].id);
    showToast && showToast(`Día "${p.dia_semana}" eliminado`);
  };

  if (planes.length === 0)
    return (
      <div style={{ ...card, padding: 24, textAlign: "center" }}>
        <div style={{ color: S.gray, fontSize: 13, marginBottom: 12 }}>
          {al.nombre} no tiene días con plan asignado todavía.
        </div>
        <button onClick={onIrPlanDia} style={{ background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
          Asignar plan a un día
        </button>
      </div>
    );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1 }}>
          Días que entrena {al.nombre}
        </div>
        {/* Punto 9 (2026-07-21): modo de etiquetado de días para este
            alumno — nombres reales o genérico "Día 1/Día 2/Día 3" (útil
            para alumnos sin horario fijo). Se guarda en rm.dias_modo y lo
            respeta el selector de día que ve el alumno en Principales. */}
        {onSetDiasModo && (
          <div style={{ display: "flex", gap: 2, background: S.card2, borderRadius: 6, padding: 2 }}>
            {[["nombres", "Nombres"], ["numerico", "Día 1/2/3"]].map(([id, l]) => (
              <button
                key={id}
                onClick={() => onSetDiasModo(id)}
                title="Cómo ve el alumno el selector de día en Principales"
                style={{
                  background: diasModo === id ? S.white : "transparent",
                  color: diasModo === id ? S.bg : S.gray,
                  border: "none",
                  borderRadius: 5,
                  padding: "4px 8px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {planes.map((p, pi) => {
          const activo = plan && p.id === plan.id;
          return (
            <div key={p.id} style={{ position: "relative" }}>
              <button
                onClick={() => setSelPlanId(p.id)}
                style={{ background: activo ? S.white : S.card, color: activo ? S.bg : S.gray, border: "1px solid " + (activo ? S.white : S.border), borderRadius: 8, padding: "7px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left" }}
              >
                <div>{p.dia_semana === "Fijo" ? "Todos los días" : diasModo === "numerico" ? `Día ${pi + 1}` : p.dia_semana}</div>
                <div style={{ fontSize: 14, fontWeight: 400, opacity: 0.75 }}>{p.nombre || "Plan"}</div>
              </button>
              {/* Punto 7: sacar un día directo desde acá, sin ir a Planificación */}
              {!p._sintetico && (
                <button
                  onClick={(e) => { e.stopPropagation(); eliminarDia(p); }}
                  title={`Eliminar ${p.dia_semana}`}
                  style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", background: S.red, color: "#fff", border: "none", fontSize: 14, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
        <button onClick={onIrPlanDia} style={{ background: "transparent", color: S.gray, border: "1px dashed " + S.border, borderRadius: 8, padding: "7px 10px", fontSize: 11, cursor: "pointer" }}>
          + Otro día
        </button>
      </div>
      {plan && (
        <div style={{ ...card, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
            <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>
              {plan.dia_semana === "Fijo" ? "Plan único" : plan.dia_semana} · {plan.nombre || "Plan"}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={abrirRenombrar} style={smallBtn(S.gray)}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Pencil size={13} />Renombrar</span></button>
              <button onClick={onIrPlanDia} style={smallBtn(S.gray)}>Cambiar plan</button>
            </div>
          </div>
          {renombrando && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <input
                value={nuevoNombrePlan}
                onChange={(e) => setNuevoNombrePlan(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && guardarRenombre()}
                placeholder="Nombre del plan"
                style={{ ...inp, flex: 1 }}
                autoFocus
              />
              <button onClick={guardarRenombre} style={{ background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "0 14px", fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center" }}><Check size={16} /></button>
              <button onClick={() => setRenombrando(false)} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 6, padding: "0 14px", cursor: "pointer" }}><X size={16} /></button>
            </div>
          )}
          {/* key por plan (2026-08-09): cambiar de día de la semana (Lunes →
              Martes) tiene que empezar de cero. Sin esto el DiasEditor se
              quedaba con el día interno y el ejercicio abierto del plan
              anterior. */}
          <DiasEditor key={plan.id} dias={plan.dias || []} onChange={guardarDias} biblioteca={biblioteca} onGuardarBiblioteca={onGuardarBiblioteca} onGuardarParaTodos={onGuardarParaTodos} ocultarAgregarDia />
        </div>
      )}
    </div>
  );
}
