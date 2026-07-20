import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

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
    <App />
  </StrictMode>
);
