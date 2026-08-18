"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { NavDrawer } from "./NavDrawer";

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY: Whitelist de secciones válidas (anti-XSS)
// ═══════════════════════════════════════════════════════════════════════════════
const VALID_SECTIONS = ["metodo", "plataforma"] as const;
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
// COMPONENT: NavBar — nav institucional compartida por todas las rutas
// Los links y el CTA son configurables para que las páginas internas
// (/osteopatia) usen la MISMA nav en vez de inventarse una propia.
// ═══════════════════════════════════════════════════════════════════════════════
type NavLinkDef = { href: string; label: string };

const DEFAULT_LINKS: NavLinkDef[] = [
  { href: "#metodo", label: "Método" },
  { href: "#plataforma", label: "Plataforma" },
];

interface NavBarProps {
  links?: NavLinkDef[];
  ctaHref?: string;
  ctaLabel?: string;
}

export function NavBar({
  links = DEFAULT_LINKS,
  ctaHref = "#cierre",
  ctaLabel = "Contacto",
}: NavBarProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  // Umbral de 8px (Apple/Medium): en trackpad e inercia iOS los ultimos frames
  // oscilan +-1-3px y sin umbral la nav parpadea.
  const lastY = useRef(0);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const [activeSection, setActiveSection] = useState<ValidSection | "">("");
  
  // SECURITY: Rate limiter instance (memoized)
  const themeLimiter = useMemo(() => new ThemeToggleLimiter(), []);

  // El drawer (único acceso al CTA en ≤640px, donde .nav-cta se oculta)
  // repite los links de la nav + el CTA como item primario.
  const drawerItems = useMemo(
    () => [...links, { href: ctaHref, label: ctaLabel, primary: true }],
    [links, ctaHref, ctaLabel]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // SECURITY: Sanitized theme toggle with rate limiting
  // ─────────────────────────────────────────────────────────────────────────────
  const handleThemeToggle = useCallback(() => {
    if (!themeLimiter.canToggle()) return;

    // Sincrónico y fuera del updater: setAttribute dentro de un
    // requestAnimationFrame no dispara en tabs ocultos y dejaba el atributo
    // desincronizado del estado; un updater con efectos además corre doble
    // en StrictMode (mismo bug ya corregido en Storytelling, d31604b).
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("di-theme", next ? "dark" : "light");
    } catch {
      /* localStorage bloqueado: el toggle sigue funcionando sin persistencia */
    }
  }, [themeLimiter, isDark]);

  // Restaurar el tema persistido (el script inline del layout ya aplicó el
  // atributo antes del paint; acá solo sincronizamos el estado del ícono)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("di-theme");
      if (saved === "light") setIsDark(false);
    } catch {
      /* sin persistencia */
    }
  }, []);

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
          const dy = lastKnownScrollY - lastY.current;
          if (Math.abs(dy) >= 8) {
            setIsHidden(dy > 0 && lastKnownScrollY > 80);
            lastY.current = lastKnownScrollY;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        hamburgerRef.current?.focus();
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
        aria-label="Navegación principal"
        style={{
          transform: isHidden ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 300ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="nav-content">
          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Logo — Premium Gold Accent                                      */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <Link href="/" className="nav-logo-link" aria-label="Desarrollo Integral, inicio">
            <div className="nav-logo-icon" aria-hidden="true">DI</div>
            <span className="nav-logo-text">Desarrollo Integral</span>
          </Link>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Desktop Nav Links — Gold Underline on Active                    */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="nav-links-desktop">
            {links.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                active={activeSection === href.replace("#", "")}
              >
                {label}
              </NavLink>
            ))}
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
              href={ctaHref}
              className="nav-cta"
              aria-label={`Ir a ${ctaLabel.toLowerCase()}`}
            >
              {ctaLabel}
            </a>
            
            <button
              ref={hamburgerRef}
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

      <NavDrawer
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          hamburgerRef.current?.focus();
        }}
        items={drawerItems}
      />
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
