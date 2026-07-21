// ══════════════════════════════════════════════════════════════════════
// Sube la media del dataset ExerciseDB al bucket público
// `catalogo-ejercicios` de Supabase Storage:
//   images/  → 1.324 JPG (~12MB)   — thumb de las cards
//   videos/  → 1.324 GIF (~127MB)  — animación en el detalle
// Idempotente: lista lo ya subido y solo sube lo que falta. Reintenta 3
// veces por archivo. Corre con la SERVICE ROLE KEY leída de web/.env.local
// (nunca se imprime).
//
// Uso: node scripts/catalogo/subir-media.cjs [ruta-dataset]
// ══════════════════════════════════════════════════════════════════════
const fs = require("fs");
const path = require("path");

const DATASET = process.argv[2] || "C:/Users/lucas/Downloads/exercises-dataset-main";
const REPO = path.join(__dirname, "..", "..");
const BUCKET = "catalogo-ejercicios";

// leer credenciales de web/.env.local sin imprimirlas
const env = {};
fs.readFileSync(path.join(REPO, "web", ".env.local"), "utf8").split(/\r?\n/).forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
});
const URL_BASE = (env.SUPABASE_URL || "https://tlxkghpytznkxgqslqzj.supabase.co").replace(/\/$/, "");
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("Falta SUPABASE_SERVICE_ROLE_KEY en web/.env.local"); process.exit(1); }

const HEADERS = { Authorization: `Bearer ${KEY}`, apikey: KEY };

async function crearBucket() {
  const r = await fetch(`${URL_BASE}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (r.ok) { console.log(`bucket ${BUCKET} creado`); return; }
  const t = await r.text();
  if (/already exists|Duplicate/i.test(t)) { console.log(`bucket ${BUCKET} ya existe`); return; }
  throw new Error(`crear bucket: ${r.status} ${t}`);
}

async function listar(prefix) {
  // pagina de a 1000
  const nombres = new Set();
  let offset = 0;
  for (;;) {
    const r = await fetch(`${URL_BASE}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit: 1000, offset }),
    });
    if (!r.ok) throw new Error(`listar ${prefix}: ${r.status}`);
    const arr = await r.json();
    arr.forEach((o) => nombres.add(o.name));
    if (arr.length < 1000) break;
    offset += 1000;
  }
  return nombres;
}

async function subirUno(localPath, remotePath, contentType) {
  const body = fs.readFileSync(localPath);
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const r = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${remotePath}`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": contentType, "x-upsert": "true" },
        body,
      });
      if (r.ok) return true;
      const t = await r.text();
      if (intento === 3) { console.error(`FALLO ${remotePath}: ${r.status} ${t.slice(0, 120)}`); return false; }
    } catch (e) {
      if (intento === 3) { console.error(`FALLO ${remotePath}: ${e.message}`); return false; }
    }
    await new Promise((res) => setTimeout(res, 800 * intento));
  }
}

async function subirCarpeta(sub, contentType) {
  const dir = path.join(DATASET, sub);
  const files = fs.readdirSync(dir);
  const ya = await listar(sub);
  const pendientes = files.filter((f) => !ya.has(f));
  console.log(`${sub}: ${files.length} archivos, ${ya.size} ya subidos, ${pendientes.length} pendientes`);
  let ok = 0, fail = 0, done = 0;
  const CONC = 8;
  async function worker() {
    for (;;) {
      const f = pendientes.shift();
      if (!f) return;
      const res = await subirUno(path.join(dir, f), `${sub}/${f}`, contentType);
      res ? ok++ : fail++;
      done++;
      if (done % 100 === 0) console.log(`${sub}: ${done} procesados (${fail} fallos)`);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  console.log(`${sub} LISTO: ${ok} subidos, ${fail} fallos`);
  return fail;
}

(async () => {
  await crearBucket();
  const f1 = await subirCarpeta("images", "image/jpeg");
  const f2 = await subirCarpeta("videos", "image/gif");
  console.log(`TOTAL fallos: ${f1 + f2}`);
  process.exit(f1 + f2 > 0 ? 1 : 0);
})();
