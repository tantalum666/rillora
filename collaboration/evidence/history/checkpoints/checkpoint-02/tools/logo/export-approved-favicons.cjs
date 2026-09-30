const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../..');
const brand = path.join(root, 'assets/brand/rillora');
const web = path.join(root, 'apps/web/src/assets/brand');
const config = JSON.parse(fs.readFileSync(path.join(root, 'config/brand.json'), 'utf8'));
const master = fs.readFileSync(path.join(brand, 'symbol-forest.svg'), 'utf8');
const body = master.replace(/^.*?<svg[^>]*>/s, '').replace(/<\/svg>\s*$/, '');
if (!master.includes('viewBox="16 16 308 322"') || (body.match(/<path /g) || []).length !== 10) {
  throw new Error('Unexpected approved symbol geometry; review the master before exporting.');
}

const reversed = body.replaceAll(config.palette.forest, config.palette.paper);
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="13" fill="${config.palette.forest}"/><g transform="translate(6 4) scale(${52 / 308}) translate(-16 -16)">${reversed}</g></svg>`;
let sharp;
try { sharp = require('sharp'); }
catch { sharp = require(process.env.RILLORA_SHARP_MODULE || '/Users/tantalum/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'); }

(async () => {
  const png = await sharp(Buffer.from(favicon)).resize(32, 32).png().toBuffer();
  for (const directory of [brand, web]) {
    fs.writeFileSync(path.join(directory, 'favicon.svg'), favicon);
    fs.writeFileSync(path.join(directory, 'favicon-32.png'), png);
  }
  for (const height of [16, 24]) {
    await sharp(Buffer.from(master)).resize({ height }).png().toFile(path.join(brand, `symbol-${height}.png`));
  }
  const manifestPath = path.join(brand, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.usageCorrectedAt = '2026-09-28';
  manifest.faviconGeometry = 'Complete identity03 master, ten paths; no micro simplification';
  manifest.files = manifest.files.map((entry) => ({
    ...entry,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(brand, entry.name))).digest('hex'),
  }));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ master: 'symbol-forest.svg', paths: 10, faviconCopies: 2 }));
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
