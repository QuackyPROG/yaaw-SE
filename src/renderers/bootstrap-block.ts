import { readFile } from "node:fs/promises";

export async function renderBootstrapTemplate(source: string): Promise<string> {
  const text = await readFile(source, "utf8");
  if (!text.includes(".yaaw-core/")) throw new Error(`Bootstrap template does not reference canonical .yaaw-core: ${source}`);
  if (text.split("\n").length > 30) throw new Error(`Bootstrap template is too large: ${source}`);
  return text.trim() + "\n";
}
