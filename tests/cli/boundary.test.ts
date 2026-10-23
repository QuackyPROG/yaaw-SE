import { mkdtemp, mkdir, realpath, symlink } from "node:fs/promises";
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
    // Windows junctions exercise the same realpath escape without elevated symlink privilege.
    await symlink(outside, join(root, ".agents"), process.platform === "win32" ? "junction" : "dir");
    await expect(assertSafeDestination(root, join(root, ".agents", "skills", "x"))).rejects.toThrow(/escape/i);
  });

  it("canonicalizes a not-yet-created child using its real parent", async () => {
    const parent = await mkdtemp(join(tmpdir(), "yaaw-parent-"));
    const child = join(parent, "new project");
    const canonicalParent = await realpath(parent);
    expect(await resolveProjectRoot(child)).toBe(join(canonicalParent, "new project"));
  });
});
