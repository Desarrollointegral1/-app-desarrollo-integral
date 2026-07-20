// ── FLYER DE BIOIMPEDANCIA (ronda 8) ──────────────────────────────────
// Documento de UNA página con la marca DI para mandarle al alumno después
// de cada estudio de composición corporal. Replica el diseño de los flyers
// que hacían a mano: header con logo + fecha en recuadro negro, título
// "[NOMBRE] – RESULTADOS" subrayado, foto del día a la izquierda, tabla de
// métricas con puntos suspensivos a la derecha, escudo negro de GRASA
// VISCERAL, bloques de CONCLUSIÓN y OBJETIVO DE MEJORA, y footer negro con
// el wordmark. HTML autocontenido (sin requests externos, la foto viaja por
// URL pública de Supabase o embebida) + CSS @media print para exportar PDF.
//
// PERSISTENCIA: la conclusión y el objetivo viven en la columna jsonb
// `metadata` del registro de bioimpedancia (ya se guardan desde el form del
// admin). El flyer NO se sube a storage: se REGENERA cuando haga falta desde
// el registro — es más robusto (siempre refleja los datos actuales y no hay
// archivos huérfanos que mantener).

// Ícono DI en negro (mismo vector que usa la app)
const ICONO_NEGRO =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1500" viewBox="0 0 1500 1500"><g><path d="M749.86,1171.008v9.548s-.04-1.818-.16-5.254c.04-1.238.1-2.657.16-4.295Z"/><g><path d="M1100.176,457.931c-1.646,2.291-66.952,91.918-156.767,161.748-43.672,33.954-80.83,75.699-107.653,124.079-17.779,32.068-34.14,70.471-44.945,115.028-31.642,130.562-39.392,274.368-40.95,312.222-.06,1.638-.12,3.056-.16,4.295-.06-1.238-.12-2.657-.18-4.295-1.558-37.854-9.309-181.66-40.95-312.222-11.623-47.953-29.689-88.78-49.034-122.25-26.185-45.303-61.486-84.632-102.803-116.74-89.891-69.855-155.269-159.576-156.909-161.865,3.036,2.697,197.94,176.187,350.116,176.287h.12c152.176-.1,347.08-173.59,350.116-176.287Z"/><path d="M749.7,1175.303c-.14,3.436-.18,5.254-.18,5.254v-9.548c.06,1.638.12,3.056.18,4.295Z"/></g></g><circle cx="750.001" cy="508.788" r="69.377"/><path d="M689.368,1062.142s-6.193-178.398-52.626-271.706c-60.339-121.251-203.315-204.621-203.315-204.621,0,0,97.15,96.045,163.424,228.592,66.274,132.547,92.518,247.736,92.518,247.736Z"/><path d="M810.874,1062.142s6.193-178.398,52.626-271.706c60.339-121.251,203.315-204.621,203.315-204.621,0,0-97.15,96.045-163.424,228.592-66.274,132.547-92.518,247.736-92.518,247.736Z"/></svg>',
  );
const ICONO_BLANCO = ICONO_NEGRO.replace(
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"'),
  encodeURIComponent('<svg fill="#fff" xmlns="http://www.w3.org/2000/svg"'),
);

// Calificación del nivel de grasa visceral (criterio del equipo DI):
// ≤4 muy saludable · 5-9 saludable · 10-14 alto · 15+ muy alto
export function calificacionVisceral(nivel) {
  const n = Number(nivel);
  if (!n && n !== 0) return "";
  if (n <= 4) return "MUY SALUDABLE";
  if (n <= 9) return "SALUDABLE";
  if (n <= 14) return "ALTO";
  return "MUY ALTO";
}

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmtFecha = (f) => {
  const x = String(f || "").slice(0, 10).split("-");
  return x.length === 3 ? `${x[2]}/${x[1]}/${x[0]}` : String(f || "—");
};

