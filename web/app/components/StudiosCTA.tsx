"use client";

import Link from "next/link";

const STUDIOS = [
  {
    title: "Web Studio",
    desc: "Mejora tu web existente o crea una nueva desde cero: rediseño completo, optimización de performance y mejora de UX/UI.",
  },
  {
    title: "App Studio",
    desc: "Crea apps full-stack o mejora las existentes: frontend, backend y base de datos, con auditoría de seguridad incluida.",
  },
];

export function StudiosCTA() {
  return (
    <section
      id="studios"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg3)",
        padding: "var(--section-pad) 0",
      }}
    >
      <div className="container">
        <p className="section-eyebrow fade-in">Studios inteligentes</p>
        <h2 className="section-h2 fade-in">Automatización de proyectos digitales</h2>
        <p className="section-body fade-in">
          Cargá un archivo o una descripción, elegí un agente, y dejá que el sistema
          maneje el trabajo.
        </p>

        <div
          className="fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 0,
            borderTop: "1px solid var(--border)",
            marginBottom: 48,
          }}
        >
          {STUDIOS.map((studio) => (
            <div
              key={studio.title}
              style={{
                padding: "40px 32px",
                borderBottom: "1px solid var(--border)",
                borderRight: "1px solid var(--border)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--sans)",
                  fontWeight: 500,
                  fontSize: 18,
                  color: "var(--t1)",
                  marginBottom: 10,
                }}
              >
                {studio.title}
              </h3>
              <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.8 }}>
                {studio.desc}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/studios"
          className="fade-in"
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
        >
          Acceder a Studios →
        </Link>
      </div>
    </section>
  );
}
