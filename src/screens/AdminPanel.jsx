import { useEffect, useMemo, useRef, useState } from "react";
import { cargarBioimpedanciaCompleta, cargarCatalogoCached, cargarPesos, cargarPlanesXDia, crearAlumnoConPIN, crearPlanAlumno, deleteAlumno, eliminarPlanDia, getPrepGlobales, guardarPeriodizacionDia, listarAdmins, listarPeriodizacionesConNombres, listarVariantesPlan, propagarEjercicioATodos } from "../../services/supabase.js";
import CatalogoExplorer from "../components/CatalogoExplorer.jsx";
import { GlobalStyles } from "../components/GlobalStyles.jsx";
import SelectorPlanDia from "../components/SelectorPlanDia.jsx";
import { useDeshacer } from "../components/ToastDeshacer.jsx";
import { calcularEdad, mesActual, RM_EJS } from "../utils/helpers.js";
import { ICON_BLACK } from "../utils/iconos.js";
import { clavePeriodizacion, conPeriodizacionDe, conPeriodizacionEditada, etiquetaPeriodizacion, propagarPeriodizacion, refPeriodizacion, sinPeriodizacion, tienePeriodizacion } from "../utils/periodizacion.js";
import { clonarPlan, getPlantilla } from "../utils/planTemplates.js";
import { agruparVariantes, indexarCatalogo, planDeEleccion, SIN_PLAN, varianteAPlan } from "../utils/planVariantes.js";
import { conPrepPropia, sinPrepPropia } from "../utils/preparacion.js";
import { S, useIsWide } from "../utils/theme.js";
import { BibliotecaScreen } from "./BibliotecaScreen.jsx";
import { DiarioAdmin } from "./DiarioAdmin.jsx";
import { PIN_TRIVIAL, modalidadLabel } from "./admin/helpers.js";
import { SeccionDashboard } from "./admin/SeccionDashboard.jsx";
import { SeccionAlumno } from "./admin/SeccionAlumno.jsx";
import { SeccionEjercicios } from "./admin/SeccionEjercicios.jsx";
import { SeccionPlanes } from "./admin/SeccionPlanes.jsx";
import { SeccionReportes } from "./admin/SeccionReportes.jsx";
import { SeccionEvaluacion } from "./admin/SeccionEvaluacion.jsx";
import { SeccionConfig } from "./admin/SeccionConfig.jsx";
import { CabeceraAdmin } from "./admin/CabeceraAdmin.jsx";

