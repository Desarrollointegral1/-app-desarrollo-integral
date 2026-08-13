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
import { EjercicioEditor, DiasEditor, GlobalStyles, AdminPanel } from "../App.jsx";
import { SIN_GIF } from "../src/utils/ejerciciosMedia.js";
import ItemCard from "../src/components/ItemCard.jsx";
import CatalogoExplorer from "../src/components/CatalogoExplorer.jsx";
import PlanDelDia from "../src/components/PlanDelDia.jsx";
import AsistenteEjercicio from "../src/components/AsistenteEjercicio.jsx";
import VistaVideoAlumno from "../src/components/VistaVideoAlumno.jsx";
import { setVuelta, resumenVueltas } from "../src/utils/pesos.js";
import { setDetalleVuelta } from "../src/utils/carga.js";
import SelectorPlanDia from "../src/components/SelectorPlanDia.jsx";
import SelectorDiasAlta from "../src/components/SelectorDiasAlta.jsx";
import { agruparVariantes, SIN_PLAN } from "../src/utils/planVariantes.js";

// Copia fiel de `plan_variantes` (2026-08-10): el harness no tiene sesión de
// Supabase y esa tabla solo se lee autenticado, así que los datos van acá
// tal como están en la base — nombres, familias y las descripciones que
// escribió Lucas, que es justamente lo que hay que poder leer en 375px.
const VARIANTES_DEMO = [
  { id: "v-fbb", nombre: "Acondicionamiento físico básico · Full body básico", familia: "full_body_basico", dia_ciclo: null, descripcion: "La sesión de entrada, full body y sin barra: cajón, kettlebell, TRX y banda. También se puede asignar los 3 días; la progresión la marca la periodización." },
  { id: "v-fba", nombre: "Preparación física avanzada · Full body", familia: "full_body_avanzado", dia_ciclo: null, descripcion: "Full body con barra: los seis patrones grandes en una sola sesión. Al ser full body se puede asignar el MISMO día los 3 días de la semana." },
  { id: "v-uni", nombre: "Unilateral", familia: "unilateral", dia_ciclo: null, descripcion: "Full body a un brazo y una pierna: empareja diferencias entre lados y exige el equilibrio sin subir el peso." },
  { id: "v-ppl1", nombre: "PPL · Empuje", familia: "ppl", dia_ciclo: 1, descripcion: "Rutina tradicional de 3 días: Empuje un día, Tracción otro y Piernas el tercero. Base: muscleandstrength.com/workouts/3-day-PPL-workout-for-beginners, con las máquinas cambiadas por peso libre (leg press por sentadilla con barra, búlgaras, zancadas, peso muerto o peso muerto a una pierna)." },
  { id: "v-ppl2", nombre: "PPL · Tracción", familia: "ppl", dia_ciclo: 2, descripcion: "" },
  { id: "v-ppl3", nombre: "PPL · Piernas", familia: "ppl", dia_ciclo: 3, descripcion: "" },
  { id: "v-h21", nombre: "Híbrida 2 días · Empuje + Cadera", familia: "hibrida_2", dia_ciclo: 1, descripcion: "La rutina tradicional separa Empuje un día, Tracción otro y Piernas el tercero. Esta cruza esos cables: el Día 1 mezcla el empuje del tren superior (Pecho) con la bisagra del tren inferior (Cadera), y el Día 2 mezcla la tracción del tren superior (Jalón) con el dominante de rodilla (Cuádriceps)." },
  { id: "v-h22", nombre: "Híbrida 2 días · Tracción + Rodilla", familia: "hibrida_2", dia_ciclo: 2, descripcion: "" },
  { id: "v-h31", nombre: "Híbrida 3 días · Empuje + Peso muerto", familia: "hibrida_3", dia_ciclo: 1, descripcion: "Los días 1 y 2 actúan como un espejo: el primer día empujás con los brazos y traccionás con las piernas (peso muerto); el segundo traccionás con los brazos (jalón) y empujás con las piernas (sentadilla). Al Día 3 (Hombro, Brazo, Glúteo) se lo llama Día de Remate, de Estética o de hipertrofia sarcoplasmática: se enfoca en los grupos que dan aspecto atlético (hombros redondos, brazos tonificados y glúteos), dejando descansar los músculos grandes como la espalda y el pecho." },
  { id: "v-h32", nombre: "Híbrida 3 días · Jalón + Sentadilla", familia: "hibrida_3", dia_ciclo: 2, descripcion: "" },
  { id: "v-h33", nombre: "Híbrida 3 días · Remate (hombro, brazo, glúteo)", familia: "hibrida_3", dia_ciclo: 3, descripcion: "" },
];

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

