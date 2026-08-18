"use client";

import { IdentityPillar } from "../data";

interface IdentitySectionProps {
  pillars: IdentityPillar[];
}

export function IdentitySection({ pillars }: IdentitySectionProps) {
  return (
    <section id="identidad">
      <div className="container">
        <p className="identidad-eyebrow fade-in">Qué es Desarrollo Integral</p>

        <div className="identidad-grid fade-in">
          <div>
            <p className="identidad-quote">
              &ldquo;Un método de trabajo construido a partir de más de 30 años de experiencia.&rdquo;
            </p>
            <p className="identidad-body">
              No se trabaja con planes genéricos. Cada alumno entrena con un plan personalizado, diseñado según su punto de partida, sus objetivos y su evolución. El foco está en construir un cuerpo fuerte, funcional y adaptable en el tiempo.
            </p>
          </div>

          <ul className="identidad-list">
            {pillars.map((pillar) => (
              <li key={pillar.number}>
                <span className="list-num">{pillar.number.toString().padStart(2, "0")}.</span>
                <span className="list-text">
                  <strong>{pillar.title}</strong> · {pillar.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default IdentitySection;
