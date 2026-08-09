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
