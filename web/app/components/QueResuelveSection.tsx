"use client";

import { ResuelveRow } from "../data";

interface QueResuelveSectionProps {
  rows: ResuelveRow[];
}

export function QueResuelveSection({ rows }: QueResuelveSectionProps) {
  return (
    <section id="que-resuelve">
      <div className="container">
        <p className="section-eyebrow fade-in">Qué buscás</p>
        <h2 className="section-h2 fade-in">Qué te resuelve</h2>

        <div className="resuelve-table fade-in">
          <div className="resuelve-head">
            <span>Buscás...</span>
            <span>Te resuelve</span>
          </div>
          {rows.map((row) => (
            <div key={row.buscas} className="resuelve-row">
              <span className="resuelve-buscas">{row.buscas}</span>
              <span className="resuelve-resultado">{row.resuelve}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default QueResuelveSection;
