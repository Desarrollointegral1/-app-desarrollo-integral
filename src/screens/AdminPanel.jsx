import { useEffect, useMemo, useRef, useState } from "react";
import { Ban, BarChart3, BookOpen, Calendar, Check, Dumbbell, Eye, Megaphone, Moon, NotebookPen, Pencil, Play, Power, Settings, Stethoscope, Sun, Target, Trash2, X } from "lucide-react";
import { actualizarAdmin, actualizarRolAdmin, cambiarPINAlumno, cargarBioimpedanciaCompleta, cargarCatalogoCached, cargarPesos, cargarPlanesXDia, crearAdmin, crearAlumnoConPIN, crearNovedad, crearPlanAlumno, deleteAlumno, desactivarAdmin, eliminarNovedad, eliminarPlanDia, getPrepGlobales, guardarFotoAlumno, guardarPeriodizacionDia, listarAdmins, listarPeriodizacionesConNombres, listarVariantesPlan, propagarEjercicioATodos, saveDailyAttendance, subirMediaRehab, toggleNovedad } from "../../services/supabase.js";
import { AlumnoBuscador } from "../components/AlumnoBuscador.jsx";
import CatalogoExplorer from "../components/CatalogoExplorer.jsx";
import { EjercicioEditor } from "../components/editores/EjercicioEditor.jsx";
import { PeriodizacionEditor } from "../components/editores/PeriodizacionEditor.jsx";
import { PrepEditorAlumno } from "../components/editores/PrepEditorAlumno.jsx";
import { EntradaDiarioAdmin } from "../components/EntradaDiarioAdmin.jsx";
import { EstudioBioSeccion } from "../components/EstudioBio.jsx";
import { FotoAlumno } from "../components/FotoAlumno.jsx";
import { GlobalStyles } from "../components/GlobalStyles.jsx";
import { IconDock } from "../components/IconDock.jsx";
import { ProtocoloEvaluacionSeccion } from "../components/ProtocoloEvaluacion.jsx";
import SelectorDiasAlta from "../components/SelectorDiasAlta.jsx";
import SelectorPlanDia from "../components/SelectorPlanDia.jsx";
import { useDeshacer } from "../components/ToastDeshacer.jsx";
import VideosMovilidadAdmin from "../components/VideosMovilidadAdmin.jsx";
import { ORDEN_DIAS, RM_EJS, calcularEdad, hoy, mesActual, registroAsistencia } from "../utils/helpers.js";
import { ICON_BLACK, ICON_CROP } from "../utils/iconos.js";
import { NIVELES as NIVELES_PER, OBJETIVOS as OBJETIVOS_PER, clavePeriodizacion, conPeriodizacionDe, conPeriodizacionEditada, esPeriodizacionDiaPropia, esPeriodizacionPropia, etiquetaPeriodizacion, periodizacionDelDia, propagarPeriodizacion, refPeriodizacion, sinPeriodizacion, tienePeriodizacion } from "../utils/periodizacion.js";
import { clonarPlan, getPlantilla } from "../utils/planTemplates.js";
import { SIN_PLAN, agruparVariantes, etiquetaVariante, indexarCatalogo, planDeEleccion, varianteAPlan } from "../utils/planVariantes.js";
import { conPrepPropia, sinPrepPropia } from "../utils/preparacion.js";
import { FONT_BODY, FONT_DISPLAY, S, TAP, TS, card, chipN4, eyebrow, innerCard, inp, n4Track, segChip, segTrack, smallBtn, useIsWide } from "../utils/theme.js";
import { AsignarPlanModal } from "./AsignarPlanModal.jsx";
import { BibliotecaScreen } from "./BibliotecaScreen.jsx";
import { Dashboard } from "./Dashboard.jsx";
import { DiarioAdmin } from "./DiarioAdmin.jsx";
import { HistorialAdmin } from "./HistorialAdmin.jsx";
import { NovedadesAdmin } from "./NovedadesAdmin.jsx";
import { PlanesPrincipales } from "./PlanesPrincipales.jsx";
import { ReportesAlumno } from "./ReportesAlumno.jsx";

// PIN demasiado fácil (auditoría 2026-08-02): repetidos (0000..9999) o
// secuencias ascendentes/descendentes (1234, 4321, 2345...). Sube el piso
// real de seguridad más que casi cualquier otra cosa por lo barato que es.
const PIN_TRIVIAL = (p) => /^(\d)\1{3}$/.test(p) || "0123456789".includes(p) || "9876543210".includes(p);

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
