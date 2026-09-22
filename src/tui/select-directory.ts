import * as p from "@clack/prompts";

export async function selectDirectory(defaultDirectory: string): Promise<string> {
  const value = await p.text({
    message: "Where should YAAW-SE be installed?",
    placeholder: defaultDirectory,
    defaultValue: defaultDirectory
  });
  if (p.isCancel(value)) throw new Error("Installation cancelled");
  return String(value || defaultDirectory);
}
