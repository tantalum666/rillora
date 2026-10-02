import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';

/** Verify the complete static upload, not just the HTML that references it. */
export function readVerifiedClientArtifact(directory: string, manifestName: 'production-build.json' | 'public-build.json') {
  const root = resolve(directory);
  const rootInfo = lstatSync(root);
  const manifestPath = resolve(root, manifestName);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()
    || !lstatSync(manifestPath).isFile() || lstatSync(manifestPath).isSymbolicLink()) {
    throw new Error('Client artifact requires a regular directory and manifest');
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const files = manifest?.files;
  if (!files || typeof files !== 'object' || Array.isArray(files)
    || !Object.values(files).every(hash => typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash))) {
    throw new Error('Client artifact requires a complete SHA256 file manifest');
  }
  const observed: string[] = [];
  function visit(folder: string): void {
    for (const name of readdirSync(folder)) {
      const path = resolve(folder, name), info = lstatSync(path);
      if (info.isSymbolicLink()) throw new Error('Artifact symlink rejected');
      if (info.isDirectory()) { visit(path); continue; }
      if (!info.isFile()) throw new Error('Non-file artifact entry rejected');
      const key = relative(root, path);
      if (key === manifestName) continue;
      if (key !== 'index.html' && !/^assets\/[A-Za-z0-9_-]+\.(js|css|png|jpe?g|webp|svg|woff|woff2|txt)$/.test(key)) {
        throw new Error('Unexpected client artifact path');
      }
      observed.push(key);
      if (files[key] !== createHash('sha256').update(readFileSync(path)).digest('hex')) {
        throw new Error('Client asset hash mismatch');
      }
    }
  }
  visit(root);
  if (!observed.includes('index.html') || JSON.stringify(observed.sort()) !== JSON.stringify(Object.keys(files).sort())) {
    throw new Error('Client asset manifest is incomplete');
  }
  return manifest;
}
