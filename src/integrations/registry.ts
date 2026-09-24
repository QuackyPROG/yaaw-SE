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

const integrationAliases = new Map<string, IntegrationId>();
for (const id of integrationIds) {
  integrationAliases.set(id, id);
  for (const alias of integrations[id].aliases ?? []) integrationAliases.set(alias, id);
}

export function resolveIntegrationId(input: string): IntegrationId {
  const normalized = input.trim().toLowerCase();
  const id = integrationAliases.get(normalized);
  if (!id) throw new Error(`Unknown integration: ${input}`);
  return id;
}

export function getIntegration(id: string): IntegrationAdapter {
  return integrations[resolveIntegrationId(id)];
}

export function configurableIntegrations(installed?: Iterable<string>): IntegrationAdapter[] {
  const installedSet = installed ? new Set([...installed].map(resolveIntegrationId)) : null;
  return integrationIds
    .filter(id => !installedSet || installedSet.has(id))
    .map(id => integrations[id])
    .filter(adapter => Boolean(adapter.configuration?.configureInteractive));
}
