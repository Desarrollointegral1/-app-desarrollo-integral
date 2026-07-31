import { useState, useEffect } from "react";
import { S, card } from "../utils/theme.js";
import { cargarMusculosCatalogo } from "../../services/supabase.js";

// 2026-07-31, pedido de Lucas: resumen del plan del día — se abre desde
// Principales (tocando el nombre del plan) y desde la pantalla de
// Bienvenida (tocando "Ejercicios principales"), por eso vive en su propio
// archivo compartido en vez de duplicarse en los dos lugares.
// Modal CENTRADO en pantalla (no bottom-sheet): Lucas pidió explícitamente
// que "abra bien en la pantalla, no quede abajo escondida" — con
// position:fixed + inset:0 + alignItems:"center" queda siempre visible
// entero sin importar el scroll de la página de atrás.
const norm = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function grupoMuscularDe(nombreEjercicio, catalogo) {
  if (!catalogo || !catalogo.length) return "";
  const n = norm(nombreEjercicio);
  const entry =
    catalogo.find((b) => norm(b.nombre_es) === n) ||
    catalogo.find((b) => n.includes(norm(b.nombre_es)) || norm(b.nombre_es).includes(n));
  if (!entry) return "";
  return entry.musculo_default || entry.tag_default || (entry.tags || [])[0] || entry.muscle_group_es || entry.target_es || "";
}

export default function ResumenPlanModal({ plan, dia, onClose }) {
  // 2026-07-31 — el grupo muscular vive en catalogo_ejercicios, una tabla
  // aparte de la biblioteca curada que ya carga la app al loguear (esa no
  // tiene ese campo). Se pide acá, on-demand, solo cuando se abre el modal
  // — no en el arranque de la app (son ~1300 filas).
  const [catalogo, setCatalogo] = useState(null);
  useEffect(() => {
    let vivo = true;
    cargarMusculosCatalogo().then((data) => { if (vivo) setCatalogo(data); });
    return () => { vivo = false; };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ ...card, width: "100%", maxWidth: 420, padding: "20px 18px", maxHeight: "82vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10 }}>
          <div style={{ color: S.white, fontWeight: 800, fontSize: 18, lineHeight: 1.3 }}>{dia?.subtitulo || "Tu plan"}</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: S.gray, fontSize: 22, cursor: "pointer", padding: 4, flexShrink: 0 }}>×</button>
        </div>

        {(dia?.ejercicios || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: S.gray, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Ejercicios</div>
            {(dia.ejercicios || []).map((ej, i) => {
              const grupo = catalogo ? grupoMuscularDe(ej.nombre, catalogo) : null;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: i > 0 ? "1px solid " + S.border : "none" }}>
                  <div style={{ color: S.white, fontSize: 14, fontWeight: 600 }}>{ej.nombre}</div>
                  {grupo ? (
                    <div style={{ color: S.gray, fontSize: 13, flexShrink: 0, marginLeft: 10 }}>{grupo}</div>
                  ) : catalogo === null ? (
                    <div style={{ color: S.border2, fontSize: 13, flexShrink: 0, marginLeft: 10 }}>…</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ color: S.gray, fontSize: 14, marginBottom: 14 }}>
          Progresión semana a semana: series, repeticiones e intensidad.
        </div>
        {(plan?.periodizacion || []).length === 0 ? (
          <div style={{ color: S.gray, fontSize: 14, textAlign: "center", padding: 16 }}>Sin periodización cargada todavía.</div>
        ) : (
          (plan.periodizacion || [])
            .slice()
            .sort((a, b) => (a.semana || 0) - (b.semana || 0))
            .map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i > 0 ? "1px solid " + S.border : "none" }}>
                <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>Semana {p.semana}</div>
                <div style={{ color: S.gray, fontSize: 14 }}>{p.series}x{p.reps}{p.intensidad ? " · " + p.intensidad : ""}</div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
