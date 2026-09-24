import { describe, expect, it } from "vitest";
import { CODEX_CONFIGURATION_REVISION, codexConfigurationChanges, codexModels, codexProfiles, recommendedCodexProfile } from "../../src/integrations/codex-catalog.js";

describe("Codex configuration catalog", () => {
  it("keeps catalog identities and revisions deterministic", () => {
    expect(new Set(codexModels.map(model => model.id)).size).toBe(codexModels.length);
    expect(new Set(codexConfigurationChanges.map(change => change.id)).size).toBe(codexConfigurationChanges.length);
    expect(Math.max(...codexConfigurationChanges.map(change => change.revision))).toBe(CODEX_CONFIGURATION_REVISION);
  });

  it("provides a current Recommended profile", () => {
    const profile = recommendedCodexProfile();
    expect(profile.revision).toBe(CODEX_CONFIGURATION_REVISION);
    expect(profile.settings.roles.planner.model).toBe("gpt-6-sol");
    expect(profile.settings.roles.planner.reasoning).toBe("high");
    expect(codexProfiles.some(candidate => candidate.id === "inherit")).toBe(true);
  });

  it("declares reasoning capabilities for known models", () => {
    for (const model of codexModels) {
      expect(model.reasoningEfforts.length).toBeGreaterThan(0);
      expect(new Set(model.reasoningEfforts).size).toBe(model.reasoningEfforts.length);
    }
  });
});
