import { readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';

await rename('dist-public/public.html', 'dist-public/index.html');
const route = runInNewContext(`${await readFile('worker/public-router.js', 'utf8')}; handler`);
for (const asset of await readdir('dist-public/assets')) {
  if (route({ request: { uri: `/assets/${asset}`, method: 'GET' } }).statusCode) throw new Error(`Public asset is blocked by the deployed router: ${asset}`);
}
const html = await readFile('dist-public/index.html', 'utf8');
await writeFile('dist-public/public-build.json', JSON.stringify({
  version: 1, surface: 'public-information', accountsEnabled: false,
  apiEnabled: false, cookiesOrStorage: false,
  htmlSha256: createHash('sha256').update(html).digest('hex'),
}) + '\n');
