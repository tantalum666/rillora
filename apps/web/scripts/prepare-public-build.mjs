import { readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';

await rename('dist-public/public.html', 'dist-public/index.html');
const bootstrap = await readFile('src/websiteAppearance.js', 'utf8');
const bootstrapName = `website-appearance-${createHash('sha256').update(bootstrap).digest('hex').slice(0, 16)}.js`;
await writeFile(`dist-public/assets/${bootstrapName}`, bootstrap);
let html = await readFile('dist-public/index.html', 'utf8');
if (!html.includes('<script type="module"')) throw new Error('Public module entry is missing');
html = html.replace('<script type="module"', `<script src="/assets/${bootstrapName}"></script>\n    <script type="module"`);
await writeFile('dist-public/index.html', html);
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
