import * as p from "@clack/prompts";
import { defaultCodexRuntimeSettings, normalizeCodexRuntimeSettings, type CodexModelSettings, type CodexRuntimeSettings } from "../integrations/codex-runtime.js";
import { CODEX_CONFIGURATION_REVISION, codexModels, codexReasoningEfforts, getCodexModel, recommendedCodexProfile } from "../integrations/codex-catalog.js";
import type { ConfigurationContext, ConfigurationSelection, IntegrationConfigurationProfile } from "../integrations/types.js";
import { navigationBack, navigationCancel, navigationValue, type NavigationResult } from "./navigation.js";
import { backOption, runBackPrompt } from "./prompt-navigation.js";

function displayReasoning(value: string | null): string {
  if (!value) return "Inherit";
  if (value === "xhigh") return "Extra high";
  if (value === "max") return "Max";
  return value[0].toUpperCase() + value.slice(1);
}

function pairSummary(pair: CodexModelSettings): string {
  return `${pair.model ?? "Inherit"} / ${displayReasoning(pair.reasoning)}`;
}

function serviceTierSummary(value: CodexRuntimeSettings["serviceTier"]): string {
  if (!value) return "Inherit (Fast not forced)";
  if (value === "default") return "Standard";
  if (value === "fast") return "Fast";
  return "Flex";
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
  const prompt = await runBackPrompt(() => p.text({
    message,
    placeholder: current ?? "inherit",
    defaultValue: current ?? ""
  }));
  if (prompt.kind !== "value") return prompt;
  const trimmed = String(prompt.value).trim();
  return navigationValue(trimmed ? trimmed : null);
}

async function reasoningPicker(
  label: string,
  model: string | null,
  current: string | null
): Promise<NavigationResult<string | null>> {
  const known = getCodexModel(model);
  const values = known?.reasoningEfforts ?? [...codexReasoningEfforts];
  const prompt = await runBackPrompt(() => p.select({
    message: `${label}: reasoning`,
    initialValue: current ?? "inherit",
    options: [
      ...values.map(value => ({
        value,
        label: displayReasoning(value)
      })),
      { value: "inherit", label: "Inherit" },
      backOption()
    ]
  }));
  if (prompt.kind !== "value") return prompt;
  const result = prompt.value;
  if (result === "back") return navigationBack();
  return navigationValue(result === "inherit" ? null : String(result));
}

