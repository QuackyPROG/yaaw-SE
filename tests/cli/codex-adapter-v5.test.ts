import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInstall } from "../../src/cli/commands/install.js";
import { codexAdapter } from "../../src/integrations/codex.js";
import { CODEX_CONFIGURATION_REVISION } from "../../src/integrations/codex-catalog.js";

describe("Codex adapter v5 fidelity mechanics", () => {
  it("generates effective authority metadata and detects managed profile drift", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-codex-v5-drift-"));
    const configPath = join(root, "codex-install.json");
    await writeFile(configPath, JSON.stringify({
      schema: "yaaw.codex-install/v1",
      mode: "auto",
      orchestrator: { model: "root-model", reasoning: "high" },
      defaultWorker: { model: "worker-model", reasoning: "medium" },
      roles: {
        prd: { model: null, reasoning: null },
        planner: { model: "planner-model", reasoning: "high" },
        implementer: { model: null, reasoning: "high" },
        reviewer: { model: "review-model", reasoning: "max" }
      },
      failureFallback: {
        afterFailures: 3,
        implementer: { model: "fallback-model", reasoning: "high" },
        reviewer: { model: "fallback-model", reasoning: "max" }
      }
    }, null, 2));

    await runInstall({ directory: root, tools: "codex", skills: "core", yes: true, codexConfig: configPath });
    const runtime = await readFile(join(root, ".codex/yaaw-runtime.md"), "utf8");
    expect(runtime).toContain("## Configured authority execution profiles");
    expect(runtime).toContain("Planner\n  named worker: yaaw_planner\n  model: planner-model\n  reasoning: high");
    expect(runtime).toContain("Implementer\n  named worker: yaaw_implementer\n  model: worker-model\n  reasoning: high");
    expect(runtime).toContain("Capability fallback:");
    expect(runtime).toContain("model: fallback-model");
    expect(runtime).toContain("BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE");

    const manifest: any = JSON.parse(await readFile(join(root, ".yaaw-core/install/manifest.json"), "utf8"));
    const healthy = await codexAdapter.verifyRuntime!({ projectRoot: root, payloadRoot: root, settings: manifest.integrations.codex.configuration.settings });
    expect(healthy).toEqual({ healthy: true, issues: [] });

    const reviewerPath = join(root, ".codex/agents/yaaw-reviewer.toml");
    const reviewer = await readFile(reviewerPath, "utf8");
    await writeFile(reviewerPath, reviewer.replace('model = "review-model"', 'model = "wrong-model"'));
    const drifted = await codexAdapter.verifyRuntime!({ projectRoot: root, payloadRoot: root, settings: manifest.integrations.codex.configuration.settings });
    expect(drifted.healthy).toBe(false);
    expect(drifted.issues).toContain("mismatched Codex role model: reviewer");
  });

  it("detects YAAW-owned default-worker config drift", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-codex-v5-default-drift-"));
    const configPath = join(root, "codex-install.json");
    await writeFile(configPath, JSON.stringify({
      schema: "yaaw.codex-install/v1",
      defaultWorker: { model: "worker-model", reasoning: "medium" }
    }));
    await runInstall({ directory: root, tools: "codex", skills: "core", yes: true, codexConfig: configPath });
    const manifest: any = JSON.parse(await readFile(join(root, ".yaaw-core/install/manifest.json"), "utf8"));
    const configFile = join(root, ".codex/config.toml");
    const text = await readFile(configFile, "utf8");
    await writeFile(configFile, text.replace('default_subagent_model = "worker-model"', 'default_subagent_model = "drifted-model"'));
    const result = await codexAdapter.verifyRuntime!({ projectRoot: root, payloadRoot: root, settings: manifest.integrations.codex.configuration.settings });
    expect(result.healthy).toBe(false);
    expect(result.issues).toContain("missing/mismatched Codex default worker model");
  });

  it("quick-update changes adapter v4 to v5 without reconfiguring revision-4 settings", async () => {
    expect(CODEX_CONFIGURATION_REVISION).toBe(4);
    const root = await mkdtemp(join(tmpdir(), "yaaw-codex-v5-update-"));
    const configPath = join(root, "codex-install.json");
    await writeFile(configPath, JSON.stringify({
      schema: "yaaw.codex-install/v1",
      mode: "auto",
      orchestrator: { model: "gpt-6-luna", reasoning: "low" },
      defaultWorker: { model: "gpt-6-luna", reasoning: "medium" },
      roles: {
        prd: { model: "gpt-6-luna", reasoning: "low" },
        planner: { model: "gpt-6-sol", reasoning: "max" },
        implementer: { model: "gpt-6-luna", reasoning: "high" },
        reviewer: { model: "gpt-6-sol", reasoning: "xhigh" }
      },
      failureFallback: { afterFailures: null, implementer: { model: null, reasoning: null }, reviewer: { model: null, reasoning: null } },
      serviceTier: "flex"
    }, null, 2));
    await runInstall({ directory: root, tools: "codex", skills: "core", yes: true, codexConfig: configPath });

    const manifestPath = join(root, ".yaaw-core/install/manifest.json");
    const before: any = JSON.parse(await readFile(manifestPath, "utf8"));
    before.integrations.codex.adapterVersion = 4;
    const preservedConfiguration = structuredClone(before.integrations.codex.configuration);
    const preservedRuntime = structuredClone(before.integrations.codex.runtime);
    await writeFile(manifestPath, JSON.stringify(before, null, 2) + "\n");

    await runInstall({ directory: root, action: "quick-update", yes: true });
    const after: any = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(after.integrations.codex.adapterVersion).toBe(5);
    expect(after.integrations.codex.configuration).toEqual(preservedConfiguration);
    expect(after.integrations.codex.runtime).toEqual(preservedRuntime);
    expect(after.integrations.codex.configuration.settings.failureFallback.afterFailures).toBeNull();
    expect(after.integrations.codex.configuration.settings.serviceTier).toBe("flex");
  });
});
