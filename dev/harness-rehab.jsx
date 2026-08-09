// ============================================================================
// BANCO DE PRUEBAS — REHAB INTEGRAL (2026-08-09) · solo desarrollo
// ============================================================================
// Rehab Integral vive detrás del login de la kinesióloga, así que sin esto
// cualquier cambio de pantalla se verificaría a ciegas. Acá se montan las
// pantallas REALES de rehab/App.jsx con pacientes y ejercicios falsos, sin
// login, sin base y sin llamar al modelo.
//
//   npm run dev  →  http://localhost:5173/dev/harness-rehab.html
//   node dev/medir-mobile.mjs 375 harness-rehab
//
// Cada pantalla va dentro de un marco con `transform` propio: eso convierte al
// marco en bloque contenedor de los `position: fixed`, así las barras de acción
// de cada pantalla se quedan en la suya en vez de apilarse todas abajo del todo.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  EstilosGlobales, PantallaLogin, ListaPacientes, FormPaciente, FichaPaciente, EditorEjercicio,
} from "../rehab/App.jsx";
import { C, columna, titulo, subtitulo } from "../rehab/theme.js";

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const KINE = { id: "kine-1", nombre: "Griselda" };

const PACIENTES = [
  { id: "p1", nombre: "Marta Elena Rodríguez", motivo: "Lumbalgia hace tres meses", telefono: "11 5555 1234", email: "marta@ejemplo.com", notas: "Trabaja sentada 9 horas. Tolera bien la carga isométrica; evitar flexión lumbar cargada las primeras cuatro semanas.", activo: true },
  { id: "p2", nombre: "Jorge Pérez", motivo: "Post operatorio de manguito rotador (izquierdo)", telefono: "", email: "", notas: "", activo: true },
  { id: "p3", nombre: "Ana", motivo: "", telefono: "", email: "", notas: "", activo: true },
  { id: "p4", nombre: "Héctor Suárez", motivo: "Esguince de tobillo grado II", telefono: "", email: "", notas: "", activo: false },
];

const EJERCICIOS = [
  { id: "e1", nombre: "Movilidad de tobillo con banda", indicaciones: "Anclá la banda a algo firme y pasala por delante del tobillo. Llevá la rodilla por encima de los dedos del pie sin despegar el talón del piso. Hacé 15 repeticiones lentas de cada lado, dos veces por día. No tiene que doler adelante del tobillo.", media: "" },
  { id: "e2", nombre: "Puente de glúteos", indicaciones: "Acostada boca arriba, rodillas flexionadas y pies apoyados al ancho de las caderas. Empujá con los talones y subí la cadera hasta alinear rodilla, cadera y hombro. Pausá dos segundos arriba y bajá lento.", media: "" },
  { id: "e3", nombre: "Gato-camello", indicaciones: "", media: "" },
];

// Recorte del catálogo real: todos pasan el filtro de Griselda (peso corporal,
// banda, rodillo). Sirve para probar el buscador del editor de ejercicios.
const CATALOGO = [
  { id: "c1", nombre_es: "Movilidad de tobillo con banda", equipment_es: "Banda", instrucciones_es: "Anclá la banda y llevá la rodilla por encima del pie sin levantar el talón." },
  { id: "c2", nombre_es: "Movilidad torácica en cuadrupedia", equipment_es: "Peso corporal", instrucciones_es: "En cuatro apoyos, mano en la nuca, abrí el codo hacia el techo." },
  { id: "c3", nombre_es: "Puente de glúteos", equipment_es: "Peso corporal", instrucciones_es: "Empujá con los talones hasta alinear rodilla, cadera y hombro." },
  { id: "c4", nombre_es: "Abducción de cadera con banda", equipment_es: "Banda elástica", instrucciones_es: "Banda por encima de las rodillas, abrí sin rotar la pelvis." },
  { id: "c5", nombre_es: "Liberación de glúteo con rodillo", equipment_es: "Rodillo", instrucciones_es: "Sentate sobre el rodillo y rodá despacio buscando el punto sensible." },
  { id: "c6", nombre_es: "Plancha frontal", equipment_es: "Peso corporal", instrucciones_es: "Antebrazos y punta de pies, cuerpo en línea, sin hundir la cadera." },
];

const IMAGEN_FALSA =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#fff"/>` +
      `<circle cx="90" cy="70" r="26" fill="#12433C"/><rect x="76" y="100" width="28" height="70" fill="#7FA69C"/>` +
      `<circle cx="230" cy="80" r="26" fill="#12433C"/><rect x="216" y="110" width="28" height="60" fill="#7FA69C"/>` +
      `<text x="160" y="192" font-size="12" text-anchor="middle" fill="#635C50">ilustración de prueba</text></svg>`
  );

function mockLlamar(modo) {
  return async ({ accion }) => {
    await espera(500);
    if (modo === "401") throw new Error("Se cayó la sesión. Salí y volvé a entrar a la app para seguir usando el armador.");
    if (accion === "completar")
      return {
        descripcion:
          "Acostada boca arriba con las rodillas flexionadas y los pies apoyados al ancho de las caderas. " +
          "Empujá con los talones y subí la cadera hasta alinear rodilla, cadera y hombro, sin arquear la zona lumbar. " +
          "Sostené dos segundos arriba y bajá lento hasta apoyar.",
        prompt_imagen: "Ilustración anatómica de estudio con dos figuras…",
      };
    return { url: IMAGEN_FALSA };
  };
}

async function mockSubir(file) {
  await espera(400);
  return "https://ejemplo.local/" + ((file && file.name) || "media.jpg");
}

