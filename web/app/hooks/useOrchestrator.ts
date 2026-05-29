import { useState, useCallback } from 'react';

export interface ExecutionStatus {
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: any[];
}

export interface ExecutionResult {
  executionId: string;
  systemType: number;
  status: 'completed' | 'failed';
  agents: any[];
  outputs: Record<string, unknown>;
  totalTime: number;
  completedAt: string;
}

export function useOrchestrator() {
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (systemType: 1 | 2 | 3 | 4, description: string, files: File[] = []) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'execute',
            payload: {
              systemType,
              description,
              files: files.map((f) => f.name),
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const executionId = data.executionId;

        setStatus({
          executionId,
          status: 'running',
          progress: [],
        });

        // Iniciar polling del progreso
        await pollProgress(executionId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsLoading(false);
      }
    },
    []
  );

  const pollProgress = useCallback(async (executionId: string) => {
    const maxAttempts = 300; // 5 minutos con polling cada segundo
    let attempts = 0;

    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        throw new Error('Execution timeout');
      }

      try {
        // Obtener estado
        const statusResponse = await fetch(
          `/api/orchestrator?executionId=${executionId}&type=getStatus`,
          { method: 'POST' }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setStatus({
            executionId,
            status: statusData.status,
            progress: statusData.progress || [],
          });
        }

        // Intentar obtener resultados
        const resultsResponse = await fetch(
          `/api/orchestrator?executionId=${executionId}&type=getResults`,
          { method: 'POST' }
        );

        if (resultsResponse.ok) {
          const resultData = await resultsResponse.json();
          setResult(resultData);
          setIsLoading(false);
          return;
        }

        if (resultsResponse.status === 202) {
          // Aún no completado, seguir polling
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return poll();
        }
      } catch (err) {
        console.error('Polling error:', err);
        // Continuar polling en caso de error temporal
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return poll();
      }
    };

    await poll();
  }, []);

  const reset = useCallback(() => {
    setStatus(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    execute,
    status,
    result,
    error,
    isLoading,
    reset,
  };
}
