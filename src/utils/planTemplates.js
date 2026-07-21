import { mk, uid } from "./helpers.js";

// ═══════════════════════════════════════════════════════════════════════
// CEREBRO CENTRAL DE PLANES — Desarrollo Integral
// Todos los planes siguen la misma estructura:
//   1. Movilidad
//   2. Entrada en calor con banda
//   2.1 Entrada en calor con peso (disco / mancuerna / katana)
//   3. Ejercicios principales
// Las rutinas viven acá como bloques reutilizables; las PLANTILLAS los
// combinan. Para asignar a un alumno SIEMPRE usar clonarPlan() (ids nuevos).
// ═══════════════════════════════════════════════════════════════════════

export const PERIODIZACION_BASE=[{semana:1,series:2,reps:6,intensidad:"70%"},{semana:2,series:3,reps:6,intensidad:"75%"},{semana:3,series:2,reps:8,intensidad:"80%"},{semana:4,series:3,reps:8,intensidad:"80%"},{semana:5,series:2,reps:4,intensidad:"85%"},{semana:6,series:3,reps:4,intensidad:"85%"},{semana:7,series:2,reps:6,intensidad:"70%"},{semana:8,series:3,reps:6,intensidad:"75%"}];

// ── 1. RUTINAS DE MOVILIDAD ────────────────────────────────────────────
// CONTENIDO OFICIAL (lista de Lucas, ronda 9 — 2026-07-20). La movilidad
// "Completa" del alumno = piso y sentado + cuadrupedia + dinámica.

// Rutina 1 — piso y sentado
export const MOVILIDAD_PISO_SENTADO=[
  mk("Elevación de pierna (isquiotibiales)","Acostado, agarrá detrás de la rodilla, estirá la pierna y bajá."),
  mk("Estiramiento glúteo cruzado","Cruzá un pie sobre la otra pierna. Tirá del pie y empujá la rodilla hacia afuera."),
  mk("Puente de glúteos","Pies apoyados. Levantá la cadera y bajá lento."),
  mk("Estiramiento figura 4 (glúteo)","Tobillo sobre rodilla. Traé la pierna hacia el pecho."),
  mk("Flexión adelante sentado (una pierna)","Una pierna estirada. Inclinate hacia el pie."),
  mk("Mariposa (plantas juntas)","Juntá plantas de los pies. Espalda recta."),
  mk("Mariposa con inclinación","Desde ahí, inclinate hacia adelante."),
  mk("Apertura de piernas sentado","Piernas abiertas. Inclinate levemente adelante."),
  mk("90/90 cadera (rotación)","En 90/90, incliná el torso adelante y luego atrás."),
  mk("Apoyo atrás y apertura de pecho","Manos atrás. Abrí el pecho y mirá arriba."),
  mk("Rotación de cadera sentado","Llevá una rodilla hacia el talón contrario. Alternar."),
  mk("Elevación de piernas sentado","Elevá una pierna y luego la otra."),
  mk("Elevación asistida (detrás de rodillas)","Tomá detrás de rodillas y elevá alternando."),
];

// Rutina 2 — cuadrupedia
export const MOVILIDAD_CUADRUPEDIA=[
  mk("Gato–vaca (columna)","Redondeá la espalda y luego abrila."),
  mk("Superman en cuadrupedia","Estirá brazo y pierna opuestos."),
  mk("Rotación torácica con pierna extendida","Pasá el brazo por debajo y abrí hacia arriba."),
  mk("Postura del niño (atrás)","Llevá la cadera a los talones."),
  mk("Postura del niño lateral","Caminá manos a un lado."),
];

// Rutina 3 — dinámica
export const MOVILIDAD_DINAMICA=[
  mk("Estocada al frente (cadera)","Pie adelante. Empujá la cadera hacia adelante."),
  mk("Estocada con estiramiento atrás","Estirá la pierna de atrás y bajá la cadera."),
  mk("Estocada a isquiotibiales","Cadera atrás, estirá la pierna de adelante."),
  mk("Rana (aductores)","Rodillas abiertas. Llevá la cadera atrás."),
  mk("Extensión en rana (columna)","Bajá el ombligo y levantá el pecho."),
  mk("Esfinge (boca abajo)","Apoyado en codos. Abrí el pecho."),
  mk("Cobra (extensión lumbar)","Empujá con manos y elevá el pecho."),
  mk("Nado boca abajo (brazos alternados)","Alterná brazos sin tocar el piso."),
];

