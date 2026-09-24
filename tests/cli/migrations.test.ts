import { describe, expect, it } from "vitest";
import { migrationPath, type Migration } from "../../src/installer/migrations/index.js";
import { migrateInstallationManifest } from "../../src/installer/migrations/installation/index.js";
import { emptyManifest } from "../../src/installer/manifest.js";

function migration(from: number, to: number): Migration {
  return {
    from,
    to,
    describe: () => `${from}->${to}`,
    plan: async () => []
  };
}

describe("schema migration routing", () => {
  it("composes skipped-version upgrades in order", () => {
    const path = migrationPath([migration(1,2), migration(2,3), migration(3,4)], 1, 4);
    expect(path.map(m => [m.from, m.to])).toEqual([[1,2],[2,3],[3,4]]);
  });

  it("rejects schema downgrades", () => {
    expect(() => migrationPath([], 3, 2)).toThrow(/downgrade/i);
  });

  it("rejects incomplete migration chains", () => {
    expect(() => migrationPath([migration(1,2)], 1, 3)).toThrow(/No migration registered/);
  });
});


describe("installation manifest configuration migration", () => {
  it("preserves existing Codex runtime settings exactly", () => {
    const old = emptyManifest("0.2.1");
    old.installationSchema = 2;
    const runtime = {
      mode: "auto",
      orchestrator: { model: "custom-model", reasoning: "high" },
      defaultWorker: { model: null, reasoning: null },
      roles: {
        prd: { model: null, reasoning: null },
        planner: { model: "planner-custom", reasoning: "medium" },
        implementer: { model: null, reasoning: null },
        reviewer: { model: null, reasoning: null }
      },
      maxConcurrentThreads: 7,
      sandboxMode: null,
      approvalPolicy: null,
      webSearch: null
    };
    old.integrations.codex = { adapterVersion: 2, skillsRoot: ".agents/skills", bootstrap: "AGENTS.md", runtime };
    const migrated = migrateInstallationManifest(old);
    expect(migrated.installationSchema).toBe(3);
    expect(migrated.integrations.codex.configuration?.settings).toEqual(runtime);
    expect(migrated.integrations.codex.configuration?.appliedRevision).toBe(1);
    expect(migrated.integrations.codex.configuration?.notifiedRevision).toBe(1);
    expect(migrated.integrations.codex.configuration?.profile).toEqual({ id: "legacy", revision: 1 });
  });
});
