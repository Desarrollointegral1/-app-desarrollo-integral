// Autogenerado desde exercises-dataset (C:\Users\lucas\Cerebro-Media\exercises-dataset)
// Media © Gym visual — https://gymvisual.com/ (redistribuida con permiso, 180x180, atribución obligatoria)
// Regenerar con: scratchpad build_media.py · Mapa maestro: Cerebro/desarrollo-integral/rutinas/ejercicios-media-map.json
export const MEDIA_CREDITO = "© Gym visual — gymvisual.com";
const M = {
  "biceps con barra": "/ejercicios/biceps-barra.gif",
  "biceps con mancuernas": "/ejercicios/biceps-mancuernas.gif",
  // 2026-08-09 — Auditoría visual (GIFs mirados frame por frame). "buenos dias
  // con disco" mostraba buenos-dias.gif, que es un good morning con BARRA
  // sobre la espalda: implemento distinto. En el catálogo no hay good morning
  // con disco (lo más cercano, 0044, es la misma versión con barra), así que
  // el nombre salió del mapa. 2026-08-09 (tarde): ya tiene ilustración propia
  // generada con IA — disco redondo contra el pecho, bisagra de cadera,
  // isquiotibiales marcados en rojo.
  // 2026-08-09 (noche): las dos ilustraciones se regeneraron porque quedaban
  // casi idénticas entre sí y no se distinguía el implemento. Ahora cada una
  // muestra DOS figuras — comienzo y medio del movimiento, como el push press —
  // y el implemento se lee sin dudas: disco redondo de canto contra el pecho
  // en una, mancuerna de perfil con sus dos cabezas en la otra.
  "buenos dias con disco":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/buenos-dias-disco.webp",
  "buenos dias con mancuerna":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/buenos-dias-mancuerna.webp",
  // 2026-08-09 — Auditoría visual: los 5 nombres del cajón ("cajon con peso",
  // "levantada del cajon", "levantada del cajon con peso", "levantada de
  // cajon", "sentarse y pararse del cajon con peso al pecho") apuntaban a
  // sentarse-pararse-cajon.gif, donde NO se ve ningún cajón: es una sentadilla
  // goblet libre, prácticamente igual a goblet-squat.gif. En el catálogo no
  // hay box squat ni sit-to-stand (0750 es en máquina Smith). Salieron del
  // mapa. 2026-08-09 (tarde): ya tienen ilustración propia generada con IA,
  // con el cajón bien visible detrás — una versión con kettlebell al pecho
  // para los nombres "con peso" y una a peso corporal para los otros dos.
  "cajon con peso":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/cajon-con-peso.webp",
  "levantada del cajon con peso":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/cajon-con-peso.webp",
  "sentarse y pararse del cajon con peso al pecho":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/cajon-con-peso.webp",
  "levantada de cajon":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/levantada-cajon-sin-peso.webp",
  "levantada del cajon":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/levantada-cajon-sin-peso.webp",
  "core": "/ejercicios/core-crunch.gif",
  "core (crunch)": "/ejercicios/core-crunch.gif",
  "crunch": "/ejercicios/core-crunch.gif",
  "dominadas": "/ejercicios/dominadas.gif",
  "dominadas lastradas": "/ejercicios/dominadas.gif",
  "farmer walk": "/ejercicios/farmer-walk.gif",
  "fondos": "/ejercicios/fondos.gif",
  "fuerza con impulso a un brazo": "/ejercicios/fuerza-impulso-un-brazo.gif",
  // 2026-08-09 — Auditoría visual: "fuerza con impulso con barra" mostraba
  // fuerza-impulso-barra.gif, que en realidad es un push press con DOS
  // MANCUERNAS (idéntico al 1700 del catálogo). En el catálogo no existe el
  // push press con barra; lo único con barra es 3305, que es un thruster
  // (sentadilla + press) — otro movimiento, así que no se usa. 2026-08-09
  // (tarde): ya tiene ilustración propia generada con IA — barra en rack
  // frontal, el dip y el envión sobre la cabeza, deltoides en rojo.
  "fuerza con impulso con barra":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/push-press-barra.webp",
  "push press con barra":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/push-press-barra.webp",
  "goblet squat": "/ejercicios/goblet-squat.gif",
  "hip thrust": "/ejercicios/hip-thrust.gif",
  "hip thrust bilateral": "/ejercicios/hip-thrust.gif",
  "hip thrust con barra": "/ejercicios/hip-thrust.gif",
  "hip thrust con barra o mancuerna": "/ejercicios/hip-thrust.gif",
  "hip thrust pesado": "/ejercicios/hip-thrust.gif",
  "hip trust": "/ejercicios/hip-thrust.gif",
  "jalon al pecho / maquina dorsales": "/ejercicios/jalon-al-pecho.gif",
  "jalon brazos estirados (banda)": "/ejercicios/jalon-brazos-estirados.gif",
  "jalon con banda desde arriba": "/ejercicios/jalon-banda-arriba.gif",
  // 2026-07-31 — Lucas: "jalón con mancuerna está haciendo pullover" — el
  // dataset original lo mapeó a "dumbbell pullover" (empuje de pecho/espalda
  // acostado), no una tracción/jalón real. Reemplazado por un jalón de
  // verdad: remo con mancuernas inclinado ("dumbbell bent over row").
  "jalon con mancuerna": "/ejercicios/jalon-mancuerna-fix.gif",
  "levantada de cadera a una pierna": "/ejercicios/levantada-cadera-una-pierna.gif",
  "pecho inclinado con mancuerna": "/ejercicios/pecho-inclinado-mancuerna.gif",
  "pecho plano con barra": "/ejercicios/press-pecho-barra.gif",
  "peso muerto": "/ejercicios/peso-muerto-barra.gif",
  "peso muerto 1 pierna": "/ejercicios/peso-muerto-una-pierna.gif",
  "peso muerto a 1 pierna": "/ejercicios/peso-muerto-una-pierna.gif",
  "peso muerto a una pierna": "/ejercicios/peso-muerto-una-pierna.gif",
  // 2026-08-09 — Auditoría visual: "peso muerto a una pierna sin peso" seguía
  // mostrando el GIF de la variante CON mancuerna (ya reportado el 2026-07-31
  // y nunca resuelto). El catálogo tampoco tiene la versión sin carga (1757,
  // 1756 y 2805 son todas con peso). Salió del mapa. 2026-08-09 (tarde): ya
  // tiene ilustración propia generada con IA — cuerpo en T, manos libres sin
  // ningún implemento, isquiotibiales de la pierna de apoyo en rojo.
  "peso muerto a una pierna sin peso":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/peso-muerto-una-pierna-sin-peso.webp",
  "peso muerto barra": "/ejercicios/peso-muerto-barra.gif",
  "peso muerto con barra": "/ejercicios/peso-muerto-barra.gif",
  // 2026-08-09 — Auditoría visual: los 4 nombres con kettlebell ("peso muerto
  // con kettlebell", "peso muerto kb", "peso muerto con kb", "peso muerto sumo
  // con kb") mostraban peso-muerto-kettlebell.gif, que es un peso muerto con
  // DOS MANCUERNAS y stance convencional — ni kettlebell ni sumo. En el
  // catálogo no hay ningún deadlift con kettlebell (se revisó toda la familia)
  // y 0117 sumo es con barra. Los cuatro salieron del mapa. 2026-08-09
  // (tarde): ya tienen ilustración propia generada con IA — kettlebell de
  // verdad entre los pies, una convencional (isquiotibiales en rojo) y una
  // sumo con los pies bien abiertos (glúteo mayor en rojo).
  "peso muerto con kettlebell":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/peso-muerto-kettlebell.webp",
  "peso muerto kb":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/peso-muerto-kettlebell.webp",
  "peso muerto con kb":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/peso-muerto-kettlebell.webp",
  "peso muerto sumo con kb":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/peso-muerto-sumo-kettlebell.webp",
  "peso muerto sumo con kettlebell":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/peso-muerto-sumo-kettlebell.webp",
  // 2026-08-09 — Auditoría visual: "press arriba con disco" mostraba
  // press-arriba.gif, que es un press de hombros con DOS MANCUERNAS. El único
  // con disco del catálogo (0834) es una elevación frontal, no un press sobre
  // la cabeza. Salió del mapa. 2026-08-09 (tarde): ya tiene ilustración propia
  // generada con IA — disco tomado con las dos manos por los costados,
  // extendido arriba de la cabeza, deltoides en rojo.
  "press arriba con disco":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/press-arriba-disco.webp",
  "press banca": "/ejercicios/press-pecho-barra.gif",
  "press banca barra": "/ejercicios/press-pecho-barra.gif",
  "press de banca": "/ejercicios/press-pecho-barra.gif",
  "press de hombros": "/ejercicios/press-hombros-sentado.gif",
  "press de hombros con barra": "/ejercicios/press-hombros-barra.gif",
  "press de hombros sentado con mancuernas": "/ejercicios/press-hombros-sentado.gif",
  "press de pecho con barra en banco plano": "/ejercicios/press-pecho-barra.gif",
  "press hombros": "/ejercicios/press-hombros-sentado.gif",
  "press hombros barra": "/ejercicios/press-hombros-barra.gif",
  "press hombros mancuerna": "/ejercicios/press-hombros-sentado.gif",
  "press hombros mancuernas": "/ejercicios/press-hombros-sentado.gif",
  "press hombros sentado": "/ejercicios/press-hombros-sentado.gif",
  // 2026-07-31 — Lucas: "este ejercicio es press militar PARADO y el gif
  // está sentado en un banco, ¿cómo puede ser?". El gif viejo (press-hombros-
  // barra.gif) viene del dataset original mapeado a "barbell seated overhead
  // press" — sentado de verdad, mal asignado a este nombre. Gif nuevo:
  // "barbell standing close grip military press" del mismo dataset (id 1456).
  "press militar": "/ejercicios/press-militar-parado-barra.gif",
  "press paloff (banda)": "/ejercicios/press-pallof.gif",
  "press pecho": "/ejercicios/press-pecho-barra.gif",
  "press pecho barra": "/ejercicios/press-pecho-barra.gif",
  "puente con peso": "/ejercicios/puente-gluteos-peso.gif",
  "puente de gluteos": "/ejercicios/puente-gluteos-peso.gif",
  "puente de gluteos con peso": "/ejercicios/puente-gluteos-peso.gif",
  "push-ups contra la pared": "/ejercicios/push-up-pared.gif",
  "remo a un brazo": "/ejercicios/remo-un-brazo.gif",
  "remo a un brazo (banda)": "/ejercicios/remo-un-brazo-banda.gif",
  "remo con banda": "/ejercicios/remo-banda.gif",
  "remo con banda o polea baja": "/ejercicios/remo-un-brazo-banda.gif",
  // 2026-08-09 — Auditoría visual: "remo con disco" mostraba
  // remo-inclinado-peso.gif, que es un remo inclinado con DOS MANCUERNAS.
  // No hay remo con disco en el catálogo. 2026-08-09 (tarde): ya tiene
  // ilustración propia generada con IA — un solo disco tomado con las dos
  // manos, torso inclinado, dorsal ancho en rojo.
  "remo con disco":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/remo-con-disco.webp",
  "remo con mancuerna": "/ejercicios/remo-inclinado-peso.gif",
  "remo con mancuernas": "/ejercicios/remo-inclinado-peso.gif",
  "remo en trx": "/ejercicios/remo-trx.gif",
  "remo en trx inclinado": "/ejercicios/remo-trx.gif",
  "remo trx": "/ejercicios/remo-trx.gif",
  "remo trx inclinado": "/ejercicios/remo-trx.gif",
  "rotacion externa (banda)": "/ejercicios/rotacion-externa-banda.gif",
  "rotaciones externas con banda": "/ejercicios/rotacion-externa-banda.gif",
  "sentadilla": "/ejercicios/sentadilla-barra.gif",
  // 2026-08-09 — Auditoría visual: "sentadilla bulgara sin peso" mostraba
  // sentadilla-bulgara.gif, que es con DOS MANCUERNAS. El 2368 del catálogo
  // es peso corporal pero con el pie trasero en el piso (split squat), no
  // búlgara. Salió del mapa. 2026-08-09 (tarde): ya tiene ilustración propia
  // generada con IA — empeine de atrás sobre el banco, manos libres sin peso,
  // cuádriceps de la pierna de adelante en rojo.
  "sentadilla bulgara sin peso":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/sentadilla-bulgara-sin-peso.webp",
  "sentadilla con barra": "/ejercicios/sentadilla-barra.gif",
  // 2026-08-09 — Auditoría visual: "vuelta al mundo con disco" mostraba
  // vuelta-al-mundo.gif, que es el círculo sobre la cabeza con DOS
  // MANCUERNAS. Reemplazado por el 0844 del catálogo ("Círculos de brazos con
  // peso extra"): un disco tomado con las dos manos girando alrededor de la
  // cabeza, que es exactamente la vuelta al mundo con disco.
  "vuelta al mundo con disco":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/videos/0844-VLYXo8S.gif",
  "zancada": "/ejercicios/zancada.gif",
  "zancada a una pierna": "/ejercicios/zancada.gif",
  "zancadas": "/ejercicios/zancada.gif",

  // ── Taxonomía por grupo muscular (2026-07-21) ──
  // Nombres canónicos nuevos (PH/RO/PE/CA/JA/GL/CO). Cuando no hay GIF
  // específico de la variante, se usa el del patrón base (mismo movimiento).
  "press militar sentado con mancuernas": "/ejercicios/press-hombros-sentado.gif",
  // 2026-08-09 — Auditoría visual: la variante UNILATERAL mostraba el GIF
  // bilateral (dos mancuernas). Reemplazada por el 0360 del catálogo, que es
  // press de hombros con mancuerna a UN brazo. Ojo: el 0360 es de pie, no
  // sentado — es lo más cercano que hay; si hace falta la versión sentada
  // exacta hay que generarla.
  "press militar sentado con mancuernas unilateral":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/videos/0360-1TkiAFK.gif",
  "press militar parado con mancuernas unilateral": "/ejercicios/fuerza-impulso-un-brazo.gif",
  "press militar parado con barra": "/ejercicios/press-militar-parado-barra.gif",
  "sentadilla con peso adelante": "/ejercicios/goblet-squat.gif",
  "sentadilla bulgara": "/ejercicios/sentadilla-bulgara.gif",
  // 2026-08-09 — Auditoría visual: "flexiones en oblicuo" mostraba
  // push-up-pared.gif (flexión de pie contra la PARED). La flexión en oblicuo
  // es en el piso con las manos elevadas sobre un cajón o banco. Reemplazada
  // por el 3785 del catálogo ("Flexión de brazos en banco inclinado, sobre
  // cajón"), que es exactamente eso.
  "flexiones en oblicuo":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/videos/3785-F7vjXqT.gif",
  "pecho plano": "/ejercicios/press-pecho-barra.gif",
  "peso muerto paloma": "/ejercicios/peso-muerto-una-pierna.gif",
  "jalon con elastico": "/ejercicios/jalon-banda-arriba.gif",
  // 2026-08-09 — Auditoría visual: la variante UNILATERAL mostraba
  // jalon-banda-arriba.gif, que es bilateral (las dos manos en la banda).
  // Reemplazada por el 0983 del catálogo: jalón a un brazo con banda,
  // arrodillado.
  "jalon con elastico unilateral":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/videos/0983-pmnrOp0.gif",
  "jalon con trx parado inclinado": "/ejercicios/remo-trx.gif",
  // 2026-08-09 — Auditoría visual: "jalon con trx vertical" mostraba
  // remo-trx.gif, que es una tracción HORIZONTAL (remo invertido en anillas),
  // otro patrón de movimiento. En la familia suspended del catálogo solo está
  // 0808, que es el mismo remo horizontal. Salió del mapa. 2026-08-09 (tarde):
  // ya tiene ilustración propia generada con IA — arrodillado bajo el anclaje,
  // cintas cayendo de arriba, tracción vertical, dorsal ancho en rojo.
  "jalon con trx vertical":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/jalon-trx-vertical.webp",
  "jalon unilateral con mancuerna": "/ejercicios/remo-un-brazo.gif",
  "levantada de cadera": "/ejercicios/puente-gluteos-peso.gif",
  // 2026-08-09 — Auditoría visual: "levantada de cadera con elastico entre
  // rodillas" mostraba puente-gluteos-peso.gif, que es un puente con BARRA
  // sobre la cadera y sin ninguna banda. El 1408 del catálogo tiene banda,
  // pero también sobre la cadera (carga), no entre las rodillas (abducción):
  // es otro estímulo. Salió del mapa. 2026-08-09 (tarde): ya tiene ilustración
  // propia generada con IA — banda circular por encima de las rodillas, sin
  // ninguna carga sobre la cadera, glúteo mayor en rojo.
  "levantada de cadera con elastico entre rodillas":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/levantada-cadera-elastico-rodillas.webp",
  "levantada de cadera con peso": "/ejercicios/puente-gluteos-peso.gif",
  // 2026-08-09 — Auditoría visual: "levantada de cadera unilateral con peso"
  // mostraba levantada-cadera-una-pierna.gif, que es peso corporal puro, sin
  // ningún implemento. En el catálogo tampoco hay la versión con carga (3645
  // también es sin peso). Salió del mapa. 2026-08-09 (tarde): ya tiene
  // ilustración propia generada con IA — una sola pierna apoyada, la otra
  // extendida en el aire, mancuerna apoyada sobre la cadera, glúteo mayor de
  // la pierna de apoyo en rojo.
  "levantada de cadera unilateral con peso":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/levantada-cadera-unilateral-peso.webp",
  "hip thrust con peso": "/ejercicios/hip-thrust.gif",
  "crunch abdominal": "/ejercicios/core-crunch.gif",

  // ── Entrada en calor (2026-08-09) ──────────────────────────────────────
  // Los 7 ejercicios de alumnos.plan_calor venían sin gif propio (el campo
  // gif es null en los 49 items) y sólo dos se resolvían por nombre: "Jalón
  // con banda (desde arriba)" y "Remo con banda (doble)", los dos con GIF
  // correcto (verificados frame por frame). Para los otros cinco se buscó en
  // catalogo_ejercicios y no hay nada: no existe el knee-to-wall de tobillo,
  // ni las pasadas de hombro con banda, ni ningún ejercicio con palo, y la
  // única rotación interna de hombro (0216) es en POLEA y sentado — otro
  // implemento. Los cinco llevan ilustración propia generada con IA, con las
  // dos figuras (partida y fase media) y el implemento inconfundible: banda
  // elástica de goma que se ve estirada, o palo recto de madera.
  //
  // Las claves van sin el paréntesis a propósito: getEjercicioGif() prueba en
  // tercera pasada el nombre sin la aclaración, así que "Remo con palo (codos
  // atrás)" cae en "remo con palo".
  "movilidad de tobillo":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/movilidad-tobillo-pie-elevado.webp",
  "pasadas con banda":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/pasadas-con-banda-hombros.webp",
  "remo con palo":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/remo-con-palo-codos-atras.webp",
  "retraccion escapular con palo":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/retraccion-escapular-con-palo.webp",
  "rotacion interna con banda":
    "https://tlxkghpytznkxgqslqzj.supabase.co/storage/v1/object/public/catalogo-ejercicios/ia-generadas/rotacion-interna-banda-codo-al-cuerpo.webp",
};

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

