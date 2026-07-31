import { useCallback, useRef, useState } from "react";
import { S, TS, FONT_BODY } from "../utils/theme.js";

// ══════════════════════════════════════════════════════════════════════
// PULL TO REFRESH — tirar hacia abajo para recargar (patrón Instagram/Facebook)
//
// El gesto que todos los alumnos ya saben hacer, incluidos los de 70+: no hay
// nada que aprender ni botón que encontrar. Solo se activa cuando la pantalla
// está scrolleada arriba de todo y el gesto es táctil; en desktop (o con
// mouse) el componente se comporta como un <div> común.
//
// USO
//   <PullToRefresh onRefresh={cargarAlumnos}>
//     <ListaAlumnos … />
//   </PullToRefresh>
//
// PROPS
//   onRefresh  fn() → puede devolver una promesa; el indicador queda en
//              "Actualizando" hasta que resuelve.
//   umbral     px de arrastre para activar (default 70)
//   children   contenido normal
//   style      estilos extra del contenedor
// ══════════════════════════════════════════════════════════════════════

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
const MAX = 110; // tope del arrastre: más que esto no aporta información

export default function PullToRefresh({ onRefresh, children, umbral = 70, style }) {
  const [dist, setDist] = useState(0);
  const [refrescando, setRefrescando] = useState(false);
  const [soltando, setSoltando] = useState(false); // true = volviendo con transición
  const inicioY = useRef(null);
  const cont = useRef(null);

  // El gesto solo vale si NADA está scrolleado: ni la ventana ni el propio
  // contenedor (por si algún día se lo mete en un panel con overflow).
  const arribaDeTodo = useCallback(() => {
    const propio = cont.current ? cont.current.scrollTop : 0;
    const ventana = window.scrollY || document.documentElement.scrollTop || 0;
    return propio <= 0 && ventana <= 0;
  }, []);

  const onTouchStart = (e) => {
    if (refrescando || e.touches.length !== 1 || !arribaDeTodo()) {
      inicioY.current = null;
      return;
    }
    inicioY.current = e.touches[0].clientY;
    setSoltando(false);
  };

  const onTouchMove = (e) => {
    if (inicioY.current == null || refrescando) return;
    const dy = e.touches[0].clientY - inicioY.current;
    // Si arrastra para arriba, o se scrolleó en el medio, se cancela y el
    // scroll nativo sigue funcionando normal.
    if (dy <= 0 || !arribaDeTodo()) {
      inicioY.current = null;
      setDist(0);
      return;
    }
    // Resistencia: el recorrido del dedo no es el del indicador. Cuanto más
    // tira, menos avanza — así el gesto tiene "peso" y no se dispara solo.
    setDist(Math.min(MAX, dy * 0.5));
  };

  const onTouchEnd = () => {
    if (inicioY.current == null) return;
    inicioY.current = null;
    const activar = dist >= umbral;
    setSoltando(true);
    if (!activar) {
      setDist(0);
      return;
    }
    setDist(umbral); // el indicador queda anclado mientras carga
    setRefrescando(true);
    Promise.resolve()
      .then(() => onRefresh && onRefresh())
      .catch((e) => console.error("[PullToRefresh] falló onRefresh:", e))
      .finally(() => {
        setRefrescando(false);
        setDist(0);
      });
  };

  const progreso = Math.min(1, dist / umbral);
  const listo = dist >= umbral;
  const texto = refrescando ? "Actualizando…" : listo ? "Soltá para actualizar" : "Tirá para actualizar";

  return (
    <div
      ref={cont}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      style={{ position: "relative", touchAction: "pan-y", overscrollBehaviorY: "contain", ...style }}
    >
      <style>{"@keyframes di-ptr-spin{to{transform:rotate(360deg)}}"}</style>
      {/* Indicador: vive fuera de la caja (top negativo) y baja con el dedo.
          No ocupa lugar en el layout, así que no empuja el contenido. */}
      <div
        aria-hidden={dist === 0 && !refrescando}
        style={{
          position: "absolute",
          top: -44,
          left: 0,
          right: 0,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          pointerEvents: "none",
          opacity: progreso,
          transform: `translateY(${dist}px)`,
          transition: soltando ? `transform 280ms ${EASE}, opacity 280ms ${EASE}` : "none",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "2px solid " + S.border2,
            borderTopColor: refrescando || listo ? S.white : S.lgray,
            animation: refrescando ? "di-ptr-spin 700ms linear infinite" : "none",
            transform: refrescando ? "none" : `rotate(${progreso * 270}deg)`,
            boxSizing: "border-box",
          }}
        />
        <div style={{ color: listo || refrescando ? S.white : S.gray, fontSize: TS.chip, fontWeight: 700, letterSpacing: 0.3, fontFamily: FONT_BODY }}>
          {texto}
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${dist}px)`,
          transition: soltando ? `transform 280ms ${EASE}` : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
