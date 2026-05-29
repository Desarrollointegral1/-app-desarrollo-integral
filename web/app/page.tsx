"use client";

import { useEffect } from "react";
import { NavBar } from "./components/NavBar";
import HeroSection from "./components/HeroSection";
import StatsGrid from "./components/StatsGrid";
import ManifiestoSection from "./components/ManifiestoSection";
import MethodSection from "./components/MethodSection";
import PlatformSection from "./components/PlatformSection";
import { StudiosCTA } from "./components/StudiosCTA";
import TeamSection from "./components/TeamSection";
import TestimonialSlider from "./components/TestimonialSlider";
import CTAForm from "./components/CTAForm";
import LocationSection from "./components/LocationSection";
import GriselidaCrosslink from "./components/GriselidaCrosslink";
import Footer from "./components/Footer";

import {
  APP_URL,
  STATS,
  metodoCards,
  PLATFORM_FEATURES,
  TESTIMONIALS,
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
    // IntersectionObserver only for CSS-class-based reveals
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "-32px 0px" }
    );
    document.querySelectorAll(".fade-in, .blur-reveal, .mask-reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Skip to main (WCAG 2.4.1) */}
      <a href="#main-content" className="skip-link">Saltar al contenido</a>

      {/* NAVBAR — Enhanced Navigation */}
      <NavBar />

      {/* MAIN */}
      <main id="main-content">

        {/* HERO — full viewport video */}
        <HeroSection />

        {/* STATS */}
        <StatsGrid items={STATS} />

        {/* MANIFIESTO */}
        <ManifiestoSection />

        {/* MÉTODO */}
        <MethodSection cards={metodoCards} />

        {/* PLATAFORMA */}
        <PlatformSection features={PLATFORM_FEATURES} />

        {/* STUDIOS */}
        <StudiosCTA />

        {/* EQUIPO — Ariel editorial */}
        <TeamSection />

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

      </main>
    </>
  );
}
