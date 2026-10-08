import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "../../.yaaw-core/system/engine/frontmatter.mjs";

describe("YAAW frontmatter parser", () => {
  it("parses nested repository identity and evidence lists", () => {
    const value:any=parseFrontmatter(`---\nschema: yaaw.review/v2\nticket: TASK-001\nround: 2\nresult: PASS\nticket_revision: 1\nspec_revision: 1\nrepository:\n  schema: yaaw.repository-identity/v2\n  algorithm: yaaw-worktree-v3\n  status: READY\n  workspace_scope: .\n  git_root_relation: same\n  head_commit: abc\n  dirty: false\n  worktree_digest: sha256:current\n  components: null\n  changed_paths: []\n  error: null\nevidence:\n  - EVIDENCE-TASK-001-V2\n---\n# Review\n`);
    expect(value.repository.algorithm).toBe("yaaw-worktree-v3");
    expect(value.evidence).toEqual(["EVIDENCE-TASK-001-V2"]);
  });

  it("parses ticket block lists and inline arrays", () => {
    const value:any=parseFrontmatter(`---\nschema: yaaw.ticket/v1\nid: TASK-003\nstatus: READY\ndependencies:\n  - TASK-001\n  - TASK-002\ndecision_ids: [ENG-001, ENG-002]\nexpertise:\n  - frontend-design\n  - testing\n---\n# Ticket\n`);
    expect(value.dependencies).toEqual(["TASK-001","TASK-002"]);
    expect(value.decision_ids).toEqual(["ENG-001","ENG-002"]);
    expect(value.expertise).toEqual(["frontend-design","testing"]);
  });
});
