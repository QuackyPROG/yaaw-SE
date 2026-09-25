import * as p from "@clack/prompts";
import { defaultCodexRuntimeSettings, normalizeCodexRuntimeSettings, type CodexModelSettings, type CodexRuntimeSettings } from "../integrations/codex-runtime.js";
import { CODEX_CONFIGURATION_REVISION, codexModels, codexReasoningEfforts, getCodexModel, recommendedCodexProfile } from "../integrations/codex-catalog.js";
import type { ConfigurationContext, ConfigurationSelection, IntegrationConfigurationProfile } from "../integrations/types.js";
import { navigationBack, navigationCancel, navigationValue, type NavigationResult } from "./navigation.js";

function displayReasoning(value: string | null): string {
  if (!value) return "Inherit";
  if (value === "xhigh") return "Extra high";
  if (value === "max") return "Max";
  return value[0].toUpperCase() + value.slice(1);
}

function pairSummary(pair: CodexModelSettings): string {
  return `${pair.model ?? "Inherit"} / ${displayReasoning(pair.reasoning)}`;
}

function profile(id: string): IntegrationConfigurationProfile {
  return { id, revision: CODEX_CONFIGURATION_REVISION };
}

function setupInitialValue(currentProfile: IntegrationConfigurationProfile | null | undefined): string {
  const id = currentProfile?.id;
  if (id === "recommended" || id === "inherit" || id === "inline" || id === "custom") return id;
  return id ? "custom" : "recommended";
}

async function textValue(message: string, current: string | null): Promise<NavigationResult<string | null>> {
  const result = await p.text({
    message,
    placeholder: current ?? "inherit",
    defaultValue: current ?? ""
  });
  if (p.isCancel(result)) return navigationBack();
  const trimmed = String(result).trim();
  return navigationValue(trimmed ? trimmed : null);
}

async function reasoningPicker(
  label: string,
  model: string | null,
  current: string | null
): Promise<NavigationResult<string | null>> {
  const known = getCodexModel(model);
  const values = known?.reasoningEfforts ?? [...codexReasoningEfforts];
  const result = await p.select({
    message: `${label} reasoning effort`,
    initialValue: current ?? "inherit",
    options: [
      ...values.map(value => ({
        value,
        label: displayReasoning(value)
      })),
      { value: "inherit", label: "Inherit" },
      { value: "back", label: "← Back" }
    ]
  });
  if (p.isCancel(result) || result === "back") return navigationBack();
  return navigationValue(result === "inherit" ? null : String(result));
}

async function modelPair(label: string, current: CodexModelSettings): Promise<NavigationResult<CodexModelSettings>> {
  const draft = structuredClone(current);
  while (true) {
    const result = await p.select({
      message: `${label} model`,
      initialValue: draft.model ?? "inherit",
      options: [
        ...codexModels.map(model => ({ value: model.id, label: model.label, hint: model.description })),
        { value: "inherit", label: "Inherit", hint: "Use the parent/default Codex model" },
        { value: "custom", label: "Custom model ID…", hint: "Enter a model not known to this YAAW release" },
        { value: "back", label: "← Back" }
      ]
    });
    if (p.isCancel(result) || result === "back") return navigationBack();

    if (result === "inherit") {
      draft.model = null;
    } else if (result === "custom") {
      const custom = await textValue(`${label} custom model ID`, draft.model);
      if (custom.kind !== "value") continue;
      draft.model = custom.value;
    } else {
      draft.model = String(result);
    }

    const reasoning = await reasoningPicker(label, draft.model, draft.reasoning);
    if (reasoning.kind === "back") continue;
    if (reasoning.kind === "cancel") return navigationCancel();
    draft.reasoning = reasoning.value;
    return navigationValue(draft);
  }
}

function recommendedNote(settings: CodexRuntimeSettings) {
  p.note([
    `Orchestrator    ${pairSummary(settings.orchestrator)}`,
    `PRD             ${pairSummary(settings.roles.prd)}`,
    `Planner         ${pairSummary(settings.roles.planner)}`,
    `Implementer     ${pairSummary(settings.roles.implementer)}`,
    `Reviewer        ${pairSummary(settings.roles.reviewer)}`,
    `Fallback        ${pairSummary(settings.defaultWorker)}`,
    "",
    `Runtime         ${settings.mode}`,
    `Agent threads   ${settings.maxConcurrentThreads ?? "Inherit"}`
  ].join("\n"), "Recommended Codex profile");
}

