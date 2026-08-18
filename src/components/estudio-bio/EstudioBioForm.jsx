// Movido textualmente desde EstudioBio.jsx (refactor 2026-08-18): mismo código,
// solo cambió de archivo. EstudioBio.jsx conserva EstudioBioSeccion (la sección completa).
import { useMemo, useState } from "react";
import { Camera, X } from "lucide-react";
import { card, inp, S, TAP, TS } from "../../utils/theme.js";
import { calcularEdad, hoy } from "../../utils/helpers.js";
import { calcularRequerimiento, NIVELES_ACTIVIDAD, OBJETIVOS_COMPOSICION, SEXOS } from "../../utils/energia.js";
import { useSignedUrl } from "../../utils/useSignedUrl.js";
import { PanelRequerimiento } from "./PanelRequerimiento.jsx";
import { BIO_BUCKET, generarConclusionAutomatica, generarObjetivoAutomatico } from "./helpers.js";

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

      <PanelRequerimiento req={req} />

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
            <img src={fotoPreview} alt="foto estudio" style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 8, background: S.card2 }} />
            <button
              onClick={() => { setFoto(null); setFotoPreview(null); }}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: TS.chip, display: "inline-flex", alignItems: "center", gap: 6, minHeight: TAP }}
            >
              <X size={16} strokeWidth={2} />Quitar
            </button>
          </div>
        ) : registroExistente && fotoExistenteUrl && !quitarFotoExistente ? (
          <div style={{ position: "relative", marginBottom: 8 }}>
            <img src={fotoExistenteUrl} alt="foto actual del estudio" style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 8, background: S.card2 }} />
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
