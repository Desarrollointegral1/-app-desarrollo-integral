"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import "./osteopatia.css";

const WA_URL = "https://wa.me/5491124033484";

const WA_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.535 5.849L.057 23.386a.75.75 0 00.906.948l5.741-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.933 0-3.74-.522-5.287-1.432l-.38-.225-3.907 1.025 1.003-3.795-.247-.392A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

const SERVICIOS = [
  {
    num: "01",
    title: "Kinesiología y Fisiatría",
    desc: "Evaluación y tratamiento del movimiento corporal. Enfoque en la recuperación funcional real, con trabajo manual preciso y seguimiento de cada proceso.",
    items: [
      "Evaluación funcional del movimiento",
      "Rehabilitación postquirúrgica",
      "Lesiones deportivas y musculoesqueléticas",
      "Dolor cervical, lumbar y articular",
    ],
  },
  {
    num: "02",
    title: "Osteopatía",
    desc: "Abordaje global del cuerpo. Técnicas estructurales y viscerales para tratar la causa del problema, no solo el síntoma. Formación en EOM y método Barral.",
    items: [
      "Osteopatía estructural y articular",
      "Osteopatía visceral — Instituto Barral",
      "Tratamiento de restricciones de movilidad",
      "Integración postural y corporal",
    ],
  },
  {
    num: "03",
    title: "Terapia Manual",
    desc: "Técnicas avanzadas de trabajo manual para restablecer la movilidad articular y tisular. Incluye RPG y trabajo de cadenas musculares.",
    items: [
      "RPG — Reeducación Postural Global",
      "Movilización articular",
      "Trabajo de fascias y tejido conectivo",
      "Prevención en deportistas",
    ],
  },
];

const CV = [
  "Licenciada en Kinesiología y Fisiatría — Facultad de Medicina, UBA",
  "Matrícula N° 9741",
  "Osteopatía Estructural — EOM (Escuela de Osteopatía de Madrid)",
  "Osteopatía Visceral — Instituto Barral",
  "RPG — Reeducación Postural Global",
  "Faixa preta de Brazilian Jiu-Jitsu · docente",
  "Más de 15 años de experiencia clínica",
];

