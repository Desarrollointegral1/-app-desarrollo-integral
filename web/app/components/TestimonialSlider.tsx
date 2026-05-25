"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Testimonial } from "../data";

interface TestimonialSliderProps {
  testimonials: Testimonial[];
}

export function TestimonialSlider({ testimonials }: TestimonialSliderProps) {
  const [current, setCurrent] = useState(0);

  const next = () => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const testimonial = testimonials[current];

  return (
    <section id="testimonios" className="testimonial-section">
      <div className="container">
        <p className="section-eyebrow blur-reveal">Resultados reales</p>
        <h2 className="section-h2 mask-reveal">Lo que dicen</h2>

        <div className="testimonial-wrapper" aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", damping: 28, stiffness: 100 }}
              className="testimonial-card"
            >
              <figure>
                <blockquote className="testimonial-quote">
                  <p>&ldquo;{testimonial.quote}&rdquo;</p>
                </blockquote>
                <figcaption className="testimonial-attribution">
                  <strong>{testimonial.author}</strong>
                  {testimonial.role && (
                    <span className="testimonial-role">{testimonial.role}</span>
                  )}
                </figcaption>
              </figure>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="testimonial-nav">
            <button
              onClick={prev}
              className="nav-button"
              aria-label="Previous testimonial"
            >
              ← Anterior
            </button>
            <div className="testimonial-dots">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`dot ${i === current ? "active" : ""}`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="nav-button"
              aria-label="Next testimonial"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialSlider;
