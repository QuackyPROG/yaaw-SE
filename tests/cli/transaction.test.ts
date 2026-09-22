import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { executePlan } from "../../src/installer/transaction.js";
import type { InstallPlan } from "../../src/installer/types.js";

describe("transaction rollback", () => {
  it("restores pre-existing bytes after a simulated mid-transaction failure", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-tx-"));
    const existing = join(root, "AGENTS.md");
    await writeFile(existing, "original bytes\n");

    const plan: InstallPlan = {
      action: "fresh",
      projectRoot: root,
      selectedIntegrations: [],
      selectedSkills: [],
      warnings: [],
      operations: [
        { type: "write-managed-file", path: existing, content: "changed\n", owner: "test" },
        { type: "write-managed-file", path: join(root, ".yaaw-core", "core", "x.md"), content: "new\n", owner: "test" }
      ]
    };

    await expect(executePlan(plan, { failAfterOperations: 2 })).rejects.toThrow(/Simulated/);
    expect(await readFile(existing, "utf8")).toBe("original bytes\n");
  });

  it("rolls back when pre-manifest verification fails", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-verify-"));
    const path = join(root, "file.txt");
    const plan: InstallPlan = {
      action: "fresh",
      projectRoot: root,
      selectedIntegrations: [],
      selectedSkills: [],
      warnings: [],
      operations: [{ type: "write-managed-file", path, content: "new\n", owner: "test" }]
    };
    await expect(executePlan(plan, {
      manifestPath: join(root, ".yaaw-core/install/manifest.json"),
      manifestContent: "{}\n",
      beforeManifest: async () => { throw new Error("verification failed"); }
    })).rejects.toThrow(/verification failed/);
    await expect(readFile(path, "utf8")).rejects.toThrow();
  });
});
