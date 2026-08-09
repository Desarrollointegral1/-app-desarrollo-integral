// ============================================================
// PESO POR VUELTA (por serie)
// ============================================================
// Pedido de Lucas (2026-08-09): "el peso se tiene que marcar por vuelta".
// Hasta hoy `registros_diarios.pesos` guardaba UN número por ejercicio y por
// día — el alumno hacía 4 series con pesos distintos y sólo quedaba uno.
//
// Formato nuevo: `pesos[ejercicio_id]` puede ser
//   - un número          → dato viejo, una sola vuelta (todo lo ya cargado)
//   - un array de números → una entrada por serie, con huecos permitidos
//
// Nada migra: estas funciones leen los dos formatos, así que el historial que
// ya existe sigue viéndose igual. Un registro viejo es, simplemente, un
// registro de una sola vuelta.

/** Devuelve SIEMPRE un array de vueltas, venga el dato como venga. */
export function vueltasDe(valor) {
  if (valor == null) return [];
  if (Array.isArray(valor)) return valor.map((v) => (v == null || v === "" ? null : Number(v)));
  const n = Number(valor);
  return isFinite(n) && n > 0 ? [n] : [];
}

/** Las vueltas realmente cargadas (sin los huecos), en orden. */
export function vueltasCargadas(valor) {
  return vueltasDe(valor).filter((v) => v != null && isFinite(v) && v > 0);
}

/**
 * El número que representa al ejercicio ese día cuando hay que mostrar UNO
 * solo: gráficos de evolución, comparación contra la sesión anterior, reporte
 * mensual.
 *
 * Es el MÁXIMO, no el promedio ni el último: lo que interesa seguir es la
 * carga más alta que movió, y así una serie de aproximación liviana no
 * ensucia la progresión. Con el formato viejo devuelve ese mismo número.
 */
export function pesoRepresentativo(valor) {
  const v = vueltasCargadas(valor);
  return v.length ? Math.max(...v) : 0;
}

/** Volumen del ejercicio ese día: la suma de todas las vueltas cargadas. */
export function volumenDe(valor) {
  return vueltasCargadas(valor).reduce((a, b) => a + b, 0);
}

/**
 * Escribe el peso de UNA vuelta y devuelve el valor nuevo del ejercicio.
 *
 * `serie` es 1-based (la vuelta 1 es la primera). Si el dato venía en formato
 * viejo (un número), se conserva como vuelta 1 en vez de perderse. Si se
 * escribe una vuelta más adelante que las que hay, el array se rellena con
 * huecos (null) en vez de correr las posiciones.
 */
export function setVuelta(valorActual, serie, peso) {
  const idx = Math.max(1, Number(serie) || 1) - 1;
  const arr = vueltasDe(valorActual);
  while (arr.length <= idx) arr.push(null);
  const n = peso === "" || peso == null ? null : Number(peso);
  arr[idx] = n != null && isFinite(n) && n > 0 ? n : null;
  // Si no quedó ninguna vuelta cargada, se devuelve null para poder sacar el
  // ejercicio del registro en vez de dejar un array de nulls.
  return arr.some((v) => v != null) ? arr : null;
}

/** Cuántos casilleros de peso mostrarle al alumno para un ejercicio. */
export function cantidadDeVueltas(valorActual, seriesDelPlan) {
  const delPlan = Number(seriesDelPlan);
  const cargadas = vueltasDe(valorActual).length;
  const base = isFinite(delPlan) && delPlan > 0 ? delPlan : 1;
  // Nunca esconder una vuelta ya cargada: si el plan bajó de 4 a 3 series y el
  // alumno ya había registrado 4, se siguen viendo las 4.
  return Math.max(base, cargadas, 1);
}

/** Texto corto para mostrar las vueltas de un día. Ej: "60 · 62,5 · 65" */
export function resumenVueltas(valor) {
  const v = vueltasCargadas(valor);
  if (!v.length) return "";
  return v.map((n) => String(n).replace(".", ",")).join(" · ");
}
