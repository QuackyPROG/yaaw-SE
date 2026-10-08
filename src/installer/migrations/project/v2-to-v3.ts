import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Migration } from "../index.js";
import type { InstallOperation } from "../../types.js";

const STATES = new Set(["DRAFT","READY","IN_PROGRESS","REVIEW_REQUIRED","REPAIR_REQUIRED","REPLAN_REQUIRED","BLOCKED","PASS","CANCELLED"]);
async function exists(path: string) { try { await access(path); return true; } catch { return false; } }
function patchStatus(text: string, status: string): string {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") throw new Error("ticket missing opening frontmatter");
  const end = lines.slice(1).findIndex(line => line.trim() === "---");
  if (end < 0) throw new Error("ticket missing closing frontmatter");
  const relative = lines.slice(1, end + 1).findIndex(line => /^status:\s*/.test(line));
  if (relative < 0) throw new Error("ticket missing lifecycle status");
  lines[relative + 1] = `status: ${status}`;
  return lines.join("\n");
}

export const v2ToV3: Migration = {
  from: 2,
  to: 3,
  describe: () => "Move ticket lifecycle authority from project/state.json into ticket frontmatter and make coordination state reconstructable.",
  async plan(ctx): Promise<InstallOperation[]> {
    const project = join(ctx.projectRoot, ".yaaw-core", "project");
    const statePath = join(project, "state.json");
    const operations: InstallOperation[] = [];
    if (await exists(statePath)) {
      const state = JSON.parse(await readFile(statePath, "utf8"));
      const ledger: Record<string,string> = state?.tickets ?? {};
      const ticketsDir = join(project, "tickets");
      if (await exists(ticketsDir)) {
        for (const name of (await readdir(ticketsDir)).filter(x => /^TASK-[0-9]+\.md$/.test(x)).sort()) {
          const id = name.replace(/\.md$/, "");
          const status = ledger[id];
          if (!status || !STATES.has(status)) continue;
          const path = join(ticketsDir, name);
          const before = await readFile(path, "utf8");
          const after = patchStatus(before, status);
          if (after !== before) operations.push({ type: "migrate-project-file", path, content: after, migration: "project-v2-to-v3-ticket-lifecycle" });
        }
      }
      operations.push({ type: "remove-project-file-migration", path: statePath, migration: "project-v2-to-v3-remove-derived-ledger" });
    }
    for (const name of ["observed-state.json","handoff.json","intent.json","dispatch-failures.json"]) operations.push({ type: "remove-runtime-file", path: join(ctx.projectRoot,".yaaw-core","runtime",name), owner: "migration:project-v2-to-v3" });
    return operations;
  }
};
