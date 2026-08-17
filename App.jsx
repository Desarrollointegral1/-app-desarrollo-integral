import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, Ban, BarChart3, BookOpen, Calendar, Check, ClipboardList, Dumbbell, Eye, Film, Megaphone, Moon, NotebookPen, Pencil, Play, Power, RotateCcw, Settings, Stethoscope, Sun, Target, Trash2, TrendingUp, Trophy, X } from "lucide-react";
import { actualizarAdmin, actualizarEjercicioBibliotecaPorId, actualizarPlanAlumnoDias, actualizarRolAdmin, cambiarPINAlumno, cargarAlumnosArchivados, cargarBiblioteca, cargarBioimpedanciaCompleta, cargarCatalogoCached, cargarDatos, cargarFotos, cargarNovedades, cargarPesos, cargarPlanesXDia, cerrarSesionAuth, crearAdmin, crearAlumnoConPIN, crearNovedad, crearPlanAlumno, deleteAlumno, desactivarAdmin, eliminarNovedad, eliminarPlanDia, getPrepGlobales, guardarDatos, guardarEjercicioBiblioteca, guardarFotoAlumno, guardarPeriodizacionDia, listarAdmins, listarPeriodizacionesConNombres, listarPlanesPredeterminados, listarVariantesPlan, loginAdmin, loginConCodigo, payloadAlumno, propagarEjercicioATodos, renombrarPlanAlumno, restaurarAlumno, saveDailyAttendance, saveDailyWeight, subirMediaRehab, supabase, toggleNovedad } from "./services/supabase.js";
import { AlumnoBuscador } from "./src/components/AlumnoBuscador.jsx";
import { BarraEntrenador } from "./src/components/BarraEntrenador.jsx";
import CatalogoExplorer from "./src/components/CatalogoExplorer.jsx";
import CoachFlotante from "./src/components/CoachFlotante.jsx";
import DIWordmark from "./src/components/DIWordmark.jsx";
import { DiasEditor } from "./src/components/editores/DiasEditor.jsx";
import { EjercicioEditor } from "./src/components/editores/EjercicioEditor.jsx";
import { PeriodizacionEditor } from "./src/components/editores/PeriodizacionEditor.jsx";
import { PrepEditorAlumno } from "./src/components/editores/PrepEditorAlumno.jsx";
import { EntradaDiarioAdmin } from "./src/components/EntradaDiarioAdmin.jsx";
import { EstudioBioSeccion } from "./src/components/EstudioBio.jsx";
import { EvolucionCargas } from "./src/components/EvolucionCargas.jsx";
import { FechaRapida } from "./src/components/FechaRapida.jsx";
import { FotoAlumno } from "./src/components/FotoAlumno.jsx";
import { GifPicker } from "./src/components/GifPicker.jsx";
import { GlobalStyles } from "./src/components/GlobalStyles.jsx";
import { HeaderAlumno } from "./src/components/HeaderAlumno.jsx";
import { IconDock } from "./src/components/IconDock.jsx";
import { Logo3D } from "./src/components/Logo3D.jsx";
import MiniChart from "./src/components/MiniChart.jsx";
import PlanDelDia from "./src/components/PlanDelDia.jsx";
import { ProtocoloEvaluacionSeccion } from "./src/components/ProtocoloEvaluacion.jsx";
import PullToRefresh from "./src/components/PullToRefresh.jsx";
import { ResumenMensual } from "./src/components/ResumenMensual.jsx";
import ResumenPlanModal from "./src/components/ResumenPlanModal.jsx";
import { SelectorAlumnoEntrenador } from "./src/components/SelectorAlumnoEntrenador.jsx";
import SelectorDiasAlta from "./src/components/SelectorDiasAlta.jsx";
import SelectorPlanDia from "./src/components/SelectorPlanDia.jsx";
import { SkeletonCard } from "./src/components/Skeleton.jsx";
import SwipeToConfirm from "./src/components/SwipeToConfirm.jsx";
import { Toast } from "./src/components/Toast.jsx";
import { useDeshacer } from "./src/components/ToastDeshacer.jsx";
import VideosMovilidadAdmin from "./src/components/VideosMovilidadAdmin.jsx";
import { VideoUploadButton } from "./src/components/VideoUploadButton.jsx";
import VistaVideoAlumno from "./src/components/VistaVideoAlumno.jsx";
import { GIFS_DISPONIBLES, getEjercicioGif, getNombresPorGif } from "./src/utils/ejerciciosMedia.js";
import { ORDEN_DIAS, RM_EJS, calcularEdad, claveEjercicio, diasDeTodosLosPlanes, ejerciciosDeTodosLosPlanes, getSemanaActual, hoy, initH, initPesos, mesActual, registroAsistencia, uid, unirHistorialesPorEjercicio } from "./src/utils/helpers.js";
import { ICON_BLACK, ICON_BLACK_CROP, ICON_CROP, ICON_WHITE_CROP, aplicarIconosTema } from "./src/utils/iconos.js";
import { generarPDF } from "./src/utils/pdfGenerator.js";
import { NIVELES as NIVELES_PER, OBJETIVOS as OBJETIVOS_PER, clavePeriodizacion, conPeriodizacionDe, conPeriodizacionEditada, esPeriodizacionDiaPropia, esPeriodizacionPropia, etiquetaPeriodizacion, periodizacionDelDia, propagarPeriodizacion, refPeriodizacion, sinPeriodizacion, tienePeriodizacion } from "./src/utils/periodizacion.js";
import { pesoRepresentativo, setVuelta, vueltasCargadas, vueltasDe } from "./src/utils/pesos.js";
import { GRUPOS_MUSCULARES, clonarPlan, getPlantilla } from "./src/utils/planTemplates.js";
import { SIN_PLAN, agruparVariantes, etiquetaVariante, indexarCatalogo, planDeEleccion, varianteAPlan } from "./src/utils/planVariantes.js";
import { conPrepPropia, sinPrepPropia } from "./src/utils/preparacion.js";
import { FONT_BODY, FONT_BRAND, FONT_DISPLAY, S, TAP, TS, applyTheme, card, checkboxBox, checkboxWrap, chipN4, eyebrow, innerCard, inp, n4Track, segChip, segTrack, smallBtn, tabN1, useIsWide } from "./src/utils/theme.js";
import { SUFIJO, unidadDe } from "./src/utils/unidades.js";

// Re-export para dev/harness.jsx (banco de pruebas), que importa estos desde acá.
export { EjercicioEditor } from "./src/components/editores/EjercicioEditor.jsx";
export { DiasEditor } from "./src/components/editores/DiasEditor.jsx";
export { GlobalStyles } from "./src/components/GlobalStyles.jsx";

// PIN demasiado fácil (auditoría 2026-08-02): repetidos (0000..9999) o
// secuencias ascendentes/descendentes (1234, 4321, 2345...). Sube el piso
// real de seguridad más que casi cualquier otra cosa por lo barato que es.
const PIN_TRIVIAL = (p) => /^(\d)\1{3}$/.test(p) || "0123456789".includes(p) || "9876543210".includes(p);

