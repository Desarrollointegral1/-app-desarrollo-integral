"use client";

import RippleButton from "./RippleButton";
import { WHATSAPP_URL } from "../data";

export function CTAForm() {
  return (
    <section id="cierre" className="cta-form-wrapper">
      <div className="cta-form fade-in">
        <p className="section-eyebrow" style={{ marginBottom: 12 }}>Desarrollo Integral</p>
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

        <RippleButton
          as="a"
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="form-submit"
        >
          Escribinos
        </RippleButton>
      </div>
    </section>
  );
}

export default CTAForm;
