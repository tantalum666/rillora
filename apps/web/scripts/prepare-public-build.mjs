import { readFile, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

await rename('dist-public/public.html', 'dist-public/index.html');
const html = await readFile('dist-public/index.html', 'utf8');
await writeFile('dist-public/public-build.json', JSON.stringify({
  version: 1, surface: 'public-information', accountsEnabled: false,
  apiEnabled: false, cookiesOrStorage: false,
  htmlSha256: createHash('sha256').update(html).digest('hex'),
}) + '\n');
