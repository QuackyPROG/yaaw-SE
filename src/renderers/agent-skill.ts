import { readFile } from "node:fs/promises";

export async function renderAgentSkill(source: string, expectedName: string): Promise<string> {
  const text = await readFile(source, "utf8");
  if (!text.startsWith("---\n")) throw new Error(`${expectedName}: SKILL.md frontmatter must start on line 1`);
  if (!text.includes(`\nname: ${expectedName}\n`)) throw new Error(`${expectedName}: canonical skill name mismatch`);
  if (!text.includes("\ndescription: ")) throw new Error(`${expectedName}: canonical skill description missing`);
  if (!text.includes(".yaaw-core/")) throw new Error(`${expectedName}: canonical skill must use project-root-relative .yaaw-core references`);
  return text;
}
