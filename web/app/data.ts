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
      "Un plan de entrenamiento diseñado para vos: ejercicios, cargas y progresión según tu evaluación.",
    items: [
      "Selección de ejercicios según movilidad, fuerza y objetivos individuales",
      "Periodización estructurada con ciclos de volumen, fuerza e intensidad",
      "Progresión de cargas basada en datos registrados de cada sesión",
      "Integración de trabajo de movilidad, activación y calentamiento específico",
    ],
  },
  "03": {
    descripcion:
      "Cada sesión guiada por un profesional que observa, corrige y ajusta en el momento.",
    items: [
      "Registro de cargas, series y repeticiones en cada entrenamiento",
      "Corrección técnica en vivo, ejercicio por ejercicio",
      "Ajuste de cargas e intensidad según cómo llegás a cada sesión",
      "Comunicación directa entre coach y alumno para ajustes inmediatos",
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
  { value: "30+", label: "años de experiencia de nuestro head coach" },
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
    title: "Canal coach · alumno",
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
  desc: string;
  icon?: string;
};

export const SERVICES: Service[] = [
  {
    title: "Entrenamiento personal",
    desc: "Para quienes buscan progresar con guía directa. Sesiones uno a uno con plan propio, corrección técnica y cargas registradas en cada entrenamiento.",
  },
  {
    title: "Preparación física",
    desc: "Para deportistas que necesitan rendir en su disciplina. Fuerza, potencia y resistencia específicas, planificadas por ciclos según tu calendario.",
  },
  {
    title: "Composición corporal",
    desc: "Para quienes quieren decidir con datos, no con la balanza. Mediciones de bioimpedancia periódicas que muestran masa muscular, grasa e hidratación en el tiempo.",
  },
  {
    title: "Recuperación y osteopatía",
    desc: "Para cuerpos con dolor, lesión o limitación de movimiento. Osteopatía y kinesiología integradas al plan de entrenamiento para volver a moverte sin riesgo.",
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
  address: "Sucre 2538",
  floor: "3er piso",
  city: "Belgrano · Buenos Aires",
  mapUrl: "https://maps.google.com/maps?q=Sucre+2538,+Belgrano,+Buenos+Aires,+Argentina&output=embed&z=16",
};
