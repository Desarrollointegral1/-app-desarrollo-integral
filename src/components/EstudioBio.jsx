import { useState, useEffect, useMemo } from "react";
import { BarChart3, X, Camera, Inbox, Calendar, FileText, Trash2, Flame, TriangleAlert } from "lucide-react";
import { S, card, inp, innerCard } from "../utils/theme.js";
import { hoy } from "../utils/helpers.js";
import {
  SEXOS,
  NIVELES_ACTIVIDAD,
  OBJETIVOS_COMPOSICION,
  calcularRequerimiento,
  formatoRango,
  DISCLAIMER_REQUERIMIENTO,
} from "../utils/energia.js";
import {
  saveBioimpedanciaCompleta,
  cargarBioimpedanciaCompleta,
  eliminarBioimpedancia,
  getSignedUrl,
} from "../../services/supabase.js";
import { useSignedUrl } from "../utils/useSignedUrl.js";
import { generarFlyerBio } from "../utils/flyerBio.js";

const BIO_BUCKET = "bioimpedancia-archivos";

// Foto de un estudio: archivo_url guarda el PATH del objeto (bucket privado),
// se resuelve a signed URL on-demand. Datos viejos (http/data) pasan tal cual.
function BioFoto({ bio }) {
  const url = useSignedUrl(BIO_BUCKET, bio.archivo_url);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 10 }}>
      <img
        src={url}
        alt={bio.nombre_archivo || "foto estudio"}
        style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8 }}
        onError={(e) => { e.target.outerHTML = `<div style="color:#8a8a8a;font-size:11px">${bio.nombre_archivo || "archivo adjunto"}</div>`; }}
      />
    </a>
  );
}

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
      showToast && showToast("Estudio guardado");
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
      {/* El requerimiento energético y la alerta de disponibilidad son
          entrenador-only por veto de seguridad: un número de kcal mostrado al
          alumno se lee como prescripción, y la alerta es un indicador de
          riesgo RED-S que debe derivar a un profesional, no mostrarse. */}
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><BarChart3 size={16} strokeWidth={2} />Estudios registrados</span>
      </div>
      {cargando ? (
        <div style={{ color: S.gray, fontSize: 12, padding: 16, textAlign: "center" }}>Cargando...</div>
      ) : (
        <EstudioBioHistorial registros={registros} onEliminar={readOnly ? null : eliminar} alumnoFlyer={readOnly ? null : alumno} showToast={showToast} mostrarRequerimiento={!readOnly} />
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
    sexo: "",
    actividad: "",
    objetivo_composicion: "",
  });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  // Toggle de chip: volver a tocar el activo lo apaga (mismo gesto que las
  // escalas y los objetivos del protocolo de evaluación).
  const setChip = (campo, valor) =>
    setF((p) => ({ ...p, [campo]: p[campo] === valor ? "" : valor }));

  // Se recalcula solo con lo cargado. Devuelve null mientras falte un dato
  // obligatorio o alguno esté fuera de rango — no hay resultados parciales.
  const req = useMemo(
    () =>
      calcularRequerimiento({
        sexo: f.sexo,
        actividad: f.actividad,
        objetivo: f.objetivo_composicion,
        edad: f.edad,
        altura: f.altura,
        peso: f.peso,
        grasa_corporal: f.grasa_corporal,
      }),
    [f.sexo, f.actividad, f.objetivo_composicion, f.edad, f.altura, f.peso, f.grasa_corporal]
  );

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
  // Mismo peso visual que los subtítulos del protocolo de evaluación: un
  // bloque nuevo se anuncia como sección, no como caption gris.
  const subtitulo = (t) => (
    <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1, margin: "18px 0 10px" }}>
      {t}
    </div>
  );
  // Chip de fila (2-3 opciones, ocupan el ancho) y chip pastilla (5 opciones,
  // se acomodan en dos líneas a 375px en vez de apretarse).
  const chipFila = (activo) => ({
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
  const chipPill = (activo) => ({
    background: activo ? S.white : S.card2,
    color: activo ? S.bg : S.gray,
    border: "1px solid " + (activo ? S.white : S.border),
    borderRadius: 20,
    padding: "7px 14px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  });

  const guardar = async () => {
    // `req` es null si el bloque está incompleto: en ese caso no viaja nada
    // del requerimiento a la base (todo o nada, nunca un NaN disfrazado).
    const ok = await onGuardar({ ...f, requerimiento: req }, foto);
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
        sexo: "",
        actividad: "",
        objetivo_composicion: "",
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

      {/* ── Requerimiento energético estimado ──────────────────────────
          Bloque 7 del protocolo de evaluación. Se calcula con datos que el
          estudio ya toma; solo suma sexo, actividad y objetivo. */}
      {subtitulo("Requerimiento energético estimado")}

      {label("Sexo (para el cálculo)")}
      <div style={{ display: "flex", gap: 6 }}>
        {SEXOS.map((s) => (
          <button key={s.k} type="button" onClick={() => setChip("sexo", s.k)} style={chipFila(f.sexo === s.k)}>
            {s.txt.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        {label("Nivel de actividad física")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {NIVELES_ACTIVIDAD.map((n) => (
            <button key={n.k} type="button" onClick={() => setChip("actividad", n.k)} style={chipPill(f.actividad === n.k)}>
              {n.txt} · {n.pal.toFixed(1).replace(".", ",")}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {label("Objetivo de composición")}
        <div style={{ display: "flex", gap: 6 }}>
          {OBJETIVOS_COMPOSICION.map((o) => (
            <button
              key={o.k}
              type="button"
              onClick={() => setChip("objetivo_composicion", o.k)}
              style={chipFila(f.objetivo_composicion === o.k)}
            >
              {o.txt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...innerCard, padding: "12px 14px", marginTop: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Flame size={14} strokeWidth={2} color={S.gray} />
          <span style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
            Gasto energético estimado
          </span>
        </span>

        {!req ? (
          <div style={{ fontSize: 11, color: S.lgray, marginTop: 8, lineHeight: 1.5 }}>
            Completá edad, estatura, peso, sexo y nivel de actividad para calcular.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: req.tmb_cunningham ? "1fr 1fr" : "1fr",
                gap: 6,
                marginTop: 10,
              }}
            >
              <div style={{ textAlign: "center", background: S.card3, borderRadius: 6, padding: "6px 4px" }}>
                <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{req.tmb} kcal</div>
                <div style={{ color: S.gray, fontSize: 8, marginTop: 2 }}>TMB MIFFLIN</div>
              </div>
              {req.tmb_cunningham && (
                <div style={{ textAlign: "center", background: S.card3, borderRadius: 6, padding: "6px 4px" }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{req.tmb_cunningham} kcal</div>
                  <div style={{ color: S.gray, fontSize: 8, marginTop: 2 }}>TMB CUNNINGHAM</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: S.white, lineHeight: 1 }}>
                {formatoRango(req.rango)}
              </div>
              <div style={{ fontSize: 10, color: S.gray, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
                Gasto total estimado · mantenimiento
              </div>
            </div>

            {req.rango_ajustado && req.objetivo !== "mantener" && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: S.white, lineHeight: 1 }}>
                  {formatoRango(req.rango_ajustado)}
                </div>
                <div style={{ fontSize: 10, color: S.gray, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
                  {req.objetivo === "bajar_grasa" ? "Rango ajustado · déficit 300–1000" : "Rango ajustado · superávit 300–500"}
                </div>
              </div>
            )}

            {req.alerta_piso && (
              <div
                style={{
                  marginTop: 10,
                  background: S.card,
                  borderLeft: "3px solid " + S.yellow,
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <TriangleAlert size={14} strokeWidth={2} color={S.yellow} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: S.yellow }}>
                    Por debajo del piso de seguridad hormonal
                  </span>
                </span>
                <div style={{ fontSize: 11, color: S.white, lineHeight: 1.5, marginTop: 4 }}>
                  El límite inferior del rango ({req.rango_ajustado ? req.rango_ajustado[0] : req.rango[0]} kcal) queda
                  por debajo de 30 kcal por kg de masa magra ({req.piso_kcal} kcal sobre {req.masa_magra} kg). Revisar
                  el objetivo antes de sostenerlo.
                </div>
              </div>
            )}

            <div
              style={{
                borderTop: "1px solid " + S.border,
                paddingTop: 8,
                marginTop: 12,
                fontSize: 11,
                color: S.gray,
                lineHeight: 1.45,
              }}
            >
              {DISCLAIMER_REQUERIMIENTO}
            </div>
          </>
        )}
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
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <X size={16} strokeWidth={2} />Quitar
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
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Camera size={16} strokeWidth={2} />Tocar para subir foto</span>
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
// `alumnoFlyer`: si viene (admin), cada registro muestra "Generar flyer" —
// el documento de una página con marca DI para mandarle al alumno. Se
// regenera siempre desde el registro (conclusión/objetivo viven en metadata).
export function EstudioBioHistorial({ registros, onEliminar, alumnoFlyer, showToast, mostrarRequerimiento = false }) {
  if (!registros || registros.length === 0) {
    return (
      <div style={{ ...card, padding: "40px 16px", textAlign: "center" }}>
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", color: S.gray }}><Inbox size={24} strokeWidth={2} /></div>
        <div style={{ color: S.gray, fontSize: 12 }}>Sin estudios registrados aún</div>
      </div>
    );
  }
  return (
    <div>
      {registros.map((bio) => (
        <div key={bio.id} style={{ ...card, padding: "12px 14px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: S.lgray, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} strokeWidth={2} />{bio.fecha} {bio.hora ? `· ${String(bio.hora).slice(0, 5)}` : ""}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {alumnoFlyer && (
                <button
                  onClick={async () => {
                    // El flyer es HTML estático: la foto no puede resolver el
                    // signed URL sola, se resuelve acá antes de generarlo.
                    const fotoUrl = await getSignedUrl(BIO_BUCKET, bio.archivo_url);
                    generarFlyerBio(alumnoFlyer, { ...bio, archivo_url: fotoUrl });
                    showToast && showToast("Flyer generado — abrilo y guardalo como PDF");
                  }}
                  style={{ background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <FileText size={16} strokeWidth={2} />Generar flyer
                </button>
              )}
              {onEliminar && (
                <button
                  onClick={() => onEliminar(bio)}
                  style={{ background: "transparent", color: S.red, border: "1px solid " + S.red, borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              )}
            </div>
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
          {/* Solo entrenador: el número de kcal se lee como prescripción y la
              alerta es un indicador de riesgo RED-S. Gateado a propósito, no
              por el hecho de que hoy no exista una vista de alumno. */}
          {mostrarRequerimiento && bio.metadata?.requerimiento && (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  fontSize: 9,
                  color: bio.metadata.requerimiento.alerta_piso ? S.yellow : S.gray,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                Requerimiento energético
              </div>
              <div style={{ color: S.white, fontSize: 12, lineHeight: 1.5 }}>
                {formatoRango(bio.metadata.requerimiento.rango_ajustado || bio.metadata.requerimiento.rango)}
              </div>
              {bio.metadata.requerimiento.alerta_piso && (
                <div style={{ color: S.yellow, fontSize: 11, marginTop: 3, lineHeight: 1.4 }}>
                  Por debajo del piso de 30 kcal/kg de masa magra.
                </div>
              )}
            </div>
          )}
          {bio.archivo_url && <BioFoto bio={bio} />}
        </div>
      ))}
    </div>
  );
}
