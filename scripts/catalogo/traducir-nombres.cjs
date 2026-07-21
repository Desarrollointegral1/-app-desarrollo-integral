// ══════════════════════════════════════════════════════════════════════
// Traducción de los 1.324 nombres del dataset ExerciseDB al español
// (gimnasio argentino).
//
// Pipeline por nombre:
//   1. limpiar (grados, "v. 2", paréntesis aparte)
//   2. equipamiento al inicio → sufijo ("con barra", "en polea", ...)
//   3. frases núcleo por longest-match (press de banca, remo, jalón, ...)
//   4. modificadores conocidos → sufijos ordenados (agarre → lateralidad
//      → dirección → posición → asistido), con concordancia de género
//   5. lo que queda en inglés → diccionario palabra a palabra y se marca
//      method:"word" para revisión manual
// Los overrides manuales (data/catalogo-nombres-overrides.json) SIEMPRE
// ganan y quedan method:"override".
//
// Uso:  node scripts/catalogo/traducir-nombres.cjs [ruta-dataset]
// Out:  data/catalogo-nombres-es.json  ({id, en, es, method})
// ══════════════════════════════════════════════════════════════════════
const fs = require("fs");
const path = require("path");

const DATASET = process.argv[2] || "C:/Users/lucas/Downloads/exercises-dataset-main";
const REPO = path.join(__dirname, "..", "..");
const exercises = JSON.parse(fs.readFileSync(path.join(DATASET, "data", "exercises.json"), "utf8"));
const OVERRIDES_PATH = path.join(REPO, "data", "catalogo-nombres-overrides.json");
const overrides = fs.existsSync(OVERRIDES_PATH) ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8")) : {};

// ── Equipamiento al frente del nombre → sufijo en español ─────────────
const EQUIP_PREFIX = [
  ["olympic barbell", "con barra olímpica"],
  ["ez barbell", "con barra Z"],
  ["ez bar", "con barra Z"],
  ["sz bar", "con barra Z"],
  ["trap bar", "con barra hexagonal"],
  ["smith machine", "en máquina Smith"],
  ["smith", "en máquina Smith"],
  ["cable", "en polea"],
  ["pulley", "en polea"],
  ["lever", "en máquina"],
  ["sled", "en prensa"],
  ["medicine ball", "con pelota medicinal"],
  ["stability ball", "con pelota de estabilidad"],
  ["exercise ball", "con pelota de estabilidad"],
  ["swiss ball", "con pelota de estabilidad"],
  ["bosu ball", "en bosu"],
  ["resistance band", "con banda elástica"],
  ["band", "con banda"],
  ["kettlebell", "con kettlebell"],
  ["dumbbells", "con mancuernas"],
  ["dumbbell", "con mancuerna"],
  ["barbell", "con barra"],
  ["weighted", "con peso extra"],
  ["bodyweight", "con peso corporal"],
  ["body weight", "con peso corporal"],
  ["suspended", "en suspensión (TRX)"],
  ["suspension", "en suspensión (TRX)"],
  ["ring", "en anillas"],
  ["rope", "con soga"],
  ["towel", "con toalla"],
  ["wheel", "con rueda abdominal"],
  ["roller", "con rodillo"],
  ["landmine", "con barra landmine"],
  ["machine", "en máquina"],
  ["hammer", "en máquina tipo martillo"],
];

