// Mide que el marcador de peso (el − / + ) quede SIEMPRE a la misma altura
// dentro de la tarjeta. 2026-08-14, pedido de Lucas: "que sea padrón siempre
// en el mismo lugar". Los casos que lo movían: nombre de una o dos líneas,
// ejercicio con línea de ayuda o sin ella, 3 o 5 series, tarjeta abierta o
// cerrada. Todos tienen que dar la misma distancia al borde de la tarjeta.
//
//   npm run dev  →  node dev/medir-marcador.mjs 375
import puppeteer from "file:///C:/Users/lucas/.agents/skills/chrome-devtools/scripts/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ANCHO = Number(process.argv[2]) || 375;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: ANCHO, height: 900, isMobile: false, hasTouch: true });
await page.goto("http://localhost:5173/dev/harness.html", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector("[data-alturas] [data-marcador]");

const medir = () =>
  page.evaluate(() => {
    const filas = [];
    document.querySelectorAll("[data-alturas] [data-marcador], [data-vueltas] [data-marcador]").forEach((m) => {
      const tarjeta = m.closest("[data-alturas] > div, [data-vueltas] > div") || m.parentElement;
      // El nombre del ejercicio es el segundo renglón (el primero es el
      // número), y la tarjeta abierta agrega un segundo bloque a la raíz.
      const nombre = (tarjeta.innerText || "").trim().split("\n")[1] || "";
      const abierta = tarjeta.children.length > 1;
      filas.push({
        nombre: nombre.slice(0, 34),
        offset: Math.round(m.getBoundingClientRect().top - tarjeta.getBoundingClientRect().top),
        abierta,
      });
    });
    // Todo lo tocable del marcador: − , + y cada pastilla de serie.
    const chicos = [];
    document.querySelectorAll('[data-alturas] button, [data-vueltas] button').forEach((b) => {
      const r = b.getBoundingClientRect();
      if (r.width < 44 || r.height < 44) chicos.push(`${b.getAttribute("aria-label") || b.innerText.trim().slice(0, 12)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    return { filas, chicos };
  });

const cerradas = await medir();
// Se abre la primera tarjeta: abrir no puede mover el marcador.
// Se toca ARRIBA (la fila del nombre): el centro del encabezado cae sobre el
// marcador, que corta la propagación a propósito para no abrir la tarjeta al
// tocar el − o el +.
const encabezado = await page.$("[data-alturas] > div > div");
await encabezado.click({ offset: { x: 60, y: 20 } });
await new Promise((r) => setTimeout(r, 400));
const abiertas = await medir();

const todos = [...cerradas.filas, ...abiertas.filas];
const offsets = [...new Set(todos.map((f) => f.offset))];
console.log(`Marcadores medidos: ${todos.length} (${cerradas.filas.length} cerrados + ${abiertas.filas.length} con una tarjeta abierta)`);
todos.forEach((f) => console.log(`  ${String(f.offset).padStart(4)}px  ${f.abierta ? "[abierta] " : "          "}${f.nombre}`));
console.log(offsets.length === 1
  ? `OK · el marcador arranca a ${offsets[0]}px del borde de la tarjeta en TODOS los casos`
  : `FALLA · el marcador cambia de altura: ${offsets.join(", ")}px`);

const chicos = [...new Set([...cerradas.chicos, ...abiertas.chicos])];
console.log(chicos.length === 0 ? "OK · todos los tocables miden 44px o más" : `FALLA · tocables chicos: ${chicos.join(" | ")}`);

await browser.close();
process.exit(offsets.length === 1 && chicos.length === 0 ? 0 : 1);
