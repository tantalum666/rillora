import { defineConfig } from '@playwright/test';
import base from './playwright.config.mjs';
export default defineConfig({ ...base, testMatch: 'legacy-content.spec.mjs', workers: 1,
  webServer: base.webServer.filter(server => server.url.endsWith(':4186')).map(server => process.env.RILLORA_TEST_LOCAL_SPEECH === 'true' ? { ...server,
    command: server.command.replace('VITE_RILLORA_LEGACY_CONTENT=true', 'VITE_RILLORA_LOCAL_TRANSCRIPTION=true VITE_RILLORA_LEGACY_CONTENT=true')
      .replace('&& npx vite preview', '&& node scripts/prepare-local-transcription.mjs --out dist/browser-legacy && npx vite preview') } : server),
  use: { ...base.use, ...(process.env.RILLORA_TEST_CHROME === 'true' ? { channel: 'chrome' } : {}),
    launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } },
});
