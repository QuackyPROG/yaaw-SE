import { makeAdapter } from "./helpers.js";
export const clineAdapter = makeAdapter({
  id: "cline",
  displayName: "Cline",
  executable: null,
  detectionPaths: [".cline"],
  skillsRel: ".cline/skills",
  bootstrapRel: ".cline/rules/yaaw-se.md",
  bootstrapTemplate: "cline.md",
  managedSection: false,
  hint: skill => `/${skill}`
});
