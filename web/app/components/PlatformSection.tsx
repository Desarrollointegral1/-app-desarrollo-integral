"use client";

import { Feature } from "../data";

interface PlatformSectionProps {
  features: Feature[];
}

export function PlatformSection({ features }: PlatformSectionProps) {
  return (
    <section id="plataforma" className="platform-section">
      <div className="container">
        <p className="section-eyebrow fade-in">La plataforma</p>
        <h2 className="section-h2 fade-in">Tu plan, tus datos, en un solo lugar</h2>
        <p className="section-body fade-in">
          La plataforma acompaña lo que pasa en el centro: registrás cada sesión, ves tu
          evolución y hablás directo con tu entrenador.
        </p>

        <div className="platform-grid">
          {features.map((feature) => (
            <div key={feature.title} className="feature-item fade-in">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default PlatformSection;
