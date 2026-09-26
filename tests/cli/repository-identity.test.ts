import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];
const tool = resolve(".yaaw-core/system/tools/repository-identity.mjs");

function git(root: string, ...args: string[]) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}

async function repo() {
  const root = await mkdtemp(join(tmpdir(), "yaaw-identity-"));
  roots.push(root);
  git(root, "init");
  git(root, "config", "user.email", "yaaw@example.test");
  git(root, "config", "user.name", "YAAW Test");
  await writeFile(join(root, "tracked.txt"), "one\n");
  git(root, "add", "tracked.txt");
  git(root, "commit", "-m", "initial");
  return root;
}

function identity(root: string) {
  return JSON.parse(execFileSync(process.execPath, [tool, "--workspace", root], { encoding: "utf8" }));
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })));
});

describe("canonical repository identity", () => {
  it("is deterministic for repeated calls", async () => {
    const root = await repo();
    expect(identity(root)).toEqual(identity(root));
  });

  it("changes for tracked, staged, and untracked mutations", async () => {
    const root = await repo();
    const clean = identity(root);

    await writeFile(join(root, "tracked.txt"), "two\n");
    const tracked = identity(root);
    expect(tracked.worktree_digest).not.toBe(clean.worktree_digest);
    expect(tracked.changed_paths.some((x: any) => x.path.endsWith("tracked.txt"))).toBe(true);

    git(root, "add", "tracked.txt");
    const staged = identity(root);
    expect(staged.worktree_digest).not.toBe(tracked.worktree_digest);

    await writeFile(join(root, "untracked.bin"), Buffer.from([0, 1, 2, 255]));
    const untracked = identity(root);
    expect(untracked.worktree_digest).not.toBe(staged.worktree_digest);
    expect(untracked.changed_paths.some((x: any) => x.path.endsWith("untracked.bin") && x.sha256)).toBe(true);

    await writeFile(join(root, "untracked.bin"), Buffer.from([0, 1, 3, 255]));
    expect(identity(root).worktree_digest).not.toBe(untracked.worktree_digest);
  });

  it("ignores lifecycle-generated YAAW outputs but observes semantic project files", async () => {
    const root = await repo();
    const baseline = identity(root);

    await mkdir(join(root, ".yaaw-core", "runtime"), { recursive: true });
    await mkdir(join(root, ".yaaw-core", "project", "evidence"), { recursive: true });
    await mkdir(join(root, ".yaaw-core", "project", "reviews"), { recursive: true });
    await writeFile(join(root, ".yaaw-core", "runtime", "handoff.json"), "{}\n");
    await writeFile(join(root, ".yaaw-core", "runtime", "observed-state.json"), "{}\n");
    await writeFile(join(root, ".yaaw-core", "project", "state.json"), "{}\n");
    await writeFile(join(root, ".yaaw-core", "project", "evidence", "EVIDENCE-TASK-001-V1.json"), "{}\n");
    await writeFile(join(root, ".yaaw-core", "project", "reviews", "TASK-001-R1.md"), "review\n");

    const afterLifecycleOutputs = identity(root);
    expect(afterLifecycleOutputs.worktree_digest).toBe(baseline.worktree_digest);
    expect(afterLifecycleOutputs.changed_paths).toEqual([]);

    await writeFile(join(root, ".yaaw-core", "project", "product.md"), "product intent\n");
    const afterProduct = identity(root);
    expect(afterProduct.worktree_digest).not.toBe(baseline.worktree_digest);
    expect(afterProduct.changed_paths.some((x: any) => x.path.endsWith(".yaaw-core/project/product.md"))).toBe(true);
  });

  it("does not include unrelated sibling changes when workspace is nested", async () => {
    const root = await repo();
    await mkdir(join(root, "consumer-a"));
    await mkdir(join(root, "consumer-b"));
    await writeFile(join(root, "consumer-a", "a.txt"), "a\n");
    await writeFile(join(root, "consumer-b", "b.txt"), "b\n");
    git(root, "add", "consumer-a", "consumer-b");
    git(root, "commit", "-m", "consumers");

    const before = identity(join(root, "consumer-a"));
    await writeFile(join(root, "consumer-b", "b.txt"), "changed sibling\n");
    const after = identity(join(root, "consumer-a"));
    expect(after.worktree_digest).toBe(before.worktree_digest);
    expect(after.git_root_relation).toBe("ancestor");
  });
});
