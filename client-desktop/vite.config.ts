import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 3001
  },
  build: {
    outDir: "dist"
  }
});
