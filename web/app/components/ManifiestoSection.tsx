"use client";

const MANIFESTO_LINES = [
  "Hay personas que nunca pensaron en que tienen un cuerpo.",
  "Hasta que el cuerpo los para.",
  "Y hay personas que saben exactamente qué quieren de él.",
  "Y no saben cómo llegar.",
];

const CIERRE = "Prometemos algo más difícil de encontrar: que alguien te vea, te escuche, y te mueva. Desde el tobillo hasta la muñeca. Desde los 15 hasta los 90. Eso es Integral.";

export function ManifiestoSection() {
  return (
    <section id="manifiesto" className="manifiesto-section">
      <div className="manifiesto-inner">
        <p className="manifiesto-eyebrow fade-in">Manifiesto</p>

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
    </section>
  );
}

export default ManifiestoSection;
