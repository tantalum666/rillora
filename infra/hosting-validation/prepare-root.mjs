import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// Reuse the tracked public DER root. The generated PEM stays ignored by the
// repository's secret-file policy and is never an additional private key file.
const root = new URL('./', import.meta.url);
const der = await readFile(new URL('../../apps/api/certificates/apple/AppleRootCA-G3.cer', root));
assert.equal(createHash('sha256').update(der).digest('hex'),
  '63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179');
const encoded = der.toString('base64').match(/.{1,64}/g);
assert.ok(encoded);
const pem = ['-----BEGIN CERTIFICATE-----', ...encoded, '-----END CERTIFICATE-----', ''].join('\n');
await writeFile(new URL('apple-root-g3.pem', root), pem);
console.log(JSON.stringify({ publicRootPrepared: true, source: 'tracked API DER certificate' }));
