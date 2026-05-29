import { Specification, SkillPlan, AgentPriority } from './types';
import { SKILL_MATRIX, CORE_AGENTS } from './constants';

export function mapSpecificationToSkills(spec: Specification): SkillPlan {
  const objectivesText = spec.objectives.join(' ').toLowerCase();
  const constraintsText = spec.constraints.join(' ').toLowerCase();
  const requirementsText = spec.requirements.join(' ').toLowerCase();
  const fullText = `${objectivesText} ${constraintsText} ${requirementsText}`;

  const detectedSkills = new Map<string, number>();

  // Detectar skills basado en keywords
  Object.entries(SKILL_MATRIX).forEach(([, matrix]) => {
    matrix.keywords.forEach((keyword) => {
      if (fullText.includes(keyword.toLowerCase())) {
        matrix.skills.forEach((skill) => {
          const currentPriority = detectedSkills.get(skill.name) || 999;
          detectedSkills.set(skill.name, Math.min(currentPriority, skill.priority));
        });
      }
    });
  });

  // Agregar skills por tipo de sistema
  const systemSkills = getSystemSpecificSkills(spec.systemType);
  systemSkills.forEach((priority, skill) => {
    const currentPriority = detectedSkills.get(skill) || 999;
    detectedSkills.set(skill, Math.min(currentPriority, priority));
  });

  // Ordenar skills por prioridad
  const sortedSkills = Array.from(detectedSkills.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([skill]) => skill);

  // Crear prioridades map
  const priorities: Record<string, AgentPriority> = {};
  sortedSkills.forEach((skill, idx) => {
    const priorityValue = Math.min(3, Math.max(1, Math.ceil((idx + 1) / 5))) as AgentPriority;
    priorities[skill] = priorityValue;
  });

  // Calcular dependencias (simple para ahora)
  const dependencies = calculateDependencies(sortedSkills);

  // Estimar tiempo basado en número de skills y complejidad
  const baseTime = sortedSkills.length * 5; // 5 min por skill
  const complexityMultiplier = {
    low: 1,
    medium: 1.5,
    high: 2,
  }[spec.estimatedComplexity];

  return {
    skills: sortedSkills,
    priorities,
    dependencies,
    estimatedTime: Math.round(baseTime * complexityMultiplier),
  };
}

function getSystemSpecificSkills(systemType: 1 | 2 | 3 | 4): Map<string, AgentPriority> {
  const skills = new Map<string, AgentPriority>();

  switch (systemType) {
    case 1: // Web Improver
      skills.set('design-taste-frontend', 1);
      skills.set('high-end-visual-design', 1);
      skills.set('code-review', 2);
      break;

    case 2: // Web Creator
      skills.set('ckm-design', 1);
      skills.set('imagegen-frontend-web', 2);
      skills.set('cult-ui', 1);
      skills.set('image-to-code', 2);
      break;

    case 3: // App Creator
      skills.set('agent-specification', 1);
      skills.set('ckm-design', 1);
      skills.set('cult-ui', 1);
      skills.set('agent-dev-backend-api', 2);
      skills.set('supabase', 1);
      break;

    case 4: // App Improver
      skills.set('ui-ux-pro-max', 1);
      skills.set('code-review', 2);
      skills.set('security-audit', 1);
      break;
  }

  return skills;
}

function calculateDependencies(skills: string[]): Record<string, string[]> {
  const dependencies: Record<string, string[]> = {};

  // Definir dependencias lógicas entre skills
  const skillDependencies: Record<string, string[]> = {
    'imagegen-frontend-web': ['ckm-design'],
    'imagegen-frontend-mobile': ['ckm-design'],
    'image-to-code': ['imagegen-frontend-web'],
    'cult-ui': ['ckm-design-system'],
    'ckm-ui-styling': ['ckm-design-system'],
    'code-simplifier': ['code-review'],
    'security-scan': ['security-audit'],
    'security-manager': ['security-scan'],
    'agent-dev-backend-api': ['agent-specification'],
    'supabase': ['agent-dev-backend-api'],
    'agent-integration': ['agent-dev-backend-api', 'supabase'],
  };

  skills.forEach((skill) => {
    const deps = skillDependencies[skill] || [];
    const availableDeps = deps.filter((dep) => skills.includes(dep));
    if (availableDeps.length > 0) {
      dependencies[skill] = availableDeps;
    }
  });

  return dependencies;
}
