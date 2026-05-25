// Desarrollo Integral · Content & Data

export const APP_URL = "https://app-desarrollo-integral.vercel.app";
export const SHIELD_W = "/logos/icon-outline-blanco.svg";
export const ICON_W = "/logos/icon-blanco.svg";
export const LOGO_WHITE = "/logos/logo-blanco.svg";
export const LOGO_BLACK = "/logos/logo-negro.svg";

// MÉTODO DATA
export type MetodoDetail = {
  descripcion: string;
  items: string[];
};

export const METODO_DETAIL: Record<string, MetodoDetail> = {
  "01": {
    descripcion:
      "El proceso comienza con una evaluación exhaustiva del alumno. Sin datos reales no hay punto de partida sólido. Usamos herramientas objetivas para entender el estado actual del cuerpo y definir desde dónde se trabaja.",
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
      "Con los datos de la evaluación se diseña un plan específico para esa persona. No existe un plan estándar. Cada alumno trabaja con ejercicios, cargas, volumen y progresión pensados para su punto de partida y su objetivo.",
    items: [
      "Selección de ejercicios según movilidad, fuerza y objetivos individuales",
      "Periodización estructurada con ciclos de volumen, fuerza e intensidad",
      "Progresión de cargas basada en datos registrados de cada sesión",
      "Integración de trabajo de movilidad, activación y calentamiento específico",
      "Ajuste continuo según la respuesta del alumno al entrenamiento",
    ],
  },
  "03": {
    descripcion:
      "El seguimiento no es una revisión mensual: es parte de cada sesión. Cada dato queda registrado en el aplicativo y permite tomar decisiones con información real, no con suposiciones.",
    items: [
      "Registro de cargas, series y repeticiones en cada entrenamiento",
      "Control periódico de composición corporal (bioimpedancia)",
      "Análisis de evolución en el tiempo con datos históricos",
      "Actualización del plan según progreso real y nuevos objetivos",
      "Comunicación directa entre coach y alumno para ajustes inmediatos",
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
    label: "Evaluación",
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
    label: "Planificación",
    featured: false,
    list: [
      "Plan de entrenamiento personalizado",
      "Selección específica de ejercicios",
      "Progresión estructurada",
    ],
  },
  {
    num: "03",
    label: "Seguimiento",
    featured: false,
    list: ["Ajustes constantes", "Control de evolución", "Actualización del plan"],
  },
];

// STATS
export type Stat = {
  value: string;
  label: string;
};

export const STATS: Stat[] = [
  { value: "30+", label: "años de experiencia en movimiento" },
  { value: "100%", label: "planes personalizados para cada alumno" },
  { value: "Datos reales", label: "cada decisión se toma con evidencia" },
  { value: "Proceso medido", label: "evolución continua verificable" },
];

// FEATURES - Plataforma
export type Feature = {
  icon: string; // Simple emoji or icon name
  title: string;
  desc: string;
};

export const PLATFORM_FEATURES: Feature[] = [
  {
    icon: "📊",
    title: "Bioimp: Bioimpedancia integrada",
    desc: "Registro automático de composición corporal en cada evaluación",
  },
  {
    icon: "💪",
    title: "Entrenamiento: Registro de cargas y progresión",
    desc: "Base de datos de ejercicios con periodización automática",
  },
  {
    icon: "📈",
    title: "Análisis: Gráficos de evolución",
    desc: "Visualización de progreso a lo largo del tiempo",
  },
  {
    icon: "👥",
    title: "Comunicación: Coach ↔ Alumno",
    desc: "Mensajería integrada para ajustes y consultas",
  },
  {
    icon: "🎯",
    title: "Planes: Generador de periodización",
    desc: "Estructura automática según objetivos y disponibilidad",
  },
  {
    icon: "📱",
    title: "Acceso: Web y mobile",
    desc: "Disponible desde cualquier dispositivo, sin fricción",
  },
];

// SERVICES
export type Service = {
  title: string;
  desc: string;
  icon?: string;
};

export const SERVICES: Service[] = [
  {
    title: "Entrenamiento",
    desc: "Planes personalizados de fuerza, hipertrofia y rendimiento. Cada programa se adapta a objetivos, disponibilidad y limitaciones físicas individuales.",
    icon: "💪",
  },
  {
    title: "Deporte de combate",
    desc: "Entrenamiento especializado para boxeo, kickboxing y MMA. Desarrollo de potencia, explosividad y resistencia específica del deporte.",
    icon: "🥊",
  },
  {
    title: "Salud y rehabilitación",
    desc: "Planes de recuperación post-lesión y manejo de dolor. Integración con fisioterapia y trabajo de movilidad para longevidad.",
    icon: "🏥",
  },
];

// TEAM
export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image: string;
};

export const TEAM: TeamMember[] = [
  {
    name: "Ariel Rebisberger",
    role: "Coach, Entrenador de Movimiento",
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

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Nunca vi una evolución tan medida y personalizada. Ariel adapta cada sesión a mis necesidades reales, no a un plan genérico.",
    author: "Marco G.",
    role: "Atleta",
  },
  {
    quote:
      "El proceso de bioimpedancia cambió mi forma de entrenar. Ahora veo exactamente qué está pasando con mi cuerpo.",
    author: "Florencia R.",
    role: "Emprendedora",
  },
  {
    quote:
      "Después de la lesión, este fue el único plan que realmente funcionó. Combina rigor científico con flexibilidad humana.",
    author: "Carlos B.",
    role: "Cliente de Rehabilitación",
  },
];

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
    title: "Movimiento inteligente",
    description: "Evitar lesiones, maximizar resultados. Combinamos fuerza con seguridad, rendimiento con sostenibilidad.",
  },
  {
    number: 5,
    title: "Relación humana",
    description: "Comunicación abierta entre coach y alumno. Ajustes basados en feedback real, no en protocolos rígidos.",
  },
];

// SEO / META
export const META = {
  title: "Desarrollo Integral | Entrenamiento Personalizado con Datos",
  description: "Planes de entrenamiento, fuerza y movimiento basados en bioimpedancia y periodización científica. Coaching personalizado con Ariel Rebisberger.",
  keywords: ["entrenamiento", "coach", "fuerza", "movimiento", "personalizado", "bioimpedancia"],
};

// LOCATION
export type Location = {
  address: string;
  floor: string;
  city: string;
  mapUrl: string;
};

export const LOCATION: Location = {
  address: "Cabildo 450",
  floor: "3er piso",
  city: "Buenos Aires",
  mapUrl: "https://maps.google.com/maps?q=Cabildo+450,+Buenos+Aires,+Argentina&output=embed&z=16",
};
