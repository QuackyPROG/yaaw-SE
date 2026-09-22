import { makeAdapter } from "./helpers.js";
export const geminiCliAdapter = makeAdapter({
  id: "gemini-cli",
  displayName: "Gemini CLI",
  executable: "gemini",
  detectionPaths: [".gemini", "GEMINI.md"],
  skillsRel: ".gemini/skills",
  bootstrapRel: "GEMINI.md",
  bootstrapTemplate: "gemini-cli.md",
  managedSection: true,
  hint: skill => `/skills list; then ask Gemini to use \`${skill}\``
});
