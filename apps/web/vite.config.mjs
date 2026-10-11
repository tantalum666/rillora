import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  envDir: ['public', 'production-closed', 'production-review'].includes(mode) ? false : undefined,
  define: ['production-closed', 'production-review'].includes(mode) ? {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api/v1'),
    'import.meta.env.VITE_RILLORA_CUSTOMER_ACCESS': JSON.stringify(mode === 'production-review' ? 'restricted-review' : 'closed'),
    'import.meta.env.VITE_RILLORA_SERVICE_MARKET_CODE': JSON.stringify('GLOBAL_US'),
  } : undefined,
  build: {
    outDir: mode === 'public' ? 'dist-public' : mode === 'production-review' ? 'dist-production-review' : mode === 'production-closed' ? 'dist-production' : 'dist/client',
    rollupOptions: {
      input: resolve(mode === "legal" ? "legal.html" : mode === 'public' ? 'public.html' : "index.html"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "127.0.0.1",
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
