"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { SHIELD_W, LOGO_WHITE, APP_URL } from "../data";
import RippleButton from "./RippleButton";

export function HeroSection() {
  useEffect(() => {
    // GSAP Timeline for hero entrance
    const tl = gsap.timeline();

    tl.from(".hero-eyebrow", {
      opacity: 0,
      y: -20,
      duration: 0.6,
      ease: "power3.out",
    })
      .from(
        ".hero-h1",
        {
          opacity: 0,
          y: 40,
          duration: 1.2,
          stagger: 0.08,
          ease: "power3.out",
        },
        "-=0.3"
      )
      .from(
        ".hero-desc",
        {
          opacity: 0,
          filter: "blur(10px)",
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.6"
      )
      .from(
        ".hero-cta",
        {
          opacity: 0,
          scale: 0.95,
          duration: 0.6,
          ease: "back.out(1.7)",
        },
        "-=0.4"
      );

    // Shield infinite rotation
    gsap.to(".shield-spin", {
      rotation: 360,
      duration: 6,
      repeat: -1,
      ease: "none",
    });

    // Shield glow pulsing effect - using opacity for simplicity
    gsap.to(".shield-glow", {
      opacity: [0.3, 0.8, 0.3],
      duration: 4,
      repeat: -1,
      ease: "sine.inOut",
    } as any);
  }, []);

  return (
    <section id="hero">
      {/* Shield Background */}
      <div className="hero-shield">
        <div className="shield-spin-wrap">
          <img
            className="shield-spin shield-glow"
            src={SHIELD_W}
            alt=""
            width={700}
            style={{ opacity: 0.4 }}
          />
        </div>
      </div>

      {/* Hero Content */}
      <div className="hero-inner">
        {/* Logo */}
        <div className="hero-logo-wrapper" style={{ marginBottom: 48 }}>
          <img
            src={LOGO_WHITE}
            alt="Desarrollo Integral"
            height={60}
            width="auto"
            style={{ display: "block" }}
          />
        </div>

        {/* Eyebrow */}
        <p className="hero-eyebrow">Wellness starts with movement</p>

        {/* Main Heading */}
        <h1 className="hero-h1">
          Fuerza, <span>movimiento</span>
          <span className="smaller">y rendimiento</span>
        </h1>

        {/* Description + CTA */}
        <div className="hero-bottom">
          <p className="hero-desc">
            Entrenamiento personalizado basado en datos. Cada plan se adapta a
            tu punto de partida y tus objetivos. Sin suposiciones. Sin
            generalismos. Solo resultados verificables.
          </p>
          <RippleButton as="a" href={APP_URL} className="hero-cta" target="_blank" rel="noopener">
            <span>Ir a Aplicativo</span>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                d="M6 26L26 6M26 6H9M26 6V23"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </RippleButton>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
