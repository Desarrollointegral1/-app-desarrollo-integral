// ══════════════════════════════════════════════════════════════════════
// CATÁLOGO DE EJERCICIOS — explorador estilo index del dataset ExerciseDB
// (sidebar de filtros + grid de cards + detalle), EN ESPAÑOL y con la
// estética DI. La organización replica la del dataset a pedido de Lucas:
// filtros por Categoría / Equipamiento / Músculo objetivo como chips
// multi-select, badges de filtros activos con ✕, contador "X de Y
// ejercicios", cards con imagen (lazy) que pasan a GIF en hover.
//
// Dos modos:
//   · "biblioteca": pantalla Biblioteca del admin (mobile-first). Click en
//     una card abre el detalle con nombre/instrucciones EDITABLES, video
//     propio (bucket ejercicios-videos) y chips de músculos. Guardar marca
//     editado=true en catalogo_ejercicios.
//   · "armador": versión web desktop para ARMAR PLANES — sidebar +
//     grid + panel derecho (carrito): elegís alumno y destino (día nuevo
//     o plan existente), agregás con ＋, reordenás, y GUARDAR persiste en
//     alumno_planes/plan_dias/plan_ejercicios como cualquier plan. Cada
//     ejercicio elegido se agrega además a biblioteca_ejercicios si no
//     estaba (código DI o próximo X## libre).
//
// Performance: render incremental de a 60 con "Cargar más" + loading lazy
// de imágenes — pensado para no explotar el celular con 1.344 items.
// ══════════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo, useRef } from "react";
import { S, card, inp, smallBtn } from "../utils/theme.js";
import { uid } from "../utils/helpers.js";
import labels from "../utils/catalogoLabels.json";
import {
  cargarCatalogoCached,
  catalogoMediaUrl,
  guardarEjercicioCatalogo,
  agregarCatalogoABiblioteca,
  subirVideo,
  crearPlanAlumno,
  actualizarPlanAlumnoDias,
  cargarPlanesXDia,
} from "../../services/supabase.js";

