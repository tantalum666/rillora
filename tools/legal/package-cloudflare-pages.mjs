#!/usr/bin/env node
// Preserve the existing legal-only Worker contract on the existing Pages project.
// Build values can contain public operator details; keep the resulting package private locally.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const [input, output] = process.argv.slice(2);
if (!input || !output || !path.isAbsolute(input) || !path.isAbsolute(output)) {
  throw new Error('Usage: package-cloudflare-pages.mjs ABSOLUTE_LEGAL_DIST ABSOLUTE_OUTPUT_DIRECTORY');
}
const worker = await readFile(path.join(input, 'server/index.js'), 'utf8');
if (!worker.includes("connect-src 'none'") || worker.includes('__RILLORA_LEGAL_SHELL__') || !worker.includes('const legalRoutes')) {
  throw new Error('Only a validated legal-only build may be packaged');
}
const types = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const assets = {}, manifest = [];
for (const entry of (await readdir(path.join(input, 'client/assets'), { withFileTypes: true })).sort((a,b)=>a.name.localeCompare(b.name))) {
  if (!entry.isFile() || !types[path.extname(entry.name)]) throw new Error('Unexpected legal asset');
  const bytes = await readFile(path.join(input, 'client/assets', entry.name));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assets['/assets/' + entry.name] = { body: bytes.toString('base64'), type: types[path.extname(entry.name)], sha256 };
  manifest.push({ path: '/assets/' + entry.name, bytes: bytes.length, sha256 });
}
if (manifest.length > 18 || !manifest.some(x=>x.path.includes('font-licenses-'))) throw new Error('Legal asset budget or licence guard failed');
const original = worker.replace('export default {', 'const legalWorker = {');
const bundled = `${original}\nconst embeddedAssets = ${JSON.stringify(assets)};\nexport default {
  fetch(request) {
    return legalWorker.fetch(request, { ASSETS: { async fetch(assetRequest) {
      const asset = embeddedAssets[new URL(assetRequest.url).pathname];
      if (!asset) return new Response('Not found', { status: 404 });
      const headers = { 'Content-Type': asset.type, 'ETag': '"' + asset.sha256 + '"' };
      if (assetRequest.headers.get('if-none-match') === headers.ETag) return new Response(null, { status: 304, headers });
      const bytes = assetRequest.method === 'HEAD' ? null : Uint8Array.from(atob(asset.body), c=>c.charCodeAt(0));
      return new Response(bytes, { headers });
    } } });
  }
};\n`;
await mkdir(output, { recursive: true, mode: 0o700 });
await writeFile(path.join(output, '_worker.js'), bundled, { flag: 'wx', mode: 0o600 });
await writeFile(path.join(output, 'asset-manifest.json'), JSON.stringify({ files: manifest,
  workerSha256: createHash('sha256').update(bundled).digest('hex'), workerBytes: Buffer.byteLength(bundled) }, null, 2)+'\n', { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ assets: manifest.length, workerBytes: Buffer.byteLength(bundled), output }));
