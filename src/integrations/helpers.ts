import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import type { CanonicalSkill, DetectionResult, IntegrationAdapter, IntegrationContext, IntegrationId, IntegrationVerification } from "./types.js";
import type { InstallOperation } from "../installer/types.js";

const execFileAsync = promisify(execFile);

export async function pathExists(path: string): Promise<boolean> {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

export async function detectSignals(projectRoot: string, executable: string | null, paths: string[]): Promise<DetectionResult> {
  const signals: string[] = [];
  if (executable) {
    try {
      await execFileAsync(process.platform === "win32" ? "where" : "which", [executable]);
      signals.push(`${executable} executable`);
    } catch {}
  }
  for (const rel of paths) if (await pathExists(join(projectRoot, rel))) signals.push(rel);
  return { detected: signals.length > 0, signals };
}

export function makeAdapter(config: {
  id: IntegrationId;
  displayName: string;
  executable: string | null;
  detectionPaths: string[];
  skillsRel: string;
  bootstrapRel: string;
  bootstrapTemplate: string;
  managedSection: boolean;
  hint(skill: string): string;
}): IntegrationAdapter {
  return {
    id: config.id,
    displayName: config.displayName,
    maturity: "stable",
    adapterVersion: 1,
    detect: root => detectSignals(root, config.executable, config.detectionPaths),
    skillsRoot: root => join(root, config.skillsRel),
    bootstrapRelativePath: config.bootstrapRel,
    async planBootstrap(ctx: IntegrationContext): Promise<InstallOperation[]> {
      const source = join(ctx.payloadRoot, "bootstrap", config.bootstrapTemplate);
      if (config.managedSection) {
        return [{
          type: "update-managed-section",
          path: join(ctx.projectRoot, config.bootstrapRel),
          sectionId: "yaaw-se",
          content: await readFile(source, "utf8"),
          owner: `integration:${config.id}`
        }];
      }
      return [{
        type: "copy-managed-file",
        source,
        path: join(ctx.projectRoot, config.bootstrapRel),
        owner: `integration:${config.id}`
      }];
    },
    async planSkills(ctx: IntegrationContext, skills: CanonicalSkill[]): Promise<InstallOperation[]> {
      return skills.map(skill => ({
        type: "copy-managed-file",
        source: skill.source,
        path: join(ctx.projectRoot, config.skillsRel, skill.id, "SKILL.md"),
        owner: `integration:${config.id}`
      }));
    },
    async verify(ctx: IntegrationContext, selectedSkillIds: string[]): Promise<IntegrationVerification> {
      const issues: string[] = [];
      for (const skill of selectedSkillIds) {
        if (!(await pathExists(join(ctx.projectRoot, config.skillsRel, skill, "SKILL.md")))) {
          issues.push(`missing ${config.skillsRel}/${skill}/SKILL.md`);
        }
      }
      if (!(await pathExists(join(ctx.projectRoot, config.bootstrapRel)))) {
        issues.push(`missing bootstrap ${config.bootstrapRel}`);
      }
      return { healthy: issues.length === 0, issues };
    },
    invocationHint: config.hint
  };
}
