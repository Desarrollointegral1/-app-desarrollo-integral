import { useEffect, useRef, useState } from "react";
import { Pencil, Play, X } from "lucide-react";
import { agregarCatalogoABiblioteca, cargarCatalogoCached, catalogoMediaUrl } from "../../../services/supabase.js";
import { SIN_GIF, resolverGif } from "../../utils/ejerciciosMedia.js";
import { uid } from "../../utils/helpers.js";
import { S, TAP, TS, card, inp, smallBtn } from "../../utils/theme.js";
import AsistenteEjercicio, { llamarAsistente as llamarAsistenteReal } from "../AsistenteEjercicio.jsx";
import { BuscadorEjercicioNombre } from "../BuscadorEjercicioNombre.jsx";
import { GifEjercicio } from "../GifEjercicio.jsx";

// Lista de ejercicios predefinidos para autocompletado
const EJS_SUGERIDOS = [
  // Movilidad
  "Obelisco","Sentadilla de Activacion de Peso","Movilidad de cadera","Puente invertido mesa","Dorsiflexion del tobillo","Bicho muerto","Estiramiento del gato","Superman en cuadrupedia","Rotaciones toracicas","Plancha isometrica 15s","Espinales nados",
  // Entrada en calor (banda)
  "Remo a un brazo (banda)","Jalon brazos estirados (banda)","Rotacion interna (banda)","Rotacion externa (banda)","Aperturas (banda)","Press Paloff (banda)",
  // Activacion (disco/mancuerna)
  "Rotacion con disco","Buenos dias con disco","Jalon con mancuerna","Remo con disco","Peso muerto a una pierna sin peso","Sentadilla bulgara sin peso",
  // Principales Bilateral
  "Fuerza con impulso con barra","Sentadilla con barra","Pecho plano con barra","Peso muerto con barra","Jalon al pecho / Maquina dorsales","Hip Thrust bilateral",
  // Principales Unilateral
  "Fuerza con impulso a un brazo","Zancada a una pierna","Pecho inclinado con mancuerna","Peso muerto a una pierna","Remo a un brazo","Levantada de cadera a una pierna",
  // Extras comunes
  "Curl de biceps","Extension de triceps","Elevaciones laterales","Face pull","Remo con barra","Pull over","Fondos en paralelas","Step up","Glute bridge","Good morning",
];
// ── EJERCICIO EDITOR ──────────────────────────────────────────────────
// onGuardarParaTodos (ronda 11, opcional): si se pasa, en modo edición
// aparece un segundo botón "GUARDAR PARA TODOS" además del "GUARDAR" de
// siempre. "GUARDAR" solo cambia la copia de ESTE alumno; "GUARDAR PARA
// TODOS" además actualiza el maestro (biblioteca_ejercicios) y propaga el
// cambio a todos los alumnos que tengan este mismo ejercicio — ver
// propagarEjercicioATodos en services/supabase.js.
// gif (ronda 12): asociación manual — ver GifPicker arriba.
// export (2026-08-09): lo monta también dev/harness.jsx, el banco de pruebas
// que permite ver y tocar este editor sin pasar por el login ni por la base.
// No cambia nada de cómo lo usa App.jsx.
// llamarAsistente / subirMedia (2026-08-09): entran por prop con el default
// real para que dev/harness.jsx pueda mockearlos — el banco de pruebas no tiene
// sesión de Supabase, así que sin esto el armador asistido no se puede ver.
export function EjercicioEditor({ items, onChange, showVideo, biblioteca = [], onGuardarBiblioteca, onGuardarParaTodos, llamarAsistente = llamarAsistenteReal, subirMedia }) {
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ nombre: "", desc: "", video: "", mediaLocal: "", gif: "" });
  const [sugs, setSugs] = useState([]); // sugerencias de biblioteca activas
  const [showSugs, setShowSugs] = useState(false);
  const [propagando, setPropagando] = useState(false);

  const startEdit = (i) => {
    setEditIdx(i);
    setForm({
      nombre: items[i].nombre,
      desc: items[i].desc,
      video: items[i].video || "",
      mediaLocal: items[i].mediaLocal || "",
      gif: items[i].gif || "",
    });
    setSugs([]); setShowSugs(false);
  };
  const startNew = () => {
    setEditIdx(-1);
    setForm({ nombre: "", desc: "", video: "", mediaLocal: "", gif: "" });
    setSugs([]); setShowSugs(false);
  };
  const cancel = () => {
    setEditIdx(null);
    setForm({ nombre: "", desc: "", video: "", mediaLocal: "", gif: "" });
    setSugs([]); setShowSugs(false);
  };
  const save = () => {
    if (!form.nombre.trim()) return;
    const updated = [...items];
    if (editIdx === -1) updated.push({ ...form, id: uid(), historial: [] });
    else updated[editIdx] = { ...updated[editIdx], ...form };
    onChange(updated);
    // Auto-guardar en biblioteca si tiene video o GIF manual
    if ((form.video || form.gif) && onGuardarBiblioteca) {
      onGuardarBiblioteca({ nombre: form.nombre, desc: form.desc, video: form.video, gif: form.gif });
    }
    cancel();
  };
  // Ronda 11: "Guardar para todos" — solo tiene sentido editando un
  // ejercicio EXISTENTE (editIdx >= 0), no al crear uno nuevo.
  const saveParaTodos = async () => {
    if (!form.nombre.trim() || editIdx === null || editIdx === -1 || !onGuardarParaTodos) return;
    const original = items[editIdx];
    const updated = [...items];
    updated[editIdx] = { ...updated[editIdx], ...form };
    onChange(updated);
    if ((form.video || form.gif) && onGuardarBiblioteca) {
      onGuardarBiblioteca({ nombre: form.nombre, desc: form.desc, video: form.video, gif: form.gif });
    }
    setPropagando(true);
    try {
      await onGuardarParaTodos({ codigo: original.codigo || null, nombreOriginal: original.nombre, form });
    } finally {
      setPropagando(false);
    }
    cancel();
  };
  // B5 (ronda 14): el buscador busca TAMBIÉN en el catálogo completo
  // (1.344 del dataset + custom DI). Se carga lazy la primera vez que se
  // tipea; los resultados de catálogo aparecen después de los de la
  // biblioteca curada, sin duplicar nombres.
  const _catalogoRef = useRef(null);
  // ── SUGERENCIAS DEL MODELO (2026-08-09) ───────────────────────────────
  // Sólo cuando la búsqueda local NO encontró nada y hay 3+ caracteres: el
  // catálogo de 1.343 sigue mandando, esto es el paréntesis para el ejercicio
  // que todavía no existe. Debounce de 400ms + un contador de secuencia porque
  // el profe escribe rápido: sin cancelar la anterior, la respuesta vieja llega
  // después y pisa la lista con sugerencias de un texto que ya no está escrito.
  const asistRef = useRef({ timer: null, seq: 0 });
  const [sugsIA, setSugsIA] = useState({ cargando: false, error: "" });
  useEffect(() => () => clearTimeout(asistRef.current.timer), []);
  const pedirSugerenciasIA = (val, hayLocales) => {
    clearTimeout(asistRef.current.timer);
    const seq = ++asistRef.current.seq;
    if (hayLocales || val.trim().length < 3) {
      if (sugsIA.cargando || sugsIA.error) setSugsIA({ cargando: false, error: "" });
      return;
    }
    setSugsIA({ cargando: true, error: "" });
    asistRef.current.timer = setTimeout(async () => {
      try {
        const { sugerencias } = await llamarAsistente({ accion: "sugerir", texto: val.trim() });
        if (seq !== asistRef.current.seq) return; // llegó tarde: ya se escribió otra cosa
        setSugsIA({ cargando: false, error: "" });
        const nuevas = (sugerencias || []).map((s) => ({ nombre: s.nombre, desc: "", video: "", nuevo: s.origen === "nuevo" }));
        if (!nuevas.length) return;
        // Se AGREGAN al final: lo local (biblioteca y catálogo) va siempre primero.
        setSugs((prev) => [...prev, ...nuevas.filter((n) => !prev.some((p) => p.nombre.toLowerCase() === n.nombre.toLowerCase()))]);
        setShowSugs(true);
      } catch (e) {
        if (seq !== asistRef.current.seq) return;
        setSugsIA({ cargando: false, error: e.message || "No se pudieron traer sugerencias." });
      }
    }, 400);
  };
  const handleNombreChange = (val) => {
    setForm((f) => ({ ...f, nombre: val }));
    // 2026-07-30: con el campo vacío (o con 1 letra) ya se muestra la lista de
    // la biblioteca curada, para poder ELEGIR sin saber qué escribir. El
    // catálogo completo de 1.343 entra recién desde 2 caracteres — listarlo
    // entero sin filtro no ayuda a nadie y hay que bajarlo.
    if (val.length < 2) {
      if (!_catalogoRef.current) {
        _catalogoRef.current = [];
        cargarCatalogoCached().then((c) => { _catalogoRef.current = c; });
      }
      const iniciales = biblioteca.slice(0, 12);
      setSugs(iniciales);
      setShowSugs(iniciales.length > 0);
      pedirSugerenciasIA(val, true); // con 0-1 letras nunca se llama al modelo
      return;
    }
    if (val.length >= 2) {
      if (!_catalogoRef.current) {
        _catalogoRef.current = [];
        cargarCatalogoCached().then((c) => { _catalogoRef.current = c; });
      }
      const q = val.toLowerCase();
      // Punto 6 (2026-07-21): además del nombre, matchea por músculo o tag
      // — usa musculos/tags editables si el admin ya los cargó, si no cae
      // a los campos originales del dataset (target_es/secondary_muscles_es
      // para músculo, equipment_es para tag).
      const matchCatalogo = (c) => {
        if (c.nombre_es.toLowerCase().includes(q) || (c.nombre_en || "").toLowerCase().includes(q)) return true;
        const musc = c.musculos && c.musculos.length ? c.musculos : [c.target_es, ...(c.secondary_muscles_es || [])].filter(Boolean);
        if (musc.some((m) => (m || "").toLowerCase().includes(q))) return true;
        const tgs = c.tags && c.tags.length ? c.tags : [c.equipment_es].filter(Boolean);
        if (tgs.some((t) => (t || "").toLowerCase().includes(q))) return true;
        return false;
      };
      const deCatalogo = (Array.isArray(_catalogoRef.current) ? _catalogoRef.current : [])
        .filter(matchCatalogo)
        .slice(0, 6)
        .map((c) => ({
          nombre: c.nombre_es,
          desc: c.instrucciones_es || "",
          video: c.video || "",
          codigo: c.codigo_di || null,
          gif: catalogoMediaUrl(c.gif_url || ""),
          _catalogo: c,
        }));
      const matches = [
        ...biblioteca.filter((b) => b.nombre.toLowerCase().includes(q)),
        ...deCatalogo.filter((c) => !biblioteca.find((b) => b.nombre.toLowerCase() === c.nombre.toLowerCase())),
        ...EJS_SUGERIDOS.filter((n) => n.toLowerCase().includes(q) && !biblioteca.find((b) => b.nombre.toLowerCase() === n.toLowerCase())).map((n) => ({ nombre: n, desc: "", video: "" })),
      ].slice(0, 10);
      setSugs(matches);
      setShowSugs(matches.length > 0);
      pedirSugerenciasIA(val, matches.length > 0);
    } else {
      setSugs([]); setShowSugs(false);
      pedirSugerenciasIA(val, true);
    }
  };
  const selectSug = (sug) => {
    if (sug._catalogo) {
      // Copia nombre ES + instrucciones + media al plan, y lo agrega a
      // biblioteca_ejercicios si no estaba (para que tenga código X /
      // taxonomía asignable después). El código llega async.
      setForm((f) => ({
        ...f,
        nombre: sug.nombre,
        desc: sug.desc || f.desc,
        video: sug.video || f.video,
        // 2026-07-30: ver nota de abajo — el GIF se reemplaza por el del
        // ejercicio elegido, nunca se arrastra el del anterior.
        gif: sug.gif || "",
        ...(sug.codigo ? { codigo: sug.codigo } : {}),
      }));
      agregarCatalogoABiblioteca(sug._catalogo).then((codigo) => {
        if (codigo) setForm((f) => (f.nombre === sug.nombre ? { ...f, codigo } : f));
      });
      setSugs([]); setShowSugs(false);
      return;
    }
    setForm((f) => ({
      ...f,
      nombre: sug.nombre,
      desc: sug.desc || sug.descripcion || f.desc,
      video: sug.video || f.video,
      // 2026-07-30: el GIF pasa a ser el del ejercicio ELEGIDO. Se pisa
      // siempre (aunque el nuevo no tenga uno propio) porque si no quedaba
      // pegado el GIF manual del ejercicio anterior y se mostraba un
      // movimiento que no es. Con "" el lookup automático por nombre vuelve
      // a mandar, que es lo que Lucas quiere.
      gif: sug.gif || "",
      // Taxonomía 2026-07-21: al elegir un ejercicio de la biblioteca, el
      // ítem del plan hereda su código de grupo y su unidad (Plancha=segundos).
      ...(sug.codigo ? { codigo: sug.codigo } : {}),
      ...(sug.unidad ? { unidad: sug.unidad } : {}),
      // 2026-08-13: y su forma de carga, que sale del equipamiento.
      ...(sug.equipamiento || sug.equipment_es ? { equipamiento: sug.equipamiento || sug.equipment_es } : {}),
    }));
    setSugs([]); setShowSugs(false);
  };
  const remove = (i) => {
    if (!window.confirm("¿Sacar este ejercicio del plan?")) return;
    onChange(items.filter((_, j) => j !== i));
  };
  const move = (i, dir) => {
    const arr = [...items];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };

  // ── PLEGAR / DESPLEGAR (Lucas, 2026-08-09) ────────────────────────────
  // "Tendría que poder plegar y desplegar los ejercicios clicando en el
  // nombre". Antes tocar el nombre abría el editor entero; ahora despliega
  // la ficha (GIF grande + descripción completa) y el lápiz sigue siendo el
  // que edita. Se indexa por id del ejercicio, no por posición: si no, al
  // reordenar se quedaba abierto el que ocupó ese lugar.
  const [abiertos, setAbiertos] = useState(() => new Set());
  const claveDe = (ej, i) => ej.id || `idx:${i}`;
  const toggleAbierto = (clave) =>
    setAbiertos((prev) => {
      const s = new Set(prev);
      if (s.has(clave)) s.delete(clave);
      else s.add(clave);
      return s;
    });

  // ── ARRASTRAR PARA REORDENAR (Lucas, 2026-08-09) ──────────────────────
  // "la opción de bajar o subir un ejercicio debería ser agarrando ese
  // ejercicio y subiéndolo". Va con Pointer Events, no con HTML5 drag-and-
  // drop: este panel se usa desde el celular y el drag nativo no dispara en
  // touch. El handle lleva touchAction:"none" para que arrastrar no scrollee
  // la página. Los botones ▲▼ se quedan como alternativa accesible (teclado
  // y quien no pueda sostener el arrastre).
  const listaRef = useRef(null);
  const [arrastre, setArrastre] = useState(null); // { from, over }
  const arrastreRef = useRef(null);

  const indiceBajoElDedo = (clientY) => {
    const cont = listaRef.current;
    if (!cont) return null;
    const filas = Array.from(cont.querySelectorAll("[data-fila-ej]"));
    for (const f of filas) {
      const r = f.getBoundingClientRect();
      if (clientY >= r.top && clientY <= r.bottom) return Number(f.dataset.filaEj);
    }
    // Fuera de la lista: se engancha al extremo más cercano en vez de perderse.
    if (!filas.length) return null;
    const primera = filas[0].getBoundingClientRect();
    return clientY < primera.top ? 0 : filas.length - 1;
  };

  const onHandleDown = (e, i) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const st = { from: i, over: i };
    arrastreRef.current = st;
    setArrastre(st);
  };
  const onHandleMove = (e) => {
    if (!arrastreRef.current) return;
    const over = indiceBajoElDedo(e.clientY);
    if (over == null || over === arrastreRef.current.over) return;
    const st = { ...arrastreRef.current, over };
    arrastreRef.current = st;
    setArrastre(st);
  };
  const onHandleUp = () => {
    const st = arrastreRef.current;
    arrastreRef.current = null;
    setArrastre(null);
    if (!st || st.over === st.from) return;
    const arr = [...items];
    const [movido] = arr.splice(st.from, 1);
    arr.splice(st.over, 0, movido);
    onChange(arr);
  };

  // Se declaran una sola vez y se usan en los dos formularios (editar y nuevo):
  // comparten el mismo `form`, duplicar el JSX sería duplicar el bug.
  const notaSugerencias = (sugsIA.cargando || sugsIA.error) ? (
    <div
      role={sugsIA.error ? "alert" : undefined}
      style={{ color: sugsIA.error ? S.red : S.lgray, fontSize: TS.chip, marginTop: -4, marginBottom: 8, lineHeight: 1.4 }}
    >
      {sugsIA.error || "Buscando ejercicios parecidos…"}
    </div>
  ) : null;
  const bloqueAsistente = (
    <AsistenteEjercicio
      form={form}
      setForm={setForm}
      llamar={llamarAsistente}
      {...(subirMedia ? { subirArchivo: subirMedia } : {})}
    />
  );

  return (
    <div ref={listaRef}>
      {" "}
      {items.map((ej, i) => (
        <div
          key={i}
          data-fila-ej={i}
          style={{
            ...card,
            marginBottom: 6,
            padding: "10px 12px",
            // Feedback del arrastre: la fila agarrada se levanta, la de
            // destino marca dónde va a caer.
            opacity: arrastre && arrastre.from === i ? 0.4 : 1,
            outline: arrastre && arrastre.over === i && arrastre.from !== i ? "2px solid " + S.white : "none",
            transition: arrastre ? "none" : "outline 120ms ease",
          }}
        >
          {" "}
          {editIdx === i ? (
            <div>
              {" "}
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>NOMBRE</div>{" "}
              <BuscadorEjercicioNombre
                value={form.nombre}
                sugs={sugs}
                showSugs={showSugs}
                setShowSugs={setShowSugs}
                onInputChange={handleNombreChange}
                onSelect={selectSug}
              />{" "}
              {notaSugerencias}
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>DESCRIPCION</div>{" "}
              <textarea
                value={form.desc}
                onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                rows={2}
                style={{ ...inp, resize: "vertical", marginBottom: 8 }}
              />{" "}
              {bloqueAsistente}
              {/* 2026-07-30: acá había LINK YOUTUBE + subir video + GifPicker.
                  Se sacaron los tres. Este editor es para ARMAR EL PLAN
                  eligiendo ejercicios que ya existen, no para crearlos ni para
                  cargarles media — eso vive en la Biblioteca de ejercicios,
                  que sigue teniendo YouTube, subida de video y GIF manual.
                  Ojo: los campos video/mediaLocal/gif que un ítem ya tenga
                  guardado NO se borran (startEdit los carga en form y save los
                  vuelve a escribir tal cual) — se sacan de la EDICIÓN, no del
                  dato. En su lugar va el GIF, para VER. */}
              <GifEjercicio nombre={form.nombre} gif={form.gif} />{" "}
              {/* 2026-08-09, pedido de Lucas: "al modificar el plan tendría que
                  poder sacar el gif, dejar el ejercicio sin gif". Ojo: NO
                  alcanza con gif:"" — eso devuelve el control al lookup
                  automático por nombre y el mismo GIF vuelve a aparecer. Se
                  guarda el sentinel SIN_GIF, que resolverGif() respeta en el
                  editor y en la vista del alumno. */}
              <button
                onClick={() => setForm((f) => ({ ...f, gif: f.gif === SIN_GIF ? "" : SIN_GIF }))}
                style={{
                  width: "100%",
                  background: "transparent",
                  color: form.gif === SIN_GIF ? S.white : S.gray,
                  border: "1px solid " + (form.gif === SIN_GIF ? S.white : S.border),
                  borderRadius: 6,
                  padding: "7px",
                  fontSize: 12,
                  cursor: "pointer",
                  marginBottom: 8,
                }}
              >
                {form.gif === SIN_GIF ? "Volver a mostrar el GIF" : "Dejar este ejercicio sin GIF"}
              </button>{" "}
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {" "}
                <button
                  onClick={save}
                  disabled={propagando}
                  style={{
                    flex: 1,
                    background: S.white,
                    color: S.bg,
                    border: "none",
                    borderRadius: 6,
                    padding: "8px",
                    fontWeight: 900,
                    cursor: propagando ? "default" : "pointer",
                    opacity: propagando ? 0.6 : 1,
                    minWidth: 90,
                  }}
                >
                  GUARDAR
                </button>{" "}
                {onGuardarParaTodos && (
                  <button
                    onClick={saveParaTodos}
                    disabled={propagando}
                    title="Actualiza el ejercicio maestro y lo propaga a todos los alumnos que lo tengan"
                    style={{
                      flex: 1,
                      background: "transparent",
                      color: S.green,
                      border: "1px solid " + S.green,
                      borderRadius: 6,
                      padding: "8px",
                      fontWeight: 900,
                      fontSize: 11,
                      cursor: propagando ? "default" : "pointer",
                      opacity: propagando ? 0.6 : 1,
                      minWidth: 130,
                    }}
                  >
                    {propagando ? "PROPAGANDO..." : "GUARDAR PARA TODOS"}
                  </button>
                )}{" "}
                <button
                  onClick={cancel}
                  disabled={propagando}
                  style={{
                    background: "transparent",
                    color: S.gray,
                    border: "1px solid " + S.border,
                    borderRadius: 6,
                    padding: "8px 14px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>{" "}
              </div>{" "}
            </div>
          ) : (
            // flexWrap (2026-08-13): la fila tiene 6 controles de ancho fijo
            // (handle, flechas, GIF, número, editar, borrar). Con el zoom del
            // sistema al 200% no entran en el ancho útil y empujaban el botón
            // de borrar fuera de la pantalla; envolviendo, bajan de renglón.
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              {" "}
              {/* Handle de arrastre. Se agarra ACÁ (no en toda la fila) para
                  que tocar el nombre siga plegando y el scroll del panel
                  funcione normal en el celular. Los ▲▼ quedan abajo del
                  handle como alternativa. */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                {" "}
                <div
                  onPointerDown={(e) => onHandleDown(e, i)}
                  onPointerMove={onHandleMove}
                  onPointerUp={onHandleUp}
                  onPointerCancel={onHandleUp}
                  title="Arrastrá para mover el ejercicio"
                  style={{
                    touchAction: "none",
                    cursor: arrastre ? "grabbing" : "grab",
                    color: S.lgray,
                    lineHeight: 1,
                    fontSize: 15,
                    padding: "2px 4px",
                    userSelect: "none",
                  }}
                >
                  ⠿
                </div>{" "}
                {/* 2026-08-13 (auditoría de uso): estas dos flechas medían
                    20x14px — el 14% del área táctil mínima, los dos controles
                    más chicos de toda la app, y reordenar ejercicios es algo
                    que Lucas hace con el teléfono en la mano mientras arma el
                    plan. Pasan a 44x44 reales. */}
                <button
                  onClick={() => move(i, -1)}
                  aria-label="Subir ejercicio"
                  style={{
                    background: "transparent",
                    color: S.lgray,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    width: TAP,
                    minHeight: TAP,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  ▲
                </button>{" "}
                <button
                  onClick={() => move(i, 1)}
                  aria-label="Bajar ejercicio"
                  style={{
                    background: "transparent",
                    color: S.lgray,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    width: TAP,
                    minHeight: TAP,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  ▼
                </button>{" "}
              </div>{" "}
              <div
                style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: S.card2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: S.gray,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>{" "}
              {/* 2026-07-30: el GIF a la vista en la propia fila, sin abrir
                  nada. 2026-08-09: tocarlo ya no abre el editor — pliega o
                  despliega la ficha, igual que tocar el nombre. Para editar
                  está el lápiz. */}
              {(() => {
                const gifFila = resolverGif(ej.gif, ej.nombre);
                return gifFila ? (
                  <img
                    src={gifFila}
                    alt=""
                    onClick={() => toggleAbierto(claveDe(ej, i))}
                    style={{ width: TAP, height: TAP, objectFit: "contain", background: "#fff", borderRadius: 6, flexShrink: 0, cursor: "pointer" }}
                  />
                ) : null;
              })()}{" "}
              {/* 2026-08-13: sin `minWidth:0` esta columna no podía encogerse
                  por debajo del ancho del nombre del ejercicio, así que la
                  fila entera empujaba el botón de borrar fuera de la pantalla
                  (2px en 375px, 142px con el zoom del sistema al 200%). El
                  nombre sigue mostrándose completo: envuelve, no se corta. */}
              <div
                style={{ flex: "1 1 150px", minWidth: 0, cursor: "pointer" }}
                onClick={() => toggleAbierto(claveDe(ej, i))}
                title="Tocá el nombre para ver u ocultar el detalle"
              >
                {" "}
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  {ej.codigo && (
                    <span style={{ color: S.gray, fontSize: 14, fontWeight: 800, letterSpacing: 0.5, background: S.card2, border: "1px solid " + S.border, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>
                      {ej.codigo}
                    </span>
                  )}
                  <div style={{ color: S.white, fontSize: 13, fontWeight: 600, minWidth: 0, overflowWrap: "break-word" }}>{ej.nombre}</div>
                  <span style={{ color: S.lgray, fontSize: 10, flexShrink: 0 }}>
                    {abiertos.has(claveDe(ej, i)) ? "▲" : "▼"}
                  </span>
                </div>{" "}
                {ej.desc && !abiertos.has(claveDe(ej, i)) && (
                  <div style={{ color: S.gray, fontSize: 11, marginTop: 1 }}>
                    {ej.desc.slice(0, 50)}
                    {ej.desc.length > 50 ? "..." : ""}
                  </div>
                )}{" "}
                {showVideo && (ej.video || ej.mediaLocal) && (
                  <div style={{ color: "#4a9eff", fontSize: 14, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}><Play size={11} />Media asignada</div>
                )}{" "}
              </div>{" "}
              {/* Editar y borrar viajan juntos (2026-08-13): con las flechas de
                  reordenar a 44px reales ya no entra todo en un renglón de
                  375px, así que este par baja completo y alineado a la
                  derecha en vez de partirse uno en cada línea. */}
              <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
                <button onClick={() => startEdit(i)} style={smallBtn(S.white)}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(i)} style={smallBtn(S.red)}>
                  <X size={14} />
                </button>
              </div>{" "}
            </div>
          )}{" "}
          {/* Ficha desplegada (2026-08-09): GIF grande + descripción completa,
              sin entrar a editar. No se muestra mientras la fila está en modo
              edición, que ya tiene su propio GIF en grande. */}
          {editIdx !== i && abiertos.has(claveDe(ej, i)) && (
            <div style={{ marginTop: 8, borderTop: "1px solid " + S.border, paddingTop: 8 }}>
              <GifEjercicio nombre={ej.nombre} gif={ej.gif} size={150} />
              {ej.desc ? (
                <div style={{ color: S.gray, fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{ej.desc}</div>
              ) : (
                <div style={{ color: S.lgray, fontSize: 12 }}>Sin descripción cargada.</div>
              )}
            </div>
          )}{" "}
        </div>
      ))}{" "}
      {editIdx === -1 ? (
        <div style={{ ...card, padding: 12, marginTop: 6 }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 700, marginBottom: 10 }}>Nuevo ejercicio</div>{" "}
          <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>NOMBRE</div>{" "}
          {/* Punto 7 (ronda 12): mismo buscador con autocomplete de la
              biblioteca que el de "editar" — sugiere ejercicios existentes
              (con código) y permite crear uno nuevo tipeando un nombre que
              no matchea nada. */}
          <BuscadorEjercicioNombre
            value={form.nombre}
            sugs={sugs}
            showSugs={showSugs}
            setShowSugs={setShowSugs}
            onInputChange={handleNombreChange}
            onSelect={selectSug}
          />{" "}
          {notaSugerencias}
          <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>DESCRIPCION</div>{" "}
          <textarea
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
            rows={2}
            style={{ ...inp, resize: "vertical", marginBottom: 8 }}
          />{" "}
          {bloqueAsistente}
          {/* 2026-07-30: mismo criterio que arriba — agregar un ejercicio al
              plan es ELEGIRLO de la lista, no crearlo con su media. El GIF se
              muestra solo, por nombre. */}
          <GifEjercicio nombre={form.nombre} gif={form.gif} />{" "}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {" "}
            <button
              onClick={save}
              style={{
                flex: 1,
                background: S.white,
                color: S.bg,
                border: "none",
                borderRadius: 6,
                padding: "8px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              AGREGAR
            </button>{" "}
            <button
              onClick={cancel}
              style={{
                background: "transparent",
                color: S.gray,
                border: "1px solid " + S.border,
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>{" "}
          </div>{" "}
        </div>
      ) : (
        <button
          onClick={startNew}
          style={{
            width: "100%",
            marginTop: 8,
            background: "transparent",
            color: S.gray,
            border: "1px dashed " + S.border,
            borderRadius: 8,
            padding: "10px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          + Agregar ejercicio
        </button>
      )}{" "}
    </div>
  );
}