// Movilidad COMPLETA = las tres rutinas oficiales en orden.
export const MOVILIDAD_COMPLETA=[
  ...MOVILIDAD_PISO_SENTADO,
  ...MOVILIDAD_CUADRUPEDIA,
  ...MOVILIDAD_DINAMICA,
];

// Compatibilidad: MOVILIDAD_BASE es lo que los planes asignan como movilidad
// del alumno — ahora apunta al contenido oficial completo.
export const MOVILIDAD_BASE=MOVILIDAD_COMPLETA;

// Versión CORTA (~8 min): subset balanceado de las tres rutinas oficiales.
export const MOVILIDAD_CORTA=[
  mk("Elevación de pierna (isquiotibiales)","Acostado, agarrá detrás de la rodilla, estirá la pierna y bajá."),
  mk("Estiramiento figura 4 (glúteo)","Tobillo sobre rodilla. Traé la pierna hacia el pecho."),
  mk("Puente de glúteos","Pies apoyados. Levantá la cadera y bajá lento."),
  mk("Mariposa (plantas juntas)","Juntá plantas de los pies. Espalda recta."),
  mk("90/90 cadera (rotación)","En 90/90, incliná el torso adelante y luego atrás."),
  mk("Gato–vaca (columna)","Redondeá la espalda y luego abrila."),
  mk("Postura del niño (atrás)","Llevá la cadera a los talones."),
  mk("Estocada al frente (cadera)","Pie adelante. Empujá la cadera hacia adelante."),
  mk("Estocada a isquiotibiales","Cadera atrás, estirá la pierna de adelante."),
  mk("Cobra (extensión lumbar)","Empujá con manos y elevá el pecho."),
];

// Rutina 4 — articulaciones y general
export const MOVILIDAD_ARTICULACIONES=[
  mk("Rotacion de tobillo","Apoyado en un pie, gira el otro tobillo hacia afuera y hacia adentro."),
  mk("Rotacion de rodillas","Con las manos en las rodillas, gira ambas hacia un lado y hacia el otro."),
  mk("Rotacion de rodillas alternada","Move una rodilla a cada lado, alternando."),
  mk("Circulos de cadera","Hace circulos con la cadera hacia un lado y hacia el otro."),
  mk("Bisagra de cadera","Con la espalda recta, lleva la cadera atras y volve."),
  mk("Circulos de hombros","Con los brazos abiertos, gira los hombros hacia adelante y hacia atras."),
  mk("Circulos de munecas","Gira las manos hacia adentro y hacia afuera."),
  mk("Movilidad de cuello","Lleva la cabeza a un lado y al otro, y hace circulos suaves."),
  mk("Flexion y extension de codos","Estira y dobla los codos de forma controlada."),
  mk("Elevacion de brazos","Subi los brazos arriba de la cabeza y bajalos."),
  mk("Elevacion de rodilla con apertura","Eleva una rodilla y abrila hacia afuera. Baja y cambia de lado."),
];

// ── 2. ENTRADA EN CALOR CON ELÁSTICO (Act. Elástico) ───────────────────
// CONTENIDO OFICIAL (lista de Lucas, ronda 9 — 2026-07-20).

export const CALOR_BANDA=[
  mk("Pasadas con banda (hombros)","Banda arriba y atrás con brazos estirados."),
  mk("Rotación interna con banda (codo al cuerpo)","Codo pegado. Llevá la mano al abdomen."),
  mk("Remo con banda (doble)","Tirá hacia el torso con ambas manos."),
  mk("Remo con palo (codos atrás)","Llevá codos atrás con el palo."),
  mk("Retracción escapular con palo","Juntá escápulas con el palo en la cintura."),
  mk("Jalón con banda (desde arriba)","Tirá la banda hacia abajo."),
  mk("Movilidad de tobillo (pie elevado, avance)","Avanzá la rodilla sobre el pie elevado."),
];

