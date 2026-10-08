import { describe, expect, it } from "vitest";
import { classifyChangedFiles } from "../../scripts/ci_scope.mjs";

describe("CI scope classifier",()=>{
  it("treats docs-only changes as no validation",()=>{const scope=classifyChangedFiles(["README.md","docs/integrations.md"]);expect(scope.validate).toBe(false);expect(scope.release).toBe(false)});
  it("selects orchestration for compact engine/kernel changes",()=>{const scope=classifyChangedFiles([".yaaw-core/system/engine/routing.mjs",".yaaw-core/system/kernel.yaml","tests/cli/orchestration-engine.test.ts"]);expect(scope.orchestration).toBe(true);expect(scope.release).toBe(true);expect(scope.full).toBe(false)});
  it("selects core for role/module contracts",()=>{const scope=classifyChangedFiles([".yaaw-core/system/roles/planner.md",".yaaw-core/system/modules/changeability.md"]);expect(scope.core||scope.orchestration).toBe(true);expect(scope.release).toBe(true)});
  it("selects distribution/platform/node floor for installer source",()=>{const scope=classifyChangedFiles(["src/installer/status.ts"]);expect(scope.distribution).toBe(true);expect(scope.platform).toBe(true);expect(scope.node_floor).toBe(true)});
  it("falls back to full for unclassified fixtures",()=>{const scope=classifyChangedFiles(["tests/fixtures/new-case.txt"]);expect(scope.full).toBe(true);expect(scope.orchestration).toBe(true);expect(scope.distribution).toBe(true)});
});
