import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const scopes = ['matters:read:summary', 'readiness:read:scoped'];
const tools = ['list_selected_matters', 'get_preparation_gaps'];
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
const ownedHosts = new Set(['app.staging.rillora.xyz', 'app.rillora.xyz', 'mcp.staging.rillora.xyz', 'mcp.rillora.xyz']);
const candidateHost = 'rillora-ai-candidate.rillora-candidate.workers.dev';
const supportedClients = new Set(['openai', 'codex', 'claude', 'claude-code', 'cursor', 'gemini-cli', 'qwen-code']);

/** Generate reviewable files only. Never edits installed clients or handles secrets. */
export function clientPackages(input) {
  if (!input || Object.keys(input).some(key => !['serverUrl', 'clientIds', 'example', 'candidate'].includes(key))) throw new Error('Unexpected package input');
  let url;
  try { url = new URL(input.serverUrl); } catch { throw new Error('Invalid canonical MCP endpoint'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !['/mcp', '/api/mcp'].includes(url.pathname)
    || !(ownedHosts.has(url.hostname) || (input.example === true && url.hostname === 'mcp.example.test')
      || (input.candidate === true && url.hostname === candidateHost))) throw new Error('Use a canonical Rillora HTTPS MCP endpoint');
  if (!input.clientIds || typeof input.clientIds !== 'object' || Array.isArray(input.clientIds) || !Object.keys(input.clientIds).length) throw new Error('Registered public client IDs are required');
  for (const [name, id] of Object.entries(input.clientIds)) {
    if (!supportedClients.has(name) || typeof id !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(id) || /^(sk_|rk_|eyJ)/.test(id)) throw new Error('Invalid public client registration');
  }
  if (new Set(Object.values(input.clientIds)).size !== Object.keys(input.clientIds).length) throw new Error('Each AI client requires its own registration');
  const files = {};
  const json = value => JSON.stringify(value, null, 2) + '\n';
  const server = url.href;
  const ids = input.clientIds;
  if (ids.openai || ids.codex) {
    const manifest = { $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
      name: 'rillora', version: '0.1.0', description: 'Read explicitly selected Rillora matters and check missing common information.',
      author: { name: 'Rillora', email: 'support@rillora.xyz', url: 'https://www.rillora.xyz' }, homepage: 'https://www.rillora.xyz',
      keywords: ['digital legacy', 'digital affairs', 'family organization'],
      extensions: { 'com.openai': { interface: { displayName: 'Rillora', shortDescription: 'Review selected matters',
        longDescription: 'Read titles, categories and recorded statuses for the matters you explicitly authorize in Rillora. Check missing common fields. No notes, payments, transfers or automatic release. With your permission, a verified email supports account and workspace checks.',
        developerName: 'Rillora', category: 'Productivity', capabilities: ['Read'], websiteURL: 'https://www.rillora.xyz',
        privacyPolicyURL: 'https://legal.rillora.xyz/privacy', termsOfServiceURL: 'https://legal.rillora.xyz/terms',
        composerIcon: './assets/icon.png', logo: './assets/icon.png',
        defaultPrompt: ['Review the matters I selected in Rillora.', 'Check missing common information in my selected Rillora matters.'] } } } };
    if (ids.codex) {
      // Current Codex accepts OAuth in the compatibility format. A portable
      // manifest's mcp.json takes precedence and cannot be mixed into this folder.
      files['codex-plugin/.codex-plugin/plugin.json'] = json({ name: manifest.name, version: manifest.version,
        description: manifest.description, interface: manifest.extensions['com.openai'].interface, mcpServers: './.mcp.json' });
      files['codex-plugin/.mcp.json'] = json({ mcpServers: { rillora: { type: 'http', url: server, oauth: { clientId: ids.codex, callbackUrl: 'http://127.0.0.1/callback' } } } });
    }
    if (ids.openai) {
      files['openai/plugin.json'] = json(manifest);
      files['openai/mcp.json'] = json({ $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
        mcpServers: { rillora: { type: 'streamable-http', url: server,
          extensions: { 'com.openai': { auth: { type: 'oauth', client: { mode: 'provided', clientId: ids.openai, tokenEndpointAuthMethod: 'none' }, baseScopes: ['openid', 'email', ...scopes] } } } } } });
    }
  }
  // The issuer-bound response and explicit callbackUrl keep plugin and CLI callbacks aligned.
  // Rillora advertises its canonical resource in protected-resource metadata.
  // An extra override makes current Codex send resource twice, which Auth0 rejects.
  if (ids.codex) files['codex/setup.sh'] = `#!/bin/sh\nset -eu\nif codex mcp get rillora >/dev/null 2>&1; then\n  echo 'A Rillora entry already exists. Review it before making any change.' >&2\n  exit 1\nfi\ncodex mcp add rillora --url ${quote(server)} --oauth-client-id ${quote(ids.codex)}\n`;
  if (ids['claude-code']) files['claude-code/mcp.json'] = json({ mcpServers: { rillora: { type: 'http', url: server,
    oauth: { clientId: ids['claude-code'], scopes: scopes.join(' ') } } } });
  if (ids.claude) files['claude/connection-details.json'] = json({ purpose: 'Manual entry in Claude custom connector settings; not a client configuration schema',
    displayName: input.candidate ? 'Rillora synthetic candidate' : 'Rillora', serverUrl: server, clientId: ids.claude });
  if (ids.cursor) files['cursor/mcp.json'] = json({ mcpServers: { rillora: { url: server, auth: { CLIENT_ID: ids.cursor, scopes } } } });
  if (ids['gemini-cli']) files['gemini-cli/settings.json'] = json({ mcpServers: { rillora: { httpUrl: server, trust: false,
    oauth: { enabled: true, clientId: ids['gemini-cli'], scopes } } } });
  if (ids['qwen-code']) {
    files['qwen-code/settings.json'] = json({ mcpServers: { rillora: { httpUrl: server, trust: false,
      oauth: { enabled: true, clientId: ids['qwen-code'], scopes, redirectUri: 'http://localhost:7777/oauth/callback' } } } });
    files['qwen-code/credential-storage.txt'] = 'Before connecting '+server+', set QWEN_CODE_FORCE_ENCRYPTED_FILE_STORAGE=true for the Qwen Code process. Keep existing user settings; merge only this Rillora entry. This file does not enable or install anything.\n';
  }
  files['readiness.json'] = json({ status: input.example ? 'EXAMPLE_ONLY_NOT_INSTALLABLE'
    : input.candidate ? 'SYNTHETIC_CANDIDATE_NOT_CUSTOMER_READY' : 'CONFIGURATION_GENERATED_NOT_CONNECTED',
    serverUrl: server, clients: Object.keys(ids), tools, scopes, credentialsIncluded: false,
    packaging: { openai: 'Documented portable OAuth extension; host support must be verified',
      codexPlugin: 'Separate compatibility package with pre-registered OAuth; no portable root manifest' },
    pending: ['Exact OAuth callbacks and authorization-server resource compatibility verified', 'Dedicated audience and each registered client verified',
      'User selected scope and real OAuth connection acceptance', 'Provider-specific directory submission and approval where required'] });
  return files;
}

async function main() {
  const { values } = parseArgs({ options: { input: { type: 'string' }, out: { type: 'string' } } });
  if (!values.input || !values.out) throw new Error('Usage: node tools/mcp/client-packages.mjs --input reviewed-public-client-ids.json --out new-directory');
  let input;
  try { input = JSON.parse(await readFile(values.input, 'utf8')); } catch { throw new Error('Could not read the public client registration file'); }
  const files = clientPackages(input);
  const out = resolve(values.out);
  await mkdir(out); // Refuse to overwrite an existing package or installed configuration.
  for (const [path, body] of Object.entries(files)) { await mkdir(dirname(resolve(out, path)), { recursive: true }); await writeFile(resolve(out, path), body); }
  for (const directory of ['openai', 'codex-plugin']) {
    if (!Object.keys(files).some(path => path.startsWith(directory + '/'))) continue;
    await mkdir(resolve(out, directory, 'assets'));
    await copyFile(new URL('../../apps/web/src/assets/brand/apple-touch-icon.png', import.meta.url), resolve(out, directory, 'assets/icon.png'));
  }
  process.stdout.write(JSON.stringify({ files: Object.keys(files).length, credentialsIncluded: false, installed: false, submitted: false }) + '\n');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
