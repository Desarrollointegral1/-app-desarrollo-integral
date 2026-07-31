export const RM_EJS = ["Press Militar","Sentadilla","Pecho Plano","Peso Muerto","Remo / Dominadas","Hip Thrust"];

// Ronda 18 — FIX de fecha: antes usaba toISOString() (UTC). En Argentina
// (UTC-3), entre las 21:00 y las 23:59 devolvía la fecha de MAÑANA:
// asistencias, pesos y diario cargados de noche quedaban con el día
// corrido. Ahora es SIEMPRE la fecha local del dispositivo.
export const hoy = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
export const mesActual = () => { const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1).toString().padStart(2,"0"); };
export const mk = (n,d,v="") => ({nombre:n,desc:d,video:v,mediaLocal:""});
export const emptyRM = () => { const r={}; RM_EJS.forEach(e=>{r[e]={peso:0,fecha:""}}); return r; };
export const getYTId = url => { if(!url) return null; const m=url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/); return m?m[1]:null; };
export const initPesos = plan => { const r={}; plan.dias.forEach(d=>d.ejercicios.forEach(e=>{r[e.id]=0})); return r; };
export const initH = plan => { const r={}; plan.dias.forEach(d=>d.ejercicios.forEach(e=>{r[e.id]=e.historial||[]})); return r; };
export const uid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){const r=Math.random()*16|0;const v=c==='x'?r:(r&0x3|0x8);return v.toString(16);});

// 2026-07-30: vivía duplicada como función local dentro de App.jsx. Se mueve
// acá para que EstudioBio.jsx (bioimpedancia) también pueda calcular la edad
// sola desde la fecha de nacimiento, en vez de pedírsela al entrenador cada
// vez — App.jsx pasa a importarla desde acá.
export function calcularEdad(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// 2026-07-30, pedido de Lucas: "la asistencia aparece pero falta la hora".
// La hora SÍ se guardaba cuando el alumno se marcaba presente solo — pero el
// toggle rápido "Marcar hoy" del Dashboard del admin (Panel Admin → lista de
// alumnos) armaba el registro con la fecha pelada, sin hora. Dos lugares
// distintos armando el mismo dato de dos formas distintas es exactamente el
// tipo de bug que se repite si no se centraliza — de acá en más, cualquier
// marcado de HOY pasa por esta función.
export function registroAsistencia(fecha) {
  if (fecha !== hoy()) return fecha; // día pasado: no hay hora real que poner
  const ahora = new Date();
  return `${fecha} ${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
}

export function getSemanaActual(periodizacion) {
  if(periodizacion[0]&&periodizacion[0].fecha) {
    const hoyDate=new Date(); hoyDate.setHours(0,0,0,0);
    let sem=periodizacion[0].semana;
    for(let i=0;i<periodizacion.length;i++) {
      const parts=periodizacion[i].fecha.split("/");
      if(parts.length<2) continue;
      const f=new Date(hoyDate.getFullYear(),Number(parts[1])-1,Number(parts[0]));
      f.setHours(0,0,0,0);
      if(hoyDate>=f) sem=periodizacion[i].semana;
    }
    return sem;
  }
  return 1;
}
