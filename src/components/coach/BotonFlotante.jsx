
// Botón flotante (logo arrastrable) — antes `{mostrarBoton && (<button…>)}` en el return.
// Movido textualmente desde CoachFlotante.jsx (refactor 2026-08-18): solo JSX,
// todo el estado y los handlers viven en CoachFlotante.jsx y llegan por props.
export function BotonFlotante({
  BORDER,
  CIRCULO,
  LOGO,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  pos,
}) {
  return (
    <button
      aria-label="Abrir entrenador"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: CIRCULO,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
        cursor: "grab",
        touchAction: "none",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        overflow: "hidden",
        perspective: "220px",
        zIndex: 2147483000,
        padding: 0,
        transition: "transform 0.15s",
      }}
    >
      <img
        src={LOGO}
        alt=""
        draggable={false}
        style={{
          width: 42,
          height: 42,
          marginBottom: 3,
          pointerEvents: "none",
          userSelect: "none",
          animation: "coachLogoSpin 6s ease-in-out infinite",
        }}
      />
    </button>
  );
}
