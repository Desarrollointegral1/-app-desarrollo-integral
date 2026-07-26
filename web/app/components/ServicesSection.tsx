"use client";

import { Service } from "../data";

interface ServicesSectionProps {
  services: Service[];
}

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section id="areas">
      <div className="container">
        <p className="section-eyebrow fade-in">Áreas de trabajo</p>
        <h2 className="section-h2 fade-in">Servicios</h2>

        <div className="areas-grid">
          {services.map((service) => (
            <div key={service.title} className="area-item fade-in">
              <h3 className="area-title">{service.title}</h3>
              <p className="area-desc">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
