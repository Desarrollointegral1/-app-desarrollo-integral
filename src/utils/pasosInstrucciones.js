// Las instrucciones del catálogo (catalogo_ejercicios.instrucciones_es) vienen
// SIEMPRE como un párrafo corrido: medido 2026-08-04 contra los 1343 ejercicios
// de producción, los 1343 no tienen un solo salto de línea y promedian 493
// caracteres. Pero el texto ya está redactado como pasos secuenciales
// ("Ajustá... Sentate... Sujetá... Empujá..."), así que numerarlos es un cambio
// de render, no reescribir el catálogo.
//
// El corte es por oración y SOLO cuando después del punto viene una mayúscula.
// Verificado contra los 1343 textos reales:
//   · 5-7 pasos en 1092 de 1343 (82%), máximo 11 — nunca explota en esquirlas.
//   · 0 textos con "número. Mayúscula", 0 con abreviatura + mayúscula
//     ("aprox. Luego"), 0 con decimales — o sea, 0 cortes falsos posibles.
//   · Las partes más cortas que quedan son pasos legítimos de verdad:
//     "Bajá lento.", "Cambiá de mano.", "Alterná."
//
// Lookahead (?=...) y no lookbehind (?<=...) a propósito: el lookbehind es un
// error de SINTAXIS al parsear el regex en iOS Safari < 16.4, y como esto es un
// literal de módulo tiraría abajo el bundle entero en esos celulares.
//
// El separador es "\n" porque los 1343 textos no traen ni uno (verificado); y si
// algún día alguien escribe uno a mano en el editor, cortar ahí es lo correcto.
export function pasosDeInstrucciones(texto) {
  if (!texto) return null;
  const partes = texto
    .replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÑÜ¿¡])/g, "$1\n")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  // Guarda: si el corte no da una lista razonable, el llamador muestra el
  // párrafo de siempre. Reversible por dato, no todo-o-nada.
  return partes.length >= 2 && partes.length <= 12 ? partes : null;
}
