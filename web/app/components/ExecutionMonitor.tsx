"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Agent {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  error?: string;
}

interface ExecutionMonitorProps {
  executionId: string;
  isVisible: boolean;
  onComplete: (result: any) => void;
}

export function ExecutionMonitor({
  executionId,
  isVisible,
  onComplete,
}: ExecutionMonitorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [status, setStatus] = useState<"running" | "completed" | "failed">(
    "running"
  );

  useEffect(() => {
    if (!isVisible || !executionId) return;

    // Conectar WebSocket para recibir updates
    const ws = new WebSocket(
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
    );

    const pollProgress = async () => {
      try {
        const response = await fetch(
          `/api/orchestrator?executionId=${executionId}&type=getStatus`
        );
        if (!response.ok) return;

        const data = await response.json();
        if (data.progress) {
          updateAgentProgress(data.progress);
        }

        // Chequear si está completado
        if (status !== "completed") {
          const resultsResponse = await fetch(
            `/api/orchestrator?executionId=${executionId}&type=getResults`
          );
          if (resultsResponse.ok) {
            const result = await resultsResponse.json();
            setStatus("completed");
            onComplete(result);
          }
        }
      } catch (error) {
        console.error("Error polling progress:", error);
      }
    };

    const interval = setInterval(pollProgress, 1000);
    return () => clearInterval(interval);
  }, [executionId, isVisible, status, onComplete]);

  const updateAgentProgress = (progress: any[]) => {
    setAgents(progress);

    // Calcular progreso general
    const totalProgress =
      progress.length > 0
        ? Math.round(
            progress.reduce((sum, a) => sum + a.progress, 0) / progress.length
          )
        : 0;

    setOverallProgress(totalProgress);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 bg-gradient-to-br from-gray-900 to-gray-800 border border-gold/20 rounded-lg"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">
            Ejecutando Agentes...
          </h3>
          <span className="text-sm text-gold font-mono">{overallProgress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ type: "spring", stiffness: 30 }}
            className="h-full bg-gradient-to-r from-gold to-gold/60"
          />
        </div>
      </div>

      {/* Agent List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 bg-gray-800/50 rounded border border-gray-700/50"
          >
            <div className="flex items-center gap-3 mb-2">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {agent.status === "completed" && (
                  <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                    <span className="text-green-500 text-xs">✓</span>
                  </div>
                )}
                {agent.status === "running" && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-5 h-5 rounded-full border-2 border-gold/30 border-t-gold"
                  />
                )}
                {agent.status === "pending" && (
                  <div className="w-5 h-5 rounded-full bg-gray-700" />
                )}
                {agent.status === "failed" && (
                  <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center">
                    <span className="text-red-500 text-xs">!</span>
                  </div>
                )}
              </div>

              {/* Agent Name */}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-300">
                  {agent.name}
                </p>
              </div>

              {/* Progress Percentage */}
              <span className="text-xs text-gray-500 font-mono">
                {agent.progress}%
              </span>
            </div>

            {/* Progress Bar per agent */}
            {agent.status === "running" && (
              <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${agent.progress}%` }}
                  transition={{ type: "spring", stiffness: 50 }}
                  className="h-full bg-gold/60"
                />
              </div>
            )}

            {/* Error message */}
            {agent.error && (
              <p className="text-xs text-red-400 mt-2">{agent.error}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-400">
        <p>
          Completados: {agents.filter((a) => a.status === "completed").length} /{" "}
          {agents.length}
        </p>
      </div>
    </motion.div>
  );
}
