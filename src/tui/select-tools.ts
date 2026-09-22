import * as p from "@clack/prompts";
import { integrationIds, integrations } from "../integrations/registry.js";
import type { IntegrationId } from "../integrations/types.js";

export async function selectTools(projectRoot: string, initial: IntegrationId[] = []): Promise<IntegrationId[]> {
  const detections = await Promise.all(integrationIds.map(async id => [id, await integrations[id].detect(projectRoot)] as const));
  const selected = await p.multiselect({
    message: "Which AI coding tools should use YAAW-SE?",
    required: true,
    initialValues: initial,
    options: detections.map(([id, detection]) => ({
      value: id,
      label: integrations[id].displayName,
      hint: detection.detected ? "detected" : undefined
    }))
  });
  if (p.isCancel(selected)) throw new Error("Installation cancelled");
  return selected as IntegrationId[];
}
