import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  envDir: mode === 'public' ? false : undefined,
  build: {
    outDir: mode === 'public' ? 'dist-public' : 'dist/client',
    rollupOptions: {
      input: resolve(mode === "legal" ? "legal.html" : mode === 'public' ? 'public.html' : "index.html"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: [mode === "legal" ? "./src/legal-main.jsx" : mode === 'public' ? './src/public-main.jsx' : "./src/main.jsx"],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4180",
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  plugins: [react()],
}));