async function editAdvanced(settings: CodexRuntimeSettings): Promise<void> {
  while (true) {
    const choice = await p.select({
      message: "Advanced Codex settings",
      options: [
        { value: "threads", label: `Concurrent agent threads   ${settings.maxConcurrentThreads ?? "Inherit"}` },
        { value: "sandbox", label: `Sandbox mode               ${settings.sandboxMode ?? "Inherit"}` },
        { value: "approval", label: `Approval policy            ${settings.approvalPolicy ?? "Inherit"}` },
        { value: "web", label: `Web search                 ${settings.webSearch ?? "Inherit"}` },
        { value: "back", label: "← Back" }
      ]
    });
    if (p.isCancel(choice) || choice === "back") return;

    if (choice === "threads") {
      const result = await p.text({
        message: "Concurrent agent threads (blank = inherit)",
        placeholder: settings.maxConcurrentThreads === null ? "inherit" : String(settings.maxConcurrentThreads),
        defaultValue: settings.maxConcurrentThreads === null ? "" : String(settings.maxConcurrentThreads)
      });
      if (p.isCancel(result)) continue;
      const raw = String(result).trim();
      if (!raw) {
        settings.maxConcurrentThreads = null;
        continue;
      }
      const value = Number(raw);
      if (!Number.isInteger(value) || value < 1) {
        p.note("Enter a positive integer, or leave blank to inherit.", "Invalid agent thread count");
        continue;
      }
      settings.maxConcurrentThreads = value;
      continue;
    }

    if (choice === "sandbox" || choice === "approval") {
      const current = choice === "sandbox" ? settings.sandboxMode : settings.approvalPolicy;
      const result = await textValue(
        choice === "sandbox" ? "Sandbox mode (blank = inherit)" : "Approval policy (blank = inherit)",
        current
      );
      if (result.kind !== "value") continue;
      if (choice === "sandbox") settings.sandboxMode = result.value;
      else settings.approvalPolicy = result.value;
      continue;
    }

    if (choice === "web") {
      const result = await p.select({
        message: "Web search",
        initialValue: settings.webSearch ?? "inherit",
        options: [
          { value: "inherit", label: "Inherit" },
          { value: "disabled", label: "Disabled" },
          { value: "cached", label: "Cached" },
          { value: "indexed", label: "Indexed" },
          { value: "live", label: "Live" },
          { value: "back", label: "← Back" }
        ]
      });
      if (p.isCancel(result) || result === "back") continue;
      settings.webSearch = result === "inherit" ? null : result as CodexRuntimeSettings["webSearch"];
    }
  }
}

async function editRoleHub(settings: CodexRuntimeSettings): Promise<NavigationResult<CodexRuntimeSettings>> {
  while (true) {
    const choice = await p.select({
      message: "Codex role configuration",
      options: [
        { value: "orchestrator", label: `Orchestrator          ${pairSummary(settings.orchestrator)}` },
        { value: "defaultWorker", label: `Default worker        ${pairSummary(settings.defaultWorker)}` },
        { value: "prd", label: `PRD                   ${pairSummary(settings.roles.prd)}` },
        { value: "planner", label: `Planner               ${pairSummary(settings.roles.planner)}` },
        { value: "implementer", label: `Implementer           ${pairSummary(settings.roles.implementer)}` },
        { value: "reviewer", label: `Reviewer              ${pairSummary(settings.roles.reviewer)}` },
        { value: "advanced", label: "Advanced settings" },
        { value: "review", label: "Review changes" },
        { value: "back", label: "← Back" },
        { value: "cancel", label: "Cancel configuration" }
      ]
    });

    if (p.isCancel(choice) || choice === "back") return navigationBack();
    if (choice === "cancel") return navigationCancel();
    if (choice === "review") return navigationValue(normalizeCodexRuntimeSettings(settings));
    if (choice === "advanced") {
      await editAdvanced(settings);
      continue;
    }

    let current: CodexModelSettings;
    let label: string;
    if (choice === "orchestrator") {
      current = settings.orchestrator;
      label = "Orchestrator";
    } else if (choice === "defaultWorker") {
      current = settings.defaultWorker;
      label = "Default fallback worker";
    } else {
      current = settings.roles[choice as keyof CodexRuntimeSettings["roles"]];
      label = String(choice)[0].toUpperCase() + String(choice).slice(1);
      if (choice === "prd") label = "PRD";
    }

    const edited = await modelPair(label, current);
    if (edited.kind !== "value") continue;
    if (choice === "orchestrator") settings.orchestrator = edited.value;
    else if (choice === "defaultWorker") settings.defaultWorker = edited.value;
    else settings.roles[choice as keyof CodexRuntimeSettings["roles"]] = edited.value;
  }
}

function inheritPair(): CodexModelSettings {
  return { model: null, reasoning: null };
}

function assignRecommendedModels(settings: CodexRuntimeSettings) {
  const recommended = recommendedCodexProfile().settings;
  settings.orchestrator = structuredClone(recommended.orchestrator);
  settings.defaultWorker = structuredClone(recommended.defaultWorker);
  settings.roles = structuredClone(recommended.roles);
}

function assignInheritedModels(settings: CodexRuntimeSettings) {
  settings.orchestrator = inheritPair();
  settings.defaultWorker = inheritPair();
  settings.roles = {
    prd: inheritPair(),
    planner: inheritPair(),
    implementer: inheritPair(),
    reviewer: inheritPair()
  };
}

