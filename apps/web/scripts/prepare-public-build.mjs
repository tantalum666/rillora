import { writeAppearanceBootstrap } from "./appearance-bootstrap.mjs";
import { readFile, readdir, rename, writeFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { runInNewContext } from 'node:vm';

await rename('dist-public/public.html', 'dist-public/index.html');
const html = await writeAppearanceBootstrap("dist-public");
const root = resolve('dist-public');
const files = {};
async function visit(directory) {
  for (const name of await readdir(directory)) {
    const path = resolve(directory, name), info = await lstat(path);
    if (info.isSymbolicLink()) throw new Error('Public artifact must not contain symlinks');
    if (info.isDirectory()) { await visit(path); continue; }
    if (!info.isFile()) throw new Error('Public artifact contains a non-file entry');
    const key = relative(root, path);
    if (key !== 'public-build.json') files[key] = createHash('sha256').update(await readFile(path)).digest('hex');
  }
}
await visit(root);
const route = runInNewContext(`${await readFile('worker/public-router.js', 'utf8')}; handler`);
for (const asset of Object.keys(files).filter(name => name !== 'index.html')) {
  if (route({ request: { uri: `/${asset}`, method: 'GET' } }).statusCode) throw new Error(`Public asset is blocked by the deployed router: ${asset}`);
}
await writeFile('dist-public/public-build.json', JSON.stringify({
  version: 3, files, surface: 'public-information', accountsEnabled: false,
  apiEnabled: false, cookiesOrStorage: true,
  browserStorage: { cookies: false, localStorageKeys: ['rillora.website.appearance.v1'], purpose: 'user-selected-appearance', tracking: false },
  htmlSha256: createHash('sha256').update(html).digest('hex'),
}) + '\n');
