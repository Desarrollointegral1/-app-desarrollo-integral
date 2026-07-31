import { useState, useEffect, useMemo } from "react";
import { BarChart3, X, Camera, Inbox, Calendar, FileText, Trash2, Flame, TriangleAlert } from "lucide-react";
import { S, card, inp, innerCard, TS, TAP } from "../utils/theme.js";
import { hoy, calcularEdad } from "../utils/helpers.js";
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
  actualizarBioimpedancia,
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

// 2026-07-30: conclusión y objetivo ya no los escribe Lucas a mano — se arman
// solos a partir de los datos numéricos ya cargados (grasa corporal, IMC,
// muscular, requerimiento energético). Funciones puras: mismos datos, mismo
// texto, no dependen de estado de React — así se pueden recalcular en cada
// render sin useEffect. Rangos de grasa corporal son referencia general de
// composición corporal (no diagnóstico clínico) — se aclara en el texto.
const RANGO_GRASA = { masculino: [10, 20], femenino: [18, 28] };

function generarConclusionAutomatica(f, req, historialAlumno) {
  const frases = [];
  const grasa = f.grasa_corporal !== "" && f.grasa_corporal != null ? Number(f.grasa_corporal) : null;
  const imc = f.imc !== "" && f.imc != null ? Number(f.imc) : null;
  const muscular = f.masa_muscular !== "" && f.masa_muscular != null ? Number(f.masa_muscular) : null;
  const visceral = f.grasa_visceral !== "" && f.grasa_visceral != null ? Number(f.grasa_visceral) : null;

  if (grasa != null && f.sexo && RANGO_GRASA[f.sexo]) {
    const [min, max] = RANGO_GRASA[f.sexo];
    const pos = grasa < min ? "por debajo del" : grasa > max ? "por encima del" : "dentro del";
    frases.push(
      `Tu grasa corporal (${grasa}%) está ${pos} rango típico saludable para tu sexo (${min}–${max}%, referencia general, no un diagnóstico).`
    );
  }
  if (imc != null) frases.push(`IMC de ${imc}.`);
  if (muscular != null) frases.push(`Masa muscular en ${muscular}%.`);
  if (visceral != null && visceral > 12) frases.push(`Grasa visceral en nivel ${visceral}, por encima de lo recomendado.`);
  if (req?.rango) frases.push(`Gasto energético estimado de mantenimiento: ${formatoRango(req.rango)}.`);

  if (historialAlumno && historialAlumno.length > 0 && grasa != null) {
    const anterior = historialAlumno.find((r) => r.grasa_corporal != null && r.fecha !== f.fecha);
    if (anterior) {
      const diff = grasa - Number(anterior.grasa_corporal);
      if (Math.abs(diff) >= 0.5) {
        frases.push(`Respecto al estudio del ${anterior.fecha}, la grasa corporal ${diff < 0 ? "bajó" : "subió"} ${Math.abs(diff).toFixed(1)} puntos.`);
      }
    }
  }
  return frases.join(" ");
}

function generarObjetivoAutomatico(f, req) {
  const visceralAlta = f.grasa_visceral !== "" && f.grasa_visceral != null && Number(f.grasa_visceral) > 12;
  if (f.objetivo_composicion === "bajar_grasa" && req?.rango_ajustado) {
    return `Objetivo: bajar grasa corporal sosteniendo el gasto ajustado de ${formatoRango(req.rango_ajustado)}.`;
  }
  if (f.objetivo_composicion === "ganar_musculo" && req?.rango_ajustado) {
    return `Objetivo: sumar masa muscular sosteniendo el gasto ajustado de ${formatoRango(req.rango_ajustado)}.`;
  }
  if (f.objetivo_composicion === "mantener" && req?.rango) {
    return `Objetivo: mantener la composición actual sosteniendo el gasto de ${formatoRango(req.rango)}.`;
  }
  if (visceralAlta) return "Objetivo: bajar el nivel de grasa visceral con foco en actividad física regular.";
  return "";
}

