import { EstudioBioSeccion } from "../../components/EstudioBio.jsx";
import { ProtocoloEvaluacionSeccion } from "../../components/ProtocoloEvaluacion.jsx";
import { S, TAP } from "../../utils/theme.js";

// Sección "evaluacion" del AdminPanel. Solo JSX: todo el estado y los
// handlers viven en AdminPanel.jsx y llegan por props (refactor 2026-08-17).
export function SeccionEvaluacion({
  al,
  evalTab,
  setEvalTab,
  showToast,
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Evaluación — {al.nombre}
      </div>
      {/* Sub-módulos: Evaluación integral · Bioimpedancia · Reportes
          ("Reportes" es donde vuelven a vivir, dentro de Evaluación, las
          tres funciones que la refactorización del 19/07 dejó
          desconectadas del menú — PDF del historial, resumen mensual y
          evolución de cargas. Nadie las borró, solo quedaron sin botón;
          ver PLAN-MAESTRO. Van acá "por ahora" según pidió Lucas —
          el 03/08 puede pedir moverlas a otro lugar). */}
      {/* 2026-08-13: estos dos tabs medían 150x30 con letra de 11px y no
          envolvían — con el zoom del sistema al 200% "Bioimpedancia" se
          iba 18px fuera de la pantalla. Ahora llegan al piso táctil y
          bajan de renglón cuando no entran. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {[["Evaluación integral", "integral"], ["Bioimpedancia", "bio"]].map(([l, k]) => (
          <button
            key={k}
            onClick={() => setEvalTab(k)}
            style={{
              flex: "1 1 120px",
              minHeight: TAP,
              background: evalTab === k ? S.white : S.card,
              color: evalTab === k ? S.bg : S.gray,
              border: "1px solid " + (evalTab === k ? S.white : S.border),
              borderRadius: 8,
              padding: "8px 6px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {evalTab === "integral" && <ProtocoloEvaluacionSeccion alumnoId={al.id} alumno={al} showToast={showToast} />}
      {evalTab === "bio" && <EstudioBioSeccion alumnoId={al.id} alumno={al} showToast={showToast} />}
    </div>
  );
}
