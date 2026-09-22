import * as p from "@clack/prompts";
import type { InstallPlan } from "../installer/types.js";

export function formatPlan(plan: InstallPlan): string {
  const counts = new Map<string, number>();
  for (const op of plan.operations) counts.set(op.type, (counts.get(op.type) ?? 0) + 1);
  return [
    `Project: ${plan.projectRoot}`,
    `Action: ${plan.action}`,
    `Tools: ${plan.selectedIntegrations.join(", ") || "none"}`,
    `Skills: ${plan.selectedSkills.length}`,
    ...[...counts].map(([type,count])=>`${type}: ${count}`),
    "Outside project writes: none",
    "Existing durable YAAW artifacts overwritten: none"
  ].join("\n");
}

export async function confirmPlan(plan: InstallPlan): Promise<boolean> {
  p.note(formatPlan(plan), "YAAW-SE installation plan");
  const ok = await p.confirm({ message: "Continue?", initialValue: true });
  if (p.isCancel(ok)) return false;
  return Boolean(ok);
}