// Compatibilidad: los planes viejos (bilateral/unilateral) referenciaban
// CALOR_BASE — ahora es el mismo contenido oficial con elástico.
export const CALOR_BASE=CALOR_BANDA;

// ── 2.1 ENTRADA EN CALOR CON PESO (disco / mancuerna / katana) ─────────

export const ACTIVACION_BASE=[
  mk("Rotacion con disco","Caderas fijas, giro de torso con disco."),
  mk("Buenos dias con disco","Torso adelante, espalda recta, disco al pecho."),
  mk("Jalon con mancuerna","Mancuerna sobre la cabeza, baja activando dorsal."),
  mk("Remo con disco","Codo hacia atras, activa dorsal."),
  mk("Peso muerto a una pierna sin peso","Foco en equilibrio y bisagra de cadera."),
  mk("Sentadilla bulgara sin peso","Pie trasero elevado, baja controlado."),
];

export const CALOR_PESO=[
  mk("Vuelta al mundo con disco","Sostene el disco al frente y rodea la cabeza pasandolo por arriba y atras."),
  mk("Remo con disco","Inclina el torso y tira el disco hacia el abdomen."),
  mk("Buenos dias con disco","Con el disco en el pecho, lleva la cadera atras y volve (bisagra de cadera)."),
  mk("Press arriba con disco","Con el disco en el pecho, empuja hacia arriba hasta estirar los brazos."),
  mk("Katana sobre la cabeza","Sostene la katana arriba y mantene el control del tronco."),
  mk("Paso al frente con katana","De pie, hace un paso hacia adelante llevando la katana hacia adelante."),
];

export const CALOR_MANCUERNA=[
  mk("Rotacion con mancuerna","Mancuerna detras del cuello, rota el tronco de lado a lado."),
  mk("Buenos dias con mancuerna","Flexion de cadera con espalda recta, mancuerna al pecho."),
  mk("Remo con mancuerna","Remo inclinado, espalda recta, codo hacia atras."),
  mk("Peso muerto a 1 pierna","Foco en equilibrio, bisagra de cadera, espalda recta."),
];

// ── 3. EJERCICIOS PRINCIPALES ──────────────────────────────────────────

const mkEj=(nombre,desc)=>({id:uid(),nombre,desc,video:"",mediaLocal:"",historial:[]});

// CONTENIDO OFICIAL (lista de Lucas, ronda 9 — 2026-07-20).
export const PRINCIPALES_BASICO=()=>[
  mkEj("Press de hombros sentado con mancuernas","Sentado, mancuernas a la altura de hombros. Empujá hacia arriba con codos al frente. Bajá controlado."),
  mkEj("Sentarse y pararse del cajón (carga al pecho)","Sentate y parate de un cajón a la altura de la rodilla, con peso en el pecho. Bajá hacia atrás y subí sin usar manos."),
  mkEj("Press de pecho con barra (plano)","Acostado, bajá la barra al pecho y empujá hacia arriba."),
  mkEj("Bisagra de cadera con banda (hip thrust)","Banda en la cadera. Empujá la cadera hacia adelante y apretá glúteos. Volvé."),
  mkEj("Peso muerto con kettlebell","Peso al frente. Empujá la cadera atrás y bajá; volvé llevando la cadera adelante."),
  mkEj("Remo en TRX (inclinado)","Cuerpo inclinado, tirá del TRX llevando el pecho a las manos. Bajá lento."),
  mkEj("Puente de glúteos en el piso (con peso)","Acostado, peso sobre la cadera. Elevá la cadera y bajá controlado."),
];

