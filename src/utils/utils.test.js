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
import { calcularEdad, getYTId, hoy } from "./helpers.js";
import { calcularRequerimiento, mifflinStJeor, cunningham } from "./energia.js";
import { getEjercicioGif, resolverGif, SIN_GIF } from "./ejerciciosMedia.js";
import { _columnasCambiadas } from "../../services/supabase.js";
import {
  vueltasDe, vueltasCargadas, pesoRepresentativo, volumenDe,
  setVuelta, cantidadDeVueltas, resumenVueltas,
} from "./pesos.js";
import {
  normalizarBusqueda, buscarEnCatalogo, ordenarSugerencias, normalizarGrupo, GRUPOS_DI,
} from "./ejercicioAsistido.js";

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
