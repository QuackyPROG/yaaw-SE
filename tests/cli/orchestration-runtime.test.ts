import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];
const sourceSystem = resolve(".yaaw-core/system");

function git(root: string, ...args: string[]) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}
async function walk(dir: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else result.push(path);
  }
  return result;
}
async function sha256(path: string) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "yaaw-runtime-"));
  roots.push(root);
  await mkdir(join(root, ".yaaw-core"), { recursive: true });
  await cp(sourceSystem, join(root, ".yaaw-core", "system"), { recursive: true });
  for (const dir of [
    ".yaaw-core/project/specs", ".yaaw-core/project/tickets", ".yaaw-core/project/evidence",
    ".yaaw-core/project/reviews", ".yaaw-core/project/research", ".yaaw-core/project/rules",
    ".yaaw-core/runtime", ".yaaw-core/install"
  ]) await mkdir(join(root, dir), { recursive: true });

  await writeFile(join(root, ".yaaw-core/project/product.md"), `---
schema: yaaw.product/v1
revision: 1
status: ready
---
# Product
`);
  await writeFile(join(root, ".yaaw-core/project/engineering.md"), `---
schema: yaaw.engineering/v2
revision: 1
status: ready
product_revision: 1
current_frontier: FRONTIER-001
readiness: PASS
scope_status: UNKNOWN
---
# Engineering
`);
  await writeFile(join(root, ".yaaw-core/project/specs/SPEC-001.md"), `---
schema: yaaw.spec/v1
id: SPEC-001
revision: 1
status: ACCEPTED
product_revision: 1
engineering_revision: 1
frontier_id: FRONTIER-001
decision_ids: []
---
# SPEC-001
`);
  await writeFile(join(root, ".yaaw-core/project/tickets/TASK-001.md"), `---
schema: yaaw.ticket/v1
id: TASK-001
revision: 1
spec: SPEC-001
spec_revision: 1
product_revision: 1
engineering_revision: 1
status: READY
dependencies: []
decision_ids: []
expertise: []
---
# TASK-001
`);
  await writeFile(join(root, ".yaaw-core/project/state.json"), JSON.stringify({
    schema: "yaaw.project-state/v2",
    phase: "implementation",
    product: { artifact: ".yaaw-core/project/product.md", status: "ready", revision: 1 },
    planning: {
      artifact: ".yaaw-core/project/engineering.md", status: "ready", revision: 1,
      current_frontier: "FRONTIER-001", readiness: "PASS",
      active_spec: ".yaaw-core/project/specs/SPEC-001.md", scope_status: "UNKNOWN"
    },
    active_ticket: "TASK-001",
    tickets: { "TASK-001": "READY" },
    transition_sequence: 1,
    last_transition: null,
    blocker: null,
    last_observed_commit: null,
    last_workflow: "planning.create-tickets"
  }, null, 2) + "\n");

  const managedFiles: Record<string, any> = {};
  for (const path of await walk(join(root, ".yaaw-core/system"))) {
    const rel = relative(root, path).replaceAll("\\", "/");
    managedFiles[rel] = { owner: "package:system", sha256: await sha256(path), localOverride: false };
  }
  await writeFile(join(root, ".yaaw-core/install/manifest.json"), JSON.stringify({
    schema: "yaaw.installation/v2",
    yaawVersion: "0.3.0-test",
    systemSchema: 3,
    installationSchema: 3,
    projectSchema: 2,
    installedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    project: { root: "." },
    integrations: {},
    skills: [],
    managedFiles,
    managedSections: {},
    managedConfigKeys: {}
  }, null, 2) + "\n");

  git(root, "init");
  git(root, "config", "user.email", "yaaw@example.test");
  git(root, "config", "user.name", "YAAW Test");
  git(root, "add", ".");
  git(root, "commit", "-m", "fixture");
  return root;
}
function run(root: string, ...extra: string[]) {
  const tool = join(root, ".yaaw-core/system/tools/orchestration-runtime.mjs");
  try {
    return JSON.parse(execFileSync(process.execPath, [tool, "--workspace", root, ...extra], { encoding: "utf8" }));
  } catch (error: any) {
    const stdout = error?.stdout?.toString?.() ?? "";
    if (stdout) return JSON.parse(stdout);
    throw error;
  }
}
function evidenceRepository(repository: any) {
  return structuredClone(repository);
}
async function writeStart(root: string, repository: any) {
  await writeFile(join(root, ".yaaw-core/project/evidence/EVIDENCE-TASK-001-S1.json"), JSON.stringify({
    schema: "yaaw.evidence/v3",
    id: "EVIDENCE-TASK-001-S1",
    ticket: "TASK-001",
    ticket_revision: 1,
    spec_revision: 1,
    kind: "implementation_start",
    result: "STARTED",
    repository: evidenceRepository(repository),
    workflow: "implementation.implement-ticket",
    commands: [],
    checks: []
  }, null, 2) + "\n");
}
async function writeVerification(root: string, repository: any, result: "PASS"|"FAIL"|"BLOCKED") {
  await writeFile(join(root, ".yaaw-core/project/evidence/EVIDENCE-TASK-001-V1.json"), JSON.stringify({
    schema: "yaaw.evidence/v3",
    id: "EVIDENCE-TASK-001-V1",
    ticket: "TASK-001",
    ticket_revision: 1,
    spec_revision: 1,
    kind: "implementation_verification",
    result,
    repository: evidenceRepository(repository),
    workflow: "implementation.verify-ticket",
    commands: [],
    checks: []
  }, null, 2) + "\n");
}
async function writeReview(root: string, repository: any, evidence: string[]) {
  await writeFile(join(root, ".yaaw-core/project/reviews/TASK-001-R1.md"), `---
schema: yaaw.review/v2
ticket: TASK-001
round: 1
result: PASS
ticket_revision: 1
spec_revision: 1
repository:
  worktree_digest: ${repository.worktree_digest}
evidence:
${evidence.map(id => `  - ${id}`).join("\n")}
---
# TASK-001 review
`);
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })));
});