// ── PANTALLA "SOLO VIDEO" (2026-08-09) ────────────────────────────────
// Video de mentira embebido (data URI, 2 KB, generado con ffmpeg): la
// pantalla se prueba sin red y sin sesión de Supabase. useSignedUrl deja
// pasar tal cual todo lo que empiece con data: o http:, así que estos tres
// valores cubren los tres estados sin tocar el bucket.
const VIDEO_FALSO =
  "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAPjbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAACR4AAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAw10cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAACR4AAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAMAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAkeAAAQAAABAAAAAAKFbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAwAAAAcABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACMG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAfBzdGJsAAAAwHN0c2QAAAAAAAAAAQAAALBhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAMAAkABIAAAASAAAAAAAAAABFUxhdmM2Mi4yOC4xMDIgbGlieDI2NAAAAAAAAAAAAAAAGP//AAAANmF2Y0MBZAAL/+EAGWdkAAus2UME7ARAAAADAEAAAAMDA8UKZYABAAZo6+PLIsD9+PgAAAAAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAADK4AAAAAAAAAGHN0dHMAAAAAAAAAAQAAAA4AAAgAAAAAFHN0c3MAAAAAAAAAAQAAAAEAAACAY3R0cwAAAAAAAAAOAAAAAQAAEAAAAAABAAAoAAAAAAEAABAAAAAAAQAAAAAAAAABAAAIAAAAAAEAACgAAAAAAQAAEAAAAAABAAAAAAAAAAEAAAgAAAAAAQAAKAAAAAABAAAQAAAAAAEAAAAAAAAAAQAACAAAAAABAAAQAAAAABxzdHNjAAAAAAAAAAEAAAABAAAADgAAAAEAAABMc3RzegAAAAAAAAAAAAAADgAAAugAAAAQAAAADQAAAA0AAAANAAAAFgAAAA8AAAANAAAADQAAABYAAAAPAAAADQAAAA0AAAAWAAAAFHN0Y28AAAAAAAAAAQAABBMAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjYyLjEyLjEwMgAAAAhmcmVlAAADu21kYXQAAAKtBgX//6ncRem95tlIt5Ys2CDZI+7veDI2NCAtIGNvcmUgMTY1IHIzMjIzIDA0ODBjYjAgLSBILjI2NC9NUEVHLTQgQVZDIGNvZGVjIC0gQ29weWxlZnQgMjAwMy0yMDI1IC0gaHR0cDovL3d3dy52aWRlb2xhbi5vcmcveDI2NC5odG1sIC0gb3B0aW9uczogY2FiYWM9MSByZWY9MyBkZWJsb2NrPTE6MDowIGFuYWx5c2U9MHgzOjB4MTEzIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9NCBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMgYl9weXJhbWlkPTIgYl9hZGFwdD0xIGJfYmlhcz0wIGRpcmVjdD0xIHdlaWdodGI9MSBvcGVuX2dvcD0wIHdlaWdodHA9MiBrZXlpbnQ9MjUwIGtleWludF9taW49NiBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAADNliIQAE//+97GPgU2zJUWXOop6H+EVsfSQUXqx3VKsQJrKTGfa6KC5AgAO0AF/FvX64OEAAAAMQZokbEEv/rUqgAesAAAACUGeQniCHwAJuQAAAAkBnmF0Q/8AFbAAAAAJAZ5jakP/ABWxAAAAEkGaaEmoQWiZTAgl//61KoAHrQAAAAtBnoZFESwQ/wAJuQAAAAkBnqV0Q/8AFbEAAAAJAZ6nakP/ABWwAAAAEkGarEmoQWyZTAgh//6qVQAPWAAAAAtBnspFFSwQ/wAJuQAAAAkBnul0Q/8AFbAAAAAJAZ7rakP/ABWwAAAAEkGa7UmoQWyZTAh///6plgA8IQ==";

// 2026-08-13: con ?video=<signed URL> el primer caso usa el archivo REAL del
// bucket en vez del de mentira. Hizo falta para diagnosticar el video de Ángel
// (37 MB): el de 2 KB carga instantáneo y esconde justo lo que había que ver.
const VIDEO_REAL = new URLSearchParams(window.location.search).get("video");

const CASOS_VIDEO = [
  ["Con el video cargado", { nombre: "Rosa Beatriz Giménez", video: VIDEO_REAL || VIDEO_FALSO }],
  ["Todavía sin video", { nombre: "Héctor Suárez", video: "" }],
  ["El video falla al cargar", { nombre: "María Inés", video: "http://localhost:5173/dev/no-existe-este-video.mp4" }],
];

