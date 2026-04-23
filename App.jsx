import { useState, useRef, useEffect } from "react";
// ── PERSISTENCIA (Supabase) ────────────────────────────────────────────
import {
  cargarDatos,
  guardarDatos,
  cargarPesos,
  guardarPesos,
  savePeso,
  insertAlumno,
  deleteAlumno,
  cambiarPINAlumno,
  loginConCodigo,
  loginAdmin,
  crearAlumnoConPIN,
  subirVideo,
  crearPlanAlumno,
  cargarPlanesXDia,
  cargarBioimpedancia,
  guardarBioimpedancia,
  eliminarBioimpedancia,
  crearAdmin,
  cargarBiblioteca,
  guardarEjercicioBiblioteca,
  eliminarEjercicioBiblioteca,
  cargarNovedades,
  crearNovedad,
  toggleNovedad,
  eliminarNovedad,
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
} from "./src/utils/planTemplates.js";
import { generarPDF } from "./src/utils/pdfGenerator.js";
import { S, card, inp, tabBtn, smallBtn, applyTheme } from "./src/utils/theme.js";
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
    <style>{`      @keyframes diSlideUp {        from { opacity:0; transform:translateY(16px); }        to   { opacity:1; transform:translateY(0); }      }      @keyframes diFadeIn {        from { opacity:0; }        to   { opacity:1; }      }      @keyframes diPopIn {        0%   { opacity:0; transform:scale(0.88); }        65%  { transform:scale(1.04); }        100% { opacity:1; transform:scale(1); }      }      @keyframes diPulse {        0%,100% { box-shadow:0 0 0 0 rgba(76,175,80,0.45); }        50%     { box-shadow:0 0 0 10px rgba(76,175,80,0); }      }      @keyframes diSpin {        to { transform:rotate(360deg); }      }      .di-slide { animation:diSlideUp 0.22s ease both; }      .di-fade  { animation:diFadeIn  0.18s ease both; }      .di-pop   { animation:diPopIn   0.28s cubic-bezier(0.34,1.56,0.64,1) both; }      .di-pulse { animation:diPulse   1.6s ease infinite; }      button { -webkit-tap-highlight-color:transparent; transition:transform 0.1s,opacity 0.1s; }      button:active:not(:disabled) { transform:scale(0.95) !important; opacity:0.85; }      input,textarea,select { transition:border-color 0.15s,box-shadow 0.15s; }      input:focus,textarea:focus,select:focus { box-shadow:0 0 0 2px rgba(255,255,255,0.15); }    `}</style>
  );
}
function MiniChart({ data, color = "#fff" }) {
  if (data.length < 2)
    return <div style={{ color: S.lgray, fontSize: 12, padding: "6px 0" }}>Necesitas al menos 2 registros.</div>;
  const W = 260,
    H = 80,
    pad = 12;
  const vals = data.map((d) => d.peso);
  const mn = Math.min(...vals),
    mx = Math.max(...vals),
    rng = mx - mn || 1;
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((d.peso - mn) / rng) * (H - pad * 2),
    d,
  }));
  return (
    <svg width={W} height={H} style={{ display: "block", overflow: "visible" }}>
      {" "}
      <polyline
        points={pts.map((p) => p.x + "," + p.y).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />{" "}
      {pts.map((p, i) => (
        <g key={i}>
          {" "}
          <circle cx={p.x} cy={p.y} r={4} fill={color} />{" "}
          <text x={p.x} y={p.y - 9} textAnchor="middle" fill={S.gray} fontSize="9">
            {p.d.peso}kg
          </text>{" "}
          <text x={p.x} y={H} textAnchor="middle" fill={S.lgray} fontSize="8">
            {p.d.fecha ? p.d.fecha.slice(5) : ""}
          </text>{" "}
        </g>
      ))}{" "}
    </svg>
  );
}
// ── FOTO ALUMNO ───────────────────────────────────────────────────────
function FotoAlumno({ foto, size = 56, editable, onFoto }) {
  const fileRef = useRef();
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => onFoto && onFoto(ev.target.result);
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
          border: "2px solid #2a2a2a",
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
          border: "2px dashed #2a2a2a",
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
// ── ITEM CARD ─────────────────────────────────────────────────────────
function ItemCard({
  nombre,
  desc,
  video,
  mediaLocal,
  numero,
  peso,
  historial,
  onPesoChange,
  showPeso,
  semana,
  pesoSugerido,
  intensidad,
}) {
  peso = peso || 0;
  historial = historial || [];
  showPeso = showPeso || false;
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [tmp, setTmp] = useState("0");
  const [showChart, setShowChart] = useState(false);
  const ytId = getYTId(video);
  const renderMedia = () => {
    if (ytId)
      return (
        <div
          style={{
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 12,
            background: "#000",
            position: "relative",
            paddingTop: "56.25%",
          }}
        >
          <iframe
            src={"https://www.youtube.com/embed/" + ytId}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            frameBorder="0"
            allowFullScreen
            title={nombre}
          />
        </div>
      );
    if (video && video.includes("supabase.co"))
      return (
        <video controls style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 300 }}>
          <source src={video} type="video/mp4" />
          Tu navegador no soporta videos
        </video>
      );
    if (mediaLocal && mediaLocal.startsWith("data:video"))
      return (
        <video controls style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 220 }}>
          <source src={mediaLocal} />
        </video>
      );
    if (mediaLocal && mediaLocal.startsWith("data:image"))
      return (
        <img
          src={mediaLocal}
          alt={nombre}
          style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 280, objectFit: "cover" }}
        />
      );
    return (
      <div style={{ background: S.card2, borderRadius: 8, marginBottom: 12, padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 22, marginBottom: 4 }}>▶</div>
        <div style={{ color: S.lgray, fontSize: 12 }}>Video proximamente</div>
      </div>
    );
  };
  return (
    <div style={{ ...card, marginBottom: 8, overflow: "hidden" }}>
      {" "}
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        {" "}
        <div
          style={{
            minWidth: 22,
            height: 22,
            borderRadius: "50%",
            background: S.card2,
            border: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: S.gray,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {numero}
        </div>{" "}
        <div style={{ flex: 1, color: S.white, fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{nombre}</div>{" "}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {" "}
          {showPeso && (
            <div style={{ textAlign: "right" }}>
              <div style={{ color: S.white, fontWeight: 900, fontSize: 14 }}>{peso > 0 ? peso + "kg" : "—"}</div>
              <div style={{ color: S.gray, fontSize: 9 }}>PESO</div>
            </div>
          )}{" "}
          <div style={{ color: S.gray }}>{open ? "▲" : "▼"}</div>{" "}
        </div>{" "}
      </div>{" "}
      {open && (
        <div style={{ borderTop: "1px solid #2a2a2a", padding: 14 }}>
          {" "}
          {renderMedia()}{" "}
          {desc && (
            <div style={{ color: S.gray, fontSize: 13, lineHeight: 1.6, marginBottom: showPeso ? 12 : 0 }}>{desc}</div>
          )}{" "}
          {showPeso && (
            <div style={{ background: S.card2, borderRadius: 8, padding: 12, marginTop: 4 }}>
              {" "}
              {semana && (
                <div style={{ fontSize: 10, color: S.gray, marginBottom: 6 }}>
                  SEMANA {semana.semana} — {semana.series}x{semana.reps}
                  {semana.intensidad ? " al " + semana.intensidad : ""}
                </div>
              )}{" "}
              {pesoSugerido && (
                <div
                  style={{
                    background: "#0d1f0d",
                    border: "1px solid #1a4d1a",
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {" "}
                  <div>
                    <div style={{ color: S.green, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>
                      PESO SUGERIDO HOY
                    </div>
                    <div style={{ color: S.gray, fontSize: 10 }}>
                      {semana && semana.series}x{semana && semana.reps} al {intensidad}
                    </div>
                  </div>{" "}
                  <div style={{ color: S.green, fontWeight: 900, fontSize: 24 }}>{pesoSugerido} kg</div>{" "}
                </div>
              )}{" "}
              <div
                style={{ fontSize: 10, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}
              >
                Registrar peso
              </div>{" "}
              {edit ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {" "}
                  <input
                    type="number"
                    value={tmp}
                    onChange={(e) => setTmp(e.target.value)}
                    style={{
                      flex: 1,
                      background: S.card,
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      padding: "8px 10px",
                      color: S.white,
                      fontSize: 16,
                      outline: "none",
                    }}
                  />{" "}
                  <span style={{ color: S.gray }}>kg</span>{" "}
                  <button
                    onClick={() => {
                      onPesoChange && onPesoChange(Number(tmp));
                      setEdit(false);
                    }}
                    style={{
                      background: S.white,
                      color: S.bg,
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 14px",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    ✓
                  </button>{" "}
                  <button
                    onClick={() => setEdit(false)}
                    style={{
                      background: "transparent",
                      color: S.gray,
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      padding: "8px 10px",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>{" "}
                </div>
              ) : (
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}
                >
                  {" "}
                  <span style={{ color: S.white, fontWeight: 700, fontSize: 18 }}>
                    {peso > 0 ? peso + " kg" : "Sin registrar"}
                  </span>{" "}
                  <button
                    onClick={() => {
                      setTmp(String(peso));
                      setEdit(true);
                    }}
                    style={{
                      background: "transparent",
                      color: S.white,
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    ✎ EDITAR
                  </button>{" "}
                </div>
              )}{" "}
              {historial.length > 0 && (
                <div>
                  {" "}
                  <button
                    onClick={() => setShowChart(!showChart)}
                    style={{
                      background: "transparent",
                      color: S.gray,
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      padding: "5px 10px",
                      fontSize: 10,
                      cursor: "pointer",
                      marginTop: 8,
                    }}
                  >
                    {" "}
                    {showChart ? "▲ OCULTAR" : "📈 PROGRESO"} ({historial.length}){" "}
                  </button>{" "}
                  {showChart && (
                    <div style={{ marginTop: 10 }}>
                      <MiniChart data={historial} />
                    </div>
                  )}{" "}
                </div>
              )}{" "}
            </div>
          )}{" "}
        </div>
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
                    border: "1px solid #2a2a2a",
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
                border: "1px solid #2a2a2a",
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
            border: "1px dashed #2a2a2a",
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
function DiasEditor({ dias = [], onChange, biblioteca = [], onGuardarBiblioteca }) {
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
        <button
          onClick={addDia}
          style={{
            background: "transparent",
            color: S.gray,
            border: "1px dashed #2a2a2a",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          + Dia
        </button>{" "}
      </div>{" "}
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
                border: "1px solid #2a2a2a",
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
  return (
    <div>
      {" "}
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
                    border: "1px solid #2a2a2a",
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
        placeholder="Buscar por nombre, codigo o username..."
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
                borderBottom: "1px solid #2a2a2a",
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
        <div
          style={{
            background: S.card2,
            border: "1px solid #2a2a2a",
            borderRadius: 8,
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {" "}
          <FotoAlumno foto={al.foto} size={32} />{" "}
          <div style={{ flex: 1 }}>
            <span style={{ color: S.white, fontWeight: 700 }}>{al.nombre}</span>
            <span style={{ color: S.gray, fontSize: 11, marginLeft: 8 }}>{al.username || al.codigo}</span>
          </div>{" "}
          <div style={{ color: S.gray, fontSize: 11 }}>seleccionado</div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
// ── ASISTENCIA ────────────────────────────────────────────────────────
function Asistencia({ asistencia, onMarcar }) {
  const hoyStr = hoy();
  const yaMarco = asistencia.includes(hoyStr);
  const [diaAnterior, setDiaAnterior] = useState("");
  const [showDiaAnterior, setShowDiaAnterior] = useState(false);
  const marcarDiaAnterior = () => {
    if (!diaAnterior || diaAnterior >= hoyStr) return;
    if (asistencia.includes(diaAnterior)) {
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
  const sorted = [...asistencia].sort((a, b) => b.localeCompare(a));
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    const ds = checkDate.toISOString().split("T")[0];
    if (sorted.includes(ds)) {
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
            const fue = asistencia.includes(d);
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
                  <tr key={i} style={{ borderBottom: "1px solid #2a2a2a" }}>
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
                borderBottom: i < records.length - 1 ? "1px solid #2a2a2a" : "none",
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
                  borderBottom: i < diarioMes.length - 1 ? "1px solid #2a2a2a" : "none",
                }}
              >
                {" "}
                <div style={{ color: S.lgray, fontSize: 11, marginBottom: 4 }}>{e.fecha}</div>{" "}
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
    onAdd({ fecha: hoy(), texto: texto.trim() });
    setTexto("");
  };
  return (
    <div>
      {" "}
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Mi diario de entrenamiento
      </div>{" "}
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
              <div style={{ color: S.lgray, fontSize: 11, marginBottom: 4 }}>{e.fecha}</div>{" "}
              <div style={{ color: S.white, fontSize: 14, lineHeight: 1.5 }}>{e.texto}</div>{" "}
            </div>
          ))
      )}{" "}
    </div>
  );
}
// ── PESO MAX ALUMNO ───────────────────────────────────────────────────
function PesoMaxAlumno({ rm, onUpdate }) {
  const [editEj, setEditEj] = useState(null);
  const [tmp, setTmp] = useState("");
  const guardar = (ej) => {
    if (!tmp || isNaN(Number(tmp))) return;
    onUpdate({ ...rm, [ej]: { peso: Number(tmp), fecha: hoy() } });
    setEditEj(null);
    setTmp("");
  };
  return (
    <div>
      {" "}
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Mis pesos maximos
      </div>{" "}
      {RM_EJS.map((ej) => {
        const dato = rm && rm[ej];
        const isEditing = editEj === ej;
        return (
          <div key={ej} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
            {" "}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: isEditing ? 10 : 0,
              }}
            >
              {" "}
              <div>
                <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>{ej}</div>
                {dato && dato.fecha && <div style={{ color: S.gray, fontSize: 11, marginTop: 2 }}>{dato.fecha}</div>}
              </div>{" "}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {" "}
                {dato && dato.peso > 0 && !isEditing && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: S.white, fontWeight: 900, fontSize: 22 }}>{dato.peso} kg</div>
                    <div style={{ color: S.gray, fontSize: 9, letterSpacing: 1 }}>PESO MAX</div>
                  </div>
                )}{" "}
                {!isEditing && (
                  <button
                    onClick={() => {
                      setEditEj(ej);
                      setTmp(dato && dato.peso ? String(dato.peso) : "");
                    }}
                    style={{
                      background: "transparent",
                      color: S.white,
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    {dato && dato.peso > 0 ? "✎ EDITAR" : "+ CARGAR"}
                  </button>
                )}{" "}
              </div>{" "}
            </div>{" "}
            {isEditing && (
              <div>
                {" "}
                <div style={{ fontSize: 11, color: S.gray, marginBottom: 6 }}>NUEVO PESO MAXIMO (kg)</div>{" "}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  {" "}
                  <input
                    type="number"
                    value={tmp}
                    onChange={(e) => setTmp(e.target.value)}
                    placeholder="kg"
                    style={{ flex: 1, ...inp, fontSize: 18, fontWeight: 700 }}
                  />{" "}
                  <span style={{ color: S.gray, fontSize: 14 }}>kg</span>{" "}
                </div>{" "}
                <div style={{ fontSize: 11, color: S.lgray, marginBottom: 10 }}>
                  Se registrara con la fecha de hoy: {hoy()}
                </div>{" "}
                <div style={{ display: "flex", gap: 8 }}>
                  {" "}
                  <button
                    onClick={() => guardar(ej)}
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
                    onClick={() => {
                      setEditEj(null);
                      setTmp("");
                    }}
                    style={{
                      background: "transparent",
                      color: S.gray,
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      padding: "10px 16px",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>{" "}
                </div>{" "}
              </div>
            )}{" "}
            {dato && dato.peso > 0 && !isEditing && (
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
// ── BIO SCREEN ────────────────────────────────────────────────────────
function BioScreen({ estudios, onAdd }) {
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newFecha, setNewFecha] = useState("");
  const [newImg, setNewImg] = useState("");
  const fileRef = useRef();
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setNewImg(ev.target.result);
    r.readAsDataURL(f);
  };
  const guardar = () => {
    if (!newFecha) return;
    onAdd({ fecha: newFecha, img: newImg });
    setAdding(false);
    setNewFecha("");
    setNewImg("");
  };
  if (selected)
    return (
      <div>
        {" "}
        <button
          onClick={() => setSelected(null)}
          style={{
            background: "transparent",
            color: S.gray,
            border: "1px solid #2a2a2a",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 12,
            cursor: "pointer",
            marginBottom: 14,
          }}
        >
          ← Volver
        </button>{" "}
        <div style={{ color: S.white, fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
          Estudio — {selected.fecha}
        </div>{" "}
        {selected.img ? (
          <img src={selected.img} alt="bio" style={{ width: "100%", borderRadius: 10 }} />
        ) : (
          <div style={{ ...card, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 32 }}>📋</div>
            <div style={{ color: S.gray, fontSize: 13, marginTop: 8 }}>Sin imagen</div>
          </div>
        )}{" "}
      </div>
    );
  return (
    <div>
      {" "}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        {" "}
        <div style={{ fontSize: 11, color: S.gray, letterSpacing: 3, textTransform: "uppercase" }}>
          Estudios por fecha
        </div>{" "}
        <button
          onClick={() => setAdding(true)}
          style={{
            background: S.white,
            color: S.bg,
            border: "none",
            borderRadius: 6,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          + NUEVO
        </button>{" "}
      </div>{" "}
      {adding && (
        <div style={{ ...card, padding: 16, marginBottom: 14 }}>
          {" "}
          <input
            type="date"
            value={newFecha}
            onChange={(e) => setNewFecha(e.target.value)}
            style={{ ...inp, marginBottom: 12 }}
          />{" "}
          <div
            onClick={() => fileRef.current.click()}
            style={{
              background: S.card2,
              border: "2px dashed #2a2a2a",
              borderRadius: 8,
              padding: 20,
              textAlign: "center",
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            {" "}
            {newImg ? (
              <img
                src={newImg}
                alt=""
                style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 6 }}
              />
            ) : (
              <div style={{ color: S.lgray, fontSize: 13 }}>📷 Adjuntar foto</div>
            )}{" "}
          </div>{" "}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />{" "}
          <div style={{ display: "flex", gap: 8 }}>
            {" "}
            <button
              onClick={guardar}
              style={{
                flex: 1,
                background: S.white,
                color: S.bg,
                border: "none",
                borderRadius: 6,
                padding: 10,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              GUARDAR
            </button>{" "}
            <button
              onClick={() => {
                setAdding(false);
                setNewFecha("");
                setNewImg("");
              }}
              style={{
                background: "transparent",
                color: S.gray,
                border: "1px solid #2a2a2a",
                borderRadius: 6,
                padding: "10px 16px",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {estudios.length === 0 && !adding && (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>📊</div>
          <div style={{ color: S.gray, fontSize: 13, marginTop: 8 }}>Sin estudios</div>
        </div>
      )}{" "}
      {[...estudios]
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((est, i) => (
          <div
            key={i}
            onClick={() => setSelected(est)}
            style={{
              ...card,
              marginBottom: 8,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            {" "}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {" "}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  background: S.card2,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {" "}
                {est.img ? (
                  <img src={est.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ fontSize: 18 }}>📋</div>
                )}{" "}
              </div>{" "}
              <div>
                <div style={{ color: S.white, fontWeight: 700 }}>Bioimpedancia</div>
                <div style={{ color: S.gray, fontSize: 12 }}>{est.fecha}</div>
              </div>{" "}
            </div>{" "}
            <div style={{ color: S.gray, fontSize: 16 }}>›</div>{" "}
          </div>
        ))}{" "}
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
          borderBottom: "1px solid #2a2a2a",
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
                style={{ background: cur ? "#1c1c1c" : "transparent", borderBottom: "1px solid #2a2a2a" }}
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
function HistorialAdmin({ alumnos }) {
  const [selId, setSelId] = useState(alumnos[0] && alumnos[0].id);
  const [selEj, setSelEj] = useState(null);
  const [histData, setHistData] = useState({});
  const al = alumnos.find((a) => a.id === selId) || alumnos[0];
  useEffect(() => {
    if (!selId) return;
    cargarPesos(selId, null).then((data) => {
      if (data && data.historiales) setHistData(data.historiales);
      else setHistData({});
    });
  }, [selId]);
  const ejercicios = al ? al.plan.dias.flatMap((d) => d.ejercicios) : [];
  return (
    <div>
      {" "}
      <AlumnoBuscador
        alumnos={alumnos}
        selId={selId}
        onSelect={(id) => {
          setSelId(id);
          setSelEj(null);
        }}
      />{" "}
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Historial — {al && al.nombre}
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
              <div style={{ borderTop: "1px solid #2a2a2a", padding: 14 }}>
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
                      <tr key={i} style={{ borderBottom: "1px solid #2a2a2a" }}>
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
                  borderTop: "1px solid #2a2a2a",
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
// ── DASHBOARD ADMIN ───────────────────────────────────────────────────
function Dashboard({ alumnos, selId, onSelect, onDelete, onNuevo }) {
  const lunesStr = (() => {
    const d = new Date();
    const l = new Date(d);
    l.setDate(d.getDate() - d.getDay() + 1);
    return l.toISOString().split("T")[0];
  })();

  return (
    <div>
      {/* Buscador + botón nuevo */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <AlumnoBuscador alumnos={alumnos} selId={selId} onSelect={onSelect} />
        </div>
        <button
          onClick={onNuevo}
          style={{ background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 900, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          + Nuevo
        </button>
      </div>

      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
        Todos los alumnos ({alumnos.length})
      </div>

      {alumnos.map((al) => {
        const asistSemana = (al.asistencia || []).filter((d) => d >= lunesStr).length;
        const asistMes = (al.asistencia || []).filter((d) => d.startsWith(mesActual().slice(0, 7))).length;
        const ultimaAsist = [...(al.asistencia || [])].sort((a, b) => b.localeCompare(a))[0];
        const entrenoHoy = ultimaAsist === hoy();
        const isSelected = al.id === selId;
        return (
          <div
            key={al.id}
            style={{ ...card, marginBottom: 10, padding: "14px 16px", border: "1px solid " + (isSelected ? S.white : S.border) }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div onClick={() => onSelect(al.id)} style={{ cursor: "pointer" }}>
                <FotoAlumno foto={al.foto} size={44} />
              </div>
              <div onClick={() => onSelect(al.id)} style={{ flex: 1, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 15 }}>{al.nombre}</div>
                  <div style={{ background: entrenoHoy ? "#0d1f0d" : S.card2, border: "1px solid " + (entrenoHoy ? S.green : S.border), borderRadius: 20, padding: "3px 10px", fontSize: 10, color: entrenoHoy ? S.green : S.lgray, fontWeight: 700 }}>
                    {entrenoHoy ? "✓ HOY" : "Sin registro"}
                  </div>
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
// ── BIOIMPEDANCIA ─────────────────────────────────────────────────────
function BioimpedanciaSection({ alumnoId, showToast, readOnly = false }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [archivo, setArchivo] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (!alumnoId) return;
    cargarBioimpedancia(alumnoId).then(d => { setRegistros(d); setLoading(false); });
  }, [alumnoId]);

  const subir = async () => {
    if (!archivo) { showToast && showToast("Seleccioná un archivo"); return; }
    setSubiendo(true);
    try {
      const nuevo = await guardarBioimpedancia(alumnoId, { fecha, archivo });
      setRegistros(prev => [nuevo, ...prev]);
      setShowForm(false);
      setArchivo(null);
      showToast && showToast("Bioimpedancia guardada ✓");
    } catch (e) { showToast && showToast("Error al subir: " + e.message); }
    setSubiendo(false);
  };

  const eliminar = async (r) => {
    if (!window.confirm("¿Eliminar este registro?")) return;
    await eliminarBioimpedancia(r.id, r.archivo_url);
    setRegistros(prev => prev.filter(x => x.id !== r.id));
    showToast && showToast("Eliminado");
  };

  if (loading) return <div style={{ color: S.gray, padding: 16, fontSize: 13 }}>Cargando...</div>;

  const isImg = (url) => url && /\.(png|jpe?g|webp|gif)$/i.test(url);

  return (
    <div>
      {!readOnly && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{ background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 16, width: "100%" }}
        >
          + Cargar estudio
        </button>
      )}
      {showForm && (
        <div style={{ ...card, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Nuevo estudio</div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>FECHA DEL ESTUDIO</div>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inp} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>ARCHIVO (imagen o PDF)</div>
            <div
              onClick={() => fileRef.current && fileRef.current.click()}
              style={{ border: "2px dashed " + S.border, borderRadius: 8, padding: "20px", textAlign: "center", cursor: "pointer", background: S.card2 }}
            >
              {archivo
                ? <div style={{ color: S.green, fontSize: 13 }}>✓ {archivo.name}</div>
                : <div style={{ color: S.gray, fontSize: 13 }}>Tocá para seleccionar archivo</div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => setArchivo(e.target.files[0] || null)} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={subir} disabled={subiendo} style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "9px", fontWeight: 700, cursor: "pointer" }}>
              {subiendo ? "Subiendo..." : "GUARDAR"}
            </button>
            <button onClick={() => { setShowForm(false); setArchivo(null); }} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 6, padding: "9px 14px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
      {registros.length === 0 ? (
        <div style={{ color: S.lgray, fontSize: 13, textAlign: "center", padding: 24 }}>Sin estudios cargados</div>
      ) : (
        registros.map((r) => (
          <div key={r.id} style={{ ...card, padding: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: r.archivo_url ? 10 : 0 }}>
              <div>
                <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>{r.fecha}</div>
                {r.nombre_archivo && <div style={{ fontSize: 11, color: S.gray, marginTop: 2 }}>{r.nombre_archivo}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {r.archivo_url && (
                  <a href={r.archivo_url} target="_blank" rel="noreferrer"
                    style={{ background: S.card2, color: S.white, border: "1px solid " + S.border, borderRadius: 5, padding: "4px 10px", fontSize: 11, textDecoration: "none" }}>
                    Ver
                  </a>
                )}
                {!readOnly && (
                  <button onClick={() => eliminar(r)} style={{ background: "transparent", color: S.red, border: "1px solid " + S.red, borderRadius: 5, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
                )}
              </div>
            </div>
            {r.archivo_url && isImg(r.archivo_url) && (
              <img src={r.archivo_url} alt="bio" style={{ width: "100%", borderRadius: 8, maxHeight: 300, objectFit: "contain", background: "#000" }} />
            )}
          </div>
        ))
      )}
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
function DiarioAdmin({ alumnos }) {
  const [selId, setSelId] = useState(alumnos[0]?.id);
  const al = alumnos.find((a) => a.id === selId) || alumnos[0];
  const entradas = [...(al?.diario || [])].sort((a, b) => b.fecha.localeCompare(a.fecha));

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
          <div key={i} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
            <div style={{ color: S.lgray, fontSize: 11, marginBottom: 6 }}>{e.fecha}</div>
            <div style={{ color: S.white, fontSize: 14, lineHeight: 1.6 }}>{e.texto}</div>
          </div>
        ))
      )}
    </div>
  );
}

// ── ADMIN PANEL ───────────────────────────────────────────────────────
function AdminPanel({ alumnos, onUpdate, onClose, showToast, biblioteca = [], onGuardarBiblioteca, novedades = [], onNovedadesChange }) {
  const [sec, setSec] = useState("dashboard");
  const [selId, setSelId] = useState(alumnos[0] && alumnos[0].id);
  const [planTab, setPlanTab] = useState("entrenamiento");
  const [selectedDia, setSelectedDia] = useState(null);
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
    [ntipo, setNtipo] = useState("entrenamiento");
  const [admNombre, setAdmNombre] = useState(""),
    [admCodigo, setAdmCodigo] = useState(""),
    [admPin, setAdmPin] = useState("");
  const [configTab, setConfigTab] = useState("admin");
  const [showCrearAlumno, setShowCrearAlumno] = useState(false);
  const [alumnosTab, setAlumnosTab] = useState("perfil");
  const [editPin, setEditPin] = useState("");
  const [nh, setNh] = useState([{ dia: "", hora: "" }]);
  const [ntemplate, setNtemplate] = useState("bilateral");
  const [ndias, setNdias] = useState({}); // {Lunes: "bilateral", Martes: "unilateral", ...}
  const DIAS_SEM = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  const al = alumnos.find((a) => a.id === selId) || alumnos[0];
  const startEdit = () =>
    setForm({
      nombre: al.nombre,
      username: al.username || "",
      codigo: al.codigo,
      peso: al.peso,
      altura: al.altura,
      edad: al.edad,
      fecha_nacimiento: al.fecha_nacimiento || "",
      horarios: JSON.parse(JSON.stringify(al.horarios || [])),
    });
  const saveEdit = () => {
    if (!form.nombre) return;
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, ...form } : a)));
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
  const crearAlumno = async () => {
    if (!nn || !nc || !npin) {
      showToast && showToast("Completa todos los campos requeridos");
      return;
    }
    if (npin.length !== 4) {
      showToast && showToast("PIN debe tener 4 dígitos");
      return;
    }
    const tpl = ntemplate === "unilateral" ? PLAN_UNILATERAL : PLAN_BILATERAL;
    try {
      const nuevoAl = await crearAlumnoConPIN(nn, nc, npin, na, np, nfecha || null, ntipo);
      const alumnoConPlan = {
        ...nuevoAl,
        horarios: nh.filter((h) => h.dia),
        plan: JSON.parse(JSON.stringify(tpl)),
        planes: [],
        plantilla_id: null,
      };

      // Crear planes para los días seleccionados
      const diasAsignados = Object.keys(ndias).filter(dia => ndias[dia]);
      if (diasAsignados.length > 0) {
        for (const dia of diasAsignados) {
          const planTipo = ndias[dia] || "bilateral";
          const planTemplate = planTipo === "unilateral" ? PLAN_UNILATERAL : PLAN_BILATERAL;
          const res = await crearPlanAlumno(nuevoAl.id, dia, planTemplate);
          if (res.ok) {
            alumnoConPlan.planes.push(res.data);
          }
        }
      } else {
        // Si no seleccionó días, crear plan "Fijo" por defecto
        const res = await crearPlanAlumno(nuevoAl.id, "Fijo", tpl);
        if (res.ok) {
          alumnoConPlan.planes.push(res.data);
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
      setNtipo("entrenamiento");
      setNh([{ dia: "", hora: "" }]);
      setNtemplate("bilateral");
      setNdias({});
      showToast && showToast("Alumno creado ✓");
      setSec("dashboard");
    } catch (e) {
      console.error("[crearAlumno] Excepción:", e);
      showToast && showToast("Error inesperado. Ver consola.");
    }
  };
  const asignarPlanDia = async (tipoPlane) => {
    if (!selectedDia || !al) return;
    const tpl = tipoPlane === "Unilateral" ? PLAN_UNILATERAL : PLAN_BILATERAL;
    try {
      const result = await crearPlanAlumno(al.id, selectedDia, tpl);
      if (result.ok) {
        showToast && showToast(`Plan "${tipoPlane}" asignado para ${selectedDia} ✓`);
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
        fontFamily: "system-ui",
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
          <button
            onClick={() => { setSec("config"); setForm(null); }}
            style={{
              background: sec === "config" ? S.white : "transparent",
              color: sec === "config" ? S.bg : S.gray,
              border: "1px solid " + (sec === "config" ? S.white : "#2a2a2a"),
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ⚙ Config
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: S.gray,
              border: "1px solid #2a2a2a",
              borderRadius: 6,
              padding: "5px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>{" "}
      </div>{" "}
      <div style={{ display: "flex", gap: 4, padding: "0 16px", marginBottom: 8 }}>
        {secBtn("Dashboard", "dashboard")}
        {secBtn("Alumnos", "alumnos")}
      </div>{" "}
      <div style={{ display: "flex", gap: 4, padding: "0 16px", marginBottom: 16 }}>
        {secBtn("Plan", "plan")}
        {secBtn("Peso Max", "rm")}
        {secBtn("Historial", "historial")}
        {secBtn("Diario", "diario")}
        {secBtn("Bioimp.", "bioimpedancia")}
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
                setAlumnosTab("perfil");
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
            />

            {/* Formulario nuevo alumno inline en dashboard */}
            {showCrearAlumno && (
              <div style={{ ...card, padding: 16, marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase" }}>Crear nuevo alumno</div>
                  <button onClick={() => setShowCrearAlumno(false)} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 16, cursor: "pointer" }}>✕</button>
                </div>
                {[["Nombre completo", nn, setNn], ["Username (para login)", nc, setNc], ["PIN (4 dígitos)", npin, setNpin], ["Peso (kg)", np, setNp], ["Altura (cm)", na, setNa]].map(([label, val, set]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                    <input value={val} onChange={(e) => set(e.target.value)} style={inp} />
                  </div>
                ))}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>Fecha de nacimiento</div>
                  <input type="date" value={nfecha} onChange={(e) => setNfecha(e.target.value)} style={inp} />
                  {nfecha && <div style={{ fontSize: 11, color: S.green, marginTop: 4 }}>Edad: {calcularEdad(nfecha)} años</div>}
                </div>
                <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Días y horarios</div>
                {nh.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <select value={h.dia} onChange={(e) => setNh((hs) => hs.map((x, j) => (j === i ? { ...x, dia: e.target.value } : x)))} style={{ ...inp, flex: 1 }}>
                      <option value="">Dia</option>
                      {DIAS_SEM.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input type="time" value={h.hora} onChange={(e) => setNh((hs) => hs.map((x, j) => (j === i ? { ...x, hora: e.target.value } : x)))} style={{ ...inp, width: 90, flex: "none" }} />
                    {i > 0 && <button onClick={() => setNh((hs) => hs.filter((_, j) => j !== i))} style={{ color: S.red, background: "transparent", border: "1px solid " + S.red, borderRadius: 6, padding: "8px 10px", cursor: "pointer" }}>✕</button>}
                  </div>
                ))}
                <button onClick={() => setNh((hs) => [...hs, { dia: "", hora: "" }])} style={{ background: "transparent", color: S.gray, border: "1px dashed #2a2a2a", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", marginBottom: 14 }}>+ Agregar dia</button>
                <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Tipo de alumno</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {[["🏋️ Entrenamiento", "entrenamiento"], ["🩺 Rehabilitación", "rehabilitacion"]].map(([l, k]) => (
                    <button key={k} onClick={() => setNtipo(k)} style={{ flex: 1, background: ntipo === k ? (k === "rehabilitacion" ? "#0a2a1a" : S.white) : S.card, color: ntipo === k ? (k === "rehabilitacion" ? S.green : S.bg) : S.gray, border: "1px solid " + (ntipo === k ? (k === "rehabilitacion" ? S.green : S.white) : S.border), borderRadius: 8, padding: "10px 4px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{l}</button>
                  ))}
                </div>
                {ntipo === "entrenamiento" && (
                  <>
                    <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Template de plan</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      {[["Bilateral", "bilateral"], ["Unilateral", "unilateral"]].map(([l, k]) => (
                        <button key={k} onClick={() => setNtemplate(k)} style={{ flex: 1, background: ntemplate === k ? S.white : S.card, color: ntemplate === k ? S.bg : S.gray, border: "1px solid " + (ntemplate === k ? S.white : S.border), borderRadius: 8, padding: "10px 4px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{l}</button>
                      ))}
                    </div>
                  </>
                )}
                <button
                  onClick={async () => { await crearAlumno(); setShowCrearAlumno(false); }}
                  style={{ width: "100%", background: ntipo === "rehabilitacion" ? S.green : S.white, color: S.bg, border: "none", borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 900, cursor: "pointer" }}
                >
                  CREAR ALUMNO
                </button>
              </div>
            )}
          </div>
        )}{" "}
        {sec === "alumnos" && al && (
          <div>
            {/* Header con nombre + botón volver */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button
                onClick={() => { setSec("dashboard"); setForm(null); }}
                style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}
              >← Volver</button>
              <div style={{ color: S.white, fontWeight: 700, fontSize: 15 }}>{al.nombre}</div>
            </div>

            {/* Tabs: Perfil | Diario */}
            <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
              {[["Perfil", "perfil"], ["📓 Diario", "diario"]].map(([l, k]) => (
                <button key={k} onClick={() => { setAlumnosTab(k); setForm(null); }} style={{ flex: 1, background: alumnosTab === k ? S.white : S.card, color: alumnosTab === k ? S.bg : S.gray, border: "1px solid " + (alumnosTab === k ? S.white : S.border), borderRadius: 8, padding: "8px 4px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{l}</button>
              ))}
            </div>

            {/* ── TAB PERFIL ── */}
            {alumnosTab === "perfil" && (<>
              {form ? (
                <div style={{ ...card, padding: 16 }}>
                  <div style={{ color: S.white, fontWeight: 700, marginBottom: 14 }}>Editar alumno</div>
                  {[
                    ["Nombre", form.nombre, "nombre"],
                    ["Username (login)", form.codigo, "codigo"],
                    ["Peso", form.peso, "peso"],
                    ["Altura", form.altura, "altura"],
                  ].map(([label, val, key]) => (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>{label}</div>
                      <input value={val || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} style={inp} />
                    </div>
                  ))}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>Fecha de nacimiento</div>
                    <input type="date" value={form.fecha_nacimiento || ""} onChange={(e) => setForm((f) => ({ ...f, fecha_nacimiento: e.target.value }))} style={inp} />
                    {form.fecha_nacimiento && <div style={{ fontSize: 11, color: S.green, marginTop: 4 }}>Edad: {calcularEdad(form.fecha_nacimiento)} años</div>}
                  </div>

                  {/* Cambiar PIN */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>Nuevo PIN (4 dígitos — dejá vacío para no cambiar)</div>
                    <input
                      type="password"
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value.slice(0, 4))}
                      placeholder="····"
                      maxLength={4}
                      style={inp}
                    />
                    {editPin.length > 0 && editPin.length < 4 && <div style={{ fontSize: 11, color: S.red, marginTop: 4 }}>PIN debe ser de 4 dígitos</div>}
                    {editPin.length === 4 && <div style={{ fontSize: 11, color: S.green, marginTop: 4 }}>✓ Nuevo PIN listo para guardar</div>}
                  </div>

                  <div style={{ fontSize: 11, color: S.gray, marginBottom: 8, textTransform: "uppercase" }}>Dias y horarios</div>
                  {form.horarios.map((h, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                      <select value={h.dia} onChange={(e) => setForm((f) => ({ ...f, horarios: f.horarios.map((x, j) => (j === i ? { ...x, dia: e.target.value } : x)) }))} style={{ ...inp, flex: 1 }}>
                        <option value="">Dia</option>
                        {DIAS_SEM.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input type="time" value={h.hora} onChange={(e) => setForm((f) => ({ ...f, horarios: f.horarios.map((x, j) => (j === i ? { ...x, hora: e.target.value } : x)) }))} style={{ ...inp, width: 90, flex: "none" }} />
                      <button onClick={() => setForm((f) => ({ ...f, horarios: f.horarios.filter((_, j) => j !== i) }))} style={{ color: S.red, background: "transparent", border: "1px solid " + S.red, borderRadius: 6, padding: "8px 10px", cursor: "pointer" }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => setForm((f) => ({ ...f, horarios: [...f.horarios, { dia: "", hora: "" }] }))} style={{ background: "transparent", color: S.gray, border: "1px dashed #2a2a2a", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", marginBottom: 14 }}>+ Agregar dia</button>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={async () => {
                        saveEdit();
                        if (editPin.length === 4) {
                          const ok = await cambiarPINAlumno(al.id, editPin);
                          showToast && showToast(ok ? "PIN actualizado ✓" : "Error al cambiar PIN");
                          setEditPin("");
                        }
                      }}
                      style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontWeight: 900, cursor: "pointer" }}
                    >GUARDAR</button>
                    <button onClick={() => { setForm(null); setEditPin(""); }} style={{ background: "transparent", color: S.gray, border: "1px solid #2a2a2a", borderRadius: 8, padding: "12px 16px", cursor: "pointer" }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ ...card, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <FotoAlumno foto={al.foto} size={52} editable onFoto={(foto) => { onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, foto } : a))); }} />
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
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(al.horarios || []).map((h, i) => (
                      <span key={i} style={{ background: S.card2, border: "1px solid #2a2a2a", borderRadius: 4, padding: "2px 8px", fontSize: 10, color: S.gray }}>
                        <span style={{ color: S.white }}>{h.dia}</span> · {h.hora}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>)}

            {/* ── TAB DIARIO ── */}
            {alumnosTab === "diario" && (
              <div>
                {[...(al.diario || [])].sort((a, b) => b.fecha.localeCompare(a.fecha)).length === 0 ? (
                  <div style={{ ...card, padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📓</div>
                    <div style={{ color: S.gray, fontSize: 13 }}>Sin entradas todavía</div>
                  </div>
                ) : (
                  [...(al.diario || [])].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((e, i) => (
                    <div key={i} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
                      <div style={{ color: S.lgray, fontSize: 11, marginBottom: 6 }}>{e.fecha}</div>
                      <div style={{ color: S.white, fontSize: 14, lineHeight: 1.6 }}>{e.texto}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}{" "}
        {sec === "plan" && (
          <div>
            {" "}
            <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
              {" "}
              {[
                ["Movil.", "movilidad"],
                ["Act. Banda", "calor"],
                ["E. Calor", "activacion"],
                ["Princip.", "entrenamiento"],
                ["Period.", "periodizacion"],
                ["Plan Día", "plan-dias"],
              ].map(([l, k]) => (
                <button
                  key={k}
                  onClick={() => setPlanTab(k)}
                  style={{
                    flex: 1,
                    background: planTab === k ? S.white : S.card,
                    color: planTab === k ? S.bg : S.gray,
                    border: "1px solid " + (planTab === k ? S.white : S.border),
                    borderRadius: 8,
                    padding: "7px 4px",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {l}
                </button>
              ))}{" "}
            </div>{" "}
            {planTab === "entrenamiento" && al && (
              <DiasEditor dias={al.plan.dias} onChange={(v) => updatePlan("dias", v)} biblioteca={biblioteca} onGuardarBiblioteca={onGuardarBiblioteca} />
            )}{" "}
            {planTab === "movilidad" && al && (
              <>
                <EjercicioEditor
                  items={al.plan.movilidad}
                  onChange={(v) => updatePlan("movilidad", v)}
                  showVideo={true}
                  biblioteca={biblioteca}
                  onGuardarBiblioteca={onGuardarBiblioteca}
                />
                {/* Videos rutina completa */}
                <div style={{ ...card, padding: "14px 16px", marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 12, letterSpacing: 1 }}>
                    Videos — Rutina completa
                  </div>
                  {[
                    { label: "Corta", key: "corta", defaultDur: "8 min" },
                    { label: "Avanzada", key: "avanzada", defaultDur: "15 min" },
                  ].map(({ label, key, defaultDur }) => {
                    const mv = al.plan.movilidad_videos?.[key] || {};
                    return (
                      <div key={key} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: S.gray, marginBottom: 6 }}>{label}</div>
                        <input
                          placeholder={`URL del video (${label.toLowerCase()})`}
                          value={mv.url || ""}
                          onChange={(e) => updatePlan("movilidad_videos", {
                            ...al.plan.movilidad_videos,
                            [key]: { ...mv, url: e.target.value }
                          })}
                          style={{ ...inp, marginBottom: 4 }}
                        />
                        <input
                          placeholder={`Duración (ej: ${defaultDur})`}
                          value={mv.duracion || ""}
                          onChange={(e) => updatePlan("movilidad_videos", {
                            ...al.plan.movilidad_videos,
                            [key]: { ...mv, duracion: e.target.value }
                          })}
                          style={{ ...inp }}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}{" "}
            {planTab === "calor" && al && (
              <EjercicioEditor items={al.plan.calor} onChange={(v) => updatePlan("calor", v)} showVideo={true} biblioteca={biblioteca} onGuardarBiblioteca={onGuardarBiblioteca} />
            )}{" "}
            {planTab === "activacion" && al && (
              <EjercicioEditor items={al.plan.activacion || []} onChange={(v) => updatePlan("activacion", v)} showVideo={true} biblioteca={biblioteca} onGuardarBiblioteca={onGuardarBiblioteca} />
            )}{" "}
            {planTab === "periodizacion" && al && (
              <div style={{ ...card, overflow: "hidden", padding: 14 }}>
                <PeriodizacionEditor data={al.plan.periodizacion} onChange={(v) => updatePlan("periodizacion", v)} />
              </div>
            )}{" "}
            {planTab === "plan-dias" && al && (
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
                          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                            {["Bilateral", "Unilateral"].map((tipo) => (
                              <button
                                key={tipo}
                                onClick={(e) => { e.stopPropagation(); asignarPlanDia(tipo); }}
                                style={{
                                  flex: 1,
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
                                {tipo}
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
        {sec === "rm" && (
          <div>
            {" "}
            <AlumnoBuscador
              alumnos={alumnos}
              selId={selId}
              onSelect={(id) => {
                setSelId(id);
                setRm((r) => ({ ...r, [id]: { ...(alumnos.find((a) => a.id === id) || {}).rm } }));
              }}
            />{" "}
            <div
              style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}
            >
              Peso maximo — {al && al.nombre}
            </div>{" "}
            {al &&
              RM_EJS.map((ej) => (
                <div key={ej} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
                  {" "}
                  <div style={{ color: S.white, fontWeight: 600, fontSize: 13, marginBottom: 10 }}>{ej}</div>{" "}
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
                    {" "}
                    <div style={{ flex: 1 }}>
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
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: S.gray, marginBottom: 4 }}>FECHA EVALUACION</div>
                      <input
                        type="date"
                        value={(rm[al.id] && rm[al.id][ej] && rm[al.id][ej].fecha) || ""}
                        onChange={(e) =>
                          setRm((r) => {
                            const n = { ...r };
                            n[al.id] = { ...n[al.id] };
                            n[al.id][ej] = { ...n[al.id][ej], fecha: e.target.value };
                            return n;
                          })
                        }
                        style={inp}
                      />
                    </div>{" "}
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
            </button>{" "}
          </div>
        )}{" "}
        {sec === "historial" && <HistorialAdmin alumnos={alumnos} />}{" "}
        {sec === "diario" && <DiarioAdmin alumnos={alumnos} />}{" "}
        {sec === "bioimpedancia" && al && (
          <div>
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Bioimpedancia — {al.nombre}
            </div>
            <BioimpedanciaSection alumnoId={al.id} showToast={showToast} readOnly={false} />
          </div>
        )}{" "}
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
                  ["Usuario (código de login)", admCodigo, setAdmCodigo],
                  ["PIN (4 dígitos)", admPin, setAdmPin],
                ].map(([label, val, set]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                    <input
                      type={label.includes("PIN") ? "password" : "text"}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      style={inp}
                      maxLength={label.includes("PIN") ? 4 : undefined}
                    />
                  </div>
                ))}
                <button
                  onClick={async () => {
                    if (!admNombre || !admCodigo || admPin.length !== 4) {
                      showToast && showToast("Completá todos los campos (PIN 4 dígitos)");
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
function Login({ onLogin, onAdmin }) {
  const [codigo, setCodigo] = useState("");
  const [pin, setPin] = useState("");
  const [esAdmin, setEsAdmin] = useState(false);
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);

  const go = async () => {
    if (!codigo.trim() || !pin.trim()) {
      setErr("Completa código y PIN");
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
        fontFamily: "system-ui",
      }}
    >
      {/* Header de marca */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <img src={ICON} width={72} height={72} alt="DI" style={{ display: "block", margin: "0 auto 14px", opacity: 0.9 }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: S.white, letterSpacing: 3, textTransform: "uppercase" }}>Desarrollo Integral</div>
        <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, marginTop: 4, textTransform: "uppercase" }}>Centro de Entrenamiento</div>
      </div>

      <div style={{ width: "100%", maxWidth: 340, background: "#111111", border: "1px solid #222", borderRadius: 14, padding: "28px 24px" }}>
        <div style={{ fontSize: 10, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
          Código
        </div>
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Ej: DI-001"
          style={{ ...inp, fontSize: 15, padding: "12px 14px", background: "#181818", border: "1px solid #2a2a2a" }}
          disabled={cargando}
        />

        <div style={{ fontSize: 10, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, marginTop: 14 }}>
          PIN (4 dígitos)
        </div>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.slice(0, 4))}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="••••"
          maxLength={4}
          style={{ ...inp, fontSize: 15, padding: "12px 14px", background: "#181818", border: "1px solid #2a2a2a" }}
          disabled={cargando}
        />

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            id="adminCheck"
            checked={esAdmin}
            onChange={(e) => setEsAdmin(e.target.checked)}
            style={{ cursor: "pointer", width: 16, height: 16, accentColor: S.white }}
            disabled={cargando}
          />
          <label htmlFor="adminCheck" style={{ color: S.gray, fontSize: 12, cursor: "pointer", userSelect: "none", letterSpacing: 0.5 }}>
            Acceso administrador
          </label>
        </div>

        {err && <div style={{ color: S.red, fontSize: 12, marginTop: 10, padding: "8px 10px", background: "rgba(229,62,62,0.08)", borderRadius: 6, border: "1px solid rgba(229,62,62,0.2)" }}>{err}</div>}

        <button
          onClick={go}
          disabled={cargando}
          style={{
            width: "100%",
            marginTop: 18,
            background: cargando ? "#1e1e1e" : S.white,
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

      <div style={{ marginTop: 16, fontSize: 11, color: S.lgray, textAlign: "center" }}>
        Alumno: código + PIN · Admin: credenciales del creador
      </div>
    </div>
  );
}
// ── VISTA REHABILITACIÓN ─────────────────────────────────────────────
function VistaRehabilitacion({ al, onSalir, marcarAsistencia }) {
  const [tabR, setTabR] = useState("Ejercicios");
  const [sesionIdx, setSesionIdx] = useState(0);
  const plan = al.plan || {};
  const sesiones = plan.dias || [];
  const sesion = sesiones[sesionIdx] || null;

  return (
    <div style={{ minHeight: "100vh", background: S.bg, maxWidth: 480, margin: "0 auto", fontFamily: "system-ui", paddingBottom: 48 }}>
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px 12px" }}>
        {["Ejercicios", "Asistencia"].map((t) => (
          <button key={t} onClick={() => setTabR(t)} style={{ ...tabBtn(tabR === t), padding: "8px 20px", fontSize: 12 }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "0 16px" }}>
        {tabR === "Ejercicios" && (
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
          justifyContent: "center",
          padding: 24,
          fontFamily: "system-ui",
        }}
      >
        {" "}
        <img src={ICON} width={44} height={44} alt="DI" style={{ opacity: 0.25, marginBottom: 20 }} />
        <div className="di-pop" style={{ animationDelay: "0s" }}>
          <FotoAlumno foto={alumno.foto} size={80} />
        </div>{" "}
        <div
          className="di-slide"
          style={{ marginTop: 16, textAlign: "center", marginBottom: 32, animationDelay: "0.08s" }}
        >
          {" "}
          <div style={{ color: S.gray, fontSize: 13, marginBottom: 4 }}>{saludo},</div>{" "}
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{alumno.nombre}</div>{" "}
          <div style={{ color: S.gray, fontSize: 13, marginTop: 8 }}>Semana {semanaActual} de entrenamiento</div>{" "}
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
              <div style={{ color: S.gray, fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
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
                  <span style={{ color: S.white, fontWeight: 600 }}>{h.dia}</span> · {h.hora}
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
  applyTheme(darkMode);
  ICON = darkMode ? ICON_WHITE : ICON_BLACK;
  // Arranque: carga desde Supabase. Fallback [] = nunca usa datos locales.
  useEffect(() => {
    console.log("%c[APP] Iniciando → cargarDatos desde Supabase...", "color:#6ee7b7;font-weight:bold");
    cargarDatos(ALUMNOS_INIT).then((data) => {
      console.log(`%c[APP] ✅ ${data.length} alumno(s) cargados.`, "color:#6ee7b7;font-weight:bold", data.map((a) => a.nombre));
      setAlumnos(data);
      setCargado(true);
    });
    cargarBiblioteca().then(setBiblioteca);
    cargarNovedades().then(setNovedades);
  }, []);
  const _primeraVez = useRef(true);
  useEffect(() => {
    if (!cargado) return;
    if (_primeraVez.current) {
      _primeraVez.current = false;
      return;
    }
    console.log(`%c[APP] Cambio en alumnos (${alumnos.length}) → guardarDatos...`, "color:#a5b4fc;font-weight:bold");
    guardarDatos(alumnos);
  }, [alumnos, cargado]);
  const login = async (a) => {
    const f = alumnos.find((x) => x.id === a.id) || a;
    const guardado = await cargarPesos(f.id, null);
    setPesos(guardado ? guardado.pesos : initPesos(f.plan));
    setHistoriales(guardado ? guardado.historiales : initH(f.plan));
    setAlumno(f);
    setShowBienvenida(true);
    setTab("Movilidad");
    setDiaIdx(0);
  };
  const addBio = (est) => {
    const u = alumnos.map((a) => (a.id === alumno.id ? { ...a, bioimpedancia: [...a.bioimpedancia, est] } : a));
    setAlumnos(u);
    setAlumno(u.find((a) => a.id === alumno.id));
  };
  const handlePeso = (id, val) => {
    const np = { ...pesos, [id]: val };
    const nh = { ...historiales, [id]: [...(historiales[id] || []), { fecha: hoy(), peso: val }] };
    setPesos(np);
    setHistoriales(nh);
    // Guarda en Supabase solo ejercicios principales (plan.dias)
    savePeso(alumno.id, id, val);
  };
  const marcarAsistencia = (fecha) => {
    const u = alumnos.map((a) => (a.id === alumno.id ? { ...a, asistencia: [...(a.asistencia || []), fecha] } : a));
    setAlumnos(u);
    setAlumno(u.find((a) => a.id === alumno.id));
  };
  const addDiario = (entrada) => {
    const u = alumnos.map((a) => (a.id === alumno.id ? { ...a, diario: [...(a.diario || []), entrada] } : a));
    setAlumnos(u);
    setAlumno(u.find((a) => a.id === alumno.id));
  };
  const handleGenerarPDF = async () => {
    setGenerandoPDF(true);
    try {
      await generarPDF(al, historiales);
    } finally {
      setGenerandoPDF(false);
    }
  };
  if (!cargado)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: S.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <img src={ICON} width={48} height={48} alt="DI" style={{ opacity: 0.3, marginBottom: 16, display: "block", margin: "0 auto 16px" }} />
          <div style={{ color: S.lgray, fontSize: 11, letterSpacing: 3, textTransform: "uppercase" }}>Cargando...</div>
        </div>
      </div>
    );
  if (adminMode)
    return (
      <>
        <AdminPanel
          alumnos={alumnos}
          onUpdate={(u) => setAlumnos(u)}
          onClose={() => setAdminMode(false)}
          showToast={showToast}
          biblioteca={biblioteca}
          onGuardarBiblioteca={async (ej) => { await guardarEjercicioBiblioteca(ej); cargarBiblioteca().then(setBiblioteca); }}
          novedades={novedades}
          onNovedadesChange={setNovedades}
        />
        <Toast msg={toastMsg} />
      </>
    );
  if (!alumno) return <Login onLogin={login} onAdmin={() => setAdminMode(true)} alumnos={alumnos} />;
  const al = alumnos.find((a) => a.id === alumno.id) || alumno;
  // Vista rehabilitación — interfaz simplificada para pacientes de kinesiología
  if (al.tipo === "rehabilitacion") {
    return (
      <VistaRehabilitacion
        al={al}
        onSalir={() => setAlumno(null)}
        marcarAsistencia={marcarAsistencia}
      />
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
  const GROUPS = {
    entrenamiento: {
      label: "Entrenamiento",
      tabs: ["Movilidad", "Act. Banda", "Entrada Calor", "Entrenamiento", "Periodiz.", "Asistencia", "Peso Max"],
    },
    seguimiento: {
      label: "Seguimiento",
      tabs: ["Novedades", "Evolución", "Resumen", "Diario", "Bioimpedancia"],
    },
  };
  const switchGroup = (g) => {
    setTabGroup(g);
    setTab(GROUPS[g].tabs[0]);
  };
  return (
    <>
      {" "}
      <GlobalStyles /> <Toast msg={toastMsg} />{" "}
      <div
        style={{
          minHeight: "100vh",
          background: S.bg,
          maxWidth: 480,
          margin: "0 auto",
          fontFamily: "system-ui",
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
        {/* Header */}{" "}
        <div
          style={{
            padding: "14px 16px 12px",
            borderBottom: "1px solid #1c1c1c",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {" "}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {" "}
            <img src={ICON} width={40} height={40} alt="DI" />{" "}
            <div>
              <div
                style={{
                  color: S.white,
                  fontWeight: 900,
                  fontStyle: "italic",
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                DESARROLLO
              </div>
              <div
                style={{
                  color: S.white,
                  fontWeight: 900,
                  fontSize: 16,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                INTEGRAL
              </div>
              <div style={{ color: S.gray, fontSize: 8, letterSpacing: 2, textTransform: "uppercase", marginTop: 1 }}>
                CENTRO DE ENTRENAMIENTO
              </div>
            </div>{" "}
          </div>{" "}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {" "}
            <button
              onClick={toggleTheme}
              title={darkMode ? "Modo claro" : "Modo oscuro"}
              style={{
                background: "transparent",
                color: S.gray,
                border: "1px solid " + S.border,
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>{" "}
            <button
              onClick={() => setAlumno(null)}
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
                        border: "1px solid #2a2a2a",
                        borderRadius: 5,
                        padding: "2px 8px",
                        fontSize: 10,
                        color: S.gray,
                      }}
                    >
                      <span style={{ color: S.white, fontWeight: 600 }}>{h.dia}</span> · {h.hora}
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
            <div style={{ marginTop: 10, borderTop: "1px solid #2a2a2a", paddingTop: 10 }}>
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
                    style={{ background: S.card2, border: "1px solid #2a2a2a", borderRadius: 5, padding: "4px 8px" }}
                  >
                    <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{al.rm[ej].peso}kg</div>
                    <div style={{ color: S.gray, fontSize: 9 }}>{ej}</div>
                  </div>
                ))}
              </div>{" "}
            </div>
          )}{" "}
        </div>{" "}
        {/* Menú dos niveles */}{" "}
        <div style={{ padding: "0 16px 2px" }}>
          {/* Grupo primario */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {Object.entries(GROUPS).map(([key, g]) => (
              <button
                key={key}
                onClick={() => switchGroup(key)}
                style={{
                  flex: 1,
                  background: tabGroup === key ? S.white : "transparent",
                  color: tabGroup === key ? S.bg : S.gray,
                  border: "1px solid " + (tabGroup === key ? S.white : S.border),
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: 0.5,
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
          {/* Sub-tabs del grupo activo */}
          <div style={{ display: "flex", gap: 5, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: 8 }}>
            {GROUPS[tabGroup].tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{ ...tabBtn(tab === t), flex: "none", whiteSpace: "nowrap", padding: "7px 11px", fontSize: 11 }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>{" "}
        {/* Contenido */}{" "}
        <div key={tab} className="di-slide" style={{ padding: "0 16px" }}>
          {" "}
          {tab === "Movilidad" && (
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: S.white,
                  fontWeight: 700,
                  textAlign: "center",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 16,
                  background: S.card,
                  border: "1px solid " + S.border,
                  borderRadius: 8,
                  padding: "10px 16px",
                }}
              >
                Movilidad — 5 repeticiones por lado
              </div>
              {plan.movilidad.map((ej, i) => (
                <ItemCard
                  key={i}
                  numero={i + 1}
                  nombre={ej.nombre}
                  desc={ej.desc}
                  video={ej.video}
                  mediaLocal={ej.mediaLocal}
                />
              ))}
              {/* Rutina completa con el profe */}
              <div style={{ marginTop: 24, borderTop: "1px solid #2a2a2a", paddingTop: 20 }}>
                <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 14 }}>
                  Rutina completa con el profe
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { tipo: "Corta", key: "corta", defaultDur: "8 min", url: plan.movilidad_videos?.corta?.url, dur: plan.movilidad_videos?.corta?.duracion },
                    { tipo: "Avanzada", key: "avanzada", defaultDur: "15 min", url: plan.movilidad_videos?.avanzada?.url, dur: plan.movilidad_videos?.avanzada?.duracion },
                  ].map(({ tipo, url, dur, defaultDur }) => (
                    <div key={tipo} style={{ ...card, padding: "16px 12px", textAlign: "center" }}>
                      <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{tipo}</div>
                      <div style={{ color: S.green, fontSize: 12, marginBottom: 12, fontWeight: 600 }}>{dur || defaultDur}</div>
                      {url ? (
                        <video controls style={{ width: "100%", borderRadius: 6, display: "block" }}>
                          <source src={url} type="video/mp4" />
                        </video>
                      ) : (
                        <div style={{ padding: "16px 0", color: S.lgray || S.gray, fontSize: 11 }}>Video pendiente</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}{" "}
          {tab === "Act. Banda" && (
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: S.white,
                  fontWeight: 700,
                  textAlign: "center",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 16,
                  background: S.card,
                  border: "1px solid " + S.border,
                  borderRadius: 8,
                  padding: "10px 16px",
                }}
              >
                Banda elástica — 5 repeticiones por brazo
              </div>
              {plan.calor.map((ej, i) => (
                <ItemCard
                  key={i}
                  numero={i + 1}
                  nombre={ej.nombre.replace(/\s*\(banda\)/gi, "").trim()}
                  desc={ej.desc}
                  video={ej.video}
                  mediaLocal={ej.mediaLocal}
                />
              ))}
            </div>
          )}{" "}
          {tab === "Entrada Calor" && (
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: S.white,
                  fontWeight: 700,
                  textAlign: "center",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 16,
                  background: S.card,
                  border: "1px solid " + S.border,
                  borderRadius: 8,
                  padding: "10px 16px",
                }}
              >
                Entrada en calor — 5 repeticiones
              </div>
              {(plan.activacion || []).length === 0 ? (
                <div style={{ ...card, padding: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
                  <div style={{ color: S.gray, fontSize: 13 }}>Sin ejercicios de entrada en calor</div>
                </div>
              ) : (
                (plan.activacion || []).map((ej, i) => (
                  <ItemCard
                    key={i}
                    numero={i + 1}
                    nombre={ej.nombre.replace(/\s*\(banda\)/gi, "").trim()}
                    desc={ej.desc}
                    video={ej.video}
                    mediaLocal={ej.mediaLocal}
                  />
                ))
              )}
            </div>
          )}{" "}
          {tab === "Entrenamiento" && (
            <div>
              {" "}
              {!planValido && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: S.gray }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                    Todavía no tenés plan asignado
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Hablá con tu entrenador para que configure tu rutina.
                  </div>
                </div>
              )}
              {planValido && plan.dias.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {plan.dias.map((d, i) => (
                    <button key={i} onClick={() => setDiaIdx(i)} style={{ ...tabBtn(diaIdx === i), flex: 1 }}>
                      {d.dia}
                    </button>
                  ))}
                </div>
              )}{" "}
              {planValido && dia && (
                <>
                  <div
                    style={{
                      color: S.white,
                      fontWeight: 900,
                      fontSize: 18,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 2,
                    }}
                  >
                    {dia.dia}
                  </div>{" "}
                  <div style={{ color: S.gray, fontSize: 13, marginBottom: 12 }}>{dia.subtitulo}</div>{" "}
                  <div style={{ ...card, padding: "8px 14px", marginBottom: 14, display: "flex", gap: 20 }}>
                    {" "}
                    <div>
                      <div style={{ color: S.white, fontWeight: 700 }}>
                        {sem.series}x{sem.reps}
                      </div>
                      <div style={{ color: S.gray, fontSize: 10 }}>SEM {semanaActual}</div>
                    </div>{" "}
                    {sem.intensidad && (
                      <div>
                        <div style={{ color: S.green, fontWeight: 700 }}>{sem.intensidad}</div>
                        <div style={{ color: S.gray, fontSize: 10 }}>INTENSIDAD</div>
                      </div>
                    )}{" "}
                    <div>
                      <div style={{ color: S.white, fontWeight: 700 }}>{dia.ejercicios.length}</div>
                      <div style={{ color: S.gray, fontSize: 10 }}>EJERCICIOS</div>
                    </div>{" "}
                  </div>{" "}
                  {dia.ejercicios.map((ej, i) => {
                    const rmKey = RM_EJS.find(
                      (k) =>
                        ej.nombre.toLowerCase().includes(k.toLowerCase().split(" ")[0]) ||
                        k.toLowerCase().includes(ej.nombre.toLowerCase().split(" ")[0]),
                    );
                    const rmDato = rmKey && al.rm && al.rm[rmKey];
                    const pct = sem.intensidad ? Number(sem.intensidad.replace("%", "")) : null;
                    const pesoSugerido = rmDato && rmDato.peso > 0 && pct ? Math.round((rmDato.peso * pct) / 100) : null;
                    return (
                      <ItemCard
                        key={ej.id}
                        numero={i + 1}
                        nombre={ej.nombre}
                        desc={ej.desc}
                        video={ej.video}
                        mediaLocal={ej.mediaLocal}
                        showPeso
                        semana={sem}
                        peso={pesos[ej.id] || 0}
                        historial={historiales[ej.id] || []}
                        onPesoChange={(v) => handlePeso(ej.id, v)}
                        pesoSugerido={pesoSugerido}
                        intensidad={sem.intensidad}
                      />
                    );
                  })}
                </>
              )}{" "}
            </div>
          )}{" "}
          {tab === "Periodiz." && (
            <div>
              <div
                style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}
              >
                Progresion de carga
              </div>
              <TablaPer data={planValido ? plan.periodizacion : []} semanaActual={semanaActual} />
            </div>
          )}{" "}
          {tab === "Asistencia" && <Asistencia asistencia={al.asistencia || []} onMarcar={marcarAsistencia} />}{" "}
          {tab === "Novedades" && (
            <div>
              {novedades.filter(n => n.activo && (n.dirigido_a === "todos" || n.dirigido_a === (al.tipo || "entrenamiento"))).length === 0 ? (
                <div style={{ ...card, padding: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📢</div>
                  <div style={{ color: S.gray, fontSize: 13 }}>Sin novedades por ahora</div>
                </div>
              ) : (
                novedades
                  .filter(n => n.activo && (n.dirigido_a === "todos" || n.dirigido_a === (al.tipo || "entrenamiento")))
                  .map((n) => (
                    <div key={n.id} style={{ ...card, padding: "16px 16px", marginBottom: 10 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ fontSize: 22, flexShrink: 0 }}>
                          📋
                        </div>
                        <div>
                          <div style={{ color: S.white, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{n.titulo}</div>
                          {n.contenido && <div style={{ color: S.gray, fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}>{n.contenido}</div>}
                          <div style={{ fontSize: 10, color: S.gray, opacity: 0.6 }}>{new Date(n.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}</div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}{" "}
          {tab === "Evolución" && <EvolucionCargas historiales={historiales} plan={planValido ? plan : { dias: [], periodizacion: [] }} />}{" "}
          {tab === "Resumen" && (
            <div>
              {" "}
              <button
                onClick={handleGenerarPDF}
                disabled={generandoPDF}
                style={{
                  width: "100%",
                  background: generandoPDF ? "#2a2a2a" : S.white,
                  color: generandoPDF ? "#555" : S.bg,
                  border: "none",
                  borderRadius: 8,
                  padding: "13px",
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: generandoPDF ? "default" : "pointer",
                  marginBottom: 14,
                  letterSpacing: 1,
                }}
              >
                {" "}
                {generandoPDF ? "⏳ GENERANDO PDF..." : "📄 DESCARGAR HISTORIAL PDF"}{" "}
              </button>{" "}
              <ResumenMensual
                asistencia={al.asistencia || []}
                historiales={historiales}
                plan={plan}
                diario={al.diario || []}
              />{" "}
            </div>
          )}{" "}
          {tab === "Bioimpedancia" && <BioimpedanciaSection alumnoId={al.id} showToast={showToast} readOnly={true} />}{" "}
          {tab === "Peso Max" && (
            <PesoMaxAlumno
              rm={al.rm}
              onUpdate={(nr) => {
                const u = alumnos.map((a) => (a.id === al.id ? { ...a, rm: nr } : a));
                setAlumnos(u);
                setAlumno(u.find((a) => a.id === al.id));
              }}
            />
          )}{" "}
          {tab === "Diario" && <Diario entradas={al.diario || []} onAdd={addDiario} />}{" "}
        </div>{" "}
      </div>{" "}
    </>
  );
}
