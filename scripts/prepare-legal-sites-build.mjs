#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
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
copyFileSync(worker, path.join(dist, "server", "index.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));

console.log("Prepared legal-only Sites build.");