const ALUMNOS_INIT = [];
// ── ASISTENCIA ────────────────────────────────────────────────────────
function Asistencia({ asistencia, onMarcar }) {
  const hoyStr = hoy();
  // Los registros pueden ser "YYYY-MM-DD" (viejos) o "YYYY-MM-DD HH:mm"
  // (nuevos, con hora) — comparar siempre solo la parte de fecha.
  const tieneDia = (d) => asistencia.some((x) => x.slice(0, 10) === d);
  const yaMarco = tieneDia(hoyStr);
  const [diaAnterior, setDiaAnterior] = useState("");
  const [showDiaAnterior, setShowDiaAnterior] = useState(false);
  const marcarDiaAnterior = () => {
    if (!diaAnterior || diaAnterior >= hoyStr) return;
    if (tieneDia(diaAnterior)) {
      alert("Ya marcaste ese día.");
      return;
    }
    onMarcar(diaAnterior);
    setDiaAnterior("");
    setShowDiaAnterior(false);
  };
  const mes = new Date();
  const diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1).getDay();
  const diasEnMes = Array.from({ length: diasMes }, (_, i) => {
    const d = new Date(mes.getFullYear(), mes.getMonth(), i + 1);
    return d.toISOString().split("T")[0];
  });
  const fueDias = asistencia.filter((d) => d.startsWith(mesActual().slice(0, 7))).length;
  const totalDias = diasEnMes.filter((d) => new Date(d) <= new Date()).length;
  const pct = totalDias > 0 ? Math.round((fueDias / totalDias) * 100) : 0;
  // Racha
  let racha = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    const ds = checkDate.toISOString().split("T")[0];
    if (tieneDia(ds)) {
      racha++;
    } else if (i > 0) break;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  const DIAS = ["D", "L", "M", "M", "J", "V", "S"];
  return (
    <div>
      {" "}
      {/* Stats */}{" "}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.green, fontWeight: 900, fontSize: 28 }}>{racha}</div>{" "}
          <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1, marginTop: 2 }}>RACHA DIAS</div>{" "}
        </div>{" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{fueDias}</div>{" "}
          <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1, marginTop: 2 }}>ESTE MES</div>{" "}
        </div>{" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{pct}%</div>{" "}
          <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1, marginTop: 2 }}>ASISTENCIA</div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Boton marcar */}{" "}
      <button
        onClick={() => !yaMarco && onMarcar(hoyStr)}
        className={yaMarco ? "di-pulse" : ""}
        style={{
          width: "100%",
          background: yaMarco ? "#0d1f0d" : S.white,
          color: yaMarco ? S.green : S.bg,
          border: yaMarco ? "1px solid " + S.green : "none",
          borderRadius: 10,
          padding: "14px",
          fontSize: 14,
          fontWeight: 900,
          cursor: yaMarco ? "default" : "pointer",
          marginBottom: 16,
          letterSpacing: 1,
          transition: "all 0.3s",
        }}
      >
        {" "}
        {yaMarco ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={14} />ASISTENCIA MARCADA HOY</span> : "MARCAR ASISTENCIA HOY"}{" "}
      </button>{" "}
      {/* Marcar día anterior */}{" "}
      {!showDiaAnterior ? (
        <button
          onClick={() => setShowDiaAnterior(true)}
          style={{
            width: "100%",
            background: "transparent",
            color: S.gray,
            border: "1px solid " + S.border,
            borderRadius: 8,
            padding: "10px",
            fontSize: 12,
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          {" "}
          + Marcar un día anterior{" "}
        </button>
      ) : (
        <div style={{ ...card, padding: 12, marginBottom: 16 }}>
          {" "}
          <div style={{ fontSize: 12, color: S.gray, marginBottom: 8 }}>¿Qué día faltaste de registrar?</div>{" "}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {" "}
            <input
              type="date"
              value={diaAnterior}
              max={hoyStr}
              onChange={(e) => setDiaAnterior(e.target.value)}
              style={{ ...inp, flex: 1 }}
            />{" "}
            <button
              onClick={marcarDiaAnterior}
              disabled={!diaAnterior || diaAnterior >= hoyStr}
              style={{
                background: S.white,
                color: S.bg,
                border: "none",
                borderRadius: 6,
                padding: "9px 14px",
                fontWeight: 900,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Marcar
            </button>{" "}
            <button
              onClick={() => {
                setShowDiaAnterior(false);
                setDiaAnterior("");
              }}
              style={{
                background: "transparent",
                color: S.gray,
                border: "1px solid " + S.border,
                borderRadius: 6,
                padding: "9px 10px",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Calendario del mes */}{" "}
      <div style={{ ...card, padding: 14 }}>
        {" "}
        <div style={{ color: S.white, fontWeight: 700, marginBottom: 10, fontSize: 13 }}>
          {" "}
          {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" }).toUpperCase()}{" "}
        </div>{" "}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
          {" "}
          {DIAS.map((d, i) => (
            <div key={i} style={{ textAlign: "center", color: S.lgray, fontSize: 14, fontWeight: 700 }}>
              {d}
            </div>
          ))}{" "}
        </div>{" "}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {" "}
          {Array(primerDia === 0 ? 6 : primerDia - 1)
            .fill(null)
            .map((_, i) => (
              <div key={"e" + i} />
            ))}{" "}
          {diasEnMes.map((d, i) => {
            const fue = tieneDia(d);
            const esHoy = d === hoyStr;
            const esFuturo = new Date(d) > new Date();
            return (
              <div
                key={d}
                style={{
                  aspectRatio: "1",
                  borderRadius: 6,
                  background: fue ? S.green : esHoy ? "#2a2a2a" : S.card2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: fue || esHoy ? 700 : 400,
                  color: fue ? "#000" : esHoy ? S.white : esFuturo ? S.lgray : S.gray,
                  border: esHoy ? "1px solid #444" : "none",
                }}
              >
                {" "}
                {i + 1}{" "}
              </div>
            );
          })}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
// ── DIARIO ────────────────────────────────────────────────────────────
// Ronda 17 (punto 4): las entradas ahora son editables — texto Y fecha (no
// solo el texto). `onEdit(idxOriginal, patch)` recibe el índice de la
// entrada en el array SIN ordenar (se conserva al ordenar acá abajo con
// .map antes del .sort, así el índice sigue apuntando a la entrada
// correcta en al.diario del lado de App()).
function Diario({ entradas, onAdd, onEdit, onDelete, slotAntesDeEntradas }) {
  const [texto, setTexto] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editFecha, setEditFecha] = useState("");
  const [editTexto, setEditTexto] = useState("");
  const MAX = 140;
  const guardar = () => {
    if (!texto.trim()) return;
    // Ronda 8: las entradas nuevas guardan fecha Y HORA ("YYYY-MM-DD HH:mm").
    // Las viejas quedan solo con fecha — la lectura es retrocompatible (mismo
    // criterio que la asistencia: slice(0,10) para la fecha, resto es hora).
    const ahora = new Date();
    const conHora = `${hoy()} ${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
    onAdd({ fecha: conHora, texto: texto.trim() });
    setTexto("");
  };
  const empezarEdicion = (idxOriginal, entrada) => {
    setEditIdx(idxOriginal);
    setEditFecha((entrada.fecha || hoy()).slice(0, 10));
    setEditTexto(entrada.texto || "");
  };
  const guardarEdicion = () => {
    if (editIdx == null || !editTexto.trim() || !onEdit) return;
    const original = entradas[editIdx] || {};
    // Conserva la hora original si la tenía (solo se edita la fecha/texto).
    const hora = original.fecha && String(original.fecha).length > 10 ? String(original.fecha).slice(10) : "";
    onEdit(editIdx, { fecha: (editFecha || hoy()) + hora, texto: editTexto.trim() });
    setEditIdx(null);
  };
  return (
    <div>
      {/* Ronda 8: sin título "Mi diario de entrenamiento" — el recuadro va
          directo debajo del botón de asistencia */}
      <div style={{ ...card, padding: 14, marginBottom: 14 }}>
        {" "}
        <div style={{ fontSize: 11, color: S.gray, marginBottom: 6 }}>¿Contanos cómo estuvo el entrenamiento hoy?</div>{" "}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, MAX))}
          placeholder="Ej: Muy buen dia, subi peso en sentadilla..."
          rows={3}
          style={{ ...inp, resize: "none", marginBottom: 6 }}
        />{" "}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {" "}
          <div style={{ fontSize: 11, color: texto.length > 120 ? S.red : S.lgray }}>
            {texto.length}/{MAX}
          </div>{" "}
          <button
            onClick={guardar}
            disabled={!texto.trim()}
            style={{
              background: texto.trim() ? S.white : S.card2,
              color: texto.trim() ? S.bg : S.lgray,
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontWeight: 900,
              fontSize: 12,
              cursor: texto.trim() ? "pointer" : "default",
            }}
          >
            GUARDAR
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Slot opcional entre el input y los comentarios guardados (ronda
          2026-07-22): acá cae el reporte "Tu mes" — Lucas lo quiere abajo,
          justo antes de los comentarios guardados, no arriba de todo. */}
      {slotAntesDeEntradas}
      {entradas.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <NotebookPen size={32} style={{ marginBottom: 8 }} />
          <div style={{ color: S.gray, fontSize: 13 }}>Sin entradas todavía</div>
        </div>
      ) : (
        entradas
          .map((e, i) => ({ e, i })) // conserva el índice ORIGINAL antes de ordenar
          .sort((a, b) => b.e.fecha.localeCompare(a.e.fecha))
          .map(({ e, i }) =>
            editIdx === i ? (
              <div key={i} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Fecha</div>
                {/* Ronda 18: sin date picker nativo — chips Hoy/Ayer/Otro día */}
                <div style={{ marginBottom: 8 }}>
                  <FechaRapida value={editFecha} onChange={setEditFecha} />
                </div>
                <textarea
                  value={editTexto}
                  onChange={(ev) => setEditTexto(ev.target.value.slice(0, MAX))}
                  rows={3}
                  style={{ ...inp, resize: "none", marginBottom: 6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: editTexto.length > 120 ? S.red : S.lgray }}>{editTexto.length}/{MAX}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setEditIdx(null)} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 6, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
                      Cancelar
                    </button>
                    <button
                      onClick={guardarEdicion}
                      disabled={!editTexto.trim()}
                      style={{ background: editTexto.trim() ? S.white : S.card2, color: editTexto.trim() ? S.bg : S.lgray, border: "none", borderRadius: 6, padding: "7px 14px", fontWeight: 900, fontSize: 12, cursor: editTexto.trim() ? "pointer" : "default" }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={i} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
                {" "}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                  <div style={{ color: S.lgray, fontSize: 11 }}>
                    {e.fecha.slice(0, 10)}
                    {e.fecha.length > 10 && <span style={{ color: S.green, fontWeight: 700 }}> · {e.fecha.slice(11)} hs</span>}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    {onEdit && (
                      <button
                        onClick={() => empezarEdicion(i, e)}
                        style={{ background: "transparent", border: "none", color: S.gray, fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                      >
                        Editar
                      </button>
                    )}
                    {/* 2026-07-31, pedido de Lucas: "el alumno tiene que poder
                        borrar un comentario". Confirmación nativa — es
                        destructivo y no se puede deshacer. */}
                    {onDelete && (
                      <button
                        onClick={() => window.confirm("¿Borrar este comentario? No se puede deshacer.") && onDelete(i)}
                        style={{ background: "transparent", border: "none", color: S.gray, fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>{" "}
                <div style={{ color: S.white, fontSize: 14, lineHeight: 1.5 }}>{e.texto}</div>{" "}
                {e.respuesta && (
                  <div style={{ marginTop: 8, borderLeft: "3px solid " + S.green, paddingLeft: 10 }}>
                    <div style={{ color: S.green, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Respuesta del profe</div>
                    <div style={{ color: S.white, fontSize: 13, lineHeight: 1.5 }}>{e.respuesta}</div>
                  </div>
                )}{" "}
              </div>
            )
          )
      )}{" "}
    </div>
  );
}
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
function HistorialAdmin({ al }) {
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
// ── REPORTES DEL ALUMNO (repuesto 2026-08-03) ───────────────────────────
// PDF del historial + Resumen mensual + Evolución de cargas: las tres
// existían enteras desde antes de la refactorización de menús del 19/07
// (commit 7516b50), que rehizo la navegación y las dejó sin ningún botón que
// llevara a ellas — nadie las borró, quedaron huérfanas. Repuestas por pedido
// de Lucas (03/08) dentro de Evaluación → Reportes, "por ahora" — mismo
// patrón de carga que ya usa HistorialAdmin (cargarPesos bajo demanda, no en
// cada tecla).
function ReportesAlumno({ al }) {
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
// ── ASIGNAR PLAN (punto 6, 2026-07-21) ──────────────────────────────────
// Modal en 2 pasos, disparado desde Admin → Alumno → "＋ Asignar plan":
//   1) Elegir una PLANTILLA (planes_predeterminados) + el día de la
//      semana al que se asigna.
//   2) Preview EDITABLE (mismo DiasEditor que usa Plan x día/Armador):
//      Lucas puede tocar cualquier ejercicio de la COPIA antes de
//      confirmar — la plantilla original queda intacta, lo editado acá
//      es la instancia de ESE alumno (coherente con el punto 1: cada
//      instancia asignada es independiente).
const DIAS_ASIGNAR = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
function AsignarPlanModal({ al, biblioteca, onGuardarBiblioteca, onGuardarParaTodos, showToast, onClose, onAsignado }) {
  const [plantillas, setPlantillas] = useState(null); // null = cargando
  const [plantillaSel, setPlantillaSel] = useState(null);
  // Ronda 18: MULTI-SELECT de días — se pueden elegir varios (ej. Lunes +
  // Miércoles + Viernes) y al confirmar se asigna la misma plantilla como
  // copias INDEPENDIENTES a cada día elegido, en una sola pasada.
  const [diasSel, setDiasSel] = useState(new Set(["Lunes"]));
  const [nombreInstancia, setNombreInstancia] = useState("");
  const [diasEditables, setDiasEditables] = useState(null); // paso 2: copia editable
  const [guardando, setGuardando] = useState(false);
  const toggleDia = (d) =>
    setDiasSel((prev) => {
      const s = new Set(prev);
      s.has(d) ? s.delete(d) : s.add(d);
      return s;
    });

  useEffect(() => {
    listarPlanesPredeterminados().then(setPlantillas);
  }, []);

  const elegirPlantilla = (p) => {
    setPlantillaSel(p);
    setNombreInstancia(p.nombre);
    // Copia con ids NUEVOS por ejercicio — desacoplada de la plantilla y
    // de cualquier otra instancia ya asignada (mismo criterio que
    // asignarPlanPredeterminado en services/supabase.js).
    const copia = (p.dias || []).map((d) => ({
      dia: d.dia || "Sesion",
      subtitulo: d.subtitulo || "",
      ejercicios: (d.ejercicios || []).map((ej) => ({ ...ej, id: uid() })),
    }));
    setDiasEditables(copia.length > 0 ? copia : [{ dia: "Sesion", subtitulo: "", ejercicios: [] }]);
  };

  const confirmarAsignacion = async () => {
    if (!diasEditables) return;
    const dias = DIAS_ASIGNAR.filter((d) => diasSel.has(d));
    if (dias.length === 0) { showToast && showToast("Elegí al menos un día"); return; }
    setGuardando(true);
    try {
      // Una copia INDEPENDIENTE por día: ids de ejercicio nuevos en cada
      // día para que editar el plan de un día no toque el de otro.
      for (const diaSemana of dias) {
        const copiaDia = diasEditables.map((d) => ({
          ...d,
          ejercicios: (d.ejercicios || []).map((ej) => ({ ...ej, id: uid() })),
        }));
        const r = await crearPlanAlumno(al.id, diaSemana, { nombre: nombreInstancia.trim() || "Plan", dias: copiaDia }, "catalogo_v2");
        if (!r.ok) throw new Error(`No se pudo asignar el plan al día ${diaSemana}`);
      }
      showToast && showToast(dias.length > 1 ? `Plan asignado a ${dias.length} días` : "Plan asignado");
      onAsignado && onAsignado();
    } catch (e) {
      showToast && showToast("Error: " + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const grupos = plantillas ? [...new Set(plantillas.map((p) => p.grupo || "Sin grupo"))] : [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 230, background: "rgba(0,0,0,0.7)", overflowY: "auto", padding: "24px 12px 40px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, maxWidth: 460, margin: "0 auto", background: S.bg, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: S.white, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
            {diasEditables ? `Asignar a ${al.nombre}` : "Elegí una plantilla"}
          </div>
          <button onClick={onClose} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 18, cursor: "pointer" }}><X size={16} /></button>
        </div>

        {!diasEditables ? (
          // Paso 1: elegir plantilla
          !plantillas ? (
            // Patrón de Instagram: la silueta del contenido que viene, en vez
            // del texto "Cargando…". Se siente más rápido aunque tarde igual.
            <div style={{ padding: "4px 0" }}><SkeletonCard /><SkeletonCard /></div>
          ) : plantillas.length === 0 ? (
            <div style={{ color: S.gray, fontSize: 13, textAlign: "center", padding: 20 }}>
              Todavía no hay plantillas — creá una desde <BookOpen size={13} style={{ verticalAlign: "-2px" }} /> Biblioteca → + Crear plan de entrenamiento.
            </div>
          ) : (
            grupos.map((g) => (
              <div key={g} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, color: S.gray, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{g}</div>
                {plantillas.filter((p) => (p.grupo || "Sin grupo") === g).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => elegirPlantilla(p)}
                    style={{ width: "100%", textAlign: "left", background: S.card2, border: "1px solid " + S.border, borderRadius: 8, padding: "10px 12px", marginBottom: 6, cursor: "pointer" }}
                  >
                    <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{p.nombre}</div>
                    <div style={{ color: S.gray, fontSize: 15, marginTop: 3 }}>
                      {(p.dias || []).reduce((n, d) => n + (d.ejercicios || []).length, 0)} ejercicio(s)
                    </div>
                  </button>
                ))}
              </div>
            ))
          )
        ) : (
          // Paso 2: preview editable antes de confirmar
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>
                Días de la semana <span style={{ color: S.lgray, textTransform: "none", letterSpacing: 0 }}>(podés elegir varios)</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DIAS_ASIGNAR.map((d) => {
                  const on = diasSel.has(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDia(d)}
                      style={{ background: on ? S.white : S.card2, color: on ? S.bg : S.gray, border: "1px solid " + (on ? S.white : S.border2), borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                    >
                      {on && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>Nombre para {al.nombre}</div>
              <input value={nombreInstancia} onChange={(e) => setNombreInstancia(e.target.value)} style={inp} />
            </div>
            <div style={{ fontSize: 14, color: S.lgray, marginBottom: 10 }}>
              Esto es una COPIA de la plantilla — podés tocar cualquier ejercicio para este alumno sin afectar la plantilla original ni a otros alumnos.
            </div>
            <DiasEditor
              dias={diasEditables}
              onChange={setDiasEditables}
              biblioteca={biblioteca}
              onGuardarBiblioteca={onGuardarBiblioteca}
              onGuardarParaTodos={onGuardarParaTodos}
              ocultarAgregarDia
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => setDiasEditables(null)} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: "12px 16px", cursor: "pointer" }}>
                ‹ Volver
              </button>
              <button
                onClick={confirmarAsignacion}
                disabled={guardando}
                style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontWeight: 900, cursor: "pointer", opacity: guardando ? 0.6 : 1 }}
              >
                {guardando ? "ASIGNANDO..." : "ASIGNAR"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
// ── PLAN → PRINCIPALES: días reales del alumno con su plan asignado ───
// Muestra directamente LOS DÍAS QUE EL ALUMNO YA ENTRENA (los elegidos en el
// alta) con el plan que cada uno tiene, para retocar ejercicios puntuales.
// Agregar un día nuevo queda como acción secundaria (deriva a Plan Día).
function PlanesPrincipales({ al, alumnos, onUpdate, biblioteca, onGuardarBiblioteca, onGuardarParaTodos, showToast, onIrPlanDia, initialPlanId, diasModo = "nombres", onSetDiasModo }) {
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
// ── DASHBOARD ADMIN ───────────────────────────────────────────────────
function Dashboard({ alumnos, selId, onSelect, onDelete, onNuevo, onBiblioteca, onDeselect, onToggleAsistencia, showToast }) {
  const [soloSinEntrenar, setSoloSinEntrenar] = useState(false);
  // 2026-08-04: recuperar alumnos archivados (ver migración 030 — "eliminar"
  // ya no borra, archiva). Se carga bajo demanda, no en cada render del
  // Dashboard, porque en el uso normal nadie la abre.
  const [archivados, setArchivados] = useState(null); // null = no cargado todavía
  const [verArchivados, setVerArchivados] = useState(false);
  const [restaurando, setRestaurando] = useState(null);
  const abrirArchivados = () => {
    setVerArchivados((v) => !v);
    if (archivados === null) cargarAlumnosArchivados().then(setArchivados);
  };
  const restaurar = async (al) => {
    setRestaurando(al.id);
    const ok = await restaurarAlumno(al.id);
    setRestaurando(null);
    if (ok) {
      setArchivados((prev) => prev.filter((a) => a.id !== al.id));
      showToast && showToast(`${al.nombre} restaurado`);
    } else {
      showToast && showToast("No se pudo restaurar — revisá la consola");
    }
  };
  const lunesStr = (() => {
    const d = new Date();
    const l = new Date(d);
    l.setDate(d.getDate() - d.getDay() + 1);
    return l.toISOString().split("T")[0];
  })();

  // Acceso rápido real (auditoría UX 2026-08-03, patrón "círculos" tipo
  // Mercado Pago — pero solo donde resuelve algo, no de adorno): quién NO
  // entrenó hoy es la pregunta que un coach se hace al abrir la app a la
  // mañana. "Crear alumno" ya tiene su botón prominente abajo y no se toca
  // — no todo accesorio necesita volverse un círculo.
  const sinEntrenarHoy = alumnos.filter((al) => {
    const ultima = ([...(al.asistencia || [])].sort((a, b) => b.localeCompare(a))[0] || "").slice(0, 10);
    return ultima !== hoy();
  }).length;

  return (
    <div onClick={onDeselect}>
      {/* El buscador de alumno vive UNA sola vez en el layout del AdminPanel
          (arriba de los submenús) — acá adentro no se repite (ronda 4). */}
      <div style={{ display: "flex", gap: 14, marginBottom: 16 }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setSoloSinEntrenar((v) => !v)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            background: "transparent", border: "none", cursor: "pointer", flex: 1,
          }}
          aria-pressed={soloSinEntrenar}
        >
          <div
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: soloSinEntrenar ? S.white : S.card3,
              border: "1px solid " + (soloSinEntrenar ? S.white : S.border2),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: soloSinEntrenar ? S.bg : S.white,
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            {sinEntrenarHoy}
          </div>
          <span style={{ fontSize: 10.5, color: soloSinEntrenar ? S.white : S.gray, fontWeight: soloSinEntrenar ? 800 : 500, textAlign: "center" }}>
            Sin entrenar hoy
          </span>
        </button>
        {/* 2026-08-04: acceso a los archivados — mismo patrón de círculo,
            para recuperar a alguien que se borró (a propósito o por error,
            ver migración 030). Sin contador precargado (no vale la pena una
            consulta extra en cada apertura del Dashboard solo para esto). */}
        <button
          onClick={abrirArchivados}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            background: "transparent", border: "none", cursor: "pointer", flex: 1,
          }}
          aria-pressed={verArchivados}
        >
          <div
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: verArchivados ? S.white : S.card3,
              border: "1px solid " + (verArchivados ? S.white : S.border2),
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <Archive size={20} strokeWidth={2} color={verArchivados ? S.bg : S.white} />
          </div>
          <span style={{ fontSize: 10.5, color: verArchivados ? S.white : S.gray, fontWeight: verArchivados ? 800 : 500, textAlign: "center" }}>
            Archivados
          </span>
        </button>
      </div>

      {verArchivados && (
        <div style={{ ...card, padding: 12, marginBottom: 14 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ ...eyebrow, marginBottom: 8 }}>
            {archivados === null ? "Cargando…" : `Archivados (${archivados.length})`}
          </div>
          {archivados !== null && archivados.length === 0 && (
            <div style={{ color: S.gray, fontSize: 13 }}>Nadie archivado por ahora.</div>
          )}
          {(archivados || []).map((al) => (
            <div key={al.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid " + S.border }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>{al.nombre}</div>
                <div style={{ color: S.gray, fontSize: 12 }}>
                  {al.username || al.codigo}
                  {al.archivado_en ? ` · archivado el ${al.archivado_en.slice(8, 10)}/${al.archivado_en.slice(5, 7)}` : ""}
                </div>
              </div>
              <button
                onClick={() => restaurar(al)}
                disabled={restaurando === al.id}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: restaurando === al.id ? "default" : "pointer", flexShrink: 0, opacity: restaurando === al.id ? 0.6 : 1 }}
              >
                <RotateCcw size={14} strokeWidth={2} />{restaurando === al.id ? "Restaurando…" : "Restaurar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Crear alumno — abre pantalla aparte (modal), ronda 9. Queda como
          botón ancho (acción primaria de alta frecuencia): un círculo la
          demotaría, no la mejoraría. */}
      <button
        onClick={(e) => { e.stopPropagation(); onNuevo(); }}
        style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: "11px 14px", fontWeight: 900, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", marginBottom: 14 }}
      >
        Crear alumno
      </button>

      {/* Biblioteca de ejercicios: reubicada 2026-07-21 como botón fijo
          arriba de los tabs Dashboard/Alumno en AdminPanel (ver header) —
          ya no vive acá adentro, ver onBiblioteca solo queda como prop
          legacy sin uso directo en este componente. */}

      <div style={{ ...eyebrow, letterSpacing: 2, marginBottom: 10 }}>
        {soloSinEntrenar ? `Sin entrenar hoy (${sinEntrenarHoy})` : `Todos los alumnos (${alumnos.length})`}
      </div>

      {/* Ronda 18: el alumno seleccionado va PRIMERO en la lista (la card
          duplicada que aparecía abajo del buscador se eliminó).
          2026-07-30: en escritorio la lista pasa a grilla (ver .di-grid-cards
          en GlobalStyles). En celular sigue siendo una columna, igual que
          siempre — el breakpoint vive en CSS, no en JS, para que no dependa
          de un re-render. */}
      <div className="di-grid-cards">
      {[...alumnos]
        .filter((al) => {
          if (!soloSinEntrenar) return true;
          const ultima = ([...(al.asistencia || [])].sort((a, b) => b.localeCompare(a))[0] || "").slice(0, 10);
          return ultima !== hoy();
        })
        .sort((a, b) => (a.id === selId ? -1 : 0) - (b.id === selId ? -1 : 0)).map((al) => {
        const asistSemana = (al.asistencia || []).filter((d) => d >= lunesStr).length;
        const asistMes = (al.asistencia || []).filter((d) => d.startsWith(mesActual().slice(0, 7))).length;
        const ultimaAsist = ([...(al.asistencia || [])].sort((a, b) => b.localeCompare(a))[0] || "").slice(0, 10) || undefined;
        const entrenoHoy = ultimaAsist === hoy();
        const isSelected = al.id === selId;
        return (
          <div
            key={al.id}
            onClick={(e) => { e.stopPropagation(); onSelect(al.id); }}
            style={{ ...card, marginBottom: 10, padding: "14px 16px", border: "1px solid " + (isSelected ? S.white : S.border), cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div>
                <FotoAlumno foto={al.foto} size={44} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 15 }}>{al.nombre}</div>
                  {/* Toggle de asistencia de HOY, desde el mismo listado del
                      admin (auditoría 2026-07-22: antes había que ir a Modo
                      Entrenador). Un toque marca/desmarca. */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleAsistencia && onToggleAsistencia(al.id, !entrenoHoy); }}
                    title={entrenoHoy ? "Asistencia de hoy marcada. Tocá para deshacer" : "Marcar asistencia de hoy"}
                    aria-label="Marcar asistencia de hoy"
                    role="checkbox"
                    aria-checked={entrenoHoy}
                    // 2026-07-31, pedido de Lucas: "Marcar hoy" no le gustaba
                    // como pill de texto que cambiaba de palabra — un
                    // checkbox real (casilla + tilde) es el patrón que
                    // cualquiera reconoce al toque, y el texto no cambia de
                    // palabra según el estado, solo la casilla.
                    style={{ ...checkboxWrap(), background: "transparent", border: "none", fontFamily: FONT_BODY }}
                  >
                    <span style={checkboxBox(entrenoHoy)}>
                      {entrenoHoy && <Check size={14} strokeWidth={3} color={S.bg} />}
                    </span>
                    <span style={{ fontSize: TS.chip, color: entrenoHoy ? S.white : S.gray, fontWeight: 700 }}>Asistencia</span>
                  </button>
                </div>
                <div style={{ color: S.gray, fontSize: 15, marginTop: 3 }}>
                  {al.username || al.codigo}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: S.card2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ color: S.white, fontWeight: 700 }}>{asistSemana}</div>
                <div style={{ color: S.gray, fontSize: 15 }}>ESTA SEM.</div>
              </div>
              <div style={{ flex: 1, background: S.card2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ color: S.white, fontWeight: 700 }}>{asistMes}</div>
                <div style={{ color: S.gray, fontSize: 15 }}>ESTE MES</div>
              </div>
              <div style={{ flex: 1, background: S.card2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                {/* La fecha se mostraba cruda en ISO ("2026-07-26"): al pasar
                    la lista a grilla de 3 columnas la caja se angosto y la
                    fecha se partia en dos lineas. dd/mm entra y ademas se
                    lee como la escribe una persona. */}
                <div style={{ color: S.white, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {ultimaAsist ? `${ultimaAsist.slice(8, 10)}/${ultimaAsist.slice(5, 7)}` : "—"}
                </div>
                <div style={{ color: S.gray, fontSize: 15, whiteSpace: "nowrap" }}>ÚLTIMA VEZ</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(al.id, al.nombre); }}
                title={`Eliminar a ${al.nombre}`}
                aria-label={`Eliminar a ${al.nombre}`}
                // El rojo es el unico acento de la marca y "nunca un bloque":
                // habia un boton con borde rojo pleno por cada alumno, o sea
                // 7 marcas rojas compitiendo en la misma pantalla. Queda gris
                // en reposo y se pone rojo recien al apuntarlo.
                onMouseEnter={(e) => { e.currentTarget.style.color = S.red; e.currentTarget.style.borderColor = S.red; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = S.lgray; e.currentTarget.style.borderColor = S.border2; }}
                style={{ background: "transparent", color: S.lgray, border: "1px solid " + S.border2, borderRadius: 6, padding: "4px 10px", fontSize: 13, cursor: "pointer", flexShrink: 0, transition: "color 0.2s, border-color 0.2s" }}
              ><Trash2 size={16} /></button>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
// ── BIBLIOTECA DE EJERCICIOS (ronda 12, punto 8) ────────────────────────
// Pantalla central e independiente de cualquier alumno puntual: TODOS los
// ejercicios de biblioteca_ejercicios, filtrables por categoría (derivada
// del prefijo del código: M/E/C/P), cada uno clickeable para ver/editar
// nombre, descripción, video y GIF manual. Reusa GifPicker/VideoUploadButton
// (los mismos componentes que ya usa el editor de Principales) — no duplica
// el editor de media.
function BibliotecaScreen({ biblioteca, onGuardado, showToast, onClose }) {
  const [filtro, setFiltro] = useState("todos");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Taxonomía 2026-07-21: los principales usan códigos de grupo muscular
  // (PH/RO/PE/CA/JA/GL/CO + 3 dígitos). El filtro "Principales" agrupa los 7
  // prefijos y muestra sub-chips por grupo. "GIFs" es la galería completa de
  // public/ejercicios/ con sus asociaciones.
  const [grupoFiltro, setGrupoFiltro] = useState(null);
  const PREFIJOS_PRINCIPALES = GRUPOS_MUSCULARES.map((g) => g.prefijo);
  const CATS = [
    ["todos", "Todos"],
    ["M", "Movilidad"],
    ["E", "Act. Elástico"],
    ["C", "Entrada en calor"],
    ["principales", "Principales"],
    ["otros", "Otros"],
    ["gifs", <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Film size={13} />GIFs</span>],
  ];
  const prefijoDe = (b) => (b?.codigo || "").match(/^[A-Z]+/)?.[0] || "";
  // Ronda 16 (punto 3): null-safety defensiva — cualquier fila con nombre/
  // codigo null/undefined (dato corrupto o fila a medio guardar) ya no
  // tira una excepción que rompe TODA la pantalla; simplemente se trata
  // como si no matcheara el filtro/búsqueda en vez de crashear.
  const lista = (biblioteca || [])
    .filter((b) => {
      if (filtro === "todos") return true;
      if (filtro === "principales")
        return PREFIJOS_PRINCIPALES.includes(prefijoDe(b)) && (!grupoFiltro || prefijoDe(b) === grupoFiltro);
      if (filtro === "otros") return !["M", "E", "C", ...PREFIJOS_PRINCIPALES].includes(prefijoDe(b));
      return prefijoDe(b) === filtro;
    })
    .filter((b) => !q.trim() || (b.nombre || "").toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (a?.codigo || "zzz").localeCompare(b?.codigo || "zzz"));

  // Asociaciones de cada GIF: por asignación manual (b.gif) o por lookup
  // automático por nombre (getEjercicioGif) — sin duplicar.
  const asociadosDe = (path) => {
    const porBiblioteca = (biblioteca || []).filter(
      (b) => b && ((b.gif || "") === path || (!b.gif && getEjercicioGif(b.nombre) === path))
    );
    const nombres = new Set(porBiblioteca.map((b) => (b.codigo ? b.codigo + " · " : "") + (b.nombre || "")));
    if (nombres.size === 0)
      getNombresPorGif(path).slice(0, 3).forEach((n) => nombres.add(n));
    return [...nombres];
  };

  const abrir = (b) => {
    setSel(b);
    setForm({ nombre: b.nombre, desc: b.descripcion || "", video: b.video || "", gif: b.gif || "" });
  };
  const guardar = async () => {
    if (!sel || !form.nombre.trim()) return;
    setGuardando(true);
    const ok = await actualizarEjercicioBibliotecaPorId(sel.id, form);
    setGuardando(false);
    if (ok) {
      showToast && showToast("Ejercicio actualizado");
      onGuardado && onGuardado();
      setSel(null);
      setForm(null);
    } else {
      showToast && showToast("Error al guardar . Revisá la consola");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 220, background: S.bg, overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: S.white, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", fontFamily: FONT_DISPLAY }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><BookOpen size={15} />Biblioteca de ejercicios</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 20, cursor: "pointer" }}><X size={16} /></button>
        </div>

        {sel ? (
          <div style={{ ...card, padding: 14 }}>
            <button onClick={() => { setSel(null); setForm(null); }} style={{ ...smallBtn(S.gray), marginBottom: 12 }}>
              ← Volver a la lista
            </button>
            <div style={{ color: S.gray, fontSize: 11, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              {sel.codigo && (
                <span style={{ background: S.card2, border: "1px solid " + S.border, borderRadius: 4, padding: "1px 6px", fontWeight: 800, color: S.gray }}>
                  {sel.codigo}
                </span>
              )}
              Editando ejercicio de la biblioteca central
            </div>
            <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>NOMBRE</div>
            <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} style={{ ...inp, marginBottom: 8 }} />
            <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>DESCRIPCION</div>
            <textarea value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} rows={3} style={{ ...inp, resize: "vertical", marginBottom: 8 }} />
            <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>LINK YOUTUBE</div>
            <input value={form.video} onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))} placeholder="https://youtube.com/watch?v=..." style={{ ...inp, marginBottom: 8 }} />
            <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>O SUBIR VIDEO</div>
            <VideoUploadButton onVideoUrl={(url) => setForm((f) => ({ ...f, video: url }))} />
            <GifPicker nombre={form.nombre} value={form.gif} onChange={(v) => setForm((f) => ({ ...f, gif: v }))} />
            <button
              onClick={guardar}
              disabled={guardando}
              style={{ width: "100%", marginTop: 10, background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontWeight: 900, cursor: guardando ? "default" : "pointer", opacity: guardando ? 0.6 : 1 }}
            >
              {guardando ? "GUARDANDO..." : "GUARDAR"}
            </button>
          </div>
        ) : (
          <>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ejercicio..." style={{ ...inp, marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {CATS.map(([id, l]) => (
                <button
                  key={id}
                  onClick={() => { setFiltro(id); setGrupoFiltro(null); }}
                  style={{ background: filtro === id ? S.white : S.card, color: filtro === id ? S.bg : S.gray, border: "1px solid " + (filtro === id ? S.white : S.border), borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  {l}
                </button>
              ))}
            </div>
            {/* Sub-chips por grupo muscular dentro de Principales */}
            {filtro === "principales" && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                {GRUPOS_MUSCULARES.map((g) => (
                  <button
                    key={g.prefijo}
                    onClick={() => setGrupoFiltro(grupoFiltro === g.prefijo ? null : g.prefijo)}
                    style={{ background: grupoFiltro === g.prefijo ? S.card2 : "transparent", color: grupoFiltro === g.prefijo ? S.white : S.gray, border: "1px solid " + (grupoFiltro === g.prefijo ? S.white : S.border), borderRadius: 20, padding: "4px 10px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >
                    {g.prefijo} · {g.nombre}
                  </button>
                ))}
              </div>
            )}
            {filtro === "gifs" ? (
              <>
                {/* Galería completa de public/ejercicios/ con las asociaciones
                    actuales (manuales de biblioteca + lookup por nombre). */}
                <div style={{ color: S.gray, fontSize: 11, marginBottom: 10 }}>{GIFS_DISPONIBLES.length} GIF(s) disponibles · © Gym visual</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {GIFS_DISPONIBLES.map((g) => {
                    const asociados = asociadosDe(g.path);
                    return (
                      <div key={g.slug} style={{ ...card, padding: 8, textAlign: "center" }}>
                        <div style={{ background: "#fff", borderRadius: 6, padding: "6px 0" }}>
                          <img src={g.path} alt={g.label} loading="lazy" style={{ width: 120, height: 120, objectFit: "contain" }} />
                        </div>
                        <div style={{ color: S.white, fontSize: 14, fontWeight: 700, marginTop: 6, wordBreak: "break-all" }}>{g.slug}.gif</div>
                        {asociados.length > 0 ? (
                          <div style={{ color: S.green, fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>
                            {asociados.map((n) => <div key={n}>{n}</div>)}
                          </div>
                        ) : (
                          <div style={{ color: S.lgray, fontSize: 14, marginTop: 4 }}>Sin ejercicio asociado</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
            <div style={{ color: S.gray, fontSize: 11, marginBottom: 10 }}>{lista.length} ejercicio(s)</div>
            {lista.map((b) => (
              <div
                key={b.id}
                onClick={() => abrir(b)}
                style={{ ...card, padding: "10px 12px", marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                {b.codigo && (
                  <span style={{ background: S.card2, border: "1px solid " + S.border, borderRadius: 4, padding: "1px 5px", fontSize: 14, fontWeight: 800, color: S.gray, flexShrink: 0 }}>
                    {b.codigo}
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0, color: S.white, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {b.nombre}
                </div>
                {b.unidad === "segundos" && (
                  <span style={{ color: S.green, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>seg</span>
                )}
                {(b.video || b.gif || getEjercicioGif(b.nombre)) && <div style={{ color: "#4a9eff", fontSize: 14, flexShrink: 0, display: "flex", alignItems: "center" }}><Play size={12} /></div>}
              </div>
            ))}
            {lista.length === 0 && (
              <div style={{ ...card, padding: 24, textAlign: "center", color: S.gray, fontSize: 12 }}>Sin ejercicios en esta categoría</div>
            )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
// ── NOVEDADES DEL ALUMNO (contador de no leídos) ───────────────────────
// Auditoría 2026-07-30: los avisos del gimnasio se listaban siempre abiertos
// y sin ninguna señal de "hay algo nuevo". El alumno tenía que acordarse de
// cuál ya había leído, y en el celular los avisos viejos le empujaban el plan
// del día hacia abajo. Se aplica el patrón que ya conocen de Instagram y
// Facebook: un acceso plegado con un contador rojo de no leídos; se abre de
// un toque y ahí se marcan como leídos.
//
// Por qué localStorage y no Supabase: la tabla `novedades` es global (un
// aviso para todo el gimnasio, sin estado por alumno). "Leído" es una
// preferencia del dispositivo del alumno, no un dato del negocio — agregar
// una tabla novedades_leidas + sus políticas RLS sería mucho más caro que
// resolverlo en el cliente, y si se pierde el peor caso es ver el badge una
// vez de más.
function NovedadesAlumno({ novedades, alumnoId }) {
  const key = "di_novedades_vistas_" + alumnoId;
  const [vistas, setVistas] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
  });
  const [abierto, setAbierto] = useState(false);

  if (novedades.length === 0) return null;

  // Criterio de "no leída": su id NO está en la lista guardada. Se guardan
  // ids y no una fecha de última lectura porque el admin puede despublicar y
  // volver a publicar un aviso (toggle `activo`) sin que cambie su `fecha`:
  // con fecha, ese aviso re-publicado quedaría marcado como leído para
  // siempre. Con ids cada aviso se cuenta una sola vez, sin falsos negativos.
  const noLeidas = novedades.filter((n) => !vistas.includes(n.id));

  const abrir = () => {
    setAbierto((a) => !a);
    if (noLeidas.length > 0) {
      const ids = novedades.map((n) => n.id);
      setVistas(ids);
      try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* modo privado: se muestra el badge de nuevo, no rompe nada */ }
    }
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={abrir}
        aria-expanded={abierto}
        aria-label={noLeidas.length > 0
          ? `Novedades: ${noLeidas.length} ${noLeidas.length === 1 ? "novedad sin leer" : "novedades sin leer"}`
          : "Novedades del gimnasio"}
        style={{
          ...card,
          width: "100%",
          minHeight: TAP,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          color: S.white,
          fontFamily: FONT_BODY,
          fontSize: TS.ui,
          fontWeight: 700,
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <Megaphone size={18} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>Novedades</span>
        {/* Badge: solo si hay algo sin leer. Nunca un cero — un contador en
            cero es ruido. Rojo (S.red) porque acá sí es una alerta real, que
            es el único uso permitido del acento por el Brand Kit v1.0. */}
        {noLeidas.length > 0 && (
          <span
            aria-hidden="true"
            style={{
              minWidth: 24,
              height: 24,
              borderRadius: 12,
              background: S.red,
              color: "#fff",
              fontSize: TS.chip,
              fontWeight: 800,
              lineHeight: "24px",
              textAlign: "center",
              padding: "0 7px",
              boxSizing: "border-box",
              flexShrink: 0,
            }}
          >
            {noLeidas.length > 9 ? "9+" : noLeidas.length}
          </span>
        )}
        <span style={{ color: S.gray, fontSize: TS.chip, flexShrink: 0 }}>{abierto ? "▲" : "▼"}</span>
      </button>
      {/* Cerrado se sigue viendo de qué se trata lo nuevo: el título del
          aviso más reciente sin leer queda como preview, igual que la
          notificación de un chat. Así nadie se pierde un aviso por no abrir. */}
      {!abierto && noLeidas.length > 0 && (
        <div style={{ color: S.gray, fontSize: TS.label, lineHeight: 1.4, padding: "6px 14px 0" }}>{noLeidas[0].titulo}</div>
      )}
      {abierto && novedades.map((n) => (
        <div key={n.id} style={{ ...card, padding: "12px 14px", marginTop: 8, borderLeft: "3px solid " + S.border2 }}>
          <div style={{ color: S.white, fontWeight: 700, fontSize: TS.ui, display: "flex", alignItems: "center", gap: 6 }}>{n.titulo}</div>
          {n.contenido && <div style={{ color: S.gray, fontSize: TS.body, lineHeight: 1.5, marginTop: 4 }}>{n.contenido}</div>}
        </div>
      ))}
    </div>
  );
}
// ── NOVEDADES ADMIN ───────────────────────────────────────────────────
function NovedadesAdmin({ novedades, onCrear, onToggle, onEliminar }) {
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [dirigido, setDirigido] = useState("todos");

  const publicar = () => {
    if (!titulo.trim()) return;
    onCrear({ titulo, contenido, tipo: "comunicado", autor: "", dirigido_a: dirigido });
    setTitulo(""); setContenido(""); setDirigido("todos");
  };

  return (
    <div>
      {/* Formulario nuevo comunicado */}
      <div style={{ ...card, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 12, letterSpacing: 1 }}>
          Nuevo comunicado
        </div>
        <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>TÍTULO</div>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Horarios semana santa" style={{ ...inp, marginBottom: 10 }} />
        <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>CONTENIDO (opcional)</div>
        <textarea value={contenido} onChange={(e) => setContenido(e.target.value)} rows={3} placeholder="Detalle del comunicado..." style={{ ...inp, resize: "vertical", marginBottom: 10 }} />
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>PARA</div>
          <select value={dirigido} onChange={(e) => setDirigido(e.target.value)} style={inp}>
            <option value="todos">Todos los alumnos</option>
            <option value="entrenamiento">Solo Entrenamiento</option>
          </select>
        </div>
        <button onClick={publicar} style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontWeight: 900, cursor: "pointer", fontSize: 13 }}>
          PUBLICAR COMUNICADO
        </button>
      </div>

      {/* Lista de novedades existentes */}
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 10, letterSpacing: 1 }}>
        Publicadas ({novedades.length})
      </div>
      {novedades.length === 0 && (
        <div style={{ ...card, padding: 30, textAlign: "center", color: S.gray, fontSize: 13 }}>Sin novedades publicadas</div>
      )}
      {novedades.map((n) => (
        <div key={n.id} style={{ ...card, padding: "12px 14px", marginBottom: 8, opacity: n.activo ? 1 : 0.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{n.titulo}</div>
              {n.contenido && <div style={{ color: S.gray, fontSize: 11, marginBottom: 4, lineHeight: 1.4 }}>{n.contenido}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 14, color: S.gray, background: S.card2, borderRadius: 4, padding: "2px 6px" }}>{n.tipo}</span>
                <span style={{ fontSize: 14, color: S.gray, background: S.card2, borderRadius: 4, padding: "2px 6px" }}>→ {n.dirigido_a}</span>
                <span style={{ fontSize: 14, color: S.gray }}>{new Date(n.fecha).toLocaleDateString("es-AR")}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => onToggle(n.id, !n.activo)} style={{ ...smallBtn(n.activo ? S.green : S.gray), padding: "4px 8px", fontSize: 14 }}>
                {n.activo ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={12} />Activa</span> : "○ Oculta"}
              </button>
              <button onClick={() => onEliminar(n.id)} style={{ ...smallBtn(S.red), padding: "4px 8px", fontSize: 14 }}><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
function DiarioAdmin({ alumnos, onUpdate, showToast }) {
  const [selId, setSelId] = useState(alumnos[0]?.id);
  const al = alumnos.find((a) => a.id === selId) || alumnos[0];
  const entradas = [...(al?.diario || [])].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const responder = (entrada, respuesta) => {
    if (!al || !onUpdate) return;
    const nuevoDiario = (al.diario || []).map((d) => (d === entrada ? { ...d, respuesta } : d));
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, diario: nuevoDiario } : a)));
    showToast && showToast("Respuesta guardada");
  };

  return (
    <div>
      <AlumnoBuscador alumnos={alumnos} selId={selId} onSelect={setSelId} />
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Diario — {al?.nombre}
      </div>
      {entradas.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <NotebookPen size={28} style={{ marginBottom: 8 }} />
          <div style={{ color: S.gray, fontSize: 13 }}>Sin entradas todavía</div>
        </div>
      ) : (
        entradas.map((e, i) => (
          <EntradaDiarioAdmin key={e.fecha + "-" + i} entrada={e} onResponder={(r) => responder(e, r)} />
        ))
      )}
    </div>
  );
}

// ── ADMIN PANEL ───────────────────────────────────────────────────────
// Modalidades de entrenamiento del alumno (pedido de Lucas 2026-07-20).
// 2026-07-30 (pedido de Lucas): las categorías se reescriben en términos de
// CON QUIÉN entrena, no de "presencial/a distancia" — "entrena solo en
// Desarrollo Integral" sonaba a que el alumno está abandonado. Tres
// categorías fijas, ni una más.
// 2026-08-09: se saca "Paciente de Griselda". La rehabilitación dejó de ser
// una modalidad de alumno y pasó a ser su propia app (rehab/), con pacientes
// en tablas propias — acá no queda ni el tipo ni la modalidad.
const MODALIDADES = [
  "Entrena con Lucas",
  "Entrena con Ariel",
  "Entrena en Desarrollo Integral",
];
// Los 7 alumnos que ya existen tienen guardado el texto VIEJO en la columna
// `modalidad`. No se toca la base: se traduce al mostrar y al abrir el
// formulario, así ninguno queda sin categoría. "A distancia" no tiene
// equivalente en la lista nueva — se deja pasar tal cual (ver
// modalidadLabel: lo que no está en el mapa vuelve sin cambios) y se sigue
// mostrando como chip suelto en el editor hasta que Lucas lo reasigne.
const MODALIDAD_LEGACY = {
  "Presencial con Lucas": "Entrena con Lucas",
  "Presencial con Ariel": "Entrena con Ariel",
  "Entrena solo en Desarrollo Integral": "Entrena en Desarrollo Integral",
};
const modalidadLabel = (m) => (m ? MODALIDAD_LEGACY[m] || m : "");
// Ronda 7: Peso Max aplica a TODOS los alumnos, sin filtro por modalidad
// ("por más que entrene solo, algún día lo voy a ir a ver").
// `export` para poder montarlo en dev/harness.jsx (banco de pruebas) — la app
// lo sigue usando desde este mismo archivo (2026-08-10).
export function AdminPanel({ alumnos, onUpdate, onClose, showToast, biblioteca = [], onGuardarBiblioteca, onBibliotecaRefresh, novedades = [], onNovedadesChange, darkMode, onToggleTheme, onModoEntrenador }) {
  // 2026-07-30, pedido de Lucas: "dos versiones, una web para usarla de casa
  // y una de celular para la clase o el alumno". Se resuelve con UN código
  // base y este breakpoint, no con dos apps (dos bases se desincronizan).
  // El panel admin es el que trabaja en escritorio: acá el ancho de verdad
  // sirve — armar planes, cruzar datos, la biblioteca. La vista del alumno
  // queda angosta a propósito, porque se usa con una mano en la clase.
  const wide = useIsWide();
  // Toast con "Deshacer" (patrón Gmail/Instagram/ML) — reemplaza los
  // window.confirm() bloqueantes en las acciones destructivas del panel.
  const { ejecutarConDeshacer, ToastUI } = useDeshacer();
  // 2026-07-30, pedido de Lucas: "al actualizar la página me saca del lugar
  // donde estaba". La navegación del panel admin vivía solo en useState, así
  // que un F5 la reiniciaba siempre a Dashboard. Se guarda en sessionStorage
  // (dura mientras la pestaña esté abierta, no se pisa entre dispositivos ni
  // queda pegada días después) y se restaura al montar. selId se valida
  // contra la lista real de alumnos por si el guardado quedó viejo (alumno
  // borrado, u otra cuenta).
  const NAV_KEY = "di_admin_nav";
  const navGuardada = (() => {
    try { return JSON.parse(sessionStorage.getItem(NAV_KEY)) || {}; } catch { return {}; }
  })();
  const [sec, setSec] = useState(navGuardada.sec || "dashboard");
  const [selId, setSelId] = useState(() =>
    alumnos.some((a) => a.id === navGuardada.selId) ? navGuardada.selId : alumnos[0] && alumnos[0].id
  );
  const [planTab, setPlanTab] = useState(navGuardada.planTab || "entrenamiento");
  // Ronda 8: menús del admin en 3 grupos — Plan (edición de las 4 partes),
  // Planes (periodización · plan x día · evaluación peso max) y Reportes
  // (asistencia · historial · bioimpedancia). Subtabs de cada grupo:
  const [planesTab, setPlanesTab] = useState(navGuardada.planesTab || "periodizacion");
  // Qué periodización se está editando: null = la del alumno (la que comparten
  // todos los días, el caso normal), o el id de un alumno_plan que tiene la
  // suya propia (2026-08-10).
  const [perDiaSel, setPerDiaSel] = useState(null);
  const [repTab, setRepTab] = useState(navGuardada.repTab || "asistencia");
  // Módulo Evaluación (accesible por el botón "Evaluar" de la ficha): dos
  // sub-módulos — "integral" (protocolo de escalas 1-5) y "bio" (bioimpedancia,
  // antes vivía en Reportes).
  // 2026-08-10: solo se aceptan las pestañas que hoy existen. sessionStorage
  // puede traer el "reportesAlumno" viejo (esa pestaña se fusionó en Reportes)
  // y dejaría la pantalla de Evaluación en blanco.
  const [evalTab, setEvalTab] = useState(navGuardada.evalTab === "bio" ? "bio" : "integral");
  useEffect(() => {
    try { sessionStorage.setItem(NAV_KEY, JSON.stringify({ sec, selId, planTab, planesTab, repTab, evalTab })); } catch {}
  }, [sec, selId, planTab, planesTab, repTab, evalTab]);
  const [selectedDia, setSelectedDia] = useState(null);
  // Punto 8 (ronda 16): "Plan x día" reorganizado — en vez de los 7 días
  // fijos siempre visibles, solo se muestran los días que la persona
  // entrena (+ los que ya tengan plan asignado, para que nada desaparezca)
  // y un tile final "+ Agregar día" que despliega el resto de la semana
  // (incluido "Fijo") para sumar uno nuevo.
  const [agregandoDia, setAgregandoDia] = useState(false);
  // Guard de re-entrada del alta de alumno (ver crearAlumno)
  const _creandoAlumno = useRef(false);
  // Plan a abrir al entrar a Plan → Principales (ronda 7: click en la ficha)
  const [planFoco, setPlanFoco] = useState(null);
  const [form, setForm] = useState(null);
  const [rm, setRm] = useState(() => {
    const r = {};
    alumnos.forEach((a) => {
      r[a.id] = { ...a.rm };
    });
    return r;
  });
  const [nn, setNn] = useState(""),
    [nc, setNc] = useState(""),
    [npin, setNpin] = useState(""),
    [np, setNp] = useState(""),
    [na, setNa] = useState(""),
    [ne, setNe] = useState(""),
    [nfecha, setNfecha] = useState(""),
    [nmodalidad, setNmodalidad] = useState(""),
    [ngenero, setNgenero] = useState(""),
    [ntipo, setNtipo] = useState("entrenamiento"),
    // 2026-08-09 · alta "Solo video": path del video en rehab-media + estado
    // de la subida. El alta de este tipo de alumno es a propósito de tres
    // campos (nombre, clave, video) — todo lo demás no aplica.
    [nvideo, setNvideo] = useState(""),
    [nsubiendo, setNsubiendo] = useState(false);
  // Fecha de evaluación POR ALUMNO (ronda 4): es la fecha en que el entrenador
  // evaluó a ESE alumno. Vive dentro del jsonb `rm` como `fecha_evaluacion` —
  // sin migración nueva. Se guarda apenas se cambia.
  const setFechaEvalAlumno = (v) => {
    if (!al) return;
    setRm((r) => ({ ...r, [al.id]: { ...r[al.id], fecha_evaluacion: v } }));
    const rmNuevo = { ...(rm[al.id] || al.rm || {}), fecha_evaluacion: v };
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, rm: rmNuevo } : a)));
    showToast && showToast("Fecha de evaluación guardada");
  };
  // Movilidad PREDETERMINADA por alumno (ronda 5): con cuál de las 3 versiones
  // (superrapida/corta/completa) arranca el alumno al entrar. Vive en el jsonb
  // `rm` como `movilidad_default` — sin migración nueva. El alumno puede
  // cambiarla en el momento con los 3 botones de su vista.
  // Predeterminados globales de preparación (app_config): la lista que ve el
  // alumno que nunca fue editado a mano. Se cargan una vez por sesión de admin.
  const [prepGlobales, setPrepGlobales] = useState({});
  useEffect(() => { getPrepGlobales().then(setPrepGlobales); }, []);
  // Predeterminados de PERIODIZACIÓN (tabla `periodizaciones`): los mismos dos
  // niveles que la preparación. Se cargan una vez para poder asignarle a un
  // alumno "Hipertrofia · Principiante" desde su ficha.
  const [perGlobales, setPerGlobales] = useState({});
  // 2026-08-12: los NOMBRES de las planificaciones ahora salen de la base
  // (columna `nombre`), no de las constantes OBJETIVOS × NIVELES. Si Lucas
  // renombra una en la Biblioteca, acá se ve con el nombre nuevo.
  const [perNombres, setPerNombres] = useState({});
  useEffect(() => {
    listarPeriodizacionesConNombres().then(({ semanas, nombres }) => {
      setPerGlobales(semanas);
      setPerNombres(nombres);
    });
  }, []);
  // Versión de movilidad que se está VIENDO/EDITANDO en la pantalla de admin.
  // Es distinta de movilidad_default (con cuál arranca el alumno): antes había
  // un solo control para las dos cosas y por eso "no cambiaban los ejercicios".
  const [moviVer, setMoviVer] = useState("completa");
  const setMoviDefault = (v) => {
    if (!al) return;
    setRm((r) => ({ ...r, [al.id]: { ...r[al.id], movilidad_default: v } }));
    const rmNuevo = { ...(rm[al.id] || al.rm || {}), movilidad_default: v };
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, rm: rmNuevo } : a)));
    showToast && showToast("Movilidad predeterminada guardada");
  };
  // Secciones visibles y su ORDEN por alumno (ronda 9): qué chips de
  // preparación ve el alumno (Movilidad / Act. Elástico / Entrada en calor)
  // y en qué orden. Vive en el jsonb `rm` como `secciones_config` =
  // { orden: ["movilidad","banda","peso"], ocultas: [] } — sin migración.
  // Los ids son los de los tabs de PlanDelDia (movilidad · banda · peso).
  const setSeccionesConfig = (cfg) => {
    if (!al) return;
    setRm((r) => ({ ...r, [al.id]: { ...r[al.id], secciones_config: cfg } }));
    const rmNuevo = { ...(rm[al.id] || al.rm || {}), secciones_config: cfg };
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, rm: rmNuevo } : a)));
  };
  // Modo de etiquetado de días por alumno (punto 9, 2026-07-21): "nombres"
  // (Lunes/Miércoles/Viernes...) o "numerico" (Día 1/Día 2/Día 3... para
  // alumnos sin horario fijo). Mismo patrón sin-migración que
  // movilidad_default/secciones_config, vive en rm.dias_modo. Lo lee
  // PlanDelDia.jsx (vista del alumno) en el selector de día de Principales.
  const setDiasModo = (v) => {
    if (!al) return;
    setRm((r) => ({ ...r, [al.id]: { ...r[al.id], dias_modo: v } }));
    const rmNuevo = { ...(rm[al.id] || al.rm || {}), dias_modo: v };
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, rm: rmNuevo } : a)));
    showToast && showToast(v === "numerico" ? "Días: Día 1 / Día 2 / Día 3…" : "Días: nombres reales");
  };
  const [admNombre, setAdmNombre] = useState(""),
    [admCodigo, setAdmCodigo] = useState(""),
    [admPin, setAdmPin] = useState(""),
    [admRol, setAdmRol] = useState("entrenador");
  const [configTab, setConfigTab] = useState("admin");
  // Gestión de admins con rol (punto 12, ronda 2026-07-21): listado propio,
  // se recarga al entrar a Configuración → Crear admin y después de crear
  // o cambiar un rol.
  const [adminsList, setAdminsList] = useState([]);
  const cargarAdminsList = () => { listarAdmins().then(setAdminsList); };
  useEffect(() => { if (sec === "config" && configTab === "admin") cargarAdminsList(); }, [sec, configTab]);
  // Editar admin existente (punto 2, ronda 2026-07-21 #2): id del admin
  // que se está editando (null = ninguno) + campos del form inline.
  const [editandoAdminId, setEditandoAdminId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editCodigo, setEditCodigo] = useState("");
  const [editAdminPin, setEditAdminPin] = useState("");
  const abrirEdicionAdmin = (a) => {
    if (editandoAdminId === a.id) { setEditandoAdminId(null); return; }
    setEditandoAdminId(a.id);
    setEditNombre(a.nombre);
    setEditCodigo(a.codigo);
    setEditPin("");
  };
  // Mes elegido para el reporte mensual (tab Asistencia). "YYYY-MM".
  const [repMes, setRepMes] = useState(mesActual().slice(0, 7));
  const [showCrearAlumno, setShowCrearAlumno] = useState(false);
  const [showAsignarPlan, setShowAsignarPlan] = useState(false); // punto 6: asignar una plantilla a este alumno
  const [showBiblioteca, setShowBiblioteca] = useState(false); // biblioteca PROPIA (movilidad/elástico/calor + GIFs)
  // Ronda 14: la Biblioteca principal es el catálogo completo (dataset
  // ExerciseDB + custom DI). Ronda 16 (punto 4): el "Armador" dejó de ser
  // una pantalla separada — ahora es un toggle DENTRO de CatalogoExplorer
  // (botón "+ Crear plan de entrenamiento"), así que ya no hace falta un
  // segundo estado/instancia acá.
  const [showCatalogo, setShowCatalogo] = useState(false);
  // Visor "Todos los planes" (ronda 9): plantilla abierta en modal de lectura
  const [planVisor, setPlanVisor] = useState(null);
  const [editPin, setEditPin] = useState("");
  // 2026-08-12: el alta arranca SIN PLAN. Antes el predeterminado era
  // "bilateral", así que todo alumno nuevo nacía con un plan que Lucas no
  // había elegido. Ahora elegir es un acto explícito y "sin plan" es válido.
  const [ntemplate, setNtemplate] = useState(SIN_PLAN);
  const [ndias, setNdias] = useState({}); // {Lunes: "v:12", Martes: "__sin_plan__", ...}
  // VARIANTES DE PLAN (2026-08-10): las rutinas de `plan_variantes` que hasta
  // entonces no se podían asignar. Se cargan JUNTO CON EL CATÁLOGO porque la
  // variante guarda solo catalogo_id — la descripción, el GIF y el código
  // salen de catalogo_ejercicios (ver src/utils/planVariantes.js). La carga es
  // perezosa para no sumarle 1.344 filas al arranque del admin, que ya es la
  // parte más lenta de la app.
  //
  // 2026-08-12 — también se cargan al abrir el ALTA de un alumno. Reclamo de
  // Lucas: "no me aparecen los planes que tenemos organizados". El alta ofrecía
  // PLANTILLAS (planTemplates.js, ya podado a 2), no las variantes reales; sin
  // esta carga el desplegable del alta se veía vacío. Por eso el bloque bajó
  // hasta acá: la condición ahora depende de showCrearAlumno, que se declara
  // arriba y no existía todavía donde vivía el efecto.
  const [variantes, setVariantes] = useState([]);
  const [catalogoIdx, setCatalogoIdx] = useState(null);
  const _pidiendoVariantes = useRef(false);
  useEffect(() => {
    const hacenFalta = (sec === "planes" && planesTab === "plan-dias") || showCrearAlumno;
    if (!hacenFalta) return;
    if (_pidiendoVariantes.current) return;
    _pidiendoVariantes.current = true;
    Promise.all([listarVariantesPlan(), cargarCatalogoCached()]).then(([vs, cat]) => {
      setVariantes(vs || []);
      setCatalogoIdx(indexarCatalogo(cat || []));
    });
  }, [sec, planesTab, showCrearAlumno]);
  const gruposVariantes = useMemo(() => agruparVariantes(variantes), [variantes]);
  const DIAS_SEM = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  const al = alumnos.find((a) => a.id === selId) || alumnos[0];
  // 2026-08-12: si se estaba en "Planes" y se pasa a un alumno de solo video,
  // la sección deja de existir para él (ver IconDock) — sin esto quedaba la
  // pantalla de Planificación abierta sin ninguna pestaña para volver.
  useEffect(() => {
    if (al?.tipo === "video" && sec === "planes") setSec("alumnos");
  }, [al?.tipo, sec]);
  const startEdit = () =>
    setForm({
      nombre: al.nombre,
      username: al.username || "",
      codigo: al.codigo,
      email: al.email || "",
      peso: al.peso,
      altura: al.altura,
      edad: al.edad,
      fecha_nacimiento: (al.fecha_nacimiento || "").slice(0, 10),
      // 2026-07-30: modalidadLabel traduce el valor viejo guardado
      // ("Presencial con Lucas"...) al nombre nuevo, para que el chip que
      // corresponde aparezca marcado en vez de "Sin definir".
      modalidad: modalidadLabel(al.modalidad),
      horarios: JSON.parse(JSON.stringify(al.horarios || [])),
      // 2026-08-09 · alumno "Solo video": el tipo se edita explícito acá y el
      // video viaja con la ficha.
      tipo: al.tipo || "entrenamiento",
      video_movilidad: al.video_movilidad || "",
      // Género (ronda 12): vive en rm.genero, no es columna de alumnos —
      // se saca del form antes de spreadearlo (ver saveEdit).
      genero: al.rm?.genero || "",
    });
  const saveEdit = () => {
    if (!form.nombre) return;
    // Normaliza el username a mayúsculas siempre, así el login (que compara
    // en mayúsculas) funciona sin importar cómo lo haya tipeado el admin.
    // "genero" NO es columna de alumnos (vive en rm.genero) — se saca del
    // spread para no mandarlo como campo top-level al upsert.
    const { genero, ...formSinGenero } = form;
    const formNormalizado = { ...formSinGenero, codigo: (form.codigo || "").toUpperCase() };
    // Elegir una modalidad de entrenamiento implica que el alumno entrena.
    // 2026-08-09: tipo="video" se elige a mano y NO se deriva de la modalidad
    // — sin este guard, un alumno "solo video" que además tenga modalidad
    // cargada volvía a "entrenamiento" solo con abrir y guardar la ficha.
    if (formNormalizado.tipo !== "video" && formNormalizado.modalidad) {
      formNormalizado.tipo = "entrenamiento";
    }
    // 2026-08-12: pasar a "solo video" le saca los días de entrenamiento. Si
    // no, quedaban guardados de cuando entrenaba y volvían a aparecer en la
    // ficha y en la grilla de Plan por día de alguien que ya no entrena.
    if (formNormalizado.tipo === "video") formNormalizado.horarios = [];
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, ...formNormalizado, rm: { ...a.rm, genero: genero || undefined } } : a)));
    setForm(null);
  };
  const eliminarAlumno = async () => {
    if (!window.confirm(`¿Eliminar a ${al.nombre}? Esta acción no se puede deshacer.`)) return;
    await deleteAlumno(al.id);
    const nuevos = alumnos.filter((a) => a.id !== al.id);
    onUpdate(nuevos);
    setSelId(nuevos[0] && nuevos[0].id);
    setSec("dashboard");
    showToast && showToast(`${al.nombre} eliminado.`);
  };
  const updatePlan = (campo, valor) =>
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, plan: { ...a.plan, [campo]: valor } } : a)));
  // PREPARACIÓN EN DOS NIVELES (2026-08-10) — ver src/utils/preparacion.js.
  // Acá se edita la lista DE ESTE ALUMNO: tocarla la convierte en propia (deja
  // de heredar el predeterminado), y "Volver al predeterminado" la devuelve.
  const guardarPrepAlumno = (id, lista) =>
    onUpdate(alumnos.map((a) => (a.id === al.id ? conPrepPropia(a, id, lista) : a)));
  const volverPrepGlobal = (id) => {
    onUpdate(alumnos.map((a) => (a.id === al.id ? sinPrepPropia(a, id, prepGlobales) : a)));
    showToast && showToast("Vuelve a usar el predeterminado");
  };
  // PERIODIZACIÓN EN DOS NIVELES (2026-08-10) — ver src/utils/periodizacion.js.
  // Asignar objetivo + nivel copia el predeterminado al alumno y lo deja
  // heredando; editar las semanas la vuelve propia.
  const asignarPeriodizacion = (objetivo, nivel) => {
    const semanas = perGlobales[clavePeriodizacion(objetivo, nivel)] || [];
    if (semanas.length === 0) {
      showToast && showToast(`${etiquetaPeriodizacion(perNombres, objetivo, nivel)} todavía no tiene semanas cargadas`);
      return;
    }
    onUpdate(alumnos.map((a) => (a.id === al.id ? conPeriodizacionDe(a, objetivo, nivel, semanas) : a)));
    showToast && showToast(`Periodización ${etiquetaPeriodizacion(perNombres, objetivo, nivel)} asignada`);
  };
  // 2026-08-12 — dejar al alumno SIN planificación. Es el equivalente de "Sin
  // plan" del otro lado y hasta hoy no existía: una vez asignada, la
  // progresión no se podía sacar. Se pregunta porque borra las semanas
  // cargadas, incluidas las fechas del mesociclo.
  const sacarPeriodizacion = () => {
    if (!al) return;
    if (tienePeriodizacion(al) && !window.confirm(`${al.nombre} se queda sin planificación: se borran las ${(al.plan?.periodizacion || []).length} semanas cargadas. Los ejercicios de sus días no se tocan. ¿Seguimos?`)) return;
    onUpdate(alumnos.map((a) => (a.id === al.id ? sinPeriodizacion(a) : a)));
    showToast && showToast("El alumno queda sin planificación");
  };
  const guardarPeriodizacionAlumno = (semanas) =>
    onUpdate(alumnos.map((a) => (a.id === al.id ? conPeriodizacionEditada(a, semanas) : a)));
  // ── PERIODIZACIÓN POR DÍA (2026-08-10) ──
  // Pedido de Lucas: "un día puede estar haciendo fuerza el otro volumen".
  // `perDiaSel` es el día que se está editando; null = la del alumno (el caso
  // normal, una sola compartida por todos). Refrescar los planes después de
  // guardar es lo que hace que el cartelito "propia/comparte" quede al día sin
  // recargar la app.
  const refrescarPlanesDelAlumno = async () => {
    const planes = await cargarPlanesXDia(al.id, al);
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, planes } : a)));
  };
  const hacerPeriodizacionPropiaDelDia = async (plan) => {
    // Arranca como COPIA de la del alumno: separar un día no puede empezar con
    // la tabla en blanco, o Lucas tendría que recargar ocho semanas a mano
    // para cambiar un número.
    const base = (al.plan?.periodizacion || []).map((s) => ({ ...s }));
    if (base.length === 0) { showToast && showToast("El alumno todavía no tiene periodización para copiar"); return; }
    if (!(await guardarPeriodizacionDia(plan.id, base))) { showToast && showToast("Error al separar el día . Revisá la consola"); return; }
    await refrescarPlanesDelAlumno();
    setPerDiaSel(plan.id);
    showToast && showToast(`${plan.dia_semana} ahora tiene su propia progresión`);
  };
  const volverACompartirPeriodizacion = async (plan) => {
    if (!(await guardarPeriodizacionDia(plan.id, null))) { showToast && showToast("Error al volver a compartir . Revisá la consola"); return; }
    await refrescarPlanesDelAlumno();
    setPerDiaSel(null);
    showToast && showToast(`${plan.dia_semana} vuelve a usar la del alumno`);
  };
  const guardarPeriodizacionDelDia = async (plan, semanas) => {
    if (!(await guardarPeriodizacionDia(plan.id, semanas))) { showToast && showToast("Error al guardar . Revisá la consola"); return; }
    await refrescarPlanesDelAlumno();
  };
  const volverPeriodizacionGlobal = () => {
    const ref = refPeriodizacion(al);
    if (!ref) return;
    asignarPeriodizacion(ref.objetivo, ref.nivel);
  };
  // Al guardar un predeterminado en la Biblioteca: se lo baja a todos los que
  // lo heredan y no lo tocaron. Devuelve cuántos cambiaron para el toast.
  const propagarPeriodizacionATodos = (objetivo, nivel, semanas) => {
    setPerGlobales((g) => ({ ...g, [clavePeriodizacion(objetivo, nivel)]: semanas }));
    const nuevos = propagarPeriodizacion(alumnos, objetivo, nivel, semanas);
    const cambiados = nuevos.filter((a, i) => a !== alumnos[i]).length;
    if (cambiados > 0) onUpdate(nuevos);
    return cambiados;
  };
  // Ronda 11: "Guardar para todos" — actualiza el maestro (biblioteca) y
  // propaga a todos los alumnos que tengan el mismo ejercicio (matched por
  // código o, si es viejo y no tiene, por nombre exacto). Ver
  // propagarEjercicioATodos en services/supabase.js.
  const guardarParaTodos = async (categoria, payload) => {
    const r = await propagarEjercicioATodos({ categoria, ...payload });
    if (r.ok) {
      showToast && showToast(`Propagado a ${r.total} ${categoria === "principales" ? "ejercicio(s)" : "alumno(s)"}`);
      onBibliotecaRefresh && onBibliotecaRefresh();
    } else {
      showToast && showToast("Error al propagar . Revisá la consola");
    }
  };
  const guardarRM = () => {
    onUpdate(alumnos.map((a) => ({ ...a, rm: rm[a.id] || a.rm })));
    showToast && showToast("Guardado");
  };

  // ── REPORTE MENSUAL INSTITUCIONAL (ronda 5) ──
  // Genera un HTML autocontenido (Blob, client-side, sin dependencias) con el
  // logo DI, diseño institucional (fondo blanco para imprimir, negro/gris,
  // acento rojo mínimo) y CSS @media print para guardarlo como PDF.
  // Los datos del MES elegido: asistencia, pesos registrados, diario.
  // El plan actual (con progresión de cargas desde el primer registro) y los
  // datos personales van siempre.
  const exportarReporteMensual = async (alumno, mes) => {
    showToast && showToast("Generando reporte...");
    try {
      const [pesosData, bio] = await Promise.all([
        cargarPesos(alumno.id, null),
        cargarBioimpedanciaCompleta(alumno.id),
      ]);
      const historiales = (pesosData && pesosData.historiales) || {};
      const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const fmtF = (f) => { const x = String(f || "").slice(0, 10).split("-"); return x.length === 3 ? `${x[2]}/${x[1]}/${x[0]}` : String(f || "—"); };
      const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const mesLabel = `${MESES_ES[Number(mes.slice(5, 7)) - 1] || mes} ${mes.slice(0, 4)}`;

      // ── Datos del mes ──
      const asisMes = [...(alumno.asistencia || [])].filter((r) => r.startsWith(mes)).sort();
      const diarioMes = [...(alumno.diario || [])].filter((d) => (d.fecha || "").startsWith(mes)).sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
      const bioMes = (bio || []).filter((b) => String(b.fecha || "").startsWith(mes));

      // ── Plan de entrenamiento + progresión de cargas por ejercicio ──
      // Progresión = primer registro histórico → último registro (cómo empezó
      // y dónde está hoy), más los pesos registrados dentro del mes.
      const filaEjercicio = (ej) => {
        const hist = (historiales[ej.id] || []).filter((h) => h.fecha && Number(h.peso) > 0).sort((a, b) => a.fecha.localeCompare(b.fecha));
        const prim = hist[0], ult = hist[hist.length - 1];
        const delMes = hist.filter((h) => h.fecha.startsWith(mes));
        const prog = prim && ult && prim !== ult
          ? `${prim.peso} kg <span class="fch">(${fmtF(prim.fecha)})</span> <span class="arrow">→</span> <strong>${ult.peso} kg</strong> <span class="fch">(${fmtF(ult.fecha)})</span>`
          : prim ? `<strong>${prim.peso} kg</strong> <span class="fch">(${fmtF(prim.fecha)})</span>` : '<span class="fch">Sin registros</span>';
        const mesTxt = delMes.length > 0 ? delMes.map((h) => `${fmtF(h.fecha)}: ${h.peso} kg`).join(" · ") : "—";
        return `<tr><td>${esc(ej.nombre)}</td><td>${prog}</td><td class="mescol">${mesTxt}</td></tr>`;
      };
      const planesReales = (alumno.planes || []).length > 0 ? alumno.planes : (alumno.plan ? [{ ...alumno.plan, dia_semana: "Plan actual", nombre: alumno.plan.nombre }] : []);
      const ORDEN_DIAS = { Lunes: 1, Martes: 2, Miercoles: 3, Jueves: 4, Viernes: 5, Sabado: 6, Domingo: 7 };
      const planHTML = [...planesReales]
        .sort((a, b) => (ORDEN_DIAS[a.dia_semana] || 8) - (ORDEN_DIAS[b.dia_semana] || 8))
        .map((p) => {
          const dias = p.dias || [];
          const bloques = dias.map((d) =>
            (d.ejercicios || []).length === 0 ? "" : `
            ${dias.length > 1 ? `<div class="subdia">${esc(d.dia || "")}</div>` : ""}
            <table><thead><tr><th>Ejercicio</th><th>Progresión de cargas</th><th>Registros de ${esc(mesLabel)}</th></tr></thead>
            <tbody>${(d.ejercicios || []).map(filaEjercicio).join("")}</tbody></table>`
          ).join("");
          return `<div class="dia-plan"><h3>${esc(p.dia_semana || "Fijo")}${p.nombre ? ` <span class="plan-nombre">· ${esc(p.nombre)}</span>` : ""}</h3>${bloques || '<p class="vacio">Sin ejercicios cargados.</p>'}</div>`;
        }).join("");

      // ── Asistencia del mes ──
      const asisHTML = asisMes.length === 0 ? '<p class="vacio">Sin asistencias registradas este mes.</p>' : `
        <table><thead><tr><th>Fecha</th><th>Hora de ingreso</th></tr></thead><tbody>
        ${asisMes.map((r) => `<tr><td>${fmtF(r)}</td><td>${r.length > 10 ? esc(r.slice(11)) + " hs" : "—"}</td></tr>`).join("")}
        </tbody></table><p class="nota-tabla">${asisMes.length} asistencia${asisMes.length === 1 ? "" : "s"} en ${esc(mesLabel)}.</p>`;

      // ── Pesos máximos ──
      const rmAl = alumno.rm || {};
      const rmFilas = RM_EJS.map((ej) => { const r = rmAl[ej]; return `<tr><td>${esc(ej)}</td><td>${r && r.peso ? `<strong>${r.peso} kg</strong>` : "—"}</td></tr>`; }).join("");
      const rmHTML = `${rmAl.fecha_evaluacion ? `<p class="nota-tabla">Fecha de evaluación: <strong>${fmtF(rmAl.fecha_evaluacion)}</strong></p>` : ""}
        <table class="mitad"><thead><tr><th>Ejercicio</th><th>Peso máximo</th></tr></thead><tbody>${rmFilas}</tbody></table>`;

      // ── Bioimpedancia (estudios del mes; si no hay, el último conocido) ──
      const bioMostrar = bioMes.length > 0 ? bioMes : (bio && bio.length > 0 ? [bio[0]] : []);
      const bioHTML = bioMostrar.length === 0 ? '<p class="vacio">Sin estudios de bioimpedancia.</p>' : `
        ${bioMes.length === 0 ? '<p class="nota-tabla">Sin estudios este mes — se muestra el último disponible.</p>' : ""}
        <table><thead><tr><th>Fecha</th><th>Peso</th><th>Grasa corporal</th><th>Masa muscular</th><th>Grasa visceral</th></tr></thead><tbody>
        ${bioMostrar.map((b) => `<tr><td>${fmtF(b.fecha)}</td><td>${b.peso != null ? b.peso + " kg" : "—"}</td><td>${b.grasa_corporal != null ? b.grasa_corporal + "%" : "—"}</td><td>${b.masa_muscular != null ? b.masa_muscular + "%" : "—"}</td><td>${b.grasa_visceral != null ? b.grasa_visceral : "—"}</td></tr>`).join("")}
        </tbody></table>`;

      // ── Diario del mes ──
      const diarioHTML = diarioMes.length === 0 ? '<p class="vacio">Sin entradas de diario este mes.</p>' :
        diarioMes.map((d) => `
        <div class="entrada"><div class="entrada-fecha">${fmtF(d.fecha)}</div>
        <p>${esc(d.texto)}</p>
        ${d.respuesta ? `<div class="respuesta"><span>Respuesta del entrenador</span><p>${esc(d.respuesta)}</p></div>` : ""}</div>`).join("");

      const datos = [
        ["Nombre", alumno.nombre],
        ["Edad", (calcularEdad(alumno.fecha_nacimiento) || alumno.edad || "—") + " años"],
        ["Peso corporal", alumno.peso ? alumno.peso + " kg" : "—"],
        ["Altura", alumno.altura ? alumno.altura + " cm" : "—"],
        ["Modalidad", modalidadLabel(alumno.modalidad) || "Sin definir"],
        ["Días de entrenamiento", (alumno.horarios || []).map((h) => h.dia).join(" · ") || "—"],
      ].map(([l, v]) => `<div class="dato"><span>${l}</span><strong>${esc(v)}</strong></div>`).join("");

      const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reporte ${esc(mesLabel)} — ${esc(alumno.nombre)} — Desarrollo Integral</title>
<style>
  :root { --negro:#0a0a0a; --gris:#555; --gris-claro:#999; --linea:#e4e4e4; --rojo:#c8102e; --fondo:#fff; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif; background:var(--fondo); color:var(--negro); line-height:1.55; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .hoja { max-width:840px; margin:0 auto; padding:48px 40px 64px; }
  header { display:flex; align-items:center; gap:20px; padding-bottom:24px; border-bottom:3px solid var(--negro); }
  header img { width:72px; height:72px; }
  .marca .nombre { font-size:22px; font-weight:900; letter-spacing:4px; text-transform:uppercase; }
  .marca .sub { font-size:10px; letter-spacing:5px; text-transform:uppercase; color:var(--gris); margin-top:2px; }
  .titulo-reporte { display:flex; justify-content:space-between; align-items:baseline; margin:28px 0 6px; }
  .titulo-reporte h1 { font-size:26px; font-weight:900; letter-spacing:.5px; }
  .titulo-reporte .mes { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:var(--rojo); }
  .meta { font-size:11px; color:var(--gris-claro); margin-bottom:32px; }
  section { margin-bottom:36px; page-break-inside:avoid; }
  section.rompible { page-break-inside:auto; }
  h2 { font-size:11px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:var(--negro); border-left:3px solid var(--rojo); padding-left:10px; margin-bottom:14px; }
  h3 { font-size:14px; font-weight:800; margin:18px 0 8px; }
  h3 .plan-nombre { font-weight:500; color:var(--gris); font-size:12px; }
  .subdia { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--gris); margin:12px 0 6px; }
  .datos-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:12px 24px; }
  .dato span { display:block; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--gris-claro); }
  .dato strong { font-size:14px; font-weight:700; }
  table { width:100%; border-collapse:collapse; font-size:12.5px; margin-bottom:4px; }
  table.mitad { max-width:420px; }
  th { text-align:left; font-size:9.5px; letter-spacing:1.5px; text-transform:uppercase; color:var(--gris); border-bottom:2px solid var(--negro); padding:6px 10px 6px 0; }
  td { border-bottom:1px solid var(--linea); padding:7px 10px 7px 0; vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  .fch { color:var(--gris-claro); font-size:11px; }
  .arrow { color:var(--rojo); font-weight:900; }
  .mescol { color:var(--gris); font-size:11.5px; }
  .vacio { font-size:12.5px; color:var(--gris-claro); font-style:italic; }
  .nota-tabla { font-size:11px; color:var(--gris); margin:6px 0 10px; }
  .entrada { border-left:2px solid var(--linea); padding:2px 0 2px 14px; margin-bottom:16px; }
  .entrada-fecha { font-size:10px; font-weight:800; letter-spacing:2px; color:var(--gris); margin-bottom:3px; }
  .entrada p { font-size:13px; }
  .respuesta { margin-top:8px; background:#f6f6f6; border-radius:6px; padding:8px 12px; }
  .respuesta span { display:block; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--rojo); font-weight:800; margin-bottom:2px; }
  .respuesta p { font-size:12.5px; }
  footer { margin-top:48px; padding-top:16px; border-top:1px solid var(--linea); display:flex; justify-content:space-between; font-size:9.5px; letter-spacing:2px; text-transform:uppercase; color:var(--gris-claro); }
  @media print { .hoja { padding:24px 8px; max-width:none; } body { font-size:12px; } @page { margin:14mm; } }
</style></head>
<body><div class="hoja">
  <header>
    <img src="${ICON_BLACK}" alt="Desarrollo Integral">
    <div class="marca"><div class="nombre">Desarrollo Integral</div><div class="sub">Centro de Entrenamiento</div></div>
  </header>
  <div class="titulo-reporte"><h1>${esc(alumno.nombre)}</h1><div class="mes">Reporte · ${esc(mesLabel)}</div></div>
  <div class="meta">Generado el ${new Date().toLocaleDateString("es-AR")} · Documento de uso interno de Desarrollo Integral</div>
  <section><h2>Datos del alumno</h2><div class="datos-grid">${datos}</div></section>
  <section class="rompible"><h2>Plan de entrenamiento y progresión de cargas</h2>${planHTML || '<p class="vacio">Sin plan asignado.</p>'}</section>
  <section><h2>Asistencia — ${esc(mesLabel)}</h2>${asisHTML}</section>
  <section><h2>Pesos máximos</h2>${rmHTML}</section>
  <section><h2>Bioimpedancia</h2>${bioHTML}</section>
  <section class="rompible"><h2>Diario del alumno — ${esc(mesLabel)}</h2>${diarioHTML}</section>
  <footer><span>Desarrollo Integral</span><span>${esc(mesLabel)}</span></footer>
</div></body></html>`;

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${mes}-${alumno.nombre.replace(/\s+/g, "-").toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast && showToast("Reporte exportado");
    } catch (e) {
      console.error("[exportarReporteMensual]", e);
      showToast && showToast("Error exportando: " + e.message);
    }
  };

  const crearAlumno = async () => {
    // Anti doble-submit: dos clicks rápidos en "Crear" insertaban el alumno
    // DOS veces con el mismo código y el login moría con "PIN inválido"
    // (caso Franco 2026-07-20). La base además tiene índice único de código.
    if (_creandoAlumno.current) return false;
    if (!nn || !nc || !npin) {
      showToast && showToast("Completa todos los campos requeridos");
      return false;
    }
    if (npin.length !== 4) {
      showToast && showToast("Clave debe tener 4 dígitos");
      return false;
    }
    if (PIN_TRIVIAL(npin)) {
      showToast && showToast("Elegí una clave menos obvia (nada de 1234 o 0000)");
      return false;
    }
    _creandoAlumno.current = true;
    // 2026-08-12 — lo que se elige por día ahora sale de `plan_variantes` (las
    // rutinas reales que escribió Lucas) o es SIN_PLAN. La traducción a un plan
    // guardable es pura y está testeada: src/utils/planVariantes.js.
    const elegido = (valor) => planDeEleccion(valor, variantes, catalogoIdx);
    const tpl = elegido(ntemplate).plan;
    // El plan que se guarda en `planes` tiene que ser un objeto COMPLETO
    // (dias, movilidad, calor, activacion, periodizacion). Si se guarda la
    // fila cruda de alumno_planes, la vista del alumno hace .map sobre
    // undefined y la app se va a pantalla negra.
    const planCompleto = (row, template) => ({
      ...row,
      dias:          template.dias          || [],
      movilidad:     template.movilidad     || [],
      calor:         template.calor         || [],
      activacion:    template.activacion    || [],
      periodizacion: template.periodizacion || [],
    });
    try {
      const nuevoAl = await crearAlumnoConPIN(nn, nc, npin, na, np, nfecha || null, ntipo, ne || null, nmodalidad || null);
      const alumnoConPlan = {
        ...nuevoAl,
        modalidad: nuevoAl.modalidad || nmodalidad || "",
        // 2026-08-09: el video no viaja en crearAlumnoConPIN (que ya tiene 9
        // parámetros posicionales) — se guarda con el autosave normal, que
        // manda payloadAlumno con la columna video_movilidad.
        video_movilidad: ntipo === "video" ? nvideo || "" : "",
        // Solo días de entrenamiento, sin horario (pedido de Lucas 2026-07-17).
        // 2026-08-12: al alumno "solo video" no se le guardan días — "los que
        // son solo video no importa el día de entrenamiento". Sin este filtro,
        // marcar días y después cambiar el tipo dejaba días fantasma en la
        // ficha de alguien que solo entra a mirar un video.
        horarios: ntipo === "video" ? [] : Object.keys(ndias).map((d) => ({ dia: d, hora: "" })),
        // Género (ronda 12): sin migración, vive en rm.genero — mismo patrón
        // que movilidad_default/secciones_config. Se guarda solo con el
        // autosave normal de alumnos (onUpdate → guardarDatos).
        rm: { ...(nuevoAl.rm || {}), genero: ngenero || undefined },
        plan: JSON.parse(JSON.stringify(tpl)),
        planes: [],
        plantilla_id: null,
      };

      // Crear planes para los días seleccionados.
      // 2026-08-12: el alumno "solo video" no lleva ningún plan — antes, al no
      // tener días marcados, caía en el else y se le creaba un plan "Fijo" que
      // nunca iba a ver nadie.
      const diasAsignados = ntipo === "video" ? [] : Object.keys(ndias);
      if (ntipo === "video") {
        // sin planes: entra, ve su video y nada más
      } else if (diasAsignados.length > 0) {
        for (const dia of diasAsignados) {
          const { plan: planTemplate, origen } = elegido(ndias[dia] || ntemplate);
          const res = await crearPlanAlumno(nuevoAl.id, dia, planTemplate, origen);
          if (res.ok) {
            alumnoConPlan.planes.push(planCompleto(res.data, planTemplate));
          }
        }
      } else {
        // Sin días marcados: un solo plan "Fijo" (todos los días) con lo que
        // se haya elegido arriba — que puede ser SIN_PLAN, y está bien.
        const { origen } = elegido(ntemplate);
        const res = await crearPlanAlumno(nuevoAl.id, "Fijo", tpl, origen);
        if (res.ok) {
          alumnoConPlan.planes.push(planCompleto(res.data, tpl));
        }
      }

      // Actualizar estado local
      onUpdate((prev) => [...(Array.isArray(prev) ? prev : []), alumnoConPlan]);
      setNn("");
      setNc("");
      setNpin("");
      setNp("");
      setNa("");
      setNe("");
      setNfecha("");
      setNmodalidad("");
      setNgenero("");
      setNtipo("entrenamiento");
      setNvideo("");
      setNtemplate(SIN_PLAN);
      setNdias({});
      showToast && showToast("Alumno creado");
      setSec("dashboard");
      return true;
    } catch (e) {
      console.error("[crearAlumno] Excepción:", e);
      showToast && showToast(e?.message?.includes("ya está en uso") ? e.message : "Error inesperado. Ver consola.");
      return false;
    } finally {
      _creandoAlumno.current = false;
    }
  };
  // "__sin_plan__" (ronda 12, punto 7): sentinel — NO es una plantilla real de
  // PLANTILLAS, asigna un plan vacío A PROPÓSITO (fila real en alumno_planes,
  // nombre "Sin plan", sin días/ejercicios). Distinto de no tener fila:
  // permite dejar un día deliberadamente sin contenido en vez de sacarlo.
  const asignarPlanDia = async (plantillaId, diaOverride) => {
    // diaOverride (punto 8): el flujo "+ Agregar día" elige un día que
    // todavía no tiene tile propio en la grilla — pasa el día explícito en
    // vez de depender de selectedDia (que sigue funcionando para los tiles
    // normales, que no pasan diaOverride).
    const dia = diaOverride || selectedDia;
    if (!dia || !al) return;
    const esSinPlan = plantillaId === "__sin_plan__";
    const plantilla = esSinPlan ? { nombre: "Sin plan", plan: { dias: [], movilidad: [], calor: [], activacion: [], periodizacion: [] } } : getPlantilla(plantillaId);
    // REEMPLAZO, no solapamiento (bug ronda 4): si el día ya tiene un plan,
    // confirmar y reemplazarlo — crearPlanAlumno borra el previo en la base.
    const existente = (al.planes || []).find((p) => p.dia_semana === dia && !p._sintetico);
    if (existente && !window.confirm(`${dia} ya tiene el plan "${existente.nombre || "sin nombre"}". ¿Reemplazarlo por "${plantilla.nombre}"?`)) return;
    const tpl = esSinPlan ? plantilla.plan : clonarPlan(plantilla.plan);
    await _guardarPlanEnDia(dia, { ...tpl, nombre: plantilla.nombre });
  };
  // 2026-08-10 — el guardado es EL MISMO para una plantilla de PLANTILLAS y
  // para una variante de `plan_variantes`: lo único que cambia es de dónde
  // sale el objeto {nombre, dias}. Se extrae acá para no duplicar el
  // crearPlanAlumno + refresco de la ficha en dos lugares.
  const _guardarPlanEnDia = async (dia, planListo, origen) => {
    try {
      const result = await crearPlanAlumno(al.id, dia, planListo, origen);
      if (result.ok) {
        showToast && showToast(`Plan "${planListo.nombre}" asignado para ${dia}`);
        const alumnoActualizado = {
          ...al,
          planes: await cargarPlanesXDia(al.id, al)
        };
        onUpdate(alumnos.map((a) => (a.id === al.id ? alumnoActualizado : a)));
        setSelectedDia(null);
        setAgregandoDia(false);
      } else {
        showToast && showToast("Error al asignar plan");
      }
    } catch (e) {
      console.error("[_guardarPlanEnDia]", e);
      showToast && showToast("Error: " + e.message);
    }
  };
  // Asignar una VARIANTE (bilateral · unilateral · ppl · híbridas) a un día.
  // Antes del 2026-08-10 no existía: las 10 variantes vivían en la base sin
  // ninguna pantalla que las ofreciera. La traducción variante → plan la hace
  // varianteAPlan, que es pura y está testeada (src/utils/planVariantes.js).
  const asignarVarianteDia = async (variante, diaOverride) => {
    const dia = diaOverride || selectedDia;
    if (!dia || !al || !variante) return;
    const existente = (al.planes || []).find((p) => p.dia_semana === dia && !p._sintetico);
    if (existente && !window.confirm(`${dia} ya tiene el plan "${existente.nombre || "sin nombre"}". ¿Reemplazarlo por "${variante.nombre}"?`)) return;
    await _guardarPlanEnDia(dia, varianteAPlan(variante, catalogoIdx || {}), "catalogo_v2");
  };
  // Eliminar directamente el plan de un día desde Planificación (punto 7).
  const quitarDia = async (dia) => {
    if (!al) return;
    if (!window.confirm(`¿Eliminar el plan de "${dia}" de ${al.nombre}? El día deja de tener plan (distinto de "Sin plan").`)) return;
    const ok = await eliminarPlanDia(al.id, dia);
    if (!ok) { showToast && showToast("Error al eliminar . Revisá la consola"); return; }
    const alumnoActualizado = { ...al, planes: await cargarPlanesXDia(al.id, al) };
    onUpdate(alumnos.map((a) => (a.id === al.id ? alumnoActualizado : a)));
    setSelectedDia(null);
    showToast && showToast(`Plan de "${dia}" eliminado`);
  };
  // ELEGIDOR DE PLAN DE UN DÍA (2026-08-10) — un solo elegidor para los dos
  // flujos (tocar un día que ya existe · "+ Agregar día"). Antes eran dos
  // listas de botones copiadas y sumar las variantes en las dos habría
  // duplicado el problema. La pantalla vive en SelectorPlanDia.jsx para que se
  // pueda mirar en el banco de pruebas sin pasar por el login del admin.
  // `desdeAgregar` = viene de "+ Agregar día": ahí "Volver" tiene que devolver
  // a la elección del día, no cerrar todo el flujo.
  const selectorDePlan = (dia, desdeAgregar = false) => (
    <SelectorPlanDia
      dia={dia}
      grupos={gruposVariantes}
      tienePlan={!!(al?.planes || []).find((p) => p.dia_semana === dia && !p._sintetico)}
      onVariante={(v) => asignarVarianteDia(v, dia)}
      onSinPlan={() => asignarPlanDia("__sin_plan__", dia)}
      onQuitar={() => quitarDia(dia)}
      onVolver={() => { setSelectedDia(null); if (!desdeAgregar) setAgregandoDia(false); }}
    />
  );
  return (
    <div
      style={{
        minHeight: "100vh",
        background: S.bg,
        maxWidth: wide ? 1180 : 480,
        margin: "0 auto",
        padding: wide ? "0 24px" : 0,
        fontFamily: "inherit",
        paddingBottom: 60,
        boxSizing: "border-box",
      }}
    >
      {/* El panel admin no montaba GlobalStyles: por eso no le llegaban ni la
          grilla de escritorio (.di-grid-cards), ni :focus-visible, ni el
          respeto por prefers-reduced-motion. Detectado midiendo en produccion
          despues del primer deploy. */}
      <GlobalStyles />
      {/* Toast de "Deshacer" — se monta una sola vez por vista, flotante. */}
      {ToastUI}
      {" "}
      {/* Header en 2 filas (2026-07-21, pedido de Lucas sobre un screenshot
          de mobile: antes título + botones compartían un renglón con
          justify-content:space-between y "Panel Admin"/"Desarrollo Integral"
          apilados verticalmente — en 375px el título se partía en 2 líneas
          y los botones se apretaban/desbordaban contra él).
          Fila 1: logo + título, todo en una sola línea horizontal.
          Fila 2 (renglón propio): los botones de acción (4 desde la
          ronda 16, punto 4 — se sacó "🖥 Armador" del header). */}
      {/* Ronda 17 (punto 2): "DESARROLLO INTEGRAL" pasa a ser la pieza
          protagonista del header (antes era "Panel Admin" el texto grande y
          el wordmark quedaba chico, gris, sin la fuente de marca) — mismo
          criterio tipográfico que el login/header del alumno: FONT_DISPLAY
          para el wordmark, ícono más grande (24→32). "Panel Admin" pasa a
          ser el eyebrow chico arriba. */}
      {/* Ronda 18: logo al DOBLE (32→64, y encima ICON_CROP sin aire
          interno — visualmente mucho más grande), clickeable → Dashboard
          (pantalla inicial del admin). "DESARROLLO INTEGRAL" centrado en
          el medio real del header (el logo va absolute a la izquierda, el
          texto se centra sobre el ancho total). */}
      <div style={{ padding: "14px 16px 0", marginBottom: 14, borderBottom: "1px solid " + S.border, paddingBottom: 14 }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 62, marginBottom: 12 }}>
          <img
            src={ICON_CROP}
            width={62}
            alt="DI"
            title="Ir al Dashboard"
            onClick={() => { setSec("dashboard"); setForm(null); }}
            style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", height: "auto", cursor: "pointer" }}
          />
          <div style={{ textAlign: "center", minWidth: 0, padding: "0 68px" }}>
            <div style={{ ...eyebrow, fontSize: 14 }}>Panel Admin</div>
            <div style={{ color: S.white, fontWeight: 800, fontSize: "clamp(16px, 5vw, 22px)", letterSpacing: 0.8, textTransform: "uppercase", fontFamily: FONT_DISPLAY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.15 }}>
              Desarrollo Integral
            </div>
          </div>
        </div>
        {/* 2026-08-13 (auditoría de uso): los 4 controles de esta fila —los que
            el profe tiene siempre a mano durante la clase— medían 153x35,
            38x36, 38x37 y 56x32: ninguno llegaba al piso táctil de 44px. Ahora
            los cuatro declaran TAP. `flexWrap` para que, con el zoom del
            sistema al 200%, la fila baje de renglón en vez de empujar "Cerrar"
            fuera de la pantalla. */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {/* Modo entrenador (ronda 9) — al lado del toggle de tema */}
          <button
            onClick={onModoEntrenador}
            title="Modo entrenador: operar la app como un alumno"
            style={{
              flex: "1 1 140px",
              minWidth: 0,
              minHeight: TAP,
              background: S.card3,
              color: S.white,
              border: "1px solid " + S.border2,
              borderRadius: 8,
              padding: "8px 6px",
              fontSize: "clamp(11px, 3vw, 13px)",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dumbbell size={15} />Modo Entrenador</span>
          </button>
          {/* Ronda 16 (punto 4): el botón "🖥 Armador" (pantalla aparte) se
              sacó — esa función ahora vive DENTRO de "📚 Biblioteca de
              ejercicios" (botón "+ Crear plan de entrenamiento"). */}
          <button
            onClick={onToggleTheme}
            title={darkMode ? "Modo claro" : "Modo oscuro"}
            aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            style={{
              flexShrink: 0,
              minWidth: TAP,
              minHeight: TAP,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              color: S.gray,
              border: "1px solid " + S.border2,
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            onClick={() => { setSec("config"); setForm(null); }}
            title="Configuración"
            style={{
              flexShrink: 0,
              minWidth: TAP,
              minHeight: TAP,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: sec === "config" ? S.white : "transparent",
              color: sec === "config" ? S.bg : S.gray,
              border: "1px solid " + (sec === "config" ? S.white : S.border2),
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Settings size={16} />
          </button>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              minWidth: TAP,
              minHeight: TAP,
              background: "transparent",
              color: S.gray,
              border: "1px solid " + S.border2,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>{" "}
      {/* Biblioteca de ejercicios — reubicada arriba de todo (2026-07-21,
          pedido de Lucas): antes vivía adentro del Dashboard, después de
          "Crear alumno" y bien abajo. Ahora es fija, visible sin importar
          el tab (Dashboard/Alumno), justo debajo de la fila de botones y
          arriba de los tabs.
          Ronda 16 (punto 2): esto es contexto Dashboard/Alumno, no
          Configuración — Lucas marcó que aparecía mezclado arriba de
          "Crear admin | Comunicados". Se excluye igual que los 3 tabs de
          abajo. */}
      {/* Ronda 17 (punto 2): el header, la navegación (Biblioteca +
          Dashboard/Alumno) y el buscador quedaban visualmente pegados, como
          un solo bloque confuso — cada uno pasa a ser un "módulo" separado
          con su propia card (fondo + borde), no solo texto suelto sobre el
          fondo de la pantalla. El header ya tiene su borderBottom (arriba). */}
      {/* Ronda 18 — MÓDULO DE NAVEGACIÓN: card nivel 1 con eyebrow, el
          switch Dashboard/Alumno como segmented control (labels 13px
          legibles) y la Biblioteca como botón propio nivel 3. Se distingue
          a simple vista del header (arriba, sin card) y del buscador
          (abajo, otra card con su propio eyebrow). */}
      {sec !== "config" && (
      <div style={{ ...card, margin: "0 16px 14px", padding: 12 }}>
        <div style={{ ...eyebrow, marginBottom: 8 }}>Navegación</div>
        <div style={segTrack()}>
          <button onClick={() => { setSec("dashboard"); setForm(null); }} style={{ ...segChip(sec === "dashboard"), fontSize: 13, padding: "10px 4px" }}>
            Dashboard
          </button>
          <button onClick={() => { setSec("alumnos"); setForm(null); }} style={{ ...segChip(sec !== "dashboard"), fontSize: 13, padding: "10px 4px" }}>
            Alumno
          </button>
        </div>
        <button
          onClick={() => setShowCatalogo(true)}
          style={{ width: "100%", marginTop: 8, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", fontWeight: 800, fontSize: 13, letterSpacing: 0.8, textTransform: "uppercase", cursor: "pointer", fontFamily: FONT_BODY }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}><BookOpen size={15} />Biblioteca de ejercicios</span>
        </button>
      </div>
      )}{" "}
      {/* 2) Selector de alumno — SOLO en el Dashboard (2026-07-21): adentro
          de la ficha el buscador y la fila con el nombre quedaban duplicados;
          para cambiar de alumno se vuelve al Dashboard. Módulo propio
          (ronda 17, punto 2) separado del bloque de navegación de arriba. */}
      {sec === "dashboard" && (
        <div style={{ ...card, margin: "0 16px 14px", padding: 12 }}>
          <div style={{ ...eyebrow, marginBottom: 8 }}>Buscar alumno</div>
          <AlumnoBuscador alumnos={alumnos} selId={selId} onSelect={(id) => { setSelId(id); setForm(null); }} />
        </div>
      )}{" "}
      {/* 3) ...y los submenús cuelgan del alumno elegido — ronda 9: TRES
          grupos grandes (Ejercicios · Planificación · Reportes). Ronda 12:
          NO se muestran en el Dashboard (sin alumno elegido todavía) — recién
          aparecen al entrar a la sección "Alumno" (o cualquier otra distinta
          de Dashboard, ej. tras tocar un alumno desde la lista). */}
      {/* Bug M (2026-07-21): estos 3 tabs son del contexto "alumno seleccionado"
          (Ejercicios/Planificación/Reportes) — antes aparecían también en
          Configuración porque la condición solo excluía "dashboard". */}
      {sec !== "dashboard" && sec !== "config" && (
      <div style={{ padding: "0 16px" }}>
        {/* 2026-08-12 — "Planificación" pasó a llamarse "Planes": adentro
            viven DOS cosas distintas que Lucas pidió separar (la Planificación
            propiamente dicha —la progresión— y el Plan de ejercicios), y que
            el grupo se llamara igual que una de sus dos partes era justamente
            lo que las hacía confundir.
            Además, al alumno "solo video" no se le muestra: no entrena, así
            que no tiene ni progresión ni ejercicios que asignarle. */}
        <IconDock
          items={[
            ["plan", "Ejercicios", Dumbbell],
            ["planes", "Planes", Calendar],
            ["reportes", "Reportes", BarChart3],
            ["evaluacion", "Evaluación", Stethoscope],
          ].filter(([k]) => !(al?.tipo === "video" && k === "planes"))}
          activo={sec}
          onSelect={(k) => { setSec(k); setForm(null); }}
        />
      </div>
      )}{" "}
      <div style={{ padding: "0 16px" }}>
        {" "}
        {sec === "dashboard" && (
          <div>
            <Dashboard
              alumnos={alumnos}
              selId={selId}
              onSelect={(id) => {
                setSelId(id);
                setSec("alumnos");
                setForm(null);
              }}
              // Auditoría 2026-07-30 — patrón de Gmail/Instagram/Mercado Libre:
              // en vez de frenar al usuario con un window.confirm() bloqueante
              // ANTES de actuar, se actúa y se ofrece "Deshacer" unos segundos.
              // Menos fricción y menos miedo, y el borrado real recién sale
              // cuando vence el plazo (ver useDeshacer en ToastDeshacer.jsx).
              onDelete={(id, nombre) => {
                const alumnoBorrado = alumnos.find((a) => a.id === id);
                const nuevos = alumnos.filter((a) => a.id !== id);
                onUpdate(nuevos);
                if (selId === id) setSelId(nuevos[0]?.id);
                ejecutarConDeshacer({
                  // 2026-08-04: ya no es un borrado real (ver deleteAlumno,
                  // migración 030) — el mensaje lo dice, para que quede
                  // claro que se puede recuperar después desde "Archivados",
                  // no solo dentro de los 6s del Deshacer.
                  mensaje: `${nombre} archivado`,
                  alDeshacer: () => {
                    onUpdate(alumnos);
                    setSelId(id);
                  },
                  alConfirmar: async () => {
                    try {
                      await deleteAlumno(id);
                    } catch (e) {
                      // Si la base rechaza el archivado, se repone en pantalla:
                      // nunca queda "borrado" acá y vivo allá.
                      console.error("[onDelete alumno]", e);
                      if (alumnoBorrado) onUpdate(alumnos);
                      showToast && showToast(`No se pudo archivar a ${nombre}`);
                    }
                  },
                });
              }}
              onNuevo={() => setShowCrearAlumno((v) => !v)}
              onBiblioteca={() => setShowCatalogo(true)}
              onDeselect={() => setSelId(null)}
              showToast={showToast}
              onToggleAsistencia={async (id, marcar) => {
                await saveDailyAttendance(id, hoy(), marcar);
                // Auditoría 2026-07-30: este toggle guardaba la fecha pelada,
                // sin hora — por eso el reporte de Asistencia mostraba "—" en
                // el horario para lo marcado desde acá. registroAsistencia()
                // arma "YYYY-MM-DD HH:mm" para hoy, igual que ya hacía el
                // auto-marcado del alumno.
                const nuevos = alumnos.map((a) => {
                  if (a.id !== id) return a;
                  const sinHoy = (a.asistencia || []).filter((f) => f.slice(0, 10) !== hoy());
                  return { ...a, asistencia: marcar ? [...sinHoy, registroAsistencia(hoy())] : sinHoy };
                });
                onUpdate(nuevos);
                showToast && showToast(marcar ? "Asistencia marcada" : "Asistencia borrada");
              }}
            />

            {/* 2026-08-10 — BibliotecaScreen se mudó al final del render,
                fuera de este bloque. Ver el comentario allá. */}

            {/* Formulario nuevo alumno — PANTALLA APARTE (modal, ronda 9):
                antes era inline y la página quedaba larguísima */}
            {showCrearAlumno && (
              <div
                style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.65)", overflowY: "auto", padding: "24px 12px 40px" }}
                onClick={() => setShowCrearAlumno(false)}
              >
              <div onClick={(e) => e.stopPropagation()} style={{ ...card, maxWidth: 440, margin: "0 auto", background: S.bg, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: S.white, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Crear nuevo alumno</div>
                  <button onClick={() => setShowCrearAlumno(false)} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 18, cursor: "pointer" }}><X size={16} /></button>
                </div>
                {/* TIPO DE ALUMNO — PRIMERA DECISIÓN (2026-08-12).
                    Antes estaba al final del formulario: había que completar
                    y scrollear todo el alta de entrenamiento para recién ahí
                    enterarse de que existía "Solo video" y ver cómo se caían
                    la mitad de los campos. Elegir el tipo primero es lo que
                    hace que el alta de un alumno de video sea, de verdad,
                    tres campos: nombre, clave y video. */}
                <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Tipo de alumno</div>
                {/* "Solo video" (2026-08-09): el alumno entra y ve únicamente
                    el video que Lucas le grabó. No lleva plan, ni días, ni
                    modalidad — por eso el resto del formulario se esconde. */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
                  {[[<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dumbbell size={14} />Entrenamiento</span>, "entrenamiento"], [<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Play size={14} />Solo video</span>, "video"]].map(([l, k]) => (
                    <button key={k} onClick={() => setNtipo(k)} style={{ background: ntipo === k ? S.white : S.card, color: ntipo === k ? S.bg : S.gray, border: "1px solid " + (ntipo === k ? S.white : S.border), borderRadius: 8, padding: "10px 4px", fontSize: 11, fontWeight: 700, cursor: "pointer", minHeight: TAP }}>{l}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: S.lgray, marginBottom: 14 }}>
                  {ntipo === "video"
                    ? "Entra y ve su video, nada más: sin días de entrenamiento, sin plan y sin planificación."
                    : "Entrena: se le cargan días, plan de ejercicios y planificación."}
                </div>
                {ntipo === "video" && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>Video de movilidad</div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (!f) return;
                        setNsubiendo(true);
                        try {
                          // Va al bucket privado rehab-media, el mismo que ya
                          // se usaba para media grabada con el celular.
                          setNvideo(await subirMediaRehab(f));
                          showToast && showToast("Video subido");
                        } catch (err) {
                          showToast && showToast(err.message || "No se pudo subir el video");
                        } finally { setNsubiendo(false); }
                      }}
                      style={{ ...inp, padding: 8 }}
                    />
                    <div style={{ fontSize: 11, color: nvideo ? S.green : S.lgray, marginTop: 4 }}>
                      {nsubiendo ? "Subiendo..." : nvideo ? "Video cargado" : "Se puede crear sin video y subirlo después desde la ficha."}
                    </div>
                  </div>
                )}
                {/* 2026-08-09: el alta de un alumno "Solo video" es corta a
                    propósito — nombre, clave y video. Peso, altura, email y
                    fecha no aplican a alguien que solo entra a mirar. */}
                {[["Nombre completo", nn, setNn], ["Username (para login)", nc, setNc], ["Clave (4 dígitos)", npin, setNpin], ["Email", ne, setNe], ["Peso (kg)", np, setNp], ["Altura (cm)", na, setNa]]
                  .filter(([label]) => ntipo !== "video" || label === "Nombre completo" || label.startsWith("Username") || label.startsWith("Clave"))
                  .map(([label, val, set]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                    {/* Auditoría 2026-07-30: Clave son 4 dígitos (entero),
                        Peso y Altura admiten coma (72,5 kg / 1,78 m). Sin
                        `inputMode` los tres abrían el teclado alfabético. */}
                    <input
                      type={label === "Email" ? "email" : "text"}
                      inputMode={label.startsWith("Clave") ? "numeric" : (label.startsWith("Peso") || label.startsWith("Altura")) ? "decimal" : undefined}
                      autoComplete="off"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      placeholder={label === "Email" ? "para mandarle el acceso más adelante" : undefined}
                      style={inp}
                    />
                  </div>
                ))}
                {ntipo !== "video" && (<>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>Fecha de nacimiento</div>
                  <input type="date" value={nfecha} onChange={(e) => setNfecha(e.target.value)} style={inp} />
                  {nfecha && <div style={{ fontSize: 11, color: S.green, marginTop: 4 }}>Edad: {calcularEdad(nfecha)} años</div>}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Modalidad de entrenamiento</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {MODALIDADES.map((m) => {
                      const activa = nmodalidad === m;
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            const nueva = activa ? "" : m;
                            setNmodalidad(nueva);
                            // Elegir con quién entrena implica que entrena.
                            if (nueva) setNtipo("entrenamiento");
                          }}
                          style={{ background: activa ? S.white : S.card2, color: activa ? S.bg : S.gray, border: "1px solid " + (activa ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left", lineHeight: 1.3 }}
                        >
                          {activa && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{m}
                        </button>
                      );
                    })}
                  </div>
                  {!nmodalidad && <div style={{ fontSize: 14, color: S.lgray, marginTop: 6 }}>Sin definir — tocá una para asignarla</div>}
                </div>
                {/* Género (ronda 12): pill simple M/F — define el saludo de la
                    Bienvenida ("¡Bienvenido!" / "¡Bienvenida!"). Sin setear
                    queda el fallback neutro de siempre. */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Género</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[["M", "Hombre"], ["F", "Mujer"]].map(([id, l]) => {
                      const activa = ngenero === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setNgenero(activa ? "" : id)}
                          style={{ background: activa ? S.white : S.card2, color: activa ? S.bg : S.gray, border: "1px solid " + (activa ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          {activa && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{l}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* DÍAS Y PLAN DE EJERCICIOS (2026-08-12) — reclamo de Lucas:
                    "no me aparecen los planes que tenemos organizados". El
                    desplegable ofrecía PLANTILLAS (planTemplates.js, podado a
                    2), no las rutinas reales de `plan_variantes`. Ahora lista
                    las mismas variantes agrupadas por familia que el selector
                    por día del panel (SelectorPlanDia) — mismos datos, mismas
                    etiquetas — y arriba de todo "Sin plan", que es el
                    predeterminado: crear un alumno no le impone una rutina que
                    nadie eligió. */}
                <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Días de entrenamiento y plan de ejercicios</div>
                <div style={{ fontSize: 11, color: S.lgray, marginBottom: 8 }}>
                  Tocá los días que entrena — a cada día le podés poner un plan distinto, o dejarlo sin plan. La progresión (series, repeticiones e intensidad por semana) se elige aparte, en Planes → Planificación.
                </div>
                <SelectorDiasAlta
                  dias={DIAS_SEM}
                  seleccion={ndias}
                  grupos={gruposVariantes}
                  onToggle={(d) => setNdias((prev) => { const n = { ...prev }; if (n[d] != null) delete n[d]; else n[d] = ntemplate; return n; })}
                  onPlan={(d, valor) => setNdias((prev) => ({ ...prev, [d]: valor }))}
                />
                <div style={{ marginBottom: 14 }} />
                </>)}
                {/* Ronda 9: "Todos los planes" es un VISOR — tocar un plan abre
                    una ventana con sus ejercicios explicados. El plan del
                    alumno se asigna por día, arriba.
                    2026-08-12: el visor también pasó a las variantes reales.
                    Mostraba las 2 plantillas viejas, así que Lucas no podía
                    mirar antes de asignar ninguna de las rutinas que escribió. */}
                {ntipo !== "video" && (<>
                <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Todos los planes de ejercicios</div>
                <div style={{ fontSize: 11, color: S.lgray, marginBottom: 8 }}>Tocá un plan para ver sus ejercicios con las descripciones. La asignación se hace por día, arriba.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {gruposVariantes.flatMap((g) => g.variantes).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setPlanVisor({ nombre: v.nombre, descripcion: v.descripcion || "", plan: varianteAPlan(v, catalogoIdx || {}) })}
                      title={v.descripcion || v.nombre}
                      style={{ background: S.card, color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: "10px 6px", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "left", lineHeight: 1.3 }}
                    >
                      {etiquetaVariante(v)} <Eye size={13} style={{ verticalAlign: "-2px" }} />
                    </button>
                  ))}
                  {gruposVariantes.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", color: S.lgray, fontSize: 12 }}>Cargando los planes…</div>
                  )}
                </div>
                </>)}
                <button
                  onClick={async () => {
                    if (nn && nc && npin) {
                      if (!window.confirm(`Estás creando el alumno ${nn.trim()}. ¿Confirmar?`)) return;
                    }
                    const ok = await crearAlumno();
                    if (ok) setShowCrearAlumno(false);
                  }}
                  style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 900, cursor: "pointer" }}
                >
                  CREAR ALUMNO
                </button>
              </div>
              </div>
            )}
            {/* Visor de plan (ronda 9): ejercicios del plan con descripciones */}
            {planVisor && (
              <div
                style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(0,0,0,0.7)", overflowY: "auto", padding: "24px 12px 40px" }}
                onClick={() => setPlanVisor(null)}
              >
                <div onClick={(e) => e.stopPropagation()} style={{ ...card, maxWidth: 440, margin: "0 auto", background: S.bg, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ color: S.white, fontWeight: 800, fontSize: 16 }}>{planVisor.nombre}</div>
                    <button onClick={() => setPlanVisor(null)} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 18, cursor: "pointer" }}><X size={16} /></button>
                  </div>
                  {planVisor.descripcion && <div style={{ color: S.gray, fontSize: 12, marginBottom: 12 }}>{planVisor.descripcion}</div>}
                  {(planVisor.plan.periodizacion || []).length > 0 && (
                    <div style={{ fontSize: 11, color: S.lgray, marginBottom: 12 }}>
                      Periodización: {planVisor.plan.periodizacion.length} semanas ·{" "}
                      {planVisor.plan.periodizacion[0].series}x{planVisor.plan.periodizacion[0].reps} al {planVisor.plan.periodizacion[0].intensidad} →{" "}
                      {planVisor.plan.periodizacion[planVisor.plan.periodizacion.length - 1].series}x{planVisor.plan.periodizacion[planVisor.plan.periodizacion.length - 1].reps} al {planVisor.plan.periodizacion[planVisor.plan.periodizacion.length - 1].intensidad}
                    </div>
                  )}
                  {(planVisor.plan.dias || []).map((d, di) => (
                    <div key={di} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 14, color: S.gray, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                        {(planVisor.plan.dias || []).length > 1 ? d.dia + " — " : ""}{d.subtitulo || "Ejercicios principales"}
                      </div>
                      {(d.ejercicios || []).map((ej, i) => (
                        <div key={i} style={{ background: S.card2, border: "1px solid " + S.border, borderRadius: 8, padding: "9px 12px", marginBottom: 6 }}>
                          <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{i + 1}. {ej.nombre}</div>
                          {ej.desc && <div style={{ color: S.gray, fontSize: 11, marginTop: 2, lineHeight: 1.45 }}>{ej.desc}</div>}
                        </div>
                      ))}
                    </div>
                  ))}
                  <button onClick={() => setPlanVisor(null)} style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
                    CERRAR
                  </button>
                </div>
              </div>
            )}
          </div>
        )}{" "}
        {sec === "alumnos" && al && (
          <div>
            {/* Ronda 9: sin fila "← Volver · nombre" ni tab Diario — queda
                solo el Perfil (el diario vive en Reportes → Asistencia) */}
            {(<>
              {form ? (
                <div style={{ ...card, padding: 16 }}>
                  <div style={{ color: S.white, fontWeight: 700, marginBottom: 14 }}>Editar alumno</div>
                  {[
                    ["Nombre", form.nombre, "nombre"],
                    ["Username (login)", form.codigo, "codigo"],
                    ["Email", form.email, "email"],
                    ["Peso", form.peso, "peso"],
                    ["Altura", form.altura, "altura"],
                  ].map(([label, val, key]) => (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>{label}</div>
                      {/* Auditoría 2026-07-30: peso y altura son numéricos con
                          coma → teclado decimal en el celular. */}
                      <input
                        type={key === "email" ? "email" : "text"}
                        inputMode={key === "peso" || key === "altura" ? "decimal" : undefined}
                        autoComplete="off"
                        placeholder={key === "email" ? "para mandarle el acceso más adelante" : undefined}
                        value={val || ""}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: key === "codigo" ? e.target.value.toUpperCase() : e.target.value }))}
                        style={inp}
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>Fecha de nacimiento</div>
                    <input type="date" value={form.fecha_nacimiento || ""} onChange={(e) => setForm((f) => ({ ...f, fecha_nacimiento: e.target.value }))} style={inp} />
                    {form.fecha_nacimiento && <div style={{ fontSize: 11, color: S.green, marginTop: 4 }}>Edad: {calcularEdad(form.fecha_nacimiento)} años</div>}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: S.gray, marginBottom: 8, textTransform: "uppercase" }}>Modalidad de entrenamiento</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {/* 2026-07-30: a las 4 categorías se les suma, si hace
                          falta, la modalidad vieja que este alumno ya tenía y
                          no tiene equivalente (ej. "A distancia"). Se muestra
                          y se puede desmarcar — no se borra sola. */}
                      {[
                        ...MODALIDADES,
                        ...(form.modalidad && !MODALIDADES.includes(form.modalidad) ? [form.modalidad] : []),
                      ].map((m) => {
                        const activa = (form.modalidad || "") === m;
                        return (
                          <button
                            key={m}
                            onClick={() => setForm((f) => ({ ...f, modalidad: activa ? "" : m }))}
                            style={{ background: activa ? S.white : S.card2, color: activa ? S.bg : S.gray, border: "1px solid " + (activa ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left", lineHeight: 1.3 }}
                          >
                            {activa && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{m}
                          </button>
                        );
                      })}
                    </div>
                    {!form.modalidad && <div style={{ fontSize: 14, color: S.lgray, marginTop: 6 }}>Sin definir — tocá una para asignarla</div>}
                  </div>

                  {/* Género (ronda 12): define el saludo de la Bienvenida */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: S.gray, marginBottom: 8, textTransform: "uppercase" }}>Género</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {[["M", "Hombre"], ["F", "Mujer"]].map(([id, l]) => {
                        const activa = (form.genero || "") === id;
                        return (
                          <button
                            key={id}
                            onClick={() => setForm((f) => ({ ...f, genero: activa ? "" : id }))}
                            style={{ background: activa ? S.white : S.card2, color: activa ? S.bg : S.gray, border: "1px solid " + (activa ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                          >
                            {activa && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{l}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cambiar clave */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>Nueva clave (4 dígitos — dejá vacío para no cambiar)</div>
                    {/* Auditoría 2026-07-30: la clave son 4 dígitos — mismo
                        criterio que el PIN del login, teclado numérico. */}
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="new-password"
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value.slice(0, 4))}
                      placeholder="····"
                      maxLength={4}
                      style={inp}
                    />
                    {editPin.length > 0 && editPin.length < 4 && <div style={{ fontSize: 11, color: S.red, marginTop: 4 }}>La clave debe ser de 4 dígitos</div>}
                    {editPin.length === 4 && <div style={{ fontSize: 11, color: S.green, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={12} />Nueva clave lista para guardar</div>}
                  </div>

                  {/* Solo video (2026-08-09): marcar acá cambia la pantalla que
                      ve el alumno al entrar — pasa a ver únicamente su video de
                      movilidad, sin menú ni plan. */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: S.gray, marginBottom: 8, textTransform: "uppercase" }}>Pantalla del alumno</div>
                    <button
                      onClick={() => setForm((f) => ({ ...f, tipo: f.tipo === "video" ? "entrenamiento" : "video" }))}
                      style={{ width: "100%", background: form.tipo === "video" ? S.white : S.card2, color: form.tipo === "video" ? S.bg : S.gray, border: "1px solid " + (form.tipo === "video" ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left" }}
                    >
                      {form.tipo === "video" ? <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} /> : <Play size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}
                      Solo video (entra y ve nada más que su video)
                    </button>
                    {form.tipo === "video" && (
                      <div style={{ marginTop: 8 }}>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setNsubiendo(true);
                            try {
                              // 2026-08-12: el input NO se limpia antes de
                              // subir. En Android el File es un puntero al
                              // archivo de la Galería y soltarlo antes de
                              // tiempo deja al navegador sin poder leerlo: la
                              // subida se caía sin llegar nunca al servidor
                              // (así se perdieron los 3 intentos del video de
                              // Ángel). Se limpia recién al final, cuando el
                              // archivo ya está leído y subido.
                              // 2026-08-13: el aviso de "pesa mucho" llega por
                              // callback y se muestra ANTES de que termine la
                              // subida — es el único momento en que Lucas
                              // todavía puede elegir otro archivo.
                              const path = await subirMediaRehab(f, (m) => showToast && showToast(m));
                              setForm((prev) => ({ ...prev, video_movilidad: path }));
                              showToast && showToast("Video subido — acordate de Guardar");
                            } catch (err) {
                              showToast && showToast(err.message || "No se pudo subir el video");
                            } finally { setNsubiendo(false); e.target.value = ""; }
                          }}
                          style={{ ...inp, padding: 8 }}
                        />
                        <div style={{ fontSize: 11, color: form.video_movilidad ? S.green : S.lgray, marginTop: 4 }}>
                          {nsubiendo ? "Subiendo..." : form.video_movilidad ? "Video cargado" : "Todavía sin video — el alumno ve un mensaje explicándolo."}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Solo días de entrenamiento — sin hora del día (pedido de Lucas 2026-07-20).
                      2026-08-12: no se muestran para un alumno "solo video" —
                      "los que son solo video no importa el día de
                      entrenamiento". Marcar días ahí no cambiaba nada de lo
                      que ve el alumno, pero después aparecían en su ficha
                      como si entrenara. */}
                  {form.tipo !== "video" && (<>
                  <div style={{ fontSize: 11, color: S.gray, marginBottom: 8, textTransform: "uppercase" }}>Días de entrenamiento</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {DIAS_SEM.map((d) => {
                      const activo = (form.horarios || []).some((h) => h.dia === d);
                      return (
                        <button
                          key={d}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              horarios: activo
                                ? (f.horarios || []).filter((h) => h.dia !== d)
                                : [...(f.horarios || []), { dia: d, hora: "" }],
                            }))
                          }
                          style={{ background: activo ? S.white : S.card2, color: activo ? S.bg : S.gray, border: "1px solid " + (activo ? S.white : S.border), borderRadius: 6, padding: "8px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          {activo && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{d}
                        </button>
                      );
                    })}
                  </div>
                  </>)}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={async () => {
                        saveEdit();
                        if (editPin.length === 4) {
                          const ok = await cambiarPINAlumno(al.id, editPin);
                          showToast && showToast(ok ? "Clave actualizada" : "Error al cambiar la clave");
                          setEditPin("");
                        }
                      }}
                      style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontWeight: 900, cursor: "pointer" }}
                    >GUARDAR</button>
                    <button onClick={() => { setForm(null); setEditPin(""); }} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: "12px 16px", cursor: "pointer" }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ ...card, padding: "14px 16px" }}>
                  {/* 2026-08-13: el nombre no tenía `minWidth:0`, así que no
                      podía encogerse: quedaba pegado al botón Editar (0px de
                      aire) y empujaba la fila 2px fuera de la pantalla en
                      375px. Con `flex:1, minWidth:0` el nombre usa el ancho
                      que hay, envuelve, y los botones ya no salen del borde. */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
                      <FotoAlumno foto={al.foto} size={52} editable onFoto={(foto) => { guardarFotoAlumno(al.id, foto); onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, foto } : a))); }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: S.white, fontWeight: 700, fontSize: 16 }}>{al.nombre}</div>
                        <div style={{ color: S.gray, fontSize: 12, marginTop: 2 }}>@{al.username || al.codigo}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={startEdit} style={smallBtn(S.white)}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Pencil size={13} />Editar</span></button>
                      <button onClick={eliminarAlumno} style={smallBtn(S.red)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    {[["Peso", al.peso], ["Altura", al.altura], ["Edad", calcularEdad(al.fecha_nacimiento) || al.edad]].map(([l, v]) => (
                      <div key={l} style={{ flex: 1, background: S.card2, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                        <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{v || "—"}</div>
                        <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {/* 2026-07-30: se sacó el botón "Evaluar" de acá. Arriba de
                      esta misma pantalla ya está el tab "Evaluación", que
                      lleva exactamente al mismo lugar (sec="evaluacion") —
                      dos entradas al mismo módulo en la misma pantalla. Queda
                      el TAB porque es navegación persistente: está siempre a
                      la vista, en cualquier sección del alumno, no solo con
                      la ficha abierta. */}
                  {al.modalidad && (
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ background: S.card2, border: "1px solid " + S.border, borderRadius: 20, padding: "4px 12px", fontSize: 15, color: S.white, fontWeight: 600 }}>
                        {modalidadLabel(al.modalidad)}
                      </span>
                    </div>
                  )}
                  {/* Días de entrenamiento — 2026-07-30: eran texto muerto.
                      Ahora cada día es un link al plan de ESE día, con el
                      mismo salto que ya usan las filas de "Planes asignados"
                      de abajo (planFoco + planTab + sec="plan"). Si el día no
                      tiene plan todavía, en vez de no hacer nada lleva a
                      Planificación → Plan x día con el día ya elegido, que es
                      donde se le asigna uno.
                      2026-08-12: para el alumno "solo video" no se muestran ni
                      los días ni los planes asignados — no entrena, así que
                      todo eso era ruido que además invitaba a clickear hacia
                      pantallas que no le aplican. En su lugar va una línea que
                      dice qué es este alumno. */}
                  {al.tipo === "video" ? (
                    <div style={{ fontSize: 12, color: S.lgray, lineHeight: 1.5 }}>
                      Alumno de solo video: entra y ve su video, nada más. Sin días de entrenamiento, sin plan de ejercicios y sin planificación.
                    </div>
                  ) : (<>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(al.horarios || []).filter((h) => h.dia).map((h, i) => {
                      const planDelDia = (al.planes || []).find((p) => p.dia_semana === h.dia);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (planDelDia) {
                              setPlanFoco(planDelDia.id || null);
                              setPlanTab("entrenamiento");
                              setSec("plan");
                            } else {
                              setSelectedDia(h.dia);
                              setPlanesTab("plan-dias");
                              setSec("planes");
                            }
                            setForm(null);
                          }}
                          title={planDelDia ? `Ver el plan de ${h.dia}` : `Asignarle un plan a ${h.dia}`}
                          style={{
                            minHeight: TAP,
                            background: S.card2,
                            border: "1px solid " + (planDelDia ? S.border2 : S.border),
                            borderRadius: 8,
                            padding: "0 14px",
                            fontSize: TS.chip,
                            color: S.white,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {h.dia}
                          <span style={{ color: S.gray }}>›</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Planes REALES asignados (plan por día), con el de hoy marcado.
                      Antes acá había un "bilateral/unilateral" hardcodeado. */}
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid " + S.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Target size={13} />Planes asignados</span>
                      </div>
                      {/* Punto 6: la asignación de un plan predeterminado a
                          este alumno vive acá, separada del Armador (que
                          solo crea/edita plantillas). */}
                      <button onClick={() => setShowAsignarPlan(true)} style={smallBtn(S.white)}>
                        ＋ Asignar plan
                      </button>
                    </div>
                    {(al.planes || []).length === 0 ? (
                      <div style={{ fontSize: 12, color: S.lgray }}>
                        Sin planes asignados — asignalos en Plan → Plan Día
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {(al.planes || []).map((p, i) => {
                          const diaHoy = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"][new Date().getDay()];
                          const esHoy = p.dia_semana === diaHoy || (p.dia_semana === "Fijo" && !(al.planes || []).some((x) => x.dia_semana === diaHoy));
                          return (
                            <div
                              key={p.id || i}
                              onClick={() => {
                                // Ronda 7: tocar un plan abre el menú Plan con ESE plan listo para editar
                                setPlanFoco(p.id || null);
                                setPlanTab("entrenamiento");
                                setSec("plan");
                              }}
                              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: S.card2, border: "1px solid " + (esHoy ? S.green : S.border), borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
                            >
                              <div>
                                <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{p.nombre || "Plan sin nombre"}</div>
                                <div style={{ color: S.gray, fontSize: 14, marginTop: 1 }}>{p.dia_semana || "Fijo"}</div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {esHoy && <span style={{ color: S.green, fontSize: 14, fontWeight: 700 }}>● HOY</span>}
                                <span style={{ color: S.gray, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 3 }}><Pencil size={12} /> ›</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ fontSize: 14, color: S.lgray, marginTop: 8 }}>Tocá un plan para editarlo · para reemplazarlos: Planes → Plan de ejercicios</div>
                  </div>
                  </>)}
                  {showAsignarPlan && (
                    <AsignarPlanModal
                      al={al}
                      biblioteca={biblioteca}
                      onGuardarBiblioteca={onGuardarBiblioteca}
                      onGuardarParaTodos={(payload) => guardarParaTodos("principales", payload)}
                      showToast={showToast}
                      onClose={() => setShowAsignarPlan(false)}
                      onAsignado={async () => {
                        setShowAsignarPlan(false);
                        const planesFrescos = await cargarPlanesXDia(al.id, al);
                        onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, planes: planesFrescos } : a)));
                        showToast && showToast("Plan asignado");
                      }}
                    />
                  )}
                </div>
              )}
            </>)}
          </div>
        )}{" "}
        {sec === "plan" && (
          <div>
            {" "}
            {/* ── Ronda 10: la reorganización/ocultado de secciones vive DIRECTO
                en esta fila de tabs (reemplaza la card "Secciones que ve...").
                Cada chip de preparación tiene una "✕" para ocultar/mostrar
                (toggle — atenuado en el admin, oculto de verdad solo para el
                alumno) y soporta drag&drop nativo para reordenar. Mismo
                storage de siempre: rm.secciones_config = { orden, ocultas },
                con ids "movilidad"/"banda"/"peso" (los que usa PlanDelDia).
                "Principales" queda fijo al final, sin drag ni ocultar. ── */}
            {(() => {
              const SECCIONES_DEF = [["movilidad", "Movilidad"], ["banda", "Act. Elástico"], ["peso", "Entrada en calor"]];
              const TAB_KEY_BY_SECCION = { movilidad: "movilidad", banda: "calor", peso: "activacion" };
              const cfg = al ? (rm[al.id] && rm[al.id].secciones_config) || al.rm?.secciones_config || {} : {};
              const orden = (Array.isArray(cfg.orden) ? cfg.orden : []).filter((id) => SECCIONES_DEF.some((s) => s[0] === id));
              SECCIONES_DEF.forEach(([id]) => { if (!orden.includes(id)) orden.push(id); });
              const ocultas = Array.isArray(cfg.ocultas) ? cfg.ocultas : [];
              const toggleVis = (id) =>
                al && setSeccionesConfig({ orden, ocultas: ocultas.includes(id) ? ocultas.filter((x) => x !== id) : [...ocultas, id] });
              const reordenar = (idArrastrado, idDestino) => {
                if (!al || idArrastrado === idDestino || !orden.includes(idArrastrado) || !orden.includes(idDestino)) return;
                const n = orden.filter((x) => x !== idArrastrado);
                n.splice(n.indexOf(idDestino), 0, idArrastrado);
                setSeccionesConfig({ orden: n, ocultas });
              };
              const chips = orden.map((id) => {
                const def = SECCIONES_DEF.find((s) => s[0] === id);
                return { key: TAB_KEY_BY_SECCION[id], seccionId: id, label: def[1] };
              });
              chips.push({ key: "entrenamiento", seccionId: null, label: "Principales" });
              return (
                /* flexWrap (2026-08-13): estos chips no bajaban de renglón y
                   con el zoom del sistema al 200% "Principales" quedaba 291px
                   fuera de la pantalla. */
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
                  {chips.map((c) => {
                    const oculta = c.seccionId && ocultas.includes(c.seccionId);
                    return (
                      <div
                        key={c.key}
                        draggable={!!(al && c.seccionId)}
                        onDragStart={(e) => { if (c.seccionId) e.dataTransfer.setData("text/plain", c.seccionId); }}
                        onDragOver={(e) => { if (c.seccionId) e.preventDefault(); }}
                        onDrop={(e) => {
                          if (!c.seccionId) return;
                          e.preventDefault();
                          reordenar(e.dataTransfer.getData("text/plain"), c.seccionId);
                        }}
                        style={{ position: "relative", flex: "1 1 74px" }}
                      >
                        <button
                          onClick={() => setPlanTab(c.key)}
                          style={{
                            width: "100%",
                            background: planTab === c.key ? S.white : S.card,
                            color: planTab === c.key ? S.bg : S.gray,
                            border: "1px solid " + (planTab === c.key ? S.white : S.border),
                            borderRadius: 8,
                            padding: "7px 4px",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: al && c.seccionId ? "grab" : "pointer",
                            opacity: oculta ? 0.4 : 1,
                          }}
                        >
                          {c.label}
                        </button>
                        {al && c.seccionId && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleVis(c.seccionId); }}
                            title={oculta ? `Mostrar a ${al.nombre}` : `Ocultar a ${al.nombre}`}
                            style={{
                              position: "absolute",
                              top: -6,
                              right: -4,
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: oculta ? S.green : S.red,
                              color: "#fff",
                              border: "none",
                              fontSize: 14,
                              fontWeight: 900,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              lineHeight: 1,
                              padding: 0,
                            }}
                          >
                            {oculta ? "+" : <X size={12} />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}{" "}
            {planTab === "entrenamiento" && al && (
              <PlanesPrincipales
                key={al.id + "-" + (planFoco || "")}
                al={al}
                alumnos={alumnos}
                onUpdate={onUpdate}
                biblioteca={biblioteca}
                onGuardarBiblioteca={onGuardarBiblioteca}
                onGuardarParaTodos={(payload) => guardarParaTodos("principales", payload)}
                showToast={showToast}
                onIrPlanDia={() => { setSec("planes"); setPlanesTab("plan-dias"); }}
                initialPlanId={planFoco}
                diasModo={(rm[al.id] && rm[al.id].dias_modo) || al.rm?.dias_modo || "nombres"}
                onSetDiasModo={setDiasModo}
              />
            )}{" "}
            {planTab === "movilidad" && al && (
              <>
                {/* 2026-08-10 — bug de Lucas: "al cambiar la movilidad no
                    cambia los ejercicios". El selector cambiaba SOLO la
                    preferencia (rm.movilidad_default) y abajo se mostraba
                    siempre la misma lista, así que parecía un filtro roto.
                    Ahora las 3 versiones son 3 listas de verdad: el selector
                    elige cuál se ve y se edita, y "arranca acá" es un control
                    aparte — un botón, un trabajo. */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ ...n4Track(), justifyContent: "center" }}>
                    {[["superrapida", "Superrápida"], ["corta", "Corta"], ["completa", "Completa"]].map(([id, l]) => (
                      <button key={id} onClick={() => setMoviVer(id)} style={chipN4(moviVer === id)}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 14, color: S.lgray, textAlign: "center", marginTop: 6 }}>
                    Estás viendo los ejercicios de la versión {moviVer === "superrapida" ? "Superrápida" : moviVer === "corta" ? "Corta" : "Completa"}.
                  </div>
                  <div style={{ textAlign: "center", marginTop: 8 }}>
                    {(al.rm?.movilidad_default || "corta") === moviVer ? (
                      <span style={{ fontSize: 13, color: S.green }}>✓ {al.nombre} arranca en esta versión</span>
                    ) : (
                      <button onClick={() => setMoviDefault(moviVer)} style={smallBtn(S.gray)}>
                        Que {al.nombre} arranque en esta versión
                      </button>
                    )}
                  </div>
                </div>
                <PrepEditorAlumno
                  al={al}
                  id={"movilidad_" + moviVer}
                  globales={prepGlobales}
                  onGuardar={guardarPrepAlumno}
                  onVolverGlobal={volverPrepGlobal}
                  biblioteca={biblioteca}
                  onGuardarBiblioteca={onGuardarBiblioteca}
                  onGuardarParaTodos={(payload) => guardarParaTodos("movilidad", payload)}
                />
                <VideosMovilidadAdmin showToast={showToast} />
              </>
            )}{" "}
            {planTab === "calor" && al && (
              <PrepEditorAlumno
                al={al}
                id="calor"
                globales={prepGlobales}
                onGuardar={guardarPrepAlumno}
                onVolverGlobal={volverPrepGlobal}
                biblioteca={biblioteca}
                onGuardarBiblioteca={onGuardarBiblioteca}
                onGuardarParaTodos={(payload) => guardarParaTodos("calor", payload)}
              />
            )}{" "}
            {planTab === "activacion" && al && (
              <EjercicioEditor items={al.plan.activacion || []} onChange={(v) => updatePlan("activacion", v)} showVideo={true} biblioteca={biblioteca} onGuardarBiblioteca={onGuardarBiblioteca} onGuardarParaTodos={(payload) => guardarParaTodos("activacion", payload)} />
            )}{" "}
          </div>
        )}{" "}
        {/* ── Grupo PLANES: Periodización · Plan x día (ronda 10: se sacó el
            subtab "Eval. peso max" de acá — Lucas ahora carga los pesos
            máximos entrando como el alumno vía Modo Entrenador, no desde el
            admin. El bloque planesTab==="rm" de abajo queda en el código sin
            usar, ya no es alcanzable desde esta fila de tabs. ── */}
        {sec === "planes" && (
          <div>
            {/* DOS COSAS DISTINTAS, ELEGIDAS APARTE (2026-08-12) — pedido de
                Lucas: "quiero dejar las planificaciones separadas de los
                planes de ejercicios". En la base ya estaban separadas
                (`periodizaciones` vs `plan_variantes`); lo que se confundía
                era la pantalla, porque las dos vivían bajo el mismo nombre
                ("Planificación") y la pestaña de ejercicios se llamaba "Plan x
                día", que no dice qué es. Ahora cada una se llama por lo que
                es, y el renglón de abajo lo dice en castellano llano: una es
                la progresión, la otra son los ejercicios. Ninguna de las dos
                es obligatoria — las dos tienen su "sin ninguno". */}
            <div style={{ ...segTrack(), marginBottom: 6 }}>
              {[
                ["Planificación", "periodizacion"],
                ["Plan de ejercicios", "plan-dias"],
              ].map(([l, k]) => (
                // El chip de nivel 3 corta con "…" (whiteSpace:nowrap): "PLAN
                // DE EJERCICIOS" se leía "PLAN DE EJERCI…" en 375px, que es
                // justo lo que hay que poder distinguir de "PLANIFICACIÓN".
                // Acá se deja envolver en dos renglones.
                <button
                  key={k}
                  onClick={() => setPlanesTab(k)}
                  style={{ ...segChip(planesTab === k), whiteSpace: "normal", overflow: "visible", textOverflow: "clip", lineHeight: 1.2, padding: "8px 4px" }}
                >
                  {l}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: S.lgray, marginBottom: 14, lineHeight: 1.5 }}>
              {planesTab === "periodizacion"
                ? "Planificación = la progresión: cuántas series, repeticiones e intensidad le tocan cada semana. No dice qué ejercicios hace."
                : "Plan de ejercicios = qué ejercicios hace cada día y en qué orden. No dice series ni repeticiones: eso lo pone la Planificación."}
            </div>
            {planesTab === "periodizacion" && al && (
              <div style={{ ...card, overflow: "hidden", padding: 14 }}>
                {/* Marca de herencia — la misma que movilidad y entrada en
                    calor (2026-08-10): el que nunca la tocó hereda los cambios
                    del predeterminado, el que tiene la suya no se pisa nunca. */}
                {(() => {
                  const propia = esPeriodizacionPropia(al);
                  const ref = refPeriodizacion(al);
                  // 2026-08-12: sin semanas cargadas el alumno NO tiene
                  // planificación, y eso es un estado válido — entrena los
                  // ejercicios de su plan sin progresión prescrita.
                  const conPlanificacion = tienePeriodizacion(al);
                  return (
                    <div style={{ ...innerCard, padding: "10px 12px", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, color: !conPlanificacion ? S.lgray : propia ? S.white : S.green, fontWeight: 700 }}>
                          {!conPlanificacion
                            ? "Sin planificación"
                            : propia
                              ? "Planificación propia de este alumno"
                              : ref
                                ? `Heredada del predeterminado · ${etiquetaPeriodizacion(perNombres, ref.objetivo, ref.nivel)}`
                                : "Sin predeterminado asignado"}
                        </span>
                        <span style={{ fontSize: 13, color: S.gray, flex: 1, minWidth: 160 }}>
                          {!conPlanificacion
                            ? "Este alumno entrena sin progresión prescrita. Elegí una de abajo cuando quieras darle una."
                            : propia
                              ? "Editar el predeterminado ya no le cambia nada."
                              : ref
                                ? "Si cambiás el predeterminado en Biblioteca, se le actualiza sola. Editar acá la vuelve propia."
                                : "Elegí objetivo y nivel para que siga un predeterminado. Las fechas cargadas se conservan."}
                        </span>
                        {propia && ref && (
                          <button onClick={volverPeriodizacionGlobal} style={smallBtn(S.gray)}>
                            Volver al predeterminado
                          </button>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                        {/* "Sin planificación" — el equivalente exacto de "Sin
                            plan" del otro lado (pedido de Lucas 2026-08-12:
                            "los dos me tienen que dar la opción de dejar sin
                            ningún predeterminado"). Va PRIMERO, como en
                            SelectorPlanDia, y borra las semanas + la
                            referencia al predeterminado. */}
                        <button
                          onClick={sacarPeriodizacion}
                          style={{ ...smallBtn(!conPlanificacion ? S.white : S.gray), borderStyle: conPlanificacion ? "dashed" : "solid" }}
                        >
                          Sin planificación
                        </button>
                        {OBJETIVOS_PER.map((o) =>
                          NIVELES_PER.map((n) => {
                            const activo = !propia && ref && ref.objetivo === o.id && ref.nivel === n.id;
                            return (
                              <button
                                key={o.id + n.id}
                                onClick={() => asignarPeriodizacion(o.id, n.id)}
                                style={smallBtn(activo ? S.white : S.gray)}
                              >
                                {/* 2026-08-12: el nombre de la planificación sale
                                    de la fila, no de las constantes — si Lucas la
                                    renombró en la Biblioteca, acá se lee así. */}
                                {etiquetaPeriodizacion(perNombres, o.id, n.id)}
                              </button>
                            );
                          }),
                        )}
                      </div>
                    </div>
                  );
                })()}
                {/* ── QUÉ DÍAS COMPARTEN Y CUÁL TIENE LA SUYA (2026-08-10) ──
                    Pedido de Lucas: "cada día tiene su progresión y puede
                    tener una planificación distinta o no... un día puede
                    estar haciendo fuerza el otro volumen". El caso normal es
                    UNA sola compartida, así que el chip "Todos los días" va
                    primero y separar un día es explícito. Sin esta lista, en
                    tres meses no hay forma de entender por qué un día
                    progresa distinto. */}
                {(() => {
                  const planesReales = (al.planes || []).filter((p) => p && !p._sintetico);
                  if (planesReales.length === 0) return null;
                  const planSel = planesReales.find((p) => p.id === perDiaSel) || null;
                  const propios = planesReales.filter(esPeriodizacionDiaPropia);
                  return (
                    <div style={{ ...innerCard, padding: "10px 12px", marginBottom: 12 }}>
                      <div style={{ fontSize: 13, color: S.gray, marginBottom: 8 }}>
                        {propios.length === 0
                          ? "Los días comparten esta misma progresión. Tocá un día para darle la suya."
                          : `${propios.length} día(s) con progresión propia — los demás comparten la del alumno.`}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={() => setPerDiaSel(null)} style={smallBtn(perDiaSel === null ? S.white : S.gray)}>
                          Todos los días
                        </button>
                        {planesReales.map((p) => {
                          const propia = esPeriodizacionDiaPropia(p);
                          return (
                            <button
                              key={p.id}
                              onClick={() => setPerDiaSel(p.id)}
                              title={propia ? "Este día tiene su propia progresión" : "Este día comparte la del alumno"}
                              style={{ ...smallBtn(perDiaSel === p.id ? S.white : propia ? S.green : S.gray) }}
                            >
                              {p.dia_semana}{propia ? " · propia" : ""}
                            </button>
                          );
                        })}
                      </div>
                      {planSel && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                          <span style={{ fontSize: 13, color: esPeriodizacionDiaPropia(planSel) ? S.white : S.green, fontWeight: 700 }}>
                            {esPeriodizacionDiaPropia(planSel)
                              ? `${planSel.dia_semana} tiene su propia progresión`
                              : `${planSel.dia_semana} comparte la del alumno`}
                          </span>
                          {esPeriodizacionDiaPropia(planSel) ? (
                            <button onClick={() => volverACompartirPeriodizacion(planSel)} style={smallBtn(S.gray)}>
                              Volver a compartir
                            </button>
                          ) : (
                            <button onClick={() => hacerPeriodizacionPropiaDelDia(planSel)} style={smallBtn(S.white)}>
                              Darle progresión propia
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {(() => {
                  // El editor edita lo que esté seleccionado: la del alumno
                  // (que baja a todos los días que comparten) o la de UN día.
                  const planSel = (al.planes || []).find((p) => p && !p._sintetico && p.id === perDiaSel) || null;
                  if (!planSel) return <PeriodizacionEditor data={al.plan.periodizacion} onChange={guardarPeriodizacionAlumno} />;
                  if (!esPeriodizacionDiaPropia(planSel)) {
                    // Editar acá sin haber separado el día editaría la del
                    // alumno creyendo que se edita la del día — el error más
                    // fácil de cometer y el más difícil de notar después.
                    return (
                      <div style={{ ...card, padding: "16px 14px", textAlign: "center", color: S.gray, fontSize: 13 }}>
                        {planSel.dia_semana} usa la progresión del alumno. Para cambiarle solo a este día, primero dale progresión propia.
                      </div>
                    );
                  }
                  return (
                    <PeriodizacionEditor
                      data={periodizacionDelDia(planSel, al.plan.periodizacion)}
                      onChange={(semanas) => guardarPeriodizacionDelDia(planSel, semanas)}
                    />
                  );
                })()}
              </div>
            )}{" "}
            {planesTab === "plan-dias" && al && (() => {
              // Punto 8 (ronda 16): reorganizado — antes mostraba SIEMPRE los
              // 7 días fijos + "Fijo" sin importar si el alumno entrena ese
              // día. Ahora solo se ven los días que la persona entrena
              // (al.horarios) + cualquier día que YA tenga un plan asignado
              // (para que nada desaparezca), en el orden real de la semana,
              // etiquetados "Día 1/2/3..." si el alumno está en modo
              // numérico (mismo criterio que ya usa PlanesPrincipales) —
              // el ADMIN siempre ve el día real de la semana también, chico
              // al lado, así el mapeo real no se pierde para asistencia/
              // reportes. Al final, un tile "+ Agregar día" para sumar un
              // día nuevo (incluido "Fijo", que ya no ocupa un lugar fijo).
              const DIAS_SEMANA = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
              const diasHorario = (al.horarios || []).map((h) => h.dia).filter(Boolean);
              const diasConPlanReal = (al.planes || []).filter((p) => !p._sintetico && p.dia_semana !== "Fijo").map((p) => p.dia_semana);
              const diasUsados = [...new Set([...diasHorario, ...diasConPlanReal])]
                .filter((d) => DIAS_SEMANA.includes(d))
                .sort((a, b) => (ORDEN_DIAS[a] || 9) - (ORDEN_DIAS[b] || 9));
              const tieneFijo = (al.planes || []).some((p) => p.dia_semana === "Fijo" && !p._sintetico);
              const diasParaMostrar = tieneFijo ? [...diasUsados, "Fijo"] : diasUsados;
              const diasModoAdmin = al.rm?.dias_modo || "nombres";
              const diasDisponibles = [...DIAS_SEMANA.filter((d) => !diasUsados.includes(d)), ...(tieneFijo ? [] : ["Fijo"])];

              return (
                <div style={{ ...card, padding: 12 }}>
                  <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 12 }}>
                    Plan por día — {al.nombre}
                  </div>
                  {diasParaMostrar.length === 0 && (
                    <div style={{ color: S.gray, fontSize: 12, marginBottom: 12 }}>
                      {al.nombre} todavía no tiene días de entrenamiento configurados. Sumá uno con "+ Agregar día", o configurá sus días fijos en Ejercicios → <Pencil size={12} style={{ verticalAlign: "-2px" }} /> Editar.
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {diasParaMostrar.map((dia, idx) => {
                      const planActual = al.planes?.find((p) => p.dia_semana === dia);
                      const isSelected = selectedDia === dia && !agregandoDia;
                      const labelPrincipal = dia === "Fijo" ? "Todos los días" : diasModoAdmin === "numerico" ? `Día ${idx + 1}` : dia;
                      return (
                        <div
                          key={dia}
                          onClick={() => { setSelectedDia(isSelected ? null : dia); setAgregandoDia(false); }}
                          style={{
                            background: isSelected ? S.card2 : S.card,
                            border: `1px solid ${isSelected ? S.white : S.border}`,
                            borderRadius: 8,
                            padding: "10px 12px",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: 11, color: S.gray, marginBottom: 3 }}>
                            {labelPrincipal}
                            {diasModoAdmin === "numerico" && dia !== "Fijo" && (
                              <span style={{ color: S.lgray }}> · {dia}</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: planActual ? S.green : S.lgray, fontWeight: 600 }}>
                            {planActual ? planActual.nombre || "Asignado" : "Sin plan"}
                          </div>
                          {/* 2026-08-10 — el elegidor de plan salió de acá
                              adentro: los botones vivían dentro de un tile de
                              media columna (~165px en el celular) y ahí no
                              entra la descripción de cada variante, que es
                              justamente lo que explica para qué sirve cada
                              rutina. Ahora se despliega a ancho completo
                              debajo de la grilla (ver selectorDePlan). */}
                          {isSelected && (
                            <div style={{ fontSize: 11, color: S.white, marginTop: 6, fontWeight: 700 }}>Elegí el plan abajo ↓</div>
                          )}
                        </div>
                      );
                    })}
                    {/* Elegidor de plan a ancho completo, compartido por el
                        flujo de los tiles y por "+ Agregar día". */}
                    {selectedDia && !agregandoDia && selectorDePlan(selectedDia)}
                    {/* + Agregar día (punto 8): 2 pasos dentro del mismo tile
                        expandido — elegir el día de la semana disponible, y
                        después la plantilla (reusa asignarPlanDia con
                        diaOverride, sin pisar selectedDia de los tiles de
                        arriba). */}
                    {!agregandoDia ? (
                      <div
                        onClick={() => { setAgregandoDia(true); setSelectedDia(null); }}
                        style={{ background: "transparent", border: "1px dashed " + S.border, borderRadius: 8, padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: S.gray, fontSize: 12, fontWeight: 700, minHeight: 44 }}
                      >
                        + Agregar día
                      </div>
                    ) : !selectedDia ? (
                      <div style={{ ...card, padding: "10px 12px", gridColumn: "1 / -1" }}>
                        <div style={{ fontSize: 11, color: S.gray, marginBottom: 8, textTransform: "uppercase" }}>Elegí el día para agregar</div>
                        {diasDisponibles.length === 0 ? (
                          <div style={{ color: S.gray, fontSize: 12, marginBottom: 8 }}>Ya están todos los días usados.</div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                            {diasDisponibles.map((d) => (
                              <button
                                key={d}
                                onClick={() => setSelectedDia(d)}
                                style={{ background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                              >
                                {d === "Fijo" ? "Todos los días" : d}
                              </button>
                            ))}
                          </div>
                        )}
                        <button onClick={() => setAgregandoDia(false)} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      selectorDePlan(selectedDia, true)
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: S.lgray }}>
                    Tocá un día para asignarle un plan de entrenamiento
                  </div>
                </div>
              );
            })()}{" "}
          </div>
        )}{" "}
        {sec === "planes" && planesTab === "rm" && (
          <div>
            {" "}
            {/* Fecha de evaluación POR ALUMNO: cuándo se lo evaluó a ESTE alumno.
                Ronda 7: Peso Max aplica a TODOS — sin filtro por modalidad. */}
            {al && (
              <div style={{ ...card, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 14, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Calendar size={13} />Fecha de evaluación de {al.nombre}</span>
                </div>
                <input
                  type="date"
                  value={(rm[al.id] && rm[al.id].fecha_evaluacion) || (al.rm && al.rm.fecha_evaluacion) || ""}
                  onChange={(e) => setFechaEvalAlumno(e.target.value)}
                  style={inp}
                />
              </div>
            )}
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Peso máximo · {al ? al.nombre : "—"}
            </div>{" "}
            {!al && <div style={{ ...card, padding: 24, textAlign: "center", color: S.gray, fontSize: 13 }}>Seleccioná un alumno desde Dashboard</div>}{" "}
            {al &&
              RM_EJS.map((ej) => (
                <div key={ej} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
                  {" "}
                  <div style={{ color: S.white, fontWeight: 600, fontSize: 13, marginBottom: 10 }}>{ej}</div>{" "}
                  {/* Solo el peso — la fecha de evaluación es UNA por alumno (arriba) */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 14, color: S.gray, marginBottom: 4 }}>PESO MAXIMO (kg)</div>
                    {/* Auditoría 2026-07-30: el peso máximo se carga en kg y
                        admite decimales (62.5). `inputMode="decimal"` abre el
                        teclado numérico con separador en vez del alfabético. */}
                    <input
                      type="number"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      value={(rm[al.id] && rm[al.id][ej] && rm[al.id][ej].peso) || ""}
                      onChange={(e) =>
                        setRm((r) => {
                          const n = { ...r };
                          n[al.id] = { ...n[al.id] };
                          n[al.id][ej] = { ...n[al.id][ej], peso: Number(e.target.value) };
                          return n;
                        })
                      }
                      style={inp}
                    />
                  </div>{" "}
                  {rm[al.id] && rm[al.id][ej] && rm[al.id][ej].peso > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {" "}
                      {[60, 65, 70, 75, 80, 85, 90, 95].map((pct) => (
                        <div
                          key={pct}
                          style={{
                            background: S.card2,
                            borderRadius: 6,
                            padding: "4px 8px",
                            textAlign: "center",
                            flex: 1,
                            minWidth: 44,
                          }}
                        >
                          <div style={{ color: S.white, fontSize: 12, fontWeight: 700 }}>
                            {Math.round((rm[al.id][ej].peso * pct) / 100)}kg
                          </div>
                          <div style={{ color: S.gray, fontSize: 14 }}>{pct}%</div>
                        </div>
                      ))}{" "}
                    </div>
                  )}{" "}
                </div>
              ))}{" "}
            {al && (
              <button
                onClick={guardarRM}
                style={{
                  width: "100%",
                  marginTop: 8,
                  background: S.white,
                  color: S.bg,
                  border: "none",
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                GUARDAR
              </button>
            )}{" "}
          </div>
        )}{" "}
        {/* ── Grupo REPORTES: Asistencia · Historial ──
             (Bioimpedancia se movió al módulo Evaluación) */}
        {sec === "reportes" && (
          <div style={{ ...segTrack(), marginBottom: 14 }}>
            {[
              // 2026-08-10, pedido de Lucas ("el módulo evaluación, reportes
              // debería estar fusionado en reportes"): la tercera pestaña es la
              // que vivía en Evaluación → Reportes. No se llama "Reportes"
              // porque, ya adentro de Reportes, ese nombre no la distinguía de
              // las otras dos. Los rótulos son cortos porque con tres pestañas
              // el segmented control da ~113px por chip en un celular de 375px
              // y el texto se cortaba en "ASISTEN…"; el título completo de cada
              // pantalla aparece igual arriba del contenido.
              ["Asistencia", "asistencia"],
              ["Pesos máximos", "historial"],
              ["Resumen", "resumen"],
            ].map(([l, k]) => (
              // Con tres pestañas cada chip mide 96px en un celular de 375px y
              // segChip (theme.js, compartido) trae whiteSpace:nowrap: los
              // rótulos salían cortados ("ASISTEN…", "PESOS M…"). Se permite
              // que envuelvan en dos renglones sólo acá — cortar el nombre de
              // una pestaña es peor que un chip un poco más alto.
              <button key={k} onClick={() => setRepTab(k)} style={{ ...segChip(repTab === k), minWidth: 0, whiteSpace: "normal", lineHeight: 1.2, padding: "12px 4px", letterSpacing: 0 }}>
                {l}
              </button>
            ))}
          </div>
        )}{" "}
        {sec === "reportes" && repTab === "historial" && <HistorialAdmin al={al} />}{" "}
        {sec === "reportes" && repTab === "resumen" && <ReportesAlumno al={al} />}{" "}
        {sec === "diario" && <DiarioAdmin alumnos={alumnos} onUpdate={onUpdate} showToast={showToast} />}{" "}
        {sec === "evaluacion" && al && (
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
        )}{" "}
        {sec === "reportes" && repTab === "asistencia" && al && (() => {
          // ASISTENCIA (ex "Reportes"): días que el alumno entrenó, con hora si
          // existe (los registros nuevos guardan "YYYY-MM-DD HH:mm"; los viejos
          // son solo fecha — se leen igual). Los reportes son MENSUALES: se
          // elige el mes y se exporta el reporte institucional de ese mes.
          const registros = [...(al.asistencia || [])].sort((a, b) => b.localeCompare(a));
          const mesHoy = mesActual().slice(0, 7);
          // Meses disponibles: el actual siempre + los que tengan asistencia o diario.
          const mesesSet = new Set([mesHoy]);
          registros.forEach((r) => mesesSet.add(r.slice(0, 7)));
          (al.diario || []).forEach((d) => { if (d.fecha) mesesSet.add(String(d.fecha).slice(0, 7)); });
          const meses = [...mesesSet].sort((a, b) => b.localeCompare(a));
          const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
          const labelMes = (m) => `${MESES_ES[Number(m.slice(5, 7)) - 1] || m} ${m.slice(0, 4)}`;
          const mesSel = meses.includes(repMes) ? repMes : mesHoy;
          const delMes = registros.filter((r) => r.startsWith(mesSel));
          return (
            <div>
              <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Asistencia — {al.nombre}
              </div>
              {/* Ronda 10: se sacó el botón grande "EXPORTAR REPORTE DEL MES EN
                  CURSO" de acá — quedaba redundante con el botón "Exportar"
                  chico de la fila del mes en curso, más abajo. */}
              {/* Meses estilo resumen bancario: una fila por mes con sus datos
                  y su botón Exportar al lado. Tocar la fila muestra su detalle. */}
              <div style={{ ...card, overflow: "hidden", marginBottom: 12 }}>
                {meses.map((m, i) => {
                  const cant = registros.filter((r) => r.startsWith(m)).length;
                  const activo = mesSel === m;
                  return (
                    <div
                      key={m}
                      onClick={() => setRepMes(m)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer", background: activo ? S.card2 : "transparent", borderLeft: "3px solid " + (activo ? S.white : "transparent"), borderBottom: i < meses.length - 1 ? "1px solid " + S.border : "none" }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ color: activo ? S.white : S.gray, fontWeight: 700, fontSize: 13 }}>
                          {labelMes(m)}{m === mesHoy ? <span style={{ color: S.green, fontSize: 14, fontWeight: 700, marginLeft: 6 }}>· EN CURSO</span> : ""}
                        </div>
                        <div style={{ color: S.lgray, fontSize: 11, marginTop: 1 }}>{cant} asistencia{cant === 1 ? "" : "s"}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); exportarReporteMensual(al, m); }}
                        style={smallBtn(activo ? S.white : S.gray)}
                      >
                        ⬇ Exportar
                      </button>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ color: S.green, fontWeight: 900, fontSize: 22 }}>{delMes.length}</div>
                  <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1 }}>{labelMes(mesSel).toUpperCase()}</div>
                </div>
                <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ color: S.white, fontWeight: 900, fontSize: 22 }}>{registros.length}</div>
                  <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1 }}>TOTAL HISTÓRICO</div>
                </div>
              </div>
              {delMes.length === 0 ? (
                <div style={{ ...card, padding: 30, textAlign: "center", color: S.gray, fontSize: 13, marginBottom: 12 }}>
                  Sin asistencias registradas en {labelMes(mesSel)}
                </div>
              ) : (
                <div style={{ ...card, overflow: "hidden", marginBottom: 12 }}>
                  {delMes.map((r, i) => {
                    const fecha = r.slice(0, 10);
                    const hora = r.length > 10 ? r.slice(11) : "";
                    const [yy, mm, dd] = fecha.split("-");
                    const fechaCorta = `${dd}/${mm}/${yy}`;
                    let diaSemana = "";
                    try {
                      diaSemana = new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long" });
                    } catch (e) {}
                    return (
                      <div key={r + "-" + i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < delMes.length - 1 ? "1px solid " + S.border : "none" }}>
                        <div style={{ color: S.white, fontSize: 13 }}>
                          <span style={{ textTransform: "capitalize", color: S.gray, fontSize: 11, marginRight: 8 }}>{diaSemana}</span>
                          {fechaCorta}
                        </div>
                        <div style={{ color: hora ? S.green : S.lgray, fontSize: 12, fontWeight: hora ? 700 : 400 }}>{`Horario: ${hora || "—"}`}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* ── DIARIO del alumno — vive acá abajo de la asistencia (ronda 9) ── */}
              <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", margin: "22px 0 12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><NotebookPen size={14} />Diario — {al.nombre}</span>
              </div>
              {(al.diario || []).length === 0 ? (
                <div style={{ ...card, padding: 30, textAlign: "center" }}>
                  <NotebookPen size={26} style={{ marginBottom: 8 }} />
                  <div style={{ color: S.gray, fontSize: 13 }}>Sin entradas todavía</div>
                </div>
              ) : (
                [...(al.diario || [])].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).map((e, i) => (
                  <EntradaDiarioAdmin
                    key={(e.fecha || "") + "-" + i}
                    entrada={e}
                    onResponder={(respuesta) => {
                      const nuevoDiario = (al.diario || []).map((d) => (d === e ? { ...d, respuesta } : d));
                      onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, diario: nuevoDiario } : a)));
                      showToast && showToast("Respuesta guardada");
                    }}
                  />
                ))
              )}
            </div>
          );
        })()}{" "}
        {sec === "config" && (
          <div>
            {/* Ronda 18: Configuración no tenía forma de volver al menú
                anterior — botón Volver explícito (además el click en el
                logo del header también vuelve al Dashboard). */}
            <button
              onClick={() => setSec("dashboard")}
              style={{ ...smallBtn(S.gray), marginBottom: 12, fontSize: 13, padding: "8px 14px" }}
            >
              ← Volver al panel
            </button>
            {/* Sub-tabs */}
            <div style={{ ...segTrack(), marginBottom: 16 }}>
              {/* "Configuración" incluye crear Y editar admins, no solo alta. */}
              {[[<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Settings size={14} />Configuración</span>, "admin"], [<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Megaphone size={14} />Comunicados</span>, "comunicados"]].map(([l, k]) => (
                <button key={k} onClick={() => setConfigTab(k)} style={segChip(configTab === k)}>
                  {l}
                </button>
              ))}
            </div>

            {configTab === "admin" && (
              <div>
                <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
                  Crear administrador
                </div>
                {[
                  ["Nombre", admNombre, setAdmNombre],
                  ["Username", admCodigo, setAdmCodigo],
                  ["Clave (4 dígitos)", admPin, setAdmPin],
                ].map(([label, val, set]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                    {/* Auditoría 2026-07-30: la clave del admin son 4 dígitos
                        → teclado numérico. Nombre/Username sin autocompletar:
                        son datos de OTRA persona, no del dueño del celular. */}
                    <input
                      type={label.includes("Clave") ? "password" : "text"}
                      inputMode={label.includes("Clave") ? "numeric" : undefined}
                      autoComplete={label.includes("Clave") ? "new-password" : "off"}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      style={inp}
                      maxLength={label.includes("Clave") ? 4 : undefined}
                    />
                  </div>
                ))}
                {/* Rol (punto 12): por ahora solo queda como dato asignable
                    y visible — no restringe la vista todavía. */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 6 }}>Rol</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["entrenador", <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dumbbell size={14} />Entrenador</span>], ["kinesiologa", <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Stethoscope size={14} />Kinesióloga</span>]].map(([id, l]) => (
                      <button
                        key={id}
                        onClick={() => setAdmRol(id)}
                        style={{ flex: 1, background: admRol === id ? S.white : S.card, color: admRol === id ? S.bg : S.gray, border: "1px solid " + (admRol === id ? S.white : S.border), borderRadius: 8, padding: "9px 6px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (admPin.length === 4 && PIN_TRIVIAL(admPin)) {
                      showToast && showToast("Elegí una clave de admin menos obvia (nada de 1234 o 0000)");
                      return;
                    }
                    if (!admNombre || !admCodigo || admPin.length !== 4) {
                      showToast && showToast("Completá todos los campos (clave de 4 dígitos)");
                      return;
                    }
                    try {
                      await crearAdmin(admNombre, admCodigo, admPin, "", admRol);
                      showToast && showToast(`Admin "${admNombre}" creado`);
                      setAdmNombre(""); setAdmCodigo(""); setAdmPin(""); setAdmRol("entrenador");
                      cargarAdminsList();
                    } catch (e) {
                      showToast && showToast("Error: " + e.message);
                    }
                  }}
                  style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 900, cursor: "pointer" }}
                >
                  CREAR ADMINISTRADOR
                </button>

                {/* Gestión de admins existentes (punto 12): listado con
                    selector de rol por admin. */}
                <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", margin: "24px 0 12px" }}>
                  Administradores ({adminsList.length})
                </div>
                {adminsList.map((a) => (
                  <div key={a.id} style={{ ...card, padding: "10px 12px", marginBottom: 8, opacity: a.activo === false ? 0.55 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div>
                        <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{a.nombre}{a.activo === false ? " · inactivo" : ""}</div>
                        <div style={{ color: S.gray, fontSize: 11 }}>@{a.codigo}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {[["entrenador", <Dumbbell size={14} />], ["kinesiologa", <Stethoscope size={14} />]].map(([id, ic]) => (
                          <button
                            key={id}
                            title={id === "entrenador" ? "Entrenador" : "Kinesióloga"}
                            onClick={async () => {
                              if (a.rol === id) return;
                              const actualizado = await actualizarRolAdmin(a.id, id);
                              if (actualizado) {
                                setAdminsList((prev) => prev.map((x) => (x.id === a.id ? { ...x, rol: id } : x)));
                                showToast && showToast(`${a.nombre} ahora es ${id === "entrenador" ? "Entrenador" : "Kinesióloga"}`);
                              } else {
                                showToast && showToast("Error al cambiar el rol");
                              }
                            }}
                            style={{ background: a.rol === id ? S.white : "transparent", color: a.rol === id ? S.bg : S.gray, border: "1px solid " + (a.rol === id ? S.white : S.border), borderRadius: 6, padding: "6px 9px", fontSize: 13, cursor: "pointer" }}
                          >
                            {ic}
                          </button>
                        ))}
                        {/* Ronda 16 (punto 2): editar nombre/username/clave de un admin
                            ya creado. */}
                        <button
                          title="Modificar datos"
                          onClick={() => abrirEdicionAdmin(a)}
                          style={{ background: editandoAdminId === a.id ? S.white : "transparent", color: editandoAdminId === a.id ? S.bg : S.gray, border: "1px solid " + (editandoAdminId === a.id ? S.white : S.border), borderRadius: 6, padding: "6px 9px", fontSize: 13, cursor: "pointer" }}
                        >
                          <Pencil size={14} />
                        </button>
                        {/* Desactivar/reactivar admin (auditoría 2026-07-22: no se
                            podía sacar un admin desde la UI). Un admin inactivo no
                            puede loguearse (verify_login_pin respeta `activo`). */}
                        <button
                          title={a.activo === false ? "Reactivar admin" : "Desactivar admin"}
                          onClick={async () => {
                            const reactivar = a.activo === false;
                            if (!reactivar && !window.confirm(`¿Desactivar a ${a.nombre}? No va a poder entrar hasta que lo reactives.`)) return;
                            try {
                              await desactivarAdmin(a.id, reactivar);
                              setAdminsList((prev) => prev.map((x) => (x.id === a.id ? { ...x, activo: reactivar } : x)));
                              showToast && showToast(reactivar ? `${a.nombre} reactivado` : `${a.nombre} desactivado`);
                            } catch (e) { showToast && showToast("No se pudo cambiar el estado"); }
                          }}
                          style={{ background: "transparent", color: a.activo === false ? S.green : S.red, border: "1px solid " + (a.activo === false ? S.green : S.border), borderRadius: 6, padding: "6px 9px", fontSize: 13, cursor: "pointer" }}
                        >
                          {a.activo === false ? <Power size={14} /> : <Ban size={14} />}
                        </button>
                      </div>
                    </div>
                    {editandoAdminId === a.id && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + S.border }}>
                        {[
                          ["Nombre", editNombre, setEditNombre, "text"],
                          ["Username", editCodigo, setEditCodigo, "text"],
                          ["Nueva clave (dejar vacío para no cambiarla)", editAdminPin, setEditAdminPin, "password"],
                        ].map(([label, val, set, type]) => (
                          <div key={label} style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 14, color: S.gray, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                            {/* Auditoría 2026-07-30: idem — la clave es
                                numérica de 4 dígitos, teclado numérico. */}
                            <input
                              type={type}
                              inputMode={type === "password" ? "numeric" : undefined}
                              autoComplete={type === "password" ? "new-password" : "off"}
                              value={val}
                              onChange={(e) => set(e.target.value)}
                              style={inp}
                              maxLength={type === "password" ? 4 : undefined}
                            />
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={async () => {
                              if (!editNombre.trim() || !editCodigo.trim()) {
                                showToast && showToast("Nombre y username son obligatorios");
                                return;
                              }
                              if (editAdminPin && editAdminPin.length !== 4) {
                                showToast && showToast("La clave nueva debe tener 4 dígitos");
                                return;
                              }
                              if (editAdminPin && PIN_TRIVIAL(editAdminPin)) {
                                showToast && showToast("Elegí una clave menos obvia (nada de 1234 o 0000)");
                                return;
                              }
                              try {
                                await actualizarAdmin(a.id, editNombre, editCodigo, editAdminPin);
                                showToast && showToast(`${editNombre} actualizado`);
                                setEditandoAdminId(null);
                                cargarAdminsList();
                              } catch (e) {
                                showToast && showToast("Error: " + e.message);
                              }
                            }}
                            style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 11, fontSize: 13, fontWeight: 900, cursor: "pointer" }}
                          >
                            GUARDAR CAMBIOS
                          </button>
                          <button
                            onClick={() => setEditandoAdminId(null)}
                            style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: "11px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {configTab === "comunicados" && (
              <NovedadesAdmin
                novedades={novedades}
                onCrear={async (n) => {
                  try {
                    const nueva = await crearNovedad(n);
                    onNovedadesChange([nueva, ...novedades]);
                    showToast && showToast("Comunicado publicado");
                  } catch (e) { showToast && showToast("Error: " + e.message); }
                }}
                onToggle={async (id, activo) => {
                  await toggleNovedad(id, activo);
                  onNovedadesChange(novedades.map((n) => n.id === id ? { ...n, activo } : n));
                }}
                onEliminar={async (id) => {
                  if (!window.confirm("¿Eliminar este comunicado?")) return;
                  await eliminarNovedad(id);
                  onNovedadesChange(novedades.filter((n) => n.id !== id));
                  showToast && showToast("Eliminado");
                }}
              />
            )}
          </div>
        )}{" "}
      </div>{" "}
      {/* Ronda 14: Biblioteca = catálogo completo (dataset + custom DI).
          Desde adentro se puede saltar a la biblioteca propia (M/E/C).
          Ronda 16 (punto 4): el Armador se fusionó ACÁ ADENTRO — ya no es
          una segunda instancia de CatalogoExplorer, es un toggle interno
          del componente (botón "+ Crear plan de entrenamiento"). */}
      {showCatalogo && (
        <CatalogoExplorer
          onClose={() => setShowCatalogo(false)}
          showToast={showToast}
          // Ronda 17 (punto 3, navegación): antes cerraba el catálogo
          // (setShowCatalogo(false)) al abrir la biblioteca propia — al
          // cerrar esta última, el usuario caía en el Dashboard (home) en
          // vez de volver al catálogo de donde vino. El catálogo queda
          // MONTADO debajo (su z-index es 100, el de BibliotecaScreen es
          // 220 — ya se ve por encima sin pisarlo) y reaparece solo al
          // cerrar BibliotecaScreen, respetando la pantalla anterior.
          onAbrirPropia={() => setShowBiblioteca(true)}
          // 2026-08-10: guardar un predeterminado de periodización lo baja a
          // los alumnos que lo heredan (los que tienen la suya no se tocan).
          onPeriodizacionGuardada={propagarPeriodizacionATodos}
        />
      )}
      {/* Biblioteca PROPIA (movilidad/elástico/calor + GIFs manuales).
          2026-08-10 — BUG que reportó Lucas ("ese módulo Otra biblioteca no
          hace nada"): este render vivía DENTRO del bloque `sec === "dashboard"`,
          pero el catálogo se abre desde el botón de la barra superior, que
          está en TODAS las secciones. Fuera del Dashboard, el botón "Otra
          biblioteca" ponía showBiblioteca en true y no se montaba nada — un
          control muerto. Ahora se monta al lado del catálogo, así que el
          control hace lo que promete desde cualquier sección. */}
      {showBiblioteca && (
        <BibliotecaScreen
          biblioteca={biblioteca}
          onGuardado={onBibliotecaRefresh}
          showToast={showToast}
          onClose={() => setShowBiblioteca(false)}
        />
      )}
    </div>
  );
}
// ── LOGIN ─────────────────────────────────────────────────────────────
// 2026-07-30, pedido de Lucas: que el login se parezca a Mercado Libre o
// Instagram — usuario recordado + ingreso con huella. Dos mecanismos
// SEPARADOS, cada uno cubriendo lo que el otro no puede:
//   1) Usuario recordado: SIEMPRE (todos los navegadores), un simple
//      localStorage con el último código usado. No es un dato sensible.
//   2) Clave + huella: se delega al gestor de contraseñas del SISTEMA vía la
//      Credential Management API (`navigator.credentials`), NO a un
//      localStorage propio. Es la diferencia entre "de verdad seguro" y
//      "parece seguro": el navegador/SO ya guarda la clave en su bóveda
//      protegida por huella/Face ID (así la ve iOS Keychain o el Administrador
//      de contraseñas de Android/Chrome) — nosotros solo la pedimos prestada
//      un instante para completar el formulario. Nunca la tocamos en texto
//      plano fuera de esa llamada. En iOS Safari (que no implementa esta
//      API) el mismo resultado sale gratis: el teclado ya ofrece autocompletar
//      con Face ID/Touch ID porque los campos ya tienen autoComplete correcto.
const LS_ULTIMO_USUARIO = "di_ultimo_usuario";
const credencialesOk = typeof window !== "undefined" && "credentials" in navigator && typeof window.PasswordCredential === "function";

// WhatsApp de soporte para el bloque "¿No podés entrar?". Vacío = no se
// muestra el link, solo el texto. Lucas: poné acá tu número en formato
// internacional sin signos (ej. "5491122334455") y el botón aparece solo.
const WHATSAPP_SOPORTE = "";

// 2026-08-13 (auditoría de uso): la pantalla mostraba `e.message` crudo. Sin
// internet, un alumno de 75 años leía literalmente «Failed to fetch» — inglés
// y jerga de programador. Y los mensajes del servidor hablaban de «username»,
// «Codigo» y «PIN» mientras la pantalla dice Usuario y Clave. Acá se traduce
// TODO a las mismas palabras que están en pantalla, con tildes.
// Se traduce en el cliente a propósito: cubre también lo que devuelve la
// versión ya desplegada de la Edge Function, sin depender de un redeploy.
function mensajeLogin(e, esAdmin) {
  const crudo = (e && e.message) || "";
  const sinRed = typeof navigator !== "undefined" && navigator.onLine === false;
  if (sinRed || e instanceof TypeError || /fetch|network|failed to fetch/i.test(crudo)) {
    return "No hay internet. Conectate al wifi o a los datos y tocá Ingresar otra vez.";
  }
  if (/demasiados intentos/i.test(crudo)) {
    return "Probaste muchas veces seguidas. Esperá un rato y volvé a intentar.";
  }
  if (/inv[aá]lid|incorrect|no encontrad/i.test(crudo)) {
    // El error más confuso de todos: si el alumno pisó sin querer el botón de
    // administrador, su clave correcta falla siempre y nada se lo explica.
    if (esAdmin) return "Estás con el acceso de administrador prendido. Si sos alumno, apagalo con el botón de abajo y probá de nuevo.";
    return "El usuario o la clave no son correctos. Fijate en el papel que te dio Lucas y probá de nuevo.";
  }
  return "No pudimos entrar. Probá de nuevo en un momento.";
}

function Login({ onLogin, onAdmin, darkMode, onToggleTheme }) {
  const [codigo, setCodigo] = useState(() => {
    try { return localStorage.getItem(LS_ULTIMO_USUARIO) || ""; } catch { return ""; }
  });
  const [pin, setPin] = useState("");
  const [esAdmin, setEsAdmin] = useState(false);
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);
  // Evita pedir la credencial dos veces en desarrollo (React StrictMode monta
  // los efectos dos veces) y evita ofrecerla de nuevo si el usuario ya la
  // rechazó una vez en esta visita.
  const yaPidioCredencial = useRef(false);

  const go = async (codigoOverride, pinOverride) => {
    const cod = (codigoOverride ?? codigo).trim();
    const clave = (pinOverride ?? pin).trim();
    if (!cod || !clave) {
      setErr("Te falta escribir el usuario y la clave.");
      return;
    }

    setCargando(true);
    setErr("");

    try {
      if (esAdmin) {
        const admin = await loginAdmin(cod, clave);
        try { localStorage.setItem(LS_ULTIMO_USUARIO, cod); } catch {}
        onAdmin(admin);
      } else {
        const alumno = await loginConCodigo(cod, clave);
        try { localStorage.setItem(LS_ULTIMO_USUARIO, cod); } catch {}
        // Ofrece guardar la clave en el gestor de contraseñas del sistema —
        // la próxima vez el navegador la completa sola (con huella/Face ID
        // si el dispositivo lo pide). Nunca se guarda en nuestro propio
        // storage: se lo entregamos al navegador y listo.
        if (credencialesOk) {
          try {
            await navigator.credentials.store(new window.PasswordCredential({ id: cod, password: clave, name: cod }));
          } catch {
            // El usuario puede cancelar el guardado, o el navegador no
            // soportar algo puntual — no es un error de login, se ignora.
          }
        }
        onLogin(alumno);
      }
    } catch (e) {
      setErr(mensajeLogin(e, esAdmin));
    } finally {
      setCargando(false);
    }
  };

  // Al entrar a la pantalla, si el navegador tiene una clave guardada para
  // esta app, se la pedimos (dispara el prompt de huella/Face ID del SO si
  // corresponde) y completamos el login solos. `mediation: "optional"`
  // muestra el selector nativo de cuentas en vez de loguear en silencio —
  // el usuario siempre ve y confirma qué cuenta está entrando.
  useEffect(() => {
    if (!credencialesOk || yaPidioCredencial.current) return;
    yaPidioCredencial.current = true;
    navigator.credentials
      .get({ password: true, mediation: "optional" })
      .then((cred) => {
        if (cred && cred.type === "password" && cred.id && cred.password) {
          setCodigo(cred.id);
          setPin(cred.password);
          go(cred.id, cred.password);
        }
      })
      .catch(() => {}); // cancelado por el usuario o sin credencial guardada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: S.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // Ronda 11: el logo sube un poco (antes todo el bloque quedaba
        // centrado exacto en el viewport) — arranca más arriba con padding
        // fijo en vez de centrado vertical puro.
        // Ronda 16 (punto 1): Lucas marcó que quedaba mucho aire muerto
        // arriba del logo — bajado de 8vh a un tope chico con clamp para
        // que no vuelva a crecer en pantallas altas.
        // Ronda 17 (punto 1): Lucas insistió — todavía quedaba mucho aire
        // arriba del logo. Bajado al mínimo real (casi pegado al borde).
        justifyContent: "flex-start",
        paddingTop: "clamp(16px, 4vh, 40px)",
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 24,
        fontFamily: "inherit",
        position: "relative",
      }}
    >
      <GlobalStyles />
      {/* Toggle modo claro/oscuro — discreto, arriba a la derecha */}
      <button
        onClick={onToggleTheme}
        title={darkMode ? "Modo claro" : "Modo oscuro"}
        aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          background: "transparent",
          color: S.gray,
          border: "1px solid " + S.border,
          borderRadius: 8,
          width: TAP,
          height: TAP,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          fontSize: TS.ui,
          cursor: "pointer",
        }}
      >
        {darkMode ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      {/* Header de marca — ronda 11: ícono y wordmark al DOBLE de tamaño que
          la ronda anterior (600 / 480, con tope responsivo para no desbordar
          celulares angostos — ver Logo3D y el width:"min(...)" de acá abajo).
          Subtítulo del login: "APP DE ENTRENAMIENTO" en vez de "CENTRO DE
          ENTRENAMIENTO" — el SVG trae ese texto quemado como paths, así que
          se recorta el wordmark a SOLO "DESARROLLO INTEGRAL"
          (soloDesarrollo) y el subtítulo se arma como texto HTML aparte,
          con PP Formula (ya cargada globalmente en index.html) en bold
          condensado imitando el tracking de marca. */}
      {/* Ronda 18: el aire arriba del logo y entre logo y wordmark NO era
          del layout — era el ~30% de padding interno del SVG original.
          Logo3D ahora usa ICON_CROP (recortado al dibujo real), así que el
          dibujo arranca de verdad donde arranca el contenedor: logo casi
          tocando el borde superior y wordmark pegado al logo. */}
      {/* 2026-07-31, pedido de Lucas: "el logo un poco más chico quedaría
          mejor" — 260→200 (y el wordmark acompaña la proporción, 480→380),
          menos protagonismo del ícono para que el formulario de login entre
          más rápido en la vista sin scrollear. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 380, marginBottom: "clamp(28px, 6vh, 56px)" }}>
        <Logo3D size={200} />
        <DIWordmark
          soloDesarrollo
          width={380}
          style={{ color: S.white, marginTop: 14, width: "min(380px, 100%)", maxWidth: "100%", height: "auto" }}
        />
        <div
          style={{
            color: S.gray,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: "uppercase",
            marginTop: 6,
            textAlign: "center",
            fontFamily: FONT_BRAND,
          }}
        >
          App de entrenamiento
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* 2026-08-13 (auditoría de uso): la pantalla del video ya estaba
            hecha para un adulto mayor (30/21/22px, botones de 72px) pero ESTE
            login, que es la puerta de entrada de todos, seguía a 13-16px con
            la escala pensada para los alumnos jóvenes. Ahora los campos miden
            60px de alto con letra de 20px y el botón de entrar 64px.
            Y vuelven las etiquetas de verdad arriba de cada campo: el
            placeholder gris era la única pista de qué iba en cada uno, se
            borraba al empezar a escribir y encima quedaba en 3.7:1 de
            contraste. La etiqueta no se va nunca y dice el dato que solo
            estaba en la cabeza de Lucas ("4 números"). */}
        <label htmlFor="login-usuario" style={{ display: "block", color: S.white, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          Tu usuario
        </label>
        <input
          id="login-usuario"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Usuario"
          autoComplete="username"
          autoCapitalize="characters"
          style={{ ...inp, background: S.card2, border: "1px solid " + S.border, marginBottom: 16, minHeight: 60, fontSize: 20 }}
          disabled={cargando}
        />
        <label htmlFor="login-clave" style={{ display: "block", color: S.white, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          Tu clave (4 números)
        </label>
        <input
          id="login-clave"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.slice(0, 4))}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Clave"
          maxLength={4}
          // La clave son 4 dígitos: en el celular tiene que abrir el teclado
          // numérico, no el alfabético. Faltaba `inputMode`, así que el
          // alumno tenía que cambiar de teclado a mano en cada ingreso.
          // `pattern` es el truco que fuerza el teclado numérico en iOS, donde
          // inputMode sobre type=password no siempre alcanza.
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="current-password"
          style={{ ...inp, background: S.card2, border: "1px solid " + S.border, letterSpacing: 4, minHeight: 60, fontSize: 20 }}
          disabled={cargando}
        />

        {/* Auditoría UX 2026-08-03: el contenedor ya existía, pero con 8% de
            opacidad de fondo era prácticamente invisible contra un dark mode
            casi negro — se leía como "texto rojo suelto". Mismo layout,
            fondo/borde con más peso para que se note que es un estado, no
            solo una palabra roja. */}
        {err && (
          <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#ff8080", fontSize: 18, lineHeight: 1.4, marginTop: 16, padding: "14px 16px", background: "rgba(229,62,62,0.16)", borderRadius: 8, border: "1px solid rgba(229,62,62,0.45)" }}>
            <span aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
            {err}
          </div>
        )}

        <button
          // 2026-07-30: NO poner onClick={go} directo — React pasa el
          // SyntheticEvent del click como primer argumento, que pisaba el
          // nuevo parámetro `codigoOverride` de go() (usado por el autofill
          // de credenciales) con el objeto del evento en vez de undefined.
          // Bug real, encontrado en pruebas: "(codigoOverride ?? codigo).trim
          // is not a function". Con la arrow function, go() se llama sin
          // argumentos y usa el estado normal (codigo/pin del formulario).
          onClick={() => go()}
          disabled={cargando}
          style={{
            width: "100%",
            marginTop: 20,
            background: cargando ? S.card2 : S.white,
            color: cargando ? S.gray : S.bg,
            border: "none",
            borderRadius: 10,
            padding: "14px",
            minHeight: 64,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
            cursor: cargando ? "not-allowed" : "pointer",
            opacity: cargando ? 0.7 : 1,
          }}
        >
          {cargando ? "Validando..." : "Ingresar"}
        </button>

        {/* 2026-08-13 (auditoría de uso): un alumno trabado acá no tenía a
            dónde ir — la pantalla entera tenía 5 elementos tocables y ninguno
            era una salida. Este bloque es la red de contención: se abre solo
            si lo tocan, así que no le agrega ruido al que entra de una. */}
        <details style={{ marginTop: 22 }}>
          <summary style={{ color: S.white, fontSize: 18, fontWeight: 700, cursor: "pointer", padding: "12px 0", minHeight: TAP, listStyle: "none", textDecoration: "underline" }}>
            ¿No podés entrar?
          </summary>
          <div style={{ color: S.gray, fontSize: 17, lineHeight: 1.5, marginTop: 6 }}>
            Fijate tres cosas en el papel que te dio Lucas: que el usuario esté escrito igual,
            que la clave sean los 4 números, y que el teléfono tenga internet.
            {WHATSAPP_SOPORTE ? (
              <a
                href={`https://wa.me/${WHATSAPP_SOPORTE}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 14, minHeight: 60, borderRadius: 10, border: "1px solid " + S.border2, color: S.white, fontSize: 19, fontWeight: 700, textDecoration: "none" }}
              >
                Escribirle a Lucas por WhatsApp
              </a>
            ) : (
              <div style={{ marginTop: 10 }}>Si sigue sin andar, escribile a Lucas por WhatsApp y te pasa el usuario y la clave de nuevo.</div>
            )}
          </div>
        </details>
      </div>

      {/* Acceso admin.
          2026-08-13 (auditoría de uso): este botón medía 288x47 y estaba a
          28px de INGRESAR. Un alumno que lo pisaba sin querer pasaba a fallar
          SIEMPRE, con su clave correcta, y la única señal era un puntito.
          Tres cambios: se va bien abajo (96px de aire, fuera del alcance del
          pulgar que apunta a Ingresar), deja de parecer un botón principal
          (texto chico, sin caja, en gris) y cuando está prendido el error de
          login lo dice con todas las letras (ver mensajeLogin). Sigue visible
          porque Lucas y Ari entran por acá todos los días. */}
      <button
        onClick={() => setEsAdmin((v) => !v)}
        disabled={cargando}
        style={{
          marginTop: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          maxWidth: "100%",
          background: esAdmin ? S.card3 : "transparent",
          color: esAdmin ? S.white : S.lgray,
          border: "1px solid " + (esAdmin ? S.white : "transparent"),
          borderRadius: 22,
          padding: "12px 14px",
          minHeight: TAP,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          // Que el texto pueda cortarse: con el zoom del sistema al 200% este
          // botón era lo único que se salía de la pantalla del login (+22px).
          whiteSpace: "normal",
          textAlign: "center",
          cursor: cargando ? "not-allowed" : "pointer",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: esAdmin ? S.white : S.lgray, flexShrink: 0 }} />
        {esAdmin ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={14} />Acceso administrador activado</span> : "Acceso administrador"}
      </button>
    </div>
  );
}
// ── PANTALLA BIENVENIDA (rediseño ronda 11, saludo por género ronda 12) ──
// Ya NO lleva logo/ícono (ni girando ni estático) — arranca directo con la
// foto del alumno. Género vive en rm.genero ('M'/'F', ronda 12 — mismo
// patrón sin-migración que movilidad_default/secciones_config, editable
// desde el admin en alta y edición de alumno); sin setear usa el fallback
// neutro "¡Bienvenido/a!" de siempre.
function Bienvenida({ alumno, plan, semanaData, semanaActual, onContinuar, onIrADia, onIrAPreparacion, biblioteca }) {
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
// ── APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [alumnos, setAlumnos] = useState(ALUMNOS_INIT);
  const [cargado, setCargado] = useState(false);
  const [alumno, setAlumno] = useState(null);
  const [biblioteca, setBiblioteca] = useState([]);
  const [novedades, setNovedades] = useState([]);
  const [showBienvenida, setShowBienvenida] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  // 2026-07-31, aprendizaje de Instagram/Mercado Libre (Lucas): el nav del
  // alumno tiene que quedar fijo abajo, con ícono+label, no scrollear con el
  // contenido como las 2 pills de texto que había antes.
  // ?vista=movil fuerza el layout mobile en cualquier pantalla (para
  // previsualizar sin depender de un celular real o achicar la ventana).
  const forzarMovil = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("vista") === "movil";
  const wideAlumno = useIsWide() && !forzarMovil;
  // 2026-07-31, pedido de Lucas: el ícono de Luqui vive en la barra inferior
  // — este ref permite abrir el panel de chat desde ahí (ver CoachFlotante).
  const coachRef = useRef(null);
  // ── MODO ENTRENADOR (ronda 9) ──
  // El admin (Lucas/Ari/Griselda) opera la interfaz del alumno con los
  // presenciales: elige un alumno y ve EXACTAMENTE su vista, cargando pesos
  // que se guardan igual que si los cargara el alumno. Barra roja arriba +
  // "Volver al panel" para salir.
  const [modoEntrenador, setModoEntrenador] = useState(false);
  const [selectorEntrenador, setSelectorEntrenador] = useState(false);
  const [tab, setTab] = useState("Movilidad");
  // 2026-07-30: mismo arreglo que en AdminPanel — "Entrenamiento"/"Diario" se
  // reiniciaba a Entrenamiento en cada F5. Se restaura desde sessionStorage.
  const [tabGroup, setTabGroup] = useState(() => {
    try { return sessionStorage.getItem("di_alumno_tabgroup") || "entrenamiento"; } catch { return "entrenamiento"; }
  });
  useEffect(() => {
    try { sessionStorage.setItem("di_alumno_tabgroup", tabGroup); } catch {}
  }, [tabGroup]);
  // 2026-07-31, pedido de Lucas: "el alumno debería poder ver su historial
  // de pesos y la bioimpedancia" — hasta hoy EstudioBioSeccion solo se
  // montaba en el panel admin (evalTab === "bio"), el alumno no tenía forma
  // de verla. El tab "Diario" pasa a llamarse "Historial" y adentro tiene
  // dos sub-secciones: Diario (lo de siempre) y Bioimpedancia (de solo
  // lectura — mismo componente que usa el admin, con readOnly). El id
  // interno del tab de nivel 1 sigue siendo "diario" a propósito (lo usan
  // el atajo del botón atrás y el resto del archivo): solo cambia la
  // ETIQUETA visible y lo que hay adentro.
  const [historialSub, setHistorialSub] = useState("diario");
  const [diaIdx, setDiaIdx] = useState(0);
  // Ronda 17 (punto 4): pills de días (debajo del nombre del alumno)
  // clickeables → saltan directo a Entrenamiento → Principales con el día
  // tocado. Token simple (se incrementa en cada click) para que
  // PlanDelDia detecte el pedido vía useEffect y fuerce seccion="principales"
  // (su propio estado interno, no controlado desde acá).
  const [irPrincipalesToken, setIrPrincipalesToken] = useState(0);
  // Ronda 18: día de la semana FOCADO por la pill de la ficha. Con la
  // estructura actual cada día de la semana es un alumno_plan SEPARADO
  // (dia_semana propio, con un único sub-día "Sesion"): las pills tienen
  // que poder cambiar QUÉ plan se muestra, no solo el sub-día. null =
  // comportamiento normal (plan de hoy).
  const [diaSemanaFoco, setDiaSemanaFoco] = useState(null);
  // 2026-07-31, pedido de Lucas: "necesito que puedan elegir el día que
  // quiere entrenar ahí abajo [en Principales]" — antes esta lógica vivía
  // solo en el onClick de las pills del header (arriba de todo). Se extrae
  // acá para reusarla también en el selector de día DENTRO de Principales,
  // sin duplicar el matching de nombres/acentos.
  const irADiaSemana = (diaNombre) => {
    const norm = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const idxPlan = planValido ? plan.dias.findIndex((d) => norm(d.dia) === norm(diaNombre)) : -1;
    if (idxPlan >= 0) {
      setDiaIdx(idxPlan);
    } else {
      const planDia = (al.planes || []).find((p) => norm(p.dia_semana) === norm(diaNombre));
      if (planDia) {
        setDiaSemanaFoco(diaNombre);
        setDiaIdx(0);
      }
    }
    setTabGroup("entrenamiento");
    setIrPrincipalesToken((t) => t + 1);
  };
  // Ronda 17 (punto 4): fecha editable en "Marcar presente" — antes
  // forzaba siempre hoy(); ahora hay un selector con hoy como default,
  // para poder cargar una asistencia de un día anterior que se olvidó.
  const [fechaAsistencia, setFechaAsistencia] = useState(hoy());
  const [pesos, setPesos] = useState({});
  const [historiales, setHistoriales] = useState({});
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const _toastTimer = useRef(null);
  const showToast = (msg, ms = 2500) => {
    setToastMsg(msg);
    if (_toastTimer.current) clearTimeout(_toastTimer.current);
    _toastTimer.current = setTimeout(() => setToastMsg(""), ms);
  };
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("di_theme") !== "light";
    } catch (e) {
      return true;
    }
  });
  const toggleTheme = () => {
    const next = !darkMode;
    applyTheme(next);
    aplicarIconosTema(next);
    setDarkMode(next);
    try {
      localStorage.setItem("di_theme", next ? "dark" : "light");
    } catch (e) {}
  };
  applyTheme(darkMode);
  aplicarIconosTema(darkMode);
  // Arranque: carga desde Supabase. Fallback [] = nunca usa datos locales.
  // Con la RLS activa, los datos solo se pueden leer con una sesión de Auth.
  // Al arrancar: si hay sesión (F5 con login vigente) se cargan; si no, se
  // muestra el login. Post-login, login()/loginAsAdmin() vuelven a cargar.
  // 2026-08-13 (auditoría de uso): esto era un `.then()` pelado, sin `.catch()`
  // ni timeout. Si el teléfono no llegaba a Supabase (wifi flojo en el
  // gimnasio, datos cortados, Supabase caído), `cargado` no pasaba nunca a
  // true y el alumno se quedaba mirando el logo girando PARA SIEMPRE: ni una
  // palabra ni un botón. Reproducido: a los 15 segundos el body seguía sin un
  // solo texto. Ahora hay tres redes: el catch, un tope de 8 segundos, y una
  // pantalla que dice qué pasó y ofrece reintentar.
  const [arranqueFallo, setArranqueFallo] = useState(false);
  useEffect(() => {
    console.log("%c[APP] Iniciando → chequeando sesión...", "color:#6ee7b7;font-weight:bold");
    let vivo = true;
    const tope = setTimeout(() => { if (vivo) setArranqueFallo(true); }, 8000);
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => (session ? recargarDatos() : null))
      .catch((e) => {
        console.error("[APP] No se pudo arrancar:", e);
        if (vivo) setArranqueFallo(true);
      })
      .finally(() => {
        if (!vivo) return;
        clearTimeout(tope);
        // Si llegó tarde pero llegó, la app entra igual: `cargado` gana sobre
        // la pantalla de error.
        setCargado(true);
      });
    return () => { vivo = false; clearTimeout(tope); };
  }, []);
  const _primeraVez = useRef(true);
  // Flag para cambios de estado que NO deben persistirse (ej. hidratar fotos
  // que ya vienen de la base — re-guardarlas sería subir megas al pedo).
  const _skipNextSave = useRef(false);
  // Guardado SELECTIVO: snapshot por alumno del último estado guardado (sin
  // foto, que se hidrata aparte). Antes se re-guardaban TODOS los alumnos en
  // cada cambio de estado: cualquier pestaña abierta "resucitaba" alumnos
  // borrados desde otro dispositivo y reescribía plan_dias completo al pedo.
  const _snapAlumno = (a) => { const { foto, ...rest } = a; return JSON.stringify(rest); };
  const _ultimoGuardado = useRef(new Map());
  // Payload (columnas de la tabla) tal como quedó en la base la última vez que
  // se guardó cada alumno. Lo usa guardarDatos para escribir SOLO las columnas
  // que cambiaron en vez de pisar la fila entera — sin esto, una pestaña con el
  // estado viejo revierte todo lo que hizo la otra (bug del 2026-08-09).
  const _ultimoPayload = useRef(new Map());
  const _snapPayloads = (lista) => new Map(lista.map((a) => [a.id, payloadAlumno(a)]));
  // Carga (o recarga) todos los datos que la sesión actual puede ver. La RLS
  // decide el alcance: un alumno ve solo lo suyo, un admin ve todo. Se setea
  // _primeraVez para que el effect de guardado tome esto como línea base y no
  // dispare un guardado espurio al poblar el estado.
  const recargarDatos = async () => {
    const data = await cargarDatos(ALUMNOS_INIT);
    _primeraVez.current = true;
    setAlumnos(data);
    cargarFotos().then((fotos) => {
      if (Object.keys(fotos).length === 0) return;
      _skipNextSave.current = true;
      setAlumnos((prev) => prev.map((a) => (fotos[a.id] ? { ...a, foto: fotos[a.id] } : a)));
      setAlumno((prev) => (prev && fotos[prev.id] ? { ...prev, foto: fotos[prev.id] } : prev));
    });
    cargarBiblioteca().then(setBiblioteca);
    cargarNovedades().then(setNovedades);
    return data;
  };
  useEffect(() => {
    if (!cargado) return;
    if (_primeraVez.current) {
      _primeraVez.current = false;
      _ultimoGuardado.current = new Map(alumnos.map((a) => [a.id, _snapAlumno(a)]));
      _ultimoPayload.current = _snapPayloads(alumnos);
      return;
    }
    if (_skipNextSave.current) {
      _skipNextSave.current = false;
      return;
    }
    const cambiados = alumnos.filter((a) => _ultimoGuardado.current.get(a.id) !== _snapAlumno(a));
    if (cambiados.length === 0) {
      console.log(`%c[APP] Cambio en alumnos (${alumnos.length}) → sin cambios reales, skip guardado.`, "color:#a5b4fc;font-weight:bold");
      return;
    }
    console.log(`%c[APP] Cambio en alumnos → guardando ${cambiados.length}/${alumnos.length}...`, "color:#a5b4fc;font-weight:bold");
    // COPIA del mapa (2026-08-10): guardarDatos es async y lee `previos` alumno
    // por alumno, pero abajo se pisa _ultimoPayload en el mismo tick — a partir
    // del segundo alumno comparaba contra el payload NUEVO y no veía cambios.
    // 2026-08-13: si el guardado falla, el snapshot se REVIERTE. Antes se
    // marcaba como guardado pase lo que pase (guardarDatos era fire-and-forget
    // y _guardarAlumno se tragaba el error): el diario o la asistencia que el
    // alumno acababa de cargar quedaban solo en memoria, sin reintento y sin
    // aviso, y se perdían al cerrar la app.
    guardarDatos(cambiados, new Map(_ultimoPayload.current)).catch((e) => {
      console.error("[APP] Falló el guardado de alumnos:", e);
      cambiados.forEach((a) => {
        _ultimoGuardado.current.delete(a.id);
        _ultimoPayload.current.delete(a.id);
      });
      showToast("No se pudo guardar. Revisá la conexión");
    });
    cambiados.forEach((a) => {
      _ultimoGuardado.current.set(a.id, _snapAlumno(a));
      _ultimoPayload.current.set(a.id, payloadAlumno(a));
    });
  }, [alumnos, cargado]);
  // Persistencia de sesión: al refrescar (F5) la app tiene que mantener al
  // usuario logueado, no mandarlo al login. Solo se cierra sesión con el
  // botón "Salir"/"Cerrar" explícito (ver logout()).
  const _sesionRestaurada = useRef(false);
  useEffect(() => {
    if (!cargado || _sesionRestaurada.current) return;
    _sesionRestaurada.current = true;
    let sesion = null;
    try {
      sesion = JSON.parse(localStorage.getItem("di_session") || "null");
    } catch (e) {
      sesion = null;
    }
    if (!sesion) return;
    // Expiración de sesión (auditoría 2026-08-02): sin TTL, un teléfono
    // perdido/prestado quedaba logueado para siempre. El admin caduca antes
    // (7 días) que el alumno (30 días) por el alcance de sus datos.
    const MAX_MS = sesion.type === "admin" ? 7 * 864e5 : 30 * 864e5;
    if (sesion.at && Date.now() - sesion.at > MAX_MS) {
      try { localStorage.removeItem("di_session"); } catch (e) {}
      cerrarSesionAuth();
      return;
    }
    if (sesion.type === "admin") {
      // adminMode se deriva del JWT, no del localStorage (auditoría
      // 2026-08-02): antes alcanzaba con escribir di_session='{"type":"admin"}'
      // en la consola para entrar al panel. La RLS lo contenía (is_admin() da
      // false, no ve datos ajenos), pero esto cierra el agujero de raíz:
      // app_metadata.role solo lo escribe el service_role en auth-bridge.
      (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.app_metadata?.role === "admin") setAdminMode(true);
        else { try { localStorage.removeItem("di_session"); } catch (e) {} }
      })();
    } else if (sesion.type === "alumno" && sesion.id) {
      const f = alumnos.find((x) => x.id === sesion.id);
      if (f) {
        cargarPesos(f.id, null).then((guardado) => {
          setPesos(guardado ? guardado.pesos : initPesos(f.plan));
          setHistoriales(guardado ? guardado.historiales : initH(f.plan));
          setAlumno(f);
          setTabGroup("entrenamiento");
          setTab("Ejercicios");
          setDiaIdx(0);
        });
      } else {
        try { localStorage.removeItem("di_session"); } catch (e) {}
      }
    }
  }, [cargado, alumnos]);
  const login = async (a) => {
    await recargarDatos(); // biblioteca/novedades + datos que la sesión del alumno puede ver
    const f = alumnos.find((x) => x.id === a.id) || a;
    const guardado = await cargarPesos(f.id, null);
    setPesos(guardado ? guardado.pesos : initPesos(f.plan));
    setHistoriales(guardado ? guardado.historiales : initH(f.plan));
    setDiaSemanaFoco(null);
    setAlumno(f);
    setShowBienvenida(true);
    setTabGroup("entrenamiento");
    setTab("Ejercicios");
    setDiaIdx(0);
    try { localStorage.setItem("di_session", JSON.stringify({ type: "alumno", id: f.id, at: Date.now() })); } catch (e) {}
  };
  const loginAsAdmin = async () => {
    try { localStorage.setItem("di_session", JSON.stringify({ type: "admin", at: Date.now() })); } catch (e) {}
    await recargarDatos(); // con la sesión admin ya se ven todos los alumnos
    setAdminMode(true);
  };
  const logout = () => {
    try { localStorage.removeItem("di_session"); } catch (e) {}
    cerrarSesionAuth();
    setAlumnos([]);
    setDiaSemanaFoco(null);
    setAlumno(null);
    setAdminMode(false);
    setModoEntrenador(false);
    setSelectorEntrenador(false);
  };
  // Entrar al modo entrenador con un alumno elegido: carga sus pesos e
  // historiales igual que el login del alumno, pero SIN tocar la sesión
  // persistida (di_session sigue siendo admin) y sin bienvenida.
  const entrarModoEntrenador = async (a) => {
    const f = alumnos.find((x) => x.id === a.id) || a;
    const guardado = await cargarPesos(f.id, null);
    setPesos(guardado ? guardado.pesos : initPesos(f.plan));
    setHistoriales(guardado ? guardado.historiales : initH(f.plan));
    setDiaSemanaFoco(null);
    setAlumno(f);
    setModoEntrenador(true);
    setSelectorEntrenador(false);
    setShowBienvenida(false);
    setTabGroup("entrenamiento");
    setTab("Ejercicios");
    setDiaIdx(0);
  };
  const salirModoEntrenador = () => {
    setDiaSemanaFoco(null);
    setModoEntrenador(false);
    setAlumno(null);
  };
  // Botón "atrás" del celular/navegador: como la app navega por estado (sin
  // URLs), un back te sacaba de la app. Ahora, mientras hay sesión, "atrás"
  // retrocede DENTRO de la app (cierra lo que esté abierto) en vez de salir;
  // en el login sí deja salir normal. Es lo que hacen las apps de verdad.
  const _backRef = useRef(() => false);
  _backRef.current = () => {
    if (selectorEntrenador) { setSelectorEntrenador(false); return true; }
    if (modoEntrenador) { salirModoEntrenador(); return true; }
    if (showBienvenida) { setShowBienvenida(false); return true; }
    if (tabGroup === "diario") { setTabGroup("entrenamiento"); return true; }
    if (diaSemanaFoco) { setDiaSemanaFoco(null); return true; }
    return false; // ya en el inicio: no cerrar la app (se sale con "Salir")
  };
  const _logueado = !!alumno || adminMode;
  useEffect(() => {
    if (!_logueado) return; // sin sesión, el back se comporta normal
    window.history.pushState(null, "", window.location.href);
    const onPop = () => {
      _backRef.current();
      window.history.pushState(null, "", window.location.href); // re-armar la trampa
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [_logueado]);
    // Timers del debounce de guardado de peso, uno por ejercicio (auditoría
    // 2026-08-02, ver handlePeso).
    const _pesoSaveTimers = useRef(new Map());
    const handlePeso = (id, val) => {
    // Cap de sanidad (auditoría 2026-08-02): sin tope, un tap sostenido o un
    // pegado dejaban pesos absurdos tipo 999999 en la DB y en el historial.
    // 500kg cubre cualquier levantamiento real.
    const num = Math.min(Math.max(0, Number(val) || 0), 500);
    const np = { ...pesos, [id]: num };
    // Reemplaza la entrada de HOY en vez de appendear (auditoría 2026-08-02):
    // antes cada tecla/tap armaba una entrada nueva en el historial local
    // ("1kg", "12kg", "125kg" como si fueran 3 registros del día).
    const hoyStr = hoy();
    const restoHist = (historiales[id] || []).filter((h) => h.fecha !== hoyStr);
    const nh = { ...historiales, [id]: [...restoHist, { fecha: hoyStr, peso: num }] };
    setPesos(np);
    setHistoriales(nh);
    // Guarda en Supabase solo ejercicios principales (plan.dias).
    // registros_diarios es la única fuente de verdad de pesos (alimenta el
    // historial del alumno y el reporte mensual del admin). historial_pesos
    // no se usa: su FK apunta a una tabla "ejercicios" que la app no tiene.
    // Debounce de 600ms (auditoría 2026-08-02): sin esto, cada tecla/tap
    // dispara 2 requests (select+update) — escribir "125" eran 6 requests.
    // El estado local (arriba) sigue instantáneo; solo se pospone la red.
    // registrarDia() re-sincroniza todo igual, así que un debounce que queda
    // colgado (el alumno cierra la app antes de los 600ms) no pierde el dato.
    const timers = _pesoSaveTimers.current;
    clearTimeout(timers.get(id));
    timers.set(id, setTimeout(() => saveDailyWeight(alumno.id, hoyStr, id, num), 600));
  };

  // ── PESO POR VUELTA (2026-08-09) ─────────────────────────────────────
  // Pedido de Lucas: "el peso se tiene que marcar por vuelta". `pesosVuelta`
  // guarda, por ejercicio, lo que hay cargado HOY tal cual va a la base: un
  // número (registro viejo) o un array con una entrada por serie.
  // Se siembra desde el historial que baja de la base y después lo maneja
  // handlePesoVuelta, que es el único que escribe.
  const [pesosVuelta, setPesosVuelta] = useState({});
  useEffect(() => {
    const hoyStr = hoy();
    const dehoy = {};
    Object.entries(historiales || {}).forEach(([eid, arr]) => {
      const reg = (arr || []).find((h) => h.fecha === hoyStr);
      if (reg && reg.vueltas !== undefined) dehoy[eid] = reg.vueltas;
    });
    // Merge, no reemplazo: lo que el alumno acaba de tipear (y todavía está en
    // el debounce de 600ms) no puede quedar pisado por la recarga.
    setPesosVuelta((prev) => ({ ...dehoy, ...prev }));
  }, [historiales]);

  const _vueltaSaveTimers = useRef(new Map());
  const handlePesoVuelta = (id, serie, val) => {
    // Mismo cap de sanidad que handlePeso: sin tope quedaban pesos absurdos.
    const num = Math.min(Math.max(0, Number(val) || 0), 500);
    const nuevo = setVuelta(pesosVuelta[id], serie, num);
    const np = { ...pesosVuelta };
    if (nuevo == null) delete np[id];
    else np[id] = nuevo;
    setPesosVuelta(np);

    // El peso "del día" que ven el historial y los gráficos es el máximo de
    // las vueltas — se mantiene en sincronía sin volver a pedirle nada a la base.
    const repr = pesoRepresentativo(nuevo);
    const hoyStr = hoy();
    setPesos((p) => ({ ...p, [id]: repr }));
    setHistoriales((h) => {
      const resto = (h[id] || []).filter((x) => x.fecha !== hoyStr);
      return { ...h, [id]: repr > 0 ? [...resto, { fecha: hoyStr, peso: repr, vueltas: nuevo }] : resto };
    });

    const timers = _vueltaSaveTimers.current;
    const clave = id + ":" + serie;
    clearTimeout(timers.get(clave));
    timers.set(clave, setTimeout(() => saveDailyWeight(alumno.id, hoyStr, id, num, serie), 600));
  };

  const marcarAsistencia = (fecha) => {
    // La asistencia de HOY se guarda con hora ("YYYY-MM-DD HH:mm"); días
    // anteriores quedan solo fecha. registroAsistencia() (helpers.js) es la
    // única función que arma este formato — el toggle rápido del admin la
    // usa también, para que no haya dos lugares calculando la hora distinto.
    const registro = registroAsistencia(fecha);
    const u = alumnos.map((a) => (a.id === alumno.id ? { ...a, asistencia: [...(a.asistencia || []), registro] } : a));
    setAlumnos(u);
    setAlumno(u.find((a) => a.id === alumno.id));
  };
  const addDiario = (entrada) => {
    const u = alumnos.map((a) => (a.id === alumno.id ? { ...a, diario: [...(a.diario || []), entrada] } : a));
    setAlumnos(u);
    setAlumno(u.find((a) => a.id === alumno.id));
  };
  // Ronda 17 (punto 4): editar una entrada de diario ya escrita (texto Y
  // fecha, no solo el texto). Identifica la entrada por su índice en el
  // array SIN ordenar (Diario.jsx ordena para mostrar, pero manda el
  // índice real de al.diario junto con el patch).
  const editarDiario = (idx, patch) => {
    const u = alumnos.map((a) =>
      a.id === alumno.id ? { ...a, diario: (a.diario || []).map((e, i) => (i === idx ? { ...e, ...patch } : e)) } : a
    );
    setAlumnos(u);
    setAlumno(u.find((a) => a.id === alumno.id));
  };
  // 2026-07-31, pedido de Lucas: "el alumno tiene que poder borrar un
  // comentario" — mismo patrón que editarDiario, filtra por índice.
  const eliminarDiario = (idx) => {
    const u = alumnos.map((a) =>
      a.id === alumno.id ? { ...a, diario: (a.diario || []).filter((_, i) => i !== idx) } : a
    );
    setAlumnos(u);
    setAlumno(u.find((a) => a.id === alumno.id));
  };
  // ── REGISTRAR DÍA (ronda 8) ──
  // Cierre explícito de la sesión de hoy. Los pesos YA se autoguardan con cada
  // cambio (handlePeso → saveDailyWeight); este botón: 1) re-sincroniza todos
  // los pesos >0 de los ejercicios de hoy en registros_diarios (por si algún
  // guardado suelto falló sin conexión), 2) marca la asistencia de hoy si no
  // estaba, 3) deja constancia local de que el día fue registrado (el botón
  // queda en verde "✓ DÍA REGISTRADO" por el resto del día).
  // Ronda 9: la marca guarda "fecha:alumnoId" — así en modo entrenador el
  // registro de un alumno no marca como registrado el día de otro alumno
  // (antes era solo la fecha, global al dispositivo).
  const [diaRegistrado, setDiaRegistrado] = useState(() => {
    try { return localStorage.getItem("di_dia_registrado") || null; } catch (e) { return null; }
  });
  const [registrandoDia, setRegistrandoDia] = useState(false);
  // (Ronda 18: el estado bioUltimo se eliminó junto con los tiles de
  // peso/altura/edad de la vista del alumno — esos datos quedaron solo en
  // la ficha del admin.)
  const registrarDia = async (ejerciciosHoy) => {
    if (registrandoDia || !alumno) return;
    setRegistrandoDia(true);
    try {
      const f = hoy();
      for (const ej of ejerciciosHoy || []) {
        // Re-sincroniza VUELTA POR VUELTA (2026-08-09): antes mandaba un solo
        // peso por ejercicio y este botón, pensado como red de seguridad para
        // guardados que fallaron sin conexión, habría aplastado las series
        // cargadas dejando una sola.
        // 2026-08-13: se recorre CON los huecos (vueltasDe, no
        // vueltasCargadas). Con vueltasCargadas los nulls se filtraban y las
        // posiciones se corrían: un alumno que cargó solo la serie 3 la veía
        // volver como serie 1 después de tocar "Registrar día".
        const vueltas = vueltasDe(pesosVuelta[ej.id]);
        if (vueltasCargadas(vueltas).length) {
          for (let i = 0; i < vueltas.length; i++) {
            if (!(vueltas[i] > 0)) continue;
            await saveDailyWeight(alumno.id, f, ej.id, vueltas[i], i + 1);
          }
          continue;
        }
        const p = Number(pesos[ej.id]);
        if (p > 0) await saveDailyWeight(alumno.id, f, ej.id, p);
      }
      await saveDailyAttendance(alumno.id, f, true);
      const alActual = alumnos.find((a) => a.id === alumno.id);
      if (!(alActual?.asistencia || []).some((a) => a.slice(0, 10) === f)) marcarAsistencia(f);
      const marca = f + ":" + alumno.id;
      try { localStorage.setItem("di_dia_registrado", marca); } catch (e) {}
      setDiaRegistrado(marca);
      showToast("Día registrado");
    } catch (e) {
      // 2026-08-13: desde que saveDailyWeight/saveDailyAttendance LANZAN
      // cuando la escritura falla, este catch se ejecuta de verdad. Antes las
      // dos loguaban y hacían `return`, así que un guardado fallido (sin señal
      // en el gimnasio, sesión de Supabase vencida) igual pintaba el botón de
      // verde: el alumno se iba convencido de que su sesión había quedado
      // registrada. El botón NO se marca (diaRegistrado no se toca) y el
      // mensaje dice qué hacer.
      console.error("[registrarDia]", e);
      showToast("No se pudo guardar. Revisá la conexión y tocá de nuevo");
    } finally {
      setRegistrandoDia(false);
    }
  };
  const handleGenerarPDF = async () => {
    setGenerandoPDF(true);
    try {
      await generarPDF(al, historiales);
    } finally {
      setGenerandoPDF(false);
    }
  };
  // Pantalla de carga (ronda 9, logo al doble ronda 11).
  // 2026-08-13 (auditoría de uso): el logo era MUDO. Ahora dice qué está
  // pasando mientras carga, y si la app no pudo abrir (sin internet, Supabase
  // caído) muestra el motivo en castellano llano y un botón grande para
  // reintentar — la escala es la de la vista del alumno mayor (>=21px, botón
  // de 72px), no la del panel.
  if (!cargado)
    return (
      <>
        <GlobalStyles />
        <div
          style={{
            minHeight: "100vh",
            background: S.bg,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          {/* `estatico` cuando falló: el logo que sigue girando mientras se
              avisa que no se pudo abrir parece que todavía está cargando (y
              de perfil se ve como una astilla). Quieto, es un logo. */}
          <Logo3D size={arranqueFallo ? 120 : 190} estatico={arranqueFallo} />
          {arranqueFallo ? (
            <>
              <div style={{ color: S.white, fontSize: 26, fontWeight: 800, marginTop: 24, lineHeight: 1.25, maxWidth: 420 }}>
                No pudimos abrir la app
              </div>
              <div style={{ color: S.gray, fontSize: 21, marginTop: 12, lineHeight: 1.45, maxWidth: 420 }}>
                Fijate que tengas internet (wifi o datos) y tocá el botón de abajo.
              </div>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: 28,
                  width: "100%",
                  maxWidth: 420,
                  minHeight: 72,
                  background: S.white,
                  color: S.bg,
                  border: "none",
                  borderRadius: 12,
                  fontSize: 22,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Probar de nuevo
              </button>
            </>
          ) : (
            <div style={{ color: S.gray, fontSize: 21, marginTop: 20 }}>Abriendo tu app...</div>
          )}
        </div>
      </>
    );
  if (adminMode && !(modoEntrenador && alumno))
    return (
      <>
        <AdminPanel
          alumnos={alumnos}
          onUpdate={(u) => setAlumnos(u)}
          onClose={logout}
          showToast={showToast}
          biblioteca={biblioteca}
          onGuardarBiblioteca={async (ej) => { await guardarEjercicioBiblioteca(ej); cargarBiblioteca().then(setBiblioteca); }}
          onBibliotecaRefresh={() => cargarBiblioteca().then(setBiblioteca)}
          novedades={novedades}
          onNovedadesChange={setNovedades}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          onModoEntrenador={() => setSelectorEntrenador(true)}
        />
        {selectorEntrenador && (
          <SelectorAlumnoEntrenador
            alumnos={alumnos}
            onElegir={entrarModoEntrenador}
            onCerrar={() => setSelectorEntrenador(false)}
          />
        )}
        <Toast msg={toastMsg} />
      </>
    );
  if (!alumno) return <Login onLogin={login} onAdmin={loginAsAdmin} alumnos={alumnos} darkMode={darkMode} onToggleTheme={toggleTheme} />;
  const al = alumnos.find((a) => a.id === alumno.id) || alumno;
  // 2026-08-09 · Alumno "solo video" (adultos mayores presenciales): apenas
  // entra ve su video de movilidad y nada más. Va ANTES que cualquier otra
  // vista a propósito — no debe pasar por tabs, bienvenida ni plan.
  if (al.tipo === "video") {
    return (
      <>
        {modoEntrenador && <BarraEntrenador nombre={al.nombre} onVolver={salirModoEntrenador} />}
        <VistaVideoAlumno
          nombre={al.nombre}
          video={al.video_movilidad}
          onSalir={modoEntrenador ? salirModoEntrenador : logout}
        />
      </>
    );
  }
  const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
  const hoyTexto = DIAS_SEMANA[new Date().getDay()];
  // Elección del plan a mostrar (bug Vic, 2026-07-21): antes, un día sin plan
  // asignado caía en al.plan (copia de compatibilidad de planes[0], orden
  // arbitrario de la base) y el alumno podía ver una copia vieja distinta de
  // la que el admin editó. Ahora es determinístico: plan de HOY → "Fijo" →
  // el PRÓXIMO día que entrena → el primero de la semana. al.plan queda solo
  // como último recurso cuando no hay planes reales.
  const _planesOrdenados = [...(al.planes || [])]
    // _huerfano (2026-08-13) = días sueltos que quedaron colgados de un camino
    // de escritura viejo. Se le muestran al admin para que los limpie, pero no
    // pueden competir por ser el plan del día del alumno.
    .filter((p) => p && !p._huerfano && Array.isArray(p.dias) && p.dias.length > 0)
    .sort((a, b) => (ORDEN_DIAS[a.dia_semana] || 9) - (ORDEN_DIAS[b.dia_semana] || 9));
  const _hoyOrden = ORDEN_DIAS[hoyTexto] || 0;
  // Ronda 18: normalización sin acentos para comparar días ("Miércoles"
  // de horarios vs "Miercoles" de la base).
  const _normDia = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const planHoy =
    (diaSemanaFoco && _planesOrdenados.find((p) => _normDia(p.dia_semana) === _normDia(diaSemanaFoco))) ||
    _planesOrdenados.find((p) => p.dia_semana === hoyTexto) ||
    _planesOrdenados.find((p) => p.dia_semana === "Fijo") ||
    _planesOrdenados.find((p) => (ORDEN_DIAS[p.dia_semana] || 9) > _hoyOrden) ||
    _planesOrdenados[0] ||
    al.plan;
  const plan = planHoy || al.plan;
  const planValido = plan && Array.isArray(plan.dias) && plan.dias.length > 0;
  // 2026-08-13 — El historial del alumno es del EJERCICIO, no de la fila del
  // plan. `histUnidos` mapea cada id de ejercicio al historial unido de todas
  // sus filas (el Hip thrust del lunes y el del sábado son el mismo ejercicio),
  // y `planTodos` junta los días de todos sus planes para Evolución y Resumen,
  // que hasta hoy miraban solo el primero. Lo que se ESCRIBE sigue yendo
  // contra el id de la fila que el alumno está mirando: esto es solo lectura.
  const histUnidos = unirHistorialesPorEjercicio(ejerciciosDeTodosLosPlanes(al), historiales);
  const planTodos = { ...(al.plan || {}), dias: diasDeTodosLosPlanes(al) };
  const semanaActual = planValido ? getSemanaActual(plan.periodizacion) : 1;
  // Fallback SIEMPRE (ronda 14): un alumno nuevo armado desde el Armador
  // puede tener plan sin periodización todavía — sem undefined rompía
  // PlanDelDia con pantalla en blanco.
  const sem = (planValido && ((plan.periodizacion || []).find((p) => p.semana === semanaActual) || (plan.periodizacion || [])[0])) || { series: "-", reps: "-", intensidad: "" };
  const prevSem = planValido ? (plan.periodizacion || []).find((p) => p.semana === semanaActual - 1) : null;
  const dia = planValido ? plan.dias[diaIdx] : null;
  // Modo de etiquetado de días (punto 9): lo elige el admin por alumno.
  const diasModo = al.rm?.dias_modo === "numerico" ? "numerico" : "nombres";
  if (showBienvenida)
    return (
      <Bienvenida
        alumno={al}
        plan={plan}
        biblioteca={biblioteca}
        semanaData={sem}
        semanaActual={semanaActual}
        onContinuar={() => setShowBienvenida(false)}
        onIrAPreparacion={() => { setShowBienvenida(false); setTabGroup("entrenamiento"); }}
        // 2026-07-31, pedido de Lucas: "entrenás los martes jueves y viernes
        // deberían ya llevarla a los ejercicios principales en ese día" — las
        // pills de días de la portada eran texto muerto. Mismo mecanismo que
        // ya usan las pills de la ficha del alumno (línea ~7010): buscan el
        // sub-día del plan visible, o si el día es un alumno_plan aparte lo
        // enfoca, y saltan derecho a Principales.
        onIrADia={(nombreDia) => {
          // 2026-07-31 — Lucas: "al clicar en entrenar te tiene que llevar a
          // movilidad corta... ahora te lleva a principales bien abajo de
          // todo". Antes se copiaba el mismo salto que las pills de la ficha
          // (setIrPrincipalesToken fuerza seccion="principales" + scroll a
          // esa sección). Acá NO: se elige el día y se entra directo —
          // PlanDelDia ya arranca en Preparación → Movilidad → Corta por
          // default, así que basta con no forzar el salto y con llevar el
          // scroll de la página al tope.
          const norm = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
          const idxPlan = planValido ? plan.dias.findIndex((d) => norm(d.dia) === norm(nombreDia)) : -1;
          if (idxPlan >= 0) {
            setDiaIdx(idxPlan);
          } else {
            const planDia = (al.planes || []).find((p) => norm(p.dia_semana) === norm(nombreDia));
            if (planDia) { setDiaSemanaFoco(nombreDia); setDiaIdx(0); }
          }
          setTabGroup("entrenamiento");
          setShowBienvenida(false);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  return (
    <>
      {" "}
      <GlobalStyles /> <Toast msg={toastMsg} />{" "}
      <CoachFlotante
        ref={coachRef}
        alumno={al}
        iconWhite={ICON_WHITE_CROP}
        iconBlack={ICON_BLACK_CROP}
        darkMode={darkMode}
        S={S}
        // 2026-07-31, pedido de Lucas: el ícono de Luqui pasa a la barra
        // inferior fija — en mobile ya no hace falta el botón flotante
        // arrastrable (duplicaría el acceso), y el panel se corre para no
        // quedar tapado por esa barra.
        mostrarBoton={wideAlumno}
        panelBottom={wideAlumno ? 14 : 78}
      />{" "}
      {modoEntrenador && <BarraEntrenador nombre={al.nombre} onVolver={salirModoEntrenador} />}{" "}
      {/* Auditoría 2026-07-30 — patrón de Instagram/Facebook: tirar hacia
          abajo para actualizar. Es el gesto que el alumno ya tiene aprendido;
          antes había que salir y volver a entrar para ver un cambio que el
          entrenador acababa de hacer. Solo actúa con el scroll arriba de todo
          y en pantallas táctiles; en escritorio es un div común. */}
      <PullToRefresh onRefresh={recargarDatos}>
      <div
        style={{
          minHeight: "100vh",
          background: S.bg,
          maxWidth: 480,
          margin: "0 auto",
          fontFamily: "inherit",
          paddingBottom: wideAlumno ? 48 : 88,
          transition: "background 0.3s",
        }}
      >
        {" "}
        {/* Banner semana nueva */}{" "}
        {prevSem && semanaActual > 1 && (
          <div
            style={{
              background: "#0d1a0d",
              borderBottom: "1px solid #1a4d1a",
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {" "}
            <div>
              <div style={{ color: S.green, fontSize: 12, fontWeight: 700 }}>Semana {semanaActual}</div>
              <div style={{ color: S.gray, fontSize: 11, marginTop: 1 }}>
                {sem.series}x{sem.reps}
                {sem.intensidad ? " · " + sem.intensidad : ""}
              </div>
            </div>{" "}
          </div>
        )}{" "}
        {/* Header — ronda 12: ver HeaderAlumno arriba del componente App para
            el detalle del fix de centrado (spacer simétrico medido en vivo). */}
        <HeaderAlumno
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          onSalir={modoEntrenador ? salirModoEntrenador : logout}
          onLogoClick={() => {
            // 2026-07-31 — Lucas: "al clickear el logo me tiene que llevar a
            // la pantalla de bienvenida" (antes solo iba a Entrenamiento).
            coachRef.current?.cerrar();
            setShowBienvenida(true);
          }}
        />{" "}
        {/* Perfil */}{" "}
        <div className="di-pop" style={{ margin: "0 16px 12px", ...card, padding: "13px 16px" }}>
          {" "}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
            {" "}
            <FotoAlumno
              foto={al.foto}
              size={56}
              editable
              onFoto={(foto) => {
                guardarFotoAlumno(al.id, foto);
                const u = alumnos.map((a) => (a.id === al.id ? { ...a, foto } : a));
                setAlumnos(u);
                setAlumno(u.find((a) => a.id === al.id));
              }}
            />{" "}
            <div style={{ flex: 1, minWidth: 0 }}>
              {" "}
              {/* 2026-07-31, pedido de Lucas: "saca Entrenamiento de arriba
                  del nombre, ya dice App de Entrenamiento arriba" — el
                  header (HeaderAlumno) ya lo dice, este eyebrow repetía el
                  mismo dato. */}
              <div style={{ color: S.white, fontFamily: FONT_BODY, fontWeight: 800, fontSize: 20, letterSpacing: -0.2, lineHeight: 1.1 }}>
                {(al.nombre || "").trim().split(/\s+/).slice(1).join(" ") || al.nombre}
              </div>{" "}
            </div>{" "}
            {/* Botón "Presente" del día (pedido de Lucas 2026-07-22): marca
                la asistencia de HOY desde el mismo módulo del nombre, sin
                tener que ir al Diario. Reusa la misma lógica de asistencia. */}
            {(() => {
              const presente = al.asistencia?.some((a) => a.slice(0, 10) === hoy());
              return (
                <button
                  onClick={() => {
                    if (presente) {
                      const u = alumnos.map((a) =>
                        a.id === al.id
                          ? { ...a, asistencia: (a.asistencia || []).filter((f) => f.slice(0, 10) !== hoy()) }
                          : a
                      );
                      setAlumnos(u);
                      setAlumno(u.find((a) => a.id === al.id));
                      showToast && showToast("Asistencia borrada");
                    } else {
                      saveDailyAttendance(al.id, hoy(), true).then(() => {
                        marcarAsistencia(hoy());
                        showToast && showToast("¡Asistencia marcada!");
                      });
                    }
                  }}
                  role="checkbox"
                  aria-checked={presente}
                  aria-label="Marcar asistencia de hoy"
                  title={presente ? "Asistencia marcada hoy. Tocá para deshacer" : "Marcá tu asistencia de hoy"}
                  style={{
                    flexShrink: 0,
                    alignSelf: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: presente ? "rgba(76,175,80,0.12)" : S.card3,
                    color: presente ? S.green : S.white,
                    border: "1px solid " + (presente ? S.green : S.border2),
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: FONT_BODY,
                  }}
                >
                  {/* Casilla — deja claro que se toca acá para marcar */}
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      flexShrink: 0,
                      border: "2px solid " + (presente ? S.green : S.gray),
                      background: presente ? S.green : "transparent",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      lineHeight: 1,
                    }}
                  >
                    {presente ? "✓" : ""}
                  </span>
                  Asistencia
                </button>
              );
            })()}
          </div>{" "}
          {/* 2026-07-31 — Lucas: "Asistencia tiene que quedar más arriba así
              se extienden los días de la semana a lo largo" — sacados de la
              columna del nombre (compartía fila con Asistencia, quedaban sin
              espacio y había que abreviar "M. J. S."). Ahora tienen su
              propia fila de ancho completo: entran los nombres completos. */}
          {al.horarios && al.horarios.length > 0 && (
            <div style={{ display: "flex", flexWrap: "nowrap", gap: 6, marginBottom: 10 }}>
              {al.horarios.map((h, i) => (
                <div
                  key={i}
                  onClick={() => irADiaSemana(h.dia)}
                  title={`Ver ${h.dia} en Principales`}
                  style={{
                    background: S.card2,
                    border: "1px solid " + S.border2,
                    borderRadius: 6,
                    padding: "5px 8px",
                    fontSize: 12,
                    color: S.gray,
                    cursor: "pointer",
                    flex: 1,
                    minWidth: 0,
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ color: S.white, fontWeight: 600 }}>{h.dia}</span>{h.hora ? " · " + h.hora : ""}
                </div>
              ))}
            </div>
          )}
          {/* Punto 10 (2026-07-21): esta zona pasa a estar protagonizada por
              el/los día(s) del plan actual + un selector (si hay más de
              uno) + una ficha compacta que cambia EN VIVO con el día
              elegido — mismo estado (diaIdx) que controla Principales más
              abajo, así ambas partes de la pantalla quedan sincronizadas. */}
          {planValido && (
            <div style={{ marginBottom: 10 }}>
              {plan.dias.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  {plan.dias.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setDiaIdx(i)}
                      style={{
                        flex: 1,
                        minWidth: 64,
                        background: diaIdx === i ? S.white : S.card2,
                        color: diaIdx === i ? S.bg : S.gray,
                        border: "1px solid " + (diaIdx === i ? S.white : S.border),
                        borderRadius: 6,
                        padding: "6px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {diasModo === "numerico" ? `Día ${i + 1}` : d.dia}
                    </button>
                  ))}
                </div>
              )}
              {/* Ribbon de stats — números grandes en la condensada (spec
                  Design 2026-07-22): 18px FONT_DISPLAY da el look editorial
                  tipo Skulpt; micro-labels a 10px (mínimo legible del theme). */}
              <div style={{ display: "flex", gap: 8, background: S.card2, borderRadius: 8, padding: "10px 6px" }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ color: S.white, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{sem.series}x{sem.reps}</div>
                  <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1, marginTop: 3 }}>SERIES X REPS</div>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  {/* 2026-07-31: quedaba verde de una pasada anterior de la
                      auditoría — el Brand Kit solo admite rojo como acento. */}
                  <div style={{ color: S.white, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{sem.intensidad || "—"}</div>
                  <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1, marginTop: 3 }}>INTENSIDAD</div>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ color: S.white, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{(dia?.ejercicios || []).length}</div>
                  <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1, marginTop: 3 }}>EJERCICIOS</div>
                </div>
              </div>
            </div>
          )}
          {/* Ronda 18: peso/altura/edad SE SACARON de la vista del alumno
              (pedido explícito de Lucas: "sirve para el sistema, para mí
              como admin, no para el usuario"). Esos datos siguen visibles
              solo en la ficha del alumno del Panel Admin. */}
          {al.rm && Object.values(al.rm).some((r) => r.peso > 0) && (
            <div style={{ marginTop: 10, borderTop: "1px solid " + S.border, paddingTop: 10 }}>
              {" "}
              <div
                style={{ fontSize: 14, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}
              >
                PESO MAXIMO
              </div>{" "}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {RM_EJS.filter((ej) => al.rm[ej] && al.rm[ej].peso > 0).map((ej) => (
                  <div
                    key={ej}
                    style={{ background: S.card2, border: "1px solid " + S.border, borderRadius: 5, padding: "4px 8px" }}
                  >
                    <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{al.rm[ej].peso}kg</div>
                    <div style={{ color: S.gray, fontSize: 14 }}>{ej}</div>
                  </div>
                ))}
              </div>{" "}
            </div>
          )}{" "}
        </div>{" "}
        {/* Contenido — jerarquía de menús (ronda 6): nivel 1 Entrenamiento | Diario */}{" "}
        <div className="di-slide" style={{ padding: "0 16px" }}>
          {" "}
          {/* Avisos del gimnasio (los carga el admin en Novedades) */}
          <NovedadesAlumno
            novedades={novedades.filter((n) => n.activo && (n.dirigido_a === "todos" || n.dirigido_a === (al.tipo || "entrenamiento")))}
            alumnoId={al.id}
          />
          {/* ── Nivel 1: ENTRENAMIENTO | HISTORIAL ── en desktop se muestra
              arriba como antes; en mobile se reemplaza por la barra fija de
              abajo (bottomNavAlumno, estilo Instagram) para no competir con
              el mismo nivel de navegación dos veces en la misma pantalla. */}
          {wideAlumno && (
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                ["entrenamiento", "Entrenamiento"],
                ["diario", "Historial"],
              ].map(([id, label]) => (
                <button key={id} onClick={() => setTabGroup(id)} style={tabN1(tabGroup === id)}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {tabGroup === "entrenamiento" && (
            <PlanDelDia
              plan={plan}
              planValido={planValido}
              biblioteca={biblioteca}
              // Los días que el alumno entrena, para que cuando abra
              // Principales un día que no le toca la app se lo diga en vez
              // de dejarlo con "Sin ejercicios principales asignados".
              // Se unen los días declarados en `horarios` con los que tienen
              // plan cargado: hay alumnos sin horarios pero con plan (a esos
              // decirles "no tenés plan" sería falso).
              diasEntrena={[
                ...new Set([
                  ...[...(al.horarios || [])].map((h) => h.dia),
                  ...[...(al.planes || [])].map((p) => p.dia_semana),
                ].filter((d) => d && d !== "Fijo")),
              ]}
              dia={dia}
              diaIdx={diaIdx}
              setDiaIdx={setDiaIdx}
              // 2026-07-31, pedido de Lucas: poder elegir el día (Martes/
              // Jueves/Sábado) desde ADENTRO de Principales, sin volver a
              // scrollear arriba a las pills del header.
              diasSemana={al.horarios || []}
              diaSemanaActivo={diaSemanaFoco}
              onIrADiaSemana={irADiaSemana}
              sem={sem}
              semanaActual={semanaActual}
              pesos={pesos}
              historiales={historiales}
              // Solo para MOSTRAR "peso anterior" y "tu máximo": el mismo
              // ejercicio en dos días distintos comparte historial (2026-08-13).
              historialesUnidos={histUnidos}
              onPeso={handlePeso}
              pesosPorVuelta={pesosVuelta}
              onPesoVuelta={handlePesoVuelta}
              rm={al.rm}
              onRegistrarDia={() => registrarDia(dia?.ejercicios || [])}
              diaRegistrado={diaRegistrado === hoy() + ":" + al.id}
              registrandoDia={registrandoDia}
              irAPrincipales={irPrincipalesToken}
              // 2026-07-30, pedido de Lucas: en Modo Entrenador se ocultan
              // movilidad, elástico y entrada en calor — durante la clase el
              // entrenador solo opera los ejercicios principales.
              modoEntrenador={modoEntrenador}
            />
          )}
          {/* ── DIARIO: asistencia de hoy + cómo estuvo el día ── */}{" "}
          {tabGroup === "diario" && (
          <div>
              {/* 2026-08-04, pedido de Lucas: Bioimpedancia/Diario/Evolución
                  pasan del selector chico tabN2 al dock de íconos redondos
                  (mismo componente que la ficha de alumno del admin) — un
                  tercer acceso (Evolución) entra sin amontonar la tabbar de
                  abajo, que se queda en 3 ítems. */}
              <IconDock
                items={[
                  ["bio", "Bioimpedancia", TrendingUp],
                  ["diario", "Diario", NotebookPen],
                  ["evolucion", "Evolución", BarChart3],
                ]}
                activo={historialSub}
                onSelect={setHistorialSub}
              />
              {historialSub === "bio" && (
                /* puedeCargar (2026-08-09, pedido de Lucas): el alumno carga
                   su balanza y su scan corporal. Sigue sin poder borrar
                   registros ni ver el requerimiento energético — ver el
                   comentario de EstudioBioSeccion. */
                <EstudioBioSeccion alumnoId={al.id} alumno={al} showToast={showToast} readOnly puedeCargar />
              )}
              {historialSub === "evolucion" && (
                <>
                  <ResumenMensual
                    asistencia={al.asistencia || []}
                    historiales={histUnidos}
                    plan={planTodos}
                    diario={al.diario || []}
                  />
                  <div style={{ height: 20 }} />
                  <EvolucionCargas historiales={histUnidos} plan={planTodos} />
                </>
              )}
              {historialSub === "diario" && (
                <Diario
                  entradas={al.diario || []}
                  onEdit={editarDiario}
                  onDelete={eliminarDiario}
                  onAdd={addDiario}
                  slotAntesDeEntradas={(() => {
                    const diasPorSemana =
                      (al.horarios || []).length ||
                      new Set((al.planes || []).map((p) => p.dia_semana).filter((d) => d && d !== "Fijo")).size ||
                      3;
                    const semanasTranscurridas = Math.max(1, Math.ceil(new Date().getDate() / 7));
                    const objetivo = diasPorSemana * semanasTranscurridas;
                    const entrenosMes = (al.asistencia || []).filter((d) => d.startsWith(mesActual().slice(0, 7))).length;
                    const pct = objetivo > 0 ? Math.min(100, Math.round((entrenosMes / objetivo) * 100)) : 0;
                    // Racha — misma lógica que el componente Asistencia.
                    const tieneDiaAsistido = (d) => (al.asistencia || []).some((x) => x.slice(0, 10) === d);
                    let racha = 0;
                    let checkDate = new Date();
                    checkDate.setHours(0, 0, 0, 0);
                    for (let i = 0; i < 60; i++) {
                      const ds = checkDate.toISOString().split("T")[0];
                      if (tieneDiaAsistido(ds)) racha++;
                      else if (i > 0) break;
                      checkDate.setDate(checkDate.getDate() - 1);
                    }
                    return (
                      <>
                      {/* Asistencia — ronda 17 (punto 4): fecha editable, hoy
                          como default. 2026-07-31, pedido de Lucas: pasa a
                          vivir DENTRO de Diario, debajo del comentario del
                          día, y no aparece en Bioimpedancia. */}
                      <div style={{ ...card, padding: "18px 16px", textAlign: "center", marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={12} />Marcar Asistencia</span>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <FechaRapida value={fechaAsistencia} onChange={setFechaAsistencia} />
                        </div>
                        <button
                          onClick={() => {
                            if (al.asistencia?.some((a) => a.slice(0, 10) === fechaAsistencia)) {
                              const u = alumnos.map((a) =>
                                a.id === al.id
                                  ? { ...a, asistencia: (a.asistencia || []).filter((fecha) => fecha.slice(0, 10) !== fechaAsistencia) }
                                  : a
                              );
                              setAlumnos(u);
                              setAlumno(u.find((a) => a.id === al.id));
                              showToast && showToast("Asistencia removida");
                            } else {
                              saveDailyAttendance(al.id, fechaAsistencia, true).then(() => {
                                marcarAsistencia(fechaAsistencia);
                                showToast && showToast("¡Asistencia marcada!");
                              });
                            }
                          }}
                          style={{
                            width: "100%",
                            background: al.asistencia?.some((a) => a.slice(0, 10) === fechaAsistencia) ? S.green : S.white,
                            color: al.asistencia?.some((a) => a.slice(0, 10) === fechaAsistencia) ? "#fff" : S.bg,
                            border: "none",
                            borderRadius: 12,
                            padding: "15px 24px",
                            fontSize: 15,
                            fontWeight: 900,
                            cursor: "pointer",
                            letterSpacing: 1,
                            textTransform: "uppercase",
                            transition: "all 0.3s",
                          }}
                        >
                          {al.asistencia?.some((a) => a.slice(0, 10) === fechaAsistencia)
                            ? (fechaAsistencia === hoy() ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={14} />Presente hoy</span> : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={14} />Presente ese día</span>)
                            : "Marcar presente"}
                        </button>
                      </div>
                      {racha > 0 && (
                        <div style={{ ...card, padding: "12px 10px", textAlign: "center", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                          <div style={{ color: S.green, fontWeight: 900, fontSize: 28 }}>{racha}</div>
                          <div style={{ color: S.gray, fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "left", lineHeight: 1.3 }}>
                            {racha === 1 ? "día seguido entrenando" : "días seguidos entrenando"}
                          </div>
                        </div>
                      )}
                      <div style={{ ...card, padding: "16px", marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                          <div style={{ color: S.gray, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                            Tu mes
                          </div>
                          <div style={{ color: S.red, fontWeight: 900, fontSize: 15 }}>{pct}%</div>
                        </div>
                        <div style={{ color: S.white, fontSize: 14, fontWeight: 700, marginBottom: 10, lineHeight: 1.4 }}>
                          Entrenaste <span style={{ color: S.red }}>{entrenosMes}</span> de {objetivo} veces este mes
                        </div>
                        <div style={{ background: S.card2, borderRadius: 20, height: 8, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: S.red, borderRadius: 20, transition: "width 0.4s ease" }} />
                        </div>
                        <div style={{ color: S.gray, fontSize: 14, marginTop: 8 }}>
                          {pct >= 100 ? "¡Objetivo cumplido! Seguí así." : pct >= 60 ? "Vas bien, no aflojes." : "Dale que se puede: cada entreno suma."}
                        </div>
                      </div>
                      </>
                    );
                  })()}
                />
              )}
          </div>
          )}{" "}
        </div>{" "}
      </div>{" "}
      </PullToRefresh>
      {/* Barra inferior fija (mobile), patrón Instagram: ícono + label juntos,
          activo = ícono relleno blanco + texto blanco, inactivo = gris. Vive
          fuera del scroll para que el alumno siempre sepa dónde está. */}
      {!wideAlumno && (
        <div
          // 2026-08-04, bug real encontrado por Lucas: con `left:12;right:12`
          // la cápsula se estira contra el borde de la PANTALLA real, pero el
          // contenido de arriba vive en una columna centrada de max 480px
          // (línea ~7452). En una pantalla ancha (desktop con ?vista=movil,
          // o una tablet donde wideAlumno igual da false) la cápsula quedaba
          // gigante y pegada a los bordes reales — se veía "plana" de nuevo,
          // como si el rediseño no hubiera pasado. Centrada y con el mismo
          // maxWidth que el contenido, en un celular real (viewport <480px)
          // se ve exactamente igual que antes (ese es su ancho real).
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 24px)",
            maxWidth: 456,
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
            zIndex: 500,
          }}
        >
          {/* Barra flotante (2026-08-03, auditoría UX): antes tocaba los 3
              bordes de la pantalla, sin sombra ni cápsula — el patrón "tabbar
              plana de hace unos años". La estructura y los 3 accesos NO
              cambian (Historial/Entrenamiento/Luqui siguen siendo lo
              correcto — Instagram/Airbnb la mantienen en 2026), solo la
              terminación: separada del borde, cápsula redondeada, sombra, y
              un indicador que se desliza al cambiar de pestaña en vez de
              un cambio de color instantáneo. */}
          <div
            style={{
              position: "relative",
              display: "flex",
              background: S.card,
              borderRadius: 22,
              border: "1px solid " + S.border2,
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              padding: 6,
            }}
          >
            {/* Indicador que se desliza detrás del ícono activo. Solo cubre
                Historial/Entrenamiento (índices 0-1) — Luqui es un toggle de
                chat, no un estado seleccionado, así que no lleva pastilla. */}
            <div
              style={{
                position: "absolute",
                top: 6,
                bottom: 6,
                left: 6,
                width: "calc((100% - 12px) / 3)",
                borderRadius: 16,
                background: tabGroup === "diario" || tabGroup === "entrenamiento" ? S.card2 : "transparent",
                transform: `translateX(${tabGroup === "entrenamiento" ? 100 : tabGroup === "diario" ? 0 : 200}%)`,
                transition: "transform 0.25s cubic-bezier(0.23,1,0.32,1), background 0.15s",
              }}
            />
            {/* 2026-07-31, pedido de Lucas: Historial a la izquierda,
                Entrenamiento en el medio (el destino principal), Luqui a la
                derecha — desde ahí se abre el chat directo, sin duplicar el
                botón flotante (ver mostrarBoton en CoachFlotante). */}
            {[
              ["diario", "Historial", ClipboardList],
              ["entrenamiento", "Entrenamiento", Dumbbell],
              ["luqui", "Luqui", null],
            ].map(([id, label, Icono]) => {
              const activo = id !== "luqui" && tabGroup === id;
              return (
                <button
                  key={id}
                  /* 2026-07-31 — Lucas: Luqui hace toggle (cierra si ya está
                      abierto); los OTROS botones (Historial/Entrenamiento)
                      también lo cierran si estaba abierto, para no navegar
                      con el chat tapando la pantalla. */
                  onClick={() => {
                    if (id === "luqui") coachRef.current?.toggle();
                    else {
                      // 2026-07-31 — Lucas: "al clickear en Entrenamiento que
                      // no me baje toda la pantalla" — al cambiar de sección
                      // el scroll quedaba en la misma posición de píxeles de
                      // la sección anterior (con otra altura de contenido),
                      // dando un salto brusco. Reset a arriba en cada cambio.
                      coachRef.current?.cerrar();
                      setTabGroup(id);
                      window.scrollTo({ top: 0 });
                    }
                  }}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    flex: 1,
                    minHeight: TAP + 12,
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    padding: "8px 0",
                    cursor: "pointer",
                  }}
                >
                  {id === "luqui" ? (
                    // 2026-07-31 — Lucas: "Luqui tiene que quedar en blanco...
                    // ya que es negro ese menú abajo". La barra usa S.card
                    // (oscuro en dark mode), así que necesita el ícono BLANCO
                    // en dark mode — estaba al revés (mostraba el negro,
                    // invisible sobre el fondo oscuro).
                    <img src={darkMode ? ICON_WHITE_CROP : ICON_BLACK_CROP} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                  ) : (
                    <Icono size={22} strokeWidth={activo ? 2.4 : 1.8} color={activo ? S.white : S.gray} />
                  )}
                  <span style={{ fontSize: 11, fontWeight: activo ? 800 : 500, color: activo ? S.white : S.gray }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
