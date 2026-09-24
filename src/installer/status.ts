import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { assertRelativeManifestPath } from "./boundary.js";
import { sha256Bytes } from "./hashing.js";
import { extractManagedSection, managedSectionHash } from "./managed-sections.js";
import { readTomlManagedValue, semanticConfigHash, validateManagedToml } from "./toml-managed.js";
import { readManifest } from "./manifest.js";
import { configurationStatus } from "./configuration.js";
import { migrateInstallationManifest } from "./migrations/installation/index.js";

async function exists(path: string) {
  try { await access(path); return true; } catch { return false; }
}

const emptyCounts = () => ({ healthy: 0, modified: 0, missing: 0, localOverrides: 0 });

function isFrameworkManaged(rel: string, record: any) {
  const path = rel.replaceAll("\\", "/");
  return record?.owner === "package:system" || path.startsWith(".yaaw-core/system/");
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
      systemSchema: null,
      projectSchema: null,
      installationSchema: null,
      integrations: [],
      skills: [],
      projectMemory: await exists(join(projectRoot, ".yaaw-core", "project")),
      managedFiles: emptyCounts(),
      managedSections: emptyCounts(),
      managedConfigKeys: emptyCounts(),
      frameworkIntegrity: { status: "MANIFEST_INVALID", repairRequired: true, modifiedPaths: [], missingPaths: [], localOverridePaths: [] },
      healthy: false,
      issues: [`invalid installation manifest: ${error.message}`]
    };
  }
  if (!manifest) {
    return { installed: false, manifestValid: false, projectRoot, healthy: false, message: "No YAAW-SE installation manifest." };
  }
  manifest = migrateInstallationManifest(manifest);

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
    localOverridePaths: [] as string[]
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

  const managedConfigKeys = emptyCounts();
  for (const [rel, keys] of Object.entries(manifest.managedConfigKeys ?? {})) {
    try {
      const path = await assertRelativeManifestPath(projectRoot, rel);
      const text = (await exists(path)) ? await readFile(path, "utf8") : "";
      validateManagedToml(text);
      for (const [key, record] of Object.entries(keys)) {
        const current = readTomlManagedValue(text, key);
        if (current === undefined) {
          managedConfigKeys.missing += 1;
          issues.push(`missing managed config key: ${rel}#${key}`);
        } else if (semanticConfigHash(current) !== record.sha256) {
          managedConfigKeys.modified += 1;
          issues.push(`modified managed config key: ${rel}#${key}`);
        } else if (record.localOverride) managedConfigKeys.localOverrides += 1;
        else managedConfigKeys.healthy += 1;
      }
    } catch (error: any) {
      issues.push(`unsafe/invalid managed config ${rel}: ${error.message}`);
    }
  }

  const projectMemory = await exists(join(projectRoot, ".yaaw-core", "project"));
  if (!projectMemory) issues.push("durable project memory directory is missing");

  frameworkIntegrity.status = frameworkIntegrity.missing > 0
    ? "MISSING"
    : frameworkIntegrity.modified > 0
      ? "MODIFIED"
      : frameworkIntegrity.localOverrides > 0
        ? "LOCAL_OVERRIDE"
        : "HEALTHY";
  frameworkIntegrity.repairRequired = frameworkIntegrity.status !== "HEALTHY";
  const configuration = configurationStatus(manifest);

  return {
    installed: true,
    manifestValid: true,
    projectRoot,
    version: manifest.yaawVersion,
    systemSchema: manifest.systemSchema,
    projectSchema: manifest.projectSchema,
    installationSchema: manifest.installationSchema,
    integrations: Object.keys(manifest.integrations),
    skills: manifest.skills,
    projectMemory,
    managedFiles,
    managedSections,
    managedConfigKeys,
    frameworkIntegrity,
    configuration,
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
  checks.push({ name: "managed-config-keys", ok: status.managedConfigKeys.modified === 0 && status.managedConfigKeys.missing === 0 });
  checks.push({
    name: "framework-integrity",
    ok: status.frameworkIntegrity?.status === "HEALTHY",
    detail: status.frameworkIntegrity?.status === "HEALTHY"
      ? undefined
      : `${status.frameworkIntegrity?.status ?? "UNKNOWN"}; repair with: npx yaaw-se install --action repair --conflict-policy backup-replace --yes`
  });
  checks.push({ name: "project-memory", ok: status.projectMemory });
  checks.push({ name: "system-root", ok: await exists(join(projectRoot, ".yaaw-core", "system")) });
  for (const [id, state] of Object.entries(status.configuration ?? {}) as [string, any][]) {
    checks.push({
      name: `configuration:${id}`,
      ok: true,
      detail: state.updateAvailable ? `configuration update available (applied r${state.appliedRevision}, available r${state.availableRevision})` : undefined
    });
  }

  const manifest = await readManifest(projectRoot);
  const durablePrefix = ".yaaw-core/project/";
  const badOwned = Object.keys(manifest!.managedFiles).filter(p=>p.startsWith(durablePrefix));
  checks.push({
    name: "durable-ownership",
    ok: badOwned.length === 0,
    detail: badOwned.length ? `durable paths incorrectly managed: ${badOwned.join(", ")}` : undefined
  });

  try {
    const paths = JSON.parse(await readFile(join(projectRoot, ".yaaw-core", "system", "registries", "paths.json"), "utf8"));
    checks.push({ name: "path-registry", ok: paths.workspace_root === "." && paths.system_root === ".yaaw-core/system" && paths.project_memory_root === ".yaaw-core/project" && paths.research === ".yaaw-core/project/research" && paths.runtime_root === ".yaaw-core/runtime" && paths.install_root === ".yaaw-core/install" });
  } catch {
    checks.push({ name: "path-registry", ok: false, detail: "missing or invalid paths registry" });
  }

  if (manifest?.integrations?.codex) {
    let codexConfig = "";
    let configOk = false;
    try {
      codexConfig = await readFile(join(projectRoot, ".codex", "config.toml"), "utf8");
      validateManagedToml(codexConfig);
      configOk = true;
    } catch {}
    checks.push({ name: "codex-config-syntax", ok: configOk });
    checks.push({ name: "codex-runtime-adapter", ok: await exists(join(projectRoot, ".codex", "yaaw-runtime.md")) });
    const roleFiles = ["yaaw-prd.toml","yaaw-planner.toml","yaaw-implementer.toml","yaaw-reviewer.toml"];
    checks.push({ name: "codex-role-files", ok: (await Promise.all(roleFiles.map(name => exists(join(projectRoot, ".codex", "agents", name))))).every(Boolean) });
    const declarations = [
      ["yaaw_prd","yaaw-prd.toml"],
      ["yaaw_planner","yaaw-planner.toml"],
      ["yaaw_implementer","yaaw-implementer.toml"],
      ["yaaw_reviewer","yaaw-reviewer.toml"]
    ];
    checks.push({
      name: "codex-role-declarations",
      ok: configOk && declarations.every(([role,file]) => readTomlManagedValue(codexConfig, `agents.${role}.config_file`) === `agents/${file}`)
    });
    const codexOwned = manifest.managedConfigKeys?.[".codex/config.toml"] ?? {};
    checks.push({
      name: "codex-managed-config-ownership",
      ok: declarations.every(([role]) => Boolean(codexOwned[`agents.${role}.description`]) && Boolean(codexOwned[`agents.${role}.config_file`]))
    });
    let bootstrap = "";
    try { bootstrap = await readFile(join(projectRoot, "AGENTS.md"), "utf8"); } catch {}
    checks.push({ name: "codex-bootstrap-runtime-reference", ok: bootstrap.includes(".codex/yaaw-runtime.md") });
  }

  return {
    ...status,
    healthy: status.healthy && checks.every(c=>c.ok),
    checks
  };
}
