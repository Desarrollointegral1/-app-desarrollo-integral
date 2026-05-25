"use client";

import { motion } from "framer-motion";
import { Service } from "../data";

interface ServicesSectionProps {
  services: Service[];
}

// One minimal SVG per service
const SERVICE_ICONS = [
  // Entrenamiento
  <svg key="s1" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="5" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="19" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7.5 12h9M1 12h3M20 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  // Combate
  <svg key="s2" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 6l8 12M16 6L8 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
  </svg>,
  // Salud
  <svg key="s3" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21C12 21 4 15 4 9a4 4 0 018-2.83A4 4 0 0120 9c0 6-8 12-8 12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>,
];

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section id="areas">
      <div className="container">
        <p className="section-eyebrow blur-reveal">Áreas de trabajo</p>
        <h2 className="section-h2 mask-reveal">Servicios</h2>

        <div className="areas-grid">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              className="area-item fade-in"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 100,
                delay: i * 0.12,
              }}
              viewport={{ once: true, margin: "-80px" }}
            >
              <div className="area-icon-wrap" aria-hidden="true">
                {SERVICE_ICONS[i] ?? SERVICE_ICONS[0]}
              </div>
              <h3 className="area-title">{service.title}</h3>
              <p className="area-desc">{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
