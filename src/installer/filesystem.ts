import { mkdir, open, rename, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export async function atomicWrite(path: string, content: Buffer | string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.yaaw-tmp-${randomUUID()}`;
  const handle = await open(tmp, "w");
  try {
    await handle.writeFile(content);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(tmp, path);
  } catch (error) {
    await unlink(tmp).catch(() => {});
    throw error;
  }
}
