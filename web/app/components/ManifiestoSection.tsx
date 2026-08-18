"use client";

const MANIFESTO_LINES = [
  "Hay personas que nunca pensaron en que tienen un cuerpo.",
  "Hay personas que creyeron que el movimiento no era para ellas.",
  "Hay personas que llegaron rotas, por el deporte, por la vida, por la cabeza.",
  "No prometemos transformaciones físicas espectaculares.",
];

const CIERRE = "De pies a cabeza. Desde los 15 hasta los 90. Eso es Integral.";

export function ManifiestoSection() {
  return (
    <section id="manifiesto" className="manifiesto-section">
      <div className="split-grid">
        <div className="split-text">
          <p className="manifiesto-eyebrow fade-in">Nuestra visión</p>
          <h2 className="section-h2 fade-in">Que te vean, te escuchen, y te muevas.</h2>

          <div className="manifiesto-lines fade-in" role="article">
            {MANIFESTO_LINES.map((line, i) => (
              <p
                key={i}
                className={`manifiesto-line${i % 2 === 1 ? " manifiesto-line-muted" : ""}`}
              >
                {line}
              </p>
            ))}
          </div>

          <div className="manifiesto-rule fade-in" />
          <p className="manifiesto-cierre fade-in">{CIERRE}</p>
        </div>

        <div className="split-media reveal-clip">
          <img
            src="/web/espacio/vision.webp"
            alt="Alumna entrenando con mancuernas en Desarrollo Integral"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}

export default ManifiestoSection;