// ── Frases núcleo (longest match, en cualquier posición) ──────────────
const PHRASES = [
  ["bench press", "press de banca"],
  ["chest press", "press de pecho"],
  ["shoulder press", "press de hombros"],
  ["military press", "press militar"],
  ["overhead press", "press sobre la cabeza"],
  ["leg press", "prensa de piernas"],
  ["floor press", "press en el piso"],
  ["pin press", "press desde pines"],
  ["arnold press", "press Arnold"],
  ["cuban press", "press cubano"],
  ["bradford press", "press Bradford"],
  ["svend press", "press Svend"],
  ["tate press", "press Tate"],
  ["pallof press", "press Pallof"],
  ["jm bench press", "press JM"],
  ["french press", "press francés"],
  ["guillotine bench press", "press guillotina"],
  ["jump squat", "sentadilla con salto"],
  ["front chest squat", "sentadilla frontal"],
  ["front squat", "sentadilla frontal"],
  ["full squat", "sentadilla profunda"],
  ["hack squat", "sentadilla hack"],
  ["box squat", "sentadilla al cajón"],
  ["side split squat", "sentadilla split lateral"],
  ["split squat", "sentadilla split"],
  ["zercher squat", "sentadilla Zercher"],
  ["jefferson squat", "sentadilla Jefferson"],
  ["sissy squat", "sentadilla sissy"],
  ["pistol squat", "sentadilla pistol"],
  ["goblet squat", "sentadilla goblet"],
  ["sumo squat", "sentadilla sumo"],
  ["overhead squat", "sentadilla sobre la cabeza"],
  ["cossack squat", "sentadilla cossack"],
  ["curtsey squat", "sentadilla cruzada (curtsey)"],
  ["high bar squat", "sentadilla barra alta"],
  ["low bar squat", "sentadilla barra baja"],
  ["squat", "sentadilla"],
  ["bent over row", "remo inclinado"],
  ["bent-over row", "remo inclinado"],
  ["upright row", "remo al mentón"],
  ["rear delt row", "remo para deltoides posterior"],
  ["t-bar row", "remo en barra T"],
  ["pendlay row", "remo Pendlay"],
  ["renegade row", "remo renegado"],
  ["gironda sternum row", "remo Gironda al esternón"],
  ["row", "remo"],
  ["lat pulldown", "jalón al pecho"],
  ["pulldown", "jalón"],
  ["pull-up", "dominada"],
  ["pull up", "dominada"],
  ["chin-up", "dominada supina"],
  ["chin up", "dominada supina"],
  ["muscle up", "muscle up"],
  ["pullover", "pullover"],
  ["face pull", "face pull (tirón a la cara)"],
  ["pull through", "pull through (tirón entre piernas)"],
  ["shrug", "encogimiento de hombros"],
  ["romanian deadlift", "peso muerto rumano"],
  ["stiff leg deadlift", "peso muerto con piernas rígidas"],
  ["stiff legged deadlift", "peso muerto con piernas rígidas"],
  ["straight leg deadlift", "peso muerto con piernas rectas"],
  ["sumo deadlift", "peso muerto sumo"],
  ["deadlift", "peso muerto"],
  ["good morning", "buenos días (bisagra de cadera)"],
  ["clean and press", "cargada y press"],
  ["clean and jerk", "cargada y envión"],
  ["power clean", "cargada de potencia"],
  ["hang clean", "cargada colgante"],
  ["clean", "cargada"],
  ["snatch", "arranque"],
  ["thruster", "thruster (sentadilla + press)"],
  ["high pull", "tirón alto"],
  ["push-up", "flexión de brazos"],
  ["push up", "flexión de brazos"],
  ["press up", "flexión de brazos"],
  ["triceps pushdown", "extensión de tríceps en polea"],
  ["tricep pushdown", "extensión de tríceps en polea"],
  ["pushdown", "extensión de tríceps en polea"],
  ["push down", "extensión de tríceps en polea"],
  ["hammer preacher curl", "curl martillo en banco Scott"],
  ["hammer press", "press con agarre neutro (martillo)"],
  ["rear delt raise", "elevación posterior de deltoides"],
  ["finger curls", "curl de dedos"],
  ["push press", "push press"],
  ["russian twists", "giros rusos"],
  ["shoulder internal rotation", "rotación interna de hombro"],
  ["shoulder external rotation", "rotación externa de hombro"],
  ["triceps extension", "extensión de tríceps"],
  ["tricep extension", "extensión de tríceps"],
  ["triceps press", "press de tríceps"],
  ["triceps kickback", "patada de tríceps"],
  ["triceps dip", "fondos de tríceps"],
  ["chest dip", "fondos para pecho"],
  ["bench dip", "fondos en banco"],
  ["skull crusher", "extensión rompecráneos de tríceps"],
  ["skullcrusher", "extensión rompecráneos de tríceps"],
  ["kickback", "patada trasera"],
  ["biceps curl", "curl de bíceps"],
  ["bicep curl", "curl de bíceps"],
  ["hammer curl", "curl martillo"],
  ["preacher curl", "curl en banco Scott"],
  ["peacher curl", "curl en banco Scott"],
  ["scott curl", "curl en banco Scott"],
  ["concentration curl", "curl concentrado"],
  ["drag curl", "curl de arrastre"],
  ["zottman curl", "curl Zottman"],
  ["spider curl", "curl araña"],
  ["wrist curl", "curl de muñeca"],
  ["leg curl", "curl femoral"],
  ["curls", "curl"],
  ["curl", "curl"],
  ["dips", "fondos"],
  ["dip", "fondos"],
  ["lateral raise", "elevación lateral"],
  ["front raise", "elevación frontal"],
  ["shoulder raise", "elevación de hombros"],
  ["rear delt fly", "apertura posterior (deltoides)"],
  ["rear fly", "apertura posterior"],
  ["fly", "apertura"],
  ["flyes", "aperturas"],
  ["flies", "aperturas"],
  ["around the world", "vuelta al mundo"],
  ["around world", "vuelta al mundo"],
  ["sit-up", "abdominal completo (sit-up)"],
  ["sit up", "abdominal completo (sit-up)"],
  ["bicycle crunch", "crunch bicicleta"],
  ["crunches", "crunch abdominal"],
  ["crunch", "crunch abdominal"],
  ["russian twist", "giro ruso"],
  ["twists", "giros de torso"],
  ["twist", "giro de torso"],
  ["side plank", "plancha lateral"],
  ["plank", "plancha"],
  ["planche", "planche (calistenia)"],
  ["leg raise", "elevación de piernas"],
  ["knee raise", "elevación de rodillas"],
  ["hip raise", "elevación de cadera"],
  ["hip lift", "elevación de cadera"],
  ["hip extension", "extensión de cadera"],
  ["hip flexion", "flexión de cadera"],
  ["back extension", "extensión lumbar"],
  ["side bend", "flexión lateral de torso"],
  ["side bent", "flexión lateral de torso"],
  ["mountain climber", "escalador (mountain climber)"],
  ["dead bug", "dead bug (bicho muerto)"],
  ["bird dog", "bird dog"],
  ["v-up", "abdominal en V"],
  ["jack knife", "navaja (jackknife)"],
  ["jackknife", "navaja (jackknife)"],
  ["wheel rollerout", "rollout con rueda abdominal"],
  ["wheel rollout", "rollout con rueda abdominal"],
  ["rollerout", "rollout"],
  ["rollout", "rollout"],
  ["windmill", "molino (windmill)"],
  ["wood chopper", "leñador"],
  ["woodchopper", "leñador"],
  ["pelvic tilt", "báscula pélvica"],
  ["flutter kicks", "patada de tijera"],
  ["scissor kicks", "tijeras"],
  ["heel touchers", "toques de talón"],
  ["toe touch", "toque de puntas de pie"],
  ["heel touch", "toque de talones"],
  ["hollow rock", "hollow rock (balanceo hueco)"],
  ["hollow hold", "hollow hold"],
  ["cocoons", "abdominal capullo (cocoon)"],
  ["hip thrust", "hip thrust (empuje de cadera)"],
  ["glute bridge", "puente de glúteos"],
  ["bridge", "puente"],
  ["donkey calf raise", "elevación de talones estilo burro"],
  ["calf raise", "elevación de talones"],
  ["calf press", "empuje de pantorrillas"],
  ["rear lunge", "estocada hacia atrás"],
  ["front lunge", "estocada al frente"],
  ["forward lunge", "estocada al frente"],
  ["walking lunge", "estocada caminando"],
  ["lateral lunge", "estocada lateral"],
  ["side lunge", "estocada lateral"],
  ["curtsey lunge", "estocada cruzada (curtsey)"],
  ["lunge", "estocada"],
  ["step-up", "subida al cajón"],
  ["step up", "subida al cajón"],
  ["leg extension", "extensión de piernas"],
  ["hip abduction", "abducción de cadera"],
  ["hip adduction", "aducción de cadera"],
  ["thigh abduction", "abducción de piernas"],
  ["thigh adduction", "aducción de piernas"],
  ["abduction", "abducción"],
  ["adduction", "aducción"],
  ["hyperextension", "hiperextensión"],
  ["frog pose", "postura de rana"],
  ["fire hydrant", "patada de perrito"],
  ["swing", "swing"],
  ["farmers walk", "caminata del granjero"],
  ["farmer walk", "caminata del granjero"],
  ["farmer's walk", "caminata del granjero"],
  ["waiter carry", "caminata del mozo"],
  ["turkish get up", "levantada turca"],
  ["get up", "levantada"],
  ["burpee", "burpee"],
  ["jumping jack", "salto de tijera (jumping jack)"],
  ["jack jump", "salto de tijera"],
  ["high knees", "rodillas al pecho (skipping)"],
  ["run", "carrera"],
  ["sprint", "sprint"],
  ["jump rope", "salto de soga"],
  ["jumps", "saltos"],
  ["jump", "salto"],
  ["march", "marcha"],
  ["bear crawl", "caminata del oso"],
  ["crab walk", "caminata del cangrejo"],
  ["crawl", "desplazamiento en cuadrupedia"],
  ["walk", "caminata"],
  ["inchworm", "gusano (inchworm)"],
  ["handstand", "parada de manos"],
  ["superman", "superman"],
  ["battling ropes", "sogas de batalla"],
  ["wall slide", "deslizamiento en pared"],
  ["external rotation", "rotación externa"],
  ["internal rotation", "rotación interna"],
  ["rotation", "rotación"],
  ["ankle circles", "círculos de tobillo"],
  ["arm circles", "círculos de brazos"],
  ["shoulder circles", "círculos de hombros"],
  ["hip circles", "círculos de cadera"],
  ["air bike", "bicicleta en el aire"],
  ["neck flexion", "flexión de cuello"],
  ["neck extension", "extensión de cuello"],
  ["neck rotation", "rotación de cuello"],
  ["back lever", "back lever (calistenia)"],
  ["front lever", "front lever (calistenia)"],
  ["human flag", "bandera humana"],
  ["l-sit", "L-sit"],
  ["l sit", "L-sit"],
  ["kipping", "kipping"],
  ["kicks", "patadas"],
  ["kick", "patada"],
  ["rack pull", "rack pull (peso muerto parcial)"],
  ["pull-ups", "dominadas"],
  ["pull ups", "dominadas"],
  ["low row", "remo bajo"],
  ["high row", "remo alto"],
  ["y-raise", "elevación en Y"],
  ["y raise", "elevación en Y"],
  ["reverse lunge", "estocada hacia atrás"],
  ["squat row", "sentadilla con remo"],
  ["jack knife sit-up", "abdominal navaja (jackknife)"],
  ["hip internal rotation", "rotación interna de cadera"],
  ["hip external rotation", "rotación externa de cadera"],
  ["straight leg raise", "elevación de piernas rectas"],
  ["push-ups", "flexiones de brazos"],
  ["push ups", "flexiones de brazos"],
  ["box jump", "salto al cajón"],
  ["judo flip", "volteo de judo"],
  ["cross-over", "cruce de poleas"],
  ["crossover", "cruce de poleas"],
  ["crossovers", "cruce de poleas"],
  ["pin presses", "press desde pines"],
  ["balance board", "tabla de equilibrio"],
  ["battle rope", "soga de batalla"],
  ["wall sit", "sentadilla isométrica en pared"],
  ["dead hang", "colgado pasivo"],
  ["scapular pull", "retracción escapular colgado"],
  ["skier", "esquiador"],
  ["ski", "esquí"],
  ["stretch", "estiramiento"],
  ["hold", "isométrico"],
  ["press", "press"],
  ["raises", "elevaciones"],
  ["raise", "elevación"],
  ["extension", "extensión"],
  ["lift", "elevación"],
];

