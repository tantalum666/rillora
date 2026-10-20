import { defineConfig } from '@playwright/test';
const artifact = process.env.RILLORA_AI_WEB_ARTIFACT;
if (!artifact) throw new Error('Build and provide the isolated AI-enabled Web candidate first');
const output = process.env.RILLORA_AI_QA_DIR || 'browser-results/ai';
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
export default defineConfig({
  testDir: './e2e', testMatch: 'ai-connections.spec.mjs', timeout: 30000, workers: 1, retries: 0,
  forbidOnly: Boolean(process.env.CI),
  use: { channel: process.env.RILLORA_BROWSER_CHANNEL || undefined, reducedMotion: 'reduce', trace: 'retain-on-failure' },
  reporter: [['list'], ['json', { outputFile: `${output}/results.json` }]], outputDir: `${output}/artifacts`,
  webServer: { command: `npx vite preview --host 127.0.0.1 --port 4184 --outDir ${quote(artifact)}`,
    url: 'http://127.0.0.1:4184', reuseExistingServer: !process.env.CI },
});
