import { S } from "../utils/theme.js";

// 2026-08-04, pedido de Lucas (captura de una app de coaching real): dock de
// accesos redondos — mismo patrón que el manual de UX ya recomendaba (grid
// de íconos tipo Mercado Pago/Afitz) para accesos secundarios AGRUPADOS
// dentro de una pantalla, nunca como reemplazo de una tabbar primaria. Un
// solo componente reusado en dos lugares (ficha de alumno del admin +
// sub-nav de Historial del alumno) para que el patrón se sienta igual en
// toda la app, no una pieza suelta.
export function IconDock({ items, activo, onSelect }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 4, padding: "4px 2px 14px" }}>
      {items.map(([key, label, Icono]) => {
        const on = activo === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "2px 0",
              minWidth: 0,
            }}
          >
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: on ? S.white : S.card2,
                border: "1px solid " + (on ? S.white : S.border2),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s, border-color 0.2s",
                flexShrink: 0,
              }}
            >
              <Icono size={22} strokeWidth={2} color={on ? S.bg : S.lgray} />
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: on ? 800 : 600,
                color: on ? S.white : S.gray,
                textAlign: "center",
                lineHeight: 1.2,
                maxWidth: 66,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
