"use client";

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
      <div className="ariel-photo-col fade-in">
        <div className="ariel-photo-wrap">
          <img
            src="/web/equipo/ariel.jpg"
            alt="Ariel Rebisberger — Head Coach de Desarrollo Integral"
            className="ariel-photo"
            loading="lazy"
          />
          <div className="ariel-photo-gradient" aria-hidden="true" />
        </div>
      </div>

      {/* Right: content */}
      <div className="ariel-content-col fade-in">
        <p className="ariel-eyebrow">Quién entrena</p>

        <h2 className="ariel-name">
          Ariel<br />
          <em>Rebisberger</em>
        </h2>

        <p className="ariel-role">Head Coach · Desarrollo Integral</p>

        <p className="ariel-bio">
          30 años especializándose en fuerza, rendimiento y movimiento humano. Trabaja
          con atletas de elite, ejecutivos y personas en rehabilitación con una
          filosofía única: datos, personalización y resultados verificables. Sin
          atajos. Sin protocolos genéricos.
        </p>

        {/* CV list */}
        <ul className="ariel-cv" aria-label="Formación y experiencia">
          {ARIEL_CV.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        {/* CTA */}
        <div className="ariel-actions">
          <a href={APP_URL} className="ariel-cta" target="_blank" rel="noopener noreferrer">
            Ver disponibilidad →
          </a>
        </div>
      </div>
    </section>
  );
}

export default TeamSection;
