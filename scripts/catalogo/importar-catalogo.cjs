// ══════════════════════════════════════════════════════════════════════
// Importa el catálogo completo a Supabase (tabla catalogo_ejercicios):
//   · 1.324 ejercicios del dataset ExerciseDB con nombre ES
//     (data/catalogo-nombres-es.json), labels traducidos
//     (src/utils/catalogoLabels.json), media apuntando al bucket
//     catalogo-ejercicios (paths relativos images/... y videos/...)
//   · matcheo taxonomía DI (data/catalogo-match-di.json): las filas
//     matcheadas reciben codigo_di y el nombre en español de Lucas
//     (tomado de biblioteca_ejercicios)
//   · los códigos DI sin match se insertan como filas custom
//     (id DI-<codigo>, custom=true) con nombre/descripcion/gif de
//     biblioteca_ejercicios
//   · grupo_di (metadata) para todo el catálogo según reglas de mapeo
// Idempotente: upsert por id (Prefer: resolution=merge-duplicates).
//
// Uso: node scripts/catalogo/importar-catalogo.cjs [ruta-dataset]
// ══════════════════════════════════════════════════════════════════════
const fs = require("fs");
const path = require("path");

const DATASET = process.argv[2] || "C:/Users/lucas/Downloads/exercises-dataset-main";
const REPO = path.join(__dirname, "..", "..");

const exercises = JSON.parse(fs.readFileSync(path.join(DATASET, "data", "exercises.json"), "utf8"));
const nombres = JSON.parse(fs.readFileSync(path.join(REPO, "data", "catalogo-nombres-es.json"), "utf8"));
const labels = JSON.parse(fs.readFileSync(path.join(REPO, "src", "utils", "catalogoLabels.json"), "utf8"));
const matchDi = JSON.parse(fs.readFileSync(path.join(REPO, "data", "catalogo-match-di.json"), "utf8"));

const nombreEs = Object.fromEntries(nombres.map((n) => [n.id, n.es]));
const codigoPorDatasetId = {};
Object.entries(matchDi.matches).forEach(([cod, m]) => { codigoPorDatasetId[m.dataset_id] = cod; });

// credenciales (nunca se imprimen)
const env = {};
fs.readFileSync(path.join(REPO, "web", ".env.local"), "utf8").split(/\r?\n/).forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
});
const URL_BASE = (env.SUPABASE_URL || "https://tlxkghpytznkxgqslqzj.supabase.co").replace(/\/$/, "");
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("Falta SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const HEADERS = { Authorization: `Bearer ${KEY}`, apikey: KEY, "Content-Type": "application/json" };

// ── grupo_di (metadata) ───────────────────────────────────────────────
// Reglas: primero por nombre (bisagras → cadera, sentadillas/estocadas →
// rodilla), después por target. Lo que no mapea claro queda null.
const TARGET_A_GRUPO = {
  "abs": "Core", "spine": "Core",
  "delts": "Hombros",
  "pectorals": "Pecho", "serratus anterior": "Pecho",
  "biceps": "Bíceps",
  "triceps": "Tríceps",
  "lats": "Dorsales", "upper back": "Dorsales",
  "glutes": "Glúteos", "abductors": "Glúteos",
  "quads": "Pred. Rodilla",
  "hamstrings": "Pred. Cadera",
};
function grupoDi(e) {
  const n = e.name.toLowerCase();
  if (/deadlift|good morning|pull through|hip hinge|romanian/.test(n)) return "Pred. Cadera";
  if (/hip thrust|glute bridge|hip raise|hip extension/.test(n)) return "Glúteos";
  if (/squat|lunge|step-up|step up|leg press|leg extension/.test(n)) return "Pred. Rodilla";
  return TARGET_A_GRUPO[e.target] || null;
}

const musc = (m) => labels.muscle[m] || m;

function filaDataset(e) {
  return {
    id: e.id,
    nombre_es: nombreEs[e.id] || e.name,
    nombre_en: e.name,
    categoria: e.category || e.body_part,
    body_part: e.body_part || "",
    equipment: e.equipment || "",
    equipment_es: labels.equipment[e.equipment] || e.equipment,
    target: e.target || "",
    target_es: labels.target[e.target] || e.target,
    muscle_group: e.muscle_group || "",
    muscle_group_es: musc(e.muscle_group || ""),
    secondary_muscles: e.secondary_muscles || [],
    secondary_muscles_es: (e.secondary_muscles || []).map(musc),
    instrucciones_es: (e.instructions && e.instructions.es) || "",
    image: e.image || "",
    gif_url: e.gif_url || "",
    video: "",
    codigo_di: codigoPorDatasetId[e.id] || null,
    grupo_di: grupoDi(e),
    custom: false,
    editado: false,
    attribution: e.attribution || "© Gym visual — https://gymvisual.com/",
  };
}

// grupo del código DI → grupo_di + categoria/target aproximados
const GRUPO_POR_PREFIJO = {
  PH: ["Hombros", "shoulders", "delts"],
  RO: ["Pred. Rodilla", "upper legs", "quads"],
  PE: ["Pecho", "chest", "pectorals"],
  CA: ["Pred. Cadera", "upper legs", "hamstrings"],
  JA: ["Dorsales", "back", "lats"],
  GL: ["Glúteos", "upper legs", "glutes"],
  CO: ["Core", "waist", "abs"],
};
// equipamiento aproximado por código custom (por el nombre DI)
function equipDeNombre(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes("landmine")) return "barbell";
  if (n.includes("barra")) return "barbell";
  if (n.includes("mancuerna")) return "dumbbell";
  if (n.includes("kb") || n.includes("kettlebell")) return "kettlebell";
  if (n.includes("elastico") || n.includes("elástico")) return "band";
  if (n.includes("trx")) return "body weight";
  if (n.includes("trapbar")) return "trap bar";
  if (n.includes("roler") || n.includes("roller") || n.includes("ruedita")) return "wheel roller";
  if (n.includes("peso")) return "weighted";
  return "body weight";
}

