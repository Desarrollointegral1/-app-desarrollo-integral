import { Check } from "lucide-react";
import { S, inp, TAP } from "../utils/theme.js";
import { etiquetaVariante, valorVariante, SIN_PLAN } from "../utils/planVariantes.js";

// DÍAS + PLAN DE EJERCICIOS DEL ALTA (2026-08-12)
//
// POR QUÉ es un componente y no JSX suelto adentro de App.jsx: el mismo motivo
// que SelectorPlanDia. El alta vive dentro del panel admin, detrás del login
// con PIN, así que cada cambio en esta pantalla se verificaba a ciegas. Acá se
// monta en el banco de pruebas (dev/harness.html) con las variantes de
// mentira, y se ve tal cual sale.
//
// Reclamo de Lucas que lo originó: "Al crear un usuario tengo que poder poner
// sin plan o con los planes que tenemos, no me aparecen los planes que tenemos
// organizados". El desplegable ofrecía PLANTILLAS (planTemplates.js, ya podado
// a 2 entradas), no las 14 rutinas reales de `plan_variantes`. Ahora ofrece las
// mismas variantes agrupadas por familia que el selector por día del panel —
// mismos datos, mismas etiquetas — con "Sin plan" primero y como
// predeterminado: crear un alumno no le impone una rutina que nadie eligió.
export default function SelectorDiasAlta({ dias = [], seleccion = {}, grupos = [], onToggle, onPlan }) {
  return (
    <div>
      {dias.map((d) => {
        const activo = seleccion[d] != null;
        return (
          <div key={d} style={{ marginBottom: 6 }}>
            <button
              data-dia-alta={d}
              onClick={() => onToggle && onToggle(d)}
              style={{
                width: "100%", textAlign: "left",
                background: activo ? S.white : S.card, color: activo ? S.bg : S.gray,
                border: "1px solid " + (activo ? S.white : S.border),
                borderRadius: 6, padding: "9px 12px", fontSize: 12, fontWeight: 700,
                cursor: "pointer", minHeight: TAP,
              }}
            >
              {activo && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{d}
            </button>
            {activo && (
              // El desplegable va DEBAJO del día y a ancho completo: los
              // nombres reales ("Híbrida 3 días · Empuje + Peso muerto") no
              // entran en los 140px que tenía al costado en un celular de
              // 375px — se leía "Híbrida 3 días · Emp…".
              <select
                data-plan-alta={d}
                value={seleccion[d]}
                onChange={(e) => onPlan && onPlan(d, e.target.value)}
                style={{ ...inp, marginTop: 4 }}
              >
                {/* Etiqueta corta a propósito: el <select> nativo del celular
                    corta con "…" lo que no entra en 375px, y lo primero que
                    tiene que leerse entero es "Sin plan". */}
                <option value={SIN_PLAN}>Sin plan</option>
                {grupos.map((g) => (
                  <optgroup key={g.familia} label={g.label}>
                    {g.variantes.map((v) => (
                      <option key={v.id} value={valorVariante(v)}>{etiquetaVariante(v)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