function VistaVideoDemo() {
  const [caso, setCaso] = useState(0);
  const btn = (activo) => ({
    minHeight: 44, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13,
    background: activo ? "#fff" : "#1c1c1c", color: activo ? "#111" : "#bbb", border: "1px solid #343434",
  });
  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {CASOS_VIDEO.map(([label], i) => (
          <button key={label} style={btn(caso === i)} onClick={() => setCaso(i)}>{label}</button>
        ))}
      </div>
      <div style={{ border: "1px solid #343434", borderRadius: 12, overflow: "hidden" }}>
        <VistaVideoAlumno key={caso} {...CASOS_VIDEO[caso][1]} onSalir={() => alert("Salir")} />
      </div>
    </>
  );
}

// ── BIBLIOTECA DE EJERCICIOS (2026-08-10) ─────────────────────────────
// CatalogoExplorer pega contra Supabase directo (cargarCatalogoCached), y con
// la clave anónima la tabla devuelve [] por RLS: sin login no hay ni una
// tarjeta que mirar. Se intercepta `fetch` SOLO para esa tabla y se le
// devuelven filas de mentira — el componente que se monta es el real, igual
// que con los demás paneles. El PATCH (archivar) contesta 204 como PostgREST,
// así que el toast "Deshacer" corre su ciclo completo.
const FILAS_CATALOGO = [
  { id: "c1", nombre_es: "Abdominal corto en el piso", categoria: "waist", target_es: "Abdominales", equipment_es: "Peso corporal", codigo_di: "AN025", nivel: "inicial", archivado: false },
  { id: "c2", nombre_es: "Abdominal con piernas elevadas", categoria: "waist", target_es: "Abdominales", equipment_es: "Peso corporal", codigo_di: "AN026", nivel: null, archivado: false },
  { id: "c3", nombre_es: "Plancha frontal con apoyo de antebrazos", categoria: "waist", target_es: "Core", equipment_es: "Peso corporal", codigo_di: "CO003", nivel: "intermedio", archivado: false },
  { id: "c4", nombre_es: "Press de banca plano con barra", categoria: "chest", target_es: "Pectoral mayor", equipment_es: "Barra", codigo_di: "PE002", nivel: "avanzado", archivado: false },
  { id: "c5", nombre_es: "Press de banca inclinado con mancuernas", categoria: "chest", target_es: "Pectoral mayor", equipment_es: "Mancuernas", codigo_di: "PE003", nivel: null, archivado: false },
  { id: "c6", nombre_es: "Remo con barra a la cintura", categoria: "back", target_es: "Dorsal ancho", equipment_es: "Barra", codigo_di: "RO004", nivel: "intermedio", archivado: false },
  { id: "c7", nombre_es: "Ejercicio ya archivado de prueba", categoria: "back", target_es: "Dorsal ancho", equipment_es: "Polea", codigo_di: "RO099", nivel: null, archivado: true },
];
// AUDITORÍA 2026-08-12: con 7 tarjetas la Biblioteca no se parece a la real,
// que tiene 1343. Con ?catalogo=1343 se generan las 1343 filas (nombres largos
// de verdad, del mismo estilo que los del catálogo) para poder mirar en 375px
// la grilla, el scroll, el paginado y qué pasa con un nombre de 60 caracteres.
const CATALOGO_GRANDE = (() => {
  const n = Number(new URLSearchParams(window.location.search).get("catalogo") || 0);
  if (!n) return null;
  const cats = ["waist", "chest", "back", "upper legs", "shoulders", "upper arms", "lower legs", "cardio"];
  const tgt = ["Abdominales", "Pectoral mayor", "Dorsal ancho", "Cuádriceps", "Deltoides", "Bíceps", "Gemelos", "Glúteo mayor"];
  const eq = ["Peso corporal", "Barra", "Mancuernas", "Polea", "Banda elástica", "Kettlebell", "Máquina Smith", "TRX"];
  const patron = ["con agarre supino", "en banco inclinado a 30 grados", "a una pierna con apoyo posterior", "con rotación externa de hombro", "en polea alta con cuerda", "unilateral con pausa isométrica", "sentado con la espalda apoyada", "de pie con agarre neutro"];
  const base = ["Press de banca", "Remo inclinado", "Sentadilla frontal", "Elevación lateral", "Curl de bíceps", "Extensión de tríceps", "Peso muerto rumano", "Zancada caminando", "Jalón al pecho", "Hip thrust"];
  return Array.from({ length: n }, (_, i) => ({
    id: "g" + i,
    nombre_es: `${base[i % base.length]} ${patron[(i * 3) % patron.length]}`,
    categoria: cats[i % cats.length],
    target_es: tgt[i % tgt.length],
    equipment_es: eq[i % eq.length],
    codigo_di: "XX" + String(i).padStart(4, "0"),
    nivel: [null, "inicial", "intermedio", "avanzado"][i % 4],
    archivado: false,
  }));
})();
const RESPUESTA_JSON = (datos) => new Response(JSON.stringify(datos), { status: 200, headers: { "Content-Type": "application/json" } });
// 2026-08-12: las otras tres tablas que lee la Biblioteca también están detrás
// de RLS `authenticated`, así que sin esto las pantallas "Todos los planes" y
// "Periodizaciones" quedaban vacías en el banco y no había forma de mirar el
// renombre en 375px. Mismo criterio que el catálogo: filas de mentira, el
// componente que se monta es el real. Los nombres largos van tal cual están en
// la base — son los que tienen que entrar en un celular.
const FILAS_PERIODIZACIONES = [
  { objetivo: "hipertrofia", nivel: "principiante", nombre: "Hipertrofia · principiante", semanas: [{ semana: 1, series: 3, reps: 12, intensidad: "60%" }, { semana: 2, series: 3, reps: 10, intensidad: "65%" }] },
  { objetivo: "hipertrofia", nivel: "avanzado", nombre: "Hipertrofia · avanzado", semanas: [] },
  { objetivo: "fuerza", nivel: "principiante", nombre: "Fuerza · principiante", semanas: [] },
  { objetivo: "fuerza", nivel: "avanzado", nombre: "Fuerza · avanzado", semanas: [] },
  { objetivo: "acondicionamiento", nivel: "principiante", nombre: "Acondicionamiento físico · principiante", semanas: [] },
  { objetivo: "acondicionamiento", nivel: "avanzado", nombre: "Acondicionamiento físico · avanzado", semanas: [] },
  { objetivo: "preparacion_fisica", nivel: "principiante", nombre: "Preparación física · principiante", semanas: [] },
  { objetivo: "preparacion_fisica", nivel: "avanzado", nombre: "Preparación física · avanzado", semanas: [] },
];
const fetchOriginal = window.fetch.bind(window);
const TABLAS_FALSAS = {
  // cargarCatalogo() pagina de a 1000 con Range y corta cuando una página
  // vuelve incompleta: si el mock devuelve siempre todo, el bucle no termina
  // nunca y la Biblioteca queda en «Cargando catálogo…». Se respeta el rango.
  catalogo_ejercicios: (url, opciones) => {
    if (url.includes("revisar=eq.true")) return [];
    const filas = CATALOGO_GRANDE || FILAS_CATALOGO;
    const h = (opciones && opciones.headers) || {};
    const rango = h.Range || h.range || (h.get && h.get("Range"));
    const m = rango && String(rango).match(/(\d+)-(\d+)/);
    return m ? filas.slice(+m[1], +m[2] + 1) : filas;
  },
  plan_variantes: () => VARIANTES_DEMO,
  periodizaciones: () => FILAS_PERIODIZACIONES,
  planes_predeterminados: () => [],
};
window.fetch = (entrada, opciones = {}) => {
  const url = typeof entrada === "string" ? entrada : entrada.url || "";
  const tabla = Object.keys(TABLAS_FALSAS).find((t) => url.includes(`/rest/v1/${t}`));
  if (!tabla) return fetchOriginal(entrada, opciones);
  const metodo = (opciones.method || "GET").toUpperCase();
  if (metodo !== "GET") return Promise.resolve(new Response(null, { status: 204 }));
  return Promise.resolve(RESPUESTA_JSON(TABLAS_FALSAS[tabla](url, opciones)));
};