// Construye el HTML completo del flyer. `alumno` = { nombre }, `bio` = registro
// de la tabla bioimpedancia (fecha, peso, imc, grasa_corporal, masa_muscular,
// grasa_visceral, altura, edad, archivo_url, metadata:{conclusion, objetivo}).
export function construirFlyerBioHTML(alumno, bio) {
  const nombre = (alumno?.nombre || "").toUpperCase();
  const meta = bio?.metadata || {};
  const visceral = bio?.grasa_visceral;
  const calif = calificacionVisceral(visceral);
  const filas = [
    ["🎂", "EDAD", bio?.edad != null && bio.edad !== "" ? `${bio.edad} AÑOS` : "—"],
    ["📏", "ESTATURA", bio?.altura != null && bio.altura !== "" ? `${bio.altura} CM` : "—"],
    ["⚖️", "PESO", bio?.peso != null && bio.peso !== "" ? `${bio.peso} KG` : "—"],
    ["🧮", "IMC", bio?.imc != null && bio.imc !== "" ? `${bio.imc}` : "—"],
    ["🔥", "% GRASA CORPORAL", bio?.grasa_corporal != null && bio.grasa_corporal !== "" ? `${bio.grasa_corporal}%` : "—"],
    ["💪", "% MASA MUSCULAR", bio?.masa_muscular != null && bio.masa_muscular !== "" ? `${bio.masa_muscular}%` : "—"],
  ];
  const filasHTML = filas
    .map(
      ([ic, l, v], i) => `
      <div class="fila${i % 2 === 1 ? " alt" : ""}">
        <span class="fic">${ic}</span>
        <span class="flabel">${l}</span>
        <span class="fdots"></span>
        <span class="fval">${esc(v)}</span>
      </div>`,
    )
    .join("");

  const fotoHTML = bio?.archivo_url
    ? `<img class="foto" src="${esc(bio.archivo_url)}" alt="Foto de ${esc(alumno?.nombre || "")}">`
    : `<div class="foto foto-vacia"><img src="${ICONO_NEGRO}" width="90" height="90" alt="" style="opacity:.15"></div>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Resultados bioimpedancia — ${esc(alumno?.nombre || "")} — Desarrollo Integral</title>
<style>
  :root { --negro:#111; --gris:#555; --grisclaro:#efefef; --fondo:#f7f7f5; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif; background:var(--fondo); color:var(--negro); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .hoja { max-width:820px; margin:0 auto; padding:34px 38px 0; min-height:100vh; display:flex; flex-direction:column; }
  /* Header */
  header { display:flex; justify-content:space-between; align-items:center; gap:16px; }
  .marca { display:flex; align-items:center; gap:12px; }
  .marca img { width:64px; height:64px; }
  .marca .m1 { font-size:19px; font-weight:900; font-style:italic; letter-spacing:.5px; text-transform:uppercase; line-height:1.05; }
  .marca .m2 { font-size:9px; letter-spacing:4px; text-transform:uppercase; color:var(--gris); margin-top:3px; }
  .fecha-box { background:var(--negro); color:#fff; border-radius:14px; padding:12px 18px; display:flex; align-items:center; gap:10px; }
  .fecha-box .fi { font-size:20px; }
  .fecha-box .fl { font-size:8px; letter-spacing:2px; text-transform:uppercase; opacity:.75; }
  .fecha-box .fv { font-size:17px; font-weight:900; letter-spacing:1px; }
  /* Título */
  h1 { margin:26px 0 4px; font-size:40px; font-weight:900; font-style:italic; letter-spacing:-.5px; text-transform:uppercase; transform:scaleX(.92); transform-origin:left; white-space:nowrap; }
  .subraya { height:6px; background:var(--negro); border-radius:3px; width:62%; margin-bottom:26px; }
  /* Cuerpo: foto | tabla + escudo */
  .cuerpo { display:flex; gap:26px; align-items:stretch; }
  .col-foto { flex:0 0 250px; }
  .foto { width:250px; height:340px; object-fit:cover; object-position:top center; border-radius:18px; background:#e8e8e6; display:block; }
  .foto-vacia { display:flex; align-items:center; justify-content:center; }
  .col-datos { flex:1; display:flex; gap:18px; }
  .tabla { flex:1; }
  .fila { display:flex; align-items:center; gap:10px; padding:11px 12px; border-radius:12px; }
  .fila.alt { background:var(--grisclaro); }
  .fic { width:30px; height:30px; background:var(--negro); color:#fff; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
  .flabel { font-size:11.5px; font-weight:800; letter-spacing:1px; white-space:nowrap; }
  .fdots { flex:1; border-bottom:2.5px dotted #b9b9b4; margin:0 4px 4px; min-width:16px; }
  .fval { font-size:15px; font-weight:900; white-space:nowrap; }
  /* Escudo grasa visceral */
  .escudo { flex:0 0 128px; align-self:center; background:var(--negro); color:#fff; border-radius:16px 16px 58px 58px; padding:18px 10px 24px; text-align:center; }
  .escudo .el { font-size:9px; letter-spacing:2px; text-transform:uppercase; opacity:.8; line-height:1.5; }
  .escudo .en { font-size:52px; font-weight:900; line-height:1.1; margin:8px 0 6px; }
  .escudo .ec { font-size:9.5px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; border-top:1px solid rgba(255,255,255,.3); padding-top:8px; }
  /* Bloques conclusión / objetivo */
  .bloques { margin-top:24px; display:flex; flex-direction:column; gap:14px; }
  .bloque .bt { background:var(--negro); color:#fff; border-radius:10px 10px 0 0; padding:8px 14px; font-size:11px; font-weight:900; letter-spacing:2px; text-transform:uppercase; display:flex; align-items:center; gap:8px; }
  .bloque .bc { background:var(--grisclaro); border-radius:0 0 10px 10px; padding:12px 14px; font-size:13px; line-height:1.6; min-height:44px; }
  /* Footer */
  footer { margin-top:auto; }
  .footer-bar { margin-top:26px; background:var(--negro); color:#fff; border-radius:14px 14px 0 0; padding:16px 20px; display:flex; align-items:center; justify-content:center; gap:12px; }
  .footer-bar img { width:34px; height:34px; }
  .footer-bar .f1 { font-size:15px; font-weight:900; font-style:italic; letter-spacing:1px; text-transform:uppercase; }
  .footer-bar .f2 { font-size:8px; letter-spacing:4px; text-transform:uppercase; opacity:.75; margin-top:2px; }
  @media print { body { background:#fff; } .hoja { max-width:none; padding:18px 10mm 0; min-height:97vh; } @page { size:A4 portrait; margin:8mm; } }
  @media (max-width:640px) { .cuerpo { flex-direction:column; } .col-foto { flex:none; } .foto { width:100%; } h1 { font-size:28px; white-space:normal; } .col-datos { flex-direction:column; } .escudo { align-self:flex-start; } }
</style></head>
<body><div class="hoja">
  <header>
    <div class="marca">
      <img src="${ICONO_NEGRO}" alt="DI">
      <div><div class="m1">Desarrollo<br>Integral</div><div class="m2">Centro de Entrenamiento</div></div>
    </div>
    <div class="fecha-box"><span class="fi">📅</span><div><div class="fl">Fecha del examen</div><div class="fv">${fmtFecha(bio?.fecha)}</div></div></div>
  </header>
  <h1>${esc(nombre)} – RESULTADOS</h1>
  <div class="subraya"></div>
  <div class="cuerpo">
    <div class="col-foto">${fotoHTML}</div>
    <div class="col-datos">
      <div class="tabla">${filasHTML}</div>
      ${visceral != null && visceral !== "" ? `
      <div class="escudo">
        <div class="el">Grasa<br>Visceral</div>
        <div class="en">${esc(visceral)}</div>
        <div class="ec">${esc(calif)}</div>
      </div>` : ""}
    </div>
  </div>
  <div class="bloques">
    <div class="bloque"><div class="bt">📋 Conclusión</div><div class="bc">${esc(meta.conclusion || "—")}</div></div>
    <div class="bloque"><div class="bt">🎯 Objetivo de mejora</div><div class="bc">${esc(meta.objetivo || "—")}</div></div>
  </div>
  <footer><div class="footer-bar">
    <img src="${ICONO_BLANCO}" alt="">
    <div style="text-align:center"><div class="f1">Desarrollo Integral</div><div class="f2">Centro de Entrenamiento</div></div>
  </div></footer>
</div></body></html>`;
}

// Genera el flyer y lo descarga como .html (se abre en el navegador y se
// imprime/guarda como PDF con el CSS print incluido).
export function generarFlyerBio(alumno, bio) {
  const html = construirFlyerBioHTML(alumno, bio);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const nombreArchivo = `flyer-bio-${String(bio?.fecha || "").slice(0, 10)}-${(alumno?.nombre || "alumno").replace(/\s+/g, "-").toLowerCase()}.html`;
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
