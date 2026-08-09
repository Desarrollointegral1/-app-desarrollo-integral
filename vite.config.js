import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// El proyecto es ESM ("type": "module" en package.json), así que no existe
// __dirname: se reconstruye desde import.meta.url.
const raiz = dirname(fileURLToPath(import.meta.url));

// Dos apps, un solo proyecto (2026-08-09). `index.html` es la app de
// entrenamiento y `rehab/index.html` es Rehab Integral, la app de Griselda.
// Van como dos entradas del mismo build y no como dos proyectos separados
// porque comparten el cliente de Supabase, el bucket de media y utilidades:
// duplicar el repo sería duplicar el mantenimiento de todo eso.
//
// Vite genera `dist/index.html` y `dist/rehab/index.html`; el ruteo de
// /rehab a ese segundo html está en vercel.json.
//
// dev/harness*.html NO entran acá a propósito: el banco de pruebas se sirve
// solo en `npm run dev` y nunca se publica.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(raiz, "index.html"),
        rehab: resolve(raiz, "rehab/index.html"),
      },
    },
  },
});
