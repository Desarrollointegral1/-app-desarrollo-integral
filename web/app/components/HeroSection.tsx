"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { APP_URL } from "../data";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.from(".hero-eyebrow", { opacity: 0, y: 16, duration: 0.7, ease: "power3.out" })
      .from(".hero-line", { opacity: 0, y: 60, duration: 1.0, stagger: 0.12, ease: "power3.out" }, "-=0.3")
      .from(".hero-desc", { opacity: 0, y: 20, duration: 0.7, ease: "power3.out" }, "-=0.5")
      .from(".hero-cta", { opacity: 0, y: 16, duration: 0.5, ease: "power3.out" }, "-=0.4")
      .from(".hero-scroll-hint", { opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.2");
  }, []);

  return (
    <section id="hero" ref={sectionRef}>
      {/* Video Background */}
      <div className="hero-video-wrap" aria-hidden="true">
        <video
          className="hero-video"
          poster="/espacio/gym.jpg"
          autoPlay
          muted
          playsInline
          loop
          preload="none"
        >
          <source src="/espacio/video.webm" type="video/webm" />
          <source src="/espacio/video.mp4" type="video/mp4" />
        </video>
        <div className="hero-video-overlay" />
      </div>

      {/* Content */}
      <div className="hero-inner">
        {/* Top row: eyebrow */}
        <div className="hero-top">
          <p className="hero-eyebrow">Belgrano · Buenos Aires</p>
        </div>

        {/* Main heading */}
        <h1 className="hero-h1" aria-label="El bienestar empieza con el movimiento">
          <span className="hero-line">El bienestar</span>
          <span className="hero-line hero-line-em">empieza con</span>
          <span className="hero-line">el movimiento.</span>
        </h1>

        {/* Bottom row: desc + CTA */}
        <div className="hero-bottom">
          <p className="hero-desc">
            Entrenamiento personalizado basado en datos.<br />
            Más de 30 años de experiencia. Sin suposiciones.
          </p>
          <div className="hero-cta-group">
            <a href={APP_URL} className="hero-cta hero-cta-primary" target="_blank" rel="noopener noreferrer">
              <span className="hero-cta-label">Ir al aplicativo</span>
              <span className="hero-cta-arrow" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 16L16 4M16 4H6M16 4V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </a>
            <a href="#identidad" className="hero-cta hero-cta-secondary">
              <span>Saber más</span>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="hero-scroll-hint" aria-hidden="true">
        <span className="hero-scroll-line" />
      </div>
    </section>
  );
}

export default HeroSection;
