import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { sha256Bytes } from "./hashing.js";
import { extractManagedSection, managedSectionHash } from "./managed-sections.js";
import { MANIFEST_RELATIVE_PATH, emptyManifest } from "./manifest.js";
import { planProjectInitialization } from "./project-state.js";
import type { InstallContext, InstallOperation, InstallPlan, InstallationManifest, ManagedFileRecord } from "./types.js";
import { getIntegration } from "../integrations/registry.js";
import type { CanonicalSkill, IntegrationId } from "../integrations/types.js";

export class ManagedConflictError extends Error {
  constructor(public readonly conflicts: string[]) {
    super(`Modified or unmanaged YAAW-managed files require a choice: ${conflicts.join(", ")}`);
    this.name = "ManagedConflictError";
  }
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

async function canonicalSkills(payloadRoot: string): Promise<CanonicalSkill[]> {
  const registry = JSON.parse(await readFile(join(payloadRoot, "yaaw-core", "registries", "skills.json"), "utf8"));
  return Object.keys(registry).sort().map(id => ({ id, source: join(payloadRoot, "skills", id, "SKILL.md") }));
}

export async function resolveSkillSelection(payloadRoot: string, request: string | string[]): Promise<string[]> {
  const all = (await canonicalSkills(payloadRoot)).map(x=>x.id);
  const core = ["yaaw-orchestrator","yaaw-prd","yaaw-planner","yaaw-implement","yaaw-review"];
  if (Array.isArray(request)) {
    const unknown = request.filter(x=>!all.includes(x));
    if (unknown.length) throw new Error(`Unknown skills: ${unknown.join(", ")}`);
    return [...new Set(request)];
  }
  if (request === "standard") return all;
  if (request === "core") return core;
  const requested = request.split(",").map(x=>x.trim()).filter(Boolean);
  const unknown = requested.filter(x=>!all.includes(x));
  if (unknown.length) throw new Error(`Unknown skills: ${unknown.join(", ")}`);
  return [...new Set(requested)];
}

function rel(projectRoot: string, path: string) {
  return relative(projectRoot, path).replaceAll("\\", "/");
}

function queueEmptyParentCleanup(operations: InstallOperation[], projectRoot: string, path: string, owner: string) {
  const protectedDirs = new Set([
    projectRoot,
    join(projectRoot, ".yaaw-core"),
    join(projectRoot, ".yaaw-core", "project"),
    join(projectRoot, ".yaaw-core", "install")
  ]);
  let current = dirname(path);
  while (current !== projectRoot && !protectedDirs.has(current)) {
    if (!operations.some(op => op.type === "remove-empty-dir" && op.path === current)) {
      operations.push({ type: "remove-empty-dir", path: current, owner });
    }
    current = dirname(current);
  }
}

async function currentFileHash(path: string): Promise<string | null> {
  try { return sha256Bytes(await readFile(path)); } catch { return null; }
}

async function chooseManagedFile(params: {
  ctx: InstallContext;
  previous: InstallationManifest | null;
  path: string;
  owner: string;
  source?: string;
  content?: Buffer | string;
  operations: InstallOperation[];
  records: Record<string, ManagedFileRecord>;
  conflicts: string[];
  backupStamp: string;
}) {
  const { ctx, previous, path, owner, operations, records, conflicts, backupStamp } = params;
  const pathRel = rel(ctx.projectRoot, path);
  const expected = params.source ? await readFile(params.source) : Buffer.from(params.content ?? "");
  const expectedHash = sha256Bytes(expected);
  const diskHash = await currentFileHash(path);
  const prior = previous?.managedFiles?.[pathRel];
  const hasConflict = diskHash !== null && (
    prior ? (prior.localOverride === true || diskHash !== prior.sha256) : diskHash !== expectedHash
  );

  if (hasConflict && ctx.conflictPolicy === "fail") {
    conflicts.push(pathRel);
    return;
  }
  if (hasConflict && ctx.conflictPolicy === "keep") {
    operations.push({ type: "preserve", path, reason: "local managed-file override" });
    records[pathRel] = { owner, sha256: diskHash!, packageSha256: expectedHash, localOverride: true };
    return;
  }
  if (hasConflict && ctx.conflictPolicy === "backup-replace") {
    const backupPath = join(ctx.projectRoot, ".yaaw-core", "install", "backups", backupStamp, pathRel);
    operations.push({ type: "write-managed-file", path: backupPath, content: await readFile(path), owner: "installer:backup" });
  }
  if (params.source) operations.push({ type: "copy-managed-file", source: params.source, path, owner });
  else operations.push({ type: "write-managed-file", path, content: expected, owner });
  records[pathRel] = { owner, sha256: expectedHash };
}

async function chooseManagedSection(params: {
  ctx: InstallContext;
  previous: InstallationManifest | null;
  op: Extract<InstallOperation,{type:"update-managed-section"}>;
  sectionRecords: InstallationManifest["managedSections"];
  operations: InstallOperation[];
  conflicts: string[];
  backupStamp: string;
}) {
  const { ctx, previous, op, sectionRecords, operations, conflicts, backupStamp } = params;
  const pathRel = rel(ctx.projectRoot, op.path);
  let original = "";
  try { original = await readFile(op.path, "utf8"); } catch {}
  const existing = extractManagedSection(original, op.sectionId);
  const expectedHash = managedSectionHash(op.content);
  const prior = previous?.managedSections?.[pathRel]?.[op.sectionId];
  const existingHash = existing === null ? null : managedSectionHash(existing);
  const conflict = existing !== null && (prior ? (prior.localOverride === true || existingHash !== prior.sha256) : existingHash !== expectedHash);

  if (conflict && ctx.conflictPolicy === "fail") {
    conflicts.push(`${pathRel}#${op.sectionId}`);
    return;
  }
  if (conflict && ctx.conflictPolicy === "keep") {
    sectionRecords[pathRel] ??= {};
    sectionRecords[pathRel][op.sectionId] = { owner: op.owner, sha256: existingHash!, packageSha256: expectedHash, localOverride: true };
    return;
  }
  if (conflict && ctx.conflictPolicy === "backup-replace") {
    const backupPath = join(ctx.projectRoot, ".yaaw-core", "install", "backups", backupStamp, pathRel);
    operations.push({ type: "write-managed-file", path: backupPath, content: original, owner: "installer:backup" });
  }
  operations.push(op);
  sectionRecords[pathRel] ??= {};
  sectionRecords[pathRel][op.sectionId] = { owner: op.owner, sha256: expectedHash };
}


async function protectRemoval(params: {
  ctx: InstallContext;
  previous: InstallationManifest;
  pathRel: string;
  record: ManagedFileRecord;
  operations: InstallOperation[];
  conflicts: string[];
  backupStamp: string;
}) {
  const { ctx, previous, pathRel, record, operations, conflicts, backupStamp } = params;
  const path = join(ctx.projectRoot, pathRel);
  const diskHash = await currentFileHash(path);
  if (diskHash === null) return;
  const modified = record.localOverride === true || diskHash !== record.sha256;
  if (modified && ctx.conflictPolicy === "fail") {
    conflicts.push(pathRel);
    return;
  }
  if (modified && ctx.conflictPolicy === "keep") {
    operations.push({ type: "preserve", path, reason: "local managed-file override retained during removal" });
    return;
  }
  if (modified && ctx.conflictPolicy === "backup-replace") {
    const backupPath = join(ctx.projectRoot, ".yaaw-core", "install", "backups", backupStamp, pathRel);
    operations.push({ type: "write-managed-file", path: backupPath, content: await readFile(path), owner: "installer:backup" });
  }
  operations.push({ type: "remove-managed-file", path, owner: record.owner });
  queueEmptyParentCleanup(operations, ctx.projectRoot, path, record.owner);
}

async function protectSectionRemoval(params: {
  ctx: InstallContext;
  previous: InstallationManifest;
  pathRel: string;
  sectionId: string;
  record: any;
  operations: InstallOperation[];
  conflicts: string[];
  backupStamp: string;
}) {
  const { ctx, pathRel, sectionId, record, operations, conflicts, backupStamp } = params;
  const path = join(ctx.projectRoot, pathRel);
  let original = "";
  try { original = await readFile(path, "utf8"); } catch { return; }
  const existing = extractManagedSection(original, sectionId);
  if (existing === null) return;
  const modified = record.localOverride === true || managedSectionHash(existing) !== record.sha256;
  if (modified && ctx.conflictPolicy === "fail") {
    conflicts.push(`${pathRel}#${sectionId}`);
    return;
  }
  if (modified && ctx.conflictPolicy === "keep") {
    operations.push({ type: "preserve", path, reason: "local managed-section override retained during removal" });
    return;
  }
  if (modified && ctx.conflictPolicy === "backup-replace") {
    const backupPath = join(ctx.projectRoot, ".yaaw-core", "install", "backups", backupStamp, pathRel);
    operations.push({ type: "write-managed-file", path: backupPath, content: original, owner: "installer:backup" });
  }
  operations.push({ type: "remove-managed-section", path, sectionId, owner: record.owner });
}

export async function buildInstallPlan(ctx: InstallContext, previous: InstallationManifest | null): Promise<{plan: InstallPlan; manifest: InstallationManifest | null}> {
  const warnings: string[] = [];
  const operations: InstallOperation[] = [{ type: "mkdir", path: ctx.projectRoot, owner: "layout" }];
  const conflicts: string[] = [];
  const now = new Date().toISOString();
  const backupStamp = now.replace(/[:.]/g, "-");

  if (ctx.action === "uninstall") {
    if (!previous) throw new Error("Cannot uninstall: no valid YAAW manifest");
    for (const [pathRel, record] of Object.entries(previous.managedFiles)) {
      if (pathRel === MANIFEST_RELATIVE_PATH || record.owner === "installer:backup") continue;
      await protectRemoval({ ctx, previous, pathRel, record, operations, conflicts, backupStamp });
    }
    for (const [pathRel, sections] of Object.entries(previous.managedSections)) {
      for (const [sectionId, record] of Object.entries(sections)) {
        await protectSectionRemoval({ ctx, previous, pathRel, sectionId, record, operations, conflicts, backupStamp });
      }
    }
    if (conflicts.length) throw new ManagedConflictError(conflicts);
    operations.push({ type: "remove-managed-file", path: join(ctx.projectRoot, MANIFEST_RELATIVE_PATH), owner: "installer" });
    operations.push({
      type: "write-managed-file",
      path: join(ctx.projectRoot, ".yaaw-core", "install", "uninstalled.json"),
      content: JSON.stringify({ schema:"yaaw.uninstalled/v1", version: previous.yaawVersion, uninstalledAt: now, projectMemory: ".yaaw-core/project" }, null, 2) + "\n",
      owner: "installer"
    });
    return {
      plan: { action: ctx.action, projectRoot: ctx.projectRoot, operations, selectedIntegrations: [], selectedSkills: [], warnings: ["Durable .yaaw-core/project data will be preserved."] },
      manifest: null
    };
  }

  const manifest = emptyManifest(ctx.packageVersion, previous?.installedAt ?? now);
  manifest.updatedAt = now;
  manifest.skills = [...ctx.selectedSkills];

  const coreRoot = join(ctx.payloadRoot, "yaaw-core");
  const coreFiles = await walk(coreRoot);
  const desiredFilePaths = new Set<string>();
  for (const source of coreFiles) {
    const coreRel = relative(coreRoot, source);
    const target = join(ctx.projectRoot, ".yaaw-core", coreRel);
    desiredFilePaths.add(rel(ctx.projectRoot, target));
    await chooseManagedFile({ ctx, previous, path: target, owner: "package:core", source, operations, records: manifest.managedFiles, conflicts, backupStamp });
  }

  operations.push(...await planProjectInitialization(ctx.payloadRoot, ctx.projectRoot));

  const skillMap = new Map((await canonicalSkills(ctx.payloadRoot)).map(x=>[x.id,x]));
  const selectedCanonical = ctx.selectedSkills.map(id => {
    const skill = skillMap.get(id);
    if (!skill) throw new Error(`Unknown canonical skill: ${id}`);
    return skill;
  });

  for (const integrationId of ctx.selectedIntegrations) {
    const adapter = getIntegration(integrationId);
    const ictx = { projectRoot: ctx.projectRoot, payloadRoot: ctx.payloadRoot };
    const adapterOps = [...await adapter.planSkills(ictx, selectedCanonical), ...await adapter.planBootstrap(ictx)];
    manifest.integrations[integrationId] = {
      adapterVersion: adapter.adapterVersion,
      skillsRoot: rel(ctx.projectRoot, adapter.skillsRoot(ctx.projectRoot)),
      bootstrap: adapter.bootstrapRelativePath
    };
    for (const op of adapterOps) {
      if (op.type === "copy-managed-file") {
        desiredFilePaths.add(rel(ctx.projectRoot, op.path));
        await chooseManagedFile({ ctx, previous, path: op.path, owner: op.owner, source: op.source, operations, records: manifest.managedFiles, conflicts, backupStamp });
      } else if (op.type === "write-managed-file") {
        desiredFilePaths.add(rel(ctx.projectRoot, op.path));
        await chooseManagedFile({ ctx, previous, path: op.path, owner: op.owner, content: op.content, operations, records: manifest.managedFiles, conflicts, backupStamp });
      } else if (op.type === "update-managed-section") {
        await chooseManagedSection({ ctx, previous, op, sectionRecords: manifest.managedSections, operations, conflicts, backupStamp });
      }
    }
  }

  if (previous) {
    for (const [pathRel, record] of Object.entries(previous.managedFiles)) {
      if (!desiredFilePaths.has(pathRel) && record.owner !== "installer:backup") {
        await protectRemoval({ ctx, previous, pathRel, record, operations, conflicts, backupStamp });
      }
    }
    for (const [pathRel, sections] of Object.entries(previous.managedSections)) {
      for (const [sectionId, record] of Object.entries(sections)) {
        if (!manifest.managedSections[pathRel]?.[sectionId]) {
          await protectSectionRemoval({ ctx, previous, pathRel, sectionId, record, operations, conflicts, backupStamp });
        }
      }
    }
  }

  if (conflicts.length) throw new ManagedConflictError(conflicts);
  return {
    plan: {
      action: ctx.action,
      projectRoot: ctx.projectRoot,
      operations,
      selectedIntegrations: [...ctx.selectedIntegrations],
      selectedSkills: [...ctx.selectedSkills],
      warnings
    },
    manifest
  };
}
