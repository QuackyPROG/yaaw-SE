import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getIntegration } from "../integrations/registry.js";
import type { IntegrationId } from "../integrations/types.js";

async function exists(path: string) {
  try { await access(path); return true; } catch { return false; }
}

export async function verifyInstalledState(projectRoot: string, integrations: IntegrationId[], skills: string[]): Promise<void> {
  const required = [
    ".yaaw-core/core",
    ".yaaw-core/roles",
    ".yaaw-core/workflows",
    ".yaaw-core/registries",
    ".yaaw-core/templates",
    ".yaaw-core/tools",
    ".yaaw-core/project/product.md",
    ".yaaw-core/project/engineering.md",
    ".yaaw-core/project/research",
    ".yaaw-core/project/state.json",
    ".yaaw-core/runtime",
    ".yaaw-core/install"
  ];
  const issues: string[] = [];
  for (const rel of required) if (!(await exists(join(projectRoot, rel)))) issues.push(`missing ${rel}`);

  if (await exists(join(projectRoot, ".yaaw"))) {
    issues.push("legacy .yaaw root exists; automatic merge is intentionally unsupported");
  }
  if (await exists(join(projectRoot, ".yaaw-core", "system"))) {
    issues.push("legacy/parallel .yaaw-core/system framework layout exists; canonical execution is ambiguous");
  }

  for (const id of integrations) {
    const result = await getIntegration(id).verify({ projectRoot, payloadRoot: "" }, skills);
    issues.push(...result.issues.map(issue=>`${id}: ${issue}`));
  }

  try {
    const paths = JSON.parse(await readFile(join(projectRoot, ".yaaw-core", "registries", "paths.json"), "utf8"));
    if (paths.workspace_root !== "." || paths.project_memory_root !== ".yaaw-core/project" || paths.research !== ".yaaw-core/project/research" || paths.runtime_root !== ".yaaw-core/runtime") {
      issues.push("installed paths registry violates one-root distribution contract");
    }
  } catch {
    issues.push("installed paths registry missing or invalid");
  }

  if (issues.length) throw new Error(`Installed-state verification failed:\n- ${issues.join("\n- ")}`);
}
