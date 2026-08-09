// Arma una HOJA DE CONTACTO con los GIFs que realmente ve el alumno: cada
// ejercicio con su imagen y su nombre debajo, para poder auditar mirando.
//
// Por qué existe: la auditoría de texto (nombre en español contra el original
// en inglés) NO dice nada sobre si el GIF muestra el ejercicio correcto. Lucas
// vio GIFs mal con sus propios ojos mientras la auditoría de texto daba todo
// bien. La única forma de verificar esto es mirar la imagen.
//
// Uso:
//   node dev/hoja-de-gifs.mjs --nombres nombres.json --out carpeta
// donde nombres.json es un array de strings (los nombres tal cual están en el
// plan). Resuelve el GIF con la MISMA función que usa la app.
import fs from "node:fs/promises";
import path from "node:path";
import { getEjercicioGif } from "../src/utils/ejerciciosMedia.js";

const arg = (n, def) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : def; };
const OUT = arg("--out", ".");
const ARCHIVO = arg("--nombres");
const PUBLIC = path.resolve("public");

const items = JSON.parse(await fs.readFile(ARCHIVO, "utf8"));

// Cada item puede ser un string (se resuelve por nombre) o {nombre, gif}.
const resueltos = items.map((it) => {
  const nombre = typeof it === "string" ? it : it.nombre;
  const guardado = typeof it === "string" ? "" : it.gif || "";
  const src = guardado && guardado !== "__sin_gif__" ? guardado : getEjercicioGif(nombre);
  return { nombre, src, origen: guardado ? "guardado en el plan" : "lookup por nombre" };
});

// Los locales se leen del disco; los remotos se bajan.
for (const r of resueltos) {
  if (!r.src) { r.data = null; continue; }
  try {
    if (/^https?:/i.test(r.src)) {
      const resp = await fetch(r.src);
      if (!resp.ok) { r.error = `HTTP ${resp.status}`; continue; }
      r.data = Buffer.from(await resp.arrayBuffer());
    } else {
      r.data = await fs.readFile(path.join(PUBLIC, r.src.replace(/^\//, "")));
    }
    r.mime = r.src.toLowerCase().endsWith(".jpg") || r.src.toLowerCase().endsWith(".jpeg") ? "image/jpeg"
           : r.src.toLowerCase().endsWith(".png") ? "image/png" : "image/gif";
  } catch (e) { r.error = e.message; }
}

// Página HTML: se rinde después con Chrome headless a PNG. Se usa <img> con
// data URI para que no dependa de la red al renderizar.
const celdas = resueltos.map((r, i) => {
  const img = r.data
    ? `<img src="data:${r.mime};base64,${r.data.toString("base64")}">`
    : `<div class="falta">${r.error || "SIN GIF"}</div>`;
  return `<figure><div class="marco">${img}</div>
    <figcaption><b>${i + 1}. ${r.nombre}</b><span>${r.origen}</span>
    <span class="ruta">${(r.src || "—").replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/catalogo-ejercicios\//, "…/")}</span>
    </figcaption></figure>`;
}).join("\n");

const html = `<!doctype html><meta charset="utf-8"><style>
 body{background:#111;color:#eee;font-family:system-ui,sans-serif;margin:0;padding:16px}
 h1{font-size:16px;margin:0 0 14px}
 .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
 figure{margin:0}
 .marco{background:#fff;border-radius:6px;height:150px;display:flex;align-items:center;justify-content:center;overflow:hidden}
 .marco img{max-width:100%;max-height:150px;object-fit:contain}
 .falta{color:#c00;font-size:11px;font-weight:700}
 figcaption{font-size:10px;line-height:1.35;padding-top:4px}
 figcaption b{display:block;font-size:11px}
 figcaption span{display:block;color:#888}
 .ruta{color:#666;font-size:9px;word-break:break-all}
</style><h1>Hoja de contacto · ${resueltos.length} ejercicios</h1>
<div class="grid">${celdas}</div>`;

await fs.mkdir(OUT, { recursive: true });
const destino = path.join(OUT, "hoja-gifs.html");
await fs.writeFile(destino, html, "utf8");
console.log(destino);
console.log(`${resueltos.filter((r) => r.data).length} con imagen · ${resueltos.filter((r) => !r.data).length} sin imagen`);
