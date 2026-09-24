import type { InstallationManifest } from "../../types.js";

export function migrateInstallationV2ToV3(manifest: InstallationManifest): InstallationManifest {
  const next = structuredClone(manifest) as InstallationManifest;
  for (const [integrationId, record] of Object.entries(next.integrations)) {
    if (record.configuration) continue;
    if (integrationId === "codex" && record.runtime !== undefined) {
      record.configuration = {
        schema: "yaaw.integration-config/v1",
        appliedRevision: 1,
        notifiedRevision: 1,
        profile: { id: "legacy", revision: 1 },
        settings: structuredClone(record.runtime)
      };
    }
  }
  next.installationSchema = 3;
  return next;
}
