import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { InstallOperation } from "./types.js";

export async function planProjectInitialization(payloadRoot: string, projectRoot: string): Promise<InstallOperation[]> {
  const project = join(projectRoot, ".yaaw-core", "project");
  const runtime = join(projectRoot, ".yaaw-core", "runtime");
  const install = join(projectRoot, ".yaaw-core", "install");
  const operations: InstallOperation[] = [];

  for (const path of [
    project,
    join(project, "research"),
    join(project, "specs"),
    join(project, "tickets"),
    join(project, "reviews"),
    join(project, "evidence"),
    join(project, "rules"),
    runtime,
    install
  ]) operations.push({ type: "mkdir", path, owner: "layout" });

  const templates = join(payloadRoot, "yaaw-core", "templates");
  for (const [template, name] of [["product.md","product.md"],["engineering.md","engineering.md"]] as const) {
    operations.push({
      type: "write-project-file-if-missing",
      path: join(project, name),
      content: await readFile(join(templates, template))
    });
  }

  const state = JSON.parse(await readFile(join(templates, "project-state.json"), "utf8"));
  state.product.status = "draft";
  state.product.revision = 1;
  state.planning.status = "discovery";
  state.planning.revision = 1;
  state.planning.current_frontier = "FRONTIER-001";
  state.last_workflow = null;
  operations.push({
    type: "write-project-file-if-missing",
    path: join(project, "state.json"),
    content: JSON.stringify(state, null, 2) + "\n"
  });

  return operations;
}
