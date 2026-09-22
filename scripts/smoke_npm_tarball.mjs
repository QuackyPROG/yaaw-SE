#!/usr/bin/env node
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));

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
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" }
  });
  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join("\n");
    const launch = result.error ? `\nLaunch error: ${result.error.message}` : "";
    throw new Error(`Command failed (${result.status}): npm ${args.join(" ")}\n${details}${launch}`);
  }
  return result.stdout ?? "";
}

const packRaw = run(["pack", "--json", "--ignore-scripts"], { capture: true });
const packInfo = JSON.parse(packRaw);
if (!Array.isArray(packInfo) || !packInfo[0]?.filename) {
  throw new Error(`Unexpected npm pack output: ${packRaw}`);
}
const tarball = join(root, packInfo[0].filename);

function execTarball(args, capture = false) {
  return run(["exec", "--yes", `--package=${tarball}`, "--", "yaaw-se", ...args], { capture });
}

async function assertExists(path, description) {
  if (!existsSync(path)) throw new Error(`Missing ${description}: ${path}`);
}

async function smokeCase(name, tools, expectedPaths, { pathWithSpaces = false, unicode = false } = {}) {
  const base = await mkdtemp(join(tmpdir(), `yaaw-tarball-${name}-`));
  const project = pathWithSpaces || unicode
    ? join(base, unicode ? "proyecto-测试" : "project with spaces")
    : base;
  if (project !== base) await mkdir(project);

  try {
    const bootstrap = tools.includes("codex") ? join(project, "AGENTS.md") : null;
    if (bootstrap) await writeFile(bootstrap, "consumer-owned line\n");

    execTarball(["install", "--directory", project, "--tools", tools.join(","), "--skills", "core", "--yes"]);

    await assertExists(join(project, ".yaaw-core", "project", "product.md"), "durable product artifact");
    await assertExists(join(project, ".yaaw-core", "project", "engineering.md"), "durable engineering artifact");
    await assertExists(join(project, ".yaaw-core", "install", "manifest.json"), "installation manifest");
    for (const rel of expectedPaths) await assertExists(join(project, rel), rel);

    const product = join(project, ".yaaw-core", "project", "product.md");
    await writeFile(product, `durable sentinel: ${name}\n`);

    execTarball(["install", "--directory", project, "--action", "quick-update", "--yes"]);
    const durable = await readFile(product, "utf8");
    if (durable !== `durable sentinel: ${name}\n`) {
      throw new Error(`${name}: quick update changed durable project memory`);
    }

    const status = JSON.parse(execTarball(["status", "--directory", project, "--json"], true));
    if (!status.installed || !status.healthy) {
      throw new Error(`${name}: unhealthy status: ${JSON.stringify(status)}`);
    }
    const doctor = JSON.parse(execTarball(["doctor", "--directory", project, "--json"], true));
    if (!doctor.healthy) {
      throw new Error(`${name}: doctor failed: ${JSON.stringify(doctor)}`);
    }

    if (bootstrap) {
      const text = await readFile(bootstrap, "utf8");
      if (!text.startsWith("consumer-owned line\n")) throw new Error(`${name}: bootstrap user content changed`);
    }

    console.log(`✓ tarball smoke: ${name}`);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
}

try {
  await smokeCase("codex", ["codex"], [
    ".agents/skills/yaaw-orchestrator/SKILL.md",
    "AGENTS.md"
  ], { pathWithSpaces: true });

  await smokeCase("claude", ["claude-code"], [
    ".claude/skills/yaaw-orchestrator/SKILL.md",
    "CLAUDE.md"
  ]);

  await smokeCase("gemini", ["gemini-cli"], [
    ".gemini/skills/yaaw-orchestrator/SKILL.md",
    "GEMINI.md"
  ], { unicode: true });

  await smokeCase("cline", ["cline"], [
    ".cline/skills/yaaw-orchestrator/SKILL.md",
    ".cline/rules/yaaw-se.md"
  ]);

  await smokeCase("all", ["codex", "claude-code", "gemini-cli", "cline"], [
    ".agents/skills/yaaw-orchestrator/SKILL.md",
    ".claude/skills/yaaw-orchestrator/SKILL.md",
    ".gemini/skills/yaaw-orchestrator/SKILL.md",
    ".cline/skills/yaaw-orchestrator/SKILL.md",
    ".cline/rules/yaaw-se.md"
  ]);

  console.log(`Exact tarball smoke passed: ${basename(tarball)}`);
} finally {
  await rm(tarball, { force: true });
}
