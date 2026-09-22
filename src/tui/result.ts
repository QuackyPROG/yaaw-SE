import * as p from "@clack/prompts";
import { integrations } from "../integrations/registry.js";
import type { IntegrationId } from "../integrations/types.js";

export function showSuccess(projectRoot: string, selected: IntegrationId[]) {
  const hints = selected.map(id=>`${integrations[id].displayName}: ${integrations[id].invocationHint("yaaw-orchestrator")}`).join("\n");
  p.note([`Project: ${projectRoot}`, hints].filter(Boolean).join("\n"), "YAAW-SE is ready");
  p.outro("Installation verified.");
}