function BibliotecaDemo() {
  // Abre sola con /dev/harness.html#catalogo — así se puede capturar en
  // headless, que no tiene forma de tocar un botón.
  const [abierto, setAbierto] = useState(() =>
    window.location.hash === "#catalogo" || new URLSearchParams(window.location.search).has("biblioteca"));
  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        style={{ minHeight: 44, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, background: "#fff", color: "#111", border: "1px solid #343434" }}
      >
        Abrir la Biblioteca
      </button>
      {abierto && (
        <CatalogoExplorer
          onClose={() => setAbierto(false)}
          showToast={(m) => console.log("[toast]", m)}
          onAbrirPropia={() => alert("Abre la biblioteca propia (movilidad/elástico/calor)")}
          pantallaInicial={new URLSearchParams(window.location.search).get("biblioteca") || "biblioteca"}
        />
      )}
    </>
  );
}

// ── PANEL ADMIN COMPLETO (2026-08-10) ─────────────────────────────────
// Para poder mirar las pestañas de Reportes y Evaluación sin el PIN. Se
// siembra la navegación en sessionStorage ANTES de montar (AdminPanel la lee
// en el primer render) y se abre con /dev/harness.html#reportes o #evaluacion.
const ALUMNO_DEMO = {
  id: "al-1",
  nombre: "Rosa Beatriz Giménez",
  asistencia: ["2026-08-04 09:15", "2026-08-06 09:05", "2026-08-08 10:00"],
  diario: [],
  rm: {},
  // 2026-08-10: con semanas cargadas se puede mirar la pestaña Periodización
  // (marca de herencia + editor) sin login y sin base.
  plan: {
    dias: DIAS_INICIALES,
    periodizacion: [
      { semana: 1, series: 2, reps: 8, intensidad: "60%", fecha: "10/8", anio: 2026 },
      { semana: 2, series: 3, reps: 8, intensidad: "70%", fecha: "17/8", anio: 2026 },
      { semana: 3, series: 2, reps: 10, intensidad: "60%", fecha: "24/8", anio: 2026 },
    ],
  },
  // 2026-08-10 · PERIODIZACIÓN POR DÍA: dos días, uno compartiendo la del
  // alumno y otro con la suya, que es justo lo que hay que poder distinguir
  // de un vistazo en la pestaña Periodización.
  planes: [
    { id: "ap-1", dia_semana: "Lunes", nombre: "Empuje + Cadera", estado: "activo", dias: [], periodizacion_propia: null },
    {
      id: "ap-2", dia_semana: "Jueves", nombre: "Tracción + Rodilla", estado: "activo", dias: [],
      periodizacion_propia: [{ semana: 1, series: 5, reps: 5, intensidad: "85%", fecha: "10/8", anio: 2026 }],
    },
  ],
};
function AdminDemo() {
  const [alumnos, setAlumnos] = useState([ALUMNO_DEMO]);
  const [abierto, setAbierto] = useState(() => {
    // AUDITORÍA 2026-08-12: navegación genérica por query. Con ?sec=alumnos,
    // ?sec=planes&planesTab=plan-dias, ?sec=plan&planTab=entrenamiento, etc.
    // se llega a CUALQUIER pantalla del panel sin PIN, que es lo que hacía
    // falta para fotografiar la ficha del alumno y el plan por día.
    const q = new URLSearchParams(window.location.search);
    if (q.get("sec")) {
      const nav = { sec: q.get("sec"), selId: "al-1" };
      ["planTab", "planesTab", "repTab", "evalTab"].forEach((k) => {
        if (q.get(k)) nav[k] = q.get(k);
      });
      sessionStorage.setItem("di_admin_nav", JSON.stringify(nav));
      return true;
    }
    // Se acepta ?admin=movilidad además del hash: las capturas headless
    // pierden el fragmento y así se puede fotografiar la pantalla real.
    const h = window.location.hash || (q.get("admin") ? "#" + q.get("admin") : "");
    // 2026-08-10: #movilidad y #calor abren el panel en Plan → esa pestaña,
    // para poder mirar el sistema de preparación en dos niveles sin login.
    // 2026-08-10: #periodizacion abre Planes → Periodización, para mirar la
    // marca de herencia y el editor del alumno sin login.
    if (h === "#periodizacion") {
      sessionStorage.setItem("di_admin_nav", JSON.stringify({
        sec: "planes", selId: "al-1", planesTab: "periodizacion",
      }));
      return true;
    }
    if (h === "#movilidad" || h === "#calor") {
      sessionStorage.setItem("di_admin_nav", JSON.stringify({
        sec: "plan", selId: "al-1", planTab: h.slice(1),
      }));
      return true;
    }
    if (h !== "#reportes" && h !== "#evaluacion") return false;
    sessionStorage.setItem("di_admin_nav", JSON.stringify({
      sec: h === "#reportes" ? "reportes" : "evaluacion",
      selId: "al-1",
      repTab: h === "#reportes" ? "resumen" : "asistencia",
    }));
    return true;
  });
  if (!abierto)
    return (
      <button
        onClick={() => { sessionStorage.setItem("di_admin_nav", JSON.stringify({ sec: "reportes", selId: "al-1", repTab: "resumen" })); setAbierto(true); }}
        style={{ minHeight: 44, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, background: "#fff", color: "#111", border: "1px solid #343434" }}
      >
        Abrir el panel admin en Reportes
      </button>
    );
  return (
    <div data-admin>
    <AdminPanel
      alumnos={alumnos}
      onUpdate={setAlumnos}
      onClose={() => setAbierto(false)}
      showToast={(m) => console.log("[toast]", m)}
      biblioteca={BIBLIOTECA}
      onGuardarBiblioteca={() => {}}
      onBibliotecaRefresh={() => {}}
      novedades={[]}
      onNovedadesChange={() => {}}
      darkMode
      onToggleTheme={() => {}}
      onModoEntrenador={() => {}}
    />
    </div>
  );
}

