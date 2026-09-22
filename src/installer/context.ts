import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function packageRoot(): string {
  return fileURLToPath(new URL("../../", import.meta.url));
}

export function payloadRoot(): string {
  return join(packageRoot(), "dist", "payload");
}

export async function packageVersion(): Promise<string> {
  const pkg = JSON.parse(await readFile(join(packageRoot(), "package.json"), "utf8"));
  return String(pkg.version);
}
