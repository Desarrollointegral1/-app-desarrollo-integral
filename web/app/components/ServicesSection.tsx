"use client";

import { Service } from "../data";

interface ServicesSectionProps {
  services: Service[];
}

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section id="areas">
      <div className="container">
        <p className="section-eyebrow fade-in">Nuestras modalidades</p>
        <h2 className="section-h2 fade-in">Cuatro formas de entrenar</h2>

        <div className="modalidades-grid">
          {services.map((service, i) => (
            <article key={service.title} className="modalidad-card fade-in">
              <div className="modalidad-media">
                <img
                  src={service.image}
                  srcSet={`${service.image.replace(".webp", "-720.webp")} 720w, ${service.image} 1200w`}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  alt={service.imageAlt}
                  loading="lazy"
                  decoding="async"
                  width={1200}
                  height={1607}
                />
              </div>
              <div className="modalidad-body">
                <span className="modalidad-num" aria-hidden="true">
                  {(i + 1).toString().padStart(2, "0")}
                </span>
                <h3 className="modalidad-title">{service.title}</h3>
                <p className="modalidad-chip">{service.chip}</p>
                <p className="modalidad-desc">{service.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