// Principales unificados Bilateral (= Plan complejo oficial): barra, dominadas e hip thrust.
export const PRINCIPALES_BILATERAL=()=>[
  mkEj("Press de hombros sentado con mancuernas","Sentado, mancuernas a la altura de hombros. Empujá hacia arriba con codos al frente. Bajá controlado."),
  mkEj("Sentadilla con barra","Barra sobre la espalda. Bajá llevando la cadera atrás y doblando rodillas. Subí empujando el piso."),
  mkEj("Press de pecho con barra (plano)","Acostado, bajá la barra al pecho y empujá hacia arriba."),
  mkEj("Peso muerto con barra","Barra cerca de las piernas. Empujá la cadera atrás, bajá y subí llevando la cadera adelante."),
  mkEj("Dominadas","Colgado de la barra, tirá del cuerpo hacia arriba hasta pasar la barbilla. Bajá controlado."),
  mkEj("Hip thrust (con barra o mancuerna)","Espalda apoyada, peso en la cadera. Elevá la cadera y apretá glúteos. Bajá controlado."),
];

// ── PLANES CLÁSICOS (compatibilidad) ───────────────────────────────────

export const PLAN_BILATERAL={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_BASE,calor:CALOR_BASE,activacion:ACTIVACION_BASE,
  dias:[{dia:"Sesion",subtitulo:"Ejercicios principales — Bilateral",ejercicios:PRINCIPALES_BILATERAL()}]
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

// ── PLANES NUEVOS ──────────────────────────────────────────────────────

export const PLAN_BASICO={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Ejercicios principales — Basico",ejercicios:PRINCIPALES_BASICO()}]
};

// ── PROGRESIONES POR OBJETIVO (CEREBRO-ENTRENAMIENTO.md v2, 2026-07-19) ──
// Cada plan por objetivo tiene su propia periodizacion de 8 semanas.

const per=(esquema)=>esquema.map(([series,reps,intensidad],i)=>({semana:i+1,series,reps,intensidad}));

export const PLAN_ACOND_PRINCIPIANTE={
  periodizacion:per([[2,6,"60%"],[3,6,"60%"],[2,8,"65%"],[3,8,"65%"],[3,8,"70%"],[2,10,"70%"],[3,8,"70%"],[3,10,"75%"]]),
  movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Acondicionamiento — Principiante",ejercicios:[
    mkEj("Press de hombros sentado con mancuernas","Sentado, empuja las mancuernas hacia arriba con control."),
    mkEj("Levantada del cajon","Sentate y parate de un cajon a la altura de la rodilla, sin usar las manos."),
    mkEj("Press de pecho con barra en banco plano","Baja la barra al pecho y empuja hacia arriba."),
    mkEj("Peso muerto con kettlebell","Con el peso al frente, lleva la cadera atras y despues adelante."),
    mkEj("Remo en TRX inclinado","Con el cuerpo inclinado, tira del TRX hacia el pecho."),
    mkEj("Puente de gluteos con peso","Acostado, apoya el peso en la cadera y levanta la cadera."),
  ]}]
};

export const PLAN_ACOND_AVANZADO={
  periodizacion:per([[2,6,"65%"],[3,6,"65%"],[2,8,"70%"],[3,8,"70%"],[2,10,"75%"],[3,10,"75%"],[2,6,"80%"],[3,6,"82,5%"]]),
  movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Acondicionamiento — Avanzado",ejercicios:[
    mkEj("Press de hombros sentado con mancuernas","Sentado, empuja las mancuernas hacia arriba con control."),
    mkEj("Goblet squat","Sentadilla con el peso al pecho, codos entre las rodillas."),
    mkEj("Press de pecho con barra en banco plano","Baja la barra al pecho y empuja hacia arriba."),
    mkEj("Peso muerto con barra","Lleva la cadera atras, baja la barra y volve a subir."),
    mkEj("Dominadas","Colgado de la barra, tira del cuerpo hacia arriba y baja lento."),
    mkEj("Hip thrust con barra o mancuerna","Con la espalda apoyada, levanta la cadera y apreta gluteos."),
  ]}]
};

