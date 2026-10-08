import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getIntegration } from "../integrations/registry.js";
import type { IntegrationId } from "../integrations/types.js";
import type { InstallationManifest } from "./types.js";

async function exists(path: string) { try { await access(path); return true; } catch { return false; } }

export async function verifyInstalledState(projectRoot: string, integrations: IntegrationId[], skills: string[], prospectiveManifest?: InstallationManifest): Promise<void> {
  const required = [
    ".yaaw-core/system/SYSTEM.md",
    ".yaaw-core/system/kernel.yaml",
    ".yaaw-core/system/roles",
    ".yaaw-core/system/modules",
    ".yaaw-core/system/templates",
    ".yaaw-core/system/schemas",
    ".yaaw-core/system/engine/integrity.mjs",
    ".yaaw-core/system/engine/repository-identity.mjs",
    ".yaaw-core/system/engine/runtime.mjs",
    ".yaaw-core/project/product.md",
    ".yaaw-core/project/engineering.md",
    ".yaaw-core/project/research",
    ".yaaw-core/project/specs",
    ".yaaw-core/project/tickets",
    ".yaaw-core/project/reviews",
    ".yaaw-core/project/evidence",
    ".yaaw-core/runtime",
    ".yaaw-core/install"
  ];
  const issues: string[] = [];
  for (const rel of required) if (!(await exists(join(projectRoot, rel)))) issues.push(`missing ${rel}`);
  if (await exists(join(projectRoot, ".yaaw-core", "project", "state.json"))) issues.push("legacy project/state.json remains after project schema v3 migration");
  if (await exists(join(projectRoot, ".yaaw"))) issues.push("legacy .yaaw root exists; automatic merge is intentionally unsupported");
  for (const legacy of ["core","workflows","expertise","rules","registries","tools"]) if (await exists(join(projectRoot,".yaaw-core","system",legacy))) issues.push(`legacy semantic package directory remains: .yaaw-core/system/${legacy}`);
  for (const id of integrations) {
    const record = prospectiveManifest?.integrations?.[id];
    const settings = record?.configuration?.settings ?? record?.runtime;
    const result = await getIntegration(id).verify({ projectRoot, payloadRoot: "", settings }, skills);
    issues.push(...result.issues.map(issue=>`${id}: ${issue}`));
  }
  try {
    const kernel = JSON.parse(await readFile(join(projectRoot,".yaaw-core","system","kernel.yaml"),"utf8"));
    if (kernel.schema !== "yaaw.kernel/v1" || kernel.paths?.workspace_root !== "." || kernel.paths?.project_root !== ".yaaw-core/project" || kernel.paths?.runtime_root !== ".yaaw-core/runtime" || kernel.paths?.state) issues.push("installed kernel violates compact one-root/derived-state contract");
  } catch { issues.push("installed kernel missing or invalid"); }
  if (issues.length) throw new Error(`Installed-state verification failed:\n- ${issues.join("\n- ")}`);
}
