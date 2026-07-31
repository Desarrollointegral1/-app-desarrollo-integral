import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { S, TAP } from "../utils/theme.js";

// 2026-07-31, pedido de Lucas: "entrenar - que la barra la tengas que
// presionar a la izquierda y arrastrar a la derecha y que se llene de
// rojo" — reemplaza el botón ENTRENAR de tap simple por una barra de
// swipe-to-confirm (patrón "deslizá para confirmar"). Pointer events nativos
// (mouse + touch en uno), sin librería de gestos nueva.
export default function SwipeToConfirm({ label = "DESLIZÁ PARA ENTRENAR", confirmingLabel = "ENTRENANDO...", onConfirm, confirming = false }) {
  const trackRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const THUMB = TAP;
  const maxX = () => (trackRef.current ? trackRef.current.offsetWidth - THUMB - 8 : 0);

  const onPointerDown = (e) => {
    if (confirming) return;
    setDragging(true);
    e.target.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging || confirming) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left - THUMB / 2, 0), maxX());
    setDragX(x);
  };
  const finish = () => {
    if (!dragging) return;
    setDragging(false);
    const done = maxX() > 0 && dragX >= maxX() * 0.82;
    if (done) {
      setDragX(maxX());
      onConfirm();
    } else {
      setDragX(0);
    }
  };

  const pct = maxX() > 0 ? dragX / maxX() : 0;

  return (
    <div
      ref={trackRef}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      style={{
        position: "relative",
        width: "min(320px, 100%)",
        height: TAP + 8,
        borderRadius: (TAP + 8) / 2,
        background: S.card2,
        border: "1px solid " + S.border,
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {/* Relleno rojo — crece con el drag, pedido literal de Lucas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `calc(${THUMB / 2 + 4}px + ${pct} * (100% - ${THUMB + 8}px))`,
          background: confirming ? S.red : "linear-gradient(90deg, #7a1414, " + S.red + ")",
          transition: dragging ? "none" : "width 0.25s ease",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: S.white,
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: 1.5,
          opacity: pct > 0.5 ? 0 : 1,
          transition: "opacity 0.15s",
          pointerEvents: "none",
        }}
      >
        {confirming ? confirmingLabel : label}
      </div>
      <div
        onPointerDown={onPointerDown}
        style={{
          position: "absolute",
          top: 4,
          left: 4 + dragX,
          width: THUMB,
          height: THUMB,
          borderRadius: "50%",
          background: S.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: confirming ? "default" : "grab",
          transition: dragging ? "none" : "left 0.25s ease",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
        }}
      >
        {confirming ? (
          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid " + S.bg, borderTopColor: "transparent", animation: "diSpin 0.6s linear infinite" }} />
        ) : (
          <ChevronRight size={20} color={S.bg} />
        )}
      </div>
    </div>
  );
}