// Sección completa: formulario + historial, conectada a Supabase.
// La usan tal cual el panel admin (sección Bioimp.) y la vista del alumno.
export function EstudioBioSeccion({ alumnoId, alumno, showToast, readOnly = false }) {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  // 2026-07-30: registro en edición — al setearlo, el formulario de "nuevo
  // estudio" se reemplaza por el mismo EstudioBioForm precargado (pedido de
  // Lucas: "falta poder modificar lo que grabé"). null = modo alta normal.
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    if (!alumnoId) return;
    setCargando(true);
    cargarBioimpedanciaCompleta(alumnoId).then((d) => {
      setRegistros(d);
      setCargando(false);
    });
  }, [alumnoId]);

  // Alta y edición comparten esta función: `datos.id` presente = UPDATE
  // (actualizarBioimpedancia) sobre ese registro, ausente = INSERT nuevo
  // (saveBioimpedanciaCompleta). Un solo lugar, no dos handlers duplicados.
  const guardar = async (datos, foto, quitarFoto = false) => {
    setGuardando(true);
    try {
      if (datos.id) {
        const actualizado = await actualizarBioimpedancia(datos.id, datos, foto, quitarFoto);
        setRegistros((prev) => prev.map((r) => (r.id === actualizado.id ? actualizado : r)));
        setEditando(null);
        showToast && showToast("Estudio actualizado");
      } else {
        const nuevo = await saveBioimpedanciaCompleta(alumnoId, datos, foto);
        setRegistros((prev) => [nuevo, ...prev]);
        showToast && showToast("Estudio guardado");
      }
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
      {!readOnly && editando ? (
        <EstudioBioForm
          key={editando.id}
          alumno={alumno}
          registroExistente={editando}
          onGuardar={guardar}
          onCancelar={() => setEditando(null)}
          guardando={guardando}
        />
      ) : (
        !readOnly && (
          <EstudioBioForm key="nuevo" alumno={alumno} onGuardar={guardar} guardando={guardando} historialAlumno={registros} />
        )
      )}
      {/* Estudio anterior: solo fecha + foto, sin medición — pedido explícito
          de Lucas de que viva separado del formulario de estudio nuevo. */}
      {!readOnly && !editando && (
        <EstudioAnteriorForm onGuardar={guardar} guardando={guardando} />
      )}
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
        <EstudioBioHistorial
          registros={registros}
          onEliminar={readOnly ? null : eliminar}
          onEditar={readOnly ? null : setEditando}
          alumnoFlyer={readOnly ? null : alumno}
          showToast={showToast}
          mostrarRequerimiento={!readOnly}
        />
      )}
    </div>
  );
}

// Bloque chico y separado (NO dentro de EstudioBioForm): solo pide fecha +
// foto de un estudio externo, sin medición numérica propia. Reusa el mismo
// patrón FileReader/preview que EstudioBioForm en vez de inventar otro.
function EstudioAnteriorForm({ onGuardar, guardando }) {
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
            <img src={preview} alt="estudio anterior" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 8 }} />
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

