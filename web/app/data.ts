// Desarrollo Integral · Content & Data

export const APP_URL = "https://app-desarrollo-integral.vercel.app";
export const SHIELD_W = "/web/logos/icon-outline-blanco.svg";
export const ICON_W = "/web/logos/icon-blanco.svg";
export const LOGO_WHITE = "/web/logos/logo-blanco.svg";
export const LOGO_BLACK = "/web/logos/logo-negro.svg";

// MÉTODO DATA
export type MetodoDetail = {
  descripcion: string;
  items: string[];
};

export const METODO_DETAIL: Record<string, MetodoDetail> = {
  "01": {
    descripcion:
      "Composición corporal, movilidad, fuerza e historial. Sin datos reales no hay punto de partida.",
    items: [
      "Composición corporal por bioimpedancia (masa muscular, grasa, hidratación)",
      "Evaluación de movilidad articular y rangos funcionales",
      "Test de fuerza en patrones básicos (empuje, tracción, cadena posterior)",
      "Relevamiento del historial deportivo, lesiones y objetivos",
      "Definición de metas concretas y medibles a corto y largo plazo",
    ],
  },
  "02": {
    descripcion:
      "Un plan de entrenamiento diseñado para vos: ejercicios, cargas y progresión según tu evaluación. Toda progresión es gradual.",
    items: [
      "Selección de ejercicios según movilidad, fuerza y objetivos individuales",
      "Periodización estructurada con ciclos de volumen, fuerza e intensidad",
      "Progresión de cargas basada en datos registrados de cada sesión",
      "Integración de trabajo de movilidad, activación y calentamiento específico",
    ],
  },
  "03": {
    descripcion:
      "Cada sesión guiada por un profesional que observa, corrige y ajusta en el momento. La técnica no se negocia.",
    items: [
      "Registro de cargas, series y repeticiones en cada entrenamiento",
      "Corrección técnica en vivo, ejercicio por ejercicio",
      "Ajuste de cargas e intensidad según cómo llegás a cada sesión",
      "Comunicación directa entre entrenador y alumno para ajustes inmediatos",
    ],
  },
  "04": {
    descripcion:
      "Cada registro alimenta la próxima decisión. El plan cambia cuando tu cuerpo cambia.",
    items: [
      "Control periódico de composición corporal (bioimpedancia)",
      "Análisis de evolución en el tiempo con datos históricos",
      "Actualización del plan según progreso real y nuevos objetivos",
      "Ajuste continuo según la respuesta del alumno al entrenamiento",
    ],
  },
};

export type MetodoCard = {
  num: string;
  label: string;
  featured: boolean;
  list: string[];
};

export const metodoCards: MetodoCard[] = [
  {
    num: "01",
    label: "Evaluar",
    featured: true,
    list: [
      "Composición corporal (bioimpedancia)",
      "Movilidad",
      "Nivel de fuerza",
      "Historial",
    ],
  },
  {
    num: "02",
    label: "Planificar",
    featured: false,
    list: [
      "Plan de entrenamiento personalizado",
      "Selección específica de ejercicios",
      "Progresión estructurada",
    ],
  },
  {
    num: "03",
    label: "Entrenar",
    featured: false,
    list: [
      "Sesiones guiadas por un profesional",
      "Corrección técnica en el momento",
      "Cargas registradas en cada sesión",
    ],
  },
  {
    num: "04",
    label: "Evolucionar",
    featured: false,
    list: ["Control de evolución", "Actualización del plan", "Decisiones con datos"],
  },
];

// STATS
export type Stat = {
  value: string;
  label: string;
};

export const STATS: Stat[] = [
  { value: "30+", label: "años de experiencia de nuestro entrenador principal" },
  { value: "1 a 1", label: "cada plan se diseña desde una evaluación individual" },
  { value: "Cada sesión", label: "queda registrada: cargas, series y mediciones" },
  { value: "4 pasos", label: "evaluar, planificar, entrenar, evolucionar" },
];

// FEATURES - Plataforma
export type Feature = {
  icon: string; // Simple emoji or icon name
  title: string;
  desc: string;
};

