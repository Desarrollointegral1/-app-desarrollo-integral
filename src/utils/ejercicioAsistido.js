// Lógica pura del armador de ejercicios asistido (api/ejercicio-asistido.js).
//
// Vive acá y no dentro del endpoint para que sea testeable sin red ni modelo:
// la búsqueda en el catálogo, el orden de las sugerencias y la validación del
// grupo son las tres cosas que, si se rompen, se rompen en silencio.
//
// La regla de negocio que gobierna todo el archivo: si el ejercicio YA está en
// el catálogo hay que usar ese. Inventar un nombre nuevo cuando existe uno
// auditado duplica el catálogo y rompe los códigos DI.

// Los 15 grupos reales de catalogo_ejercicios (verificado 2026-08-09 contra la
// base: 1343 filas, ningún grupo_di fuera de esta lista). El modelo tiene que
// elegir uno de acá — un grupo inventado deja el ejercicio fuera de todos los
// filtros de la app.
export const GRUPOS_DI = [
  "Hombros",
  "Pecho",
  "Dorsales",
  "Bíceps",
  "Tríceps",
  "Core",
  "Glúteos",
  "Pred. Rodilla",
  "Pred. Cadera",
  "Pantorrillas",
  "Antebrazos",
  "Cardio",
  "Aductores",
  "Movilidad",
  "Cuello",
];

/**
 * Texto listo para comparar: sin tildes, en minúsculas, sin puntuación y con
 * los espacios colapsados. El profe escribe "sentadilla bulgara" y el catálogo
 * dice "Sentadilla búlgara" — sin esto no se encuentran nunca.
 */
export function normalizarBusqueda(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(texto) {
  return normalizarBusqueda(texto).split(" ").filter(Boolean);
}

/**
 * Busca en el catálogo por nombre_es y nombre_en.
 *
 * Ranking (menor es mejor): el nombre que EMPIEZA con lo escrito va antes que
 * el que lo contiene, y ese antes que el que tiene todas las palabras sueltas.
 * A igual score gana el nombre más corto — "Sentadilla búlgara" antes que
 * "Sentadilla búlgara con mancuernas en step".
 */
export function buscarEnCatalogo(catalogo, texto, max = 6) {
  const q = normalizarBusqueda(texto);
  if (!q || !Array.isArray(catalogo)) return [];
  const palabras = tokens(texto);

  const puntuados = [];
  for (const ej of catalogo) {
    const nombres = [ej?.nombre_es, ej?.nombre_en].filter(Boolean).map(normalizarBusqueda);
    if (!nombres.length) continue;
    let score = null;
    if (nombres.some((n) => n.startsWith(q))) score = 0;
    else if (nombres.some((n) => n.includes(q))) score = 1;
    else if (nombres.some((n) => palabras.every((p) => n.includes(p)))) score = 2;
    if (score === null) continue;
    puntuados.push({ ej, score, largo: (ej.nombre_es || ej.nombre_en || "").length });
  }

  puntuados.sort(
    (a, b) =>
      a.score - b.score ||
      a.largo - b.largo ||
      String(a.ej.nombre_es || "").localeCompare(String(b.ej.nombre_es || ""), "es")
  );

  return puntuados.slice(0, max).map(({ ej }) => ({
    nombre: ej.nombre_es || ej.nombre_en,
    origen: "catalogo",
    catalogo_id: ej.id != null ? String(ej.id) : null,
    tiene_imagen: Boolean(ej.gif_url || ej.image),
  }));
}

/**
 * Arma la lista final: los del catálogo SIEMPRE primero, los inventados por el
 * modelo después y solo si no repiten uno del catálogo (comparando normalizado,
 * así "Sentadilla Bulgara" no entra como nueva teniendo "Sentadilla búlgara").
 */
export function ordenarSugerencias(delCatalogo = [], nombresNuevos = [], max = 6) {
  const vistos = new Set();
  const salida = [];
  for (const s of delCatalogo) {
    const clave = normalizarBusqueda(s?.nombre);
    if (!clave || vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(s);
    if (salida.length >= max) return salida;
  }
  for (const nombre of nombresNuevos) {
    const clave = normalizarBusqueda(nombre);
    if (!clave || vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push({ nombre: String(nombre).trim(), origen: "nuevo", catalogo_id: null, tiene_imagen: false });
    if (salida.length >= max) break;
  }
  return salida;
}

/**
 * Devuelve el grupo canónico (tal cual está escrito en la base) o null si el
 * modelo se inventó uno. Compara sin tildes ni mayúsculas porque el modelo
 * escribe "gluteos" o "PRED. RODILLA" según el día.
 */
export function normalizarGrupo(grupo) {
  const q = normalizarBusqueda(grupo);
  if (!q) return null;
  return GRUPOS_DI.find((g) => normalizarBusqueda(g) === q) || null;
}
