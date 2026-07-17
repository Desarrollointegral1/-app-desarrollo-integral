import { useState, useEffect } from "react";
import { S, card, inp } from "../utils/theme.js";
import { hoy } from "../utils/helpers.js";
import {
  saveBioimpedanciaCompleta,
  cargarBioimpedanciaCompleta,
  eliminarBioimpedancia,
} from "../../services/supabase.js";

// Sección completa: formulario + historial, conectada a Supabase.
// La usan tal cual el panel admin (sección Bioimp.) y la vista del alumno.
export function EstudioBioSeccion({ alumnoId, alumno, showToast, readOnly = false }) {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!alumnoId) return;
    setCargando(true);
    cargarBioimpedanciaCompleta(alumnoId).then((d) => {
      setRegistros(d);
      setCargando(false);
    });
  }, [alumnoId]);

  const guardar = async (datos, foto) => {
    setGuardando(true);
    try {
      const nuevo = await saveBioimpedanciaCompleta(alumnoId, datos, foto);
      setRegistros((prev) => [nuevo, ...prev]);
      showToast && showToast("Estudio guardado ✓");
      return true;
    } catch (e) {
      console.error("[EstudioBio] Error guardando:", e);
      showToast && showToast("Error al guardar el estudio");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (bio) => {
    if (!window.confirm(`¿Eliminar el estudio del ${bio.fecha}?`)) return;
    try {
      await eliminarBioimpedancia(bio.id, bio.archivo_url);
      setRegistros((prev) => prev.filter((r) => r.id !== bio.id));
      showToast && showToast("Estudio eliminado");
    } catch (e) {
      showToast && showToast("Error al eliminar");
    }
  };

  return (
    <div>
      {!readOnly && <EstudioBioForm alumno={alumno} onGuardar={guardar} guardando={guardando} />}
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        📊 Estudios registrados
      </div>
      {cargando ? (
        <div style={{ color: S.gray, fontSize: 12, padding: 16, textAlign: "center" }}>Cargando...</div>
      ) : (
        <EstudioBioHistorial registros={registros} onEliminar={readOnly ? null : eliminar} />
      )}
    </div>
  );
}

// Formulario de estudio de composición corporal (bioimpedancia) completo:
// datos numéricos + conclusión + objetivo de mejora + foto opcional del día.
// Lo usan el panel admin y la vista del alumno.
export function EstudioBioForm({ alumno, onGuardar, guardando = false }) {
  const [f, setF] = useState({
    fecha: hoy(),
    hora: new Date().toTimeString().slice(0, 5),
    edad: "",
    altura: alumno?.altura || "",
    peso: alumno?.peso || "",
    imc: "",
    grasa_corporal: "",
    grasa_visceral: "",
    masa_muscular: "",
    conclusion: "",
    objetivo: "",
  });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFoto(file);
    const r = new FileReader();
    r.onload = (ev) => setFotoPreview(ev.target.result);
    r.readAsDataURL(file);
  };

  const label = (t) => (
    <div style={{ fontSize: 10, color: S.gray, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {t}
    </div>
  );

  const guardar = async () => {
    const ok = await onGuardar(f, foto);
    if (ok) {
      setF({
        fecha: hoy(),
        hora: new Date().toTimeString().slice(0, 5),
        edad: "",
        altura: alumno?.altura || "",
        peso: "",
        imc: "",
        grasa_corporal: "",
        grasa_visceral: "",
        masa_muscular: "",
        conclusion: "",
        objetivo: "",
      });
      setFoto(null);
      setFotoPreview(null);
    }
  };

  return (
    <div style={{ ...card, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 12, letterSpacing: 1 }}>
        Estudio de composición corporal
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          {label("Fecha del estudio")}
          <input type="date" value={f.fecha} onChange={set("fecha")} style={inp} />
        </div>
        <div>
          {label("Hora")}
          <input type="time" value={f.hora} onChange={set("hora")} style={inp} />
        </div>
        <div>
          {label("Edad (años)")}
          <input type="number" inputMode="numeric" value={f.edad} onChange={set("edad")} style={inp} />
        </div>
        <div>
          {label("Estatura (cm)")}
          <input type="number" inputMode="decimal" value={f.altura} onChange={set("altura")} style={inp} />
        </div>
        <div>
          {label("Peso (kg)")}
          <input type="number" inputMode="decimal" step="0.1" value={f.peso} onChange={set("peso")} style={inp} />
        </div>
        <div>
          {label("IMC")}
          <input type="number" inputMode="decimal" step="0.1" value={f.imc} onChange={set("imc")} style={inp} />
        </div>
        <div>
          {label("% Grasa corporal")}
          <input type="number" inputMode="decimal" step="0.1" value={f.grasa_corporal} onChange={set("grasa_corporal")} style={inp} />
        </div>
        <div>
          {label("Grasa visceral (nivel)")}
          <input type="number" inputMode="decimal" step="0.5" value={f.grasa_visceral} onChange={set("grasa_visceral")} style={inp} />
        </div>
        <div>
          {label("% Masa muscular")}
          <input type="number" inputMode="decimal" step="0.1" value={f.masa_muscular} onChange={set("masa_muscular")} style={inp} />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        {label("Conclusión")}
        <textarea
          value={f.conclusion}
          onChange={set("conclusion")}
          rows={3}
          placeholder="Ej: Composición corporal saludable para la edad, con IMC adecuado..."
          style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>
      <div style={{ marginTop: 10 }}>
        {label("Objetivo de mejora")}
        <textarea
          value={f.objetivo}
          onChange={set("objetivo")}
          rows={2}
          placeholder="Ej: Reducir grasa corporal hacia 24–26%, subir masa muscular hacia 30–32%..."
          style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {/* Foto del día */}
      <div style={{ marginTop: 12 }}>
        {label("Foto del registro (opcional)")}
        {fotoPreview ? (
          <div style={{ position: "relative", marginBottom: 8 }}>
            <img src={fotoPreview} alt="foto estudio" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 8 }} />
            <button
              onClick={() => { setFoto(null); setFotoPreview(null); }}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
            >
              ✕ Quitar
            </button>
          </div>
        ) : (
          <label
            style={{
              display: "block",
              border: "1px dashed " + S.border,
              borderRadius: 8,
              padding: "18px 12px",
              textAlign: "center",
              color: S.gray,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            📷 Tocar para subir foto
            <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFoto} />
          </label>
        )}
      </div>

      <button
        onClick={guardar}
        disabled={guardando}
        style={{
          width: "100%",
          background: guardando ? S.card2 : S.white,
          color: guardando ? S.gray : S.bg,
          border: "none",
          borderRadius: 8,
          padding: 12,
          fontSize: 13,
          fontWeight: 700,
          cursor: guardando ? "default" : "pointer",
          marginTop: 14,
          letterSpacing: 0.5,
        }}
      >
        {guardando ? "GUARDANDO..." : "GUARDAR ESTUDIO"}
      </button>
    </div>
  );
}

// Historial de estudios: métricas + conclusión/objetivo + foto.
export function EstudioBioHistorial({ registros, onEliminar }) {
  if (!registros || registros.length === 0) {
    return (
      <div style={{ ...card, padding: "40px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
        <div style={{ color: S.gray, fontSize: 12 }}>Sin estudios registrados aún</div>
      </div>
    );
  }
  return (
    <div>
      {registros.map((bio) => (
        <div key={bio.id} style={{ ...card, padding: "12px 14px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: S.lgray }}>
              📅 {bio.fecha} {bio.hora ? `· ${String(bio.hora).slice(0, 5)}` : ""}
            </div>
            {onEliminar && (
              <button
                onClick={() => onEliminar(bio)}
                style={{ background: "transparent", color: S.red, border: "1px solid " + S.red, borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}
              >
                🗑
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              ["Peso", bio.peso, " kg"],
              ["IMC", bio.imc, ""],
              ["Grasa", bio.grasa_corporal, "%"],
              ["Visceral", bio.grasa_visceral, ""],
              ["Músculo", bio.masa_muscular, "%"],
              ["Estatura", bio.altura, " cm"],
            ].map(([labelTxt, val, unit]) => (
              <div key={labelTxt} style={{ textAlign: "center", background: S.card2, borderRadius: 6, padding: "6px 4px" }}>
                <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>
                  {val != null && val !== "" ? `${val}${unit}` : "—"}
                </div>
                <div style={{ color: S.gray, fontSize: 8, marginTop: 2 }}>{labelTxt}</div>
              </div>
            ))}
          </div>
          {bio.metadata?.conclusion && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Conclusión</div>
              <div style={{ color: S.white, fontSize: 12, lineHeight: 1.5 }}>{bio.metadata.conclusion}</div>
            </div>
          )}
          {bio.metadata?.objetivo && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, color: S.green, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Objetivo de mejora</div>
              <div style={{ color: S.white, fontSize: 12, lineHeight: 1.5 }}>{bio.metadata.objetivo}</div>
            </div>
          )}
          {bio.archivo_url && (
            <a href={bio.archivo_url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 10 }}>
              <img
                src={bio.archivo_url}
                alt={bio.nombre_archivo || "foto estudio"}
                style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8 }}
                onError={(e) => { e.target.outerHTML = `<div style="color:#8a8a8a;font-size:11px">📎 ${bio.nombre_archivo || "archivo adjunto"}</div>`; }}
              />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
