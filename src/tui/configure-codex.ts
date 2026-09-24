import * as p from "@clack/prompts";
import { defaultCodexRuntimeSettings, normalizeCodexRuntimeSettings, type CodexModelSettings, type CodexRuntimeSettings } from "../integrations/codex-runtime.js";
import { CODEX_CONFIGURATION_REVISION, codexModels, getCodexModel, recommendedCodexProfile } from "../integrations/codex-catalog.js";
import type { ConfigurationContext, ConfigurationSelection, IntegrationConfigurationProfile } from "../integrations/types.js";

async function optionalText(message: string, current: string | null): Promise<string | null> {
  const result = await p.text({ message, placeholder: current ?? "inherit", defaultValue: current ?? "" });
  if (p.isCancel(result)) return current;
  const value = String(result).trim();
  return value ? value : null;
}

async function reasoningPicker(label: string, model: string | null, current: string | null): Promise<string | null> {
  if (!model) return null;
  const known = getCodexModel(model);
  const values = known?.reasoningEfforts ?? ["low", "medium", "high", "xhigh"];
  const result = await p.select({
    message: `${label} reasoning effort`,
    initialValue: current ?? "inherit",
    options: [
      ...values.map(value => ({ value, label: value === "xhigh" ? "Extra high" : value[0].toUpperCase() + value.slice(1) })),
      { value: "inherit", label: "Inherit" }
    ]
  });
  if (p.isCancel(result) || result === "inherit") return null;
  return String(result);
}

async function modelPair(label: string, current: CodexModelSettings): Promise<CodexModelSettings> {
  const result = await p.select({
    message: `${label} model`,
    initialValue: current.model ?? "inherit",
    options: [
      ...codexModels.map(model => ({ value: model.id, label: model.label, hint: model.description })),
      { value: "inherit", label: "Inherit", hint: "Use the parent/default Codex model" },
      { value: "custom", label: "Custom model ID…", hint: "Enter a model not known to this YAAW release" }
    ]
  });
  if (p.isCancel(result)) return current;
  let model: string | null;
  if (result === "inherit") model = null;
  else if (result === "custom") model = await optionalText(`${label} custom model ID`, current.model);
  else model = String(result);
  return { model, reasoning: await reasoningPicker(label, model, current.reasoning) };
}

function profile(id: string): IntegrationConfigurationProfile {
  return { id, revision: CODEX_CONFIGURATION_REVISION };
}

function recommendedNote(settings: CodexRuntimeSettings) {
  p.note([
    `Orchestrator    ${settings.orchestrator.model} / ${settings.orchestrator.reasoning}`,
    `PRD             ${settings.roles.prd.model} / ${settings.roles.prd.reasoning}`,
    `Planner         ${settings.roles.planner.model} / ${settings.roles.planner.reasoning}`,
    `Implementer     ${settings.roles.implementer.model} / ${settings.roles.implementer.reasoning}`,
    `Reviewer        ${settings.roles.reviewer.model} / ${settings.roles.reviewer.reasoning}`,
    `Fallback        ${settings.defaultWorker.model} / ${settings.defaultWorker.reasoning}`,
    "",
    `Runtime         ${settings.mode}`,
    `Agent threads   ${settings.maxConcurrentThreads}`
  ].join("\n"), "Recommended Codex profile");
}

