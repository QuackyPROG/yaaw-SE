import type { IntegrationId } from "../integrations/types.js";

export type InstallAction = "fresh" | "quick-update" | "modify" | "repair" | "uninstall";
export type InstallMode = "interactive" | "headless";
export type ConflictPolicy = "fail" | "keep" | "replace" | "backup-replace";

export interface InstallContext {
  packageVersion: string;
  payloadRoot: string;
  requestedDirectory: string;
  projectRoot: string;
  mode: InstallMode;
  selectedIntegrations: IntegrationId[];
  selectedSkills: string[];
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
  | { type: "update-managed-section"; path: string; sectionId: string; content: string; owner: string }
  | { type: "remove-managed-file"; path: string; owner: string }
  | { type: "remove-managed-section"; path: string; sectionId: string; owner: string }
  | { type: "remove-empty-dir"; path: string; owner: string }
  | { type: "preserve"; path: string; reason: string };

export interface InstallPlan {
  action: InstallAction;
  projectRoot: string;
  operations: InstallOperation[];
  selectedIntegrations: IntegrationId[];
  selectedSkills: string[];
  warnings: string[];
}

export interface ManagedFileRecord {
  owner: string;
  sha256: string;
  packageSha256?: string;
  localOverride?: boolean;
}

export interface ManagedSectionRecord {
  owner: string;
  sha256: string;
  packageSha256?: string;
  localOverride?: boolean;
}

export interface InstallationManifest {
  schema: "yaaw.installation/v1";
  yaawVersion: string;
  installationSchema: 1;
  projectStateSchema: 1;
  installedAt: string;
  updatedAt: string;
  project: { root: "." };
  integrations: Record<string, {
    adapterVersion: number;
    skillsRoot: string;
    bootstrap: string;
  }>;
  skills: string[];
  managedFiles: Record<string, ManagedFileRecord>;
  managedSections: Record<string, Record<string, ManagedSectionRecord>>;
}
