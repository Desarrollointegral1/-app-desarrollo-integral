import { useState } from "react";
import { BookOpen, Film, Play, X } from "lucide-react";
import { actualizarEjercicioBibliotecaPorId } from "../../services/supabase.js";
import { GifPicker } from "../components/GifPicker.jsx";
import { VideoUploadButton } from "../components/VideoUploadButton.jsx";
import { GIFS_DISPONIBLES, getEjercicioGif, getNombresPorGif } from "../utils/ejerciciosMedia.js";
import { GRUPOS_MUSCULARES } from "../utils/planTemplates.js";
import { FONT_DISPLAY, S, card, inp, smallBtn } from "../utils/theme.js";

// ── BIBLIOTECA DE EJERCICIOS (ronda 12, punto 8) ────────────────────────
// Pantalla central e independiente de cualquier alumno puntual: TODOS los
// ejercicios de biblioteca_ejercicios, filtrables por categoría (derivada
// del prefijo del código: M/E/C/P), cada uno clickeable para ver/editar
// nombre, descripción, video y GIF manual. Reusa GifPicker/VideoUploadButton
// (los mismos componentes que ya usa el editor de Principales) — no duplica
// el editor de media.
export function BibliotecaScreen({ biblioteca, onGuardado, showToast, onClose }) {
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
