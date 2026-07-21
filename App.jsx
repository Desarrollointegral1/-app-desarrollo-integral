import { useState, useRef, useEffect } from "react";
// ── PERSISTENCIA (Supabase) ────────────────────────────────────────────
import {
  cargarDatos,
  cargarFotos,
  guardarFotoAlumno,
  guardarDatos,
  cargarPesos,
  guardarPesos,
  insertAlumno,
  deleteAlumno,
  cambiarPINAlumno,
  loginConCodigo,
  loginAdmin,
  crearAlumnoConPIN,
  subirVideo,
  crearPlanAlumno,
  cargarPlanesXDia,
  actualizarPlanAlumnoDias,
  crearAdmin,
  cargarBiblioteca,
  guardarEjercicioBiblioteca,
  eliminarEjercicioBiblioteca,
  cargarNovedades,
  crearNovedad,
  toggleNovedad,
  eliminarNovedad,
  // NUEVAS FUNCIONES - REDISEÑO v2
  saveDailyWeight,
  saveDailyAttendance,
  saveBioimpedanciaCompleta,
  cargarBioimpedanciaCompleta,
  cargarPesosPorDia,
  // REHABILITACIÓN (ronda 7)
  subirMediaRehab,
  guardarEjercicioBibliotecaRehab,
} from "./services/supabase.js";
import {
  RM_EJS,
  hoy,
  mesActual,
  mk,
  emptyRM,
  getYTId,
  initPesos,
  initH,
  uid,
  getSemanaActual,
} from "./src/utils/helpers.js";
import {
  PERIODIZACION_BASE,
  MOVILIDAD_BASE,
  CALOR_BASE,
  ACTIVACION_BASE,
  PLAN_BILATERAL,
  PLAN_UNILATERAL,
  PLAN_BASE,
  PLANTILLAS,
  getPlantilla,
  clonarPlan,
} from "./src/utils/planTemplates.js";
import { generarPDF } from "./src/utils/pdfGenerator.js";
import { S, card, inp, tabBtn, smallBtn, tabN1, tabN2, applyTheme } from "./src/utils/theme.js";
import DIWordmark from "./src/components/DIWordmark.jsx";
import MiniChart from "./src/components/MiniChart.jsx";
import ItemCard from "./src/components/ItemCard.jsx";
import PlanDelDia from "./src/components/PlanDelDia.jsx";
import { EstudioBioSeccion } from "./src/components/EstudioBio.jsx";
import VideosMovilidadAdmin from "./src/components/VideosMovilidadAdmin.jsx";
// ── LOGO ──────────────────────────────────────────────────────────────
const ICON_WHITE =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg id="a" xmlns="http://www.w3.org/2000/svg" width="1500" height="1500" viewBox="0 0 1500 1500"><g><path d="M749.86,1171.008v9.548s-.04-1.818-.16-5.254c.04-1.238.1-2.657.16-4.295Z" fill="#fff"/><g><path d="M1100.176,457.931c-1.646,2.291-66.952,91.918-156.767,161.748-43.672,33.954-80.83,75.699-107.653,124.079-17.779,32.068-34.14,70.471-44.945,115.028-31.642,130.562-39.392,274.368-40.95,312.222-.06,1.638-.12,3.056-.16,4.295-.06-1.238-.12-2.657-.18-4.295-1.558-37.854-9.309-181.66-40.95-312.222-11.623-47.953-29.689-88.78-49.034-122.25-26.185-45.303-61.486-84.632-102.803-116.74-89.891-69.855-155.269-159.576-156.909-161.865,3.036,2.697,197.94,176.187,350.116,176.287h.12c152.176-.1,347.08-173.59,350.116-176.287Z" fill="#fff"/><path d="M749.7,1175.303c-.14,3.436-.18,5.254-.18,5.254v-9.548c.06,1.638.12,3.056.18,4.295Z" fill="#fff"/></g></g><circle cx="750.001" cy="508.788" r="69.377" fill="#fff"/><path d="M689.368,1062.142s-6.193-178.398-52.626-271.706c-60.339-121.251-203.315-204.621-203.315-204.621,0,0,97.15,96.045,163.424,228.592,66.274,132.547,92.518,247.736,92.518,247.736Z" fill="#fff"/><path d="M810.874,1062.142s6.193-178.398,52.626-271.706c60.339-121.251,203.315-204.621,203.315-204.621,0,0-97.15,96.045-163.424,228.592-66.274,132.547-92.518,247.736-92.518,247.736Z" fill="#fff"/></svg>',
  );
const ICON_BLACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg id="a" xmlns="http://www.w3.org/2000/svg" width="1500" height="1500" viewBox="0 0 1500 1500"><g><path d="M749.86,1171.008v9.548s-.04-1.818-.16-5.254c.04-1.238.1-2.657.16-4.295Z"/><g><path d="M1100.176,457.931c-1.646,2.291-66.952,91.918-156.767,161.748-43.672,33.954-80.83,75.699-107.653,124.079-17.779,32.068-34.14,70.471-44.945,115.028-31.642,130.562-39.392,274.368-40.95,312.222-.06,1.638-.12,3.056-.16,4.295-.06-1.238-.12-2.657-.18-4.295-1.558-37.854-9.309-181.66-40.95-312.222-11.623-47.953-29.689-88.78-49.034-122.25-26.185-45.303-61.486-84.632-102.803-116.74-89.891-69.855-155.269-159.576-156.909-161.865,3.036,2.697,197.94,176.187,350.116,176.287h.12c152.176-.1,347.08-173.59,350.116-176.287Z"/><path d="M749.7,1175.303c-.14,3.436-.18,5.254-.18,5.254v-9.548c.06,1.638.12,3.056.18,4.295Z"/></g></g><circle cx="750.001" cy="508.788" r="69.377"/><path d="M689.368,1062.142s-6.193-178.398-52.626-271.706c-60.339-121.251-203.315-204.621-203.315-204.621,0,0,97.15,96.045,163.424,228.592,66.274,132.547,92.518,247.736,92.518,247.736Z"/><path d="M810.874,1062.142s6.193-178.398,52.626-271.706c60.339-121.251,203.315-204.621,203.315-204.621,0,0-97.15,96.045-163.424,228.592-66.274,132.547-92.518,247.736-92.518,247.736Z"/></svg>',
  );
