"use client";
import { useEffect, useState } from "react";

const APP_URL = "https://app-desarrollo-integral.vercel.app";
const SHIELD_W = "/logos/icon-outline-blanco.svg"; // escudo completo con borde — hero
const ICON_W   = "/logos/icon-blanco.svg";          // símbolo interior — cierre

const METODO_DETAIL: Record<string, { descripcion: string; items: string[] }> = {
  "01": {
    descripcion:
      "El proceso comienza con una evaluación exhaustiva del alumno. Sin datos reales no hay punto de partida sólido. Usamos herramientas objetivas para entender el estado actual del cuerpo y definir desde dónde se trabaja.",
    items: [
      "Composición corporal por bioimpedancia (masa muscular, grasa, hidratación)",
      "Evaluación de movilidad articular y rangos funcionales",
      "Test de fuerza en patrones básicos (empuje, tracción, cadena posterior)",
      "Relevamiento del historial deportivo, lesiones y objetivos",
      "Definición de metas concretas y medibles a corto y largo plazo",
    ],
  },
  "02": {
    descripcion:
      "Con los datos de la evaluación se diseña un plan específico para esa persona. No existe un plan estándar. Cada alumno trabaja con ejercicios, cargas, volumen y progresión pensados para su punto de partida y su objetivo.",
    items: [
      "Selección de ejercicios según movilidad, fuerza y objetivos individuales",
      "Periodización estructurada con ciclos de volumen, fuerza e intensidad",
      "Progresión de cargas basada en datos registrados de cada sesión",
      "Integración de trabajo de movilidad, activación y calentamiento específico",
      "Ajuste continuo según la respuesta del alumno al entrenamiento",
    ],
  },
  "03": {
    descripcion:
      "El seguimiento no es una revisión mensual: es parte de cada sesión. Cada dato queda registrado en el aplicativo y permite tomar decisiones con información real, no con suposiciones.",
    items: [
      "Registro de cargas, series y repeticiones en cada entrenamiento",
      "Control periódico de composición corporal (bioimpedancia)",
      "Análisis de evolución en el tiempo con datos históricos",
      "Actualización del plan según progreso real y nuevos objetivos",
      "Comunicación directa entre coach y alumno para ajustes inmediatos",
    ],
  },
};

const metodoCards = [
  { num: "01", label: "Evaluación", featured: true, list: ["Composición corporal (bioimpedancia)", "Movilidad", "Nivel de fuerza", "Historial"] },
  { num: "02", label: "Planificación", featured: false, list: ["Plan de entrenamiento personalizado", "Selección específica de ejercicios", "Progresión estructurada"] },
  { num: "03", label: "Seguimiento", featured: false, list: ["Ajustes constantes", "Control de evolución", "Actualización del plan"] },
];

/* Logo: DI - LOGO - SOLO (escudo + texto) como imagen completa */
function LogoMark({ h = 44, opacity = 0.9 }: { h?: number; opacity?: number }) {
  return (
    <img
      src="/logos/logo-blanco.svg"
      alt="Desarrollo Integral"
      style={{ height: h, width: "auto", display: "block", opacity }}
    />
  );
}

