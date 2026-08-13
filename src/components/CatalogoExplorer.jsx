// ══════════════════════════════════════════════════════════════════════
// CATÁLOGO DE EJERCICIOS / BIBLIOTECA — explorador estilo index del
// dataset ExerciseDB (sidebar de filtros + grid de cards + detalle), EN
// ESPAÑOL y con la estética DI. La organización replica la del dataset a
// pedido de Lucas: filtros por Categoría / Equipamiento / Músculo
// objetivo como chips multi-select, badges de filtros activos con ✕,
// contador "X de Y ejercicios", cards con imagen (lazy) que pasan a GIF
// en hover.
//
// Ronda 16 (punto 4): "el Armador y la Biblioteca son lo mismo" — se
// fusionaron en UNA sola pantalla. Antes eran dos `modo`s separados
// (biblioteca/armador) invocados como dos pantallas distintas desde
// AdminPanel; ahora es siempre la Biblioteca, con un toggle interno
// (`armadorAbierto`, botón "+ Crear plan de entrenamiento" al lado de
// "+ Crear ejercicio nuevo") que abre el panel lateral del carrito SIN
// salir de la pantalla — se sigue buscando/filtrando en la misma grilla
// de siempre (con el filtro rápido ★ Principales DI intacto) y cada
// "＋ Agregar" suma el ejercicio al plan en construcción. Guardar sigue
// creando una plantilla en planes_predeterminados (fusión de UI, no de
// datos — igual que antes de esta ronda).
// Click en una card SIEMPRE abre el detalle editable (nombre/
// instrucciones, video propio, chips de músculos) — eso no cambió, es
// independiente de si el carrito está abierto o no.
//
// Performance: render incremental de a 60 con "Cargar más" + loading lazy
// de imágenes — pensado para no explotar el celular con 1.344 items.
// ══════════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { X, Archive, Dumbbell, BookOpen, FolderTree, Search, Pencil, Trash2, Check, RotateCcw, Flag, ChevronRight, Layers, Move, CalendarRange, Weight, AlertTriangle } from "lucide-react";
import { S, card, inp, eyebrow, smallBtn, FONT_DISPLAY, FONT_BODY, TS, TAP, useIsWide } from "../utils/theme.js";
import { uid } from "../utils/helpers.js";
import { UNIDADES, NOMBRE_UNIDAD, unidadDe } from "../utils/unidades.js";
import labels from "../utils/catalogoLabels.json";
import { useDeshacer } from "./ToastDeshacer.jsx";
import {
  cargarCatalogoCached,
  catalogoMediaUrl,
  guardarEjercicioCatalogo,
  agregarCatalogoABiblioteca,
  subirVideo,
  validarCodigoDisponible,
  renombrarCodigoEjercicio,
  renombrarCategoriaCatalogo,
  crearEjercicioCatalogo,
  crearPlanPredeterminado,
  listarPlanesPredeterminados,
  actualizarPlanPredeterminado,
  eliminarPlanPredeterminado,
  getPrepGlobales,
  setAppConfig,
  listarPeriodizacionesConNombres,
  guardarPeriodizacion,
  renombrarPeriodizacion,
  listarVariantesPlan,
  renombrarVariantePlan,
  getEquipamiento,
  guardarEquipamiento,
  supabase,
} from "../../services/supabase.js";
// gifAlRenombrar (2026-08-12): para NO perder la ilustración al renombrar un
// ejercicio que la resolvía por nombre.
import { gifAlRenombrar } from "../utils/ejerciciosMedia.js";
import { PREP_LISTAS, claveConfigPrep, listaGlobal } from "../utils/preparacion.js";
// NIVELES ya existe acá abajo con otro significado (nivel del ejercicio), así
// que los de periodización entran con alias.
import {
  OBJETIVOS as OBJETIVOS_PER,
  NIVELES as NIVELES_PER,
  clavePeriodizacion,
  etiquetaPeriodizacion,
  objetivoLabel,
  nivelLabel,
} from "../utils/periodizacion.js";
// 2026-08-13 — el equipamiento REAL de la sala (barras, discos, mancuernas).
// Es lo que hace posible que el alumno elija tocando en vez de escribir.
import { normalizarEquipamiento, BARRA_DEFAULT_KG } from "../utils/equipamiento.js";

// Niveles asignables a un ejercicio o a una plantilla de plan (ronda 18).
const NIVELES = [
  ["inicial", "Inicial"],
  ["intermedio", "Intermedio"],
  ["avanzado", "Avanzado"],
];
const labelNivel = (v) => (NIVELES.find(([id]) => id === v) || [null, v])[1];

const PAGE = 60;

const labelCat = (v) => labels.categoria[v] || v;
const labelEq = (v) => labels.equipment[v] || v;
const labelTg = (v) => labels.target[v] || v;

// Ronda 17 (punto 3) — BUG REAL encontrado investigando "sigue andando muy
// mal": el filtro "★ Principales DI" solo chequeaba `!!e.codigo_di` (tener
// ALGÚN código). Eso funcionaba cuando codigo_di solo existía en los ~50
// ejercicios curados a mano por Lucas (ronda 13) — pero la migración 020
// (ronda "cont.5", mismo día) le puso código a TODO el catálogo (1.343
// filas) y, peor, REUTILIZÓ los mismos 7 prefijos curados (PH/RO/PE/CA/
// JA/GL/CO) para el backfill mecánico del resto (ver
// data/catalogo-codigos-prefijos.md). Resultado verificado en Supabase:
// el filtro dejaba pasar 1.334 de 1.343 ejercicios como "Principales DI"
// — el filtro curado quedó roto, indistinguible de "todo el catálogo".
// Fix: los ~50 reales son SOLO los rangos numéricos originales documentados
// en catalogo-codigos-prefijos.md (ej. GL001-GL007, no GL008-GL142 que son
// backfill). Hardcodeado a propósito: es un rango histórico congelado, "el
// backfill nunca pisa estos códigos" — no depende de datos que cambien.
const RANGOS_PRINCIPALES_DI = { PH: 9, RO: 9, PE: 5, CA: 7, JA: 6, GL: 7, CO: 7 };
const esPrincipalDI = (e) => {
  const m = (e.codigo_di || "").match(/^([A-Z]{2})(\d{3})$/);
  if (!m) return false;
  const max = RANGOS_PRINCIPALES_DI[m[1]];
  return !!max && parseInt(m[2], 10) <= max;
};

// Estados que los estilos inline no pueden expresar (hover/focus-visible).
// Es la única hoja de estilos del componente: una sola inyección, sin
// librerías. Motion 200ms cubic-bezier(0.23,1,0.32,1) — Brand Kit §07.
// Es una función y no una constante a propósito: `S` se reasigna al cambiar
// de tema (applyTheme), así que el CSS se arma en cada render y el foco/hover
// quedan legibles también en modo claro.
const cssCatalogo = () => `
.di-cat-card { transition: border-color .2s cubic-bezier(.23,1,.32,1), background .2s cubic-bezier(.23,1,.32,1); }
.di-cat-card:hover { border-color: ${S.border2}; background: ${S.card2}; }
.di-cat-card:focus-visible, .di-tap:focus-visible { outline: 2px solid ${S.white}; outline-offset: 2px; }
.di-cat-card img { transition: filter .2s cubic-bezier(.23,1,.32,1); }
.di-cat-card:hover img { filter: none; }
.di-tap { -webkit-tap-highlight-color: transparent; }
.di-tap:active { opacity: .85; }
`;

// Chip de filtro. El estado activo se marca con TRES señales (playbook:
// nunca solo con color): fondo invertido + borde + peso tipográfico.
function Chip({ activo, onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="di-tap"
      aria-pressed={!!activo}
      style={{
        background: activo ? S.white : S.card2,
        color: activo ? S.bg : S.gray,
        border: "1px solid " + (activo ? S.white : S.border),
        borderRadius: 20,
        padding: "8px 14px",
        minHeight: TAP,
        fontSize: TS.chip,
        fontWeight: activo ? 800 : 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: FONT_BODY,
      }}
    >
      {children}
    </button>
  );
}

// Ronda 17 (punto 3): `onRename(valorViejo)` opcional — SOLO se pasa para
// el filtro de Categoría. Cuando está, cada chip suma un lápiz chico al
// lado para renombrar esa categoría (propaga a TODOS los ejercicios que la
// tengan — ver renombrarCategoriaCatalogo). Equipamiento/Músculo/Código NO
// lo reciben: esos valores vienen del dataset y no tiene sentido
// renombrarlos en masa desde acá.
// Jerarquía del sidebar (2026-07-30): antes eran 4 grupos de chips grises
// idénticos, todos con el mismo peso — una pared. Ahora cada grupo es una
// sección plegable con encabezado `eyebrow`, contador de seleccionados y
// aire real entre grupos (escala de 8px). Los grupos largos
// (Equipamiento, 30 valores) arrancan cerrados salvo que tengan filtro
// activo, así se ve de un vistazo qué está filtrado y qué no.
function FiltroSeccion({ titulo, valores, seleccion, onToggle, labelDe, onRename, colapsable }) {
  const [expandido, setExpandido] = useState(false);
  const [abierto, setAbierto] = useState(!colapsable);
  const LIMITE = 8;
  const mostrar = expandido ? valores : valores.slice(0, LIMITE);
  const nSel = [...seleccion].filter((v) => valores.includes(v)).length;
  const desplegado = abierto || nSel > 0;
  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="di-tap"
        style={{ ...eyebrow, fontSize: TS.chip, background: "transparent", border: "none", padding: "8px 0", minHeight: TAP, width: "100%", display: "flex", alignItems: "center", gap: 8, cursor: colapsable ? "pointer" : "default", textAlign: "left", color: nSel > 0 ? S.white : S.gray }}
      >
        <span style={{ flex: 1 }}>{titulo}</span>
        {nSel > 0 && (
          <span style={{ color: S.red, fontSize: TS.chip, fontWeight: 800, letterSpacing: 0 }}>{nSel}</span>
        )}
        {colapsable && <span style={{ fontSize: TS.chip, color: S.lgray }}>{desplegado ? "–" : "+"}</span>}
      </button>
      {/* Filete: separa el encabezado de sus chips sin agregar otra card */}
      <div style={{ height: 1, background: nSel > 0 ? S.white : S.border, marginBottom: 10, opacity: nSel > 0 ? 0.5 : 1 }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, ...(desplegado ? null : { display: "none" }) }}>
        {mostrar.map((v) =>
          onRename ? (
            <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
              <Chip activo={seleccion.has(v)} onClick={() => onToggle(v)}>
                {labelDe(v)}
              </Chip>
              <button
                onClick={() => onRename(v)}
                title={`Renombrar categoría "${labelDe(v)}"`}
                className="di-tap"
                style={{ background: "transparent", border: "none", color: S.lgray, cursor: "pointer", padding: "0 6px", minHeight: TAP, lineHeight: 1, display: "inline-flex", alignItems: "center" }}
              >
                <Pencil size={14} strokeWidth={2} />
              </button>
            </span>
          ) : (
            <Chip key={v} activo={seleccion.has(v)} onClick={() => onToggle(v)}>
              {labelDe(v)}
            </Chip>
          )
        )}
        {valores.length > LIMITE && (
          <Chip activo={false} onClick={() => setExpandido((v) => !v)}>
            {expandido ? "Ver menos" : `+${valores.length - LIMITE} más`}
          </Chip>
        )}
      </div>
    </div>
  );
}

