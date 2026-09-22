import * as p from "@clack/prompts";
import type { InstallAction } from "../installer/types.js";

export async function selectExistingAction(): Promise<InstallAction | "cancel"> {
  const action = await p.select({
    message: "YAAW-SE installation detected. What would you like to do?",
    options: [
      { value: "quick-update", label: "Quick Update" },
      { value: "modify", label: "Modify Installation" },
      { value: "repair", label: "Repair Installation" },
      { value: "uninstall", label: "Uninstall", hint: "preserves .yaaw-core/project" },
      { value: "cancel", label: "Cancel" }
    ]
  });
  if (p.isCancel(action)) return "cancel";
  return action as InstallAction | "cancel";
}
