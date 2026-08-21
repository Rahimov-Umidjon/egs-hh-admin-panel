import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from "rollup-plugin-visualizer"


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), visualizer({ open: true, gzipSize: true, filename: "dist/stats.html" }),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) {
              return "motion-vendor"
            }
            if (id.includes("i18next")) {
              return "i18n-vendor"
            }
            if (id.includes("@radix-ui") || id.includes("radix-ui") || id.includes("@floating-ui")) {
              return "radix-vendor"
            }
            if (id.includes("react-dom") || id.includes("react-router") || id.includes("/react/")) {
              return "react-vendor"
            }
            return "vendor"
          }
        },
      },
    },
  },
})
