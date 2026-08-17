import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { cargarPesos } from "../../services/supabase.js";
import MiniChart from "../components/MiniChart.jsx";
import { claveEjercicio, ejerciciosDeTodosLosPlanes } from "../utils/helpers.js";
import { S, card } from "../utils/theme.js";
import { SUFIJO, unidadDe } from "../utils/unidades.js";

// ── HISTORIAL ADMIN ───────────────────────────────────────────────────
// Ronda 11: rediseño completo. Reemplaza el viejo "Historial" (una fila por
// ejercicio-instancia, duplicado si el mismo ejercicio aparecía en más de un
// día) y el viejo "Peso Max" (rm manual, ya sacado del admin). Ahora es UNA
// fuente: registros_diarios (via cargarPesos → historiales), sin distinguir
// si el peso lo cargó el alumno en Principales o Lucas/Ari/Gri desde Modo
// Entrenador — usan el mismo handler y la misma tabla, así que ya está
// unificado de origen (no hay campo "cargado por" en ningún lado).
// Acá se agrupan los ejercicios por CÓDIGO (o por nombre exacto si es un
// ejercicio viejo sin código todavía) uniendo TODOS los días del plan, y se
// muestra el peso máximo histórico + la fecha en que se logró por primera vez.
export function HistorialAdmin({ al }) {
  const [selKey, setSelKey] = useState(null);
  const [histData, setHistData] = useState({});
  useEffect(() => {
    if (!al?.id) return;
    setSelKey(null);
    setHistData({});
    cargarPesos(al.id, null).then((data) => {
      if (data && data.historiales) setHistData(data.historiales);
      else setHistData({});
    });
  }, [al?.id]);

  const grupos = (() => {
    const porClave = new Map();
    // 2026-08-13, dos correcciones:
    // · al.plan.dias era SOLO el primer plan del alumno (copia de
    //   compatibilidad de planes[0]): los días restantes no figuraban acá.
    // · la clave pasa a ser el nombre normalizado y no `codigo || nombre`: en
    //   la base hay ejercicios idénticos con códigos distintos según el día
    //   (Maria tiene "Sentadilla con barra" como CU005 y como RO005), y con la
    //   clave vieja quedaban como dos historiales separados.
    const ejercicios = ejerciciosDeTodosLosPlanes(al);
    ejercicios.forEach((ej) => {
      const clave = claveEjercicio(ej);
      if (!clave) return;
      // 2026-08-12: el grupo se queda con la unidad del ejercicio — el
      // historial de un fondo o una plancha no se puede mostrar en kilos.
      if (!porClave.has(clave)) porClave.set(clave, { clave, nombre: ej.nombre, codigo: ej.codigo || "", unidad: unidadDe(ej), ids: [] });
      const g = porClave.get(clave);
      if (!g.ids.includes(ej.id)) g.ids.push(ej.id);
    });
    return [...porClave.values()];
  })();

  const historialUnido = (ids) =>
    ids
      .flatMap((id) => histData[id] || [])
      .filter((h) => h.fecha && Number(h.peso) > 0)
      .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));

  // Máximo histórico + fecha en que se alcanzó POR PRIMERA VEZ (si hay
  // empates en el valor máximo, se queda con la fecha más vieja).
  const maxDe = (hist) => {
    let max = 0, fecha = null;
    hist.forEach((h) => {
      if (Number(h.peso) > max) { max = Number(h.peso); fecha = h.fecha; }
    });
    return { max, fecha };
  };

  if (!al) return <div style={{ ...card, padding: 24, textAlign: "center", color: S.gray, fontSize: 13 }}>Seleccioná un alumno desde Dashboard</div>;
  return (
    <div>
      {" "}
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
        Historial de pesos máximos — {al.nombre}
      </div>{" "}
      <div style={{ fontSize: 11, color: S.lgray, marginBottom: 12 }}>
        Peso máximo por ejercicio (unifica todos los días asignados)
      </div>{" "}
      {grupos.length === 0 && (
        <div style={{ ...card, padding: 24, textAlign: "center", color: S.gray, fontSize: 13 }}>Sin ejercicios de Principales asignados</div>
      )}
      {grupos.map((g) => {
        const hist = historialUnido(g.ids);
        const { max, fecha } = maxDe(hist);
        const isOpen = selKey === g.clave;
        return (
          <div key={g.clave} style={{ ...card, marginBottom: 8, overflow: "hidden" }}>
            {" "}
            <div
              onClick={() => setSelKey(isOpen ? null : g.clave)}
              style={{
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                gap: 10,
              }}
            >
              {" "}
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {g.codigo && (
                  <span style={{ color: S.gray, fontSize: 14, fontWeight: 800, letterSpacing: 0.5, background: S.card2, border: "1px solid " + S.border, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>
                    {g.codigo}
                  </span>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: S.white, fontWeight: 600, fontSize: 13 }}>{g.nombre}</div>
                  <div style={{ color: S.gray, fontSize: 15, marginTop: 3 }}>
                    {max > 0 ? (
                      <span>
                        <span style={{ color: S.green, fontWeight: 700 }}>{max} {SUFIJO[g.unidad]}</span> máximo · {fecha} · {hist.length} registro{hist.length === 1 ? "" : "s"}
                      </span>
                    ) : (
                      "Sin registros"
                    )}
                  </div>
                </div>
              </div>{" "}
              <div style={{ color: S.gray, flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</div>{" "}
            </div>{" "}
            {isOpen && hist.length > 0 && (
              <div style={{ borderTop: "1px solid " + S.border, padding: 14 }}>
                {" "}
                <div style={{ marginBottom: 12 }}>
                  <MiniChart data={hist} />
                </div>{" "}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  {" "}
                  <thead>
                    <tr style={{ background: S.card2 }}>
                      <th style={{ padding: "6px 10px", color: S.gray, textAlign: "left" }}>Fecha</th>
                      <th style={{ padding: "6px 10px", color: S.gray, textAlign: "right" }}>Peso</th>
                    </tr>
                  </thead>{" "}
                  <tbody>
                    {[...hist].reverse().map((h, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid " + S.border }}>
                        <td style={{ padding: "6px 10px", color: S.gray }}>{h.fecha}</td>
                        <td style={{ padding: "6px 10px", color: h.peso === max ? S.green : S.white, fontWeight: 700, textAlign: "right" }}>
                          {h.peso} {SUFIJO[g.unidad]}{h.peso === max ? <Trophy size={13} style={{ verticalAlign: "-2px", marginLeft: 4 }} /> : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>{" "}
                </table>{" "}
              </div>
            )}{" "}
            {isOpen && hist.length === 0 && (
              <div
                style={{
                  borderTop: "1px solid " + S.border,
                  padding: 14,
                  textAlign: "center",
                  color: S.lgray,
                  fontSize: 12,
                }}
              >
                Sin registros
              </div>
            )}{" "}
          </div>
        );
      })}{" "}
    </div>
  );
}
