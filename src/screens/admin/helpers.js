// Helpers compartidos por AdminPanel y sus secciones (src/screens/admin/).
// Movidos textualmente desde AdminPanel.jsx en el refactor de partición.

// PIN demasiado fácil (auditoría 2026-08-02): repetidos (0000..9999) o
// secuencias ascendentes/descendentes (1234, 4321, 2345...). Sube el piso
// real de seguridad más que casi cualquier otra cosa por lo barato que es.
export const PIN_TRIVIAL = (p) => /^(\d)\1{3}$/.test(p) || "0123456789".includes(p) || "9876543210".includes(p);
// Modalidades de entrenamiento del alumno (pedido de Lucas 2026-07-20).
// 2026-07-30 (pedido de Lucas): las categorías se reescriben en términos de
// CON QUIÉN entrena, no de "presencial/a distancia" — "entrena solo en
// Desarrollo Integral" sonaba a que el alumno está abandonado. Tres
// categorías fijas, ni una más.
// 2026-08-09: se saca "Paciente de Griselda". La rehabilitación dejó de ser
// una modalidad de alumno y pasó a ser su propia app (rehab/), con pacientes
// en tablas propias — acá no queda ni el tipo ni la modalidad.
export const MODALIDADES = [
  "Entrena con Lucas",
  "Entrena con Ariel",
  "Entrena en Desarrollo Integral",
];
// Los 7 alumnos que ya existen tienen guardado el texto VIEJO en la columna
// `modalidad`. No se toca la base: se traduce al mostrar y al abrir el
// formulario, así ninguno queda sin categoría. "A distancia" no tiene
// equivalente en la lista nueva — se deja pasar tal cual (ver
// modalidadLabel: lo que no está en el mapa vuelve sin cambios) y se sigue
// mostrando como chip suelto en el editor hasta que Lucas lo reasigne.
export const MODALIDAD_LEGACY = {
  "Presencial con Lucas": "Entrena con Lucas",
  "Presencial con Ariel": "Entrena con Ariel",
  "Entrena solo en Desarrollo Integral": "Entrena en Desarrollo Integral",
};
export const modalidadLabel = (m) => (m ? MODALIDAD_LEGACY[m] || m : "");