async function biblioteca() {
  const r = await fetch(`${URL_BASE}/rest/v1/biblioteca_ejercicios?select=codigo,nombre,descripcion,gif,video,grupo&codigo=not.is.null`, { headers: HEADERS });
  if (!r.ok) throw new Error("biblioteca: " + r.status);
  return r.json();
}

function filaCustom(cod, bib) {
  const b = bib.find((x) => x.codigo === cod);
  if (!b) { console.error(`SIN BIBLIOTECA: ${cod}`); return null; }
  const [grupo, categoria, target] = GRUPO_POR_PREFIJO[cod.slice(0, 2)] || [null, "", ""];
  const equipment = equipDeNombre(b.nombre);
  return {
    id: `DI-${cod}`,
    nombre_es: b.nombre,
    nombre_en: null,
    categoria,
    body_part: categoria,
    equipment,
    equipment_es: labels.equipment[equipment] || equipment,
    target,
    target_es: labels.target[target] || target,
    muscle_group: target,
    muscle_group_es: musc(target),
    secondary_muscles: [],
    secondary_muscles_es: [],
    instrucciones_es: b.descripcion || "",
    image: "",
    gif_url: b.gif || "",
    video: b.video || "",
    codigo_di: cod,
    grupo_di: grupo,
    custom: true,
    editado: false,
    attribution: "Desarrollo Integral",
  };
}

async function upsert(rows) {
  const r = await fetch(`${URL_BASE}/rest/v1/catalogo_ejercicios?on_conflict=id`, {
    method: "POST",
    headers: { ...HEADERS, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`upsert: ${r.status} ${(await r.text()).slice(0, 300)}`);
}

(async () => {
  const bib = await biblioteca();

  // filas matcheadas: nombre ES = el nombre de Lucas en biblioteca
  Object.entries(matchDi.matches).forEach(([cod, m]) => {
    const b = bib.find((x) => x.codigo === cod);
    if (b) nombreEs[m.dataset_id] = b.nombre;
  });

  const rows = exercises.map(filaDataset);
  const customs = matchDi.custom.map((c) => filaCustom(c, bib)).filter(Boolean);
  const all = [...rows, ...customs];
  console.log(`dataset: ${rows.length} · custom DI: ${customs.length} · total: ${all.length}`);

  for (let i = 0; i < all.length; i += 200) {
    await upsert(all.slice(i, i + 200));
    console.log(`upsert ${Math.min(i + 200, all.length)}/${all.length}`);
  }

  // resumen
  const conGrupo = all.filter((r) => r.grupo_di).length;
  const conDi = all.filter((r) => r.codigo_di).length;
  console.log(`LISTO. con codigo_di: ${conDi} · con grupo_di: ${conGrupo}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
