import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "../../.yaaw-core/system/tools/frontmatter.mjs";

describe("YAAW frontmatter parser", () => {
  it("parses block-list review evidence and nested repository identity", () => {
    const value:any = parseFrontmatter(`---
schema: yaaw.review/v2
ticket: TASK-001
round: 11
result: PASS
ticket_revision: 1
spec_revision: 1
repository:
  schema: yaaw.repository-identity/v2
  worktree_digest: sha256:current
  components:
    status_sha256: one
    unstaged_diff_sha256: two
    staged_diff_sha256: three
    untracked_manifest_sha256: four
  changed_paths:
    - path: src/app.ts
      kind: tracked
evidence:
  - EVIDENCE-TASK-001-V6
  - "EVIDENCE-TASK-001-V5"
---
# Review
`);
    expect(value.evidence).toEqual(["EVIDENCE-TASK-001-V6", "EVIDENCE-TASK-001-V5"]);
    expect(value.repository.worktree_digest).toBe("sha256:current");
    expect(value.repository.components.status_sha256).toBe("one");
    expect(value.repository.changed_paths).toEqual([{ path: "src/app.ts", kind: "tracked" }]);
  });

  it("parses ticket block lists and YAML-style inline arrays as arrays", () => {
    const value:any = parseFrontmatter(`---
schema: yaaw.ticket/v1
id: TASK-003
dependencies:
  - TASK-001
  - TASK-002
decision_ids: [ENG-001, ENG-002]
expertise:
  - frontend
  - testing
---
# Ticket
`);
    expect(value.dependencies).toEqual(["TASK-001", "TASK-002"]);
    expect(value.decision_ids).toEqual(["ENG-001", "ENG-002"]);
    expect(value.expertise).toEqual(["frontend", "testing"]);
  });
});