// ── Modificadores → sufijos ordenados ────────────────────────────────
// orden: 1 agarre · 2 lateralidad · 3 dirección/estilo · 4 posición · 5 asistencia
const MODS = [
  ["close grip", "con agarre cerrado", 1, false],
  ["close-grip", "con agarre cerrado", 1, false],
  ["wide grip", "con agarre ancho", 1, false],
  ["wide-grip", "con agarre ancho", 1, false],
  ["reverse grip", "con agarre invertido", 1, false],
  ["reverse-grip", "con agarre invertido", 1, false],
  ["neutral grip", "con agarre neutro", 1, false],
  ["mixed grip", "con agarre mixto", 1, false],
  ["clean-grip", "con agarre de cargada", 1, false],
  ["clean grip", "con agarre de cargada", 1, false],
  ["underhand", "con agarre supino", 1, false],
  ["overhand", "con agarre prono", 1, false],
  ["gripless", "sin agarre", 1, false],
  ["one arm", "a un brazo", 2, false],
  ["one-arm", "a un brazo", 2, false],
  ["single arm", "a un brazo", 2, false],
  ["two arm", "a dos brazos", 2, false],
  ["one leg", "a una pierna", 2, false],
  ["single leg", "a una pierna", 2, false],
  ["one legged", "a una pierna", 2, false],
  ["single legged", "a una pierna", 2, false],
  ["two legs", "a dos piernas", 2, false],
  ["both legs", "a dos piernas", 2, false],
  ["alternate", "alternado", 2, true],
  ["alternating", "alternado", 2, true],
  ["unilateral", "unilateral", 2, false],
  ["contralateral", "contralateral", 2, false],
  ["twisting", "con giro", 3, false],
  ["rotational", "con rotación", 3, false],
  ["explosive", "explosivo", 3, true],
  ["plyo", "pliométrico", 3, true],
  ["isometric", "isométrico", 3, true],
  ["dynamic", "dinámico", 3, true],
  ["negative", "negativo", 3, true],
  ["overhead", "sobre la cabeza", 3, false],
  ["behind the back", "por detrás de la espalda", 3, false],
  ["behind back", "por detrás de la espalda", 3, false],
  ["behind the head", "por detrás de la cabeza", 3, false],
  ["behind head", "por detrás de la cabeza", 3, false],
  ["behind neck", "por detrás de la nuca", 3, false],
  ["seated", "sentado", 4, false],
  ["sitted", "sentado", 4, false],
  ["standing", "de pie", 4, false],
  ["lying", "acostado", 4, false],
  ["kneeling", "de rodillas", 4, false],
  ["hanging", "colgado", 4, false],
  ["prone", "boca abajo", 4, false],
  ["supine", "boca arriba", 4, false],
  ["incline", "en banco inclinado", 4, false],
  ["decline", "en banco declinado", 4, false],
  ["on bench", "en banco", 4, false],
  ["on floor", "en el piso", 4, false],
  ["floor", "en el piso", 4, false],
  ["wall", "en pared", 4, false],
  ["parallel", "en paralelas", 4, false],
  ["self assisted", "autoasistido", 5, true],
  ["assisted", "asistido", 5, true],
  ["weighted", "con peso extra", 5, false],
  ["modified", "modificado", 5, true],
  // dirección / estilo sueltos que quedaban colgando antes del núcleo
  ["front", "al frente", 3, false],
  ["rear", "posterior", 3, false],
  ["horizontal", "horizontal", 3, false],
  ["vertical", "vertical", 3, false],
  ["oblique", "oblicuo", 3, true],
  ["archer", "estilo arquero", 3, false],
  ["rocking", "con balanceo", 3, false],
  ["straight arm", "con brazos rectos", 3, false],
  ["straight arms", "con brazos rectos", 3, false],
  ["bent arm", "con brazos flexionados", 3, false],
  ["bent arms", "con brazos flexionados", 3, false],
  ["straight leg", "con piernas rectas", 3, false],
  ["straight legs", "con piernas rectas", 3, false],
  ["bent leg", "con piernas flexionadas", 3, false],
  ["bent knee", "con rodillas flexionadas", 3, false],
  ["narrow stance", "con postura cerrada", 3, false],
  ["wide stance", "con postura ancha", 3, false],
  ["close stance", "con postura cerrada", 3, false],
  ["palms down", "con palmas hacia abajo", 3, false],
  ["palms up", "con palmas hacia arriba", 3, false],
  ["palm down", "con palma hacia abajo", 3, false],
  ["palm up", "con palma hacia arriba", 3, false],
  ["over a bench", "sobre banco", 4, false],
  ["over bench", "sobre banco", 4, false],
  ["from bench", "desde banco", 4, false],
  ["on a bench", "en banco", 4, false],
  ["over head", "sobre la cabeza", 3, false],
  ["on exercise ball", "sobre pelota de estabilidad", 4, false],
  ["on stability ball", "sobre pelota de estabilidad", 4, false],
  ["on a stability ball", "sobre pelota de estabilidad", 4, false],
  ["with stability ball", "con pelota de estabilidad", 4, false],
  ["with exercise ball", "con pelota de estabilidad", 4, false],
  ["with throw down", "con lanzamiento", 3, false],
  ["with arms extended", "con brazos extendidos", 3, false],
  ["with rope attachment", "con soga", 4, false],
  ["with v. bar", "con barra V", 4, false],
  ["with v bar", "con barra V", 4, false],
  ["wide", "ancho", 3, true],
  ["narrow", "cerrado", 3, true],
  ["reverse", "invertido", 3, true],
  ["bent-over", "con torso inclinado", 4, false],
  ["bent over", "con torso inclinado", 4, false],
  ["straight back", "con espalda recta", 3, false],
  ["low", "bajo", 3, true],
  ["high", "alto", 3, true],
  ["bench", "en banco", 4, false],
  ["drop", "con caída", 3, false],
  ["fixed back", "con espalda fija", 3, false],
  ["squatting", "en cuclillas", 4, false],
  ["full range of motion", "en rango completo", 3, false],
  ["high pulley", "desde polea alta", 4, false],
  ["low pulley", "desde polea baja", 4, false],
  ["with rope", "con soga", 4, false],
  ["rope", "con soga", 4, false],
  ["with bar", "con barra recta", 4, false],
  ["with v-bar", "con barra V", 4, false],
];
const MODS_SORTED = [...MODS].sort((a, b) => b[0].length - a[0].length);

