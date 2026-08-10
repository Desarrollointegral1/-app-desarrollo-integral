import { X } from "lucide-react";
import { S, card, TAP } from "../utils/theme.js";
import { etiquetaVariante } from "../utils/planVariantes.js";

// ELEGIDOR DE PLAN DE UN DÍA (2026-08-10)
//
// POR QUÉ es un componente y no JSX suelto adentro de App.jsx: los dos flujos
// de "Plan x día" (tocar un día que ya existe · "+ Agregar día") tenían cada
// uno su propia lista de botones copiada. Sumar las 10 variantes en las dos
// habría duplicado el problema, y encima ninguna de las dos se podía mirar en
// el banco de pruebas — el panel admin vive detrás del login.
//
// Ocupa el ancho completo de la grilla a propósito: las descripciones que
// escribió Lucas explican qué hace distinta a cada rutina, y no se leen dentro
// de un tile de media columna (~165px en el celular).
export default function SelectorPlanDia({
  dia,
  grupos = [],
  plantillas = [],
  tienePlan = false,
  onVariante,
  onPlantilla,
  onSinPlan,
  onQuitar,
  onVolver,
}) {
  const btnPlan = {
    background: S.white, color: S.bg, border: "none", padding: "8px 12px",
    borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
    minHeight: TAP, textAlign: "left",
  };
  const btnSec = {
    background: "transparent", border: "1px solid " + S.border, borderRadius: 6,
    padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: TAP,
  };
  const stop = (fn) => (e) => { e.stopPropagation(); fn && fn(); };

  return (
    <div style={{ ...card, padding: "12px 14px", gridColumn: "1 / -1" }}>
      <div style={{ fontSize: 11, color: S.gray, marginBottom: 10, textTransform: "uppercase", fontWeight: 800 }}>
        Plan para {dia === "Fijo" ? "todos los días" : dia}
      </div>

      {/* RUTINAS (tabla plan_variantes) — las 10 que escribió Lucas. Van
          primero y agrupadas por familia: los 3 días del PPL y los de las
          híbridas quedan juntos y numerados, así no hay que adivinar cuál va
          con cuál al asignarlos día por día. */}
      {grupos.length === 0 ? (
        <div style={{ color: S.gray, fontSize: 12, marginBottom: 10 }}>Cargando rutinas…</div>
      ) : (
        grupos.map((g) => (
          <div key={g.familia} style={{ marginBottom: 14 }}>
            <div style={{ color: S.white, fontSize: 12, fontWeight: 800, marginBottom: g.descripcion ? 4 : 6 }}>
              {g.label}
            </div>
            {g.descripcion && (
              <div style={{ color: S.gray, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>{g.descripcion}</div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {g.variantes.map((v) => (
                <button
                  key={v.id}
                  data-variante={v.id}
                  onClick={stop(() => onVariante && onVariante(v))}
                  title={v.nombre}
                  style={{ ...btnPlan, flex: "1 1 140px", minWidth: 0 }}
                >
                  {etiquetaVariante(v)}
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {/* PLANTILLAS anteriores (planTemplates.js, escritas en código): siguen
          disponibles, pero separadas y rotuladas para que se note cuáles son
          las nuevas y cuáles las de antes. */}
      <div style={{ borderTop: "1px solid " + S.border, paddingTop: 10 }}>
        <div style={{ color: S.gray, fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>
          Plantillas anteriores
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {plantillas.map((p) => (
            <button
              key={p.id}
              onClick={stop(() => onPlantilla && onPlantilla(p.id))}
              title={p.descripcion}
              style={{ ...btnPlan, background: S.card3, color: S.white, border: "1px solid " + S.border, flex: "1 1 140px" }}
            >
              {p.nombre}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        {/* "Sin plan": deja el día registrado a propósito, pero vacío. */}
        <button onClick={stop(onSinPlan)} style={{ ...btnSec, color: S.gray, border: "1px dashed " + S.border }}>
          Sin plan
        </button>
        {tienePlan && (
          <button onClick={stop(onQuitar)} style={{ ...btnSec, color: S.red, border: "1px solid " + S.red, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <X size={13} />Quitar día
          </button>
        )}
        <button onClick={stop(onVolver)} style={{ ...btnSec, color: S.gray, fontWeight: 400 }}>
          ‹ Volver
        </button>
      </div>
    </div>
  );
}
