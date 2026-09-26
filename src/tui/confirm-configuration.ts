import * as p from "@clack/prompts";
import { getIntegration } from "../integrations/registry.js";
import type { IntegrationConfigurationProfile, IntegrationId } from "../integrations/types.js";
import { backOption, runBackPrompt } from "./prompt-navigation.js";

export type ConfigurationConfirmation = "apply" | "back" | "cancel";

export async function confirmConfiguration(input: {
  projectRoot: string;
  integrationId: IntegrationId;
  currentSettings: unknown;
  newSettings: unknown;
  currentProfile: IntegrationConfigurationProfile | null;
  newProfile: IntegrationConfigurationProfile | null;
}): Promise<ConfigurationConfirmation> {
  const adapter = getIntegration(input.integrationId);
  const describe = adapter.configuration?.describe ?? (() => []);
  const current = describe(input.currentSettings);
  const next = describe(input.newSettings);
  const currentProfile = input.currentProfile ? `${input.currentProfile.id} r${input.currentProfile.revision}` : "custom";
  const newProfile = input.newProfile ? `${input.newProfile.id} r${input.newProfile.revision}` : "custom";

  const changes: string[] = [];
  for (let index = 0; index < Math.max(current.length, next.length); index++) {
    const before = current[index];
    const after = next[index];
    if (before === after || after === undefined) continue;
    const separator = after.indexOf(":");
    if (before !== undefined && separator > 0 && before.startsWith(after.slice(0, separator + 1))) {
      changes.push(`${before} → ${after.slice(separator + 1).trim()}`);
    } else {
      changes.push(before === undefined ? after : `${before} → ${after}`);
    }
  }

  const lines = [
    `Project: ${input.projectRoot}`,
    `Profile: ${currentProfile === newProfile ? newProfile : `${currentProfile} → ${newProfile}`}`,
    "",
    ...(changes.length ? ["Changes:", ...changes.map(line => `  ${line}`)] : ["No runtime setting changes."]),
    "",
    `Only YAAW-managed ${adapter.displayName} settings will be updated.`
  ];
  p.note(lines.join("\n"), `Review ${adapter.displayName} settings`);

  const result = await runBackPrompt(() => p.select({
    message: "Apply these settings?",
    initialValue: "apply",
    options: [
      { value: "apply", label: "Apply configuration" },
      backOption("← Back to edit"),
      { value: "cancel", label: "Cancel configuration" }
    ]
  }));
  if (result.kind === "back") return "back";
  if (result.kind === "cancel") return "cancel";
  return result.value as ConfigurationConfirmation;
}
