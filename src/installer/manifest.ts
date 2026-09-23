import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  CURRENT_INSTALLATION_SCHEMA,
  CURRENT_PROJECT_SCHEMA,
  CURRENT_SYSTEM_SCHEMA
} from "./migrations/index.js";
import type { InstallationManifest } from "./types.js";

export const MANIFEST_RELATIVE_PATH = ".yaaw-core/install/manifest.json";

export function emptyManifest(version: string, installedAt = new Date().toISOString()): InstallationManifest {
  return {
    schema: "yaaw.installation/v2",
    yaawVersion: version,
    systemSchema: CURRENT_SYSTEM_SCHEMA,
    installationSchema: CURRENT_INSTALLATION_SCHEMA,
    projectSchema: CURRENT_PROJECT_SCHEMA,
    installedAt,
    updatedAt: installedAt,
    project: { root: "." },
    integrations: {},
    skills: [],
    managedFiles: {},
    managedSections: {},
    managedConfigKeys: {}
  };
}

function normalizeManifest(value: any): InstallationManifest {
  if (!value || value?.project?.root !== ".") {
    throw new Error("Unsupported or unsafe YAAW installation manifest");
  }
  if (!value.managedFiles || !value.managedSections || !Array.isArray(value.skills) || !value.integrations) {
    throw new Error("Incomplete YAAW installation manifest");
  }

  if (value.schema === "yaaw.installation/v2") {
    for (const field of ["systemSchema", "installationSchema", "projectSchema"] as const) {
      if (!Number.isInteger(value[field]) || value[field] < 1) {
        throw new Error(`Invalid YAAW installation manifest field: ${field}`);
      }
    }
    return {
      ...value,
      managedConfigKeys: value.managedConfigKeys ?? {}
    } as InstallationManifest;
  }

  if (value.schema === "yaaw.installation/v1") {
    return {
      schema: "yaaw.installation/v2",
      yaawVersion: String(value.yaawVersion),
      systemSchema: 1,
      installationSchema: CURRENT_INSTALLATION_SCHEMA,
      projectSchema: Number(value.projectStateSchema ?? 1),
      installedAt: String(value.installedAt),
      updatedAt: String(value.updatedAt),
      project: { root: "." },
      integrations: value.integrations,
      skills: value.skills,
      managedFiles: value.managedFiles,
      managedSections: value.managedSections,
      managedConfigKeys: {}
    };
  }

  throw new Error(`Unsupported YAAW installation manifest schema: ${String(value.schema)}`);
}

export async function readManifest(projectRoot: string): Promise<InstallationManifest | null> {
  try {
    const raw = await readFile(join(projectRoot, MANIFEST_RELATIVE_PATH), "utf8");
    return normalizeManifest(JSON.parse(raw));
  } catch (error: any) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export function serializeManifest(manifest: InstallationManifest): string {
  return JSON.stringify(manifest, null, 2) + "\n";
}
