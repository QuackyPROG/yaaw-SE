import { describe, expect, it } from "vitest";
import {
  canPreserveCodexProfileWithOverrides,
  codexResolvedSettingLabel,
  compareCodexExecutionProfiles,
  normalizeCodexRuntimeSettings,
  resolveCodexAuthorityProfile,
  resolveCodexGenericProfile,
  resolveCodexInlineProfile
} from "../../src/integrations/codex-runtime.js";

describe("Codex authority execution-profile fidelity", () => {
  const matrix = [
    { name: "all inherit stays symbolic", config: {}, role: "planner", variant: "primary", model: "HOST_INHERIT", reasoning: "HOST_INHERIT" },
    { name: "default worker wins over root", config: { orchestrator: { model: "Sol", reasoning: "high" }, defaultWorker: { model: "Luna", reasoning: "medium" } }, role: "planner", variant: "primary", model: "Luna", reasoning: "medium" },
    { name: "role model combines with default reasoning", config: { orchestrator: { model: "Sol", reasoning: "high" }, defaultWorker: { model: "Luna", reasoning: "medium" }, roles: { planner: { model: "Sol", reasoning: null } } }, role: "planner", variant: "primary", model: "Sol", reasoning: "medium" },
    { name: "role reasoning combines with default model", config: { orchestrator: { model: "Sol", reasoning: "low" }, defaultWorker: { model: "Luna", reasoning: "medium" }, roles: { planner: { model: null, reasoning: "high" } } }, role: "planner", variant: "primary", model: "Luna", reasoning: "high" },
    { name: "role pins both dimensions", config: { orchestrator: { model: "Astra", reasoning: "max" }, defaultWorker: { model: "Luna", reasoning: "medium" }, roles: { planner: { model: "Sol", reasoning: "high" } } }, role: "planner", variant: "primary", model: "Sol", reasoning: "high" },
    { name: "root resolves when worker defaults inherit", config: { orchestrator: { model: "Sol", reasoning: "high" } }, role: "planner", variant: "primary", model: "Sol", reasoning: "high" },
    { name: "fallback pins Astra", config: { defaultWorker: { model: "Sol", reasoning: "medium" }, failureFallback: { afterFailures: 3, implementer: { model: "Astra", reasoning: "high" } } }, role: "implementer", variant: "fallback", model: "Astra", reasoning: "high" },
    { name: "fallback inherits model but pins reasoning", config: { orchestrator: { model: "Sol", reasoning: "high" }, defaultWorker: { model: "Luna", reasoning: "medium" }, failureFallback: { afterFailures: 3, implementer: { model: null, reasoning: "high" } } }, role: "implementer", variant: "fallback", model: "Luna", reasoning: "high" }
  ] as const;

  for (const row of matrix) {
    it(row.name, () => {
      const settings = normalizeCodexRuntimeSettings(row.config);
      const profile = resolveCodexAuthorityProfile(settings, row.role, row.variant);
      expect(codexResolvedSettingLabel(profile.model)).toBe(row.model);
      expect(codexResolvedSettingLabel(profile.reasoning)).toBe(row.reasoning);
    });
  }

  it("records setting provenance for diagnostics", () => {
    const settings = normalizeCodexRuntimeSettings({
      orchestrator: { model: "root-model", reasoning: "root-reasoning" },
      defaultWorker: { model: "worker-model", reasoning: "worker-reasoning" },
      roles: { reviewer: { model: "review-model", reasoning: null } }
    });
    const profile = resolveCodexAuthorityProfile(settings, "reviewer");
    expect(profile.model).toEqual({ value: "review-model", source: "authority" });
    expect(profile.reasoning).toEqual({ value: "worker-reasoning", source: "default-worker" });
  });

  it("compares generic fallback per dimension and requires only mismatched overrides", () => {
    const settings = normalizeCodexRuntimeSettings({
      defaultWorker: { model: "Luna", reasoning: "medium" },
      roles: { reviewer: { model: "Sol", reasoning: "medium" } }
    });
    const comparison = compareCodexExecutionProfiles(
      resolveCodexAuthorityProfile(settings, "reviewer"),
      resolveCodexGenericProfile(settings)
    );
    expect(comparison.equivalent).toBe(false);
    expect(comparison.model.requiresExplicitOverride).toBe(true);
    expect(comparison.model.explicitOverrideValue).toBe("Sol");
    expect(comparison.reasoning.requiresExplicitOverride).toBe(false);
    expect(canPreserveCodexProfileWithOverrides(comparison, { model: true, reasoning: false })).toBe(true);
    expect(canPreserveCodexProfileWithOverrides(comparison, { model: false, reasoning: true })).toBe(false);
  });

  it("never assumes a concrete value equals HOST_INHERIT", () => {
    const settings = normalizeCodexRuntimeSettings({ roles: { reviewer: { model: "Sol", reasoning: null } } });
    const comparison = compareCodexExecutionProfiles(resolveCodexAuthorityProfile(settings, "reviewer"), resolveCodexGenericProfile(settings));
    expect(codexResolvedSettingLabel(comparison.model.actual)).toBe("HOST_INHERIT");
    expect(comparison.model.equivalent).toBe(false);
    expect(canPreserveCodexProfileWithOverrides(comparison, { model: false, reasoning: false })).toBe(false);
  });

  it("treats shared symbolic inheritance as equivalent", () => {
    const settings = normalizeCodexRuntimeSettings({});
    const comparison = compareCodexExecutionProfiles(resolveCodexAuthorityProfile(settings, "reviewer"), resolveCodexGenericProfile(settings));
    expect(comparison.equivalent).toBe(true);
    expect(codexResolvedSettingLabel(comparison.model.expected)).toBe("HOST_INHERIT");
  });

  it("compares inline fallback against the root profile", () => {
    const equalSettings = normalizeCodexRuntimeSettings({ orchestrator: { model: "Sol", reasoning: "high" }, roles: { planner: { model: "Sol", reasoning: "high" } } });
    expect(compareCodexExecutionProfiles(resolveCodexAuthorityProfile(equalSettings, "planner"), resolveCodexInlineProfile(equalSettings)).equivalent).toBe(true);

    const differentSettings = normalizeCodexRuntimeSettings({ orchestrator: { model: "Sol", reasoning: "high" }, roles: { implementer: { model: "Luna", reasoning: "high" } } });
    expect(compareCodexExecutionProfiles(resolveCodexAuthorityProfile(differentSettings, "implementer"), resolveCodexInlineProfile(differentSettings)).equivalent).toBe(false);
  });
});
