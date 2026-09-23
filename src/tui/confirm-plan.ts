import * as p from "@clack/prompts";
import { integrations } from "../integrations/registry.js";
import type { InstallPlan } from "../installer/types.js";

const actionLabels = {
  fresh: "Fresh install",
  "quick-update": "Quick update",
  modify: "Modify installation",
  repair: "Repair installation",
  uninstall: "Uninstall"
} as const;

function toolSummary(plan: InstallPlan): string {
  const tools = plan.selectedIntegrations.map(id => integrations[id].displayName);
  if (!tools.length) return "";
  return `${tools.join(", ")} · ${plan.selectedSkills.length} skill${plan.selectedSkills.length === 1 ? "" : "s"}`;
}

export function formatPlan(plan: InstallPlan): string {
  const hasRemovals = plan.operations.some(op =>
    op.type === "remove-managed-file" || op.type === "remove-managed-section"
  );
  const hasProjectDefaults = plan.operations.some(op => op.type === "write-project-file-if-missing");
  const tools = plan.selectedIntegrations.map(id => integrations[id].displayName).join(", ");

  const lines = [
    `Project: ${plan.projectRoot}`,
    ...(toolSummary(plan) ? [toolSummary(plan)] : []),
    "",
    "Will:"
  ];

  if (plan.action === "uninstall") {
    lines.push("  Remove YAAW-SE managed framework and integration files");
  } else if (plan.action === "fresh") {
    lines.push(`  Install the YAAW-SE engine${tools ? ` and ${tools} skills` : ""}`);
  } else {
    lines.push(`  Refresh the YAAW-SE engine${tools ? ` and ${tools} skills` : ""}`);
  }

  if (hasRemovals) {
    lines.push("  Remove obsolete YAAW-managed files");
  }

  if (hasProjectDefaults && plan.action !== "uninstall") {
    lines.push("  Ensure durable project memory defaults exist");
  }

  lines.push(
    "  Preserve project memory and user-owned content"
  );

  if (plan.warnings.length) {
    lines.push("", "Warnings:", ...plan.warnings.map(warning => `  ${warning}`));
  }

  return lines.join("\n");
}

export async function confirmPlan(plan: InstallPlan): Promise<boolean> {
  p.note(formatPlan(plan), `YAAW-SE ${actionLabels[plan.action].toLowerCase()}`);
  const ok = await p.confirm({ message: "Continue?", initialValue: true });
  if (p.isCancel(ok)) return false;
  return Boolean(ok);
}
