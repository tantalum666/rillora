import { readFile, readdir, writeFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { runInNewContext } from 'node:vm';

const root = resolve('dist-production');
const connections = JSON.parse(await readFile('../../config/production-connections.json', 'utf8'));
if (connections.customerAccess !== 'closed') throw new Error('Only a closed production candidate is supported');
const files = {};
async function visit(directory) {
  for (const name of await readdir(directory)) {
    const path = resolve(directory, name);
    const info = await lstat(path);
    if (info.isSymbolicLink()) throw new Error('Production artifact must not contain symlinks');
    if (info.isDirectory()) await visit(path);
    else if (name !== 'production-build.json') files[relative(root, path)] = createHash('sha256').update(await readFile(path)).digest('hex');
  }
}
await visit(root);
const route = runInNewContext(`${await readFile('worker/production-router.js', 'utf8')}; handler`);
for (const asset of Object.keys(files).filter(name => name !== 'index.html')) {
  if (route({ request: { uri: `/${asset}`, method: 'GET' } }).statusCode) throw new Error(`Production asset is blocked by the router: ${asset}`);
}
if (!files['index.html']) throw new Error('Missing production HTML');
await writeFile(resolve(root, 'production-build.json'), JSON.stringify({
  version: 1, surface: 'production-client', customerAccess: 'closed',
  publicationCandidate: process.env.RILLORA_CLOSED_CLIENT_CANDIDATE === '1',
  webOrigin: connections.webOrigin, apiBaseURL: connections.apiBaseURL,
  connectionsSha256: createHash('sha256').update(await readFile('../../config/production-connections.json')).digest('hex'),
  files,
}, null, 2) + '\n');
console.log('Prepared closed production client artifact; no customer activation.');
