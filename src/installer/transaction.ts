import { lstat, mkdir, readFile, rename, rm, rmdir, stat, unlink } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { assertSafeDestination } from "./boundary.js";
import { atomicWrite } from "./filesystem.js";
import { removeManagedSection, renderManagedSection } from "./managed-sections.js";
import { removeTomlManagedKeys, updateTomlManagedKeys, validateManagedToml } from "./toml-managed.js";
import type { InstallPlan, InstallOperation } from "./types.js";

interface Backup { existed: boolean; bytes?: Buffer; }
interface ExecuteOptions {
  manifestPath?: string;
  manifestContent?: string;
  failAfterOperations?: number;
  beforeManifest?: () => Promise<void>;
}

async function exists(path: string): Promise<boolean> {
  try { await lstat(path); return true; } catch { return false; }
}

async function ensureDirectories(path: string, projectRoot: string, createdDirs: Set<string>) {
  const stack: string[] = [];
  let current = path;
  while (!(await exists(current))) {
    stack.push(current);
    const next = dirname(current);
    if (next === current) break;
    current = next;
  }
  for (const dir of stack.reverse()) {
    await assertSafeDestination(projectRoot, dir);
    await mkdir(dir);
    createdDirs.add(dir);
  }
}

async function capture(path: string, backups: Map<string, Backup>) {
  if (backups.has(path)) return;
  if (!(await exists(path))) {
    backups.set(path, { existed: false });
    return;
  }
  const info = await lstat(path);
  if (!info.isFile()) throw new Error(`Expected file but found non-file: ${path}`);
  backups.set(path, { existed: true, bytes: await readFile(path) });
}

async function sameFileContent(path: string, expected: Buffer | string): Promise<boolean> {
  if (!(await exists(path))) return false;
  const info = await lstat(path);
  if (!info.isFile()) return false;
  const current = await readFile(path);
  const desired = Buffer.isBuffer(expected) ? expected : Buffer.from(expected);
  return current.equals(desired);
}

export async function preflightPlan(plan: InstallPlan): Promise<void> {
  const durableRoot = resolve(plan.projectRoot, ".yaaw-core", "project");
  const destructiveOrManaged = new Set([
    "write-managed-file",
    "copy-managed-file",
    "update-managed-section",
    "update-managed-config-keys",
    "remove-managed-config-keys",
    "remove-managed-file",
    "remove-runtime-file",
    "remove-managed-section",
    "remove-empty-dir"
  ]);
  for (const op of plan.operations) {
    if ("path" in op) {
      await assertSafeDestination(plan.projectRoot, op.path);
      const candidate = resolve(op.path);
      if (destructiveOrManaged.has(op.type) && (candidate === durableRoot || candidate.startsWith(durableRoot + "/") || candidate.startsWith(durableRoot + "\\"))) {
        throw new Error(`Installer-managed operation cannot mutate durable project memory: ${op.type} ${op.path}`);
      }
    }
    if (op.type === "copy-managed-file") {
      const info = await stat(op.source);
      if (!info.isFile()) throw new Error(`Managed source is not a file: ${op.source}`);
    }
  }
}

