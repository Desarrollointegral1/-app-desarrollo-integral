export const DARK_T  = {bg:"#0a0a0a",card:"#121212",card2:"#1a1a1a",border:"#242424",white:"#f0f0f0",gray:"#8a8a8a",lgray:"#4e4e4e",red:"#e53e3e",green:"#4caf50"};
export const LIGHT_T = {bg:"#f0ede8",card:"#ffffff",card2:"#f5f2ed",border:"#ddd9d3",white:"#1a1a1a",gray:"#5a5652",lgray:"#9a9691",red:"#c0392b",green:"#1e7e34"};

export let S = {...DARK_T};
export let card = {background:S.card,border:"1px solid "+S.border,borderRadius:10};
export let inp = {background:S.card2,border:"1px solid "+S.border,borderRadius:6,padding:"9px 12px",color:S.white,fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
export const tabBtn = a => ({flex:1,textAlign:"center",background:a?S.white:S.card,color:a?S.bg:S.gray,border:"1px solid "+(a?S.white:S.border),borderRadius:8,padding:"8px 4px",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:1,transition:"all 0.15s"});
export const smallBtn = (color="#888",bg="transparent") => ({background:bg,color,border:"1px solid "+(bg==="transparent"?color:"transparent"),borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"});

export function applyTheme(dark) {
  const t=dark?DARK_T:LIGHT_T;
  S = t;
  card = {background:S.card,border:"1px solid "+S.border,borderRadius:10};
  inp = {background:S.card2,border:"1px solid "+S.border,borderRadius:6,padding:"9px 12px",color:S.white,fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
}
