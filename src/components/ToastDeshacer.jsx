import { useCallback, useEffect, useRef, useState } from "react";
import { S, TS, TAP, FONT_BODY } from "../utils/theme.js";

// ══════════════════════════════════════════════════════════════════════
// TOAST "DESHACER" — reemplazo de window.confirm()
//
// Auditoría 2026-07-30: la app usa 15 window.confirm() antes de borrar.
// El diálogo del navegador bloquea la pantalla, no se puede estilar y
// obliga al alumno a decidir ANTES de ver qué pasa. Instagram, Gmail y
// Mercado Libre hacen lo contrario: ejecutan la acción en la interfaz y
// ofrecen "Deshacer" unos segundos. Menos fricción y menos miedo.
//
// Contrato (importante): la acción se aplica en la UI de inmediato (eso lo
// hace quien llama, sacando el item del estado local), y el borrado REAL en
// la base va dentro de `alConfirmar`, que corre recién cuando vence el
// tiempo. Si el alumno toca Deshacer, `alDeshacer` devuelve el item al
// estado y `alConfirmar` NUNCA se ejecuta.
//
// Garantías:
//  · Toast nuevo mientras hay uno vivo → el anterior se confirma ya mismo.
//  · Componente desmontado con un toast vivo → se confirma. Nunca se pierde
//    una acción a medias (item fuera de la lista pero vivo en la base).
//  · Escape cierra el toast confirmando (la acción queda hecha, como Gmail).
//
// USO
//   const { ejecutarConDeshacer, ToastUI } = useDeshacer();
//   const borrar = (al) => {
//     setAlumnos((xs) => xs.filter((x) => x.id !== al.id));   // UI ya
//     ejecutarConDeshacer({
//       mensaje: `Se eliminó a ${al.nombre}`,
//       alDeshacer: () => setAlumnos((xs) => [...xs, al]),
//       alConfirmar: () => borrarAlumnoEnBase(al.id),
//     });
//   };
//   return (<div>… {ToastUI}</div>);   // ToastUI va una sola vez por vista
// ══════════════════════════════════════════════════════════════════════

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

// Barra que se consume, como el toast de Gmail: es la única forma de saber
// cuánto queda para deshacer. Se remonta con cada toast (key = id).
function BarraTiempo({ ms }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.width = "100%";
    // Dos frames: el primero aplica el reset, el segundo arranca la
    // transición (si se hace en el mismo frame el navegador la ignora).
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        el.style.transition = `width ${ms}ms linear`;
        el.style.width = "0%";
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [ms]);
  return (
    <div style={{ height: 2, background: S.border, borderRadius: 2, overflow: "hidden", marginTop: 10 }}>
      {/* Único punto de rojo del componente: es un estado crítico
          (tiempo que se agota), no decoración. Brand Kit §02. */}
      <div ref={ref} style={{ height: "100%", width: "100%", background: S.red }} />
    </div>
  );
}

export function useDeshacer() {
  const [toast, setToast] = useState(null); // { id, mensaje, ms }
  // La acción pendiente vive en un ref, no en el estado: tiene que poder
  // confirmarse desde un timer o desde el cleanup del unmount, donde el
  // estado ya no se puede leer actualizado.
  const pendiente = useRef(null); // { alDeshacer, alConfirmar, timer }

  // Confirma lo que haya pendiente y limpia. Es idempotente a propósito:
  // la llaman el timer, el toast nuevo, el Escape y el unmount.
  const confirmarYa = useCallback(() => {
    const p = pendiente.current;
    pendiente.current = null;
    if (!p) return;
    clearTimeout(p.timer);
    try {
      p.alConfirmar && p.alConfirmar();
    } catch (e) {
      console.error("[ToastDeshacer] falló alConfirmar:", e);
    }
  }, []);

  const ejecutarConDeshacer = useCallback(
    ({ mensaje, alDeshacer, alConfirmar, ms = 6000 }) => {
      confirmarYa(); // el toast anterior no se pierde: se confirma ya mismo
      const id = Date.now() + Math.random();
      const timer = setTimeout(() => {
        confirmarYa();
        setToast((t) => (t && t.id === id ? null : t));
      }, ms);
      pendiente.current = { alDeshacer, alConfirmar, timer };
      setToast({ id, mensaje, ms });
    },
    [confirmarYa]
  );

  const deshacer = useCallback(() => {
    const p = pendiente.current;
    pendiente.current = null;
    setToast(null);
    if (!p) return;
    clearTimeout(p.timer);
    try {
      p.alDeshacer && p.alDeshacer();
    } catch (e) {
      console.error("[ToastDeshacer] falló alDeshacer:", e);
    }
  }, []);

  // Escape: cierra el toast dando la acción por confirmada.
  useEffect(() => {
    if (!toast) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        confirmarYa();
        setToast(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toast, confirmarYa]);

  // Unmount con acción pendiente: se confirma. Nunca queda un borrado a
  // medias (fuera de la lista en pantalla, vivo en la base).
  useEffect(() => confirmarYa, [confirmarYa]);

  const ToastUI = toast ? (
    <ToastDeshacer key={toast.id} mensaje={toast.mensaje} ms={toast.ms} onDeshacer={deshacer} />
  ) : null;

  return { ejecutarConDeshacer, ToastUI };
}

// Presentación pura. Se puede usar suelto, pero lo normal es via useDeshacer.
export default function ToastDeshacer({ mensaje, ms = 6000, onDeshacer }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        zIndex: 9000,
        maxWidth: 436,
        margin: "0 auto",
        background: S.card2,
        border: "1px solid " + S.border2,
        borderRadius: 12,
        boxShadow: S.shadow1,
        padding: "12px 14px",
        fontFamily: FONT_BODY,
        animation: `di-toast-in 240ms ${EASE} both`,
      }}
    >
      <style>{"@keyframes di-toast-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}"}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, color: S.white, fontSize: TS.ui, lineHeight: 1.35, minWidth: 0 }}>{mensaje}</div>
        <button
          onClick={onDeshacer}
          style={{
            flexShrink: 0,
            minHeight: TAP,
            padding: "0 16px",
            background: S.white,
            color: S.bg,
            border: "none",
            borderRadius: 8,
            fontSize: TS.label,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: FONT_BODY,
          }}
        >
          Deshacer
        </button>
      </div>
      <BarraTiempo ms={ms} />
    </div>
  );
}