// Editor de tags/músculos con "predeterminado" (punto 4, 2026-07-21): lista
// de chips editable (agregar/sacar) + un ☆/★ para marcar cuál es el
// principal. Se usa para músculos (target + secondary) y para tags
// (equipment + libres).
function TagsEditor({ items, defaultItem, onChange, onChangeDefault, placeholder }) {
  const [nuevo, setNuevo] = useState("");
  const add = () => {
    const v = nuevo.trim();
    if (!v || items.includes(v)) { setNuevo(""); return; }
    const next = [...items, v];
    onChange(next);
    if (!defaultItem) onChangeDefault(v);
    setNuevo("");
  };
  const remove = (v) => {
    const next = items.filter((x) => x !== v);
    onChange(next);
    if (defaultItem === v) onChangeDefault(next[0] || "");
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
        {items.length === 0 && <span style={{ fontSize: TS.chip, color: S.lgray }}>Sin ninguno todavía</span>}
        {items.map((v) => {
          const esDefault = v === defaultItem;
          return (
            <span
              key={v}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: esDefault ? S.white : S.card2,
                color: esDefault ? S.bg : S.white,
                border: "1px solid " + S.border,
                borderRadius: 20,
                padding: "3px 6px 3px 10px",
                minHeight: TAP,
                fontSize: TS.chip,
                fontWeight: 600,
              }}
            >
              <button
                onClick={() => onChangeDefault(v)}
                title="Marcar como predeterminado"
                className="di-tap"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0 4px", minHeight: TAP, fontSize: TS.ui, color: esDefault ? S.bg : S.gray, lineHeight: 1 }}
              >
                {esDefault ? "★" : "☆"}
              </button>
              {v}
              <button
                onClick={() => remove(v)}
                title="Quitar"
                className="di-tap"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0 6px", minHeight: TAP, color: esDefault ? S.bg : S.gray, lineHeight: 1, display: "inline-flex", alignItems: "center" }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </span>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={{ ...inp, flex: 1 }}
        />
        <button onClick={add} className="di-tap" style={{ ...smallBtn(S.gray) }}>+ Agregar</button>
      </div>
    </div>
  );
}

// Uploader de video inline (bucket ejercicios-videos, misma vía que el
// editor de ejercicios de siempre).
function SubirVideoInline({ onUrl, showToast }) {
  const ref = useRef();
  const [subiendo, setSubiendo] = useState(false);
  return (
    <>
      <button
        onClick={() => ref.current && ref.current.click()}
        disabled={subiendo}
        className="di-tap"
        style={{ ...smallBtn(S.gray), width: "100%" }}
      >
        {subiendo ? "Subiendo..." : "⬆ Subir video propio"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files && e.target.files[0];
          if (!f) return;
          setSubiendo(true);
          try {
            const url = await subirVideo(f);
            onUrl(url);
            showToast && showToast("Video subido");
          } catch (err) {
            window.alert("No se pudo subir el video: " + (err.message || "error"));
          } finally {
            setSubiendo(false);
            e.target.value = "";
          }
        }}
      />
    </>
  );
}

export default function CatalogoExplorer({
  onClose,
  showToast,
  onAbrirPropia,
  // 2026-08-10: al guardar un predeterminado de periodización hay que bajarlo
  // a los alumnos que lo heredan. Los alumnos viven en App.jsx, así que la
  // propagación se delega ahí; devuelve cuántos se actualizaron.
  onPeriodizacionGuardada,
  // Pantalla con la que abre (deep-link). Default: el catálogo de siempre.
  pantallaInicial = "biblioteca",
}) {
  const [cat, setCat] = useState(null); // null = cargando
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState(new Set());
  const [fEq, setFEq] = useState(new Set());
  const [fTg, setFTg] = useState(new Set());
  const [fPre, setFPre] = useState(new Set()); // ronda 17: filtro por prefijo de código (GL/PH/RO/...)
  const [soloDI, setSoloDI] = useState(false);
  const [visibles, setVisibles] = useState(PAGE);
  const [hoverId, setHoverId] = useState(null);
  const [detalle, setDetalle] = useState(null); // item abierto
  const [form, setForm] = useState(null); // edición del detalle
  const [guardando, setGuardando] = useState(false);
  const [creando, setCreando] = useState(false); // true = flujo "Crear ejercicio nuevo" (punto 4)
  const [codigoError, setCodigoError] = useState(""); // validación de código duplicado (punto 5)
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  // Ronda 18: navegación por PANTALLAS (menú a menú, siempre con volver):
  //   · "biblioteca" — el catálogo de siempre (buscar/filtrar/editar).
  //   · "armador"    — pantalla DEDICADA "Plan de Entrenamiento" (Lucas
  //     pidió que crear un plan lleve a OTRA pantalla, no a un panel
  //     sobre la misma): búsqueda + lista + plan en construcción.
  //   · "planes"     — "Ver todos los planes": listar/renombrar/editar/
  //     eliminar las plantillas existentes.
  const [pantalla, setPantalla] = useState(pantallaInicial);
  const armadorAbierto = pantalla === "armador";
  // carrito (armador): arma la plantilla (nombre + categoría + nivel).
  const [carrito, setCarrito] = useState([]);
  const [nombrePlan, setNombrePlan] = useState("");
  const [grupoPlan, setGrupoPlan] = useState("");
  const [nivelPlan, setNivelPlan] = useState("");
  const [guardandoPlan, setGuardandoPlan] = useState(false);
  // Ronda 18: archivados (ocultos por default, chip "Archivados" para
  // verlos/recuperarlos) + filtro por nivel del ejercicio.
  const [verArchivados, setVerArchivados] = useState(false);
  const [fNivel, setFNivel] = useState(new Set());
  // 2026-07-30 — Tag REVISAR (pedido de Lucas: "así cuando veo algo raro lo
  // tiro en revisar"). Es una BANDEJA DE PENDIENTES, no un archivo: el
  // ejercicio marcado sigue apareciendo normal en los listados (solo con una
  // marca terciaria), y el chip "Para revisar (N)" filtra la bandeja.
  // Se maneja acá con un Set de ids en vez de un campo más en `cat` porque
  // cargarCatalogo() trae una lista EXPLÍCITA de columnas (services/
  // supabase.js) que no incluye `revisar` — pedirlo aparte también deja
  // aislada la falla si la migración 025 todavía no está aplicada.
  const [revisarIds, setRevisarIds] = useState(() => new Set());
  const [verRevisar, setVerRevisar] = useState(false);
  // Defensivo: si la columna `revisar` no existe todavía (migración 025 sin
  // aplicar), el select falla → se apaga la función entera en vez de romper
  // la Biblioteca, y el toggle avisa qué falta.
  const [revisarOk, setRevisarOk] = useState(true);
  // "Ver todos los planes": lista + plantilla abierta en edición.
  const [plantillas, setPlantillas] = useState(null);
  const [planSel, setPlanSel] = useState(null); // plantilla en edición
  const [planForm, setPlanForm] = useState(null); // { nombre, grupo, nivel, dias }
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false);
  const [qPlanAdd, setQPlanAdd] = useState(""); // buscador p/ agregar ejercicios a la plantilla
  // 2026-07-30: el breakpoint pasa a ser el único de la app (BP=900 en
  // theme.js) — antes este componente tenía su propio listener de resize.
  const isWide = useIsWide();
  // Orden del grid. Por defecto ya no es alfabético puro (arrancaba con
  // "3/4 abdominal" y 20 variantes de abdominales seguidas): agrupa por
  // CATEGORÍA (el campo real del dataset: pecho, espalda, core…), que es
  // como busca un entrenador, y ordena alfabético dentro de cada grupo.
  const [orden, setOrden] = useState("categoria");

  useEffect(() => {
    if (pantalla === "planes") listarPlanesPredeterminados().then(setPlantillas);
  }, [pantalla]);

  // ── PLANES DE ENTRENAMIENTO de la base (`plan_variantes`) ─────────────
  // 2026-08-12, pedido de Lucas: poder renombrarlos él. Son las 14 rutinas
  // (Bilateral, Unilateral, PPL, híbridas, circuito, el plan de Jacobo…) que
  // se asignan desde "Plan x día". Hasta hoy el nombre y la descripción solo
  // se podían tocar por SQL.
  //
  // Viven acá, en "Todos los planes", que es la pantalla donde ya se
  // administran los planes — no hace falta una pantalla nueva.
  //
  // Renombrar es seguro: nada apunta a una variante por nombre. La asignación
  // usa `id`, y el agrupado de la pantalla de asignación usa `familia` y
  // `dia_ciclo` — por eso esos dos campos no se editan. Lo que sí queda con el
  // nombre viejo es el plan YA asignado a un alumno (es una copia del momento
  // en que se armó, alumno_planes/plan_ejercicios): renombrar la variante no
  // reescribe planes en curso, a propósito.
  const [variantes, setVariantes] = useState(null);
  const [varDraft, setVarDraft] = useState({}); // { [id]: {nombre, descripcion} }
  useEffect(() => {
    if (pantalla === "planes" && variantes === null) listarVariantesPlan().then(setVariantes);
  }, [pantalla, variantes]);
  const campoVariante = (v, campo) => {
    const d = varDraft[v.id];
    return d && d[campo] !== undefined ? d[campo] : (v[campo] || "");
  };
  const editarVariante = (id, campo, valor) =>
    setVarDraft((d) => ({ ...d, [id]: { ...(d[id] || {}), [campo]: valor } }));
  const guardarVariante = async (v, campo) => {
    const d = varDraft[v.id];
    if (!d || d[campo] === undefined) return;
    const valor = campo === "nombre" ? String(d[campo]).trim() : d[campo];
    setVarDraft((x) => { const n = { ...x }; if (n[v.id]) { const c = { ...n[v.id] }; delete c[campo]; n[v.id] = c; } return n; });
    // Nombre vacío no se guarda: dejaría una fila sin forma de reconocerla en
    // la lista de asignación.
    if (campo === "nombre" && !valor) return;
    if (valor === (v[campo] || "")) return;
    const ok = await renombrarVariantePlan(v.id, { [campo]: valor });
    if (!ok) { showToast && showToast("Error guardando — revisá la consola"); return; }
    setVariantes((vs) => (vs || []).map((x) => (x.id === v.id ? { ...x, [campo]: valor } : x)));
    showToast && showToast(campo === "nombre" ? `Guardado: “${valor}”` : "Descripción guardada");
  };

  // ── Predeterminados de PREPARACIÓN (2026-08-10) ───────────────────────
  // Edición del NIVEL 1 (app_config): borrador en memoria por lista, se
  // persiste con "GUARDAR PREDETERMINADO". Mientras no haya nada guardado, el
  // borrador arranca con el contenido del método (fallback de PREP_LISTAS).
  const [prepGlobales, setPrepGlobales] = useState({});
  const [prepDraft, setPrepDraft] = useState({});
  const [prepSel, setPrepSel] = useState(PREP_LISTAS[0].id);
  const [qPrepAdd, setQPrepAdd] = useState("");
  const [guardandoPrep, setGuardandoPrep] = useState(false);
  useEffect(() => {
    if (pantalla === "preparacion") getPrepGlobales().then(setPrepGlobales);
  }, [pantalla]);
  const prepLista = (id) => prepDraft[id] || listaGlobal(id, prepGlobales);
  const setPrepLista = (id, lista) => setPrepDraft((d) => ({ ...d, [id]: lista }));
  const moverPrep = (i, dir) => {
    const lista = [...prepLista(prepSel)];
    const j = i + dir;
    if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    setPrepLista(prepSel, lista);
  };
  const quitarPrep = (i) => setPrepLista(prepSel, prepLista(prepSel).filter((_, x) => x !== i));
  // El nombre se copia TAL CUAL del catálogo: es la clave con la que
  // ejerciciosMedia.js encuentra la imagen del ejercicio.
  const agregarPrep = (e) => {
    setPrepLista(prepSel, [...prepLista(prepSel), {
      nombre: e.nombre_es,
      desc: e.instrucciones_es || "",
      video: e.video || "",
      gif: catalogoMediaUrl(e.gif_url || ""),
      mediaLocal: "",
    }]);
    setQPrepAdd("");
  };
  const guardarPrep = async () => {
    setGuardandoPrep(true);
    const lista = prepLista(prepSel);
    const ok = await setAppConfig(claveConfigPrep(prepSel), lista);
    setGuardandoPrep(false);
    if (!ok) { showToast && showToast("Error guardando el predeterminado — revisá la consola"); return; }
    setPrepGlobales((g) => ({ ...g, [prepSel]: lista }));
    setPrepDraft((d) => { const n = { ...d }; delete n[prepSel]; return n; });
    showToast && showToast("Predeterminado guardado — lo heredan los alumnos sin lista propia");
  };

  // ── EL EQUIPAMIENTO DE LA SALA (2026-08-13) ───────────────────────────
  // Textual de Lucas: "tenemos distintas barras, de 20, de 18, de 11, Barra
  // Olimpica Romana Rulemanes, barra-ez-olimpica, eso tiene que poder
  // modificarse, predeterminado 20 y poder bajar o subir".
  //
  // MISMO PATRÓN que la preparación y las periodizaciones, no uno nuevo:
  // borrador en memoria mientras se edita + un botón "GUARDAR". Lo que se
  // guarda es un jsonb en app_config, la misma tabla donde ya viven la
  // movilidad y la entrada en calor.
  const [equip, setEquip] = useState(null);
  const [guardandoEquip, setGuardandoEquip] = useState(false);
  useEffect(() => {
    if (pantalla === "equipamiento" && equip === null) getEquipamiento().then(setEquip);
  }, [pantalla, equip]);
  const equipEdit = equip || normalizarEquipamiento(null);
  // Las barras se editan una por una: cambiar el peso saca la marca de "sin
  // confirmar" sola, porque confirmarlo ES escribir el número real.
  const setBarra = (i, campo, valor) =>
    setEquip((e) => {
      const barras = [...equipEdit.barras];
      const b = { ...barras[i], [campo]: valor };
      if (campo === "peso") delete b.confirmar;
      barras[i] = b;
      return { ...(e || equipEdit), barras };
    });
  const sacarBarra = (i) =>
    setEquip((e) => ({ ...(e || equipEdit), barras: equipEdit.barras.filter((_, x) => x !== i) }));
  const agregarBarra = () =>
    setEquip((e) => ({
      ...(e || equipEdit),
      barras: [...equipEdit.barras, { id: "barra" + Date.now(), nombre: "Barra nueva", peso: BARRA_DEFAULT_KG }],
    }));
  // Discos, mancuernas y kettlebells son listas de números sueltos: se editan
  // como texto libre separado por comas. Es una lista de 6 a 24 números y
  // Lucas la corrige entera de una sentada — un campo por número sería
  // veinticuatro campos para cambiar dos.
  const [numDraft, setNumDraft] = useState({});
  const textoLista = (clave) =>
    numDraft[clave] !== undefined
      ? numDraft[clave]
      : (equipEdit[clave] || []).map((n) => String(n).replace(".", ",")).join(" · ");
  const setLista = (clave, texto) => {
    setNumDraft((d) => ({ ...d, [clave]: texto }));
    const nums = texto
      .split(/[·,;\n\t]+|\s{2,}/)
      .map((t) => Number(String(t).trim().replace(",", ".")))
      .filter((n) => isFinite(n) && n > 0);
    setEquip((e) => ({ ...(e || equipEdit), [clave]: nums }));
  };
  const guardarEquip = async () => {
    setGuardandoEquip(true);
    const limpio = normalizarEquipamiento(equipEdit);
    const ok = await guardarEquipamiento(limpio);
    setGuardandoEquip(false);
    if (!ok) { showToast && showToast("Error guardando el equipamiento — revisá la consola"); return; }
    setEquip(limpio);
    setNumDraft({});
    showToast && showToast("Guardado — los alumnos ya ven estos botones al registrar el peso");
  };

  // ── Predeterminados de PERIODIZACIÓN (2026-08-10) ─────────────────────
  // Mismo esquema de dos niveles que la preparación, mismo borrador en
  // memoria: se elige objetivo + nivel, se editan las semanas y se persisten
  // en la tabla `periodizaciones` con "GUARDAR PREDETERMINADO".
  const [perGlobales, setPerGlobales] = useState({});
  // Nombres de las 8 planificaciones (2026-08-12). Antes el título de la
  // pantalla se armaba con las constantes OBJETIVOS × NIVELES y la columna
  // `nombre` de la tabla no la leía nadie: renombrar la fila no se veía en
  // ningún lado. Ahora manda el dato — ver etiquetaPeriodizacion().
  const [perNombres, setPerNombres] = useState({});
  const [perDraft, setPerDraft] = useState({});
  const [perObj, setPerObj] = useState(OBJETIVOS_PER[0].id);
  const [perNiv, setPerNiv] = useState(NIVELES_PER[0].id);
  const [guardandoPer, setGuardandoPer] = useState(false);
  useEffect(() => {
    if (pantalla === "periodizacion") {
      listarPeriodizacionesConNombres().then(({ semanas, nombres }) => {
        setPerGlobales(semanas);
        setPerNombres(nombres);
      });
    }
  }, [pantalla]);
  const perClave = clavePeriodizacion(perObj, perNiv);
  // Renombre EN LÍNEA: se escribe libre y se persiste al salir del campo. Sin
  // confirmación — es reversible, y pedir "¿seguro?" para cambiar una palabra
  // es peor que el error que evitaría. El objetivo y el nivel NO se editan:
  // son el id de la fila (rm.periodizacion_ref del alumno apunta ahí), así que
  // renombrar nunca le rompe la herencia a nadie.
  const [perNombreDraft, setPerNombreDraft] = useState(null);
  const perNombreVisible =
    perNombreDraft !== null ? perNombreDraft : etiquetaPeriodizacion(perNombres, perObj, perNiv);
  const guardarNombrePer = async () => {
    if (perNombreDraft === null) return;
    const nuevo = perNombreDraft.trim();
    setPerNombreDraft(null);
    if (!nuevo || nuevo === etiquetaPeriodizacion(perNombres, perObj, perNiv)) return;
    const ok = await renombrarPeriodizacion(perObj, perNiv, nuevo);
    if (!ok) { showToast && showToast("Error renombrando — revisá la consola"); return; }
    setPerNombres((n) => ({ ...n, [clavePeriodizacion(perObj, perNiv)]: nuevo }));
    showToast && showToast(`Guardado: “${nuevo}”`);
  };
  const perSemanas = perDraft[perClave] || perGlobales[perClave] || [];
  // Toda escritura renumera: sacar la semana 3 de un plan de 6 no puede dejar
  // las semanas 1,2,4,5,6.
  const setPerSemanas = (semanas) =>
    setPerDraft((d) => ({ ...d, [perClave]: semanas.map((s, i) => ({ ...s, semana: i + 1 })) }));
  const setPerCampo = (i, campo, valor) =>
    setPerSemanas(perSemanas.map((s, x) => (x === i ? { ...s, [campo]: valor } : s)));
  const agregarSemana = () => {
    // La semana nueva copia a la última: casi siempre se retoca un número, no
    // se carga todo de cero.
    const ultima = perSemanas[perSemanas.length - 1] || { series: 3, reps: 8, intensidad: "" };
    setPerSemanas([...perSemanas, { ...ultima }]);
  };
  const quitarSemana = (i) => setPerSemanas(perSemanas.filter((_, x) => x !== i));
  const guardarPer = async () => {
    setGuardandoPer(true);
    // series y reps se editan como texto libre (el input controlado tiene que
    // dejar borrar el campo para tipear otro número) y se normalizan recién
    // acá, al guardar.
    const semanas = perSemanas.map((s, i) => ({
      semana: i + 1,
      series: Number(s.series) || 0,
      reps: Number(s.reps) || 0,
      intensidad: String(s.intensidad || ""),
    }));
    const ok = await guardarPeriodizacion(perObj, perNiv, semanas);
    setGuardandoPer(false);
    if (!ok) { showToast && showToast("Error guardando la periodización — revisá la consola"); return; }
    setPerGlobales((g) => ({ ...g, [perClave]: semanas }));
    setPerDraft((d) => { const n = { ...d }; delete n[perClave]; return n; });
    // Baja el cambio a los alumnos que heredan este predeterminado (los que
    // tienen periodización propia no se tocan) — lo hace App.jsx, que es
    // quien tiene los alumnos y su guardado.
    const propagados = onPeriodizacionGuardada
      ? onPeriodizacionGuardada(perObj, perNiv, semanas)
      : 0;
    showToast && showToast(
      propagados > 0
        ? `Periodización guardada — actualizada en ${propagados} alumno(s) que la heredan`
        : "Periodización guardada — la heredan los alumnos sin periodización propia",
    );
  };

  useEffect(() => {
    let vivo = true;
    cargarCatalogoCached().then((c) => vivo && setCat(c));
    return () => { vivo = false; };
  }, []);

  // 2026-07-30 — carga de la bandeja "Para revisar". Solo los marcados
  // (unas decenas), no las 1.343 filas. Si la columna no existe todavía, el
  // error se traga acá y `revisarOk` queda en false: la app sigue andando
  // igual, solo sin la función.
  useEffect(() => {
    let vivo = true;
    supabase
      .from("catalogo_ejercicios")
      .select("id")
      .eq("revisar", true)
      .then(({ data, error }) => {
        if (!vivo) return;
        if (error) { console.warn("[revisar] columna no disponible (falta migración 025):", error.message); setRevisarOk(false); return; }
        setRevisarIds(new Set((data || []).map((r) => r.id)));
      });
    return () => { vivo = false; };
  }, []);

  // Marcar/desmarcar "para revisar" — mismo camino que toggleArchivado, pero
  // por el cliente de supabase directo (guardarEjercicioCatalogo vive en un
  // archivo que esta sesión no toca).
  const toggleRevisar = async (e) => {
    const nuevo = !revisarIds.has(e.id);
    const { error } = await supabase
      .from("catalogo_ejercicios")
      .update({ revisar: nuevo, updated_at: new Date().toISOString() })
      .eq("id", e.id);
    if (error) {
      console.error("[revisar] error marcando", error);
      setRevisarOk(false);
      showToast && showToast("No se pudo marcar: falta aplicar la migración 025 (columna revisar)");
      return;
    }
    setRevisarIds((prev) => {
      const s = new Set(prev);
      nuevo ? s.add(e.id) : s.delete(e.id);
      return s;
    });
    showToast && showToast(nuevo ? "Marcado para revisar" : "Sacado de para revisar");
  };

  // Ronda 17 (punto 3): prefijo de código = letras iniciales de codigo_di
  // (ej. "GL007" → "GL"). Derivado dinámicamente de la tabla real, no
  // hardcodeado — cubre tanto los ~50 Principales DI (PH/RO/PE/CA/JA/GL/CO)
  // como los prefijos mecánicos que se aplicaron a todo el resto del
  // catálogo (BI/TR/PA/AN/CD/CL/TZ/AD/SE/CU, ver ronda 16 punto 9).
  const prefijoDe = (e) => (e.codigo_di || "").match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || "";

  // FILTRADO FACETADO (pedido de Lucas 2026-07-22): al tildar una opción en
  // un filtro, los DEMÁS filtros solo muestran las opciones que conviven con
  // esa selección. Ej.: tildar "Tríceps" en Músculo objetivo deja en
  // Equipamiento únicamente los equipos usados por ejercicios de tríceps
  // ("Peso corporal", etc.) — las opciones sin match desaparecen. Al
  // destildar, vuelven todas. Cada sección calcula sus valores sobre los
  // ejercicios que pasan TODOS los otros filtros activos (NO el propio, así
  // se puede seguir multi-seleccionando dentro de la misma sección), y los
  // valores ya seleccionados quedan siempre visibles para poder destildarlos.
  const pasaBase = (e, omit) => {
    if (verArchivados ? !e.archivado : e.archivado) return false;
    if (verRevisar && !revisarIds.has(e.id)) return false; // 2026-07-30
    if (soloDI && !esPrincipalDI(e)) return false;
    if (soloDI && !e.gif_url && !e.video) return false;
    if (omit !== "cat" && fCat.size && !fCat.has(e.categoria)) return false;
    if (omit !== "eq" && fEq.size && !fEq.has(e.equipment)) return false;
    if (omit !== "tg" && fTg.size && !fTg.has(e.target)) return false;
    if (omit !== "pre" && fPre.size && !fPre.has(prefijoDe(e))) return false;
    if (omit !== "nivel" && fNivel.size && !fNivel.has(e.nivel || "")) return false;
    const qq = q.toLowerCase().trim();
    if (qq) {
      const idx = `${e.nombre_es} ${e.nombre_en || ""} ${e.target_es || ""} ${e.equipment_es || ""} ${e.codigo_di || ""}`.toLowerCase();
      if (!idx.includes(qq)) return false;
    }
    return true;
  };
  const valoresFacet = (campo, omit, seleccion, cmp) => {
    const disp = new Set((cat || []).filter((e) => pasaBase(e, omit)).map(campo).filter(Boolean));
    seleccion.forEach((v) => disp.add(v)); // los ya tildados nunca se ocultan
    return [...disp].sort(cmp);
  };
  const facetDeps = [cat, q, fCat, fEq, fTg, fPre, fNivel, soloDI, verArchivados, verRevisar, revisarIds];
  const categorias = useMemo(() => valoresFacet((e) => e.categoria, "cat", fCat, (a, b) => labelCat(a).localeCompare(labelCat(b))), facetDeps);
  const equipos = useMemo(() => valoresFacet((e) => e.equipment, "eq", fEq, (a, b) => labelEq(a).localeCompare(labelEq(b))), facetDeps);
  const targets = useMemo(() => valoresFacet((e) => e.target, "tg", fTg, (a, b) => labelTg(a).localeCompare(labelTg(b))), facetDeps);
  const prefijos = useMemo(() => valoresFacet(prefijoDe, "pre", fPre, undefined), facetDeps);

  const filtrados = useMemo(() => {
    if (!cat) return [];
    const qq = q.toLowerCase().trim();
    const base = cat.filter((e) => {
      // Punto 4: en Principales (★ Principales DI) solo se listan los que
      // tienen media real (gif o video propio) — el resto queda en el
      // catálogo general pero no como opción utilizable para armar planes.
      // Ronda 17 (punto 3): FIX — antes usaba !!e.codigo_di, que dejaba
      // pasar 1.334/1.343 ejercicios (ver esPrincipalDI arriba). Ahora usa
      // el rango curado real (los ~50 de la ronda 13).
      // Ronda 18: los archivados no aparecen en listados/búsquedas; el
      // chip "Archivados" invierte la vista para recuperarlos.
      if (verArchivados ? !e.archivado : e.archivado) return false;
      // 2026-07-30: "Para revisar" NO oculta nada por defecto (no es un
      // archivo) — solo cuando el chip está activo se acota a la bandeja.
      if (verRevisar && !revisarIds.has(e.id)) return false;
      if (soloDI && !esPrincipalDI(e)) return false;
      if (soloDI && !e.gif_url && !e.video) return false;
      if (fCat.size && !fCat.has(e.categoria)) return false;
      if (fEq.size && !fEq.has(e.equipment)) return false;
      if (fTg.size && !fTg.has(e.target)) return false;
      if (fPre.size && !fPre.has(prefijoDe(e))) return false;
      if (fNivel.size && !fNivel.has(e.nivel || "")) return false;
      if (qq) {
        const idx = `${e.nombre_es} ${e.nombre_en || ""} ${e.target_es || ""} ${e.equipment_es || ""} ${e.codigo_di || ""}`.toLowerCase();
        if (!idx.includes(qq)) return false;
      }
      return true;
    });
    // Orden (2026-07-30). "categoria" agrupa por el campo real del dataset
    // y ordena alfabético adentro; "az" es el alfabético plano de antes.
    const az = (a, b) => (a.nombre_es || "").localeCompare(b.nombre_es || "", "es");
    return orden === "categoria"
      ? base.sort((a, b) => labelCat(a.categoria || "zzz").localeCompare(labelCat(b.categoria || "zzz"), "es") || az(a, b))
      : base.sort(az);
  }, [cat, q, fCat, fEq, fTg, fPre, fNivel, soloDI, verArchivados, verRevisar, revisarIds, orden]);

  // 2026-08-04, pedido de Lucas: "reclasificar la biblioteca por movimiento"
  // — hallazgo real: ejercicios como "Press Militar" viven en 14 filas
  // separadas por variante de equipo, difícil de escanear en una grilla
  // plana. En vez de reescribir 1.343 filas con una clasificación adivinada
  // (riesgo real: agrupar mal en una app de entrenamiento confunde al
  // coach), esto es puramente VISUAL y no toca la base — agrupa por el
  // prefijo de palabras que comparten items YA ADYACENTES en el orden
  // actual (mismo criterio con el que un entrenador escanea la grilla).
  // Sin dato falso: si dos ítems no comparten como mínimo 3 palabras
  // iniciales seguidas, quedan sueltos, tal cual se veían antes.
  const normPrefijo = (s) =>
    (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const palabrasCompartidas = (a, b) => {
    const wa = normPrefijo(a).split(/\s+/);
    const wb = normPrefijo(b).split(/\s+/);
    let n = 0;
    while (n < wa.length && n < wb.length && wa[n] === wb[n]) n++;
    return n;
  };
  const clusters = useMemo(() => {
    const info = new Array(filtrados.length).fill(null);
    let inicio = 0;
    for (let i = 1; i <= filtrados.length; i++) {
      const corte =
        i === filtrados.length ||
        filtrados[i].categoria !== filtrados[i - 1].categoria ||
        palabrasCompartidas(filtrados[i].nombre_es, filtrados[i - 1].nombre_es) < 3;
      if (corte) {
        const size = i - inicio;
        if (size >= 2) {
          const nPrefijo = palabrasCompartidas(filtrados[inicio].nombre_es, filtrados[i - 1].nombre_es);
          const label = filtrados[inicio].nombre_es.trim().split(/\s+/).slice(0, nPrefijo).join(" ");
          if (label) info[inicio] = { size, label };
        }
        inicio = i;
      }
    }
    return info;
  }, [filtrados]);

  useEffect(() => { setVisibles(PAGE); }, [q, fCat, fEq, fTg, fPre, fNivel, soloDI, verArchivados, verRevisar, orden]);

  const toggle = (setter) => (v) =>
    setter((prev) => {
      const s = new Set(prev);
      s.has(v) ? s.delete(v) : s.add(v);
      return s;
    });

  const badgesActivos = [
    ...[...fCat].map((v) => ({ v, l: labelCat(v), del: () => toggle(setFCat)(v) })),
    ...[...fEq].map((v) => ({ v, l: labelEq(v), del: () => toggle(setFEq)(v) })),
    ...[...fTg].map((v) => ({ v, l: labelTg(v), del: () => toggle(setFTg)(v) })),
    ...[...fPre].map((v) => ({ v, l: "Código " + v, del: () => toggle(setFPre)(v) })),
    ...[...fNivel].map((v) => ({ v, l: "Nivel: " + (labelNivel(v) || "sin nivel"), del: () => toggle(setFNivel)(v) })),
    ...(soloDI ? [{ v: "di", l: "Principales DI", del: () => setSoloDI(false) }] : []),
    ...(verArchivados ? [{ v: "arch", l: "Archivados", del: () => setVerArchivados(false) }] : []),
    ...(verRevisar ? [{ v: "rev", l: "Para revisar", del: () => setVerRevisar(false) }] : []),
  ];

  // Ronda 17 (punto 3): "Todos los ejercicios" — resetea TODOS los filtros
  // (categoría/equipo/músculo/código/★ Principales DI/búsqueda) para
  // mostrar el catálogo completo sin acotar. Antes el único control
  // parecido en la sidebar era "🧘 Rutinas propias (movilidad/elástico/
  // calor)", que en realidad abre una biblioteca SEPARADA (movilidad/
  // calor, tabla distinta) — no "todo el catálogo". Se deja ese botón con
  // un nombre que describe lo que hace de verdad y se agrega este chip
  // nuevo para lo que Lucas pidió literalmente.
  const hayFiltrosActivos = fCat.size > 0 || fEq.size > 0 || fTg.size > 0 || fPre.size > 0 || fNivel.size > 0 || soloDI || verArchivados || verRevisar || q.trim() !== "";
  const limpiarFiltros = () => {
    setFCat(new Set()); setFEq(new Set()); setFTg(new Set()); setFPre(new Set()); setFNivel(new Set()); setSoloDI(false); setVerArchivados(false); setVerRevisar(false); setQ("");
  };

  // Ronda 17 (punto 3): renombrar una categoría — se propaga en la base a
  // TODOS los ejercicios que la tenían (mass UPDATE), y acá en memoria
  // también, así el grid/sidebar quedan en sync sin recargar todo el
  // catálogo (1.344 filas).
  const renombrarCategoria = async (vieja) => {
    const actual = labelCat(vieja);
    const nueva = window.prompt(`Nuevo nombre para la categoría "${actual}" (se aplica a TODOS los ejercicios que la tengan):`, actual);
    if (!nueva || !nueva.trim() || nueva.trim() === actual) return;
    const nuevaLimpia = nueva.trim();
    const ok = await renombrarCategoriaCatalogo(vieja, nuevaLimpia);
    if (!ok) { showToast && showToast("Error renombrando la categoría — revisá la consola"); return; }
    setCat((prev) => (prev || []).map((e) => (e.categoria === vieja ? { ...e, categoria: nuevaLimpia, editado: true } : e)));
    setFCat((prev) => {
      if (!prev.has(vieja)) return prev;
      const s = new Set(prev); s.delete(vieja); s.add(nuevaLimpia); return s;
    });
    showToast && showToast(`Categoría renombrada a "${nuevaLimpia}"`);
  };

  // Punto 4: músculos/tags editables con "predeterminado". Si el ejercicio
  // todavía no tiene las columnas nuevas (musculos/tags, migración 017)
  // se inicializan desde los datos del dataset (target+secondary,
  // equipment) la primera vez que se abre el detalle — sin perder nada.
  const abrirDetalle = (e) => {
    setCreando(false);
    setDetalle(e);
    const musculosIniciales = Array.isArray(e.musculos) && e.musculos.length > 0
      ? e.musculos
      : [e.target_es, ...(e.secondary_muscles_es || [])].filter(Boolean);
    const tagsIniciales = Array.isArray(e.tags) && e.tags.length > 0
      ? e.tags
      : [e.equipment_es].filter(Boolean);
    setForm({
      nombre_es: e.nombre_es,
      instrucciones_es: e.instrucciones_es || "",
      video: e.video || "",
      codigo_di: e.codigo_di || "",
      // Ronda 17 (punto 3): antes no era editable. Se muestra la ETIQUETA
      // en español (ej. "Cintura / Core"), no el valor crudo del dataset
      // (ej. "waist") — guardarDetalle compara contra categoria_original
      // para no reescribir 158 filas con "waist" a "Cintura / Core" solo
      // por abrir y guardar sin tocar este campo (fragmentaría el filtro
      // en dos chips que en realidad son la misma categoría).
      categoria: labelCat(e.categoria || ""),
      categoria_original: e.categoria || "",
      musculos: musculosIniciales,
      musculo_default: e.musculo_default || e.target_es || musculosIniciales[0] || "",
      tags: tagsIniciales,
      tag_default: e.tag_default || e.equipment_es || tagsIniciales[0] || "",
      nivel: e.nivel || "",
      // 2026-08-12: la unidad la asignó la migración 038 por regla; acá se
      // corrige el caso puntual que la regla no puede saber (un ejercicio
      // "con peso extra" que Lucas hace sin peso, por ejemplo).
      unidad: unidadDe(e),
    });
    setCodigoError("");
  };

  // Ronda 18: archivar/desarchivar — un archivado desaparece de listados y
  // búsquedas (se recupera con el chip "Archivados" del sidebar).
  const toggleArchivado = async (e) => {
    const nuevo = !e.archivado;
    const ok = await guardarEjercicioCatalogo(e.id, { archivado: nuevo });
    if (!ok) { showToast && showToast("Error archivando — revisá la consola"); return; }
    setCat((prev) => (prev || []).map((x) => (x.id === e.id ? { ...x, archivado: nuevo, editado: true } : x)));
    setDetalle(null);
    setCreando(false);
    showToast && showToast(nuevo ? "Ejercicio archivado (se oculta de los listados)" : "Ejercicio recuperado");
  };

  // 2026-08-10, pedido de Lucas: "tiene que ser más fácil archivar un
  // ejercicio, que tenga un botón ahí". Va a repasar los 1.343 ejercicios
  // uno por uno; con el flujo viejo (abrir la tarjeta → botón al pie del
  // detalle → cerrar) son horas. Acá se archiva de UN toque, sin
  // confirmación: la tarjeta sale de la lista al instante y el toast con
  // "Deshacer" es la red de seguridad (además del chip "Archivados").
  // Por qué no reusa toggleArchivado: ese escribe en la base al toque y
  // cierra el detalle. Este sigue el contrato de useDeshacer — la UI se
  // actualiza ya, el UPDATE real corre recién cuando vence el toast, así
  // "Deshacer" no necesita una segunda escritura para volver atrás.
  const { ejecutarConDeshacer, ToastUI } = useDeshacer();
  const archivarRapido = (e) => {
    const nuevo = !e.archivado;
    const marcar = (v) => setCat((prev) => (prev || []).map((x) => (x.id === e.id ? { ...x, archivado: v } : x)));
    marcar(nuevo);
    ejecutarConDeshacer({
      mensaje: `${nuevo ? "Archivado" : "Recuperado"}: ${e.nombre_es}`,
      alDeshacer: () => marcar(e.archivado),
      alConfirmar: async () => {
        const ok = await guardarEjercicioCatalogo(e.id, { archivado: nuevo });
        // Si la base rechaza el cambio hay que devolver la tarjeta a la
        // lista: si no, queda "archivada" solo en pantalla hasta recargar.
        if (!ok) { marcar(e.archivado); showToast && showToast("No se pudo archivar — revisá la consola"); }
      },
    });
  };

  // Flujo "Crear ejercicio nuevo" (punto 4): único lugar donde se sube
  // media propia para un ítem del catálogo — editar uno existente no
  // toca su media.
  const abrirNuevo = () => {
    setCreando(true);
    setDetalle({ id: null, custom: true });
    setForm({ nombre_es: "", instrucciones_es: "", video: "", codigo_di: "", categoria: "", musculos: [], musculo_default: "", tags: [], tag_default: "", nivel: "", unidad: "kilos" });
    setCodigoError("");
  };

  const guardarDetalle = async () => {
    if (!detalle || !form || !form.nombre_es.trim()) return;
    // Punto 5: validar que el código no esté en uso por OTRO ejercicio
    // antes de guardar (sin auto-reordenar el resto del grupo).
    const codigoLimpio = (form.codigo_di || "").trim().toUpperCase();
    if (codigoLimpio) {
      const disponible = await validarCodigoDisponible(codigoLimpio, detalle.id);
      if (!disponible) {
        setCodigoError(`El código "${codigoLimpio}" ya lo tiene otro ejercicio`);
        return;
      }
    }
    setCodigoError("");
    setGuardando(true);
    // Ronda 17 (punto 3): el input de categoría muestra la ETIQUETA en
    // español (labelCat), no el valor crudo. Si Lucas no tocó el campo,
    // el texto sigue siendo exactamente labelCat(categoria_original) —
    // en ese caso se guarda el valor crudo de siempre (ej. "waist"), no
    // la etiqueta, para no fragmentar la categoría en dos chips distintos
    // que en el fondo son lo mismo. Si sí la cambió, se guarda el texto
    // tal cual como la nueva categoría cruda de ESTE ejercicio (no se
    // propaga a otros — para eso está "renombrar categoría" en el sidebar).
    const categoriaTexto = (form.categoria || "").trim();
    const categoriaSinTocar = categoriaTexto === labelCat(form.categoria_original || "");
    const categoriaFinal = categoriaSinTocar ? (form.categoria_original || null) : (categoriaTexto || null);
    // target_es/equipment_es (los campos que usa la card del grid y el
    // dataset original) se mantienen en sync con el músculo/tag
    // predeterminado — así la tarjeta no queda mostrando un dato viejo
    // después de cambiar el ★ en el editor.
    const payload = {
      nombre_es: form.nombre_es.trim(),
      instrucciones_es: form.instrucciones_es,
      codigo_di: codigoLimpio || null,
      categoria: categoriaFinal, // ronda 17 (punto 3)
      musculos: form.musculos,
      musculo_default: form.musculo_default,
      tags: form.tags,
      tag_default: form.tag_default,
      nivel: form.nivel || null, // ronda 18: Inicial/Intermedio/Avanzado
      unidad: form.unidad || "kilos", // 2026-08-12: kilos | repeticiones | segundos
      target_es: form.musculo_default || form.musculos[0] || "",
      secondary_muscles_es: form.musculos.filter((m) => m !== form.musculo_default),
      equipment_es: form.tag_default || form.tags[0] || "",
    };
    if (creando) {
      const creado = await crearEjercicioCatalogo({ ...payload, video: form.video || "" });
      setGuardando(false);
      if (!creado) { showToast && showToast("Error creando — revisá la consola"); return; }
      setCat((prev) => [...(prev || []), creado]);
      showToast && showToast("Ejercicio creado");
      setDetalle(null);
      setCreando(false);
      return;
    }
    // Editando uno existente: si el código cambió, propagar a los planes
    // de alumnos y a biblioteca_ejercicios que ya usaban el código viejo.
    const codigoViejo = detalle.codigo_di || "";
    if (codigoLimpio && codigoLimpio !== codigoViejo && codigoViejo) {
      await renombrarCodigoEjercicio(codigoViejo, codigoLimpio);
    }
    // RENOMBRAR NO PUEDE DEJAR AL EJERCICIO SIN ILUSTRACIÓN (2026-08-12).
    // El ejercicio sin `gif_url` propio resuelve su imagen POR NOMBRE contra
    // el mapa de src/utils/ejerciciosMedia.js, que es un archivo del código:
    // renombrarlo a algo que ese mapa no conoce lo dejaba mudo. Se le fija la
    // imagen que tenía antes de renombrar — ver gifAlRenombrar().
    const gifFijado = gifAlRenombrar(detalle.gif_url, detalle.nombre_es || "", payload.nombre_es);
    if (gifFijado) payload.gif_url = gifFijado;
    const ok = await guardarEjercicioCatalogo(detalle.id, payload);
    setGuardando(false);
    if (!ok) { showToast && showToast("Error guardando — revisá la consola"); return; }
    setCat((prev) => prev.map((e) => (e.id === detalle.id ? { ...e, ...payload, editado: true } : e)));
    showToast && showToast("Ejercicio guardado");
    setDetalle(null);
  };

  const agregarAlCarrito = (e) => {
    if (carrito.some((c) => c.id === e.id)) { showToast && showToast("Ya está en el plan"); return; }
    setCarrito((c) => [...c, e]);
  };

  const moverCarrito = (i, dir) => {
    setCarrito((c) => {
      const arr = [...c];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };

  // Punto 6 (2026-07-21): el Armador deja de asignar directo a un alumno
  // — ahora solo crea/edita PLANTILLAS (planes_predeterminados), sin
  // ligar a nadie. La asignación a un alumno puntual se mudó a Admin →
  // Alumno → "Asignar plan" (ver AsignarPlanModal en App.jsx), que copia
  // la plantilla con asignarPlanPredeterminado().
  const guardarPlan = async () => {
    if (!nombrePlan.trim()) { showToast && showToast("Ponele un nombre al plan"); return; }
    if (carrito.length === 0) { showToast && showToast("El plan está vacío"); return; }
    setGuardandoPlan(true);
    try {
      const ejercicios = [];
      for (const it of carrito) {
        // B5: si el ejercicio no estaba en biblioteca_ejercicios, se agrega
        // (con codigo_di o el próximo X## libre) y el plan usa ese código.
        const codigo = await agregarCatalogoABiblioteca(it);
        ejercicios.push({
          id: uid(),
          nombre: it.nombre_es,
          desc: it.instrucciones_es || "",
          video: it.video || "",
          codigo: codigo || null,
          gif: catalogoMediaUrl(it.gif_url || ""),
          // 2026-08-12: la unidad viaja desde el catálogo al plan (antes se
          // guardaba "reps" para todo y la pantalla lo mostraba como kilos).
          unidad: unidadDe(it),
          // 2026-08-13: el equipamiento viaja por el mismo camino, porque de
          // ahí sale la FORMA DE CARGA (barra + discos por lado, dos
          // mancuernas, placa, banda). No se carga a mano ejercicio por
          // ejercicio: es un dato que el catálogo ya tenía.
          equipamiento: it.equipment_es || null,
        });
      }
      const creado = await crearPlanPredeterminado(nombrePlan.trim(), grupoPlan.trim(), [{ dia: "Sesion", subtitulo: "", ejercicios }], nivelPlan);
      if (!creado) throw new Error("No se pudo crear la plantilla");
      showToast && showToast(`Plan "${nombrePlan.trim()}" guardado`);
      setCarrito([]);
      setNombrePlan("");
      setGrupoPlan("");
      setNivelPlan("");
      setPantalla("biblioteca");
    } catch (e) {
      console.error("[Armador]", e);
      showToast && showToast("Error: " + e.message);
    } finally {
      setGuardandoPlan(false);
    }
  };

  // Volver de la pantalla de armado sin guardar: si hay ejercicios
  // sumados, confirma antes de descartarlos. Vuelve a la Biblioteca
  // (menú anterior), nunca al home.
  const cerrarArmador = () => {
    if (carrito.length > 0 && !window.confirm("¿Salir del plan en construcción? Se pierden los ejercicios que sumaste.")) return;
    setPantalla("biblioteca");
    setCarrito([]);
    setNombrePlan("");
    setGrupoPlan("");
    setNivelPlan("");
  };

  const sidebar = (
    <div style={{ width: isWide ? 260 : "auto", flexShrink: 0, padding: isWide ? "0 20px 0 0" : 0, borderRight: isWide ? "1px solid " + S.border : "none", overflowY: isWide ? "auto" : "visible" }}>
      <div style={{ position: "relative", marginBottom: 24 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ejercicios…"
          style={{ ...inp, paddingRight: 44 }}
        />
        {q && (
          <button onClick={() => setQ("")} title="Limpiar búsqueda" className="di-tap" style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: S.gray, cursor: "pointer", width: TAP, height: TAP, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} strokeWidth={2} />
          </button>
        )}
      </div>
      {/* Ronda 17 (punto 3): "Todos los ejercicios" — resetea todos los
          filtros y muestra el catálogo completo (1.344) sin acotar. Antes
          Lucas confundía esto con el botón "Rutinas propias (movilidad)"
          de más abajo, que en realidad abre otra biblioteca separada. */}
      <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Chip activo={!hayFiltrosActivos} onClick={limpiarFiltros}>Todos los ejercicios</Chip>
        <Chip activo={soloDI} onClick={() => setSoloDI((v) => !v)}>★ Principales DI</Chip>
        {/* Ronda 18: ver/recuperar archivados */}
        <Chip activo={verArchivados} onClick={() => setVerArchivados((v) => !v)}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Archive size={14} strokeWidth={2} />Archivados</span></Chip>
        {/* 2026-07-30: bandeja "Para revisar" con contador — es una lista de
            pendientes, sirve saber cuántos quedan sin abrirla. Si la
            migración 025 no está aplicada, el chip ni aparece. */}
        {revisarOk && (
          <Chip activo={verRevisar} onClick={() => setVerRevisar((v) => !v)} title="Ejercicios que marcaste para revisar (gif/nombre/código raros)">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Flag size={14} strokeWidth={2} />Para revisar{revisarIds.size > 0 ? ` (${revisarIds.size})` : ""}
            </span>
          </Chip>
        )}
      </div>
      {/* Ronda 18: los botones de crear (ejercicio / plan) se MUDARON a la
          barra de acciones principal de la pantalla — no van dentro del
          panel de filtros. */}
      {/* Jerarquía: los dos filtros que un entrenador usa siempre
          (categoría y nivel) quedan abiertos; los largos, plegados. */}
      <FiltroSeccion titulo="Categoría" valores={categorias} seleccion={fCat} onToggle={toggle(setFCat)} labelDe={labelCat} onRename={renombrarCategoria} />
      <FiltroSeccion titulo="Nivel" valores={NIVELES.map(([id]) => id)} seleccion={fNivel} onToggle={toggle(setFNivel)} labelDe={labelNivel} />
      <FiltroSeccion titulo="Músculo objetivo" valores={targets} seleccion={fTg} onToggle={toggle(setFTg)} labelDe={labelTg} colapsable />
      <FiltroSeccion titulo="Equipamiento" valores={equipos} seleccion={fEq} onToggle={toggle(setFEq)} labelDe={labelEq} colapsable />
      {/* Ronda 17 (punto 3): filtro por prefijo de código, derivado
          dinámicamente de codigo_di. */}
      <FiltroSeccion titulo="Código" valores={prefijos} seleccion={fPre} onToggle={toggle(setFPre)} labelDe={(v) => v} colapsable />
      {/* 2026-07-30: el botón de "Rutinas propias" ya NO vive acá. Lucas
          preguntó "ese botón de abajo para qué sirve?" — y era esperable:
          estaba al fondo de una columna de filtros, así que se leía como un
          filtro más del catálogo cuando en realidad NAVEGA a otra biblioteca
          (tabla distinta). Se mudó arriba, fuera de la zona de filtros, como
          bloque de navegación rotulado. Ver `navPropia`. */}
    </div>
  );

  // ── Rutinas propias ─────────────────────────────────────────────────
  // 2026-08-10 — LIMPIEZA: acá arriba había un bloque "Otra biblioteca" que
  // prometía "movilidad, elástico y entrada en calor", o sea exactamente lo
  // mismo que el botón "Movilidad y entrada en calor" de la barra de acciones,
  // agregado por otra sesión. Dos entradas para el mismo tema en la misma
  // pantalla. Queda UNA sola en la barra de acciones — la que nombra lo que
  // hay adentro ("Movilidad y entrada en calor") — y el acceso a la lista de
  // rutinas propias baja un nivel, adentro de esa pantalla, que es donde
  // corresponde por tema. Ver `pantallaPreparacion`.
  const navPropia = null;

  // Grilla (2026-07-30). Antes: `minmax(150px, 1fr)` daba 11 columnas en
  // desktop — 63 tarjetas de 154px con 90px útiles de texto, densidad de
  // catálogo mayorista y todos los títulos truncados. Ahora tarjetas de
  // ~240px en escritorio (auto-fill, se adapta al ancho real que queda
  // libre según haya sidebar o panel de plan) y 2 columnas en el celular,
  // que es lo máximo legible a 375px.
  const gridCols = {
    display: "grid",
    gridTemplateColumns: isWide ? "repeat(auto-fill, minmax(240px, 1fr))" : "repeat(2, minmax(0, 1fr))",
    gap: isWide ? 16 : 10,
    alignItems: "start",
  };

  const grid = (
    // Ronda 18 — FIX del scroll roto en mobile: este wrapper vive en un
    // flex COLUMN (viewport fijo) y sin minHeight:0 un flex item nunca se
    // achica por debajo de su contenido (min-height:auto) — el grid crecía
    // más alto que la pantalla, el overflowY:auto interno nunca se
    // activaba y el root (position:fixed sin overflow) tampoco scrolleaba:
    // resultado, lista congelada en el celular. Con minHeight:0 el área de
    // la lista se acota al alto disponible y su scroll interno funciona.
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* barra de resultados + filtros activos + orden */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {badgesActivos.map((b) => (
          <span key={b.l} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: S.card2, border: "1px solid " + S.border, borderRadius: 20, padding: "4px 4px 4px 12px", minHeight: TAP, fontSize: TS.chip, fontWeight: 600, color: S.white }}>
            {b.l}
            <button onClick={b.del} title={`Quitar filtro ${b.l}`} className="di-tap" style={{ background: "transparent", border: "none", color: S.gray, cursor: "pointer", width: 36, height: 36, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: TS.chip, color: S.gray, display: "inline-flex", alignItems: "center", gap: 6 }}>
          {cat ? (
            <>
              <strong style={{ color: S.white, fontWeight: 800 }}>{filtrados.length}</strong>
              de {cat.length} ejercicios
            </>
          ) : "Cargando catálogo…"}
        </span>
        {/* Orden: por defecto agrupado por categoría (el alfabético puro
            dejaba 20 variantes de abdominales seguidas al abrir). */}
        <div style={{ display: "flex", gap: 6 }}>
          <Chip activo={orden === "categoria"} onClick={() => setOrden("categoria")}>Por categoría</Chip>
          <Chip activo={orden === "az"} onClick={() => setOrden("az")}>A–Z</Chip>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {!cat ? (
          <div style={gridCols}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ ...card, height: 280, opacity: 0.35 }} />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ ...card, padding: 40, textAlign: "center", maxWidth: 460, margin: "24px auto" }}>
            <Search size={22} strokeWidth={2} color={S.gray} />
            <div style={{ color: S.white, fontSize: TS.lead, fontWeight: 700, marginTop: 12, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>
              Ningún ejercicio con esos filtros
            </div>
            <div style={{ color: S.gray, fontSize: TS.body, marginTop: 8, lineHeight: 1.5 }}>
              Probá con menos filtros, o buscá por el nombre del movimiento.
            </div>
            {hayFiltrosActivos && (
              <button onClick={limpiarFiltros} className="di-tap" style={{ marginTop: 20, background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: "12px 20px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY }}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={gridCols}>
              {filtrados.slice(0, visibles).map((e, i, arr) => {
                const enCarrito = carrito.some((c) => c.id === e.id);
                const media = hoverId === e.id && e.gif_url ? catalogoMediaUrl(e.gif_url) : catalogoMediaUrl(e.image || e.gif_url);
                // Encabezado de grupo: el orden por categoría se tiene que
                // VER, si no es un orden invisible.
                const grupo = orden === "categoria" && (i === 0 || arr[i - 1].categoria !== e.categoria)
                  ? labelCat(e.categoria || "Sin categoría")
                  : null;
                // 2026-08-04: cluster de variantes por movimiento (ver
                // `clusters` arriba) — badge chico, sin competir con el
                // acento rojo de marca que ya usa el encabezado de categoría.
                const cluster = clusters[i];
                return (
                  <Fragment key={e.id}>
                    {grupo && (
                      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12, marginTop: i === 0 ? 0 : 16 }}>
                        <span style={{ width: 24, height: 2, background: S.red, flexShrink: 0 }} />
                        <span style={{ ...eyebrow, fontSize: TS.chip, color: S.white }}>{grupo}</span>
                        <span style={{ flex: 1, height: 1, background: S.border }} />
                      </div>
                    )}
                    {cluster && (
                      <div style={{ gridColumn: "1 / -1", marginTop: grupo ? 4 : i === 0 ? 0 : 10 }}>
                        <span
                          title={`${cluster.size} variantes de "${cluster.label}" — mismo movimiento, distinto equipo/ejecución`}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: TS.chip, fontWeight: 700, color: S.lgray, background: S.card2, border: "1px solid " + S.border, borderRadius: 20, padding: "4px 10px 4px 8px" }}
                        >
                          <Layers size={13} strokeWidth={2} />{cluster.label} · {cluster.size} variantes
                        </span>
                      </div>
                    )}
                    <article
                      className="di-cat-card"
                      tabIndex={0}
                      onMouseEnter={() => setHoverId(e.id)}
                      onMouseLeave={() => setHoverId((h) => (h === e.id ? null : h))}
                      onClick={() => abrirDetalle(e)}
                      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); abrirDetalle(e); } }}
                      style={{
                        ...card,
                        overflow: "hidden",
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        // 2026-07-30 — marca de "para revisar": un filete
                        // rojo de 3px al costado, nada de badge de color
                        // pleno. El rojo es el único acento de la marca y acá
                        // se usa en la mínima superficie que se ve de un
                        // vistazo al barrer la grilla.
                        ...(revisarIds.has(e.id) ? { borderLeft: "3px solid " + S.red } : null),
                      }}
                    >
                      {/* La imagen deja de dominar la tarjeta: 4:3 en vez de
                          1:1 y desaturada, para que el rojo del pack de
                          stock no compita con el rojo de la marca. Al pasar
                          el puntero vuelve a color y arranca el gif — el
                          movimiento devuelve el detalle real del ejercicio. */}
                      <div style={{ aspectRatio: "4 / 3", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                        {media ? (
                          <img src={media} alt={e.nombre_es} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "saturate(0.5)" }} />
                        ) : (
                          <Dumbbell size={30} color={S.bg} strokeWidth={2} />
                        )}
                      </div>
                      {armadorAbierto && (
                        <button
                          onClick={(ev) => { ev.stopPropagation(); agregarAlCarrito(e); }}
                          title={enCarrito ? "Ya está en el plan" : "Agregar al plan"}
                          className="di-tap"
                          style={{ position: "absolute", top: 8, right: 8, width: TAP, height: TAP, borderRadius: "50%", background: enCarrito ? S.green : S.white, color: S.bg, border: "none", fontWeight: 900, fontSize: TS.lead, cursor: "pointer", lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                        >
                          {enCarrito ? <Check size={20} strokeWidth={2.5} /> : "＋"}
                        </button>
                      )}
                      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                        {/* El nombre manda: es el único dato que importa. */}
                        <div style={{ color: S.white, fontSize: TS.ui, fontWeight: 700, lineHeight: 1.35, minHeight: 44, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", fontFamily: FONT_BODY }}>
                          {e.nombre_es}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: "auto" }}>
                          {e.target_es && <span style={{ fontSize: TS.chip, color: S.gray, background: S.card2, borderRadius: 4, padding: "3px 8px" }}>{e.target_es}</span>}
                          {e.equipment_es && <span style={{ fontSize: TS.chip, color: S.gray, background: S.card2, borderRadius: 4, padding: "3px 8px" }}>{e.equipment_es}</span>}
                          {e.nivel && (
                            <span style={{ fontSize: TS.chip, fontWeight: 700, color: S.white, background: S.card3, border: "1px solid " + S.border2, borderRadius: 4, padding: "3px 8px" }}>
                              {labelNivel(e.nivel)}
                            </span>
                          )}
                          {e.archivado && (
                            <span style={{ fontSize: TS.chip, fontWeight: 700, color: S.yellow, background: S.card2, borderRadius: 4, padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Archive size={14} strokeWidth={2} />Archivado
                            </span>
                          )}
                          {/* Etiqueta terciaria, en gris: la señal fuerte ya
                              la da el filete; esto solo la nombra. */}
                          {revisarIds.has(e.id) && (
                            <span style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, background: "transparent", border: "1px solid " + S.border2, borderRadius: 4, padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Flag size={14} strokeWidth={2} />Para revisar
                            </span>
                          )}
                        </div>
                        {/* Pie de la tarjeta. El código queda (identifica el
                            ejercicio); la marquita "editado" se fue: era
                            informativa y ocupaba el lugar donde Lucas
                            necesita la acción que sí usa 1.343 veces
                            (2026-08-10). El botón archiva de un toque y
                            frena la propagación para que tocar la tarjeta
                            siga abriendo el detalle. */}
                        {/* En el celular van apilados: con dos columnas de
                            tarjetas, en fila el código quedaba en "A…" y el
                            código es justamente lo que identifica al
                            ejercicio. */}
                        <div style={{ display: "flex", flexDirection: isWide ? "row" : "column", alignItems: isWide ? "center" : "stretch", gap: 8 }}>
                          <span style={{ flex: 1, minWidth: 0, fontSize: TS.chip, color: S.lgray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {e.codigo_di}
                          </span>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); archivarRapido(e); }}
                            onKeyDown={(ev) => ev.stopPropagation()}
                            title={e.archivado ? "Sacar del archivo" : "Archivar (se oculta de los listados; se recupera con el chip Archivados)"}
                            className="di-tap"
                            style={{ flexShrink: 0, minHeight: TAP, minWidth: TAP, padding: "0 12px", background: "transparent", color: e.archivado ? S.green : S.gray, border: "1px solid " + (e.archivado ? S.green : S.border2), borderRadius: 8, fontSize: TS.chip, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                          >
                            {e.archivado
                              ? <><RotateCcw size={14} strokeWidth={2} />Recuperar</>
                              : <><Archive size={14} strokeWidth={2} />Archivar</>}
                          </button>
                        </div>
                      </div>
                    </article>
                  </Fragment>
                );
              })}
            </div>
            {visibles < filtrados.length && (
              <button
                onClick={() => setVisibles((v) => v + PAGE)}
                className="di-tap"
                style={{ ...smallBtn(S.gray), width: "100%", marginTop: 20, marginBottom: 8 }}
              >
                Cargar más ({filtrados.length - visibles} restantes)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );


  // Chips de nivel reutilizables (armador + edición de plantilla).
  const nivelChips = (valor, onSet) => (
    <div style={{ display: "flex", gap: 6 }}>
      {NIVELES.map(([id, l]) => (
        <button
          key={id}
          onClick={() => onSet(valor === id ? "" : id)}
          className="di-tap"
          style={{ flex: 1, background: valor === id ? S.white : S.card3, color: valor === id ? S.bg : S.gray, border: "1px solid " + (valor === id ? S.white : S.border2), borderRadius: 8, padding: "11px 6px", minHeight: TAP, fontSize: TS.chip, fontWeight: valor === id ? 800 : 600, cursor: "pointer", fontFamily: FONT_BODY }}
        >
          {l}
        </button>
      ))}
    </div>
  );

  // 2026-08-12 — Lucas: la unidad tiene que salir del catálogo y poder
  // corregirse ejercicio por ejercicio. Mismo patrón visual que nivelChips,
  // pero SIN toggle de apagado: un ejercicio siempre se registra de alguna de
  // las tres formas, "sin unidad" no existe.
  const unidadChips = (valor, onSet) => (
    <div style={{ display: "flex", gap: 6 }}>
      {UNIDADES.map((id) => (
        <button
          key={id}
          onClick={() => onSet(id)}
          className="di-tap"
          style={{ flex: 1, background: valor === id ? S.white : S.card3, color: valor === id ? S.bg : S.gray, border: "1px solid " + (valor === id ? S.white : S.border2), borderRadius: 8, padding: "11px 6px", minHeight: TAP, fontSize: TS.chip, fontWeight: valor === id ? 800 : 600, cursor: "pointer", fontFamily: FONT_BODY }}
        >
          {NOMBRE_UNIDAD[id]}
        </button>
      ))}
    </div>
  );

  const labelCampo = { fontSize: TS.chip, color: S.gray, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 6, fontFamily: FONT_BODY };

  // ── Panel "Plan de Entrenamiento" (pantalla de armado) ──────────────
  // Ronda 18: título correcto + campos Nombre del Plan / Categoría / Nivel
  // (antes decía "Plan en construcción (N)" y solo tenía nombre y grupo).
  const planPanel = armadorAbierto && (
    <div style={{ ...card, width: isWide ? 300 : "auto", flexShrink: 0, padding: 12, display: "flex", flexDirection: "column", maxHeight: isWide ? "none" : "48vh", minHeight: 0 }}>
      <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 8 }}>
        Plan de Entrenamiento {carrito.length > 0 ? `· ${carrito.length} ejercicio(s)` : ""}
      </div>
      <div style={labelCampo}>Nombre del Plan</div>
      <input value={nombrePlan} onChange={(e) => setNombrePlan(e.target.value)} placeholder="ej. Hipertrofia V2" style={{ ...inp, marginBottom: 8 }} />
      <div style={labelCampo}>Categoría</div>
      <input value={grupoPlan} onChange={(e) => setGrupoPlan(e.target.value)} placeholder="ej. Hipertrofia, Fuerza, Básico…" style={{ ...inp, marginBottom: 8 }} />
      <div style={labelCampo}>Nivel</div>
      <div style={{ marginBottom: 10 }}>{nivelChips(nivelPlan, setNivelPlan)}</div>
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", minHeight: 60 }}>
        {carrito.length === 0 ? (
          <div style={{ color: S.gray, fontSize: TS.body, padding: "14px 4px", lineHeight: 1.5 }}>
            Tocá ＋ en los ejercicios de la lista para ir armando el plan.
          </div>
        ) : (
          carrito.map((it, i) => (
            <div key={it.id} style={{ background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, padding: "7px 9px", marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: S.gray, fontSize: TS.chip, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: TS.ui, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.nombre_es}
              </span>
              <button onClick={() => moverCarrito(i, -1)} title="Subir" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▲</button>
              <button onClick={() => moverCarrito(i, 1)} title="Bajar" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▼</button>
              <button onClick={() => setCarrito((c) => c.filter((x) => x.id !== it.id))} title="Quitar del plan" className="di-tap" style={{ ...smallBtn(S.red), padding: "0 10px", minWidth: 40, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
            </div>
          ))
        )}
      </div>
      <button
        onClick={guardarPlan}
        disabled={guardandoPlan || carrito.length === 0 || !nombrePlan.trim()}
        className="di-tap"
        style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 14, minHeight: TAP, fontSize: TS.ui, fontWeight: 900, letterSpacing: 0.8, cursor: "pointer", marginTop: 10, opacity: guardandoPlan || carrito.length === 0 || !nombrePlan.trim() ? 0.5 : 1, fontFamily: FONT_BODY }}
      >
        {guardandoPlan ? "GUARDANDO..." : "GUARDAR PLAN"}
      </button>
    </div>
  );

  // ── Pantalla "Todos los planes" (ronda 18) ──────────────────────────
  // Listar / renombrar / editar ejercicios / eliminar las plantillas.
  // Navegación menú a menú: lista → detalle → volver a la lista → volver
  // a la Biblioteca (nunca salta al home).
  const abrirPlantilla = (p) => {
    setPlanSel(p);
    setPlanForm({
      nombre: p.nombre || "",
      grupo: p.grupo || "",
      nivel: p.nivel || "",
      dias: JSON.parse(JSON.stringify(p.dias || [])),
    });
    setQPlanAdd("");
  };
  const moverEjPlantilla = (di, i, dir) => {
    setPlanForm((f) => {
      const dias = f.dias.map((d) => ({ ...d, ejercicios: [...(d.ejercicios || [])] }));
      const arr = dias[di].ejercicios;
      const j = i + dir;
      if (j < 0 || j >= arr.length) return f;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...f, dias };
    });
  };
  const quitarEjPlantilla = (di, i) => {
    setPlanForm((f) => {
      const dias = f.dias.map((d) => ({ ...d, ejercicios: [...(d.ejercicios || [])] }));
      dias[di].ejercicios.splice(i, 1);
      return { ...f, dias };
    });
  };
  const agregarEjPlantilla = async (it) => {
    const codigo = await agregarCatalogoABiblioteca(it);
    setPlanForm((f) => {
      const dias = f.dias.length > 0 ? f.dias.map((d) => ({ ...d, ejercicios: [...(d.ejercicios || [])] })) : [{ dia: "Sesion", subtitulo: "", ejercicios: [] }];
      dias[0].ejercicios.push({
        id: uid(),
        nombre: it.nombre_es,
        desc: it.instrucciones_es || "",
        video: it.video || "",
        codigo: codigo || null,
        gif: catalogoMediaUrl(it.gif_url || ""),
        unidad: unidadDe(it), // 2026-08-12: la unidad la define el catálogo
        equipamiento: it.equipment_es || null, // 2026-08-13: y la forma de carga
      });
      return { ...f, dias };
    });
    setQPlanAdd("");
  };
  const guardarPlantilla = async () => {
    if (!planSel || !planForm || !planForm.nombre.trim()) { showToast && showToast("El plan necesita un nombre"); return; }
    setGuardandoPlantilla(true);
    const ok = await actualizarPlanPredeterminado(planSel.id, {
      nombre: planForm.nombre.trim(),
      grupo: planForm.grupo.trim(),
      nivel: planForm.nivel || null,
      dias: planForm.dias,
    });
    setGuardandoPlantilla(false);
    if (!ok) { showToast && showToast("Error guardando el plan — revisá la consola"); return; }
    showToast && showToast(`Plan "${planForm.nombre.trim()}" actualizado`);
    setPlanSel(null);
    setPlanForm(null);
    listarPlanesPredeterminados().then(setPlantillas);
  };
  const eliminarPlantilla = async (p) => {
    if (!window.confirm(`¿Eliminar el plan "${p.nombre}"? Los alumnos que ya lo tienen asignado conservan su copia.`)) return;
    const ok = await eliminarPlanPredeterminado(p.id);
    if (!ok) { showToast && showToast("Error eliminando — revisá la consola"); return; }
    showToast && showToast(`Plan "${p.nombre}" eliminado`);
    if (planSel && planSel.id === p.id) { setPlanSel(null); setPlanForm(null); }
    listarPlanesPredeterminados().then(setPlantillas);
  };
  const sugerenciasPlanAdd = qPlanAdd.trim().length >= 2 && cat
    ? cat.filter((e) => !e.archivado && `${e.nombre_es} ${e.codigo_di || ""}`.toLowerCase().includes(qPlanAdd.trim().toLowerCase())).slice(0, 8)
    : [];

  // ── PREPARACIÓN: los PREDETERMINADOS globales (2026-08-10) ──────────
  // Pedido de Lucas: "en biblioteca de ejercicios en la parte de planes de
  // entrenamiento tengo que tener una parte de entrada en calor y otra de
  // movilidad para poder editar esas también". Lo que se edita acá es el
  // NIVEL 1 (app_config, claves prep_*): la lista con la que arranca todo
  // alumno que no tenga la suya propia. Mismo editor de lista que las
  // plantillas de plan (buscar en el catálogo · ＋ · ▲▼ · ✕) — no se
  // inventa un editor nuevo.
  //
  // Los ejercicios se guardan con {nombre, desc}: el nombre es la clave con
  // la que ejerciciosMedia.js resuelve la imagen, así que se copia tal cual
  // viene del catálogo y no se toca en ningún paso.
  const pantallaPreparacion = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={() => setPantalla("biblioteca")} style={{ ...smallBtn(S.gray) }}>← Volver</button>
        <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, lineHeight: 1, letterSpacing: 0.5, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
          Preparación (predeterminados)
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ ...card, padding: "10px 14px", marginBottom: 10, color: S.gray, fontSize: TS.body }}>
          Estas son las listas con las que arrancan TODOS los alumnos. El alumno que tenga
          una lista propia (editada desde su ficha) no se pisa: sigue con la suya.
        </div>
        {/* 2026-08-10: única entrada a la biblioteca de rutinas propias (antes
            duplicaba a este mismo botón desde la pantalla anterior). Vive acá
            porque es el mismo tema: movilidad, elástico y entrada en calor. */}
        {onAbrirPropia && (
          <button
            onClick={onAbrirPropia}
            className="di-tap"
            title="Abre la biblioteca de rutinas propias (otra lista, no el catálogo de 1.343 ejercicios)"
            style={{ ...card, width: "100%", marginBottom: 12, padding: "12px 14px", minHeight: TAP, cursor: "pointer", fontFamily: FONT_BODY, display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
          >
            <Dumbbell size={20} strokeWidth={2} color={S.white} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ ...eyebrow, display: "block" }}>Rutinas propias</span>
              <span style={{ display: "block", color: S.white, fontSize: TS.ui, fontWeight: 700, marginTop: 2 }}>
                Editar los ejercicios uno por uno (videos, GIFs, códigos)
              </span>
            </span>
            <ChevronRight size={18} strokeWidth={2} color={S.gray} style={{ flexShrink: 0 }} />
          </button>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {PREP_LISTAS.map((l) => (
            <button
              key={l.id}
              onClick={() => setPrepSel(l.id)}
              className="di-tap"
              style={{ ...smallBtn(prepSel === l.id ? S.white : S.gray) }}
            >
              {l.grupo === "movilidad" ? `Movilidad · ${l.label}` : l.label}
            </button>
          ))}
        </div>
        {(() => {
          const lista = prepLista(prepSel);
          const sugerencias = qPrepAdd.trim().length >= 2 && cat
            ? cat.filter((e) => !e.archivado && `${e.nombre_es} ${e.codigo_di || ""}`.toLowerCase().includes(qPrepAdd.trim().toLowerCase())).slice(0, 8)
            : [];
          return (
            <div style={{ maxWidth: 560 }}>
              <div style={{ ...card, padding: 12, marginBottom: 10 }}>
                {lista.length === 0 && <div style={{ color: S.gray, fontSize: TS.body, padding: "6px 2px" }}>Lista vacía.</div>}
                {lista.map((ej, i) => (
                  <div key={i} style={{ background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, padding: "7px 9px", marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ color: S.gray, fontSize: TS.chip, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: TS.ui, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ej.nombre}</span>
                    <button onClick={() => moverPrep(i, -1)} title="Subir" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▲</button>
                    <button onClick={() => moverPrep(i, 1)} title="Bajar" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▼</button>
                    <button onClick={() => quitarPrep(i)} title="Quitar" className="di-tap" style={{ ...smallBtn(S.red), padding: "0 10px", minWidth: 40, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
                  </div>
                ))}
              </div>
              <div style={{ ...card, padding: 12, marginBottom: 12 }}>
                <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 8 }}>Agregar ejercicio</div>
                <input value={qPrepAdd} onChange={(e) => setQPrepAdd(e.target.value)} placeholder="Buscar en el catálogo…" style={inp} />
                {sugerencias.map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", borderBottom: "1px solid " + S.border }}>
                    <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: TS.ui, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {e.nombre_es}{e.codigo_di ? <span style={{ color: S.lgray }}>{" · " + e.codigo_di}</span> : ""}
                    </span>
                    <button onClick={() => agregarPrep(e)} title="Agregar" className="di-tap" style={{ ...smallBtn(S.white), padding: "0 14px" }}>＋</button>
                  </div>
                ))}
              </div>
              <button
                onClick={guardarPrep}
                disabled={guardandoPrep}
                className="di-tap"
                style={{ width: "100%", marginBottom: 20, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 13, minHeight: TAP, fontSize: TS.ui, fontWeight: 900, cursor: "pointer", opacity: guardandoPrep ? 0.6 : 1, fontFamily: FONT_BODY }}
              >
                {guardandoPrep ? "GUARDANDO..." : "GUARDAR PREDETERMINADO"}
              </button>
            </div>
          );
        })()}
      </div>
    </>
  );

  // ── PERIODIZACIÓN: los PREDETERMINADOS globales (2026-08-10) ────────
  // Pedido de Lucas: "lo tendría que poder cambiar el predeterminado desde la
  // biblioteca de ejercicios, después también debería poder personalizar el de
  // cada alumno si quiero". Las 8 tablas (4 objetivos × 2 niveles) se editan
  // acá; la del alumno se sigue editando en su ficha, igual que antes.
  //
  // Las semanas se editan en línea (sin modal): son 3 campos por fila y Lucas
  // va a llenar a mano las 6 tablas que faltan, así que tiene que poder pasar
  // de campo en campo sin abrir y cerrar nada.
  const pantallaPeriodizacion = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={() => setPantalla("biblioteca")} style={{ ...smallBtn(S.gray) }}>← Volver</button>
        <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, lineHeight: 1, letterSpacing: 0.5, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
          Periodizaciones
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ ...card, padding: "10px 14px", marginBottom: 10, color: S.gray, fontSize: TS.body }}>
          Estas son las tablas con las que arranca cada alumno según su objetivo y su nivel.
          El alumno que tenga una periodización propia (editada desde su ficha) no se pisa: sigue con la suya.
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {/* setPerNombreDraft(null) al cambiar de fila: si no, el texto a
              medio escribir de una planificación se vería sobre otra. */}
          {OBJETIVOS_PER.map((o) => (
            <button key={o.id} onClick={() => { setPerObj(o.id); setPerNombreDraft(null); }} className="di-tap" style={{ ...smallBtn(perObj === o.id ? S.white : S.gray) }}>
              {o.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {NIVELES_PER.map((n) => (
            <button key={n.id} onClick={() => { setPerNiv(n.id); setPerNombreDraft(null); }} className="di-tap" style={{ ...smallBtn(perNiv === n.id ? S.white : S.gray) }}>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ maxWidth: 560 }}>
          <div style={{ ...card, padding: 12, marginBottom: 10 }}>
            {/* 2026-08-12: el título es un campo. Se escribe encima y se
                guarda al salir del campo — un renombre es cambiar una palabra,
                no vale abrir un modal para eso. */}
            <input
              value={perNombreVisible}
              onChange={(e) => setPerNombreDraft(e.target.value)}
              onBlur={guardarNombrePer}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              title="Renombrar esta planificación"
              style={{ ...inp, marginBottom: 6, fontWeight: 800 }}
            />
            <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 8 }}>
              {objetivoLabel(perObj)} · {nivelLabel(perNiv)} · {perSemanas.length} semana(s)
            </div>
            <div style={{ display: "flex", gap: 6, color: S.lgray, fontSize: TS.chip, fontWeight: 800, padding: "0 2px 6px" }}>
              <span style={{ width: 26, flexShrink: 0 }}>#</span>
              <span style={{ flex: 1, minWidth: 0 }}>SERIES</span>
              <span style={{ flex: 1, minWidth: 0 }}>REPS</span>
              <span style={{ flex: 1, minWidth: 0 }}>INTENSIDAD</span>
              <span style={{ width: 40, flexShrink: 0 }} />
            </div>
            {perSemanas.length === 0 && (
              <div style={{ color: S.gray, fontSize: TS.body, padding: "6px 2px" }}>
                Sin semanas cargadas — agregá la primera con “＋ Agregar semana”.
              </div>
            )}
            {perSemanas.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ width: 26, flexShrink: 0, color: S.gray, fontSize: TS.chip, fontWeight: 800 }}>{i + 1}</span>
                <input
                  value={String(s.series ?? "")}
                  onChange={(e) => setPerCampo(i, "series", e.target.value)}
                  inputMode="numeric"
                  style={{ ...inp, flex: 1, minWidth: 0 }}
                />
                <input
                  value={String(s.reps ?? "")}
                  onChange={(e) => setPerCampo(i, "reps", e.target.value)}
                  inputMode="numeric"
                  placeholder="8"
                  style={{ ...inp, flex: 1, minWidth: 0 }}
                />
                <input
                  value={String(s.intensidad ?? "")}
                  onChange={(e) => setPerCampo(i, "intensidad", e.target.value)}
                  placeholder="75%"
                  style={{ ...inp, flex: 1, minWidth: 0 }}
                />
                <button onClick={() => quitarSemana(i)} title="Quitar semana" className="di-tap" style={{ ...smallBtn(S.red), padding: "0 8px", minWidth: 40, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            ))}
            <button onClick={agregarSemana} className="di-tap" style={{ ...smallBtn(S.white), width: "100%", marginTop: 6 }}>
              ＋ Agregar semana
            </button>
          </div>
          <button
            onClick={guardarPer}
            disabled={guardandoPer}
            className="di-tap"
            style={{ width: "100%", marginBottom: 20, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 13, minHeight: TAP, fontSize: TS.ui, fontWeight: 900, cursor: "pointer", opacity: guardandoPer ? 0.6 : 1, fontFamily: FONT_BODY }}
          >
            {guardandoPer ? "GUARDANDO..." : "GUARDAR PREDETERMINADO"}
          </button>
        </div>
      </div>
    </>
  );

  // ── BARRAS Y DISCOS SUGERIDOS — la pantalla (2026-08-13) ────────────
  // Acá Lucas define los ATAJOS: los pesos que aparecen como botones cuando el
  // alumno registra la carga.
  //
  // NO es un inventario. Corrección textual de Lucas: "no puede basarse en lo
  // que tengo porque trabajamos en distintos gimnasios". Lo que se carga acá
  // es un punto de partida razonable para tocar rápido; el alumno que entrena
  // en otro lado siempre puede escribir el peso a mano en el momento, sin
  // pasar por esta pantalla. Si acá falta la barra de 15, igual la puede
  // registrar.
  const pantallaEquipamiento = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={() => setPantalla("biblioteca")} style={{ ...smallBtn(S.gray) }}>← Volver</button>
        <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, lineHeight: 1, letterSpacing: 0.5, textTransform: "uppercase", flex: 1, minWidth: 0, fontFamily: FONT_DISPLAY }}>
          Barras y discos sugeridos
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ ...card, padding: "10px 14px", marginBottom: 10, color: S.gray, fontSize: TS.body, lineHeight: 1.5 }}>
          Estos son los <b>botones</b> que va a ver el alumno cuando registre el
          peso: toca la barra que agarró y los discos que puso de un lado, y la
          app hace la cuenta. <b>No es un inventario:</b> como los alumnos entrenan
          en gimnasios distintos, el que tenga una barra o un disco que no esté
          acá igual puede escribir el número a mano en el momento. Lo que cargues
          acá es solo el camino rápido para el caso de siempre.
        </div>

        {(equipEdit.barras || []).some((b) => b.confirmar) && (
          <div
            style={{
              ...card,
              padding: "10px 14px",
              marginBottom: 10,
              borderColor: "#b8860b",
              color: "#f0c040",
              fontSize: TS.body,
              lineHeight: 1.5,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle size={18} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <b>{(equipEdit.barras || []).filter((b) => b.confirmar).length} barra(s) con el peso estimado.</b>{" "}
              Nos dijiste que tenés la romana a rulemanes y la EZ olímpica, pero no
              cuánto pesan — el número que está puesto lo puso la app, no vos.
              Pesalas y corregilas acá para que el atajo sea el correcto. (El alumno
              igual puede escribir el peso de su barra en el momento.)
            </div>
          </div>
        )}

        <div style={{ maxWidth: 560 }}>
          <div style={{ ...card, padding: 12, marginBottom: 10 }}>
            <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 8 }}>
              Barras · predeterminada {BARRA_DEFAULT_KG} kg
            </div>
            <div style={{ display: "flex", gap: 6, color: S.lgray, fontSize: TS.chip, fontWeight: 800, padding: "0 2px 6px" }}>
              <span style={{ flex: 1, minWidth: 0 }}>NOMBRE</span>
              <span style={{ width: 84, flexShrink: 0 }}>KILOS</span>
              <span style={{ width: 40, flexShrink: 0 }} />
            </div>
            {(equipEdit.barras || []).map((b, i) => (
              <div key={b.id || i} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    value={b.nombre}
                    onChange={(e) => setBarra(i, "nombre", e.target.value)}
                    style={{ ...inp, flex: 1, minWidth: 0 }}
                  />
                  <input
                    value={String(b.peso ?? "")}
                    onChange={(e) => setBarra(i, "peso", e.target.value)}
                    inputMode="decimal"
                    style={{ ...inp, width: 84, flexShrink: 0, textAlign: "center", fontWeight: 800, ...(b.confirmar ? { borderColor: "#b8860b", color: "#f0c040" } : {}) }}
                  />
                  <button
                    onClick={() => sacarBarra(i)}
                    title="Sacar esta barra"
                    className="di-tap"
                    style={{ ...smallBtn(S.red), padding: "0 8px", minWidth: 40, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
                {b.confirmar && (
                  <div style={{ color: "#f0c040", fontSize: TS.chip, padding: "2px 2px 0" }}>
                    Confirmá el peso — este número lo puso la app, no vos.
                  </div>
                )}
              </div>
            ))}
            <button onClick={agregarBarra} className="di-tap" style={{ ...smallBtn(S.white), width: "100%", marginTop: 6 }}>
              ＋ Agregar barra
            </button>
          </div>

          {[
            // Los discos son DATO REAL: los dijo Lucas el 2026-08-13 ("los
            // discos son de 1.25, 2.5, 5, 10, 15, 20 y 25"). Las mancuernas y
            // los kettlebells todavía no, y la pantalla lo dice en vez de
            // hacerlos pasar por confirmados.
            ["discos", "Discos (los de UN lado)", "El alumno toca los que puso de un lado; la app los multiplica por dos. El juego 1,25 · 2,5 · 5 · 10 · 15 · 20 · 25 lo dio Lucas.", false],
            ["mancuernas", "Mancuernas", "El alumno toca el peso de UNA; si agarró dos, la app duplica.", true],
            ["kettlebells", "Kettlebells", "Igual que las mancuernas, pero con su propia serie de pesos.", true],
          ].map(([clave, titulo, ayuda, sinConfirmar]) => (
            <div key={clave} style={{ ...card, padding: 12, marginBottom: 10 }}>
              <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 4 }}>{titulo}</div>
              <div style={{ color: S.gray, fontSize: TS.chip, marginBottom: 8, lineHeight: 1.45 }}>{ayuda}</div>
              <textarea
                value={textoLista(clave)}
                onChange={(e) => setLista(clave, e.target.value)}
                rows={2}
                placeholder="1,25 · 2,5 · 5 · 10"
                style={{ ...inp, resize: "vertical", lineHeight: 1.5 }}
              />
              <div style={{ color: S.lgray, fontSize: TS.chip, marginTop: 6 }}>
                {(equipEdit[clave] || []).length} peso(s) — separalos con coma o con “·”. Los decimales van con coma (1,25).
              </div>
              {sinConfirmar && (
                <div style={{ color: S.lgray, fontSize: TS.chip, marginTop: 6, lineHeight: 1.4 }}>
                  Son los pesos estándar de gimnasio, puestos como atajo. Ajustalos a
                  los que uses más seguido; el que falte se escribe a mano.
                </div>
              )}
            </div>
          ))}

          <button
            onClick={guardarEquip}
            disabled={guardandoEquip}
            className="di-tap"
            style={{ width: "100%", marginBottom: 20, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 13, minHeight: TAP, fontSize: TS.ui, fontWeight: 900, cursor: "pointer", opacity: guardandoEquip ? 0.6 : 1, fontFamily: FONT_BODY }}
          >
            {guardandoEquip ? "GUARDANDO..." : "GUARDAR LOS ATAJOS"}
          </button>
        </div>
      </div>
    </>
  );

  const pantallaPlanes = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button
          onClick={() => {
            if (planSel) { setPlanSel(null); setPlanForm(null); }
            else setPantalla("biblioteca");
          }}
          style={{ ...smallBtn(S.gray) }}
        >
          ← Volver
        </button>
        <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, lineHeight: 1, letterSpacing: 0.5, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
          {planSel ? "Editar plan" : "Todos los planes"}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {!planSel ? (
          <>
          {!plantillas ? (
            <div style={{ color: S.gray, fontSize: TS.body, textAlign: "center", padding: 30 }}>Cargando planes…</div>
          ) : plantillas.length === 0 ? (
            <div style={{ ...card, padding: 24, textAlign: "center", color: S.gray, fontSize: TS.body }}>
              Todavía no hay planes guardados — crealos con "＋ Crear plan de entrenamiento".
            </div>
          ) : (
            plantillas.map((p) => (
              <div key={p.id} style={{ ...card, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => abrirPlantilla(p)}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: TS.lead, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
                  <div style={{ color: S.gray, fontSize: TS.chip, marginTop: 4 }}>
                    {[p.grupo, labelNivel(p.nivel), `${(p.dias || []).reduce((n, d) => n + (d.ejercicios || []).length, 0)} ejercicio(s)`].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <button onClick={() => abrirPlantilla(p)} className="di-tap" style={{ ...smallBtn(S.white), flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6 }}><Pencil size={16} strokeWidth={2} />Editar</button>
                <button onClick={() => eliminarPlantilla(p)} title="Eliminar plan" className="di-tap" style={{ ...smallBtn(S.red), padding: "0 12px", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={18} strokeWidth={2} /></button>
              </div>
            ))
          )}

          {/* ── Planes de entrenamiento de la base (2026-08-12) ──────────
              Los que se asignan desde "Plan x día". Nombre y descripción se
              editan EN LÍNEA y se guardan al salir del campo: cambiar una
              palabra no puede costar abrir y cerrar un modal. Sin
              confirmación — es reversible; lo que sí se ve es el aviso de
              guardado. */}
          <div style={{ ...eyebrow, fontSize: TS.chip, margin: "22px 0 4px" }}>Planes de entrenamiento</div>
          <div style={{ color: S.gray, fontSize: TS.chip, marginBottom: 10 }}>
            Los que se asignan a cada día del alumno. Podés renombrarlos y cambiarles la descripción — los planes ya
            asignados siguen con el nombre que tenían.
          </div>
          {variantes === null ? (
            <div style={{ color: S.gray, fontSize: TS.body, textAlign: "center", padding: 20 }}>Cargando…</div>
          ) : variantes.length === 0 ? (
            <div style={{ ...card, padding: 20, textAlign: "center", color: S.gray, fontSize: TS.body }}>
              No hay planes de entrenamiento cargados.
            </div>
          ) : (
            variantes.map((v) => (
              <div key={v.id} style={{ ...card, padding: "12px 14px", marginBottom: 8 }}>
                <input
                  value={campoVariante(v, "nombre")}
                  onChange={(e) => editarVariante(v.id, "nombre", e.target.value)}
                  onBlur={() => guardarVariante(v, "nombre")}
                  onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                  title="Renombrar este plan"
                  style={{ ...inp, fontWeight: 700 }}
                />
                <div style={{ color: S.lgray, fontSize: TS.chip, margin: "6px 0 8px" }}>
                  {[v.familia, v.dia_ciclo ? `Día ${v.dia_ciclo}` : null, `${(v.ejercicios || []).length} ejercicio(s)`]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                <textarea
                  value={campoVariante(v, "descripcion")}
                  onChange={(e) => editarVariante(v.id, "descripcion", e.target.value)}
                  onBlur={() => guardarVariante(v, "descripcion")}
                  placeholder="Descripción — qué es este plan y para quién."
                  rows={3}
                  style={{ ...inp, minHeight: 72, resize: "vertical", lineHeight: 1.45, fontSize: TS.body }}
                />
              </div>
            ))
          )}
          </>
        ) : (
          planForm && (
            <div style={{ maxWidth: 560 }}>
              <div style={labelCampo}>Nombre del Plan</div>
              <input value={planForm.nombre} onChange={(e) => setPlanForm((f) => ({ ...f, nombre: e.target.value }))} style={{ ...inp, marginBottom: 8 }} />
              <div style={labelCampo}>Categoría</div>
              <input value={planForm.grupo} onChange={(e) => setPlanForm((f) => ({ ...f, grupo: e.target.value }))} placeholder="ej. Hipertrofia, Fuerza, Básico…" style={{ ...inp, marginBottom: 8 }} />
              <div style={labelCampo}>Nivel</div>
              <div style={{ marginBottom: 12 }}>{nivelChips(planForm.nivel, (v) => setPlanForm((f) => ({ ...f, nivel: v })))}</div>
              {planForm.dias.map((d, di) => (
                <div key={di} style={{ ...card, padding: 12, marginBottom: 10 }}>
                  {planForm.dias.length > 1 && <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 8 }}>{d.dia || `Día ${di + 1}`}</div>}
                  {(d.ejercicios || []).length === 0 && (
                    <div style={{ color: S.gray, fontSize: TS.body, padding: "6px 2px" }}>Sin ejercicios en este día.</div>
                  )}
                  {(d.ejercicios || []).map((ej, i) => (
                    <div key={ej.id || i} style={{ background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, padding: "7px 9px", marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ color: S.gray, fontSize: TS.chip, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: TS.ui, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ej.nombre}</span>
                      <button onClick={() => moverEjPlantilla(di, i, -1)} title="Subir" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▲</button>
                      <button onClick={() => moverEjPlantilla(di, i, 1)} title="Bajar" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▼</button>
                      <button onClick={() => quitarEjPlantilla(di, i)} title="Quitar" className="di-tap" style={{ ...smallBtn(S.red), padding: "0 10px", minWidth: 40, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ ...card, padding: 12, marginBottom: 12 }}>
                <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 8 }}>Agregar ejercicio</div>
                <input value={qPlanAdd} onChange={(e) => setQPlanAdd(e.target.value)} placeholder="Buscar en el catálogo…" style={inp} />
                {sugerenciasPlanAdd.map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", borderBottom: "1px solid " + S.border }}>
                    <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: TS.ui, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {e.nombre_es}{e.codigo_di ? <span style={{ color: S.lgray }}>{" · " + e.codigo_di}</span> : ""}
                    </span>
                    <button onClick={() => agregarEjPlantilla(e)} title="Agregar al plan" className="di-tap" style={{ ...smallBtn(S.white), padding: "0 14px" }}>＋</button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button onClick={() => { setPlanSel(null); setPlanForm(null); }} className="di-tap" style={{ ...smallBtn(S.gray), padding: "12px 18px" }}>
                  Cancelar
                </button>
                <button
                  onClick={guardarPlantilla}
                  disabled={guardandoPlantilla}
                  className="di-tap"
                  style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 13, minHeight: TAP, fontSize: TS.ui, fontWeight: 900, cursor: "pointer", opacity: guardandoPlantilla ? 0.6 : 1, fontFamily: FONT_BODY }}
                >
                  {guardandoPlantilla ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );

  // ── Pantalla de armado ("Plan de Entrenamiento") — ronda 18 ─────────
  // Pantalla DEDICADA (no un drawer sobre la Biblioteca): volver arriba,
  // búsqueda + lista con ＋, y el plan en construcción con sus campos.
  const pantallaArmador = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={cerrarArmador} style={{ ...smallBtn(S.gray) }}>
          ← Volver
        </button>
        <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, lineHeight: 1, letterSpacing: 0.5, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
          Plan de Entrenamiento
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: isWide ? "row" : "column", gap: isWide ? 14 : 10 }}>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ejercicios para el plan…"
            style={{ ...inp, marginBottom: 10 }}
          />
          {grid}
        </div>
        {planPanel}
      </div>
    </>
  );

  // ── Pantalla Biblioteca (default) ───────────────────────────────────
  const pantallaBiblioteca = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {/* minWidth:0 (2026-08-10): sin esto el título no baja de su
            min-content y empujaba el botón "Cerrar" 13px fuera de la pantalla
            en 375px — medido con dev/medir-mobile. */}
        <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, lineHeight: 1, letterSpacing: 0.5, textTransform: "uppercase", flex: 1, minWidth: 0, fontFamily: FONT_DISPLAY }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><BookOpen size={24} strokeWidth={2} />Biblioteca de ejercicios</span>
        </div>
        {!isWide && (
          <button onClick={() => setMostrarFiltros((v) => !v)} className="di-tap" style={{ ...smallBtn(S.gray) }}>
            {mostrarFiltros ? "Ocultar filtros" : "Filtros"}
          </button>
        )}
        <button onClick={onClose} className="di-tap" style={{ ...smallBtn(S.gray), display: "inline-flex", alignItems: "center", gap: 6 }}><X size={16} strokeWidth={2} />Cerrar</button>
      </div>
      {/* Ronda 18: barra de ACCIONES principal — los botones de crear
          salieron del panel de filtros y viven acá arriba, junto con
          "Ver todos los planes". */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <button
          onClick={abrirNuevo}
          className="di-tap"
          style={{ flex: "1 1 180px", minWidth: 0, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY }}
        >
          ＋ Crear ejercicio nuevo
        </button>
        <button
          onClick={() => setPantalla("armador")}
          className="di-tap"
          style={{ flex: "1 1 180px", minWidth: 0, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY }}
        >
          ＋ Crear plan de entrenamiento
        </button>
        <button
          onClick={() => setPantalla("planes")}
          className="di-tap"
          style={{ flex: "1 1 180px", minWidth: 0, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <FolderTree size={16} strokeWidth={2} />Ver todos los planes
        </button>
        {/* 2026-08-10, pedido de Lucas: la movilidad (3 versiones) y la
            entrada en calor también se editan acá, no solo alumno por alumno. */}
        <button
          onClick={() => setPantalla("preparacion")}
          className="di-tap"
          style={{ flex: "1 1 180px", minWidth: 0, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Move size={16} strokeWidth={2} />Movilidad y entrada en calor
        </button>
        {/* 2026-08-10, pedido de Lucas: "lo tendría que poder cambiar el
            predeterminado desde la biblioteca de ejercicios". */}
        <button
          onClick={() => setPantalla("periodizacion")}
          className="di-tap"
          style={{ flex: "1 1 180px", minWidth: 0, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <CalendarRange size={16} strokeWidth={2} />Periodizaciones
        </button>
        {/* 2026-08-13, pedido de Lucas: "tenemos distintas barras, de 20, de
            18, de 11... eso tiene que poder modificarse". Vive acá, al lado de
            la movilidad y las periodizaciones, porque es lo mismo: un
            predeterminado global que él edita y que heredan todos los alumnos.
            OJO con el nombre: son los VALORES POR DEFECTO de los botones, no
            un inventario — los alumnos entrenan en gimnasios distintos y
            siempre pueden escribir un peso que no esté en la lista. */}
        <button
          onClick={() => setPantalla("equipamiento")}
          className="di-tap"
          style={{ flex: "1 1 180px", minWidth: 0, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Weight size={16} strokeWidth={2} />Barras y discos sugeridos
        </button>
      </div>
      {navPropia}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: isWide ? "row" : "column", gap: isWide ? 14 : 10 }}>
        {(isWide || mostrarFiltros) && sidebar}
        {grid}
      </div>
    </>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: S.bg, zIndex: 100, display: "flex", flexDirection: "column", padding: isWide ? "24px 24px 16px" : "14px 12px", overflow: "hidden" }}>
      <style>{cssCatalogo()}</style>
      {pantalla === "planes" ? pantallaPlanes : pantalla === "armador" ? pantallaArmador : pantalla === "preparacion" ? pantallaPreparacion : pantalla === "periodizacion" ? pantallaPeriodizacion : pantalla === "equipamiento" ? pantallaEquipamiento : pantallaBiblioteca}

      {/* detalle */}
      {detalle && form && (
        <div onClick={() => { setDetalle(null); setCreando(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "100%", maxWidth: 460, maxHeight: "92vh", overflowY: "auto", WebkitOverflowScrolling: "touch", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1, fontFamily: FONT_DISPLAY }}>
                {creando ? "Crear ejercicio nuevo" : "Editar ejercicio"}
              </div>
              <button onClick={() => { setDetalle(null); setCreando(false); }} title="Cerrar" className="di-tap" style={{ background: "transparent", border: "none", color: S.gray, cursor: "pointer", width: TAP, height: TAP, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={20} strokeWidth={2} /></button>
            </div>
            {/* media: SOLO se muestra/edita en el flujo de crear nuevo — editar
                un ejercicio existente del catálogo no reemplaza su media
                (punto 4). Para uno existente se ve la media actual de solo
                lectura arriba, sin uploader. */}
            {!creando && (
              <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", marginBottom: 12, display: "flex", justifyContent: "center" }}>
                {detalle.gif_url ? (
                  <img src={catalogoMediaUrl(detalle.gif_url)} alt={form.nombre_es} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }} />
                ) : detalle.image ? (
                  <img src={catalogoMediaUrl(detalle.image)} alt={form.nombre_es} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }} />
                ) : detalle.video ? (
                  <video src={detalle.video} controls playsInline style={{ width: "100%", maxHeight: 260, background: "#000" }} />
                ) : (
                  <div style={{ padding: 40, display: "flex" }}><Dumbbell size={34} color={S.bg} strokeWidth={2} /></div>
                )}
              </div>
            )}
            <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Código</div>
            <input
              value={form.codigo_di}
              onChange={(e) => { setForm((f) => ({ ...f, codigo_di: e.target.value.toUpperCase() })); setCodigoError(""); }}
              placeholder="ej. CO006 (dejar vacío = sin código)"
              style={{ ...inp, marginBottom: codigoError ? 4 : 10, fontWeight: 700, borderColor: codigoError ? S.red : undefined }}
            />
            {codigoError && <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.red, marginBottom: 10 }}>{codigoError}</div>}
            <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Nombre</div>
            <input value={form.nombre_es} onChange={(e) => setForm((f) => ({ ...f, nombre_es: e.target.value }))} style={{ ...inp, marginBottom: 10, fontWeight: 700 }} />
            {detalle.nombre_en && (
              <div style={{ fontSize: TS.chip, color: S.lgray, marginTop: -4, marginBottom: 10 }}>EN: {detalle.nombre_en}</div>
            )}
            {/* Ronda 17 (punto 3): categoría editable con datalist. */}
            <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Categoría</div>
            <input
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
              placeholder="ej. Espalda, Pecho, Core…"
              list="di-catalogo-categorias"
              style={{ ...inp, marginBottom: 10 }}
            />
            <datalist id="di-catalogo-categorias">
              {categorias.map((v) => <option key={v} value={labelCat(v)} />)}
            </datalist>
            {/* Ronda 18: nivel del ejercicio — Inicial/Intermedio/Avanzado,
                visible como badge en la card y filtrable en el sidebar. */}
            <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Nivel</div>
            <div style={{ marginBottom: 10 }}>{nivelChips(form.nivel, (v) => setForm((f) => ({ ...f, nivel: v })))}</div>
            {/* 2026-08-12: cómo se registra este ejercicio. Es lo que va a
                decir el casillero del alumno (KG HOY / REPS HOY / SEG HOY). */}
            <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Se registra en</div>
            <div style={{ marginBottom: 4 }}>{unidadChips(form.unidad, (v) => setForm((f) => ({ ...f, unidad: v })))}</div>
            <div style={{ fontSize: TS.chip, color: S.lgray, marginBottom: 10, lineHeight: 1.45 }}>
              Kilos si lleva carga · Repeticiones si es peso corporal (TRX, fondos, dominadas) · Segundos si es isométrico (plancha).
            </div>
            <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Instrucciones</div>
            <textarea value={form.instrucciones_es} onChange={(e) => setForm((f) => ({ ...f, instrucciones_es: e.target.value }))} rows={5} style={{ ...inp, resize: "vertical", marginBottom: 12, lineHeight: 1.45 }} />
            {/* músculos editables, con ★ predeterminado (punto 4) */}
            <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Músculos trabajados</div>
            <div style={{ marginBottom: 12 }}>
              <TagsEditor
                items={form.musculos}
                defaultItem={form.musculo_default}
                onChange={(musculos) => setForm((f) => ({ ...f, musculos }))}
                onChangeDefault={(musculo_default) => setForm((f) => ({ ...f, musculo_default }))}
                placeholder="Agregar músculo…"
              />
            </div>
            {/* tags editables, con ★ predeterminado (punto 4) */}
            <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Tags (equipamiento y otros)</div>
            <div style={{ marginBottom: 12 }}>
              <TagsEditor
                items={form.tags}
                defaultItem={form.tag_default}
                onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                onChangeDefault={(tag_default) => setForm((f) => ({ ...f, tag_default }))}
                placeholder="Agregar tag…"
              />
            </div>
            {/* video/gif propio: SOLO en el flujo de crear nuevo */}
            {creando && (
              <>
                <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Link video (YouTube o propio)</div>
                <input value={form.video} onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))} placeholder="https://…" style={{ ...inp, marginBottom: 8 }} />
                <div style={{ marginBottom: 12 }}>
                  <SubirVideoInline onUrl={(url) => setForm((f) => ({ ...f, video: url }))} showToast={showToast} />
                </div>
              </>
            )}
            {/* 2026-07-30 — tag REVISAR: mismo camino que archivar (acción de
                estado al pie del detalle), pero neutro: marcar algo para
                mirarlo después no es una alerta, es una nota. */}
            {!creando && detalle.id && revisarOk && (
              <button
                onClick={() => toggleRevisar(detalle)}
                className="di-tap"
                style={{ width: "100%", marginBottom: 10, background: revisarIds.has(detalle.id) ? S.card3 : "transparent", color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.label, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Flag size={14} strokeWidth={2} />
                  {revisarIds.has(detalle.id) ? "Sacar de “Para revisar”" : "Marcar para revisar (algo está raro)"}
                </span>
              </button>
            )}
            {/* Ronda 18: archivar/desarchivar (solo ejercicios existentes) */}
            {!creando && detalle.id && (
              <button
                onClick={() => toggleArchivado(detalle)}
                className="di-tap"
                style={{ width: "100%", marginBottom: 10, background: "transparent", color: detalle.archivado ? S.green : S.yellow, border: "1px solid " + (detalle.archivado ? S.green : S.yellow), borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.label, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY }}
              >
                {detalle.archivado ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><RotateCcw size={14} strokeWidth={2} />Recuperar (sacar del archivo)</span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Archive size={14} strokeWidth={2} />Archivar (ocultar de los listados)</span>
                )}
              </button>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {armadorAbierto && !creando && (
                <button
                  onClick={() => { agregarAlCarrito(detalle); setDetalle(null); }}
                  className="di-tap"
                  style={{ flex: 1, background: S.card2, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: 13, minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY }}
                >
                  ＋ AGREGAR AL PLAN
                </button>
              )}
              <button
                onClick={guardarDetalle}
                disabled={guardando}
                className="di-tap"
                style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 13, minHeight: TAP, fontSize: TS.ui, fontWeight: 900, cursor: "pointer", opacity: guardando ? 0.6 : 1, fontFamily: FONT_BODY }}
              >
                {guardando ? "GUARDANDO..." : creando ? "CREAR" : "GUARDAR"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast con "Deshacer" del archivado rápido (2026-08-10) */}
      {ToastUI}
    </div>
  );
}
