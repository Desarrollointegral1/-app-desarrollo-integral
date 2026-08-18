"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FAQItem } from "../data";

interface FAQSectionProps {
  items: FAQItem[];
}

export function FAQSection({ items }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq">
      <div className="container">
        <p className="section-eyebrow fade-in">Dudas frecuentes</p>
        <h2 className="section-h2 fade-in" style={{ marginBottom: 48 }}>
          Preguntas frecuentes
        </h2>

        <div className="faq-list fade-in">
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            const panelId = `faq-panel-${i}`;
            const headerId = `faq-header-${i}`;
            return (
              <div key={item.question} className={`faq-item ${isOpen ? "active" : ""}`}>
                <button
                  id={headerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="faq-header"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span className="faq-question">{item.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="toggle-icon"
                    aria-hidden="true"
                  >
                    ↓
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <p className="faq-answer">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
