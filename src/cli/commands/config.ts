import * as p from "@clack/prompts";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { detectExistingInstallation } from "../../installer/detect.js";
import { resolveProjectRoot } from "../../installer/boundary.js";
import { payloadRoot as getPayloadRoot } from "../../installer/context.js";
import { MANIFEST_RELATIVE_PATH, serializeManifest } from "../../installer/manifest.js";
import { buildConfigurationPlan, configurationStateFor } from "../../installer/configuration.js";
import { migrateInstallationManifest } from "../../installer/migrations/installation/index.js";
import { executePlan, preflightPlan } from "../../installer/transaction.js";
import { configurableIntegrations, getIntegration, resolveIntegrationId } from "../../integrations/registry.js";
import type { IntegrationConfigurationProfile, IntegrationId } from "../../integrations/types.js";
import type { ConflictPolicy } from "../../installer/types.js";
import { configureIntegration } from "../../tui/configure-integration.js";
import { confirmConfiguration } from "../../tui/confirm-configuration.js";

export interface ConfigCommandOptions { directory?: string; yes?: boolean; json?: boolean; config?: string; conflictPolicy?: ConflictPolicy; }

export async function configureProjectIntegration(input: {
  projectRoot: string;
  integrationId: IntegrationId;
  reason: "manual" | "update";
  interactive: boolean;
  configPath?: string;
  conflictPolicy?: ConflictPolicy;
  showIntro?: boolean;
}) {
  const existing = await detectExistingInstallation(input.projectRoot);
  if (existing.kind !== "valid" || !existing.manifest) throw new Error("YAAW-SE is not installed in this project.");
  const manifest = migrateInstallationManifest(existing.manifest);
  const record = manifest.integrations[input.integrationId];
  if (!record) throw new Error(`${getIntegration(input.integrationId).displayName} is not installed in this project.`);
  const adapter = getIntegration(input.integrationId);
  const capability = adapter.configuration;
  if (!capability) throw new Error(`${adapter.displayName} is installed but does not expose YAAW configuration yet.`);

  const currentSettings = record.configuration?.settings ?? record.runtime ?? capability.defaultSettings();
  const currentProfile = record.configuration?.profile ?? null;
  const state = configurationStateFor(manifest, input.integrationId);
  const pendingChanges = capability.changes.filter(change => change.revision > (record.configuration?.appliedRevision ?? 0));

  let settings: unknown;
  let profile: IntegrationConfigurationProfile | null;
  if (input.interactive) {
    if (input.showIntro !== false) p.intro(`YAAW-SE — ${adapter.displayName} configuration`);
    if (state?.updateAvailable) {
      p.note([`Project: ${input.projectRoot}`, `Current configuration revision: ${state.appliedRevision}`, `Latest supported revision: ${state.availableRevision}`, "", "New since your current configuration:", ...pendingChanges.map(change => `  ${change.title}`)].join("\n"), `${adapter.displayName} configuration`);
    }
    const selection = await configureIntegration(input.integrationId, currentSettings, { reason: input.reason, availableRevision: capability.revision, pendingChanges, currentProfile });
    if (selection.cancelled) return { cancelled: true };
    settings = selection.settings;
    profile = selection.profile;
  } else {
    if (!input.configPath) throw new Error("Headless configuration requires --config <path>.");
    const parsed = JSON.parse(await readFile(resolve(input.configPath), "utf8"));
    settings = capability.parseHeadless ? capability.parseHeadless(parsed) : capability.normalize(parsed);
    profile = { id: "custom", revision: capability.revision };
  }

  const conflictPolicy = input.conflictPolicy ?? "fail";
  const built = await buildConfigurationPlan({ projectRoot: input.projectRoot, payloadRoot: getPayloadRoot(), integrationId: input.integrationId, settings, profile, conflictPolicy, manifest });
  await preflightPlan(built.plan);

  if (input.interactive && !(await confirmConfiguration({ projectRoot: input.projectRoot, integrationId: input.integrationId, currentSettings, newSettings: settings, currentProfile, newProfile: profile }))) return { cancelled: true };

  const manifestPath = join(input.projectRoot, MANIFEST_RELATIVE_PATH);
  const changed = await executePlan(built.plan, {
    manifestPath,
    manifestContent: serializeManifest(built.manifest),
    beforeManifest: async () => {
      const verification = await capability.verify?.({ projectRoot: input.projectRoot, payloadRoot: getPayloadRoot(), settings });
      if (verification && !verification.healthy) throw new Error(`${adapter.displayName} configuration verification failed: ${verification.issues.join("; ")}`);
    }
  } as any);

  if (input.interactive) {
    p.note([`Project: ${input.projectRoot}`, `Profile: ${profile?.id ?? "custom"}`, `Configuration revision: ${capability.revision}`, "", "Preserved:", "  user-owned provider settings", "  unrelated integrations", "  durable project memory", ...(input.integrationId === "codex" ? ["", "Start a new Codex session/task for project settings to reload."] : [])].join("\n"), `${adapter.displayName} configuration updated`);
  }
  return { ok: true, integrationId: input.integrationId, changed, revision: capability.revision, profile };
}

export async function runConfig(integration: string | undefined, options: ConfigCommandOptions = {}) {
  const interactive = !options.yes;
  const projectRoot = await resolveProjectRoot(options.directory ?? process.cwd());
  const existing = await detectExistingInstallation(projectRoot);
  if (existing.kind !== "valid" || !existing.manifest) throw new Error("YAAW-SE is not installed in this project.");
  const manifest = migrateInstallationManifest(existing.manifest);

  let integrationId: IntegrationId;
  if (integration) integrationId = resolveIntegrationId(integration);
  else {
    const configurable = configurableIntegrations(Object.keys(manifest.integrations));
    if (!configurable.length) {
      const message = "No configurable YAAW integrations are installed in this project. Use: yaaw install";
      if (options.json) console.log(JSON.stringify({ ok: false, message })); else console.log(message);
      return { ok: false, message };
    }
    if (configurable.length === 1) integrationId = configurable[0].id;
    else {
      if (!interactive) throw new Error("Headless yaaw config requires an integration argument.");
      p.intro("YAAW-SE — Project configuration");
      const selected = await p.select({ message: "Which integration would you like to configure?", options: configurable.map(adapter => ({ value: adapter.id, label: adapter.displayName })) });
      if (p.isCancel(selected)) return;
      integrationId = selected as IntegrationId;
    }
  }

  if (!manifest.integrations[integrationId]) throw new Error(`${getIntegration(integrationId).displayName} is not installed in this project. Use yaaw install to modify integrations.`);
  const result = await configureProjectIntegration({ projectRoot, integrationId, reason: "manual", interactive, configPath: options.config, conflictPolicy: options.conflictPolicy, showIntro: true });
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else if (interactive && result && !("cancelled" in result)) p.outro("Configuration updated and verified.");
  return result;
}
