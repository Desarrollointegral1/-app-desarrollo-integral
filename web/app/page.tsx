"use client";

import { useEffect } from "react";
import { NavBar } from "./components/NavBar";
import HeroSection from "./components/HeroSection";
import StatsGrid from "./components/StatsGrid";
import ManifiestoSection from "./components/ManifiestoSection";
import MethodSection from "./components/MethodSection";
import ServicesSection from "./components/ServicesSection";
import IdentitySection from "./components/IdentitySection";
import ComoTrabajamosSection from "./components/ComoTrabajamosSection";
import PlatformSection from "./components/PlatformSection";
import QueResuelveSection from "./components/QueResuelveSection";
import TeamSection from "./components/TeamSection";
import TestimonialSlider from "./components/TestimonialSlider";
import CTAForm from "./components/CTAForm";
import LocationSection from "./components/LocationSection";
import FAQSection from "./components/FAQSection";
import GriselidaCrosslink from "./components/GriselidaCrosslink";
import Footer from "./components/Footer";

import {
  STATS,
  metodoCards,
  SERVICES,
  IDENTITY_PILLARS,
  COMO_TRABAJAMOS,
  PLATFORM_FEATURES,
  QUE_RESUELVE,
  TESTIMONIALS,
  LOCATION,
  FAQ,
} from "./data";

export default function Home() {
  useEffect(() => {
    // IntersectionObserver — .fade-in es el único patrón de entrada
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
    document.querySelectorAll(".fade-in, .reveal-clip").forEach((el) => io.observe(el));
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

        {/* MÉTODO — Bloque 2, acordeón */}
        <MethodSection cards={metodoCards} />

        {/* MODALIDADES — Bloque 3 */}
        <ServicesSection services={SERVICES} />

        {/* NUESTRA VISIÓN — Bloque 4 */}
        <ManifiestoSection />

        {/* NUESTRO ESTÁNDAR — Bloque 5 */}
        <IdentitySection pillars={IDENTITY_PILLARS} />

        {/* CÓMO TRABAJAMOS — Bloque 6 */}
        <ComoTrabajamosSection points={COMO_TRABAJAMOS} />

        {/* PLATAFORMA */}
        <PlatformSection features={PLATFORM_FEATURES} />

        {/* QUÉ TE RESUELVE — Bloque 7 */}
        <QueResuelveSection rows={QUE_RESUELVE} />

        {/* EQUIPO — Ariel editorial */}
        <TeamSection />

        {/* TESTIMONIOS */}
        <TestimonialSlider testimonials={TESTIMONIALS} />

        {/* CIERRE — Bloque 8, Sanctum + WhatsApp */}
        <CTAForm />

        {/* UBICACIÓN — Bloque 9 */}
        <LocationSection location={LOCATION} />

        {/* PREGUNTAS FRECUENTES — Bloque 10 */}
        <FAQSection items={FAQ} />

        {/* GRISELDA CROSS-LINK */}
        <GriselidaCrosslink />

        {/* FOOTER */}
        <Footer />

      </main>
    </>
  );
}
