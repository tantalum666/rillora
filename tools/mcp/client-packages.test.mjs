import test from 'node:test';
import assert from 'node:assert/strict';
import { clientPackages } from './client-packages.mjs';
const input = { serverUrl: 'https://mcp.example.test/mcp', example: true, clientIds: {
  openai: 'synthetic-openai-client', codex: 'synthetic-codex-client', 'claude-code': 'synthetic-claude-client',
  cursor: 'synthetic-cursor-client', 'gemini-cli': 'synthetic-gemini-client',
} };
test('five platform configurations share the resource and least-privilege OAuth scopes without credentials', () => {
  const files = clientPackages(input);
  assert.equal(Object.keys(files).length, 7);
  for (const [name, body] of Object.entries(files)) {
    if (!name.endsWith('plugin.json')) assert.ok(body.includes(input.serverUrl));
    assert.doesNotMatch(body, /clientSecret|CLIENT_SECRET|Bearer |bearer_token|approval_policy|sandbox_mode/);
  }
  const remote = JSON.parse(files['openai/mcp.json']).mcpServers.rillora;
  assert.equal(remote.type, 'streamable-http');
  assert.deepEqual(remote.extensions['com.openai'].auth.baseScopes, ['matters:read:summary', 'readiness:read:scoped']);
  assert.equal(JSON.parse(files['openai/plugin.json']).extensions['com.openai'].interface.capabilities[0], 'Read');
  assert.equal(JSON.parse(files['readiness.json']).status, 'EXAMPLE_ONLY_NOT_INSTALLABLE');
});
test('rejects non-owned targets, credentials, query-bearing endpoints and duplicate registrations', () => {
  for (const serverUrl of ['http://mcp.rillora.xyz/mcp', 'https://user:secret@mcp.rillora.xyz/mcp', 'https://mcp.rillora.xyz/mcp?token=x', 'https://elsewhere.test/mcp']) {
    assert.throws(() => clientPackages({ ...input, serverUrl }));
  }
  assert.throws(() => clientPackages({ ...input, example: false }));
  assert.throws(() => clientPackages({ ...input, clientSecret: 'never accepted' }));
  assert.throws(() => clientPackages({ ...input, clientIds: { ...input.clientIds, cursor: input.clientIds.codex } }));
  assert.throws(() => clientPackages({ ...input, clientIds: { codex: 'a\"; do-something' } }));
});
