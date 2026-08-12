// Chequeo de las funciones puras de la app.
//
// Para qué existe: hasta hoy el único chequeo objetivo de esta app era que
// compilara. Que compile no dice nada sobre si las cuentas están bien. Estos
// tests cubren las reglas de negocio que, si se rompen, rompen en silencio:
// la edad de un alumno, el link del video de un ejercicio, y el requerimiento
// energético, que tiene una regla dura de "todo o nada" y nunca debe devolver
// un número inventado cuando faltan datos.
//
// Se corre con: npm test

import { describe, expect, it } from "vitest";
import { calcularEdad, getYTId, hoy, aplicarSemanaPeriodizacion } from "./helpers.js";
import { calcularRequerimiento, mifflinStJeor, cunningham } from "./energia.js";
import { getEjercicioGif, resolverGif, SIN_GIF } from "./ejerciciosMedia.js";
import { _columnasCambiadas } from "../../services/supabase.js";
import { listaDeAlumno, conPrepPropia, sinPrepPropia, esPrepPropia } from "./preparacion.js";
import {
  conPeriodizacionDe, conPeriodizacionEditada, esPeriodizacionPropia,
  refPeriodizacion, propagarPeriodizacion,
  esPeriodizacionDiaPropia, periodizacionDelDia, resumenPeriodizacionDias,
  sinPeriodizacion, tienePeriodizacion,
} from "./periodizacion.js";
import {
  bloquesDelDia, configDia, esPorTiempo, prescripcionDelDia, textoModo, textoCore,
} from "./estructuraDia.js";
import {
  vueltasDe, vueltasCargadas, pesoRepresentativo, volumenDe,
  setVuelta, cantidadDeVueltas, resumenVueltas,
} from "./pesos.js";
import { unidadDe, unidadPorRegla, ETIQUETA_HOY } from "./unidades.js";
import {
  normalizarBusqueda, buscarEnCatalogo, ordenarSugerencias, normalizarGrupo, GRUPOS_DI,
} from "./ejercicioAsistido.js";
import {
  varianteAPlan, agruparVariantes, indexarCatalogo, etiquetaVariante,
  SIN_PLAN, planVacio, planDeEleccion, valorVariante,
} from "./planVariantes.js";

describe("peso por vuelta", () => {
  it("un dato viejo (un número suelto) se lee como una sola vuelta", () => {
    expect(vueltasDe(60)).toEqual([60]);
    expect(vueltasCargadas(60)).toEqual([60]);
    expect(pesoRepresentativo(60)).toBe(60);
  });

  it("sin dato no inventa vueltas ni devuelve undefined", () => {
    expect(vueltasDe(null)).toEqual([]);
    expect(vueltasDe(undefined)).toEqual([]);
    expect(pesoRepresentativo(null)).toBe(0);
    expect(resumenVueltas(null)).toBe("");
  });

  it("el peso que representa el día es el MÁXIMO, no el último ni el promedio", () => {
    // Una serie de aproximación liviana al final no debe hacer parecer que bajó.
    expect(pesoRepresentativo([60, 65, 70, 40])).toBe(70);
  });

  it("el volumen suma todas las vueltas", () => {
    expect(volumenDe([60, 65, 70])).toBe(195);
    expect(volumenDe(60)).toBe(60);
  });

  it("escribir una vuelta no pisa las otras", () => {
    expect(setVuelta([60, 65, 70], 2, 67.5)).toEqual([60, 67.5, 70]);
  });

  it("escribir sobre un dato viejo lo conserva como vuelta 1", () => {
    expect(setVuelta(60, 2, 65)).toEqual([60, 65]);
  });

  it("escribir una vuelta salteada deja huecos, no corre las posiciones", () => {
    expect(setVuelta(null, 3, 80)).toEqual([null, null, 80]);
  });

  it("borrar la única vuelta devuelve null, para poder sacar el ejercicio del registro", () => {
    expect(setVuelta([60], 1, "")).toBe(null);
    expect(setVuelta([60, 65], 2, "")).toEqual([60, null]);
  });

  it("un peso inválido o negativo no se guarda", () => {
    expect(setVuelta([60], 2, -5)).toEqual([60, null]);
    expect(setVuelta([60], 2, "abc")).toEqual([60, null]);
  });

  it("muestra tantos casilleros como series tenga el plan", () => {
    expect(cantidadDeVueltas(null, 4)).toBe(4);
    expect(cantidadDeVueltas(null, undefined)).toBe(1);
  });

  it("nunca esconde una vuelta ya cargada aunque el plan baje de series", () => {
    expect(cantidadDeVueltas([60, 65, 70, 75], 3)).toBe(4);
  });

  it("el resumen usa coma decimal, como escribe la gente acá", () => {
    expect(resumenVueltas([60, 62.5, 65])).toBe("60 · 62,5 · 65");
  });
});

