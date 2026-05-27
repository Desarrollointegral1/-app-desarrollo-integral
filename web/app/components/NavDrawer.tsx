"use client";

import { useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY: Whitelist de navegación válida
// ═══════════════════════════════════════════════════════════════════════════════
interface NavItem { href: string; label: string; primary?: boolean }
const VALID_NAVIGATION_ITEMS: NavItem[] = [
  { href: "#identidad", label: "Identidad" },
  { href: "#metodo",    label: "Método" },
  { href: "#plataforma",label: "Plataforma" },
  { href: "#form",      label: "Contacto", primary: true },
];

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: NavDrawer — Secure Mobile Navigation
// ═══════════════════════════════════════════════════════════════════════════════
export function NavDrawer({ isOpen, onClose }: NavDrawerProps) {
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLAnchorElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // ACCESSIBILITY: Body scroll lock when drawer is open
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ACCESSIBILITY: Focus trap within drawer
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const firstFocusable = firstFocusableRef.current;
      const lastFocusable = lastFocusableRef.current;

      if (!firstFocusable || !lastFocusable) return;

      if (e.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    window.addEventListener("keydown", handleTabKey);
    return () => window.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ACCESSIBILITY: Focus close button when drawer opens
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100); // Small delay to wait for animation
    }
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SECURITY: Sanitized close handler (prevent event bubbling)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleClose = useCallback((e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    onClose();
  }, [onClose]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SECURITY: Sanitized link click handler
  // ─────────────────────────────────────────────────────────────────────────────
  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute("href");
    
    // SECURITY: Validate href is in whitelist
    const isValid = VALID_NAVIGATION_ITEMS.some(item => item.href === href);
    if (!isValid) {
      e.preventDefault();
      console.warn("[Security] Invalid navigation href blocked:", href);
      return;
    }
    
    onClose();
  }, [onClose]);

  return (
    <>
      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Backdrop — Click to close                                              */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <div
        className="nav-drawer-backdrop"
        onClick={handleClose}
        aria-hidden="true"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 300ms ease",
        }}
      />

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Drawer — Premium Dark with Gold accents                                */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <aside
        className="nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        aria-hidden={!isOpen}
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {/* Close button */}
        <button 
          ref={firstFocusableRef}
          className="nav-drawer-close" 
          onClick={handleClose} 
          aria-label="Cerrar menú"
          type="button"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Navigation Links */}
        <nav className="nav-drawer-content" aria-label="Mobile navigation links">
          {VALID_NAVIGATION_ITEMS.map((item, index) => {
            const isLast = index === VALID_NAVIGATION_ITEMS.length - 1;
            
            return (
              <a
                key={item.href}
                ref={isLast ? lastFocusableRef : undefined}
                href={item.href}
                onClick={handleLinkClick}
                className={`nav-drawer-link${item.primary ? " nav-drawer-link-primary" : ""}`}
                tabIndex={isOpen ? 0 : -1}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Premium Branding Badge */}
        <div className="nav-drawer-footer" aria-hidden="true">
          <div className="nav-drawer-badge">
            <span className="nav-drawer-badge-icon">DI</span>
            <span className="nav-drawer-badge-text">Premium Experience</span>
          </div>
        </div>
      </aside>
    </>
  );
}
