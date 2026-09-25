import { defaultCodexRuntimeSettings, normalizeCodexRuntimeSettings, type CodexRuntimeSettings } from "./codex-runtime.js";
import type { IntegrationConfigChange } from "./types.js";

export interface CodexModelCapability {
  id: string;
  label: string;
  status: "recommended" | "supported" | "legacy" | "deprecated";
  introducedRevision: number;
  reasoningEfforts: string[];
  description: string;
}

export interface CodexProfile {
  id: string;
  revision: number;
  label: string;
  description: string;
  settings: CodexRuntimeSettings;
}

export const CODEX_CONFIGURATION_REVISION = 4;

export const codexReasoningEfforts = ["low", "medium", "high", "xhigh", "max"] as const;

export const codexConfigurationChanges: IntegrationConfigChange[] = [
  {
    revision: 4,
    id: "codex-gpt6-astra-support",
    type: "model-support",
    title: "GPT-6 Astra support",
    summary: "YAAW now exposes GPT-6 Astra and its low through max reasoning efforts for Codex 0.153.0+."
  },
  {
    revision: 4,
    id: "codex-authority-failure-fallback",
    type: "new-capability",
    title: "Implementer and Reviewer Astra fallback",
    summary: "Recommended Codex configuration escalates repeated no-progress Implementer/Reviewer execution failures to GPT-6 Astra after three primary attempts."
  },
  {
    revision: 4,
    id: "codex-service-tier-control",
    type: "new-capability",
    title: "Codex service tier control",
    summary: "Custom configuration can inherit, force Standard, enable Fast, or select Flex service tier. Recommended does not force Fast mode."
  },
  {
    revision: 3,
    id: "codex-max-reasoning",
    type: "model-support",
    title: "Expanded GPT-6 reasoning effort support",
    summary: "YAAW now exposes low, medium, high, xhigh, and max reasoning effort for GPT-6 Sol and GPT-6 Luna."
  },
  {
    revision: 2,
    id: "codex-gpt6-support",
    type: "model-support",
    title: "GPT-6 model support",
    summary: "YAAW now includes GPT-6 Sol and GPT-6 Luna Codex profiles."
  },
  {
    revision: 2,
    id: "codex-recommended-v2",
    type: "recommended-default",
    title: "Recommended Codex role profile",
    summary: "YAAW now provides a curated role-by-role Recommended profile."
  }
];

export const codexModels: CodexModelCapability[] = [
  {
    id: "gpt-6-astra",
    label: "GPT-6 Astra",
    status: "recommended",
    introducedRevision: 4,
    reasoningEfforts: [...codexReasoningEfforts],
    description: "Highest-capability model for difficult end-to-end coding and escalation; requires Codex 0.153.0+."
  },
  {
    id: "gpt-6-sol",
    label: "GPT-6 Sol",
    status: "supported",
    introducedRevision: 2,
    reasoningEfforts: [...codexReasoningEfforts],
    description: "Balanced default for complex software engineering."
  },
  {
    id: "gpt-6-luna",
    label: "GPT-6 Luna",
    status: "supported",
    introducedRevision: 2,
    reasoningEfforts: [...codexReasoningEfforts],
    description: "Faster/lower-cost option for bounded work."
  }
];

const recommendedSettings: CodexRuntimeSettings = normalizeCodexRuntimeSettings({
  mode: "auto",
  orchestrator: { model: "gpt-6-sol", reasoning: "high" },
  defaultWorker: { model: "gpt-6-sol", reasoning: "medium" },
  roles: {
    prd: { model: "gpt-6-sol", reasoning: "medium" },
    planner: { model: "gpt-6-sol", reasoning: "high" },
    implementer: { model: "gpt-6-sol", reasoning: "medium" },
    reviewer: { model: "gpt-6-sol", reasoning: "high" }
  },
  failureFallback: {
    afterFailures: 3,
    implementer: { model: "gpt-6-astra", reasoning: "high" },
    reviewer: { model: "gpt-6-astra", reasoning: "high" }
  },
  serviceTier: null,
  maxConcurrentThreads: 4,
  sandboxMode: null,
  approvalPolicy: null,
  webSearch: null
});

export const codexProfiles: CodexProfile[] = [
  { id: "recommended", revision: CODEX_CONFIGURATION_REVISION, label: "Recommended", description: "YAAW-managed worker configuration with recommended models.", settings: recommendedSettings },
  { id: "inherit", revision: CODEX_CONFIGURATION_REVISION, label: "Inherit Codex defaults", description: "Keep model and reasoning selection outside YAAW.", settings: defaultCodexRuntimeSettings() },
  { id: "inline", revision: CODEX_CONFIGURATION_REVISION, label: "Inline only", description: "Run authority roles in the current Codex session.", settings: { ...defaultCodexRuntimeSettings(), mode: "inline" } }
];

export function getCodexModel(id: string | null): CodexModelCapability | undefined {
  if (!id) return undefined;
  return codexModels.find(model => model.id === id);
}

export function getCodexProfile(id: string): CodexProfile | undefined {
  return codexProfiles.find(profile => profile.id === id);
}

export function recommendedCodexProfile(): CodexProfile {
  return getCodexProfile("recommended")!;
}
