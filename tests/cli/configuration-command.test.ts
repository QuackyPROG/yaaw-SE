import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInstall } from "../../src/cli/commands/install.js";
import { runConfig } from "../../src/cli/commands/config.js";
import { runStatus } from "../../src/cli/commands/status.js";
import { runDoctor } from "../../src/cli/commands/doctor.js";
import { readTomlManagedValue } from "../../src/installer/toml-managed.js";
import { CODEX_CONFIGURATION_REVISION } from "../../src/integrations/codex-catalog.js";

describe("yaaw config", () => {
  it("changes only the selected integration configuration surface", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-config-only-"));
    await runInstall({ directory: root, tools: "codex", skills: "core", yes: true });

    const corePath = join(root, ".yaaw-core/system/core/lifecycle.md");
    const skillPath = join(root, ".agents/skills/yaaw-orchestrator/SKILL.md");
    const coreBefore = await readFile(corePath, "utf8");
    const skillBefore = await readFile(skillPath, "utf8");

    const configPath = join(root, "codex-config.json");
    await writeFile(configPath, JSON.stringify({
      schema: "yaaw.codex-install/v1",
      runtime: "auto",
      orchestrator: { model: "gpt-6-sol", reasoning: "high" },
      defaultWorker: { model: "gpt-6-sol", reasoning: "medium" },
      roles: {
        prd: { model: "gpt-6-sol", reasoning: "medium" },
        planner: { model: "gpt-6-sol", reasoning: "high" },
        implementer: { model: "gpt-6-sol", reasoning: "medium" },
        reviewer: { model: "gpt-6-sol", reasoning: "high" }
      },
      maxConcurrentThreads: 4,
      sandboxMode: null,
      approvalPolicy: null,
      webSearch: null
    }));

    const result: any = await runConfig("codex", { directory: root, yes: true, config: configPath, conflictPolicy: "replace" });
    expect(result.ok).toBe(true);
    expect(await readFile(corePath, "utf8")).toBe(coreBefore);
    expect(await readFile(skillPath, "utf8")).toBe(skillBefore);

    const projectConfig = await readFile(join(root, ".codex/config.toml"), "utf8");
    expect(readTomlManagedValue(projectConfig, "model")).toBe("gpt-6-sol");
    const manifest: any = JSON.parse(await readFile(join(root, ".yaaw-core/install/manifest.json"), "utf8"));
    expect(manifest.integrations.codex.configuration.appliedRevision).toBe(CODEX_CONFIGURATION_REVISION);
    expect(manifest.integrations.codex.configuration.notifiedRevision).toBe(CODEX_CONFIGURATION_REVISION);
    expect(manifest.integrations.codex.configuration.profile.id).toBe("custom");
  });

  it("keeps pending configuration freshness advisory in status and doctor", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-config-status-"));
    await runInstall({ directory: root, tools: "codex", skills: "core", yes: true });
    const manifestPath = join(root, ".yaaw-core/install/manifest.json");
    const manifest: any = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.integrations.codex.configuration.appliedRevision = 1;
    manifest.integrations.codex.configuration.notifiedRevision = 2;
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

    const status: any = await runStatus({ directory: root, json: true });
    const doctor: any = await runDoctor({ directory: root, json: true });
    expect(status.healthy).toBe(true);
    expect(status.configuration.codex.updateAvailable).toBe(true);
    expect(doctor.healthy).toBe(true);
    expect(doctor.checks.find((check: any) => check.name === "configuration:codex")?.ok).toBe(true);
  });
});
