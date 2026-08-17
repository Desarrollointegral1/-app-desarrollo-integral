import { Moon, Sun } from "lucide-react";
import { FONT_BODY, FONT_BRAND, S, TAP, TS } from "../utils/theme.js";
import DIWordmark from "./DIWordmark.jsx";
import { Logo3D } from "./Logo3D.jsx";

// ── HEADER DEL ALUMNO (ícono + wordmark + tema/Salir) ──────────────────
// Ronda 12: el centrado de ronda 11 (flex:1 solo del lado izquierdo) SIGUE
// corrido — porque centra el lockup dentro del espacio que le queda a la
// izquierda del bloque tema+Salir, no dentro del ANCHO TOTAL del header.
// Con un bloque a la derecha de ancho R, ese approach centra el lockup en
// (total-R), cuyo punto medio es (total-R)/2 ≠ total/2 — se corre a la
// izquierda por R/2. Fix matemático: un spacer INVISIBLE a la izquierda con
// el MISMO ancho que el bloque real de la derecha (medido en vivo con
// getBoundingClientRect, no estimado) — así el layout queda simétrico
// (spacer | lockup flex:1 centrado | bloque real) y el punto medio del
// lockup cae exactamente en total/2, para cualquier ancho de pantalla y
// cualquier ancho que terminen ocupando los botones de tema/Salir.
// Header del alumno — AJUSTE FINO 2026-07-21 (segundo pedido de Lucas,
// mismo día): la fila anterior ya iba en una línea pero con aire de más
// (padding vertical + tema/Salir empujados al borde con marginLeft:auto,
// dejando un hueco grande entre el título y los botones). Ahora todo
// apretado, pegado arriba, orden izquierda→derecha fijo:
// ícono → "DESARROLLO INTEGRAL" → botón de modo → "Salir" — un cluster
// compacto, sin estirarse a lo ancho de la pantalla.
// Ronda 18 — REHECHO (4to intento, estructura definitiva):
//   [logo bien visible] [DESARROLLO INTEGRAL grande / APP DE ENTRENAMIENTO
//   chico debajo] ................ [tema] [Salir] (arriba a la derecha)
// · Alineado al margen normal del contenido (16px, igual que las cards de
//   abajo) — antes tenía su propio padding de 2-4px y quedaba "fuera del
//   margen".
// · Usa ICON_CROP (el SVG recortado al dibujo real): el logo ocupa de
//   verdad el espacio que se le da, sin el 30% de aire interno del vector
//   original — más grande visualmente en menos altura de header.
// · El logo es clickeable → pantalla inicial (onLogoClick).
export function HeaderAlumno({ darkMode, toggleTheme, onSalir, salirLabel = "Salir", onLogoClick }) {
  const btnBase = {
    background: "transparent",
    color: S.gray,
    border: "1px solid " + S.border2,
    borderRadius: 8,
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: FONT_BODY,
  };
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        // Ronda 2026-07-22 (ajuste Lucas): el header quedaba pegado al borde
        // de arriba de la pantalla. Se le da aire arriba (margen de encabezado)
        // sin agrandar de más el resto.
        padding: "24px 16px 14px",
        borderBottom: "1px solid " + S.border,
        marginBottom: 12,
      }}
    >
      {/* 2026-07-31 — Lucas, viendo píxeles reales (capturó su propia
          pantalla): "el logo/texto quedaron microscópicos". La causa real
          era `maxWidth: calc(100% - 200px)` — reservaba 200px de aire "por
          las dudas" y dejaba apenas ~150px reales para el lockup en un
          celular de 390px. Van 4 rondas tratando de CENTRAR esto en toda la
          pantalla — se abandona ese enfoque. Ahora: logo+wordmark GRANDES,
          alineados a la izquierda (mismo patrón que Instagram/Mercado
          Libre: marca a la izquierda, acciones a la derecha, sin centrado
          forzado), con todo el ancho disponible hasta donde empiezan los
          botones. */}
      <div
        onClick={onLogoClick}
        title="Ir al inicio"
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: onLogoClick ? "pointer" : "default",
          paddingRight: 100,
        }}
      >
        <div style={{ flexShrink: 0, lineHeight: 0 }}>
          <Logo3D size={44} estatico />
        </div>
        {/* 2026-07-31 — Lucas: "Desarrollo Integral es más corto que App de
            entrenamiento, por eso Desarrollo Integral tiene que quedar
            centrado con App de entrenamiento" — sin alignItems:"center" acá,
            el wordmark (más angosto) y el subtítulo (más ancho, nowrap)
            quedaban alineados a la izquierda entre sí, no centrados uno
            sobre el otro. */}
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <DIWordmark
            soloDesarrollo
            width={230}
            style={{ color: S.white, width: "min(230px, 100%)", height: "auto", display: "block" }}
          />
          <div style={{ color: S.gray, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginTop: 5, fontFamily: FONT_BRAND, whiteSpace: "nowrap" }}>
            App de entrenamiento
          </div>
        </div>
      </div>
      {/* Tema · Salir — pegados al borde derecho real de la pantalla. */}
      <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={toggleTheme}
          title={darkMode ? "Modo claro" : "Modo oscuro"}
          aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          style={{ ...btnBase, width: TAP, height: TAP, padding: 0, fontSize: TS.ui, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {darkMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button
          onClick={onSalir}
          title={salirLabel}
          aria-label={salirLabel}
          style={{ ...btnBase, width: TAP, height: TAP, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: S.gray }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
