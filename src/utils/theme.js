// ── IDENTIDAD TIPOGRÁFICA DI (ronda 16) ─────────────────────────────────
// Sistema de 2 niveles, pedido explícito de Lucas ("que toda la app siga
// esa letra... tiene que haber una identidad visual"):
//   · FONT_DISPLAY — títulos de pantalla, nombres de sección importantes,
//     el wordmark. "PP Formula Condensed" (peso Black condensado, el
//     mismo que dibuja "INTEGRAL" en el SVG de DIWordmark.jsx — antes
//     solo vivía quemado en el vector, ahora también existe como fuente
//     web real en public/fonts/PPFormula-CondensedBlack.otf).
//   · FONT_BODY — todo lo demás: labels, botones, inputs, texto de UI.
//     "PP Formula" (Light/Medium/Extrabold ya cargadas), que es la misma
//     familia que usa el subtítulo "APP DE ENTRENAMIENTO" del login.
//     Ya es la fuente base del <body> en index.html — cualquier texto
//     que no pise fontFamily la hereda sola. Esta constante existe para
//     los lugares que SÍ quieran declararla explícitamente (ej. un
//     elemento dentro de un contexto con otra fuente heredada).
export const FONT_DISPLAY = '"PP Formula Condensed", "PP Formula", system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONT_BODY = '"PP Formula", system-ui, -apple-system, "Segoe UI", sans-serif';

export const DARK_T  = {bg:"#0a0a0a",card:"#121212",card2:"#1a1a1a",border:"#242424",white:"#f0f0f0",gray:"#8a8a8a",lgray:"#4e4e4e",red:"#e53e3e",green:"#4caf50"};
// Modo claro: blanco + escala de grises con contraste (pedido de Lucas 2026-07-20).
// Nada de tonos crema/beige — fondos neutros, texto casi negro.
export const LIGHT_T = {bg:"#f4f4f5",card:"#ffffff",card2:"#ececee",border:"#c9c9cf",white:"#18181b",gray:"#52525b",lgray:"#71717a",red:"#c0392b",green:"#1e7e34"};

export let S = {...DARK_T};
export let card = {background:S.card,border:"1px solid "+S.border,borderRadius:10};
export let inp = {background:S.card2,border:"1px solid "+S.border,borderRadius:6,padding:"9px 12px",color:S.white,fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
export const tabBtn = a => ({flex:1,textAlign:"center",background:a?S.white:S.card,color:a?S.bg:S.gray,border:"1px solid "+(a?S.white:S.border),borderRadius:8,padding:"8px 4px",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:1,transition:"all 0.15s"});
export const smallBtn = (color="#888",bg="transparent") => ({background:bg,color,border:"1px solid "+(bg==="transparent"?color:"transparent"),borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"});

// ── Jerarquía de tabs del alumno (ronda 6) — 3 niveles bien diferenciados ──
// Nivel 1 (Entrenamiento | Diario): pills grandes, borde marcado, el activo invertido (fondo blanco/texto negro).
// Nivel 1 usa FONT_DISPLAY (ronda 16) — es el nivel de navegación más
// grande/protagonista (ENTRENAMIENTO | DIARIO), el más parecido a un
// "título de pantalla" que tiene la app.
export const tabN1 = a => ({flex:1,textAlign:"center",background:a?S.white:S.card,color:a?S.bg:S.gray,border:"1.5px solid "+(a?S.white:S.border),borderRadius:12,padding:"13px 6px",fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:1.5,textTransform:"uppercase",transition:"all 0.15s",fontFamily:FONT_DISPLAY});
// Nivel 2 (Preparación | Principales): tamaño medio, el activo con borde blanco + fondo card — sin invertir.
export const tabN2 = a => ({flex:1,textAlign:"center",background:a?S.card:"transparent",color:a?S.white:S.gray,border:"1px solid "+(a?S.white:S.border),borderRadius:10,padding:"11px 4px",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1,transition:"all 0.15s"});
// Nivel 3 (Movilidad/elástico/peso · Superrápida/Corta/Completa) — ronda 7:
// segmented control contenido: un track con fondo card2 + borde hairline, y el
// segmento activo como pastilla sólida clara (texto oscuro), estilo iOS pero
// dark premium. Claramente subordinado a N1 (invertido grande) y N2 (borde).
export const segTrack = () => ({display:"flex",gap:3,background:S.card2,border:"1px solid "+S.border,borderRadius:10,padding:3});
export const segChip = a => ({flex:1,textAlign:"center",background:a?S.white:"transparent",color:a?S.bg:S.gray,border:"none",borderRadius:7,padding:"7px 4px",fontSize:10,fontWeight:700,letterSpacing:0.6,textTransform:"uppercase",cursor:"pointer",transition:"all 0.25s cubic-bezier(0.32,0.72,0,1)",boxShadow:a?"0 1px 3px rgba(0,0,0,0.3)":"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"});
// Nivel 4 (ronda 11) — sub-menú DENTRO de un chip de nivel 3 (ej. Superrápida
// /Corta/Completa dentro de Movilidad). Tiene que notarse que "cuelga" del
// nivel de arriba, no que compite con él: sin fondo, sin dot, texto chico y
// el activo marcado con una línea inferior de acento — mismo lenguaje que un
// tab de texto subrayado, deliberadamente más sutil que segChip.
export const n4Track = () => ({display:"flex",gap:18,justifyContent:"center",borderTop:"1px solid "+S.border,paddingTop:8});
export const chipN4 = a => ({background:"transparent",border:"none",borderBottom:"2px solid "+(a?S.green:"transparent"),color:a?S.white:S.gray,fontSize:11,fontWeight:a?700:500,letterSpacing:0.3,padding:"1px 1px 5px",cursor:"pointer",transition:"all 0.15s"});

export function applyTheme(dark) {
  const t=dark?DARK_T:LIGHT_T;
  S = t;
  card = {background:S.card,border:"1px solid "+S.border,borderRadius:10};
  inp = {background:S.card2,border:"1px solid "+S.border,borderRadius:6,padding:"9px 12px",color:S.white,fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
}
