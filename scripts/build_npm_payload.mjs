import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = join(root, "dist", "payload");
const coreOut = join(out, "yaaw-core", "system");
const packageMetadata = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const approved = ["core", "roles", "workflows", "expertise", "rules", "registries", "schemas", "templates"];

await rm(out, { recursive: true, force: true });
await mkdir(coreOut, { recursive: true });
for (const name of approved) {
  await cp(join(root, ".yaaw-core", "system", name), join(coreOut, name), { recursive: true });
}
await cp(join(root, "skills"), join(out, "skills"), { recursive: true });
await cp(join(root, "installer", "templates", "bootstrap"), join(out, "bootstrap"), { recursive: true });
await cp(join(root, "installer", "templates", "codex"), join(out, "integrations", "codex"), { recursive: true });

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}

const textExtensions = new Set([".md", ".json", ".toml"]);
const copiedFiles = await walk(out);
for (const file of copiedFiles) {
  const lower = file.toLowerCase();
  if ([...textExtensions].some(ext => lower.endsWith(ext))) {
    const text = await readFile(file, "utf8");
    await writeFile(file, text.replace(/\r\n/g, "\n"), "utf8");
  }
}

const files = (await walk(out)).filter(p => !p.endsWith("payload-files.json")).sort();
const manifest = [];
for (const file of files) {
  const bytes = await readFile(file);
  manifest.push({
    path: relative(out, file).replaceAll("\\", "/"),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length
  });
}
await writeFile(join(out, "payload.json"), JSON.stringify({ schema: "yaaw.payload/v1", version: packageMetadata.version }, null, 2) + "\n");
const payloadBytes = await readFile(join(out, "payload.json"));
manifest.push({
  path: "payload.json",
  sha256: createHash("sha256").update(payloadBytes).digest("hex"),
  bytes: payloadBytes.length
});
await writeFile(join(out, "payload-files.json"), JSON.stringify({ schema: "yaaw.payload-files/v1", files: manifest.sort((a,b)=>a.path.localeCompare(b.path)) }, null, 2) + "\n");
console.log(`Built YAAW npm payload with ${manifest.length} files.`);
