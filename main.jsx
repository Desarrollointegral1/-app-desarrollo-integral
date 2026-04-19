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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
