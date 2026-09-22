import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { InstallationManifest } from "./types.js";

export const MANIFEST_RELATIVE_PATH = ".yaaw-core/install/manifest.json";

export function emptyManifest(version: string, installedAt = new Date().toISOString()): InstallationManifest {
  return {
    schema: "yaaw.installation/v1",
    yaawVersion: version,
    installationSchema: 1,
    projectStateSchema: 1,
    installedAt,
    updatedAt: installedAt,
    project: { root: "." },
    integrations: {},
    skills: [],
    managedFiles: {},
    managedSections: {}
  };
}

export async function readManifest(projectRoot: string): Promise<InstallationManifest | null> {
  try {
    const raw = await readFile(join(projectRoot, MANIFEST_RELATIVE_PATH), "utf8");
    const value = JSON.parse(raw);
    if (value?.schema !== "yaaw.installation/v1" || value?.project?.root !== ".") {
      throw new Error("Unsupported or unsafe YAAW installation manifest");
    }
    if (!value.managedFiles || !value.managedSections || !Array.isArray(value.skills)) {
      throw new Error("Incomplete YAAW installation manifest");
    }
    return value as InstallationManifest;
  } catch (error: any) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export function serializeManifest(manifest: InstallationManifest): string {
  return JSON.stringify(manifest, null, 2) + "\n";
}
