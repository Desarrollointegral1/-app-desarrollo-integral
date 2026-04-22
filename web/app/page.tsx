"use client";
import { useEffect } from "react";

const APP_URL = "https://app-desarrollo-integral.vercel.app";
const LOGO = "/logos/DI-LOGO-FILL.png";
const ICON = "/logos/DI-ICON-FILL.png";

export default function Home() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".fade-in").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* NAV */}
      <nav>
        <div className="nav-logo">
          <img src={LOGO} alt="Desarrollo Integral" style={{ height: 36, filter: "invert(1)", opacity: 0.85, display: "block" }} />
        </div>
        <div className="nav-links">
          <a href="#metodo">Método</a>
          <a href="#plataforma">Plataforma</a>
          <a href="#equipo">Equipo</a>
          <a href={APP_URL} className="nav-cta">Ingresar</a>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero">
        <div className="hero-shield">
          <div className="shield-spin-wrap">
            <img className="shield-spin" src={ICON} alt="" width={700} style={{ filter: "invert(1)", opacity: 0.09, display: "block" }} />
          </div>
        </div>
        <div className="hero-inner">
          <p className="hero-eyebrow">Wellness starts with movement</p>
          <h1 className="hero-h1">
            Fuerza,<br />
            movimiento<br />
            <em>y rendimiento</em><br />
            <span className="smaller">a largo plazo.</span>
          </h1>
        </div>
        <div className="hero-bottom">
          <p className="hero-desc">Planes de entrenamiento personalizados, con seguimiento y registro completo de cada proceso.</p>
          <a href={APP_URL} className="hero-cta">
            Acceder al aplicativo
            <span className="hero-cta-line"></span>
          </a>
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

      {/* VIDEO */}
      <section id="video">
        <div className="video-wrap">
          <div className="video-box">
            <div className="video-stripes"></div>
            <div className="video-play">
              <div className="play-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 3l9 5-9 5V3z" fill="#C8A96E" />
                </svg>
              </div>
              <p className="video-label">Video del espacio — próximamente</p>
            </div>
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

      {/* PHOTO STRIP */}
      <div className="photo-strip">
        <div className="photo-cell"><div className="photo-stripes"></div><span className="photo-caption">foto del espacio · pendiente</span></div>
        <div className="photo-cell"><div className="photo-stripes"></div><span className="photo-caption">entrenamiento · pendiente</span></div>
        <div className="photo-cell"><div className="photo-stripes"></div><span className="photo-caption">equipo · pendiente</span></div>
      </div>

      {/* MÉTODO */}
      <section id="metodo">
        <div className="container">
          <div className="metodo-header fade-in">
            <h2 className="metodo-title">El Método</h2>
            <span className="metodo-sub">Cómo se trabaja</span>
          </div>
          <div className="metodo-cards">
            <div className="metodo-card featured fade-in">
              <div className="metodo-card-num">01</div>
              <h3 className="metodo-card-title">Evaluación</h3>
              <ul className="metodo-card-list">
                <li>Composición corporal (bioimpedancia)</li>
                <li>Movilidad</li>
                <li>Nivel de fuerza</li>
                <li>Historial</li>
              </ul>
            </div>
            <div className="metodo-card fade-in">
              <div className="metodo-card-num">02</div>
              <h3 className="metodo-card-title">Planificación</h3>
              <ul className="metodo-card-list">
                <li>Plan de entrenamiento personalizado</li>
                <li>Selección específica de ejercicios</li>
                <li>Progresión estructurada</li>
              </ul>
            </div>
            <div className="metodo-card fade-in">
              <div className="metodo-card-num">03</div>
              <h3 className="metodo-card-title">Seguimiento</h3>
              <ul className="metodo-card-list">
                <li>Ajustes constantes</li>
                <li>Control de evolución</li>
                <li>Actualización del plan</li>
              </ul>
            </div>
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
              <a href={APP_URL} className="plataforma-cta">Acceder al aplicativo</a>
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
            <div className="area-item">
              <h3 className="area-title">Entrenamiento físico</h3>
              <p className="area-desc">Fuerza, movilidad y recomposición corporal</p>
            </div>
            <div className="area-item">
              <h3 className="area-title">Deportes de combate</h3>
              <p className="area-desc">Brazilian Jiu-Jitsu y preparación específica</p>
            </div>
            <div className="area-item">
              <h3 className="area-title">Salud y movimiento</h3>
              <p className="area-desc">Kinesiología, osteopatía y prevención</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section id="testimonios">
        <div className="container">
          <p className="testimonios-eyebrow fade-in">Lo que dicen los alumnos</p>
          <div className="testimonios-grid">
            <div className="testimonio-card fade-in">
              <div className="testimonio-stars">★★★★★</div>
              <p className="testimonio-q">&ldquo;El seguimiento es completamente diferente a cualquier otro lugar. Cada ajuste tiene sentido.&rdquo;</p>
              <p className="testimonio-name">Alumno — 2 años</p>
            </div>
            <div className="testimonio-card fade-in">
              <div className="testimonio-stars">★★★★★</div>
              <p className="testimonio-q">&ldquo;Nunca había tenido un plan tan específico para mí. Se nota la diferencia en cada sesión.&rdquo;</p>
              <p className="testimonio-name">Alumno — 8 meses</p>
            </div>
            <div className="testimonio-card fade-in">
              <div className="testimonio-stars">★★★★★</div>
              <p className="testimonio-q">&ldquo;El registro de cada sesión me permite ver mi progreso real. Eso cambia todo.&rdquo;</p>
              <p className="testimonio-name">Alumno — 1 año</p>
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section id="equipo">
        <div className="container">
          <p className="equipo-eyebrow fade-in">Equipo</p>
          <div className="equipo-grid fade-in">
            <div className="equipo-card">
              <div className="equipo-icon">
                <img src={ICON} alt="" width={44} height={44} style={{ filter: "invert(1)", opacity: 0.55, display: "block" }} />
              </div>
              <div>
                <h3 className="equipo-name">Ariel Rebesberger</h3>
                <p className="equipo-role">Head Coach — Método y rendimiento</p>
                <p className="equipo-bio">Más de 30 años de experiencia en entrenamiento. Creador del método Desarrollo Integral.</p>
              </div>
            </div>
            <div className="equipo-card">
              <div className="equipo-icon">
                <img src={ICON} alt="" width={44} height={44} style={{ filter: "invert(1)", opacity: 0.55, display: "block" }} />
              </div>
              <div>
                <h3 className="equipo-name">Griselda Politino</h3>
                <p className="equipo-role">Movimiento y salud</p>
                <p className="equipo-bio">Enfoque en rehabilitación, prevención y control del movimiento.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ESPACIO + UBICACIÓN */}
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
              <div className="map-placeholder">
                <div className="map-stripes"></div>
                <div className="map-pin">
                  <div className="map-pin-dot"></div>
                  <p>Cabildo 450, 3er piso · Buenos Aires</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CIERRE CTA */}
      <section id="cierre">
        <div className="cierre-shield">
          <div className="shield-spin-wrap">
            <img className="shield-spin" src={ICON} alt="" width={900} style={{ filter: "invert(1)", opacity: 0.07, display: "block" }} />
          </div>
        </div>
        <div className="cierre-inner fade-in">
          <svg className="cierre-icon" width="52" height="52" viewBox="0 0 1500 1500" style={{ opacity: 0.45 }}>
            <path fill="#fff" d="M1056.805,427.706l-306.805-109.938-306.822,109.938c-18.505,6.647-30.945,24.314-30.945,43.965v325.811c0,26.25,5.308,51.758,15.763,75.782,18.425,42.352,60.003,122.361,131.412,182.331,100.16,84.107,182.895,122.958,190.285,126.636,0,0,95.4-46.434,190.899-126.636,71.441-59.97,113.003-139.979,131.411-182.331,10.455-24.023,15.763-49.515,15.763-75.765v-325.827c0-19.652-12.439-37.318-30.961-43.965ZM750.001,474.705c31.235,0,56.565,25.33,56.565,56.566s-25.33,56.566-56.565,56.566-56.567-25.315-56.567-56.566,25.331-56.566,56.567-56.566ZM625.122,779.864c-53.565-107.163-131.896-185.042-133.235-186.365,1.807,1.049,116.956,68.731,165.761,166.826,37.866,76.072,42.917,221.537,42.917,221.537,0,0-21.394-93.917-75.443-201.998ZM875.071,779.864c-54.033,108.082-75.442,201.998-75.442,201.998,0,0,5.05-145.465,42.917-221.537,48.806-98.095,163.954-165.777,165.761-166.826-1.339,1.323-79.67,79.202-133.235,186.365ZM907.694,621.686c-35.608,27.686-65.908,61.729-87.769,101.177-14.505,26.153-27.848,57.453-36.657,93.787-25.798,106.452-32.107,223.715-33.381,254.579-.048,1.339-.097,2.501-.129,3.501-.048-1-.097-2.162-.145-3.501-1.275-30.864-7.599-148.127-33.398-254.579-9.471-39.093-24.201-72.377-39.98-99.676-21.345-36.931-50.129-69.005-83.817-95.191-73.297-56.953-126.603-130.105-127.943-131.977,2.469,2.194,161.389,143.658,285.476,143.738h.097c124.086-.081,282.991-141.544,285.476-143.738-1.339,1.872-54.597,74.943-127.83,131.88Z" />
          </svg>
          <h2 className="cierre-h2">
            Entrenamiento estructurado.<br />
            <em>Seguimiento real.</em><br />
            Progreso medible.
          </h2>
          <p className="cierre-desc">Cada alumno tiene un plan propio y todo su proceso está medido y registrado.</p>
          <a href={APP_URL} className="cierre-btn">Acceder al aplicativo</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">
          <img src={LOGO} alt="Desarrollo Integral" style={{ height: 20, filter: "invert(1)", opacity: 0.22, display: "block" }} />
        </div>
        <p className="footer-copy">© 2026 Desarrollo Integral · Cabildo 450, 3er piso · Buenos Aires</p>
      </footer>
    </>
  );
}
