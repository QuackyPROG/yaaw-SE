import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Migration } from "../index.js";

function terminalOldState(state: any): boolean {
  const values = Object.values(state?.tickets ?? {});
  return state?.phase === "complete" && values.length > 0 && values.every(value => value === "PASS" || value === "CANCELLED");
}

function migrateState(raw: string): string {
  const state = JSON.parse(raw);
  if (state.schema === "yaaw.project-state/v2") return JSON.stringify(state, null, 2) + "\n";
  if (state.schema !== "yaaw.project-state/v1") throw new Error(`Unsupported project-state schema during v1->v2 migration: ${String(state.schema)}`);
  state.schema = "yaaw.project-state/v2";
  state.planning ??= {};
  state.planning.scope_status = terminalOldState(state) ? "COMPLETE" : "UNKNOWN";
  return JSON.stringify(state, null, 2) + "\n";
}

function migrateEngineering(raw: string, scopeStatus: "UNKNOWN" | "COMPLETE"): string {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") throw new Error("engineering.md missing frontmatter");
  const end = lines.slice(1).findIndex(line => line.trim() === "---");
  if (end < 0) throw new Error("engineering.md missing closing frontmatter");
  const stop = end + 1;
  const schemaIndex = lines.slice(1, stop).findIndex(line => /^schema:\s*/.test(line));
  if (schemaIndex < 0) throw new Error("engineering.md missing schema");
  const absoluteSchema = schemaIndex + 1;
  const schema = lines[absoluteSchema].split(":", 2)[1]?.trim();
  if (schema !== "yaaw.engineering/v1" && schema !== "yaaw.engineering/v2") throw new Error(`Unsupported engineering schema during v1->v2 migration: ${schema}`);
  lines[absoluteSchema] = "schema: yaaw.engineering/v2";
  const hasScope = lines.slice(1, stop).some(line => /^scope_status:\s*/.test(line));
  if (!hasScope) {
    const readiness = lines.slice(1, stop).findIndex(line => /^readiness:\s*/.test(line));
    const insertAt = readiness >= 0 ? readiness + 2 : stop;
    lines.splice(insertAt, 0, `scope_status: ${scopeStatus}`);
  }
  return lines.join("\n");
}

export const migrateProjectV1ToV2: Migration = {
  from: 1,
  to: 2,
  describe: () => "Add planner-owned scope status and version durable state/engineering artifacts.",
  async plan(ctx) {
    const statePath = join(ctx.projectRoot, ".yaaw-core", "project", "state.json");
    const engineeringPath = join(ctx.projectRoot, ".yaaw-core", "project", "engineering.md");
    const stateRaw = await readFile(statePath, "utf8");
    const oldState = JSON.parse(stateRaw);
    const scopeStatus: "UNKNOWN" | "COMPLETE" = terminalOldState(oldState) ? "COMPLETE" : "UNKNOWN";
    const engineeringRaw = await readFile(engineeringPath, "utf8");
    return [
      { type: "migrate-project-file", path: statePath, content: migrateState(stateRaw), migration: "project-v1-to-v2" },
      { type: "migrate-project-file", path: engineeringPath, content: migrateEngineering(engineeringRaw, scopeStatus), migration: "project-v1-to-v2" },
      ...["handoff.json","observed-state.json","intent.json","dispatch-failures.json"].map(name => ({
        type: "remove-runtime-file" as const,
        path: join(ctx.projectRoot, ".yaaw-core", "runtime", name),
        owner: "migration:project-v1-to-v2"
      }))
    ];
  }
};
