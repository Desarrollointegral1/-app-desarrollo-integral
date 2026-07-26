"use client";

import { useEffect, useState } from "react";
import { LOCATION } from "../data";

export function HeroSection() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check viewport size for lazy video loading (Performance Spec)
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  return (
    <section id="hero">
      {/* Background Media: Poster eager-loaded, Video lazy on desktop only */}
      <div className="hero-video-wrap" aria-hidden="true">
        <img
          src="/web/espacio/gym.webp"
          alt=""
          className="hero-poster"
          fetchPriority="high"
          loading="eager"
        />
        {isDesktop && (
          <video
            className="hero-video"
            autoPlay
            muted
            playsInline
            loop
            preload="none"
          >
            <source src="/web/espacio/video.mp4" type="video/mp4" />
          </video>
        )}
        <div className="hero-video-overlay" />
      </div>

      {/* Content — un solo fade CSS del bloque completo */}
      <div className="hero-inner">
        <div className="hero-top">
          <p className="hero-eyebrow">El bienestar empieza con el movimiento</p>
        </div>

        <h1 className="hero-h1">
          <span className="hero-line">Entrenamiento personalizado</span>
          <span className="hero-line hero-line-em">para moverte, rendir y vivir mejor</span>
        </h1>

        <div className="hero-bottom">
          <p className="hero-desc">
            Evaluamos tu punto de partida, diseñamos un plan de entrenamiento y
            acompañamos cada sesión con seguimiento profesional y una plataforma propia.
          </p>

          <div className="hero-cta-col">
            <div className="hero-cta-group">
              <a href="#cierre" className="hero-cta hero-cta-primary">
                Solicitar evaluación
              </a>
              <a href="#metodo" className="hero-cta hero-cta-secondary">
                Conocer el método
              </a>
            </div>
            <p className="hero-microcopy">
              {LOCATION.address}, Belgrano · Respondemos en el día
            </p>
          </div>
        </div>
      </div>

      {/* Scroll hint visual */}
      <div className="hero-scroll-hint" aria-hidden="true">
        <span className="hero-scroll-line" />
      </div>
    </section>
  );
}

export default HeroSection;