// Igual que norm, pero adem\u00e1s saca puntuacion y colapsa espacios. Sirve para
// que "Jalon con banda (desde arriba)" alcance a "jalon con banda desde
// arriba", que es la MISMA entrada escrita sin parentesis.
const normSuave = (s) =>
  norm(s)
    .replace(/[()[\]{}.,;:\u00a1!\u00bf?"'`]/g, " ")
    .replace(/[-\u2013\u2014/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Saca lo que va entre parentesis: "Remo con banda (doble)" -> "remo con
// banda". Los parentesis en estos planes son aclaraciones de ejecucion
// ("codos atras", "una pierna", "plantas juntas"), no ejercicios distintos.
const sinParentesis = (s) =>
  norm(s).replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();

// Indice auxiliar: las mismas claves del mapa, normalizadas en suave, para
// poder comparar sin puntuacion sin tener que duplicar cada entrada a mano.
const M_SUAVE = {};
for (const k of Object.keys(M)) {
  const ks = normSuave(k);
  if (ks && !(ks in M_SUAVE)) M_SUAVE[ks] = M[k];
}

// Devuelve la ruta del GIF del ejercicio (o "" si no hay match).
//
// Auditoria 2026-07-30: antes era UNICAMENTE coincidencia exacta contra M, y
// por eso 5 de los 7 ejercicios de "Entrada en calor" que tienen los alumnos
// no mostraban nada: el plan dice "Jalon con banda (desde arriba)" y el mapa
// "jalon con banda desde arriba" \u2014 mismo ejercicio, distinta puntuacion.
// Ahora se prueba en tres pasadas, de la mas estricta a la mas tolerante.
// Ninguna adivina: las tres tienen que caer en una clave real del mapa.
export const getEjercicioGif = (nombre) => {
  if (!nombre) return "";
  // 1) exacta, como siempre
  const exacta = M[norm(nombre)];
  if (exacta) return exacta;
  // 2) sin puntuacion ni guiones
  const suave = M_SUAVE[normSuave(nombre)];
  if (suave) return suave;
  // 3) sin la aclaracion entre parentesis
  const base = sinParentesis(nombre);
  return M[base] || M_SUAVE[normSuave(base)] || "";
};

// ── "Este ejercicio va SIN GIF" (pedido de Lucas, 2026-08-09) ───────────
// Poner gif:"" NO deja al ejercicio sin GIF: devuelve el control al lookup
// automático por nombre de getEjercicioGif() y vuelve a aparecer el mismo
// que Lucas quería sacar. Hace falta un valor que signifique "ninguno, a
// propósito" y sobreviva al guardado (plan_ejercicios.gif es text).
export const SIN_GIF = "__sin_gif__";

// Resolución única del GIF de un ítem del plan. Todo lo que muestre un GIF
// (vista del alumno, editor, fila, preview) tiene que pasar por acá, si no
// el sentinel se ignora en ese lugar y el GIF "sacado" reaparece.
//   1) sentinel  → sin GIF, a propósito
//   2) gif propio del ítem (manual o heredado del catálogo)
//   3) lookup automático por nombre
export const resolverGif = (gif, nombre) => {
  if (gif === SIN_GIF) return "";
  return gif || getEjercicioGif(nombre);
};

// Qué GIF hay que FIJARLE a un ejercicio que se está renombrando (2026-08-12).
//
// El mapa M de arriba resuelve la ilustración POR NOMBRE, y es un archivo del
// código: si Lucas renombra un ejercicio desde la Biblioteca a algo que M no
// conoce, el ejercicio se queda mudo sin que nadie se entere. La imagen es del
// ejercicio, no de cómo se llamaba — así que antes de soltar el nombre viejo
// se le clava la ruta que ese nombre resolvía y deja de depender del mapa.
//
// Devuelve la ruta a fijar, o "" si no hay que tocar nada (ya tenía GIF
// propio, no cambió el nombre, el nombre nuevo también resuelve, o el viejo
// tampoco resolvía nada).
export const gifAlRenombrar = (gifPropio, nombreViejo, nombreNuevo) => {
  if (gifPropio) return "";
  if (!nombreViejo || nombreViejo === nombreNuevo) return "";
  if (getEjercicioGif(nombreNuevo)) return "";
  return getEjercicioGif(nombreViejo) || "";
};

// Inverso: nombres de ejercicio que resuelven (por lookup automático) a un
// GIF dado. Se usa en la pestaña GIFs de la Biblioteca para mostrar a qué
// ejercicios está asociado cada archivo.
export const getNombresPorGif = (path) =>
  Object.keys(M).filter((k) => M[k] === path);

// ── Catálogo de GIFs disponibles (ronda 12) ─────────────────────────────
// Para la asociación MANUAL de un GIF a un ejercicio puntual (Admin →
// Biblioteca / Principales) cuando el lookup automático por nombre de
// arriba no lo encuentra. Lista fija de los 41 archivos que hay hoy en
// public/ejercicios/ — si se agregan GIFs nuevos a esa carpeta, sumarlos acá
// también (no hay endpoint para listar el filesystem en runtime).
//
// 2026-08-09 — Auditoría visual: la lista tenía 38 slugs contra 41 archivos
// reales (faltaban buenos-dias-mancuerna, jalon-mancuerna-fix y
// press-militar-parado-barra, invisibles para la asociación manual). Además
// "jalon-mancuerna" se ofrecía con la etiqueta "Jalon Mancuerna" cuando el
// GIF es un PULLOVER acostado, no una tracción: quien lo elegía por el nombre
// ponía el ejercicio equivocado. Se etiqueta por lo que muestra de verdad.
const _slugALabel = (slug) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const _ETIQUETAS = {
  "jalon-mancuerna": "Pullover con mancuerna",
  "jalon-mancuerna-fix": "Remo inclinado con mancuernas",
  "fuerza-impulso-barra": "Push press con mancuernas",
  "peso-muerto-kettlebell": "Peso muerto con mancuernas",
  "press-arriba": "Press de hombros con mancuernas",
  "sentarse-pararse-cajon": "Sentadilla goblet (sin cajón)",
  "push-up-pared": "Flexiones contra la pared",
};
export const GIFS_DISPONIBLES = [
  "biceps-barra","biceps-mancuernas","buenos-dias","buenos-dias-mancuerna",
  "core-crunch","dominadas","farmer-walk","fondos","fuerza-impulso-barra",
  "fuerza-impulso-un-brazo","goblet-squat","hip-thrust","jalon-al-pecho",
  "jalon-banda-arriba","jalon-brazos-estirados","jalon-mancuerna",
  "jalon-mancuerna-fix","levantada-cadera-una-pierna",
  "pecho-inclinado-mancuerna","peso-muerto-barra","peso-muerto-kettlebell",
  "peso-muerto-una-pierna","press-arriba","press-hombros-barra",
  "press-hombros-sentado","press-militar-parado-barra","press-pallof",
  "press-pecho-barra","puente-gluteos-peso","push-up-pared","remo-banda",
  "remo-inclinado-peso","remo-trx","remo-un-brazo-banda","remo-un-brazo",
  "rotacion-externa-banda","sentadilla-barra","sentadilla-bulgara",
  "sentarse-pararse-cajon","vuelta-al-mundo","zancada",
].map((slug) => ({
  slug,
  path: `/ejercicios/${slug}.gif`,
  label: _ETIQUETAS[slug] || _slugALabel(slug),
}));
