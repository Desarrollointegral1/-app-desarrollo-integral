import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Los `.test.mjs` que ya estaban escritos usan el corredor propio de Node
    // (node --test), no vitest. Se corren aparte con `npm run test:node`.
    include: ["src/**/*.test.js"],
  },
});