async function configureCustom(settings: CodexRuntimeSettings): Promise<NavigationResult<CodexRuntimeSettings>> {
  let step: "mode" | "strategy" = "mode";
  let strategyValue = "roles";

  while (true) {
    if (step === "mode") {
      const mode = await p.select({
        message: "YAAW Codex execution mode",
        initialValue: settings.mode,
        options: [
          { value: "auto", label: "Auto", hint: "Named worker → generic worker → inline fallback" },
          { value: "isolated-required", label: "Require isolated workers", hint: "Block authority execution if isolation is unavailable" },
          { value: "inline", label: "Inline only", hint: "Do not spawn YAAW authority workers" },
          { value: "back", label: "← Back" }
        ]
      });
      if (p.isCancel(mode) || mode === "back") return navigationBack();
      settings.mode = mode as CodexRuntimeSettings["mode"];
      step = "strategy";
    }

    const strategy = await p.select({
      message: "How should models be assigned?",
      initialValue: strategyValue,
      options: [
        { value: "recommended", label: "Recommended role profile", hint: "Use YAAW's recommended model/reasoning split" },
        { value: "shared", label: "One model for all workers", hint: "Choose a shared worker model" },
        { value: "roles", label: "Customize individual roles", hint: "Configure roles from a reusable editor hub" },
        { value: "inherit", label: "Inherit Codex defaults", hint: "Do not pin model IDs or reasoning" },
        { value: "back", label: "← Back" }
      ]
    });

    if (p.isCancel(strategy) || strategy === "back") {
      step = "mode";
      continue;
    }

    strategyValue = String(strategy);

    if (strategy === "recommended") {
      assignRecommendedModels(settings);
    } else if (strategy === "inherit") {
      assignInheritedModels(settings);
    } else if (strategy === "shared") {
      const shared = await modelPair("Shared worker", settings.defaultWorker);
      if (shared.kind !== "value") continue;
      settings.orchestrator = structuredClone(shared.value);
      settings.defaultWorker = structuredClone(shared.value);
      settings.roles = {
        prd: structuredClone(shared.value),
        planner: structuredClone(shared.value),
        implementer: structuredClone(shared.value),
        reviewer: structuredClone(shared.value)
      };
    }

    const hub = await editRoleHub(settings);
    if (hub.kind === "cancel") return hub;
    if (hub.kind === "back") {
      step = "strategy";
      continue;
    }
    return hub;
  }
}

export async function configureCodex(current: unknown, context: ConfigurationContext): Promise<ConfigurationSelection> {
  const base = normalizeCodexRuntimeSettings(current ?? defaultCodexRuntimeSettings());
  const customDraft = structuredClone(base);

  while (true) {
    const setup = await p.select({
      message: "How should YAAW configure Codex?",
      initialValue: setupInitialValue(context.currentProfile),
      options: [
        { value: "recommended", label: "Recommended", hint: "YAAW-managed worker configuration with recommended models" },
        { value: "inherit", label: "Inherit Codex defaults", hint: "Keep model/reasoning selection outside YAAW" },
        { value: "custom", label: "Custom", hint: "Choose runtime, models, reasoning, and worker settings" },
        { value: "inline", label: "Inline only", hint: "Run authorities in the current session without worker spawning" }
      ]
    });
    if (p.isCancel(setup)) {
      return { settings: base, profile: context.currentProfile ?? null, cancelled: true };
    }

    if (setup === "recommended") {
      const settings = structuredClone(recommendedCodexProfile().settings);
      recommendedNote(settings);
      return { settings, profile: profile("recommended") };
    }
    if (setup === "inherit") {
      const settings = defaultCodexRuntimeSettings();
      p.note([
        "Runtime workers will use YAAW authority isolation when available.",
        "Model and reasoning selection will inherit from Codex.",
        "",
        "You can configure explicit models later with:",
        "  yaaw config codex"
      ].join("\n"), "Codex configuration");
      return { settings, profile: profile("inherit") };
    }
    if (setup === "inline") {
      const settings = { ...defaultCodexRuntimeSettings(), mode: "inline" as const };
      p.note([
        "YAAW authority roles will execute in the current Codex session.",
        "YAAW will not spawn isolated authority workers.",
        "",
        "Durable project artifacts still remain the source of workflow state."
      ].join("\n"), "Inline Codex execution");
      return { settings, profile: profile("inline") };
    }

    const custom = await configureCustom(customDraft);
    if (custom.kind === "back") continue;
    if (custom.kind === "cancel") {
      return { settings: base, profile: context.currentProfile ?? null, cancelled: true };
    }
    return { settings: custom.value, profile: profile("custom") };
  }
}

export async function configureCodexRuntime(current?: unknown): Promise<CodexRuntimeSettings> {
  const result = await configureCodex(current, {
    reason: "manual",
    availableRevision: CODEX_CONFIGURATION_REVISION,
    pendingChanges: [],
    currentProfile: null
  });
  return normalizeCodexRuntimeSettings(result.settings);
}
