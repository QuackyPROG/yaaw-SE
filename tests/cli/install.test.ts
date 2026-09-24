import { access, mkdtemp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInstall } from "../../src/cli/commands/install.js";
import { runStatus } from "../../src/cli/commands/status.js";
import { runDoctor } from "../../src/cli/commands/doctor.js";

async function exists(path: string) {
  try { await access(path); return true; } catch { return false; }
}

describe("headless installation", () => {
  it("installs Codex without overwriting durable project memory and is idempotent", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-install-"));
    await writeFile(join(root, "AGENTS.md"), "User line A\nUser line B\n");

    await runInstall({ directory: root, tools: "codex", skills: "standard", yes: true });
    const product = join(root, ".yaaw-core", "project", "product.md");
    expect(await exists(product)).toBe(true);
    expect(await exists(join(root, ".agents", "skills", "yaaw-orchestrator", "SKILL.md"))).toBe(true);
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toContain("User line A\nUser line B");
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toContain("<!-- yaaw-se:begin -->");

    await writeFile(product, "durable sentinel\n");
    await runInstall({ directory: root, action: "quick-update", yes: true });
    expect(await readFile(product, "utf8")).toBe("durable sentinel\n");

    const status = await runStatus({ directory: root, json: true });
    const doctor = await runDoctor({ directory: root, json: true });
    expect(status.healthy).toBe(true);
    expect(doctor.healthy).toBe(true);
  });

  it("installs all Tier-1 providers together", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-multi-"));
    await runInstall({
      directory: root,
      tools: "codex,claude-code,gemini-cli,cline",
      skills: "core",
      yes: true
    });
    for (const path of [
      ".agents/skills/yaaw-orchestrator/SKILL.md",
      ".claude/skills/yaaw-orchestrator/SKILL.md",
      ".gemini/skills/yaaw-orchestrator/SKILL.md",
      ".cline/skills/yaaw-orchestrator/SKILL.md",
      ".cline/rules/yaaw-se.md"
    ]) expect(await exists(join(root, path))).toBe(true);
  });

  it("modifies provider selection without damaging another provider or user bootstrap text", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-modify-"));
    await writeFile(join(root, "CLAUDE.md"), "human clause\n");
    await runInstall({ directory: root, tools: "codex,claude-code", skills: "core", yes: true });
    await runInstall({ directory: root, action: "modify", tools: "codex", skills: "core", yes: true });

    expect(await exists(join(root, ".agents/skills/yaaw-orchestrator/SKILL.md"))).toBe(true);
    expect(await exists(join(root, ".claude/skills/yaaw-orchestrator/SKILL.md"))).toBe(false);
    expect(await readFile(join(root, "CLAUDE.md"), "utf8")).toBe("human clause\n");
  });

  it("protects modified managed files unless force-managed is explicit", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-conflict-"));
    await runInstall({ directory: root, tools: "codex", yes: true });
    const skill = join(root, ".agents", "skills", "yaaw-review", "SKILL.md");
    await writeFile(skill, "local override\n");
    await expect(runInstall({ directory: root, action: "quick-update", yes: true })).rejects.toThrow(/managed files require a choice/i);
    await runInstall({ directory: root, action: "quick-update", yes: true, forceManaged: true });
    expect(await readFile(skill, "utf8")).toContain("name: yaaw-review");
  });

  it("installed system integrity tool detects package drift", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-integrity-"));
    await runInstall({ directory: root, tools: "codex", yes: true });

    const tool = join(root, ".yaaw-core", "system", "tools", "framework-integrity.mjs");
    const healthy = spawnSync(process.execPath, [tool, "--workspace", root], { encoding: "utf8" });
    expect(healthy.status).toBe(0);
    const healthyReport = JSON.parse(healthy.stdout);
    expect(healthyReport.status).toBe("HEALTHY");
    expect(healthyReport.system_schema).toBeGreaterThanOrEqual(1);

    const lifecycle = join(root, ".yaaw-core", "system", "core", "lifecycle.md");
    await writeFile(lifecycle, (await readFile(lifecycle, "utf8")) + "\nincident self-edit\n");

    const drifted = spawnSync(process.execPath, [tool, "--workspace", root], { encoding: "utf8" });
    expect(drifted.status).toBe(2);
    const report = JSON.parse(drifted.stdout);
    expect(report.status).toBe("MODIFIED");
    expect(report.modified).toContain(".yaaw-core/system/core/lifecycle.md");
    expect(report.repair_required).toBe(true);
  });

  it("backup-replace repair restores system framework, preserves project memory, backs up tainted bytes, and invalidates runtime", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-repair-"));
    await runInstall({ directory: root, tools: "codex", yes: true });

    const product = join(root, ".yaaw-core", "project", "product.md");
    await writeFile(product, "durable repair sentinel\n");

    const lifecycle = join(root, ".yaaw-core", "system", "core", "lifecycle.md");
    const canonical = await readFile(lifecycle, "utf8");
    const tainted = canonical + "\nincident framework self-edit\n";
    await writeFile(lifecycle, tainted);

    const runtime = join(root, ".yaaw-core", "runtime");
    for (const name of ["observed-state.json", "handoff.json", "intent.json"]) {
      await writeFile(join(runtime, name), JSON.stringify({ stale: name }) + "\n");
    }

    const before: any = await runDoctor({ directory: root, json: true });
    expect(before.healthy).toBe(false);
    expect(before.frameworkIntegrity.status).toBe("MODIFIED");
    expect(before.frameworkIntegrity.modifiedPaths).toContain(".yaaw-core/system/core/lifecycle.md");

    await runInstall({
      directory: root,
      action: "repair",
      yes: true,
      conflictPolicy: "backup-replace"
    });

    expect(await readFile(lifecycle, "utf8")).toBe(canonical);
    expect(await readFile(product, "utf8")).toBe("durable repair sentinel\n");
    for (const name of ["observed-state.json", "handoff.json", "intent.json"]) {
      expect(await exists(join(runtime, name))).toBe(false);
    }

    const backupRoot = join(root, ".yaaw-core", "install", "backups");
    const stamps = await readdir(backupRoot);
    let foundBackup = false;
    for (const stamp of stamps) {
      const candidate = join(backupRoot, stamp, ".yaaw-core", "system", "core", "lifecycle.md");
      if (await exists(candidate)) {
        expect(await readFile(candidate, "utf8")).toBe(tainted);
        foundBackup = true;
      }
    }
    expect(foundBackup).toBe(true);

    const after: any = await runDoctor({ directory: root, json: true });
    expect(after.healthy).toBe(true);
    expect(after.frameworkIntegrity.status).toBe("HEALTHY");
  });

  it("safe uninstall preserves project memory and outside bootstrap bytes", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-uninstall-"));
    await writeFile(join(root, "AGENTS.md"), "keep me\n");
    await runInstall({ directory: root, tools: "codex", yes: true });
    const product = join(root, ".yaaw-core", "project", "product.md");
    await writeFile(product, "preserve me\n");

    await runInstall({ directory: root, action: "uninstall", yes: true });
    expect(await readFile(product, "utf8")).toBe("preserve me\n");
    expect(await exists(join(root, ".agents/skills/yaaw-orchestrator/SKILL.md"))).toBe(false);
    expect(await exists(join(root, ".agents"))).toBe(false);
    expect(await exists(join(root, ".yaaw-core", "system", "core"))).toBe(false);
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe("keep me\n");
    expect(await exists(join(root, ".yaaw-core/install/uninstalled.json"))).toBe(true);

    await runInstall({ directory: root, tools: "codex", yes: true });
    expect(await readFile(product, "utf8")).toBe("preserve me\n");
  });

  it("requires explicit tools for a fresh headless install", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-no-tools-"));
    await expect(runInstall({ directory: root, yes: true })).rejects.toThrow(/requires --tools/i);
  });

  it("dry-run performs no mutation", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-dry-"));
    await runInstall({ directory: root, tools: "codex", yes: true, dryRun: true });
    expect(await exists(join(root, ".yaaw-core"))).toBe(false);
    expect(await exists(join(root, ".agents"))).toBe(false);
  });

  it("doctor reports a corrupt manifest without crashing or rewriting it", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-corrupt-"));
    await mkdir(join(root, ".yaaw-core", "install"), { recursive: true });
    const manifest = join(root, ".yaaw-core", "install", "manifest.json");
    await writeFile(manifest, "{not-json\n");
    const report: any = await runDoctor({ directory: root, json: true });
    expect(report.installed).toBe(true);
    expect(report.manifestValid).toBe(false);
    expect(report.healthy).toBe(false);
    expect(await readFile(manifest, "utf8")).toBe("{not-json\n");
    await expect(runInstall({ directory: root, action: "repair", tools: "codex", yes: true })).rejects.toThrow(/Partial YAAW\/provider state|valid manifest/i);
  });

  it("blocks ambiguous legacy state instead of merging roots", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-legacy-"));
    await mkdir(join(root, ".yaaw"));
    await expect(runInstall({ directory: root, tools: "codex", yes: true })).rejects.toThrow(/Legacy .yaaw project state/);
  });

  it("upgrades a legacy v1 flat managed layout into system without touching project memory", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-v1-upgrade-"));
    await runInstall({ directory: root, tools: "codex", skills: "core", yes: true });

    const product = join(root, ".yaaw-core", "project", "product.md");
    await writeFile(product, "legacy durable sentinel\n");

    const systemDirs = ["core","roles","workflows","expertise","rules","registries","schemas","templates"];
    for (const name of systemDirs) {
      await rename(join(root, ".yaaw-core", "system", name), join(root, ".yaaw-core", name));
    }

    // Model the real pre-runtime Codex v1 install: it had no YAAW .codex surface.
    await rm(join(root, ".codex"), { recursive: true, force: true });

    const manifestPath = join(root, ".yaaw-core", "install", "manifest.json");
    const current: any = JSON.parse(await readFile(manifestPath, "utf8"));
    const legacyManaged: Record<string, any> = {};
    for (const [path, record] of Object.entries(current.managedFiles)) {
      if (path.startsWith(".codex/")) continue;
      const legacyPath = (record as any).owner === "package:system"
        ? path.replace(".yaaw-core/system/", ".yaaw-core/")
        : path;
      legacyManaged[legacyPath] = record;
    }
    const legacyIntegrations = structuredClone(current.integrations);
    legacyIntegrations.codex.adapterVersion = 1;
    delete legacyIntegrations.codex.runtime;
    delete legacyIntegrations.codex.configuration;
    const legacy: any = {
      ...current,
      integrations: legacyIntegrations,
      schema: "yaaw.installation/v1",
      installationSchema: 1,
      projectStateSchema: 1,
      managedFiles: legacyManaged
    };
    delete legacy.managedConfigKeys;
    delete legacy.systemSchema;
    delete legacy.projectSchema;
    await writeFile(manifestPath, JSON.stringify(legacy, null, 2) + "\n");

    await runInstall({ directory: root, action: "quick-update", yes: true });

    expect(await readFile(product, "utf8")).toBe("legacy durable sentinel\n");
    expect(await exists(join(root, ".yaaw-core", "system", "core"))).toBe(true);
    expect(await exists(join(root, ".yaaw-core", "core"))).toBe(false);
    const upgraded: any = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(upgraded.schema).toBe("yaaw.installation/v2");
    expect(upgraded.systemSchema).toBe(2);
    expect(upgraded.projectSchema).toBe(1);
    expect(upgraded.installationSchema).toBe(3);
  });

  it("blocks a package that cannot understand the installed project schema", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-project-schema-"));
    await runInstall({ directory: root, tools: "codex", yes: true });
    const product = join(root, ".yaaw-core", "project", "product.md");
    await writeFile(product, "schema sentinel\n");
    const manifestPath = join(root, ".yaaw-core", "install", "manifest.json");
    const manifest: any = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.projectSchema = 99;
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

    await expect(runInstall({ directory: root, action: "quick-update", yes: true }))
      .rejects.toThrow(/project schema 99.*newer/i);
    expect(await readFile(product, "utf8")).toBe("schema sentinel\n");
  });

  it("blocks adapter downgrades instead of silently rewriting newer provider state", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-adapter-schema-"));
    await runInstall({ directory: root, tools: "codex", yes: true });
    const manifestPath = join(root, ".yaaw-core", "install", "manifest.json");
    const manifest: any = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.integrations.codex.adapterVersion = 99;
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

    await expect(runInstall({ directory: root, action: "quick-update", yes: true }))
      .rejects.toThrow(/adapter v99.*newer/i);
  });
});
