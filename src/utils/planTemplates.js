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

export const PRINCIPALES_COMPLEJO=()=>[
  mkEj("Press de hombros sentado con mancuernas","Sentado, empuja las mancuernas hacia arriba con control."),
  mkEj("Sentadilla con barra","Con la barra en la espalda, baja y subi empujando el piso."),
  mkEj("Press de pecho con barra en banco plano","Baja la barra al pecho y empuja hacia arriba."),
  mkEj("Peso muerto con barra","Lleva la cadera atras, baja la barra y volve a subir."),
  mkEj("Dominadas","Colgado de la barra, tira del cuerpo hacia arriba y baja lento."),
  mkEj("Hip thrust con barra o mancuerna","Con la espalda apoyada, levanta la cadera y apreta gluteos."),
];

export const REHAB_HOMBRO=()=>[
  mkEj("Pendulares de hombro (Codman)","Inclinate hacia adelante, deja el brazo colgando y hace movimientos suaves en circulos o vaiven."),
  mkEj("Elevaciones frontales con baston","Sostene un palo con ambas manos y subi el brazo afectado ayudandote con el otro, sin pasar los 90 grados."),
  mkEj("Rotaciones externas con baston","Con codos pegados al cuerpo, usa el baston para empujar suavemente el antebrazo hacia afuera."),
  mkEj("Isometrico deltoides contra pared","Apoya la mano en la pared y empuja suavemente (frente, costado y atras) sin mover el brazo."),
  mkEj("Isometrico trapecio y romboides","Junta los omoplatos hacia atras y mantene 5 a 10 segundos."),
  mkEj("Elevaciones frontales con banda","Pisa la banda con el pie y eleva el brazo al frente, hasta el nivel del hombro."),
  mkEj("Remo con banda o polea baja","De pie, con los codos pegados al cuerpo, tira de la banda hacia tu abdomen."),
  mkEj("Rotaciones externas con banda","Codo pegado al cuerpo, gira el antebrazo hacia afuera contra la resistencia de la banda."),
  mkEj("Push-ups contra la pared","Apoya las manos en la pared y hace flexiones suaves, manteniendo el cuerpo recto."),
  mkEj("Agarro la pelota","Presiona con la mano una pelota de goma blanda contra una pared o mesa durante 5 a 10 segundos."),
];

// ── PLANES CLÁSICOS (compatibilidad) ───────────────────────────────────

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

// ── PLANES NUEVOS ──────────────────────────────────────────────────────

export const PLAN_BASICO={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Ejercicios principales — Basico",ejercicios:PRINCIPALES_BASICO()}]
};

export const PLAN_COMPLEJO={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Ejercicios principales — Complejo",ejercicios:PRINCIPALES_COMPLEJO()}]
};

export const PLAN_REHAB_HOMBRO={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_ARTICULACIONES,calor:[
    mk("Elevaciones con banda elastica","Pisa la banda con el pie y eleva el brazo al frente, hasta el nivel del hombro."),
  ],activacion:[],
  dias:[{dia:"Sesion",subtitulo:"Rehabilitacion de hombro",ejercicios:REHAB_HOMBRO()}]
};

// ── PLANTILLAS (lo que ve el admin al asignar un plan) ─────────────────

export const PLANTILLAS=[
  { id:"bilateral",    nombre:"Bilateral",    descripcion:"Fuerza clasica con barra, ambos lados a la vez.",        plan:PLAN_BILATERAL },
  { id:"unilateral",   nombre:"Unilateral",   descripcion:"Fuerza a un brazo / una pierna, foco en equilibrio.",    plan:PLAN_UNILATERAL },
  { id:"basico",       nombre:"Basico",       descripcion:"Sesion de entrada: cajon, KB, TRX y banda.",             plan:PLAN_BASICO },
  { id:"complejo",     nombre:"Complejo",     descripcion:"Sesion avanzada: barra, dominadas e hip thrust.",        plan:PLAN_COMPLEJO },
  { id:"rehab-hombro", nombre:"Rehab Hombro", descripcion:"Recuperacion de hombro: isometricos, banda y baston.",   plan:PLAN_REHAB_HOMBRO },
];

export const getPlantilla=(id)=>PLANTILLAS.find(p=>p.id===id)||PLANTILLAS[0];

// Bloques sueltos para armar planes a medida desde el admin
export const RUTINAS_MOVILIDAD=[
  { id:"base",          nombre:"Movilidad base",             items:MOVILIDAD_BASE },
  { id:"piso-sentado",  nombre:"Movilidad piso y sentado",   items:MOVILIDAD_PISO_SENTADO },
  { id:"cuadrupedia",   nombre:"Movilidad cuadrupedia",      items:MOVILIDAD_CUADRUPEDIA },
  { id:"dinamica",      nombre:"Movilidad dinamica",         items:MOVILIDAD_DINAMICA },
  { id:"articulaciones",nombre:"Movilidad articulaciones",   items:MOVILIDAD_ARTICULACIONES },
];

export const RUTINAS_CALOR=[
  { id:"banda-base",  nombre:"Banda (base)",     items:CALOR_BASE },
  { id:"banda-full",  nombre:"Banda completa",   items:CALOR_BANDA },
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
