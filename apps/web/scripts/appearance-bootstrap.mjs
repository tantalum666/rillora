import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

export async function writeAppearanceBootstrap(directory) {
  const source = await readFile(new URL("../src/websiteAppearance.js", import.meta.url), "utf8");
  const name = `website-appearance-${createHash("sha256").update(source).digest("hex").slice(0,16)}.js`;
  let html = await readFile(resolve(directory, "index.html"), "utf8");
  if (!html.includes('<script type="module"')) throw new Error("Module entry is missing");
  html = html.replace('<script type="module"', `<script src="/assets/${name}"></script>\n    <script type="module"`);
  await writeFile(resolve(directory, "assets", name), source);
  await writeFile(resolve(directory, "index.html"), html);
  return html;
}