export const PLAN_PF_PRINCIPIANTE={
  periodizacion:per([[2,6,"65%"],[3,6,"65%"],[2,8,"70%"],[3,8,"70%"],[2,4,"75%"],[3,4,"75%"],[2,8,"80%"],[3,8,"80%"]]),
  movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Preparacion Fisica — Principiante",ejercicios:[
    mkEj("Press de hombros sentado con mancuernas","Sentado, empuja las mancuernas hacia arriba con control."),
    mkEj("Sentadilla con barra","Con la barra en la espalda, baja y subi empujando el piso."),
    mkEj("Press de pecho con barra en banco plano","Baja la barra al pecho y empuja hacia arriba."),
    mkEj("Peso muerto con kettlebell","Con el peso al frente, lleva la cadera atras y despues adelante."),
    mkEj("Remo en TRX inclinado","Con el cuerpo inclinado, tira del TRX hacia el pecho."),
    mkEj("Puente de gluteos con peso","Acostado, apoya el peso en la cadera y levanta la cadera."),
  ]}]
};

export const PLAN_PF_AVANZADO={
  periodizacion:per([[2,6,"70%"],[3,6,"72,5%"],[2,8,"75%"],[3,8,"77,5%"],[2,4,"80%"],[3,4,"82,5%"],[3,6,"85%"],[3,8,"87,5%"]]),
  movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Preparacion Fisica — Avanzado",ejercicios:[
    mkEj("Press de hombros con barra","De pie o sentado, empuja la barra sobre la cabeza con control."),
    mkEj("Sentadilla con barra","Con la barra en la espalda, baja y subi empujando el piso."),
    mkEj("Press de pecho con barra en banco plano","Baja la barra al pecho y empuja hacia arriba."),
    mkEj("Peso muerto con barra","Lleva la cadera atras, baja la barra y volve a subir."),
    mkEj("Dominadas","Colgado de la barra, tira del cuerpo hacia arriba y baja lento."),
    mkEj("Hip thrust con barra","Con la espalda apoyada, levanta la cadera y apreta gluteos."),
  ]}]
};

export const PLAN_PPL={
  periodizacion:per([[3,6,"70%"],[2,8,"70%"],[3,8,"75%"],[2,10,"75%"],[3,10,"80%"],[2,12,"82,5%"],[3,12,"85%"],[3,12,"87,5%"]]),
  movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[
    {dia:"Dia 1",subtitulo:"Empuje (PUSH) + Core",ejercicios:[
      mkEj("Press de hombros sentado con mancuernas","Sentado, empuja las mancuernas hacia arriba con control."),
      mkEj("Press de pecho con barra en banco plano","Baja la barra al pecho y empuja hacia arriba."),
      mkEj("Fondos","En paralelas, baja controlado y empuja hasta estirar los brazos."),
      mkEj("Core (crunch)","Acostado, subi el torso despacio sin tirar del cuello."),
    ]},
    {dia:"Dia 2",subtitulo:"Tiron (PULL) + Core",ejercicios:[
      mkEj("Remo con mancuernas","Torso inclinado, espalda recta, lleva los codos hacia atras."),
      mkEj("Dominadas","Colgado de la barra, tira del cuerpo hacia arriba y baja lento."),
      mkEj("Biceps con mancuernas","Codos pegados al cuerpo, subi y baja controlado."),
      mkEj("Biceps con barra","Codos fijos, sin balancear el cuerpo."),
      mkEj("Farmer walk","Camina erguido con peso en las dos manos."),
    ]},
    {dia:"Dia 3",subtitulo:"Pierna (LEGS) + Cadera",ejercicios:[
      mkEj("Zancadas","Paso largo, rodilla hacia afuera, baja controlado."),
      mkEj("Peso muerto con barra","Lleva la cadera atras, baja la barra y volve a subir."),
      mkEj("Sentadilla con barra","Con la barra en la espalda, baja y subi empujando el piso."),
      mkEj("Hip thrust con barra","Con la espalda apoyada, levanta la cadera y apreta gluteos."),
      mkEj("Core (crunch)","Acostado, subi el torso despacio sin tirar del cuello."),
    ]},
  ]
};

