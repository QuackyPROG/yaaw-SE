import { makeAdapter } from "./helpers.js";
export const codexAdapter = makeAdapter({
  id: "codex",
  displayName: "Codex",
  executable: "codex",
  detectionPaths: [".agents", "AGENTS.md"],
  skillsRel: ".agents/skills",
  bootstrapRel: "AGENTS.md",
  bootstrapTemplate: "codex.md",
  managedSection: true,
  hint: skill => `$${skill}`
});
