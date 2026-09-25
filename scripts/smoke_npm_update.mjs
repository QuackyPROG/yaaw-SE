#!/usr/bin/env node
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const packagePath = join(root, "package.json");
const coreSourcePath = join(root, ".yaaw-core", "system", "core", "artifact-model.md");
const npmCliCandidates = [
  process.env.npm_execpath,
  join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
  join(dirname(process.execPath), "..", "lib", "node_modules", "npm", "bin", "npm-cli.js")
].filter(Boolean);
const npmCli = npmCliCandidates.find(candidate => existsSync(candidate));
if (!npmCli) throw new Error(`Could not locate npm CLI beside Node: ${process.execPath}`);

function run(args, options = {}) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", YAAW_DISABLE_AUTO_UPDATE: "1" }
  });
  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join("\n");
    const launch = result.error ? `\nLaunch error: ${result.error.message}` : "";
    throw new Error(`Command failed (${result.status}): npm ${args.join(" ")}\n${details}${launch}`);
  }
  return result.stdout ?? "";
}

function packCurrent() {
  const raw = run(["pack", "--json", "--ignore-scripts"], { capture: true });
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed[0]?.filename) throw new Error(`Unexpected npm pack output: ${raw}`);
  return join(root, parsed[0].filename);
}

function execTarball(tarball, args, capture = false) {
  return run(["exec", "--yes", `--package=${tarball}`, "--", "yaaw-se", ...args], { capture });
}

const originalPackage = await readFile(packagePath, "utf8");
const originalCore = await readFile(coreSourcePath, "utf8");
const temp = await mkdtemp(join(tmpdir(), "yaaw-update-smoke-"));
const project = join(temp, "consumer-project");
await mkdir(project);
const tarballs = [];