export const PLATFORM_FEATURES: Feature[] = [
  {
    icon: "",
    title: "Bioimpedancia integrada",
    desc: "Registro automático de composición corporal en cada evaluación",
  },
  {
    icon: "",
    title: "Registro de cargas y progresión",
    desc: "Base de datos de ejercicios con periodización automática",
  },
  {
    icon: "",
    title: "Gráficos de evolución",
    desc: "Visualización de progreso a lo largo del tiempo",
  },
  {
    icon: "",
    title: "Canal entrenador · alumno",
    desc: "Mensajería integrada para ajustes y consultas",
  },
  {
    icon: "",
    title: "Generador de periodización",
    desc: "Estructura automática según objetivos y disponibilidad",
  },
  {
    icon: "",
    title: "Web y mobile",
    desc: "Disponible desde cualquier dispositivo, sin fricción",
  },
];

// SERVICES
export type Service = {
  title: string;
  chip: string;
  desc: string;
  image: string;
  imageAlt: string;
};

// Imágenes: generadas con IA ENCIMA de las fotos reales del gimnasio
// (marca/fotos-gimnasio/), con los ejercicios reales que se entrenan acá.
// Se reemplazan 1 a 1 por fotos del shoot cuando exista
// (BRIEF-AUDIOVISUAL-WEB-2026-08-06.md).
export const SERVICES: Service[] = [
  {
    title: "Entrenamiento personal",
    chip: "Progreso con guía directa",
    desc: "Sesiones uno a uno con plan propio: corrección técnica en vivo y cargas registradas en cada sesión.",
    image: "/web/modalidades/entrenamiento-personal.webp",
    imageAlt: "Sentadilla con barra en el rack de Desarrollo Integral",
  },
  {
    title: "Preparación física",
    chip: "Deportistas que compiten",
    desc: "Fuerza, potencia y resistencia planificadas por ciclos según tu calendario.",
    image: "/web/modalidades/preparacion-fisica.webp",
    imageAlt: "Peso muerto con barra en Desarrollo Integral",
  },
  {
    title: "Composición corporal",
    chip: "Decidir con datos, no con la balanza",
    desc: "Bioimpedancia periódica que mide masa muscular, grasa e hidratación en el tiempo.",
    image: "/web/modalidades/composicion-corporal.webp",
    imageAlt: "Medición de bioimpedancia en Desarrollo Integral",
  },
  {
    title: "Recuperación y osteopatía",
    chip: "Dolor o límite de movimiento",
    desc: "Osteopatía y kinesiología integradas al plan para volver a moverte sin riesgo.",
    image: "/web/modalidades/recuperacion-osteopatia.webp",
    imageAlt: "Remo con TRX en Desarrollo Integral",
  },
];

// CÓMO TRABAJAMOS — narrativa, sin CTA (Bloque 6)
export type ComoTrabajamosPoint = {
  title: string;
  desc: string;
};

export const COMO_TRABAJAMOS: ComoTrabajamosPoint[] = [
  {
    title: "El método no nace de una sola mirada",
    desc: "Se construye y se actualiza cruzando medicina del deporte, nutrición y preparación física. No es la rutina que un entrenador aprendió una vez: es un criterio que se revisa contra evidencia real, todo el tiempo.",
  },
  {
    title: "Dos formas de medir tu cuerpo, no una sola balanza",
    desc: "La bioimpedancia tradicional mide masa muscular, grasa e hidratación con el aparato. El scan corporal con dos fotos usa inteligencia artificial para estimar lo mismo, sin aparatos, en segundos. Las dos quedan en tu ficha, comparables en el tiempo.",
  },
  {
    title: "Cada dato tuyo, guardado y a la vista",
    desc: "Cada peso que levantaste, cada sesión, cada medición. Nada se estima de memoria: tu evolución completa queda en la app, tuya, para ver cuándo quieras.",
  },
  {
    title: "El dato no es la última palabra",
    desc: "Se cruza con la palpación del entrenador y con lo que vos decís que sentís. Un número sin ese cruce es solo un número.",
  },
];

// QUÉ BUSCÁS → QUÉ TE RESUELVE (Bloque 7)
export type ResuelveRow = {
  buscas: string;
  resuelve: string;
};

export const QUE_RESUELVE: ResuelveRow[] = [
  { buscas: "Nunca entrené en mi vida", resuelve: "Entrenamiento personal · Composición corporal" },
  { buscas: "Me lastimé en otro lado y no quiero repetirlo", resuelve: "Recuperación y osteopatía · Entrenamiento personal" },
  { buscas: "Entrenar en la tercera edad, con seguridad", resuelve: "Recuperación y osteopatía · Entrenamiento personal" },
  { buscas: "Vengo derivado de kinesiología u osteopatía", resuelve: "Recuperación y osteopatía · Entrenamiento personal" },
  { buscas: "Necesito rendir en mi deporte", resuelve: "Preparación física · Composición corporal" },
];