// ── Palabras sueltas de último recurso ────────────────────────────────
const WORDS = {
  "reverse": "invertido", "revers": "invertido", "inverse": "invertido",
  "inverted": "invertido", "front": "frontal", "rear": "trasero",
  "side": "lateral", "lateral": "lateral", "high": "alto", "low": "bajo",
  "full": "completo", "half": "medio", "deep": "profundo",
  "straight": "recto", "bent": "flexionado", "arm": "de brazo",
  "arms": "de brazos", "leg": "de pierna", "legs": "de piernas",
  "knee": "de rodilla", "knees": "de rodillas", "chest": "de pecho",
  "shoulder": "de hombro", "shoulders": "de hombros", "hip": "de cadera",
  "glute": "de glúteo", "glutes": "de glúteos", "back": "de espalda",
  "calf": "de pantorrilla", "calves": "de pantorrillas",
  "wrist": "de muñeca", "neck": "de cuello", "triceps": "de tríceps",
  "tricep": "de tríceps", "biceps": "de bíceps", "bicep": "de bíceps",
  "delt": "de deltoides", "deltoid": "de deltoides", "lat": "de dorsal",
  "hamstring": "de isquiotibiales", "hamstrings": "de isquiotibiales",
  "quad": "de cuádriceps", "quads": "de cuádriceps",
  "oblique": "oblicuo", "abdominal": "abdominal", "ab": "abdominal",
  "core": "de core", "torso": "de torso", "body": "de cuerpo",
  "upper": "superior", "lower": "inferior", "inner": "interno",
  "outer": "externo", "middle": "medio", "and": "y", "with": "con",
  "on": "sobre", "to": "a", "the": "", "up": "hacia arriba",
  "down": "hacia abajo", "forward": "hacia adelante",
  "backward": "hacia atrás", "cross": "cruzado", "crossover": "cruce",
  "vertical": "vertical", "horizontal": "horizontal",
  "diagonal": "diagonal", "circular": "circular", "sumo": "sumo",
  "elevated": "elevado", "supported": "con apoyo", "raised": "elevado",
  "extended": "extendido", "single": "simple", "double": "doble",
  "hands": "manos", "hand": "mano", "feet": "pies", "foot": "pie",
  "palm": "palma", "palms": "palmas", "elbow": "codo", "elbows": "codos",
  "head": "cabeza", "stiff": "rígido", "power": "de potencia",
  "speed": "de velocidad", "quick": "rápido", "short": "corto",
  "big": "grande", "advanced": "avanzado", "intermediate": "intermedio",
  "basic": "básico", "pec": "de pectoral", "pectoralis": "pectoral",
  "major": "mayor", "rectus": "recto", "femoris": "femoral",
  "gluteus": "glúteo", "piriformis": "piriforme", "adductor": "de aductores",
  "abductor": "de abductores", "soleus": "sóleo", "tibialis": "tibial",
  "peroneals": "peroneos", "spine": "de columna", "scapula": "de escápula",
  "scapular": "escapular", "posterior": "posterior", "anterior": "anterior",
};