const EJ_HIPERTROFIA=()=>[
  mkEj("Press de hombros sentado con mancuernas","Sentado, empuja las mancuernas hacia arriba con control."),
  mkEj("Sentadilla con barra","Con la barra en la espalda, baja y subi empujando el piso."),
  mkEj("Press de pecho con barra en banco plano","Baja la barra al pecho y empuja hacia arriba."),
  mkEj("Peso muerto con barra","Lleva la cadera atras, baja la barra y volve a subir."),
  mkEj("Dominadas","Colgado de la barra, tira del cuerpo hacia arriba y baja lento."),
  mkEj("Hip thrust con barra o mancuerna","Con la espalda apoyada, levanta la cadera y apreta gluteos."),
];

export const PLAN_HIPERTROFIA_PRINCIPIANTE={
  periodizacion:per([[2,8,"70%"],[3,8,"80%"],[2,10,"70%"],[3,10,"80%"],[2,12,"70%"],[3,12,"80%"],[2,12,"+"],[3,12,"+"]]),
  movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Hipertrofia — Principiante",ejercicios:EJ_HIPERTROFIA()}]
};

export const PLAN_HIPERTROFIA_AVANZADO={
  periodizacion:per([[3,8,"65%"],[2,10,"70%"],[3,10,"70%"],[3,10,"75%"],[2,12,"75%"],[3,12,"80%"],[3,12,"+"],[3,12,"+"]]),
  movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Hipertrofia — Avanzado",ejercicios:EJ_HIPERTROFIA()}]
};

export const PLAN_FUERZA_PRINCIPIANTE={
  periodizacion:per([[3,8,"70%"],[2,8,"72,5%"],[3,6,"75%"],[2,6,"77,5%"],[3,4,"80%"],[2,4,"82,5%"],[3,4,"85%"],[2,2,"85%"]]),
  movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Fuerza — Principiante",ejercicios:[
    mkEj("Press de hombros sentado con mancuernas","Sentado, empuja las mancuernas hacia arriba con control."),
    mkEj("Levantada del cajon con peso","Sentate y parate del cajon con el peso al pecho."),
    mkEj("Press de pecho con barra en banco plano","Baja la barra al pecho y empuja hacia arriba."),
    mkEj("Peso muerto con kettlebell","Con el peso al frente, lleva la cadera atras y despues adelante."),
    mkEj("Remo en TRX inclinado","Con el cuerpo inclinado, tira del TRX hacia el pecho."),
    mkEj("Puente de gluteos con peso","Acostado, apoya el peso en la cadera y levanta la cadera."),
  ]}]
};

export const PLAN_FUERZA_AVANZADO={
  periodizacion:per([[5,5,"75%"],[5,5,"77,5%"],[5,4,"80%"],[5,4,"82,5%"],[5,3,"85%"],[5,3,"87,5%"],[5,2,"90%"],[5,1,"92,5%"]]),
  movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Fuerza — Avanzado",ejercicios:[
    mkEj("Sentadilla con barra","Con la barra en la espalda, baja y subi empujando el piso."),
    mkEj("Press de pecho con barra en banco plano","Baja la barra al pecho y empuja hacia arriba."),
    mkEj("Peso muerto con barra","Lleva la cadera atras, baja la barra y volve a subir."),
    mkEj("Dominadas lastradas","Dominadas con peso extra, control total en la bajada."),
    mkEj("Hip thrust con barra","Con la espalda apoyada, levanta la cadera y apreta gluteos."),
    mkEj("Press de hombros sentado con mancuernas","Sentado, empuja las mancuernas hacia arriba con control."),
  ]}]
};

// ── PLANTILLAS (lo que ve el admin al asignar un plan) ─────────────────

