import { useState, useMemo, useRef, useEffect } from "react";
import { Camera, X, Sparkles, Loader2, Images } from "lucide-react";
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

// Overlay full-screen: cámara en vivo (getUserMedia, trasera por defecto en
// celular) + botón de captura. Al capturar, dibuja el frame actual en un
// canvas y lo entrega como File — mismo tipo de dato que ya esperaba el
// <input type="file">, así el resto del flujo (comprimirFoto, análisis) no
// cambia nada.
// 2026-08-04: hubo una silueta de referencia dibujada encima de la cámara
// (guía para pararse de frente/perfil) — Lucas la probó y "sale mal" (se
// desalinea con el encuadre real según la relación de aspecto del celular),
// así que se sacó. La cámara en vivo se queda porque funciona bien sola.
function CameraCapture({ tipo, onCapturar, onCancelar }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false })
      .then((stream) => {
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setListo(true);
        }
      })
      .catch(() => setError("No se pudo acceder a la cámara. Revisá los permisos del navegador, o subí una foto desde la galería."));
    return () => {
      cancelado = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capturar = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapturar(new File([blob], `${tipo}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 1000, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "16px", textAlign: "center", background: "linear-gradient(rgba(0,0,0,0.6), transparent)" }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
            {tipo === "frontal" ? "Foto de frente, cuerpo completo" : "Foto de perfil, cuerpo completo"}
          </span>
        </div>
        {error && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ color: "#fff", fontSize: 13, textAlign: "center", lineHeight: 1.5 }}>{error}</div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, padding: "16px", background: "#000", alignItems: "center", justifyContent: "center" }}>
        <button
          onClick={onCancelar}
          style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "12px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: TAP }}
        >
          Cancelar
        </button>
        <button
          onClick={capturar}
          disabled={!listo || !!error}
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "#fff",
            border: "4px solid rgba(255,255,255,0.35)",
            cursor: listo && !error ? "pointer" : "default",
            opacity: listo && !error ? 1 : 0.4,
          }}
          aria-label="Capturar foto"
        />
      </div>
    </div>
  );
}

function FotoInput({ tipo, titulo, preview, onFile, onQuitar }) {
  const [camaraAbierta, setCamaraAbierta] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) onFile(file);
  };

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
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            type="button"
            onClick={() => setCamaraAbierta(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "1px dashed " + S.border, borderRadius: 8, padding: "14px 12px", textAlign: "center", color: S.lgray, fontSize: TS.chip, fontWeight: 700, cursor: "pointer", background: "transparent" }}
          >
            <Camera size={16} strokeWidth={2} />Usar cámara
          </button>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "1px solid " + S.border, borderRadius: 8, padding: "8px 12px", textAlign: "center", color: S.gray, fontSize: 11, cursor: "pointer" }}>
            <Images size={14} strokeWidth={2} />Subir desde galería
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          </label>
        </div>
      )}
      {camaraAbierta && (
        <CameraCapture
          tipo={tipo}
          onCancelar={() => setCamaraAbierta(false)}
          onCapturar={(file) => {
            setCamaraAbierta(false);
            onFile(file);
          }}
        />
      )}
    </div>
  );
}

export function ScanCorporalForm({ alumno, onGuardar }) {
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

  const handleFoto = (setFile, setPreview) => (file) => {
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

  return (
    <div style={{ ...card, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Sparkles size={16} strokeWidth={2} />Scan corporal (2 fotos)
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
          tipo="frontal"
          titulo="Foto frontal"
          preview={previewFrontal}
          onFile={handleFoto(setFotoFrontal, setPreviewFrontal)}
          onQuitar={() => { setFotoFrontal(null); setPreviewFrontal(null); }}
        />
        <FotoInput
          tipo="lateral"
          titulo="Foto lateral"
          preview={previewLateral}
          onFile={handleFoto(setFotoLateral, setPreviewLateral)}
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
