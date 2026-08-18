"use client";

import { Location, HORARIOS } from "../data";

interface LocationSectionProps {
  location: Location;
}

export function LocationSection({ location }: LocationSectionProps) {
  return (
    <section id="espacio">
      <div className="container">
        <div className="espacio-grid">
          {/* Left: Space Description */}
          <div className="fade-in">
            <p className="espacio-eyebrow">El espacio</p>
            <p className="espacio-title">Un espacio diseñado para entrenar con foco.</p>
            <ul className="espacio-list">
              <li>Equipamiento orientado a rendimiento</li>
              <li>Espacios para fuerza y movilidad</li>
              <li>Ambiente sin distracciones</li>
            </ul>
          </div>

          {/* Right: Location & Map */}
          <div className="fade-in">
            <p className="espacio-eyebrow">Ubicación</p>
            <p className="ubicacion-address">{location.address}</p>
            <p className="ubicacion-detail">{location.floor} · {location.city}</p>
            <p className="ubicacion-detail">{HORARIOS.semana}</p>
            <p className="ubicacion-detail">{HORARIOS.sabado}</p>

            <div className="map-container">
              <iframe
                src={location.mapUrl}
                width="100%"
                height="220"
                style={{ border: 0, display: "block" }}
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
          </div>
        </div>
      </div>
    </section>
  );
}

export default LocationSection;