// PREGUNTAS FRECUENTES (Bloque 10)
export type FAQItem = {
  question: string;
  answer: string;
};

export const FAQ: FAQItem[] = [
  {
    question: "¿Necesito experiencia previa para empezar?",
    answer: "No — atiende desde quien nunca entrenó hasta deportistas, de los 15 a los 90 años.",
  },
  {
    question: "¿Cómo es la primera sesión?",
    answer: "Evaluación completa antes de tocar una pesa: composición corporal, movilidad, fuerza e historial.",
  },
  {
    question: "¿Las sesiones son individuales o en grupo?",
    answer: "Individuales, uno a uno.",
  },
  {
    question: "Vengo con una lesión o derivado de kinesiología, ¿puedo entrenar igual?",
    answer: "Sí — osteopatía y kinesiología están integradas al plan de entrenamiento.",
  },
  {
    question: "¿Puedo ver mi progreso?",
    answer: "Sí, en la app: cada sesión, cada peso, cada medición queda registrada.",
  },
];

export const WHATSAPP_URL = "https://wa.me/5491165115832";

// TEAM
export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image: string;
};

export const TEAM: TeamMember[] = [
  {
    name: "Ariel Rebesberger",
    role: "Entrenador de Movimiento",
    bio: "30+ años especializándose en fuerza, rendimiento y movimiento humano. Trabaja con atletas, ejecutivos y personas en rehabilitación con una filosofía: datos, personalización, resultados verificables.",
    image: "/equipo/ariel.jpg",
  },
  {
    name: "Griselda",
    role: "Osteópata, Especialista en Movimiento",
    bio: "Experta en osteopatía y rehabilitación del movimiento. Complementa el entrenamiento con abordaje integrativo del cuerpo, enfocándose en prevención y optimización de patrones.",
    image: "/equipo/griselda.jpg",
  },
];

// TESTIMONIALS
export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
};

// Pendiente 2026-08-06: estos 3 testimonios eran inventados, no alumnos reales — sacados.
// Lucas va a reemplazar este bloque por videos cortos de testimonios reales, grabados
// cuando haya alumnos disponibles (ver BRIEF-AUDIOVISUAL-WEB-2026-08-06.md). Hasta que
// existan esos videos, el array queda vacío a propósito — TestimonialSlider ya maneja
// el caso vacío devolviendo null, no se rellena con placeholders.
export const TESTIMONIALS: Testimonial[] = [];

// IDENTITY PILLARS
export type IdentityPillar = {
  number: number;
  title: string;
  description: string;
};

export const IDENTITY_PILLARS: IdentityPillar[] = [
  {
    number: 1,
    title: "Datos, no intuición",
    description: "Cada decisión se toma con evidencia objetiva. Bioimpedancia, registros de carga, evolución medida.",
  },
  {
    number: 2,
    title: "Personalización radical",
    description: "Un plan diferente para cada persona. No planes genéricos. Solo entrenamiento construido sobre tu punto de partida.",
  },
  {
    number: 3,
    title: "Medición continua",
    description: "Seguimiento sistemático de evolución. Cada sesión queda registrada. Cada cambio se ve en los números.",
  },
  {
    number: 4,
    title: "Entrenamiento de precisión",
    description: "Tensión mecánica, progresión y control en la ejecución. Nunca esfuerzo al azar.",
  },
  {
    number: 5,
    title: "Relación humana",
    description: "Comunicación abierta entre entrenador y alumno. Ajustes basados en feedback real, no en protocolos rígidos.",
  },
];

// SEO / META
export const META = {
  title: "Desarrollo Integral | Entrenamiento Personalizado con Datos",
  description: "Planes de entrenamiento, fuerza y movimiento basados en bioimpedancia y periodización científica. Entrenamiento personalizado con Ariel Rebesberger.",
  keywords: ["entrenamiento", "entrenador", "fuerza", "movimiento", "personalizado", "bioimpedancia"],
};

// LOCATION
export type Location = {
  address: string;
  floor: string;
  city: string;
  mapUrl: string;
};

export const LOCATION: Location = {
  address: "Av. Cabildo 450",
  floor: "3er piso",
  city: "Belgrano · Capital Federal",
  mapUrl: "https://maps.google.com/maps?q=Av.+Cabildo+450,+Belgrano,+Buenos+Aires,+Argentina&output=embed&z=16",
};

export const HORARIOS = {
  semana: "Lunes a viernes, 8:00 a 22:00 hs",
  sabado: "Sábados, 9:00 a 20:00 hs",
};
