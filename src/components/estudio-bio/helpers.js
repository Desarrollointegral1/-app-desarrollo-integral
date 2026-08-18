// Constantes y funciones puras del estudio de composición corporal.
// Movido textualmente desde EstudioBio.jsx (refactor 2026-08-18): mismo código,
// solo cambió de archivo. EstudioBio.jsx conserva EstudioBioSeccion (la sección completa).
import { formatoRango } from "../../utils/energia.js";

export const BIO_BUCKET = "bioimpedancia-archivos";

// 2026-07-30: conclusión y objetivo ya no los escribe Lucas a mano — se arman
// solos a partir de los datos numéricos ya cargados (grasa corporal, IMC,
// muscular, requerimiento energético). Funciones puras: mismos datos, mismo
// texto, no dependen de estado de React — así se pueden recalcular en cada
// render sin useEffect. Rangos de grasa corporal son referencia general de
// composición corporal (no diagnóstico clínico) — se aclara en el texto.
export const RANGO_GRASA = { masculino: [10, 20], femenino: [18, 28] };

export function generarConclusionAutomatica(f, req, historialAlumno) {
  const frases = [];
  const grasa = f.grasa_corporal !== "" && f.grasa_corporal != null ? Number(f.grasa_corporal) : null;
  const imc = f.imc !== "" && f.imc != null ? Number(f.imc) : null;
  const muscular = f.masa_muscular !== "" && f.masa_muscular != null ? Number(f.masa_muscular) : null;
  const visceral = f.grasa_visceral !== "" && f.grasa_visceral != null ? Number(f.grasa_visceral) : null;

  if (grasa != null && f.sexo && RANGO_GRASA[f.sexo]) {
    const [min, max] = RANGO_GRASA[f.sexo];
    const pos = grasa < min ? "por debajo del" : grasa > max ? "por encima del" : "dentro del";
    frases.push(
      `Tu grasa corporal (${grasa}%) está ${pos} rango típico saludable para tu sexo (${min}–${max}%, referencia general, no un diagnóstico).`
    );
  }
  if (imc != null) frases.push(`IMC de ${imc}.`);
  if (muscular != null) frases.push(`Masa muscular en ${muscular}%.`);
  if (visceral != null && visceral > 12) frases.push(`Grasa visceral en nivel ${visceral}, por encima de lo recomendado.`);
  if (req?.rango) frases.push(`Gasto energético estimado de mantenimiento: ${formatoRango(req.rango)}.`);

  if (historialAlumno && historialAlumno.length > 0 && grasa != null) {
    const anterior = historialAlumno.find((r) => r.grasa_corporal != null && r.fecha !== f.fecha);
    if (anterior) {
      const diff = grasa - Number(anterior.grasa_corporal);
      if (Math.abs(diff) >= 0.5) {
        frases.push(`Respecto al estudio del ${anterior.fecha}, la grasa corporal ${diff < 0 ? "bajó" : "subió"} ${Math.abs(diff).toFixed(1)} puntos.`);
      }
    }
  }
  return frases.join(" ");
}

export function generarObjetivoAutomatico(f, req) {
  const visceralAlta = f.grasa_visceral !== "" && f.grasa_visceral != null && Number(f.grasa_visceral) > 12;
  if (f.objetivo_composicion === "bajar_grasa" && req?.rango_ajustado) {
    return `Objetivo: bajar grasa corporal sosteniendo el gasto ajustado de ${formatoRango(req.rango_ajustado)}.`;
  }
  if (f.objetivo_composicion === "ganar_musculo" && req?.rango_ajustado) {
    return `Objetivo: sumar masa muscular sosteniendo el gasto ajustado de ${formatoRango(req.rango_ajustado)}.`;
  }
  if (f.objetivo_composicion === "mantener" && req?.rango) {
    return `Objetivo: mantener la composición actual sosteniendo el gasto de ${formatoRango(req.rango)}.`;
  }
  if (visceralAlta) return "Objetivo: bajar el nivel de grasa visceral con foco en actividad física regular.";
  return "";
}
