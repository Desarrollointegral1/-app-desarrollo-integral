"use client";

import { LOGO_WHITE, LOCATION } from "../data";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ position: "relative", zIndex: 10 }}>
      <a href="#hero" className="footer-logo-link">
        <img
          src={LOGO_WHITE}
          alt="Desarrollo Integral"
          style={{
            height: 40,
            width: "auto",
            display: "block",
            opacity: 0.4,
            transition: "opacity 0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
        />
      </a>

      <p className="footer-brandline">Wellness starts with movement</p>

      <p className="footer-copy">
        © {currentYear} Desarrollo Integral · {LOCATION.address}, {LOCATION.floor} · Buenos Aires
      </p>
    </footer>
  );
}

export default Footer;
