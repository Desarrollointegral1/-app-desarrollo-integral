"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NavDrawer } from "./NavDrawer";

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState("");

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Hide-on-scroll with hysteresis
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsHidden(currentScrollY > lastScrollY && currentScrollY > 80);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Active section via IntersectionObserver
  useEffect(() => {
    const sections = ["identidad", "metodo", "plataforma"];
    const observers: IntersectionObserver[] = [];

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-40% 0px -40% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  return (
    <>
      <nav
        className="nav-main"
        style={{
          transform: isHidden ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 300ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="nav-content">
          {/* Logo */}
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">DI</div>
            <span className="nav-logo-text">Desarrollo Integral</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-links-desktop">
            <NavLink href="#identidad" active={activeSection === "identidad"}>Identidad</NavLink>
            <NavLink href="#metodo" active={activeSection === "metodo"}>Método</NavLink>
            <NavLink href="#plataforma" active={activeSection === "plataforma"}>Plataforma</NavLink>
          </div>

          {/* Right Actions */}
          <div className="nav-actions">
            <button
              className="nav-toggle-theme"
              onClick={() => setIsDark(!isDark)}
              aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={isDark ? "Modo claro" : "Modo oscuro"}
            >
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <a href="#form" className="nav-cta">
              Contacto
            </a>
            <button
              className="nav-hamburger"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      <NavDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <a href={href} className={`nav-link${active ? " nav-link-active" : ""}`}>
      {children}
      <span className="nav-link-underline"></span>
    </a>
  );
}
