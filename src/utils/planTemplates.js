import { mk, uid } from "./helpers.js";

export const PERIODIZACION_BASE=[{semana:1,series:2,reps:6,intensidad:"70%"},{semana:2,series:3,reps:6,intensidad:"75%"},{semana:3,series:2,reps:8,intensidad:"80%"},{semana:4,series:3,reps:8,intensidad:"80%"},{semana:5,series:2,reps:4,intensidad:"85%"},{semana:6,series:3,reps:4,intensidad:"85%"},{semana:7,series:2,reps:6,intensidad:"70%"},{semana:8,series:3,reps:6,intensidad:"75%"}];

export const MOVILIDAD_BASE=[
  mk("Obelisco","Rotacion de columna toracica de pie."),
  mk("Sentadilla de Activacion de Peso","Sentadilla lenta activando gluteos y core."),
  mk("Movilidad de cadera","Tronco con flexion de cadera, circulos amplios."),
  mk("Puente invertido mesa","Eleva la cadera desde el suelo, espalda recta."),
  mk("Dorsiflexion del tobillo","Rodilla adelante, talon apoyado, flexion tobillo."),
  mk("Bicho muerto","Brazo y pierna opuestos, espalda neutra."),
  mk("Estiramiento del gato","Flexion y extension de columna en cuadrupedia."),
  mk("Superman en cuadrupedia","Brazo y pierna opuestos, cadera estable."),
  mk("Rotaciones toracicas","De costado, rodillas dobladas, rota el torso."),
  mk("Plancha isometrica 15s","Core activo, cuerpo recto, 15 segundos."),
  mk("Espinales nados","Boca abajo, elevas brazos y piernas alternando."),
];

export const CALOR_BASE=[
  mk("Remo a un brazo (banda)","Codo hacia atras activando el dorsal."),
  mk("Jalon brazos estirados (banda)","Bajas la banda activando dorsales."),
  mk("Rotacion interna (banda)","Antebrazo hacia adentro."),
  mk("Rotacion externa (banda)","Antebrazo hacia afuera."),
  mk("Aperturas (banda)","Brazos hacia adelante, activa pectoral."),
  mk("Press Paloff (banda)","Resiste la rotacion, core activo."),
];

export const ACTIVACION_BASE=[
  mk("Rotacion con disco","Caderas fijas, giro de torso con disco."),
  mk("Buenos dias con disco","Torso adelante, espalda recta, disco al pecho."),
  mk("Jalon con mancuerna","Mancuerna sobre la cabeza, baja activando dorsal."),
  mk("Remo con disco","Codo hacia atras, activa dorsal."),
  mk("Peso muerto a una pierna sin peso","Foco en equilibrio y bisagra de cadera."),
  mk("Sentadilla bulgara sin peso","Pie trasero elevado, baja controlado."),
];

const mkEj=(nombre,desc)=>({id:uid(),nombre,desc,video:"",mediaLocal:"",historial:[]});

export const PLAN_BILATERAL={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_BASE,calor:CALOR_BASE,activacion:ACTIVACION_BASE,
  dias:[{dia:"Sesion",subtitulo:"Ejercicios principales — Bilateral",ejercicios:[
    mkEj("Fuerza con impulso con barra","Empuje vertical explosivo con barra o mancuernas."),
    mkEj("Sentadilla con barra","Rodillas hacia afuera, baja hasta paralelo o mas."),
    mkEj("Pecho plano con barra","Baja controlado al pecho, codos a 45°."),
    mkEj("Peso muerto con barra","Espalda neutra, desliza la barra por las piernas."),
    mkEj("Jalon al pecho / Maquina dorsales","Codos hacia abajo, activa dorsales al tope."),
    mkEj("Hip Thrust bilateral","Empuja con talones, gluteos contraidos al tope."),
  ]}]
};

export const PLAN_UNILATERAL={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_BASE,calor:CALOR_BASE,activacion:ACTIVACION_BASE,
  dias:[{dia:"Sesion",subtitulo:"Ejercicios principales — Unilateral",ejercicios:[
    mkEj("Fuerza con impulso a un brazo","Empuje vertical alternando brazo, hombro estable."),
    mkEj("Zancada a una pierna","Rodilla hacia afuera, paso largo, equilibrio."),
    mkEj("Pecho inclinado con mancuerna","Banco 30-45°, codos controlados, no bloquear."),
    mkEj("Peso muerto a una pierna","Foco en equilibrio, bisagra de cadera, espalda recta."),
    mkEj("Remo a un brazo","Codo al techo, espalda estable, activa dorsal."),
    mkEj("Levantada de cadera a una pierna","Pierna libre paralela al suelo, empuja con el talon."),
  ]}]
};

export const PLAN_BASE=PLAN_BILATERAL;
