import { useState } from "react";
import { FotoAlumno } from "../components/FotoAlumno.jsx";
import { GlobalStyles } from "../components/GlobalStyles.jsx";
import ResumenPlanModal from "../components/ResumenPlanModal.jsx";
import SwipeToConfirm from "../components/SwipeToConfirm.jsx";
import { FONT_BODY, FONT_DISPLAY, S, TAP, TS, eyebrow } from "../utils/theme.js";

// ── PANTALLA BIENVENIDA (rediseño ronda 11, saludo por género ronda 12) ──
// Ya NO lleva logo/ícono (ni girando ni estático) — arranca directo con la
// foto del alumno. Género vive en rm.genero ('M'/'F', ronda 12 — mismo
// patrón sin-migración que movilidad_default/secciones_config, editable
// desde el admin en alta y edición de alumno); sin setear usa el fallback
// neutro "¡Bienvenido/a!" de siempre.
export function Bienvenida({ alumno, plan, semanaData, semanaActual, onContinuar, onIrADia, onIrAPreparacion, biblioteca }) {
  const [cargando, setCargando] = useState(false);
  // 2026-07-31, pedido de Lucas: flujo en 2 pasos — primero elegir el día,
  // recién ahí se revela el plan de ese día. `diaElegido` es local (no
  // navega todavía); el ENTRENAR final es el que efectivamente entra.
  const [diaElegido, setDiaElegido] = useState(null);
  const [showResumen, setShowResumen] = useState(false);
  const primerNombre = (alumno.nombre || "").trim().split(/\s+/)[0] || alumno.nombre;
  const pl = (n, singular, plural) => (Number(n) === 1 ? singular : plural);
  const genero = alumno.rm?.genero;
  const saludo = genero === "M" ? "Bienvenido" : genero === "F" ? "Bienvenida" : "Hola";
  // ¿La semana tiene carga real cargada? Un valor vacío, nulo o "-" no es
  // un número: si no lo hay, no se dibuja la ficha (ver estado vacío abajo).
  const nOk = (v) => v !== null && v !== undefined && String(v).trim() !== "" && String(v).trim() !== "-" && !Number.isNaN(Number(v));
  const hayCarga = !!semanaData && nOk(semanaData.series) && nOk(semanaData.reps);
  // BUG (ronda 12): acá se leía plan.dias (los sub-días DENTRO de un plan —
  // "Sesion", o "Día 1"/"Día 2"/"Día 3" en un PPL) en vez de los días de la
  // SEMANA que el alumno realmente entrena (Lunes/Martes/...). Con un plan
  // de un solo día siempre decía "Entrenás los: Sesion". Los días reales son
  // los mismos que se ven en pill arriba de la ficha del alumno en el admin:
  // alumno.horarios (ver AdminPanel, sección "Días de entrenamiento").
  const ORDEN_DIAS_SEM = { Lunes: 1, Martes: 2, Miercoles: 3, Jueves: 4, Viernes: 5, Sabado: 6, Domingo: 7 };
  const diasPlan = [...(alumno.horarios || [])]
    .map((h) => h.dia)
    .filter(Boolean)
    .sort((a, b) => (ORDEN_DIAS_SEM[a] || 9) - (ORDEN_DIAS_SEM[b] || 9));
  // 2026-07-31 — una vez elegido el día, buscamos SU plan específico (cada
  // día de semana puede ser un alumno_plan separado) para mostrar/resumir
  // el de ESE día, no siempre el de "hoy" (`plan`, que sigue de fallback).
  const norm = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const planElegido = diaElegido ? (alumno.planes || []).find((p) => norm(p.dia_semana) === norm(diaElegido)) || plan : plan;
  const diaDelPlanElegido = planElegido?.dias?.[0] || null;
  return (
    <>
      {" "}
      <GlobalStyles />{" "}
      <div
        style={{
          minHeight: "100vh",
          background: S.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "36px 24px 28px",
          fontFamily: "inherit",
        }}
      >
        {/* 1. Foto del alumno — al doble de grande que antes (72px → 144px),
            ocupando el lugar donde antes iba el logo. */}
        <div className="di-fade" style={{ display: "flex", justifyContent: "center" }}>
          <FotoAlumno foto={alumno.foto} size={144} />
        </div>

        {/* 2. Saludo al doble de grande (13px → 26px) + 3. primer nombre solo */}
        <div className="di-slide" style={{ textAlign: "center", width: "100%", maxWidth: 360, marginTop: 18 }}>
          {/* Auditoría 2026-07-30 — jerarquía invertida: el saludo pesaba más
              que la persona. Manda el nombre; el saludo pasa a kicker.
              El nombre estaba en verde (#46a758), color prohibido por el
              Brand Kit v1.0 fuera de un estado real. */}
          <div style={{ ...eyebrow, textAlign: "center" }}>{saludo}</div>
          <div style={{ color: S.white, fontWeight: 900, fontSize: 34, lineHeight: 1.05, marginTop: 6, fontFamily: FONT_DISPLAY }}>{primerNombre}</div>
        </div>

        <div
          className="di-slide"
          style={{ marginTop: 14, textAlign: "center", marginBottom: 26, animationDelay: "0.08s", width: "100%", maxWidth: 360 }}
        >
          {/* 2026-07-31 — Lucas: "Estás en la semana X..." en vez de
              "Semana X de tu plan..." — misma info, mejor redactada. */}
          <div style={{ color: S.gray, fontSize: TS.label }}>Estás en la semana {semanaActual} de tu plan de entrenamiento</div>

          {/* 2026-07-31, pedido de Lucas: flujo en 2 pasos. Primero elige el
              día que va a entrenar; recién ahí se revela el plan de ESE día
              (antes se mostraba todo junto, sin preguntar). */}
          {/* 2026-07-31 — Lucas: "cuando elijas que día vas a entrenar que
              no desaparezca lo que elegiste, que sigan los días y el que
              elegiste en más claro, que lo puedas cambiar ahí en el
              momento" — las pills quedan SIEMPRE visibles (antes se
              reemplazaban enteras por el bloque de info al elegir), con el
              día activo resaltado; ya no hace falta un link separado para
              "elegir otro día", las pills mismas cumplen esa función. */}
          {diasPlan.length > 0 && (
            <div style={{ marginTop: 34 }}>
              <div style={{ color: S.white, fontWeight: 800, fontSize: TS.lead, marginBottom: 14 }}>
                ¿Qué día vas a entrenar hoy?
              </div>
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
                {diasPlan.map((d, i) => {
                  const planDia = (alumno.planes || []).find((p) => norm(p.dia_semana) === norm(d));
                  const activo = norm(diaElegido) === norm(d);
                  return (
                    <button
                      key={i}
                      onClick={() => setDiaElegido(d)}
                      title={`Elegir ${d}`}
                      style={{
                        background: activo ? S.white : S.card,
                        border: "1px solid " + (activo ? S.white : S.border),
                        borderRadius: 14,
                        padding: "9px 16px",
                        minHeight: TAP,
                        color: activo ? S.bg : S.white,
                        cursor: "pointer",
                        fontFamily: FONT_BODY,
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: TS.chip, fontWeight: 700 }}>{d}</div>
                      <div style={{ fontSize: 11, color: activo ? S.bg : S.gray, marginTop: 2, fontWeight: 600, opacity: activo ? 0.7 : 1 }}>Día {i + 1}</div>
                      {planDia?.nombre && (
                        <div style={{ fontSize: 11, color: activo ? S.bg : S.lgray, marginTop: 1, opacity: activo ? 0.7 : 1 }}>{planDia.nombre}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {diaElegido && (
            <div style={{ marginTop: 28 }}>
              {/* Lucas: "plan de hoy - que siempre diga plan de hoy nada más" */}
              <div style={{ ...eyebrow, textAlign: "center" }}>Plan de hoy</div>
              {/* Lucas: "al inves de ir a preparacion - Entrada en calor" */}
              {onIrAPreparacion && (
                <button
                  onClick={onIrAPreparacion}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 16,
                    background: "transparent",
                    border: "1px solid " + S.border2,
                    borderRadius: 20,
                    padding: "8px 16px",
                    color: S.lgray,
                    fontSize: TS.chip,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: FONT_BODY,
                  }}
                >
                  Entrada en calor <span style={{ fontSize: 14 }}>›</span>
                </button>
              )}
              {/* 2026-07-31, pedido de Lucas: "+" y abajo, línea por línea:
                  series por repeticiones / al X% de intensidad máxima / de
                  los N ejercicios — antes iba todo junto en un párrafo. */}
              {(() => {
                const semDia = (planElegido?.periodizacion || []).find((p) => p.semana === semanaActual) || (planElegido?.periodizacion || [])[0] || semanaData;
                const okDia = semDia && nOk(semDia.series) && nOk(semDia.reps);
                const cantEj = (diaDelPlanElegido?.ejercicios || []).length;
                if (!okDia) {
                  return (
                    <div style={{ marginTop: 14, color: S.gray, fontSize: TS.ui, lineHeight: 1.5, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>
                      Todavía no tenés la carga de esta semana cargada. Entrá igual: el plan del día está abajo.
                    </div>
                  );
                }
                return (
                  <div style={{ marginTop: 14, textAlign: "center" }}>
                    <div style={{ color: S.gray, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>+</div>
                    <div style={{ color: S.white, fontSize: TS.ui, fontWeight: 700, lineHeight: 1.6 }}>
                      {semDia.series} {pl(semDia.series, "serie", "series")} por {semDia.reps} {pl(semDia.reps, "repetición", "repeticiones")}
                    </div>
                    {semDia.intensidad && (
                      <div style={{ color: S.white, fontSize: TS.ui, fontWeight: 700, lineHeight: 1.6 }}>
                        al {semDia.intensidad} de tu intensidad máxima
                      </div>
                    )}
                    {cantEj > 0 && (
                      <div style={{ color: S.gray, fontSize: TS.ui, lineHeight: 1.6 }}>de los {cantEj} {pl(cantEj, "ejercicio", "ejercicios")} principales</div>
                    )}
                  </div>
                );
              })()}
              {/* Lucas: "ejercicios principales - linkeado al resumen del
                  plan" — al final del bloque, no antes de las estadísticas. */}
              <button
                onClick={() => setShowResumen(true)}
                disabled={!diaDelPlanElegido}
                style={{ display: "block", width: "100%", background: "transparent", border: "none", color: S.white, fontWeight: 800, fontSize: TS.lead, marginTop: 18, padding: 0, cursor: diaDelPlanElegido ? "pointer" : "default", textDecoration: diaDelPlanElegido ? "underline" : "none" }}
              >
                Ejercicios principales
              </button>
            </div>
          )}
        </div>

        {/* 2026-07-31, pedido de Lucas: resumen del plan del día elegido —
            mismo modal compartido que en Principales. */}
        {showResumen && diaDelPlanElegido && (
          <ResumenPlanModal plan={planElegido} dia={diaDelPlanElegido} rm={alumno.rm} onClose={() => setShowResumen(false)} />
        )}

        {/* 8. Botón final ENTRENAR — pedido de Lucas: "que la barra la
            tengas que presionar a la izquierda y arrastrar a la derecha y
            que se llene de rojo" — swipe-to-confirm en vez de tap simple.
            Si ya eligió un día, entra directo a ESE día; si no, al
            comportamiento default (hoy). */}
        <div className="di-slide" style={{ animationDelay: "0.16s", display: "flex", justifyContent: "center", width: "100%" }}>
          <SwipeToConfirm
            confirming={cargando}
            onConfirm={() => {
              if (cargando) return;
              setCargando(true);
              setTimeout(() => (diaElegido && onIrADia ? onIrADia(diaElegido) : onContinuar()), 500);
            }}
          />
        </div>
      </div>{" "}
    </>
  );
}
