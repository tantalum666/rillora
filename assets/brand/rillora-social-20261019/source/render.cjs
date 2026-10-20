// Render the exact new SVG compositions; the generated background remains intact.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require(process.env.RILLORA_SHARP_MODULE || 'sharp');
const pack = path.resolve(__dirname, '..');

(async () => {
  const manifestPath = path.join(pack, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const files = [];
  for (const language of ['en', 'zh-CN']) {
    const name = `rillora-x-banner-${language}`;
    const source = fs.readFileSync(path.join(pack, `${name}.svg`));
    const output = await sharp(source).removeAlpha().png().toBuffer();
    const meta = await sharp(output).metadata();
    if (meta.width !== 1500 || meta.height !== 500 || output.length >= 2_000_000) {
      throw new Error(`Invalid export geometry or oversized image: ${name}`);
    }
    fs.writeFileSync(path.join(pack, `${name}.png`), output);
    for (const extension of ['png', 'svg']) {
      const file = `${name}.${extension}`;
      const bytes = fs.readFileSync(path.join(pack, file));
      files.push({file, bytes: bytes.length,
        sha256: crypto.createHash('sha256').update(bytes).digest('hex')});
    }
  }
  manifest.exports = files;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({exports: files, geometryVerified: true}));
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
