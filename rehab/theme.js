// ============================================================================
// REHAB INTEGRAL — mundo visual propio (2026-08-09)
// ============================================================================
// Por qué NO se reusa src/utils/theme.js: la app de entrenamiento es negra,
// verde neón y mayúsculas condensadas — el gimnasio a las 7 de la mañana. Esto
// es un consultorio con luz de día: Griselda lo abre con un paciente sentado
// enfrente, en el celular, y lo que escribe es una historia clínica, no una
// rutina. Mismo hogar tipográfico (PP Formula, que ya es la marca de la casa),
// voz opuesta: papel cálido, tinta oscura, títulos en minúscula y finos donde
// el gimnasio grita en versalitas negras.
//
// Elevación: SÓLO línea de 1px. Ni una sombra en toda la app — una ficha
// clínica es papel apoyado, no tarjetas flotando.

export const C = {
  papel: "#F2EEE8",       // fondo: papel cálido, no blanco de pantalla
  hoja: "#FFFFFF",        // superficie de las fichas
  tinta: "#16150F",       // texto principal
  tinta2: "#635C50",      // secundario — tintado del papel, nunca gris neutro (4.9:1 sobre papel)
  linea: "#DED7CB",       // hairline
  linea2: "#C8BFAF",      // hairline de foco/contraste
  verde: "#12433C",       // acento: petróleo de quirófano. Acciones primarias
  verdeSuave: "#DCE7E3",  // fondo de chips y estados activos
  rojo: "#8C2F22",        // errores y borrados
  rojoSuave: "#F5E3DF",
};

export const FUENTE = '"PP Formula", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// Alto mínimo de cualquier cosa que se toque con el dedo.
export const TAP = 46;

export const pantalla = {
  minHeight: "100vh",
  background: C.papel,
  color: C.tinta,
  fontFamily: FUENTE,
  fontWeight: 500,
};

export const columna = {
  width: "100%",
  maxWidth: 560,
  margin: "0 auto",
  padding: "0 20px",
  boxSizing: "border-box",
};

// Título de pantalla: minúscula, fino y grande. Es el gesto que más separa
// esta app de la de entrenamiento sin cambiar de tipografía.
export const titulo = {
  fontFamily: FUENTE,
  fontWeight: 300,
  fontSize: "clamp(30px, 9vw, 40px)",
  // 1.12 y no 1.04: con dos líneas, la tilde de "Rodríguez" u "osteopatía"
  // se le montaba encima al descendente de la línea de arriba. En castellano
  // no hay títulos sin tildes, así que el interlineado tiene que dejarles aire.
  lineHeight: 1.18,
  letterSpacing: "-0.03em",
  color: C.tinta,
  margin: 0,
};

export const subtitulo = {
  fontSize: 16,
  lineHeight: 1.5,
  color: C.tinta2,
  fontWeight: 500,
  margin: 0,
};

export const etiqueta = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: C.tinta2,
  display: "block",
  marginBottom: 6,
};

export const ficha = {
  background: C.hoja,
  border: "1px solid " + C.linea,
  borderRadius: 12,
  padding: 18,
};

export const campo = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: TAP,
  background: C.hoja,
  color: C.tinta,
  border: "1px solid " + C.linea2,
  borderRadius: 10,
  padding: "12px 14px",
  // 16px es el piso: por debajo, iOS hace zoom solo al enfocar el campo.
  fontSize: 16,
  fontFamily: FUENTE,
  fontWeight: 500,
  outline: "none",
};

export const boton = (variante = "primario") => {
  const base = {
    minHeight: TAP,
    borderRadius: 10,
    padding: "12px 20px",
    fontSize: 16,
    fontWeight: 700,
    fontFamily: FUENTE,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "background 0.18s ease-out, border-color 0.18s ease-out",
  };
  if (variante === "primario") return { ...base, background: C.verde, color: "#FFFFFF", border: "1px solid " + C.verde };
  if (variante === "peligro") return { ...base, background: "transparent", color: C.rojo, border: "1px solid " + C.rojo };
  if (variante === "fantasma") return { ...base, background: "transparent", color: C.tinta2, border: "1px solid transparent", padding: "12px 8px" };
  return { ...base, background: C.hoja, color: C.tinta, border: "1px solid " + C.linea2 };
};

export const chip = (activo) => ({
  minHeight: 38,
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid " + (activo ? C.verde : C.linea2),
  background: activo ? C.verdeSuave : "transparent",
  color: activo ? C.verde : C.tinta2,
  fontSize: 14,
  fontWeight: 700,
  fontFamily: FUENTE,
  cursor: "pointer",
});

// Fila de lista: hairline abajo, sin caja. Un listado clínico se lee como un
// registro corrido, no como una grilla de tarjetas iguales.
export const fila = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "16px 4px",
  minHeight: TAP,
  background: "transparent",
  border: "none",
  borderBottom: "1px solid " + C.linea,
  textAlign: "left",
  cursor: "pointer",
  fontFamily: FUENTE,
  color: C.tinta,
};

/**
 * Estilos globales de la app. Incluye las superficies que dibuja el navegador
 * y no nosotros — selección, cursor de texto, anillo de foco, barra de scroll:
 * si no se tiñen, la página queda con los grises de fábrica de Chrome.
 *
 * El movimiento va SÓLO dentro de `prefers-reduced-motion: no-preference`, y
 * el estado de reposo es el visible. Con "Reducir movimiento" activado (como
 * lo tiene Lucas) no hay animación y no hay nada invisible esperando entrar.
 */
export const CSS_GLOBAL = `
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; background: ${C.papel}; }
  ::selection { background: ${C.verdeSuave}; color: ${C.verde}; }
  input, textarea { caret-color: ${C.verde}; }
  input::placeholder, textarea::placeholder { color: ${C.tinta2}; opacity: 1; }
  input:focus, textarea:focus, select:focus { border-color: ${C.verde}; box-shadow: 0 0 0 3px ${C.verdeSuave}; }
  :focus-visible { outline: 2px solid ${C.verde}; outline-offset: 2px; }
  button:focus:not(:focus-visible) { outline: none; }
  * { scrollbar-color: ${C.linea2} transparent; scrollbar-width: thin; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb { background: ${C.linea2}; border-radius: 999px; border: 3px solid ${C.papel}; }
  ::-webkit-scrollbar-track { background: transparent; }
  @media (prefers-reduced-motion: no-preference) {
    @keyframes rehab-entra { from { opacity: 0; transform: translateY(10px); filter: blur(3px); } }
    [data-entra] { animation: rehab-entra 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
  }
`;
