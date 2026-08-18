"use client";

import { Fragment, useState } from "react";
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

  return (
    <section id="metodo" className="method-section">
      <div className="container">
        <p className="section-eyebrow fade-in">Cómo trabajamos</p>
        <h2 className="section-h2 fade-in">El método</h2>

        {/* El panel de detalle vive como hermano inmediato de su tarjeta:
            en mobile (1 columna) queda pegado al botón que lo abre; en
            desktop ocupa toda la fila (grid-column: 1 / -1) debajo de los 4. */}
        <div className="method-grid" role="list">
          {cards.map((card) => {
            const isActive = activeCard === card.num;
            const panelId = `method-panel-${card.num}`;
            const headerId = `method-header-${card.num}`;
            const detail = METODO_DETAIL[card.num];

            return (
              <Fragment key={card.num}>
                <div className={`method-card ${isActive ? "active" : ""}`} role="listitem">
                  <button
                    id={headerId}
                    aria-expanded={isActive}
                    aria-controls={isActive ? panelId : undefined}
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
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className="toggle-icon"
                      aria-hidden="true"
                    >
                      ↓
                    </motion.span>
                  </button>

                  <div className="method-quick">
                    {card.list.map((item, j) => (
                      <div key={j} className="quick-item">{item}</div>
                    ))}
                  </div>
                </div>

                {/* Sin mode="wait": el nuevo panel entra mientras el viejo sale,
                    en vez de colapsar todo y reabrir (600 ms → ~250 ms). */}
                <AnimatePresence initial={false}>
                  {isActive && detail && (
                    <motion.div
                      key={card.num}
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className="method-detail"
                      style={{ overflow: "hidden" }}
                    >
                      <p className="detail-description">{detail.descripcion}</p>
                      <ul className="detail-items">
                        {detail.items.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default MethodSection;
