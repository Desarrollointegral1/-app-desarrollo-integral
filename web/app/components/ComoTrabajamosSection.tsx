"use client";

import { ComoTrabajamosPoint } from "../data";

interface ComoTrabajamosSectionProps {
  points: ComoTrabajamosPoint[];
}

export function ComoTrabajamosSection({ points }: ComoTrabajamosSectionProps) {
  return (
    <section id="como-trabajamos">
      <div className="container">
        <p className="section-eyebrow fade-in">Detrás de cada plan</p>
        <h2 className="section-h2 fade-in" style={{ marginBottom: 64 }}>
          Cómo trabajamos
        </h2>

        <ul className="identidad-list fade-in" style={{ maxWidth: 880 }}>
          {points.map((point, i) => (
            <li key={point.title}>
              <span className="list-num">{(i + 1).toString().padStart(2, "0")}.</span>
              <span className="list-text">
                <strong>{point.title}</strong> · {point.desc}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default ComoTrabajamosSection;
