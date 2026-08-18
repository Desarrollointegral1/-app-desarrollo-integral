"use client";

import { WHATSAPP_URL } from "../data";

export function CTAForm() {
  return (
    <section id="cierre" className="cta-form-wrapper">
      <div className="split-grid split-grid-reverse">
        <div className="split-media reveal-clip">
          <img
            src="/web/espacio/cierre.webp"
            alt="El rack de Desarrollo Integral con la barra cargada"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="split-text cta-form fade-in">
          <p className="section-eyebrow">Desarrollo Integral</p>
          <h2 className="form-title">
            El cuerpo es lo único tuyo para siempre.
            <br />
            Este es el lugar para tratarlo así.
          </h2>
          <p className="form-desc">
            Sentís el peso, sentís la gravedad, sentís que estás vivo.
            <br />
            Salís con un sistema personal de entrenamiento. No con una rutina genérica.
          </p>

          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="form-submit">
            Escribinos
          </a>
        </div>
      </div>
    </section>
  );
}

export default CTAForm;
