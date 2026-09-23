import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { makeAdapter, pathExists } from "./helpers.js";
import type { IntegrationAdapter, IntegrationContext, IntegrationVerification } from "./types.js";
import type { InstallOperation, ManagedConfigEntry } from "../installer/types.js";
import { normalizeCodexRuntimeSettings, type CodexModelSettings, type CodexRuntimeSettings } from "./codex-runtime.js";
import { readTomlManagedValue, validateManagedToml } from "../installer/toml-managed.js";

const baseAdapter = makeAdapter({
  id: "codex",
  displayName: "Codex",
  executable: "codex",
  detectionPaths: [".agents", ".codex", "AGENTS.md"],
  skillsRel: ".agents/skills",
  bootstrapRel: "AGENTS.md",
  bootstrapTemplate: "codex.md",
  managedSection: true,
  hint: skill => `$${skill}`
});

const roleDefinitions = {
  prd: { agent: "yaaw_prd", file: "yaaw-prd.toml", description: "YAAW PRD authority worker. Use only for a YAAW handoff whose role is prd." },
  planner: { agent: "yaaw_planner", file: "yaaw-planner.toml", description: "YAAW Planner authority worker. Use only for a YAAW handoff whose role is planner." },
  implementer: { agent: "yaaw_implementer", file: "yaaw-implementer.toml", description: "YAAW Implementer authority worker. Use only for a YAAW handoff whose role is implementer." },
  reviewer: { agent: "yaaw_reviewer", file: "yaaw-reviewer.toml", description: "YAAW Reviewer authority worker. Use only for a YAAW handoff whose role is reviewer." }
} as const;

function roleConfig(settings: CodexModelSettings): string {
  const lines = [
    "# YAAW-SE Codex authority-worker runtime configuration.",
    "# Canonical role/workflow semantics live under .yaaw-core/system/."
  ];
  if (settings.model) lines.push(`model = ${JSON.stringify(settings.model)}`);
  if (settings.reasoning) lines.push(`model_reasoning_effort = ${JSON.stringify(settings.reasoning)}`);
  if (!settings.model && !settings.reasoning) lines.push("# Inherit Codex project/user defaults.");
  return lines.join("\n") + "\n";
}

function configEntries(settings: CodexRuntimeSettings): ManagedConfigEntry[] {
  const entries: ManagedConfigEntry[] = [];
  for (const def of Object.values(roleDefinitions)) {
    entries.push(
      { key: `agents.${def.agent}.description`, value: def.description },
      { key: `agents.${def.agent}.config_file`, value: `agents/${def.file}` }
    );
  }
  if (settings.orchestrator.model) entries.push({ key: "model", value: settings.orchestrator.model });
  if (settings.orchestrator.reasoning) entries.push({ key: "model_reasoning_effort", value: settings.orchestrator.reasoning });
  if (settings.defaultWorker.model) entries.push({ key: "agents.default_subagent_model", value: settings.defaultWorker.model });
  if (settings.defaultWorker.reasoning) entries.push({ key: "agents.default_subagent_reasoning_effort", value: settings.defaultWorker.reasoning });
  if (settings.maxConcurrentThreads !== null) entries.push({ key: "agents.max_concurrent_threads_per_session", value: settings.maxConcurrentThreads });
  if (settings.sandboxMode) entries.push({ key: "sandbox_mode", value: settings.sandboxMode });
  if (settings.approvalPolicy) entries.push({ key: "approval_policy", value: settings.approvalPolicy });
  if (settings.webSearch) entries.push({ key: "web_search", value: settings.webSearch });
  return entries;
}

async function planRuntime(ctx: IntegrationContext): Promise<InstallOperation[]> {
  const settings = normalizeCodexRuntimeSettings(ctx.settings);
  const source = join(ctx.payloadRoot, "integrations", "codex", "yaaw-runtime.md");
  const runtimeTemplate = await readFile(source, "utf8");
  const operations: InstallOperation[] = [
    {
      type: "write-managed-file",
      path: join(ctx.projectRoot, ".codex", "yaaw-runtime.md"),
      content: runtimeTemplate.replaceAll("{{RUNTIME_MODE}}", settings.mode),
      owner: "integration:codex"
    }
  ];

  for (const [role, def] of Object.entries(roleDefinitions) as [keyof typeof roleDefinitions, (typeof roleDefinitions)[keyof typeof roleDefinitions]][]) {
    operations.push({
      type: "write-managed-file",
      path: join(ctx.projectRoot, ".codex", "agents", def.file),
      content: roleConfig(settings.roles[role]),
      owner: "integration:codex"
    });
  }

  operations.push({
    type: "update-managed-config-keys",
    path: join(ctx.projectRoot, ".codex", "config.toml"),
    format: "toml",
    entries: configEntries(settings),
    owner: "integration:codex"
  });
  return operations;
}

async function verifyRuntime(ctx: IntegrationContext): Promise<IntegrationVerification> {
  const issues: string[] = [];
  const configPath = join(ctx.projectRoot, ".codex", "config.toml");
  if (!(await pathExists(join(ctx.projectRoot, ".codex", "yaaw-runtime.md")))) issues.push("missing .codex/yaaw-runtime.md");
  for (const def of Object.values(roleDefinitions)) {
    if (!(await pathExists(join(ctx.projectRoot, ".codex", "agents", def.file)))) issues.push(`missing .codex/agents/${def.file}`);
  }
  if (!(await pathExists(configPath))) issues.push("missing .codex/config.toml");
  else {
    try {
      const text = await readFile(configPath, "utf8");
      validateManagedToml(text);
      for (const def of Object.values(roleDefinitions)) {
        if (readTomlManagedValue(text, `agents.${def.agent}.config_file`) !== `agents/${def.file}`) {
          issues.push(`missing/mismatched Codex role declaration: ${def.agent}`);
        }
      }
    } catch (error: any) {
      issues.push(`invalid Codex config: ${error.message}`);
    }
  }
  return { healthy: issues.length === 0, issues };
}

export const codexAdapter: IntegrationAdapter = {
  ...baseAdapter,
  adapterVersion: 2,
  planRuntime,
  verifyRuntime,
  async verify(ctx, selectedSkillIds) {
    const base = await baseAdapter.verify(ctx, selectedSkillIds);
    const runtime = await verifyRuntime(ctx);
    return { healthy: base.healthy && runtime.healthy, issues: [...base.issues, ...runtime.issues] };
  },
  describeRuntime(settings) {
    const runtime = normalizeCodexRuntimeSettings(settings);
    return [
      `mode: ${runtime.mode}`,
      `orchestrator model: ${runtime.orchestrator.model ?? "inherit"}`,
      `default worker model: ${runtime.defaultWorker.model ?? "inherit"}`,
      `max concurrent threads: ${runtime.maxConcurrentThreads ?? "inherit"}`
    ];
  }
};