try {
  const pkg = JSON.parse(originalPackage);
  const currentVersion = pkg.version;
  const oldVersion = `${currentVersion}-update-smoke.0`;

  pkg.version = oldVersion;
  await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n");
  run(["run", "build"]);
  const oldTarball = packCurrent();
  tarballs.push(oldTarball);

  execTarball(oldTarball, ["install", "--directory", project, "--tools", "codex", "--skills", "core", "--yes"]);

  // Convert the first install into the actual pre-feature Codex baseline:
  // adapter v1, no YAAW-owned .codex runtime surface, existing durable project memory intact.
  await rm(join(project, ".codex"), { recursive: true, force: true });
  const legacyManifestPath = join(project, ".yaaw-core", "install", "manifest.json");
  const legacyManifest = JSON.parse(await readFile(legacyManifestPath, "utf8"));
  legacyManifest.integrations.codex.adapterVersion = 1;
  delete legacyManifest.integrations.codex.runtime;
  delete legacyManifest.integrations.codex.configuration;
  legacyManifest.managedFiles = Object.fromEntries(
    Object.entries(legacyManifest.managedFiles).filter(([rel]) => !rel.startsWith(".codex/"))
  );
  delete legacyManifest.managedConfigKeys;
  await writeFile(legacyManifestPath, JSON.stringify(legacyManifest, null, 2) + "\n");

  const durableFiles = {
    "product.md": "product sentinel\n",
    "engineering.md": "engineering sentinel\n",
    "research/RSH-001.md": "research sentinel\n",
    "state.json": "{\"sentinel\":\"state\"}\n",
    "specs/SPEC-001.md": "spec sentinel\n",
    "tickets/TASK-001.md": "ticket sentinel\n",
    "reviews/TASK-001-R1.md": "review sentinel\n",
    "evidence/test.json": "{\"sentinel\":\"evidence\"}\n",
    "rules/custom.md": "rule sentinel\n"
  };
  for (const [rel, bytes] of Object.entries(durableFiles)) {
    const path = join(project, ".yaaw-core", "project", rel);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }

  const lifecyclePath = join(project, ".yaaw-core", "system", "core", "lifecycle.md");
  const canonicalLifecycle = await readFile(lifecyclePath, "utf8");
  const taintedLifecycle = canonicalLifecycle + "\nincident framework self-edit\n";
  await writeFile(lifecyclePath, taintedLifecycle);
  const runtimeRoot = join(project, ".yaaw-core", "runtime");
  for (const name of ["observed-state.json", "handoff.json", "intent.json"]) {
    await writeFile(join(runtimeRoot, name), JSON.stringify({ stale: name }) + "\n");
  }

  await writeFile(packagePath, originalPackage);
  const marker = `\n<!-- synthetic-package-update-${currentVersion} -->\n`;
  await writeFile(coreSourcePath, originalCore + marker);

  run(["run", "build"]);
  const currentTarball = packCurrent();
  tarballs.push(currentTarball);

  execTarball(currentTarball, ["install", "--directory", project, "--action", "repair", "--conflict-policy", "backup-replace", "--yes"]);

  for (const [rel, expected] of Object.entries(durableFiles)) {
    const actual = await readFile(join(project, ".yaaw-core", "project", rel), "utf8");
    if (actual !== expected) throw new Error(`Durable artifact changed during tarball update: ${rel}`);
  }

  const repairedLifecycle = await readFile(lifecyclePath, "utf8");
  if (repairedLifecycle !== canonicalLifecycle) {
    throw new Error("Tainted package-managed lifecycle file was not restored by backup-replace repair");
  }
  for (const name of ["observed-state.json", "handoff.json", "intent.json"]) {
    if (existsSync(join(runtimeRoot, name))) throw new Error(`Runtime cache survived package repair: ${name}`);
  }
  const backupRoot = join(project, ".yaaw-core", "install", "backups");
  const stamps = await readdir(backupRoot);
  let taintedBackupFound = false;
  for (const stamp of stamps) {
    const candidate = join(backupRoot, stamp, ".yaaw-core", "system", "core", "lifecycle.md");
    if (existsSync(candidate) && await readFile(candidate, "utf8") === taintedLifecycle) taintedBackupFound = true;
  }
  if (!taintedBackupFound) throw new Error("backup-replace did not preserve the tainted framework bytes");

  const installedCore = await readFile(join(project, ".yaaw-core", "system", "core", "artifact-model.md"), "utf8");
  if (!installedCore.includes(`synthetic-package-update-${currentVersion}`)) {
    throw new Error(`Package-managed core did not update from the ${currentVersion} tarball`);
  }
  const manifest = JSON.parse(await readFile(join(project, ".yaaw-core", "install", "manifest.json"), "utf8"));
  if (manifest.yaawVersion !== currentVersion) {
    throw new Error(`Expected manifest ${currentVersion}, got ${manifest.yaawVersion}`);
  }
  if (manifest.integrations?.codex?.adapterVersion !== 3) {
    throw new Error(`Expected Codex adapter v3 after migration, got ${manifest.integrations?.codex?.adapterVersion}`);
  }
  if (manifest.integrations?.codex?.runtime?.mode !== "auto") {
    throw new Error("Legacy Codex migration did not default to auto runtime");
  }
  if (!existsSync(join(project, ".codex", "yaaw-runtime.md")) ||
      !existsSync(join(project, ".codex", "agents", "yaaw-reviewer.toml")) ||
      !existsSync(join(project, ".codex", "config.toml"))) {
    throw new Error("Legacy Codex migration did not install the v2 runtime surface");
  }

  const doctor = JSON.parse(execTarball(currentTarball, ["doctor", "--directory", project, "--json"], true));
  if (!doctor.healthy) throw new Error(`Doctor failed after tarball update: ${JSON.stringify(doctor)}`);

  console.log(`✓ tarball repair ${oldVersion} -> ${currentVersion} restored tainted framework, migrated Codex v1 -> v3, invalidated runtime, and preserved durable state`);
} finally {
  await writeFile(packagePath, originalPackage);
  await writeFile(coreSourcePath, originalCore);
  for (const tarball of tarballs) await rm(tarball, { force: true });
  await rm(temp, { recursive: true, force: true });
  try { run(["run", "build"]); } catch {}
}
