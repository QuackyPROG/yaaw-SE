import { codexAdapter } from "./codex.js";
import { claudeCodeAdapter } from "./claude-code.js";
import { geminiCliAdapter } from "./gemini-cli.js";
import { clineAdapter } from "./cline.js";
import type { IntegrationAdapter, IntegrationId } from "./types.js";

export const integrations: Record<IntegrationId, IntegrationAdapter> = {
  codex: codexAdapter,
  "claude-code": claudeCodeAdapter,
  "gemini-cli": geminiCliAdapter,
  cline: clineAdapter
};

export const integrationIds = Object.keys(integrations) as IntegrationId[];

export function getIntegration(id: string): IntegrationAdapter {
  const adapter = integrations[id as IntegrationId];
  if (!adapter) throw new Error(`Unknown integration: ${id}`);
  return adapter;
}
