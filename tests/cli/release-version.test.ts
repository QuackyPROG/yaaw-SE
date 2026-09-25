import { describe, expect, it } from "vitest";
import { resolveNextVersion, resolveStableVersion } from "../../scripts/resolve_release_version.mjs";

describe("release version resolver", () => {
  it("increments npm latest when repository version is not ahead", () => {
    expect(resolveStableVersion("0.3.0", "0.3.0")).toBe("0.3.1");
    expect(resolveStableVersion("0.3.0", "0.3.4")).toBe("0.3.5");
  });

  it("honors deliberate minor and major release boundaries", () => {
    expect(resolveStableVersion("0.4.0", "0.3.8")).toBe("0.4.0");
    expect(resolveStableVersion("1.0.0", "0.9.9")).toBe("1.0.0");
  });

  it("uses the repository version for first publication", () => {
    expect(resolveStableVersion("1.0.0", "")).toBe("1.0.0");
  });

  it("normalizes prerelease repository versions to their stable line", () => {
    expect(resolveStableVersion("0.4.0-beta.2", "0.3.9")).toBe("0.4.0");
  });

  it("builds next from the prospective stable patch line", () => {
    expect(resolveNextVersion("0.3.0", "0.3.4", "123456", "2")).toBe("0.3.5-dev.123456.2");
  });

  it("accepts npm view JSON output", () => {
    expect(resolveStableVersion("0.3.0", '"0.3.4"')).toBe("0.3.5");
  });

  it("rejects malformed versions", () => {
    expect(() => resolveStableVersion("not-semver", "0.3.0")).toThrow(/Invalid repository version/);
    expect(() => resolveStableVersion("0.3.0", "not-semver")).toThrow(/Invalid npm latest version/);
  });
});