const PAREN_MAP = {
  "male": "demo hombre",
  "female": "demo mujer",
  "back pov": "vista trasera",
  "side pov": "vista lateral",
  "front pov": "vista frontal",
  "pov": "vista en primera persona",
  "with rope": "con soga",
  "with arm blaster": "con arm blaster",
  "with towel": "con toalla",
  "with band": "con banda",
  "on stability ball": "sobre pelota de estabilidad",
  "on bench": "en banco",
  "on floor": "en el piso",
  "on knees": "de rodillas",
  "kneeling": "de rodillas",
  "with rope attachment": "con soga",
  "rope attachment": "con soga",
  "straight arm": "con brazos rectos",
  "pro lat bar": "con barra de dorsales",
  "v-bar": "con barra V",
  "v. bar": "con barra V",
  "sz-bar": "con barra Z",
  "stirrups": "con estribos",
  "hands overhead": "manos sobre la cabeza",
  "on stability ball, arms straight": "sobre pelota, brazos rectos",
  "up-down": "arriba-abajo",
  "on dip-pull-up cage": "en jaula de fondos y dominadas",
  "narrow parallel grip": "agarre paralelo cerrado",
  "bosu ball": "en bosu",
  "on knee": "sobre rodilla",
  "knees bent": "rodillas flexionadas",
  "band under both legs": "banda bajo los dos pies",
  "cross body": "cruzado",
  "on hip": "sobre la cadera",
};

