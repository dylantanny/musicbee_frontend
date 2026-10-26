import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";

// Entry points live in electron/ and src/ instead of electron-vite's default src/main etc.
export default defineConfig({
  main: { build: { rollupOptions: { input: resolve("electron/main.ts") } } },
  preload: { build: { rollupOptions: { input: resolve("electron/preload.ts") } } },
  renderer: {
    root: ".",
    build: { rollupOptions: { input: resolve("index.html") } },
    plugins: [react()],
  },
});