function Marco({ titulo: t, nota, alto = 720, children }) {
  return (
    <section data-panel style={{ marginBottom: 44 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: C.tinta, marginBottom: 6 }}>{t}</h2>
      {nota && <p style={{ fontSize: 14, lineHeight: 1.5, color: C.tinta2, marginBottom: 12 }}>{nota}</p>}
      <div style={{ transform: "translate(0)", position: "relative", height: alto, overflow: "auto", border: "1px solid " + C.linea2, borderRadius: 14 }}>
        {children}
      </div>
    </section>
  );
}

function ListaDemo() {
  const [vacia, setVacia] = useState(false);
  return (
    <>
      <button onClick={() => setVacia((v) => !v)} style={{ marginBottom: 10, minHeight: 40, padding: "8px 14px", borderRadius: 8, border: "1px solid " + C.linea2, background: C.hoja, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
        {vacia ? "Ver con pacientes" : "Ver el estado vacío"}
      </button>
      <div style={{ transform: "translate(0)", position: "relative", height: 720, overflow: "auto", border: "1px solid " + C.linea2, borderRadius: 14 }}>
        <ListaPacientes
          kine={KINE}
          pacientes={vacia ? [] : PACIENTES}
          cargando={false}
          error=""
          onAbrir={(p) => alert("Abrir " + p.nombre)}
          onNuevo={() => alert("Nuevo paciente")}
          onSalir={() => alert("Salir")}
        />
      </div>
    </>
  );
}

function EditorDemo() {
  const [modo, setModo] = useState("ok");
  const btn = (activo) => ({
    minHeight: 40, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontFamily: "inherit",
    background: activo ? C.verde : C.hoja, color: activo ? "#fff" : C.tinta, border: "1px solid " + (activo ? C.verde : C.linea2),
  });
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button style={btn(modo === "ok")} onClick={() => setModo("ok")}>Todo bien</button>
        <button style={btn(modo === "401")} onClick={() => setModo("401")}>Sesión caída (401)</button>
      </div>
      <div style={{ background: C.papel, padding: 16, border: "1px solid " + C.linea2, borderRadius: 14 }}>
        <EditorEjercicio
          key={modo}
          catalogo={CATALOGO}
          llamar={mockLlamar(modo)}
          subir={mockSubir}
          onGuardar={async (ej) => alert("Agregar: " + JSON.stringify(ej, null, 2))}
          onCancelar={() => alert("Cancelar")}
        />
      </div>
    </>
  );
}

function Harness() {
  return (
    <div style={{ background: "#E7E1D7", minHeight: "100vh", padding: "28px 0 80px" }}>
      <EstilosGlobales />
      <div style={{ ...columna, maxWidth: 560 }}>
        <h1 style={{ ...titulo, fontSize: 28 }}>Banco de pruebas · Rehab Integral</h1>
        <p style={{ ...subtitulo, marginTop: 10, marginBottom: 34 }}>
          Las pantallas reales de la app de Griselda, con pacientes falsos y sin login.
        </p>

        <Marco titulo="Login" nota="La puerta de entrada. Un entrenador que entre con su PIN correcto tiene que ver el error de que ésta no es su app." alto={640}>
          <PantallaLogin onEntrar={async () => { await espera(600); throw new Error("Este usuario no es de rehabilitación. Rehab Integral es la app de kinesiología."); }} />
        </Marco>

        <section data-panel style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: C.tinta, marginBottom: 6 }}>Lista de pacientes</h2>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: C.tinta2, marginBottom: 12 }}>
            Buscador, filtro de altas y la acción principal anclada abajo. Probar también el estado vacío.
          </p>
          <ListaDemo />
        </section>

        <Marco titulo="Ficha del paciente" nota="Tocar un ejercicio lo despliega con sus indicaciones. «Agregar ejercicio» abre el editor abajo de todo." alto={780}>
          <FichaPaciente
            paciente={PACIENTES[0]}
            ejercicios={EJERCICIOS}
            catalogo={CATALOGO}
            cargando={false}
            error=""
            onVolver={() => alert("Volver")}
            onEditar={() => alert("Editar ficha")}
            onAlta={() => alert("Alta")}
            onAgregar={async (ej) => alert("Agregar " + ej.nombre)}
            onBorrarEjercicio={(ej) => alert("Borrar " + ej.nombre)}
            llamar={mockLlamar("ok")}
            subir={mockSubir}
          />
        </Marco>

        <Marco titulo="Ficha sin ejercicios" nota="Paciente recién creado: nombre solo, sin motivo, sin teléfono y sin nada asignado." alto={620}>
          <FichaPaciente
            paciente={PACIENTES[2]}
            ejercicios={[]}
            catalogo={CATALOGO}
            cargando={false}
            error=""
            onVolver={() => {}}
            onEditar={() => {}}
            onAlta={() => {}}
            onAgregar={async () => {}}
            onBorrarEjercicio={() => {}}
            llamar={mockLlamar("ok")}
            subir={mockSubir}
          />
        </Marco>

        <Marco titulo="Alta de paciente" nota="Sólo el nombre es obligatorio. Probar guardar vacío para ver el error." alto={780}>
          <FormPaciente onGuardar={async (f) => alert(JSON.stringify(f, null, 2))} onCancelar={() => alert("Cancelar")} />
        </Marco>

        <section data-panel style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: C.tinta, marginBottom: 6 }}>Editor de ejercicio</h2>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: C.tinta2, marginBottom: 12 }}>
            Escribir «movilidad» o «banda» para ver las sugerencias del catálogo permitido; tocar una la carga con sus indicaciones.
            «Escribilas por mí» y «Crear imagen» están mockeados.
          </p>
          <EditorDemo />
        </section>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Harness />);
