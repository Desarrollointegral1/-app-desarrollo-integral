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
import { useState, useEffect, useMemo, useRef } from "react";
import { S, card, inp, smallBtn, FONT_DISPLAY } from "../utils/theme.js";
import { uid } from "../utils/helpers.js";
import labels from "../utils/catalogoLabels.json";
import {
  cargarCatalogoCached,
  catalogoMediaUrl,
  guardarEjercicioCatalogo,
  agregarCatalogoABiblioteca,
  subirVideo,
  validarCodigoDisponible,
  renombrarCodigoEjercicio,
  crearEjercicioCatalogo,
  crearPlanPredeterminado,
} from "../../services/supabase.js";

const PAGE = 60;

const labelCat = (v) => labels.categoria[v] || v;
const labelEq = (v) => labels.equipment[v] || v;
const labelTg = (v) => labels.target[v] || v;

function Chip({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: activo ? S.white : S.card2,
        color: activo ? S.bg : S.gray,
        border: "1px solid " + (activo ? S.white : S.border),
        borderRadius: 20,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function FiltroSeccion({ titulo, valores, seleccion, onToggle, labelDe }) {
  const [expandido, setExpandido] = useState(false);
  const LIMITE = 12;
  const mostrar = expandido ? valores : valores.slice(0, LIMITE);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
        {titulo}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {mostrar.map((v) => (
          <Chip key={v} activo={seleccion.has(v)} onClick={() => onToggle(v)}>
            {labelDe(v)}
          </Chip>
        ))}
        {valores.length > LIMITE && !expandido && (
          <Chip activo={false} onClick={() => setExpandido(true)}>
            +{valores.length - LIMITE} más
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
        {items.length === 0 && <span style={{ fontSize: 11, color: S.lgray }}>Sin ninguno todavía</span>}
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
                padding: "3px 6px 3px 9px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <button
                onClick={() => onChangeDefault(v)}
                title="Marcar como predeterminado"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, fontSize: 11, color: esDefault ? S.bg : S.gray, lineHeight: 1 }}
              >
                {esDefault ? "★" : "☆"}
              </button>
              {v}
              <button
                onClick={() => remove(v)}
                title="Quitar"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0 2px", color: esDefault ? S.bg : S.gray, fontSize: 12, lineHeight: 1 }}
              >
                ✕
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
          style={{ ...inp, flex: 1, padding: "6px 10px", fontSize: 12 }}
        />
        <button onClick={add} style={{ ...smallBtn(S.gray), padding: "6px 12px" }}>+ Agregar</button>
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
        style={{ ...smallBtn(S.gray), width: "100%", padding: "8px" }}
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
            showToast && showToast("Video subido ✓");
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
}) {
  const [cat, setCat] = useState(null); // null = cargando
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState(new Set());
  const [fEq, setFEq] = useState(new Set());
  const [fTg, setFTg] = useState(new Set());
  const [soloDI, setSoloDI] = useState(false);
  const [visibles, setVisibles] = useState(PAGE);
  const [hoverId, setHoverId] = useState(null);
  const [detalle, setDetalle] = useState(null); // item abierto
  const [form, setForm] = useState(null); // edición del detalle
  const [guardando, setGuardando] = useState(false);
  const [creando, setCreando] = useState(false); // true = flujo "Crear ejercicio nuevo" (punto 4)
  const [codigoError, setCodigoError] = useState(""); // validación de código duplicado (punto 5)
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  // Ronda 16 (punto 4): el "Armador" ya no es una pantalla aparte — es
  // este toggle. false = solo Biblioteca (buscar/editar ejercicios).
  // true = además se muestra el panel lateral del carrito y el botón
  // "＋" en cada card para ir sumando ejercicios al plan en construcción.
  const [armadorAbierto, setArmadorAbierto] = useState(false);
  // carrito (armador) — punto 6 de la ronda anterior: ya no maneja
  // alumno/destino/día, solo arma la plantilla (nombre + grupo).
  const [carrito, setCarrito] = useState([]);
  const [nombrePlan, setNombrePlan] = useState("");
  const [grupoPlan, setGrupoPlan] = useState("");
  const [guardandoPlan, setGuardandoPlan] = useState(false);
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 900);

  useEffect(() => {
    const onR = () => setIsWide(window.innerWidth >= 900);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    let vivo = true;
    cargarCatalogoCached().then((c) => vivo && setCat(c));
    return () => { vivo = false; };
  }, []);

  const categorias = useMemo(() => [...new Set((cat || []).map((e) => e.categoria).filter(Boolean))].sort((a, b) => labelCat(a).localeCompare(labelCat(b))), [cat]);
  const equipos = useMemo(() => [...new Set((cat || []).map((e) => e.equipment).filter(Boolean))].sort((a, b) => labelEq(a).localeCompare(labelEq(b))), [cat]);
  const targets = useMemo(() => [...new Set((cat || []).map((e) => e.target).filter(Boolean))].sort((a, b) => labelTg(a).localeCompare(labelTg(b))), [cat]);

  const filtrados = useMemo(() => {
    if (!cat) return [];
    const qq = q.toLowerCase().trim();
    return cat.filter((e) => {
      // Punto 4: en Principales (★ Principales DI) solo se listan los que
      // tienen media real (gif o video propio) — el resto queda en el
      // catálogo general pero no como opción utilizable para armar planes.
      if (soloDI && !e.codigo_di) return false;
      if (soloDI && !e.gif_url && !e.video) return false;
      if (fCat.size && !fCat.has(e.categoria)) return false;
      if (fEq.size && !fEq.has(e.equipment)) return false;
      if (fTg.size && !fTg.has(e.target)) return false;
      if (qq) {
        const idx = `${e.nombre_es} ${e.nombre_en || ""} ${e.target_es || ""} ${e.equipment_es || ""} ${e.codigo_di || ""}`.toLowerCase();
        if (!idx.includes(qq)) return false;
      }
      return true;
    });
  }, [cat, q, fCat, fEq, fTg, soloDI]);

  useEffect(() => { setVisibles(PAGE); }, [q, fCat, fEq, fTg, soloDI]);

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
    ...(soloDI ? [{ v: "di", l: "Principales DI", del: () => setSoloDI(false) }] : []),
  ];

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
      musculos: musculosIniciales,
      musculo_default: e.musculo_default || e.target_es || musculosIniciales[0] || "",
      tags: tagsIniciales,
      tag_default: e.tag_default || e.equipment_es || tagsIniciales[0] || "",
    });
    setCodigoError("");
  };

  // Flujo "Crear ejercicio nuevo" (punto 4): único lugar donde se sube
  // media propia para un ítem del catálogo — editar uno existente no
  // toca su media.
  const abrirNuevo = () => {
    setCreando(true);
    setDetalle({ id: null, custom: true });
    setForm({ nombre_es: "", instrucciones_es: "", video: "", codigo_di: "", musculos: [], musculo_default: "", tags: [], tag_default: "" });
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
    // target_es/equipment_es (los campos que usa la card del grid y el
    // dataset original) se mantienen en sync con el músculo/tag
    // predeterminado — así la tarjeta no queda mostrando un dato viejo
    // después de cambiar el ★ en el editor.
    const payload = {
      nombre_es: form.nombre_es.trim(),
      instrucciones_es: form.instrucciones_es,
      codigo_di: codigoLimpio || null,
      musculos: form.musculos,
      musculo_default: form.musculo_default,
      tags: form.tags,
      tag_default: form.tag_default,
      target_es: form.musculo_default || form.musculos[0] || "",
      secondary_muscles_es: form.musculos.filter((m) => m !== form.musculo_default),
      equipment_es: form.tag_default || form.tags[0] || "",
    };
    if (creando) {
      const creado = await crearEjercicioCatalogo({ ...payload, video: form.video || "" });
      setGuardando(false);
      if (!creado) { showToast && showToast("Error creando — revisá la consola"); return; }
      setCat((prev) => [...(prev || []), creado]);
      showToast && showToast("Ejercicio creado ✓");
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
    const ok = await guardarEjercicioCatalogo(detalle.id, payload);
    setGuardando(false);
    if (!ok) { showToast && showToast("Error guardando — revisá la consola"); return; }
    setCat((prev) => prev.map((e) => (e.id === detalle.id ? { ...e, ...payload, editado: true } : e)));
    showToast && showToast("Ejercicio guardado ✓");
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
          unidad: "reps",
        });
      }
      const creado = await crearPlanPredeterminado(nombrePlan.trim(), grupoPlan.trim(), [{ dia: "Sesion", subtitulo: "", ejercicios }]);
      if (!creado) throw new Error("No se pudo crear la plantilla");
      showToast && showToast(`Plantilla "${nombrePlan.trim()}" guardada ✓`);
      setCarrito([]);
      setNombrePlan("");
      setGrupoPlan("");
      setArmadorAbierto(false);
    } catch (e) {
      console.error("[Armador]", e);
      showToast && showToast("Error: " + e.message);
    } finally {
      setGuardandoPlan(false);
    }
  };

  // Cerrar el panel del carrito sin guardar (punto 4): si hay ejercicios
  // sumados, confirma antes de descartarlos.
  const cerrarArmador = () => {
    if (carrito.length > 0 && !window.confirm("¿Cerrar el plan en construcción? Se pierden los ejercicios que sumaste.")) return;
    setArmadorAbierto(false);
    setCarrito([]);
    setNombrePlan("");
    setGrupoPlan("");
  };

  const sidebar = (
    <div style={{ width: isWide ? 230 : "auto", flexShrink: 0, padding: isWide ? "0 14px 0 0" : 0, borderRight: isWide ? "1px solid " + S.border : "none", overflowY: isWide ? "auto" : "visible" }}>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ejercicios…"
          style={{ ...inp, paddingRight: 28 }}
        />
        {q && (
          <button onClick={() => setQ("")} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: S.gray, cursor: "pointer", fontSize: 14 }}>
            ×
          </button>
        )}
      </div>
      <div style={{ marginBottom: 14 }}>
        <Chip activo={soloDI} onClick={() => setSoloDI((v) => !v)}>★ Principales DI</Chip>
      </div>
      {/* Punto 4: único lugar donde se sube media propia — crear un
          ejercicio nuevo, no editar uno existente. Al lado, el botón que
          reemplaza a la vieja pantalla "Armador" — abre el carrito lateral
          sin salir de la Biblioteca. */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button onClick={abrirNuevo} style={{ ...smallBtn(S.white), flex: 1, fontWeight: 800 }}>
          ＋ Crear ejercicio nuevo
        </button>
        <button
          onClick={() => setArmadorAbierto(true)}
          disabled={armadorAbierto}
          style={{ ...smallBtn(armadorAbierto ? S.green : S.white), flex: 1, fontWeight: 800, opacity: armadorAbierto ? 0.6 : 1, cursor: armadorAbierto ? "default" : "pointer" }}
        >
          {armadorAbierto ? "✓ Armando plan" : "＋ Crear plan de entrenamiento"}
        </button>
      </div>
      <FiltroSeccion titulo="Categoría" valores={categorias} seleccion={fCat} onToggle={toggle(setFCat)} labelDe={labelCat} />
      <FiltroSeccion titulo="Equipamiento" valores={equipos} seleccion={fEq} onToggle={toggle(setFEq)} labelDe={labelEq} />
      <FiltroSeccion titulo="Músculo objetivo" valores={targets} seleccion={fTg} onToggle={toggle(setFTg)} labelDe={labelTg} />
      {onAbrirPropia && (
        <button onClick={onAbrirPropia} style={{ ...smallBtn(S.gray), width: "100%", marginTop: 8 }}>
          🧘 Rutinas propias (movilidad / elástico / calor)
        </button>
      )}
    </div>
  );

  const grid = (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      {/* barra de resultados + filtros activos */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {badgesActivos.map((b) => (
          <span key={b.l} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: S.card2, border: "1px solid " + S.border, borderRadius: 20, padding: "3px 9px", fontSize: 11, color: S.white }}>
            {b.l}
            <button onClick={b.del} style={{ background: "transparent", border: "none", color: S.gray, cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: S.gray }}>
          {cat ? `${filtrados.length} de ${cat.length} ejercicios` : "Cargando catálogo…"}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!cat ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ ...card, height: 200, opacity: 0.4 }} />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: "center", color: S.gray, padding: 40, fontSize: 13 }}>🔍 No se encontraron ejercicios</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {filtrados.slice(0, visibles).map((e) => {
                const enCarrito = carrito.some((c) => c.id === e.id);
                const media = hoverId === e.id && e.gif_url ? catalogoMediaUrl(e.gif_url) : catalogoMediaUrl(e.image || e.gif_url);
                return (
                  <article
                    key={e.id}
                    onMouseEnter={() => setHoverId(e.id)}
                    onMouseLeave={() => setHoverId((h) => (h === e.id ? null : h))}
                    onClick={() => abrirDetalle(e)}
                    style={{ ...card, overflow: "hidden", cursor: "pointer", position: "relative" }}
                  >
                    <div style={{ aspectRatio: "1", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {media ? (
                        <img src={media} alt={e.nombre_es} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: 30 }}>🏋️</span>
                      )}
                    </div>
                    {e.codigo_di && (
                      <span style={{ position: "absolute", top: 6, left: 6, background: S.bg, color: S.white, border: "1px solid " + S.border, borderRadius: 4, fontSize: 9, fontWeight: 800, padding: "1px 5px" }}>
                        {e.codigo_di}
                      </span>
                    )}
                    {e.editado && (
                      <span style={{ position: "absolute", top: 6, right: armadorAbierto ? 34 : 6, background: S.bg, color: S.green, border: "1px solid " + S.border, borderRadius: 4, fontSize: 9, fontWeight: 800, padding: "1px 5px" }}>
                        ✎
                      </span>
                    )}
                    {armadorAbierto && (
                      <button
                        onClick={(ev) => { ev.stopPropagation(); agregarAlCarrito(e); }}
                        title="Agregar al plan"
                        style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: enCarrito ? S.green : S.white, color: S.bg, border: "none", fontWeight: 900, fontSize: 14, cursor: "pointer", lineHeight: 1 }}
                      >
                        {enCarrito ? "✓" : "＋"}
                      </button>
                    )}
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ color: S.white, fontSize: 12, fontWeight: 700, lineHeight: 1.3, minHeight: 31, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {e.nombre_es}
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, color: S.gray, background: S.card2, borderRadius: 4, padding: "1px 6px" }}>{e.target_es}</span>
                        <span style={{ fontSize: 9, color: S.gray, background: S.card2, borderRadius: 4, padding: "1px 6px" }}>{e.equipment_es}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {visibles < filtrados.length && (
              <button
                onClick={() => setVisibles((v) => v + PAGE)}
                style={{ ...smallBtn(S.gray), width: "100%", marginTop: 12, padding: "10px" }}
              >
                Cargar más ({filtrados.length - visibles} restantes)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Punto 6: el Armador ya NO elige alumno/día — solo arma la PLANTILLA
  // (nombre + grupo opcional, ej. "Básico"/"Intermedio"/"Avanzado", para
  // agruparlas). Asignarla a un alumno puntual se hace aparte, desde
  // Admin → Alumno → "Asignar plan".
  const carritoPanel = armadorAbierto && (
    <div style={{ width: isWide ? 290 : "auto", flexShrink: 0, borderLeft: isWide ? "1px solid " + S.border : "none", borderTop: isWide ? "none" : "1px solid " + S.border, paddingLeft: isWide ? 14 : 0, paddingTop: isWide ? 0 : 12, display: "flex", flexDirection: "column", maxHeight: isWide ? "none" : "40vh", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase" }}>
          Plan en construcción ({carrito.length})
        </div>
        <button onClick={cerrarArmador} title="Cerrar sin guardar" style={{ background: "transparent", border: "none", color: S.gray, fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0 }}>✕</button>
      </div>
      <input value={nombrePlan} onChange={(e) => setNombrePlan(e.target.value)} placeholder="Nombre del plan (ej. Hipertrofia Avanzado V2)" style={{ ...inp, marginBottom: 8 }} />
      <input value={grupoPlan} onChange={(e) => setGrupoPlan(e.target.value)} placeholder="Grupo (opcional — ej. Básico, Intermedio, Avanzado)" style={{ ...inp, marginBottom: 8 }} />
      <div style={{ flex: 1, overflowY: "auto", minHeight: 60 }}>
        {carrito.length === 0 ? (
          <div style={{ color: S.gray, fontSize: 12, padding: "14px 4px" }}>
            Clickeá ＋ en las cards para ir armando el plan.
          </div>
        ) : (
          carrito.map((it, i) => (
            <div key={it.id} style={{ ...card, padding: "7px 9px", marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: S.gray, fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.nombre_es}
              </span>
              <button onClick={() => moverCarrito(i, -1)} style={{ ...smallBtn(S.gray), padding: "2px 6px" }}>▲</button>
              <button onClick={() => moverCarrito(i, 1)} style={{ ...smallBtn(S.gray), padding: "2px 6px" }}>▼</button>
              <button onClick={() => setCarrito((c) => c.filter((x) => x.id !== it.id))} style={{ ...smallBtn(S.red), padding: "2px 6px" }}>✕</button>
            </div>
          ))
        )}
      </div>
      <button
        onClick={guardarPlan}
        disabled={guardandoPlan || carrito.length === 0 || !nombrePlan.trim()}
        style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 900, cursor: "pointer", marginTop: 10, opacity: guardandoPlan || carrito.length === 0 || !nombrePlan.trim() ? 0.5 : 1 }}
      >
        {guardandoPlan ? "GUARDANDO..." : "GUARDAR PLANTILLA"}
      </button>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: S.bg, zIndex: 100, display: "flex", flexDirection: "column", padding: "14px 16px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ color: S.white, fontWeight: 800, fontSize: 15, letterSpacing: 1, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
          📚 Biblioteca de ejercicios
        </div>
        {/* Punto 4 (2026-07-21): se saca el crédito "© Gym visual —
            gymvisual.com" de la UI visible al usuario (acá y en el detalle
            del ejercicio, más abajo). Los términos de licencia siguen
            documentados en NOTICE.md, solo se deja de mostrar en pantalla. */}
        {!isWide && (
          <button onClick={() => setMostrarFiltros((v) => !v)} style={smallBtn(S.gray)}>
            {mostrarFiltros ? "Ocultar filtros" : "Filtros"}
          </button>
        )}
        <button onClick={onClose} style={smallBtn(S.gray)}>✕ Cerrar</button>
      </div>
      {/* cuerpo */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: isWide ? "row" : "column", gap: isWide ? 14 : 10 }}>
        {(isWide || mostrarFiltros) && sidebar}
        {grid}
        {carritoPanel}
      </div>

      {/* detalle */}
      {detalle && form && (
        <div onClick={() => { setDetalle(null); setCreando(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "100%", maxWidth: 460, maxHeight: "92vh", overflowY: "auto", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ color: S.white, fontWeight: 800, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
                {creando ? "＋ Crear ejercicio nuevo" : "Editar ejercicio"}
              </div>
              <button onClick={() => { setDetalle(null); setCreando(false); }} style={{ background: "transparent", border: "none", color: S.gray, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            {/* media: SOLO se muestra/edita en el flujo de crear nuevo — editar
                un ejercicio existente del catálogo no reemplaza su media
                (punto 4). Para uno existente se ve la media actual de solo
                lectura arriba, sin uploader. */}
            {!creando && (
              <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", marginBottom: 12, display: "flex", justifyContent: "center" }}>
                {detalle.gif_url ? (
                  <img src={catalogoMediaUrl(detalle.gif_url)} alt={form.nombre_es} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }} />
                ) : detalle.image ? (
                  <img src={catalogoMediaUrl(detalle.image)} alt={form.nombre_es} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }} />
                ) : detalle.video ? (
                  <video src={detalle.video} controls playsInline style={{ width: "100%", maxHeight: 260, background: "#000" }} />
                ) : (
                  <div style={{ padding: 40, fontSize: 34 }}>🏋️</div>
                )}
              </div>
            )}
            <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Código</div>
            <input
              value={form.codigo_di}
              onChange={(e) => { setForm((f) => ({ ...f, codigo_di: e.target.value.toUpperCase() })); setCodigoError(""); }}
              placeholder="ej. CO006 (dejar vacío = sin código)"
              style={{ ...inp, marginBottom: codigoError ? 4 : 10, fontWeight: 700, borderColor: codigoError ? S.red : undefined }}
            />
            {codigoError && <div style={{ fontSize: 11, color: S.red, marginBottom: 10 }}>{codigoError}</div>}
            <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Nombre</div>
            <input value={form.nombre_es} onChange={(e) => setForm((f) => ({ ...f, nombre_es: e.target.value }))} style={{ ...inp, marginBottom: 10, fontWeight: 700 }} />
            {detalle.nombre_en && (
              <div style={{ fontSize: 10, color: S.lgray, marginTop: -6, marginBottom: 10 }}>EN: {detalle.nombre_en}</div>
            )}
            <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Instrucciones</div>
            <textarea value={form.instrucciones_es} onChange={(e) => setForm((f) => ({ ...f, instrucciones_es: e.target.value }))} rows={5} style={{ ...inp, resize: "vertical", marginBottom: 12, lineHeight: 1.45 }} />
            {/* músculos editables, con ★ predeterminado (punto 4) */}
            <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Músculos trabajados</div>
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
            <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Tags (equipamiento y otros)</div>
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
                <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Link video (YouTube o propio)</div>
                <input value={form.video} onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))} placeholder="https://…" style={{ ...inp, marginBottom: 8 }} />
                <div style={{ marginBottom: 12 }}>
                  <SubirVideoInline onUrl={(url) => setForm((f) => ({ ...f, video: url }))} showToast={showToast} />
                </div>
              </>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {armadorAbierto && !creando && (
                <button
                  onClick={() => { agregarAlCarrito(detalle); setDetalle(null); }}
                  style={{ flex: 1, background: S.card2, color: S.white, border: "1px solid " + S.border, borderRadius: 8, padding: 11, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                >
                  ＋ AGREGAR AL PLAN
                </button>
              )}
              <button
                onClick={guardarDetalle}
                disabled={guardando}
                style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 11, fontSize: 12, fontWeight: 900, cursor: "pointer", opacity: guardando ? 0.6 : 1 }}
              >
                {guardando ? "GUARDANDO..." : creando ? "CREAR" : "GUARDAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
