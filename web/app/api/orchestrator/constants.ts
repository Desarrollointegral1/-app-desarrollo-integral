import { AgentDefinition } from './types';

// Mapeo de CLAUDE.md: palabras clave → skills
export const SKILL_MATRIX = {
  // REVISA (Auditoría / Revisión)
  review: {
    keywords: ['revisa', 'audita', 'analiza', 'evalúa', 'inspecciona'],
    skills: [
      { name: 'agent-browser', priority: 1 },
      { name: 'design-taste-frontend', priority: 1 },
      { name: 'high-end-visual-design', priority: 1 },
      { name: 'gpt-taste', priority: 2 },
      { name: 'code-review', priority: 2 },
    ],
  },

  // MEJORA / OPTIMIZA
  improve: {
    keywords: ['mejora', 'optimiza', 'actualiza', 'moderniza', 'potencia'],
    skills: [
      { name: 'high-end-visual-design', priority: 1 },
      { name: 'redesign-existing-projects', priority: 2 },
      { name: 'ui-ux-pro-max', priority: 1 },
      { name: 'stitch-design-taste', priority: 2 },
      { name: 'code-simplifier', priority: 2 },
    ],
  },

  // DISEÑA / CREA
  design: {
    keywords: ['diseña', 'crea', 'genera', 'construye'],
    skills: [
      { name: 'ckm-design', priority: 1 },
      { name: 'imagegen-frontend-web', priority: 2 },
      { name: 'cult-ui', priority: 1 },
      { name: 'image-to-code', priority: 3 },
    ],
  },

  // MARCA / BRANDING
  brand: {
    keywords: ['marca', 'branding', 'logo', 'identidad'],
    skills: [
      { name: 'brandkit', priority: 1 },
      { name: 'ckm-brand', priority: 1 },
    ],
  },

  // BASE DE DATOS
  database: {
    keywords: ['base datos', 'bd', 'sql', 'postgresql'],
    skills: [
      { name: 'supabase', priority: 1 },
    ],
  },

  // ESTILOS / CSS
  styling: {
    keywords: ['estilos', 'css', 'tailwind'],
    skills: [
      { name: 'ckm-design-system', priority: 1 },
      { name: 'ckm-ui-styling', priority: 2 },
    ],
  },
};

// Agentes core del sistema
export const CORE_AGENTS: Record<string, AgentDefinition> = {
  'spec-organizer': {
    id: 'spec-organizer',
    name: 'Specification Organizer',
    description: 'Organiza, deduplica y jerarquiza requisitos usando historial',
    skills: ['agent-specification', 'agent-architecture', 'goal-planner'],
    priority: 1,
    dependencies: [],
    parallel: false,
  },

  'spec-analyzer': {
    id: 'spec-analyzer',
    name: 'Specification Analyzer',
    description: 'Analiza input del usuario y crea especificación',
    skills: ['agent-specification', 'agent-arch-system-design', 'gpt-taste'],
    priority: 1,
    dependencies: ['spec-organizer'],
    parallel: false,
  },

  'skill-selector': {
    id: 'skill-selector',
    name: 'Skill Selector',
    description: 'Mapea especificación a skills optimos',
    skills: [],
    priority: 1,
    dependencies: ['spec-analyzer'],
    parallel: false,
  },

  'design-intel': {
    id: 'design-intel',
    name: 'Design Intelligence',
    description: 'Evalúa/crea diseño visual y UX',
    skills: [
      'design-taste-frontend',
      'high-end-visual-design',
      'ui-ux-pro-max',
      'gpt-taste',
      'ckm-design',
      'stitch-design-taste',
    ],
    priority: 2,
    dependencies: ['spec-analyzer'],
    parallel: true,
  },

  'asset-gen': {
    id: 'asset-gen',
    name: 'Asset Generator',
    description: 'Genera imágenes y componentes visuales',
    skills: ['imagegen-frontend-web', 'imagegen-frontend-mobile'],
    priority: 2,
    dependencies: ['design-intel'],
    parallel: true,
  },

  'frontend-dev': {
    id: 'frontend-dev',
    name: 'Frontend Developer',
    description: 'Convierte diseño a código React',
    skills: ['cult-ui', 'image-to-code', 'ckm-ui-styling', 'ckm-design-system'],
    priority: 2,
    dependencies: ['design-intel', 'asset-gen'],
    parallel: true,
  },

  'code-quality': {
    id: 'code-quality',
    name: 'Code Quality',
    description: 'Revisa, refactoriza y optimiza código',
    skills: ['code-review', 'code-simplifier'],
    priority: 3,
    dependencies: ['frontend-dev'],
    parallel: false,
  },

  'backend-arch': {
    id: 'backend-arch',
    name: 'Backend Architect',
    description: 'Diseña API y base de datos',
    skills: ['agent-dev-backend-api', 'agent-integration'],
    priority: 2,
    dependencies: ['spec-analyzer'],
    parallel: false,
  },

  'db-manager': {
    id: 'db-manager',
    name: 'Database Manager',
    description: 'Configura BD PostgreSQL',
    skills: ['supabase'],
    priority: 2,
    dependencies: ['backend-arch'],
    parallel: false,
  },

  'security-mgr': {
    id: 'security-mgr',
    name: 'Security Manager',
    description: 'Audita y endurece seguridad',
    skills: ['security-audit', 'security-scan', 'security-manager'],
    priority: 3,
    dependencies: [],
    parallel: false,
  },

  'qa-tester': {
    id: 'qa-tester',
    name: 'QA Tester',
    description: 'Tests automáticos y validación',
    skills: ['agent-tester', 'verification-quality-assurance'],
    priority: 3,
    dependencies: [],
    parallel: false,
  },
};

// Secuencias de ejecución por Sistema
export const SYSTEM_SEQUENCES = {
  1: {
    name: 'Web Improver',
    agents: [
      'spec-organizer',
      'spec-analyzer',
      'design-intel',
      'asset-gen',
      'frontend-dev',
      'code-quality',
      'qa-tester',
    ],
  },
  2: {
    name: 'Web Creator',
    agents: [
      'spec-organizer',
      'spec-analyzer',
      'design-intel',
      'asset-gen',
      'frontend-dev',
      'code-quality',
      'qa-tester',
    ],
  },
  3: {
    name: 'App Creator',
    agents: [
      'spec-organizer',
      'spec-analyzer',
      'design-intel',
      'asset-gen',
      'frontend-dev',
      'backend-arch',
      'db-manager',
      'security-mgr',
      'qa-tester',
    ],
  },
  4: {
    name: 'App Improver',
    agents: [
      'spec-organizer',
      'spec-analyzer',
      'design-intel',
      'frontend-dev',
      'backend-arch',
      'security-mgr',
      'code-quality',
      'qa-tester',
    ],
  },
} as const;
