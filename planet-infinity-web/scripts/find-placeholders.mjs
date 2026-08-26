#!/usr/bin/env node
/**
 * Lists every piece of business data still waiting on real information, and
 * where each one is rendered. Run: npm run placeholders
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SKIP = new Set(["node_modules", ".next", ".git", "scripts"]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(path);
  }
  return out;
}

const source = await readFile(join(ROOT, "content/placeholders.ts"), "utf8");
const entries = [...source.matchAll(/^\s{2}(\w+):\s*\{/gm)].map((m) => m[1]);
const filled = new Set(
  [...source.matchAll(/^\s{2}(\w+):\s*\{[\s\S]*?\n\s{2}\},/gm)]
    .filter((m) => !/value:\s*null/.test(m[0]))
    .map((m) => m[1])
);

const files = await walk(ROOT);
const usage = new Map();
for (const file of files) {
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(/<Placeholder\s+id="(\w+)"/g)) {
    const list = usage.get(match[1]) ?? [];
    list.push(relative(ROOT, file));
    usage.set(match[1], list);
  }
}

const outstanding = entries.filter((id) => !filled.has(id));

console.log(`\nPlanet Infinity — placeholder report`);
console.log(`${outstanding.length} of ${entries.length} values still unknown\n`);

for (const id of outstanding) {
  const where = usage.get(id);
  console.log(`  ✗ ${id.padEnd(22)} ${where ? where.join(", ") : "(not rendered yet)"}`);
}

if (filled.size) {
  console.log(`\n  Filled in: ${[...filled].join(", ")}`);
}
console.log(`\nEdit content/placeholders.ts to supply real values.\n`);
