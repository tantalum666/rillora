const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..', '..');
const assetDir = path.join(
  projectRoot,
  'assets',
  'concepts',
  'rillora-logo-gate2-dual-embrace-20260808',
);
const manifestPath = path.join(assetDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function variantFile(variant) {
  return path.join(
    assetDir,
    `${variant.id.toLowerCase()}-${variant.label.toLowerCase()}.svg`,
  );
}

async function raster(svgPath, size) {
  const { data, info } = await sharp(svgPath)
    .resize(size, size, { fit: 'fill' })
    .flatten({ background: '#FFFFFF' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function connectedBlackComponents(image, threshold = 128) {
  const { data, width, height } = image;
  const visited = new Uint8Array(width * height);
  const components = [];
  const queue = new Int32Array(width * height);

  const isBlack = (index) => data[index] < threshold;
  for (let start = 0; start < width * height; start += 1) {
    if (visited[start] || !isBlack(start)) continue;

    let head = 0;
    let tail = 0;
    let area = 0;
    queue[tail++] = start;
    visited[start] = 1;

    while (head < tail) {
      const index = queue[head++];
      area += 1;
      const x = index % width;
      const y = Math.floor(index / width);
      const neighbors = [];
      if (x > 0) neighbors.push(index - 1);
      if (x + 1 < width) neighbors.push(index + 1);
      if (y > 0) neighbors.push(index - width);
      if (y + 1 < height) neighbors.push(index + width);

      for (const neighbor of neighbors) {
        if (!visited[neighbor] && isBlack(neighbor)) {
          visited[neighbor] = 1;
          queue[tail++] = neighbor;
        }
      }
    }

    if (area >= Math.max(2, Math.round(width * height * 0.0005))) {
      components.push(area);
    }
  }

  return components.sort((a, b) => b - a);
}

function componentMetrics(components) {
  const relevant = components.slice(0, 2);
  const balanceRatio = relevant.length === 2
    ? Number((relevant[1] / relevant[0]).toFixed(4))
    : 0;
  return {
    count: components.length,
    twoLargestAreas: relevant,
    balanceRatio,
  };
}

function changedPixelRatio(left, right, threshold = 16) {
  if (left.width !== right.width || left.height !== right.height) {
    throw new Error('Cannot compare rasters with different dimensions');
  }
  let changed = 0;
  for (let index = 0; index < left.data.length; index += 1) {
    if (Math.abs(left.data[index] - right.data[index]) > threshold) changed += 1;
  }
  return Number((changed / left.data.length).toFixed(5));
}

async function main() {
  const sizes = [320, 64, 32];
  const rasterCache = new Map();
  const results = [];

  for (const variant of manifest.variants) {
    const svgPath = variantFile(variant);
    const sizeMetrics = {};
    for (const size of sizes) {
      const image = await raster(svgPath, size);
      rasterCache.set(`${variant.id}:${size}`, image);
      sizeMetrics[size] = componentMetrics(connectedBlackComponents(image));
    }

    const smallest = sizeMetrics[32];
    const full = sizeMetrics[320];
    const warnings = [];
    if (smallest.count !== 2) warnings.push('32px topology is not exactly two black masses');
    if (full.balanceRatio >= 0.9) warnings.push('mass balance is too close to an equal taijitu split');
    if (full.balanceRatio < 0.55) warnings.push('secondary mass is too weak for interdependence');

    results.push({
      id: variant.id,
      label: variant.label,
      series: variant.series,
      variable: variant.variable,
      sizes: sizeMetrics,
      pass: warnings.length === 0,
      warnings,
    });
  }

  const seriesDifferences = [];
  for (const series of ['lobe-asymmetry', 'pivot-rhythm', 'extended-lobe-asymmetry']) {
    const sequence = manifest.variants.filter((variant) => variant.series === series);
    for (let index = 1; index < sequence.length; index += 1) {
      const previous = sequence[index - 1];
      const current = sequence[index];
      seriesDifferences.push({
        pair: `${previous.id}-${current.id}`,
        series,
        changedPixelRatio320: changedPixelRatio(
          rasterCache.get(`${previous.id}:320`),
          rasterCache.get(`${current.id}:320`),
        ),
      });
    }
  }

  const report = {
    generatedAt: '2026-08-08',
    evidenceBoundary: 'mechanical topology and raster-survival checks only; not semantic, cultural, optical, trademark, or Owner approval evidence',
    thresholds: {
      blackPixel: '< 128 grayscale',
      componentConnectivity: '4-neighbour',
      allowedFullSizeBalanceRatio: '[0.55, 0.90)',
      required32pxBlackComponents: 2,
    },
    variants: results,
    adjacentDifferences: seriesDifferences,
  };

  const reportPath = path.join(assetDir, 'qa-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
