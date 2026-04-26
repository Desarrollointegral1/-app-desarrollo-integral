"use client";
import { useEffect } from "react";
import "./osteopatia.css";

const WA_URL = "https://wa.me/5491124033484";
const DI_URL = "https://desarrollointegral.vercel.app";

export default function OsteopatiaPage() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".o-fade").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

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
          <a href={WA_URL} className="o-nav-wa" target="_blank" rel="noopener noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.535 5.849L.057 23.386a.75.75 0 00.906.948l5.741-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.933 0-3.74-.522-5.287-1.432l-.38-.225-3.907 1.025 1.003-3.795-.247-.392A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Contacto
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
          <div style={{ marginTop: 40 }}>
            <a href={WA_URL} className="o-wa-btn" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.535 5.849L.057 23.386a.75.75 0 00.906.948l5.741-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.933 0-3.74-.522-5.287-1.432l-.38-.225-3.907 1.025 1.003-3.795-.247-.392A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Turno por WhatsApp
            </a>
          </div>
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
            <div className="o-servicio-card o-fade">
              <div className="o-servicio-num">01</div>
              <h3 className="o-servicio-title">Kinesiología y Fisiatría</h3>
              <p className="o-servicio-desc">Evaluación y tratamiento del movimiento corporal. Enfoque en la recuperación funcional real, con trabajo manual preciso y seguimiento de cada proceso.</p>
              <ul className="o-servicio-items">
                <li>Evaluación funcional del movimiento</li>
                <li>Rehabilitación postquirúrgica</li>
                <li>Lesiones deportivas y musculoesqueléticas</li>
                <li>Dolor cervical, lumbar y articular</li>
              </ul>
            </div>
            <div className="o-servicio-card o-fade">
              <div className="o-servicio-num">02</div>
              <h3 className="o-servicio-title">Osteopatía</h3>
              <p className="o-servicio-desc">Abordaje global del cuerpo. Técnicas estructurales y viscerales para tratar la causa del problema, no solo el síntoma. Formación en EOM y método Barral.</p>
              <ul className="o-servicio-items">
                <li>Osteopatía estructural y articular</li>
                <li>Osteopatía visceral (Instituto Barral)</li>
                <li>Tratamiento de restricciones de movilidad</li>
                <li>Integración postural y corporal</li>
              </ul>
            </div>
            <div className="o-servicio-card o-fade">
              <div className="o-servicio-num">03</div>
              <h3 className="o-servicio-title">Terapia Manual</h3>
              <p className="o-servicio-desc">Técnicas avanzadas de trabajo manual para restablecer la movilidad articular y tisular. Incluye RPG (Reeducación Postural Global) y trabajo de cadenas musculares.</p>
              <ul className="o-servicio-items">
                <li>RPG — Reeducación Postural Global</li>
                <li>Movilización articular</li>
                <li>Trabajo de fascias y tejido conectivo</li>
                <li>Prevención en deportistas</li>
              </ul>
            </div>
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
              <p className="o-sobre-body">Trabajo principalmente con deportistas, personas con dolor musculoesquelético crónico y pacientes en proceso de rehabilitación. También integro mi formación en artes marciales para entender el cuerpo en movimiento desde adentro.</p>
              <ul className="o-cv-list">
                <li>Licenciada en Kinesiología y Fisiatría — Facultad de Medicina, UBA</li>
                <li>Matrícula N° 9741</li>
                <li>Especialización en Osteopatía — EOM (Escuela de Osteopatía de Madrid)</li>
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
              <p className="o-bjj-desc">El BJJ me enseñó cosas sobre el cuerpo que no se aprenden en ningún libro. Eso se traslada directamente a mi trabajo clínico.</p>
              <a href={WA_URL} className="o-wa-btn" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", marginTop: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.535 5.849L.057 23.386a.75.75 0 00.906.948l5.741-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.933 0-3.74-.522-5.287-1.432l-.38-.225-3.907 1.025 1.003-3.795-.247-.392A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Escribime por WhatsApp
              </a>
            </div>
            <div className="o-bjj-photo-grid o-fade">
              <div className="o-bjj-photo" style={{ gridRow: "span 2" }}>
                <img src="/Griselda/bjj-brazos.jpeg" alt="Griselda Politino — BJJ Faixa Preta" />
              </div>
              <div className="o-bjj-photo">
                <img src="/Griselda/bjj-manos.jpeg" alt="Griselda Politino — Academia 360" />
              </div>
              <div className="o-bjj-photo">
                <img src="/Griselda/bjj-perfil.jpeg" alt="Griselda Politino — Academia 360 BJJ" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CROSS-LINK ARIEL ── */}
      <div className="o-crosslink">
        <div>
          <p className="o-crosslink-eyebrow">Desarrollo Integral</p>
          <h2 className="o-crosslink-h2">Entrenamiento personalizado con Ariel Rebesberger</h2>
          <p className="o-crosslink-desc">Si buscás un plan de entrenamiento específico — fuerza, recomposición corporal o rendimiento deportivo — trabajamos de manera integrada. Ariel tiene más de 30 años de experiencia en entrenamiento personalizado.</p>
        </div>
        <a href={DI_URL} className="o-crosslink-btn" target="_blank" rel="noopener noreferrer">
          Ver Desarrollo Integral →
        </a>
      </div>

      {/* ── CONTACTO ── */}
      <section id="contacto" className="o-contacto">
        <p className="o-contacto-eyebrow">Contacto</p>
        <h2 className="o-contacto-h2">Pedí tu turno</h2>
        <p className="o-contacto-sub">Consultorio en Belgrano · Buenos Aires<br />Turnos por WhatsApp</p>
        <a href={WA_URL} className="o-wa-btn" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.535 5.849L.057 23.386a.75.75 0 00.906.948l5.741-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.933 0-3.74-.522-5.287-1.432l-.38-.225-3.907 1.025 1.003-3.795-.247-.392A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          +54 9 11 2403-3484
        </a>
        <p className="o-contacto-note">Respondemos en horario de atención · Lunes a Viernes</p>
      </section>

      {/* ── FOOTER ── */}
      <footer className="o-footer">
        <span className="o-footer-brand">Griselda Politino — Kinesiología &amp; Osteopatía</span>
        <span className="o-footer-copy">Belgrano · Buenos Aires · Mat. 9741</span>
        <div className="o-footer-di">
          <a href={DI_URL} target="_blank" rel="noopener noreferrer">
            Desarrollo Integral →
          </a>
        </div>
      </footer>

    </div>
  );
}
