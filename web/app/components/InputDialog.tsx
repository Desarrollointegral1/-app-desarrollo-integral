"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string, files: File[]) => void;
  systemType: 1 | 2 | 3 | 4;
}

const SYSTEM_PROMPTS = {
  1: "Describe los cambios que deseas hacer en tu página web (mejor performance, nuevo diseño, más funcionalidades, etc.)",
  2: "Describe tu proyecto: industria, objetivo, target audience, características principales",
  3: "Describe tu aplicación: funcionalidades principales, usuarios target, requisitos técnicos",
  4: "Describe los problemas y mejoras deseadas en tu app (performance, UX, seguridad, nuevas features)",
};

export function InputDialog({
  isOpen,
  onClose,
  onSubmit,
  systemType,
}: InputDialogProps) {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsLoading(true);
    try {
      onSubmit(description, files);
      setDescription("");
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-xl bg-gray-900 border border-gold/20 rounded-lg shadow-2xl">
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {systemType === 1 && "Mejorar tu Página Web"}
                    {systemType === 2 && "Crear Nueva Página Web"}
                    {systemType === 3 && "Crear Nueva Aplicación"}
                    {systemType === 4 && "Mejorar tu Aplicación"}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {SYSTEM_PROMPTS[systemType]}
                  </p>
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descripción del Proyecto
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Cuéntanos qué necesitas..."
                    className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-transparent resize-none"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {description.length} caracteres
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Archivos (Opcional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".zip,.pdf,.png,.jpg,.jsx,.tsx,.ts,.js,.html,.css"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gold/30 rounded-lg text-gold hover:border-gold/60 hover:bg-gold/5 transition-all duration-300"
                  >
                    + Cargar Archivos
                  </button>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-gray-800/50 rounded text-sm"
                        >
                          <span className="text-gray-300 truncate">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="text-gray-500 hover:text-red-400 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!description.trim() || isLoading}
                    className="flex-1 px-4 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Enviando..." : "Ejecutar"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
