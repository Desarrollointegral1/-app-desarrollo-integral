// ============================================================================
// REHAB INTEGRAL — la app de Griselda (2026-08-09)
// ============================================================================
// Qué es y qué NO es (pedido textual de Lucas): "va a ser más simple, sin
// planes de entrenamiento, pacientes y ejercicios personalizados que va
// armando Griselda". Así que acá no hay planes, ni periodización, ni series,
// ni peso por vuelta, ni RM — todo eso es del gimnasio y vive en la otra app.
// Hay pacientes, y cada paciente tiene ejercicios en orden.
//
// El catálogo se muestra FILTRADO: sólo peso corporal, elásticos y movilidad
// (ver EQUIPO_REHAB en services/rehab.js). Que un ejercicio con barra no se
// pueda ni buscar es la regla del dominio, no una comodidad de la interfaz.
//
// Los componentes de pantalla reciben todo por props y no tocan la red: así se
// montan con datos falsos en dev/harness-rehab.html y se pueden ver sin login.
import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Plus, ArrowLeft, LogOut, Trash2, Camera, Sparkles, X, Check, ChevronRight } from "lucide-react";
import { llamarAsistente } from "../src/components/AsistenteEjercicio.jsx";
import { useSignedUrl } from "../src/utils/useSignedUrl.js";
import {
  C, FUENTE, pantalla, columna, titulo, subtitulo, etiqueta,
  ficha, campo, boton, chip, fila, CSS_GLOBAL,
} from "./theme.js";
import {
  loginKine, recuperarSesionKine, salirKine,
  listarPacientes, crearPaciente, actualizarPaciente, archivarPaciente,
  listarEjerciciosPaciente, agregarEjercicioPaciente, eliminarEjercicioPaciente,
  cargarCatalogoRehab, buscarCatalogoRehab, subirMediaRehab,
} from "../services/rehab.js";

// ── piezas chicas ───────────────────────────────────────────────────────────

export function EstilosGlobales() {
  return <style dangerouslySetInnerHTML={{ __html: CSS_GLOBAL }} />;
}

/**
 * El wordmark. "rehab" en el peso fino y "integral" en negrita, todo en
 * minúscula: la app de entrenamiento firma en versalitas condensadas negras,
 * ésta firma bajito. Es la misma familia tipográfica, la voz opuesta.
 */
export function Marca({ tam = 22 }) {
  return (
    <span style={{ fontFamily: FUENTE, fontSize: tam, letterSpacing: "-0.03em", color: C.tinta, lineHeight: 1, whiteSpace: "nowrap" }}>
      <span style={{ fontWeight: 300 }}>rehab</span>
      <span style={{ fontWeight: 800 }}> integral</span>
    </span>
  );
}

