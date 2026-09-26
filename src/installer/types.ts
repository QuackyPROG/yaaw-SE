import type { IntegrationConfigurationProfile, IntegrationId } from "../integrations/types.js";

export type InstallAction = "fresh" | "quick-update" | "modify" | "repair" | "uninstall";
export type InstallMode = "interactive" | "headless";
export type ConflictPolicy = "fail" | "keep" | "replace" | "backup-replace";
export type ManagedConfigScalar = string | number | boolean;

export interface ManagedConfigEntry { key: string; value: ManagedConfigScalar; }

export interface InstallContext {
  packageVersion: string;
  payloadRoot: string;
  requestedDirectory: string;
  projectRoot: string;
  mode: InstallMode;
  selectedIntegrations: IntegrationId[];
  selectedSkills: string[];
  integrationSettings: Partial<Record<IntegrationId, unknown>>;
  integrationProfiles?: Partial<Record<IntegrationId, IntegrationConfigurationProfile | null>>;
  acknowledgeConfigurationUpdates?: IntegrationId[];
  action: InstallAction;
  dryRun: boolean;
  forceManaged: boolean;
  conflictPolicy: ConflictPolicy;
}

export type InstallOperation =
  | { type: "mkdir"; path: string; owner?: string }
  | { type: "write-managed-file"; path: string; content: Buffer | string; owner: string }
  | { type: "copy-managed-file"; source: string; path: string; owner: string }
  | { type: "write-project-file-if-missing"; path: string; content: Buffer | string }
  | { type: "migrate-project-file"; path: string; content: Buffer | string; migration: string }
  | { type: "update-managed-section"; path: string; sectionId: string; content: string; owner: string }
  | { type: "update-managed-config-keys"; path: string; format: "toml"; entries: ManagedConfigEntry[]; owner: string }
  | { type: "remove-managed-config-keys"; path: string; format: "toml"; keys: string[]; owner: string }
  | { type: "remove-managed-file"; path: string; owner: string }
  | { type: "remove-runtime-file"; path: string; owner: string }
  | { type: "remove-managed-section"; path: string; sectionId: string; owner: string }
  | { type: "remove-empty-dir"; path: string; owner: string }
  | { type: "preserve"; path: string; reason: string };

export interface ConfigurationSummary {
  integrationId: IntegrationId;
  profile: string;
  description: string[];
}

export interface InstallPlan {
  action: InstallAction;
  projectRoot: string;
  operations: InstallOperation[];
  selectedIntegrations: IntegrationId[];
  selectedSkills: string[];
  warnings: string[];
  configurationSummaries?: ConfigurationSummary[];
  configurationUpdates?: ConfigurationUpdate[];
}

export interface ManagedFileRecord { owner: string; sha256: string; packageSha256?: string; localOverride?: boolean; }
export interface ManagedSectionRecord { owner: string; sha256: string; packageSha256?: string; localOverride?: boolean; }
export interface ManagedConfigKeyRecord { owner: string; sha256: string; value: ManagedConfigScalar; packageSha256?: string; localOverride?: boolean; }

export interface IntegrationConfigurationRecord {
  schema: "yaaw.integration-config/v1";
  appliedRevision: number;
  notifiedRevision: number;
  profile: IntegrationConfigurationProfile | null;
  settings: unknown;
}

export interface IntegrationInstallationRecord {
  adapterVersion: number;
  skillsRoot: string;
  bootstrap: string;
  configuration?: IntegrationConfigurationRecord;
  /** Temporary compatibility mirror for pre-lifecycle consumers. */
  runtime?: unknown;
}

export interface InstallationManifest {
  schema: "yaaw.installation/v2";
  yaawVersion: string;
  systemSchema: number;
  installationSchema: number;
  projectSchema: number;
  installedAt: string;
  updatedAt: string;
  project: { root: "." };
  integrations: Record<string, IntegrationInstallationRecord>;
  skills: string[];
  managedFiles: Record<string, ManagedFileRecord>;
  managedSections: Record<string, Record<string, ManagedSectionRecord>>;
  managedConfigKeys: Record<string, Record<string, ManagedConfigKeyRecord>>;
}

export interface ConfigurationUpdate {
  integrationId: IntegrationId;
  displayName: string;
  appliedRevision: number;
  notifiedRevision: number;
  availableRevision: number;
  changes: import("../integrations/types.js").IntegrationConfigChange[];
  command: string;
}
