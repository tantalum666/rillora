import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const manifest = JSON.parse(await readFile(resolve(root, 'config/local-transcription.json'), 'utf8'));
const cache = resolve(root, '.local/rillora-speech-v1');
const argument = process.argv.indexOf('--out');
const output = argument >= 0 ? resolve(process.argv[argument + 1]) : null;
if (output && !output.startsWith(resolve(root, 'apps/web/dist'))) throw new Error('Speech assets must go into a Web build directory');
if (manifest.schemaVersion !== 1 || !/^\/speech\/whisper-tiny-[a-f0-9]{12}\/$/.test(manifest.publicPath)) throw new Error('Invalid speech manifest');
const transformerPackage = JSON.parse(await readFile(resolve(root, 'apps/web/node_modules/@huggingface/transformers/package.json'), 'utf8'));
if (transformerPackage.version !== manifest.transformersVersion) throw new Error('Speech engine version changed');
let total = 0;
for (const file of manifest.files) {
  if (!/^(model|runtime)\/[a-zA-Z0-9_./-]+$/.test(file.path) || file.path.includes('..')) throw new Error('Invalid speech asset path');
  const local = resolve(cache, file.path);
  let bytes;
  try { bytes = await readFile(local); } catch {
    if (file.package) {
      if (file.package !== 'onnxruntime-web' || !file.packagePath.startsWith('dist/')) throw new Error('Invalid runtime asset');
      const pkg = resolve(root, 'apps/web/node_modules', file.package);
      if (JSON.parse(await readFile(resolve(pkg, 'package.json'), 'utf8')).version !== file.packageVersion) throw new Error('Speech runtime version changed');
      bytes = await readFile(resolve(pkg, file.packagePath));
    } else {
      if (!process.argv.includes('--fetch')) throw new Error('Run prepare-local-transcription.mjs --fetch to fetch the pinned model before this build');
      if (!file.url.startsWith(`https://huggingface.co/${manifest.model}/resolve/${manifest.revision}/`)) throw new Error('Invalid model source');
      const response = await fetch(file.url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error('Model asset download failed');
      bytes = Buffer.from(await response.arrayBuffer());
    }
  }
  if (bytes.length !== file.bytes || createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error(`Speech asset verification failed: ${file.path}`);
  total += bytes.length;
  await mkdir(dirname(local), { recursive: true }); await writeFile(local, bytes);
  if (output) {
    const target = resolve(output, '.' + manifest.publicPath, file.path);
    await mkdir(dirname(target), { recursive: true }); await copyFile(local, target);
  }
}
if (output) {
  const target = resolve(output, '.' + manifest.publicPath, 'manifest.json');
  await writeFile(target, JSON.stringify({ model: manifest.model, revision: manifest.revision, bytes: total, files: manifest.files.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 })) }, null, 2));
}
console.log(`Verified ${manifest.files.length} pinned local-speech assets (${total} bytes).`);