export async function configureCodex(current: unknown, context: ConfigurationContext): Promise<ConfigurationSelection> {
  const base = normalizeCodexRuntimeSettings(current ?? defaultCodexRuntimeSettings());
  const setup = await p.select({
    message: "How should YAAW configure Codex?",
    initialValue: context.currentProfile?.id === "inherit" ? "inherit" : context.currentProfile?.id === "inline" ? "inline" : "recommended",
    options: [
      { value: "recommended", label: "Recommended", hint: "YAAW-managed worker configuration with recommended models" },
      { value: "inherit", label: "Inherit Codex defaults", hint: "Keep model/reasoning selection outside YAAW" },
      { value: "custom", label: "Custom", hint: "Choose runtime, models, reasoning, and worker settings" },
      { value: "inline", label: "Inline only", hint: "Run authorities in the current session without worker spawning" }
    ]
  });
  if (p.isCancel(setup)) return { settings: base, profile: context.currentProfile ?? null, cancelled: true };

  if (setup === "recommended") {
    const settings = structuredClone(recommendedCodexProfile().settings);
    recommendedNote(settings);
    return { settings, profile: profile("recommended") };
  }
  if (setup === "inherit") {
    const settings = defaultCodexRuntimeSettings();
    p.note(["Runtime workers will use YAAW authority isolation when available.", "Model and reasoning selection will inherit from Codex.", "", "You can configure explicit models later with:", "  yaaw config codex"].join("\n"), "Codex configuration");
    return { settings, profile: profile("inherit") };
  }
  if (setup === "inline") {
    const settings = { ...defaultCodexRuntimeSettings(), mode: "inline" as const };
    p.note(["YAAW authority roles will execute in the current Codex session.", "YAAW will not spawn isolated authority workers.", "", "Durable project artifacts still remain the source of workflow state."].join("\n"), "Inline Codex execution");
    return { settings, profile: profile("inline") };
  }

  const mode = await p.select({
    message: "YAAW Codex execution mode",
    initialValue: base.mode,
    options: [
      { value: "auto", label: "Auto", hint: "Named worker → generic worker → inline fallback" },
      { value: "isolated-required", label: "Require isolated workers", hint: "Block authority execution if isolation is unavailable" },
      { value: "inline", label: "Inline only", hint: "Do not spawn YAAW authority workers" }
    ]
  });
  if (p.isCancel(mode)) return { settings: base, profile: context.currentProfile ?? null, cancelled: true };
  if (mode === "inline") return { settings: { ...base, mode: "inline" }, profile: profile("custom") };

  const strategy = await p.select({
    message: "How should models be assigned?",
    initialValue: "recommended",
    options: [
      { value: "recommended", label: "Recommended role profile", hint: "Use YAAW's recommended model/reasoning split" },
      { value: "shared", label: "One model for all workers", hint: "Choose a shared worker model" },
      { value: "roles", label: "Customize individual roles", hint: "Configure PRD, Planner, Implementer, and Reviewer separately" },
      { value: "inherit", label: "Inherit Codex defaults", hint: "Do not pin model IDs" }
    ]
  });
  if (p.isCancel(strategy)) return { settings: base, profile: context.currentProfile ?? null, cancelled: true };

  let settings = normalizeCodexRuntimeSettings({ ...base, mode });
  if (strategy === "recommended") settings = normalizeCodexRuntimeSettings({ ...recommendedCodexProfile().settings, mode });
  else if (strategy === "inherit") settings = normalizeCodexRuntimeSettings({ ...defaultCodexRuntimeSettings(), mode });
  else if (strategy === "shared") {
    const pair = await modelPair("Shared worker", base.defaultWorker);
    settings = normalizeCodexRuntimeSettings({ ...settings, orchestrator: pair, defaultWorker: pair, roles: { prd: pair, planner: pair, implementer: pair, reviewer: pair } });
  } else {
    settings = normalizeCodexRuntimeSettings({
      ...settings,
      orchestrator: await modelPair("Orchestrator", base.orchestrator),
      defaultWorker: await modelPair("Default fallback worker", base.defaultWorker),
      roles: {
        prd: await modelPair("PRD", base.roles.prd),
        planner: await modelPair("Planner", base.roles.planner),
        implementer: await modelPair("Implementer", base.roles.implementer),
        reviewer: await modelPair("Reviewer", base.roles.reviewer)
      }
    });
  }

  const advanced = await p.confirm({ message: "Configure advanced Codex settings?", initialValue: false });
  if (!p.isCancel(advanced) && advanced) {
    const maxRaw = await optionalText("Concurrent agent threads (blank = inherit)", settings.maxConcurrentThreads === null ? null : String(settings.maxConcurrentThreads));
    const sandboxMode = await optionalText("Sandbox mode (blank = inherit)", settings.sandboxMode);
    const approvalPolicy = await optionalText("Approval policy (blank = inherit)", settings.approvalPolicy);
    const web = await p.select({
      message: "Web search",
      initialValue: settings.webSearch ?? "inherit",
      options: [{ value: "inherit", label: "Inherit" }, { value: "disabled", label: "Disabled" }, { value: "cached", label: "Cached" }, { value: "indexed", label: "Indexed" }, { value: "live", label: "Live" }]
    });
    settings = normalizeCodexRuntimeSettings({ ...settings, maxConcurrentThreads: maxRaw, sandboxMode, approvalPolicy, webSearch: p.isCancel(web) || web === "inherit" ? null : web });
  }
  return { settings, profile: profile("custom") };
}

export async function configureCodexRuntime(current?: unknown): Promise<CodexRuntimeSettings> {
  const result = await configureCodex(current, { reason: "manual", availableRevision: CODEX_CONFIGURATION_REVISION, pendingChanges: [], currentProfile: null });
  return normalizeCodexRuntimeSettings(result.settings);
}
