#!/usr/bin/env node
import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
}

function within(root, target) {
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function normalizeRel(value) {
  return String(value).replaceAll("\\", "/");
}

function isFrameworkManaged(rel, record) {
  const path = normalizeRel(rel);
  if (record?.owner === "package:core") return true;
  if (!path.startsWith(".yaaw-core/")) return false;
  return !(
    path.startsWith(".yaaw-core/project/") ||
    path.startsWith(".yaaw-core/runtime/") ||
    path.startsWith(".yaaw-core/install/")
  );
}

async function safeFile(root, rel) {
  const normalized = normalizeRel(rel);
  if (!normalized || isAbsolute(normalized) || normalized.split("/").includes("..")) {
    throw new Error(`unsafe manifest path: ${rel}`);
  }
  const target = resolve(root, normalized);
  if (!within(root, target)) throw new Error(`manifest path escapes workspace: ${rel}`);
  const info = await lstat(target);
  if (info.isSymbolicLink()) throw new Error(`managed framework path is a symlink: ${rel}`);
  if (!info.isFile()) throw new Error(`managed framework path is not a file: ${rel}`);
  return target;
}

function workspaceArg(argv) {
  const index = argv.indexOf("--workspace");
  if (index >= 0 && argv[index + 1]) return argv[index + 1];
  return process.cwd();
}

async function inspect(workspace) {
  const root = resolve(workspace);
  const manifestPath = join(root, ".yaaw-core", "install", "manifest.json");
  let manifestBytes;
  let manifest;
  try {
    manifestBytes = await readFile(manifestPath);
    manifest = JSON.parse(manifestBytes.toString("utf8"));
  } catch (error) {
    return {
      schema: "yaaw.framework-integrity/v1",
      status: "MANIFEST_INVALID",
      package_version: null,
      manifest_digest: null,
      modified: [],
      missing: [],
      local_overrides: [],
      unsafe: [String(error?.message ?? error)],
      legacy_paths: [],
      repair_required: true
    };
  }

  if (
    manifest?.schema !== "yaaw.installation/v1" ||
    manifest?.project?.root !== "." ||
    !manifest?.managedFiles ||
    typeof manifest.managedFiles !== "object"
  ) {
    return {
      schema: "yaaw.framework-integrity/v1",
      status: "MANIFEST_INVALID",
      package_version: manifest?.yaawVersion ?? null,
      manifest_digest: `sha256:${digest(manifestBytes)}`,
      modified: [],
      missing: [],
      local_overrides: [],
      unsafe: ["unsupported or incomplete installation manifest"],
      legacy_paths: [],
      repair_required: true
    };
  }

  const modified = [];
  const missing = [];
  const localOverrides = [];
  const unsafe = [];

  for (const [rel, record] of Object.entries(manifest.managedFiles)) {
    if (!isFrameworkManaged(rel, record)) continue;
    const normalized = normalizeRel(rel);
    if (record?.localOverride === true) localOverrides.push(normalized);
    const target = resolve(root, normalized);
    if (!(await exists(target))) {
      missing.push(normalized);
      continue;
    }
    try {
      const safe = await safeFile(root, normalized);
      const actual = digest(await readFile(safe));
      if (actual !== record.sha256) modified.push(normalized);
    } catch (error) {
      unsafe.push(`${normalized}: ${String(error?.message ?? error)}`);
    }
  }

  const legacyPaths = [];
  for (const rel of [".yaaw-core/system"]) {
    if (await exists(join(root, rel))) legacyPaths.push(rel);
  }

  let status = "HEALTHY";
  if (unsafe.length) status = "MANIFEST_INVALID";
  else if (legacyPaths.length) status = "LEGACY_LAYOUT";
  else if (missing.length) status = "MISSING";
  else if (modified.length) status = "MODIFIED";
  else if (localOverrides.length) status = "LOCAL_OVERRIDE";

  return {
    schema: "yaaw.framework-integrity/v1",
    status,
    package_version: manifest.yaawVersion ?? null,
    manifest_digest: `sha256:${digest(manifestBytes)}`,
    modified,
    missing,
    local_overrides: localOverrides,
    unsafe,
    legacy_paths: legacyPaths,
    repair_required: status !== "HEALTHY"
  };
}

try {
  const result = await inspect(workspaceArg(process.argv.slice(2)));
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exitCode = result.status === "HEALTHY" ? 0 : 2;
} catch (error) {
  process.stdout.write(JSON.stringify({
    schema: "yaaw.framework-integrity/v1",
    status: "UNKNOWN",
    package_version: null,
    manifest_digest: null,
    modified: [],
    missing: [],
    local_overrides: [],
    unsafe: [String(error?.message ?? error)],
    legacy_paths: [],
    repair_required: true
  }, null, 2) + "\n");
  process.exitCode = 2;
}
