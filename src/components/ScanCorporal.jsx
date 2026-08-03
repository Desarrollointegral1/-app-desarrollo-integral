import { useState, useMemo } from "react";
import { Camera, X, Sparkles, Loader2 } from "lucide-react";
import { S, card, inp, innerCard, TS, TAP } from "../utils/theme.js";
import { hoy, calcularEdad } from "../utils/helpers.js";
import { SEXOS } from "../utils/energia.js";

// ============================================================
// SCAN CORPORAL (Fase 1) — composición corporal a partir de 2 fotos
// ============================================================
// Flujo: peso/altura/género/edad + foto frontal + foto lateral →
// /api/scan-corporal (Claude visión estima circunferencias, el %grasa se
// calcula acá mismo en el servidor con la fórmula de la Marina de EE.UU.,
// determinística) → se muestra el resultado y, si el entrenador quiere,
// se guarda en el historial de bioimpedancia con metadata.tipo="scan_2fotos"
// para distinguirlo de una medición manual.
//
// PRIVACIDAD: las fotos se mandan al endpoint para el análisis y nunca se
// guardan — ni acá ni en Supabase. Solo el resultado (números) se persiste
// si el entrenador aprieta "Guardar en historial".

const label = (t) => (
  <div style={{ fontSize: 10, color: S.gray, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
    {t}
  </div>
);

// Redimensiona a máx. 900px de lado y devuelve un data URL JPEG — mismo
// criterio que ya usa el resto de la app para fotos (services/supabase.js),
// así el payload que viaja al endpoint pesa poco.
async function comprimirFoto(file, maxLado = 900, calidad = 0.8) {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", calidad);
}

function FotoInput({ titulo, preview, onChange, onQuitar }) {
  return (
    <div>
      {label(titulo)}
      {preview ? (
        <div style={{ position: "relative" }}>
          <img src={preview} alt={titulo} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }} />
          <button
            onClick={onQuitar}
            style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <X size={14} strokeWidth={2} />Quitar
          </button>
        </div>
      ) : (
        <label style={{ display: "block", border: "1px dashed " + S.border, borderRadius: 8, padding: "18px 12px", textAlign: "center", color: S.gray, fontSize: TS.chip, cursor: "pointer" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Camera size={16} strokeWidth={2} />Tocar para subir foto</span>
          <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onChange} />
        </label>
      )}
    </div>
  );
}

export function ScanCorporalForm({ alumno, onGuardar }) {
  const [abierto, setAbierto] = useState(false);
  const [peso, setPeso] = useState(alumno?.peso ?? "");
  const [altura, setAltura] = useState(alumno?.altura ?? "");
  const [genero, setGenero] = useState("");
  const [edadManual, setEdadManual] = useState("");
  const [fotoFrontal, setFotoFrontal] = useState(null); // File
  const [fotoLateral, setFotoLateral] = useState(null);
  const [previewFrontal, setPreviewFrontal] = useState(null);
  const [previewLateral, setPreviewLateral] = useState(null);
  const [analizando, setAnalizando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  const edadCalculada = useMemo(() => calcularEdad(alumno?.fecha_nacimiento), [alumno?.fecha_nacimiento]);
  const edad = edadCalculada ?? (edadManual ? Number(edadManual) : null);

  const handleFoto = (setFile, setPreview) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFile(file);
    const r = new FileReader();
    r.onload = (ev) => setPreview(ev.target.result);
    r.readAsDataURL(file);
  };

  const listo = peso && altura && genero && edad && fotoFrontal && fotoLateral;

  const analizar = async () => {
    if (!listo) return;
    setAnalizando(true);
    setError("");
    setResultado(null);
    try {
      const [dataFrontal, dataLateral] = await Promise.all([comprimirFoto(fotoFrontal), comprimirFoto(fotoLateral)]);
      const r = await fetch("/api/scan-corporal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fotoFrontal: dataFrontal,
          fotoLateral: dataLateral,
          peso: Number(peso),
          altura: Number(altura),
          genero,
          edad: Number(edad),
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "No se pudo analizar el scan.");
      } else {
        setResultado(data);
      }
    } catch {
      setError("No se pudo conectar con el servidor. Probá de nuevo.");
    } finally {
      setAnalizando(false);
    }
  };

  const guardarEnHistorial = async () => {
    if (!resultado) return;
    setGuardando(true);
    const partes = [
      `Composición corporal estimada con Scan corporal (2 fotos + IA, método Marina de EE.UU.).`,
      `Medidas estimadas: cuello ${resultado.medidasEstimadas.cuello}cm, cintura ${resultado.medidasEstimadas.cintura}cm` +
        (resultado.medidasEstimadas.cadera ? `, cadera ${resultado.medidasEstimadas.cadera}cm.` : "."),
      `Masa magra ${resultado.masaMagraKg}kg, masa grasa ${resultado.masaGrasaKg}kg.`,
    ];
    const ok = await onGuardar({
      fecha: hoy(),
      hora: new Date().toTimeString().slice(0, 5),
      peso: Number(peso),
      altura: Number(altura),
      edad,
      imc: resultado.imc,
      grasa_corporal: resultado.porcentajeGrasa,
      tipo: "scan_2fotos",
      conclusion: partes.join(" "),
      medidas_estimadas: resultado.medidasEstimadas,
      masa_magra_kg: resultado.masaMagraKg,
      masa_grasa_kg: resultado.masaGrasaKg,
    });
    setGuardando(false);
    if (ok) {
      setAbierto(false);
      setFotoFrontal(null);
      setFotoLateral(null);
      setPreviewFrontal(null);
      setPreviewLateral(null);
      setResultado(null);
      setGenero("");
      setEdadManual("");
    }
  };

  const chip = (activo) => ({
    flex: 1,
    background: activo ? S.white : S.card2,
    color: activo ? S.bg : S.gray,
    border: "1px solid " + (activo ? S.white : S.border),
    borderRadius: 8,
    padding: "9px 4px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  });

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
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Sparkles size={16} strokeWidth={2} />+ Scan corporal (2 fotos + IA)
      </button>
    );
  }

  return (
    <div style={{ ...card, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={16} strokeWidth={2} />Scan corporal (2 fotos)
        </div>
        <button
          onClick={() => setAbierto(false)}
          style={{ background: "transparent", border: "none", color: S.gray, fontSize: 20, cursor: "pointer", padding: 4 }}
        >
          ×
        </button>
      </div>

      <div style={{ fontSize: 11, color: S.gray, lineHeight: 1.5, marginBottom: 12 }}>
        Estimación de composición corporal a partir de una foto de frente y una de perfil. No reemplaza una
        bioimpedancia física, es una primera aproximación. Las fotos se usan solo para el análisis y no se guardan.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          {label("Peso (kg)")}
          <input type="number" inputMode="decimal" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} style={inp} />
        </div>
        <div>
          {label("Estatura (cm)")}
          <input type="number" inputMode="decimal" value={altura} onChange={(e) => setAltura(e.target.value)} style={inp} />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        {label("Edad")}
        {edadCalculada != null ? (
          <div style={{ ...inp, display: "flex", alignItems: "center", color: S.lgray }}>{edadCalculada} años</div>
        ) : (
          <input type="number" inputMode="numeric" placeholder="Edad en años" value={edadManual} onChange={(e) => setEdadManual(e.target.value)} style={inp} />
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        {label("Género (para la fórmula)")}
        <div style={{ display: "flex", gap: 6 }}>
          {SEXOS.map((s) => (
            <button key={s.k} type="button" onClick={() => setGenero((g) => (g === s.k ? "" : s.k))} style={chip(genero === s.k)}>
              {s.txt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        <FotoInput
          titulo="Foto frontal"
          preview={previewFrontal}
          onChange={handleFoto(setFotoFrontal, setPreviewFrontal)}
          onQuitar={() => { setFotoFrontal(null); setPreviewFrontal(null); }}
        />
        <FotoInput
          titulo="Foto lateral"
          preview={previewLateral}
          onChange={handleFoto(setFotoLateral, setPreviewLateral)}
          onQuitar={() => { setFotoLateral(null); setPreviewLateral(null); }}
        />
      </div>

      {error && (
        <div style={{ marginTop: 12, color: S.red, fontSize: 12, lineHeight: 1.5 }}>{error}</div>
      )}

      {!resultado ? (
        <button
          onClick={analizar}
          disabled={!listo || analizando}
          style={{
            width: "100%",
            marginTop: 14,
            background: !listo || analizando ? S.card2 : S.white,
            color: !listo || analizando ? S.gray : S.bg,
            border: "none",
            borderRadius: 8,
            padding: 12,
            fontSize: TS.label,
            fontWeight: 700,
            cursor: !listo || analizando ? "default" : "pointer",
            minHeight: TAP,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {analizando ? (<><Loader2 size={16} strokeWidth={2} />ANALIZANDO...</>) : "ANALIZAR CON IA"}
        </button>
      ) : (
        <>
          <div style={{ ...innerCard, padding: "12px 14px", marginTop: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[
                ["Grasa", resultado.porcentajeGrasa, "%"],
                ["IMC", resultado.imc, ""],
                ["M. magra", resultado.masaMagraKg, " kg"],
                ["M. grasa", resultado.masaGrasaKg, " kg"],
                ["Cintura", resultado.medidasEstimadas.cintura, " cm"],
                ["Cuello", resultado.medidasEstimadas.cuello, " cm"],
              ].map(([labelTxt, val, unit]) => (
                <div key={labelTxt} style={{ textAlign: "center", background: S.card3, borderRadius: 6, padding: "6px 4px" }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{val != null ? `${val}${unit}` : "—"}</div>
                  <div style={{ color: S.gray, fontSize: 8, marginTop: 2 }}>{labelTxt}</div>
                </div>
              ))}
            </div>
            {resultado.medidasEstimadas.cadera != null && (
              <div style={{ marginTop: 6, textAlign: "center", background: S.card3, borderRadius: 6, padding: "6px 4px" }}>
                <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{resultado.medidasEstimadas.cadera} cm</div>
                <div style={{ color: S.gray, fontSize: 8, marginTop: 2 }}>Cadera</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => setResultado(null)}
              style={{ flex: 1, background: S.card2, color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: 12, fontSize: TS.label, fontWeight: 700, cursor: "pointer", minHeight: TAP }}
            >
              Repetir
            </button>
            <button
              onClick={guardarEnHistorial}
              disabled={guardando}
              style={{
                flex: 2,
                background: guardando ? S.card2 : S.white,
                color: guardando ? S.gray : S.bg,
                border: "none",
                borderRadius: 8,
                padding: 12,
                fontSize: TS.label,
                fontWeight: 700,
                cursor: guardando ? "default" : "pointer",
                minHeight: TAP,
              }}
            >
              {guardando ? "GUARDANDO..." : "GUARDAR EN HISTORIAL"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ScanCorporalForm;