// Formulario de estudio de composición corporal (bioimpedancia) completo:
// datos numéricos + conclusión + objetivo de mejora + foto opcional del día.
// Lo usan el panel admin y la vista del alumno.
export function EstudioBioForm({ alumno, onGuardar, guardando = false, registroExistente = null, onCancelar = null, historialAlumno = null }) {
  const [f, setF] = useState(() => ({
    fecha: registroExistente?.fecha || hoy(),
    hora: registroExistente?.hora ? String(registroExistente.hora).slice(0, 5) : new Date().toTimeString().slice(0, 5),
    altura: registroExistente?.altura ?? alumno?.altura ?? "",
    peso: registroExistente?.peso ?? alumno?.peso ?? "",
    imc: registroExistente?.imc ?? "",
    grasa_corporal: registroExistente?.grasa_corporal ?? "",
    grasa_visceral: registroExistente?.grasa_visceral ?? "",
    masa_muscular: registroExistente?.masa_muscular ?? "",
    comentario: "",
    // Sexo/actividad/objetivo de composición no se guardan como columnas
    // propias (solo el resultado del cálculo queda en metadata.requerimiento),
    // así que al editar un registro viejo arrancan en blanco — se vuelven a
    // elegir si se quiere recalcular el requerimiento de ese estudio.
    sexo: "",
    actividad: "",
    objetivo_composicion: "",
  }));
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  // Foto que ya tenía el registro en edición (bucket privado → signed URL).
  // `quitarFotoExistente` la saca sin subir otra (actualizarBioimpedancia).
  const fotoExistenteUrl = useSignedUrl(BIO_BUCKET, !foto && registroExistente ? registroExistente.archivo_url : null);
  const [quitarFotoExistente, setQuitarFotoExistente] = useState(false);

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  // Toggle de chip: volver a tocar el activo lo apaga (mismo gesto que las
  // escalas y los objetivos del protocolo de evaluación).
  const setChip = (campo, valor) =>
    setF((p) => ({ ...p, [campo]: p[campo] === valor ? "" : valor }));

  // 2026-07-30, pedido de Lucas: "que no me la pregunte" — la edad sale sola
  // de la fecha de nacimiento del alumno, nunca de un input a mano.
  const edadCalculada = useMemo(() => calcularEdad(alumno?.fecha_nacimiento), [alumno?.fecha_nacimiento]);

  // Se recalcula solo con lo cargado. Devuelve null mientras falte un dato
  // obligatorio o alguno esté fuera de rango — no hay resultados parciales.
  const req = useMemo(
    () =>
      calcularRequerimiento({
        sexo: f.sexo,
        actividad: f.actividad,
        objetivo: f.objetivo_composicion,
        edad: edadCalculada,
        altura: f.altura,
        peso: f.peso,
        grasa_corporal: f.grasa_corporal,
      }),
    [f.sexo, f.actividad, f.objetivo_composicion, edadCalculada, f.altura, f.peso, f.grasa_corporal]
  );

  // 2026-07-30, pedido de Lucas: conclusión y objetivo los arma el sistema
  // solo — Lucas ya no los tipea, solo agrega un comentario aparte.
  const conclusionGenerada = useMemo(() => generarConclusionAutomatica(f, req, historialAlumno), [f, req, historialAlumno]);
  const objetivoGenerado = useMemo(() => generarObjetivoAutomatico(f, req), [f, req]);

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFoto(file);
    setQuitarFotoExistente(false);
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
    // El comentario del entrenador se concatena al final de la conclusión
    // generada: la base todavía no tiene una columna/campo de metadata
    // propio para "comentario" (ver nota en el reporte de este cambio), así
    // que viajar pegado a `conclusion` es la única forma de no perderlo.
    const conclusionFinal = f.comentario.trim()
      ? `${conclusionGenerada}\n\nComentario del entrenador: ${f.comentario.trim()}`
      : conclusionGenerada;
    const datos = {
      ...f,
      edad: edadCalculada,
      requerimiento: req,
      conclusion: conclusionFinal,
      objetivo: objetivoGenerado,
    };
    if (registroExistente) {
      datos.id = registroExistente.id;
      datos.archivo_url_actual = registroExistente.archivo_url;
      datos.nombre_archivo_actual = registroExistente.nombre_archivo;
    }
    const ok = await onGuardar(datos, foto, quitarFotoExistente);
    if (ok) {
      if (registroExistente) {
        onCancelar && onCancelar();
        return;
      }
      setF({
        fecha: hoy(),
        hora: new Date().toTimeString().slice(0, 5),
        altura: alumno?.altura || "",
        peso: "",
        imc: "",
        grasa_corporal: "",
        grasa_visceral: "",
        masa_muscular: "",
        comentario: "",
        sexo: "",
        actividad: "",
        objetivo_composicion: "",
      });
      setFoto(null);
      setFotoPreview(null);
      setQuitarFotoExistente(false);
    }
  };

  return (
    <div style={{ ...card, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 12, letterSpacing: 1 }}>
        {registroExistente ? "Editar estudio" : "Estudio de composición corporal"}
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
          {label("Edad")}
          {edadCalculada != null ? (
            <div style={{ ...inp, display: "flex", alignItems: "center", color: S.lgray }}>{edadCalculada} años</div>
          ) : (
            <div style={{ ...inp, display: "flex", alignItems: "center", color: S.yellow, fontSize: TS.chip, lineHeight: 1.3 }}>
              Sin fecha de nacimiento cargada — cargala en la ficha del alumno
            </div>
          )}
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

      {/* 2026-07-30: conclusión y objetivo ya no los tipea Lucas — los arma
          el sistema con los datos cargados arriba. Se muestran de solo
          lectura para que se note que son generados; el único campo editable
          es el comentario de abajo. */}
      <div style={{ marginTop: 10 }}>
        {label("Conclusión (generada automáticamente)")}
        <div style={{ ...inp, minHeight: 60, height: "auto", lineHeight: 1.5, color: conclusionGenerada ? S.white : S.gray, whiteSpace: "pre-wrap" }}>
          {conclusionGenerada || "Cargá datos arriba (grasa corporal, sexo, IMC...) para generarla."}
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        {label("Objetivo de mejora (generado automáticamente)")}
        <div style={{ ...inp, minHeight: 40, height: "auto", lineHeight: 1.5, color: objetivoGenerado ? S.white : S.gray, whiteSpace: "pre-wrap" }}>
          {objetivoGenerado || "Elegí un objetivo de composición para generarlo."}
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        {label("Comentario del entrenador (opcional)")}
        <textarea
          value={f.comentario}
          onChange={set("comentario")}
          rows={2}
          placeholder="Algo puntual para sumar a la conclusión..."
          style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {/* Foto del día — en edición, primero se ve la que ya tenía el
          registro (signed URL del bucket privado), con opción de sacarla o
          reemplazarla por una nueva. */}
      <div style={{ marginTop: 12 }}>
        {label("Foto del registro (opcional)")}
        {fotoPreview ? (
          <div style={{ position: "relative", marginBottom: 8 }}>
            <img src={fotoPreview} alt="foto estudio" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 8 }} />
            <button
              onClick={() => { setFoto(null); setFotoPreview(null); }}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: TS.chip, display: "inline-flex", alignItems: "center", gap: 6, minHeight: TAP }}
            >
              <X size={16} strokeWidth={2} />Quitar
            </button>
          </div>
        ) : registroExistente && fotoExistenteUrl && !quitarFotoExistente ? (
          <div style={{ position: "relative", marginBottom: 8 }}>
            <img src={fotoExistenteUrl} alt="foto actual del estudio" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 8 }} />
            <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
              <label style={{ background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: TS.chip, display: "inline-flex", alignItems: "center", gap: 6, minHeight: TAP }}>
                Reemplazar
                <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFoto} />
              </label>
              <button
                onClick={() => setQuitarFotoExistente(true)}
                style={{ background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: TS.chip, display: "inline-flex", alignItems: "center", gap: 6, minHeight: TAP }}
              >
                <X size={16} strokeWidth={2} />Quitar
              </button>
            </div>
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
              fontSize: TS.chip,
              cursor: "pointer",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Camera size={16} strokeWidth={2} />Tocar para subir foto</span>
            <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFoto} />
          </label>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {registroExistente && (
          <button
            onClick={onCancelar}
            style={{ flex: 1, background: S.card2, color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: 12, fontSize: TS.label, fontWeight: 700, cursor: "pointer", minHeight: TAP }}
          >
            Cancelar
          </button>
        )}
        <button
          onClick={guardar}
          disabled={guardando}
          style={{
            flex: registroExistente ? 2 : 1,
            width: registroExistente ? "auto" : "100%",
            background: guardando ? S.card2 : S.white,
            color: guardando ? S.gray : S.bg,
            border: "none",
            borderRadius: 8,
            padding: 12,
            fontSize: TS.label,
            fontWeight: 700,
            cursor: guardando ? "default" : "pointer",
            letterSpacing: 0.5,
            minHeight: TAP,
          }}
        >
          {guardando ? "GUARDANDO..." : registroExistente ? "GUARDAR CAMBIOS" : "GUARDAR ESTUDIO"}
        </button>
      </div>
    </div>
  );
}