let ICON = ICON_WHITE;
const ALUMNOS_INIT = [];

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
// ── HELPERS ───────────────────────────────────────────────────────────────────
function calcularEdad(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}
// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1c1c1c",
        border: "1px solid #333",
        borderRadius: 10,
        padding: "11px 22px",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        zIndex: 9999,
        pointerEvents: "none",
        maxWidth: 320,
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.7)",
        letterSpacing: 0.3,
      }}
    >
      {" "}
      {msg}{" "}
    </div>
  );
}
// ── ESTILOS GLOBALES (animaciones) ────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`      @keyframes diSlideUp {        from { opacity:0; transform:translateY(16px); }        to   { opacity:1; transform:translateY(0); }      }      @keyframes diFadeIn {        from { opacity:0; }        to   { opacity:1; }      }      @keyframes diPopIn {        0%   { opacity:0; transform:scale(0.88); }        65%  { transform:scale(1.04); }        100% { opacity:1; transform:scale(1); }      }      @keyframes diPulse {        0%,100% { box-shadow:0 0 0 0 rgba(76,175,80,0.45); }        50%     { box-shadow:0 0 0 10px rgba(76,175,80,0); }      }      @keyframes diSpin {        to { transform:rotate(360deg); }      }      @keyframes diSpinY {        from { transform:rotateY(0deg); }        to   { transform:rotateY(360deg); }      }      .di-logo3d { animation:diSpinY 18s linear infinite; transform-style:preserve-3d; will-change:transform; backface-visibility:visible; }      .di-slide { animation:diSlideUp 0.22s ease both; }      .di-fade  { animation:diFadeIn  0.18s ease both; }      .di-pop   { animation:diPopIn   0.28s cubic-bezier(0.34,1.56,0.64,1) both; }      .di-pulse { animation:diPulse   1.6s ease infinite; }      button { -webkit-tap-highlight-color:transparent; transition:transform 0.1s,opacity 0.1s; }      button:active:not(:disabled) { transform:scale(0.95) !important; opacity:0.85; }      input,textarea,select { transition:border-color 0.15s,box-shadow 0.15s; }      input:focus,textarea:focus,select:focus { box-shadow:0 0 0 2px rgba(255,255,255,0.15); }    `}</style>
  );
}
// ── FOTO ALUMNO ───────────────────────────────────────────────────────
// Comprime la imagen antes de guardarla: las fotos de cámara pesan varios MB
// y guardadas en base64 dentro de la tabla hacían la app inusablemente lenta.
// 512px máx + JPEG 0.82 ≈ 40-80 KB, de sobra para un avatar circular.
// ── LOGO 3D ───────────────────────────────────────────────────────────
// Ícono oficial con extrusión real: varias capas del ícono separadas en Z
// (translateZ) girando juntas — las de atrás oscurecidas = profundidad.
// Reutilizable: login, pantalla de carga y bienvenida (ronda 9).
// SIN sombra de piso (pedido de Lucas ronda 9).
function Logo3D({ size = 230 }) {
  const depth = Math.max(10, Math.round(size * 0.07));
  const zs = [-depth, -depth / 2, 0, depth / 2];
  return (
    <div style={{ perspective: Math.round(size * 1.4), width: size, height: size }}>
      <div className="di-logo3d" style={{ position: "relative", width: size, height: size, transformStyle: "preserve-3d" }}>
        {zs.map((z, i) => (
          <img
            key={z}
            src={ICON}
            width={size}
            height={size}
            alt={i === zs.length - 1 ? "DI" : ""}
            style={{
              position: "absolute",
              inset: 0,
              display: "block",
              transform: `translateZ(${z}px)`,
              opacity: i === zs.length - 1 ? 0.95 : 0.28 + i * 0.1,
              filter: i === zs.length - 1 ? "none" : "brightness(0.55)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
function comprimirFoto(dataUrl, maxLado = 512, calidad = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * escala);
      c.height = Math.round(img.height * escala);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", calidad));
    };
    img.onerror = () => resolve(dataUrl); // si no es una imagen legible, dejar tal cual
    img.src = dataUrl;
  });
}
function FotoAlumno({ foto, size = 56, editable, onFoto }) {
  const fileRef = useRef();
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => comprimirFoto(ev.target.result).then((comp) => onFoto && onFoto(comp));
    r.readAsDataURL(f);
  };
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {" "}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: S.card2,
          border: "2px solid " + S.border,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: editable ? "pointer" : "default",
        }}
        onClick={() => editable && fileRef.current.click()}
      >
        {" "}
        {foto ? (
          <img src={foto} alt="foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ color: S.gray, fontSize: editable ? 20 : 15, fontWeight: 700 }}>{editable ? "+" : "?"}</div>
        )}{" "}
      </div>{" "}
      {editable && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            background: S.white,
            borderRadius: "50%",
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            cursor: "pointer",
            boxShadow: "0 1px 4px #000",
          }}
          onClick={() => fileRef.current.click()}
        >
          ✎
        </div>
      )}{" "}
      {editable && (
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      )}{" "}
    </div>
  );
}
// ── MEDIA UPLOADER ────────────────────────────────────────────────────
function MediaUploader({ media, onMedia }) {
  const fileRef = useRef();
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      window.alert("Max 8MB. Para videos largos usá YouTube.");
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => onMedia(ev.target.result);
    r.readAsDataURL(f);
  };
  return (
    <div>
      {" "}
      <div
        onClick={() => fileRef.current.click()}
        style={{
          background: S.card2,
          border: "2px dashed " + S.border,
          borderRadius: 8,
          padding: 14,
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 6,
        }}
      >
        {" "}
        {media ? (
          media.startsWith("data:video") ? (
            <video src={media} style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 6 }} controls />
          ) : (
            <img
              src={media}
              alt=""
              style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 6 }}
            />
          )
        ) : (
          <div style={{ color: S.lgray, fontSize: 12 }}>📎 Foto o video corto (max 8MB)</div>
        )}{" "}
      </div>{" "}
      <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFile} />{" "}
      {media && (
        <button
          onClick={() => onMedia("")}
          style={{
            background: "transparent",
            color: S.red,
            border: "1px solid " + S.red,
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          ✕ Quitar
        </button>
      )}{" "}
    </div>
  );
}
// ── VIDEO UPLOAD BUTTON ───────────────────────────────────────────────
function VideoUploadButton({ onVideoUrl }) {
  const [cargando, setCargando] = useState(false);
  const [err, setErr] = useState("");

  const handleFileSelect = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("video/")) {
      setErr("Solo se aceptan videos");
      return;
    }

    setCargando(true);
    setErr("");

    try {
      const url = await subirVideo(archivo);
      onVideoUrl(url);
      setErr("");
    } catch (error) {
      setErr(error.message || "Error al subir video");
    } finally {
      setCargando(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={cargando}
          style={{
            position: "absolute",
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: cargando ? "not-allowed" : "pointer",
          }}
        />
        <button
          disabled={cargando}
          style={{
            ...inp,
            display: "block",
            cursor: cargando ? "not-allowed" : "pointer",
            opacity: cargando ? 0.6 : 1,
            background: cargando ? S.lgray : S.card2,
            color: S.white,
          }}
        >
          {cargando ? "Subiendo..." : "Seleccionar video"}
        </button>
      </div>
      {err && <div style={{ color: S.red, fontSize: 12, marginBottom: 8 }}>{err}</div>}
    </div>
  );
}
// ── EJERCICIO EDITOR ──────────────────────────────────────────────────
function EjercicioEditor({ items, onChange, showVideo, biblioteca = [], onGuardarBiblioteca }) {
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ nombre: "", desc: "", video: "", mediaLocal: "" });
  const [sugs, setSugs] = useState([]); // sugerencias de biblioteca activas
  const [showSugs, setShowSugs] = useState(false);

  const startEdit = (i) => {
    setEditIdx(i);
    setForm({
      nombre: items[i].nombre,
      desc: items[i].desc,
      video: items[i].video || "",
      mediaLocal: items[i].mediaLocal || "",
    });
    setSugs([]); setShowSugs(false);
  };
  const startNew = () => {
    setEditIdx(-1);
    setForm({ nombre: "", desc: "", video: "", mediaLocal: "" });
    setSugs([]); setShowSugs(false);
  };
  const cancel = () => {
    setEditIdx(null);
    setForm({ nombre: "", desc: "", video: "", mediaLocal: "" });
    setSugs([]); setShowSugs(false);
  };
  const save = () => {
    if (!form.nombre.trim()) return;
    const updated = [...items];
    if (editIdx === -1) updated.push({ ...form, id: uid(), historial: [] });
    else updated[editIdx] = { ...updated[editIdx], ...form };
    onChange(updated);
    // Auto-guardar en biblioteca si tiene video
    if (form.video && onGuardarBiblioteca) {
      onGuardarBiblioteca({ nombre: form.nombre, desc: form.desc, video: form.video });
    }
    cancel();
  };
  const handleNombreChange = (val) => {
    setForm((f) => ({ ...f, nombre: val }));
    if (val.length >= 2) {
      const q = val.toLowerCase();
      const matches = [
        ...biblioteca.filter((b) => b.nombre.toLowerCase().includes(q)),
        ...EJS_SUGERIDOS.filter((n) => n.toLowerCase().includes(q) && !biblioteca.find((b) => b.nombre.toLowerCase() === n.toLowerCase())).map((n) => ({ nombre: n, desc: "", video: "" })),
      ].slice(0, 8);
      setSugs(matches);
      setShowSugs(matches.length > 0);
    } else {
      setSugs([]); setShowSugs(false);
    }
  };
  const selectSug = (sug) => {
    setForm((f) => ({
      ...f,
      nombre: sug.nombre,
      desc: sug.desc || f.desc,
      video: sug.video || f.video,
    }));
    setSugs([]); setShowSugs(false);
  };
  const remove = (i) => {
    if (!window.confirm("Eliminar?")) return;
    onChange(items.filter((_, j) => j !== i));
  };
  const move = (i, dir) => {
    const arr = [...items];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };
  return (
    <div>
      {" "}
      {items.map((ej, i) => (
        <div key={i} style={{ ...card, marginBottom: 6, padding: "10px 12px" }}>
          {" "}
          {editIdx === i ? (
            <div>
              {" "}
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>NOMBRE</div>{" "}
              <div style={{ position: "relative", marginBottom: 8 }}>
                <input
                  value={form.nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSugs(false), 150)}
                  onFocus={() => form.nombre.length >= 2 && sugs.length > 0 && setShowSugs(true)}
                  placeholder="Escribí para buscar..."
                  style={inp}
                  autoComplete="off"
                />
                {showSugs && sugs.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, zIndex: 50, maxHeight: 260, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                    {sugs.map((sug, i) => (
                      <div
                        key={i}
                        onMouseDown={() => selectSug(sug)}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: 10 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#252525"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: S.white, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sug.nombre}</div>
                          {sug.desc && <div style={{ color: S.gray, fontSize: 11, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sug.desc}</div>}
                        </div>
                        {sug.video && <div style={{ color: S.green, fontSize: 10, fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>▶ VIDEO</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>{" "}
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>DESCRIPCION</div>{" "}
              <textarea
                value={form.desc}
                onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                rows={2}
                style={{ ...inp, resize: "vertical", marginBottom: 8 }}
              />{" "}
              {showVideo && (
                <>
                  {" "}
                  <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>LINK YOUTUBE</div>{" "}
                  <input
                    value={form.video}
                    onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                    style={{ ...inp, marginBottom: 8 }}
                  />{" "}
                  <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>O SUBIR VIDEO</div>{" "}
                  <VideoUploadButton
                    onVideoUrl={(url) => setForm((f) => ({ ...f, video: url }))}
                  />{" "}
                </>
              )}{" "}
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
                  GUARDAR
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {" "}
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {" "}
                <button
                  onClick={() => move(i, -1)}
                  style={{
                    background: "transparent",
                    color: S.lgray,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 10,
                    padding: "1px 4px",
                  }}
                >
                  ▲
                </button>{" "}
                <button
                  onClick={() => move(i, 1)}
                  style={{
                    background: "transparent",
                    color: S.lgray,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 10,
                    padding: "1px 4px",
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
                  fontSize: 10,
                  color: S.gray,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>{" "}
              <div style={{ flex: 1 }}>
                {" "}
                <div style={{ color: S.white, fontSize: 13, fontWeight: 600 }}>{ej.nombre}</div>{" "}
                {ej.desc && (
                  <div style={{ color: S.gray, fontSize: 11, marginTop: 1 }}>
                    {ej.desc.slice(0, 50)}
                    {ej.desc.length > 50 ? "..." : ""}
                  </div>
                )}{" "}
                {showVideo && (ej.video || ej.mediaLocal) && (
                  <div style={{ color: "#4a9eff", fontSize: 10, marginTop: 1 }}>▶ Media asignada</div>
                )}{" "}
              </div>{" "}
              <button onClick={() => startEdit(i)} style={smallBtn(S.white)}>
                ✎
              </button>{" "}
              <button onClick={() => remove(i)} style={smallBtn(S.red)}>
                ✕
              </button>{" "}
            </div>
          )}{" "}
        </div>
      ))}{" "}
      {editIdx === -1 ? (
        <div style={{ ...card, padding: 12, marginTop: 6 }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 700, marginBottom: 10 }}>Nuevo ejercicio</div>{" "}
          <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>NOMBRE</div>{" "}
          <input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            style={{ ...inp, marginBottom: 8 }}
          />{" "}
          <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>DESCRIPCION</div>{" "}
          <textarea
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
            rows={2}
            style={{ ...inp, resize: "vertical", marginBottom: 8 }}
          />{" "}
          {showVideo && (
            <>
              {" "}
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>LINK YOUTUBE</div>{" "}
              <input
                value={form.video}
                onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                style={{ ...inp, marginBottom: 8 }}
              />{" "}
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>O SUBIR FOTO / VIDEO</div>{" "}
              <MediaUploader media={form.mediaLocal} onMedia={(m) => setForm((f) => ({ ...f, mediaLocal: m }))} />{" "}
            </>
          )}{" "}
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
// ── DIAS EDITOR ───────────────────────────────────────────────────────
// ocultarAgregarDia (ronda 6): en Plan → Principales el "+ Dia" de acá abajo era
// redundante (agregar día ya está arriba con "+ Otro día") — se oculta, y si el
// plan tiene un solo día tampoco se muestra la fila de pills.
function DiasEditor({ dias = [], onChange, biblioteca = [], onGuardarBiblioteca, ocultarAgregarDia = false }) {
  const [selDia, setSelDia] = useState(0);
  const [editDia, setEditDia] = useState(false);
  const [diaForm, setDiaForm] = useState({ dia: "", subtitulo: "" });
  const safeSelDia = Math.min(selDia, Math.max(0, dias.length - 1));
  const d = dias[safeSelDia];
  const updateEjs = (ejs) => {
    const arr = [...dias];
    arr[selDia] = { ...arr[selDia], ejercicios: ejs };
    onChange(arr);
  };
  const saveDia = () => {
    if (!diaForm.dia.trim()) return;
    const arr = [...dias];
    arr[selDia] = { ...arr[selDia], ...diaForm };
    onChange(arr);
    setEditDia(false);
  };
  const addDia = () => {
    onChange([...dias, { dia: "Dia " + (dias.length + 1), subtitulo: "Ejercicios", ejercicios: [] }]);
    setSelDia(dias.length);
  };
  const removeDia = (i) => {
    if (dias.length <= 1) {
      window.alert("Debe haber al menos 1 dia.");
      return;
    }
    const arr = dias.filter((_, j) => j !== i);
    onChange(arr);
    setSelDia(Math.min(selDia, arr.length - 1));
  };
  if (!d) return (
    <div style={{ ...card, padding: 24, textAlign: "center" }}>
      <div style={{ color: S.gray, fontSize: 13, marginBottom: 12 }}>Sin días de entrenamiento</div>
      <button onClick={() => { onChange([{ dia: "Día 1", subtitulo: "Ejercicios", ejercicios: [] }]); setSelDia(0); }} style={{ background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>+ Agregar Día</button>
    </div>
  );
  return (
    <div>
      {" "}
      {!(ocultarAgregarDia && dias.length <= 1) && (
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {" "}
        {dias.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {" "}
            <button
              onClick={() => {
                setSelDia(i);
                setEditDia(false);
              }}
              style={{
                background: selDia === i ? S.white : S.card,
                color: selDia === i ? S.bg : S.gray,
                border: "1px solid " + (selDia === i ? S.white : S.border),
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {d.dia}
            </button>{" "}
            {dias.length > 1 && (
              <button
                onClick={() => removeDia(i)}
                style={{
                  background: "transparent",
                  color: S.red,
                  border: "1px solid " + S.red,
                  borderRadius: 6,
                  padding: "3px 6px",
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}{" "}
          </div>
        ))}{" "}
        {!ocultarAgregarDia && (
        <button
          onClick={addDia}
          style={{
            background: "transparent",
            color: S.gray,
            border: "1px dashed " + S.border,
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          + Dia
        </button>
        )}{" "}
      </div>
      )}{" "}
      {editDia ? (
        <div style={{ ...card, padding: 12, marginBottom: 12 }}>
          {" "}
          <input
            value={diaForm.dia}
            onChange={(e) => setDiaForm((f) => ({ ...f, dia: e.target.value }))}
            placeholder="Nombre"
            style={{ ...inp, marginBottom: 8 }}
          />{" "}
          <input
            value={diaForm.subtitulo}
            onChange={(e) => setDiaForm((f) => ({ ...f, subtitulo: e.target.value }))}
            placeholder="Subtitulo"
            style={{ ...inp, marginBottom: 8 }}
          />{" "}
          <div style={{ display: "flex", gap: 6 }}>
            {" "}
            <button
              onClick={saveDia}
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
              GUARDAR
            </button>{" "}
            <button
              onClick={() => setEditDia(false)}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          {" "}
          <div>
            <div style={{ color: S.white, fontWeight: 700, fontSize: 15 }}>{d.dia}</div>
            <div style={{ color: S.gray, fontSize: 12 }}>{d.subtitulo}</div>
          </div>{" "}
          <button
            onClick={() => {
              setDiaForm({ dia: d.dia, subtitulo: d.subtitulo });
              setEditDia(true);
            }}
            style={smallBtn(S.white)}
          >
            ✎ Editar
          </button>{" "}
        </div>
      )}{" "}
      <EjercicioEditor items={d.ejercicios} onChange={updateEjs} showVideo={true} biblioteca={biblioteca} onGuardarBiblioteca={onGuardarBiblioteca} />{" "}
    </div>
  );
}
// ── PERIODIZACION EDITOR ──────────────────────────────────────────────
function PeriodizacionEditor({ data, onChange }) {
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ series: "", reps: "", intensidad: "", fecha: "" });
  const startEdit = (i) => {
    setEditIdx(i);
    setForm({
      series: String(data[i].series),
      reps: String(data[i].reps),
      intensidad: data[i].intensidad || "",
      fecha: data[i].fecha || "",
    });
  };
  const autoFechas = (fechaBase, desde) => {
    if (!fechaBase) return;
    const parts = fechaBase.split("/");
    if (parts.length < 2) return;
    const year = new Date().getFullYear();
    let base = new Date(year, Number(parts[1]) - 1, Number(parts[0]));
    const arr = data.map((r, i) => {
      if (i < desde) return r;
      const d = new Date(base.getTime() + (i - desde) * 7 * 24 * 60 * 60 * 1000);
      return { ...r, fecha: d.getDate() + "/" + (d.getMonth() + 1) };
    });
    onChange(arr);
  };
  const save = () => {
    if (!form.series || !form.reps) return;
    const arr = data.map((r, i) =>
      i === editIdx
        ? { ...r, series: Number(form.series), reps: Number(form.reps), intensidad: form.intensidad, fecha: form.fecha }
        : r,
    );
    onChange(arr);
    if (form.fecha) autoFechas(form.fecha, editIdx);
    setEditIdx(null);
  };
  // Fecha de inicio del plan: con elegirla una vez, todas las semanas se
  // autocompletan (cada semana arranca 7 días después de la anterior).
  const setFechaInicio = (yyyy_mm_dd) => {
    if (!yyyy_mm_dd) return;
    const [, m, d] = yyyy_mm_dd.split("-");
    const base = new Date(Number(yyyy_mm_dd.slice(0, 4)), Number(m) - 1, Number(d));
    const arr = data.map((r, i) => {
      const f = new Date(base.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      return { ...r, fecha: f.getDate() + "/" + (f.getMonth() + 1) };
    });
    onChange(arr);
  };
  return (
    <div>
      {" "}
      <div style={{ ...card, padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: S.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Fecha de inicio (día 1 de la semana 1)
        </div>
        <input type="date" onChange={(e) => setFechaInicio(e.target.value)} style={inp} />
        <div style={{ fontSize: 10, color: S.green, marginTop: 6 }}>
          Elegila una vez y todas las semanas toman su fecha automáticamente (una por semana).
        </div>
      </div>{" "}
      {data.map((r, i) => (
        <div key={i} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
          {" "}
          {editIdx === i ? (
            <div>
              {" "}
              <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
                Semana {r.semana}
              </div>{" "}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {" "}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: S.gray, marginBottom: 4 }}>FECHA (lunes)</div>
                  <input
                    value={form.fecha}
                    onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                    placeholder="dd/mm"
                    style={inp}
                  />
                  {form.fecha && (
                    <div style={{ fontSize: 10, color: S.green, marginTop: 4 }}>
                      Semanas siguientes se calculan automaticamente
                    </div>
                  )}
                </div>{" "}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: S.gray, marginBottom: 4 }}>INTENSIDAD</div>
                  <input
                    value={form.intensidad}
                    onChange={(e) => setForm((f) => ({ ...f, intensidad: e.target.value }))}
                    placeholder="75%"
                    style={inp}
                  />
                </div>{" "}
              </div>{" "}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {" "}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: S.gray, marginBottom: 4 }}>SERIES</div>
                  <input
                    type="number"
                    value={form.series}
                    onChange={(e) => setForm((f) => ({ ...f, series: e.target.value }))}
                    style={inp}
                  />
                </div>{" "}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: S.gray, marginBottom: 4 }}>REPS</div>
                  <input
                    type="number"
                    value={form.reps}
                    onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
                    style={inp}
                  />
                </div>{" "}
              </div>{" "}
              <div style={{ display: "flex", gap: 8 }}>
                {" "}
                <button
                  onClick={save}
                  style={{
                    flex: 1,
                    background: S.white,
                    color: S.bg,
                    border: "none",
                    borderRadius: 6,
                    padding: "10px",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  GUARDAR
                </button>{" "}
                <button
                  onClick={() => setEditIdx(null)}
                  style={{
                    background: "transparent",
                    color: S.gray,
                    border: "1px solid " + S.border,
                    borderRadius: 6,
                    padding: "10px 16px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>{" "}
              </div>{" "}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {" "}
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {" "}
                <div
                  style={{
                    minWidth: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: S.card2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: S.white,
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {r.semana}
                </div>{" "}
                <div>
                  {" "}
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>
                    {r.series}x{r.reps}{" "}
                    {r.intensidad && <span style={{ color: S.green, fontSize: 12 }}>· {r.intensidad}</span>}
                  </div>{" "}
                  <div style={{ color: S.gray, fontSize: 11, marginTop: 2 }}>
                    {r.fecha || <span style={{ color: S.lgray, fontStyle: "italic" }}>sin fecha</span>}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <button onClick={() => startEdit(i)} style={smallBtn(S.white)}>
                ✎
              </button>{" "}
            </div>
          )}{" "}
        </div>
      ))}{" "}
    </div>
  );
}
// ── BUSCADOR ALUMNOS ──────────────────────────────────────────────────
function AlumnoBuscador({ alumnos, selId, onSelect }) {
  const [q, setQ] = useState("");
  const filtrados = alumnos.filter(
    (a) =>
      a.nombre.toLowerCase().includes(q.toLowerCase()) ||
      a.codigo.toLowerCase().includes(q.toLowerCase()) ||
      (a.username || "").toLowerCase().includes(q.toLowerCase()),
  );
  const al = alumnos.find((a) => a.id === selId);
  return (
    <div style={{ marginBottom: 14 }}>
      {" "}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre o username..."
        style={{ ...inp, marginBottom: 8 }}
      />{" "}
      {q && filtrados.length > 0 && (
        <div style={{ ...card, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
          {" "}
          {filtrados.map((a) => (
            <div
              key={a.id}
              onClick={() => {
                onSelect(a.id);
                setQ("");
              }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: "1px solid " + S.border,
                background: selId === a.id ? S.card2 : S.card,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {" "}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {" "}
                <FotoAlumno foto={a.foto} size={32} />{" "}
                <div>
                  <div style={{ color: S.white, fontWeight: 600, fontSize: 13 }}>{a.nombre}</div>
                  <div style={{ color: S.gray, fontSize: 11 }}>{a.username || a.codigo}</div>
                </div>{" "}
              </div>{" "}
              {selId === a.id && <div style={{ color: S.white, fontSize: 12 }}>✓</div>}{" "}
            </div>
          ))}{" "}
        </div>
      )}{" "}
      {al && !q && (
        <div style={{ background: S.card2, border: "1px solid " + S.border, borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <FotoAlumno foto={al.foto} size={32} />
          <div style={{ flex: 1 }}>
            <span style={{ color: S.white, fontWeight: 700 }}>{al.nombre}</span>
            <span style={{ color: S.gray, fontSize: 11, marginLeft: 8 }}>{al.username || al.codigo}</span>
          </div>
          <div style={{ color: S.green, fontSize: 11 }}>✓</div>
        </div>
      )}{" "}
    </div>
  );
}
// ── ASISTENCIA ────────────────────────────────────────────────────────
function Asistencia({ asistencia, onMarcar }) {
  const hoyStr = hoy();
  // Los registros pueden ser "YYYY-MM-DD" (viejos) o "YYYY-MM-DD HH:mm"
  // (nuevos, con hora) — comparar siempre solo la parte de fecha.
  const tieneDia = (d) => asistencia.some((x) => x.slice(0, 10) === d);
  const yaMarco = tieneDia(hoyStr);
  const [diaAnterior, setDiaAnterior] = useState("");
  const [showDiaAnterior, setShowDiaAnterior] = useState(false);
  const marcarDiaAnterior = () => {
    if (!diaAnterior || diaAnterior >= hoyStr) return;
    if (tieneDia(diaAnterior)) {
      alert("Ya marcaste ese día.");
      return;
    }
    onMarcar(diaAnterior);
    setDiaAnterior("");
    setShowDiaAnterior(false);
  };
  const mes = new Date();
  const diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1).getDay();
  const diasEnMes = Array.from({ length: diasMes }, (_, i) => {
    const d = new Date(mes.getFullYear(), mes.getMonth(), i + 1);
    return d.toISOString().split("T")[0];
  });
  const fueDias = asistencia.filter((d) => d.startsWith(mesActual().slice(0, 7))).length;
  const totalDias = diasEnMes.filter((d) => new Date(d) <= new Date()).length;
  const pct = totalDias > 0 ? Math.round((fueDias / totalDias) * 100) : 0;
  // Racha
  let racha = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    const ds = checkDate.toISOString().split("T")[0];
    if (tieneDia(ds)) {
      racha++;
    } else if (i > 0) break;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  const DIAS = ["D", "L", "M", "M", "J", "V", "S"];
  return (
    <div>
      {" "}
      {/* Stats */}{" "}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.green, fontWeight: 900, fontSize: 28 }}>{racha}</div>{" "}
          <div style={{ color: S.gray, fontSize: 10, letterSpacing: 1, marginTop: 2 }}>RACHA DIAS</div>{" "}
        </div>{" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{fueDias}</div>{" "}
          <div style={{ color: S.gray, fontSize: 10, letterSpacing: 1, marginTop: 2 }}>ESTE MES</div>{" "}
        </div>{" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{pct}%</div>{" "}
          <div style={{ color: S.gray, fontSize: 10, letterSpacing: 1, marginTop: 2 }}>ASISTENCIA</div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Boton marcar */}{" "}
      <button
        onClick={() => !yaMarco && onMarcar(hoyStr)}
        className={yaMarco ? "di-pulse" : ""}
        style={{
          width: "100%",
          background: yaMarco ? "#0d1f0d" : S.white,
          color: yaMarco ? S.green : S.bg,
          border: yaMarco ? "1px solid " + S.green : "none",
          borderRadius: 10,
          padding: "14px",
          fontSize: 14,
          fontWeight: 900,
          cursor: yaMarco ? "default" : "pointer",
          marginBottom: 16,
          letterSpacing: 1,
          transition: "all 0.3s",
        }}
      >
        {" "}
        {yaMarco ? "✓ ASISTENCIA MARCADA HOY" : "MARCAR ASISTENCIA HOY"}{" "}
      </button>{" "}
      {/* Marcar día anterior */}{" "}
      {!showDiaAnterior ? (
        <button
          onClick={() => setShowDiaAnterior(true)}
          style={{
            width: "100%",
            background: "transparent",
            color: S.gray,
            border: "1px solid " + S.border,
            borderRadius: 8,
            padding: "10px",
            fontSize: 12,
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          {" "}
          + Marcar un día anterior{" "}
        </button>
      ) : (
        <div style={{ ...card, padding: 12, marginBottom: 16 }}>
          {" "}
          <div style={{ fontSize: 12, color: S.gray, marginBottom: 8 }}>¿Qué día faltaste de registrar?</div>{" "}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {" "}
            <input
              type="date"
              value={diaAnterior}
              max={hoyStr}
              onChange={(e) => setDiaAnterior(e.target.value)}
              style={{ ...inp, flex: 1 }}
            />{" "}
            <button
              onClick={marcarDiaAnterior}
              disabled={!diaAnterior || diaAnterior >= hoyStr}
              style={{
                background: S.white,
                color: S.bg,
                border: "none",
                borderRadius: 6,
                padding: "9px 14px",
                fontWeight: 900,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Marcar
            </button>{" "}
            <button
              onClick={() => {
                setShowDiaAnterior(false);
                setDiaAnterior("");
              }}
              style={{
                background: "transparent",
                color: S.gray,
                border: "1px solid " + S.border,
                borderRadius: 6,
                padding: "9px 10px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Calendario del mes */}{" "}
      <div style={{ ...card, padding: 14 }}>
        {" "}
        <div style={{ color: S.white, fontWeight: 700, marginBottom: 10, fontSize: 13 }}>
          {" "}
          {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" }).toUpperCase()}{" "}
        </div>{" "}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
          {" "}
          {DIAS.map((d, i) => (
            <div key={i} style={{ textAlign: "center", color: S.lgray, fontSize: 10, fontWeight: 700 }}>
              {d}
            </div>
          ))}{" "}
        </div>{" "}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {" "}
          {Array(primerDia === 0 ? 6 : primerDia - 1)
            .fill(null)
            .map((_, i) => (
              <div key={"e" + i} />
            ))}{" "}
          {diasEnMes.map((d, i) => {
            const fue = tieneDia(d);
            const esHoy = d === hoyStr;
            const esFuturo = new Date(d) > new Date();
            return (
              <div
                key={d}
                style={{
                  aspectRatio: "1",
                  borderRadius: 6,
                  background: fue ? S.green : esHoy ? "#2a2a2a" : S.card2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: fue || esHoy ? 700 : 400,
                  color: fue ? "#000" : esHoy ? S.white : esFuturo ? S.lgray : S.gray,
                  border: esHoy ? "1px solid #444" : "none",
                }}
              >
                {" "}
                {i + 1}{" "}
              </div>
            );
          })}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
// ── EVOLUCION DE CARGAS ───────────────────────────────────────────────
function EvolucionCargas({ historiales, plan }) {
  const ejercicios = plan.dias.flatMap((d) => d.ejercicios);
  const [selEj, setSelEj] = useState(ejercicios[0] && ejercicios[0].id);
  const ej = ejercicios.find((e) => e.id === selEj);
  const hist = historiales[selEj] || [];
  // Agrupar por mes
  const porMes = {};
  hist.forEach((h) => {
    const m = h.fecha.slice(0, 7);
    if (!porMes[m] || h.peso > porMes[m]) porMes[m] = h.peso;
  });
  const dataMes = Object.entries(porMes)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, peso]) => ({ fecha: mes, peso }));
  return (
    <div>
      {" "}
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Evolucion de cargas por ejercicio
      </div>{" "}
      <select value={selEj || ""} onChange={(e) => setSelEj(e.target.value)} style={{ ...inp, marginBottom: 16 }}>
        {" "}
        {ejercicios.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre}
          </option>
        ))}{" "}
      </select>{" "}
      {hist.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📈</div>
          <div style={{ color: S.gray, fontSize: 13 }}>Sin registros para {ej && ej.nombre}</div>
        </div>
      ) : (
        <div>
          {" "}
          <div style={{ ...card, padding: 14, marginBottom: 12 }}>
            {" "}
            <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Maximo por mes</div>{" "}
            {dataMes.length >= 2 ? (
              <MiniChart data={dataMes} color={S.green} />
            ) : (
              <div style={{ color: S.lgray, fontSize: 12 }}>Necesitas registros en al menos 2 meses.</div>
            )}{" "}
          </div>{" "}
          <div style={{ ...card, padding: 14 }}>
            {" "}
            <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              Todos los registros
            </div>{" "}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              {" "}
              <thead>
                <tr style={{ background: S.card2 }}>
                  {" "}
                  <th style={{ padding: "6px 10px", color: S.gray, textAlign: "left" }}>Fecha</th>{" "}
                  <th style={{ padding: "6px 10px", color: S.gray, textAlign: "right" }}>Peso</th>{" "}
                </tr>
              </thead>{" "}
              <tbody>
                {" "}
                {[...hist].reverse().map((h, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid " + S.border }}>
                    {" "}
                    <td style={{ padding: "6px 10px", color: S.gray }}>{h.fecha}</td>{" "}
                    <td style={{ padding: "6px 10px", color: S.white, fontWeight: 700, textAlign: "right" }}>
                      {h.peso} kg
                    </td>{" "}
                  </tr>
                ))}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
// ── RESUMEN MENSUAL ───────────────────────────────────────────────────
function ResumenMensual({ asistencia, historiales, plan, diario }) {
  const mes = new Date();
  const mesStr = mesActual().slice(0, 7);
  const diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const asistMes = asistencia.filter((d) => d.startsWith(mesStr)).length;
  const totalHasta = Array.from(
    { length: diasMes },
    (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1),
  ).filter((d) => d <= new Date()).length;
  const pct = totalHasta > 0 ? Math.round((asistMes / totalHasta) * 100) : 0;
  const ejercicios = plan.dias.flatMap((d) => d.ejercicios);
  // Records del mes
  const records = ejercicios
    .map((ej) => {
      const histMes = (historiales[ej.id] || []).filter((h) => h.fecha.startsWith(mesStr));
      const max = histMes.length > 0 ? Math.max(...histMes.map((h) => h.peso)) : null;
      return { nombre: ej.nombre, max };
    })
    .filter((e) => e.max !== null);
  const diarioMes = (diario || []).filter((d) => d.fecha.startsWith(mesStr));
  return (
    <div>
      {" "}
      <div style={{ color: S.white, fontWeight: 900, fontSize: 16, marginBottom: 14 }}>
        {" "}
        Resumen — {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}{" "}
      </div>{" "}
      {/* Stats */}{" "}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.green, fontWeight: 900, fontSize: 28 }}>{asistMes}</div>{" "}
          <div style={{ color: S.gray, fontSize: 10, marginTop: 2 }}>ENTRENOS</div>{" "}
        </div>{" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{pct}%</div>{" "}
          <div style={{ color: S.gray, fontSize: 10, marginTop: 2 }}>ASISTENCIA</div>{" "}
        </div>{" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{diarioMes.length}</div>{" "}
          <div style={{ color: S.gray, fontSize: 10, marginTop: 2 }}>ENTRADAS</div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Records del mes */}{" "}
      {records.length > 0 && (
        <div style={{ ...card, padding: 14, marginBottom: 14 }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
            Pesos maximos del mes
          </div>{" "}
          {records.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: i < records.length - 1 ? "1px solid " + S.border : "none",
              }}
            >
              {" "}
              <div style={{ color: S.gray, fontSize: 13 }}>{r.nombre}</div>{" "}
              <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>{r.max} kg</div>{" "}
            </div>
          ))}{" "}
        </div>
      )}{" "}
      {/* Entradas del diario */}{" "}
      {diarioMes.length > 0 && (
        <div style={{ ...card, padding: 14 }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Diario del mes</div>{" "}
          {diarioMes
            .sort((a, b) => b.fecha.localeCompare(a.fecha))
            .map((e, i) => (
              <div
                key={i}
                style={{
                  marginBottom: i < diarioMes.length - 1 ? 10 : 0,
                  paddingBottom: i < diarioMes.length - 1 ? 10 : 0,
                  borderBottom: i < diarioMes.length - 1 ? "1px solid " + S.border : "none",
                }}
              >
                {" "}
                <div style={{ color: S.lgray, fontSize: 11, marginBottom: 4 }}>
                  {String(e.fecha).slice(0, 10)}{String(e.fecha).length > 10 ? ` · ${String(e.fecha).slice(11)} hs` : ""}
                </div>{" "}
                <div style={{ color: S.white, fontSize: 13 }}>{e.texto}</div>{" "}
              </div>
            ))}{" "}
        </div>
      )}{" "}
      {asistMes === 0 && records.length === 0 && (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ color: S.gray, fontSize: 13 }}>Sin actividad este mes todavia</div>
        </div>
      )}{" "}
    </div>
  );
}
// ── DIARIO ────────────────────────────────────────────────────────────
function Diario({ entradas, onAdd }) {
  const [texto, setTexto] = useState("");
  const MAX = 140;
  const guardar = () => {
    if (!texto.trim()) return;
    // Ronda 8: las entradas nuevas guardan fecha Y HORA ("YYYY-MM-DD HH:mm").
    // Las viejas quedan solo con fecha — la lectura es retrocompatible (mismo
    // criterio que la asistencia: slice(0,10) para la fecha, resto es hora).
    const ahora = new Date();
    const conHora = `${hoy()} ${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
    onAdd({ fecha: conHora, texto: texto.trim() });
    setTexto("");
  };
  return (
    <div>
      {/* Ronda 8: sin título "Mi diario de entrenamiento" — el recuadro va
          directo debajo del botón de asistencia */}
      <div style={{ ...card, padding: 14, marginBottom: 14 }}>
        {" "}
        <div style={{ fontSize: 11, color: S.gray, marginBottom: 6 }}>Como estuvo el entreno hoy?</div>{" "}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, MAX))}
          placeholder="Ej: Muy buen dia, subi peso en sentadilla..."
          rows={3}
          style={{ ...inp, resize: "none", marginBottom: 6 }}
        />{" "}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {" "}
          <div style={{ fontSize: 11, color: texto.length > 120 ? S.red : S.lgray }}>
            {texto.length}/{MAX}
          </div>{" "}
          <button
            onClick={guardar}
            disabled={!texto.trim()}
            style={{
              background: texto.trim() ? S.white : S.card2,
              color: texto.trim() ? S.bg : S.lgray,
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontWeight: 900,
              fontSize: 12,
              cursor: texto.trim() ? "pointer" : "default",
            }}
          >
            GUARDAR
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {entradas.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📓</div>
          <div style={{ color: S.gray, fontSize: 13 }}>Sin entradas todavia</div>
        </div>
      ) : (
        [...entradas]
          .sort((a, b) => b.fecha.localeCompare(a.fecha))
          .map((e, i) => (
            <div key={i} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
              {" "}
              <div style={{ color: S.lgray, fontSize: 11, marginBottom: 4 }}>
                {e.fecha.slice(0, 10)}
                {e.fecha.length > 10 && <span style={{ color: S.green, fontWeight: 700 }}> · {e.fecha.slice(11)} hs</span>}
              </div>{" "}
              <div style={{ color: S.white, fontSize: 14, lineHeight: 1.5 }}>{e.texto}</div>{" "}
              {e.respuesta && (
                <div style={{ marginTop: 8, borderLeft: "3px solid " + S.green, paddingLeft: 10 }}>
                  <div style={{ color: S.green, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Respuesta del profe</div>
                  <div style={{ color: S.white, fontSize: 13, lineHeight: 1.5 }}>{e.respuesta}</div>
                </div>
              )}{" "}
            </div>
          ))
      )}{" "}
    </div>
  );
}
// ── PESO MAX ALUMNO ───────────────────────────────────────────────────
function PesoMaxAlumno({ rm, onUpdate }) {
  // Sin paso de "editar": el input está SIEMPRE directamente editable.
  const setPeso = (ej, v) => {
    const n = Math.max(0, Number(v) || 0);
    onUpdate({ ...rm, [ej]: { peso: n, fecha: hoy() } });
  };
  return (
    <div>
      {" "}
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Mis pesos maximos
      </div>{" "}
      {RM_EJS.map((ej) => {
        const dato = rm && rm[ej];
        const peso = (dato && dato.peso) || 0;
        return (
          <div key={ej} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
            {" "}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              {" "}
              <div style={{ flex: 1 }}>
                <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>{ej}</div>
                {dato && dato.fecha && <div style={{ color: S.gray, fontSize: 11, marginTop: 2 }}>{dato.fecha}</div>}
              </div>{" "}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {" "}
                <button
                  onClick={() => setPeso(ej, peso - 1)}
                  style={{ width: 34, height: 34, background: S.card2, color: S.white, border: "1px solid " + S.border, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                >
                  −
                </button>{" "}
                <input
                  type="number"
                  value={peso || ""}
                  placeholder="0"
                  onChange={(e) => setPeso(ej, e.target.value)}
                  style={{ width: 62, textAlign: "center", background: S.card2, border: "1px solid " + S.border, borderRadius: 8, padding: "8px 4px", color: S.white, fontSize: 16, fontWeight: 900, outline: "none" }}
                />{" "}
                <span style={{ color: S.gray, fontSize: 12 }}>kg</span>{" "}
                <button
                  onClick={() => setPeso(ej, peso + 1)}
                  style={{ width: 34, height: 34, background: S.white, color: S.bg, border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                >
                  +
                </button>{" "}
              </div>{" "}
            </div>{" "}
            {dato && dato.peso > 0 && (
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
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
                    {" "}
                    <div style={{ color: S.white, fontSize: 12, fontWeight: 700 }}>
                      {Math.round((dato.peso * pct) / 100)}kg
                    </div>{" "}
                    <div style={{ color: S.gray, fontSize: 9 }}>{pct}%</div>{" "}
                  </div>
                ))}{" "}
              </div>
            )}{" "}
          </div>
        );
      })}{" "}
    </div>
  );
}
// ── TABLA PERIODIZACION ───────────────────────────────────────────────
function TablaPer({ data, semanaActual }) {
  return (
    <div style={{ ...card, overflow: "hidden" }}>
      {" "}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid " + S.border,
          color: S.white,
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        Tabla de Periodizacion
      </div>{" "}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        {" "}
        <thead>
          <tr style={{ background: S.card2 }}>
            {" "}
            <th style={{ padding: "8px 12px", color: S.gray, textAlign: "center" }}>SEM</th>{" "}
            {data[0] && data[0].fecha && (
              <th style={{ padding: "8px 12px", color: S.gray, textAlign: "center" }}>FECHA</th>
            )}{" "}
            <th style={{ padding: "8px 12px", color: S.gray, textAlign: "center" }}>S x R</th>{" "}
            <th style={{ padding: "8px 12px", color: S.gray, textAlign: "center" }}>INT.</th>{" "}
          </tr>
        </thead>{" "}
        <tbody>
          {data.map((r) => {
            const cur = r.semana === semanaActual;
            return (
              <tr
                key={r.semana}
                style={{ background: cur ? S.card2 : "transparent", borderBottom: "1px solid " + S.border }}
              >
                {" "}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: cur ? S.white : S.lgray,
                    fontWeight: cur ? 900 : 400,
                  }}
                >
                  {cur ? "▶ " : ""}
                  {r.semana}
                </td>{" "}
                {r.fecha && (
                  <td style={{ padding: "8px 12px", textAlign: "center", color: cur ? S.white : S.lgray }}>
                    {r.fecha}
                  </td>
                )}{" "}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: cur ? S.white : S.lgray,
                    fontWeight: cur ? 700 : 400,
                  }}
                >
                  {r.series}x{r.reps}
                </td>{" "}
                <td style={{ padding: "8px 12px", textAlign: "center", color: cur ? S.green : S.lgray }}>
                  {r.intensidad || "—"}
                </td>{" "}
              </tr>
            );
          })}
        </tbody>{" "}
      </table>{" "}
    </div>
  );
}
// ── HISTORIAL ADMIN ───────────────────────────────────────────────────
function HistorialAdmin({ al }) {
  const [selEj, setSelEj] = useState(null);
  const [histData, setHistData] = useState({});
  useEffect(() => {
    if (!al?.id) return;
    setSelEj(null);
    setHistData({});
    cargarPesos(al.id, null).then((data) => {
      if (data && data.historiales) setHistData(data.historiales);
      else setHistData({});
    });
  }, [al?.id]);
  const ejercicios = al ? (al.plan?.dias || []).flatMap((d) => d.ejercicios) : [];
  if (!al) return <div style={{ ...card, padding: 24, textAlign: "center", color: S.gray, fontSize: 13 }}>Seleccioná un alumno desde Dashboard</div>;
  return (
    <div>
      {" "}
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Historial — {al.nombre}
      </div>{" "}
      {ejercicios.map((ej) => {
        const hist = histData[ej.id] || [];
        const isOpen = selEj === ej.id;
        return (
          <div key={ej.id} style={{ ...card, marginBottom: 8, overflow: "hidden" }}>
            {" "}
            <div
              onClick={() => setSelEj(isOpen ? null : ej.id)}
              style={{
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              {" "}
              <div>
                {" "}
                <div style={{ color: S.white, fontWeight: 600, fontSize: 13 }}>{ej.nombre}</div>{" "}
                <div style={{ color: S.gray, fontSize: 11, marginTop: 2 }}>
                  {hist.length > 0 ? (
                    <span>
                      <span style={{ color: S.white, fontWeight: 700 }}>{hist[hist.length - 1].peso}kg</span> · ultimo ·{" "}
                      {hist.length} registros
                    </span>
                  ) : (
                    "Sin registros"
                  )}
                </div>{" "}
              </div>{" "}
              <div style={{ color: S.gray }}>{isOpen ? "▲" : "▼"}</div>{" "}
            </div>{" "}
            {isOpen && hist.length > 0 && (
              <div style={{ borderTop: "1px solid " + S.border, padding: 14 }}>
                {" "}
                <div style={{ marginBottom: 12 }}>
                  <MiniChart data={hist} />
                </div>{" "}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  {" "}
                  <thead>
                    <tr style={{ background: S.card2 }}>
                      <th style={{ padding: "6px 10px", color: S.gray, textAlign: "left" }}>Fecha</th>
                      <th style={{ padding: "6px 10px", color: S.gray, textAlign: "right" }}>Peso</th>
                    </tr>
                  </thead>{" "}
                  <tbody>
                    {[...hist].reverse().map((h, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid " + S.border }}>
                        <td style={{ padding: "6px 10px", color: S.gray }}>{h.fecha}</td>
                        <td style={{ padding: "6px 10px", color: S.white, fontWeight: 700, textAlign: "right" }}>
                          {h.peso} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>{" "}
                </table>{" "}
              </div>
            )}{" "}
            {isOpen && hist.length === 0 && (
              <div
                style={{
                  borderTop: "1px solid " + S.border,
                  padding: 14,
                  textAlign: "center",
                  color: S.lgray,
                  fontSize: 12,
                }}
              >
                Sin registros
              </div>
            )}{" "}
          </div>
        );
      })}{" "}
    </div>
  );
}
// ── PLAN → PRINCIPALES: días reales del alumno con su plan asignado ───
// Muestra directamente LOS DÍAS QUE EL ALUMNO YA ENTRENA (los elegidos en el
// alta) con el plan que cada uno tiene, para retocar ejercicios puntuales.
// Agregar un día nuevo queda como acción secundaria (deriva a Plan Día).
const ORDEN_DIAS = { Lunes: 1, Martes: 2, Miercoles: 3, Jueves: 4, Viernes: 5, Sabado: 6, Domingo: 7, Fijo: 8 };
function PlanesPrincipales({ al, alumnos, onUpdate, biblioteca, onGuardarBiblioteca, showToast, onIrPlanDia, initialPlanId }) {
  const planes = [...(al.planes || [])].sort(
    (a, b) => (ORDEN_DIAS[a.dia_semana] || 9) - (ORDEN_DIAS[b.dia_semana] || 9),
  );
  // initialPlanId (ronda 7): venir desde "Planes asignados" de la ficha abre
  // directamente ESE plan para editarlo (el componente se re-monta por key).
  const [selPlanId, setSelPlanId] = useState(
    initialPlanId && planes.some((p) => p.id === initialPlanId) ? initialPlanId : planes[0] && planes[0].id,
  );
  const plan = planes.find((p) => p.id === selPlanId) || planes[0];

  const guardarDias = (nuevosDias) => {
    if (!plan) return;
    onUpdate(alumnos.map((a) => a.id === al.id
      ? {
          ...a,
          planes: (a.planes || []).map((p) => (p.id === plan.id ? { ...p, dias: nuevosDias } : p)),
          // El plan sintético "Fijo" (sin fila en alumno_planes) se persiste
          // por el camino viejo: al.plan.dias → _guardarAlumno → plan_dias.
          plan: plan._sintetico ? { ...a.plan, dias: nuevosDias } : a.plan,
        }
      : a));
    if (!plan._sintetico) {
      actualizarPlanAlumnoDias(plan.id, nuevosDias).then(async (ok) => {
        if (ok) return;
        // El plan pudo haber sido reemplazado/borrado desde otra sesión (id
        // stale → FK 23503). Recargar los planes reales de la base para que
        // el estado deje de apuntar a un id muerto.
        showToast && showToast("Ese plan cambió en otra sesión — recargando planes");
        try {
          const planesFrescos = await cargarPlanesXDia(al.id, al);
          onUpdate((prev) => (Array.isArray(prev) ? prev : []).map((a) =>
            a.id === al.id ? { ...a, planes: planesFrescos } : a));
        } catch (e) {
          console.error("[guardarDias] No se pudieron recargar los planes:", e);
        }
      });
    }
  };

  if (planes.length === 0)
    return (
      <div style={{ ...card, padding: 24, textAlign: "center" }}>
        <div style={{ color: S.gray, fontSize: 13, marginBottom: 12 }}>
          {al.nombre} no tiene días con plan asignado todavía.
        </div>
        <button onClick={onIrPlanDia} style={{ background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
          Asignar plan a un día
        </button>
      </div>
    );

  return (
    <div>
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Días que entrena {al.nombre}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {planes.map((p) => {
          const activo = plan && p.id === plan.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelPlanId(p.id)}
              style={{ background: activo ? S.white : S.card, color: activo ? S.bg : S.gray, border: "1px solid " + (activo ? S.white : S.border), borderRadius: 8, padding: "7px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left" }}
            >
              <div>{p.dia_semana === "Fijo" ? "Todos los días" : p.dia_semana}</div>
              <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.75 }}>{p.nombre || "Plan"}</div>
            </button>
          );
        })}
        <button onClick={onIrPlanDia} style={{ background: "transparent", color: S.gray, border: "1px dashed " + S.border, borderRadius: 8, padding: "7px 10px", fontSize: 11, cursor: "pointer" }}>
          + Otro día
        </button>
      </div>
      {plan && (
        <div style={{ ...card, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>
              {plan.dia_semana === "Fijo" ? "Plan único" : plan.dia_semana} · {plan.nombre || "Plan"}
            </div>
            <button onClick={onIrPlanDia} style={smallBtn(S.gray)}>Cambiar plan</button>
          </div>
          <DiasEditor dias={plan.dias || []} onChange={guardarDias} biblioteca={biblioteca} onGuardarBiblioteca={onGuardarBiblioteca} ocultarAgregarDia />
        </div>
      )}
    </div>
  );
}
// ── PLAN DE REHABILITACIÓN (ADMIN) ────────────────────────────────────
// Editor pensado para Griselda, desde el celular y EN el momento: agrega un
// ejercicio con nombre + explicación + foto/video sacado ahí mismo (input con
// capture → abre la cámara). El media sube a Storage (bucket rehab-media,
// migración 010) y la URL queda en el campo `video` del ejercicio — el mismo
// campo que ya persiste plan_ejercicios, sin esquema nuevo. Cada ejercicio se
// guarda además en biblioteca_ejercicios con categoria='rehab' para
// reutilizarlo con el próximo paciente.
function PlanRehabAdmin({ al, alumnos, onUpdate, biblioteca, onBibliotecaRefresh, showToast }) {
  const planes = al.planes || [];
  const plan = planes[0] || null;
  const dias = plan && plan.dias && plan.dias.length > 0 ? plan.dias : (al.plan?.dias || []);
  const [sesionIdx, setSesionIdx] = useState(0);
  const [editIdx, setEditIdx] = useState(null); // null = nada · -1 = nuevo · i = editando
  const [form, setForm] = useState({ nombre: "", desc: "", video: "" });
  const [subiendo, setSubiendo] = useState(false);
  const camRef = useRef();
  const fileRef = useRef();
  const bibliotecaRehab = (biblioteca || []).filter((b) => b.categoria === "rehab");
  const safeIdx = Math.min(sesionIdx, Math.max(0, dias.length - 1));
  const sesion = dias[safeIdx] || null;

  // Mismo criterio de persistencia que PlanesPrincipales: plan real →
  // actualizarPlanAlumnoDias; plan sintético "Fijo" → camino viejo (al.plan).
  const guardarDias = (nuevosDias) => {
    onUpdate(alumnos.map((a) => a.id === al.id
      ? {
          ...a,
          planes: plan ? (a.planes || []).map((p) => (p.id === plan.id ? { ...p, dias: nuevosDias } : p)) : a.planes,
          plan: !plan || plan._sintetico ? { ...a.plan, dias: nuevosDias } : a.plan,
        }
      : a));
    if (plan && !plan._sintetico) {
      actualizarPlanAlumnoDias(plan.id, nuevosDias).then((ok) => {
        if (!ok) showToast && showToast("Error guardando el plan — reintentá");
      });
    }
  };

  const esImagen = (url) => /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(url || "");

  const handleMediaFile = async (file) => {
    if (!file) return;
    const esVideo = file.type.startsWith("video/");
    if (esVideo && file.size > 50 * 1024 * 1024) {
      window.alert("El video pesa más de 50MB — grabá un clip más corto (10-20 segundos alcanza para mostrar el ejercicio).");
      return;
    }
    setSubiendo(true);
    try {
      let paraSubir = file;
      if (!esVideo) {
        // Comprimir la foto antes de subir (las de cámara pesan varios MB)
        const dataUrl = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = (e) => res(e.target.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        const comp = await comprimirFoto(dataUrl, 1280, 0.85);
        const blob = await (await fetch(comp)).blob();
        paraSubir = new File([blob], "foto.jpg", { type: "image/jpeg" });
      }
      const url = await subirMediaRehab(paraSubir);
      setForm((f) => ({ ...f, video: url }));
      showToast && showToast(esVideo ? "Video subido ✓" : "Foto subida ✓");
    } catch (e) {
      console.error("[PlanRehabAdmin] upload", e);
      window.alert("No se pudo subir el archivo: " + (e.message || "error desconocido"));
    } finally {
      setSubiendo(false);
    }
  };

  const saveEjercicio = () => {
    if (!form.nombre.trim() || !sesion) return;
    const arr = dias.map((d, i) => {
      if (i !== safeIdx) return d;
      const ejs = [...(d.ejercicios || [])];
      if (editIdx === -1) ejs.push({ id: uid(), nombre: form.nombre.trim(), desc: form.desc, video: form.video, mediaLocal: "", historial: [] });
      else ejs[editIdx] = { ...ejs[editIdx], nombre: form.nombre.trim(), desc: form.desc, video: form.video };
      return { ...d, ejercicios: ejs };
    });
    guardarDias(arr);
    // A la biblioteca de rehab siempre — así queda para el próximo paciente
    guardarEjercicioBibliotecaRehab({ nombre: form.nombre.trim(), desc: form.desc, video: form.video })
      .then(() => onBibliotecaRefresh && onBibliotecaRefresh());
    setEditIdx(null);
    setForm({ nombre: "", desc: "", video: "" });
    showToast && showToast("Ejercicio guardado ✓");
  };

  const removeEjercicio = (i) => {
    if (!window.confirm("¿Eliminar este ejercicio del plan?")) return;
    guardarDias(dias.map((d, di) => (di === safeIdx ? { ...d, ejercicios: (d.ejercicios || []).filter((_, j) => j !== i) } : d)));
  };

  const MediaBtns = (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: S.gray, marginBottom: 6, textTransform: "uppercase" }}>Foto o video del ejercicio</div>
      {form.video ? (
        <div style={{ marginBottom: 8 }}>
          {esImagen(form.video) ? (
            <img src={form.video} alt="media" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8, display: "block" }} />
          ) : (
            <video src={form.video} controls preload="metadata" style={{ width: "100%", maxHeight: 220, borderRadius: 8, display: "block" }} />
          )}
          <button onClick={() => setForm((f) => ({ ...f, video: "" }))} style={{ marginTop: 6, background: "transparent", color: S.red, border: "1px solid " + S.red, borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
            ✕ Quitar
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => !subiendo && camRef.current && camRef.current.click()}
            disabled={subiendo}
            style={{ flex: 1, background: S.card2, color: S.white, border: "1px dashed " + S.border, borderRadius: 8, padding: "14px 8px", fontSize: 12, fontWeight: 700, cursor: subiendo ? "wait" : "pointer" }}
          >
            {subiendo ? "Subiendo..." : "📷 Sacar foto / grabar"}
          </button>
          <button
            onClick={() => !subiendo && fileRef.current && fileRef.current.click()}
            disabled={subiendo}
            style={{ flex: 1, background: S.card2, color: S.gray, border: "1px dashed " + S.border, borderRadius: 8, padding: "14px 8px", fontSize: 12, cursor: subiendo ? "wait" : "pointer" }}
          >
            📁 Elegir archivo
          </button>
        </div>
      )}
      {/* capture abre directamente la cámara del celular */}
      <input ref={camRef} type="file" accept="image/*,video/*" capture="environment" style={{ display: "none" }} onChange={(e) => { handleMediaFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={(e) => { handleMediaFile(e.target.files?.[0]); e.target.value = ""; }} />
      <div style={{ fontSize: 10, color: S.lgray, marginTop: 6 }}>Videos hasta 50MB — con 10-20 segundos alcanza.</div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 11, color: S.green, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
        🩺 Plan de rehabilitación — {al.nombre}
      </div>

      {dias.length === 0 ? (
        <div style={{ ...card, padding: 24, textAlign: "center", marginBottom: 12 }}>
          <div style={{ color: S.gray, fontSize: 13, marginBottom: 12 }}>{al.nombre} todavía no tiene sesiones de rehabilitación.</div>
          <button
            onClick={() => guardarDias([{ dia: "Sesión 1", subtitulo: "", ejercicios: [] }])}
            style={{ background: S.green, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
          >
            + Crear primera sesión
          </button>
        </div>
      ) : (
        <>
          {/* Sesiones */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {dias.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <button
                  onClick={() => { setSesionIdx(i); setEditIdx(null); }}
                  style={{ background: safeIdx === i ? S.white : S.card, color: safeIdx === i ? S.bg : S.gray, border: "1px solid " + (safeIdx === i ? S.white : S.border), borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  {d.dia || `Sesión ${i + 1}`}
                </button>
                {dias.length > 1 && (
                  <button
                    onClick={() => {
                      if (!window.confirm(`¿Eliminar ${d.dia || "esta sesión"} con sus ejercicios?`)) return;
                      guardarDias(dias.filter((_, j) => j !== i));
                      setSesionIdx(0);
                    }}
                    style={{ background: "transparent", color: S.red, border: "1px solid " + S.red, borderRadius: 6, padding: "3px 6px", fontSize: 10, cursor: "pointer" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => { guardarDias([...dias, { dia: "Sesión " + (dias.length + 1), subtitulo: "", ejercicios: [] }]); setSesionIdx(dias.length); }}
              style={{ background: "transparent", color: S.gray, border: "1px dashed " + S.border, borderRadius: 8, padding: "7px 12px", fontSize: 11, cursor: "pointer" }}
            >
              + Sesión
            </button>
          </div>

          {/* Ejercicios de la sesión */}
          {(sesion?.ejercicios || []).map((ej, i) =>
            editIdx === i ? (
              <div key={ej.id || i} style={{ ...card, padding: 14, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>Nombre</div>
                <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} style={{ ...inp, marginBottom: 8 }} />
                <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>Explicación</div>
                <textarea value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} rows={3} style={{ ...inp, resize: "vertical", marginBottom: 10 }} />
                {MediaBtns}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={saveEjercicio} disabled={!form.nombre.trim() || subiendo} style={{ flex: 1, background: form.nombre.trim() && !subiendo ? S.green : S.card2, color: form.nombre.trim() && !subiendo ? "#fff" : S.lgray, border: "none", borderRadius: 8, padding: 12, fontWeight: 900, fontSize: 13, cursor: "pointer" }}>GUARDAR</button>
                  <button onClick={() => { setEditIdx(null); setForm({ nombre: "", desc: "", video: "" }); }} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: "12px 16px", cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div key={ej.id || i} style={{ ...card, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ minWidth: 22, height: 22, borderRadius: "50%", background: S.card2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: S.gray, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{ej.nombre}</div>
                  {ej.desc && <div style={{ color: S.gray, fontSize: 11, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ej.desc}</div>}
                  {ej.video && <div style={{ color: S.green, fontSize: 10, marginTop: 2, fontWeight: 700 }}>{esImagen(ej.video) ? "📷 Foto" : "▶ Video"}</div>}
                </div>
                <button onClick={() => { setEditIdx(i); setForm({ nombre: ej.nombre, desc: ej.desc || "", video: ej.video || "" }); }} style={smallBtn(S.white)}>✎</button>
                <button onClick={() => removeEjercicio(i)} style={smallBtn(S.red)}>✕</button>
              </div>
            ),
          )}

          {/* Agregar ejercicio */}
          {editIdx === -1 ? (
            <div style={{ ...card, padding: 14, marginTop: 6 }}>
              <div style={{ color: S.white, fontWeight: 700, marginBottom: 12 }}>Nuevo ejercicio de rehabilitación</div>
              {/* Elegir de la biblioteca de rehab (los ya guardados, con su media) */}
              {bibliotecaRehab.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: S.gray, marginBottom: 6, textTransform: "uppercase" }}>Elegir de la biblioteca</div>
                  <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid " + S.border, borderRadius: 8 }}>
                    {bibliotecaRehab.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setForm({ nombre: b.nombre, desc: b.descripcion || "", video: b.video || "" })}
                        style={{ padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid " + S.border, display: "flex", alignItems: "center", gap: 8, background: form.nombre === b.nombre ? S.card2 : "transparent" }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: S.white, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.nombre}</div>
                          {b.descripcion && <div style={{ color: S.gray, fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.descripcion}</div>}
                        </div>
                        {b.video && <span style={{ color: S.green, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{esImagen(b.video) ? "📷" : "▶"} MEDIA</span>}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: S.lgray, marginTop: 4 }}>Tocá uno para precargarlo — o escribí uno nuevo abajo.</div>
                </div>
              )}
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>Nombre</div>
              <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Movilidad de tobillo con banda" style={{ ...inp, marginBottom: 8 }} />
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>Explicación</div>
              <textarea value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} rows={3} placeholder="Cómo se hace, series, cuidados..." style={{ ...inp, resize: "vertical", marginBottom: 10 }} />
              {MediaBtns}
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={saveEjercicio} disabled={!form.nombre.trim() || subiendo} style={{ flex: 1, background: form.nombre.trim() && !subiendo ? S.green : S.card2, color: form.nombre.trim() && !subiendo ? "#fff" : S.lgray, border: "none", borderRadius: 8, padding: 12, fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
                  AGREGAR AL PLAN
                </button>
                <button onClick={() => { setEditIdx(null); setForm({ nombre: "", desc: "", video: "" }); }} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: "12px 16px", cursor: "pointer" }}>Cancelar</button>
              </div>
            </div>
          ) : (
            editIdx === null && (
              <button
                onClick={() => { setEditIdx(-1); setForm({ nombre: "", desc: "", video: "" }); }}
                style={{ width: "100%", marginTop: 8, background: S.green, color: "#fff", border: "none", borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 900, cursor: "pointer" }}
              >
                + Agregar ejercicio
              </button>
            )
          )}
          <div style={{ fontSize: 10, color: S.lgray, marginTop: 10, textAlign: "center" }}>
            Cada ejercicio queda en el plan de {al.nombre} y en la biblioteca de rehabilitación para reutilizarlo.
          </div>
        </>
      )}
    </div>
  );
}
// ── DASHBOARD ADMIN ───────────────────────────────────────────────────
function Dashboard({ alumnos, selId, onSelect, onDelete, onNuevo, onDeselect }) {
  const lunesStr = (() => {
    const d = new Date();
    const l = new Date(d);
    l.setDate(d.getDate() - d.getDay() + 1);
    return l.toISOString().split("T")[0];
  })();

  return (
    <div onClick={onDeselect}>
      {/* El buscador de alumno vive UNA sola vez en el layout del AdminPanel
          (arriba de los submenús) — acá adentro no se repite (ronda 4). */}
      {/* Crear alumno — abre pantalla aparte (modal), ronda 9 */}
      <button
        onClick={(e) => { e.stopPropagation(); onNuevo(); }}
        style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: "11px 14px", fontWeight: 900, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", marginBottom: 14 }}
      >
        Crear alumno
      </button>

      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
        Todos los alumnos ({alumnos.length})
      </div>

      {alumnos.map((al) => {
        const asistSemana = (al.asistencia || []).filter((d) => d >= lunesStr).length;
        const asistMes = (al.asistencia || []).filter((d) => d.startsWith(mesActual().slice(0, 7))).length;
        const ultimaAsist = ([...(al.asistencia || [])].sort((a, b) => b.localeCompare(a))[0] || "").slice(0, 10) || undefined;
        const entrenoHoy = ultimaAsist === hoy();
        const isSelected = al.id === selId;
        return (
          <div
            key={al.id}
            onClick={(e) => { e.stopPropagation(); onSelect(al.id); }}
            style={{ ...card, marginBottom: 10, padding: "14px 16px", border: "1px solid " + (isSelected ? S.white : S.border), cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div>
                <FotoAlumno foto={al.foto} size={44} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 15 }}>{al.nombre}</div>
                  {/* Ronda 9: el pill solo aparece si entrenó HOY — el "Sin
                      registro" confundía (la última asistencia ya se ve abajo) */}
                  {entrenoHoy && (
                    <div style={{ background: "#0d1f0d", border: "1px solid " + S.green, borderRadius: 20, padding: "3px 10px", fontSize: 10, color: S.green, fontWeight: 700 }}>
                      ✓ Entrenó hoy
                    </div>
                  )}
                </div>
                <div style={{ color: S.gray, fontSize: 11, marginTop: 2 }}>
                  {al.username || al.codigo} · {al.tipo === "rehabilitacion" ? "🩺 Rehab" : "🏋️ Entreno"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: S.card2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ color: S.white, fontWeight: 700 }}>{asistSemana}</div>
                <div style={{ color: S.gray, fontSize: 9 }}>ESTA SEM.</div>
              </div>
              <div style={{ flex: 1, background: S.card2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ color: S.white, fontWeight: 700 }}>{asistMes}</div>
                <div style={{ color: S.gray, fontSize: 9 }}>ESTE MES</div>
              </div>
              <div style={{ flex: 1, background: S.card2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ color: S.white, fontWeight: 700 }}>{ultimaAsist || "—"}</div>
                <div style={{ color: S.gray, fontSize: 9 }}>ULTIMA VEZ</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(al.id, al.nombre); }}
                style={{ background: "transparent", color: S.red, border: "1px solid " + S.red, borderRadius: 6, padding: "4px 10px", fontSize: 13, cursor: "pointer", flexShrink: 0 }}
              >🗑</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
// ── NOVEDADES ADMIN ───────────────────────────────────────────────────
function NovedadesAdmin({ novedades, onCrear, onToggle, onEliminar }) {
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [dirigido, setDirigido] = useState("todos");

  const publicar = () => {
    if (!titulo.trim()) return;
    onCrear({ titulo, contenido, tipo: "comunicado", autor: "", dirigido_a: dirigido });
    setTitulo(""); setContenido(""); setDirigido("todos");
  };

  return (
    <div>
      {/* Formulario nuevo comunicado */}
      <div style={{ ...card, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 12, letterSpacing: 1 }}>
          Nuevo comunicado
        </div>
        <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>TÍTULO</div>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Horarios semana santa" style={{ ...inp, marginBottom: 10 }} />
        <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>CONTENIDO (opcional)</div>
        <textarea value={contenido} onChange={(e) => setContenido(e.target.value)} rows={3} placeholder="Detalle del comunicado..." style={{ ...inp, resize: "vertical", marginBottom: 10 }} />
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>PARA</div>
          <select value={dirigido} onChange={(e) => setDirigido(e.target.value)} style={inp}>
            <option value="todos">Todos los alumnos</option>
            <option value="entrenamiento">Solo Entrenamiento</option>
            <option value="rehabilitacion">Solo Rehabilitación</option>
          </select>
        </div>
        <button onClick={publicar} style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontWeight: 900, cursor: "pointer", fontSize: 13 }}>
          PUBLICAR COMUNICADO
        </button>
      </div>

      {/* Lista de novedades existentes */}
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 10, letterSpacing: 1 }}>
        Publicadas ({novedades.length})
      </div>
      {novedades.length === 0 && (
        <div style={{ ...card, padding: 30, textAlign: "center", color: S.gray, fontSize: 13 }}>Sin novedades publicadas</div>
      )}
      {novedades.map((n) => (
        <div key={n.id} style={{ ...card, padding: "12px 14px", marginBottom: 8, opacity: n.activo ? 1 : 0.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{n.titulo}</div>
              {n.contenido && <div style={{ color: S.gray, fontSize: 11, marginBottom: 4, lineHeight: 1.4 }}>{n.contenido}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 10, color: S.gray, background: S.card2, borderRadius: 4, padding: "2px 6px" }}>{n.tipo}</span>
                <span style={{ fontSize: 10, color: S.gray, background: S.card2, borderRadius: 4, padding: "2px 6px" }}>→ {n.dirigido_a}</span>
                <span style={{ fontSize: 10, color: S.gray }}>{new Date(n.fecha).toLocaleDateString("es-AR")}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => onToggle(n.id, !n.activo)} style={{ ...smallBtn(n.activo ? S.green : S.gray), padding: "4px 8px", fontSize: 10 }}>
                {n.activo ? "✓ Activa" : "○ Oculta"}
              </button>
              <button onClick={() => onEliminar(n.id)} style={{ ...smallBtn(S.red), padding: "4px 8px", fontSize: 10 }}>🗑</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
// ── DIARIO ADMIN ──────────────────────────────────────────────────────
// Una entrada del diario vista por el admin, con la posibilidad de RESPONDER.
// La respuesta se guarda como campo `respuesta` dentro de la misma entrada
// (el diario es un array JSON en la columna `diario` — sin tocar el esquema).
function EntradaDiarioAdmin({ entrada, onResponder }) {
  const [editando, setEditando] = useState(false);
  const [txt, setTxt] = useState(entrada.respuesta || "");
  const guardar = () => {
    if (!txt.trim()) return;
    onResponder(txt.trim());
    setEditando(false);
  };
  return (
    <div style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
      <div style={{ color: S.lgray, fontSize: 11, marginBottom: 6 }}>
        {String(entrada.fecha).slice(0, 10)}{String(entrada.fecha).length > 10 ? ` · ${String(entrada.fecha).slice(11)} hs` : ""}
      </div>
      <div style={{ color: S.white, fontSize: 14, lineHeight: 1.6 }}>{entrada.texto}</div>
      {entrada.respuesta && !editando ? (
        <div style={{ marginTop: 10, borderLeft: "3px solid " + S.green, paddingLeft: 10 }}>
          <div style={{ color: S.green, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Respuesta del profe</div>
          <div style={{ color: S.white, fontSize: 13, lineHeight: 1.5 }}>{entrada.respuesta}</div>
          <button onClick={() => { setTxt(entrada.respuesta || ""); setEditando(true); }} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 11, cursor: "pointer", padding: "4px 0", textDecoration: "underline" }}>Editar respuesta</button>
        </div>
      ) : editando ? (
        <div style={{ marginTop: 10 }}>
          <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={2} placeholder="Escribile una respuesta al alumno..." style={{ ...inp, resize: "vertical", marginBottom: 6 }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={guardar} disabled={!txt.trim()} style={{ background: txt.trim() ? S.green : S.card2, color: txt.trim() ? "#fff" : S.lgray, border: "none", borderRadius: 6, padding: "7px 14px", fontWeight: 700, fontSize: 12, cursor: txt.trim() ? "pointer" : "default" }}>Responder</button>
            <button onClick={() => setEditando(false)} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 6, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditando(true)} style={{ marginTop: 8, background: "transparent", color: S.green, border: "1px solid " + S.green, borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>↩ Responder</button>
      )}
    </div>
  );
}
function DiarioAdmin({ alumnos, onUpdate, showToast }) {
  const [selId, setSelId] = useState(alumnos[0]?.id);
  const al = alumnos.find((a) => a.id === selId) || alumnos[0];
  const entradas = [...(al?.diario || [])].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const responder = (entrada, respuesta) => {
    if (!al || !onUpdate) return;
    const nuevoDiario = (al.diario || []).map((d) => (d === entrada ? { ...d, respuesta } : d));
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, diario: nuevoDiario } : a)));
    showToast && showToast("Respuesta guardada ✓");
  };

  return (
    <div>
      <AlumnoBuscador alumnos={alumnos} selId={selId} onSelect={setSelId} />
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Diario — {al?.nombre}
      </div>
      {entradas.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📓</div>
          <div style={{ color: S.gray, fontSize: 13 }}>Sin entradas todavía</div>
        </div>
      ) : (
        entradas.map((e, i) => (
          <EntradaDiarioAdmin key={e.fecha + "-" + i} entrada={e} onResponder={(r) => responder(e, r)} />
        ))
      )}
    </div>
  );
}

// ── ADMIN PANEL ───────────────────────────────────────────────────────
// Modalidades de entrenamiento del alumno (pedido de Lucas 2026-07-20).
// "Rehabilitación" (ronda 7) es la modalidad de los pacientes de Griselda:
// elegirla setea/equivale a tipo="rehabilitacion" (el campo que activa la
// vista y el plan de rehabilitación). tipo sigue siendo la fuente de verdad;
// la modalidad es la forma visible de elegirlo — se sincronizan al guardar.
const MODALIDAD_REHAB = "Rehabilitación";
const MODALIDADES = [
  "Presencial con Lucas",
  "Presencial con Ariel",
  "Entrena solo en Desarrollo Integral",
  "A distancia",
  MODALIDAD_REHAB,
];
// Ronda 7: Peso Max aplica a TODOS los alumnos, sin filtro por modalidad
// ("por más que entrene solo, algún día lo voy a ir a ver").
function AdminPanel({ alumnos, onUpdate, onClose, showToast, biblioteca = [], onGuardarBiblioteca, onBibliotecaRefresh, novedades = [], onNovedadesChange, darkMode, onToggleTheme, onModoEntrenador }) {
  const [sec, setSec] = useState("dashboard");
  const [selId, setSelId] = useState(alumnos[0] && alumnos[0].id);
  const [planTab, setPlanTab] = useState("entrenamiento");
  // Ronda 8: menús del admin en 3 grupos — Plan (edición de las 4 partes),
  // Planes (periodización · plan x día · evaluación peso max) y Reportes
  // (asistencia · historial · bioimpedancia). Subtabs de cada grupo:
  const [planesTab, setPlanesTab] = useState("periodizacion");
  const [repTab, setRepTab] = useState("asistencia");
  const [selectedDia, setSelectedDia] = useState(null);
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
    [ntipo, setNtipo] = useState("entrenamiento");
  // Fecha de evaluación POR ALUMNO (ronda 4): es la fecha en que el entrenador
  // evaluó a ESE alumno. Vive dentro del jsonb `rm` como `fecha_evaluacion` —
  // sin migración nueva. Se guarda apenas se cambia.
  const setFechaEvalAlumno = (v) => {
    if (!al) return;
    setRm((r) => ({ ...r, [al.id]: { ...r[al.id], fecha_evaluacion: v } }));
    const rmNuevo = { ...(rm[al.id] || al.rm || {}), fecha_evaluacion: v };
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, rm: rmNuevo } : a)));
    showToast && showToast("Fecha de evaluación guardada ✓");
  };
  // Movilidad PREDETERMINADA por alumno (ronda 5): con cuál de las 3 versiones
  // (superrapida/corta/completa) arranca el alumno al entrar. Vive en el jsonb
  // `rm` como `movilidad_default` — sin migración nueva. El alumno puede
  // cambiarla en el momento con los 3 botones de su vista.
  const setMoviDefault = (v) => {
    if (!al) return;
    setRm((r) => ({ ...r, [al.id]: { ...r[al.id], movilidad_default: v } }));
    const rmNuevo = { ...(rm[al.id] || al.rm || {}), movilidad_default: v };
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, rm: rmNuevo } : a)));
    showToast && showToast("Movilidad predeterminada guardada ✓");
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
  const [admNombre, setAdmNombre] = useState(""),
    [admCodigo, setAdmCodigo] = useState(""),
    [admPin, setAdmPin] = useState("");
  const [configTab, setConfigTab] = useState("admin");
  // Mes elegido para el reporte mensual (tab Asistencia). "YYYY-MM".
  const [repMes, setRepMes] = useState(mesActual().slice(0, 7));
  const [showCrearAlumno, setShowCrearAlumno] = useState(false);
  // Visor "Todos los planes" (ronda 9): plantilla abierta en modal de lectura
  const [planVisor, setPlanVisor] = useState(null);
  const [editPin, setEditPin] = useState("");
  const [ntemplate, setNtemplate] = useState("bilateral");
  const [ndias, setNdias] = useState({}); // {Lunes: "bilateral", Martes: "unilateral", ...}
  const DIAS_SEM = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  // Los ejercicios de rehab (categoria='rehab') no se mezclan en el
  // autocompletado de los planes de entrenamiento.
  const bibliotecaEntreno = biblioteca.filter((b) => b.categoria !== "rehab");
  const al = alumnos.find((a) => a.id === selId) || alumnos[0];
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
      // Los rehab viejos sin modalidad guardada se muestran como "Rehabilitación"
      modalidad: al.modalidad || (al.tipo === "rehabilitacion" ? MODALIDAD_REHAB : ""),
      horarios: JSON.parse(JSON.stringify(al.horarios || [])),
    });
  const saveEdit = () => {
    if (!form.nombre) return;
    // Normaliza el username a mayúsculas siempre, así el login (que compara
    // en mayúsculas) funciona sin importar cómo lo haya tipeado el admin.
    const formNormalizado = { ...form, codigo: (form.codigo || "").toUpperCase() };
    // Sincronizar tipo con la modalidad (ronda 7): "Rehabilitación" activa la
    // vista/plan de rehab; elegir otra modalidad lo vuelve a entrenamiento.
    // Si la modalidad quedó vacía, el tipo no se toca (datos viejos intactos).
    if (formNormalizado.modalidad === MODALIDAD_REHAB) formNormalizado.tipo = "rehabilitacion";
    else if (formNormalizado.modalidad) formNormalizado.tipo = "entrenamiento";
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, ...formNormalizado } : a)));
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
  const guardarRM = () => {
    onUpdate(alumnos.map((a) => ({ ...a, rm: rm[a.id] || a.rm })));
    showToast && showToast("Guardado ✓");
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
        ["Modalidad", alumno.modalidad || "Sin definir"],
        ["Tipo", alumno.tipo === "rehabilitacion" ? "Rehabilitación" : "Entrenamiento"],
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
      showToast && showToast("Reporte exportado ✓");
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
    _creandoAlumno.current = true;
    const tpl = clonarPlan(getPlantilla(ntemplate).plan);
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
        // Solo días de entrenamiento, sin horario (pedido de Lucas 2026-07-17)
        horarios: Object.keys(ndias).filter((d) => ndias[d]).map((d) => ({ dia: d, hora: "" })),
        plan: JSON.parse(JSON.stringify(tpl)),
        planes: [],
        plantilla_id: null,
      };

      // Crear planes para los días seleccionados
      const diasAsignados = Object.keys(ndias).filter(dia => ndias[dia]);
      if (diasAsignados.length > 0) {
        for (const dia of diasAsignados) {
          const plantilla = getPlantilla(ndias[dia] || ntemplate);
          const planTemplate = clonarPlan(plantilla.plan);
          const res = await crearPlanAlumno(nuevoAl.id, dia, { ...planTemplate, nombre: plantilla.nombre });
          if (res.ok) {
            alumnoConPlan.planes.push(planCompleto(res.data, planTemplate));
          }
        }
      } else {
        // Si no seleccionó días, crear plan "Fijo" por defecto
        const res = await crearPlanAlumno(nuevoAl.id, "Fijo", { ...tpl, nombre: getPlantilla(ntemplate).nombre });
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
      setNtipo("entrenamiento");
      setNtemplate("bilateral");
      setNdias({});
      showToast && showToast("Alumno creado ✓");
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
  const asignarPlanDia = async (plantillaId) => {
    if (!selectedDia || !al) return;
    const plantilla = getPlantilla(plantillaId);
    // REEMPLAZO, no solapamiento (bug ronda 4): si el día ya tiene un plan,
    // confirmar y reemplazarlo — crearPlanAlumno borra el previo en la base.
    const existente = (al.planes || []).find((p) => p.dia_semana === selectedDia && !p._sintetico);
    if (existente && !window.confirm(`${selectedDia} ya tiene el plan "${existente.nombre || "sin nombre"}". ¿Reemplazarlo por "${plantilla.nombre}"?`)) return;
    const tpl = clonarPlan(plantilla.plan);
    try {
      const result = await crearPlanAlumno(al.id, selectedDia, { ...tpl, nombre: plantilla.nombre });
      if (result.ok) {
        showToast && showToast(`Plan "${plantilla.nombre}" asignado para ${selectedDia} ✓`);
        const alumnoActualizado = {
          ...al,
          planes: await cargarPlanesXDia(al.id, al)
        };
        onUpdate(alumnos.map((a) => (a.id === al.id ? alumnoActualizado : a)));
        setSelectedDia(null);
      } else {
        showToast && showToast("Error al asignar plan");
      }
    } catch (e) {
      console.error("[asignarPlanDia]", e);
      showToast && showToast("Error: " + e.message);
    }
  };
  const secBtn = (l, k) => (
    <button
      key={k}
      onClick={() => {
        setSec(k);
        setForm(null);
      }}
      style={{
        background: sec === k ? S.white : S.card,
        color: sec === k ? S.bg : S.gray,
        border: "1px solid " + (sec === k ? S.white : S.border),
        borderRadius: 8,
        padding: "7px 10px",
        fontSize: 10,
        fontWeight: 700,
        cursor: "pointer",
        flex: 1,
      }}
    >
      {l}
    </button>
  );
  return (
    <div
      style={{
        minHeight: "100vh",
        background: S.bg,
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "inherit",
        paddingBottom: 60,
      }}
    >
      {" "}
      <div
        style={{
          padding: "16px 16px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        {" "}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={ICON} width={28} height={28} alt="DI" style={{ opacity: 0.85 }} />
          <div>
            <div style={{ color: S.white, fontWeight: 800, fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase" }}>Panel Admin</div>
            <div style={{ color: S.gray, fontSize: 10, letterSpacing: 1 }}>Desarrollo Integral</div>
          </div>
        </div>{" "}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Modo entrenador (ronda 9) — al lado del toggle de tema */}
          <button
            onClick={onModoEntrenador}
            title="Modo entrenador: operar la app como un alumno"
            style={{
              background: "transparent",
              color: S.gray,
              border: "1px solid " + S.border,
              borderRadius: 6,
              padding: "5px 9px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            🏋️ Entrenador
          </button>
          <button
            onClick={onToggleTheme}
            title={darkMode ? "Modo claro" : "Modo oscuro"}
            aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            style={{
              background: "transparent",
              color: S.gray,
              border: "1px solid " + S.border,
              borderRadius: 6,
              padding: "5px 9px",
              fontSize: 12,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            onClick={() => { setSec("config"); setForm(null); }}
            title="Configuración"
            style={{
              background: sec === "config" ? S.white : "transparent",
              color: sec === "config" ? S.bg : S.gray,
              border: "1px solid " + (sec === "config" ? S.white : S.border),
              borderRadius: 6,
              padding: "5px 9px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ⚙
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: S.gray,
              border: "1px solid " + S.border,
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>{" "}
      </div>{" "}
      {/* 1) Pestañas principales */}
      <div style={{ display: "flex", gap: 4, padding: "0 16px", marginBottom: 10 }}>
        {secBtn("Dashboard", "dashboard")}
        {secBtn("Alumno", "alumnos")}
      </div>{" "}
      {/* 2) Selector de alumno: primero elegís el alumno... */}
      <div style={{ padding: "0 16px" }}>
        <AlumnoBuscador alumnos={alumnos} selId={selId} onSelect={(id) => { setSelId(id); setForm(null); }} />
      </div>{" "}
      {/* 3) ...y los submenús cuelgan del alumno elegido — ronda 9: TRES
          grupos grandes (Ejercicios · Planificación · Reportes) */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px", marginBottom: 10 }}>
        {[["Ejercicios", "plan"], ["Planificación", "planes"], ["Reportes", "reportes"]].map(([l, k]) => (
          <button key={k} onClick={() => { setSec(k); setForm(null); }} style={{ ...tabN2(sec === k), padding: "10px 4px" }}>
            {l}
          </button>
        ))}
      </div>{" "}
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
              onDelete={async (id, nombre) => {
                if (!window.confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return;
                await deleteAlumno(id);
                const nuevos = alumnos.filter((a) => a.id !== id);
                onUpdate(nuevos);
                setSelId(nuevos[0]?.id);
                showToast && showToast(`${nombre} eliminado.`);
              }}
              onNuevo={() => setShowCrearAlumno((v) => !v)}
              onDeselect={() => setSelId(null)}
            />

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
                  <button onClick={() => setShowCrearAlumno(false)} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
                </div>
                {[["Nombre completo", nn, setNn], ["Username (para login)", nc, setNc], ["Clave (4 dígitos)", npin, setNpin], ["Email", ne, setNe], ["Peso (kg)", np, setNp], ["Altura (cm)", na, setNa]].map(([label, val, set]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                    <input type={label === "Email" ? "email" : "text"} value={val} onChange={(e) => set(e.target.value)} placeholder={label === "Email" ? "para mandarle el acceso más adelante" : undefined} style={inp} />
                  </div>
                ))}
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
                            // Modalidad ↔ tipo (ronda 7): Rehabilitación activa el tipo rehab
                            if (nueva === MODALIDAD_REHAB) setNtipo("rehabilitacion");
                            else if (nueva) setNtipo("entrenamiento");
                          }}
                          style={{ background: activa ? S.white : S.card2, color: activa ? S.bg : S.gray, border: "1px solid " + (activa ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left", lineHeight: 1.3 }}
                        >
                          {activa ? "✓ " : ""}{m}
                        </button>
                      );
                    })}
                  </div>
                  {!nmodalidad && <div style={{ fontSize: 10, color: S.lgray, marginTop: 6 }}>Sin definir — tocá una para asignarla</div>}
                </div>
                <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Días de entrenamiento</div>
                <div style={{ fontSize: 11, color: S.lgray, marginBottom: 8 }}>Tocá los días que entrena — a cada día le podés poner un plan distinto.</div>
                {DIAS_SEM.map((d) => (
                  <div key={d} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <button
                      onClick={() => setNdias((prev) => { const n = { ...prev }; if (n[d]) delete n[d]; else n[d] = ntemplate; return n; })}
                      style={{ flex: 1, textAlign: "left", background: ndias[d] ? S.white : S.card, color: ndias[d] ? S.bg : S.gray, border: "1px solid " + (ndias[d] ? S.white : S.border), borderRadius: 6, padding: "9px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      {ndias[d] ? "✓ " : ""}{d}
                    </button>
                    {ndias[d] && (
                      <select value={ndias[d]} onChange={(e) => setNdias((prev) => ({ ...prev, [d]: e.target.value }))} style={{ ...inp, width: 140, flex: "none" }}>
                        {PLANTILLAS.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    )}
                  </div>
                ))}
                <div style={{ marginBottom: 14 }} />
                <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Tipo de alumno</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {[["🏋️ Entrenamiento", "entrenamiento"], ["🩺 Rehabilitación", "rehabilitacion"]].map(([l, k]) => (
                    <button key={k} onClick={() => {
                      setNtipo(k);
                      // Tipo ↔ modalidad (ronda 7): mantenerlos coherentes
                      if (k === "rehabilitacion") setNmodalidad(MODALIDAD_REHAB);
                      else if (nmodalidad === MODALIDAD_REHAB) setNmodalidad("");
                    }} style={{ flex: 1, background: ntipo === k ? (k === "rehabilitacion" ? "#0a2a1a" : S.white) : S.card, color: ntipo === k ? (k === "rehabilitacion" ? S.green : S.bg) : S.gray, border: "1px solid " + (ntipo === k ? (k === "rehabilitacion" ? S.green : S.white) : S.border), borderRadius: 8, padding: "10px 4px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{l}</button>
                  ))}
                </div>
                {/* Ronda 9: "Todos los planes" es un VISOR — tocar un plan abre
                    una ventana con sus ejercicios explicados. El plan del
                    alumno se asigna por día, arriba. */}
                <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Todos los planes</div>
                <div style={{ fontSize: 11, color: S.lgray, marginBottom: 8 }}>Tocá un plan para ver sus ejercicios con las descripciones. La asignación se hace por día, arriba.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {PLANTILLAS.map((p) => (
                    <button key={p.id} onClick={() => setPlanVisor(p)} title={p.descripcion} style={{ background: S.card, color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: "10px 4px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{p.nombre} 👁</button>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    if (nn && nc && npin) {
                      if (!window.confirm(`Estás creando el alumno ${nn.trim()}. ¿Confirmar?`)) return;
                    }
                    const ok = await crearAlumno();
                    if (ok) setShowCrearAlumno(false);
                  }}
                  style={{ width: "100%", background: ntipo === "rehabilitacion" ? S.green : S.white, color: S.bg, border: "none", borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 900, cursor: "pointer" }}
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
                    <button onClick={() => setPlanVisor(null)} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
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
                      <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
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
                      <input type={key === "email" ? "email" : "text"} placeholder={key === "email" ? "para mandarle el acceso más adelante" : undefined} value={val || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: key === "codigo" ? e.target.value.toUpperCase() : e.target.value }))} style={inp} />
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
                      {MODALIDADES.map((m) => {
                        const activa = (form.modalidad || "") === m;
                        return (
                          <button
                            key={m}
                            onClick={() => setForm((f) => ({ ...f, modalidad: activa ? "" : m }))}
                            style={{ background: activa ? S.white : S.card2, color: activa ? S.bg : S.gray, border: "1px solid " + (activa ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left", lineHeight: 1.3 }}
                          >
                            {activa ? "✓ " : ""}{m}
                          </button>
                        );
                      })}
                    </div>
                    {!form.modalidad && <div style={{ fontSize: 10, color: S.lgray, marginTop: 6 }}>Sin definir — tocá una para asignarla</div>}
                  </div>

                  {/* Cambiar clave */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>Nueva clave (4 dígitos — dejá vacío para no cambiar)</div>
                    <input
                      type="password"
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value.slice(0, 4))}
                      placeholder="····"
                      maxLength={4}
                      style={inp}
                    />
                    {editPin.length > 0 && editPin.length < 4 && <div style={{ fontSize: 11, color: S.red, marginTop: 4 }}>La clave debe ser de 4 dígitos</div>}
                    {editPin.length === 4 && <div style={{ fontSize: 11, color: S.green, marginTop: 4 }}>✓ Nueva clave lista para guardar</div>}
                  </div>

                  {/* Solo días de entrenamiento — sin hora del día (pedido de Lucas 2026-07-20) */}
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
                          {activo ? "✓ " : ""}{d}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={async () => {
                        saveEdit();
                        if (editPin.length === 4) {
                          const ok = await cambiarPINAlumno(al.id, editPin);
                          showToast && showToast(ok ? "Clave actualizada ✓" : "Error al cambiar la clave");
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <FotoAlumno foto={al.foto} size={52} editable onFoto={(foto) => { guardarFotoAlumno(al.id, foto); onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, foto } : a))); }} />
                      <div>
                        <div style={{ color: S.white, fontWeight: 700, fontSize: 16 }}>{al.nombre}</div>
                        <div style={{ color: S.gray, fontSize: 12, marginTop: 2 }}>@{al.username || al.codigo}</div>
                        <div style={{ color: S.lgray, fontSize: 11, marginTop: 1 }}>{al.tipo === "rehabilitacion" ? "🩺 Rehabilitación" : "🏋️ Entrenamiento"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={startEdit} style={smallBtn(S.white)}>✎ Editar</button>
                      <button onClick={eliminarAlumno} style={smallBtn(S.red)}>🗑</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    {[["Peso", al.peso], ["Altura", al.altura], ["Edad", calcularEdad(al.fecha_nacimiento) || al.edad]].map(([l, v]) => (
                      <div key={l} style={{ flex: 1, background: S.card2, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                        <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{v || "—"}</div>
                        <div style={{ color: S.gray, fontSize: 9, letterSpacing: 1 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {al.modalidad && (
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ background: S.card2, border: "1px solid " + S.border, borderRadius: 20, padding: "4px 12px", fontSize: 11, color: S.white, fontWeight: 600 }}>
                        {al.modalidad}
                      </span>
                    </div>
                  )}
                  {/* Días de entrenamiento (sin hora — ya no se usan horarios) */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(al.horarios || []).filter((h) => h.dia).map((h, i) => (
                      <span key={i} style={{ background: S.card2, border: "1px solid " + S.border, borderRadius: 4, padding: "2px 8px", fontSize: 10, color: S.white }}>
                        {h.dia}
                      </span>
                    ))}
                  </div>

                  {/* Planes REALES asignados (plan por día), con el de hoy marcado.
                      Antes acá había un "bilateral/unilateral" hardcodeado. */}
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid " + S.border }}>
                    <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 10, letterSpacing: 1 }}>
                      🎯 Planes asignados
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
                                <div style={{ color: S.gray, fontSize: 10, marginTop: 1 }}>{p.dia_semana || "Fijo"}</div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {esHoy && <span style={{ color: S.green, fontSize: 10, fontWeight: 700 }}>● HOY</span>}
                                <span style={{ color: S.gray, fontSize: 12 }}>✎ ›</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: S.lgray, marginTop: 8 }}>Tocá un plan para editarlo · para reemplazarlos: Plan → Plan Día</div>
                  </div>
                </div>
              )}
            </>)}
          </div>
        )}{" "}
        {/* Alumnos de REHAB: la sección Plan es directamente el editor de
            Griselda (sin tabs de movilidad/periodización de entrenamiento) */}
        {sec === "plan" && al && al.tipo === "rehabilitacion" && (
          <PlanRehabAdmin
            al={al}
            alumnos={alumnos}
            onUpdate={onUpdate}
            biblioteca={biblioteca}
            onBibliotecaRefresh={onBibliotecaRefresh}
            showToast={showToast}
          />
        )}{" "}
        {sec === "plan" && (!al || al.tipo !== "rehabilitacion") && (
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
                <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
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
                        style={{ position: "relative", flex: 1 }}
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
                            fontSize: 10,
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
                              fontSize: 9,
                              fontWeight: 900,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              lineHeight: 1,
                              padding: 0,
                            }}
                          >
                            {oculta ? "+" : "✕"}
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
                biblioteca={bibliotecaEntreno}
                onGuardarBiblioteca={onGuardarBiblioteca}
                showToast={showToast}
                onIrPlanDia={() => { setSec("planes"); setPlanesTab("plan-dias"); }}
                initialPlanId={planFoco}
              />
            )}{" "}
            {planTab === "movilidad" && al && (
              <>
                {/* Movilidad predeterminada del alumno: con cuál versión arranca */}
                <div style={{ ...card, padding: "12px 14px", marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                    Movilidad predeterminada — {al.nombre}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["superrapida", "Superrápida"], ["corta", "Corta"], ["completa", "Completa"]].map(([id, l]) => {
                      const activa = (al.rm?.movilidad_default || "completa") === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setMoviDefault(id)}
                          style={{ flex: 1, background: activa ? S.white : S.card2, color: activa ? S.bg : S.gray, border: "1px solid " + (activa ? S.white : S.border), borderRadius: 8, padding: "9px 4px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          {activa ? "✓ " : ""}{l}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: S.lgray, marginTop: 8 }}>
                    Es la versión con la que el alumno arranca al entrar — después puede cambiarla en el momento.
                  </div>
                </div>
                <EjercicioEditor
                  items={al.plan.movilidad}
                  onChange={(v) => updatePlan("movilidad", v)}
                  showVideo={true}
                  biblioteca={bibliotecaEntreno}
                  onGuardarBiblioteca={onGuardarBiblioteca}
                />
                <VideosMovilidadAdmin showToast={showToast} />
              </>
            )}{" "}
            {planTab === "calor" && al && (
              <EjercicioEditor items={al.plan.calor} onChange={(v) => updatePlan("calor", v)} showVideo={true} biblioteca={bibliotecaEntreno} onGuardarBiblioteca={onGuardarBiblioteca} />
            )}{" "}
            {planTab === "activacion" && al && (
              <EjercicioEditor items={al.plan.activacion || []} onChange={(v) => updatePlan("activacion", v)} showVideo={true} biblioteca={bibliotecaEntreno} onGuardarBiblioteca={onGuardarBiblioteca} />
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
            <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
              {[
                ["Periodización", "periodizacion"],
                ["Plan x día", "plan-dias"],
              ].map(([l, k]) => (
                <button
                  key={k}
                  onClick={() => setPlanesTab(k)}
                  style={{
                    flex: 1,
                    background: planesTab === k ? S.white : S.card,
                    color: planesTab === k ? S.bg : S.gray,
                    border: "1px solid " + (planesTab === k ? S.white : S.border),
                    borderRadius: 8,
                    padding: "7px 4px",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            {planesTab === "periodizacion" && al && (
              <div style={{ ...card, overflow: "hidden", padding: 14 }}>
                <PeriodizacionEditor data={al.plan.periodizacion} onChange={(v) => updatePlan("periodizacion", v)} />
              </div>
            )}{" "}
            {planesTab === "plan-dias" && al && (
              <div style={{ ...card, padding: 12 }}>
                <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 12 }}>
                  Plan por día — {al.nombre}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo", "Fijo"].map((dia) => {
                    const planActual = al.planes?.find(p => p.dia_semana === dia);
                    const isSelected = selectedDia === dia;
                    return (
                      <div
                        key={dia}
                        onClick={() => setSelectedDia(isSelected ? null : dia)}
                        style={{
                          background: isSelected ? S.card2 : S.card,
                          border: `1px solid ${isSelected ? S.white : S.border}`,
                          borderRadius: 8,
                          padding: "10px 12px",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontSize: 11, color: S.gray, marginBottom: 3 }}>{dia}</div>
                        <div style={{ fontSize: 12, color: planActual ? S.green : S.lgray, fontWeight: 600 }}>
                          {planActual ? planActual.nombre || "Asignado" : "Sin plan"}
                        </div>
                        {isSelected && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                            {PLANTILLAS.map((p) => (
                              <button
                                key={p.id}
                                onClick={(e) => { e.stopPropagation(); asignarPlanDia(p.id); }}
                                style={{
                                  background: S.white,
                                  color: S.bg,
                                  border: "none",
                                  padding: "6px 4px",
                                  borderRadius: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                {p.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: S.lgray }}>
                  Tocá un día para asignarle un plan de entrenamiento
                </div>
              </div>
            )}{" "}
          </div>
        )}{" "}
        {sec === "planes" && planesTab === "rm" && (
          <div>
            {" "}
            {/* Fecha de evaluación POR ALUMNO: cuándo se lo evaluó a ESTE alumno.
                Ronda 7: Peso Max aplica a TODOS — sin filtro por modalidad. */}
            {al && (
              <div style={{ ...card, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                  📅 Fecha de evaluación de {al.nombre}
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
              Peso maximo — {al ? al.nombre : "—"}
            </div>{" "}
            {!al && <div style={{ ...card, padding: 24, textAlign: "center", color: S.gray, fontSize: 13 }}>Seleccioná un alumno desde Dashboard</div>}{" "}
            {al &&
              RM_EJS.map((ej) => (
                <div key={ej} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
                  {" "}
                  <div style={{ color: S.white, fontWeight: 600, fontSize: 13, marginBottom: 10 }}>{ej}</div>{" "}
                  {/* Solo el peso — la fecha de evaluación es UNA por alumno (arriba) */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: S.gray, marginBottom: 4 }}>PESO MAXIMO (kg)</div>
                    <input
                      type="number"
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
                          <div style={{ color: S.gray, fontSize: 9 }}>{pct}%</div>
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
        {/* ── Grupo REPORTES: Asistencia · Historial · Bioimpedancia ── */}
        {sec === "reportes" && (
          <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
            {[
              ["Asistencia", "asistencia"],
              ["Historial", "historial"],
              ["Bioimpedancia", "bioimpedancia"],
            ].map(([l, k]) => (
              <button
                key={k}
                onClick={() => setRepTab(k)}
                style={{
                  flex: 1,
                  background: repTab === k ? S.white : S.card,
                  color: repTab === k ? S.bg : S.gray,
                  border: "1px solid " + (repTab === k ? S.white : S.border),
                  borderRadius: 8,
                  padding: "7px 4px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        )}{" "}
        {sec === "reportes" && repTab === "historial" && <HistorialAdmin al={al} />}{" "}
        {sec === "diario" && <DiarioAdmin alumnos={alumnos} onUpdate={onUpdate} showToast={showToast} />}{" "}
        {sec === "reportes" && repTab === "bioimpedancia" && al && (
          <div>
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Bioimpedancia — {al.nombre}
            </div>
            <EstudioBioSeccion alumnoId={al.id} alumno={al} showToast={showToast} />
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
                          {labelMes(m)}{m === mesHoy ? <span style={{ color: S.green, fontSize: 10, fontWeight: 700, marginLeft: 6 }}>· EN CURSO</span> : ""}
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
                  <div style={{ color: S.gray, fontSize: 9, letterSpacing: 1 }}>{labelMes(mesSel).toUpperCase()}</div>
                </div>
                <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ color: S.white, fontWeight: 900, fontSize: 22 }}>{registros.length}</div>
                  <div style={{ color: S.gray, fontSize: 9, letterSpacing: 1 }}>TOTAL HISTÓRICO</div>
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
                📓 Diario — {al.nombre}
              </div>
              {(al.diario || []).length === 0 ? (
                <div style={{ ...card, padding: 30, textAlign: "center" }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>📓</div>
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
                      showToast && showToast("Respuesta guardada ✓");
                    }}
                  />
                ))
              )}
            </div>
          );
        })()}{" "}
        {sec === "config" && (
          <div>
            {/* Sub-tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {[["👤 Crear admin", "admin"], ["📢 Comunicados", "comunicados"]].map(([l, k]) => (
                <button
                  key={k}
                  onClick={() => setConfigTab(k)}
                  style={{
                    flex: 1,
                    background: configTab === k ? S.white : S.card,
                    color: configTab === k ? S.bg : S.gray,
                    border: "1px solid " + (configTab === k ? S.white : S.border),
                    borderRadius: 8,
                    padding: "8px 4px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
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
                    <input
                      type={label.includes("Clave") ? "password" : "text"}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      style={inp}
                      maxLength={label.includes("Clave") ? 4 : undefined}
                    />
                  </div>
                ))}
                <button
                  onClick={async () => {
                    if (!admNombre || !admCodigo || admPin.length !== 4) {
                      showToast && showToast("Completá todos los campos (clave de 4 dígitos)");
                      return;
                    }
                    try {
                      await crearAdmin(admNombre, admCodigo, admPin, "");
                      showToast && showToast(`Admin "${admNombre}" creado ✓`);
                      setAdmNombre(""); setAdmCodigo(""); setAdmPin("");
                    } catch (e) {
                      showToast && showToast("Error: " + e.message);
                    }
                  }}
                  style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 900, cursor: "pointer" }}
                >
                  CREAR ADMINISTRADOR
                </button>
              </div>
            )}

            {configTab === "comunicados" && (
              <NovedadesAdmin
                novedades={novedades}
                onCrear={async (n) => {
                  try {
                    const nueva = await crearNovedad(n);
                    onNovedadesChange([nueva, ...novedades]);
                    showToast && showToast("Comunicado publicado ✓");
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
                  showToast && showToast("Eliminado ✓");
                }}
              />
            )}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
// ── LOGIN ─────────────────────────────────────────────────────────────
function Login({ onLogin, onAdmin, darkMode, onToggleTheme }) {
  const [codigo, setCodigo] = useState("");
  const [pin, setPin] = useState("");
  const [esAdmin, setEsAdmin] = useState(false);
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);

  const go = async () => {
    if (!codigo.trim() || !pin.trim()) {
      setErr("Completa username y clave");
      return;
    }

    setCargando(true);
    setErr("");

    try {
      if (esAdmin) {
        const admin = await loginAdmin(codigo, pin);
        onAdmin(admin);
      } else {
        const alumno = await loginConCodigo(codigo, pin);
        onLogin(alumno);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: S.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "inherit",
        position: "relative",
      }}
    >
      <GlobalStyles />
      {/* Toggle modo claro/oscuro — discreto, arriba a la derecha */}
      <button
        onClick={onToggleTheme}
        title={darkMode ? "Modo claro" : "Modo oscuro"}
        aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          background: "transparent",
          color: S.gray,
          border: "1px solid " + S.border,
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>
      {/* Header de marca — ronda 9: ícono al DOBLE (300px) con el efecto 3D
          de profundidad (mismas capas translateZ que la bienvenida) */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        <Logo3D size={300} />
        <DIWordmark width={240} style={{ color: S.white, marginTop: 8 }} />
      </div>

      <div style={{ width: "100%", maxWidth: 340, background: S.card, border: "1px solid " + S.border, borderRadius: 14, padding: "28px 24px" }}>
        <div style={{ fontSize: 10, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
          Username
        </div>
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Tu username"
          style={{ ...inp, fontSize: 15, padding: "12px 14px" }}
          disabled={cargando}
        />

        <div style={{ fontSize: 10, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, marginTop: 14 }}>
          Clave (4 dígitos)
        </div>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.slice(0, 4))}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="••••"
          maxLength={4}
          style={{ ...inp, fontSize: 15, padding: "12px 14px" }}
          disabled={cargando}
        />

        {err && <div style={{ color: S.red, fontSize: 12, marginTop: 14, padding: "8px 10px", background: "rgba(229,62,62,0.08)", borderRadius: 6, border: "1px solid rgba(229,62,62,0.2)" }}>{err}</div>}

        <button
          onClick={go}
          disabled={cargando}
          style={{
            width: "100%",
            marginTop: 18,
            background: cargando ? S.card2 : S.white,
            color: cargando ? S.gray : S.bg,
            border: "none",
            borderRadius: 8,
            padding: "13px",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
            cursor: cargando ? "not-allowed" : "pointer",
            opacity: cargando ? 0.7 : 1,
          }}
        >
          {cargando ? "Validando..." : "Ingresar"}
        </button>
      </div>

      {/* Acceso admin — discreto, al final, con estado on/off inequívoco */}
      <button
        onClick={() => setEsAdmin((v) => !v)}
        disabled={cargando}
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: esAdmin ? "rgba(76,175,80,0.12)" : "transparent",
          color: esAdmin ? S.green : S.lgray,
          border: "1px solid " + (esAdmin ? S.green : S.border),
          borderRadius: 20,
          padding: "6px 14px",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          cursor: cargando ? "not-allowed" : "pointer",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: esAdmin ? S.green : S.lgray, flexShrink: 0 }} />
        {esAdmin ? "✓ Acceso administrador activado" : "Acceso administrador"}
      </button>
    </div>
  );
}
// ── VISTA REHABILITACIÓN ─────────────────────────────────────────────
function VistaRehabilitacion({ al, onSalir, marcarAsistencia }) {
  // Ronda 7: el menú principal del alumno de rehab dice "Plan de rehabilitación"
  const [tabR, setTabR] = useState("Plan de rehabilitación");
  const [sesionIdx, setSesionIdx] = useState(0);
  const plan = al.plan || {};
  const sesiones = plan.dias || [];
  const sesion = sesiones[sesionIdx] || null;

  return (
    <div style={{ minHeight: "100vh", background: S.bg, maxWidth: 480, margin: "0 auto", fontFamily: "inherit", paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #1c1c1c", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={ICON} width={34} height={34} alt="DI" />
          <div>
            <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{al.nombre}</div>
            <div style={{ color: S.green, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Rehabilitación</div>
          </div>
        </div>
        <button onClick={onSalir} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>
          Salir
        </button>
      </div>

      {/* Datos del alumno — reusa calcularEdad, igual que la vista de entrenamiento */}
      <div style={{ padding: "0 16px 12px", display: "flex", gap: 8 }}>
        {[
          ["PESO", al.peso],
          ["ALTURA", al.altura],
          ["EDAD", calcularEdad(al.fecha_nacimiento) || al.edad],
        ].map(([l, v]) => (
          <div key={l} style={{ flex: 1, background: S.card2, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{v || "—"}</div>
            <div style={{ color: S.gray, fontSize: 9, letterSpacing: 1, marginTop: 1 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px 12px" }}>
        {["Plan de rehabilitación", "Asistencia"].map((t) => (
          <button key={t} onClick={() => setTabR(t)} style={{ ...tabBtn(tabR === t), padding: "8px 12px", fontSize: 12 }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "0 16px" }}>
        {tabR === "Plan de rehabilitación" && (
          <div>
            {sesiones.length === 0 ? (
              <div style={{ ...card, padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ color: S.white, fontWeight: 700, marginBottom: 8 }}>Sin sesiones asignadas</div>
                <div style={{ color: S.gray, fontSize: 13 }}>Tu profesional todavía no cargó ejercicios.</div>
              </div>
            ) : (
              <>
                {/* Selector de sesión */}
                {sesiones.length > 1 && (
                  <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                    {sesiones.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setSesionIdx(i)}
                        style={{ ...tabBtn(sesionIdx === i), padding: "7px 14px", fontSize: 11, flex: "none" }}
                      >
                        {s.dia || `Sesión ${i + 1}`}
                      </button>
                    ))}
                  </div>
                )}
                {sesion && (
                  <>
                    {sesion.subtitulo && (
                      <div style={{ fontSize: 13, color: S.white, fontWeight: 700, textAlign: "center", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16, background: S.card, border: "1px solid " + S.border, borderRadius: 8, padding: "10px 16px" }}>
                        {sesion.subtitulo}
                      </div>
                    )}
                    {(sesion.ejercicios || []).length === 0 ? (
                      <div style={{ ...card, padding: 30, textAlign: "center", color: S.gray, fontSize: 13 }}>Sin ejercicios en esta sesión</div>
                    ) : (
                      (sesion.ejercicios || []).map((ej, i) => (
                        <ItemCard
                          key={i}
                          numero={i + 1}
                          nombre={ej.nombre}
                          desc={ej.desc}
                          video={ej.video}
                          mediaLocal={ej.mediaLocal}
                        />
                      ))
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
        {tabR === "Asistencia" && (
          <Asistencia asistencia={al.asistencia || []} onMarcar={marcarAsistencia} />
        )}
      </div>
    </div>
  );
}
// ── MODO ENTRENADOR (ronda 9) ─────────────────────────────────────────
// Barra fija que deja INEQUÍVOCO que se está operando como entrenador
// sobre la cuenta de un alumno, con salida directa al panel admin.
function BarraEntrenador({ nombre, onVolver }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 300,
        background: S.red,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "8px 14px",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        🏋️ Modo entrenador — {nombre}
      </div>
      <button
        onClick={onVolver}
        style={{ background: "#fff", color: "#111", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 0.5, flexShrink: 0 }}
      >
        Volver al panel
      </button>
    </div>
  );
}
// Selector de alumno al activar el modo entrenador.
function SelectorAlumnoEntrenador({ alumnos, onElegir, onCerrar }) {
  const [q, setQ] = useState("");
  const lista = alumnos.filter(
    (a) =>
      a.nombre.toLowerCase().includes(q.toLowerCase()) ||
      (a.username || a.codigo || "").toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.65)", overflowY: "auto", padding: "40px 16px" }}
      onClick={onCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420, margin: "0 auto", background: S.bg, border: "1px solid " + S.border, borderRadius: 14, padding: 16 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: S.white, fontWeight: 800, fontSize: 14, letterSpacing: 1, textTransform: "uppercase" }}>🏋️ Modo entrenador</div>
          <button onClick={onCerrar} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ color: S.gray, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
          Elegí el alumno: vas a ver su interfaz tal como la ve él, y los pesos que cargues se guardan en su historial.
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o username..." style={{ ...inp, marginBottom: 10 }} />
        {lista.map((a) => (
          <div
            key={a.id}
            onClick={() => onElegir(a)}
            style={{ ...card, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 8, cursor: "pointer" }}
          >
            <FotoAlumno foto={a.foto} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{a.nombre}</div>
              <div style={{ color: S.gray, fontSize: 11 }}>
                {a.username || a.codigo}
                {a.tipo === "rehabilitacion" ? " · 🩺 Rehabilitación" : ""}
              </div>
            </div>
            <span style={{ color: S.gray }}>›</span>
          </div>
        ))}
        {lista.length === 0 && <div style={{ color: S.gray, fontSize: 12, textAlign: "center", padding: 16 }}>Sin resultados</div>}
      </div>
    </div>
  );
}
// ── PANTALLA BIENVENIDA ───────────────────────────────────────────────
function Bienvenida({ alumno, semanaData, semanaActual, onContinuar }) {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos dias" : hora < 18 ? "Buenas tardes" : "Buenas noches";
  return (
    <>
      {" "}
      <GlobalStyles />{" "}
      <div
        style={{
          minHeight: "100vh",
          background: S.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // Ronda 8: título ARRIBA, logo grande centrado en el MEDIO (flex:1),
          // y el resto (semana + horarios + botón) abajo.
          justifyContent: "flex-start",
          padding: "28px 24px 24px",
          fontFamily: "inherit",
        }}
      >
        {/* ── Ronda 9: orden vertical LOGO 3D → FOTO → saludo → nombre.
            Logo con extrusión (Logo3D, sin sombra de piso). ── */}
        <div className="di-fade" style={{ display: "flex", justifyContent: "center" }}>
          <Logo3D size={220} />
        </div>
        <div className="di-pop" style={{ marginTop: 10 }}>
          <FotoAlumno foto={alumno.foto} size={72} />
        </div>
        <div className="di-slide" style={{ textAlign: "center", width: "100%", maxWidth: 360, marginTop: 10 }}>
          <div style={{ color: S.gray, fontSize: 13, marginBottom: 4 }}>{saludo},</div>
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{alumno.nombre}</div>
        </div>{" "}
        <div
          className="di-slide"
          style={{ marginTop: 12, textAlign: "center", marginBottom: 24, animationDelay: "0.08s", width: "100%", maxWidth: 360 }}
        >
          {" "}
          <div style={{ color: S.gray, fontSize: 13 }}>Semana {semanaActual} del plan de entrenamiento</div>{" "}
          {semanaData && (
            <>
              <div
                style={{
                  marginTop: 12,
                  background: S.card,
                  border: "1px solid " + S.border,
                  borderRadius: 10,
                  padding: "12px 20px",
                  display: "inline-block",
                }}
              >
                <div style={{ color: S.white, fontWeight: 700, fontSize: 20 }}>
                  {semanaData.series}x{semanaData.reps}
                </div>
                {semanaData.intensidad && (
                  <div style={{ color: S.green, fontSize: 13, marginTop: 2 }}>al {semanaData.intensidad}</div>
                )}
              </div>
              {/* Ronda 7: centrado con márgenes cortos (antes justificado) */}
              <div style={{ color: S.gray, fontSize: 13, marginTop: 10, lineHeight: 1.5, textAlign: "center", maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
                Hoy te toca{" "}
                <span style={{ color: S.white, fontWeight: 700 }}>
                  {semanaData.series} series × {semanaData.reps} repeticiones
                </span>
                {semanaData.intensidad && (
                  <> al <span style={{ color: S.green, fontWeight: 700 }}>{semanaData.intensidad}</span></>
                )}{" "}
                en los ejercicios principales
              </div>
            </>
          )}{" "}
          {alumno.horarios && alumno.horarios.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 6 }}>
              {" "}
              {alumno.horarios.map((h, i) => (
                <div
                  key={i}
                  style={{
                    background: S.card,
                    border: "1px solid " + S.border,
                    borderRadius: 6,
                    padding: "4px 12px",
                    fontSize: 12,
                    color: S.gray,
                  }}
                >
                  <span style={{ color: S.white, fontWeight: 600 }}>{h.dia}</span>{h.hora ? " · " + h.hora : ""}
                </div>
              ))}{" "}
            </div>
          )}{" "}
        </div>{" "}
        <div className="di-slide" style={{ animationDelay: "0.16s" }}>
          {" "}
          <button
            onClick={onContinuar}
            style={{
              background: S.white,
              color: S.bg,
              border: "none",
              borderRadius: 10,
              padding: "16px 48px",
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: 2,
              cursor: "pointer",
            }}
          >
            EMPEZAR →
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </>
  );
}
// ── APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [alumnos, setAlumnos] = useState(ALUMNOS_INIT);
  const [cargado, setCargado] = useState(false);
  const [alumno, setAlumno] = useState(null);
  const [biblioteca, setBiblioteca] = useState([]);
  const [novedades, setNovedades] = useState([]);
  const [showBienvenida, setShowBienvenida] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  // ── MODO ENTRENADOR (ronda 9) ──
  // El admin (Lucas/Ari/Griselda) opera la interfaz del alumno con los
  // presenciales: elige un alumno y ve EXACTAMENTE su vista, cargando pesos
  // que se guardan igual que si los cargara el alumno. Barra roja arriba +
  // "Volver al panel" para salir.
  const [modoEntrenador, setModoEntrenador] = useState(false);
  const [selectorEntrenador, setSelectorEntrenador] = useState(false);
  const [tab, setTab] = useState("Movilidad");
  const [tabGroup, setTabGroup] = useState("entrenamiento");
  const [diaIdx, setDiaIdx] = useState(0);
  const [pesos, setPesos] = useState({});
  const [historiales, setHistoriales] = useState({});
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const showToast = (msg, ms = 2500) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), ms);
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
    ICON = next ? ICON_WHITE : ICON_BLACK;
    setDarkMode(next);
    try {
      localStorage.setItem("di_theme", next ? "dark" : "light");
    } catch (e) {}
  };
  const isRehabMode = alumno && alumno.tipo === "rehabilitacion";
  applyTheme(isRehabMode ? false : darkMode);
  ICON = (isRehabMode ? false : darkMode) ? ICON_WHITE : ICON_BLACK;
  // Arranque: carga desde Supabase. Fallback [] = nunca usa datos locales.
  useEffect(() => {
    console.log("%c[APP] Iniciando → cargarDatos desde Supabase...", "color:#6ee7b7;font-weight:bold");
    cargarDatos(ALUMNOS_INIT).then((data) => {
      console.log(`%c[APP] ✅ ${data.length} alumno(s) cargados.`, "color:#6ee7b7;font-weight:bold", data.map((a) => a.nombre));
      setAlumnos(data);
      setCargado(true);
      // Las fotos se hidratan aparte para no bloquear el arranque (pueden
      // pesar megas). Este cambio de estado NO debe disparar un guardado.
      cargarFotos().then((fotos) => {
        if (Object.keys(fotos).length === 0) return;
        _skipNextSave.current = true;
        setAlumnos((prev) => prev.map((a) => (fotos[a.id] ? { ...a, foto: fotos[a.id] } : a)));
        setAlumno((prev) => (prev && fotos[prev.id] ? { ...prev, foto: fotos[prev.id] } : prev));
      });
    });
    cargarBiblioteca().then(setBiblioteca);
    cargarNovedades().then(setNovedades);
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
  useEffect(() => {
    if (!cargado) return;
    if (_primeraVez.current) {
      _primeraVez.current = false;
      _ultimoGuardado.current = new Map(alumnos.map((a) => [a.id, _snapAlumno(a)]));
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
    guardarDatos(cambiados);
    cambiados.forEach((a) => _ultimoGuardado.current.set(a.id, _snapAlumno(a)));
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
    if (sesion.type === "admin") {
      setAdminMode(true);
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
    const f = alumnos.find((x) => x.id === a.id) || a;
    const guardado = await cargarPesos(f.id, null);
    setPesos(guardado ? guardado.pesos : initPesos(f.plan));
    setHistoriales(guardado ? guardado.historiales : initH(f.plan));
    setAlumno(f);
    setShowBienvenida(true);
    setTabGroup("entrenamiento");
    setTab("Ejercicios");
    setDiaIdx(0);
    try { localStorage.setItem("di_session", JSON.stringify({ type: "alumno", id: f.id })); } catch (e) {}
  };
  const loginAsAdmin = () => {
    try { localStorage.setItem("di_session", JSON.stringify({ type: "admin" })); } catch (e) {}
    setAdminMode(true);
  };
  const logout = () => {
    try { localStorage.removeItem("di_session"); } catch (e) {}
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
    setAlumno(f);
    setModoEntrenador(true);
    setSelectorEntrenador(false);
    setShowBienvenida(false);
    setTabGroup("entrenamiento");
    setTab("Ejercicios");
    setDiaIdx(0);
  };
  const salirModoEntrenador = () => {
    setModoEntrenador(false);
    setAlumno(null);
  };
    const handlePeso = (id, val) => {
    const np = { ...pesos, [id]: val };
    const nh = { ...historiales, [id]: [...(historiales[id] || []), { fecha: hoy(), peso: val }] };
    setPesos(np);
    setHistoriales(nh);
    // Guarda en Supabase solo ejercicios principales (plan.dias).
    // registros_diarios es la única fuente de verdad de pesos (alimenta el
    // historial del alumno y el reporte mensual del admin). historial_pesos
    // no se usa: su FK apunta a una tabla "ejercicios" que la app no tiene.
    saveDailyWeight(alumno.id, hoy(), id, Number(val));
  };
  const marcarAsistencia = (fecha) => {
    // De acá en adelante la asistencia de HOY se guarda con hora
    // ("YYYY-MM-DD HH:mm"). Días anteriores quedan solo fecha (hora desconocida).
    // La lectura sigue siendo compatible con las fechas viejas sin hora.
    const ahora = new Date();
    const registro = fecha === hoy()
      ? `${fecha} ${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`
      : fecha;
    const u = alumnos.map((a) => (a.id === alumno.id ? { ...a, asistencia: [...(a.asistencia || []), registro] } : a));
    setAlumnos(u);
    setAlumno(u.find((a) => a.id === alumno.id));
  };
  const addDiario = (entrada) => {
    const u = alumnos.map((a) => (a.id === alumno.id ? { ...a, diario: [...(a.diario || []), entrada] } : a));
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
  const registrarDia = async (ejerciciosHoy) => {
    if (registrandoDia || !alumno) return;
    setRegistrandoDia(true);
    try {
      const f = hoy();
      for (const ej of ejerciciosHoy || []) {
        const p = Number(pesos[ej.id]);
        if (p > 0) await saveDailyWeight(alumno.id, f, ej.id, p);
      }
      await saveDailyAttendance(alumno.id, f, true);
      const alActual = alumnos.find((a) => a.id === alumno.id);
      if (!(alActual?.asistencia || []).some((a) => a.slice(0, 10) === f)) marcarAsistencia(f);
      const marca = f + ":" + alumno.id;
      try { localStorage.setItem("di_dia_registrado", marca); } catch (e) {}
      setDiaRegistrado(marca);
      showToast("Día registrado ✓");
    } catch (e) {
      console.error("[registrarDia]", e);
      showToast("Error registrando el día");
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
  // Pantalla de carga (ronda 9): el logo 3D girando, centrado — sin texto.
  if (!cargado)
    return (
      <>
        <GlobalStyles />
        <div
          style={{
            minHeight: "100vh",
            background: S.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Logo3D size={160} />
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
  // Vista rehabilitación — interfaz simplificada para pacientes de kinesiología
  if (al.tipo === "rehabilitacion") {
    return (
      <>
        {modoEntrenador && <BarraEntrenador nombre={al.nombre} onVolver={salirModoEntrenador} />}
        <VistaRehabilitacion
          al={al}
          onSalir={modoEntrenador ? salirModoEntrenador : logout}
          marcarAsistencia={marcarAsistencia}
        />
        <Toast msg={toastMsg} />
      </>
    );
  }
  const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
  const hoyTexto = DIAS_SEMANA[new Date().getDay()];
  const planHoy = al.planes?.find(p => p.dia_semana === hoyTexto || p.dia_semana === "Fijo") || al.plan || al.planes?.[0];
  const plan = planHoy || al.plan;
  const planValido = plan && Array.isArray(plan.dias) && plan.dias.length > 0;
  const semanaActual = planValido ? getSemanaActual(plan.periodizacion) : 1;
  const sem = planValido ? (plan.periodizacion.find((p) => p.semana === semanaActual) || plan.periodizacion[0]) : { series: "-", reps: "-", intensidad: "" };
  const prevSem = planValido ? plan.periodizacion.find((p) => p.semana === semanaActual - 1) : null;
  const dia = planValido ? plan.dias[diaIdx] : null;
  if (showBienvenida)
    return (
      <Bienvenida
        alumno={al}
        semanaData={sem}
        semanaActual={semanaActual}
        onContinuar={() => setShowBienvenida(false)}
      />
    );
  return (
    <>
      {" "}
      <GlobalStyles /> <Toast msg={toastMsg} />{" "}
      {modoEntrenador && <BarraEntrenador nombre={al.nombre} onVolver={salirModoEntrenador} />}{" "}
      <div
        style={{
          minHeight: "100vh",
          background: S.bg,
          maxWidth: 480,
          margin: "0 auto",
          fontFamily: "inherit",
          paddingBottom: 48,
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
        {/* Header — ronda 10: centrado de VERDAD del lockup ícono+wordmark.
            Se probaron dos variantes de "1fr auto 1fr" (flex y grid) y NINGUNA
            centra de verdad acá: esos tracks/items respetan un mínimo de
            contenido automático, y como el bloque tema+Salir (~92px) pesa más
            que un spacer vacío, el lockup quedaba corrido a la izquierda
            (verificado con getBoundingClientRect). Ponerle al spacer
            izquierdo el mismo ancho real que el bloque de botones tampoco
            sirve: 222px de lockup + 92px x2 de reservas no entra en un
            viewport de celular (se verificó: desborda el ancho de pantalla).
            Solución real: tema+Salir en position:absolute (afuera del flujo,
            no compiten por espacio) y el lockup centrado con
            justifyContent:center en el 100% del contenedor. El wordmark usa
            un ancho responsivo (clamp) para no solaparse con los botones en
            pantallas angostas, manteniéndose en 160px igual que antes en
            cualquier viewport de celular normal (>=~420px). Ícono SIN el giro
            3D acá (solo gira en Bienvenida y en la pantalla de carga) — es un
            <img> estático, alineado a la misma altura que el wordmark con
            alignItems:"center". */}{" "}
        <div
          style={{
            position: "relative",
            padding: "10px 16px",
            borderBottom: "1px solid " + S.border,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            minHeight: 52,
          }}
        >
          {" "}
          <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
            <img src={ICON} width={52} height={52} alt="DI" style={{ display: "block", flexShrink: 0 }} />
            <DIWordmark width={160} style={{ color: S.white, width: "clamp(96px, 38vw, 160px)", height: "auto" }} />
          </div>{" "}
          <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>{" "}
          <button
            onClick={toggleTheme}
            title={darkMode ? "Modo claro" : "Modo oscuro"}
            style={{
              background: "transparent",
              color: S.gray,
              border: "1px solid " + S.border,
              borderRadius: 6,
              padding: "5px 9px",
              fontSize: 13,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>{" "}
          <button
            onClick={modoEntrenador ? salirModoEntrenador : logout}
            style={{
              background: "transparent",
              color: S.gray,
              border: "1px solid " + S.border,
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 11,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Salir
          </button>{" "}
          </div>{" "}
        </div>{" "}
        {/* Perfil */}{" "}
        <div className="di-pop" style={{ margin: "0 16px 12px", ...card, padding: "13px 16px" }}>
          {" "}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
            {" "}
            <FotoAlumno
              foto={al.foto}
              size={52}
              editable
              onFoto={(foto) => {
                guardarFotoAlumno(al.id, foto);
                const u = alumnos.map((a) => (a.id === al.id ? { ...a, foto } : a));
                setAlumnos(u);
                setAlumno(u.find((a) => a.id === al.id));
              }}
            />{" "}
            <div style={{ flex: 1 }}>
              {" "}
              <div style={{ color: S.white, fontWeight: 700, fontSize: 16 }}>{al.nombre}</div>{" "}
              {al.horarios && al.horarios.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                  {al.horarios.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        background: S.card2,
                        border: "1px solid " + S.border,
                        borderRadius: 5,
                        padding: "2px 8px",
                        fontSize: 10,
                        color: S.gray,
                      }}
                    >
                      <span style={{ color: S.white, fontWeight: 600 }}>{h.dia}</span>{h.hora ? " · " + h.hora : ""}
                    </div>
                  ))}
                </div>
              )}{" "}
            </div>{" "}
          </div>{" "}
          <div style={{ display: "flex", gap: 8 }}>
            {" "}
            {[
              ["PESO", al.peso],
              ["ALTURA", al.altura],
              ["EDAD", calcularEdad(al.fecha_nacimiento) || al.edad],
            ].map(([l, v]) => (
              <div
                key={l}
                style={{ flex: 1, background: S.card2, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}
              >
                <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{v || "—"}</div>
                <div style={{ color: S.gray, fontSize: 9, letterSpacing: 1, marginTop: 1 }}>{l}</div>
              </div>
            ))}{" "}
          </div>{" "}
          {al.rm && Object.values(al.rm).some((r) => r.peso > 0) && (
            <div style={{ marginTop: 10, borderTop: "1px solid " + S.border, paddingTop: 10 }}>
              {" "}
              <div
                style={{ fontSize: 9, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}
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
                    <div style={{ color: S.gray, fontSize: 9 }}>{ej}</div>
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
          {novedades
            .filter((n) => n.activo && (n.dirigido_a === "todos" || n.dirigido_a === (al.tipo || "entrenamiento")))
            .map((n) => (
              <div key={n.id} style={{ ...card, padding: "12px 14px", marginBottom: 10, borderLeft: "3px solid " + S.green }}>
                <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>📢 {n.titulo}</div>
                {n.contenido && <div style={{ color: S.gray, fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>{n.contenido}</div>}
              </div>
            ))}
          {/* ── Nivel 1: ENTRENAMIENTO | DIARIO — pills grandes, activo invertido ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[
              ["entrenamiento", "Entrenamiento"],
              ["diario", "Diario"],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setTabGroup(id)} style={tabN1(tabGroup === id)}>
                {label}
              </button>
            ))}
          </div>
          {tabGroup === "entrenamiento" && (
            <PlanDelDia
              plan={plan}
              planValido={planValido}
              dia={dia}
              diaIdx={diaIdx}
              setDiaIdx={setDiaIdx}
              sem={sem}
              semanaActual={semanaActual}
              pesos={pesos}
              historiales={historiales}
              onPeso={handlePeso}
              rm={al.rm}
              onRegistrarDia={() => registrarDia(dia?.ejercicios || [])}
              diaRegistrado={diaRegistrado === hoy() + ":" + al.id}
              registrandoDia={registrandoDia}
            />
          )}
          {/* ── DIARIO: asistencia de hoy + cómo estuvo el día ── */}{" "}
          {tabGroup === "diario" && (
          <div>
              {/* Asistencia de hoy */}
              <div style={{ ...card, padding: "18px 16px", textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                  ✓ Asistencia — {hoy()}
                </div>
                <button
                  onClick={() => {
                    if (al.asistencia?.some((a) => a.slice(0, 10) === hoy())) {
                      const u = alumnos.map((a) =>
                        a.id === al.id
                          ? { ...a, asistencia: (a.asistencia || []).filter((fecha) => fecha.slice(0, 10) !== hoy()) }
                          : a
                      );
                      setAlumnos(u);
                      setAlumno(u.find((a) => a.id === al.id));
                      showToast && showToast("Asistencia removida");
                    } else {
                      saveDailyAttendance(al.id, hoy(), true).then(() => {
                        marcarAsistencia(hoy());
                        showToast && showToast("¡Asistencia marcada! ✓");
                      });
                    }
                  }}
                  style={{
                    width: "100%",
                    background: al.asistencia?.some((a) => a.slice(0, 10) === hoy()) ? S.green : S.white,
                    color: al.asistencia?.some((a) => a.slice(0, 10) === hoy()) ? "#fff" : S.bg,
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
                  {al.asistencia?.some((a) => a.slice(0, 10) === hoy()) ? "✅ Presente hoy" : "Marcar presente"}
                </button>
              </div>
              {/* Cómo estuvo el día */}
              <Diario entradas={al.diario || []} onAdd={addDiario} />
          </div>
          )}{" "}
        </div>{" "}
      </div>{" "}
    </>
  );
}
