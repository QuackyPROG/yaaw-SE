import { mkdtemp, mkdir, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertSafeDestination, resolveProjectRoot } from "../../src/installer/boundary.js";

describe("project boundary", () => {
  it("rejects traversal outside the selected root", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-boundary-"));
    await expect(assertSafeDestination(root, join(root, "..", "escape.txt"))).rejects.toThrow(/outside project root/);
  });

  it("rejects symlink escapes", async () => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-boundary-"));
    const outside = await mkdtemp(join(tmpdir(), "yaaw-outside-"));
    await symlink(outside, join(root, ".agents"), "dir");
    await expect(assertSafeDestination(root, join(root, ".agents", "skills", "x"))).rejects.toThrow(/escape/i);
  });

  it("canonicalizes a not-yet-created child using its real parent", async () => {
    const parent = await mkdtemp(join(tmpdir(), "yaaw-parent-"));
    const child = join(parent, "new project");
    expect(await resolveProjectRoot(child)).toBe(child);
  });
});
