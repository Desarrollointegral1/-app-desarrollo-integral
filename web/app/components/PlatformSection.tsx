"use client";

import { motion } from "framer-motion";
import { Feature } from "../data";

interface PlatformSectionProps {
  features: Feature[];
}

export function PlatformSection({ features }: PlatformSectionProps) {
  return (
    <section id="plataforma" className="platform-section">
      <div className="container">
        <p className="section-eyebrow blur-reveal">Herramientas</p>
        <h2 className="section-h2 mask-reveal">La Plataforma</h2>
        <p className="section-body fade-in reveal-d1">
          Herramientas integradas para que el coaching sea medible, transparente y eficaz.
        </p>

        <div className="platform-grid">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="feature-item"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: i * 0.06,
                ease: [0.23, 1, 0.32, 1],
              }}
              viewport={{ once: true, margin: "-80px" }}
            >
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default PlatformSection;
