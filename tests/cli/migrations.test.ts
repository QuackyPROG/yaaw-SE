import { describe, expect, it } from "vitest";
import { migrationPath, type Migration } from "../../src/installer/migrations/index.js";

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
