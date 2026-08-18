"use client";

import { useEffect, useState } from "react";
import HeroLogoDraw from "./HeroLogoDraw";

export function HeroSection() {
  // El video se monta solo en desktop, solo si el usuario no pidió movimiento
  // reducido, y recién después de que la página cargó y el hilo está libre:
  // así no entra en la primera carga ni compite con el LCP (el poster ya
  // cubre el hero desde el primer frame).
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let armed = false;
    const decide = () => setShowVideo(armed && window.innerWidth >= 768 && !mq.matches);
    const arm = () => {
      armed = true;
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      if (idle) idle(decide);
      else setTimeout(decide, 1);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    window.addEventListener("resize", decide);
    mq.addEventListener("change", decide);
    return () => {
      window.removeEventListener("load", arm);
      window.removeEventListener("resize", decide);
      mq.removeEventListener("change", decide);
    };
  }, []);

  return (
    <section id="hero">
      {/* Fondo: poster eager (frame 0 del video), video lazy solo en desktop.
          Video: push-in lento sobre el gimnasio real, generado con Veo 3.1 a
          partir de un frame maestro compuesto sobre las fotos reales
          (marca/fotos-gimnasio/). Push-in + pull-back con crossfade, 15.5 s en
          loop sin corte, 1.7 MB, sin audio, sin gente. */}
      <div className="hero-video-wrap" aria-hidden="true">
        <img
          src="/web/espacio/hero-poster.webp"
          alt=""
          className="hero-poster"
          fetchPriority="high"
          loading="eager"
        />
        {showVideo && (
          <video className="hero-video" autoPlay muted playsInline loop preload="none">
            <source src="/web/espacio/hero.mp4" type="video/mp4" />
          </video>
        )}
        <div className="hero-video-overlay" />
      </div>

      {/* Escudo que se dibuja sobre el video al cargar (patrón Koumori) */}
      <HeroLogoDraw />

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
