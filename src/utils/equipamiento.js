// ============================================================
// BARRAS Y DISCOS SUGERIDOS — los ATAJOS, no un inventario — 2026-08-13
// ============================================================
// Textual de Lucas: "tenemos distintas barras, de 20, de 18, de 11, Barra
// Olimpica Romana Rulemanes, barra-ez-olimpica, eso tiene que poder
// modificarse, predeterminado 20 y poder bajar o subir".
//
// Y la corrección del mismo día, que cambia lo que ES este archivo: "no puede
// basarse en lo que tengo porque trabajamos en distintos gimnasios".
//
// QUÉ ES ESTO ENTONCES: los pesos que el alumno ve como BOTONES para tocar
// rápido. Un atajo, nunca un límite. En toda forma de carga el número también
// se puede escribir a mano, en el momento y sin entrar a configurar nada (ver
// SelectorCarga.jsx) — el alumno que entrena en otro gimnasio, con una barra
// de 15 que no está acá, la registra igual. Si esta lista fuera el único
// camino, le mentiría a la mitad de la gente.
//
// DÓNDE VIVE: en `app_config`, clave "equipamiento" — la MISMA tabla y el
// mismo patrón con el que ya se editan la movilidad y la entrada en calor
// (claves prep_*). No se inventó ni una tabla ni una pantalla nuevas: se edita
// en Biblioteca → "Barras y discos sugeridos", al lado de "Movilidad y entrada
// en calor" y "Periodizaciones".
//
// LO QUE ES DATO Y LO QUE ES ESTIMACIÓN: Lucas nombró las cinco barras y dio
// el peso de tres (20, 18 y 11), y dio los siete discos. De la Romana a
// rulemanes y de la EZ olímpica no dio el peso, así que NO se inventó: quedan
// con un número razonable y la marca `confirmar: true`, que la pantalla de
// edición muestra en amarillo. Apenas Lucas los corrige, la marca se va sola.
//
// PENDIENTE (no construido a propósito): un perfil de equipamiento por
// gimnasio o por alumno, para que cada uno vea los botones del lugar donde
// entrena. Con la entrada libre el caso queda cubierto; esto se suma encima
// si Lucas lo pide.

export const CLAVE_EQUIPAMIENTO = "equipamiento";

// El predeterminado que pidió Lucas: la barra arranca en 20 y de ahí se sube
// o se baja tocando otra.
export const BARRA_DEFAULT_KG = 20;

// ── LAS BARRAS ────────────────────────────────────────────────────────
// El `id` es lo que se guarda en el detalle del registro, así que renombrar
// una barra nunca rompe un registro viejo.
export const BARRAS_BASE = [
  { id: "b20", nombre: "Barra de 20", peso: 20 },
  { id: "b18", nombre: "Barra de 18", peso: 18 },
  { id: "b11", nombre: "Barra de 11", peso: 11 },
  // Las dos que Lucas nombró sin decir cuánto pesan. El peso de acá es un
  // punto de partida, NO un dato: por eso van marcadas.
  { id: "romana", nombre: "Barra olímpica romana a rulemanes", peso: 20, confirmar: true },
  { id: "ez", nombre: "Barra EZ olímpica", peso: 10, confirmar: true },
];

// ── DISCOS ────────────────────────────────────────────────────────────
// Los dio Lucas, textual (2026-08-13): "los discos son de 1.25, 2.5, 5, 10,
// 15, 20 y 25". Son siete, no seis — el de 25 no estaba en el juego estándar
// que habíamos puesto de arranque. Igual son un ATAJO: en otro gimnasio puede
// haber uno de 7,5 y el alumno lo escribe en el momento.
export const DISCOS_BASE = [1.25, 2.5, 5, 10, 15, 20, 25];

// ── MANCUERNAS Y KETTLEBELLS ──────────────────────────────────────────
// De estos Lucas no dijo nada. Van los valores estándar de gimnasio como
// punto de partida, editables igual que las barras y salteables igual que
// todo lo demás: el peso que no esté se escribe a mano.
export const MANCUERNAS_BASE = [
  2, 3, 4, 5, 6, 7, 8, 9, 10,
  12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40,
];
export const KETTLEBELLS_BASE = [4, 6, 8, 10, 12, 16, 20, 24, 28, 32];

export const EQUIPAMIENTO_BASE = {
  barras: BARRAS_BASE,
  discos: DISCOS_BASE,
  mancuernas: MANCUERNAS_BASE,
  kettlebells: KETTLEBELLS_BASE,
};

const numero = (v) => {
  const n = Number(String(v).replace(",", "."));
  return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};

const listaDeNumeros = (arr, base) => {
  if (!Array.isArray(arr)) return [...base];
  const limpios = arr.map(numero).filter((n) => n > 0);
  // Sin duplicados y de menor a mayor: el alumno busca el número tocando, y
  // una lista desordenada lo obliga a leerla entera.
  const out = [...new Set(limpios)].sort((a, b) => a - b);
  // Una lista vacía dejaría al alumno sin nada que tocar en medio de la serie
  // — que es exactamente el problema que vinimos a resolver. Vacío se lee como
  // "no cargado" y vuelve al estándar de gimnasio.
  return out.length ? out : [...base];
};

/**
 * Lo que hay en la sala, venga como venga de la base.
 *
 * Si la clave todavía no está cargada en app_config (o la migración no corrió)
 * devuelve el equipamiento base — la app funciona igual y Lucas lo ajusta
 * cuando quiera. Nunca devuelve listas vacías: una lista vacía dejaría al
 * alumno sin nada que tocar.
 */
export function normalizarEquipamiento(valor) {
  const v = valor && typeof valor === "object" ? valor : {};
  const barras = Array.isArray(v.barras) && v.barras.length
    ? v.barras
        .map((b, i) => ({
          id: String(b?.id || `barra${i}`),
          nombre: String(b?.nombre || "").trim() || `Barra ${i + 1}`,
          peso: numero(b?.peso) || BARRA_DEFAULT_KG,
          // La marca sobrevive el ida y vuelta a la base: si Lucas todavía no
          // confirmó el peso, el aviso tiene que seguir estando mañana.
          ...(b?.confirmar ? { confirmar: true } : {}),
        }))
    : BARRAS_BASE.map((b) => ({ ...b }));
  return {
    barras,
    discos: listaDeNumeros(v.discos, DISCOS_BASE),
    mancuernas: listaDeNumeros(v.mancuernas, MANCUERNAS_BASE),
    kettlebells: listaDeNumeros(v.kettlebells, KETTLEBELLS_BASE),
  };
}

/**
 * Con qué barra arranca un casillero vacío: la de 20 kg, como pidió Lucas.
 * Si la de 20 no existe (Lucas la sacó de la lista), la primera que haya.
 */
export function barraPredeterminada(equip) {
  const barras = (equip && equip.barras) || BARRAS_BASE;
  return barras.find((b) => b.peso === BARRA_DEFAULT_KG) || barras[0] || { id: "b20", nombre: "Barra de 20", peso: BARRA_DEFAULT_KG };
}

/** Las barras que Lucas todavía no confirmó. Se usa para avisarle en pantalla. */
export const barrasSinConfirmar = (equip) =>
  ((equip && equip.barras) || []).filter((b) => b.confirmar);
