import { useRef, useState } from "react";
import { Camera, Images, Pencil } from "lucide-react";
import { S } from "../utils/theme.js";

// ── FOTO ALUMNO ───────────────────────────────────────────────────────
// Comprime la imagen antes de guardarla: las fotos de cámara pesan varios MB
// y guardadas en base64 dentro de la tabla hacían la app inusablemente lenta.
// 512px máx + JPEG 0.82 ≈ 40-80 KB, de sobra para un avatar circular.
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
// Foto del alumno — editable: cámara EN EL MOMENTO o elegir de la galería
// (pedido de Lucas 2026-07-21, con capture="environment"). Dos inputs de archivo separados (uno con
// capture, uno sin) detrás de un mini menú de 2 opciones, así el navegador
// no decide por Lucas — las dos vías quedan siempre disponibles, en alta
// y en edición. Mantiene la compresión a 512px/JPEG de rondas anteriores.
export function FotoAlumno({ foto, size = 56, editable, onFoto }) {
  const camRef = useRef();
  const galRef = useRef();
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => comprimirFoto(ev.target.result).then((comp) => onFoto && onFoto(comp));
    r.readAsDataURL(f);
    e.target.value = "";
  };
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {" "}
      <div
        style={{
          width: size,
          height: size,
          // Brand Kit §08 + señal 10 del playbook anti-cara-de-IA: los
          // retratos NUNCA van en círculo. Marco rectangular de esquina
          // suave, proporcional al tamaño (~14%, mínimo 6px).
          borderRadius: Math.max(6, Math.round(size * 0.14)),
          background: S.card2,
          border: "1px solid " + S.border2,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: editable ? "pointer" : "default",
        }}
        onClick={() => editable && setMostrarOpciones((v) => !v)}
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
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 1px 4px #000",
          }}
          onClick={() => setMostrarOpciones((v) => !v)}
        >
          <Pencil size={11} />
        </div>
      )}{" "}
      {editable && mostrarOpciones && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 300 }} onClick={() => setMostrarOpciones(false)} />
          <div
            style={{
              position: "absolute",
              top: size + 6,
              left: 0,
              zIndex: 301,
              background: S.card,
              border: "1px solid " + S.border,
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              minWidth: 160,
            }}
          >
            <button
              onClick={() => { setMostrarOpciones(false); camRef.current.click(); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", color: S.white, border: "none", borderBottom: "1px solid " + S.border, padding: "10px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Camera size={14} />Sacar foto</span>
            </button>
            <button
              onClick={() => { setMostrarOpciones(false); galRef.current.click(); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", color: S.white, border: "none", padding: "10px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Images size={14} />Elegir de galería</span>
            </button>
          </div>
        </>
      )}{" "}
      {editable && (
        <>
          <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFile} />
          <input ref={galRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </>
      )}{" "}
    </div>
  );
}
