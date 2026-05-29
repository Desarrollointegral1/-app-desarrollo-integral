"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function StudiosDashboard() {
  const studios = [
    {
      id: "web-studio",
      title: "🎨 Web Studio",
      description: "Mejora o crea páginas web con inteligencia artificial",
      systems: ["Sistema 1: Mejorar Web", "Sistema 2: Crear Web Nueva"],
      gradient: "from-blue-600 to-blue-400",
      link: "/studios/web-studio",
    },
    {
      id: "app-studio",
      title: "💻 App Studio",
      description: "Crea o mejora aplicaciones full-stack con IA",
      systems: ["Sistema 3: Crear App", "Sistema 4: Mejorar App"],
      gradient: "from-purple-600 to-purple-400",
      link: "/studios/app-studio",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            🎬 Studios Orquestados
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Plataforma de automatización inteligente. Selecciona un Studio para
            comenzar tu proyecto
          </p>
        </motion.div>

        {/* Studios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {studios.map((studio, idx) => (
            <motion.div
              key={studio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link href={studio.link}>
                <div className="group relative h-full p-8 rounded-xl border border-white/10 hover:border-gold/50 transition-all duration-300 hover:shadow-2xl hover:shadow-gold/10 cursor-pointer">
                  {/* Background Gradient */}
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-br ${studio.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-3">
                      {studio.title}
                    </h2>

                    <p className="text-gray-400 mb-6">{studio.description}</p>

                    {/* Systems List */}
                    <div className="space-y-2 mb-8">
                      {studio.systems.map((system) => (
                        <div key={system} className="flex items-center gap-2">
                          <span className="text-gold">→</span>
                          <span className="text-gray-300 text-sm">{system}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gold/10 border border-gold/30 group-hover:bg-gold/20 group-hover:border-gold text-gold rounded-lg transition-all duration-300">
                      <span className="font-semibold">Ingresar</span>
                      <span className="group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto p-8 bg-gray-900/50 border border-gold/20 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            ✨ Características
          </h3>
          <ul className="space-y-3 text-gray-300 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-gold mt-1">•</span>
              <span>
                Mapeo automático de requisitos a 27+ skills especializados
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gold mt-1">•</span>
              <span>
                Ejecución paralela inteligente de agentes según dependencias
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gold mt-1">•</span>
              <span>
                Monitoreo en tiempo real del progreso de cada agente
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gold mt-1">•</span>
              <span>
                Resultados compilados listos para descargar, PR o deploy
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
