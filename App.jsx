import { useEffect, useRef, useState } from "react";
import { BarChart3, Check, ClipboardList, Dumbbell, NotebookPen, TrendingUp } from "lucide-react";
import { cargarBiblioteca, cargarDatos, cargarFotos, cargarNovedades, cargarPesos, cerrarSesionAuth, guardarDatos, guardarEjercicioBiblioteca, guardarFotoAlumno, payloadAlumno, saveDailyAttendance, saveDailyWeight, supabase } from "./services/supabase.js";
import { BarraEntrenador } from "./src/components/BarraEntrenador.jsx";
import CoachFlotante from "./src/components/CoachFlotante.jsx";
import { EstudioBioSeccion } from "./src/components/EstudioBio.jsx";
import { EvolucionCargas } from "./src/components/EvolucionCargas.jsx";
import { FechaRapida } from "./src/components/FechaRapida.jsx";
import { FotoAlumno } from "./src/components/FotoAlumno.jsx";
import { GlobalStyles } from "./src/components/GlobalStyles.jsx";
import { HeaderAlumno } from "./src/components/HeaderAlumno.jsx";
import { IconDock } from "./src/components/IconDock.jsx";
import { Logo3D } from "./src/components/Logo3D.jsx";
import PlanDelDia from "./src/components/PlanDelDia.jsx";
import PullToRefresh from "./src/components/PullToRefresh.jsx";
import { ResumenMensual } from "./src/components/ResumenMensual.jsx";
import { SelectorAlumnoEntrenador } from "./src/components/SelectorAlumnoEntrenador.jsx";
import { Toast } from "./src/components/Toast.jsx";
import VistaVideoAlumno from "./src/components/VistaVideoAlumno.jsx";
import { AdminPanel } from "./src/screens/AdminPanel.jsx";
import { Bienvenida } from "./src/screens/Bienvenida.jsx";
import { Diario } from "./src/screens/Diario.jsx";
import { Login } from "./src/screens/Login.jsx";
import { NovedadesAlumno } from "./src/screens/NovedadesAlumno.jsx";
import { ORDEN_DIAS, RM_EJS, diasDeTodosLosPlanes, ejerciciosDeTodosLosPlanes, getSemanaActual, hoy, initH, initPesos, mesActual, registroAsistencia, unirHistorialesPorEjercicio } from "./src/utils/helpers.js";
import { ICON_BLACK_CROP, ICON_WHITE_CROP, aplicarIconosTema } from "./src/utils/iconos.js";
import { generarPDF } from "./src/utils/pdfGenerator.js";
import { pesoRepresentativo, setVuelta, vueltasCargadas, vueltasDe } from "./src/utils/pesos.js";
import { FONT_BODY, FONT_DISPLAY, S, TAP, applyTheme, card, tabN1, useIsWide } from "./src/utils/theme.js";

// Re-export para dev/harness.jsx (banco de pruebas), que importa estos desde acá.
export { EjercicioEditor } from "./src/components/editores/EjercicioEditor.jsx";
export { DiasEditor } from "./src/components/editores/DiasEditor.jsx";
export { GlobalStyles } from "./src/components/GlobalStyles.jsx";
export { AdminPanel } from "./src/screens/AdminPanel.jsx";

const ALUMNOS_INIT = [];
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
