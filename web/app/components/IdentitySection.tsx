"use client";

import { motion } from "framer-motion";
import { IdentityPillar } from "../data";

interface IdentitySectionProps {
  pillars: IdentityPillar[];
}

export function IdentitySection({ pillars }: IdentitySectionProps) {
  return (
    <section id="identidad">
      <div className="container">
        <p className="identidad-eyebrow blur-reveal">Qué es Desarrollo Integral</p>

        <motion.div
          className="identidad-grid"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="fade-in">
            <p className="identidad-quote">
              &ldquo;Un método de trabajo construido a partir de más de 30 años de experiencia.&rdquo;
            </p>
            <p className="identidad-body">
              No se trabaja con planes genéricos. Cada alumno entrena con un plan personalizado, diseñado según su punto de partida, sus objetivos y su evolución. El foco está en construir un cuerpo fuerte, funcional y adaptable en el tiempo.
            </p>
          </div>

          <ul className="identidad-list fade-in">
            {pillars.map((pillar, i) => (
              <motion.li
                key={pillar.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 100,
                  delay: i * 0.1,
                }}
                viewport={{ once: true }}
              >
                <span className="list-num">{pillar.number.toString().padStart(2, "0")}.</span>
                <span className="list-text">
                  <strong>{pillar.title}</strong> · {pillar.description}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

export default IdentitySection;
