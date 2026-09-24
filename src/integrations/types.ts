import type { InstallOperation } from "../installer/types.js";

export type IntegrationId = "codex" | "claude-code" | "gemini-cli" | "cline";

export interface DetectionResult {
  detected: boolean;
  signals: string[];
}

export interface IntegrationContext {
  projectRoot: string;
  payloadRoot: string;
  settings?: unknown;
}

export interface IntegrationVerification {
  healthy: boolean;
  issues: string[];
}

export interface CanonicalSkill {
  id: string;
  source: string;
}

export type IntegrationConfigChangeType =
  | "model-support"
  | "profile-change"
  | "new-capability"
  | "deprecated-model"
  | "removed-model"
  | "recommended-default"
  | "breaking-change";

export interface IntegrationConfigChange {
  revision: number;
  id: string;
  type: IntegrationConfigChangeType;
  title: string;
  summary: string;
}

export interface IntegrationConfigurationProfile {
  id: string;
  revision: number;
}

export interface ConfigurationContext {
  reason: "fresh" | "modify" | "manual" | "update";
  availableRevision: number;
  pendingChanges: IntegrationConfigChange[];
  currentProfile?: IntegrationConfigurationProfile | null;
}

export interface ConfigurationSelection {
  settings: unknown;
  profile: IntegrationConfigurationProfile | null;
  cancelled?: boolean;
}

export interface IntegrationConfigurationCapability {
  revision: number;
  changes: IntegrationConfigChange[];
  defaultSettings(): unknown;
  normalize(settings: unknown): unknown;
  describe(settings: unknown): string[];
  parseHeadless?(value: unknown): unknown;
  configureInteractive?(
    current: unknown,
    context: ConfigurationContext
  ): Promise<ConfigurationSelection>;
  plan(context: IntegrationContext): Promise<InstallOperation[]>;
  verify?(context: IntegrationContext): Promise<IntegrationVerification>;
}

export interface IntegrationAdapter {
  id: IntegrationId;
  aliases?: string[];
  displayName: string;
  maturity: "stable" | "experimental";
  adapterVersion: number;
  configuration?: IntegrationConfigurationCapability;
  detect(projectRoot: string): Promise<DetectionResult>;
  skillsRoot(projectRoot: string): string;
  bootstrapRelativePath: string;
  planBootstrap(ctx: IntegrationContext): Promise<InstallOperation[]>;
  planSkills(ctx: IntegrationContext, skills: CanonicalSkill[]): Promise<InstallOperation[]>;
  planRuntime?(ctx: IntegrationContext): Promise<InstallOperation[]>;
  verify(ctx: IntegrationContext, selectedSkillIds: string[]): Promise<IntegrationVerification>;
  verifyRuntime?(ctx: IntegrationContext): Promise<IntegrationVerification>;
  describeRuntime?(settings: unknown): string[];
  invocationHint(skillName: string): string;
}
