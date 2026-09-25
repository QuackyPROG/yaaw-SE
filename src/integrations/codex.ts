import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { makeAdapter, pathExists } from "./helpers.js";
import type { IntegrationAdapter, IntegrationContext, IntegrationVerification } from "./types.js";
import type { InstallOperation, ManagedConfigEntry } from "../installer/types.js";
import { codexResolvedSettingLabel, defaultCodexRuntimeSettings, normalizeCodexRuntimeSettings, parseCodexInstallConfig, resolveCodexAuthorityProfile, resolveCodexGenericProfile, resolveCodexInlineProfile, type CodexAuthorityRole, type CodexModelSettings, type CodexRuntimeSettings } from "./codex-runtime.js";
import { CODEX_CONFIGURATION_REVISION, codexConfigurationChanges } from "./codex-catalog.js";
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

const fallbackRoleDefinitions = {
  implementer: { agent: "yaaw_implementer_fallback", file: "yaaw-implementer-fallback.toml", description: "YAAW Implementer capability fallback. Use only after the configured consecutive no-progress execution-failure threshold." },
  reviewer: { agent: "yaaw_reviewer_fallback", file: "yaaw-reviewer-fallback.toml", description: "YAAW Reviewer capability fallback. Use only after the configured consecutive no-progress execution-failure threshold." }
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

function fallbackEnabled(settings: CodexRuntimeSettings): boolean {
  return settings.failureFallback.afterFailures !== null;
}

function allRoleDefinitions(settings: CodexRuntimeSettings) {
  return fallbackEnabled(settings)
    ? [...Object.values(roleDefinitions), ...Object.values(fallbackRoleDefinitions)]
    : [...Object.values(roleDefinitions)];
}

function authorityLabel(role: CodexAuthorityRole): string {
  return role === "prd" ? "PRD" : role[0].toUpperCase() + role.slice(1);
}

function profileLine(label: string, profile: { namedAgent?: string; model: { value: string | null }; reasoning: { value: string | null } }): string[] {
  return [
    label,
    ...(profile.namedAgent ? ["  named worker: " + profile.namedAgent] : []),
    "  model: " + codexResolvedSettingLabel(profile.model as any),
    "  reasoning: " + codexResolvedSettingLabel(profile.reasoning as any)
  ];
}

function configuredAuthorityProfileSection(settings: CodexRuntimeSettings): string {
  const lines: string[] = ["Primary:"];
  for (const role of Object.keys(roleDefinitions) as CodexAuthorityRole[]) {
    lines.push(...profileLine(authorityLabel(role), resolveCodexAuthorityProfile(settings, role)));
  }
  if (fallbackEnabled(settings)) {
    lines.push("", "Capability fallback:");
    for (const role of ["implementer", "reviewer"] as const) {
      lines.push(...profileLine(authorityLabel(role), resolveCodexAuthorityProfile(settings, role, "fallback")));
    }
  } else {
    lines.push("", "Capability fallback: disabled");
  }
  lines.push("", ...profileLine("Generic worker baseline", resolveCodexGenericProfile(settings)));
  lines.push("", ...profileLine("Inline/root baseline", resolveCodexInlineProfile(settings)));
  return lines.join("\n");
}

async function verifyRoleConfigFile(
  projectRoot: string,
  file: string,
  expected: CodexModelSettings,
  label: string,
  issues: string[]
): Promise<void> {
  const path = join(projectRoot, ".codex", "agents", file);
  if (!(await pathExists(path))) {
    issues.push("missing .codex/agents/" + file);
    return;
  }
  try {
    const text = await readFile(path, "utf8");
    validateManagedToml(text);
    const actualModel = readTomlManagedValue(text, "model");
    const actualReasoning = readTomlManagedValue(text, "model_reasoning_effort");
    if (expected.model === null ? actualModel !== undefined : actualModel !== expected.model) {
      issues.push("mismatched Codex role model: " + label);
    }
    if (expected.reasoning === null ? actualReasoning !== undefined : actualReasoning !== expected.reasoning) {
      issues.push("mismatched Codex role reasoning: " + label);
    }
  } catch (error: any) {
    issues.push("invalid Codex role config " + label + ": " + error.message);
  }
}

function configEntries(settings: CodexRuntimeSettings): ManagedConfigEntry[] {
  const entries: ManagedConfigEntry[] = [];
  for (const def of allRoleDefinitions(settings)) {
    entries.push(
      { key: `agents.${def.agent}.description`, value: def.description },
      { key: `agents.${def.agent}.config_file`, value: `agents/${def.file}` }
    );
  }
  if (settings.orchestrator.model) entries.push({ key: "model", value: settings.orchestrator.model });
  if (settings.serviceTier) entries.push({ key: "service_tier", value: settings.serviceTier });
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
  const fallbackPolicy = settings.failureFallback.afterFailures === null
    ? "Authority capability fallback is **disabled** for this installation."
    : [
        `Authority capability fallback is **enabled after ${settings.failureFallback.afterFailures} consecutive no-progress execution failures** on the same handoff basis.`,
        "- `implementer` fallback -> `yaaw_implementer_fallback`",
        "- `reviewer` fallback -> `yaaw_reviewer_fallback`",
        "The fallback gets one attempt on an unchanged basis; another no-progress execution failure blocks rather than looping indefinitely."
      ].join("\n");
  const operations: InstallOperation[] = [
    {
      type: "write-managed-file",
      path: join(ctx.projectRoot, ".codex", "yaaw-runtime.md"),
      content: runtimeTemplate
        .replaceAll("{{RUNTIME_MODE}}", settings.mode)
        .replaceAll("{{FAILURE_FALLBACK_POLICY}}", fallbackPolicy)
        .replaceAll("{{AUTHORITY_EXECUTION_PROFILES}}", configuredAuthorityProfileSection(settings)),
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

  if (fallbackEnabled(settings)) {
    for (const [role, def] of Object.entries(fallbackRoleDefinitions) as [keyof typeof fallbackRoleDefinitions, (typeof fallbackRoleDefinitions)[keyof typeof fallbackRoleDefinitions]][]) {
      operations.push({
        type: "write-managed-file",
        path: join(ctx.projectRoot, ".codex", "agents", def.file),
        content: roleConfig(settings.failureFallback[role]),
        owner: "integration:codex"
      });
    }
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
  const settings = normalizeCodexRuntimeSettings(ctx.settings);
  const issues: string[] = [];
  const runtimePath = join(ctx.projectRoot, ".codex", "yaaw-runtime.md");
  const configPath = join(ctx.projectRoot, ".codex", "config.toml");

  if (!(await pathExists(runtimePath))) {
    issues.push("missing .codex/yaaw-runtime.md");
  } else {
    try {
      const runtimeText = await readFile(runtimePath, "utf8");
      const expectedProfiles = configuredAuthorityProfileSection(settings);
      if (!runtimeText.includes(expectedProfiles)) issues.push("mismatched Codex authority execution-profile metadata");
    } catch (error: any) {
      issues.push("invalid Codex runtime metadata: " + error.message);
    }
  }

  for (const [role, def] of Object.entries(roleDefinitions) as [CodexAuthorityRole, (typeof roleDefinitions)[CodexAuthorityRole]][]) {
    await verifyRoleConfigFile(ctx.projectRoot, def.file, settings.roles[role], role, issues);
  }
  if (fallbackEnabled(settings)) {
    for (const role of ["implementer", "reviewer"] as const) {
      const def = fallbackRoleDefinitions[role];
      await verifyRoleConfigFile(ctx.projectRoot, def.file, settings.failureFallback[role], role + " fallback", issues);
    }
  }

  if (!(await pathExists(configPath))) issues.push("missing .codex/config.toml");
  else {
    try {
      const text = await readFile(configPath, "utf8");
      validateManagedToml(text);
      for (const def of allRoleDefinitions(settings)) {
        if (readTomlManagedValue(text, "agents." + def.agent + ".config_file") !== "agents/" + def.file) {
          issues.push("missing/mismatched Codex role declaration: " + def.agent);
        }
      }
      const expectedOwnedSettings: [string, string | null, string][] = [
        ["model", settings.orchestrator.model, "orchestrator model"],
        ["model_reasoning_effort", settings.orchestrator.reasoning, "orchestrator reasoning"],
        ["agents.default_subagent_model", settings.defaultWorker.model, "default worker model"],
        ["agents.default_subagent_reasoning_effort", settings.defaultWorker.reasoning, "default worker reasoning"]
      ];
      for (const [key, expected, label] of expectedOwnedSettings) {
        if (expected !== null && readTomlManagedValue(text, key) !== expected) {
          issues.push("missing/mismatched Codex " + label);
        }
      }
    } catch (error: any) {
      issues.push("invalid Codex config: " + error.message);
    }
  }
  return { healthy: issues.length === 0, issues };
}

export const codexAdapter: IntegrationAdapter = {
  ...baseAdapter,
  aliases: ["codex"],
  adapterVersion: 5,
  configuration: {
    revision: CODEX_CONFIGURATION_REVISION,
    changes: codexConfigurationChanges,
    defaultSettings: defaultCodexRuntimeSettings,
    normalize: normalizeCodexRuntimeSettings,
    parseHeadless: parseCodexInstallConfig,
    describe(settings) {
      const runtime = normalizeCodexRuntimeSettings(settings);
      return [
        `Runtime: ${runtime.mode}`,
        `Orchestrator: ${runtime.orchestrator.model ?? "inherit"} / ${runtime.orchestrator.reasoning ?? "inherit"}`,
        `PRD: ${runtime.roles.prd.model ?? "inherit"} / ${runtime.roles.prd.reasoning ?? "inherit"}`,
        `Planner: ${runtime.roles.planner.model ?? "inherit"} / ${runtime.roles.planner.reasoning ?? "inherit"}`,
        `Implementer: ${runtime.roles.implementer.model ?? "inherit"} / ${runtime.roles.implementer.reasoning ?? "inherit"}`,
        `Reviewer: ${runtime.roles.reviewer.model ?? "inherit"} / ${runtime.roles.reviewer.reasoning ?? "inherit"}`,
        `Implementer fallback: ${runtime.failureFallback.afterFailures === null ? "disabled" : `after ${runtime.failureFallback.afterFailures} -> ${runtime.failureFallback.implementer.model ?? "inherit"} / ${runtime.failureFallback.implementer.reasoning ?? "inherit"}`}`,
        `Reviewer fallback: ${runtime.failureFallback.afterFailures === null ? "disabled" : `after ${runtime.failureFallback.afterFailures} -> ${runtime.failureFallback.reviewer.model ?? "inherit"} / ${runtime.failureFallback.reviewer.reasoning ?? "inherit"}`}`,
        `Service tier: ${runtime.serviceTier ?? "inherit"}`,
        `Agent threads: ${runtime.maxConcurrentThreads ?? "inherit"}`
      ];
    },
    async configureInteractive(current, context) {
      const { configureCodex } = await import("../tui/configure-codex.js");
      return configureCodex(current, context);
    },
    plan: planRuntime,
    verify: verifyRuntime
  },
  planRuntime,
  verifyRuntime,
  async verify(ctx, selectedSkillIds) {
    const base = await baseAdapter.verify(ctx, selectedSkillIds);
    const runtime = await verifyRuntime(ctx);
    return { healthy: base.healthy && runtime.healthy, issues: [...base.issues, ...runtime.issues] };
  },
  describeRuntime(settings) {
    const runtime = normalizeCodexRuntimeSettings(settings);
    const authorityProfiles = (Object.keys(roleDefinitions) as CodexAuthorityRole[]).map(role => {
      const profile = resolveCodexAuthorityProfile(runtime, role);
      return "  " + authorityLabel(role) + ": " + codexResolvedSettingLabel(profile.model) + " / " + codexResolvedSettingLabel(profile.reasoning);
    });
    return [
      "mode: " + runtime.mode,
      "authority profiles:",
      ...authorityProfiles,
      "generic fallback baseline: " + codexResolvedSettingLabel(resolveCodexGenericProfile(runtime).model) + " / " + codexResolvedSettingLabel(resolveCodexGenericProfile(runtime).reasoning),
      "inline/root baseline: " + codexResolvedSettingLabel(resolveCodexInlineProfile(runtime).model) + " / " + codexResolvedSettingLabel(resolveCodexInlineProfile(runtime).reasoning),
      "failure fallback: " + (runtime.failureFallback.afterFailures === null ? "disabled" : "after " + runtime.failureFallback.afterFailures + " no-progress execution failures"),
      "service tier: " + (runtime.serviceTier ?? "inherit"),
      "max concurrent threads: " + (runtime.maxConcurrentThreads ?? "inherit")
    ];
  }
};
