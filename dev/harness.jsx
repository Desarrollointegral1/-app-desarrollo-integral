// ============================================================
// BANCO DE PRUEBAS — solo desarrollo, nunca se publica
// ============================================================
// Para qué existe (pedido de Lucas, 2026-08-09: "creá un ambiente de prueba
// así entrás y probás toda la app"): el panel admin vive detrás de un login
// con PIN, así que cualquier cambio de UI se verificaba a ciegas o pidiéndole
// a Lucas que entrara. Esto monta los componentes REALES de App.jsx con datos
// falsos, sin login y sin tocar la base — se abre, se toca y se ve.
//
// No es una copia de los componentes: importa los mismos que usa la app en
// producción. Si acá se ve bien, en la app se ve bien.
//
// Cómo se usa:
//   npm run dev  →  http://localhost:5173/dev/harness.html
//
// Nunca entra al bundle de producción: vite.config.js solo declara index.html
// como entrada, y esta carpeta no se importa desde ningún lado de la app.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { EjercicioEditor, DiasEditor, GlobalStyles } from "../App.jsx";
import { SIN_GIF } from "../src/utils/ejerciciosMedia.js";
import ItemCard from "../src/components/ItemCard.jsx";
import AsistenteEjercicio from "../src/components/AsistenteEjercicio.jsx";
import { setVuelta, resumenVueltas } from "../src/utils/pesos.js";

// ── ARMADOR ASISTIDO: llamadas MOCKEADAS (2026-08-09) ──────────────────
// El harness no tiene sesión de Supabase, así que el endpoint real
// (/api/ejercicio-asistido) devolvería 401 siempre y no se podría ver ni un
// estado. Se mockea la función que hace la llamada — no fetch global — porque
// EjercicioEditor y AsistenteEjercicio la reciben por prop justamente para esto.
// Los errores replican TEXTUALMENTE lo que arma llamarAsistente() con cada
// código, que es lo único que llega a la pantalla.
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Imagen de mentira embebida (data URI): así el estado "imagen generada" se ve
// sin red y sin depender del bucket de Supabase.
const IMAGEN_FALSA =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#fff"/>` +
      `<circle cx="90" cy="70" r="26" fill="#c0392b"/><rect x="76" y="100" width="28" height="70" fill="#e08b84"/>` +
      `<circle cx="230" cy="80" r="26" fill="#c0392b"/><rect x="216" y="110" width="28" height="60" fill="#e08b84"/>` +
      `<text x="160" y="192" font-size="12" text-anchor="middle" fill="#666">ilustración de prueba</text></svg>`
  );

const ERROR_401 = "Se cayó la sesión. Salí y volvé a entrar a la app para seguir usando el armador.";
const ERROR_501 =
  "Falta la variable de entorno GEMINI_API_KEY (o GOOGLE_API_KEY) en Vercel. " +
  "Cargala en el dashboard del proyecto (Settings → Environment Variables, entorno Production) " +
  "con una key de https://aistudio.google.com/apikey y la generación de imágenes queda operativa.";

function mockLlamar(modo) {
  return async ({ accion, texto, nombre }) => {
    await espera(accion === "sugerir" ? 700 : 600); // se ve el estado "cargando"
    if (modo === "401") throw new Error(ERROR_401);
    if (modo === "501" && accion === "imagen") throw new Error(ERROR_501);
    if (accion === "sugerir")
      return {
        sugerencias: [
          { nombre: "Sentadilla búlgara", origen: "catalogo", catalogo_id: "12", tiene_imagen: true },
          { nombre: `${texto} con mancuernas`, origen: "nuevo", catalogo_id: null, tiene_imagen: false },
          { nombre: `${texto} en multipower`, origen: "nuevo", catalogo_id: null, tiene_imagen: false },
        ],
      };
    if (accion === "completar")
      return {
        nombre,
        descripcion:
          "Ponete de pie con los pies al ancho de las caderas y la pierna de atrás apoyada sobre un banco. " +
          "Bajá flexionando la rodilla de adelante hasta que el muslo quede paralelo al piso, con el torso apenas inclinado. " +
          "Hacé una pausa breve abajo. Subí empujando con el talón de adelante hasta extender la cadera. " +
          "Repetí el número de repeticiones deseado y después cambiá de pierna.",
        grupo_di: "Pred. Rodilla",
        target_es: "Cuádriceps",
        equipment_es: "Peso corporal",
        prompt_imagen: "Ilustración anatómica de estudio con dos figuras…",
      };
    return { url: IMAGEN_FALSA, path: "ia-generadas/prueba.png" };
  };
}

