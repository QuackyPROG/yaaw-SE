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

export interface IntegrationAdapter {
  id: IntegrationId;
  displayName: string;
  maturity: "stable" | "experimental";
  adapterVersion: number;
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
