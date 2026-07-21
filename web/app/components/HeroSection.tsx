"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { APP_URL } from "../data";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check viewport size for lazy video loading (Performance Spec)
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);

    // GSAP entrance animation — envuelta en context para que StrictMode
    // (doble montaje del efecto en dev) no deje los elementos en opacity 0
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 });

      tl.from(".hero-trust-badge", {
        opacity: 0,
        y: -12,
        duration: 0.5,
        ease: "power2.out"
      })
        .from(".hero-eyebrow", {
          opacity: 0,
          y: 16,
          duration: 0.6,
          ease: "power3.out"
        }, "-=0.2")
        .from(".hero-line", {
          opacity: 0,
          y: 48,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out"
        }, "-=0.3")
        .from(".hero-stats-integrated", {
          opacity: 0,
          y: 20,
          duration: 0.7,
          ease: "power3.out"
        }, "-=0.4")
        .from(".hero-cta-primary", {
          opacity: 0,
          y: 16,
          scale: 0.95,
          duration: 0.6,
          ease: "back.out(1.4)"
        }, "-=0.3")
        .from(".hero-trust-subtext", {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out"
        }, "-=0.2");
    }, sectionRef);

    return () => {
      window.removeEventListener("resize", checkViewport);
      ctx.revert();
    };
  }, []);

  return (
    <section id="hero" ref={sectionRef}>
      {/* Background Media: Poster eager-loaded, Video lazy on desktop only */}
      <div className="hero-video-wrap" aria-hidden="true">
        <img 
          src="/web/espacio/gym.jpg" 
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
            <source src="/web/espacio/video.webm" type="video/webm" />
            <source src="/web/espacio/video.mp4" type="video/mp4" />
          </video>
        )}
        <div className="hero-video-overlay" />
      </div>

      {/* Content Grid */}
      <div className="hero-inner">
        
        {/* Trust Badge Superior (Security Spec) */}
        <div className="hero-trust-badge">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1L9 5L13 5.5L10 8.5L11 13L7 10.5L3 13L4 8.5L1 5.5L5 5L7 1Z" 
                  fill="currentColor" opacity="0.9"/>
          </svg>
          <span>Datos protegidos · SSL Verificado</span>
        </div>

        {/* Location eyebrow */}
        <div className="hero-top">
          <p className="hero-eyebrow">Belgrano · Buenos Aires</p>
        </div>

        {/* Propuesta de Valor Clara (Design Spec) */}
        <h1 className="hero-h1" aria-label="Transformá tu físico en 90 días">
          <span className="hero-line">Transformá tu físico</span>
          <span className="hero-line hero-line-em">en 90 días</span>
        </h1>
        <p className="hero-subtitle">
          Entrenamiento personalizado + nutrición + seguimiento semanal
        </p>

        {/* Stats Grid INTEGRATED Above-the-fold (Analytics Spec) */}
        <div className="hero-stats-integrated">
          <div className="hero-stat-item">
            <div className="hero-stat-value">+500</div>
            <div className="hero-stat-label">transformaciones</div>
          </div>
          <div className="hero-stat-item">
            <div className="hero-stat-value">15 años</div>
            <div className="hero-stat-label">en Belgrano</div>
          </div>
          <div className="hero-stat-item">
            <div className="hero-stat-value">4.9★</div>
            <div className="hero-stat-label">Google Reviews</div>
          </div>
        </div>

        {/* SINGLE PRIMARY CTA (Design Spec - eliminando CTA secundario) */}
        <div className="hero-cta-container">
          <a 
            href={APP_URL} 
            className="hero-cta hero-cta-primary" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Agenda tu evaluación gratuita de 30 minutos sin compromiso"
          >
            <span className="hero-cta-main">Agenda tu Evaluación Gratuita</span>
            <span className="hero-cta-subtext">30 min · Sin compromiso · Hoy mismo</span>
            <span className="hero-cta-arrow" aria-hidden="true">→</span>
          </a>
        </div>

        {/* Trust Signal Secundario (Security/Design Spec) */}
        <p className="hero-trust-subtext">
          <span>✓ Primera clase gratis</span>
          <span className="hero-trust-divider">·</span>
          <span>✓ Cancelación flexible</span>
        </p>

      </div>

      {/* Scroll hint visual */}
      <div className="hero-scroll-hint" aria-hidden="true">
        <span className="hero-scroll-line" />
      </div>
    </section>
  );
}

export default HeroSection;
