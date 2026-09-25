import { describe, expect, it } from "vitest";
import { emptyManifest } from "../../src/installer/manifest.js";
import { configurationStateFor, detectConfigurationUpdates } from "../../src/installer/configuration.js";
import { formatConfigurationUpdates } from "../../src/tui/configuration-updates.js";
import { CODEX_CONFIGURATION_REVISION } from "../../src/integrations/codex-catalog.js";

function manifest(applied: number, notified: number) {
  const value = emptyManifest("0.3.0");
  value.integrations.codex = {
    adapterVersion: 4,
    skillsRoot: ".agents/skills",
    bootstrap: "AGENTS.md",
    runtime: {},
    configuration: {
      schema: "yaaw.integration-config/v1",
      appliedRevision: applied,
      notifiedRevision: notified,
      profile: { id: "legacy", revision: applied },
      settings: {}
    }
  };
  return value;
}

describe("provider configuration update detection", () => {
  it("does not notify when current", () => {
    expect(detectConfigurationUpdates(manifest(CODEX_CONFIGURATION_REVISION, CODEX_CONFIGURATION_REVISION))).toEqual([]);
  });

  it("notifies a newly available revision", () => {
    const updates = detectConfigurationUpdates(manifest(1, 1));
    expect(updates).toHaveLength(1);
    expect(updates[0].integrationId).toBe("codex");
    expect(updates[0].availableRevision).toBe(CODEX_CONFIGURATION_REVISION);
  });

  it("makes preserved settings and fallback opt-in explicit in the Quick Update notice", () => {
    const updates = detectConfigurationUpdates(manifest(3, 3));
    const notice = formatConfigurationUpdates(updates);

    expect(notice).toContain("Quick Update installed support for these capabilities without changing your existing provider setup.");
    expect(notice).toContain("Your current configuration and selected profile were preserved.");
    expect(notice).toContain("Astra fallback is available, but Quick Update did not enable it or replace your current Codex settings.");
    expect(notice).toContain("choose Recommended, or choose Custom and configure Failure fallback");
    expect(notice).toContain("yaaw config codex");
  });

  it("does not nag after notification while status still reports update available", () => {
    const value = manifest(1, CODEX_CONFIGURATION_REVISION);
    expect(detectConfigurationUpdates(value)).toEqual([]);
    const state = configurationStateFor(value, "codex");
    expect(state?.updateAvailable).toBe(true);
    expect(state?.notificationPending).toBe(false);
  });
});
