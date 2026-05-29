"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AgentCard } from "@/app/components/AgentCard";
import { InputDialog } from "@/app/components/InputDialog";
import { ExecutionMonitor } from "@/app/components/ExecutionMonitor";
import { ResultsPanel } from "@/app/components/ResultsPanel";

export default function WebStudio() {
  const [selectedSystem, setSelectedSystem] = useState<1 | 2 | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const systems = [
    {
      id: 1 as const,
      title: "Sistema 1: Mejorar Web",
      description: "Optimiza, moderniza y mejora tu página web existente",
      icon: "⚡",
    },
    {
      id: 2 as const,
      title: "Sistema 2: Crear Web",
      description: "Crea una página web nueva desde cero con especificaciones",
      icon: "✨",
    },
  ];

  const handleSystemSelect = (systemId: 1 | 2) => {
    setSelectedSystem(systemId);
    setIsDialogOpen(true);
  };

  const handleInputSubmit = async (description: string, files: File[]) => {
    if (!selectedSystem) return;

    setIsDialogOpen(false);
    setIsExecuting(true);

    try {
      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "execute",
          payload: {
            systemType: selectedSystem,
            description,
            files: files.map((f) => f.name),
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to start execution");

      const data = await response.json();
      setExecutionId(data.executionId);
    } catch (error) {
      console.error("Execution error:", error);
      setIsExecuting(false);
    }
  };

  const handleExecutionComplete = (result: any) => {
    setResult(result);
    setIsExecuting(false);
  };

  const handleDownload = () => {
    console.log("Downloading results...");
    // Implementar descarga de archivos
  };

  const handleCreatePR = () => {
    console.log("Creating pull request...");
    // Implementar creación de PR
  };

  const handleDeploy = () => {
    console.log("Deploying...");
    // Implementar deployment
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🎨 Web Studio
          </h1>
          <p className="text-gray-400 text-lg">
            Selecciona un agente para mejorar o crear tu página web
          </p>
        </motion.div>

        {!result && !isExecuting && (
          <>
            {/* Agent Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {systems.map((system) => (
                <AgentCard
                  key={system.id}
                  id={system.id.toString()}
                  title={system.title}
                  description={system.description}
                  icon={system.icon}
                  isSelected={selectedSystem === system.id}
                  onClick={() => handleSystemSelect(system.id)}
                />
              ))}
            </div>

            {/* Help Text */}
            {selectedSystem && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-gold text-sm"
              >
                ↑ Haz clic en la tarjeta para continuar
              </motion.div>
            )}
          </>
        )}

        {/* Execution Monitor */}
        {isExecuting && executionId && (
          <ExecutionMonitor
            executionId={executionId}
            isVisible={true}
            onComplete={handleExecutionComplete}
          />
        )}

        {/* Results Panel */}
        {result && (
          <ResultsPanel
            result={result}
            isVisible={true}
            onDownload={handleDownload}
            onCreatePR={handleCreatePR}
            onDeploy={handleDeploy}
          />
        )}
      </div>

      {/* Input Dialog */}
      <InputDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleInputSubmit}
        systemType={selectedSystem || 1}
      />
    </div>
  );
}
