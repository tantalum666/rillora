import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const content = !['public', 'legal', 'production-closed', 'production-review'].includes(mode)
    && process.env.VITE_RILLORA_LEGACY_CONTENT === 'true';
  const speech = content && process.env.VITE_RILLORA_LOCAL_TRANSCRIPTION === 'true';
  return ({
  worker: { format: 'es' },
  envDir: ['public', 'production-closed', 'production-review', 'production-live'].includes(mode) ? false : undefined,
  define: {
    'import.meta.env.VITE_RILLORA_LEGACY_CONTENT': JSON.stringify(String(content)),
    'import.meta.env.VITE_RILLORA_LOCAL_TRANSCRIPTION': JSON.stringify(String(speech)),
    ...(['production-closed', 'production-review', 'production-live'].includes(mode) ? {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api/v1'),
    'import.meta.env.VITE_RILLORA_CUSTOMER_ACCESS': JSON.stringify(mode === 'production-live' ? 'live' : mode === 'production-review' ? 'restricted-review' : 'closed'),
    'import.meta.env.VITE_RILLORA_AI_CONNECTIONS': JSON.stringify(mode === 'production-live' ? 'true' : 'false'),
    'import.meta.env.VITE_RILLORA_SERVICE_MARKET_CODE': JSON.stringify('GLOBAL_US'),
    } : {}),
  },
  build: {
    outDir: mode === 'public' ? 'dist-public' : mode === 'production-live' ? 'dist-production-live' : mode === 'production-review' ? 'dist-production-review' : mode === 'production-closed' ? 'dist-production' : 'dist/client',
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
  plugins: [react(), {
    name: 'omit-disabled-speech-assets',
    enforce: 'pre',
    // Vite emits worker/WASM assets before Rollup removes unused imports.
    // Resolve the disabled control early so closed/ordinary builds contain none.
    resolveId(source) {
      if (!speech && source.endsWith('/LocalTranscriptionControl.jsx')) return '\0rillora-disabled-speech';
    },
    load(id) {
      if (id === '\0rillora-disabled-speech') return 'export default function DisabledSpeech() { return null; }';
    },
  }],
}); });
