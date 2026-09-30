import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve("../../..");
const excluded = new Set(["node_modules", ".git", "dist", "build", ".next", ".playwright-cli", ".playwright-mcp", "output"]);
const files = [];

async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(target);
  }
}

await walk(root);
const missing = [];
for (const file of files) {
  const source = await fs.readFile(file, "utf8");
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const raw = match[1].trim().replace(/^<|>$/g, "");
    if (/^(https?:|mailto:|#)/.test(raw)) continue;
    const local = decodeURIComponent(raw.split("#")[0]);
    if (!local) continue;
    const resolved = path.resolve(path.dirname(file), local);
    try {
      await fs.access(resolved);
    } catch {
      missing.push(`${path.relative(root, file)} -> ${raw}`);
    }
  }
}

if (missing.length) {
  process.stderr.write(`${missing.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`Validated ${files.length} Markdown files; no missing local link targets.\n`);
