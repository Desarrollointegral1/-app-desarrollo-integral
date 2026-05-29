"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function StudiosCTA() {
  return (
    <section className="relative py-20 px-4 bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-12 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/5 to-gold/0"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              🚀 Studios Inteligentes
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Automatización completa de tus proyectos digitales. Carga un archivo o
              descripción, elige un agente, y deja que nuestro sistema inteligente
              maneje todo el trabajo.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="p-6 rounded-lg bg-blue-900/20 border border-blue-500/30">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-lg font-semibold text-white mb-2">Web Studio</h3>
              <p className="text-gray-400 text-sm mb-4">
                Mejora tu web existente o crea una nueva desde cero
              </p>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>✓ Rediseño completo</li>
                <li>✓ Optimización de performance</li>
                <li>✓ Mejora de UX/UI</li>
              </ul>
            </div>

            <div className="p-6 rounded-lg bg-purple-900/20 border border-purple-500/30">
              <div className="text-3xl mb-3">💻</div>
              <h3 className="text-lg font-semibold text-white mb-2">App Studio</h3>
              <p className="text-gray-400 text-sm mb-4">
                Crea apps full-stack o mejora las existentes
              </p>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>✓ Full-stack (frontend + backend + BD)</li>
                <li>✓ Auditoría de seguridad</li>
                <li>✓ Optimización de APIs</li>
              </ul>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/studios"
              className="px-8 py-4 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all duration-300 hover:shadow-lg hover:shadow-gold/30 text-center"
            >
              Acceder a Studios →
            </Link>
            <Link
              href="#identidad"
              className="px-8 py-4 border-2 border-gold text-gold font-semibold rounded-lg hover:bg-gold/10 transition-all duration-300 text-center"
            >
              Conocer Más
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
