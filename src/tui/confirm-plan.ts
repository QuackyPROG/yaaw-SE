import * as p from "@clack/prompts";
import { relative } from "node:path";
import { integrations } from "../integrations/registry.js";
import type { InstallPlan } from "../installer/types.js";

const actionLabels = {
  fresh: "Fresh install",
  "quick-update": "Quick update",
  modify: "Modify installation",
  repair: "Repair installation",
  uninstall: "Uninstall"
} as const;

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function rel(plan: InstallPlan, path: string): string {
  return normalizePath(relative(plan.projectRoot, path));
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function formatList(values: string[], limit = 5): string {
  if (values.length <= limit) return values.join(", ");
  return `${values.slice(0, limit).join(", ")} (+${values.length - limit} more)`;
}

export function formatPlan(plan: InstallPlan): string {
  const managedWrites = new Set<string>();
  const projectCreates = new Set<string>();
  const sectionUpdates: string[] = [];
  const removals = new Set<string>();
  const preserves = new Set<string>();
  const directories = new Set<string>();

  for (const op of plan.operations) {
    if (op.type === "copy-managed-file" || op.type === "write-managed-file") {
      managedWrites.add(rel(plan, op.path));
    } else if (op.type === "write-project-file-if-missing") {
      projectCreates.add(rel(plan, op.path));
    } else if (op.type === "update-managed-section") {
      sectionUpdates.push(`${rel(plan, op.path)} [${op.sectionId}]`);
    } else if (op.type === "remove-managed-file" || op.type === "remove-managed-section") {
      removals.add(rel(plan, op.path));
    } else if (op.type === "preserve") {
      preserves.add(rel(plan, op.path));
    } else if (op.type === "mkdir" || op.type === "remove-empty-dir") {
      directories.add(rel(plan, op.path) || ".");
    }
  }

  const managedPaths = [...managedWrites];
  const systemWrites = managedPaths.filter(path => path.startsWith(".yaaw-core/system/"));
  const backupWrites = managedPaths.filter(path => path.startsWith(".yaaw-core/install/backups/"));
  const providerSkillPaths = new Set<string>();
  const providerLines: string[] = [];

  for (const id of plan.selectedIntegrations) {
    const adapter = integrations[id];
    const root = normalizePath(relative(plan.projectRoot, adapter.skillsRoot(plan.projectRoot)));
    const paths = managedPaths.filter(path => path === root || path.startsWith(`${root}/`));
    for (const path of paths) providerSkillPaths.add(path);
    if (paths.length) {
      providerLines.push(`  ${adapter.displayName} skill entrypoints: ${plural(paths.length, "file")} -> ${root}`);
    }
  }

  const otherManaged = managedPaths.filter(path =>
    !systemWrites.includes(path) &&
    !backupWrites.includes(path) &&
    !providerSkillPaths.has(path)
  );

  const lines = [
    `Project: ${plan.projectRoot}`,
    `Action: ${actionLabels[plan.action]}`,
    `Tools: ${plan.selectedIntegrations.map(id => integrations[id].displayName).join(", ") || "none"}`,
    `Skills exposed: ${plan.selectedSkills.length}`,
    "",
    "Planned file impact:",
    `  Managed files to reconcile: ${managedWrites.size}`,
    `  Project files created only if missing: ${projectCreates.size}`,
    `  Managed file sections to update: ${sectionUpdates.length}`,
    `  Managed files/sections to remove: ${removals.size}`,
    `  Local overrides explicitly preserved: ${preserves.size}`,
    `  Directories prepared/cleaned: ${directories.size}`,
    "",
    "Where those changes go:"
  ];

  if (systemWrites.length) {
    lines.push(`  YAAW engine (.yaaw-core/system): ${plural(systemWrites.length, "file")}`);
  }
  lines.push(...providerLines);
  if (backupWrites.length) {
    lines.push(`  Safety backups: ${plural(backupWrites.length, "file")} -> .yaaw-core/install/backups`);
  }
  if (otherManaged.length) {
    lines.push(`  Other YAAW-managed files: ${plural(otherManaged.length, "file")}`);
  }
  if (projectCreates.size) {
    lines.push(`  Durable project memory defaults: ${plural(projectCreates.size, "create-if-missing file")}`);
  }
  if (sectionUpdates.length) {
    lines.push(`  Managed sections: ${formatList([...new Set(sectionUpdates)])}`);
  }
  if (removals.size) {
    lines.push(`  Removals: ${formatList([...removals])}`);
  }
  if (preserves.size) {
    lines.push(`  Preserved local overrides: ${formatList([...preserves])}`);
  }

  lines.push(
    "",
    "Safety:",
    "  Outside-project writes: 0",
    "  Existing durable project memory overwritten: 0",
    "  User-owned content outside YAAW-managed sections is left intact"
  );

  if (plan.warnings.length) {
    lines.push("", "Warnings:", ...plan.warnings.map(warning => `  ${warning}`));
  }

  return lines.join("\n");
}

export async function confirmPlan(plan: InstallPlan): Promise<boolean> {
  p.note(formatPlan(plan), "YAAW-SE change plan");
  const ok = await p.confirm({ message: "Continue?", initialValue: true });
  if (p.isCancel(ok)) return false;
  return Boolean(ok);
}
