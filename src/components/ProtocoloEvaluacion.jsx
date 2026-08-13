import { useState, useEffect } from "react";
import { ClipboardList, Check, Inbox, Calendar, Trash2 } from "lucide-react";
import { S, card, inp, TS, TAP } from "../utils/theme.js";
import { hoy } from "../utils/helpers.js";
import {
  saveEvaluacion,
  cargarEvaluaciones,
  eliminarEvaluacion,
} from "../../services/supabase.js";

// Protocolo de evaluación simple por alumno: escalas 1-5 + opciones para marcar.
// Espejo del sector de bioimpedancia (Seccion + Form + Historial), conectado a Supabase.
// Encuadra las necesidades de evaluación de Integral sin complejidad: capacidades,
// calidad de movimiento, banderas de seguridad, nivel y objetivo.

// Referencia de qué se evalúa (labels + ayuda del 1 al 5).
const CAPACIDADES = [
  ["fuerza", "Fuerza"],
  ["resistencia", "Resistencia"],
  ["movilidad", "Movilidad / flexibilidad"],
  ["equilibrio", "Equilibrio / estabilidad"],
  ["coordinacion", "Coordinación / técnica"],
];
const MOVIMIENTO = [
  ["sentadilla", "Sentadilla"],
  ["empuje", "Empuje / hombros"],
  ["bisagra", "Bisagra de cadera"],
  ["core", "Core / plancha"],
];
const NIVELES = ["Principiante", "Intermedio", "Avanzado"];
const OBJETIVOS = [
  ["salud", "Salud general"],
  ["bajar_grasa", "Bajar grasa"],
  ["ganar_musculo", "Ganar músculo"],
  ["rendimiento", "Rendimiento BJJ"],
  ["rehabilitacion", "Rehabilitación"],
];
const SEGURIDAD = [
  ["dolor", "Dolor actual en algún movimiento"],
  ["lesion", "Lesión o cirugía previa"],
  ["condicion_medica", "Condición médica / medicación"],
  ["apto_intenso", "Apto para esfuerzo intenso"],
];

const nivelClave = (n) => (n || "").toLowerCase();

