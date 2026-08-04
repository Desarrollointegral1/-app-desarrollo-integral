// Self-check del parser de pasos. Sin framework: `node src/utils/pasosInstrucciones.test.mjs`
// Los dos primeros textos son REALES, copiados de catalogo_ejercicios en producción.
import assert from "node:assert/strict";
import { pasosDeInstrucciones } from "./pasosInstrucciones.js";

// Real: "Elíptico (cross trainer)" — el caso típico, 5 pasos.
const eliptico =
  "Ajusta la altura del asiento y colócate en la bicicleta elíptica. Coloca los pies en los pedales y sujeta el manillar. Comienza a pedalear con un movimiento suave y controlado. Mantén un ritmo constante y aumenta la resistencia si lo deseas. Continúa pedaleando durante la duración deseada de tu entrenamiento cardiovascular.";
assert.equal(pasosDeInstrucciones(eliptico).length, 5);
assert.equal(pasosDeInstrucciones(eliptico)[0], "Ajusta la altura del asiento y colócate en la bicicleta elíptica.");

// Real: "Superman" — 2 pasos, el segundo es corto pero es un paso de verdad.
const superman = "Boca abajo, elevá brazos y piernas al mismo tiempo apretando la espalda. Bajá lento.";
assert.deepEqual(pasosDeInstrucciones(superman), [
  "Boca abajo, elevá brazos y piernas al mismo tiempo apretando la espalda.",
  "Bajá lento.",
]);

// Guarda: una sola oración no es una lista — cae al párrafo.
assert.equal(pasosDeInstrucciones("Mantené la posición todo lo que puedas."), null);
assert.equal(pasosDeInstrucciones(""), null);
assert.equal(pasosDeInstrucciones(null), null);

// Guarda: más de 12 pedazos también cae al párrafo.
assert.equal(pasosDeInstrucciones("Uno. Dos. Tres. Cuatro. Cinco. Seis. Siete. Ocho. Nueve. Diez. Once. Doce. Trece."), null);

// NO corta donde no hay mayúscula después del punto: decimales, abreviaturas,
// grados. Hoy el catálogo no tiene ninguno, pero el editor del admin es texto
// libre y mañana puede.
assert.equal(pasosDeInstrucciones("Cargá 2.5 kg por lado y subí. Bajá lento.").length, 2);
assert.deepEqual(pasosDeInstrucciones("Flexioná aprox. 45° la rodilla. Volvé al inicio."), [
  "Flexioná aprox. 45° la rodilla.",
  "Volvé al inicio.",
]);

// Un salto de línea escrito a mano en el editor también es un corte de paso.
assert.equal(pasosDeInstrucciones("Agarrá la barra\nEmpujá arriba").length, 2);

console.log("pasosInstrucciones: OK");