async function mockSubirVideo(file) {
  await espera(600);
  return `rehab-media/demo-${(file && file.name) || "video.mp4"}`;
}

// Panel del armador: se monta el bloque solo (sin abrir el editor) para poder
// ver de un vistazo el estado inicial —los dos chips apagados y NADA desplegado
// abajo, que es el punto del pedido de Lucas— y cada opción al elegirla.
function AsistenteDemo() {
  const [modo, setModo] = useState("ok");
  const [form, setForm] = useState({ nombre: "Sentadilla búlgara con banco", desc: "", gif: "", video: "" });
  const btn = (activo) => ({
    minHeight: 44, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13,
    background: activo ? "#fff" : "#1c1c1c", color: activo ? "#111" : "#bbb", border: "1px solid #343434",
  });
  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <button style={btn(modo === "ok")} onClick={() => setModo("ok")}>Todo bien</button>
        <button style={btn(modo === "501")} onClick={() => setModo("501")}>Error 501 (falta la clave)</button>
        <button style={btn(modo === "401")} onClick={() => setModo("401")}>Error 401 (sesión caída)</button>
      </div>
      <input
        value={form.nombre}
        onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
        style={{ width: "100%", boxSizing: "border-box", minHeight: 44, marginBottom: 8, background: "#1c1c1c", color: "#f2f2f2", border: "1px solid #343434", borderRadius: 8, padding: "10px 12px", fontSize: 16 }}
      />
      <textarea
        value={form.desc}
        onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
        rows={4}
        placeholder="La descripción cae acá y se puede editar a mano."
        style={{ width: "100%", boxSizing: "border-box", marginBottom: 8, background: "#1c1c1c", color: "#f2f2f2", border: "1px solid #343434", borderRadius: 8, padding: "10px 12px", fontSize: 16 }}
      />
      <AsistenteEjercicio key={modo} form={form} setForm={setForm} llamar={mockLlamar(modo)} subirArchivo={mockSubirVideo} />
    </>
  );
}

// Ejercicios de prueba. Se eligieron a propósito para cubrir los tres casos
// de GIF que hay que poder distinguir de un vistazo:
//   1. GIF que resuelve por nombre (hip thrust está en el mapa de media)
//   2. GIF sacado a mano (sentinel SIN_GIF) → tiene que quedar SIN imagen
//   3. Ejercicio sin GIF de ningún tipo
const ITEMS_INICIALES = [
  { id: "ej-1", nombre: "Press Militar parado con Barra", desc: "Barra a la altura de las clavículas. Empujá hasta extender los codos sin arquear la lumbar.", codigo: "H1", gif: "" },
  { id: "ej-2", nombre: "Sentadilla con barra", desc: "Bajá hasta que los muslos queden paralelos al piso.", codigo: "R1", gif: "" },
  { id: "ej-3", nombre: "Hip thrust", desc: "Apoyá la espalda alta en el banco y empujá con los talones.", codigo: "G1", gif: "" },
  { id: "ej-4", nombre: "Peso muerto con Barra", desc: "Bisagra de cadera, espalda recta, barra pegada a las piernas.", codigo: "C1", gif: SIN_GIF },
  { id: "ej-5", nombre: "Ejercicio inventado sin GIF", desc: "Este no tiene GIF por ningún lado.", codigo: "", gif: "" },
];

const DIAS_INICIALES = [
  { dia: "Día 1", subtitulo: "Bilateral", ejercicios: ITEMS_INICIALES.slice(0, 3) },
  { dia: "Día 2", subtitulo: "Unilateral", ejercicios: ITEMS_INICIALES.slice(3) },
];

const BIBLIOTECA = [
  { nombre: "Dominadas", desc: "Agarre prono, ancho de hombros.", codigo: "D1", gif: "" },
  { nombre: "Pecho plano", desc: "Press de banca plano con barra.", codigo: "P1", gif: "" },
];

function Panel({ titulo, children, nota }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ color: "#fff", fontSize: 15, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{titulo}</h2>
      {nota && <p style={{ color: "#8b8b8b", fontSize: 12, marginTop: 0, marginBottom: 12, lineHeight: 1.5 }}>{nota}</p>}
      {children}
    </section>
  );
}

