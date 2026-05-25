"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  as?: "button" | "a";
  href?: string;
  target?: string;
  rel?: string;
}

export function RippleButton({
  children,
  className = "",
  onClick,
  as: Tag = "button",
  href,
  target,
  rel,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const ref = useRef<HTMLButtonElement>(null);

  const addRipple = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ripple: Ripple = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setRipples((prev) => [...prev, ripple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 700);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    addRipple(e);
    onClick?.(e);
  };

  if (Tag === "a") {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={`ripple-button ${className}`}
        onClick={(e) => addRipple(e as unknown as React.MouseEvent)}
        style={{ position: "relative", overflow: "hidden", display: "inline-flex", alignItems: "center", gap: "8px" }}
      >
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              className="ripple-dot"
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: r.x,
                top: r.y,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "rgba(200,169,110,0.45)",
                pointerEvents: "none",
                transform: "translate(-50%,-50%)",
              }}
            />
          ))}
        </AnimatePresence>
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={`ripple-button ${className}`}
      style={{ position: "relative", overflow: "hidden" }}
      {...props}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="ripple-dot"
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "rgba(200,169,110,0.45)",
              pointerEvents: "none",
              transform: "translate(-50%,-50%)",
            }}
          />
        ))}
      </AnimatePresence>
      {children}
    </button>
  );
}

export default RippleButton;
