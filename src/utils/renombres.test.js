// Chequeo de los renombres que Lucas hace desde la app (2026-08-12).
//
// Para qué existe: renombrar parece inofensivo y no lo es. En esta app hay dos
// lugares donde el NOMBRE es más que una etiqueta, y los dos rompen en
// silencio — no tiran error, simplemente después falta algo en la pantalla del
// alumno. Estos tests cubren esos dos.
//
// Se corre con: npm test

import { describe, expect, it } from "vitest";
import { getEjercicioGif, gifAlRenombrar } from "./ejerciciosMedia.js";
import { etiquetaPeriodizacion } from "./periodizacion.js";

// El bug que evita: el ejercicio que sacaba su ilustración del mapa POR NOMBRE
// se quedaba sin imagen apenas se lo renombraba, y no se notaba hasta abrir el
// plan de un alumno.
describe("gifAlRenombrar", () => {
  const conMapa = "hip thrust"; // existe en el mapa de ejerciciosMedia

  it("fija la imagen que tenía cuando el nombre nuevo no resuelve", () => {
    expect(gifAlRenombrar("", conMapa, "Empuje de cadera de Lucas")).toBe(getEjercicioGif(conMapa));
    expect(getEjercicioGif(conMapa)).not.toBe("");
  });

  it("no toca nada si el ejercicio ya tenía imagen propia", () => {
    expect(gifAlRenombrar("videos/0043.gif", conMapa, "Otro nombre")).toBe("");
  });

  it("no toca nada si el nombre nuevo también resuelve", () => {
    expect(gifAlRenombrar("", conMapa, "hip trust")).toBe("");
  });

  it("no toca nada si el nombre no cambió, o si el viejo tampoco resolvía", () => {
    expect(gifAlRenombrar("", conMapa, conMapa)).toBe("");
    expect(gifAlRenombrar("", "ejercicio que no existe en ningun mapa", "otro invento")).toBe("");
  });
});

// El bug que evita: renombrar una planificación en la base y que la pantalla
// siguiera mostrando "Hipertrofia · Principiante" porque el título salía de las
// constantes. Un renombre que no se ve es un renombre mentiroso.
describe("etiquetaPeriodizacion", () => {
  it("usa el nombre de la fila cuando existe", () => {
    const nombres = { "fuerza|avanzado": "Fuerza bruta" };
    expect(etiquetaPeriodizacion(nombres, "fuerza", "avanzado")).toBe("Fuerza bruta");
  });

  it("cae a objetivo · nivel cuando la fila no tiene nombre cargado", () => {
    expect(etiquetaPeriodizacion({}, "fuerza", "avanzado")).toBe("Fuerza · Avanzado");
    expect(etiquetaPeriodizacion(null, "hipertrofia", "principiante")).toBe("Hipertrofia · Principiante");
  });
});
