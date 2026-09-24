import { access, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInstall } from "../../src/cli/commands/install.js";
import { readTomlManagedValue } from "../../src/installer/toml-managed.js";
import { CODEX_CONFIGURATION_REVISION } from "../../src/integrations/codex-catalog.js";

async function exists(path: string) {
  try { await access(path); return true; } catch { return false; }
}

describe("Codex runtime adapter v3", () => {
  it("installs the fresh isolated-worker surface with auto + inherit defaults", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-codex-v2-"));
    await runInstall({ directory: root, tools: "codex", skills: "core", yes: true });

    for (const rel of [
      ".codex/config.toml",
      ".codex/yaaw-runtime.md",
      ".codex/agents/yaaw-prd.toml",
      ".codex/agents/yaaw-planner.toml",
      ".codex/agents/yaaw-implementer.toml",
      ".codex/agents/yaaw-reviewer.toml"
    ]) expect(await exists(join(root, rel))).toBe(true);
    expect(await exists(join(root, ".codex/agents/yaaw-orchestrator.toml"))).toBe(false);

    const config = await readFile(join(root, ".codex/config.toml"), "utf8");
    expect(readTomlManagedValue(config, "agents.yaaw_planner.config_file")).toBe("agents/yaaw-planner.toml");
    expect(readTomlManagedValue(config, "model")).toBeUndefined();

    const manifest: any = JSON.parse(await readFile(join(root, ".yaaw-core/install/manifest.json"), "utf8"));
    expect(manifest.integrations.codex.adapterVersion).toBe(3);
    expect(manifest.integrations.codex.runtime.mode).toBe("auto");
    expect(manifest.integrations.codex.runtime.orchestrator.model).toBeNull();
    expect(manifest.integrations.codex.configuration.schema).toBe("yaaw.integration-config/v1");
    expect(manifest.integrations.codex.configuration.appliedRevision).toBe(CODEX_CONFIGURATION_REVISION);
    expect(manifest.integrations.codex.configuration.notifiedRevision).toBe(CODEX_CONFIGURATION_REVISION);
    expect(Object.keys(manifest.managedConfigKeys[".codex/config.toml"])).toHaveLength(8);
  });

  it("preserves existing user Codex model, MCP config, comments, and custom role", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-codex-preserve-"));
    await mkdir(join(root, ".codex"), { recursive: true });
    const original = [
      '# keep this comment',
      'model = "my-model"',
      '',
      '[mcp_servers.foo]',
      'command = "foo"',
      '',
      '[agents.custom_reviewer]',
      'description = "mine"',
      ''
    ].join("\n");
    await writeFile(join(root, ".codex/config.toml"), original);

    await runInstall({ directory: root, tools: "codex", yes: true });
    const output = await readFile(join(root, ".codex/config.toml"), "utf8");
    expect(output).toContain('# keep this comment\nmodel = "my-model"');
    expect(output).toContain('[mcp_servers.foo]\ncommand = "foo"');
    expect(output).toContain('[agents.custom_reviewer]\ndescription = "mine"');
    expect(output).toContain("[agents.yaaw_planner]");
  });

  it("treats a pre-existing YAAW-namespaced Codex role as an ownership conflict", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-codex-conflict-"));
    await mkdir(join(root, ".codex"), { recursive: true });
    await writeFile(join(root, ".codex/config.toml"), '[agents.yaaw_planner]\ndescription = "mine"\n');
    await expect(runInstall({ directory: root, tools: "codex", yes: true })).rejects.toThrow(/yaaw_planner/);
  });

  it("supports strict isolation and per-role settings through yaaw.codex-install/v1", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-codex-strict-"));
    const configPath = join(root, "codex-install.json");
    await writeFile(configPath, JSON.stringify({
      schema: "yaaw.codex-install/v1",
      runtime: "isolated-required",
      orchestrator: { model: null, reasoning: "high" },
      defaultWorker: { model: null, reasoning: "medium" },
      roles: {
        prd: { model: null, reasoning: "high" },
        planner: { model: "planner-model", reasoning: "high" },
        implementer: { model: null, reasoning: "medium" },
        reviewer: { model: "review-model", reasoning: "high" }
      },
      maxConcurrentThreads: 4,
      sandboxMode: null,
      approvalPolicy: null,
      webSearch: null
    }, null, 2));

    await runInstall({ directory: root, tools: "codex", yes: true, codexConfig: configPath });
    const runtime = await readFile(join(root, ".codex/yaaw-runtime.md"), "utf8");
    expect(runtime).toContain("isolated-required");
    expect(runtime).toContain("BLOCKED:HOST_ISOLATION_UNAVAILABLE");
    expect(await readFile(join(root, ".codex/agents/yaaw-planner.toml"), "utf8")).toContain('model = "planner-model"');
    expect(await readFile(join(root, ".codex/agents/yaaw-reviewer.toml"), "utf8")).toContain('model = "review-model"');
    const projectConfig = await readFile(join(root, ".codex/config.toml"), "utf8");
    expect(readTomlManagedValue(projectConfig, "agents.max_concurrent_threads_per_session")).toBe(4);
  });

  it("inline mode disables spawned YAAW authority execution in the adapter", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-codex-inline-"));
    await runInstall({ directory: root, tools: "codex", yes: true, codexRuntime: "inline" });
    const runtime = await readFile(join(root, ".codex/yaaw-runtime.md"), "utf8");
    expect(runtime).toContain("Configured YAAW runtime mode: **inline**");
    expect(runtime).toContain("Do not spawn YAAW authority workers");
  });

  it("uninstall removes only YAAW Codex keys and preserves user config", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-codex-uninstall-"));
    await mkdir(join(root, ".codex"), { recursive: true });
    await writeFile(join(root, ".codex/config.toml"), 'model = "user-model"\n');
    await runInstall({ directory: root, tools: "codex", yes: true });
    await runInstall({ directory: root, action: "uninstall", yes: true });
    expect(await readFile(join(root, ".codex/config.toml"), "utf8")).toContain('model = "user-model"');
    expect(await exists(join(root, ".codex/yaaw-runtime.md"))).toBe(false);
  });
});
