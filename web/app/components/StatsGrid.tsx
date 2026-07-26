"use client";

import { Stat } from "../data";

interface StatsGridProps {
  items: Stat[];
}

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <section id="stats" className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {items.map((stat, i) => (
            <div key={i} className="stat-card fade-in">
              <div className="stat-value">{stat.value}</div>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default StatsGrid;
