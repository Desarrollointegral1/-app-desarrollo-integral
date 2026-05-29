"use client";

import { motion } from "framer-motion";

interface ResultsPanelProps {
  result: any;
  isVisible: boolean;
  onDownload: () => void;
  onCreatePR: () => void;
  onDeploy: () => void;
}

export function ResultsPanel({
  result,
  isVisible,
  onDownload,
  onCreatePR,
  onDeploy,
}: ResultsPanelProps) {
  if (!isVisible || !result) return null;

  const successCount = result.agents?.filter(
    (a: any) => a.status === "completed"
  ).length || 0;
  const totalCount = result.agents?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-8 bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/30 rounded-lg"
    >
      {/* Status */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-xl font-bold text-green-400">
            ¡Ejecución Completada!
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-white/5 rounded">
            <p className="text-gray-400 text-xs uppercase">Agentes</p>
            <p className="text-2xl font-bold text-white">
              {successCount}/{totalCount}
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded">
            <p className="text-gray-400 text-xs uppercase">Tiempo</p>
            <p className="text-2xl font-bold text-white">
              {Math.round((result.totalTime || 0) / 1000)}s
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded">
            <p className="text-gray-400 text-xs uppercase">Estado</p>
            <p className="text-2xl font-bold text-green-400">✓ Listo</p>
          </div>
        </div>
      </div>

      {/* Agent Summary */}
      <div className="mb-6 p-4 bg-gray-900/50 rounded border border-gray-700/30">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">
          Agentes Ejecutados
        </h4>
        <div className="space-y-2">
          {result.agents?.map((agent: any) => (
            <div
              key={agent.agentId}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-400">{agent.agentId}</span>
              <span className="text-green-400">✓</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={onDownload}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          📥 Descargar Resultados
        </button>

        <button
          onClick={onCreatePR}
          className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
        >
          🔀 Crear Pull Request
        </button>

        <button
          onClick={onDeploy}
          className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
        >
          🚀 Desplegar
        </button>
      </div>

      {/* More Details */}
      <div className="mt-4 p-3 bg-gray-800/30 rounded text-xs text-gray-400">
        <p>
          Execution ID: <code className="text-gray-300">{result.executionId}</code>
        </p>
        <p className="mt-1">
          Completado: {new Date(result.completedAt).toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}
