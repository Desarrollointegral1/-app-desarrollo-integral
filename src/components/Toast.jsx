import { S, TS } from "../utils/theme.js";

// ── TOAST ─────────────────────────────────────────────────────────────────────
export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: S.card2,
        border: "1px solid " + S.border2,
        borderRadius: 10,
        padding: "11px 22px",
        color: S.white,
        fontSize: TS.chip,
        fontWeight: 600,
        zIndex: 9999,
        pointerEvents: "none",
        maxWidth: 320,
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        letterSpacing: 0.3,
      }}
    >
      {" "}
      {msg}{" "}
    </div>
  );
}