// Historial de estudios: métricas + conclusión/objetivo + foto.
// `alumnoFlyer`: si viene (admin), cada registro muestra "Generar flyer" —
// el documento de una página con marca DI para mandarle al alumno. Se
// regenera siempre desde el registro (conclusión/objetivo viven en metadata).
export function EstudioBioHistorial({ registros, onEliminar, onEditar, alumnoFlyer, showToast, mostrarRequerimiento = false }) {
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
      {registros.map((bio) => {
        // "Estudio anterior" (foto + fecha subida por Lucas, sin medición
        // propia): se marca distinto para no mostrar una grilla de 6 métricas
        // todas en "—", que se lee como un registro roto.
        const esAnterior = bio.metadata?.tipo === "estudio_anterior";
        return (
        <div key={bio.id} style={{ ...card, padding: "12px 14px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: S.lgray, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} strokeWidth={2} />{bio.fecha} {bio.hora ? `· ${String(bio.hora).slice(0, 5)}` : ""}
              {esAnterior && <span style={{ color: S.gray, textTransform: "uppercase", letterSpacing: 1, fontSize: 9 }}>· Estudio anterior</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {alumnoFlyer && !esAnterior && (
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
              {onEditar && (
                <button
                  onClick={() => onEditar(bio)}
                  style={{ background: "transparent", color: S.lgray, border: "1px solid " + S.border, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Editar
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
          {!esAnterior && (
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
          )}
          {bio.metadata?.conclusion && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Conclusión</div>
              <div style={{ color: S.white, fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{bio.metadata.conclusion}</div>
            </div>
          )}
          {bio.metadata?.objetivo && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, color: S.lgray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Objetivo de mejora</div>
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
        );
      })}
    </div>
  );
}
