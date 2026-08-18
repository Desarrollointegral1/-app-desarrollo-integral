// Movido textualmente desde EstudioBio.jsx (refactor 2026-08-18): mismo código,
// solo cambió de archivo. EstudioBio.jsx conserva EstudioBioSeccion (la sección completa).
import { useState } from "react";
import { Camera, X } from "lucide-react";
import { card, inp, S, TAP, TS } from "../../utils/theme.js";
import { hoy } from "../../utils/helpers.js";

// Bloque chico y separado (NO dentro de EstudioBioForm): solo pide fecha +
// foto de un estudio externo, sin medición numérica propia. Reusa el mismo
// patrón FileReader/preview que EstudioBioForm en vez de inventar otro.
export function EstudioAnteriorForm({ onGuardar, guardando }) {
  const [fecha, setFecha] = useState(hoy());
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [abierto, setAbierto] = useState(false);

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFoto(file);
    const r = new FileReader();
    r.onload = (ev) => setPreview(ev.target.result);
    r.readAsDataURL(file);
  };

  const guardar = async () => {
    if (!foto) return;
    const ok = await onGuardar({ fecha, tipo: "estudio_anterior" }, foto);
    if (ok) {
      setFecha(hoy());
      setFoto(null);
      setPreview(null);
      setAbierto(false);
    }
  };

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={{
          width: "100%",
          background: "transparent",
          color: S.lgray,
          border: "1px dashed " + S.border,
          borderRadius: 8,
          padding: 12,
          fontSize: TS.label,
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 14,
          minHeight: TAP,
        }}
      >
        + Subir estudio anterior
      </button>
    );
  }

  return (
    <div style={{ ...card, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 12, letterSpacing: 1 }}>
        Estudio anterior (foto + fecha, sin medición)
      </div>
      <div style={{ fontSize: 10, color: S.gray, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Fecha del estudio</div>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inp} />
      <div style={{ marginTop: 12 }}>
        {preview ? (
          <div style={{ position: "relative", marginBottom: 8 }}>
            {/* 2026-08-12: "contain", no "cover" — la foto de un estudio es
                vertical y recortada al medio no se entiende qué se subió. */}
            <img src={preview} alt="estudio anterior" style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 8, background: S.card2 }} />
            <button
              onClick={() => { setFoto(null); setPreview(null); }}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: TS.chip, display: "inline-flex", alignItems: "center", gap: 6, minHeight: TAP }}
            >
              <X size={16} strokeWidth={2} />Quitar
            </button>
          </div>
        ) : (
          <label style={{ display: "block", border: "1px dashed " + S.border, borderRadius: 8, padding: "18px 12px", textAlign: "center", color: S.gray, fontSize: TS.chip, cursor: "pointer" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Camera size={16} strokeWidth={2} />Tocar para subir foto</span>
            <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFoto} />
          </label>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          onClick={() => { setAbierto(false); setFoto(null); setPreview(null); }}
          style={{ flex: 1, background: S.card2, color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: 12, fontSize: TS.label, fontWeight: 700, cursor: "pointer", minHeight: TAP }}
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={guardando || !foto}
          style={{
            flex: 2,
            background: guardando || !foto ? S.card2 : S.white,
            color: guardando || !foto ? S.gray : S.bg,
            border: "none",
            borderRadius: 8,
            padding: 12,
            fontSize: TS.label,
            fontWeight: 700,
            cursor: guardando || !foto ? "default" : "pointer",
            minHeight: TAP,
          }}
        >
          {guardando ? "GUARDANDO..." : "GUARDAR ESTUDIO ANTERIOR"}
        </button>
      </div>
    </div>
  );
}
