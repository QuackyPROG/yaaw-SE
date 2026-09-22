import { access } from "node:fs/promises";
import { join } from "node:path";
import { readManifest } from "./manifest.js";

async function exists(path: string) {
  try { await access(path); return true; } catch { return false; }
}

export interface ExistingInstallation {
  kind: "none" | "valid" | "partial";
  manifest: Awaited<ReturnType<typeof readManifest>>;
  signals: string[];
}

export async function detectExistingInstallation(projectRoot: string): Promise<ExistingInstallation> {
  const signals: string[] = [];
  let manifest = null;
  try {
    manifest = await readManifest(projectRoot);
  } catch (error: any) {
    signals.push(`invalid-manifest: ${error.message}`);
  }
  if (manifest) return { kind: "valid", manifest, signals: ["manifest"] };

  if (await exists(join(projectRoot, ".yaaw-core/install/uninstalled.json"))) {
    return { kind: "none", manifest: null, signals: ["preserved-project-archive"] };
  }

  for (const rel of [
    ".yaaw-core/core",
    ".yaaw-core/project",
    ".agents/skills",
    ".claude/skills",
    ".gemini/skills",
    ".cline/skills"
  ]) {
    if (await exists(join(projectRoot, rel))) signals.push(rel);
  }
  return { kind: signals.length ? "partial" : "none", manifest: null, signals };
}
