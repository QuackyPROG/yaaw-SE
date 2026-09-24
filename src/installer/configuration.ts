import { relative } from "node:path";
import { getIntegration } from "../integrations/registry.js";
import type { IntegrationConfigurationProfile, IntegrationId } from "../integrations/types.js";
import type { ConfigurationUpdate, ConflictPolicy, InstallContext, InstallOperation, InstallPlan, InstallationManifest } from "./types.js";
import { chooseManagedConfigKeys, chooseManagedFile, chooseManagedSection, ManagedConflictError, protectConfigRemoval } from "./plan.js";
import { migrateInstallationManifest } from "./migrations/installation/index.js";

function rel(projectRoot: string, path: string): string {
  return relative(projectRoot, path).replaceAll("\\", "/");
}

export function configurationStateFor(manifest: InstallationManifest, integrationId: IntegrationId) {
  const migrated = migrateInstallationManifest(manifest);
  const adapter = getIntegration(integrationId);
  const configuration = migrated.integrations[integrationId]?.configuration;
  const availableRevision = adapter.configuration?.revision ?? null;
  if (!configuration || availableRevision === null) return null;
  return {
    appliedRevision: configuration.appliedRevision,
    notifiedRevision: configuration.notifiedRevision,
    availableRevision,
    updateAvailable: availableRevision > configuration.appliedRevision,
    notificationPending: availableRevision > configuration.notifiedRevision,
    profile: configuration.profile
  };
}

export function configurationStatus(manifest: InstallationManifest) {
  const result: Record<string, ReturnType<typeof configurationStateFor>> = {};
  for (const id of Object.keys(manifest.integrations) as IntegrationId[]) {
    const state = configurationStateFor(manifest, id);
    if (state) result[id] = state;
  }
  return result;
}

export function detectConfigurationUpdates(manifest: InstallationManifest): ConfigurationUpdate[] {
  const migrated = migrateInstallationManifest(manifest);
  const updates: ConfigurationUpdate[] = [];
  for (const integrationId of Object.keys(migrated.integrations) as IntegrationId[]) {
    const adapter = getIntegration(integrationId);
    const capability = adapter.configuration;
    const current = migrated.integrations[integrationId]?.configuration;
    if (!capability || !current || capability.revision <= current.notifiedRevision) continue;
    updates.push({
      integrationId,
      displayName: adapter.displayName,
      appliedRevision: current.appliedRevision,
      notifiedRevision: current.notifiedRevision,
      availableRevision: capability.revision,
      changes: capability.changes.filter(change => change.revision > current.notifiedRevision && change.revision <= capability.revision),
      command: `yaaw config ${integrationId}`
    });
  }
  return updates;
}

export function applyConfigurationRevision(
  record: InstallationManifest["integrations"][string],
  revision: number,
  settings: unknown,
  profile: IntegrationConfigurationProfile | null
) {
  record.configuration = {
    schema: "yaaw.integration-config/v1",
    appliedRevision: revision,
    notifiedRevision: revision,
    profile,
    settings
  };
  record.runtime = settings;
}

export interface BuildConfigurationPlanInput {
  projectRoot: string;
  payloadRoot: string;
  integrationId: IntegrationId;
  settings: unknown;
  profile: IntegrationConfigurationProfile | null;
  conflictPolicy: ConflictPolicy;
  manifest: InstallationManifest;
}

export async function buildConfigurationPlan(input: BuildConfigurationPlanInput): Promise<{ plan: InstallPlan; manifest: InstallationManifest }> {
  const previous = migrateInstallationManifest(input.manifest);
  const adapter = getIntegration(input.integrationId);
  const capability = adapter.configuration;
  if (!capability) throw new Error(`${adapter.displayName} does not expose YAAW configuration.`);

  const ctx: InstallContext = {
    packageVersion: previous.yaawVersion,
    payloadRoot: input.payloadRoot,
    requestedDirectory: input.projectRoot,
    projectRoot: input.projectRoot,
    mode: "interactive",
    selectedIntegrations: [input.integrationId],
    selectedSkills: previous.skills,
    integrationSettings: { [input.integrationId]: input.settings },
    integrationProfiles: { [input.integrationId]: input.profile },
    action: "modify",
    dryRun: false,
    forceManaged: false,
    conflictPolicy: input.conflictPolicy
  };

  const manifest = structuredClone(previous) as InstallationManifest;
  const operations: InstallOperation[] = [{ type: "mkdir", path: input.projectRoot, owner: "layout" }];
  const conflicts: string[] = [];
  const now = new Date().toISOString();
  const backupStamp = now.replace(/[:.]/g, "-");
  const desiredConfigKeys = new Map<string, Set<string>>();
  const configOps = await capability.plan({
    projectRoot: input.projectRoot,
    payloadRoot: input.payloadRoot,
    settings: capability.normalize(input.settings)
  });

  for (const op of configOps) {
    if (op.type === "write-managed-file") {
      await chooseManagedFile({ ctx, previous, path: op.path, owner: op.owner, content: op.content, operations, records: manifest.managedFiles, conflicts, backupStamp });
    } else if (op.type === "copy-managed-file") {
      await chooseManagedFile({ ctx, previous, path: op.path, owner: op.owner, source: op.source, operations, records: manifest.managedFiles, conflicts, backupStamp });
    } else if (op.type === "update-managed-section") {
      await chooseManagedSection({ ctx, previous, op, sectionRecords: manifest.managedSections, operations, conflicts, backupStamp });
    } else if (op.type === "update-managed-config-keys") {
      const pathRel = rel(input.projectRoot, op.path);
      desiredConfigKeys.set(pathRel, new Set(op.entries.map(entry => entry.key)));
      await chooseManagedConfigKeys({ ctx, previous, op, configRecords: manifest.managedConfigKeys, operations, conflicts, backupStamp });
    }
  }

  const owner = `integration:${input.integrationId}`;
  for (const [pathRel, records] of Object.entries(previous.managedConfigKeys ?? {})) {
    if (!desiredConfigKeys.has(pathRel)) continue;
    const desired = desiredConfigKeys.get(pathRel)!;
    const obsolete = Object.fromEntries(Object.entries(records).filter(([key, record]) => record.owner === owner && !desired.has(key)));
    if (!Object.keys(obsolete).length) continue;
    await protectConfigRemoval({ ctx, pathRel, records: obsolete, operations, conflicts, backupStamp });
    for (const key of Object.keys(obsolete)) delete manifest.managedConfigKeys[pathRel]?.[key];
  }

  if (conflicts.length) throw new ManagedConflictError(conflicts);

  const record = manifest.integrations[input.integrationId];
  if (!record) throw new Error(`${adapter.displayName} is not installed in this project.`);
  const normalized = capability.normalize(input.settings);
  applyConfigurationRevision(record, capability.revision, normalized, input.profile);
  manifest.updatedAt = now;

  return {
    plan: {
      action: "modify",
      projectRoot: input.projectRoot,
      operations,
      selectedIntegrations: [input.integrationId],
      selectedSkills: [],
      warnings: [],
      configurationSummaries: [{
        integrationId: input.integrationId,
        profile: input.profile ? `${input.profile.id} r${input.profile.revision}` : "custom",
        description: capability.describe(normalized)
      }]
    },
    manifest
  };
}
