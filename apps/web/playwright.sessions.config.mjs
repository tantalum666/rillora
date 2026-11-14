import { defineConfig } from '@playwright/test';
const output = process.env.RILLORA_SESSION_QA_DIR || 'browser-results/sessions';
export default defineConfig({
  testDir: './e2e', testMatch: ['trusted-session.spec.mjs', 'legal-return.spec.mjs'],
  timeout: 30000, expect: { timeout: 7000 }, workers: 2, retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['json', { outputFile: `${output}/results.json` }]],
  outputDir: `${output}/artifacts`,
  use: { browserName: 'chromium', channel: process.env.RILLORA_BROWSER_CHANNEL || 'chrome', reducedMotion: 'reduce', trace: 'retain-on-failure' },
  webServer: { command: 'npm run build && npx vite preview --host 127.0.0.1 --strictPort --port 4174 --outDir dist/client',
    url: 'http://127.0.0.1:4174', reuseExistingServer: false },
});
