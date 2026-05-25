"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Stat } from "../data";

interface StatsGridProps {
  items: Stat[];
}

// Extract numeric portion from strings like "30+", "100%", "Datos reales"
function parseNumericStat(value: string): { num: number; suffix: string } | null {
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  return { num: parseFloat(match[1]), suffix: match[2] || "" };
}

export function StatsGrid({ items }: StatsGridProps) {
  const statsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = statsRef.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) {
              const valueEl = entry.target.querySelector(".stat-value") as HTMLElement;
              if (!valueEl) return;

              const parsed = parseNumericStat(items[idx].value);

              // Only animate numeric stats; text-only stats fade in naturally
              if (parsed) {
                const obj = { val: 0 };
                gsap.to(obj, {
                  val: parsed.num,
                  duration: 2,
                  ease: "power2.out",
                  onUpdate: () => {
                    valueEl.textContent = Math.round(obj.val) + parsed.suffix;
                  },
                  onComplete: () => {
                    valueEl.textContent = items[idx].value;
                  },
                });
              }

              // Entrance animation for the card
              gsap.from(entry.target, {
                opacity: 0,
                y: 24,
                duration: 0.7,
                delay: idx * 0.1,
                ease: "power3.out",
              });
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "-40px" }
    );

    statsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <section id="stats" className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {items.map((stat, i) => (
            <div
              key={i}
              ref={(el) => {
                statsRef.current[i] = el;
              }}
              className="stat-card fade-in"
            >
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
