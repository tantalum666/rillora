import assert from 'node:assert/strict';
import { createHash, X509Certificate } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// Wrangler's dry output leaves external text modules out of the output folder.
// Stage only this public pinned root, failing if its content/name has drifted.
const root = new URL('./', import.meta.url);
const pem = await readFile(new URL('apple-root-g3.pem', root), 'utf8');
assert.equal(createHash('sha256').update(new X509Certificate(pem).raw).digest('hex'),
  '63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179');
const filename = createHash('sha1').update(pem).digest('hex') + '-apple-root-g3.pem';
const bundle = await readFile(new URL('dist/worker.js', root), 'utf8');
assert.ok(bundle.includes('./' + filename), 'Public root module name changed; inspect the build before staging');
await writeFile(new URL('dist/' + filename, root), pem);
console.log(JSON.stringify({ stagedPublicCertificate: filename, pinnedDerSha256Verified: true }));
