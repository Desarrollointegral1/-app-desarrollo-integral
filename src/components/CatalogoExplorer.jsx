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
import { X, Archive, Dumbbell, BookOpen, FolderTree, Search, Pencil, Trash2, Check, RotateCcw } from "lucide-react";
import { S, card, inp, eyebrow, smallBtn, FONT_DISPLAY, FONT_BODY } from "../utils/theme.js";
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
  renombrarCategoriaCatalogo,
  crearEjercicioCatalogo,
  crearPlanPredeterminado,
  listarPlanesPredeterminados,
  actualizarPlanPredeterminado,
  eliminarPlanPredeterminado,
} from "../../services/supabase.js";

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

// Ronda 17 (punto 3): `onRename(valorViejo)` opcional — SOLO se pasa para
// el filtro de Categoría. Cuando está, cada chip suma un lápiz chico al
// lado para renombrar esa categoría (propaga a TODOS los ejercicios que la
// tengan — ver renombrarCategoriaCatalogo). Equipamiento/Músculo/Código NO
// lo reciben: esos valores vienen del dataset y no tiene sentido
// renombrarlos en masa desde acá.
function FiltroSeccion({ titulo, valores, seleccion, onToggle, labelDe, onRename }) {
  const [expandido, setExpandido] = useState(false);
  const LIMITE = 12;
  const mostrar = expandido ? valores : valores.slice(0, LIMITE);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
        {titulo}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {mostrar.map((v) =>
          onRename ? (
            <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
              <Chip activo={seleccion.has(v)} onClick={() => onToggle(v)}>
                {labelDe(v)}
              </Chip>
              <button
                onClick={() => onRename(v)}
                title={`Renombrar categoría "${labelDe(v)}"`}
                style={{ background: "transparent", border: "none", color: S.gray, cursor: "pointer", padding: "0 2px", lineHeight: 1, display: "inline-flex", alignItems: "center" }}
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
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0 2px", color: esDefault ? S.bg : S.gray, lineHeight: 1, display: "inline-flex", alignItems: "center" }}
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
  const [pantalla, setPantalla] = useState("biblioteca");
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
  // "Ver todos los planes": lista + plantilla abierta en edición.
  const [plantillas, setPlantillas] = useState(null);
  const [planSel, setPlanSel] = useState(null); // plantilla en edición
  const [planForm, setPlanForm] = useState(null); // { nombre, grupo, nivel, dias }
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false);
  const [qPlanAdd, setQPlanAdd] = useState(""); // buscador p/ agregar ejercicios a la plantilla
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 900);

  useEffect(() => {
    if (pantalla === "planes") listarPlanesPredeterminados().then(setPlantillas);
  }, [pantalla]);

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
  const facetDeps = [cat, q, fCat, fEq, fTg, fPre, fNivel, soloDI, verArchivados];
  const categorias = useMemo(() => valoresFacet((e) => e.categoria, "cat", fCat, (a, b) => labelCat(a).localeCompare(labelCat(b))), facetDeps);
  const equipos = useMemo(() => valoresFacet((e) => e.equipment, "eq", fEq, (a, b) => labelEq(a).localeCompare(labelEq(b))), facetDeps);
  const targets = useMemo(() => valoresFacet((e) => e.target, "tg", fTg, (a, b) => labelTg(a).localeCompare(labelTg(b))), facetDeps);
  const prefijos = useMemo(() => valoresFacet(prefijoDe, "pre", fPre, undefined), facetDeps);

  const filtrados = useMemo(() => {
    if (!cat) return [];
    const qq = q.toLowerCase().trim();
    return cat.filter((e) => {
      // Punto 4: en Principales (★ Principales DI) solo se listan los que
      // tienen media real (gif o video propio) — el resto queda en el
      // catálogo general pero no como opción utilizable para armar planes.
      // Ronda 17 (punto 3): FIX — antes usaba !!e.codigo_di, que dejaba
      // pasar 1.334/1.343 ejercicios (ver esPrincipalDI arriba). Ahora usa
      // el rango curado real (los ~50 de la ronda 13).
      // Ronda 18: los archivados no aparecen en listados/búsquedas; el
      // chip "Archivados" invierte la vista para recuperarlos.
      if (verArchivados ? !e.archivado : e.archivado) return false;
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
  }, [cat, q, fCat, fEq, fTg, fPre, fNivel, soloDI, verArchivados]);

  useEffect(() => { setVisibles(PAGE); }, [q, fCat, fEq, fTg, fPre, fNivel, soloDI, verArchivados]);

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
  ];

  // Ronda 17 (punto 3): "Todos los ejercicios" — resetea TODOS los filtros
  // (categoría/equipo/músculo/código/★ Principales DI/búsqueda) para
  // mostrar el catálogo completo sin acotar. Antes el único control
  // parecido en la sidebar era "🧘 Rutinas propias (movilidad/elástico/
  // calor)", que en realidad abre una biblioteca SEPARADA (movilidad/
  // calor, tabla distinta) — no "todo el catálogo". Se deja ese botón con
  // un nombre que describe lo que hace de verdad y se agrega este chip
  // nuevo para lo que Lucas pidió literalmente.
  const hayFiltrosActivos = fCat.size > 0 || fEq.size > 0 || fTg.size > 0 || fPre.size > 0 || fNivel.size > 0 || soloDI || verArchivados || q.trim() !== "";
  const limpiarFiltros = () => {
    setFCat(new Set()); setFEq(new Set()); setFTg(new Set()); setFPre(new Set()); setFNivel(new Set()); setSoloDI(false); setVerArchivados(false); setQ("");
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

  // Flujo "Crear ejercicio nuevo" (punto 4): único lugar donde se sube
  // media propia para un ítem del catálogo — editar uno existente no
  // toca su media.
  const abrirNuevo = () => {
    setCreando(true);
    setDetalle({ id: null, custom: true });
    setForm({ nombre_es: "", instrucciones_es: "", video: "", codigo_di: "", categoria: "", musculos: [], musculo_default: "", tags: [], tag_default: "", nivel: "" });
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
          unidad: "reps",
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
      {/* Ronda 17 (punto 3): "Todos los ejercicios" — resetea todos los
          filtros y muestra el catálogo completo (1.344) sin acotar. Antes
          Lucas confundía esto con el botón "Rutinas propias (movilidad)"
          de más abajo, que en realidad abre otra biblioteca separada. */}
      <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Chip activo={!hayFiltrosActivos} onClick={limpiarFiltros}>Todos los ejercicios</Chip>
        <Chip activo={soloDI} onClick={() => setSoloDI((v) => !v)}>★ Principales DI</Chip>
        {/* Ronda 18: ver/recuperar archivados */}
        <Chip activo={verArchivados} onClick={() => setVerArchivados((v) => !v)}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Archive size={14} strokeWidth={2} />Archivados</span></Chip>
      </div>
      {/* Ronda 18: los botones de crear (ejercicio / plan) se MUDARON a la
          barra de acciones principal de la pantalla — no van dentro del
          panel de filtros. */}
      <FiltroSeccion titulo="Categoría" valores={categorias} seleccion={fCat} onToggle={toggle(setFCat)} labelDe={labelCat} onRename={renombrarCategoria} />
      <FiltroSeccion titulo="Nivel" valores={NIVELES.map(([id]) => id)} seleccion={fNivel} onToggle={toggle(setFNivel)} labelDe={labelNivel} />
      <FiltroSeccion titulo="Equipamiento" valores={equipos} seleccion={fEq} onToggle={toggle(setFEq)} labelDe={labelEq} />
      <FiltroSeccion titulo="Músculo objetivo" valores={targets} seleccion={fTg} onToggle={toggle(setFTg)} labelDe={labelTg} />
      {/* Ronda 17 (punto 3): filtro por prefijo de código, derivado
          dinámicamente de codigo_di. */}
      <FiltroSeccion titulo="Código" valores={prefijos} seleccion={fPre} onToggle={toggle(setFPre)} labelDe={(v) => v} />
      {/* El botón NO abre el catálogo completo: abre la biblioteca PROPIA
          (movilidad / elástico / entrada en calor), un subconjunto. El nombre
          "Biblioteca completa" confundía (Lucas se confundió). Renombrado a lo
          que hace de verdad (auditoría 2026-07-22). */}
      {onAbrirPropia && (
        <button
          onClick={onAbrirPropia}
          style={{ width: "100%", marginTop: 8, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "11px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Dumbbell size={16} strokeWidth={2} />Rutinas propias (movilidad · elástico · calor)
        </button>
      )}
    </div>
  );

  const grid = (
    // Ronda 18 — FIX del scroll roto en mobile: este wrapper vive en un
    // flex COLUMN (viewport fijo) y sin minHeight:0 un flex item nunca se
    // achica por debajo de su contenido (min-height:auto) — el grid crecía
    // más alto que la pantalla, el overflowY:auto interno nunca se
    // activaba y el root (position:fixed sin overflow) tampoco scrolleaba:
    // resultado, lista congelada en el celular. Con minHeight:0 el área de
    // la lista se acota al alto disponible y su scroll interno funciona.
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* barra de resultados + filtros activos */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {badgesActivos.map((b) => (
          <span key={b.l} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: S.card2, border: "1px solid " + S.border, borderRadius: 20, padding: "3px 9px", fontSize: 11, color: S.white }}>
            {b.l}
            <button onClick={b.del} style={{ background: "transparent", border: "none", color: S.gray, cursor: "pointer", padding: 0, lineHeight: 1, display: "inline-flex", alignItems: "center" }}><X size={14} strokeWidth={2} /></button>
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: S.gray }}>
          {cat ? `${filtrados.length} de ${cat.length} ejercicios` : "Cargando catálogo…"}
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {!cat ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ ...card, height: 200, opacity: 0.4 }} />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ color: S.gray, padding: 40, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Search size={16} strokeWidth={2} />No se encontraron ejercicios</div>
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
                        <Dumbbell size={30} color={S.bg} strokeWidth={2} />
                      )}
                    </div>
                    {e.codigo_di && (
                      <span style={{ position: "absolute", top: 6, left: 6, background: S.bg, color: S.white, border: "1px solid " + S.border, borderRadius: 4, fontSize: 9, fontWeight: 800, padding: "1px 5px" }}>
                        {e.codigo_di}
                      </span>
                    )}
                    {e.editado && (
                      <span style={{ position: "absolute", top: 6, right: armadorAbierto ? 34 : 6, background: S.bg, color: S.green, border: "1px solid " + S.border, borderRadius: 4, padding: "3px 5px", display: "inline-flex", alignItems: "center" }}>
                        <Pencil size={12} strokeWidth={2} />
                      </span>
                    )}
                    {armadorAbierto && (
                      <button
                        onClick={(ev) => { ev.stopPropagation(); agregarAlCarrito(e); }}
                        title="Agregar al plan"
                        style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: enCarrito ? S.green : S.white, color: S.bg, border: "none", fontWeight: 900, fontSize: 14, cursor: "pointer", lineHeight: 1 }}
                      >
                        {enCarrito ? <Check size={14} strokeWidth={2} /> : "＋"}
                      </button>
                    )}
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ color: S.white, fontSize: 12, fontWeight: 700, lineHeight: 1.3, minHeight: 31, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {e.nombre_es}
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: S.gray, background: S.card2, borderRadius: 4, padding: "1px 6px" }}>{e.target_es}</span>
                        <span style={{ fontSize: 11, color: S.gray, background: S.card2, borderRadius: 4, padding: "1px 6px" }}>{e.equipment_es}</span>
                        {/* Ronda 18: badge de nivel + marca de archivado */}
                        {e.nivel && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: S.white, background: S.card3, border: "1px solid " + S.border2, borderRadius: 4, padding: "1px 6px" }}>
                            {labelNivel(e.nivel)}
                          </span>
                        )}
                        {e.archivado && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: S.yellow, background: S.card2, borderRadius: 4, padding: "1px 6px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Archive size={12} strokeWidth={2} />Archivado
                          </span>
                        )}
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


  // Chips de nivel reutilizables (armador + edición de plantilla).
  const nivelChips = (valor, onSet) => (
    <div style={{ display: "flex", gap: 6 }}>
      {NIVELES.map(([id, l]) => (
        <button
          key={id}
          onClick={() => onSet(valor === id ? "" : id)}
          style={{ flex: 1, background: valor === id ? S.white : S.card3, color: valor === id ? S.bg : S.gray, border: "1px solid " + (valor === id ? S.white : S.border2), borderRadius: 8, padding: "8px 4px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY }}
        >
          {l}
        </button>
      ))}
    </div>
  );

  const labelCampo = { fontSize: 11, color: S.gray, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 4, fontFamily: FONT_BODY };

  // ── Panel "Plan de Entrenamiento" (pantalla de armado) ──────────────
  // Ronda 18: título correcto + campos Nombre del Plan / Categoría / Nivel
  // (antes decía "Plan en construcción (N)" y solo tenía nombre y grupo).
  const planPanel = armadorAbierto && (
    <div style={{ ...card, width: isWide ? 300 : "auto", flexShrink: 0, padding: 12, display: "flex", flexDirection: "column", maxHeight: isWide ? "none" : "48vh", minHeight: 0 }}>
      <div style={{ ...eyebrow, marginBottom: 8 }}>
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
          <div style={{ color: S.gray, fontSize: 13, padding: "14px 4px", lineHeight: 1.5 }}>
            Tocá ＋ en los ejercicios de la lista para ir armando el plan.
          </div>
        ) : (
          carrito.map((it, i) => (
            <div key={it.id} style={{ background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, padding: "7px 9px", marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: S.gray, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.nombre_es}
              </span>
              <button onClick={() => moverCarrito(i, -1)} style={{ ...smallBtn(S.gray), padding: "2px 7px" }}>▲</button>
              <button onClick={() => moverCarrito(i, 1)} style={{ ...smallBtn(S.gray), padding: "2px 7px" }}>▼</button>
              <button onClick={() => setCarrito((c) => c.filter((x) => x.id !== it.id))} style={{ ...smallBtn(S.red), padding: "2px 7px", display: "inline-flex", alignItems: "center" }}><X size={14} strokeWidth={2} /></button>
            </div>
          ))
        )}
      </div>
      <button
        onClick={guardarPlan}
        disabled={guardandoPlan || carrito.length === 0 || !nombrePlan.trim()}
        style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 13, fontSize: 13, fontWeight: 900, letterSpacing: 0.8, cursor: "pointer", marginTop: 10, opacity: guardandoPlan || carrito.length === 0 || !nombrePlan.trim() ? 0.5 : 1, fontFamily: FONT_BODY }}
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
        unidad: "reps",
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

  const pantallaPlanes = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button
          onClick={() => {
            if (planSel) { setPlanSel(null); setPlanForm(null); }
            else setPantalla("biblioteca");
          }}
          style={{ ...smallBtn(S.gray), fontSize: 13, padding: "8px 12px" }}
        >
          ← Volver
        </button>
        <div style={{ color: S.white, fontWeight: 800, fontSize: 16, letterSpacing: 1, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
          {planSel ? "Editar plan" : "Todos los planes"}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {!planSel ? (
          !plantillas ? (
            <div style={{ color: S.gray, fontSize: 13, textAlign: "center", padding: 30 }}>Cargando planes…</div>
          ) : plantillas.length === 0 ? (
            <div style={{ ...card, padding: 24, textAlign: "center", color: S.gray, fontSize: 13 }}>
              Todavía no hay planes guardados — crealos con "＋ Crear plan de entrenamiento".
            </div>
          ) : (
            plantillas.map((p) => (
              <div key={p.id} style={{ ...card, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => abrirPlantilla(p)}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
                  <div style={{ color: S.gray, fontSize: 12, marginTop: 2 }}>
                    {[p.grupo, labelNivel(p.nivel), `${(p.dias || []).reduce((n, d) => n + (d.ejercicios || []).length, 0)} ejercicio(s)`].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <button onClick={() => abrirPlantilla(p)} style={{ ...smallBtn(S.white), padding: "6px 12px", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6 }}><Pencil size={14} strokeWidth={2} />Editar</button>
                <button onClick={() => eliminarPlantilla(p)} style={{ ...smallBtn(S.red), padding: "6px 10px", flexShrink: 0, display: "inline-flex", alignItems: "center" }}><Trash2 size={16} strokeWidth={2} /></button>
              </div>
            ))
          )
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
                  {planForm.dias.length > 1 && <div style={{ ...eyebrow, marginBottom: 8 }}>{d.dia || `Día ${di + 1}`}</div>}
                  {(d.ejercicios || []).length === 0 && (
                    <div style={{ color: S.gray, fontSize: 13, padding: "6px 2px" }}>Sin ejercicios en este día.</div>
                  )}
                  {(d.ejercicios || []).map((ej, i) => (
                    <div key={ej.id || i} style={{ background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, padding: "7px 9px", marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ color: S.gray, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ej.nombre}</span>
                      <button onClick={() => moverEjPlantilla(di, i, -1)} style={{ ...smallBtn(S.gray), padding: "2px 7px" }}>▲</button>
                      <button onClick={() => moverEjPlantilla(di, i, 1)} style={{ ...smallBtn(S.gray), padding: "2px 7px" }}>▼</button>
                      <button onClick={() => quitarEjPlantilla(di, i)} style={{ ...smallBtn(S.red), padding: "2px 7px", display: "inline-flex", alignItems: "center" }}><X size={14} strokeWidth={2} /></button>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ ...card, padding: 12, marginBottom: 12 }}>
                <div style={{ ...eyebrow, marginBottom: 8 }}>Agregar ejercicio</div>
                <input value={qPlanAdd} onChange={(e) => setQPlanAdd(e.target.value)} placeholder="Buscar en el catálogo…" style={inp} />
                {sugerenciasPlanAdd.map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", borderBottom: "1px solid " + S.border }}>
                    <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {e.codigo_di ? e.codigo_di + " · " : ""}{e.nombre_es}
                    </span>
                    <button onClick={() => agregarEjPlantilla(e)} style={{ ...smallBtn(S.white), padding: "3px 10px" }}>＋</button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button onClick={() => { setPlanSel(null); setPlanForm(null); }} style={{ ...smallBtn(S.gray), padding: "12px 16px", fontSize: 13 }}>
                  Cancelar
                </button>
                <button
                  onClick={guardarPlantilla}
                  disabled={guardandoPlantilla}
                  style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 900, cursor: "pointer", opacity: guardandoPlantilla ? 0.6 : 1, fontFamily: FONT_BODY }}
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
        <button onClick={cerrarArmador} style={{ ...smallBtn(S.gray), fontSize: 13, padding: "8px 12px" }}>
          ← Volver
        </button>
        <div style={{ color: S.white, fontWeight: 800, fontSize: 16, letterSpacing: 1, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
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
        <div style={{ color: S.white, fontWeight: 800, fontSize: 16, letterSpacing: 1, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><BookOpen size={18} strokeWidth={2} />Biblioteca de ejercicios</span>
        </div>
        {!isWide && (
          <button onClick={() => setMostrarFiltros((v) => !v)} style={{ ...smallBtn(S.gray), fontSize: 13 }}>
            {mostrarFiltros ? "Ocultar filtros" : "Filtros"}
          </button>
        )}
        <button onClick={onClose} style={{ ...smallBtn(S.gray), fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}><X size={14} strokeWidth={2} />Cerrar</button>
      </div>
      {/* Ronda 18: barra de ACCIONES principal — los botones de crear
          salieron del panel de filtros y viven acá arriba, junto con
          "Ver todos los planes". */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <button
          onClick={abrirNuevo}
          style={{ flex: "1 1 150px", minWidth: 0, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: "11px 10px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY }}
        >
          ＋ Crear ejercicio nuevo
        </button>
        <button
          onClick={() => setPantalla("armador")}
          style={{ flex: "1 1 150px", minWidth: 0, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "11px 10px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY }}
        >
          ＋ Crear plan de entrenamiento
        </button>
        <button
          onClick={() => setPantalla("planes")}
          style={{ flex: "1 1 150px", minWidth: 0, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "11px 10px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <FolderTree size={16} strokeWidth={2} />Ver todos los planes
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: isWide ? "row" : "column", gap: isWide ? 14 : 10 }}>
        {(isWide || mostrarFiltros) && sidebar}
        {grid}
      </div>
    </>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: S.bg, zIndex: 100, display: "flex", flexDirection: "column", padding: "14px 16px", overflow: "hidden" }}>
      {pantalla === "planes" ? pantallaPlanes : pantalla === "armador" ? pantallaArmador : pantallaBiblioteca}

      {/* detalle */}
      {detalle && form && (
        <div onClick={() => { setDetalle(null); setCreando(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "100%", maxWidth: 460, maxHeight: "92vh", overflowY: "auto", WebkitOverflowScrolling: "touch", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ color: S.white, fontWeight: 800, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", fontFamily: FONT_DISPLAY }}>
                {creando ? "＋ Crear ejercicio nuevo" : "Editar ejercicio"}
              </div>
              <button onClick={() => { setDetalle(null); setCreando(false); }} style={{ background: "transparent", border: "none", color: S.gray, cursor: "pointer", display: "inline-flex", alignItems: "center" }}><X size={18} strokeWidth={2} /></button>
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
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Código</div>
            <input
              value={form.codigo_di}
              onChange={(e) => { setForm((f) => ({ ...f, codigo_di: e.target.value.toUpperCase() })); setCodigoError(""); }}
              placeholder="ej. CO006 (dejar vacío = sin código)"
              style={{ ...inp, marginBottom: codigoError ? 4 : 10, fontWeight: 700, borderColor: codigoError ? S.red : undefined }}
            />
            {codigoError && <div style={{ fontSize: 12, color: S.red, marginBottom: 10 }}>{codigoError}</div>}
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Nombre</div>
            <input value={form.nombre_es} onChange={(e) => setForm((f) => ({ ...f, nombre_es: e.target.value }))} style={{ ...inp, marginBottom: 10, fontWeight: 700 }} />
            {detalle.nombre_en && (
              <div style={{ fontSize: 11, color: S.lgray, marginTop: -6, marginBottom: 10 }}>EN: {detalle.nombre_en}</div>
            )}
            {/* Ronda 17 (punto 3): categoría editable con datalist. */}
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Categoría</div>
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
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Nivel</div>
            <div style={{ marginBottom: 10 }}>{nivelChips(form.nivel, (v) => setForm((f) => ({ ...f, nivel: v })))}</div>
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Instrucciones</div>
            <textarea value={form.instrucciones_es} onChange={(e) => setForm((f) => ({ ...f, instrucciones_es: e.target.value }))} rows={5} style={{ ...inp, resize: "vertical", marginBottom: 12, lineHeight: 1.45 }} />
            {/* músculos editables, con ★ predeterminado (punto 4) */}
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Músculos trabajados</div>
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
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Tags (equipamiento y otros)</div>
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
                <div style={{ fontSize: 11, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Link video (YouTube o propio)</div>
                <input value={form.video} onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))} placeholder="https://…" style={{ ...inp, marginBottom: 8 }} />
                <div style={{ marginBottom: 12 }}>
                  <SubirVideoInline onUrl={(url) => setForm((f) => ({ ...f, video: url }))} showToast={showToast} />
                </div>
              </>
            )}
            {/* Ronda 18: archivar/desarchivar (solo ejercicios existentes) */}
            {!creando && detalle.id && (
              <button
                onClick={() => toggleArchivado(detalle)}
                style={{ width: "100%", marginBottom: 10, background: "transparent", color: detalle.archivado ? S.green : S.yellow, border: "1px solid " + (detalle.archivado ? S.green : S.yellow), borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY }}
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
                  style={{ flex: 1, background: S.card2, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY }}
                >
                  ＋ AGREGAR AL PLAN
                </button>
              )}
              <button
                onClick={guardarDetalle}
                disabled={guardando}
                style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 900, cursor: "pointer", opacity: guardando ? 0.6 : 1, fontFamily: FONT_BODY }}
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
