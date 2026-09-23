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

function isFrameworkManaged(rel: string, record: any) {
  const path = rel.replaceAll("\\", "/");
  if (record?.owner === "package:core") return true;
  if (!path.startsWith(".yaaw-core/")) return false;
  return !(
    path.startsWith(".yaaw-core/project/") ||
    path.startsWith(".yaaw-core/runtime/") ||
    path.startsWith(".yaaw-core/install/")
  );
}

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
      frameworkIntegrity: { status: "MANIFEST_INVALID", repairRequired: true, modifiedPaths: [], missingPaths: [], localOverridePaths: [], legacyLayout: false },
      healthy: false,
      issues: [`invalid installation manifest: ${error.message}`]
    };
  }
  if (!manifest) {
    return { installed: false, manifestValid: false, projectRoot, healthy: false, message: "No YAAW-SE installation manifest." };
  }

  const managedFiles = emptyCounts();
  const frameworkIntegrity = {
    status: "HEALTHY",
    repairRequired: false,
    healthy: 0,
    modified: 0,
    missing: 0,
    localOverrides: 0,
    modifiedPaths: [] as string[],
    missingPaths: [] as string[],
    localOverridePaths: [] as string[],
    legacyLayout: false
  };
  const issues: string[] = [];
  for (const [rel, record] of Object.entries(manifest.managedFiles)) {
    try {
      const path = await assertRelativeManifestPath(projectRoot, rel);
      const frameworkOwned = isFrameworkManaged(rel, record);
      if (!(await exists(path))) {
        managedFiles.missing += 1;
        issues.push(`missing managed file: ${rel}`);
        if (frameworkOwned) {
          frameworkIntegrity.missing += 1;
          frameworkIntegrity.missingPaths.push(rel);
        }
        continue;
      }
      const hash = sha256Bytes(await readFile(path));
      if (hash !== record.sha256) {
        managedFiles.modified += 1;
        issues.push(`modified managed file: ${rel}`);
        if (frameworkOwned) {
          frameworkIntegrity.modified += 1;
          frameworkIntegrity.modifiedPaths.push(rel);
        }
      } else if (record.localOverride) {
        managedFiles.localOverrides += 1;
        if (frameworkOwned) {
          frameworkIntegrity.localOverrides += 1;
          frameworkIntegrity.localOverridePaths.push(rel);
          issues.push(`unsupported package framework local override: ${rel}`);
        }
      } else {
        managedFiles.healthy += 1;
        if (frameworkOwned) frameworkIntegrity.healthy += 1;
      }
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

  frameworkIntegrity.legacyLayout = await exists(join(projectRoot, ".yaaw-core", "system"));
  if (frameworkIntegrity.legacyLayout) issues.push("legacy/parallel .yaaw-core/system framework layout exists; canonical execution is ambiguous");
  frameworkIntegrity.status = frameworkIntegrity.legacyLayout
    ? "LEGACY_LAYOUT"
    : frameworkIntegrity.missing > 0
      ? "MISSING"
      : frameworkIntegrity.modified > 0
        ? "MODIFIED"
        : frameworkIntegrity.localOverrides > 0
          ? "LOCAL_OVERRIDE"
          : "HEALTHY";
  frameworkIntegrity.repairRequired = frameworkIntegrity.status !== "HEALTHY";

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
    frameworkIntegrity,
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
  checks.push({
    name: "framework-integrity",
    ok: status.frameworkIntegrity?.status === "HEALTHY",
    detail: status.frameworkIntegrity?.status === "HEALTHY"
      ? undefined
      : `${status.frameworkIntegrity?.status ?? "UNKNOWN"}; repair with: npx yaaw-se install --action repair --conflict-policy backup-replace --yes`
  });
  checks.push({ name: "project-memory", ok: status.projectMemory });

  const canonicalCore = await exists(join(projectRoot, ".yaaw-core", "core"));
  const canonicalWorkflows = await exists(join(projectRoot, ".yaaw-core", "workflows"));
  const legacySystem = await exists(join(projectRoot, ".yaaw-core", "system"));
  checks.push({
    name: "framework-layout",
    ok: canonicalCore && canonicalWorkflows && !legacySystem,
    detail: legacySystem
      ? "legacy/parallel .yaaw-core/system framework layout exists; canonical execution is ambiguous"
      : (!canonicalCore || !canonicalWorkflows ? "canonical .yaaw-core/core or .yaaw-core/workflows is missing" : undefined)
  });

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
