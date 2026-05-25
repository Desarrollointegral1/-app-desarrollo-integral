"use client";

import { motion } from "framer-motion";
import { LOGO_WHITE } from "../data";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ position: "relative", zIndex: 10 }}>
      <motion.a
        href="#hero"
        className="footer-logo-link"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <img
          src={LOGO_WHITE}
          alt="Desarrollo Integral"
          style={{
            height: 40,
            width: "auto",
            display: "block",
            opacity: 0.4,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
        />
      </motion.a>

      <motion.p
        className="footer-copy"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: true }}
      >
        © {currentYear} Desarrollo Integral · Cabildo 450, 3er piso · Buenos Aires
      </motion.p>
    </footer>
  );
}

export default Footer;
