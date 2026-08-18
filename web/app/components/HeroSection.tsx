"use client";

import { useEffect, useState } from "react";

export function HeroSection() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsDesktop(window.innerWidth >= 768);
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  return (
    <section id="hero">
      {/* Fondo: poster eager (frame 0 del video), video lazy solo en desktop.
          Video: push-in lento sobre el gimnasio real, generado con Veo 3.1 a
          partir de un frame maestro compuesto sobre las fotos reales
          (marca/fotos-gimnasio/). 8s, 1.3 MB, sin audio, sin gente. */}
      <div className="hero-video-wrap" aria-hidden="true">
        <img
          src="/web/espacio/hero-poster.webp"
          alt=""
          className="hero-poster"
          fetchPriority="high"
          loading="eager"
        />
        {isDesktop && (
          <video className="hero-video" autoPlay muted playsInline loop preload="none">
            <source src="/web/espacio/hero.mp4" type="video/mp4" />
          </video>
        )}
        <div className="hero-video-overlay" />
      </div>

      {/* Fórmula Equinox: título dominante + una línea + un solo CTA */}
      <div className="hero-inner">
        <h1 className="hero-h1">
          <span className="hero-line">Entrenamiento</span>
          <span className="hero-line">personalizado</span>
          <span className="hero-line">de precisión</span>
        </h1>
        <p className="hero-tagline">El bienestar empieza con el movimiento.</p>
        <a href="#cierre" className="hero-cta hero-cta-primary">
          Solicitar evaluación
        </a>
      </div>
    </section>
  );
}

export default HeroSection;
