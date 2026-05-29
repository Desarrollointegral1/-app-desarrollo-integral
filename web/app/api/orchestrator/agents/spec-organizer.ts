import { getCentralMemory } from '@/lib/central-memory';
import {
  OrganizedSpec,
  Requirement,
  Gap,
  Pattern,
  ExecutionHistory,
} from '@/lib/central-memory/types';

export interface RawInput {
  goal: string;
  files?: string[];
  context?: Record<string, unknown>;
}

export class SpecOrganizerAgent {
  private centralMemory = getCentralMemory();

  async generateOrganizedSpec(input: RawInput): Promise<OrganizedSpec> {
    const { goal } = input;

    try {
      // 1. Deduplicar objetivos (en este caso es uno solo)
      const objectives = [goal];
      const deduplicatedObjectives = this.deduplicateObjectives(objectives);

      // 2. Jerarquizar requisitos
      const requirements = input.files
        ? [`Procesar ${input.files.length} archivo(s)`]
        : [];
      const prioritizedRequirements = this.prioritizeRequirements(requirements);

      // 3. Detectar gaps basado en historial
      const similar = await this.centralMemory.findSimilar(goal);
      const detectedGaps = this.detectGaps(goal, similar);

      // 4. Buscar patrones relacionados
      const keywords = goal.toLowerCase().split(' ');
      const relatedPatterns = await this.centralMemory.queryPatterns(keywords);

      // 5. Estimar duración
      const estimatedDuration = await this.estimateDuration(
        relatedPatterns,
        similar
      );

      // 6. Generar enfoque recomendado
      const recommendedApproach = this.generateApproach(
        deduplicatedObjectives,
        relatedPatterns,
        detectedGaps
      );

      return {
        originalGoal: goal,
        deduplicatedObjectives,
        prioritizedRequirements,
        detectedGaps,
        relatedPatterns,
        estimatedDuration,
        recommendedApproach,
      };
    } catch (error) {
      console.error('Error in SpecOrganizerAgent:', error);
      // Fallback: return basic organized spec
      return {
        originalGoal: goal,
        deduplicatedObjectives: [goal],
        prioritizedRequirements: [],
        detectedGaps: [],
        relatedPatterns: [],
        estimatedDuration: 15 * 60 * 1000, // 15 minutes default
        recommendedApproach: `Procesar objetivo: ${goal}`,
      };
    }
  }

  private deduplicateObjectives(objectives: string[]): string[] {
    const seen = new Set<string>();
    const deduplicated: string[] = [];

    objectives.forEach((obj) => {
      const normalized = obj.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        deduplicated.push(obj);
      }
    });

    return deduplicated;
  }

  private prioritizeRequirements(requirements: string[]): Requirement[] {
    return requirements.map((req, index) => ({
      id: `req-${index}`,
      description: req,
      priority:
        index === 0
          ? ('primary' as const)
          : index === 1
            ? ('secondary' as const)
            : ('nice_to_have' as const),
      estimatedEffort: index === 0 ? 5 : 2,
      relatedSkills: this.extractRelatedSkills(req),
    }));
  }

  private detectGaps(goal: string, history: ExecutionHistory[]): Gap[] {
    const gaps: Gap[] = [];

    if (history.length === 0) {
      return [
        {
          type: 'missing_step',
          description: 'No hay ejecuciones previas similares para aprender',
          severity: 'low',
          suggestedFix: 'Proceder con análisis estándar',
        },
      ];
    }

    // Analizar historicaldatos para detectar fallos previos
    const failedExecutions = history.filter((h) => h.status === 'failed');
    if (failedExecutions.length > 0) {
      gaps.push({
        type: 'quality_issue',
        description: `${failedExecutions.length} ejecuciones previas fallaron`,
        severity: failedExecutions.length > 2 ? 'high' : 'medium',
        suggestedFix: `Revisar errores previos: ${failedExecutions[0].errors.join(', ')}`,
      });
    }

    // Detectar ejecuciones lentas
    const avgDuration =
      history.reduce((sum, h) => sum + h.durationMs, 0) / history.length;
    const slowExecutions = history.filter((h) => h.durationMs > avgDuration * 1.5);
    if (slowExecutions.length > 0) {
      gaps.push({
        type: 'performance_issue',
        description: `${slowExecutions.length} ejecuciones fueron 50%+ más lentas`,
        severity: 'medium',
        suggestedFix: 'Optimizar skills o paralelizar más',
      });
    }

    return gaps;
  }

  private async estimateDuration(
    patterns: Pattern[],
    history: ExecutionHistory[]
  ): Promise<number> {
    if (history.length === 0) return 15 * 60 * 1000; // 15 minutes default

    const avgDuration =
      history.reduce((sum, h) => sum + h.durationMs, 0) / history.length;
    return Math.round(avgDuration);
  }

  private generateApproach(
    objectives: string[],
    patterns: Pattern[],
    gaps: Gap[]
  ): string {
    let approach = `Objetivo: ${objectives.join(', ')}\n`;

    if (patterns.length > 0) {
      const topSkills = patterns[0].bestSkills.slice(0, 3);
      approach += `Enfoque recomendado: Usar skills probados: ${topSkills.join(', ')}\n`;
    }

    if (gaps.length > 0) {
      const highSeverityGaps = gaps.filter((g) => g.severity === 'high');
      if (highSeverityGaps.length > 0) {
        approach += `⚠️ Alertas: ${highSeverityGaps.map((g) => g.suggestedFix).join('; ')}\n`;
      }
    }

    return approach;
  }

  private extractRelatedSkills(requirement: string): string[] {
    const skillMap: Record<string, string[]> = {
      archivo: ['image-to-code', 'imagegen-frontend-web'],
      diseño: ['ckm-design', 'high-end-visual-design'],
      código: ['cult-ui', 'code-review'],
      base: ['supabase'],
      web: ['agent-browser', 'redesign-existing-projects'],
    };

    const reqLower = requirement.toLowerCase();
    const skills: Set<string> = new Set();

    Object.entries(skillMap).forEach(([keyword, skillList]) => {
      if (reqLower.includes(keyword)) {
        skillList.forEach((skill) => skills.add(skill));
      }
    });

    return Array.from(skills);
  }
}

// Export singleton
let instance: SpecOrganizerAgent | null = null;

export function getSpecOrganizerAgent(): SpecOrganizerAgent {
  if (!instance) {
    instance = new SpecOrganizerAgent();
  }
  return instance;
}
