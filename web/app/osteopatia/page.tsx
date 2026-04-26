"use client";
import { useEffect, useState } from "react";
import "./osteopatia.css";

const WA_URL = "https://wa.me/5491124033484";
const DI_URL  = "https://desarrollointegral.vercel.app";

const WA_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
    document.querySelectorAll(".o-fade").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const toggle = (num: string) => setOpenCard(prev => prev === num ? null : num);

  return (
    <div className="osteo-page">

      {/* ── NAV ── */}
      <nav className="o-nav">
        <a href="#hero" className="o-nav-brand">
          <span className="o-nav-name">Griselda Politino</span>
          <span className="o-nav-sub">Kinesiología · Osteopatía · Belgrano</span>
        </a>
        <div className="o-nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#sobre-mi">Sobre mí</a>
          <a href="#bjj">BJJ</a>
          <a href="#contacto" className="o-nav-wa" aria-label="WhatsApp">
            {WA_ICON}
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="hero" className="o-hero">
        <div className="o-hero-left">
          <p className="o-hero-eyebrow">Kinesióloga &amp; Osteópata</p>
          <h1 className="o-hero-h1">
            Griselda<br />
            <em>Politino</em>
          </h1>
          <div className="o-hero-tags">
            <span className="o-hero-tag">Kinesiología y Fisiatría</span>
            <span className="o-hero-tag">Osteopatía</span>
            <span className="o-hero-tag">Terapia Manual</span>
          </div>
          <p className="o-hero-location">Belgrano · Buenos Aires</p>
        </div>
        <div className="o-hero-right">
          <img
            src="/Griselda/hero-sonriendo.jpeg"
            alt="Griselda Politino — Kinesióloga y Osteópata"
            className="o-hero-photo"
          />
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section id="servicios" className="o-section">
        <div className="o-container">
          <p className="o-eyebrow o-fade">Lo que trabajo</p>
          <div className="o-servicios-grid">
            {SERVICIOS.map(({ num, title, desc, items }) => {
              const isOpen = openCard === num;
              return (
                <div
                  key={num}
                  className={`o-servicio-card o-fade${isOpen ? " is-open" : ""}`}
                  onClick={() => toggle(num)}
                >
                  <div className="o-servicio-num">{num}</div>
                  <h3 className="o-servicio-title">{title}</h3>
                  <p className="o-servicio-desc">{desc}</p>
                  <div className="o-expand-hint">
                    <span>{isOpen ? "Cerrar" : "Ver más"}</span>
                    <svg className={`o-expand-arrow${isOpen ? " open" : ""}`} width="12" height="12" viewBox="0 0 12 12">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    </svg>
                  </div>
                  {isOpen && (
                    <div className="o-servicio-detail">
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
          <div className="o-sobre-grid">
            <div className="o-sobre-photo-wrap o-fade">
              <img
                src="/Griselda/medio-seria.jpeg"
                alt="Griselda Politino"
                className="o-sobre-photo"
              />
              <span className="o-sobre-badge">Lic. en Kinesiología y Fisiatría</span>
            </div>
            <div className="o-fade">
              <p className="o-eyebrow">Sobre mí</p>
              <p className="o-sobre-quote">&ldquo;El cuerpo tiene una capacidad enorme de recuperarse. Mi trabajo es entender por qué no lo está haciendo.&rdquo;</p>
              <p className="o-sobre-body">Soy kinesióloga y osteópata, trabajo en Belgrano con un enfoque manual e integral del cuerpo. Me formé en la Facultad de Medicina (UBA), completé mi especialización en osteopatía estructural y visceral, y sigo formándome de manera continua porque la clínica siempre exige más.</p>
              <p className="o-sobre-body">Trabajo principalmente con deportistas, personas con dolor musculoesquelético crónico y pacientes en proceso de rehabilitación.</p>
              <ul className="o-cv-list">
                <li>Licenciada en Kinesiología y Fisiatría — Facultad de Medicina, UBA</li>
                <li>Matrícula N° 9741</li>
                <li>Osteopatía Estructural — EOM (Escuela de Osteopatía de Madrid)</li>
                <li>Osteopatía Visceral — Instituto Barral</li>
                <li>RPG — Reeducación Postural Global</li>
                <li>Más de 15 años de experiencia clínica</li>
              </ul>
              <span className="o-matricula">Mat. 9741 · Kinesiología y Fisiatría</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── BJJ / 360 ── */}
      <section id="bjj" className="o-section">
        <div className="o-container">
          <div className="o-bjj-grid">
            <div className="o-fade">
              <div className="o-bjj-belt">
                <div className="o-bjj-belt-bar"></div>
                <span className="o-bjj-belt-text">Faixa Preta · Brazilian Jiu-Jitsu</span>
              </div>
              <h2 className="o-bjj-h2">Academia<br />360 BJJ</h2>
              <p className="o-bjj-desc">Junto con Ariel Rebesberger somos los profesores y head coaches de la Academia 360. Los dos llegamos a la faja negra entendiendo el cuerpo como un sistema: el entrenamiento, el movimiento y la salud son parte del mismo proceso.</p>
              <p className="o-bjj-desc" style={{ marginTop: 16 }}>El BJJ me enseñó cosas sobre el cuerpo que no se aprenden en ningún libro. Eso se traslada directamente a mi trabajo clínico.</p>
            </div>
            <div className="o-bjj-photo o-fade">
              <img src="/Griselda/bjj-brazos.jpeg" alt="Griselda Politino — BJJ Faixa Preta · Academia 360" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CROSS-LINK ARIEL ── */}
      <div className="o-crosslink">
        <div>
          <p className="o-crosslink-eyebrow">Desarrollo Integral</p>
          <h2 className="o-crosslink-h2">Acondicionamiento físico y preparación física</h2>
          <p className="o-crosslink-desc">Ariel Rebesberger — más de 30 años de experiencia en entrenamiento personalizado, fuerza y recomposición corporal. Planes individuales con seguimiento y registro completo de cada proceso.</p>
        </div>
        <a href={DI_URL} className="o-crosslink-btn" target="_blank" rel="noopener noreferrer">
          Ver Desarrollo Integral →
        </a>
      </div>

      {/* ── CONTACTO ── */}
      <section id="contacto" className="o-contacto">
        <div className="o-contacto-shield">
          <div className="o-spin-wrap">
            <img className="o-spin-img" src="/logos/icon-blanco.svg" alt="" width={700} style={{ opacity: 0.04 }} />
          </div>
        </div>
        <div className="o-contacto-inner o-fade">
          <p className="o-contacto-eyebrow">Contacto</p>
          <h2 className="o-contacto-h2">
            Pedí tu turno.<br />
            <em>Belgrano · Buenos Aires.</em>
          </h2>
          <a href={WA_URL} className="o-wa-btn" target="_blank" rel="noopener noreferrer">
            {WA_ICON}
            Escribime por WhatsApp
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="o-footer">
        <span className="o-footer-brand">Griselda Politino</span>
        <span className="o-footer-copy">Belgrano · Buenos Aires · Mat. 9741</span>
        <div className="o-footer-di">
          <a href={DI_URL} target="_blank" rel="noopener noreferrer">Desarrollo Integral →</a>
        </div>
      </footer>

    </div>
  );
}
