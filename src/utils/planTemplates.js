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

// Versión CORTA de la movilidad (~7-8 min): subconjunto de la base.
// Ajustable por Lucas/Ari — es la que acompaña al video "Corta".
export const MOVILIDAD_CORTA=[
  mk("Obelisco","Rotacion de columna toracica de pie."),
  mk("Sentadilla de Activacion de Peso","Sentadilla lenta activando gluteos y core."),
  mk("Movilidad de cadera","Tronco con flexion de cadera, circulos amplios."),
  mk("Dorsiflexion del tobillo","Rodilla adelante, talon apoyado, flexion tobillo."),
  mk("Estiramiento del gato","Flexion y extension de columna en cuadrupedia."),
  mk("Superman en cuadrupedia","Brazo y pierna opuestos, cadera estable."),
  mk("Rotaciones toracicas","De costado, rodillas dobladas, rota el torso."),
  mk("Plancha isometrica 15s","Core activo, cuerpo recto, 15 segundos."),
];

// Rutina 1 — piso y sentado
export const MOVILIDAD_PISO_SENTADO=[
  mk("Elevacion de pierna acostado","Boca arriba, agarra detras de la rodilla, estira la pierna hacia arriba y baja controlado."),
  mk("Estiramiento de gluteo cruzado","Acostado, cruza un pie sobre la otra pierna y tira de la pierna hacia vos."),
  mk("Puente de gluteos","Acostado con los pies apoyados, leventa la cadera y baja lento."),
  mk("Figura 4 acostado","Cruza un tobillo sobre la otra rodilla y trae la pierna hacia el pecho."),
  mk("Flexion adelante sentado a una pierna","Una pierna estirada y la otra flexionada. Inclinate hacia el pie de la pierna estirada."),
  mk("Mariposa","Sentado, junta las plantas de los pies y mantene la espalda recta."),
  mk("Mariposa con inclinacion","Desde mariposa, inclinate suavemente hacia adelante."),
  mk("Apertura de piernas sentado","Sentado con las piernas abiertas, inclina el torso levemente hacia adelante."),
  mk("90/90 de cadera","Sentado en posicion 90/90, lleva el torso hacia el pie de adelante y luego hacia atras."),
  mk("Apoyo atras y apertura de pecho","Sentado con las manos atras, abri el pecho y mira hacia arriba."),
  mk("Rotacion de cadera sentado","Sentado con las manos atras, lleva una rodilla hacia el lado contrario sin mover el torso."),
  mk("Elevacion de piernas sentado","Sentado erguido, levanta una pierna y despues la otra."),
  mk("Elevacion asistida de piernas sentado","Sentado, toma detras de las rodillas y eleva una pierna, despues la otra."),
];

// Rutina 2 — cuadrupedia y boca abajo
export const MOVILIDAD_CUADRUPEDIA=[
  mk("Gato-vaca","En cuadrupedia, redondea la espalda y despues abrila."),
  mk("Superman en cuadrupedia","Estira un brazo y la pierna contraria. Volve y cambia de lado (bird dog)."),
  mk("Rotacion toracica con pierna extendida","En cuadrupedia, estira una pierna al costado, pasa un brazo por abajo y abri hacia arriba."),
  mk("Postura del nino","Lleva la cadera hacia los talones y estira los brazos al frente."),
  mk("Postura del nino lateral","Desde la postura del nino, camina las manos hacia un lado para estirar el costado."),
];

