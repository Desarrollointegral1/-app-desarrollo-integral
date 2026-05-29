import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import {
  Specification,
  ExecutionPlan,
  ExecutionResult,
  ExecutionProgress,
} from './types';
import { mapSpecificationToSkills } from './skill-mapper';
import { createExecutionPlan, createExecutionPlanAsync } from './planner';
import { SkillExecutor } from './executor';
import {
  initializeCentralMemory,
  getCentralMemory,
} from '@/lib/central-memory';
import {
  getSpecOrganizerAgent,
  type RawInput,
} from './agents/spec-organizer';
import { FeedbackAnalyzer } from './feedback-analyzer';
import { getCharlesAdapter } from '@/lib/charles-adapter';

// Store executions in memory (en producción usar BD)
const executionsStore = new Map<string, ExecutionResult | ExecutionPlan>();
const progressStore = new Map<string, ExecutionProgress[]>();

// WebSocket connections
const wsConnections = new Set<any>();

// Initialize Central Memory
let centralMemory: ReturnType<typeof getCentralMemory> | null = null;

function initMemory() {
  if (centralMemory) return;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        'Supabase credentials not configured. Central Memory disabled.'
      );
      return;
    }

    initializeCentralMemory({
      supabaseUrl,
      supabaseKey,
      cacheTTL: 5 * 60 * 1000,
    });

    centralMemory = getCentralMemory();
  } catch (error) {
    console.error('Failed to initialize Central Memory:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    if (type === 'execute') {
      return handleExecute(payload);
    }

    if (type === 'getStatus') {
      return handleGetStatus(payload.executionId);
    }

    if (type === 'getResults') {
      return handleGetResults(payload.executionId);
    }

    return NextResponse.json(
      { error: 'Invalid request type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Orchestrator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleExecute(payload: any) {
  try {
    const { systemType, description, files } = payload;

    // Validar entrada
    if (!systemType || ![1, 2, 3, 4].includes(systemType)) {
      return NextResponse.json(
        { error: 'Invalid systemType (must be 1, 2, 3, or 4)' },
        { status: 400 }
      );
    }

    // Inicializar memoria
    initMemory();

    // 1. Procesar con SpecOrganizerAgent para deduplicar y jerarquizar
    const specOrganizer = getSpecOrganizerAgent();
    const rawInput: RawInput = {
      goal: description,
      files,
      context: { systemType },
    };

    let organizedSpec;
    try {
      organizedSpec = await specOrganizer.generateOrganizedSpec(rawInput);
      console.log('Organized spec:', {
        objectives: organizedSpec.deduplicatedObjectives,
        gaps: organizedSpec.detectedGaps.length,
        patterns: organizedSpec.relatedPatterns.length,
        estimatedDuration: organizedSpec.estimatedDuration,
      });
    } catch (error) {
      console.warn('SpecOrganizer failed, using raw input:', error);
      organizedSpec = {
        originalGoal: description,
        deduplicatedObjectives: [description],
        prioritizedRequirements: [],
        detectedGaps: [],
        relatedPatterns: [],
        estimatedDuration: 15 * 60 * 1000,
        recommendedApproach: description,
      };
    }

    // 2. Crear especificación desde input organizado
    let spec: Specification = {
      systemType,
      objectives: organizedSpec.deduplicatedObjectives,
      constraints: organizedSpec.detectedGaps.map((g) => g.description),
      requirements: files
        ? [`Archivos: ${files.length} archivo(s)`, ...organizedSpec.prioritizedRequirements.map((r) => r.description)]
        : organizedSpec.prioritizedRequirements.map((r) => r.description),
      estimatedComplexity:
        organizedSpec.estimatedDuration > 25 * 60 * 1000
          ? 'high'
          : organizedSpec.estimatedDuration > 15 * 60 * 1000
            ? 'medium'
            : 'low',
    };

    // 3. Enriquecer spec con contexto de CentralMemory
    if (centralMemory && organizedSpec.relatedPatterns.length > 0) {
      try {
        spec.suggestedSkills = organizedSpec.relatedPatterns[0].bestSkills;
        spec.historicalSuccessRate =
          organizedSpec.relatedPatterns[0].successRate;
      } catch (error) {
        console.warn('Could not enrich spec with patterns:', error);
      }
    }

    // NUEVO: Usar Charles Adapter para ejecución
    const charles = getCharlesAdapter({
      autoSelectSkills: true,
      maxParallelAgents: 6,
      timeoutMs: 300000,
    });

    // Ejecutar con Charles (reemplaza orchestrator v2 legacy)
    const result = await charles.executeTask(spec);
    const executionId = result.executionId;

    executionsStore.set(executionId, result);
    progressStore.set(executionId, result.agents);

    // Log para seguimiento
    console.log(`[Charles] Ejecutado: ${executionId}`, {
      status: result.status,
      agents: result.agents.length,
      time: result.totalTime,
    });

    return NextResponse.json({
      success: result.status === 'completed',
      executionId,
      status: result.status,
      result: {
        systemType: result.systemType,
        agents: result.agents.map((a) => ({
          id: a.agentId,
          status: a.status,
          completedAt: a.completedAt,
        })),
        totalTime: result.totalTime,
        completedAt: result.completedAt,
      },
    });
  } catch (error) {
    console.error('Execute error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Execution failed' },
      { status: 500 }
    );
  }
}

async function handleGetStatus(executionId: string) {
  const progress = progressStore.get(executionId);
  const plan = executionsStore.get(executionId);

  if (!progress) {
    return NextResponse.json(
      { error: 'Execution not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    executionId,
    status: progress.length > 0 ? 'running' : 'pending',
    progress: progress,
  });
}

async function handleGetResults(executionId: string) {
  const result = executionsStore.get(executionId);

  if (!result) {
    return NextResponse.json(
      { error: 'Results not found' },
      { status: 404 }
    );
  }

  if (!(result as any).status || (result as any).status === 'pending') {
    return NextResponse.json(
      { error: 'Execution not completed' },
      { status: 202 }
    );
  }

  return NextResponse.json(result);
}

async function executeAsync(plan: ExecutionPlan, goal: string) {
  // Ejecutar en background con feedback loop
  setImmediate(async () => {
    const startTime = Date.now();
    const feedbackAnalyzer = new FeedbackAnalyzer();
    const maxAttempts = 3;
    let attempt = 1;
    let lastResult: ExecutionResult | null = null;
    let lastPlan = plan;
    let spec: Specification = {
      systemType: plan.systemType,
      objectives: [goal],
      constraints: [],
      requirements: [],
      estimatedComplexity: 'medium',
    };

    while (attempt <= maxAttempts) {
      console.log(
        `[ExecuteAsync] Starting execution attempt ${attempt}/${maxAttempts}`
      );

      const executor = new SkillExecutor(lastPlan, (progress) => {
        const progressList = progressStore.get(lastPlan.executionId) || [];
        const existingIndex = progressList.findIndex((p) => p.agentId === progress.agentId);
        if (existingIndex >= 0) {
          progressList[existingIndex] = progress;
        } else {
          progressList.push(progress);
        }
        progressStore.set(lastPlan.executionId, progressList);
        broadcastProgress(lastPlan.executionId, progress);
      });

      try {
        lastResult = await executor.execute();

        // Analizar resultado con feedback analyzer
        const gaps = await feedbackAnalyzer.detectGaps(spec, lastResult);
        const metrics = await feedbackAnalyzer.analyzeQuality(lastResult);
        const shouldRetry = await feedbackAnalyzer.shouldRetry(
          gaps,
          metrics,
          attempt,
          maxAttempts
        );

        const feedback = {
          gapDetected: gaps.length > 0,
          gaps,
          metrics,
          shouldRetry,
          retryReason: gaps.length > 0 ? gaps[0].description : '',
          improvementSuggestions: gaps.map((g) => g.suggestedAction),
        };

        console.log(`[ExecuteAsync] Analysis: gaps=${gaps.length}, retry=${shouldRetry}`);

        if (shouldRetry && attempt < maxAttempts) {
          // Generar spec mejorado para reintento
          const improvedSpec = await feedbackAnalyzer.generateImprovedSpec(spec, feedback);
          spec = improvedSpec;

          // Grabar lección
          await feedbackAnalyzer.recordLesson(
            spec,
            lastResult,
            feedback,
            improvedSpec,
            false,
            attempt
          );

          // Crear nuevo plan con spec mejorado (intenta cargador dinámico primero)
          const skillPlan = mapSpecificationToSkills(improvedSpec);
          try {
            lastPlan = await createExecutionPlanAsync(improvedSpec, skillPlan);
          } catch (error) {
            console.warn('Async plan creation failed, using fallback:', error);
            lastPlan = createExecutionPlan(improvedSpec, skillPlan);
          }

          attempt++;
          continue; // Reintenta con plan mejorado
        } else {
          // Finalizar con este resultado
          if (lastResult) {
            await feedbackAnalyzer.recordLesson(
              spec,
              lastResult,
              feedback,
              undefined,
              metrics.overallScore > 70,
              attempt
            );
          }

          executionsStore.set(lastPlan.executionId, lastResult);
          broadcastCompletion(lastPlan.executionId, lastResult);

          // Grabar ejecución en Central Memory
          if (centralMemory && lastResult) {
            try {
              const durationMs = Date.now() - startTime;
              await centralMemory.recordExecution({
                id: lastPlan.executionId,
                goal,
                spec: lastPlan as unknown as Record<string, unknown>,
                skillsUsed: lastPlan.agents.map((a) => a.id),
                durationMs,
                status:
                  lastResult.status === 'completed'
                    ? 'success'
                    : 'failed',
                results: lastResult as unknown as Record<string, unknown>,
                errors: lastResult.errors || [],
                createdAt: new Date(),
                userId: 'anonymous',
              });
            } catch (error) {
              console.warn('Failed to record execution in Central Memory:', error);
            }
          }

          break; // Exit loop
        }
      } catch (error) {
        console.error(`[ExecuteAsync] Execution error on attempt ${attempt}:`, error);

        // Si hay errores, intentar de nuevo si es posible
        if (attempt < maxAttempts) {
          const gaps = [
            {
              type: 'quality' as const,
              description: error instanceof Error ? error.message : String(error),
              severity: 'high' as const,
              suggestedAction: 'Retry with improved specification',
            },
          ];
          const metrics = { overallScore: 0, completeness: 0, quality: 0, performance: 0, issues: [String(error)] };
          const feedback = {
            gapDetected: true,
            gaps,
            metrics,
            shouldRetry: true,
            retryReason: String(error),
            improvementSuggestions: ['Refine specification and retry'],
          };

          const improvedSpec = await feedbackAnalyzer.generateImprovedSpec(spec, feedback);
          spec = improvedSpec;

          const skillPlan = mapSpecificationToSkills(improvedSpec);
          try {
            lastPlan = await createExecutionPlanAsync(improvedSpec, skillPlan);
          } catch (planError) {
            console.warn('Async plan creation failed, using fallback:', planError);
            lastPlan = createExecutionPlan(improvedSpec, skillPlan);
          }

          attempt++;
        } else {
          // Max attempts reached, report error
          const errorResult: ExecutionResult = {
            executionId: lastPlan.executionId,
            systemType: lastPlan.systemType,
            status: 'failed',
            agents: [],
            outputs: {},
            totalTime: Date.now() - startTime,
            completedAt: new Date().toISOString(),
            errors: [error instanceof Error ? error.message : String(error)],
          };

          executionsStore.set(lastPlan.executionId, errorResult);
          broadcastCompletion(lastPlan.executionId, errorResult);

          // Grabar error en Central Memory
          if (centralMemory) {
            try {
              const durationMs = Date.now() - startTime;
              await centralMemory.recordExecution({
                id: lastPlan.executionId,
                goal,
                spec: lastPlan as unknown as Record<string, unknown>,
                skillsUsed: lastPlan.agents.map((a) => a.id),
                durationMs,
                status: 'failed',
                results: {},
                errors: [error instanceof Error ? error.message : String(error)],
                createdAt: new Date(),
                userId: 'anonymous',
              });
            } catch (recordError) {
              console.warn('Failed to record error in Central Memory:', recordError);
            }
          }

          break;
        }
      }
    }
  });
}

function broadcastProgress(executionId: string, progress: ExecutionProgress) {
  wsConnections.forEach((ws) => {
    try {
      ws.send(
        JSON.stringify({
          type: 'progress',
          executionId,
          data: progress,
        })
      );
    } catch (e) {
      // Connection might be closed
    }
  });
}

function broadcastCompletion(executionId: string, result: ExecutionResult) {
  wsConnections.forEach((ws) => {
    try {
      ws.send(
        JSON.stringify({
          type: 'completed',
          executionId,
          data: result,
        })
      );
    } catch (e) {
      // Connection might be closed
    }
  });
}
