const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..', '..');
const outputDir = path.join(
  projectRoot,
  'assets',
  'concepts',
  'rillora-logo-gate2-dual-embrace-20260808',
);

const fixed = Object.freeze({
  concept: 'The Next Reader / 后来者可读',
  skeleton: 'Dual Embrace / 双域互含',
  viewBox: 320,
  center: [160, 160],
  radius: 120,
  seamWidth: 16,
  endpoints: [[58, 61], [262, 259]],
  topology: 'one complete circular field split into two interdependent masses by one boundary-to-boundary negative seam',
  exclusions: [
    'dots',
    'standard yin-yang fish forms',
    'mechanical equal halves',
    'traditional taijitu proportions',
    'letters',
    'arrows',
    'waves',
    'security or legal emblems',
  ],
});

const variants = Object.freeze([
  {
    id: 'A1',
    series: 'lobe-asymmetry',
    label: 'Quiet',
    variable: { name: 'lobeDepth', value: 0.62 },
    params: { lobeDepth: 0.62, pivotY: 160 },
  },
  {
    id: 'A2',
    series: 'lobe-asymmetry',
    label: 'Measured',
    variable: { name: 'lobeDepth', value: 0.82 },
    params: { lobeDepth: 0.82, pivotY: 160 },
  },
  {
    id: 'A3',
    series: 'lobe-asymmetry',
    label: 'Embrace',
    variable: { name: 'lobeDepth', value: 1.02 },
    params: { lobeDepth: 1.02, pivotY: 160 },
  },
  {
    id: 'A4',
    series: 'lobe-asymmetry',
    label: 'Deep',
    variable: { name: 'lobeDepth', value: 1.22 },
    params: { lobeDepth: 1.22, pivotY: 160 },
  },
  {
    id: 'B1',
    series: 'pivot-rhythm',
    label: 'Early',
    variable: { name: 'pivotY', value: 142 },
    params: { lobeDepth: 0.92, pivotY: 142 },
  },
  {
    id: 'B2',
    series: 'pivot-rhythm',
    label: 'Lifted',
    variable: { name: 'pivotY', value: 154 },
    params: { lobeDepth: 0.92, pivotY: 154 },
  },
  {
    id: 'B3',
    series: 'pivot-rhythm',
    label: 'Settled',
    variable: { name: 'pivotY', value: 166 },
    params: { lobeDepth: 0.92, pivotY: 166 },
  },
  {
    id: 'B4',
    series: 'pivot-rhythm',
    label: 'Late',
    variable: { name: 'pivotY', value: 178 },
    params: { lobeDepth: 0.92, pivotY: 178 },
  },
  {
    id: 'C1',
    series: 'extended-lobe-asymmetry',
    label: 'Pronounced',
    variable: { name: 'lobeDepth', value: 1.38 },
    params: { lobeDepth: 1.38, pivotY: 160 },
  },
  {
    id: 'C2',
    series: 'extended-lobe-asymmetry',
    label: 'Weighted',
    variable: { name: 'lobeDepth', value: 1.54 },
    params: { lobeDepth: 1.54, pivotY: 160 },
  },
  {
    id: 'C3',
    series: 'extended-lobe-asymmetry',
    label: 'Unequal',
    variable: { name: 'lobeDepth', value: 1.70 },
    params: { lobeDepth: 1.70, pivotY: 160 },
  },
  {
    id: 'C4',
    series: 'extended-lobe-asymmetry',
    label: 'Maximum',
    variable: { name: 'lobeDepth', value: 1.86 },
    params: { lobeDepth: 1.86, pivotY: 160 },
  },
]);

const shortlist = Object.freeze([
  {
    id: 'A4',
    status: 'CLOSEST TO GATE 1',
    judgment: [
      'Most faithful to the selected Yin-Yang feeling;',
      'highest residual taijitu and ball-seam risk.',
    ],
  },
  {
    id: 'C2',
    status: 'DESIGN RECOMMENDATION',
    judgment: [
      'Best balance of mutuality and calm tension;',
      'clearly departs from an equal taijitu split.',
    ],
  },
  {
    id: 'C4',
    status: 'DISTINCTIVENESS BOUNDARY',
    judgment: [
      'Strongest asymmetry and independent recall;',
      'may weaken gentle two-sided interdependence.',
    ],
  },
]);

function seamPath({ lobeDepth, pivotY }) {
  const pivotX = 160 + 14 * lobeDepth;
  const firstControlX = 102 + 66 * lobeDepth;
  const secondControlX = 184 + 24 * lobeDepth;
  const secondControlY = pivotY - 43;
  const thirdControlX = 136 - 9 * lobeDepth;
  const thirdControlY = pivotY + 43;
  const fourthControlX = 148 - 8 * lobeDepth;

  const number = (value) => Number(value.toFixed(2));
  return [
    `M ${fixed.endpoints[0][0]} ${fixed.endpoints[0][1]}`,
    `C ${number(firstControlX)} 76 ${number(secondControlX)} ${number(secondControlY)} ${number(pivotX)} ${pivotY}`,
    `C ${number(thirdControlX)} ${number(thirdControlY)} ${number(fourthControlX)} 244 ${fixed.endpoints[1][0]} ${fixed.endpoints[1][1]}`,
  ].join(' ');
}