// Rutina 3 — dinámica en piso
export const MOVILIDAD_DINAMICA=[
  mk("Estocada al frente para cadera","Con un pie adelante, empuja la cadera hacia la rodilla de adelante."),
  mk("Estocada con estiramiento atras","Con el pie adelante y manos al piso, estira la pierna de atras y baja la cadera."),
  mk("Estocada a isquiotibiales","Desde la estocada, lleva la cadera atras y estira la pierna de adelante."),
  mk("Rana","Con las rodillas bien abiertas, lleva la cadera hacia atras."),
  mk("Extension en rana","Desde rana, baja el ombligo y levanta el pecho."),
  mk("Esfinge","Boca abajo, apoyado en los codos, abri el pecho y mira al frente."),
  mk("Cobra","Boca abajo, apoya las manos y empuja el pecho hacia arriba."),
  mk("Nado boca abajo","Boca abajo, move un brazo adelante y el otro atras sin tocar el piso."),
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

// ── 2. ENTRADA EN CALOR CON BANDA ──────────────────────────────────────

export const CALOR_BASE=[
  mk("Remo a un brazo (banda)","Codo hacia atras activando el dorsal."),
  mk("Jalon brazos estirados (banda)","Bajas la banda activando dorsales."),
  mk("Rotacion interna (banda)","Antebrazo hacia adentro."),
  mk("Rotacion externa (banda)","Antebrazo hacia afuera."),
  mk("Aperturas (banda)","Brazos hacia adelante, activa pectoral."),
  mk("Press Paloff (banda)","Resiste la rotacion, core activo."),
];

export const CALOR_BANDA=[
  mk("Pasadas con banda por arriba","Con los brazos estirados, pasa la banda por arriba de la cabeza hacia atras y volve (dislocaciones)."),
  mk("Rotacion interna con banda","Con el codo pegado al cuerpo, lleva la mano hacia el abdomen."),
  mk("Remo con banda","Tira de la banda hacia el torso llevando los codos atras."),
  mk("Remo con palo","Con un palo en las manos, lleva los codos hacia atras."),
  mk("Retraccion escapular con palo","Con el palo cerca de la cintura, lleva los hombros atras y junta las escapulas."),
  mk("Jalon con banda desde arriba","Con la banda anclada arriba, tira hacia abajo con las dos manos."),
  mk("Movilidad de tobillo con pie elevado","Con un pie elevado, lleva el cuerpo hacia adelante sin despegar el talon."),
  mk("Movilidad de tobillo en estocada","Con un pie adelante y el talon elevado, lleva el cuerpo hacia ese pie."),
];

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

export const PRINCIPALES_BASICO=()=>[
  mkEj("Press de hombros sentado con mancuernas","Sentado, empuja las mancuernas hacia arriba con los codos al frente."),
  mkEj("Sentarse y pararse del cajon con peso al pecho","Sentate y parate de un cajon a la altura de la rodilla, sin usar las manos."),
  mkEj("Press de pecho con barra en banco plano","Acostado, baja la barra al pecho y empuja hacia arriba."),
  mkEj("Empuje de cadera con banda","Con la banda en la cadera, empuja la cadera hacia adelante y apreta gluteos (hip thrust con banda)."),
  mkEj("Peso muerto con kettlebell","Con el peso al frente, lleva la cadera atras y despues adelante."),
  mkEj("Remo en TRX inclinado","Con el cuerpo inclinado, tira del TRX hacia el pecho."),
  mkEj("Puente de gluteos con peso","Acostado, apoya el peso en la cadera y levanta la cadera."),
];

// Principales unificados Bilateral (ex-Complejo): barra, dominadas e hip thrust.
export const PRINCIPALES_BILATERAL=()=>[
  mkEj("Press de hombros sentado con mancuernas","Sentado, empuja las mancuernas hacia arriba con control."),
  mkEj("Sentadilla con barra","Con la barra en la espalda, baja y subi empujando el piso."),
  mkEj("Pecho plano con barra","Baja la barra al pecho y empuja hacia arriba."),
  mkEj("Peso muerto con barra","Lleva la cadera atras, baja la barra y volve a subir."),
  mkEj("Dominadas","Colgado de la barra, tira del cuerpo hacia arriba y baja lento."),
  mkEj("Hip thrust con barra o mancuerna","Con la espalda apoyada, levanta la cadera y apreta gluteos."),
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

export const getPlantilla=(id)=>PLANTILLAS.find(p=>p.id===id)||PLANTILLAS[0];

// Bloques sueltos para armar planes a medida desde el admin
export const RUTINAS_MOVILIDAD=[
  { id:"base",          nombre:"Movilidad base",             items:MOVILIDAD_BASE },
  { id:"piso-sentado",  nombre:"Movilidad piso y sentado",   items:MOVILIDAD_PISO_SENTADO },
  { id:"cuadrupedia",   nombre:"Movilidad cuadrupedia",      items:MOVILIDAD_CUADRUPEDIA },
  { id:"dinamica",      nombre:"Movilidad dinamica",         items:MOVILIDAD_DINAMICA },
];

export const RUTINAS_CALOR=[
  { id:"banda-base",  nombre:"Banda (base)",     items:CALOR_BASE },
  { id:"banda-full",  nombre:"Banda completa",   items:CALOR_BANDA },
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