// concordancia: adjetivos que cambian si el núcleo es femenino
const FEM_ADJ = { "asistido": "asistida", "alternado": "alternada", "modificado": "modificada", "autoasistido": "autoasistida", "isométrico": "isométrica", "dinámico": "dinámica", "explosivo": "explosiva", "pliométrico": "pliométrica", "negativo": "negativa", "oblicuo": "oblicua", "ancho": "ancha", "cerrado": "cerrada", "invertido": "invertida", "bajo": "baja", "alto": "alta" };
const FEM_NOUNS = new Set(["dominada", "sentadilla", "elevación", "elevaciones", "estocada", "apertura", "aperturas", "flexión", "extensión", "patada", "patadas", "cargada", "caminata", "plancha", "rotación", "abducción", "aducción", "subida", "levantada", "marcha", "carrera", "prensa", "navaja", "báscula", "hiperextensión", "postura", "bandera", "vuelta", "bicicleta", "tijeras", "sogas", "parada"]);

// Protección de núcleos ya traducidos: se marcan token a token con "§"
const SENT = "§";
const PHRASES_SORTED = [...PHRASES].sort((a, b) => b[0].length - a[0].length);

function protegerFrase(es) {
  return es.split(" ").map((t) => SENT + t).join(" ");
}

function traducirFrase(txt) {
  let out = " " + txt + " ";
  for (const [en, es] of PHRASES_SORTED) {
    let idx;
    while ((idx = out.toLowerCase().indexOf(" " + en + " ")) >= 0) {
      out = out.slice(0, idx) + " " + protegerFrase(es) + " " + out.slice(idx + en.length + 2);
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

function traducirParen(p) {
  const key = p.toLowerCase().trim();
  if (PAREN_MAP[key] !== undefined) return PAREN_MAP[key];
  return traducirFrase(key).replace(new RegExp(SENT, "g"), "");
}

function traducirNombre(name) {
  let n = name.replace(/в°/g, "°").replace(/\s+/g, " ").trim();
  const parens = [];
  n = n.replace(/\(([^)]*)\)/g, (_, p) => { parens.push(p); return " "; }).replace(/\s+/g, " ").trim();
  let version = "";
  n = n.replace(/\bv\.?\s*(\d)\b/i, (_, d) => { version = `v${d}`; return " "; }).replace(/\s+/g, " ").trim();
  n = n.replace(/\s+-\s*$/, "").replace(/\s+-\s+/g, " ").replace(/_/g, " ");

  // 1) equipamiento al inicio → sufijo
  let equipSuffix = "";
  const lower0 = n.toLowerCase();
  for (const [en, es] of EQUIP_PREFIX) {
    if (lower0 === en || lower0.startsWith(en + " ")) {
      equipSuffix = es;
      n = n.slice(en.length).trim();
      break;
    }
  }

  // 2) frases núcleo
  let txt = traducirFrase(n);

  // 3) modificadores → sufijos (solo sobre tokens NO protegidos)
  const sufijos = [];
  for (const [en, es, orden, esAdj] of MODS_SORTED) {
    let low = " " + txt.toLowerCase() + " ";
    let idx;
    while ((idx = low.indexOf(" " + en + " ")) >= 0 && !en.split(" ").some((w) => low.includes(SENT + w))) {
      txt = (txt.slice(0, idx) + " " + txt.slice(idx + en.length + 1)).replace(/\s+/g, " ").trim();
      low = " " + txt.toLowerCase() + " ";
      sufijos.push({ es, orden, esAdj });
    }
  }
  sufijos.sort((a, b) => a.orden - b.orden);

  // 4) resto palabra a palabra
  let anyWordLeft = false;
  txt = txt.split(/\s+/).map((w) => {
    if (w.startsWith(SENT)) return w;
    const lw = w.toLowerCase();
    if (WORDS[lw] !== undefined) return WORDS[lw];
    if (/^[a-z']+$/.test(lw)) anyWordLeft = true;
    return w;
  }).filter(Boolean).join(" ");

  txt = txt.replace(new RegExp(SENT, "g"), "").replace(/\s+/g, " ").trim();

  // Reordenar estiramientos: "de pantorrillas estiramiento" → "estiramiento
  // de pantorrillas" (el patrón "[músculo] stretch" invierte el orden).
  const mEst = txt.match(/^(.+?) (estiramiento)$/i) || txt.match(/^(.+?) (estiramiento) (.*)$/i);
  if (mEst && !/estiramiento/i.test(mEst[1])) {
    const resto = mEst[3] ? " " + mEst[3] : "";
    let objeto = mEst[1];
    if (!/^(de|del) /i.test(objeto)) objeto = "de " + objeto;
    txt = "estiramiento " + objeto + resto;
  }

  const first = (txt.split(" ")[0] || "").toLowerCase();
  const fem = FEM_NOUNS.has(first);

  // limpiar redundancias entre núcleo y sufijos ("extensión de tríceps en
  // polea" + equipamiento "en polea"; "en banco inclinado" + "en banco")
  let sufTxt = sufijos.map((s) => (s.esAdj && fem ? (FEM_ADJ[s.es] || s.es) : s.es));
  if (sufTxt.includes("en banco inclinado") || sufTxt.includes("en banco declinado")) {
    sufTxt = sufTxt.filter((s) => s !== "en banco");
  }
  let es = txt;
  for (const s of sufTxt) es += " " + s;
  if (equipSuffix && !es.toLowerCase().includes(equipSuffix.toLowerCase())) es += " " + equipSuffix;
  // colapsar duplicados inmediatos tipo "en polea en polea"
  es = es.replace(/\b(en polea|en banco|con barra|con banda|con mancuerna|con soga|en máquina|de pie|sentado|acostado)( \1)+\b/g, "$1");
  const extras = parens.map(traducirParen).filter(Boolean);
  if (version) extras.push(version);
  if (extras.length) es += ` (${extras.join(", ")})`;
  es = es.replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();
  es = es.charAt(0).toUpperCase() + es.slice(1);
  return { es, method: anyWordLeft ? "word" : "phrase" };
}

const out = exercises.map((e) => {
  if (overrides[e.id]) {
    return { id: e.id, en: e.name, es: overrides[e.id], method: "override" };
  }
  const { es, method } = traducirNombre(e.name);
  return { id: e.id, en: e.name, es, method };
});

const stats = out.reduce((s, r) => { s[r.method] = (s[r.method] || 0) + 1; return s; }, {});
fs.mkdirSync(path.join(REPO, "data"), { recursive: true });
fs.writeFileSync(path.join(REPO, "data", "catalogo-nombres-es.json"), JSON.stringify(out, null, 1), "utf8");
console.log("total:", out.length, "stats:", JSON.stringify(stats));
