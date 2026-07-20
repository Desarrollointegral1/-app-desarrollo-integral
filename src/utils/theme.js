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
export const tabN1 = a => ({flex:1,textAlign:"center",background:a?S.white:S.card,color:a?S.bg:S.gray,border:"1.5px solid "+(a?S.white:S.border),borderRadius:12,padding:"13px 6px",fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:1.5,textTransform:"uppercase",transition:"all 0.15s"});
// Nivel 2 (Preparación | Principales): tamaño medio, el activo con borde blanco + fondo card — sin invertir.
export const tabN2 = a => ({flex:1,textAlign:"center",background:a?S.card:"transparent",color:a?S.white:S.gray,border:"1px solid "+(a?S.white:S.border),borderRadius:10,padding:"11px 4px",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1,transition:"all 0.15s"});
// Nivel 3 (Movilidad/elástico/peso · Superrápida/Corta/Completa): chips chicos y sutiles; el activo se marca con un dot (lo pinta el componente).
export const chipN3 = a => ({flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:"transparent",color:a?S.white:S.gray,border:"1px solid transparent",borderRadius:8,padding:"7px 3px",fontSize:10,fontWeight:a?700:500,cursor:"pointer",letterSpacing:0.5,transition:"all 0.15s"});

export function applyTheme(dark) {
  const t=dark?DARK_T:LIGHT_T;
  S = t;
  card = {background:S.card,border:"1px solid "+S.border,borderRadius:10};
  inp = {background:S.card2,border:"1px solid "+S.border,borderRadius:6,padding:"9px 12px",color:S.white,fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
}