// El bug que este test evita es el que Lucas reportó como "cambio algo en
// planificación y vuelve a lo mismo": el guardado mandaba las 20 columnas del
// alumno de una, así que una pestaña con el estado viejo revertía TODO lo que
// había hecho la otra. Mandando solo lo que cambió, dos pantallas editando
// cosas distintas del mismo alumno dejan de pisarse.
describe("_columnasCambiadas (guardado parcial del alumno)", () => {
  const base = {
    id: "a1",
    nombre: "Agustina",
    peso: 60,
    rm: { squat: 80 },
    plan_periodizacion: [{ semana: 1, series: 2, reps: 6 }],
  };

  it("sin payload previo devuelve null, para que se escriba la fila completa", () => {
    expect(_columnasCambiadas(undefined, base)).toBe(null);
    expect(_columnasCambiadas(null, base)).toBe(null);
  });

  it("sin cambios devuelve un objeto vacío, no la fila entera", () => {
    expect(_columnasCambiadas(base, { ...base })).toEqual({});
  });

  it("devuelve SOLO la columna que cambió", () => {
    const actual = { ...base, peso: 62 };
    expect(_columnasCambiadas(base, actual)).toEqual({ peso: 62 });
  });

  it("detecta cambios adentro de un jsonb, donde comparar por identidad fallaría", () => {
    const actual = { ...base, plan_periodizacion: [{ semana: 1, series: 5, reps: 6 }] };
    const diff = _columnasCambiadas(base, actual);
    expect(Object.keys(diff)).toEqual(["plan_periodizacion"]);
    expect(diff.plan_periodizacion[0].series).toBe(5);
  });

  it("un jsonb con el mismo contenido pero otra referencia NO cuenta como cambio", () => {
    const actual = { ...base, rm: { squat: 80 } };
    expect(_columnasCambiadas(base, actual)).toEqual({});
  });

  it("nunca incluye el id entre las columnas a escribir", () => {
    const actual = { ...base, nombre: "Maria Agustina" };
    expect(_columnasCambiadas(base, actual)).toEqual({ nombre: "Maria Agustina" });
  });
});

// 2026-08-10 — bug de Lucas: "al cambiar sigue igual, no se puede cambiar un
// día en la periodización". Editaba la semana 1 (3 series x 8 reps), guardaba,
// y la lista seguía mostrando 2x6. Causa: el editor guardaba en DOS pasos
// (primero el cambio, después el recálculo de fechas sobre el array VIEJO) y
// el segundo pisaba al primero. Ya había vuelto una vez; con estos tests no
// vuelve en silencio.
// 2026-08-10 — bug de Lucas: "al cambiar la movilidad no cambia los
// ejercicios". Las 3 versiones ahora son 3 listas distintas, con
// predeterminado global + copia por alumno. Lo que se testea es la regla de
// herencia, que es donde se rompe en silencio: quien nunca tocó una lista
// tiene que heredar los cambios del predeterminado, y quien tiene lista propia
// no se puede pisar NUNCA desde arriba.
describe("preparacion (predeterminado global + lista propia del alumno)", () => {
  const globales = {
    movilidad_corta: [{ nombre: "Gato-vaca" }],
    calor: [{ nombre: "Banda x10" }],
  };
  const alumno = { plan: { movilidad: [], calor: [] }, rm: {} };

  it("sin lista propia, el alumno ve el predeterminado global", () => {
    expect(listaDeAlumno(alumno, "movilidad_corta", globales)).toEqual(globales.movilidad_corta);
  });

  it("sin predeterminado guardado todavía, cae en los ejercicios del método (nunca vacío)", () => {
    const lista = listaDeAlumno(alumno, "movilidad_superrapida", {});
    expect(lista.length).toBeGreaterThan(0);
  });

  it("editar la lista de un alumno la marca como propia y no toca a los demás", () => {
    const editado = conPrepPropia(alumno, "movilidad_corta", [{ nombre: "Solo esto" }]);
    expect(esPrepPropia(editado, "movilidad_corta")).toBe(true);
    expect(listaDeAlumno(editado, "movilidad_corta", globales)).toEqual([{ nombre: "Solo esto" }]);
    // el original no se mutó: otro alumno sigue heredando
    expect(listaDeAlumno(alumno, "movilidad_corta", globales)).toEqual(globales.movilidad_corta);
  });

  it("cambiar el predeterminado NO pisa al alumno que tiene lista propia", () => {
    const editado = conPrepPropia(alumno, "calor", [{ nombre: "Mi entrada en calor" }]);
    const nuevosGlobales = { ...globales, calor: [{ nombre: "Otra cosa" }] };
    expect(listaDeAlumno(editado, "calor", nuevosGlobales)).toEqual([{ nombre: "Mi entrada en calor" }]);
    expect(listaDeAlumno(alumno, "calor", nuevosGlobales)).toEqual([{ nombre: "Otra cosa" }]);
  });

  it("volver al predeterminado saca la marca y devuelve la lista global", () => {
    const editado = conPrepPropia(alumno, "calor", [{ nombre: "Mi entrada en calor" }]);
    const vuelto = sinPrepPropia(editado, "calor", globales);
    expect(esPrepPropia(vuelto, "calor")).toBe(false);
    expect(listaDeAlumno(vuelto, "calor", globales)).toEqual(globales.calor);
  });

  it("la movilidad completa y el calor siguen viviendo en las columnas de siempre", () => {
    const a = conPrepPropia(alumno, "movilidad_completa", [{ nombre: "X" }]);
    expect(a.plan.movilidad).toEqual([{ nombre: "X" }]);
    const b = conPrepPropia(alumno, "calor", [{ nombre: "Y" }]);
    expect(b.plan.calor).toEqual([{ nombre: "Y" }]);
  });
});