describe("deterministic orchestration runtime", () => {
  it("prepares one v3 handoff and validates that exact basis before dispatch", async () => {
    const root = await fixture();
    const prepared = run(root);
    expect(prepared.status).toBe("DISPATCH_READY");
    expect(prepared.workflow).toBe("implementation.implement-ticket");
    expect(prepared.role).toBe("implementer");
    const handoff = JSON.parse(await readFile(join(root, ".yaaw-core/runtime/handoff.json"), "utf8"));
    expect(handoff.schema).toBe("yaaw.handoff/v3");
    expect(handoff.repository.status).toBe("READY");
    expect(handoff.repository.worktree_digest).toMatch(/^sha256:/);
    expect(handoff.reads).toContain("state");
    expect(handoff.expertise).toContain("changeability");
    expect(run(root, "--check-handoff").status).toBe("HANDOFF_FRESH");

    await writeFile(join(root, ".yaaw-core/runtime/observed-state.json"), "{\"replaceable\":true}\n");
    expect(run(root, "--check-handoff").status).toBe("HANDOFF_FRESH");

    await writeFile(join(root, ".yaaw-core/project/product.md"), `---
schema: yaaw.product/v1
revision: 1
status: ready
---
# Product
Changed semantic product text.
`);
    expect(run(root, "--check-handoff").status).toBe("HANDOFF_STALE");
  });

  it("recovers start and PASS verification through two legal reconciliation passes", async () => {
    const root = await fixture();
    const prepared = run(root);
    await writeStart(root, prepared.handoff.repository);
    const first = run(root);
    expect(first.status).toBe("RECONCILE_REQUIRED");
    expect(first.reconciliation.id).toBe("IMPLEMENTATION_STARTED");
    expect(first.reconciliation.to).toBe("IN_PROGRESS");
    expect(run(root, "--reconcile-one").status).toBe("RECONCILED");

    let state = JSON.parse(await readFile(join(root, ".yaaw-core/project/state.json"), "utf8"));
    expect(state.tickets["TASK-001"]).toBe("IN_PROGRESS");

    await writeVerification(root, prepared.handoff.repository, "PASS");
    const second = run(root);
    expect(second.status).toBe("RECONCILE_REQUIRED");
    expect(second.reconciliation.id).toBe("IMPLEMENTATION_VERIFIED");
    expect(second.reconciliation.to).toBe("REVIEW_REQUIRED");
    expect(run(root, "--reconcile-one").status).toBe("RECONCILED");

    state = JSON.parse(await readFile(join(root, ".yaaw-core/project/state.json"), "utf8"));
    expect(state.tickets["TASK-001"]).toBe("REVIEW_REQUIRED");
    expect(state.transition_sequence).toBe(3);
  });

  it("does not promote a failed verification merely because evidence exists", async () => {
    const root = await fixture();
    const prepared = run(root);
    await writeStart(root, prepared.handoff.repository);
    expect(run(root, "--reconcile-one").status).toBe("RECONCILED");
    await writeVerification(root, prepared.handoff.repository, "FAIL");

    const next = run(root);
    expect(next.status).toBe("DISPATCH_READY");
    expect(next.workflow).toBe("implementation.verify-ticket");
    const state = JSON.parse(await readFile(join(root, ".yaaw-core/project/state.json"), "utf8"));
    expect(state.tickets["TASK-001"]).toBe("IN_PROGRESS");
  });

  it("adopts a real block-list review without a framework stop", async () => {
    const root = await fixture();
    const prepared = run(root);
    const statePath = join(root, ".yaaw-core/project/state.json");
    const state = JSON.parse(await readFile(statePath, "utf8"));
    state.tickets["TASK-001"] = "REVIEW_REQUIRED";
    await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
    await writeVerification(root, prepared.handoff.repository, "PASS");
    await writeReview(root, prepared.handoff.repository, ["EVIDENCE-TASK-001-V1"]);

    const next = run(root);
    expect(next.status).toBe("RECONCILE_REQUIRED");
    expect(next.reconciliation.id).toBe("REVIEW_RESULT_UNAPPLIED");
    expect(next.reconciliation.to).toBe("PASS");
  });

  it("honors block-list ticket dependencies instead of crashing on .every", async () => {
    const root = await fixture();
    const statePath = join(root, ".yaaw-core/project/state.json");
    const state = JSON.parse(await readFile(statePath, "utf8"));
    state.tickets["TASK-001"] = "PASS";
    state.tickets["TASK-002"] = "READY";
    state.active_ticket = "TASK-002";
    await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
    await writeFile(join(root, ".yaaw-core/project/tickets/TASK-002.md"), `---
schema: yaaw.ticket/v1
id: TASK-002
revision: 1
spec: SPEC-001
spec_revision: 1
product_revision: 1
engineering_revision: 1
status: READY
dependencies:
  - TASK-001
decision_ids:
  - ENG-001
expertise: []
---
# TASK-002
`);

    const next = run(root);
    expect(next.status).toBe("DISPATCH_READY");
    expect(next.workflow).toBe("implementation.implement-ticket");
    expect(next.handoff.active_artifact).toBe(".yaaw-core/project/tickets/TASK-002.md");
  });

  it("creates recovery handoffs for stale review evidence instead of BLOCKED", async () => {
    const root = await fixture();
    const prepared = run(root);
    const statePath = join(root, ".yaaw-core/project/state.json");
    const state = JSON.parse(await readFile(statePath, "utf8"));
    state.tickets["TASK-001"] = "REVIEW_REQUIRED";
    await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
    await writeReview(root, prepared.handoff.repository, ["EVIDENCE-TASK-001-OLD"]);

    const recoverVerification = run(root);
    expect(recoverVerification.status).toBe("DISPATCH_READY");
    expect(recoverVerification.workflow).toBe("implementation.verify-ticket");
    expect(recoverVerification.role).toBe("implementer");

    await writeVerification(root, recoverVerification.handoff.repository, "PASS");
    const refreshReview = run(root);
    expect(refreshReview.status).toBe("DISPATCH_READY");
    expect(refreshReview.workflow).toBe("review.review-ticket");
    expect(refreshReview.role).toBe("reviewer");
  });
});