function Aviso({ children, tono = "error" }) {
  if (!children) return null;
  const err = tono === "error";
  return (
    <div
      role={err ? "alert" : "status"}
      style={{
        background: err ? C.rojoSuave : C.verdeSuave,
        color: err ? C.rojo : C.verde,
        border: "1px solid " + (err ? C.rojo : C.verde),
        borderRadius: 10,
        padding: "12px 14px",
        fontSize: 15,
        lineHeight: 1.45,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

/** Foto/video del ejercicio. Resuelve el path del bucket privado a signed URL. */
export function Media({ valor, alto = 180 }) {
  const url = useSignedUrl("rehab-media", valor);
  if (!valor) return null;
  const esVideo = /\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(valor) || /^data:video/i.test(valor);
  const marco = { width: "100%", maxHeight: alto, objectFit: "contain", display: "block", borderRadius: 8, background: C.papel };
  if (!url) return <div style={{ ...marco, height: alto, border: "1px solid " + C.linea }} />;
  return esVideo
    ? <video src={url} controls playsInline style={marco} />
    : <img src={url} alt="" style={marco} />;
}

// ── login ───────────────────────────────────────────────────────────────────

export function PantallaLogin({ onEntrar }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    if (!usuario.trim() || !clave.trim()) { setError("Completá usuario y clave."); return; }
    setError("");
    setEntrando(true);
    try {
      await onEntrar(usuario.trim(), clave.trim());
    } catch (err) {
      setError(err.message || "No se pudo entrar.");
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div style={{ ...pantalla, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 40, paddingBottom: 40 }}>
      <div style={{ ...columna, maxWidth: 420 }} data-entra>
        <Marca tam={26} />
        <h1 style={{ ...titulo, marginTop: 28 }}>Consultorio de kinesiología y osteopatía.</h1>
        <p style={{ ...subtitulo, marginTop: 14, marginBottom: 32 }}>
          Tus pacientes y sus ejercicios. Separado de la app del gimnasio.
        </p>

        <form onSubmit={entrar}>
          <Aviso>{error}</Aviso>

          <label style={etiqueta} htmlFor="usuario">Usuario</label>
          <input
            id="usuario" name="username" autoComplete="username" autoCapitalize="none"
            value={usuario} onChange={(e) => setUsuario(e.target.value)}
            style={{ ...campo, marginBottom: 18 }}
          />

          <label style={etiqueta} htmlFor="clave">Clave</label>
          <input
            id="clave" name="password" type="password" autoComplete="current-password" inputMode="numeric"
            value={clave} onChange={(e) => setClave(e.target.value)}
            style={{ ...campo, marginBottom: 26 }}
          />

          <button type="submit" disabled={entrando} style={{ ...boton("primario"), width: "100%", opacity: entrando ? 0.7 : 1 }}>
            {entrando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── lista de pacientes ──────────────────────────────────────────────────────

function iniciales(nombre) {
  return (nombre || "")
    .trim().split(/\s+/).slice(0, 2)
    .map((p) => p[0] || "")
    .join("")
    .toUpperCase();
}

export function ListaPacientes({ kine, pacientes, cargando, error, onAbrir, onNuevo, onSalir }) {
  const [busqueda, setBusqueda] = useState("");
  const [verAltas, setVerAltas] = useState(false);

  const visibles = pacientes
    .filter((p) => (verAltas ? !p.activo : p.activo))
    .filter((p) => p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()));

  const activos = pacientes.filter((p) => p.activo).length;
  const altas = pacientes.length - activos;

  return (
    <div style={pantalla}>
      <Encabezado kine={kine} onSalir={onSalir} />

      <div style={{ ...columna, paddingTop: 24, paddingBottom: 100 }} data-entra>
        <h1 style={titulo}>Pacientes</h1>
        <p style={{ ...subtitulo, marginTop: 10 }}>
          {cargando ? "Cargando…" : `${activos} en tratamiento${altas ? ` · ${altas} con alta` : ""}`}
        </p>

        <Aviso>{error}</Aviso>

        <div style={{ position: "relative", margin: "24px 0 16px" }}>
          <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.tinta2, pointerEvents: "none" }} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar paciente"
            aria-label="Buscar paciente"
            style={{ ...campo, paddingLeft: 42 }}
          />
        </div>

        {altas > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button onClick={() => setVerAltas(false)} style={chip(!verAltas)}>En tratamiento</button>
            <button onClick={() => setVerAltas(true)} style={chip(verAltas)}>Con alta ({altas})</button>
          </div>
        )}

        {!cargando && visibles.length === 0 && (
          <div style={{ ...ficha, marginTop: 16, textAlign: "center", padding: "34px 20px" }}>
            <p style={{ ...subtitulo, color: C.tinta, fontSize: 17, margin: 0 }}>
              {busqueda ? "Ningún paciente con ese nombre." : verAltas ? "Todavía no le diste el alta a nadie." : "Todavía no cargaste ningún paciente."}
            </p>
            {!busqueda && !verAltas && (
              <p style={{ ...subtitulo, marginTop: 8 }}>Empezá por el primero: nombre y motivo de consulta alcanzan.</p>
            )}
          </div>
        )}

        <div style={{ borderTop: visibles.length ? "1px solid " + C.linea : "none", marginTop: 8 }}>
          {visibles.map((p) => (
            <button key={p.id} onClick={() => onAbrir(p)} style={fila}>
              <span
                aria-hidden="true"
                style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: C.verdeSuave, color: C.verde,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em",
                }}
              >
                {iniciales(p.nombre)}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                {/* El nombre completo se muestra entero aunque ocupe dos
                    líneas: en 375px "Marta Elena Rodríguez" se cortaba en
                    "Marta Elena Rodríg…" y dos pacientes con el mismo primer
                    apellido quedaban indistinguibles. */}
                <span style={{ display: "block", fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.25, color: C.tinta }}>
                  {p.nombre}
                </span>
                <span style={{ display: "block", fontSize: 14, color: C.tinta2, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.motivo || "Sin motivo de consulta cargado"}
                </span>
              </span>
              <ChevronRight size={18} style={{ color: C.tinta2, flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>

      <BarraAccion>
        <button onClick={onNuevo} style={{ ...boton("primario"), width: "100%" }}>
          <Plus size={18} /> Nuevo paciente
        </button>
      </BarraAccion>
    </div>
  );
}

function Encabezado({ kine, onSalir, onVolver, volverTexto }) {
  return (
    <header
      style={{
        borderBottom: "1px solid " + C.linea,
        background: C.papel,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ ...columna, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 60 }}>
        {onVolver ? (
          <button onClick={onVolver} style={{ ...boton("fantasma"), marginLeft: -8 }}>
            <ArrowLeft size={18} /> {volverTexto || "Pacientes"}
          </button>
        ) : (
          <Marca />
        )}
        {onSalir && (
          <button onClick={onSalir} title="Cerrar sesión" style={{ ...boton("fantasma"), marginRight: -8 }}>
            <span style={{ fontSize: 15 }}>{kine?.nombre || "Salir"}</span>
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  );
}

/** Acción principal anclada abajo: el pulgar la alcanza sin estirar la mano. */
function BarraAccion({ children }) {
  return (
    <div
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20,
        background: C.papel,
        borderTop: "1px solid " + C.linea,
        padding: "12px 0 calc(12px + env(safe-area-inset-bottom))",
      }}
    >
      <div style={columna}>{children}</div>
    </div>
  );
}

// ── alta / edición de paciente ──────────────────────────────────────────────

const VACIO = { nombre: "", telefono: "", email: "", fecha_nacimiento: "", motivo: "", notas: "" };

export function FormPaciente({ inicial, onGuardar, onCancelar }) {
  const [f, setF] = useState({ ...VACIO, ...(inicial || {}), fecha_nacimiento: inicial?.fecha_nacimiento || "" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const editando = Boolean(inicial?.id);
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    if (!f.nombre.trim()) { setError("El nombre del paciente es obligatorio."); return; }
    setError("");
    setGuardando(true);
    try {
      await onGuardar(f);
    } catch (err) {
      setError(err.message || "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={pantalla}>
      <Encabezado onVolver={onCancelar} volverTexto={editando ? "Ficha" : "Pacientes"} />
      <form onSubmit={guardar} style={{ ...columna, paddingTop: 24, paddingBottom: 110 }} data-entra>
        <h1 style={titulo}>{editando ? "Editar ficha" : "Nuevo paciente"}</h1>
        <p style={{ ...subtitulo, marginTop: 10, marginBottom: 26 }}>
          Con el nombre alcanza para empezar. El resto se completa cuando lo tengas.
        </p>

        <Aviso>{error}</Aviso>

        <label style={etiqueta} htmlFor="p-nombre">Nombre y apellido</label>
        <input id="p-nombre" value={f.nombre} onChange={set("nombre")} style={{ ...campo, marginBottom: 18 }} autoComplete="name" />

        <label style={etiqueta} htmlFor="p-motivo">Motivo de consulta</label>
        <input id="p-motivo" value={f.motivo} onChange={set("motivo")} placeholder="Ej: lumbalgia hace tres meses" style={{ ...campo, marginBottom: 18 }} />

        <label style={etiqueta} htmlFor="p-tel">Teléfono</label>
        <input id="p-tel" value={f.telefono} onChange={set("telefono")} inputMode="tel" autoComplete="tel" style={{ ...campo, marginBottom: 18 }} />

        <label style={etiqueta} htmlFor="p-email">Email</label>
        <input id="p-email" value={f.email} onChange={set("email")} type="email" autoComplete="email" style={{ ...campo, marginBottom: 18 }} />

        <label style={etiqueta} htmlFor="p-nac">Fecha de nacimiento</label>
        <input id="p-nac" value={f.fecha_nacimiento || ""} onChange={set("fecha_nacimiento")} type="date" style={{ ...campo, marginBottom: 18 }} />

        <label style={etiqueta} htmlFor="p-notas">Observaciones</label>
        <textarea id="p-notas" value={f.notas} onChange={set("notas")} rows={4} placeholder="Antecedentes, hallazgos, qué mirar la próxima sesión…" style={{ ...campo, resize: "vertical", lineHeight: 1.5 }} />

        <BarraAccion>
          {/* Cancelar va como texto y no como botón con caja: si las dos son
              cajas, "Crear paciente" no entra en una línea en 375px. */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" onClick={onCancelar} style={{ ...boton("fantasma"), flex: "0 0 auto", padding: "12px 14px" }}>Cancelar</button>
            <button type="submit" disabled={guardando} style={{ ...boton("primario"), flex: 1, opacity: guardando ? 0.7 : 1 }}>
              {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear paciente"}
            </button>
          </div>
        </BarraAccion>
      </form>
    </div>
  );
}

// ── editor de un ejercicio ──────────────────────────────────────────────────

const EJ_VACIO = { nombre: "", indicaciones: "", media: "", catalogo_id: null };

/**
 * Un solo flujo, no dos pestañas: se escribe el nombre y, mientras se escribe,
 * aparecen abajo los ejercicios del catálogo permitido que matchean. Si está,
 * se toca y queda cargado con sus indicaciones y su ilustración. Si no está,
 * se sigue escribiendo y lo redacta el armador asistido.
 */
export function EditorEjercicio({ catalogo = [], onGuardar, onCancelar, llamar = llamarAsistente, subir = subirMediaRehab }) {
  const [f, setF] = useState(EJ_VACIO);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(""); // "" | "escribiendo" | "imagen" | "subiendo" | "guardando"
  const [promptImagen, setPromptImagen] = useState("");
  const [elegido, setElegido] = useState(false); // ya se tomó uno del catálogo: no volver a sugerir
  const archivoRef = useRef(null);

  const sugerencias = useMemo(
    () => (elegido || f.nombre.trim().length < 2 ? [] : buscarCatalogoRehab(catalogo, f.nombre, 6)),
    [catalogo, f.nombre, elegido]
  );

  const tomarDelCatalogo = (ej) => {
    setElegido(true);
    setError("");
    setF({
      nombre: ej.nombre_es || ej.nombre_en || "",
      indicaciones: ej.instrucciones_es || "",
      media: ej.gif_url || ej.image || "",
      catalogo_id: ej.id != null ? String(ej.id) : null,
    });
  };

  const escribirIndicaciones = async () => {
    if (!f.nombre.trim()) { setError("Escribí primero el nombre del ejercicio."); return; }
    setError("");
    setOcupado("escribiendo");
    try {
      const ficha = await llamar({ accion: "completar", nombre: f.nombre.trim() });
      setPromptImagen(ficha.prompt_imagen || "");
      setF((v) => ({ ...v, indicaciones: ficha.descripcion || v.indicaciones }));
      return ficha;
    } catch (e) {
      setError(e.message || "No se pudo escribir las indicaciones.");
      return null;
    } finally {
      setOcupado("");
    }
  };

  const generarImagen = async () => {
    if (!f.nombre.trim()) { setError("Escribí primero el nombre del ejercicio."); return; }
    let prompt = promptImagen;
    if (!prompt) {
      const ficha = await escribirIndicaciones();
      if (!ficha) return;
      prompt = ficha.prompt_imagen || "";
      if (!prompt) { setError("El modelo no devolvió con qué dibujar la imagen. Probá de nuevo."); return; }
    }
    setError("");
    setOcupado("imagen");
    try {
      const { url } = await llamar({ accion: "imagen", prompt_imagen: prompt });
      setF((v) => ({ ...v, media: url }));
    } catch (e) {
      setError(e.message || "No se pudo generar la imagen.");
    } finally {
      setOcupado("");
    }
  };

  const subirArchivo = async (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError("El archivo pesa más de 50MB. Grabá un clip más corto: con 10-20 segundos alcanza.");
      return;
    }
    setError("");
    setOcupado("subiendo");
    try {
      const ruta = await subir(file);
      setF((v) => ({ ...v, media: ruta }));
    } catch (e) {
      setError(e.message || "No se pudo subir el archivo.");
    } finally {
      setOcupado("");
    }
  };

  const guardar = async () => {
    if (!f.nombre.trim()) { setError("Falta el nombre del ejercicio."); return; }
    setError("");
    setOcupado("guardando");
    try {
      await onGuardar(f);
    } catch (e) {
      setError(e.message || "No se pudo agregar el ejercicio.");
      setOcupado("");
    }
  };

  return (
    <div style={{ ...ficha, padding: 16, marginTop: 16 }} data-editor-ejercicio>
      <Aviso>{error}</Aviso>

      <label style={etiqueta} htmlFor="ej-nombre">Ejercicio</label>
      <input
        id="ej-nombre"
        value={f.nombre}
        onChange={(e) => { setElegido(false); setF((v) => ({ ...v, nombre: e.target.value, catalogo_id: null })); }}
        placeholder="Ej: movilidad de tobillo con banda"
        autoComplete="off"
        style={campo}
      />

      {sugerencias.length > 0 && (
        <div style={{ border: "1px solid " + C.linea, borderRadius: 10, marginTop: 8, overflow: "hidden" }}>
          <p style={{ ...etiqueta, margin: 0, padding: "10px 14px 6px", fontSize: 12 }}>Del catálogo</p>
          {sugerencias.map((ej) => (
            <button
              key={ej.id}
              onClick={() => tomarDelCatalogo(ej)}
              style={{ ...fila, padding: "12px 14px", borderBottom: "1px solid " + C.linea, gap: 10 }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 600, color: C.tinta }}>{ej.nombre_es || ej.nombre_en}</span>
                <span style={{ display: "block", fontSize: 13, color: C.tinta2, marginTop: 2 }}>{ej.equipment_es}</span>
              </span>
              <Plus size={17} style={{ color: C.verde, flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}

      <label style={{ ...etiqueta, marginTop: 18 }} htmlFor="ej-ind">Indicaciones</label>
      <textarea
        id="ej-ind"
        value={f.indicaciones}
        onChange={(e) => setF((v) => ({ ...v, indicaciones: e.target.value }))}
        rows={5}
        placeholder="Cómo se hace, cuántas veces, qué no tiene que doler…"
        style={{ ...campo, resize: "vertical", lineHeight: 1.5 }}
      />

      {/* Apiladas y a lo ancho, no en fila: en 375px los tres rótulos se
          partían en dos renglones cada uno y la fila quedaba ilegible. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <button onClick={escribirIndicaciones} disabled={Boolean(ocupado)} style={{ ...boton("secundario"), justifyContent: "flex-start", padding: "12px 16px", fontSize: 15 }}>
          <Sparkles size={16} /> {ocupado === "escribiendo" ? "Escribiendo…" : "Escribilas por mí"}
        </button>
        <button onClick={generarImagen} disabled={Boolean(ocupado)} style={{ ...boton("secundario"), justifyContent: "flex-start", padding: "12px 16px", fontSize: 15 }}>
          <Sparkles size={16} /> {ocupado === "imagen" ? "Dibujando…" : "Crear la imagen"}
        </button>
        <button onClick={() => !ocupado && archivoRef.current?.click()} disabled={Boolean(ocupado)} style={{ ...boton("secundario"), justifyContent: "flex-start", padding: "12px 16px", fontSize: 15 }}>
          <Camera size={16} /> {ocupado === "subiendo" ? "Subiendo…" : "Sacar foto o video"}
        </button>
        <input
          ref={archivoRef} type="file" accept="image/*,video/*" capture="environment" style={{ display: "none" }}
          onChange={(e) => { subirArchivo(e.target.files?.[0]); e.target.value = ""; }}
        />
      </div>

      {f.media && (
        <div style={{ marginTop: 14 }}>
          <Media valor={f.media} />
          <button onClick={() => setF((v) => ({ ...v, media: "" }))} style={{ ...boton("peligro"), marginTop: 8, padding: "10px 14px", fontSize: 15 }}>
            <X size={16} /> Quitar
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
        <button onClick={onCancelar} style={{ ...boton("fantasma"), flex: "0 0 auto", padding: "12px 14px" }}>Cancelar</button>
        <button onClick={guardar} disabled={Boolean(ocupado)} style={{ ...boton("primario"), flex: 1, opacity: ocupado ? 0.7 : 1 }}>
          <Check size={18} /> {ocupado === "guardando" ? "Agregando…" : "Agregar"}
        </button>
      </div>
    </div>
  );
}

// ── ficha del paciente ──────────────────────────────────────────────────────

export function FichaPaciente({
  paciente, ejercicios, catalogo, cargando, error,
  onVolver, onEditar, onAlta, onAgregar, onBorrarEjercicio,
  llamar, subir,
}) {
  const [agregando, setAgregando] = useState(false);
  const [abierto, setAbierto] = useState(null);

  return (
    <div style={pantalla}>
      <Encabezado onVolver={onVolver} />

      <div style={{ ...columna, paddingTop: 24, paddingBottom: 110 }} data-entra>
        <h1 style={titulo}>{paciente.nombre}</h1>
        {paciente.motivo && <p style={{ ...subtitulo, marginTop: 10 }}>{paciente.motivo}</p>}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "18px 0 26px" }}>
          <button onClick={onEditar} style={{ ...boton("secundario"), padding: "10px 16px", fontSize: 15 }}>Editar ficha</button>
          <button onClick={() => onAlta(!paciente.activo)} style={{ ...boton("secundario"), padding: "10px 16px", fontSize: 15 }}>
            {paciente.activo ? "Dar el alta" : "Volver a tratamiento"}
          </button>
        </div>

        {(paciente.telefono || paciente.email || paciente.notas) && (
          <div style={{ ...ficha, marginBottom: 26 }}>
            {paciente.telefono && <p style={{ margin: "0 0 6px", fontSize: 16 }}>{paciente.telefono}</p>}
            {paciente.email && <p style={{ margin: "0 0 6px", fontSize: 16, wordBreak: "break-all" }}>{paciente.email}</p>}
            {paciente.notas && <p style={{ margin: paciente.telefono || paciente.email ? "12px 0 0" : 0, fontSize: 16, lineHeight: 1.55, color: C.tinta2, whiteSpace: "pre-wrap" }}>{paciente.notas}</p>}
          </div>
        )}

        <h2 style={{ ...titulo, fontSize: 24, marginBottom: 4 }}>Ejercicios</h2>
        <p style={{ ...subtitulo, marginTop: 0, marginBottom: 14, fontSize: 15 }}>
          {cargando ? "Cargando…" : ejercicios.length === 0 ? "Todavía no le diste ninguno." : `${ejercicios.length} asignado${ejercicios.length === 1 ? "" : "s"}`}
        </p>

        <Aviso>{error}</Aviso>

        <div style={{ borderTop: ejercicios.length ? "1px solid " + C.linea : "none" }}>
          {ejercicios.map((ej, i) => {
            const expandido = abierto === ej.id;
            return (
              <div key={ej.id} style={{ borderBottom: "1px solid " + C.linea }}>
                <button
                  onClick={() => setAbierto(expandido ? null : ej.id)}
                  aria-expanded={expandido}
                  style={{ ...fila, borderBottom: "none" }}
                >
                  <span aria-hidden="true" style={{ fontSize: 15, fontWeight: 700, color: C.tinta2, width: 22, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>{ej.nombre}</span>
                  <ChevronRight
                    size={18}
                    style={{ color: C.tinta2, flexShrink: 0, transform: expandido ? "rotate(90deg)" : "none", transition: "transform 0.2s ease-out" }}
                  />
                </button>
                {expandido && (
                  <div style={{ padding: "0 4px 18px 40px" }}>
                    {ej.media && <div style={{ marginBottom: 12 }}><Media valor={ej.media} /></div>}
                    {ej.indicaciones && <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: C.tinta2, whiteSpace: "pre-wrap" }}>{ej.indicaciones}</p>}
                    <button onClick={() => onBorrarEjercicio(ej)} style={{ ...boton("peligro"), marginTop: 14, padding: "10px 14px", fontSize: 15 }}>
                      <Trash2 size={16} /> Sacar del plan
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {agregando && (
          <EditorEjercicio
            catalogo={catalogo}
            llamar={llamar}
            subir={subir}
            onCancelar={() => setAgregando(false)}
            onGuardar={async (ej) => { await onAgregar(ej); setAgregando(false); }}
          />
        )}
      </div>

      {!agregando && (
        <BarraAccion>
          <button onClick={() => setAgregando(true)} style={{ ...boton("primario"), width: "100%" }}>
            <Plus size={18} /> Agregar ejercicio
          </button>
        </BarraAccion>
      )}
    </div>
  );
}

// ── la app ──────────────────────────────────────────────────────────────────

export default function App() {
  const [kine, setKine] = useState(null);
  const [arrancando, setArrancando] = useState(true);
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [vista, setVista] = useState({ nombre: "lista" }); // lista | nuevo | ficha | editar
  const [ejercicios, setEjercicios] = useState([]);
  const [catalogo, setCatalogo] = useState([]);

  // Sesión: la autoridad es kine_actual() en la base, no el localStorage.
  useEffect(() => {
    recuperarSesionKine()
      .then(setKine)
      .catch(() => setKine(null))
      .finally(() => setArrancando(false));
  }, []);

  useEffect(() => {
    if (!kine) return;
    setCargando(true);
    setError("");
    listarPacientes()
      .then(setPacientes)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
    cargarCatalogoRehab().then(setCatalogo);
  }, [kine]);

  const pacienteActual = pacientes.find((p) => p.id === vista.id) || null;

  useEffect(() => {
    if (!pacienteActual) { setEjercicios([]); return; }
    let vivo = true;
    setCargando(true);
    listarEjerciciosPaciente(pacienteActual.id)
      .then((e) => vivo && setEjercicios(e))
      .catch((e) => vivo && setError(e.message))
      .finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, [pacienteActual?.id]);

  if (arrancando) {
    return (
      <div style={{ ...pantalla, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <EstilosGlobales />
        <Marca tam={22} />
      </div>
    );
  }

  if (!kine) {
    return (
      <>
        <EstilosGlobales />
        <PantallaLogin onEntrar={async (u, c) => setKine(await loginKine(u, c))} />
      </>
    );
  }

  const salir = async () => {
    await salirKine();
    setKine(null);
    setPacientes([]);
    setVista({ nombre: "lista" });
  };

  const guardarPaciente = async (form) => {
    if (vista.nombre === "editar") {
      const actualizado = await actualizarPaciente(vista.id, form);
      setPacientes((ps) => ps.map((p) => (p.id === actualizado.id ? actualizado : p)));
      setVista({ nombre: "ficha", id: actualizado.id });
    } else {
      const nuevo = await crearPaciente(kine.id, form);
      setPacientes((ps) => [...ps, nuevo]);
      setVista({ nombre: "ficha", id: nuevo.id });
    }
  };

  const contenido = () => {
    if (vista.nombre === "nuevo" || vista.nombre === "editar") {
      return (
        <FormPaciente
          inicial={vista.nombre === "editar" ? pacienteActual : null}
          onGuardar={guardarPaciente}
          onCancelar={() => setVista(vista.nombre === "editar" ? { nombre: "ficha", id: vista.id } : { nombre: "lista" })}
        />
      );
    }

    if (vista.nombre === "ficha" && pacienteActual) {
      return (
        <FichaPaciente
          paciente={pacienteActual}
          ejercicios={ejercicios}
          catalogo={catalogo}
          cargando={cargando}
          error={error}
          onVolver={() => { setError(""); setVista({ nombre: "lista" }); }}
          onEditar={() => setVista({ nombre: "editar", id: pacienteActual.id })}
          onAlta={async (activo) => {
            const p = await archivarPaciente(pacienteActual.id, activo);
            setPacientes((ps) => ps.map((x) => (x.id === p.id ? p : x)));
          }}
          onAgregar={async (ej) => {
            const nuevo = await agregarEjercicioPaciente(pacienteActual.id, ej, ejercicios.length);
            setEjercicios((es) => [...es, nuevo]);
          }}
          onBorrarEjercicio={async (ej) => {
            if (!window.confirm(`¿Sacar "${ej.nombre}" del plan de ${pacienteActual.nombre}?`)) return;
            await eliminarEjercicioPaciente(ej.id);
            setEjercicios((es) => es.filter((e) => e.id !== ej.id));
          }}
        />
      );
    }

    return (
      <ListaPacientes
        kine={kine}
        pacientes={pacientes}
        cargando={cargando}
        error={error}
        onAbrir={(p) => { setError(""); setVista({ nombre: "ficha", id: p.id }); }}
        onNuevo={() => setVista({ nombre: "nuevo" })}
        onSalir={salir}
      />
    );
  };

  return (
    <>
      <EstilosGlobales />
      {contenido()}
    </>
  );
}