export const PLANTILLAS=[
  { id:"bilateral",    nombre:"Bilateral",    descripcion:"Fuerza clasica con barra, dominadas e hip thrust.",      plan:PLAN_BILATERAL },
  { id:"unilateral",   nombre:"Unilateral",   descripcion:"Fuerza a un brazo / una pierna, foco en equilibrio.",    plan:PLAN_UNILATERAL },
  { id:"basico",       nombre:"Basico",       descripcion:"Sesion de entrada: cajon, KB, TRX y banda.",             plan:PLAN_BASICO },
  { id:"acond-principiante", nombre:"Acondicionamiento Principiante", descripcion:"Base general: 2x6 a 3x10, 60-75%.",            plan:PLAN_ACOND_PRINCIPIANTE },
  { id:"acond-avanzado",     nombre:"Acondicionamiento Avanzado",     descripcion:"General con barra y dominadas, 65-82,5%.",     plan:PLAN_ACOND_AVANZADO },
  { id:"pf-principiante",    nombre:"Prep. Fisica Principiante",      descripcion:"Fuerza base con KB y TRX, 65-80%.",            plan:PLAN_PF_PRINCIPIANTE },
  { id:"pf-avanzado",        nombre:"Prep. Fisica Avanzado",          descripcion:"Barra completa, 70-87,5%.",                    plan:PLAN_PF_AVANZADO },
  { id:"ppl",                nombre:"PPL Split 3 dias",               descripcion:"Push / Pull / Legs con core y farmer walk.",   plan:PLAN_PPL },
  { id:"hipertrofia-principiante", nombre:"Hipertrofia Principiante", descripcion:"Volumen progresivo 8-12 reps, 70/80%.",        plan:PLAN_HIPERTROFIA_PRINCIPIANTE },
  { id:"hipertrofia-avanzado",     nombre:"Hipertrofia Avanzado",     descripcion:"Volumen alto 8-12 reps, 65-80% y ciclos +.",   plan:PLAN_HIPERTROFIA_AVANZADO },
  { id:"fuerza-principiante",      nombre:"Fuerza Principiante",      descripcion:"3x8 a 2x2, 70-85%, variantes seguras.",        plan:PLAN_FUERZA_PRINCIPIANTE },
  { id:"fuerza-avanzado",          nombre:"Fuerza Avanzado",          descripcion:"5x5 a 5x1, 75-92,5%, los grandes con barra.",  plan:PLAN_FUERZA_AVANZADO },
];

// ── CÓDIGOS DE EJERCICIO (ronda 11, 2026-07-21) ─────────────────────────
// Cada ejercicio de la biblioteca/templates tiene un código ESTABLE,
// prefijado por categoría y numerado creciente por dificultad/orden de
// aparición: M=Movilidad, E=Act. Elástico, C=Entrada en calor/activación
// con peso, P=Principales. Se asignan UNA sola vez acá (fuente de verdad),
// por nombre EXACTO — si el mismo nombre aparece de nuevo (ej. Movilidad
// Corta reusa nombres de la Completa) reutiliza el mismo código en vez de
// generar uno nuevo. Es la base para el backfill de biblioteca_ejercicios
// (migración 011) y para "Guardar para todos" (match por código).
const _codCounters = { M: 0, E: 0, C: 0, P: 0 };
const _codMap = {};
function _codigo(cat, nombre) {
  const key = cat + "|" + nombre;
  if (_codMap[key]) return _codMap[key];
  _codCounters[cat]++;
  const c = cat + String(_codCounters[cat]).padStart(2, "0");
  _codMap[key] = c;
  return c;
}
function _asignar(cat, arr) {
  (arr || []).forEach((e) => {
    if (e && e.nombre) e.codigo = _codigo(cat, e.nombre);
  });
  return arr;
}

// M — Movilidad: orden = versión Completa (piso/sentado → cuadrupedia →
// dinámica, la progresión que ya tenía el archivo), después el set aparte
// de Articulaciones (usado como "Entrada en calor superrápida").
_asignar("M", MOVILIDAD_COMPLETA);
_asignar("M", MOVILIDAD_CORTA); // mismos nombres que Completa → reusa códigos
_asignar("M", MOVILIDAD_ARTICULACIONES);

// E — Act. Elástico
_asignar("E", CALOR_BANDA);

