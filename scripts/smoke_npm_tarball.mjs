#!/usr/bin/env node
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
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

const providerSurfaces = {
  codex: {
    providerRoot: ".agents",
    skillsRoot: ".agents/skills",
    bootstrap: "AGENTS.md"
  },
  "claude-code": {
    providerRoot: ".claude",
    skillsRoot: ".claude/skills",
    bootstrap: "CLAUDE.md"
  },
  "gemini-cli": {
    providerRoot: ".gemini",
    skillsRoot: ".gemini/skills",
    bootstrap: "GEMINI.md"
  },
  cline: {
    providerRoot: ".cline",
    skillsRoot: ".cline/skills",
    bootstrap: ".cline/rules/yaaw-se.md"
  }
};

const allProviderIds = Object.keys(providerSurfaces);
const expectedCoreEntries = [
  "install",
  "project",
  "runtime",
  "system"
].sort();
const expectedSystemEntries = [
  "core",
  "expertise",
  "registries",
  "roles",
  "rules",
  "schemas",
  "templates",
  "workflows"
].sort();
const expectedProjectEntries = [
  "engineering.md",
  "evidence",
  "product.md",
  "research",
  "reviews",
  "rules",
  "specs",
  "state.json",
  "tickets"
].sort();

async function assertExists(path, description) {
  if (!existsSync(path)) throw new Error(`Missing ${description}: ${path}`);
}

async function entries(path) {
  return (await readdir(path)).sort();
}

function firstSegment(path) {
  return path.split("/")[0];
}

function assertSameEntries(actual, expected, description) {
  const left = JSON.stringify([...actual].sort());
  const right = JSON.stringify([...expected].sort());
  if (left !== right) {
    throw new Error(`${description}: expected ${right}, got ${left}`);
  }
}

async function assertConsumerLayout(project, tools) {
  const manifest = JSON.parse(await readFile(join(project, ".yaaw-core", "install", "manifest.json"), "utf8"));
  assertSameEntries(Object.keys(manifest.integrations), tools, "manifest provider selection");
  if (!Array.isArray(manifest.skills) || manifest.skills.length === 0) {
    throw new Error("manifest must contain the selected public skills");
  }

  const expectedRoot = new Set([".yaaw-core"]);
  for (const id of tools) {
    const surface = providerSurfaces[id];
    expectedRoot.add(surface.providerRoot);
    if (id === "codex") expectedRoot.add(".codex");
    const bootstrapTop = firstSegment(surface.bootstrap);
    if (bootstrapTop !== surface.providerRoot) expectedRoot.add(bootstrapTop);
  }
  assertSameEntries(await entries(project), [...expectedRoot], "consumer project root");
  if (existsSync(join(project, ".yaaw"))) throw new Error("legacy .yaaw root leaked into consumer install");

  assertSameEntries(await entries(join(project, ".yaaw-core")), expectedCoreEntries, ".yaaw-core top-level");
  assertSameEntries(await entries(join(project, ".yaaw-core", "system")), expectedSystemEntries, ".yaaw-core/system");
  assertSameEntries(await entries(join(project, ".yaaw-core", "project")), expectedProjectEntries, ".yaaw-core/project");
  assertSameEntries(await entries(join(project, ".yaaw-core", "runtime")), [], ".yaaw-core/runtime");
  assertSameEntries(await entries(join(project, ".yaaw-core", "install")), ["manifest.json"], ".yaaw-core/install");

  const manifestOwners = [
    ...Object.values(manifest.managedFiles).map(record => record.owner),
    ...Object.values(manifest.managedSections).flatMap(sections =>
      Object.values(sections).map(record => record.owner)
    )
  ];

  for (const id of allProviderIds) {
    const surface = providerSurfaces[id];
    if (tools.includes(id)) {
      const expectedProviderEntries = id === "cline" ? ["rules", "skills"] : ["skills"];
      assertSameEntries(await entries(join(project, surface.providerRoot)), expectedProviderEntries, `${id} provider root`);
      assertSameEntries(await entries(join(project, surface.skillsRoot)), manifest.skills, `${id} public skills`);

      for (const skill of manifest.skills) {
        const skillDir = join(project, surface.skillsRoot, skill);
        assertSameEntries(await entries(skillDir), ["SKILL.md"], `${id}/${skill}`);
        const skillText = await readFile(join(skillDir, "SKILL.md"), "utf8");
        if (!skillText.includes(`\nname: ${skill}\n`)) {
          throw new Error(`${id}/${skill}: generated skill name is incorrect`);
        }
        if (!skillText.includes(".yaaw-core/")) {
          throw new Error(`${id}/${skill}: generated skill does not route to canonical .yaaw-core`);
        }
      }

      const bootstrapText = await readFile(join(project, surface.bootstrap), "utf8");
      if (!bootstrapText.includes(".yaaw-core/")) {
        throw new Error(`${id}: bootstrap does not route to canonical .yaaw-core`);
      }
      if (!manifestOwners.includes(`integration:${id}`)) {
        throw new Error(`${id}: manifest does not own the selected provider surface`);
      }
      if (id === "codex") {
        assertSameEntries(await entries(join(project, ".codex")), ["agents", "config.toml", "yaaw-runtime.md"], "codex runtime root");
        assertSameEntries(await entries(join(project, ".codex", "agents")), [
          "yaaw-implementer.toml",
          "yaaw-planner.toml",
          "yaaw-prd.toml",
          "yaaw-reviewer.toml"
        ], "codex role configs");
        if (existsSync(join(project, ".codex", "agents", "yaaw-orchestrator.toml"))) {
          throw new Error("Codex root Orchestrator must not have a child role config");
        }
        const runtime = await readFile(join(project, ".codex", "yaaw-runtime.md"), "utf8");
        if (!runtime.includes("Configured YAAW runtime mode: **auto**")) throw new Error("Codex runtime adapter missing auto default");
        const codexConfig = await readFile(join(project, ".codex", "config.toml"), "utf8");
        for (const role of ["yaaw_prd","yaaw_planner","yaaw_implementer","yaaw_reviewer"]) {
          if (!codexConfig.includes(`[agents.${role}]`)) throw new Error(`Codex config missing ${role}`);
        }
      }
    } else {
      if (existsSync(join(project, surface.providerRoot))) {
        throw new Error(`${id}: unselected provider directory leaked into install`);
      }
      if (firstSegment(surface.bootstrap) !== surface.providerRoot && existsSync(join(project, surface.bootstrap))) {
        throw new Error(`${id}: unselected provider bootstrap leaked into install`);
      }
      if (manifestOwners.includes(`integration:${id}`)) {
        throw new Error(`${id}: unselected provider leaked into manifest ownership`);
      }
      if (id === "codex" && existsSync(join(project, ".codex"))) {
        throw new Error("codex: unselected .codex runtime leaked into install");
      }
    }
  }
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
    await assertConsumerLayout(project, tools);

    const product = join(project, ".yaaw-core", "project", "product.md");
    await writeFile(product, `durable sentinel: ${name}\n`);

    execTarball(["install", "--directory", project, "--action", "quick-update", "--yes"]);
    const durable = await readFile(product, "utf8");
    if (durable !== `durable sentinel: ${name}\n`) {
      throw new Error(`${name}: quick update changed durable project memory`);
    }
    await assertConsumerLayout(project, tools);

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
    ".codex/config.toml",
    ".codex/yaaw-runtime.md",
    ".codex/agents/yaaw-planner.toml",
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
