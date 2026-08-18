// Constantes y helpers puros compartidos por CatalogoExplorer y sus piezas (src/components/catalogo/).
// Movidos textualmente desde CatalogoExplorer.jsx (refactor 2026-08-17).
import labels from "../../utils/catalogoLabels.json";

// Niveles asignables a un ejercicio o a una plantilla de plan (ronda 18).
export const NIVELES = [
  ["inicial", "Inicial"],
  ["intermedio", "Intermedio"],
  ["avanzado", "Avanzado"],
];

export const labelNivel = (v) => (NIVELES.find(([id]) => id === v) || [null, v])[1];

export const PAGE = 60;

export const labelCat = (v) => labels.categoria[v] || v;

export const labelEq = (v) => labels.equipment[v] || v;

export const labelTg = (v) => labels.target[v] || v;