export async function executePlan(plan: InstallPlan, options: ExecuteOptions = {}): Promise<string[]> {
  await preflightPlan(plan);
  if (plan.operations.length === 0 && !options.manifestPath) return [];

  const backups = new Map<string, Backup>();
  const createdDirs = new Set<string>();
  const removedDirs = new Set<string>();
  const changed: string[] = [];
  let count = 0;

  const mutateFile = async (path: string, writer: () => Promise<void>) => {
    await assertSafeDestination(plan.projectRoot, path);
    await ensureDirectories(dirname(path), plan.projectRoot, createdDirs);
    await capture(path, backups);
    await writer();
    changed.push(relative(plan.projectRoot, path).replaceAll("\\", "/"));
  };

  try {
    for (const op of plan.operations) {
      if (op.type === "preserve") continue;
      if (op.type === "mkdir") {
        if (!(await exists(op.path))) {
          await ensureDirectories(op.path, plan.projectRoot, createdDirs);
          changed.push(relative(plan.projectRoot, op.path).replaceAll("\\", "/") + "/");
        }
      } else if (op.type === "write-project-file-if-missing") {
        if (!(await exists(op.path))) {
          await mutateFile(op.path, async () => atomicWrite(op.path, op.content));
        }
      } else if (op.type === "migrate-project-file") {
        if (!(await sameFileContent(op.path, op.content))) {
          await mutateFile(op.path, async () => atomicWrite(op.path, op.content));
        }
      } else if (op.type === "write-managed-file") {
        if (!(await sameFileContent(op.path, op.content))) {
          await mutateFile(op.path, async () => atomicWrite(op.path, op.content));
        }
      } else if (op.type === "copy-managed-file") {
        const bytes = await readFile(op.source);
        if (!(await sameFileContent(op.path, bytes))) {
          await mutateFile(op.path, async () => atomicWrite(op.path, bytes));
        }
      } else if (op.type === "update-managed-section") {
        const original = (await exists(op.path)) ? await readFile(op.path, "utf8") : "";
        const updated = renderManagedSection(original, op.sectionId, op.content);
        if (updated !== original) await mutateFile(op.path, async () => atomicWrite(op.path, updated));
      } else if (op.type === "update-managed-config-keys") {
        const original = (await exists(op.path)) ? await readFile(op.path, "utf8") : "";
        validateManagedToml(original);
        const updated = updateTomlManagedKeys(original, op.entries);
        validateManagedToml(updated);
        if (updated !== original) await mutateFile(op.path, async () => atomicWrite(op.path, updated));
      } else if (op.type === "remove-managed-config-keys") {
        if (await exists(op.path)) {
          const original = await readFile(op.path, "utf8");
          validateManagedToml(original);
          const updated = removeTomlManagedKeys(original, op.keys);
          validateManagedToml(updated);
          if (updated !== original) await mutateFile(op.path, async () => {
            if (updated.trim().length === 0) await unlink(op.path);
            else await atomicWrite(op.path, updated);
          });
        }
      } else if (op.type === "remove-managed-section") {
        if (await exists(op.path)) {
          const original = await readFile(op.path, "utf8");
          const updated = removeManagedSection(original, op.sectionId);
          if (updated !== original) await mutateFile(op.path, async () => {
            if (updated.length === 0) await unlink(op.path);
            else await atomicWrite(op.path, updated);
          });
        }
      } else if (op.type === "remove-managed-file" || op.type === "remove-runtime-file") {
        if (await exists(op.path)) {
          await mutateFile(op.path, async () => unlink(op.path));
        }
      } else if (op.type === "remove-empty-dir") {
        if (await exists(op.path)) {
          try {
            await rmdir(op.path);
            removedDirs.add(op.path);
            changed.push(relative(plan.projectRoot, op.path).replaceAll("\\", "/") + "/");
          } catch (error: any) {
            if (!["ENOTEMPTY", "ENOENT"].includes(error?.code)) throw error;
          }
        }
      }

      count += 1;
      if (options.failAfterOperations && count >= options.failAfterOperations) {
        throw new Error("Simulated installer transaction failure");
      }
    }

    if (options.beforeManifest) await options.beforeManifest();

    if (options.manifestPath && options.manifestContent !== undefined) {
      if (!(await sameFileContent(options.manifestPath, options.manifestContent))) {
        await mutateFile(options.manifestPath, async () => atomicWrite(options.manifestPath!, options.manifestContent!));
      }
    }
    return changed;
  } catch (error) {
    const restore = [...backups.entries()].reverse();
    for (const [path, backup] of restore) {
      try {
        if (backup.existed) await atomicWrite(path, backup.bytes!);
        else await rm(path, { force: true });
      } catch {}
    }
    const removed = [...removedDirs].sort((a,b)=>a.length-b.length);
    for (const dir of removed) {
      try { await mkdir(dir, { recursive: true }); } catch {}
    }
    const dirs = [...createdDirs].sort((a,b)=>b.length-a.length);
    for (const dir of dirs) {
      try { await rmdir(dir); } catch {}
    }
    throw error;
  }
}
