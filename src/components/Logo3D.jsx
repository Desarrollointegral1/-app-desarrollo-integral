import { ICON_CROP } from "../utils/iconos.js";

// ── LOGO 3D ───────────────────────────────────────────────────────────
// Ícono oficial con extrusión real: varias capas del ícono separadas en Z
// (translateZ) girando juntas — las de atrás oscurecidas = profundidad.
// Reutilizable: login y pantalla de carga (comparten la clase .di-logo3d).
// SIN sombra de piso (pedido de Lucas ronda 9).
// Ronda 16: Lucas mandó un screenshot del giro completo (rotateY 0→360)
// mostrando un artefacto de "fantasma"/capas superpuestas raras a mitad
// de vuelta — son las 4 capas en translateZ vistas de perfil/de espalda
// (~90°-270°), donde al ser planos 2D apilados se ven como líneas finas
// superpuestas y, del otro lado, el ícono espejado por backface-visibility.
// Fix: en vez de rotar 360° completo, el logo ahora OSCILA tipo péndulo
// — nunca llega a los ángulos donde se ve el artefacto.
// Ronda 18: Lucas pidió que gire MÁS (el swing de 28° era muy tímido):
// ahora ±52° en 5s (antes 8s), sigue lejos del rango 90°-270° del
// artefacto. Además usa ICON_CROP (SVG recortado al dibujo real): el logo
// llena el box de verdad, sin el ~30% de aire interno del vector viejo.
// 2026-07-31, pedido de Lucas: "que el logo una vez que entrás en la app no
// pendule" — el swing es identidad de marca para login/carga, pero adentro
// de la app (header persistente, chico) es una distracción constante en
// cada pantalla. `estatico` saca la clase que dispara la animación.
export function Logo3D({ size = 230, estatico = false }) {
  // Profundidad reducida (2026-07-22): con el giro 360° continuo, un depth
  // grande hacía que las 4 capas se vieran como líneas separadas de canto a
  // ~90°/270° (el "fantasma" que en su momento obligó a oscilar). Con un
  // depth chico las capas casi coinciden en el canto → giro limpio, y sigue
  // habiendo una pizca de volumen 3D de frente.
  const depth = Math.max(4, Math.round(size * 0.03));
  const zs = [-depth, -depth / 2, 0, depth / 2];
  // Ronda 11: el box se limita a 82vw además del `size` pedido — así un size
  // grande (login, carga) nunca desborda el ancho de pantalla en celular; en
  // viewports angostos se ve más chico pero SIEMPRE entero, nunca cortado.
  const box = `min(${size}px, 82vw)`;
  return (
    <div style={{ perspective: Math.round(size * 1.4), width: box, height: box }}>
      <div className={estatico ? "" : "di-logo3d"} style={{ position: "relative", width: "100%", height: "100%", transformStyle: estatico ? undefined : "preserve-3d" }}>
        {zs.map((z, i) => (
          <img
            key={z}
            src={ICON_CROP}
            alt={i === zs.length - 1 ? "DI" : ""}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              transform: `translateZ(${z}px)`,
              opacity: i === zs.length - 1 ? 0.95 : 0.28 + i * 0.1,
              filter: i === zs.length - 1 ? "none" : "brightness(0.55)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