// ── Sección completa ──────────────────────────────────────────────────
export function ProtocoloEvaluacionSeccion({ alumnoId, alumno, showToast }) {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!alumnoId) return;
    setCargando(true);
    cargarEvaluaciones(alumnoId).then((d) => {
      setRegistros(d);
      setCargando(false);
    });
  }, [alumnoId]);

  const guardar = async (datos) => {
    setGuardando(true);
    try {
      const nuevo = await saveEvaluacion(alumnoId, datos);
      setRegistros((prev) => [nuevo, ...prev]);
      showToast && showToast("Evaluación guardada");
      return true;
    } catch (e) {
      console.error("[ProtocoloEvaluacion] Error guardando:", e);
      showToast && showToast("Error al guardar la evaluación");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (ev) => {
    if (!window.confirm(`¿Eliminar la evaluación del ${ev.fecha}?`)) return;
    try {
      await eliminarEvaluacion(ev.id);
      setRegistros((prev) => prev.filter((r) => r.id !== ev.id));
      showToast && showToast("Evaluación eliminada");
    } catch (e) {
      showToast && showToast("Error al eliminar");
    }
  };

  return (
    <div>
      <ProtocoloEvaluacionForm alumno={alumno} onGuardar={guardar} guardando={guardando} />
      <div style={{ fontSize: 13, color: S.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ClipboardList size={16} strokeWidth={2} />Evaluaciones registradas</span>
      </div>
      {cargando ? (
        <div style={{ color: S.gray, fontSize: TS.chip, padding: 16, textAlign: "center" }}>Cargando...</div>
      ) : (
        <ProtocoloEvaluacionHistorial registros={registros} onEliminar={eliminar} />
      )}
    </div>
  );
}

// ── Selector de escala 1 a 5 ──────────────────────────────────────────
// 2026-08-13 (auditoría de uso): los 45 botones de puntaje medían 27x33px —
// el 46% del área táctil mínima (44x44) y con 4px entre uno y otro. Esta es
// la pantalla que el profe llena de PIE durante la clase: cada toque errado
// escribía un puntaje que no era, en la evaluación de un alumno. Ahora cada
// botón declara el piso de 44x44 y el gap sube a 8px.
// `flexWrap` + `flex: "1 1 44px"`: con los 5 botones a ancho completo entran
// holgados a ~57px en 375px, y cuando el ancho útil se achica (zoom del
// sistema al 200% = viewport efectivo de ~187px) envuelven a dos filas en vez
// de desbordar la pantalla. Nunca se achican por debajo de 44.
function Escala({ valor, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const activo = valor === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(activo ? null : n)}
            style={{
              flex: "1 1 44px",
              minWidth: TAP,
              minHeight: TAP,
              background: activo ? S.white : S.card2,
              color: activo ? S.bg : S.gray,
              border: "1px solid " + (activo ? S.white : S.border),
              borderRadius: 8,
              padding: "8px 0",
              fontSize: TS.ui,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

// ── Formulario ────────────────────────────────────────────────────────
export function ProtocoloEvaluacionForm({ alumno, onGuardar, guardando = false }) {
  const estadoInicial = () => ({
    fecha: hoy(),
    evaluador: "",
    nivel: "",
    objetivo: "",
    capacidades: {},
    movimiento: {},
    seguridad: {},
    observaciones: "",
    plan_sugerido: "",
  });
  const [f, setF] = useState(estadoInicial);

  const setCampo = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setEscala = (grupo, k) => (val) =>
    setF((p) => ({ ...p, [grupo]: { ...p[grupo], [k]: val } }));
  const toggleSeg = (k) =>
    setF((p) => ({ ...p, seguridad: { ...p.seguridad, [k]: !p.seguridad[k] } }));

  // 2026-08-13 (auditoría de uso): este formulario tenía 29 textos por debajo
  // de 12px, incluidos los nombres de los campos que hay que completar. Piso
  // de 13px para rótulos y 15px (TS.chip) para todo lo que se toca o se lee
  // para decidir — el mismo piso que ya declara el sistema de diseño.
  const label = (t) => (
    <div style={{ fontSize: 13, color: S.gray, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {t}
    </div>
  );
  const subtitulo = (t) => (
    <div style={{ fontSize: 13, color: S.gray, textTransform: "uppercase", letterSpacing: 1, margin: "20px 0 10px" }}>
      {t}
    </div>
  );
  // El nombre de la capacidad va ARRIBA de la escala, no al lado: con los
  // botones a 44px de mínimo, una fila de dos columnas dejaba ~180px para
  // cinco botones y desbordaba la pantalla. A ancho completo entran los cinco
  // en una línea sin apretarse.
  const filaEscala = (grupo, k, txt) => (
    <div key={k} style={{ marginBottom: 14 }}>
      <div style={{ fontSize: TS.chip, color: S.white, marginBottom: 6 }}>{txt}</div>
      <Escala valor={f[grupo][k] || null} onChange={setEscala(grupo, k)} />
    </div>
  );

  const guardar = async () => {
    const ok = await onGuardar(f);
    if (ok) setF(estadoInicial());
  };

  return (
    <div style={{ ...card, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: S.gray, textTransform: "uppercase", marginBottom: 4, letterSpacing: 1 }}>
        Nueva evaluación
      </div>

      {/* Fecha + evaluador — auto-fit en vez de dos columnas fijas: con el
          zoom del sistema al 200% las dos columnas de ~80px no alcanzaban ni
          para el input de fecha (el navegador le da un ancho mínimo propio) y
          "Evaluador" quedaba 193px fuera de la pantalla. Debajo de ~150px por
          columna, la grilla pasa sola a una sola columna. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 8, marginTop: 10 }}>
        {/* minWidth:0 en la celda: sin esto una celda de grilla no baja del
            ancho mínimo de su contenido y el input empuja la fila hacia
            afuera de la pantalla en vez de encogerse. */}
        <div style={{ minWidth: 0 }}>
          {label("Fecha")}
          <input type="date" value={f.fecha} onChange={setCampo("fecha")} style={{ ...inp, minWidth: 0 }} />
        </div>
        <div style={{ minWidth: 0 }}>
          {label("Evaluador")}
          <input type="text" placeholder="Ari / Lucas" value={f.evaluador} onChange={setCampo("evaluador")} style={{ ...inp, minWidth: 0 }} />
        </div>
      </div>

      {/* Nivel general */}
      {subtitulo("Nivel general")}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {NIVELES.map((n) => {
          const activo = f.nivel === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setF((p) => ({ ...p, nivel: activo ? "" : n }))}
              style={{
                flex: "1 1 92px",
                minHeight: TAP,
                background: activo ? S.white : S.card2,
                color: activo ? S.bg : S.gray,
                border: "1px solid " + (activo ? S.white : S.border),
                borderRadius: 8,
                padding: "9px 6px",
                fontSize: TS.chip,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Objetivo principal */}
      {subtitulo("Objetivo principal")}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {OBJETIVOS.map(([k, txt]) => {
          const activo = f.objetivo === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setF((p) => ({ ...p, objetivo: activo ? "" : k }))}
              style={{
                background: activo ? S.white : S.card2,
                color: activo ? S.bg : S.gray,
                border: "1px solid " + (activo ? S.white : S.border),
                borderRadius: 22,
                padding: "10px 16px",
                minHeight: TAP,
                maxWidth: "100%",
                fontSize: TS.chip,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {txt}
            </button>
          );
        })}
      </div>

      {/* Capacidades físicas 1-5 */}
      {subtitulo("Capacidades físicas · 1 (bajo) a 5 (alto)")}
      {CAPACIDADES.map(([k, txt]) => filaEscala("capacidades", k, txt))}

      {/* Calidad de movimiento 1-5 */}
      {subtitulo("Calidad de movimiento · 1 (a corregir) a 5 (perfecto)")}
      {MOVIMIENTO.map(([k, txt]) => filaEscala("movimiento", k, txt))}

      {/* Seguridad */}
      {subtitulo("Seguridad · marcá lo que corresponda")}
      <div style={{ display: "grid", gap: 6 }}>
        {SEGURIDAD.map(([k, txt]) => {
          const activo = !!f.seguridad[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggleSeg(k)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: activo ? S.card3 || S.card2 : S.card2,
                border: "1px solid " + (activo ? S.white : S.border),
                borderRadius: 8,
                padding: "12px",
                minHeight: TAP,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: "1px solid " + (activo ? S.white : S.border),
                background: activo ? S.white : "transparent",
                color: S.bg, fontSize: 12, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{activo ? <Check size={14} strokeWidth={2} /> : ""}</span>
              {/* minWidth:0 + overflowWrap: con el zoom al 200% estos textos
                  no podían envolver y se salían 18px de la tarjeta. */}
              <span style={{ fontSize: TS.chip, color: S.white, minWidth: 0, overflowWrap: "anywhere" }}>{txt}</span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 10 }}>
        {label("Detalle de seguridad (lesión, medicación, dolor...)")}
        <textarea
          value={f.seguridad.detalle || ""}
          onChange={(e) => setF((p) => ({ ...p, seguridad: { ...p.seguridad, detalle: e.target.value } }))}
          rows={2}
          placeholder="Ej: molestia en hombro derecho al press; toma medicación para la presión."
          style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {/* Observaciones y plan */}
      {subtitulo("Notas")}
      {label("Observaciones")}
      <textarea
        value={f.observaciones}
        onChange={setCampo("observaciones")}
        rows={3}
        placeholder="Cómo se movió, qué se destacó, qué mirar la próxima."
        style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
      />
      <div style={{ marginTop: 10 }}>
        {label("Plan sugerido")}
        <textarea
          value={f.plan_sugerido}
          onChange={setCampo("plan_sugerido")}
          rows={2}
          placeholder="Ej: base de movilidad de cadera + fuerza general; sumar core."
          style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <button
        onClick={guardar}
        disabled={guardando}
        style={{
          width: "100%",
          background: guardando ? S.card2 : S.white,
          color: guardando ? S.gray : S.bg,
          border: "none",
          borderRadius: 8,
          padding: 14,
          minHeight: TAP,
          fontSize: TS.ui,
          fontWeight: 700,
          cursor: guardando ? "default" : "pointer",
          marginTop: 16,
          letterSpacing: 0.5,
        }}
      >
        {guardando ? "GUARDANDO..." : "GUARDAR EVALUACIÓN"}
      </button>
    </div>
  );
}

// ── Historial ─────────────────────────────────────────────────────────
export function ProtocoloEvaluacionHistorial({ registros, onEliminar }) {
  if (!registros || registros.length === 0) {
    return (
      <div style={{ ...card, padding: "40px 16px", textAlign: "center" }}>
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", color: S.gray }}><Inbox size={24} strokeWidth={2} /></div>
        <div style={{ color: S.gray, fontSize: TS.chip }}>Sin evaluaciones registradas aún</div>
      </div>
    );
  }
  const objetivoTxt = (k) => (OBJETIVOS.find(([kk]) => kk === k) || [, k])[1];

  const bloqueEscalas = (titulo, defs, valores) => {
    const items = defs.filter(([k]) => valores && valores[k] != null);
    if (items.length === 0) return null;
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 13, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{titulo}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {items.map(([k, txt]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: S.card2, borderRadius: 6, padding: "6px 10px" }}>
              <span style={{ fontSize: 13, color: S.lgray }}>{txt}</span>
              <span style={{ fontSize: 13, color: S.white, fontWeight: 800 }}>{valores[k]}<span style={{ fontSize: 13, color: S.gray }}>/5</span></span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {registros.map((ev) => {
        const d = ev.datos || {};
        const seg = d.seguridad || {};
        const segMarcadas = SEGURIDAD.filter(([k]) => seg[k]);
        return (
          <div key={ev.id} style={{ ...card, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: S.lgray, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Calendar size={14} strokeWidth={2} />{ev.fecha}{ev.evaluador ? ` · ${ev.evaluador}` : ""}
              </div>
              {onEliminar && (
                <button
                  onClick={() => onEliminar(ev)}
                  style={{ background: "transparent", color: S.red, border: "1px solid " + S.red, borderRadius: 8, padding: "2px 8px", minWidth: TAP, minHeight: TAP, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              )}
            </div>

            {(ev.nivel || ev.objetivo) && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                {ev.nivel && (
                  <span style={{ background: S.card2, color: S.white, borderRadius: 20, padding: "3px 10px", fontSize: 13, fontWeight: 700 }}>
                    {ev.nivel}
                  </span>
                )}
                {ev.objetivo && (
                  <span style={{ background: S.card2, color: S.green, borderRadius: 20, padding: "3px 10px", fontSize: 13, fontWeight: 700 }}>
                    {objetivoTxt(ev.objetivo)}
                  </span>
                )}
              </div>
            )}

            {bloqueEscalas("Capacidades", CAPACIDADES, d.capacidades)}
            {bloqueEscalas("Movimiento", MOVIMIENTO, d.movimiento)}

            {(segMarcadas.length > 0 || seg.detalle) && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 13, color: S.yellow || S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Seguridad</div>
                {segMarcadas.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: seg.detalle ? 6 : 0 }}>
                    {segMarcadas.map(([k, txt]) => (
                      <span key={k} style={{ background: S.card2, color: S.white, borderRadius: 6, padding: "4px 9px", fontSize: 13 }}>• {txt}</span>
                    ))}
                  </div>
                )}
                {seg.detalle && <div style={{ color: S.white, fontSize: TS.chip, lineHeight: 1.5 }}>{seg.detalle}</div>}
              </div>
            )}

            {d.observaciones && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 13, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Observaciones</div>
                <div style={{ color: S.white, fontSize: TS.chip, lineHeight: 1.5 }}>{d.observaciones}</div>
              </div>
            )}
            {d.plan_sugerido && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, color: S.green, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Plan sugerido</div>
                <div style={{ color: S.white, fontSize: TS.chip, lineHeight: 1.5 }}>{d.plan_sugerido}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
