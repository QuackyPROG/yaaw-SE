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

export const CODEX_CONFIGURATION_REVISION = 2;

export const codexConfigurationChanges: IntegrationConfigChange[] = [
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
    id: "gpt-6-sol",
    label: "GPT-6 Sol",
    status: "recommended",
    introducedRevision: 2,
    reasoningEfforts: ["low", "medium", "high", "xhigh"],
    description: "Recommended for complex software engineering."
  },
  {
    id: "gpt-6-luna",
    label: "GPT-6 Luna",
    status: "supported",
    introducedRevision: 2,
    reasoningEfforts: ["low", "medium", "high"],
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
