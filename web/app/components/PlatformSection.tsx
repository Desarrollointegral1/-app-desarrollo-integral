"use client";

import { motion } from "framer-motion";
import { Feature } from "../data";

interface PlatformSectionProps {
  features: Feature[];
}

// Minimal SVG icons — one per feature slot
const FEATURE_ICONS = [
  // Bioimpedancia
  <svg key="bio" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M2 14l4-4 4 4 4-8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  // Entrenamiento / cargas
  <svg key="train" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="4" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 10h8M1 10h2M17 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  // Gráficos / análisis
  <svg key="graph" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 15l4-5 4 3 4-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  // Comunicación
  <svg key="comm" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H7l-4 2V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  // Planes / periodización
  <svg key="plan" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 8h14M8 8v9" stroke="currentColor" strokeWidth="1.5"/>
  </svg>,
  // Acceso / mobile
  <svg key="mobile" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="6" y="2" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="15.5" r="0.75" fill="currentColor"/>
  </svg>,
];

// Strip emoji prefix from feature title (format: "Emoji · Title: desc")
function cleanTitle(title: string): string {
  return title.replace(/^[\u{1F300}-\u{1FFFF}][\s·]*/u, "").split(":")[0].trim();
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
              className="feature-item fade-in"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 100,
                delay: i * 0.07,
              }}
              viewport={{ once: true, margin: "-80px" }}
              whileHover={{ y: -4, transition: { duration: 0.18 } }}
            >
              <div className="feature-icon-wrap" aria-hidden="true">
                {FEATURE_ICONS[i] ?? FEATURE_ICONS[0]}
              </div>
              <h3 className="feature-title">{cleanTitle(feature.title)}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default PlatformSection;
