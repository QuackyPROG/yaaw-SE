import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
    expect(await exists(join(root, ".yaaw-core", "core"))).toBe(false);
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

  it("quick-update migrates manifest-owned legacy system layout to canonical root", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-system-migrate-"));
    await runInstall({ directory: root, tools: "codex", yes: true });

    const manifestPath = join(root, ".yaaw-core", "install", "manifest.json");
    const manifest: any = JSON.parse(await readFile(manifestPath, "utf8"));
    const canonicalRel = ".yaaw-core/core/lifecycle.md";
    const legacyRel = ".yaaw-core/system/core/lifecycle.md";
    const canonicalPath = join(root, canonicalRel);
    const lifecycle = await readFile(canonicalPath);

    await mkdir(join(root, ".yaaw-core", "system", "core"), { recursive: true });
    await writeFile(join(root, legacyRel), lifecycle);
    await rm(canonicalPath);
    manifest.managedFiles[legacyRel] = manifest.managedFiles[canonicalRel];
    delete manifest.managedFiles[canonicalRel];
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

    const product = join(root, ".yaaw-core", "project", "product.md");
    await writeFile(product, "migration sentinel\n");

    await runInstall({ directory: root, action: "quick-update", yes: true });

    expect(await exists(canonicalPath)).toBe(true);
    expect(await exists(join(root, ".yaaw-core", "system"))).toBe(false);
    expect(await readFile(product, "utf8")).toBe("migration sentinel\n");
  });

  it("doctor rejects a parallel legacy .yaaw-core/system layout", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-system-layout-"));
    await runInstall({ directory: root, tools: "codex", yes: true });
    await mkdir(join(root, ".yaaw-core", "system", "core"), { recursive: true });
    await writeFile(join(root, ".yaaw-core", "system", "core", "legacy.md"), "legacy framework\n");

    const report: any = await runDoctor({ directory: root, json: true });
    const check = report.checks.find((entry: any) => entry.name === "framework-layout");
    expect(report.healthy).toBe(false);
    expect(check?.ok).toBe(false);
    expect(check?.detail).toMatch(/canonical execution is ambiguous/i);

    expect(await readFile(join(root, ".yaaw-core", "system", "core", "legacy.md"), "utf8")).toBe("legacy framework\n");
  });

  it("blocks ambiguous legacy state instead of merging roots", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-legacy-"));
    await mkdir(join(root, ".yaaw"));
    await expect(runInstall({ directory: root, tools: "codex", yes: true })).rejects.toThrow(/Legacy .yaaw project state/);
  });
});
