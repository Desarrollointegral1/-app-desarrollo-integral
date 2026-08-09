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
import { setVuelta, resumenVueltas } from "../src/utils/pesos.js";

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
          <EjercicioEditor items={items} onChange={setItems} showVideo biblioteca={BIBLIOTECA} />
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
