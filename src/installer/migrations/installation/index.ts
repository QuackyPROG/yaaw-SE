import type { InstallationManifest } from "../../types.js";
import { migrateInstallationV2ToV3 } from "./v2-to-v3.js";

export interface InstallationManifestMigration {
  from: number;
  to: number;
  describe(): string;
  migrate(manifest: InstallationManifest): InstallationManifest;
}

export const installationMigrations: InstallationManifestMigration[] = [
  {
    from: 2,
    to: 3,
    describe: () => "Add provider configuration lifecycle metadata without changing provider settings.",
    migrate: migrateInstallationV2ToV3
  }
];

export function migrateInstallationManifest(manifest: InstallationManifest): InstallationManifest {
  let current = structuredClone(manifest) as InstallationManifest;
  while (current.installationSchema < 3) {
    const step = installationMigrations.find(migration => migration.from === current.installationSchema);
    if (!step) throw new Error(`No installation-manifest migration from schema ${current.installationSchema}`);
    current = step.migrate(current);
    if (current.installationSchema !== step.to) throw new Error(`Installation migration did not advance to schema ${step.to}`);
  }
  return current;
}
