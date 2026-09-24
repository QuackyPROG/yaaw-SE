import * as p from "@clack/prompts";
import type { ConfigurationUpdate } from "../installer/types.js";
import type { IntegrationId } from "../integrations/types.js";

export function formatConfigurationUpdates(updates: ConfigurationUpdate[]): string {
  return updates.flatMap(update => [
    update.displayName,
    ...update.changes.map(change => `  ${change.title}: ${change.summary}`),
    "  Current configuration was preserved.",
    `  Review: ${update.command}`,
    ""
  ]).join("\n").trim();
}

export async function promptConfigurationUpdates(updates: ConfigurationUpdate[]): Promise<IntegrationId[]> {
  if (!updates.length) return [];
  p.note(formatConfigurationUpdates(updates), updates.length === 1 ? `New ${updates[0].displayName} configuration available` : "Provider configuration updates available");
  if (updates.length === 1) {
    const answer = await p.select({
      message: `Configure ${updates[0].displayName} now?`,
      initialValue: "later",
      options: [{ value: "now", label: "Yes" }, { value: "later", label: "Later" }]
    });
    return !p.isCancel(answer) && answer === "now" ? [updates[0].integrationId] : [];
  }
  const answer = await p.select({
    message: "Configure integrations now?",
    initialValue: "later",
    options: [{ value: "choose", label: "Choose integrations" }, { value: "later", label: "Later" }]
  });
  if (p.isCancel(answer) || answer === "later") return [];
  const selected = await p.multiselect({
    message: "Which integrations should be configured?",
    required: false,
    options: updates.map(update => ({ value: update.integrationId, label: update.displayName }))
  });
  return p.isCancel(selected) ? [] : selected as IntegrationId[];
}
