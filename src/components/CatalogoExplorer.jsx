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
import { useEffect, useMemo, useState } from "react";
import { FONT_BODY, S, TS, useIsWide } from "../utils/theme.js";
import { uid } from "../utils/helpers.js";
import { unidadDe } from "../utils/unidades.js";
import { useDeshacer } from "./ToastDeshacer.jsx";
import { actualizarPlanPredeterminado, agregarCatalogoABiblioteca, cargarCatalogoCached, catalogoMediaUrl, crearEjercicioCatalogo, crearPlanPredeterminado, eliminarPlanPredeterminado, getPrepGlobales, guardarEjercicioCatalogo, guardarPeriodizacion, listarPeriodizacionesConNombres, listarPlanesPredeterminados, listarVariantesPlan, renombrarCategoriaCatalogo, renombrarCodigoEjercicio, renombrarPeriodizacion, renombrarVariantePlan, setAppConfig, supabase, validarCodigoDisponible } from "../../services/supabase.js";
// gifAlRenombrar (2026-08-12): para NO perder la ilustración al renombrar un
// ejercicio que la resolvía por nombre.
import { gifAlRenombrar } from "../utils/ejerciciosMedia.js";
import { claveConfigPrep, listaGlobal, PREP_LISTAS } from "../utils/preparacion.js";
// NIVELES (catalogo/helpers.js) tiene otro significado (nivel del ejercicio),
// así que los de periodización entran con alias.
import { clavePeriodizacion, etiquetaPeriodizacion, NIVELES as NIVELES_PER, OBJETIVOS as OBJETIVOS_PER } from "../utils/periodizacion.js";
// Refactor 2026-08-17: constantes puras, piezas y pantallas del catálogo viven
// en ./catalogo/. Todo el estado y los handlers siguen acá.
import { PAGE, labelCat, labelEq, labelNivel, labelTg } from "./catalogo/helpers.js";
import { Sidebar } from "./catalogo/Sidebar.jsx";
import { Grid } from "./catalogo/Grid.jsx";
import { PantallaPreparacion } from "./catalogo/PantallaPreparacion.jsx";
import { PantallaPeriodizacion } from "./catalogo/PantallaPeriodizacion.jsx";
import { PantallaPlanes } from "./catalogo/PantallaPlanes.jsx";
import { PantallaArmador } from "./catalogo/PantallaArmador.jsx";
import { PantallaBiblioteca } from "./catalogo/PantallaBiblioteca.jsx";
import { DetalleEjercicio } from "./catalogo/DetalleEjercicio.jsx";

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

  const sidebar = <Sidebar
    categorias={categorias} equipos={equipos} fCat={fCat} fEq={fEq} fNivel={fNivel} fPre={fPre} fTg={fTg}
    hayFiltrosActivos={hayFiltrosActivos} isWide={isWide} limpiarFiltros={limpiarFiltros} prefijos={prefijos}
    q={q} renombrarCategoria={renombrarCategoria} revisarIds={revisarIds} revisarOk={revisarOk}
    setFCat={setFCat} setFEq={setFEq} setFNivel={setFNivel} setFPre={setFPre} setFTg={setFTg} setQ={setQ}
    setSoloDI={setSoloDI} setVerArchivados={setVerArchivados} setVerRevisar={setVerRevisar} soloDI={soloDI}
    targets={targets} toggle={toggle} verArchivados={verArchivados} verRevisar={verRevisar}
  />;

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

  const grid = <Grid
    abrirDetalle={abrirDetalle} agregarAlCarrito={agregarAlCarrito} archivarRapido={archivarRapido}
    armadorAbierto={armadorAbierto} badgesActivos={badgesActivos} carrito={carrito} cat={cat}
    clusters={clusters} filtrados={filtrados} hayFiltrosActivos={hayFiltrosActivos} hoverId={hoverId}
    isWide={isWide} limpiarFiltros={limpiarFiltros} orden={orden} revisarIds={revisarIds}
    setHoverId={setHoverId} setOrden={setOrden} setVisibles={setVisibles} visibles={visibles}
  />;

  const labelCampo = { fontSize: TS.chip, color: S.gray, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 6, fontFamily: FONT_BODY };

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

  const pantallaPreparacion = <PantallaPreparacion
    agregarPrep={agregarPrep} cat={cat} guardandoPrep={guardandoPrep} guardarPrep={guardarPrep}
    moverPrep={moverPrep} onAbrirPropia={onAbrirPropia} prepLista={prepLista} prepSel={prepSel}
    qPrepAdd={qPrepAdd} quitarPrep={quitarPrep} setPantalla={setPantalla} setPrepSel={setPrepSel}
    setQPrepAdd={setQPrepAdd}
  />;

  const pantallaPeriodizacion = <PantallaPeriodizacion
    agregarSemana={agregarSemana} guardandoPer={guardandoPer} guardarNombrePer={guardarNombrePer}
    guardarPer={guardarPer} perNiv={perNiv} perNombreVisible={perNombreVisible} perObj={perObj}
    perSemanas={perSemanas} quitarSemana={quitarSemana} setPantalla={setPantalla} setPerCampo={setPerCampo}
    setPerNiv={setPerNiv} setPerNombreDraft={setPerNombreDraft} setPerObj={setPerObj}
  />;

  const pantallaPlanes = <PantallaPlanes
    abrirPlantilla={abrirPlantilla} agregarEjPlantilla={agregarEjPlantilla} campoVariante={campoVariante}
    editarVariante={editarVariante} eliminarPlantilla={eliminarPlantilla}
    guardandoPlantilla={guardandoPlantilla} guardarPlantilla={guardarPlantilla}
    guardarVariante={guardarVariante} labelCampo={labelCampo} moverEjPlantilla={moverEjPlantilla}
    planForm={planForm} planSel={planSel} plantillas={plantillas} qPlanAdd={qPlanAdd}
    quitarEjPlantilla={quitarEjPlantilla} setPantalla={setPantalla} setPlanForm={setPlanForm}
    setPlanSel={setPlanSel} setQPlanAdd={setQPlanAdd} sugerenciasPlanAdd={sugerenciasPlanAdd}
    variantes={variantes}
  />;

  const pantallaArmador = <PantallaArmador
    armadorAbierto={armadorAbierto} carrito={carrito} cerrarArmador={cerrarArmador} grid={grid}
    grupoPlan={grupoPlan} guardandoPlan={guardandoPlan} guardarPlan={guardarPlan} isWide={isWide}
    labelCampo={labelCampo} moverCarrito={moverCarrito} nivelPlan={nivelPlan} nombrePlan={nombrePlan} q={q}
    setCarrito={setCarrito} setGrupoPlan={setGrupoPlan} setNivelPlan={setNivelPlan}
    setNombrePlan={setNombrePlan} setQ={setQ}
  />;

  const pantallaBiblioteca = <PantallaBiblioteca
    abrirNuevo={abrirNuevo} grid={grid} isWide={isWide} mostrarFiltros={mostrarFiltros} navPropia={navPropia}
    onClose={onClose} setMostrarFiltros={setMostrarFiltros} setPantalla={setPantalla} sidebar={sidebar}
  />;

  return (
    <div style={{ position: "fixed", inset: 0, background: S.bg, zIndex: 100, display: "flex", flexDirection: "column", padding: isWide ? "24px 24px 16px" : "14px 12px", overflow: "hidden" }}>
      <style>{cssCatalogo()}</style>
      {pantalla === "planes" ? pantallaPlanes : pantalla === "armador" ? pantallaArmador : pantalla === "preparacion" ? pantallaPreparacion : pantalla === "periodizacion" ? pantallaPeriodizacion : pantallaBiblioteca}

      {/* detalle */}
      {detalle && form && (
        <DetalleEjercicio
          agregarAlCarrito={agregarAlCarrito} armadorAbierto={armadorAbierto} categorias={categorias}
          codigoError={codigoError} creando={creando} detalle={detalle} form={form} guardando={guardando}
          guardarDetalle={guardarDetalle} revisarIds={revisarIds} revisarOk={revisarOk}
          setCodigoError={setCodigoError} setCreando={setCreando} setDetalle={setDetalle} setForm={setForm}
          showToast={showToast} toggleArchivado={toggleArchivado} toggleRevisar={toggleRevisar}
        />
      )}
      {/* Toast con "Deshacer" del archivado rápido (2026-08-10) */}
      {ToastUI}
    </div>
  );
}
