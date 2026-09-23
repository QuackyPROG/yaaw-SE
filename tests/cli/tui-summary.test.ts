import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatPlan } from "../../src/tui/confirm-plan.js";
import { formatSuccess } from "../../src/tui/result.js";
import type { InstallPlan } from "../../src/installer/types.js";

describe("installer user-facing summaries", () => {
  it("describes planned impact without exposing internal transaction opcodes", () => {
    const root = join(process.cwd(), "example-project");
    const plan: InstallPlan = {
      action: "quick-update",
      projectRoot: root,
      selectedIntegrations: ["codex"],
      selectedSkills: ["yaaw-orchestrator", "yaaw-review"],
      warnings: [],
      operations: [
        { type: "mkdir", path: join(root, ".yaaw-core"), owner: "layout" },
        {
          type: "copy-managed-file",
          source: join(process.cwd(), "payload", "lifecycle.md"),
          path: join(root, ".yaaw-core", "system", "core", "lifecycle.md"),
          owner: "package:system"
        },
        {
          type: "copy-managed-file",
          source: join(process.cwd(), "payload", "SKILL.md"),
          path: join(root, ".agents", "skills", "yaaw-orchestrator", "SKILL.md"),
          owner: "integration:codex"
        },
        {
          type: "write-project-file-if-missing",
          path: join(root, ".yaaw-core", "project", "product.md"),
          content: "# Product\n"
        },
        {
          type: "update-managed-section",
          path: join(root, "AGENTS.md"),
          sectionId: "yaaw-se",
          content: "managed",
          owner: "integration:codex"
        }
      ]
    };

    const output = formatPlan(plan);
    expect(output).toContain("Action: Quick update");
    expect(output).toContain("Managed files to reconcile: 2");
    expect(output).toContain("Project files created only if missing: 1");
    expect(output).toContain("Managed file sections to update: 1");
    expect(output).toContain("YAAW engine (.yaaw-core/system): 1 file");
    expect(output).toContain("Codex skill entrypoints: 1 file");
    expect(output).toContain("AGENTS.md [yaaw-se]");
    expect(output).toContain("Existing durable project memory overwritten: 0");
    expect(output).not.toContain("copy-managed-file");
    expect(output).not.toContain("write-managed-file");
  });

  it("reports what actually changed after execution", () => {
    const root = join(process.cwd(), "example-project");
    const output = formatSuccess({
      projectRoot: root,
      selected: ["codex"],
      version: "0.1.1",
      action: "quick-update",
      changed: [
        ".yaaw-core/system/core/lifecycle.md",
        ".agents/skills/yaaw-orchestrator/SKILL.md",
        "AGENTS.md",
        ".yaaw-core/install/manifest.json",
        ".yaaw-core/system/"
      ]
    });

    expect(output).toContain("Files changed: 4");
    expect(output).toContain("YAAW engine: 1 file");
    expect(output).toContain("Codex skills: 1 file");
    expect(output).toContain("Codex bootstrap: AGENTS.md");
    expect(output).toContain("Installer metadata/backups: 1 file");
    expect(output).toContain("Existing durable project memory was not overwritten");
    expect(output).toContain("Codex: $yaaw-orchestrator");
  });
});
