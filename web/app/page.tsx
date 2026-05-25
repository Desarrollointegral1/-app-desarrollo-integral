"use client";

import { useEffect } from "react";
import HeroSection from "./components/HeroSection";
import StatsGrid from "./components/StatsGrid";
import MethodSection from "./components/MethodSection";
import PlatformSection from "./components/PlatformSection";
import TeamSection from "./components/TeamSection";
import TestimonialSlider from "./components/TestimonialSlider";
import CTAForm from "./components/CTAForm";
import ServicesSection from "./components/ServicesSection";
import IdentitySection from "./components/IdentitySection";
import LocationSection from "./components/LocationSection";
import GriselidaCrosslink from "./components/GriselidaCrosslink";
import Footer from "./components/Footer";

import {
  APP_URL,
  STATS,
  metodoCards,
  PLATFORM_FEATURES,
  SERVICES,
  TEAM,
  TESTIMONIALS,
  IDENTITY_PILLARS,
  LOCATION,
} from "./data";

function LogoMark({ h = 44, opacity = 0.9 }: { h?: number; opacity?: number }) {
  return (
    <img
      src="/logos/logo-blanco.svg"
      alt="Desarrollo Integral"
      style={{ height: h, width: "auto", display: "block", opacity }}
    />
  );
}

export default function Home() {
  useEffect(() => {
    // Shared IntersectionObserver for all scroll-triggered classes
    const revealClasses = [".fade-in", ".blur-reveal", ".mask-reveal"];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.10, rootMargin: "-40px 0px" }
    );
    revealClasses.forEach((cls) => {
      document.querySelectorAll(cls).forEach((el) => io.observe(el));
    });
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* NAV */}
      <nav>
        <div className="nav-logo">
          <a href="#hero" className="nav-logo-link">
            <LogoMark h={56} opacity={0.9} />
          </a>
        </div>
        <div className="nav-links">
          <a href="#metodo">Método</a>
          <a href="#plataforma">Plataforma</a>
          <a href="#equipo">Equipo</a>
          <a href={APP_URL} className="nav-cta">
            Aplicativo
          </a>
        </div>
      </nav>

      {/* HERO */}
      <HeroSection />

      {/* STATS */}
      <StatsGrid items={STATS} />

      {/* IDENTIDAD */}
      <IdentitySection pillars={IDENTITY_PILLARS} />

      {/* MÉTODO */}
      <MethodSection cards={metodoCards} />

      {/* PLATAFORMA */}
      <PlatformSection features={PLATFORM_FEATURES} />

      {/* SERVICIOS */}
      <ServicesSection services={SERVICES} />

      {/* EQUIPO */}
      <TeamSection team={TEAM} />

      {/* TESTIMONIOS */}
      <TestimonialSlider testimonials={TESTIMONIALS} />

      {/* UBICACIÓN */}
      <LocationSection location={LOCATION} />

      {/* GRISELDA CROSS-LINK */}
      <GriselidaCrosslink />

      {/* CTA FORM */}
      <CTAForm />

      {/* FOOTER */}
      <Footer />
    </>
  );
}
