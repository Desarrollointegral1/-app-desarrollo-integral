// Self-check del cálculo de requerimiento energético.
// Correr:  node src/utils/energia.selfcheck.mjs
// Falla ruidoso si alguna regla de la fuente (Holway) deja de cumplirse.
import assert from "node:assert/strict";
import { calcularRequerimiento, mifflinStJeor, cunningham } from "./energia.js";

// Verificación a mano de Mifflin-St Jeor con 82 kg / 178 cm / 33 años varón:
// 10×82 (820) + 6,25×178 (1112,5) − 5×33 (165) + 5 = 1772,5
const tmbLucas = mifflinStJeor({ sexo: "masculino", peso: 82, altura: 178, edad: 33 });
assert.equal(tmbLucas, 1772.5, `TMB inesperada: ${tmbLucas}`);

// Mujer con mismos datos antropométricos: siempre menor (constante -161 vs +5).
const tmbF = mifflinStJeor({ sexo: "femenino", peso: 82, altura: 178, edad: 33 });
assert.ok(tmbF < tmbLucas, "la constante por sexo no se está aplicando");
assert.equal(Math.round(tmbLucas - tmbF), 166);

// Cunningham: 500 + 22 × MLG.
assert.equal(cunningham(60), 1820);

// ── Todo o nada: sin sexo o sin actividad no hay cálculo ──────────────
assert.equal(calcularRequerimiento({ peso: 80, altura: 180, edad: 30 }), null);
assert.equal(
  calcularRequerimiento({ sexo: "masculino", peso: 80, altura: 180, edad: 30 }),
  null,
  "sin nivel de actividad no debe calcular"
);
assert.equal(
  calcularRequerimiento({ sexo: "otro", actividad: "moderado", peso: 80, altura: 180, edad: 30 }),
  null,
  "el sexo tiene que ser un enum cerrado"
);
assert.equal(
  calcularRequerimiento({ sexo: "masculino", actividad: "muy_intenso", peso: 80, altura: 180, edad: 30 }),
  null,
  "la actividad tiene que ser un enum cerrado"
);

// ── Rangos fuera de límite: null, nunca un número absurdo ─────────────
const base = { sexo: "masculino", actividad: "moderado", peso: 80, altura: 180, edad: 30 };
assert.equal(calcularRequerimiento({ ...base, edad: 8 }), null, "edad 8 fuera de rango");
assert.equal(calcularRequerimiento({ ...base, edad: 30.5 }), null, "edad decimal");
assert.equal(calcularRequerimiento({ ...base, altura: 1.8 }), null, "altura en metros");
assert.equal(calcularRequerimiento({ ...base, peso: 500 }), null, "peso fuera de rango");
assert.equal(calcularRequerimiento({ ...base, grasa_corporal: 95 }), null, "% grasa imposible");
assert.equal(calcularRequerimiento({ ...base, peso: "abc" }), null, "peso no numérico");

// ── Ningún NaN puede llegar a la base ─────────────────────────────────
const r = calcularRequerimiento({ ...base, grasa_corporal: 20, objetivo: "ganar_musculo" });
assert.ok(r, "el caso completo debería calcular");
const planos = JSON.stringify(r);
assert.ok(!planos.includes("null,null"), "hay huecos inesperados en el payload");
for (const [k, v] of Object.entries(r)) {
  assert.ok(!(typeof v === "number" && Number.isNaN(v)), `${k} es NaN`);
}

// ── El resultado es un rango, nunca una cifra única ───────────────────
assert.ok(Array.isArray(r.rango) && r.rango[1] > r.rango[0], "el rango debe ser un intervalo");
// El ancho del rango es el desvío de la TMB (±150) propagado por el PAL.
assert.equal(r.rango[1] - r.rango[0], Math.round(300 * 1.7 / 10) * 10);

// Superávit por ganar músculo: el rango ajustado queda por encima.
assert.ok(r.rango_ajustado[0] > r.rango[0], "el superávit debe subir el rango");
assert.equal(r.rango_ajustado[0] - r.rango[0], 300);
assert.equal(r.rango_ajustado[1] - r.rango[1], 500);

// Sin objetivo elegido no hay rango ajustado (no se inventa uno).
const sinObj = calcularRequerimiento({ ...base, grasa_corporal: 20 });
assert.equal(sinObj.rango_ajustado, null);

// Sin % de grasa no hay Cunningham ni alerta de piso — no se inventa la masa magra.
const sinGrasa = calcularRequerimiento(base);
assert.equal(sinGrasa.tmb_cunningham, null);
assert.equal(sinGrasa.piso_kcal, null);
assert.equal(sinGrasa.alerta_piso, false);

// ── Piso de seguridad: 30 kcal/kg de masa magra ───────────────────────
// Mujer chica con déficit agresivo: tiene que dispararse la alerta.
const riesgo = calcularRequerimiento({
  sexo: "femenino", actividad: "sedentario", peso: 52, altura: 160, edad: 24,
  grasa_corporal: 22, objetivo: "bajar_grasa",
});
assert.ok(riesgo.alerta_piso, "debería alertar por disponibilidad energética baja");
assert.ok(riesgo.rango_ajustado[0] < riesgo.piso_kcal);

// Mismo caso sin déficit: el mantenimiento no dispara la alerta.
const mantiene = calcularRequerimiento({
  sexo: "femenino", actividad: "sedentario", peso: 52, altura: 160, edad: 24,
  grasa_corporal: 22, objetivo: "mantener",
});
assert.equal(mantiene.alerta_piso, false, "mantenimiento no debería alertar");

console.log("✓ energia.js — todos los chequeos pasan");
