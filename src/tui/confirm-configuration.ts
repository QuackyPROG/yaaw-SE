import * as p from "@clack/prompts";
import { getIntegration } from "../integrations/registry.js";
import type { IntegrationConfigurationProfile, IntegrationId } from "../integrations/types.js";

export async function confirmConfiguration(input: {
  projectRoot: string;
  integrationId: IntegrationId;
  currentSettings: unknown;
  newSettings: unknown;
  currentProfile: IntegrationConfigurationProfile | null;
  newProfile: IntegrationConfigurationProfile | null;
}): Promise<boolean> {
  const adapter = getIntegration(input.integrationId);
  const describe = adapter.configuration?.describe ?? (() => []);
  const lines = [
    `Project: ${input.projectRoot}`,
    "",
    "Current:",
    `  Profile: ${input.currentProfile ? `${input.currentProfile.id} r${input.currentProfile.revision}` : "custom"}`,
    ...describe(input.currentSettings).map(line => `  ${line}`),
    "",
    "New:",
    `  Profile: ${input.newProfile ? `${input.newProfile.id} r${input.newProfile.revision}` : "custom"}`,
    ...describe(input.newSettings).map(line => `  ${line}`),
    "",
    "Will:",
    `  Update YAAW-managed ${adapter.displayName} configuration`,
    "  Preserve user-owned provider settings",
    "  Preserve unrelated integrations and project memory"
  ];
  p.note(lines.join("\n"), `${adapter.displayName} configuration change`);
  const result = await p.confirm({ message: "Apply configuration?", initialValue: true });
  return !p.isCancel(result) && Boolean(result);
}
