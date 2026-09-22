import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { assertRelativeManifestPath } from "./boundary.js";
import { sha256Bytes } from "./hashing.js";
import { extractManagedSection, managedSectionHash } from "./managed-sections.js";
import { readManifest } from "./manifest.js";

async function exists(path: string) {
  try { await access(path); return true; } catch { return false; }
}

const emptyCounts = () => ({ healthy: 0, modified: 0, missing: 0, localOverrides: 0 });

export async function inspectStatus(projectRoot: string) {
  let manifest;
  try {
    manifest = await readManifest(projectRoot);
  } catch (error: any) {
    return {
      installed: true,
      manifestValid: false,
      projectRoot,
      version: null,
      integrations: [],
      skills: [],
      projectMemory: await exists(join(projectRoot, ".yaaw-core", "project")),
      managedFiles: emptyCounts(),
      managedSections: emptyCounts(),
      healthy: false,
      issues: [`invalid installation manifest: ${error.message}`]
    };
  }
  if (!manifest) {
    return { installed: false, manifestValid: false, projectRoot, healthy: false, message: "No YAAW-SE installation manifest." };
  }

  const managedFiles = emptyCounts();
  const issues: string[] = [];
  for (const [rel, record] of Object.entries(manifest.managedFiles)) {
    try {
      const path = await assertRelativeManifestPath(projectRoot, rel);
      if (!(await exists(path))) {
        managedFiles.missing += 1;
        issues.push(`missing managed file: ${rel}`);
        continue;
      }
      const hash = sha256Bytes(await readFile(path));
      if (hash !== record.sha256) {
        managedFiles.modified += 1;
        issues.push(`modified managed file: ${rel}`);
      } else if (record.localOverride) managedFiles.localOverrides += 1;
      else managedFiles.healthy += 1;
    } catch (error: any) {
      issues.push(`unsafe/invalid manifest file path ${rel}: ${error.message}`);
    }
  }

  const managedSections = emptyCounts();
  for (const [rel, sections] of Object.entries(manifest.managedSections)) {
    try {
      const path = await assertRelativeManifestPath(projectRoot, rel);
      const text = (await exists(path)) ? await readFile(path, "utf8") : "";
      for (const [id, record] of Object.entries(sections)) {
        const current = extractManagedSection(text, id);
        if (current === null) {
          managedSections.missing += 1;
          issues.push(`missing managed section: ${rel}#${id}`);
        } else if (managedSectionHash(current) !== record.sha256) {
          managedSections.modified += 1;
          issues.push(`modified managed section: ${rel}#${id}`);
        } else if (record.localOverride) managedSections.localOverrides += 1;
        else managedSections.healthy += 1;
      }
    } catch (error: any) {
      issues.push(`unsafe/invalid manifest section path ${rel}: ${error.message}`);
    }
  }

  const projectMemory = await exists(join(projectRoot, ".yaaw-core", "project"));
  if (!projectMemory) issues.push("durable project memory directory is missing");

  return {
    installed: true,
    manifestValid: true,
    projectRoot,
    version: manifest.yaawVersion,
    integrations: Object.keys(manifest.integrations),
    skills: manifest.skills,
    projectMemory,
    managedFiles,
    managedSections,
    healthy: issues.length === 0,
    issues
  };
}

export async function doctor(projectRoot: string) {
  const status: any = await inspectStatus(projectRoot);
  if (!status.installed) {
    return { ...status, checks: [{ name: "manifest", ok: false, detail: status.message }] };
  }
  if (!status.manifestValid) {
    return {
      ...status,
      checks: [
        { name: "manifest", ok: false, detail: status.issues?.[0] ?? "invalid manifest" },
        { name: "project-memory", ok: Boolean(status.projectMemory) }
      ]
    };
  }

  const checks: {name:string; ok:boolean; detail?:string}[] = [];
  checks.push({ name: "manifest", ok: true });
  checks.push({ name: "managed-files", ok: status.managedFiles.modified === 0 && status.managedFiles.missing === 0 });
  checks.push({ name: "managed-sections", ok: status.managedSections.modified === 0 && status.managedSections.missing === 0 });
  checks.push({ name: "project-memory", ok: status.projectMemory });

  const manifest = await readManifest(projectRoot);
  const durablePrefix = ".yaaw-core/project/";
  const badOwned = Object.keys(manifest!.managedFiles).filter(p=>p.startsWith(durablePrefix));
  checks.push({
    name: "durable-ownership",
    ok: badOwned.length === 0,
    detail: badOwned.length ? `durable paths incorrectly managed: ${badOwned.join(", ")}` : undefined
  });

  try {
    const paths = JSON.parse(await readFile(join(projectRoot, ".yaaw-core", "registries", "paths.json"), "utf8"));
    checks.push({ name: "path-registry", ok: paths.workspace_root === "." && paths.project_memory_root === ".yaaw-core/project" && paths.research === ".yaaw-core/project/research" && paths.runtime_root === ".yaaw-core/runtime" && paths.install_root === ".yaaw-core/install" });
  } catch {
    checks.push({ name: "path-registry", ok: false, detail: "missing or invalid paths registry" });
  }

  return {
    ...status,
    healthy: status.healthy && checks.every(c=>c.ok),
    checks
  };
}
