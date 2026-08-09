// Punto de entrada de Rehab Integral (2026-08-09). Es la segunda entrada del
// mismo proyecto Vite (ver build.rollupOptions.input en vite.config.js): comparte
// node_modules, cliente de Supabase y utilidades con la app de entrenamiento,
// pero se sirve como una app aparte en /rehab y no comparte ni una pantalla.
import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { C, pantalla, columna, titulo, subtitulo, boton } from "./theme.js";

// Sin esto, cualquier excepción de render deja la pantalla en blanco y Griselda
// no tiene forma de saber que hay que recargar. Mismo criterio que main.jsx de
// la app de entrenamiento, con la cara de esta app.
class Contencion extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("[rehab] Error de render:", error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ ...pantalla, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ ...columna, maxWidth: 420 }}>
          <h1 style={titulo}>Se rompió la pantalla.</h1>
          <p style={{ ...subtitulo, marginTop: 12, marginBottom: 24 }}>
            {this.state.error?.message || "Error inesperado"}
          </p>
          <button onClick={() => window.location.reload()} style={{ ...boton("primario"), background: C.verde }}>
            Recargar
          </button>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Contencion>
      <App />
    </Contencion>
  </StrictMode>
);