async function modelPair(label: string, current: CodexModelSettings): Promise<NavigationResult<CodexModelSettings>> {
  const draft = structuredClone(current);
  while (true) {
    const prompt = await runBackPrompt(() => p.select({
      message: `${label}: model`,
      initialValue: draft.model ?? "inherit",
      options: [
        ...codexModels.map(model => ({ value: model.id, label: model.label, hint: model.description })),
        { value: "inherit", label: "Inherit", hint: "Use the parent/default Codex model" },
        { value: "custom", label: "Custom model ID…", hint: "Enter a model not known to this YAAW release" },
        backOption()
      ]
    }));
    if (prompt.kind !== "value") return prompt;
    const result = prompt.value;
    if (result === "back") return navigationBack();

    if (result === "inherit") {
      draft.model = null;
    } else if (result === "custom") {
      const custom = await textValue(`${label} custom model ID`, draft.model);
      if (custom.kind === "cancel") return navigationCancel();
      if (custom.kind === "back") continue;
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
  const fallback = settings.failureFallback.afterFailures === null
    ? "Disabled"
    : `after ${settings.failureFallback.afterFailures} failures → ${pairSummary(settings.failureFallback.implementer)}`;
  p.note([
    `Orchestrator  ${pairSummary(settings.orchestrator)}`,
    `Planning      PRD ${pairSummary(settings.roles.prd)} · Planner ${pairSummary(settings.roles.planner)}`,
    `Delivery      Implementer ${pairSummary(settings.roles.implementer)} · Reviewer ${pairSummary(settings.roles.reviewer)}`,
    `Fallback      ${fallback}`,
    `Runtime       ${settings.mode} · ${settings.maxConcurrentThreads ?? "inherit"} threads · ${serviceTierSummary(settings.serviceTier)}`
  ].join("\n"), "Recommended Codex setup");
}

async function editAdvanced(settings: CodexRuntimeSettings): Promise<NavigationResult<void>> {
  while (true) {
    const prompt = await runBackPrompt(() => p.select({
      message: "Advanced settings",
      options: [
        { value: "threads", label: `Concurrent agent threads   ${settings.maxConcurrentThreads ?? "Inherit"}` },
        { value: "sandbox", label: `Sandbox mode               ${settings.sandboxMode ?? "Inherit"}` },
        { value: "approval", label: `Approval policy            ${settings.approvalPolicy ?? "Inherit"}` },
        { value: "web", label: `Web search                 ${settings.webSearch ?? "Inherit"}` },
        { value: "tier", label: `Service tier              ${serviceTierSummary(settings.serviceTier)}` },
        backOption()
      ]
    }));
    if (prompt.kind === "cancel") return navigationCancel();
    if (prompt.kind === "back") return navigationBack();
    const choice = prompt.value;
    if (choice === "back") return navigationBack();

    if (choice === "threads") {
      const result = await runBackPrompt(() => p.text({
        message: "Concurrent agent threads (blank = inherit)",
        placeholder: settings.maxConcurrentThreads === null ? "inherit" : String(settings.maxConcurrentThreads),
        defaultValue: settings.maxConcurrentThreads === null ? "" : String(settings.maxConcurrentThreads)
      }));
      if (result.kind === "cancel") return navigationCancel();
      if (result.kind === "back") continue;
      const raw = String(result.value).trim();
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
      if (result.kind === "cancel") return navigationCancel();
      if (result.kind === "back") continue;
      if (choice === "sandbox") settings.sandboxMode = result.value;
      else settings.approvalPolicy = result.value;
      continue;
    }

    if (choice === "tier") {
      const result = await runBackPrompt(() => p.select({
        message: "Service tier",
        initialValue: settings.serviceTier ?? "inherit",
        options: [
          { value: "inherit", label: "Inherit", hint: "Do not force Fast mode; use the surrounding Codex/project setting" },
          { value: "default", label: "Standard", hint: "Explicitly disable Fast/Flex for YAAW turns" },
          { value: "fast", label: "Fast", hint: "Lower latency with higher usage/cost where supported" },
          { value: "flex", label: "Flex", hint: "Lower-cost, higher-latency processing where supported" },
          backOption()
        ]
      }));
      if (result.kind === "cancel") return navigationCancel();
      if (result.kind === "back" || result.value === "back") continue;
      settings.serviceTier = result.value === "inherit" ? null : result.value as CodexRuntimeSettings["serviceTier"];
      continue;
    }

    if (choice === "web") {
      const result = await runBackPrompt(() => p.select({
        message: "Web search",
        initialValue: settings.webSearch ?? "inherit",
        options: [
          { value: "inherit", label: "Inherit" },
          { value: "disabled", label: "Disabled" },
          { value: "cached", label: "Cached" },
          { value: "indexed", label: "Indexed" },
          { value: "live", label: "Live" },
          backOption()
        ]
      }));
      if (result.kind === "cancel") return navigationCancel();
      if (result.kind === "back" || result.value === "back") continue;
      settings.webSearch = result.value === "inherit" ? null : result.value as CodexRuntimeSettings["webSearch"];
    }
  }
}

async function editFailureFallback(settings: CodexRuntimeSettings): Promise<NavigationResult<void>> {
  while (true) {
    const threshold = settings.failureFallback.afterFailures;
    const prompt = await runBackPrompt(() => p.select({
      message: "Failure fallback",
      options: [
        { value: "threshold", label: `Escalate after            ${threshold === null ? "Disabled" : `${threshold} no-progress failures`}` },
        { value: "implementer", label: `Implementer fallback      ${pairSummary(settings.failureFallback.implementer)}` },
        { value: "reviewer", label: `Reviewer fallback         ${pairSummary(settings.failureFallback.reviewer)}` },
        backOption()
      ]
    }));
    if (prompt.kind === "cancel") return navigationCancel();
    if (prompt.kind === "back") return navigationBack();
    const choice = prompt.value;
    if (choice === "back") return navigationBack();

    if (choice === "threshold") {
      const result = await runBackPrompt(() => p.text({
        message: "Fallback threshold (blank = disabled)",
        placeholder: threshold === null ? "3" : String(threshold),
        defaultValue: threshold === null ? "" : String(threshold)
      }));
      if (result.kind === "cancel") return navigationCancel();
      if (result.kind === "back") continue;
      const raw = String(result.value).trim();
      if (!raw) {
        settings.failureFallback.afterFailures = null;
        continue;
      }
      const value = Number(raw);
      if (!Number.isInteger(value) || value < 1) {
        p.note("Enter a positive integer, or leave blank to disable fallback.", "Invalid fallback threshold");
        continue;
      }
      settings.failureFallback.afterFailures = value;
      continue;
    }

    const role = choice as "implementer" | "reviewer";
    const label = role === "implementer" ? "Implementer fallback" : "Reviewer fallback";
    const edited = await modelPair(label, settings.failureFallback[role]);
    if (edited.kind === "cancel") return navigationCancel();
    if (edited.kind === "value") settings.failureFallback[role] = edited.value;
  }
}

async function editRoleHub(settings: CodexRuntimeSettings): Promise<NavigationResult<CodexRuntimeSettings>> {
  while (true) {
    const prompt = await runBackPrompt(() => p.select({
      message: "Choose a role to edit",
      options: [
        { value: "orchestrator", label: `Orchestrator          ${pairSummary(settings.orchestrator)}` },
        { value: "defaultWorker", label: `Default worker        ${pairSummary(settings.defaultWorker)}` },
        { value: "prd", label: `PRD                   ${pairSummary(settings.roles.prd)}` },
        { value: "planner", label: `Planner               ${pairSummary(settings.roles.planner)}` },
        { value: "implementer", label: `Implementer           ${pairSummary(settings.roles.implementer)}` },
        { value: "reviewer", label: `Reviewer              ${pairSummary(settings.roles.reviewer)}` },
        { value: "fallback", label: `Failure fallback      ${settings.failureFallback.afterFailures === null ? "Disabled" : `after ${settings.failureFallback.afterFailures} failures`}` },
        { value: "advanced", label: "Advanced settings" },
        { value: "review", label: "Review and apply" },
        backOption(),
        { value: "cancel", label: "Cancel configuration" }
      ]
    }));

    if (prompt.kind === "cancel") return navigationCancel();
    if (prompt.kind === "back") return navigationBack();
    const choice = prompt.value;
    if (choice === "back") return navigationBack();
    if (choice === "cancel") return navigationCancel();
    if (choice === "review") return navigationValue(normalizeCodexRuntimeSettings(settings));
    if (choice === "advanced") {
      const advanced = await editAdvanced(settings);
      if (advanced.kind === "cancel") return navigationCancel();
      continue;
    }
    if (choice === "fallback") {
      const fallback = await editFailureFallback(settings);
      if (fallback.kind === "cancel") return navigationCancel();
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
    if (edited.kind === "cancel") return navigationCancel();
    if (edited.kind === "back") continue;
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
  settings.failureFallback = structuredClone(recommended.failureFallback);
  settings.serviceTier = recommended.serviceTier;
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
  settings.failureFallback = {
    afterFailures: null,
    implementer: inheritPair(),
    reviewer: inheritPair()
  };
  settings.serviceTier = null;
}

async function configureCustom(settings: CodexRuntimeSettings): Promise<NavigationResult<CodexRuntimeSettings>> {
  let step: "mode" | "strategy" = "mode";
  let strategyValue = "roles";

  while (true) {
    if (step === "mode") {
      const mode = await runBackPrompt(() => p.select({
        message: "Worker mode",
        initialValue: settings.mode,
        options: [
          { value: "auto", label: "Auto", hint: "Use workers when available; continue inline when safe" },
          { value: "isolated-required", label: "Require isolated workers", hint: "Stop if isolated workers are unavailable" },
          { value: "inline", label: "Inline only", hint: "Never spawn workers" },
          backOption()
        ]
      }));
      if (mode.kind === "cancel") return navigationCancel();
      if (mode.kind === "back" || mode.value === "back") return navigationBack();
      settings.mode = mode.value as CodexRuntimeSettings["mode"];
      step = "strategy";
    }

    const strategy = await runBackPrompt(() => p.select({
      message: "Model setup",
      initialValue: strategyValue,
      options: [
        { value: "recommended", label: "Recommended per-role models", hint: "Apply YAAW defaults, then edit if needed" },
        { value: "shared", label: "One model for every role", hint: "Use the same model and reasoning everywhere" },
        { value: "roles", label: "Choose models by role", hint: "Edit each YAAW role individually" },
        { value: "inherit", label: "Use Codex defaults", hint: "Do not pin models or reasoning" },
        backOption()
      ]
    }));

    if (strategy.kind === "cancel") return navigationCancel();
    if (strategy.kind === "back" || strategy.value === "back") {
      step = "mode";
      continue;
    }

    const strategyValueSelected = strategy.value;
    strategyValue = String(strategyValueSelected);

    if (strategyValueSelected === "recommended") {
      assignRecommendedModels(settings);
    } else if (strategyValueSelected === "inherit") {
      assignInheritedModels(settings);
    } else if (strategyValueSelected === "shared") {
      const shared = await modelPair("Shared worker", settings.defaultWorker);
      if (shared.kind === "cancel") return navigationCancel();
      if (shared.kind === "back") continue;
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
        message: "Choose a Codex setup",
        initialValue: setupInitialValue(context.currentProfile),
        options: [
          { value: "recommended", label: "Recommended", hint: "YAAW picks sensible models and reasoning by role" },
          { value: "inherit", label: "Use Codex defaults", hint: "Keep model and reasoning outside YAAW" },
          { value: "custom", label: "Customize", hint: "Pick worker mode and models by role" },
          { value: "inline", label: "Inline only", hint: "Run every role in this session; no workers" }
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
      p.note("YAAW will not pin models or reasoning. Your existing Codex defaults stay in control.", "Using Codex defaults");
      return { settings, profile: profile("inherit") };
    }
    if (setup === "inline") {
      const settings = { ...defaultCodexRuntimeSettings(), mode: "inline" as const };
      p.note("YAAW roles will run in this Codex session. No isolated workers are spawned.", "Inline only");
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