export default function OsteopatiaPage() {
  const [openCard, setOpenCard] = useState<string | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".osteo-page .fade-in").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const toggle = (num: string) => setOpenCard(prev => prev === num ? null : num);

  return (
    <div className="osteo-page">

      <a href="#main-osteo" className="skip-link">Saltar al contenido</a>

      <NavBar
        links={[
          { href: "#servicios", label: "Servicios" },
          { href: "#sobre-mi", label: "Griselda" },
        ]}
        ctaHref="#contacto"
        ctaLabel="Turno"
      />

      <main id="main-osteo">

      {/* ── HERO ── */}
      <section id="hero-osteo" className="o-hero">
        <div className="o-hero-left">
          <p className="o-hero-eyebrow">Desarrollo Integral · Kinesiología y Osteopatía</p>
          <h1 className="o-hero-h1">
            Griselda<br />
            <em>Politino</em>
          </h1>
          <div className="o-hero-tags">
            <span className="o-hero-tag">Kinesiología y Fisiatría</span>
            <span className="o-hero-tag">Osteopatía</span>
            <span className="o-hero-tag">Terapia Manual</span>
          </div>
          <p className="o-hero-location">Belgrano · Buenos Aires · Mat. 9741</p>
        </div>
        <div className="o-hero-right">
          <img
            src="/web/Griselda/hero-sonriendo.jpeg"
            alt="Griselda Politino — Kinesióloga y Osteópata"
            className="o-hero-photo"
            fetchPriority="high"
          />
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section id="servicios" className="o-section">
        <div className="o-container">
          <p className="section-eyebrow fade-in">Servicios</p>
          <h2 className="section-h2 fade-in">Lo que trabajo</h2>
          <div className="o-servicios-grid">
            {SERVICIOS.map(({ num, title, desc, items }) => {
              const isOpen = openCard === num;
              const headerId = `o-svc-hdr-${num}`;
              const panelId  = `o-svc-panel-${num}`;
              return (
                <div
                  key={num}
                  className={`o-servicio-card fade-in${isOpen ? " is-open" : ""}`}
                >
                  <button
                    id={headerId}
                    className="o-servicio-header-btn"
                    onClick={() => toggle(num)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <div className="o-servicio-num" aria-hidden="true">{num}</div>
                    <h3 className="o-servicio-title">{title}</h3>
                    <p className="o-servicio-desc">{desc}</p>
                    <div className="o-expand-hint" aria-hidden="true">
                      <span>{isOpen ? "Cerrar" : "Ver más"}</span>
                      <svg className={`o-expand-arrow${isOpen ? " open" : ""}`} width="12" height="12" viewBox="0 0 12 12">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </button>
                  {isOpen && (
                    <div
                      id={panelId}
                      className="o-servicio-detail"
                      role="region"
                      aria-labelledby={headerId}
                    >
                      <ul className="o-servicio-items">
                        {items.map(item => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SOBRE MÍ ── */}
      <section id="sobre-mi" className="o-section o-section-alt">
        <div className="o-container">
          <p className="section-eyebrow fade-in">Sobre mí</p>
          <h2 className="section-h2 fade-in">Cómo trabajo el cuerpo</h2>
          <div className="o-sobre-grid">
            <div className="o-sobre-fotos fade-in">
              <div className="o-sobre-par">
                <div className="o-sobre-photo-wrap">
                  <img
                    src="/web/Griselda/medio-seria.jpeg"
                    alt="Griselda Politino en consultorio"
                    className="o-sobre-photo"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="o-sobre-photo-wrap o-sobre-photo-sec">
                  <img
                    src="/web/Griselda/bjj-brazos.jpeg"
                    alt="Griselda Politino entrenando Brazilian Jiu-Jitsu"
                    className="o-sobre-photo"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <p className="o-sobre-credencial">
                Lic. en Kinesiología y Fisiatría · Mat. 9741
              </p>
            </div>
            <div className="o-sobre-texto fade-in">
              <p className="o-sobre-quote">&ldquo;El cuerpo tiene una capacidad enorme de recuperarse. Mi trabajo es entender por qué no lo está haciendo.&rdquo;</p>
              <p className="o-sobre-body">Soy kinesióloga y osteópata, trabajo en Belgrano con un enfoque manual e integral del cuerpo. Me formé en la Facultad de Medicina (UBA), completé mi especialización en osteopatía estructural y visceral, y sigo formándome de manera continua porque la clínica siempre exige más.</p>
              <p className="o-sobre-body">Trabajo principalmente con deportistas, personas con dolor musculoesquelético crónico y pacientes en proceso de rehabilitación.</p>
              <p className="o-sobre-body">Soy faixa preta de Brazilian Jiu-Jitsu y doy clases junto a Ariel Rebesberger. El BJJ me enseñó cosas sobre el cuerpo que no se aprenden en un libro, y eso entra directo en la clínica.</p>
              <ul className="o-cv-list">
                {CV.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CROSS-LINK ARIEL ── */}
      <section className="o-crosslink">
        <div className="o-container">
          <p className="section-eyebrow fade-in">Desarrollo Integral</p>
          <h2 className="section-h2 fade-in">Acondicionamiento y preparación física</h2>
          <p className="o-crosslink-desc fade-in">Ariel Rebesberger — más de 30 años de experiencia en entrenamiento personalizado, fuerza y recomposición corporal. Planes individuales con seguimiento y registro completo de cada proceso.</p>
          <Link href="/#equipo" className="o-crosslink-btn fade-in">
            Ver Desarrollo Integral →
          </Link>
        </div>
      </section>

      {/* ── CONTACTO ── */}
      <section id="contacto" className="o-contacto">
        <div className="o-container">
          <p className="section-eyebrow fade-in">Contacto</p>
          <h2 className="o-contacto-h2 fade-in">
            Pedí tu turno.<br />
            <em>Belgrano · Buenos Aires.</em>
          </h2>
          <a href={WA_URL} className="o-wa-btn fade-in" target="_blank" rel="noopener noreferrer">
            {WA_ICON}
            Escribime por WhatsApp
          </a>
        </div>
      </section>

      </main>

      <Footer />

    </div>
  );
}
