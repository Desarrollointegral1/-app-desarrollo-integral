"use client";

import Link from "next/link";

export function GriselidaCrosslink() {
  return (
    <section
      id="griselda"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg2)",
        padding: "var(--section-pad) 0",
      }}
    >
      <div className="container">
        <div
          className="fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 40,
            alignItems: "center",
          }}
        >
          {/* Image */}
          <div
            style={{
              // Retrato en marco rectangular de esquina suave, nunca circular
              // (playbook anti-cara-de-IA, señal 10)
              width: 88,
              height: 110,
              borderRadius: 6,
              overflow: "hidden",
              border: "1px solid var(--border)",
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
          </div>

          {/* Content */}
          <div>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.30em",
                color: "var(--t3)",
                textTransform: "uppercase",
                fontFamily: "var(--sans)",
                fontWeight: 500,
                marginBottom: 12,
              }}
            >
              Kinesiología · Osteopatía · Belgrano
            </p>

            <h2
              style={{
                fontFamily: "var(--sans)",
                fontWeight: 500,
                fontSize: "clamp(22px, 3vw, 32px)",
                color: "var(--t1)",
                marginBottom: 12,
                lineHeight: 1.3,
                letterSpacing: "-0.005em",
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

            <Link
              href="/osteopatia"
              className="griselda-link"
              style={{
                display: "inline-block",
                border: "1px solid rgba(237,235,231,0.25)",
                color: "var(--t1)",
                padding: "12px 32px",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                textDecoration: "none",
                fontFamily: "var(--sans)",
                fontWeight: 600,
                transition: "background 300ms cubic-bezier(0.23,1,0.32,1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(237,235,231,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Ver consultorio de Griselda →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GriselidaCrosslink;
