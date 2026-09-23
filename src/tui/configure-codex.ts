import * as p from "@clack/prompts";
import { defaultCodexRuntimeSettings, normalizeCodexRuntimeSettings, type CodexRuntimeSettings } from "../integrations/codex-runtime.js";

async function optionalText(message: string, current: string | null): Promise<string | null> {
  const result = await p.text({
    message,
    placeholder: current ?? "inherit",
    defaultValue: current ?? ""
  });
  if (p.isCancel(result)) return current;
  const value = String(result).trim();
  return value ? value : null;
}

async function modelPair(label: string, current: {model:string|null;reasoning:string|null}) {
  p.note("Leave blank to inherit the active Codex/project/user setting.", label);
  return {
    model: await optionalText(`${label} model ID`, current.model),
    reasoning: await optionalText(`${label} reasoning effort`, current.reasoning)
  };
}

export async function configureCodexRuntime(current?: unknown): Promise<CodexRuntimeSettings> {
  const base = normalizeCodexRuntimeSettings(current ?? defaultCodexRuntimeSettings());
  const setup = await p.select({
    message: "Configure Codex runtime for YAAW-SE?",
    initialValue: "recommended",
    options: [
      { value: "recommended", label: "Yes — isolated workers with configurable overrides" },
      { value: "minimal", label: "Minimal — auto runtime, inherit all Codex settings" },
      { value: "inline", label: "Legacy inline execution" }
    ]
  });
  if (p.isCancel(setup) || setup === "minimal") return defaultCodexRuntimeSettings();
  if (setup === "inline") return { ...defaultCodexRuntimeSettings(), mode: "inline" };

  const mode = await p.select({
    message: "YAAW Codex execution mode",
    initialValue: base.mode,
    options: [
      { value: "auto", label: "Auto — named worker → generic worker → inline" },
      { value: "isolated-required", label: "Require isolated workers — block when unavailable" },
      { value: "inline", label: "Inline only — do not spawn YAAW authority workers" }
    ]
  });
  if (p.isCancel(mode)) return base;

  const customize = await p.confirm({ message: "Customize models/reasoning or advanced Codex settings?", initialValue: false });
  if (p.isCancel(customize) || !customize) return { ...base, mode: mode as CodexRuntimeSettings["mode"] };

  const orchestrator = await modelPair("Orchestrator", base.orchestrator);
  const defaultWorker = await modelPair("Default fallback worker", base.defaultWorker);
  const perRole = await p.confirm({ message: "Customize individual YAAW worker roles?", initialValue: false });
  const roles = { ...base.roles };
  if (!p.isCancel(perRole) && perRole) {
    roles.prd = await modelPair("PRD", base.roles.prd);
    roles.planner = await modelPair("Planner", base.roles.planner);
    roles.implementer = await modelPair("Implementer", base.roles.implementer);
    roles.reviewer = await modelPair("Reviewer", base.roles.reviewer);
  }

  const maxRaw = await optionalText("Concurrent Codex agent threads (blank = inherit)", base.maxConcurrentThreads === null ? null : String(base.maxConcurrentThreads));
  const web = await p.select({
    message: "Codex web search",
    initialValue: base.webSearch ?? "inherit",
    options: [
      { value: "inherit", label: "Inherit" },
      { value: "disabled", label: "Disabled" },
      { value: "cached", label: "Cached" },
      { value: "indexed", label: "Indexed" },
      { value: "live", label: "Live" }
    ]
  });

  return normalizeCodexRuntimeSettings({
    ...base,
    mode,
    orchestrator,
    defaultWorker,
    roles,
    maxConcurrentThreads: maxRaw,
    webSearch: p.isCancel(web) || web === "inherit" ? null : web
  });
}
