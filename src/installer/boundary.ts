import { lstat, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

async function exists(path: string): Promise<boolean> {
  try { await lstat(path); return true; } catch { return false; }
}

async function closestExisting(path: string): Promise<string> {
  let current = path;
  while (!(await exists(current))) {
    const parent = dirname(current);
    if (parent === current) throw new Error(`No existing parent for ${path}`);
    current = parent;
  }
  return current;
}

export function isWithin(root: string, target: string): boolean {
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export async function resolveProjectRoot(requested: string): Promise<string> {
  const absolute = resolve(requested);
  if (await exists(absolute)) {
    const info = await stat(absolute);
    if (!info.isDirectory()) throw new Error(`Project path is not a directory: ${absolute}`);
    return realpath(absolute);
  }
  const parent = await closestExisting(dirname(absolute));
  const parentReal = await realpath(parent);
  return resolve(parentReal, relative(parent, absolute));
}

export async function assertSafeDestination(projectRoot: string, destination: string): Promise<void> {
  const root = resolve(projectRoot);
  const target = resolve(destination);
  if (!isWithin(root, target)) {
    throw new Error(`Refusing write outside project root: ${target}`);
  }

  if (!(await exists(root))) {
    const rootParent = await realpath(await closestExisting(dirname(root)));
    const targetParent = await realpath(await closestExisting(dirname(target)));
    if (rootParent !== targetParent && !isWithin(rootParent, targetParent)) {
      throw new Error(`Destination parent escapes unresolved project boundary: ${target}`);
    }
    return;
  }

  const rootReal = await realpath(root);
  if (target === root || target === rootReal) return;

  const existingParent = await closestExisting(dirname(target));
  const parentReal = await realpath(existingParent);
  if (!isWithin(rootReal, parentReal)) {
    throw new Error(`Symlink/path escape outside project root: ${target}`);
  }

  if (await exists(target)) {
    const targetReal = await realpath(target);
    if (!isWithin(rootReal, targetReal)) {
      throw new Error(`Existing target resolves outside project root: ${target}`);
    }
  }
}

export async function assertRelativeManifestPath(projectRoot: string, relPath: string): Promise<string> {
  if (!relPath || isAbsolute(relPath) || relPath.split(/[\\/]+/).includes("..")) {
    throw new Error(`Unsafe manifest path: ${relPath}`);
  }
  const target = resolve(projectRoot, relPath);
  await assertSafeDestination(projectRoot, target);
  return target;
}
