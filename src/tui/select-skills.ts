import * as p from "@clack/prompts";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveSkillSelection } from "../installer/plan.js";

export async function selectSkills(payloadRoot: string, initial?: string[]): Promise<string[]> {
  const profile = await p.select({
    message: "Which YAAW entrypoints should be exposed?",
    options: [
      { value: "standard", label: "Standard", hint: "all public YAAW skills" },
      { value: "core", label: "Core only", hint: "orchestrator, PRD, planner, implement, review" },
      { value: "custom", label: "Custom", hint: "choose individual entrypoints" }
    ]
  });
  if (p.isCancel(profile)) throw new Error("Installation cancelled");
  if (profile !== "custom") return resolveSkillSelection(payloadRoot, String(profile));

  const registry = JSON.parse(await readFile(join(payloadRoot, "yaaw-core", "registries", "skills.json"), "utf8"));
  const values = await p.multiselect({
    message: "Choose public YAAW skill entrypoints",
    required: true,
    initialValues: initial,
    options: Object.entries(registry).map(([id, entry]: any)=>({ value:id, label:id, hint:entry.description }))
  });
  if (p.isCancel(values)) throw new Error("Installation cancelled");
  return values as string[];
}