// ── ADMIN PANEL ───────────────────────────────────────────────────────
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
      <CabeceraAdmin
          al={al} alumnos={alumnos} darkMode={darkMode} onClose={onClose} onModoEntrenador={onModoEntrenador}
          onToggleTheme={onToggleTheme} sec={sec} selId={selId} setForm={setForm} setSec={setSec} setSelId={setSelId}
          setShowCatalogo={setShowCatalogo}
        />{" "}
      <div style={{ padding: "0 16px" }}>
        {" "}
        {sec === "dashboard" && <SeccionDashboard
          alumnos={alumnos} catalogoIdx={catalogoIdx} crearAlumno={crearAlumno} DIAS_SEM={DIAS_SEM}
          ejecutarConDeshacer={ejecutarConDeshacer} gruposVariantes={gruposVariantes} na={na} nc={nc} ndias={ndias}
          ne={ne} nfecha={nfecha} ngenero={ngenero} nmodalidad={nmodalidad} nn={nn} np={np} npin={npin}
          nsubiendo={nsubiendo} ntemplate={ntemplate} ntipo={ntipo} nvideo={nvideo} onUpdate={onUpdate}
          planVisor={planVisor} selId={selId} setForm={setForm} setNa={setNa} setNc={setNc} setNdias={setNdias}
          setNe={setNe} setNfecha={setNfecha} setNgenero={setNgenero} setNmodalidad={setNmodalidad} setNn={setNn}
          setNp={setNp} setNpin={setNpin} setNsubiendo={setNsubiendo} setNtipo={setNtipo} setNvideo={setNvideo}
          setPlanVisor={setPlanVisor} setSec={setSec} setSelId={setSelId} setShowCatalogo={setShowCatalogo}
          setShowCrearAlumno={setShowCrearAlumno} showCrearAlumno={showCrearAlumno} showToast={showToast}
        />}{" "}
        {sec === "alumnos" && al && <SeccionAlumno
          al={al} alumnos={alumnos} biblioteca={biblioteca} DIAS_SEM={DIAS_SEM} editPin={editPin}
          eliminarAlumno={eliminarAlumno} form={form} guardarParaTodos={guardarParaTodos} nsubiendo={nsubiendo}
          onGuardarBiblioteca={onGuardarBiblioteca} onUpdate={onUpdate} saveEdit={saveEdit} setEditPin={setEditPin}
          setForm={setForm} setNsubiendo={setNsubiendo} setPlanesTab={setPlanesTab} setPlanFoco={setPlanFoco}
          setPlanTab={setPlanTab} setSec={setSec} setSelectedDia={setSelectedDia}
          setShowAsignarPlan={setShowAsignarPlan} showAsignarPlan={showAsignarPlan} showToast={showToast}
          startEdit={startEdit}
        />}{" "}
        {sec === "plan" && <SeccionEjercicios
          al={al} alumnos={alumnos} biblioteca={biblioteca} guardarParaTodos={guardarParaTodos}
          guardarPrepAlumno={guardarPrepAlumno} moviVer={moviVer} onGuardarBiblioteca={onGuardarBiblioteca}
          onUpdate={onUpdate} planFoco={planFoco} planTab={planTab} prepGlobales={prepGlobales} rm={rm}
          setDiasModo={setDiasModo} setMoviDefault={setMoviDefault} setMoviVer={setMoviVer}
          setPlanesTab={setPlanesTab} setPlanTab={setPlanTab} setSec={setSec} setSeccionesConfig={setSeccionesConfig}
          showToast={showToast} updatePlan={updatePlan} volverPrepGlobal={volverPrepGlobal}
        />}{" "}
        {/* ── Grupo PLANES: Periodización · Plan x día (ronda 10: se sacó el
            subtab "Eval. peso max" de acá — Lucas ahora carga los pesos
            máximos entrando como el alumno vía Modo Entrenador, no desde el
            admin; el bloque planesTab==="rm" que quedaba sin usar se borró
            el 2026-08-18). ── */}
        {sec === "planes" && <SeccionPlanes
          agregandoDia={agregandoDia} al={al} asignarPeriodizacion={asignarPeriodizacion}
          guardarPeriodizacionAlumno={guardarPeriodizacionAlumno}
          guardarPeriodizacionDelDia={guardarPeriodizacionDelDia}
          hacerPeriodizacionPropiaDelDia={hacerPeriodizacionPropiaDelDia} perDiaSel={perDiaSel}
          perNombres={perNombres} planesTab={planesTab} sacarPeriodizacion={sacarPeriodizacion}
          selectedDia={selectedDia} selectorDePlan={selectorDePlan} setAgregandoDia={setAgregandoDia}
          setPerDiaSel={setPerDiaSel} setPlanesTab={setPlanesTab} setSelectedDia={setSelectedDia}
          volverACompartirPeriodizacion={volverACompartirPeriodizacion}
          volverPeriodizacionGlobal={volverPeriodizacionGlobal}
        />}{" "}
        {/* ── Grupo REPORTES: Asistencia · Historial ──
             (Bioimpedancia se movió al módulo Evaluación) */}
        {sec === "reportes" && <SeccionReportes
          al={al} alumnos={alumnos} exportarReporteMensual={exportarReporteMensual} onUpdate={onUpdate}
          repMes={repMes} repTab={repTab} setRepMes={setRepMes} setRepTab={setRepTab} showToast={showToast}
        />}{" "}
        {sec === "diario" && <DiarioAdmin alumnos={alumnos} onUpdate={onUpdate} showToast={showToast} />}{" "}
        {sec === "evaluacion" && al && <SeccionEvaluacion al={al} evalTab={evalTab} setEvalTab={setEvalTab} showToast={showToast} />}{" "}
        {sec === "config" && <SeccionConfig
          abrirEdicionAdmin={abrirEdicionAdmin} admCodigo={admCodigo} adminsList={adminsList} admNombre={admNombre}
          admPin={admPin} admRol={admRol} cargarAdminsList={cargarAdminsList} configTab={configTab}
          editAdminPin={editAdminPin} editandoAdminId={editandoAdminId} editCodigo={editCodigo}
          editNombre={editNombre} novedades={novedades} onNovedadesChange={onNovedadesChange}
          setAdmCodigo={setAdmCodigo} setAdminsList={setAdminsList} setAdmNombre={setAdmNombre} setAdmPin={setAdmPin}
          setAdmRol={setAdmRol} setConfigTab={setConfigTab} setEditAdminPin={setEditAdminPin}
          setEditandoAdminId={setEditandoAdminId} setEditCodigo={setEditCodigo} setEditNombre={setEditNombre}
          setSec={setSec} showToast={showToast}
        />}{" "}
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
