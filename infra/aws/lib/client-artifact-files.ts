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
  const publicDocuments = new Set<string>();
  const publicPages = ['index', 'product', 'security', 'pricing', 'support', 'legal', 'legal/licenses',
    'learn', 'learn/digital-legacy-checklist', 'learn/password-manager-and-digital-legacy'];
  if (manifest.pages !== undefined) {
    if (manifestName !== 'public-build.json' || !Array.isArray(manifest.pages) || manifest.pages.length !== publicPages.length * 2) {
      throw new Error('Only the complete public page matrix is allowed');
    }
    for (const locale of ['en', 'zh-CN']) for (const page of publicPages) {
      const file = `pages/${locale}/${page}.html`;
      const path = `/${locale}/${page === 'index' ? '' : page}`;
      const records = manifest.pages.filter((entry: any) => entry?.file === file);
      if (records.length !== 1 || records[0].locale !== locale || records[0].path !== path
        || records[0].canonical !== `https://www.rillora.xyz${path}`
        || Object.keys(records[0]).sort().join(',') !== 'canonical,file,locale,path') throw new Error('Invalid public page declaration');
      publicDocuments.add(file);
    }
    publicDocuments.add('robots.txt'); publicDocuments.add('sitemap.xml');
  }
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
      if (key !== 'index.html' && !publicDocuments.has(key) && !/^assets\/[A-Za-z0-9_-]+\.(js|css|png|jpe?g|webp|svg|woff|woff2|txt)$/.test(key)) {
        throw new Error('Unexpected client artifact path');
      }
      observed.push(key);
      if (files[key] !== createHash('sha256').update(readFileSync(path)).digest('hex')) {
        throw new Error('Client asset hash mismatch');
      }
    }
  }
  visit(root);
  if ([...publicDocuments].some(file => !observed.includes(file))) throw new Error('Public discovery artifact is incomplete');
  if (!observed.includes('index.html') || JSON.stringify(observed.sort()) !== JSON.stringify(Object.keys(files).sort())) {
    throw new Error('Client asset manifest is incomplete');
  }
  return manifest;
}
