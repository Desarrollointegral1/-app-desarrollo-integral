// Prueba de interacción real del editor de ejercicios, contra el banco de
// pruebas (dev/harness.html). Verifica lo que un build o un test unitario NO
// pueden ver: que plegar, arrastrar y sacar el GIF funcionen con el mouse.
//
// Correr con el dev server levantado:
//   npm run dev
//   node dev/probar-editor.mjs
//
// Sale 0 si pasa todo, 1 si algo falla. Deja los screenshots en la carpeta que
// se le pase con --out (por defecto, al lado de este archivo).
import puppeteer from "file:///C:/Users/lucas/.agents/skills/chrome-devtools/scripts/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL_HARNESS = "http://localhost:5173/dev/harness.html";
const argOut = process.argv.indexOf("--out");
const OUT = argOut > -1 ? process.argv[argOut + 1] : path.dirname(fileURLToPath(import.meta.url));

const fallos = [];
const ok = (nombre) => console.log(`  OK   ${nombre}`);
const fallo = (nombre, detalle) => { fallos.push(`${nombre}: ${detalle}`); console.log(`  FALLA ${nombre} -> ${detalle}`); };

// Nombres de los ejercicios en el orden en que aparecen en pantalla.
const ordenActual = (page) =>
  page.$$eval("[data-fila-ej]", (filas) =>
    filas.map((f) => {
      // El nombre es el div de 13px dentro de la zona clickeable de la fila.
      const t = f.innerText.split("\n").map((s) => s.trim()).filter(Boolean);
      return t.find((s) => s.length > 6 && !/^[0-9]+$/.test(s)) || t[0] || "";
    })
  );

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 560, height: 1000 });
  await page.goto(URL_HARNESS, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("[data-fila-ej]", { timeout: 15000 });

  // ── 1. Plegar / desplegar tocando el nombre ──────────────────────────
  const altoAntes = await page.$eval('[data-fila-ej="0"]', (e) => e.getBoundingClientRect().height);
  await page.click('[data-fila-ej="0"] [title^="Tocá el nombre"]');
  await new Promise((r) => setTimeout(r, 350));
  const altoDespues = await page.$eval('[data-fila-ej="0"]', (e) => e.getBoundingClientRect().height);
  if (altoDespues > altoAntes + 80) ok("tocar el nombre despliega la ficha");
  else fallo("tocar el nombre despliega la ficha", `alto ${altoAntes} -> ${altoDespues}, casi no cambió`);

  await page.screenshot({ path: path.join(OUT, "01-desplegado.png") });

  // Y que vuelva a plegarse con otro toque.
  await page.click('[data-fila-ej="0"] [title^="Tocá el nombre"]');
  await new Promise((r) => setTimeout(r, 350));
  const altoPlegado = await page.$eval('[data-fila-ej="0"]', (e) => e.getBoundingClientRect().height);
  if (Math.abs(altoPlegado - altoAntes) < 12) ok("volver a tocarlo lo pliega");
  else fallo("volver a tocarlo lo pliega", `esperaba ~${altoAntes}, quedó ${altoPlegado}`);

  // ── 2. Arrastrar para reordenar ──────────────────────────────────────
  const antes = await ordenActual(page);
  // Agarra el 3er ejercicio del handle y lo sube al primer puesto.
  const handle = await page.$('[data-fila-ej="2"] [title^="Arrastrá"]');
  const caja = await handle.boundingBox();
  const destino = await (await page.$('[data-fila-ej="0"]')).boundingBox();
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await page.mouse.down();
  // Varios pasos: un salto seco no dispara los pointermove intermedios.
  for (let i = 1; i <= 8; i++) {
    const y = caja.y + ((destino.y + destino.height / 2 - caja.y) * i) / 8;
    await page.mouse.move(caja.x + caja.width / 2, y);
    await new Promise((r) => setTimeout(r, 30));
  }
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 350));
  const despues = await ordenActual(page);

  if (despues[0] === antes[2]) ok(`arrastrar reordena ("${antes[2]}" pasó al puesto 1)`);
  else fallo("arrastrar reordena", `esperaba "${antes[2]}" primero, quedó "${despues[0]}"`);
  if (despues.length === antes.length) ok("arrastrar no pierde ni duplica ejercicios");
  else fallo("arrastrar no pierde ni duplica", `eran ${antes.length}, quedaron ${despues.length}`);

  await page.screenshot({ path: path.join(OUT, "02-reordenado.png") });

  // ── 3. El GIF sacado a propósito no reaparece ────────────────────────
  // "Peso muerto con Barra" arranca con el sentinel SIN_GIF. Tiene nombre con
  // match en el mapa de media, así que si el sentinel no se respetara, el
  // lookup automático le pondría un GIF igual.
  const filaPesoMuerto = (await ordenActual(page)).findIndex((n) => n.includes("Peso muerto"));
  const tieneImg = await page.$eval(`[data-fila-ej="${filaPesoMuerto}"]`, (e) => Boolean(e.querySelector("img")));
  if (!tieneImg) ok("el ejercicio marcado sin GIF no muestra ninguno");
  else fallo("el ejercicio marcado sin GIF no muestra ninguno", "apareció un <img> igual");

  // Y el control opuesto: uno que sí debe tener GIF automático por nombre.
  const filaHip = (await ordenActual(page)).findIndex((n) => n.includes("Hip thrust"));
  const hipImg = await page.$eval(`[data-fila-ej="${filaHip}"]`, (e) => Boolean(e.querySelector("img")));
  if (hipImg) ok("un ejercicio normal sí resuelve su GIF por nombre");
  else fallo("un ejercicio normal sí resuelve su GIF por nombre", "no apareció ningún <img>");

  // ── 4. Sacar el GIF desde el editor ──────────────────────────────────
  // El lápiz es el anteúltimo botón de la fila (después van solo la X de
  // borrar). No se puede usar nth-of-type: las flechitas ▲▼ también son
  // botones y viven en otro div.
  await page.evaluate((i) => {
    const fila = document.querySelector(`[data-fila-ej="${i}"]`);
    const botones = [...fila.querySelectorAll("button")];
    botones[botones.length - 2].click();
  }, filaHip);
  await new Promise((r) => setTimeout(r, 300));
  const clickeado = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("sin GIF"));
    if (!b) return false;
    b.click();
    return true;
  });
  if (clickeado) ok('el editor tiene el botón "Dejar este ejercicio sin GIF"');
  else fallo('el editor tiene el botón "Dejar este ejercicio sin GIF"', "no se encontró el botón");
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUT, "03-editor-sin-gif.png") });

  // Guardar y comprobar que el GIF quedó efectivamente afuera.
  const guardado = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "GUARDAR");
    if (!b) return false;
    b.click();
    return true;
  });
  await new Promise((r) => setTimeout(r, 400));
  if (guardado) {
    const estado = await page.$eval("pre", (e) => e.textContent);
    if (/Hip thrust[\s\S]{0,80}SIN GIF a propósito/.test(estado)) ok("guardar deja el ejercicio sin GIF de verdad");
    else fallo("guardar deja el ejercicio sin GIF de verdad", "el estado no muestra el ejercicio como sin GIF");
  }

  await page.screenshot({ path: path.join(OUT, "04-final.png"), fullPage: true });
  await browser.close();

  console.log("");
  if (fallos.length) {
    console.log(`FALLARON ${fallos.length} comprobacion(es):`);
    fallos.forEach((f) => console.log("  - " + f));
    process.exit(1);
  }
  console.log("Todas las comprobaciones del editor pasaron.");
};

main().catch((e) => {
  console.error("Error corriendo la prueba:", e.message);
  process.exit(1);
});
