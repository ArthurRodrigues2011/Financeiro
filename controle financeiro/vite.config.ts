import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          exports: ["xlsx", "jspdf", "jspdf-autotable"],
          radix: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-progress",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip"
          ]
        }
      }
    }
  }
});
