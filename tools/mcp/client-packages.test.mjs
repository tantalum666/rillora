import test from 'node:test';
import assert from 'node:assert/strict';
import { clientPackages } from './client-packages.mjs';
const input = { serverUrl: 'https://mcp.example.test/mcp', example: true, clientIds: {
  openai: 'synthetic-openai-client', codex: 'synthetic-codex-client', 'claude-code': 'synthetic-claude-client',
  cursor: 'synthetic-cursor-client', 'gemini-cli': 'synthetic-gemini-client',
} };
test('five platform configurations share the resource and least-privilege OAuth scopes without credentials', () => {
  const files = clientPackages(input);
  assert.equal(Object.keys(files).length, 9);
  for (const [name, body] of Object.entries(files)) {
    if (!name.endsWith('plugin.json')) assert.ok(body.includes(input.serverUrl));
    assert.doesNotMatch(body, /clientSecret|CLIENT_SECRET|Bearer |bearer_token|approval_policy|sandbox_mode/);
  }
  const remote = JSON.parse(files['openai/mcp.json']).mcpServers.rillora;
  assert.equal(remote.type, 'streamable-http');
  assert.deepEqual(remote.extensions['com.openai'].auth.baseScopes, ['matters:read:summary', 'readiness:read:scoped']);
  assert.equal(JSON.parse(files['openai/plugin.json']).extensions['com.openai'].interface.capabilities[0], 'Read');
  const compatibility = JSON.parse(files['codex-plugin/.codex-plugin/plugin.json']);
  assert.equal(compatibility.mcpServers, './.mcp.json');
  assert.equal(JSON.parse(files['codex-plugin/.mcp.json']).mcpServers.rillora.oauth.clientId, input.clientIds.codex);
  assert.ok(!Object.hasOwn(files, 'codex-plugin/plugin.json'));
  assert.ok(!Object.hasOwn(files, 'codex-plugin/mcp.json'));
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
test('only the exact managed candidate host is allowed with an explicit synthetic marker', () => {
  const candidate = { serverUrl: 'https://rillora-ai-candidate.rillora-candidate.workers.dev/mcp',
    candidate: true, clientIds: { claude: 'synthetic-claude-web', cursor: 'synthetic-cursor' } };
  const files = clientPackages(candidate);
  assert.equal(JSON.parse(files['readiness.json']).status, 'SYNTHETIC_CANDIDATE_NOT_CUSTOMER_READY');
  assert.match(JSON.parse(files['claude/connection-details.json']).purpose, /Manual entry/);
  assert.throws(() => clientPackages({ ...candidate, candidate: false }));
  assert.throws(() => clientPackages({ ...candidate, serverUrl: 'https://different.rillora-candidate.workers.dev/mcp' }));
});
test('Qwen uses documented HTTP OAuth fields and explicitly requires encrypted credential storage', () => {
  const files=clientPackages({...input,clientIds:{'qwen-code':'synthetic-qwen-client'}});
  const config=JSON.parse(files['qwen-code/settings.json']).mcpServers.rillora;
  assert.equal(config.trust,false);assert.equal(config.oauth.redirectUri,'http://localhost:7777/oauth/callback');
  assert.deepEqual(config.oauth.scopes,['matters:read:summary','readiness:read:scoped']);
  assert.match(files['qwen-code/credential-storage.txt'],/QWEN_CODE_FORCE_ENCRYPTED_FILE_STORAGE=true/);
});

test('directory metadata fits the provider submission limits in both package formats', () => {
  const files = clientPackages(input);
  const portable = JSON.parse(files['openai/plugin.json']).extensions['com.openai'].interface;
  const compatibility = JSON.parse(files['codex-plugin/.codex-plugin/plugin.json']).interface;
  for (const metadata of [portable, compatibility]) {
    for (const field of ['displayName', 'shortDescription']) {
      assert.ok([...metadata[field]].length <= 30, `${field} exceeds directory limit`);
      assert.doesNotMatch(metadata[field], /[\r\n]/);
    }
    assert.ok([...metadata.longDescription].length <= 4000);
    assert.ok(metadata.defaultPrompt.length <= 3);
    assert.equal(new Set(metadata.defaultPrompt).size, metadata.defaultPrompt.length);
    for (const prompt of metadata.defaultPrompt) assert.ok([...prompt].length <= 128);
  }
});
