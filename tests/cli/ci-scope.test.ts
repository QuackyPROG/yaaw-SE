import { describe, expect, it } from "vitest";
import { classifyChangedFiles } from "../../scripts/ci_scope.mjs";

describe("CI change scope", () => {
  it("skips validation and release for documentation-only changes", () => {
    const scope = classifyChangedFiles(["README.md", "docs/architecture.md"]);
    expect(scope.validate).toBe(false);
    expect(scope.release).toBe(false);
  });

  it("selects only orchestration tests for orchestration recovery changes", () => {
    const scope = classifyChangedFiles([
      ".yaaw-core/system/tools/orchestration-engine.mjs",
      ".yaaw-core/system/core/recovery.md",
      "tests/cli/orchestration-engine.test.ts"
    ]);
    expect(scope.orchestration).toBe(true);
    expect(scope.core).toBe(false);
    expect(scope.distribution).toBe(false);
    expect(scope.node_floor).toBe(false);
    expect(scope.platform).toBe(false);
    expect(scope.release).toBe(true);
    expect(scope.full).toBe(false);
  });

  it("selects distribution and compatibility checks for packaged CLI changes", () => {
    const scope = classifyChangedFiles(["src/cli/main.ts"]);
    expect(scope.distribution).toBe(true);
    expect(scope.node_floor).toBe(true);
    expect(scope.platform).toBe(true);
    expect(scope.release).toBe(true);
    expect(scope.full).toBe(false);
  });

  it("tests CI changes without publishing a package by themselves", () => {
    const scope = classifyChangedFiles([".github/workflows/validate.yml", "scripts/ci_scope.mjs"]);
    expect(scope.ci).toBe(true);
    expect(scope.validate).toBe(true);
    expect(scope.release).toBe(false);
    expect(scope.full).toBe(false);
  });

  it("falls back to the full suite and release safety for unknown paths", () => {
    const scope = classifyChangedFiles(["unexpected/new-surface.xyz"]);
    expect(scope.full).toBe(true);
    expect(scope.core).toBe(true);
    expect(scope.distribution).toBe(true);
    expect(scope.node_floor).toBe(true);
    expect(scope.platform).toBe(true);
    expect(scope.release).toBe(true);
  });
});
