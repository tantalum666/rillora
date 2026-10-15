import { writeAppearanceBootstrap } from "./appearance-bootstrap.mjs";
import { readFile, readdir, rename, writeFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { runInNewContext } from 'node:vm';
import { prerenderPublic } from './prerender-public.mjs';

await rename('dist-public/public.html', 'dist-public/index.html');
const template = await writeAppearanceBootstrap("dist-public");
const { pages, index: html } = await prerenderPublic(template);
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
for (const asset of Object.keys(files).filter(name => !name.endsWith('.html'))) {
  if (route({ request: { uri: `/${asset}`, method: 'GET' } }).statusCode) throw new Error(`Public asset is blocked by the deployed router: ${asset}`);
}
for (const page of pages) {
  const result = route({ request: { uri: page.path, method: 'GET' } });
  if (result.uri !== `/${page.file}` || !files[page.file]) throw new Error(`Public page route does not match its artifact: ${page.path}`);
}
await writeFile('dist-public/public-build.json', JSON.stringify({
  version: 4, files, pages, surface: 'public-information', accountsEnabled: false,
  apiEnabled: false, cookiesOrStorage: true,
  browserStorage: { cookies: false, localStorageKeys: ['rillora.website.appearance.v1', 'rillora.locale.v1'], purpose: 'user-selected-appearance-and-language', tracking: false },
  htmlSha256: createHash('sha256').update(html).digest('hex'),
}) + '\n');