const PAGE = 60;
const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

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
  modo = "biblioteca",
  onClose,
  showToast,
  alumnos = [],
  onAlumnosUpdate,
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
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  // carrito (modo armador)
  const [carrito, setCarrito] = useState([]);
  const [alumnoSel, setAlumnoSel] = useState("");
  const [destino, setDestino] = useState("nuevo");
  const [diaSemana, setDiaSemana] = useState("Lunes");
  const [nombrePlan, setNombrePlan] = useState("");
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
      if (soloDI && !e.codigo_di) return false;
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

  const abrirDetalle = (e) => {
    setDetalle(e);
    setForm({ nombre_es: e.nombre_es, instrucciones_es: e.instrucciones_es || "", video: e.video || "" });
  };

  const guardarDetalle = async () => {
    if (!detalle || !form || !form.nombre_es.trim()) return;
    setGuardando(true);
    const ok = await guardarEjercicioCatalogo(detalle.id, {
      nombre_es: form.nombre_es.trim(),
      instrucciones_es: form.instrucciones_es,
      video: form.video || "",
    });
    setGuardando(false);
    if (!ok) { showToast && showToast("Error guardando — revisá la consola"); return; }
    setCat((prev) => prev.map((e) => (e.id === detalle.id ? { ...e, ...form, editado: true } : e)));
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

  const alumnoActual = alumnos.find((a) => a.id === alumnoSel);
  const planesDestino = (alumnoActual?.planes || []).filter((p) => !p._sintetico);

  const guardarPlan = async () => {
    if (!alumnoActual) { showToast && showToast("Elegí un alumno"); return; }
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
      if (destino === "nuevo") {
        const r = await crearPlanAlumno(alumnoActual.id, diaSemana, {
          nombre: nombrePlan.trim() || "Plan",
          dias: [{ dia: "Sesion", subtitulo: "", ejercicios }],
        });
        if (!r.ok) throw new Error("No se pudo crear el plan");
      } else {
        const plan = planesDestino.find((p) => p.id === destino);
        if (!plan) throw new Error("El plan destino ya no existe — recargá");
        const dias = (plan.dias && plan.dias.length > 0)
          ? plan.dias.map((d, i) => (i === 0 ? { ...d, ejercicios: [...(d.ejercicios || []), ...ejercicios] } : d))
          : [{ dia: "Sesion", subtitulo: "", ejercicios }];
        const ok = await actualizarPlanAlumnoDias(plan.id, dias);
        if (!ok) throw new Error("No se pudo actualizar el plan");
      }
      const planesFrescos = await cargarPlanesXDia(alumnoActual.id, alumnoActual);
      onAlumnosUpdate && onAlumnosUpdate((prev) => (Array.isArray(prev) ? prev : []).map((a) =>
        a.id === alumnoActual.id ? { ...a, planes: planesFrescos } : a));
      showToast && showToast(`Plan guardado para ${alumnoActual.nombre} ✓`);
      setCarrito([]);
      setNombrePlan("");
    } catch (e) {
      console.error("[Armador]", e);
      showToast && showToast("Error: " + e.message);
    } finally {
      setGuardandoPlan(false);
    }
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
      <FiltroSeccion titulo="Categoría" valores={categorias} seleccion={fCat} onToggle={toggle(setFCat)} labelDe={labelCat} />
      <FiltroSeccion titulo="Equipamiento" valores={equipos} seleccion={fEq} onToggle={toggle(setFEq)} labelDe={labelEq} />
      <FiltroSeccion titulo="Músculo objetivo" valores={targets} seleccion={fTg} onToggle={toggle(setFTg)} labelDe={labelTg} />
      {modo === "biblioteca" && onAbrirPropia && (
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
                      <span style={{ position: "absolute", top: 6, right: modo === "armador" ? 34 : 6, background: S.bg, color: S.green, border: "1px solid " + S.border, borderRadius: 4, fontSize: 9, fontWeight: 800, padding: "1px 5px" }}>
                        ✎
                      </span>
                    )}
                    {modo === "armador" && (
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

  const carritoPanel = modo === "armador" && (
    <div style={{ width: isWide ? 290 : "auto", flexShrink: 0, borderLeft: isWide ? "1px solid " + S.border : "none", borderTop: isWide ? "none" : "1px solid " + S.border, paddingLeft: isWide ? 14 : 0, paddingTop: isWide ? 0 : 12, display: "flex", flexDirection: "column", maxHeight: isWide ? "none" : "40vh", overflowY: "auto" }}>
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
        Plan en construcción ({carrito.length})
      </div>
      <select value={alumnoSel} onChange={(e) => setAlumnoSel(e.target.value)} style={{ ...inp, marginBottom: 8 }}>
        <option value="">— Elegí alumno —</option>
        {alumnos.map((a) => (
          <option key={a.id} value={a.id}>{a.nombre}</option>
        ))}
      </select>
      {alumnoActual && (
        <select value={destino} onChange={(e) => setDestino(e.target.value)} style={{ ...inp, marginBottom: 8 }}>
          <option value="nuevo">➕ Día nuevo…</option>
          {planesDestino.map((p) => (
            <option key={p.id} value={p.id}>Agregar a: {p.dia_semana} · {p.nombre || "Plan"}</option>
          ))}
        </select>
      )}
      {alumnoActual && destino === "nuevo" && (
        <>
          <select value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)} style={{ ...inp, marginBottom: 8 }}>
            {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input value={nombrePlan} onChange={(e) => setNombrePlan(e.target.value)} placeholder="Nombre del plan (ej. Full Body)" style={{ ...inp, marginBottom: 8 }} />
        </>
      )}
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
        disabled={guardandoPlan || carrito.length === 0 || !alumnoActual}
        style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 900, cursor: "pointer", marginTop: 10, opacity: guardandoPlan || carrito.length === 0 || !alumnoActual ? 0.5 : 1 }}
      >
        {guardandoPlan ? "GUARDANDO..." : "GUARDAR PLAN"}
      </button>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: S.bg, zIndex: 100, display: "flex", flexDirection: "column", padding: "14px 16px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ color: S.white, fontWeight: 800, fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>
          {modo === "armador" ? "🖥 Armador de planes" : "📚 Biblioteca de ejercicios"}
        </div>
        <div style={{ fontSize: 10, color: S.lgray, flex: 1 }}>© Gym visual — gymvisual.com</div>
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
        <div onClick={() => setDetalle(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "100%", maxWidth: 460, maxHeight: "92vh", overflowY: "auto", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {detalle.codigo_di && (
                  <span style={{ background: S.card2, color: S.white, border: "1px solid " + S.border, borderRadius: 4, fontSize: 10, fontWeight: 800, padding: "2px 6px" }}>{detalle.codigo_di}</span>
                )}
                {detalle.grupo_di && (
                  <span style={{ color: S.gray, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{detalle.grupo_di}</span>
                )}
              </div>
              <button onClick={() => setDetalle(null)} style={{ background: "transparent", border: "none", color: S.gray, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            {/* media: video propio si hay, si no el GIF */}
            <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", marginBottom: 12, display: "flex", justifyContent: "center" }}>
              {form.video && !form.video.includes("youtube") ? (
                <video src={form.video} controls playsInline style={{ width: "100%", maxHeight: 260, background: "#000" }} />
              ) : detalle.gif_url ? (
                <img src={catalogoMediaUrl(detalle.gif_url)} alt={form.nombre_es} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }} />
              ) : detalle.image ? (
                <img src={catalogoMediaUrl(detalle.image)} alt={form.nombre_es} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }} />
              ) : (
                <div style={{ padding: 40, fontSize: 34 }}>🏋️</div>
              )}
            </div>
            <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Nombre</div>
            <input value={form.nombre_es} onChange={(e) => setForm((f) => ({ ...f, nombre_es: e.target.value }))} style={{ ...inp, marginBottom: 10, fontWeight: 700 }} />
            {detalle.nombre_en && (
              <div style={{ fontSize: 10, color: S.lgray, marginTop: -6, marginBottom: 10 }}>EN: {detalle.nombre_en}</div>
            )}
            <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Instrucciones</div>
            <textarea value={form.instrucciones_es} onChange={(e) => setForm((f) => ({ ...f, instrucciones_es: e.target.value }))} rows={5} style={{ ...inp, resize: "vertical", marginBottom: 10, lineHeight: 1.45 }} />
            {/* músculos */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ fontSize: 10, background: S.white, color: S.bg, borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>{detalle.target_es}</span>
              {(detalle.secondary_muscles_es || []).map((m) => (
                <span key={m} style={{ fontSize: 10, background: S.card2, color: S.gray, borderRadius: 4, padding: "2px 8px" }}>{m}</span>
              ))}
              <span style={{ fontSize: 10, background: S.card2, color: S.gray, borderRadius: 4, padding: "2px 8px" }}>🏷 {detalle.equipment_es}</span>
            </div>
            <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Link video (YouTube o propio)</div>
            <input value={form.video} onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))} placeholder="https://…" style={{ ...inp, marginBottom: 8 }} />
            <div style={{ marginBottom: 12 }}>
              <SubirVideoInline onUrl={(url) => setForm((f) => ({ ...f, video: url }))} showToast={showToast} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {modo === "armador" && (
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
                {guardando ? "GUARDANDO..." : "GUARDAR"}
              </button>
            </div>
            {detalle.attribution && (
              <div style={{ fontSize: 9, color: S.lgray, marginTop: 10, textAlign: "center" }}>{detalle.attribution}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
