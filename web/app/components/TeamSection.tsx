"use client";

import { motion } from "framer-motion";
import { APP_URL } from "../data";

const ARIEL_CV = [
  "Licenciado en Actividad Física y Deportes",
  "Especialización en Biomecánica del Movimiento",
  "Faja Negra · Brazilian Jiu-Jitsu",
  "30+ años de experiencia clínica y deportiva",
  "Certificación en Bioimpedancia y Composición Corporal",
];

export function TeamSection() {
  return (
    <section id="equipo" className="ariel-section">

      {/* Left: photo */}
      <motion.div
        className="ariel-photo-col"
        initial={{ opacity: 0, scale: 1.04 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="ariel-photo-wrap">
          <img
            src="/web/equipo/ariel.jpg"
            alt="Ariel Rebisberger — Coach y entrenador de movimiento"
            className="ariel-photo"
            loading="lazy"
          />
          <div className="ariel-photo-gradient" aria-hidden="true" />
        </div>
      </motion.div>

      {/* Right: content */}
      <div className="ariel-content-col">

        <motion.p
          className="ariel-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          viewport={{ once: true, margin: "-60px" }}
        >
          Quién entrena
        </motion.p>

        <motion.h2
          className="ariel-name"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
          viewport={{ once: true, margin: "-60px" }}
        >
          Ariel<br /><em>Rebisberger</em>
        </motion.h2>

        <motion.p
          className="ariel-role"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.12 }}
          viewport={{ once: true, margin: "-60px" }}
        >
          Coach · Entrenador de Movimiento
        </motion.p>

        <motion.p
          className="ariel-bio"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.18 }}
          viewport={{ once: true, margin: "-60px" }}
        >
          30 años especializándose en fuerza, rendimiento y movimiento humano. Trabaja con atletas de elite, ejecutivos y personas en rehabilitación con una filosofía única: datos, personalización y resultados verificables. Sin atajos. Sin protocolos genéricos.
        </motion.p>

        {/* CV list */}
        <motion.ul
          className="ariel-cv"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.25 }}
          viewport={{ once: true, margin: "-60px" }}
          aria-label="Formación y experiencia"
        >
          {ARIEL_CV.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.28 + i * 0.07,
                ease: [0.23, 1, 0.32, 1],
              }}
              viewport={{ once: true, margin: "-60px" }}
            >
              {item}
            </motion.li>
          ))}
        </motion.ul>

        {/* Status + CTA */}
        <motion.div
          className="ariel-actions"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.55 }}
          viewport={{ once: true, margin: "-60px" }}
        >
          <span className="ariel-status">
            <span className="ariel-status-dot" aria-hidden="true" />
            Agenda completa
          </span>
          <a href={APP_URL} className="ariel-cta" target="_blank" rel="noopener noreferrer">
            Ver disponibilidad →
          </a>
        </motion.div>

      </div>
    </section>
  );
}

export default TeamSection;
