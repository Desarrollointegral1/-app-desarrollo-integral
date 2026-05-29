"use client";

import { motion } from "framer-motion";

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
        {/* Eyebrow */}
        <motion.p
          className="manifiesto-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          viewport={{ once: true, margin: "-80px" }}
        >
          Manifiesto
        </motion.p>

        {/* Lines */}
        <div className="manifiesto-lines" role="article">
          {MANIFESTO_LINES.map((line, i) => (
            <motion.p
              key={i}
              className={`manifiesto-line${i % 2 === 1 ? " manifiesto-line-muted" : ""}`}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: [0.23, 1, 0.32, 1],
              }}
              viewport={{ once: true, margin: "-60px" }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* Divider */}
        <motion.div
          className="manifiesto-rule"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 1.0, ease: [0.23, 1, 0.32, 1], delay: 0.4 }}
          viewport={{ once: true, margin: "-60px" }}
          style={{ originX: 0 }}
        />

        {/* Cierre */}
        <motion.p
          className="manifiesto-cierre"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
          viewport={{ once: true, margin: "-60px" }}
        >
          {CIERRE}
        </motion.p>
      </div>
    </section>
  );
}

export default ManifiestoSection;