describe("aplicarSemanaPeriodizacion (guardar una semana del plan)", () => {
  const data = [
    { semana: 1, series: 2, reps: 6, intensidad: "70%", fecha: "10/8", anio: 2026 },
    { semana: 2, series: 2, reps: 6, intensidad: "70%", fecha: "17/8", anio: 2026 },
    { semana: 3, series: 2, reps: 6, intensidad: "70%", fecha: "24/8", anio: 2026 },
  ];

  it("guarda series y reps aunque la semana tenga fecha (el bug: se perdían)", () => {
    const r = aplicarSemanaPeriodizacion(data, 0, { series: "3", reps: "8", intensidad: "70%", fecha: "10/8" });
    expect(r[0].series).toBe(3);
    expect(r[0].reps).toBe(8);
  });

  it("series y reps quedan como números, no como el texto del input", () => {
    const r = aplicarSemanaPeriodizacion(data, 1, { series: "5", reps: "4", intensidad: "80%", fecha: "" });
    expect(r[1].series).toBe(5);
    expect(r[1].reps).toBe(4);
  });

  it("cambiar la fecha recorre las semanas siguientes de a 7 días", () => {
    const r = aplicarSemanaPeriodizacion(data, 0, { series: "3", reps: "8", intensidad: "70%", fecha: "12/8" });
    expect(r.map((x) => x.fecha)).toEqual(["12/8", "19/8", "26/8"]);
    expect(r[0].series).toBe(3); // y el cambio sigue ahí
  });

  it("no toca las semanas anteriores a la editada", () => {
    const r = aplicarSemanaPeriodizacion(data, 2, { series: "4", reps: "4", intensidad: "85%", fecha: "26/8" });
    expect(r[0]).toEqual(data[0]);
    expect(r[1]).toEqual(data[1]);
  });

  it("sin fecha guarda igual y no inventa fechas", () => {
    const sinFecha = [{ semana: 1, series: 2, reps: 6, intensidad: "70%", fecha: "" }];
    const r = aplicarSemanaPeriodizacion(sinFecha, 0, { series: "3", reps: "8", intensidad: "75%", fecha: "" });
    expect(r[0]).toEqual({ semana: 1, series: 3, reps: 8, intensidad: "75%", fecha: "" });
  });
});

describe("resolverGif", () => {
  // El bug que este test evita: usar gif:"" para "sacar el GIF" no lo saca —
  // devuelve el control al lookup automático por nombre y reaparece el mismo.
  const conMapa = "hip thrust"; // existe en el mapa de ejerciciosMedia

  it("cae al lookup automático por nombre cuando el ítem no trae GIF propio", () => {
    expect(resolverGif("", conMapa)).toBe(getEjercicioGif(conMapa));
    expect(getEjercicioGif(conMapa)).not.toBe("");
  });

  it("el GIF propio del ítem le gana al automático", () => {
    expect(resolverGif("/ejercicios/otro.gif", conMapa)).toBe("/ejercicios/otro.gif");
  });

  it("el sentinel deja el ejercicio SIN GIF aunque el nombre tenga uno automático", () => {
    expect(resolverGif(SIN_GIF, conMapa)).toBe("");
  });

  it("sin GIF propio y sin match por nombre devuelve vacío, no undefined", () => {
    expect(resolverGif("", "ejercicio que no existe en ningun mapa")).toBe("");
    expect(resolverGif(undefined, undefined)).toBe("");
  });

  // Los 7 ejercicios de la entrada en calor vienen con gif:null en el plan de
  // los alumnos: si el mapa no los resuelve por nombre, la pantalla queda sin
  // ninguna imagen (que es como estaban hasta hoy). Van escritos exactamente
  // como los guarda alumnos.plan_calor, con tildes y paréntesis incluidos.
  it("los 7 de la entrada en calor resuelven todos por nombre", () => {
    const calor = [
      "Jalón con banda (desde arriba)",
      "Movilidad de tobillo (pie elevado, avance)",
      "Pasadas con banda (hombros)",
      "Remo con banda (doble)",
      "Remo con palo (codos atrás)",
      "Retracción escapular con palo",
      "Rotación interna con banda (codo al cuerpo)",
    ];
    for (const nombre of calor) expect(resolverGif(null, nombre)).not.toBe("");
  });
});

describe("calcularEdad", () => {
  it("devuelve null si no hay fecha (no cero, que se confundiría con un bebé)", () => {
    expect(calcularEdad(null)).toBe(null);
    expect(calcularEdad("")).toBe(null);
  });

  it("resta un año si todavía no llegó el cumpleaños", () => {
    const h = new Date();
    // Nació hace 30 años, pero el cumple es mañana: todavía tiene 29.
    const manana = new Date(h.getFullYear() - 30, h.getMonth(), h.getDate() + 1);
    expect(calcularEdad(manana.toISOString().slice(0, 10))).toBe(29);
  });

  it("cuenta el año completo el mismo día del cumpleaños", () => {
    const h = new Date();
    const cumpleHoy = new Date(h.getFullYear() - 30, h.getMonth(), h.getDate());
    expect(calcularEdad(cumpleHoy.toISOString().slice(0, 10))).toBe(30);
  });
});