// C — Entrada en calor / activación con peso (disco/mancuerna/katana)
_asignar("C", ACTIVACION_BASE);
_asignar("C", CALOR_PESO);
_asignar("C", CALOR_MANCUERNA);

// P — Principales: primero el plan Básico, después lo que se agrega en el
// plan Complejo (Bilateral) que no estaba en Básico, sin reiniciar la
// numeración; después el resto de planes de compatibilidad, en el orden
// en que aparecen en el archivo (mismo criterio: nombre exacto = mismo código).
_asignar("P", PLAN_BASICO.dias[0].ejercicios);
_asignar("P", PLAN_BILATERAL.dias[0].ejercicios);
_asignar("P", PLAN_UNILATERAL.dias[0].ejercicios);
_asignar("P", PLAN_ACOND_PRINCIPIANTE.dias[0].ejercicios);
_asignar("P", PLAN_ACOND_AVANZADO.dias[0].ejercicios);
_asignar("P", PLAN_PF_PRINCIPIANTE.dias[0].ejercicios);
_asignar("P", PLAN_PF_AVANZADO.dias[0].ejercicios);
PLAN_PPL.dias.forEach((d) => _asignar("P", d.ejercicios));
_asignar("P", PLAN_HIPERTROFIA_PRINCIPIANTE.dias[0].ejercicios);
_asignar("P", PLAN_HIPERTROFIA_AVANZADO.dias[0].ejercicios);
_asignar("P", PLAN_FUERZA_PRINCIPIANTE.dias[0].ejercicios);
_asignar("P", PLAN_FUERZA_AVANZADO.dias[0].ejercicios);

// Mapa nombre→código completo, para backfill/depuración.
export const CODIGOS_EJERCICIO = _codMap;

export const getPlantilla=(id)=>PLANTILLAS.find(p=>p.id===id)||PLANTILLAS[0];

// Bloques sueltos para armar planes a medida desde el admin
export const RUTINAS_MOVILIDAD=[
  { id:"base",          nombre:"Movilidad completa (oficial)", items:MOVILIDAD_COMPLETA },
  { id:"piso-sentado",  nombre:"Movilidad piso y sentado",   items:MOVILIDAD_PISO_SENTADO },
  { id:"cuadrupedia",   nombre:"Movilidad cuadrupedia",      items:MOVILIDAD_CUADRUPEDIA },
  { id:"dinamica",      nombre:"Movilidad dinamica",         items:MOVILIDAD_DINAMICA },
];

export const RUTINAS_CALOR=[
  { id:"banda-full",  nombre:"Entrada en calor con elastico (oficial)", items:CALOR_BANDA },
  // Ex "movilidad de articulaciones" — es un bloque aparte de la movilidad (CEREBRO-ENTRENAMIENTO 3.5)
  { id:"superrapida", nombre:"Entrada en calor superrapida", items:MOVILIDAD_ARTICULACIONES },
];

export const RUTINAS_ACTIVACION=[
  { id:"disco-base",  nombre:"Disco/mancuerna (base)", items:ACTIVACION_BASE },
  { id:"disco-katana",nombre:"Disco y katana",         items:CALOR_PESO },
  { id:"mancuerna",   nombre:"Mancuerna",              items:CALOR_MANCUERNA },
];

// Los templates son objetos compartidos con ids generados UNA vez al cargar el módulo.
// Asignarlos directo a más de un alumno duplica las claves primarias en plan_ejercicios.
// Siempre asignar una copia fresca con ids nuevos:
export const clonarPlan = (plan) => ({
  ...plan,
  periodizacion: (plan.periodizacion || []).map(p => ({ ...p })),
  movilidad:     (plan.movilidad     || []).map(e => ({ ...e })),
  calor:         (plan.calor         || []).map(e => ({ ...e })),
  activacion:    (plan.activacion    || []).map(e => ({ ...e })),
  dias: (plan.dias || []).map(d => ({
    ...d,
    ejercicios: (d.ejercicios || []).map(e => ({ ...e, id: uid() })),
  })),
});
