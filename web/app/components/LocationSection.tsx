"use client";

import { motion } from "framer-motion";
import { Location } from "../data";

interface LocationSectionProps {
  location: Location;
}

export function LocationSection({ location }: LocationSectionProps) {
  return (
    <section id="espacio">
      <div className="container">
        <div className="espacio-grid">
          {/* Left: Space Description */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 100,
            }}
            viewport={{ once: true }}
            className="fade-in"
          >
            <p className="espacio-eyebrow">El espacio</p>
            <p className="espacio-title">Un espacio diseñado para entrenar con foco.</p>
            <ul className="espacio-list">
              <li>Equipamiento orientado a rendimiento</li>
              <li>Espacios para fuerza y movilidad</li>
              <li>Ambiente sin distracciones</li>
            </ul>
          </motion.div>

          {/* Right: Location & Map */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 100,
            }}
            viewport={{ once: true }}
            className="fade-in"
          >
            <p className="espacio-eyebrow">Ubicación</p>
            <p className="ubicacion-address">{location.address}</p>
            <p className="ubicacion-detail">{location.floor} · {location.city}</p>

            <div className="map-container">
              <iframe
                src={location.mapUrl}
                width="100%"
                height="220"
                style={{ border: 0, display: "block", borderRadius: "8px" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Desarrollo Integral"
              />
              <a
                href={`https://maps.google.com/?q=${location.address},${location.city}`}
                target="_blank"
                rel="noopener noreferrer"
                className="map-link"
              >
                Ver en Google Maps →
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default LocationSection;