export default function Home() {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } }); },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".fade-in").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const toggleCard = (num: string) => setActiveCard((prev) => (prev === num ? null : num));

  return (
    <>
      {/* NAV */}
      <nav>
        <div className="nav-logo">
          <a href="#hero" className="nav-logo-link">
            <LogoMark h={56} opacity={0.9} />
          </a>
        </div>
        <div className="nav-links">
          <a href="#metodo">Método</a>
          <a href="#plataforma">Plataforma</a>
          <a href="#equipo">Equipo</a>
          <a href={APP_URL} className="nav-cta">Aplicativo</a>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero">
        <div className="hero-shield">
          <div className="shield-spin-wrap">
            <img className="shield-spin" src={SHIELD_W} alt="" width={700} style={{ opacity: 0.40 }} />
          </div>
        </div>
        <div className="hero-inner">
          <p className="hero-eyebrow">Wellness starts with movement</p>
          <h1 className="hero-h1">
            Fuerza,<br />movimiento<br /><em>y rendimiento</em><br /><span className="smaller">a largo plazo.</span>
          </h1>
        </div>
        <div className="hero-bottom">
          <p className="hero-desc">Planes de entrenamiento personalizados, con seguimiento y registro completo de cada proceso.</p>
          <a href={APP_URL} className="hero-cta">Ir al aplicativo<span className="hero-cta-line"></span></a>
        </div>
      </section>

      {/* STATS */}
      <section id="stats">
        <div className="stats-grid">
          <div className="stat-item fade-in"><div className="stat-num">30+</div><div className="stat-label">Años de experiencia</div></div>
          <div className="stat-item fade-in"><div className="stat-num">100%</div><div className="stat-label">Planes individuales</div></div>
          <div className="stat-item fade-in"><div className="stat-num">Datos reales</div><div className="stat-label">Para cada ajuste</div></div>
          <div className="stat-item fade-in"><div className="stat-num">Proceso</div><div className="stat-label">Medido y registrado</div></div>
        </div>
      </section>

      {/* ESPACIO — video + foto del lugar */}
      <section id="espacio-media" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="espacio-media-grid">
          <div className="espacio-video-cell">
            <video
              src="/espacio/video.mp4"
              controls
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
          <div
            className="espacio-foto-cell espacio-foto-right"
            style={{ backgroundImage: "url('/espacio/gym.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
          >
            <span className="photo-caption">El espacio · Cabildo 450</span>
          </div>
        </div>
      </section>

      {/* IDENTIDAD */}
      <section id="identidad">
        <div className="container">
          <p className="identidad-eyebrow fade-in">Qué es Desarrollo Integral</p>
          <div className="identidad-grid">
            <div className="fade-in">
              <p className="identidad-quote">&ldquo;Un método de trabajo construido a partir de más de 30 años de experiencia.&rdquo;</p>
              <p className="identidad-body">No se trabaja con planes genéricos. Cada alumno entrena con un plan personalizado, diseñado según su punto de partida, sus objetivos y su evolución. El foco está en construir un cuerpo fuerte, funcional y adaptable en el tiempo.</p>
            </div>
            <ul className="identidad-list fade-in">
              <li><span className="list-num">01.</span><span className="list-text">Planes de entrenamiento personalizados</span></li>
              <li><span className="list-num">02.</span><span className="list-text">Actualización constante según evolución</span></li>
              <li><span className="list-num">03.</span><span className="list-text">Seguimiento individual real</span></li>
              <li><span className="list-num">04.</span><span className="list-text">Registro completo del proceso</span></li>
              <li><span className="list-num">05.</span><span className="list-text">Método basado en experiencia y datos</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* MÉTODO */}
      <section id="metodo">
        <div className="container">
          <div className="metodo-header fade-in">
            <h2 className="metodo-title">El Método</h2>
            <span className="metodo-sub">Cómo se trabaja</span>
          </div>
          <div className="metodo-cards">
            {metodoCards.map(({ num, label, featured, list }) => {
              const isOpen = activeCard === num;
              const detail = METODO_DETAIL[num];
              return (
                <div
                  key={num}
                  className={`metodo-card${featured ? " featured" : ""} fade-in`}
                  style={isOpen ? { borderColor: "rgba(200,169,110,0.4)", background: "rgba(200,169,110,0.06)", cursor: "pointer" } : { cursor: "pointer" }}
                  onClick={() => toggleCard(num)}
                >
                  <div className="metodo-card-num">{num}</div>
                  <h3 className="metodo-card-title">{label}</h3>
                  <ul className="metodo-card-list">
                    {list.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                  <div className="metodo-expand-hint">
                    <span>{isOpen ? "Cerrar" : "Ver más"}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .25s" }}>
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                  {isOpen && (
                    <div className="metodo-detail">
                      <p className="metodo-detail-desc">{detail.descripcion}</p>
                      <ul className="metodo-detail-list">
                        {detail.items.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PLATAFORMA */}
      <section id="plataforma">
        <div className="container">
          <div className="plataforma-grid">
            <div className="fade-in">
              <p className="plataforma-eyebrow">Seguimiento y sistema</p>
              <h2 className="plataforma-h2">Cada alumno tiene acceso a su aplicativo de entrenamiento.</h2>
              <p className="plataforma-desc">Todo el proceso queda organizado y disponible en todo momento. No depende de la memoria: depende de datos.</p>
              <div className="blockquote-bar" style={{ marginTop: 40 }}>
                <p>&ldquo;El proceso no queda en la memoria: queda registrado.&rdquo;</p>
              </div>
            </div>
            <div className="app-list fade-in">
              <div className="app-item"><span className="app-num">1</span><span className="app-name">Plan de entrenamiento actualizado</span></div>
              <div className="app-item"><span className="app-num">2</span><span className="app-name">Ejercicios asignados</span></div>
              <div className="app-item"><span className="app-num">3</span><span className="app-name">Cargas utilizadas</span></div>
              <div className="app-item"><span className="app-num">4</span><span className="app-name">Registro de cada sesión</span></div>
              <div className="app-item"><span className="app-num">5</span><span className="app-name">Estudios de bioimpedancia</span></div>
              <div className="app-item"><span className="app-num">6</span><span className="app-name">Evolución en el tiempo</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ÁREAS */}
      <section id="areas">
        <div className="container">
          <p className="areas-eyebrow fade-in">Áreas</p>
          <div className="areas-grid fade-in">
            <div className="area-item"><h3 className="area-title">Entrenamiento físico</h3><p className="area-desc">Fuerza, movilidad y recomposición corporal</p></div>
            <div className="area-item"><h3 className="area-title">Deportes de combate</h3><p className="area-desc">Brazilian Jiu-Jitsu y preparación específica</p></div>
            <div className="area-item"><h3 className="area-title">Salud y movimiento</h3><p className="area-desc">Kinesiología, osteopatía y prevención</p></div>
          </div>
        </div>
      </section>

      {/* EQUIPO — primero los profes */}
      <section id="equipo">
        <div className="container">
          <p className="equipo-eyebrow fade-in">Equipo</p>
          <div className="equipo-grid fade-in">
            <div className="equipo-card">
              <div className="equipo-avatar">
                <img src="/equipo/ariel.jpg" alt="Ariel Rebesberger" className="equipo-avatar-img" />
              </div>
              <div>
                <h3 className="equipo-name">Ariel Rebesberger</h3>
                <p className="equipo-role">Head Coach — Método y rendimiento</p>
                <ul className="equipo-cv">
                  <li>Licenciado en Educación Física (ISEF)</li>
                  <li>Más de 30 años de experiencia en entrenamiento personalizado</li>
                  <li>Especialización en fuerza, recomposición corporal y rendimiento</li>
                  <li>Entrenador de atletas de Brazilian Jiu-Jitsu</li>
                  <li>Creador del método Desarrollo Integral</li>
                </ul>
              </div>
            </div>
            <div className="equipo-card">
              <div className="equipo-avatar">
                <img src="/equipo/griselda.jpg" alt="Griselda Politino" className="equipo-avatar-img" />
              </div>
              <div>
                <h3 className="equipo-name">Griselda Politino</h3>
                <p className="equipo-role">Kinesióloga — Movimiento y rehabilitación</p>
                <ul className="equipo-cv">
                  <li>Licenciada en Kinesiología y Fisiatría (UBA)</li>
                  <li>Especialización en osteopatía y terapia manual</li>
                  <li>Prevención y rehabilitación de lesiones deportivas</li>
                  <li>Evaluación y corrección del movimiento funcional</li>
                  <li>Trabajo integrado con el equipo de entrenamiento</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS — después del equipo */}
      <section id="testimonios">
        <div className="container">
          <p className="testimonios-eyebrow fade-in">Lo que dicen los alumnos</p>
          <div className="testimonios-grid">
            <div className="testimonio-card fade-in"><div className="testimonio-stars">★★★★★</div><p className="testimonio-q">&ldquo;El seguimiento es completamente diferente a cualquier otro lugar. Cada ajuste tiene sentido.&rdquo;</p><p className="testimonio-name">Marcos G. — 2 años</p></div>
            <div className="testimonio-card fade-in"><div className="testimonio-stars">★★★★★</div><p className="testimonio-q">&ldquo;Nunca había tenido un plan tan específico para mí. Se nota la diferencia en cada sesión.&rdquo;</p><p className="testimonio-name">Florencia R. — 8 meses</p></div>
            <div className="testimonio-card fade-in"><div className="testimonio-stars">★★★★★</div><p className="testimonio-q">&ldquo;El registro de cada sesión me permite ver mi progreso real. Eso cambia todo.&rdquo;</p><p className="testimonio-name">Carlos B. — 1 año</p></div>
          </div>
        </div>
      </section>

      {/* UBICACIÓN */}
      <section id="espacio">
        <div className="container">
          <div className="espacio-grid">
            <div className="fade-in">
              <p className="espacio-eyebrow">El espacio</p>
              <p className="espacio-title">Un espacio diseñado para entrenar con foco.</p>
              <ul className="espacio-list">
                <li>Equipamiento orientado a rendimiento</li>
                <li>Espacios para fuerza y movilidad</li>
                <li>Ambiente sin distracciones</li>
              </ul>
            </div>
            <div className="fade-in">
              <p className="espacio-eyebrow">Ubicación</p>
              <p className="ubicacion-address">Cabildo 450</p>
              <p className="ubicacion-detail">3er piso · Buenos Aires</p>
              <div className="map-container">
                <iframe
                  src="https://maps.google.com/maps?q=Cabildo+450,+Buenos+Aires,+Argentina&output=embed&z=16"
                  width="100%" height="220"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación Desarrollo Integral"
                />
                <a href="https://maps.google.com/?q=Cabildo+450,+Buenos+Aires,+Argentina" target="_blank" rel="noopener noreferrer" className="map-link">
                  Ver en Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GRISELDA CROSS-LINK */}
      <section id="griselda" style={{ borderTop: "1px solid var(--border)", background: "var(--bg2)", padding: "80px 0" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 40, alignItems: "center" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", border: "1px solid var(--gold-border)", flexShrink: 0 }}>
              <img src="/Griselda/head-sonriendo.jpeg" alt="Griselda Politino" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
            </div>
            <div>
              <p style={{ fontSize: 10, letterSpacing: "0.42em", color: "var(--t3)", textTransform: "uppercase", fontFamily: "var(--sans)", marginBottom: 12 }}>Kinesiología · Osteopatía · Belgrano</p>
              <h2 style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: "clamp(22px, 3vw, 32px)", color: "rgba(255,255,255,0.9)", marginBottom: 12, lineHeight: 1.3 }}>
                Griselda Politino — Kinesióloga &amp; Osteópata
              </h2>
              <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.8, maxWidth: 560, marginBottom: 24 }}>
                Kinesióloga (UBA · Mat. 9741), especializada en osteopatía estructural y visceral (EOM, Instituto Barral) y RPG. Trabajamos de manera integrada: entrenamiento y salud como un mismo proceso.
              </p>
              <a href="https://osteopatia.desarrollointegral.vercel.app" style={{ display: "inline-block", border: "1px solid var(--gold-border)", color: "var(--gold)", padding: "12px 32px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--sans)", transition: "background .2s, color .2s" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--gold)"; (e.target as HTMLElement).style.color = "#000"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; (e.target as HTMLElement).style.color = "var(--gold)"; }}>
                Ver consultorio de Griselda →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CIERRE */}
      <section id="cierre">
        <div className="cierre-shield">
          <div className="shield-spin-wrap">
            <img className="shield-spin" src={ICON_W} alt="" width={900} style={{ opacity: 0.28 }} />
          </div>
        </div>
        <div className="cierre-inner fade-in">
          <h2 className="cierre-h2">
            Entrenamiento estructurado.<br />
            <em>Seguimiento real.</em><br />
            Progreso medible.
          </h2>
          <p className="cierre-desc">Cada alumno tiene un plan propio y todo su proceso está medido y registrado.</p>
          <a href={APP_URL} className="cierre-btn">Ir al aplicativo</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <a href="#hero" className="footer-logo-link">
          <LogoMark h={40} opacity={0.4} />
        </a>
        <p className="footer-copy">© 2026 Desarrollo Integral · Cabildo 450, 3er piso · Buenos Aires</p>
      </footer>
    </>
  );
}
