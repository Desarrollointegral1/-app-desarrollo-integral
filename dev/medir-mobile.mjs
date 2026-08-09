// Mide desbordes horizontales en pantalla de celular. El panel y la vista del
// alumno se usan casi siempre desde el teléfono: cualquier cosa que se salga
// del ancho obliga a scrollear de costado y, en la práctica, desaparece.
import puppeteer from "file:///C:/Users/lucas/.agents/skills/chrome-devtools/scripts/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ANCHO = Number(process.argv[2]) || 375; // iPhone SE/13 mini: el más angosto real

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
// isMobile:false a propósito. Con isMobile el navegador aplica el viewport
// meta y escala la página, así que TODO "entra" y la medición miente: un
// desborde real (la cuarta pastilla de vuelta saliéndose en 375px) daba cero.
await page.setViewport({ width: ANCHO, height: 800, isMobile: false, hasTouch: true });
await page.goto("http://localhost:5173/dev/harness.html", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector("[data-fila-ej]");

// Comprobación puntual: todas las pastillas de vuelta tienen que ser
// visibles y tocables. Es lo que se rompió al agregar el peso por vuelta.
const vueltas = await page.evaluate((ancho) => {
  const grupos = [...document.querySelectorAll('[aria-label^="Vuelta "]')];
  const fuera = grupos.filter((b) => {
    const r = b.getBoundingClientRect();
    return r.right > ancho + 1 || r.width < 40 || r.height < 40;
  });
  return { total: grupos.length, fuera: fuera.map((b) => b.getAttribute("aria-label")) };
}, ANCHO);
console.log(`Pastillas de vuelta: ${vueltas.total} · fuera de pantalla o muy chicas: ${vueltas.fuera.length}`);
vueltas.fuera.forEach((v) => console.log(`  NO SE VE BIEN: ${v}`));

const r = await page.evaluate((ancho) => {
  const desbordes = [];
  document.querySelectorAll("*").forEach((el) => {
    const b = el.getBoundingClientRect();
    if (b.width === 0) return;
    if (b.right > ancho + 1) {
      desbordes.push({
        tag: el.tagName.toLowerCase(),
        texto: (el.innerText || "").trim().slice(0, 40).replace(/\n/g, " "),
        right: Math.round(b.right),
        exceso: Math.round(b.right - ancho),
      });
    }
  });
  return {
    scrollHorizontal: document.documentElement.scrollWidth > ancho,
    scrollWidth: document.documentElement.scrollWidth,
    desbordes: desbordes.slice(0, 12),
    total: desbordes.length,
  };
}, ANCHO);

console.log(`Viewport ${ANCHO}px · scrollWidth ${r.scrollWidth}px · scroll horizontal: ${r.scrollHorizontal ? "SÍ (mal)" : "no"}`);
console.log(`Elementos que se salen: ${r.total}`);
r.desbordes.forEach((d) => console.log(`  <${d.tag}> +${d.exceso}px  "${d.texto}"`));

await browser.close();
const falla = r.scrollHorizontal || vueltas.fuera.length > 0;
console.log(falla ? "\nHAY PROBLEMAS DE ANCHO EN CELULAR." : "\nTodo entra bien en pantalla de celular.");
process.exit(falla ? 1 : 0);
