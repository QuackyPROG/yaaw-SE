import { describe, expect, it, vi } from "vitest";
import { runAutoUpdateGate, shouldHandoff, updateChannelForVersion } from "../../src/cli/update-gate.js";

describe("CLI auto-update gate", () => {
  it("keeps stable and prerelease channels separate", () => {
    expect(updateChannelForVersion("0.3.1")).toBe("latest");
    expect(updateChannelForVersion("0.3.2-dev.123.1")).toBe("next");
  });

  it("hands off only when the selected channel is newer", () => {
    expect(shouldHandoff("0.3.0", "0.3.1")).toBe(true);
    expect(shouldHandoff("0.3.1", "0.3.1")).toBe(false);
    expect(shouldHandoff("0.3.2", "0.3.1")).toBe(false);
  });

  it("resolves once and hands off to that exact immutable version with original argv", async () => {
    const handoff = vi.fn(async () => 7);
    const result = await runAutoUpdateGate({
      currentVersion: "0.3.0",
      args: ["config", "codex", "--directory", "C:\\My Project"],
      env: {},
      dependencies: {
        lookupVersion: async channel => {
          expect(channel).toBe("latest");
          return "0.3.1";
        },
        handoff
      }
    });

    expect(result.handled).toBe(true);
    expect(result.targetVersion).toBe("0.3.1");
    expect(result.exitCode).toBe(7);
    expect(handoff).toHaveBeenCalledWith("0.3.1", ["config", "codex", "--directory", "C:\\My Project"]);
  });

  it("fails open when registry lookup is unavailable", async () => {
    const handoff = vi.fn();
    const result = await runAutoUpdateGate({
      currentVersion: "0.3.0",
      env: {},
      dependencies: {
        lookupVersion: async () => null,
        handoff
      }
    });

    expect(result.handled).toBe(false);
    expect(result.reason).toBe("lookup-failed");
    expect(handoff).not.toHaveBeenCalled();
  });

  it("does not recurse in a handoff child", async () => {
    const lookup = vi.fn();
    const result = await runAutoUpdateGate({
      currentVersion: "0.3.1",
      env: { YAAW_UPDATE_HANDOFF: "0.3.1" },
      dependencies: { lookupVersion: lookup }
    });
    expect(result.reason).toBe("handoff-child");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("supports deterministic exact-package runs through YAAW_DISABLE_AUTO_UPDATE", async () => {
    const lookup = vi.fn();
    const result = await runAutoUpdateGate({
      currentVersion: "0.3.0",
      env: { YAAW_DISABLE_AUTO_UPDATE: "1" },
      dependencies: { lookupVersion: lookup }
    });
    expect(result.reason).toBe("disabled");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("never sends stable users to next", async () => {
    const seen: string[] = [];
    await runAutoUpdateGate({
      currentVersion: "0.3.0",
      env: {},
      dependencies: {
        lookupVersion: async channel => {
          seen.push(channel);
          return "0.3.0";
        }
      }
    });
    expect(seen).toEqual(["latest"]);
  });
});
