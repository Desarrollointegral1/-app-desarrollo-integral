import { useEffect, useRef } from "react";
import gsap from "gsap";

export interface ScrollAnimationConfig {
  duration?: number;
  delay?: number;
  stagger?: number;
  ease?: string;
}

export function useScrollAnimation(config: ScrollAnimationConfig = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const {
    duration = 0.7,
    delay = 0.2,
    stagger = 0.12,
    ease = "power3.out",
  } = config;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const timeline = gsap.timeline({ delay });

    const animatableElements = element.querySelectorAll("[data-animate]");
    if (animatableElements.length > 0) {
      animatableElements.forEach((el, index) => {
        timeline.from(
          el,
          {
            opacity: 0,
            y: 20,
            duration,
            ease,
          },
          index * stagger
        );
      });
    }

    return () => {
      timeline.kill();
    };
  }, [duration, delay, stagger, ease]);

  return containerRef;
}
