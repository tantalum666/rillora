import { defineConfig } from '@playwright/test';
const output = process.env.RILLORA_PUBLIC_QA_DIR || 'browser-results/public';

export default defineConfig({
  testDir: './e2e', testMatch: ['public-discovery.spec.mjs', 'landing-header.spec.mjs'],
  timeout: 60000, expect: { timeout: 7000 }, workers: 2, retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['json', { outputFile: `${output}/results.json` }]],
  outputDir: `${output}/artifacts`,
  use: { browserName: 'chromium', channel: process.env.RILLORA_BROWSER_CHANNEL || undefined,
    screenshot: 'only-on-failure', trace: 'retain-on-failure', reducedMotion: 'reduce' },
  webServer: { command: 'node scripts/preview-public.mjs', url: 'http://127.0.0.1:4197', reuseExistingServer: !process.env.CI },
});