function symbolMarkup(variant, { idPrefix, reversed = false } = {}) {
  const prefix = idPrefix || variant.id.toLowerCase();
  const field = reversed ? '#FFFFFF' : '#11110F';
  const seam = reversed ? '#11110F' : '#FFFFFF';
  return [
    `<defs><clipPath id="${prefix}-clip"><circle cx="160" cy="160" r="120"/></clipPath></defs>`,
    `<circle cx="160" cy="160" r="120" fill="${field}"/>`,
    `<path d="${seamPath(variant.params)}" fill="none" stroke="${seam}" stroke-width="${fixed.seamWidth}" stroke-linecap="round" clip-path="url(#${prefix}-clip)"/>`,
  ].join('');
}

function individualSvg(variant) {
  return [
    '<svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">',
    '<rect width="320" height="320" fill="#FFFFFF"/>',
    symbolMarkup(variant, { idPrefix: variant.id.toLowerCase() }),
    '</svg>',
  ].join('');
}

function escaped(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function boardSvg() {
  const width = 1680;
  const cardWidth = 382;
  const cardHeight = 426;
  const gap = 22;
  const startX = 54;
  const startY = 176;
  const rowCount = Math.ceil(variants.length / 4);
  const height = startY + rowCount * cardHeight + (rowCount - 1) * gap + 62;

  const cards = variants.map((variant, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const x = startX + column * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);
    const symbolX = x + 73;
    const symbolY = y + 84;
    const miniX = x + 46;
    const miniY = y + 340;
    const reverseX = x + 112;
    const reverseY = y + 326;
    const variableText = `${variant.variable.name} = ${variant.variable.value}`;

    return [
      `<g id="card-${variant.id}">`,
      `<rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="18" fill="#FFFFFF" stroke="#D6D3CB"/>`,
      `<text x="${x + 24}" y="${y + 34}" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="1.4" fill="#5F5D57">${variant.id} / ${escaped(variant.series)}</text>`,
      `<text x="${x + 24}" y="${y + 65}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#11110F">${escaped(variant.label)}</text>`,
      `<g transform="translate(${symbolX} ${symbolY}) scale(0.74)">${symbolMarkup(variant, { idPrefix: `board-${variant.id}` })}</g>`,
      `<g transform="translate(${miniX} ${miniY}) scale(0.1)">${symbolMarkup(variant, { idPrefix: `mini-${variant.id}` })}</g>`,
      `<rect x="${reverseX}" y="${reverseY}" width="54" height="54" rx="8" fill="#11110F"/>`,
      `<g transform="translate(${reverseX + 11} ${reverseY + 11}) scale(0.1)">${symbolMarkup(variant, { idPrefix: `reverse-${variant.id}`, reversed: true })}</g>`,
      `<text x="${x + 190}" y="${y + 351}" font-family="Inter, Arial, sans-serif" font-size="12" fill="#77746D">32px / reverse</text>`,
      `<text x="${x + 24}" y="${y + 400}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" fill="#5F5D57">${escaped(variableText)}</text>`,
      '</g>',
    ].join('');
  }).join('');

  return [
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="${width}" height="${height}" fill="#F5F2EA"/>`,
    '<text x="54" y="54" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="1.8" fill="#5F5D57">RILLORA / LOGO GATE 2 / CONTROLLED VECTOR VARIATION</text>',
    '<text x="54" y="102" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="700" fill="#11110F">Dual Embrace — seam studies</text>',
    '<text x="54" y="137" font-family="Inter, Arial, sans-serif" font-size="16" fill="#5F5D57">Fixed: complete field · two interdependent masses · no dots · black/white · 16px seam. Series A/C vary lobe asymmetry; Series B varies pivot rhythm.</text>',
    cards,
    `<text x="54" y="${height - 24}" font-family="Inter, Arial, sans-serif" font-size="13" fill="#5F5D57">Variation evidence only — not a final Logo, production master, trademark conclusion, or taijitu adaptation.</text>`,
    '</svg>',
  ].join('');
}

function shortlistBoardSvg() {
  const width = 1380;
  const height = 780;
  const cardWidth = 408;
  const cardHeight = 548;
  const gap = 24;
  const startX = 54;
  const startY = 166;

  const cards = shortlist.map((entry, index) => {
    const variant = variants.find((candidate) => candidate.id === entry.id);
    if (!variant) throw new Error(`Shortlist variant not found: ${entry.id}`);
    const x = startX + index * (cardWidth + gap);
    const y = startY;
    return [
      `<g id="shortlist-${variant.id}">`,
      `<rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="18" fill="#FFFFFF" stroke="#D6D3CB"/>`,
      `<text x="${x + 26}" y="${y + 36}" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="1.35" fill="#5F5D57">${variant.id} / ${escaped(entry.status)}</text>`,
      `<text x="${x + 26}" y="${y + 70}" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="700" fill="#11110F">${escaped(variant.label)}</text>`,
      `<g transform="translate(${x + 84} ${y + 91}) scale(0.75)">${symbolMarkup(variant, { idPrefix: `shortlist-main-${variant.id}` })}</g>`,
      `<g transform="translate(${x + 34} ${y + 370}) scale(0.1)">${symbolMarkup(variant, { idPrefix: `shortlist-mini-${variant.id}` })}</g>`,
      `<rect x="${x + 100}" y="${y + 356}" width="54" height="54" rx="8" fill="#11110F"/>`,
      `<g transform="translate(${x + 111} ${y + 367}) scale(0.1)">${symbolMarkup(variant, { idPrefix: `shortlist-reverse-${variant.id}`, reversed: true })}</g>`,
      `<text x="${x + 178}" y="${y + 388}" font-family="Inter, Arial, sans-serif" font-size="12" fill="#77746D">32px / reverse</text>`,
      `<text x="${x + 26}" y="${y + 458}" font-family="Inter, Arial, sans-serif" font-size="14" fill="#5F5D57"><tspan x="${x + 26}" dy="0">${escaped(entry.judgment[0])}</tspan><tspan x="${x + 26}" dy="21">${escaped(entry.judgment[1])}</tspan></text>`,
      '</g>',
    ].join('');
  }).join('');

  return [
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="${width}" height="${height}" fill="#F5F2EA"/>`,
    '<text x="54" y="48" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="1.8" fill="#5F5D57">RILLORA / LOGO GATE 2 / INTERNAL SHORTLIST</text>',
    '<text x="54" y="94" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="700" fill="#11110F">Dual Embrace — three surviving seam studies</text>',
    '<text x="54" y="128" font-family="Inter, Arial, sans-serif" font-size="15" fill="#5F5D57">Twelve controlled vectors → five mechanical passes → three semantic survivors. C2 is the design recommendation.</text>',
    cards,
    '<text x="54" y="752" font-family="Inter, Arial, sans-serif" font-size="13" fill="#5F5D57">Owner selection is required before manual vector reconstruction. These remain variation evidence, not final Logo candidates.</text>',
    '</svg>',
  ].join('');
}

