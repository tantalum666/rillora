import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', timeout: 30000, expect: { timeout: 6000 }, workers: 2,
  forbidOnly: Boolean(process.env.CI), retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'browser-report', open: 'never' }], ['json', { outputFile: 'browser-results/results.json' }]],
  outputDir: 'browser-results/artifacts',
  use: { browserName: 'chromium', channel: process.env.RILLORA_TEST_BROWSER_CHANNEL || undefined,
    screenshot: 'on', trace: 'retain-on-failure', reducedMotion: 'reduce',
    launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } },
  webServer: [
    { command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4174 --outDir dist/client', url: 'http://127.0.0.1:4174', reuseExistingServer: !process.env.CI },
    { command: 'npm run build:public && node scripts/preview-public.mjs', url: 'http://127.0.0.1:4197', reuseExistingServer: !process.env.CI },
    // Keep the optional AI fixture separate from the default, AI-disabled build.
    { command: 'VITE_RILLORA_AI_CONNECTIONS=true npx vite build --mode internal --outDir dist/browser-ai && npx vite preview --host 127.0.0.1 --strictPort --port 4184 --outDir dist/browser-ai', url: 'http://127.0.0.1:4184', reuseExistingServer: !process.env.CI },
    { command: 'VITE_RILLORA_FUTURE_NOTICES=true npx vite build --mode internal --outDir dist/browser-future && npx vite preview --host 127.0.0.1 --strictPort --port 4185 --outDir dist/browser-future', url: 'http://127.0.0.1:4185', reuseExistingServer: !process.env.CI },
    { command: 'VITE_RILLORA_LEGACY_CONTENT=true npx vite build --mode internal --outDir dist/browser-legacy && npx vite preview --host 127.0.0.1 --strictPort --port 4186 --outDir dist/browser-legacy', url: 'http://127.0.0.1:4186', reuseExistingServer: !process.env.CI },
  ],
});
