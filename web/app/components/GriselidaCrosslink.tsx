"use client";

import { motion } from "framer-motion";

export function GriselidaCrosslink() {
  return (
    <section
      id="griselda"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg2)",
        padding: "80px 0",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 40,
            alignItems: "center",
          }}
        >
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 100,
            }}
            viewport={{ once: true }}
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid var(--gold-border)",
              flexShrink: 0,
            }}
          >
            <img
              src="/web/Griselda/head-sonriendo.jpeg"
              alt="Griselda Politino"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
              }}
            />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 100,
            }}
            viewport={{ once: true }}
          >
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.42em",
                color: "var(--t3)",
                textTransform: "uppercase",
                fontFamily: "var(--sans)",
                marginBottom: 12,
              }}
            >
              Kinesiología · Osteopatía · Belgrano
            </p>

            <h2
              style={{
                fontFamily: "var(--serif)",
                fontWeight: 700,
                fontSize: "clamp(22px, 3vw, 32px)",
                color: "rgba(255,255,255,0.9)",
                marginBottom: 12,
                lineHeight: 1.3,
              }}
            >
              Griselda Politino — Kinesióloga &amp; Osteópata
            </h2>

            <p
              style={{
                fontSize: 14,
                color: "var(--t2)",
                lineHeight: 1.8,
                maxWidth: 560,
                marginBottom: 24,
              }}
            >
              Kinesióloga (UBA · Mat. 9741), especializada en osteopatía estructural y visceral (EOM, Instituto Barral) y RPG. Trabajamos de manera integrada: entrenamiento y salud como un mismo proceso.
            </p>

            <motion.a
              href="https://desarrollointegral.vercel.app/osteopatia"
              style={{
                display: "inline-block",
                border: "1px solid var(--gold-border)",
                color: "var(--gold)",
                padding: "12px 32px",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none",
                fontFamily: "var(--sans)",
              }}
              whileHover={{
                background: "var(--gold)",
                color: "#000",
                transition: { duration: 0.2 },
              }}
            >
              Ver consultorio de Griselda →
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default GriselidaCrosslink;
