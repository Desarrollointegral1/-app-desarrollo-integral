import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  onIntersect?: (isVisible: boolean) => void;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { onIntersect, ...ioOptions } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
      onIntersect?.(entry.isIntersecting);
    }, {
      threshold: 0.08,
      rootMargin: "-32px 0px",
      ...ioOptions,
    });

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [onIntersect, ioOptions]);

  return { ref: elementRef, isVisible };
}
