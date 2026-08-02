import { useState, useEffect } from "react";
import { S, card } from "../utils/theme.js";
import { cargarMusculosCatalogoCached } from "../../services/supabase.js";
import { RM_EJS } from "../utils/helpers.js";

// 2026-07-31, pedido de Lucas: resumen del plan del día — se abre desde
// Principales (tocando el nombre del plan) y desde la pantalla de
// Bienvenida (tocando "Ejercicios principales"), por eso vive en su propio
// archivo compartido en vez de duplicarse en los dos lugares.
// Modal CENTRADO en pantalla (no bottom-sheet): Lucas pidió explícitamente
// que "abra bien en la pantalla, no quede abajo escondida" — con
// position:fixed + inset:0 + alignItems:"center" queda siempre visible
// entero sin importar el scroll de la página de atrás.
const norm = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// 2026-07-31 — Lucas: "no puede decir otro músculo" (el fuzzy-match por
// nombre encontraba una fila parecida pero no la correcta — mostró
// "tríceps" para Press Militar en vez de "hombros"). Cada ejercicio del
// plan ya trae un `codigo` copiado de la biblioteca al agregarlo, y ese
// código matchea EXACTO contra `codigo_di` del catálogo (mismo valor, ver
// agregarDesdeCatalogo en supabase.js) — es la vía confiable. El nombre
// solo se usa de último recurso si el ejercicio no tiene código (cargado a
// mano, sin pasar por catálogo). `target_es` es el músculo PRINCIPAL en
// este dataset (secondary_muscles_es es el secundario) — se prioriza sobre
// musculo_default/tags, que pueden reflejar otra cosa.
function grupoMuscularDe(ejercicio, catalogo) {
  if (!catalogo || !catalogo.length) return "";
  const entry = ejercicio.codigo
    ? catalogo.find((b) => b.codigo_di === ejercicio.codigo)
    : null;
  const fallback = entry
    ? null
    : (() => {
        const n = norm(ejercicio.nombre);
        return catalogo.find((b) => norm(b.nombre_es) === n);
      })();
  const fila = entry || fallback;
  if (!fila) return "";
  return fila.target_es || fila.musculo_default || fila.tag_default || (fila.tags || [])[0] || fila.muscle_group_es || "";
}

export default function ResumenPlanModal({ plan, dia, rm, onClose }) {
  // 2026-07-31 — el grupo muscular vive en catalogo_ejercicios, una tabla
  // aparte de la biblioteca curada que ya carga la app al loguear (esa no
  // tiene ese campo). Se pide acá, on-demand, solo cuando se abre el modal
  // — no en el arranque de la app (son ~1300 filas).
  const [catalogo, setCatalogo] = useState(null);
  useEffect(() => {
    let vivo = true;
    cargarMusculosCatalogoCached().then((data) => { if (vivo) setCatalogo(data); });
    return () => { vivo = false; };
  }, []);

  // 2026-07-31 — Lucas: "en la parte de progresión semana a semana que en
  // el medio diga el peso que debería usar según el peso máximo registrado
  // y la intensidad. si todavía no tiene peso máximo que no diga nada pero
  // si tiene que haga el cálculo y aparezca." Mismo patrón de match
  // ejercicio→categoría de RM que ya usa PlanDelDia.jsx para "pesoSugerido"
  // (fuzzy por primera palabra del nombre) — acá se resuelve UNA vez con el
  // primer ejercicio del día que matchea alguna categoría con peso
  // registrado, y se reusa para cada fila de la periodización (cambia solo
  // la intensidad de esa semana).
  const rmDato = (() => {
    for (const ej of dia?.ejercicios || []) {
      const rmKey = RM_EJS.find(
        (k) =>
          ej.nombre.toLowerCase().includes(k.toLowerCase().split(" ")[0]) ||
          k.toLowerCase().includes(ej.nombre.toLowerCase().split(" ")[0]),
      );
      const dato = rmKey && rm && rm[rmKey];
      if (dato && dato.peso > 0) return dato;
    }
    return null;
  })();
  const pesoSugeridoDe = (intensidad) => {
    if (!rmDato) return null;
    const pct = intensidad ? Number(String(intensidad).replace("%", "")) : null;
    return pct ? Math.round((rmDato.peso * pct) / 100) : null;
  };

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
              const grupo = catalogo ? grupoMuscularDe(ej, catalogo) : null;
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
            .map((p, i) => {
              const pesoSugerido = pesoSugeridoDe(p.intensidad);
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i > 0 ? "1px solid " + S.border : "none" }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>Semana {p.semana}</div>
                  {pesoSugerido ? (
                    <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>{pesoSugerido}kg</div>
                  ) : <div />}
                  <div style={{ color: S.gray, fontSize: 14 }}>{p.series}x{p.reps}{p.intensidad ? " · " + p.intensidad : ""}</div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