// ALTA DE ALUMNO · días + plan de ejercicios (2026-08-12). Se monta el
// componente REAL del alta (SelectorDiasAlta) con las variantes de mentira: la
// tabla plan_variantes solo se lee autenticado y el banco no tiene sesión.
function AltaDiasDemo() {
  const [dias, setDias] = useState({ Lunes: SIN_PLAN, Jueves: "v:v-h31" });
  return (
    <>
      <SelectorDiasAlta
        dias={["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]}
        seleccion={dias}
        grupos={agruparVariantes(VARIANTES_DEMO)}
        onToggle={(d) => setDias((prev) => { const n = { ...prev }; if (n[d] != null) delete n[d]; else n[d] = SIN_PLAN; return n; })}
        onPlan={(d, valor) => setDias((prev) => ({ ...prev, [d]: valor }))}
      />
      <div style={{ color: "#9ae6b4", fontSize: 12, marginTop: 10, fontFamily: "monospace" }}>
        {JSON.stringify(dias)}
      </div>
    </>
  );
}

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

// EL PESO POR FORMA DE CARGA (2026-08-13) — lo más importante de la app según
// Lucas. Cuatro tarjetas que cubren los cuatro casos que hay que poder mirar:
// la barra (donde vive el "5 + 20 + 5 = 30"), las dos mancuernas, la banda
// elástica (repeticiones y nada más) y un registro VIEJO, que es un número
// suelto sin detalle y tiene que seguir viéndose igual que siempre.
function CargaDemo() {
  const [pesos, setPesos] = useState({ press: [], mancu: [], banda: [], viejo: 40 });
  const [dets, setDets] = useState({ press: [], mancu: [], banda: [], viejo: [] });
  const cambiar = (id) => (serie, detalle, total) => {
    setPesos((p) => ({ ...p, [id]: setVuelta(p[id], serie, total) || [] }));
    setDets((d) => ({ ...d, [id]: setDetalleVuelta(d[id], serie, total > 0 ? detalle : null) || [] }));
  };
  const comun = {
    showPeso: true,
    semana: { series: 4, reps: 8, intensidad: "75%" },
    seriesPlan: 4,
    historial: [],
    // equipoSala en null a propósito: normalizarEquipamiento devuelve el
    // equipamiento base, que es exactamente lo que ve un gimnasio que todavía
    // no tocó la pantalla de Equipamiento.
    equipoSala: null,
  };
  return (
    <>
      <ItemCard
        {...comun}
        nombre="Press de banca plano con barra" numero={1}
        desc="Bajá la barra al pecho con los codos a 45 grados y empujá."
        equipamiento="Barra"
        vueltas={pesos.press} detalles={dets.press}
        onVueltaChange={() => {}} onDetalleChange={cambiar("press")}
      />
      <ItemCard
        {...comun}
        nombre="Press de hombro con mancuernas" numero={2}
        desc="Sentado, espalda apoyada, empujá las dos mancuernas arriba."
        equipamiento="Mancuerna"
        vueltas={pesos.mancu} detalles={dets.mancu}
        onVueltaChange={() => {}} onDetalleChange={cambiar("mancu")}
      />
      <ItemCard
        {...comun}
        nombre="Remo con banda elástica" numero={3}
        desc="Pisá la banda y traccionála hacia el abdomen."
        equipamiento="Banda elástica" unidad="repeticiones"
        vueltas={pesos.banda} detalles={dets.banda}
        onVueltaChange={() => {}} onDetalleChange={cambiar("banda")}
      />
      <ItemCard
        {...comun}
        nombre="Hip thrust (registro viejo, sin detalle)" numero={4}
        desc="Apoyá la espalda alta en el banco y empujá con los talones."
        equipamiento="Barra"
        vueltas={pesos.viejo} detalles={dets.viejo}
        onVueltaChange={() => {}} onDetalleChange={cambiar("viejo")}
      />
      <div style={{ color: "#9ae6b4", fontSize: 12, marginTop: 10, fontFamily: "monospace", wordBreak: "break-all" }}>
        pesos: {JSON.stringify(pesos)}<br />detalle: {JSON.stringify(dets)}
      </div>
    </>
  );
}

// ESTRUCTURA DEL DÍA (2026-08-10) — el día de Jacobo y el circuito, tal como
// los ve el ALUMNO. Se monta el PlanDelDia REAL: si acá se ve bien, en la app
// se ve bien. Es lo único que había forma de verificar a ojo, porque la vista
// del alumno vive detrás del login con PIN.
const EJ = (id, nombre, seccion) => ({
  id, nombre, seccion, desc: "", video: "", gif: "", mediaLocal: "", historial: [], unidad: "reps",
});
const PLAN_JACOBO = {
  dia_semana: "Lunes",
  periodizacion: [{ semana: 1, series: 4, reps: 10, intensidad: "70%" }],
  dias: [{
    dia: "Lunes",
    subtitulo: "Hipertrofia 2 días · Empuje + Cadera",
    config: { core: "intercalado" },
    ejercicios: [
      EJ("j1", "Press de banca plano con barra", "principal"),
      EJ("j2", "Peso muerto con barra", "principal"),
      EJ("j3", "Press Pallof", "core"),
      EJ("j4", "Fondos de tríceps", "finisher"),
    ],
  }],
};
const PLAN_CIRCUITO = {
  dia_semana: "Miércoles",
  periodizacion: [{ semana: 1, series: 4, reps: 10, intensidad: "70%" }],
  dias: [{
    dia: "Miércoles",
    subtitulo: "Circuito intermitente de fuerza",
    config: { modo: "tiempo", segundos: 30, rondas: 4 },
    ejercicios: [
      EJ("c1", "Press de banca plano con mancuernas", "principal"),
      EJ("c2", "Remo inclinado con mancuerna", "principal"),
      EJ("c3", "Press Pallof horizontal con banda", "core"),
    ],
  }],
};
function PlanDelDiaDemo({ plan }) {
  const [pesos, setPesos] = useState({});
  return (
    <PlanDelDia
      plan={plan}
      planValido
      diasEntrena={[plan.dia_semana]}
      dia={plan.dias[0]}
      diaIdx={0}
      setDiaIdx={() => {}}
      sem={plan.periodizacion[0]}
      semanaActual={1}
      pesos={pesos}
      historiales={{}}
      onPeso={(id, v) => setPesos((p) => ({ ...p, [id]: v }))}
      rm={{}}
      modoEntrenador
    />
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
          titulo="Registro de peso por forma de carga"
          nota="2026-08-13, lo más importante de la app según Lucas. El alumno anota LO QUE VE y la app hace la cuenta. Probar acá: (1) en el press, abrir el botón de peso, tocar la barra de 20 y después el disco de 5 — tiene que dar 30 kg y decir «Barra 20 + 5 por lado», que es el ejemplo textual de Lucas; (2) en las mancuernas, tocar «Dos mancuernas» y el 10 — tiene que dar 20 kg; (3) la banda pide REPETICIONES y nada más, sin kilos ni colores; (4) el cuarto ejercicio arranca con un registro VIEJO (40, un número suelto sin detalle) y tiene que seguir viéndose igual, sin inventarle una explicación. Ningún control baja de 44px y ninguno abre el teclado."
        >
          <CargaDemo />
        </Panel>

        <Panel
          titulo="Pantalla del alumno «solo video»"
          nota="Lo que ve un adulto mayor al entrar: saludo, video y nada más. Probar los tres estados con los botones. El texto no baja de 20px, el botón de reproducir mide 72px de alto y Salir queda abajo, chico y separado."
        >
          <VistaVideoDemo />
        </Panel>

        <Panel
          titulo="Panel admin · Reportes y Evaluación"
          nota="Reportes tiene ahora tres pestañas: Asistencia · Historial de pesos máximos · Resumen y evolución (esta última venía de Evaluación → Reportes). Evaluación queda con Evaluación integral y Bioimpedancia. Se abre solo con /dev/harness.html#reportes o #evaluacion."
        >
          <AdminDemo />
        </Panel>

        <Panel
          titulo="Biblioteca de ejercicios · archivar de un toque"
          nota="Cada tarjeta tiene abajo el código y el botón Archivar (44px). Tocarlo saca la tarjeta de la lista al instante y deja abajo el aviso con Deshacer; tocar la tarjeta (no el botón) sigue abriendo el detalle. Con el chip «Archivados» se ve el que ya está archivado, con el botón en «Recuperar». 2026-08-10: el bloque «Otra biblioteca» de arriba se sacó — duplicaba al botón «Movilidad y entrada en calor» de la barra de acciones, y el acceso a las rutinas propias vive ahora adentro de esa pantalla."
        >
          <BibliotecaDemo />
        </Panel>

        <Panel
          titulo="Plan x día · elegir la rutina (variantes)"
          nota="2026-08-10: las 11 rutinas de plan_variantes se asignan desde acá, agrupadas por familia y con la descripción de Lucas a la vista; el PPL y las híbridas muestran «Día 1/2/3» para asignarlas día por día sin adivinar. El bloque «Plantillas anteriores» se sacó: esas 12 plantillas eran las mismas dos sesiones full body repetidas con distinta periodización, y la periodización ya vive en su propia tabla."
        >
          <SelectorPlanDia
            dia="Lunes"
            grupos={agruparVariantes(VARIANTES_DEMO)}
            tienePlan
            onVariante={(v) => alert(`Asignaría: ${v.nombre}`)}
            onSinPlan={() => alert("Sin plan")}
            onQuitar={() => alert("Quitar día")}
            onVolver={() => alert("Volver")}
          />
        </Panel>

        <Panel
          titulo="Alta de alumno · días y plan de ejercicios"
          nota="2026-08-12, reclamo de Lucas: «Al crear un usuario tengo que poder poner sin plan o con los planes que tenemos, no me aparecen los planes que tenemos organizados». El alta ofrecía las 2 plantillas viejas; ahora ofrece las variantes reales agrupadas por familia, y arranca en «Sin plan». Probar acá: tocar un día lo prende y abre su desplegable; el desplegable entero tiene que entrar en 375px sin cortar el nombre de la rutina."
        >
          <AltaDiasDemo />
        </Panel>

        <Panel
          titulo="Explicación del ejercicio · mostrar más, GIF abajo"
          nota="2026-08-12, pedido de Lucas: «el ejercicio tiene que ser el gif abajo y la explicación como primer item y la opción de mostrar más». La primera tarjeta trae una instrucción real del catálogo (~500 caracteres): abierta muestra los 3 primeros pasos y el resto se despliega con el botón, así el GIF no queda empujado fuera de la pantalla."
        >
          <ItemCard
            nombre="Sentadilla con barra" numero={1}
            desc="Ponete de pie con los pies separados al ancho de los hombros y la barra apoyada en la parte alta de la espalda. Sacá el aire y apretá el abdomen antes de bajar. Bajá doblando caderas y rodillas hasta que los muslos queden paralelos al piso, con la espalda recta y el pecho arriba. Cuidá que las rodillas sigan la línea de los pies y no se metan hacia adentro. Empujá el piso con los talones para volver a la posición inicial. Soltá el aire al terminar de subir. Repetí manteniendo el ritmo controlado."
            historial={[]}
          />
          <ItemCard
            nombre="Movilidad de tobillo" numero={2}
            desc="Apoyá la rodilla contra la pared sin levantar el talón."
            historial={[]}
          />
        </Panel>

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
          titulo="Vista del alumno · las tres unidades"
          nota="2026-08-12. El casillero tiene que decir QUÉ se carga: kilos si lleva carga, repeticiones si es peso corporal (TRX, fondos, dominadas) y segundos si es isométrico (plancha). Antes todo lo que no se llamara 'plancha' pedía KG."
        >
          <div data-unidades>
            <ItemCard nombre="Sentadilla con barra" numero={1} showPeso unidad="kilos" peso={60} historial={[]} onPesoChange={() => {}} />
            <ItemCard nombre="Fondos de tríceps en paralelas" numero={2} showPeso unidad="repeticiones" peso={12} historial={[]} onPesoChange={() => {}} />
            <ItemCard nombre="Plancha" numero={3} showPeso unidad="segundos" peso={45} historial={[]} onPesoChange={() => {}} />
          </div>
        </Panel>

        <Panel
          titulo="Vista del alumno · peso por vuelta"
          nota="El plan pide 4 series, así que hay 4 casilleros. Tocar una vuelta la selecciona y el − / + de arriba edita esa. El primero arranca con 2 vueltas ya cargadas; el segundo tiene un registro viejo (un solo número) y debe seguir viéndose bien."
        >
          <div data-vueltas><VueltasDemo /></div>
        </Panel>

        <Panel
          titulo="Vista del alumno · core intercalado y finisher (plan de Jacobo)"
          nota="El core va ARRIBA del bloque principal porque es intercalado entre rondas: el orden en que se lee es el orden en que se hace, y todo el punto es que no termine siendo lo último. El finisher va último, con su aclaración."
        >
          <div data-plan-jacobo><PlanDelDiaDemo plan={PLAN_JACOBO} /></div>
        </Panel>

        <Panel
          titulo="Vista del alumno · día por TIEMPO (circuito intermitente de fuerza)"
          nota="Sin series ni repeticiones: 30 s por ejercicio × 4 rondas, dicho arriba de todo. Las tarjetas muestran los segundos, no kilos por repetición."
        >
          <div data-plan-circuito><PlanDelDiaDemo plan={PLAN_CIRCUITO} /></div>
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
