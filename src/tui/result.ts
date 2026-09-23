import * as p from "@clack/prompts";
import { relative } from "node:path";
import { integrations } from "../integrations/registry.js";
import type { IntegrationId } from "../integrations/types.js";
import type { InstallAction } from "../installer/types.js";

const actionLabels: Record<InstallAction, string> = {
  fresh: "Fresh install",
  "quick-update": "Quick update",
  modify: "Modify installation",
  repair: "Repair installation",
  uninstall: "Uninstall"
};

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export interface SuccessSummary {
  projectRoot: string;
  selected: IntegrationId[];
  version: string;
  action: InstallAction;
  changed: string[];
}

export function formatSuccess(summary: SuccessSummary): string {
  const changed = [...new Set(summary.changed.map(normalizePath))];
  const files = changed.filter(path => !path.endsWith("/"));
  const directories = changed.filter(path => path.endsWith("/"));
  const claimed = new Set<string>();
  const changeLines: string[] = [];

  const claim = (label: string, predicate: (path: string) => boolean) => {
    const matches = files.filter(path => !claimed.has(path) && predicate(path));
    for (const path of matches) claimed.add(path);
    if (matches.length) changeLines.push(`  ${label}: ${plural(matches.length, "file")}`);
  };

  claim("YAAW engine", path => path.startsWith(".yaaw-core/system/"));
  claim("Project memory initialized", path => path.startsWith(".yaaw-core/project/"));

  for (const id of summary.selected) {
    const adapter = integrations[id];
    const skillsRoot = normalizePath(relative(summary.projectRoot, adapter.skillsRoot(summary.projectRoot)));
    claim(`${adapter.displayName} skills`, path => path === skillsRoot || path.startsWith(`${skillsRoot}/`));

    const bootstrap = normalizePath(adapter.bootstrapRelativePath);
    if (files.includes(bootstrap) && !claimed.has(bootstrap)) {
      claimed.add(bootstrap);
      changeLines.push(`  ${adapter.displayName} bootstrap: ${bootstrap}`);
    }
  }

  claim("Installer metadata/backups", path => path.startsWith(".yaaw-core/install/"));

  const other = files.filter(path => !claimed.has(path));
  if (other.length) changeLines.push(`  Other files: ${plural(other.length, "file")}`);
  if (!changeLines.length) changeLines.push("  No file content changes were required");

  const entryPoints = summary.selected.map(id =>
    `  ${integrations[id].displayName}: ${integrations[id].invocationHint("yaaw-orchestrator")}`
  );
  const codexRuntimeChanged = summary.selected.includes("codex") && changed.some(path => path.startsWith(".codex/"));
  const codexNote = codexRuntimeChanged ? [
    "",
    "Codex runtime configuration changed:",
    "  Start a new Codex session/task for project .codex settings to load.",
    "  Codex loads project .codex configuration only for trusted projects."
  ] : [];

  return [
    `Version: ${summary.version}`,
    `Project: ${summary.projectRoot}`,
    `Action: ${actionLabels[summary.action]}`,
    `Files changed: ${files.length}`,
    `Directory entries changed: ${directories.length}`,
    "",
    "Changes applied:",
    ...changeLines,
    "",
    "Preserved:",
    "  Existing durable project memory was not overwritten",
    "  User-owned content outside YAAW-managed sections was left intact",
    "",
    "Start here:",
    ...entryPoints,
    ...codexNote
  ].join("\n");
}

export function showSuccess(summary: SuccessSummary) {
  const title = summary.action === "fresh"
    ? "YAAW-SE installation complete"
    : summary.action === "quick-update"
      ? "YAAW-SE update complete"
      : "YAAW-SE changes complete";
  p.note(formatSuccess(summary), title);
  p.outro("Verified and ready.");
}
