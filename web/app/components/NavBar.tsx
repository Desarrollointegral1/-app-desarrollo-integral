"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { NavDrawer } from "./NavDrawer";

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY: Whitelist de secciones válidas (anti-XSS)
// ═══════════════════════════════════════════════════════════════════════════════
const VALID_SECTIONS = ["identidad", "metodo", "plataforma"] as const;
type ValidSection = typeof VALID_SECTIONS[number];

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY: Rate limiter para theme toggle (anti-spam)
// ═══════════════════════════════════════════════════════════════════════════════
class ThemeToggleLimiter {
  private attempts = 0;
  private resetTime = Date.now();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 2000;

  canToggle(): boolean {
    const now = Date.now();
    if (now - this.resetTime > this.WINDOW_MS) {
      this.attempts = 0;
      this.resetTime = now;
    }
    
    if (this.attempts >= this.MAX_ATTEMPTS) {
      console.warn("[Security] Theme toggle rate limit exceeded");
      return false;
    }
    
    this.attempts++;
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: NavBar — Premium Dark with Gold
// ═══════════════════════════════════════════════════════════════════════════════
export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState<ValidSection | "">("");
  
  // SECURITY: Rate limiter instance (memoized)
  const themeLimiter = useMemo(() => new ThemeToggleLimiter(), []);

  // ─────────────────────────────────────────────────────────────────────────────
  // SECURITY: Sanitized theme toggle with rate limiting
  // ─────────────────────────────────────────────────────────────────────────────
  const handleThemeToggle = useCallback(() => {
    if (!themeLimiter.canToggle()) return;
    
    setIsDark((prev) => {
      const newTheme = !prev;
      // SECURITY: Use setAttribute in requestAnimationFrame (prevent race conditions)
      requestAnimationFrame(() => {
        document.documentElement.setAttribute(
          "data-theme", 
          newTheme ? "dark" : "light"
        );
      });
      return newTheme;
    });
  }, [themeLimiter]);

  // ─────────────────────────────────────────────────────────────────────────────
  // PERFORMANCE: Throttled scroll handler with RAF
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let ticking = false;
    let lastKnownScrollY = 0;

    const handleScroll = () => {
      lastKnownScrollY = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsHidden(lastKnownScrollY > lastScrollY && lastKnownScrollY > 80);
          setLastScrollY(lastKnownScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SECURITY: Active section with validated IDs
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    VALID_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      
      const obs = new IntersectionObserver(
        ([entry]) => { 
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: "-40% 0px -40% 0px" }
      );
      
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // ACCESSIBILITY: Close drawer on Escape key
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <>
      <nav
        className="nav-main"
        role="navigation"
        aria-label="Main navigation"
        style={{
          transform: isHidden ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 300ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="nav-content">
          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Logo — Premium Gold Accent                                      */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <Link href="/" className="nav-logo-link" aria-label="Desarrollo Integral - Home">
            <div className="nav-logo-icon" aria-hidden="true">DI</div>
            <span className="nav-logo-text">Desarrollo Integral</span>
          </Link>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Desktop Nav Links — Gold Underline on Active                    */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="nav-links-desktop">
            <NavLink href="#identidad" active={activeSection === "identidad"}>
              Identidad
            </NavLink>
            <NavLink href="#metodo" active={activeSection === "metodo"}>
              Método
            </NavLink>
            <NavLink href="#plataforma" active={activeSection === "plataforma"}>
              Plataforma
            </NavLink>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Right Actions — Theme Toggle + CTA + Hamburger                  */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="nav-actions">
            <button
              className="nav-toggle-theme"
              onClick={handleThemeToggle}
              aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={isDark ? "Modo claro" : "Modo oscuro"}
              type="button"
            >
              {isDark ? (
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            
            <a 
              href="#form" 
              className="nav-cta"
              aria-label="Ir al formulario de contacto"
            >
              Contacto
            </a>
            
            <button
              className="nav-hamburger"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isOpen}
              type="button"
            >
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </nav>

      <NavDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: NavLink — Gold underline animation
// ═══════════════════════════════════════════════════════════════════════════════
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}

function NavLink({ href, children, active = false }: NavLinkProps) {
  return (
    <a 
      href={href} 
      className={`nav-link${active ? " nav-link-active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {children}
      <span className="nav-link-underline" aria-hidden="true"></span>
    </a>
  );
}
