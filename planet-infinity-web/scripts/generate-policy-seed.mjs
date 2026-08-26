import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "content", "policies.ts");
const outputPath = path.join(
  projectRoot,
  "supabase",
  "migrations",
  "20260825104000_seed_supplied_policies.sql",
);

const source = fs.readFileSync(sourcePath, "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const compiledModule = { exports: {} };
new Function("exports", "module", "require", javascript)(compiledModule.exports, compiledModule, () => {
  throw new Error("The policy source must remain dependency-free.");
});

const records = compiledModule.exports.POLICY_SEED_RECORDS.filter((record) => record.isActive);
const quote = (value, tag) => `$${tag}$${value}$${tag}$`;

const rows = records
  .map(
    (record, index) =>
      `  (${quote(record.slug, `slug_${index}`)}, ${quote(record.title, `title_${index}`)}, ${quote(record.version, `version_${index}`)}, ${quote(record.body, `body_${index}`)}, true)`,
  )
  .join(",\n");

const sql = `-- Generated from content/policies.ts. Do not hand-edit this migration.\n` +
  `-- Includes the supplied guest-policy pack and the owner-requested Privacy Policy.\n\n` +
  `insert into public.policies (slug, title, version, body, is_active)\nvalues\n${rows}\n` +
  `on conflict (slug) do update set\n` +
  `  title = excluded.title,\n` +
  `  version = excluded.version,\n` +
  `  body = excluded.body,\n` +
  `  is_active = excluded.is_active,\n` +
  `  updated_at = now();\n\n` +
  `update public.policies\n` +
  `set is_active = false, updated_at = now()\n` +
  `where slug = 'privacy' and btrim(body) = '';\n`;

fs.writeFileSync(outputPath, sql, "utf8");
console.log(`Generated ${path.relative(projectRoot, outputPath)} with ${records.length} supplied policies.`);
