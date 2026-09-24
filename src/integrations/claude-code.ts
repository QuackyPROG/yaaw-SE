import { makeAdapter } from "./helpers.js";
export const claudeCodeAdapter = makeAdapter({
  id: "claude-code",
  aliases: ["claude"],
  displayName: "Claude Code",
  executable: "claude",
  detectionPaths: [".claude", "CLAUDE.md"],
  skillsRel: ".claude/skills",
  bootstrapRel: "CLAUDE.md",
  bootstrapTemplate: "claude-code.md",
  managedSection: true,
  hint: skill => `/${skill}`
});
