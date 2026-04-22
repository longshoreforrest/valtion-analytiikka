import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base-polku asetetaan env-muuttujalla tuotantojulkaisua varten
// (esim. GitHub Pages: VITE_BASE="/valtion-analytiikka/").
// Oletus "/" toimii paikallisessa kehityksessä ilman muutoksia.
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@duckdb/duckdb-wasm"],
  },
  worker: {
    format: "es",
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
});
