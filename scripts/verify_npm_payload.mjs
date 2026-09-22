import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const payload = join(root, "dist", "payload");
const errors = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

const all = await walk(payload);
const rels = all.map(p => relative(payload, p).replaceAll("\\", "/"));
for (const rel of rels) {
  if (rel.includes("/tests/") || rel.startsWith("tests/")) errors.push(`tests shipped: ${rel}`);
  if (rel.includes("/.git/") || rel.startsWith(".git/")) errors.push(`git metadata shipped: ${rel}`);
  if (rel === "yaaw-core/project" || rel.startsWith("yaaw-core/project/")) errors.push(`durable project data shipped: ${rel}`);
  if (rel === "yaaw-core/runtime" || rel.startsWith("yaaw-core/runtime/")) errors.push(`runtime state shipped: ${rel}`);
  if (rel === "yaaw-core/install" || rel.startsWith("yaaw-core/install/")) errors.push(`installer state shipped: ${rel}`);
  if (/\.(pem|key|p12|pfx)$/i.test(rel) || /(^|\/)(\.env|id_rsa|id_ed25519)$/i.test(rel)) errors.push(`possible secret shipped: ${rel}`);
}

const skills = JSON.parse(await readFile(join(payload, "yaaw-core", "registries", "skills.json"), "utf8"));
const workflows = JSON.parse(await readFile(join(payload, "yaaw-core", "registries", "workflows.json"), "utf8"));
const skillDirs = (await readdir(join(payload, "skills"), { withFileTypes: true })).filter(x=>x.isDirectory()).map(x=>x.name).sort();
if (JSON.stringify(skillDirs) !== JSON.stringify(Object.keys(skills).sort())) errors.push("skill registry/payload directory mismatch");

for (const [skillId, entry] of Object.entries(skills)) {
  const path = join(payload, "skills", skillId, "SKILL.md");
  let text;
  try { text = await readFile(path, "utf8"); } catch { errors.push(`missing public skill ${skillId}`); continue; }
  if (!text.startsWith("---\n")) errors.push(`${skillId}: frontmatter must begin on line 1`);
  if (!text.includes(`name: ${skillId}`)) errors.push(`${skillId}: mismatched name`);
  if (!text.includes("description:")) errors.push(`${skillId}: missing description`);
  if (!workflows[entry.workflow_id]) errors.push(`${skillId}: unresolved workflow ${entry.workflow_id}`);
}
for (const [id, entry] of Object.entries(workflows)) {
  const rel = String(entry.workflow).replace(/^\.yaaw-core\//, "");
  try { await stat(join(payload, "yaaw-core", rel)); } catch { errors.push(`${id}: missing workflow ${entry.workflow}`); }
}

for (const file of all) {
  if (!/\.(md|json|ts|js|mjs)$/i.test(file)) continue;
  const text = await readFile(file, "utf8");
  if (/(^|[^-])\.yaaw\//m.test(text)) errors.push(`legacy .yaaw root reference in ${relative(payload, file)}`);
  if (/BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/.test(text)) errors.push(`private key material in ${relative(payload, file)}`);
  if (/python\s+scripts\/init_project\.py/.test(text)) errors.push(`source-checkout initializer instruction in ${relative(payload, file)}`);
}

for (const name of ["codex.md", "claude-code.md", "gemini-cli.md", "cline.md"]) {
  const text = await readFile(join(payload, "bootstrap", name), "utf8");
  if (!text.includes(".yaaw-core/")) errors.push(`${name}: bootstrap must point to .yaaw-core`);
  if (text.split("\n").length > 30) errors.push(`${name}: bootstrap is not thin`);
}

if (errors.length) {
  console.error("YAAW npm payload verification failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`YAAW npm payload verified: ${all.length} files.`);
