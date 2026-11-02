import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Miniflare, Log, LogLevel } from 'miniflare';

// Ephemeral nonce exists in memory only; it is not a provider credential.
const secret = randomBytes(48).toString('base64url');
const output = resolve(import.meta.dirname, 'dist');
const certificates = (await readdir(output)).filter(name => /^[a-f0-9]{40}-apple-root-g3\.pem$/.test(name));
assert.equal(certificates.length, 1, 'Build the pinned public certificate module first');
const certificate = certificates[0];
const runtime = new Miniflare({
  log: new Log(LogLevel.WARN),
  enableDevRegistry: false,
  workers: [{ config: {
    name: 'rillora-hosting-validation-local',
    compatibilityDate: '2026-11-02',
    compatibilityFlags: ['nodejs_compat'],
    manifest: {
      mainModule: 'worker.js', modulesRoot: output,
      modules: {
        'worker.js': { type: 'esm', contents: await readFile(resolve(output, 'worker.js'), 'utf8') },
        [certificate]: { type: 'text', contents: await readFile(resolve(output, certificate), 'utf8') },
      },
    },
    env: {
      VALIDATION_MODE: { type: 'text', value: 'synthetic-only' },
      VALIDATION_EXPIRES_AT: { type: 'text', value: new Date(Date.now() + 3600_000).toISOString() },
      PROBE_SECRET: { type: 'text', value: secret },
    },
    // No database binding is needed for these runtime checks.
  } }],
});

try {
  const denied = await runtime.dispatchFetch('https://validation.invalid/probe/http');
  assert.equal(denied.status, 404);
  const unknown = await runtime.dispatchFetch('https://validation.invalid/arbitrary', {
    headers: { authorization: 'Bearer ' + secret },
  });
  assert.equal(unknown.status, 404);
  const response = await runtime.dispatchFetch('https://validation.invalid/probe/http', {
    headers: { authorization: 'Bearer ' + secret },
  });
  const result = await response.json();
  console.log(JSON.stringify({ phase: 'workerd-http', status: response.status, result }));
  assert.equal(response.status, 200);
  assert.equal(result.passed, true);
  assert.equal(result.results.length, 5);
  for (const path of ['/probe/crypto', '/probe/file-limit']) {
    const response = await runtime.dispatchFetch('https://validation.invalid' + path, {
      headers: { authorization: 'Bearer ' + secret },
    });
    const result = await response.json();
    console.log(JSON.stringify({ phase: path, status: response.status, result }));
    assert.equal(response.status, 200);
    assert.equal(result.passed ?? result.file?.passed, true);
  }
  console.log(JSON.stringify({ passed: true, outerBoundaryChecks: 2, realRouterChecks: 5,
    liveDatabaseTouched: false, actualProviderPurchase: false }));
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error).replaceAll(secret, '[redacted]'));
  process.exitCode = 1;
} finally {
  await runtime.dispose().catch(() => undefined);
}
