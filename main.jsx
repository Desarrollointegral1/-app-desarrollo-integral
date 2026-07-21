import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// ── ERROR BOUNDARY (ronda 16, punto 3) ──────────────────────────────────
// Hasta ahora la app no tenía NINGÚN error boundary: cualquier excepción
// de render (dato null inesperado, etc.) tiraba abajo TODO el árbol de
// React y dejaba una pantalla en blanco — exactamente el síntoma que
// reportó Lucas ("la pantalla se rompe") al clickear "Rutinas propias" en
// la Biblioteca. No se pudo reproducir el crash puntual con datos reales
// (probado en dev y en el build de producción, sin datos null en
// biblioteca_ejercicios/catalogo_ejercicios), pero el problema de fondo —
// cero contención de errores — es real y se corrige acá: cualquier
// excepción de render futura ahora muestra una pantalla de error
// recuperable ("Reintentar") en vez de romper todo silenciosamente.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Error de render capturado:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0a0a0a",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Algo se rompió en la pantalla</div>
          <div style={{ fontSize: 13, color: "#999", marginBottom: 24, maxWidth: 320 }}>
            {this.state.error?.message || "Error inesperado"}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ background: "#fff", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 900, fontSize: 14, cursor: "pointer" }}
          >
            REINTENTAR
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Polyfill para window.storage (usa localStorage en el navegador)
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      const v = localStorage.getItem(key);
      return v ? { value: v } : null;
    },
    set: async (key, val) => {
      localStorage.setItem(key, val);
    },
  };
}

// PWA (ronda 8): service worker mínimo — red primero para la app, cache solo
// del shell estático. Solo en producción (en dev molestaría al HMR).
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("[SW] no registrado:", e));
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