function readme() {
  return `# Rillora Gate 2 — Dual Embrace controlled vectors

Status: variation evidence; no final Logo selected

This folder is generated by \`tools/logo/generate-dual-embrace-gate2.cjs\` from the Owner-approved Gate 1 skeleton.

## Fixed structure

- complete compact circular field;
- two interdependent masses;
- one boundary-to-boundary negative seam;
- no dots;
- black and white only;
- fixed 16-unit seam width in a 320-unit viewBox.

## Controlled variables

- Series A changes only lobe asymmetry depth.
- Series B changes only the vertical pivot rhythm.
- Series C extends the same lobe-asymmetry variable beyond the first mechanical-equality risk boundary.

The standard yin-yang fish construction, mechanical equal halves, traditional taijitu proportions, letters and literal water/security/legal symbols remain excluded.

These SVGs and the review board are editable vector variation evidence. They are not a final Logo, production master, trademark clearance, cultural-suitability conclusion, wordmark, App icon or release asset.

## Internal shortlist

- A4: closest to the approved Gate 1 feeling.
- C2: design recommendation.
- C4: maximum distinctiveness boundary.
`;
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  for (const variant of variants) {
    fs.writeFileSync(
      path.join(outputDir, `${variant.id.toLowerCase()}-${variant.label.toLowerCase()}.svg`),
      individualSvg(variant),
      'utf8',
    );
  }

  const board = boardSvg();
  const boardSvgPath = path.join(outputDir, 'gate2-review-board.svg');
  const boardPngPath = path.join(outputDir, 'gate2-review-board.png');
  const shortlistSvg = shortlistBoardSvg();
  const shortlistSvgPath = path.join(outputDir, 'gate2-shortlist-board.svg');
  const shortlistPngPath = path.join(outputDir, 'gate2-shortlist-board.png');
  fs.writeFileSync(boardSvgPath, board, 'utf8');
  fs.writeFileSync(shortlistSvgPath, shortlistSvg, 'utf8');
  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    `${JSON.stringify({ generatedAt: '2026-08-08', fixed, variants, shortlist }, null, 2)}\n`,
    'utf8',
  );
  fs.writeFileSync(path.join(outputDir, 'README.md'), readme(), 'utf8');

  await sharp(Buffer.from(board))
    .png()
    .toFile(boardPngPath);
  await sharp(Buffer.from(shortlistSvg))
    .png()
    .toFile(shortlistPngPath);

  process.stdout.write(`${JSON.stringify({ outputDir, variants: variants.length, boardSvgPath, boardPngPath, shortlistSvgPath, shortlistPngPath }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
