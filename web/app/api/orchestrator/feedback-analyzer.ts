import { ExecutionResult, Specification } from './types';
import { getCentralMemory } from '@/lib/central-memory';

export interface Gap {
  type: 'quality' | 'completeness' | 'performance' | 'missing_feature';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAction: string;
}

export interface QualityMetrics {
  overallScore: number; // 0-100
  completeness: number;
  quality: number;
  performance: number;
  issues: string[];
}

export interface Feedback {
  gapDetected: boolean;
  gaps: Gap[];
  metrics: QualityMetrics;
  shouldRetry: boolean;
  retryReason: string;
  improvementSuggestions: string[];
}

export interface ImprovedSpec extends Specification {
  previousAttempts: number;
  learnedConstraints: string[];
  failurePatterns: string[];
  enhancedRequirements: string[];
}

export interface ExecutionLesson {
  original_spec: Specification;
  execution_result: ExecutionResult;
  feedback: Feedback;
  improved_spec?: ImprovedSpec;
  success_in_retry: boolean;
  total_attempts: number;
  learned_at: Date;
}

export class FeedbackAnalyzer {
  private centralMemory = getCentralMemory();

  async detectGaps(spec: Specification, result: ExecutionResult): Promise<Gap[]> {
    const gaps: Gap[] = [];

    // Analizar si se cumplieron los objetivos
    if (!result.outputs || Object.keys(result.outputs).length === 0) {
      gaps.push({
        type: 'completeness',
        description: 'No output generated',
        severity: 'high',
        suggestedAction: 'Retry with refined specification',
      });
    }

    // Analizar errores
    if (result.errors && result.errors.length > 0) {
      gaps.push({
        type: 'quality',
        description: `Execution errors: ${result.errors.join(', ')}`,
        severity: 'high',
        suggestedAction: 'Address errors and retry',
      });
    }

    // Analizar tiempo de ejecución vs estimado
    if (result.totalTime > (spec.estimatedTime || 0) * 1000 * 1.5) {
      gaps.push({
        type: 'performance',
        description: 'Execution took significantly longer than estimated',
        severity: 'medium',
        suggestedAction: 'Optimize agent parallelization',
      });
    }

    return gaps;
  }

  async analyzeQuality(result: ExecutionResult): Promise<QualityMetrics> {
    let overallScore = 100;
    const issues: string[] = [];

    // Evaluar status
    if (result.status === 'failed') {
      overallScore -= 50;
      issues.push('Execution failed');
    }

    // Evaluar errores
    if (result.errors && result.errors.length > 0) {
      overallScore -= Math.min(30, result.errors.length * 10);
      result.errors.forEach((err) => issues.push(`Error: ${err}`));
    }

    // Evaluar completeness de outputs
    const outputKeys = Object.keys(result.outputs || {});
    const completeness = Math.min(100, (outputKeys.length / 5) * 100); // Assuming 5 expected outputs
    overallScore = (overallScore + completeness) / 2;

    // Evaluar performance
    const performance = Math.max(0, 100 - (result.totalTime / 300000) * 100); // Max 5 min

    return {
      overallScore: Math.max(0, Math.min(100, overallScore)),
      completeness,
      quality: 100 - issues.length * 10,
      performance,
      issues,
    };
  }

  async shouldRetry(
    gaps: Gap[],
    metrics: QualityMetrics,
    attempts: number,
    maxAttempts: number = 3
  ): Promise<boolean> {
    // No retry si ya llegamos al máximo de intentos
    if (attempts >= maxAttempts) {
      return false;
    }

    // Retry si hay gaps críticos
    if (gaps.some((g) => g.severity === 'high')) {
      return true;
    }

    // Retry si la calidad es muy baja
    if (metrics.overallScore < 50) {
      return true;
    }

    // No retry si todo está bien
    if (gaps.length === 0 && metrics.overallScore > 70) {
      return false;
    }

    return false;
  }

  async generateImprovedSpec(
    original: Specification,
    feedback: Feedback
  ): Promise<ImprovedSpec> {
    const attemptNumber = (original as any).previousAttempts || 0;

    const improvedSpec: ImprovedSpec = {
      ...original,
      previousAttempts: attemptNumber + 1,
      learnedConstraints: [
        ...(original.constraints || []),
        ...feedback.gaps.map((g) => g.suggestedAction),
      ],
      failurePatterns: feedback.gaps.map((g) => g.description),
      enhancedRequirements: [
        ...(original.requirements || []),
        ...feedback.improvementSuggestions,
      ],
    };

    return improvedSpec;
  }

  async recordLesson(
    originalSpec: Specification,
    result: ExecutionResult,
    feedback: Feedback,
    improved?: ImprovedSpec,
    successInRetry?: boolean,
    totalAttempts?: number
  ): Promise<void> {
    const lesson: ExecutionLesson = {
      original_spec: originalSpec,
      execution_result: result,
      feedback,
      improved_spec: improved,
      success_in_retry: successInRetry || false,
      total_attempts: totalAttempts || 1,
      learned_at: new Date(),
    };

    try {
      // Guardar en Central Memory
      const lessonKey = `lesson:${result.executionId}`;
      await this.centralMemory.setContext(lessonKey, lesson);

      // Actualizar patrones si fue exitoso
      if (successInRetry) {
        await this.updateSuccessPatterns(originalSpec, improved);
      }

      console.log(`✅ Lesson recorded for execution ${result.executionId}`);
    } catch (error) {
      console.error('Error recording lesson:', error);
    }
  }

  private async updateSuccessPatterns(
    original: Specification,
    improved?: ImprovedSpec
  ): Promise<void> {
    // Analizar cambios exitosos
    const pattern = {
      keywords: original.objectives || [],
      success_constraints: improved?.learnedConstraints || [],
      success_requirements: improved?.enhancedRequirements || [],
      timestamp: new Date(),
    };

    try {
      const patternKey = `pattern:success:${Date.now()}`;
      await this.centralMemory.setContext(patternKey, pattern);
    } catch (error) {
      console.error('Error updating success patterns:', error);
    }
  }
}

export function getFeedbackAnalyzer(): FeedbackAnalyzer {
  return new FeedbackAnalyzer();
}