describe("getYTId", () => {
  it("saca el id de las dos formas de link de YouTube", () => {
    expect(getYTId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getYTId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("no inventa un id cuando el link no es de YouTube o está vacío", () => {
    expect(getYTId("")).toBe(null);
    expect(getYTId(null)).toBe(null);
    expect(getYTId("https://vimeo.com/12345")).toBe(null);
  });
});

// ── armador de ejercicios asistido ────────────────────────────────
// Lo que se protege acá: que el profe encuentre lo que ya existe (si no, el
// catálogo se llena de duplicados escritos a mano) y que el modelo no meta un
// grupo inventado, que dejaría el ejercicio afuera de todos los filtros.
const CATALOGO = [
  { id: 1, nombre_es: "Sentadilla búlgara", nombre_en: "Bulgarian split squat", gif_url: "a.gif" },
  { id: 2, nombre_es: "Sentadilla búlgara con mancuernas en step", nombre_en: null, gif_url: null },
  { id: 3, nombre_es: "Press de banca", nombre_en: "Bench press", image: "b.png" },
  { id: 4, nombre_es: "Zancada búlgara alterna", nombre_en: null },
];

describe("normalizarBusqueda", () => {
  it("saca tildes, mayúsculas y puntuación para poder comparar", () => {
    expect(normalizarBusqueda("Sentadilla BÚLGARA (con mancuernas)")).toBe("sentadilla bulgara con mancuernas");
    expect(normalizarBusqueda("  press   de   banca  ")).toBe("press de banca");
  });

  it("no explota con basura", () => {
    expect(normalizarBusqueda(null)).toBe("");
    expect(normalizarBusqueda(undefined)).toBe("");
    expect(normalizarBusqueda(123)).toBe("123");
  });
});

describe("buscarEnCatalogo", () => {
  it("encuentra aunque el profe escriba sin tilde y a medias", () => {
    const r = buscarEnCatalogo(CATALOGO, "sentadilla bul");
    expect(r.map((s) => s.nombre)).toEqual([
      "Sentadilla búlgara",
      "Sentadilla búlgara con mancuernas en step",
    ]);
  });

  it("el que empieza con lo escrito va antes que el que solo lo contiene", () => {
    const r = buscarEnCatalogo(CATALOGO, "bulgara");
    expect(r[0].nombre).toBe("Sentadilla búlgara");
    expect(r.map((s) => s.nombre)).toContain("Zancada búlgara alterna");
  });

  it("también busca por el nombre en inglés del dataset original", () => {
    expect(buscarEnCatalogo(CATALOGO, "bench")[0].nombre).toBe("Press de banca");
  });

  it("marca si el ejercicio ya tiene imagen (gif o foto)", () => {
    const [conGif] = buscarEnCatalogo(CATALOGO, "sentadilla bulgara");
    expect(conGif.tiene_imagen).toBe(true);
    expect(conGif.origen).toBe("catalogo");
    expect(conGif.catalogo_id).toBe("1");
    expect(buscarEnCatalogo(CATALOGO, "sentadilla bulgara con mancuernas")[0].tiene_imagen).toBe(false);
  });

  it("sin texto o sin catálogo no devuelve nada (no muestra el catálogo entero)", () => {
    expect(buscarEnCatalogo(CATALOGO, "")).toEqual([]);
    expect(buscarEnCatalogo(CATALOGO, "   ")).toEqual([]);
    expect(buscarEnCatalogo(null, "press")).toEqual([]);
    expect(buscarEnCatalogo(CATALOGO, "zzzzz")).toEqual([]);
  });
});

describe("ordenarSugerencias", () => {
  it("los del catálogo van SIEMPRE primero: si existe, se usa ese y no uno nuevo", () => {
    const delCatalogo = buscarEnCatalogo(CATALOGO, "press");
    const r = ordenarSugerencias(delCatalogo, ["Press militar", "Press francés"]);
    expect(r[0].origen).toBe("catalogo");
    expect(r.slice(1).every((s) => s.origen === "nuevo")).toBe(true);
  });

  it("no propone como nuevo un nombre que ya está en el catálogo, aunque venga sin tilde", () => {
    const delCatalogo = buscarEnCatalogo(CATALOGO, "sentadilla bulgara");
    const r = ordenarSugerencias(delCatalogo, ["sentadilla bulgara", "Sentadilla búlgara con barra"]);
    expect(r.filter((s) => normalizarBusqueda(s.nombre) === "sentadilla bulgara")).toHaveLength(1);
    expect(r.find((s) => s.nombre === "Sentadilla búlgara con barra").origen).toBe("nuevo");
  });

  it("nunca devuelve más del máximo pedido", () => {
    const muchos = ["a", "b", "c", "d", "e", "f", "g", "h"];
    expect(ordenarSugerencias([], muchos, 6)).toHaveLength(6);
    expect(ordenarSugerencias(buscarEnCatalogo(CATALOGO, "sentadilla"), muchos, 6)).toHaveLength(6);
  });
});

describe("normalizarGrupo", () => {
  it("acepta los 15 grupos reales escritos como los escriba el modelo", () => {
    expect(GRUPOS_DI).toHaveLength(15);
    expect(normalizarGrupo("gluteos")).toBe("Glúteos");
    expect(normalizarGrupo("PRED. RODILLA")).toBe("Pred. Rodilla");
    expect(normalizarGrupo("  bíceps ")).toBe("Bíceps");
  });

  it("rechaza el grupo inventado en vez de guardarlo", () => {
    expect(normalizarGrupo("Piernas")).toBe(null);
    expect(normalizarGrupo("")).toBe(null);
    expect(normalizarGrupo(null)).toBe(null);
  });
});

describe("hoy", () => {
  it("devuelve la fecha en formato AAAA-MM-DD con los ceros adelante", () => {
    expect(hoy()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("requerimiento energético", () => {
  // `actividad` es obligatorio: sin nivel de actividad no hay factor por el que
  // multiplicar la tasa basal, y la función devuelve null a propósito.
  const alumno = { sexo: "masculino", peso: 80, altura: 178, edad: 35, actividad: "moderado" };

  it("Mifflin-St Jeor da un número razonable para un adulto", () => {
    const tmb = mifflinStJeor(alumno);
    expect(tmb).toBeGreaterThan(1200);
    expect(tmb).toBeLessThan(2500);
  });

  it("Cunningham sube con la masa magra", () => {
    expect(cunningham(70)).toBeGreaterThan(cunningham(60));
  });

  it("TODO O NADA: si falta un dato obligatorio devuelve null, nunca un NaN", () => {
    // Es la restricción que puso el especialista de seguridad: un NaN guardado
    // en la base es peor que no calcular.
    expect(calcularRequerimiento({})).toBe(null);
    expect(calcularRequerimiento({ sexo: "masculino", peso: 80 })).toBe(null);
    expect(calcularRequerimiento({ ...alumno, peso: null })).toBe(null);
  });

  it("con los datos completos devuelve algo, y nunca un NaN adentro", () => {
    const r = calcularRequerimiento(alumno);
    expect(r).not.toBe(null);
    const numeros = JSON.stringify(r).match(/null|NaN/g) || [];
    expect(numeros).not.toContain("NaN");
  });
});

// ── PERIODIZACIÓN EN DOS NIVELES (2026-08-10) ─────────────────────────
// Las 3 reglas que, si se rompen, rompen en silencio: que asignar un
// predeterminado no le borre las fechas al alumno, que editar la prescripción
// corte la herencia, y que poner la fecha de inicio NO la corte.
describe("periodizacion — herencia de dos niveles", () => {
  const GLOBAL = [
    { semana: 1, series: 2, reps: 8, intensidad: "60%" },
    { semana: 2, series: 3, reps: 8, intensidad: "70%" },
  ];
  const alumno = () => ({
    id: "a1",
    rm: {},
    plan: { periodizacion: [{ semana: 1, series: 5, reps: 5, intensidad: "80%", fecha: "10/8", anio: 2026 }] },
  });

  it("asignar un predeterminado copia las semanas y conserva las fechas del alumno", () => {
    const r = conPeriodizacionDe(alumno(), "hipertrofia", "principiante", GLOBAL);
    expect(r.plan.periodizacion.length).toBe(2);
    expect(r.plan.periodizacion[0]).toMatchObject({ semana: 1, series: 2, reps: 8, fecha: "10/8", anio: 2026 });
    expect(r.plan.periodizacion[1].fecha).toBeUndefined();
    expect(esPeriodizacionPropia(r)).toBe(false);
    expect(refPeriodizacion(r)).toEqual({ objetivo: "hipertrofia", nivel: "principiante" });
  });

  it("cambiar series/reps la vuelve propia; cambiar solo la fecha NO", () => {
    const heredado = conPeriodizacionDe(alumno(), "fuerza", "avanzado", GLOBAL);
    const soloFecha = heredado.plan.periodizacion.map((s) => ({ ...s, fecha: "1/9" }));
    expect(esPeriodizacionPropia(conPeriodizacionEditada(heredado, soloFecha))).toBe(false);
    const conCambio = heredado.plan.periodizacion.map((s, i) => (i === 0 ? { ...s, series: 4 } : s));
    expect(esPeriodizacionPropia(conPeriodizacionEditada(heredado, conCambio))).toBe(true);
  });

  it("propagar actualiza a los que heredan y nunca pisa al que tiene la suya", () => {
    const hereda = conPeriodizacionDe({ ...alumno(), id: "hereda" }, "fuerza", "avanzado", GLOBAL);
    const propio = conPeriodizacionEditada(hereda, [{ semana: 1, series: 9, reps: 9, intensidad: "99%" }]);
    const otroObjetivo = conPeriodizacionDe({ ...alumno(), id: "otro" }, "hipertrofia", "avanzado", GLOBAL);
    const nuevas = [{ semana: 1, series: 7, reps: 3, intensidad: "88%" }];
    const [a, b, c] = propagarPeriodizacion([hereda, propio, otroObjetivo], "fuerza", "avanzado", nuevas);
    expect(a.plan.periodizacion[0].series).toBe(7);
    expect(b.plan.periodizacion[0].series).toBe(9);
    expect(c.plan.periodizacion.length).toBe(2);
  });
});

// ── VARIANTES DE PLAN (2026-08-10) ──────────────────────────────────────
// Lo que se rompe en silencio acá es lo que ya pasó una vez: un plan asignado
// que en la pantalla del alumno aparece sin descripción y sin GIF, porque la
// variante solo guarda catalogo_id y nadie fue a buscar el resto al catálogo.
describe("variantes de plan → plan asignable", () => {
  const CATALOGO = [
    { id: "0043", codigo_di: "CU005", nombre_es: "Sentadilla con barra", gif_url: "videos/0043-qXTaZnJ.gif", instrucciones_es: "Ponte de pie con los pies separados…" },
    { id: "DI-GL007", codigo_di: "GL007", nombre_es: "Hip thrust con barra", gif_url: "/ejercicios/hip-thrust.gif", instrucciones_es: "Espalda en el banco…" },
    { id: "DI-CO004", codigo_di: "CO004", nombre_es: "Plancha", gif_url: "", instrucciones_es: "Antebrazos y punta de pies…" },
  ];
  const VARIANTE = {
    id: "v1", nombre: "Bilateral", familia: "bilateral", dia_ciclo: null, descripcion: "",
    ejercicios: [
      { nombre: "Sentadilla con barra", patron: "Sentadilla", catalogo_id: "0043" },
      { nombre: "Hip thrust con barra", patron: "Glúteo", catalogo_id: "DI-GL007" },
      { nombre: "Plancha", patron: "Core", catalogo_id: "DI-CO004" },
    ],
  };

  it("trae desc, código y GIF del catálogo por catalogo_id", () => {
    const plan = varianteAPlan(VARIANTE, CATALOGO);
    expect(plan.dias.length).toBe(1);
    const [sentadilla, hip] = plan.dias[0].ejercicios;
    expect(sentadilla.desc).toContain("Ponte de pie");
    expect(sentadilla.codigo).toBe("CU005");
    // path relativo del bucket → URL completa; path absoluto de la app, intacto
    expect(sentadilla.gif).toMatch(/^https?:\/\/.+\/catalogo-ejercicios\/videos\/0043-qXTaZnJ\.gif$/);
    expect(hip.gif).toBe("/ejercicios/hip-thrust.gif");
  });

  it("todos los ejercicios llegan, con id propio y unidad", () => {
    const plan = varianteAPlan(VARIANTE, indexarCatalogo(CATALOGO));
    const ejs = plan.dias[0].ejercicios;
    expect(ejs.length).toBe(3);
    expect(new Set(ejs.map((e) => e.id)).size).toBe(3);
    expect(ejs[0].unidad).toBe("reps");
    // la plancha se mide por tiempo, no por repeticiones
    expect(ejs[2].unidad).toBe("segundos");
  });

  it("un ejercicio que no está en el catálogo no rompe ni inventa datos", () => {
    const rara = { ...VARIANTE, ejercicios: [{ nombre: "Ejercicio fantasma", patron: "Core", catalogo_id: "9999" }] };
    const ej = varianteAPlan(rara, CATALOGO).dias[0].ejercicios[0];
    expect(ej.nombre).toBe("Ejercicio fantasma");
    expect(ej.gif).toBe("");
    expect(ej.codigo).toBe(null);
    expect(ej.desc).toBe("Patrón: Core");
  });

  it("las de varios días nombran el día del ciclo, las de un día no", () => {
    expect(varianteAPlan(VARIANTE, CATALOGO).dias[0].dia).toBe("Sesión");
    const ppl = { ...VARIANTE, nombre: "PPL · Piernas", familia: "ppl", dia_ciclo: 3 };
    expect(varianteAPlan(ppl, CATALOGO).dias[0].dia).toBe("Día 3");
    expect(etiquetaVariante(ppl)).toBe("Día 3 · Piernas");
    expect(etiquetaVariante(VARIANTE)).toBe("Bilateral");
  });

  it("agrupa por familia en orden y ordena los días del ciclo", () => {
    const vs = [
      { id: "c", nombre: "PPL · Piernas", familia: "ppl", dia_ciclo: 3, ejercicios: [] },
      // 2026-08-10: la familia "bilateral" pasó a llamarse "full_body_avanzado"
      // (migración 036) y va antes que el PPL en FAMILIAS_VARIANTE.
      { id: "a", nombre: "Preparación física avanzada · Full body", familia: "full_body_avanzado", dia_ciclo: null, ejercicios: [] },
      { id: "b", nombre: "PPL · Empuje", familia: "ppl", dia_ciclo: 1, descripcion: "Rutina tradicional de 3 días", ejercicios: [] },
    ];
    const g = agruparVariantes(vs);
    expect(g.map((x) => x.familia)).toEqual(["full_body_avanzado", "ppl"]);
    expect(g[1].variantes.map((v) => v.dia_ciclo)).toEqual([1, 3]);
    expect(g[1].descripcion).toBe("Rutina tradicional de 3 días");
  });
});

// ══════════════════════════════════════════════════════════════════════
// PERIODIZACIÓN POR DÍA + ESTRUCTURA DEL DÍA (2026-08-10)
// ══════════════════════════════════════════════════════════════════════

describe("periodizacion — herencia POR DÍA (alumno → día)", () => {
  const DEL_ALUMNO = [
    { semana: 1, series: 3, reps: 10, intensidad: "70%" },
    { semana: 2, series: 3, reps: 12, intensidad: "70%" },
  ];
  const PROPIA = [{ semana: 1, series: 5, reps: 5, intensidad: "85%" }];

  it("el día sin periodización propia usa la del alumno", () => {
    const dia = { id: "p1", dia_semana: "Lunes", periodizacion_propia: null };
    expect(esPeriodizacionDiaPropia(dia)).toBe(false);
    expect(periodizacionDelDia(dia, DEL_ALUMNO)).toEqual(DEL_ALUMNO);
  });

  it("un array vacío NO cuenta como propia — sigue heredando", () => {
    // Importa: guardarPeriodizacionDia normaliza [] a NULL, pero un dato viejo
    // o un guardado a medias no puede dejar al día sin ninguna progresión.
    const dia = { id: "p1", periodizacion_propia: [] };
    expect(esPeriodizacionDiaPropia(dia)).toBe(false);
    expect(periodizacionDelDia(dia, DEL_ALUMNO)).toEqual(DEL_ALUMNO);
  });

  it("el día con la suya no se pisa desde el alumno (fuerza un día, volumen el otro)", () => {
    const lunes = { id: "p1", dia_semana: "Lunes", periodizacion_propia: PROPIA };
    const jueves = { id: "p2", dia_semana: "Jueves", periodizacion_propia: null };
    expect(periodizacionDelDia(lunes, DEL_ALUMNO)).toEqual(PROPIA);
    expect(periodizacionDelDia(jueves, DEL_ALUMNO)).toEqual(DEL_ALUMNO);
  });

  it("el resumen dice de un vistazo quién comparte y quién no, y saltea el plan sintético", () => {
    const r = resumenPeriodizacionDias([
      { id: "p1", dia_semana: "Lunes", periodizacion_propia: PROPIA },
      { id: "p2", dia_semana: "Jueves", periodizacion_propia: null },
      { id: "p3", dia_semana: "Fijo", _sintetico: true, periodizacion_propia: null },
    ]);
    expect(r.map((x) => [x.dia, x.propia])).toEqual([["Lunes", true], ["Jueves", false]]);
  });
});

describe("estructura del día — bloques, core y modo por tiempo", () => {
  const DIA_PLANO = {
    dia: "Sesión",
    ejercicios: [{ id: "a", nombre: "Press" }, { id: "b", nombre: "Remo" }],
  };
  const DIA_JACOBO = {
    dia: "Día 1",
    config: { core: "intercalado" },
    ejercicios: [
      { id: "a", nombre: "Press de banca", seccion: "principal" },
      { id: "b", nombre: "Press Pallof", seccion: "core" },
      { id: "c", nombre: "Fondos de tríceps", seccion: "finisher" },
    ],
  };
  const DIA_CIRCUITO = {
    dia: "Sesión",
    config: { modo: "tiempo", segundos: 30, rondas: 4 },
    ejercicios: [{ id: "a", nombre: "Sentadilla" }],
  };

  it("un día viejo, sin nada nuevo, se comporta igual que antes", () => {
    // Esta es LA prueba de que la migración no cambia nada: todo al bloque
    // principal, modo repeticiones, core al final.
    const b = bloquesDelDia(DIA_PLANO);
    expect(b.principal.length).toBe(2);
    expect(b.core).toEqual([]);
    expect(b.finisher).toEqual([]);
    expect(configDia(DIA_PLANO)).toMatchObject({ modo: "reps", core: "final" });
    expect(esPorTiempo(DIA_PLANO)).toBe(false);
    expect(textoModo(DIA_PLANO)).toBe("");
  });

  it("parte el día de Jacobo en principal · core · finisher", () => {
    const b = bloquesDelDia(DIA_JACOBO);
    expect(b.principal.map((e) => e.id)).toEqual(["a"]);
    expect(b.core.map((e) => e.id)).toEqual(["b"]);
    expect(b.finisher.map((e) => e.id)).toEqual(["c"]);
    expect(configDia(DIA_JACOBO).core).toBe("intercalado");
    expect(textoCore(DIA_JACOBO)).toMatch(/Entre rondas/);
  });

  it("una sección inventada NO desaparece: cae al bloque principal", () => {
    const b = bloquesDelDia({ ejercicios: [{ id: "x", seccion: "abdominales" }] });
    expect(b.principal.map((e) => e.id)).toEqual(["x"]);
  });

  it("modo tiempo: la prescripción son segundos y rondas, no series y reps", () => {
    expect(esPorTiempo(DIA_CIRCUITO)).toBe(true);
    const semana = { series: 3, reps: 10, intensidad: "70%" };
    expect(prescripcionDelDia(DIA_CIRCUITO, semana)).toEqual({ series: 4, reps: "30 s", intensidad: "" });
    // En modo repeticiones la semana de la periodización pasa intacta.
    expect(prescripcionDelDia(DIA_PLANO, semana)).toBe(semana);
    expect(textoModo(DIA_CIRCUITO)).toBe("30 s por ejercicio · 4 rondas");
  });

  it("modo tiempo mal cargado usa 30 s x 4 rondas en vez de mostrar 'undefined s'", () => {
    expect(textoModo({ config: { modo: "tiempo" } })).toBe("30 s por ejercicio · 4 rondas");
  });
});

describe("varianteAPlan — secciones y estructura del día", () => {
  it("una variante vieja (sin seccion ni config) sigue dando un día plano", () => {
    const vieja = {
      nombre: "Full body avanzado",
      familia: "full_body_avanzado",
      ejercicios: [{ nombre: "Press de banca", catalogo_id: "3" }, { nombre: "Sentadilla búlgara", catalogo_id: "1" }],
    };
    const p = varianteAPlan(vieja, CATALOGO);
    expect(p.dias[0].config).toEqual({});
    expect(p.dias[0].ejercicios.every((e) => e.seccion === "principal")).toBe(true);
  });

  it("lleva core, finisher y config de la variante al día", () => {
    const v = {
      nombre: "Hipertrofia · Día 1",
      familia: "hipertrofia_2",
      dia_ciclo: 1,
      config: { core: "intercalado" },
      ejercicios: [
        { nombre: "Press de banca", catalogo_id: "0025" },
        { nombre: "Press Pallof", catalogo_id: "0979", seccion: "core" },
        { nombre: "Fondos de tríceps", catalogo_id: "0814", seccion: "finisher" },
      ],
    };
    const dia = varianteAPlan(v, CATALOGO).dias[0];
    expect(dia.config).toEqual({ core: "intercalado" });
    expect(dia.ejercicios.map((e) => e.seccion)).toEqual(["principal", "core", "finisher"]);
    const b = bloquesDelDia(dia);
    expect(b.core.length).toBe(1);
    expect(b.finisher.length).toBe(1);
  });

  it("en modo tiempo todos los ejercicios quedan en segundos, sin marcarlos uno por uno", () => {
    const v = {
      nombre: "Circuito intermitente de fuerza",
      familia: "circuito",
      config: { modo: "tiempo", segundos: 30, rondas: 4 },
      ejercicios: [{ nombre: "Sentadilla con barra", catalogo_id: "0043" }],
    };
    const dia = varianteAPlan(v, CATALOGO).dias[0];
    expect(dia.ejercicios.every((e) => e.unidad === "segundos")).toBe(true);
    expect(esPorTiempo(dia)).toBe(true);
  });
});

// 2026-08-12 — pedido de Lucas: "quiero dejar las planificaciones separadas de
// los planes de ejercicios... los dos me tienen que dar la opción de dejar sin
// ningún predeterminado. sin plan". Lo que se testea acá es justamente eso:
// que "sin nada" sea un estado válido de las DOS cosas y que ninguna arrastre
// a la otra. Es lo que rompe en silencio, porque en pantalla se ve igual.
describe("separación planificación ↔ plan de ejercicios (sin ninguno)", () => {
  const CAT = [
    { id: "0043", codigo_di: "CU005", nombre_es: "Sentadilla con barra", gif_url: "videos/0043.gif", instrucciones_es: "Pies separados…" },
  ];
  const VARIANTES = [
    { id: 7, nombre: "PPL · Empuje", familia: "ppl", dia_ciclo: 1, ejercicios: [{ nombre: "Sentadilla con barra", catalogo_id: "0043" }] },
  ];

  it("sin elegir nada, el alta crea un plan VACÍO a propósito (no una plantilla por default)", () => {
    const { plan, origen } = planDeEleccion(SIN_PLAN, VARIANTES, indexarCatalogo(CAT));
    expect(plan.dias).toEqual([]);
    expect(plan.nombre).toBe("Sin plan");
    expect(origen).toBe(null);
  });

  it("dos días sin plan no comparten el mismo array (editar uno no toca el otro)", () => {
    const a = planVacio(), b = planVacio();
    a.dias.push({ dia: "Lunes" });
    expect(b.dias).toEqual([]);
  });

  it("elegir una variante real del alta trae sus ejercicios y queda marcada como catálogo v2", () => {
    const { plan, origen } = planDeEleccion(valorVariante(VARIANTES[0]), VARIANTES, indexarCatalogo(CAT));
    expect(plan.dias[0].ejercicios.map((e) => e.nombre)).toEqual(["Sentadilla con barra"]);
    expect(origen).toBe("catalogo_v2");
  });

  it("un valor que ya no existe (variante borrada) cae en sin plan, nunca rompe el alta", () => {
    expect(planDeEleccion("v:9999", VARIANTES, {}).plan.dias).toEqual([]);
    expect(planDeEleccion(undefined, VARIANTES, {}).plan.dias).toEqual([]);
  });

  it("sacarle la planificación al alumno le borra las semanas y la referencia, sin tocar sus ejercicios", () => {
    const al = {
      nombre: "Rosa",
      rm: { prep_propias: ["periodizacion", "movilidad_corta"], periodizacion_ref: { objetivo: "fuerza", nivel: "avanzado" } },
      plan: { periodizacion: [{ semana: 1, series: 5, reps: 5 }], dias: [{ dia: "Lunes", ejercicios: [{ nombre: "Sentadilla" }] }] },
    };
    expect(tienePeriodizacion(al)).toBe(true);
    const sin = sinPeriodizacion(al);
    expect(tienePeriodizacion(sin)).toBe(false);
    expect(refPeriodizacion(sin)).toBe(null);
    expect(esPeriodizacionPropia(sin)).toBe(false);
    // La marca de OTRA lista (movilidad) no se toca: son cosas distintas.
    expect(sin.rm.prep_propias).toEqual(["movilidad_corta"]);
    // Y los ejercicios siguen ahí: sacar la progresión no borra el plan.
    expect(sin.plan.dias).toEqual(al.plan.dias);
  });

  it("un alumno sin planificación puede volver a recibir un predeterminado (no queda trabado)", () => {
    const sin = sinPeriodizacion({ rm: {}, plan: { periodizacion: [] } });
    const con = conPeriodizacionDe(sin, "hipertrofia", "principiante", [{ semana: 1, series: 3, reps: 10 }]);
    expect(tienePeriodizacion(con)).toBe(true);
    expect(refPeriodizacion(con)).toEqual({ objetivo: "hipertrofia", nivel: "principiante" });
  });
});

// -- UNIDAD DE CADA EJERCICIO (2026-08-12) -----------------------------------
// Lo que se rompe en silencio aca: el casillero le pide KILOS a un alumno que
// esta haciendo fondos o una plancha. Paso de verdad: hasta hoy todo lo que no
// se llamara "plancha" se registraba en kilos.
describe("unidades - kilos / repeticiones / segundos", () => {
  it("el isometrico gana sobre el peso corporal: una plancha va en segundos", () => {
    expect(unidadPorRegla({ nombre: "Plancha frontal", equipment_es: "Peso corporal" })).toBe("segundos");
    expect(unidadPorRegla({ nombre: "Puente de gluteos isometrico", equipment_es: "Peso corporal" })).toBe("segundos");
  });

  it("peso corporal y banda van en repeticiones, no en kilos", () => {
    expect(unidadPorRegla({ nombre: "Fondos en paralelas", equipment_es: "Peso corporal" })).toBe("repeticiones");
    expect(unidadPorRegla({ nombre: "Dominada asistida con banda", equipment_es: "Banda" })).toBe("repeticiones");
  });

  it("lo que lleva carga externa sigue en kilos", () => {
    expect(unidadPorRegla({ nombre: "Press de banca", equipment_es: "Barra" })).toBe("kilos");
    expect(unidadPorRegla({ nombre: "Dominada con peso extra", equipment_es: "Con peso extra" })).toBe("kilos");
  });

  it("'reps' es el default VIEJO: significa 'sin definir', no 'repeticiones'", () => {
    // Si se leyera como repeticiones, todos los planes viejos pasarian a
    // pedirle repeticiones al alumno en un press de banca.
    expect(unidadDe({ unidad: "reps", nombre: "Press de banca", equipment_es: "Barra" })).toBe("kilos");
    // Y lo que SI esta definido se respeta tal cual, sin deducir nada.
    expect(unidadDe({ unidad: "repeticiones", nombre: "Press de banca", equipment_es: "Barra" })).toBe("repeticiones");
    expect(unidadDe({ unidad: "segundos", nombre: "Press de banca" })).toBe("segundos");
  });

  it("cada unidad tiene su etiqueta en el casillero del alumno", () => {
    expect(ETIQUETA_HOY.kilos).toBe("KG HOY");
    expect(ETIQUETA_HOY.repeticiones).toBe("REPS HOY");
    expect(ETIQUETA_HOY.segundos).toBe("SEG HOY");
  });
});
