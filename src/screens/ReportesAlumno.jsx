import { useEffect, useState } from "react";
import { cargarPesos } from "../../services/supabase.js";
import { EvolucionCargas } from "../components/EvolucionCargas.jsx";
import { ResumenMensual } from "../components/ResumenMensual.jsx";
import { diasDeTodosLosPlanes, ejerciciosDeTodosLosPlanes, unirHistorialesPorEjercicio } from "../utils/helpers.js";
import { generarPDF } from "../utils/pdfGenerator.js";
import { S } from "../utils/theme.js";

// ── REPORTES DEL ALUMNO (repuesto 2026-08-03) ───────────────────────────
// PDF del historial + Resumen mensual + Evolución de cargas: las tres
// existían enteras desde antes de la refactorización de menús del 19/07
// (commit 7516b50), que rehizo la navegación y las dejó sin ningún botón que
// llevara a ellas — nadie las borró, quedaron huérfanas. Repuestas por pedido
// de Lucas (03/08) dentro de Evaluación → Reportes, "por ahora" — mismo
// patrón de carga que ya usa HistorialAdmin (cargarPesos bajo demanda, no en
// cada tecla).
export function ReportesAlumno({ al }) {
  const [historiales, setHistoriales] = useState({});
  const [generandoPDF, setGenerandoPDF] = useState(false);
  // 2026-08-13: el reporte se arma con TODOS los días del alumno y con el
  // historial unido por ejercicio (ver helpers.js). Antes miraba planes[0]
  // y por fila de plan: los pesos de los otros días no aparecían en ninguna
  // pantalla aunque estuvieran guardados en la base.
  const planTodos = { ...(al?.plan || {}), dias: diasDeTodosLosPlanes(al) };
  const histUnidos = unirHistorialesPorEjercicio(ejerciciosDeTodosLosPlanes(al), historiales);
  useEffect(() => {
    if (!al?.id) return;
    setHistoriales({});
    cargarPesos(al.id, null).then((data) => {
      setHistoriales(data?.historiales || {});
    });
  }, [al?.id]);

  const handleGenerarPDF = async () => {
    setGenerandoPDF(true);
    try {
      await generarPDF(al, historiales);
    } finally {
      setGenerandoPDF(false);
    }
  };

  if (!al) return null;
  return (
    <div>
      <button
        onClick={handleGenerarPDF}
        disabled={generandoPDF}
        style={{
          width: "100%",
          background: generandoPDF ? S.card : S.white,
          color: generandoPDF ? S.gray : S.bg,
          border: "none",
          borderRadius: 8,
          padding: "13px",
          fontSize: 13,
          fontWeight: 900,
          cursor: generandoPDF ? "default" : "pointer",
          marginBottom: 14,
          letterSpacing: 1,
        }}
      >
        {generandoPDF ? "⏳ GENERANDO PDF..." : "📄 DESCARGAR HISTORIAL PDF"}
      </button>
      <ResumenMensual
        asistencia={al.asistencia || []}
        historiales={histUnidos}
        plan={planTodos}
        diario={al.diario || []}
      />
      <div style={{ height: 20 }} />
      <EvolucionCargas historiales={histUnidos} plan={planTodos} />
    </div>
  );
}
