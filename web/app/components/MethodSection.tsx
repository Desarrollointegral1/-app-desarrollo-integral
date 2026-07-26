"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MetodoCard, METODO_DETAIL } from "../data";

interface MethodSectionProps {
  cards: MetodoCard[];
}

export function MethodSection({ cards }: MethodSectionProps) {
  const [activeCard, setActiveCard] = useState<string | null>(cards[0].num);

  const toggleCard = (num: string) => {
    setActiveCard((prev) => (prev === num ? null : num));
  };

  const activeDetail = activeCard ? METODO_DETAIL[activeCard] : null;

  return (
    <section id="metodo" className="method-section">
      <div className="container">
        <p className="section-eyebrow fade-in">Cómo trabajamos</p>
        <h2 className="section-h2 fade-in">El método</h2>

        <div className="method-grid" role="list">
          {cards.map((card) => {
            const isActive = activeCard === card.num;
            const panelId = `method-panel-${card.num}`;
            const headerId = `method-header-${card.num}`;

            return (
              <div
                key={card.num}
                className={`method-card ${isActive ? "active" : ""}`}
                role="listitem"
              >
                {/* Accessible accordion trigger */}
                <button
                  id={headerId}
                  aria-expanded={isActive}
                  aria-controls={panelId}
                  className="method-header"
                  onClick={() => toggleCard(card.num)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                  }}
                >
                  <div className="method-num" aria-hidden="true">{card.num}.</div>
                  <h3 className="method-label">{card.label}</h3>
                  <motion.span
                    animate={{ rotate: isActive ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="toggle-icon"
                    aria-hidden="true"
                  >
                    ↓
                  </motion.span>
                </button>

                {/* Quick List */}
                <div className="method-quick">
                  {card.list.map((item, j) => (
                    <div key={j} className="quick-item">— {item}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel — full width, debajo de la fila de pilares */}
        <AnimatePresence mode="wait">
          {activeCard && activeDetail && (
            <motion.div
              key={activeCard}
              id={`method-panel-${activeCard}`}
              role="region"
              aria-labelledby={`method-header-${activeCard}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="method-detail"
              style={{ overflow: "hidden" }}
            >
              <p className="detail-description">{activeDetail.descripcion}</p>
              <ul className="detail-items">
                {activeDetail.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default MethodSection;