// Vista del alumno con el registro de peso por vuelta. El segundo ejercicio
// arranca con un dato en formato VIEJO (un número suelto) a propósito: hay que
// poder confirmar de un vistazo que los registros que ya existen se siguen
// leyendo bien y no se pierden.
function VueltasDemo() {
  const [vueltas, setVueltas] = useState({ "a": [60, 62.5], "b": 40 });
  const cambiar = (id) => (serie, peso) =>
    setVueltas((v) => {
      const nuevo = setVuelta(v[id], serie, peso);
      const out = { ...v };
      if (nuevo == null) delete out[id];
      else out[id] = nuevo;
      return out;
    });
  return (
    <>
      <ItemCard
        nombre="Sentadilla con barra" numero={1}
        desc="Bajá hasta que los muslos queden paralelos al piso, con la espalda recta."
        showPeso semana={{ series: 4, reps: 8, intensidad: "75%" }} seriesPlan={4}
        vueltas={vueltas.a} onVueltaChange={cambiar("a")}
        pesoAnterior={{ peso: 60, fecha: "02/08" }} historial={[]}
      />
      <ItemCard
        nombre="Hip thrust" numero={2}
        desc="Apoyá la espalda alta en el banco y empujá con los talones."
        showPeso semana={{ series: 4, reps: 8, intensidad: "75%" }} seriesPlan={4}
        vueltas={vueltas.b} onVueltaChange={cambiar("b")}
        historial={[]}
      />
      <div style={{ color: "#9ae6b4", fontSize: 12, marginTop: 10, fontFamily: "monospace" }}>
        Sentadilla: [{resumenVueltas(vueltas.a) || "vacío"}] · Hip thrust: [{resumenVueltas(vueltas.b) || "vacío"}]
      </div>
    </>
  );
}

function Harness() {
  const [items, setItems] = useState(ITEMS_INICIALES);
  const [dias, setDias] = useState(DIAS_INICIALES);

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", padding: "28px 20px 80px", fontFamily: "system-ui, sans-serif" }}>
      <GlobalStyles />
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ color: "#fff", fontSize: 20, marginTop: 0 }}>Banco de pruebas · Desarrollo Integral</h1>
        <p style={{ color: "#8b8b8b", fontSize: 13, lineHeight: 1.6 }}>
          Los componentes reales del panel admin, con datos falsos y sin login.
          Lo que se ve acá es lo que ve el admin en la app.
        </p>

        <Panel
          titulo="Editor de ejercicios"
          nota="Probar acá: (1) tocar el nombre pliega y despliega la ficha; (2) agarrar el ⠿ y arrastrar reordena; (3) el lápiz abre el editor, que tiene el botón para dejar el ejercicio sin GIF; (4) Peso muerto arranca con el GIF sacado a propósito y no debe mostrar ninguno."
        >
          <EjercicioEditor
            items={items}
            onChange={setItems}
            showVideo
            biblioteca={BIBLIOTECA}
            llamarAsistente={mockLlamar("ok")}
            subirMedia={mockSubirVideo}
          />
        </Panel>

        <Panel
          titulo="Armador asistido"
          nota="Arranca con los dos chips APAGADOS y nada desplegado abajo: sólo al tocar «Crear imagen» aparece el botón Generar, y al tocar «Subir video» el casillero del archivo. «Escribila por mí» rellena la descripción de arriba (queda editable). Con los botones de error se ve qué le llega al profe cuando falta la clave de Google (501) o se le cayó la sesión (401)."
        >
          <AsistenteDemo />
        </Panel>

        <Panel
          titulo="Editor de días (cambio de día)"
          nota="Probar acá: abrir un ejercicio del Día 1 (con el lápiz o desplegándolo) y cambiar al Día 2. El ejercicio abierto tiene que cerrarse solo."
        >
          <DiasEditor dias={dias} onChange={setDias} biblioteca={BIBLIOTECA} />
        </Panel>

        <Panel
          titulo="Vista del alumno · peso por vuelta"
          nota="El plan pide 4 series, así que hay 4 casilleros. Tocar una vuelta la selecciona y el − / + de arriba edita esa. El primero arranca con 2 vueltas ya cargadas; el segundo tiene un registro viejo (un solo número) y debe seguir viéndose bien."
        >
          <VueltasDemo />
        </Panel>

        <Panel titulo="Estado actual (para verificar que los cambios se aplican)">
          <pre style={{ background: "#141414", color: "#9ae6b4", padding: 12, borderRadius: 8, fontSize: 11, overflow: "auto", maxHeight: 260 }}>
            {JSON.stringify(items.map(({ id, nombre, gif }) => ({ id, nombre, gif: gif === SIN_GIF ? "<SIN GIF a propósito>" : gif || "<automático por nombre>" })), null, 2)}
          </pre>
        </Panel>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Harness />);
