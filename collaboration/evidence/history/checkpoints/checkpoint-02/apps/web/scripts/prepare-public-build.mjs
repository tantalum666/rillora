import { writeAppearanceBootstrap } from "./appearance-bootstrap.mjs";
import { readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';

await rename('dist-public/public.html', 'dist-public/index.html');
const html = await writeAppearanceBootstrap("dist-public");
const route = runInNewContext(`${await readFile('worker/public-router.js', 'utf8')}; handler`);
for (const asset of await readdir('dist-public/assets')) {
  if (route({ request: { uri: `/assets/${asset}`, method: 'GET' } }).statusCode) throw new Error(`Public asset is blocked by the deployed router: ${asset}`);
}
await writeFile('dist-public/public-build.json', JSON.stringify({
  version: 2, surface: 'public-information', accountsEnabled: false,
  apiEnabled: false, cookiesOrStorage: true,
  browserStorage: { cookies: false, localStorageKeys: ['rillora.website.appearance.v1'], purpose: 'user-selected-appearance', tracking: false },
  htmlSha256: createHash('sha256').update(html).digest('hex'),
}) + '\n');
