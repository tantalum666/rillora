#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const legalIndex = path.join(dist, "client", "legal.html");
const worker = path.join(root, "worker", "legal-index.js");
const hosting = path.join(root, ".openai", "hosting.json");

for (const file of [legalIndex, worker, hosting]) {
  if (!existsSync(file)) throw new Error("Missing legal Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
const workerSource = readFileSync(worker, "utf8");
const legalShellMarker = 'const legalShell = /* __RILLORA_LEGAL_SHELL__ */ "";';
if (!workerSource.includes(legalShellMarker)) {
  throw new Error("Legal Sites worker shell marker is missing.");
}
const legalShell = readFileSync(legalIndex, "utf8");
const bundledWorker = workerSource.replace(
  legalShellMarker,
  `const legalShell = ${JSON.stringify(legalShell)};`,
);
writeFileSync(path.join(dist, "server", "index.js"), bundledWorker);
unlinkSync(legalIndex);
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));

console.log("Prepared legal-only Sites build.");
