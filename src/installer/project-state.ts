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

  const templates = join(payloadRoot, "yaaw-core", "system", "templates");
  for (const [template, name] of [["product.md","product.md"],["engineering.md","engineering.md"]] as const) {
    operations.push({
      type: "write-project-file-if-missing",
      path: join(project, name),
      content: await readFile(join(templates, template))
    });
  }

  // No global project state file is initialized. Product, engineering, specs,
  // ticket frontmatter, evidence, and reviews are the durable state model.
  // Runtime observation/intent/handoff files are derived on demand.
  return operations;
}
