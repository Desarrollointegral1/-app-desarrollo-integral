import { mk, uid } from "./helpers.js";

export const PERIODIZACION_BASE=[{semana:1,series:2,reps:6,intensidad:"70%"},{semana:2,series:3,reps:6,intensidad:"75%"},{semana:3,series:2,reps:8,intensidad:"80%"},{semana:4,series:3,reps:8,intensidad:"80%"},{semana:5,series:2,reps:4,intensidad:"85%"},{semana:6,series:3,reps:4,intensidad:"85%"},{semana:7,series:2,reps:6,intensidad:"70%"},{semana:8,series:3,reps:6,intensidad:"75%"}];
export const MOVILIDAD_BASE=[mk("Obelisco","Rotacion de columna toracica."),mk("Movilidad de cadera","Tronco con flexion de cadera."),mk("Puente activacion lumbar","Eleva la cadera contrayendo gluteos."),mk("Dorsiflexion del tobillo","Flexion y extension del tobillo."),mk("Bicho muerto","Brazo y pierna opuestos."),mk("Estiramiento del gato","Flexion y extension de columna."),mk("Superman en cuadrupedia","Brazo y pierna opuestos, cadera estable.")];
export const CALOR_BASE=[mk("Remo a un brazo (banda)","Codo hacia atras activando el dorsal."),mk("Jalon brazos estirados (banda)","Bajas la banda activando dorsales."),mk("Rotacion interna (banda)","Antebrazo hacia adentro."),mk("Rotacion externa (banda)","Antebrazo hacia afuera."),mk("Aperturas (banda)","Brazos hacia adelante."),mk("Press Paloff (banda)","Resiste la rotacion.")];
export const ACTIVACION_BASE=[mk("Rotacion con disco","Caderas fijas, giro de torso."),mk("Buenos dias con disco","Torso adelante, espalda recta."),mk("Remo con disco","Codo hacia atras, activa dorsal.")];

const mkEj=(nombre,desc)=>({id:uid(),nombre,desc,video:"",mediaLocal:"",historial:[]});

export const PLAN_BILATERAL={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_BASE,calor:CALOR_BASE,activacion:ACTIVACION_BASE,
  dias:[{dia:"Sesion",subtitulo:"Ejercicios principales — Bilateral",ejercicios:[mkEj("Press Militar","Barra al frente, empuja hasta bloquear."),mkEj("Sentadilla con barra","Rodillas hacia afuera, baja hasta paralelo."),mkEj("Press de Banca","Baja controlado, codos a 45°."),mkEj("Peso Muerto","Espalda neutra, desliza la barra."),mkEj("Jalon al pecho","Codos hacia abajo, activa dorsales."),mkEj("Hip Thrust bilateral","Empuja con talones, gluteos al tope.")]}]
};
export const PLAN_UNILATERAL={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_BASE,calor:CALOR_BASE,activacion:ACTIVACION_BASE,
  dias:[{dia:"Sesion",subtitulo:"Ejercicios principales — Unilateral",ejercicios:[mkEj("Fuerza impulso un brazo","Empuje vertical alternando brazo."),mkEj("Zancada a una pierna","Rodilla hacia afuera, equilibrio."),mkEj("Pecho inclinado mancuerna","Banco 30-45°, codos controlados."),mkEj("Peso muerto a una pierna","Foco en equilibrio y propiocepcion."),mkEj("Remo un brazo mancuerna","Codo al techo, espalda estable."),mkEj("Hip Thrust a una pierna","Pierna libre paralela al suelo.")]}]
};
export const PLAN_BASE=PLAN_BILATERAL;
