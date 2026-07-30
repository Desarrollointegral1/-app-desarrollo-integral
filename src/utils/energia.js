// ══════════════════════════════════════════════════════════════════════
// REQUERIMIENTO ENERGÉTICO ESTIMADO — bloque 7 del protocolo de evaluación
//
// Base científica: G:\Mi unidad\Cerebro\desarrollo-integral\nutricion\
// cerebro\01-requerimiento-energetico.md (notebook 7937c7ef, Francis Holway
// como referencia central). Lo que este archivo respeta de esa fuente:
//
//  · La fórmula da un PUNTO DE PARTIDA, no una prescripción. Toda ecuación
//    predictiva arrastra un desvío estándar de ~150 kcal sobre la TMB — por
//    eso acá nunca se devuelve una cifra única, siempre un rango.
//  · Mifflin-St Jeor sobre peso total es el default práctico de Holway.
//    Cunningham (500 + 22 × masa libre de grasa) es superior CUANDO hay
//    antropometría confiable — por eso solo se calcula si hay % de grasa
//    cargado, nunca se inventa.
//  · Piso de seguridad: 30 kcal por kg de masa magra. Debajo de eso no hay
//    más resultado, hay T3 baja, hueso perdiendo densidad y hormonas
//    sexuales apagadas (Loucks vía Holway). Es una bandera para el
//    entrenador, no un diagnóstico.
//
// Restricción del Security Specialist (2026-07-30): TODO O NADA. Si falta
// un dato obligatorio o alguno cae fuera de rango, esto devuelve null y el
// bloque no se calcula ni se guarda. Nunca un NaN serializado a la base.
// ══════════════════════════════════════════════════════════════════════

export const SEXOS = [
  { k: "masculino", txt: "Masculino" },
  { k: "femenino", txt: "Femenino" },
];

// Factores de actividad de Holway sobre la TMB (×1,7 moderado, ×2,1 intenso,
// ×3,0 extremo) completados con la escala PAL general para los dos escalones
// de abajo, que Holway no define.
export const NIVELES_ACTIVIDAD = [
  { k: "sedentario", txt: "Sedentario", pal: 1.2 },
  { k: "poco_activo", txt: "Poco activo", pal: 1.5 },
  { k: "moderado", txt: "Moderado", pal: 1.7 },
  { k: "intenso", txt: "Intenso", pal: 2.1 },
  { k: "extremo", txt: "Extremo", pal: 3.0 },
];

// Ajuste por objetivo (Holway): déficit 300-1.000 kcal/día para bajar grasa
// (0,5 kg/semana), superávit 300-500 kcal/día para ganar músculo.
export const OBJETIVOS_COMPOSICION = [
  { k: "bajar_grasa", txt: "Bajar grasa", ajuste: [-1000, -300] },
  { k: "mantener", txt: "Mantener", ajuste: [0, 0] },
  { k: "ganar_musculo", txt: "Ganar músculo", ajuste: [300, 500] },
];

export const PISO_DISPONIBILIDAD = 30; // kcal por kg de masa magra
const SD_TMB = 150; // desvío estándar de toda ecuación predictiva

// Rangos de validación (Security Specialist). Fuera de esto no se calcula.
const RANGOS = {
  edad: [10, 100],
  altura: [100, 230],
  peso: [30, 250],
  grasa_corporal: [3, 60],
};

const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const enRango = (n, [min, max]) => n !== null && n >= min && n <= max;

const red10 = (n) => Math.round(n / 10) * 10;

/**
 * TMB por Mifflin-St Jeor (1990) sobre peso total.
 * Es el default práctico: Holway lo usa por sobre Cunningham porque no exige
 * antropometría.
 */
export function mifflinStJeor({ sexo, peso, altura, edad }) {
  const base = 10 * peso + 6.25 * altura - 5 * edad;
  return sexo === "femenino" ? base - 161 : base + 5;
}

/** TMB por Cunningham sobre masa libre de grasa. Más preciso cuando la MLG es real. */
export function cunningham(masaMagraKg) {
  return 500 + 22 * masaMagraKg;
}

/**
 * Calcula el bloque completo. Devuelve null si falta cualquier dato
 * obligatorio o si alguno cae fuera de rango — todo o nada, sin parciales.
 *
 * Obligatorios: sexo, actividad, edad, altura, peso.
 * Opcional: grasa_corporal (habilita Cunningham y la alerta de piso).
 * Opcional: objetivo (habilita el rango ajustado).
 */
export function calcularRequerimiento(datos = {}) {
  const sexo = SEXOS.some((s) => s.k === datos.sexo) ? datos.sexo : null;
  const nivel = NIVELES_ACTIVIDAD.find((n) => n.k === datos.actividad) || null;
  const edad = num(datos.edad);
  const altura = num(datos.altura);
  const peso = num(datos.peso);
  const grasa = num(datos.grasa_corporal);

  if (!sexo || !nivel) return null;
  if (!enRango(edad, RANGOS.edad) || !Number.isInteger(edad)) return null;
  if (!enRango(altura, RANGOS.altura)) return null;
  if (!enRango(peso, RANGOS.peso)) return null;
  // La grasa es opcional, pero si viene cargada tiene que ser plausible:
  // un valor absurdo daría una masa magra absurda y una alerta falsa.
  if (grasa !== null && !enRango(grasa, RANGOS.grasa_corporal)) return null;

  const tmb = mifflinStJeor({ sexo, peso, altura, edad });
  const masaMagra = grasa !== null ? peso * (1 - grasa / 100) : null;
  const tmbCunningham = masaMagra !== null ? cunningham(masaMagra) : null;

  // El rango sale del desvío de la TMB, propagado por el factor de actividad:
  // es el error real, no un ±150 cosmético sobre el total.
  const rango = [
    red10((tmb - SD_TMB) * nivel.pal),
    red10((tmb + SD_TMB) * nivel.pal),
  ];

  const obj = OBJETIVOS_COMPOSICION.find((o) => o.k === datos.objetivo) || null;
  const rangoAjustado = obj
    ? [Math.max(0, rango[0] + obj.ajuste[0]), Math.max(0, rango[1] + obj.ajuste[1])]
    : null;

  // Piso de disponibilidad energética: se compara contra lo que la persona
  // efectivamente comería (el rango ajustado si hay objetivo, si no el de
  // mantenimiento). Solo tiene sentido con masa magra real.
  const pisoKcal = masaMagra !== null ? red10(PISO_DISPONIBILIDAD * masaMagra) : null;
  const rangoVigente = rangoAjustado || rango;
  const alertaPiso = pisoKcal !== null && rangoVigente[0] < pisoKcal;

  return {
    sexo,
    actividad: nivel.k,
    pal: nivel.pal,
    objetivo: obj ? obj.k : null,
    tmb: Math.round(tmb),
    tmb_cunningham: tmbCunningham !== null ? Math.round(tmbCunningham) : null,
    masa_magra: masaMagra !== null ? Math.round(masaMagra * 10) / 10 : null,
    rango,
    rango_ajustado: rangoAjustado,
    piso_kcal: pisoKcal,
    alerta_piso: alertaPiso,
  };
}

/** Formato de rango para UI: "2340–2640 kcal" (en-dash, sin decimales). */
export function formatoRango(r) {
  return r ? `${r[0]}–${r[1]} kcal` : "";
}

export const DISCLAIMER_REQUERIMIENTO =
  "Estimación, no prescripción. Punto de partida a corregir con la respuesta real del alumno en 1-2 semanas. Margen de error de hasta 300 kcal.";
