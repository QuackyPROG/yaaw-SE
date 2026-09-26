#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const args = process.argv.slice(2);
let workspaceArg = ".";
let mode = "prepare";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--workspace" && args[i + 1]) {
    workspaceArg = args[i + 1];
    i += 1;
  } else if (args[i] === "--inspect-only") {
    mode = "inspect";
  } else if (args[i] === "--check-handoff") {
    mode = "check";
  } else {
    process.stderr.write("usage: orchestration-runtime.mjs [--workspace <path>] [--inspect-only|--check-handoff]\n");
    process.exit(2);
  }
}

const workspace = resolve(workspaceArg);
const systemRoot = join(workspace, ".yaaw-core", "system");
const projectRoot = join(workspace, ".yaaw-core", "project");
const runtimeRoot = join(workspace, ".yaaw-core", "runtime");
const observedPath = join(runtimeRoot, "observed-state.json");
const handoffPath = join(runtimeRoot, "handoff.json");

const readJson = async path => JSON.parse(await readFile(path, "utf8"));
const readJsonOrNull = async path => {
  try { return await readJson(path); } catch { return null; }
};
const exists = async path => {
  try { await readFile(path); return true; } catch { return false; }
};
const unique = values => [...new Set(values.filter(Boolean))];
const normalizeStatus = value => String(value ?? "").trim().toLowerCase();

function parseScalar(raw) {
  const value = raw.trim();
  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^[0-9]+$/.test(value)) return Number(value);
  if (value.startsWith("[") || value.startsWith("{")) {
    try { return JSON.parse(value); } catch {}
  }
  return value.replace(/^["']|["']$/g, "");
}

async function frontmatter(path) {
  try {
    const text = await readFile(path, "utf8");
    const lines = text.split(/\r?\n/);
    if (lines[0]?.trim() !== "---") return null;
    const end = lines.slice(1).findIndex(line => line.trim() === "---");
    if (end < 0) return null;
    const data = {};
    for (const line of lines.slice(1, end + 1)) {
      if (!line.trim() || line.trim().startsWith("#") || !line.includes(":")) continue;
      const index = line.indexOf(":");
      data[line.slice(0, index).trim()] = parseScalar(line.slice(index + 1));
    }
    return data;
  } catch {
    return null;
  }
}

async function files(dir, pattern) {
  try {
    return (await readdir(dir, { withFileTypes: true }))
      .filter(entry => entry.isFile() && pattern.test(entry.name))
      .map(entry => join(dir, entry.name))
      .sort();
  } catch {
    return [];
  }
}

async function reviewRecord(path) {
  try {
    const text = await readFile(path, "utf8");
    const lines = text.split(/\r?\n/);
    if (lines[0]?.trim() !== "---") return null;
    const closing = lines.slice(1).findIndex(line => line.trim() === "---");
    if (closing < 0) return null;
    const data = { repository: {} };
    let repository = false;
    for (const line of lines.slice(1, closing + 1)) {
      if (/^repository:\s*$/.test(line)) {
        repository = true;
        continue;
      }
      const nested = line.match(/^\s{2}([A-Za-z0-9_]+):\s*(.*)$/);
      if (repository && nested) {
        data.repository[nested[1]] = parseScalar(nested[2]);
        continue;
      }
      if (!/^\S/.test(line)) continue;
      repository = false;
      const top = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (top) data[top[1]] = parseScalar(top[2]);
    }
    if (!data.repository.worktree_digest && data.reviewed_worktree_digest) {
      data.repository.worktree_digest = data.reviewed_worktree_digest;
      data.repository.head_commit = data.reviewed_head_commit ?? null;
      data.repository.dirty = data.reviewed_dirty ?? null;
    }
    return data;
  } catch {
    return null;
  }
}

async function evidenceRecords(paths) {
  const records = [];
  for (const path of paths) {
    try {
      const value = await readJson(path);
      records.push({ path, value });
    } catch {}
  }
  return records;
}

function runJsonTool(path, toolArgs) {
  const result = spawnSync(process.execPath, [path, ...toolArgs], {
    cwd: workspace,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024
  });
  let parsed;
  try {
    parsed = JSON.parse(result.stdout || "{}");
  } catch {
    throw new Error((result.stderr || "").trim() || `invalid JSON from ${basename(path)}`);
  }
  return { parsed, status: result.status ?? 2, stderr: (result.stderr || "").trim() };
}

function frameworkView(raw, overrideStatus = null) {
  const status = overrideStatus ?? raw?.status ?? "UNKNOWN";
  return {
    yaaw_version: String(raw?.package_version ?? "unknown"),
    system_schema: Number(raw?.system_schema ?? 1),
    installation_schema: Number(raw?.installation_schema ?? 1),
    project_schema: Number(raw?.project_schema ?? 1),
    manifest_digest: String(raw?.manifest_digest ?? "sha256:unknown"),
    integrity_status: status,
    modified: Array.isArray(raw?.modified) ? raw.modified : [],
    missing: Array.isArray(raw?.missing) ? raw.missing : [],
    local_overrides: Array.isArray(raw?.local_overrides) ? raw.local_overrides : [],
    repair_required: status !== "HEALTHY"
  };
}

function handoffFramework(framework) {
  return {
    yaaw_version: framework.yaaw_version,
    system_schema: framework.system_schema,
    installation_schema: framework.installation_schema,
    project_schema: framework.project_schema,
    manifest_digest: framework.manifest_digest,
    integrity_status: "HEALTHY"
  };
}

function repositoryView(raw) {
  return {
    status: raw?.status ?? "UNAVAILABLE",
    workspace_scope: String(raw?.workspace_scope ?? "."),
    git_root_relation: raw?.git_root_relation ?? "unknown",
    head_commit: raw?.head_commit ?? null,
    dirty: typeof raw?.dirty === "boolean" ? raw.dirty : null,
    worktree_digest: raw?.worktree_digest ?? null,
    error: raw?.error ?? null
  };
}

function contractFailure(frameworkRaw, errors) {
  return {
    framework: frameworkView(frameworkRaw, "CONTRACT_INCONSISTENT"),
    errors
  };
}

async function loadContracts() {
  const registryRoot = join(systemRoot, "registries");
  const [workflows, execution, roleIo, routing, handoffPolicy, artifacts] = await Promise.all([
    readJson(join(registryRoot, "workflows.json")),
    readJson(join(registryRoot, "execution-policy.json")),
    readJson(join(registryRoot, "role-io.json")),
    readJson(join(registryRoot, "routing-policy.json")),
    readJson(join(registryRoot, "handoff-policy.json")),
    readJson(join(registryRoot, "artifacts.json"))
  ]);
  const errors = [];
  for (const [workflow, policy] of Object.entries(handoffPolicy.workflows ?? {})) {
    const registered = workflows[workflow];
    const executionPolicy = execution.workflows?.[workflow];
    if (!registered) errors.push(`handoff-policy references unknown workflow ${workflow}`);
    if (!executionPolicy) errors.push(`workflow ${workflow} has no execution policy`);
    const role = registered?.role;
    const io = roleIo.roles?.[role];
    if (!io) errors.push(`workflow ${workflow} has unknown role ${role}`);
    if (io) {
      const badReads = (policy.reads ?? []).filter(id => !io.reads.includes(id));
      const badWrites = (policy.writes ?? []).filter(id => !io.writes.includes(id));
      if (badReads.length) errors.push(`${workflow} reads exceed role I/O: ${badReads.join(",")}`);
      if (badWrites.length) errors.push(`${workflow} writes exceed role I/O: ${badWrites.join(",")}`);
    }
  }
  return { workflows, execution, roleIo, routing, handoffPolicy, artifacts, errors };
}

function idFromSpec(value) {
  if (!value) return null;
  const match = String(value).match(/SPEC-[0-9]+/);
  return match ? match[0] : null;
}

async function inspectArtifacts(state) {
  const productPath = join(projectRoot, "product.md");
  const engineeringPath = join(projectRoot, "engineering.md");
  const specPaths = await files(join(projectRoot, "specs"), /^SPEC-[0-9]+\.md$/);
  const ticketPaths = await files(join(projectRoot, "tickets"), /^TASK-[0-9]+\.md$/);
  const reviewPaths = await files(join(projectRoot, "reviews"), /^TASK-[0-9]+-R[0-9]+\.md$/);
  const evidencePaths = await files(join(projectRoot, "evidence"), /\.json$/);
  const researchPaths = await files(join(projectRoot, "research"), /^RSH-.*\.md$/);
  const rulePaths = await files(join(projectRoot, "rules"), /\.md$/);

  const product = await frontmatter(productPath);
  const engineering = await frontmatter(engineeringPath);
  const specs = {};
  for (const path of specPaths) {
    const meta = await frontmatter(path);
    if (meta?.id) specs[meta.id] = { path, meta };
  }
  const tickets = {};
  for (const path of ticketPaths) {
    const meta = await frontmatter(path);
    if (meta?.id) tickets[meta.id] = { path, meta };
  }

  const activeSpecId = idFromSpec(state?.planning?.active_spec);
  const activeSpec = activeSpecId ? specs[activeSpecId] ?? null : null;
  return {
    product: { path: productPath, meta: product },
    engineering: { path: engineeringPath, meta: engineering },
    specs,
    tickets,
    activeSpecId,
    activeSpec,
    reviews: reviewPaths,
    evidence: evidencePaths,
    research: researchPaths,
    rules: rulePaths
  };
}

function artifactSummary(artifacts) {
  const rel = path => path.replace(workspace + "/", "").replaceAll("\\", "/");
  return {
    product: artifacts.product.meta ? { path: rel(artifacts.product.path), metadata: artifacts.product.meta } : null,
    engineering: artifacts.engineering.meta ? { path: rel(artifacts.engineering.path), metadata: artifacts.engineering.meta } : null,
    active_spec: artifacts.activeSpec ? { path: rel(artifacts.activeSpec.path), metadata: artifacts.activeSpec.meta } : null,
    specs: Object.fromEntries(Object.entries(artifacts.specs).map(([id, value]) => [id, { path: rel(value.path), metadata: value.meta }])),
    tickets: Object.fromEntries(Object.entries(artifacts.tickets).map(([id, value]) => [id, { path: rel(value.path), metadata: value.meta }])),
    reviews: artifacts.reviews.map(rel),
    evidence: artifacts.evidence.map(rel)
  };
}

function ticketSourceCurrent(state, artifacts, ticketId) {
  const ticket = artifacts.tickets[ticketId]?.meta;
  const spec = artifacts.activeSpec?.meta;
  if (!ticket || !spec) return false;
  return Number(ticket.product_revision) === Number(state.product?.revision)
    && Number(ticket.engineering_revision) === Number(state.planning?.revision)
    && Number(ticket.spec_revision) === Number(spec.revision)
    && String(ticket.spec ?? "") === String(artifacts.activeSpecId ?? "");
}

function currentEvidenceFor(records, state, artifacts, ticketId) {
  const ticketRevision = Number(artifacts.tickets[ticketId]?.meta?.revision);
  const specRevision = Number(artifacts.activeSpec?.meta?.revision);
  return records.filter(({ value }) =>
    value?.ticket === ticketId
    && value?.kind === "implementation_verification"
    && Number(value?.ticket_revision) === ticketRevision
    && Number(value?.spec_revision) === specRevision
  );
}

async function acceptanceInconsistencies(state, artifacts, repository) {
  const issues = [];
  const evidence = await evidenceRecords(artifacts.evidence);
  for (const ticketId of Object.keys(state?.tickets ?? {}).sort()) {
    const lifecycle = state.tickets[ticketId];
    if (!["PASS", "IN_PROGRESS", "READY"].includes(lifecycle)) continue;
    const currentEvidence = currentEvidenceFor(evidence, state, artifacts, ticketId);
    const currentVerification = repository.status === "READY"
      ? currentEvidence.filter(({ value }) => value?.repository?.worktree_digest === repository.worktree_digest)
      : currentEvidence;

    if (lifecycle === "IN_PROGRESS" && currentVerification.length) {
      issues.push(`IMPLEMENTATION_VERIFIED_NOT_REVIEWED:${ticketId}`);
      continue;
    }
    if (lifecycle === "READY" && currentVerification.length) {
      issues.push(`IMPLEMENTATION_ALREADY_PRESENT:${ticketId}`);
      continue;
    }
    if (lifecycle !== "PASS") continue;

    if (!ticketSourceCurrent(state, artifacts, ticketId)) {
      issues.push(`TICKET_SOURCE_STALE:${ticketId}`);
      continue;
    }

    const reviewPath = artifacts.reviews
      .filter(path => basename(path).startsWith(ticketId + "-R"))
      .sort((a, b) => {
        const ar = Number(basename(a).match(/-R([0-9]+)/)?.[1] ?? 0);
        const br = Number(basename(b).match(/-R([0-9]+)/)?.[1] ?? 0);
        return br - ar;
      })[0];
    if (!reviewPath) {
      issues.push(`REVIEW_MISSING:${ticketId}`);
    } else {
      const review = await reviewRecord(reviewPath);
      const ticketRevision = Number(artifacts.tickets[ticketId]?.meta?.revision);
      const specRevision = Number(artifacts.activeSpec?.meta?.revision);
      if (!review || review.ticket !== ticketId || review.result !== "PASS"
          || Number(review.ticket_revision) !== ticketRevision
          || Number(review.spec_revision) !== specRevision) {
        issues.push(`REVIEW_MISSING:${ticketId}`);
      } else if (!review.repository?.worktree_digest) {
        issues.push(`LEGACY_IDENTITY_UNVERIFIABLE:${ticketId}`);
      } else if (repository.status === "READY" && review.repository.worktree_digest !== repository.worktree_digest) {
        issues.push(`REVIEW_REPOSITORY_STALE:${ticketId}`);
      }
    }

    if (!currentEvidence.length) {
      issues.push(`VERIFICATION_MISSING:${ticketId}`);
    } else if (repository.status === "READY" && !currentVerification.length) {
      issues.push(`VERIFICATION_REPOSITORY_STALE:${ticketId}`);
    }
  }
  return unique(issues);
}

function metadataInconsistencies(state, artifacts) {
  const inconsistencies = [];
  if (!state || state.schema !== "yaaw.project-state/v1") {
    inconsistencies.push("PROJECT_STATE_MISSING_OR_INVALID");
    return inconsistencies;
  }
  const product = artifacts.product.meta;
  if (product) {
    if (Number(product.revision ?? -1) !== Number(state.product?.revision ?? -2)) inconsistencies.push("PRODUCT_REVISION_MISMATCH");
    if (normalizeStatus(product.status) !== normalizeStatus(state.product?.status)) inconsistencies.push("PRODUCT_STATUS_MISMATCH");
  } else if ((state.product?.status ?? "missing") !== "missing") {
    inconsistencies.push("PRODUCT_ARTIFACT_MISSING");
  }
  const engineering = artifacts.engineering.meta;
  if (engineering) {
    if (Number(engineering.revision ?? -1) !== Number(state.planning?.revision ?? -2)) inconsistencies.push("ENGINEERING_REVISION_MISMATCH");
    if (normalizeStatus(engineering.status) !== normalizeStatus(state.planning?.status)) inconsistencies.push("ENGINEERING_STATUS_MISMATCH");
    if (normalizeStatus(engineering.readiness) !== normalizeStatus(state.planning?.readiness)) inconsistencies.push("ENGINEERING_READINESS_MISMATCH");
  } else if ((state.planning?.status ?? "missing") !== "missing") {
    inconsistencies.push("ENGINEERING_ARTIFACT_MISSING");
  }
  if (state.planning?.active_spec && !artifacts.activeSpec) inconsistencies.push("ACTIVE_SPEC_MISSING");
  for (const ticketId of Object.keys(state.tickets ?? {})) {
    if (!artifacts.tickets[ticketId]) inconsistencies.push(`TICKET_ARTIFACT_MISSING:${ticketId}`);
  }
  return inconsistencies;
}

function dependenciesSatisfied(ticketId, artifacts, state) {
  const deps = artifacts.tickets[ticketId]?.meta?.dependencies;
  if (!Array.isArray(deps)) return true;
  return deps.every(dep => state.tickets?.[dep] === "PASS");
}

function route(state, artifacts, routing) {
  if (state.blocker) return { kind: "BLOCKED", terminal: "BLOCKED", reason: state.blocker.kind ?? "PROJECT_BLOCKED" };
  if (normalizeStatus(state.product?.status) !== "ready") return { kind: "WORKFLOW", workflow: routing.product_unready_workflow };
  const tickets = state.tickets ?? {};

  for (const rule of routing.ticket_state_precedence ?? []) {
    if (rule.state === "REPLAN_REQUIRED") {
      const ticket = Object.keys(tickets).sort().find(id => tickets[id] === rule.state);
      if (ticket) return { kind: "WORKFLOW", workflow: rule.workflow, ticket };
    }
  }

  if (normalizeStatus(state.planning?.status) !== "ready" || state.planning?.readiness !== "PASS") {
    return { kind: "WORKFLOW", workflow: routing.planning_unready_workflow };
  }
  if (!artifacts.activeSpec || normalizeStatus(artifacts.activeSpec.meta?.status) !== "accepted") {
    return { kind: "WORKFLOW", workflow: routing.missing_spec_workflow };
  }
  if (Object.keys(tickets).length === 0) {
    return { kind: "WORKFLOW", workflow: routing.missing_tickets_workflow };
  }

  for (const rule of routing.ticket_state_precedence ?? []) {
    if (rule.state === "REPLAN_REQUIRED") continue;
    const candidates = Object.keys(tickets).sort().filter(id => tickets[id] === rule.state);
    const ticket = rule.state === "READY"
      ? candidates.find(id => dependenciesSatisfied(id, artifacts, state))
      : candidates[0];
    if (ticket) {
      if (rule.workflow.startsWith("orchestration.")) return { kind: "ROOT_ACTION", workflow: rule.workflow, ticket };
      return { kind: "WORKFLOW", workflow: rule.workflow, ticket };
    }
  }

  const states = Object.values(tickets);
  if (states.some(value => value === "BLOCKED")) return { kind: "BLOCKED", terminal: "BLOCKED", reason: "TICKET_BLOCKED" };
  if (states.length && states.every(value => value === "PASS" || value === "CANCELLED")) {
    if (state.phase === "complete") return { kind: "TERMINAL", terminal: routing.complete_terminal };
    return { kind: "WORKFLOW", workflow: routing.next_frontier_workflow };
  }
  return { kind: "ROOT_ACTION", workflow: "orchestration.recover-interruption", reason: "NO_SAFE_SEMANTIC_ROUTE" };
}

function requirementAllows(requirement, repository) {
  if (requirement === "NONE") return true;
  if (requirement === "IDENTITY") return repository.status === "READY";
  return repository.status === "READY" || repository.status === "UNVERSIONED";
}

function rel(path) {
  return path.replace(workspace + "/", "").replaceAll("\\", "/");
}

function referencesFor(policy, artifacts, ticketId) {
  const refs = [];
  for (const artifact of policy.reads ?? []) {
    if (artifact === "product" && artifacts.product.meta) refs.push(rel(artifacts.product.path));
    else if (artifact === "engineering" && artifacts.engineering.meta) refs.push(rel(artifacts.engineering.path));
    else if (artifact === "engineering_research") refs.push(...artifacts.research.map(rel));
    else if (artifact === "spec" && artifacts.activeSpec) refs.push(rel(artifacts.activeSpec.path));
    else if (artifact === "ticket" && ticketId && artifacts.tickets[ticketId]) refs.push(rel(artifacts.tickets[ticketId].path));
    else if (artifact === "project_rule") refs.push(...artifacts.rules.map(rel));
    else if (artifact === "review" && ticketId) refs.push(...artifacts.reviews.filter(path => basename(path).startsWith(ticketId + "-")).map(rel));
    else if (artifact === "evidence" && ticketId) refs.push(...artifacts.evidence.filter(path => basename(path).includes(ticketId)).map(rel));
    else if (artifact === "state") refs.push(".yaaw-core/project/state.json");
  }
  return unique(refs).sort();
}

function revisionsFor(state, artifacts, ticketId) {
  const revisions = {};
  if (Number.isInteger(state.product?.revision)) revisions.product = state.product.revision;
  if (Number.isInteger(state.planning?.revision)) revisions.engineering = state.planning.revision;
  if (Number.isInteger(artifacts.activeSpec?.meta?.revision)) revisions.spec = artifacts.activeSpec.meta.revision;
  if (ticketId && Number.isInteger(artifacts.tickets[ticketId]?.meta?.revision)) revisions.ticket = artifacts.tickets[ticketId].meta.revision;
  return revisions;
}

async function expertiseFor(policy, workflowRole, artifacts, ticketId) {
  const registry = await readJson(join(systemRoot, "registries", "expertise.json"));
  const requested = [...(policy.required_expertise ?? [])];
  if (policy.ticket_expertise && ticketId) {
    const ticketExpertise = artifacts.tickets[ticketId]?.meta?.expertise;
    if (Array.isArray(ticketExpertise)) requested.push(...ticketExpertise);
  }
  return unique(requested)
    .filter(id => registry[id] && (registry[id].usable_by ?? []).includes(workflowRole))
    .sort();
}

function activeArtifact(policy, artifacts, ticketId) {
  if (policy.active_artifact === "product") return artifacts.product.meta ? rel(artifacts.product.path) : null;
  if (policy.active_artifact === "engineering") return artifacts.engineering.meta ? rel(artifacts.engineering.path) : null;
  if (policy.active_artifact === "spec") return artifacts.activeSpec ? rel(artifacts.activeSpec.path) : null;
  if (policy.active_artifact === "ticket") return ticketId && artifacts.tickets[ticketId] ? rel(artifacts.tickets[ticketId].path) : null;
  return null;
}

async function buildHandoff(selected, contracts, state, artifacts, framework, repository) {
  const registered = contracts.workflows[selected.workflow];
  const policy = contracts.handoffPolicy.workflows[selected.workflow];
  const execution = contracts.execution.workflows[selected.workflow];
  if (!registered || !policy || !execution) {
    throw new Error(`missing deterministic handoff contract for ${selected.workflow}`);
  }
  const role = registered.role;
  const roleContract = contracts.roleIo.roles[role];
  return {
    schema: "yaaw.handoff/v2",
    framework: handoffFramework(framework),
    role,
    workflow: selected.workflow,
    desired_intent: policy.desired_intent ?? null,
    active_artifact: activeArtifact(policy, artifacts, selected.ticket),
    references: referencesFor(policy, artifacts, selected.ticket),
    reads: unique(policy.reads ?? []),
    writes: unique(policy.writes ?? []),
    forbidden_writes: unique(roleContract.forbidden_writes ?? []),
    revisions: revisionsFor(state, artifacts, selected.ticket),
    expertise: await expertiseFor(policy, role, artifacts, selected.ticket),
    host_expertise: [],
    expected_output: policy.expected_output,
    result_vocabulary: unique(policy.result_vocabulary ?? []),
    repository_requirement: execution.repository_requirement,
    repository,
    transition_sequence: state.transition_sequence ?? 0
  };
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function clearHandoff() {
  await rm(handoffPath, { force: true });
}

async function main() {
  const frameworkTool = join(systemRoot, "tools", "framework-integrity.mjs");
  const identityTool = join(systemRoot, "tools", "repository-identity.mjs");

  let frameworkRun;
  try {
    frameworkRun = runJsonTool(frameworkTool, ["--workspace", workspace]);
  } catch (error) {
    frameworkRun = { parsed: { status: "UNKNOWN", package_version: null, manifest_digest: null }, status: 2, stderr: String(error?.message ?? error) };
  }
  const frameworkRaw = frameworkRun.parsed;
  let framework = frameworkView(frameworkRaw);

  let contracts;
  try {
    contracts = await loadContracts();
  } catch (error) {
    const observed = {
      schema: "yaaw.observed-state/v2",
      framework: frameworkView(frameworkRaw, "CONTRACT_INCONSISTENT"),
      repository: repositoryView(null),
      transition_sequence: 0,
      claims: {},
      artifacts: {},
      inconsistencies: [`FRAMEWORK_CONTRACT_INCONSISTENCY:${String(error?.message ?? error)}`],
      candidate_actions: []
    };
    if (mode !== "check") {
      await mkdir(runtimeRoot, { recursive: true });
      await writeFile(observedPath, JSON.stringify(observed, null, 2) + "\n");
      await clearHandoff();
    }
    return { schema: "yaaw.orchestration-runtime/v1", status: "FRAMEWORK_STOP", reason: "FRAMEWORK_CONTRACT_INCONSISTENCY", observed };
  }

  if (contracts.errors.length) {
    framework = contractFailure(frameworkRaw, contracts.errors).framework;
  }

  let repositoryRaw = null;
  try {
    repositoryRaw = runJsonTool(identityTool, ["--workspace", workspace]).parsed;
  } catch (error) {
    repositoryRaw = { status: "UNAVAILABLE", workspace_scope: ".", git_root_relation: "unknown", head_commit: null, dirty: null, worktree_digest: null, error: String(error?.message ?? error) };
  }
  const repository = repositoryView(repositoryRaw);

  const state = await readJsonOrNull(join(projectRoot, "state.json"));
  const artifacts = await inspectArtifacts(state);
  const inconsistencies = metadataInconsistencies(state, artifacts);
  inconsistencies.push(...await acceptanceInconsistencies(state, artifacts, repository));
  if (contracts.errors.length) inconsistencies.unshift(...contracts.errors.map(error => `FRAMEWORK_CONTRACT_INCONSISTENCY:${error}`));

  const observed = {
    schema: "yaaw.observed-state/v2",
    framework,
    repository,
    transition_sequence: state?.transition_sequence ?? 0,
    claims: state ?? {},
    artifacts: artifactSummary(artifacts),
    inconsistencies,
    candidate_actions: []
  };

  if (framework.integrity_status !== "HEALTHY") {
    observed.candidate_actions = ["INSTALLER_REPAIR"];
    if (mode !== "check") {
      await mkdir(runtimeRoot, { recursive: true });
      await writeFile(observedPath, JSON.stringify(observed, null, 2) + "\n");
      await clearHandoff();
    }
    const reason = framework.integrity_status === "CONTRACT_INCONSISTENT"
      ? "FRAMEWORK_CONTRACT_INCONSISTENCY"
      : ["UNKNOWN", "MANIFEST_INVALID"].includes(framework.integrity_status)
        ? "FRAMEWORK_INTEGRITY_UNKNOWN"
        : "FRAMEWORK_INTEGRITY_VIOLATION";
    return { schema: "yaaw.orchestration-runtime/v1", status: "FRAMEWORK_STOP", reason, observed };
  }

  if (inconsistencies.length) {
    observed.candidate_actions = ["orchestration.reconcile-state"];
    if (mode !== "check") {
      await mkdir(runtimeRoot, { recursive: true });
      await writeFile(observedPath, JSON.stringify(observed, null, 2) + "\n");
      await clearHandoff();
    }
    return { schema: "yaaw.orchestration-runtime/v1", status: "RECONCILE_REQUIRED", workflow: "orchestration.reconcile-state", observed };
  }

  if (mode === "inspect") {
    await mkdir(runtimeRoot, { recursive: true });
    await writeFile(observedPath, JSON.stringify(observed, null, 2) + "\n");
    return { schema: "yaaw.orchestration-runtime/v1", status: "INSPECTED", observed };
  }

  const selected = route(state, artifacts, contracts.routing);
  observed.candidate_actions = [selected.workflow ?? selected.terminal ?? selected.reason ?? selected.kind];

  if (selected.kind === "ROOT_ACTION") {
    if (mode !== "check") {
      await mkdir(runtimeRoot, { recursive: true });
      await writeFile(observedPath, JSON.stringify(observed, null, 2) + "\n");
      await clearHandoff();
    }
    return { schema: "yaaw.orchestration-runtime/v1", status: "ROOT_ACTION", workflow: selected.workflow, ticket: selected.ticket ?? null, observed };
  }

  if (selected.kind === "TERMINAL" || selected.kind === "BLOCKED") {
    if (mode !== "check") {
      await mkdir(runtimeRoot, { recursive: true });
      await writeFile(observedPath, JSON.stringify(observed, null, 2) + "\n");
      await clearHandoff();
    }
    return { schema: "yaaw.orchestration-runtime/v1", status: selected.kind, terminal: selected.terminal, reason: selected.reason ?? null, observed };
  }

  const execution = contracts.execution.workflows[selected.workflow];
  if (!requirementAllows(execution.repository_requirement, repository)) {
    if (mode !== "check") {
      await mkdir(runtimeRoot, { recursive: true });
      await writeFile(observedPath, JSON.stringify(observed, null, 2) + "\n");
      await clearHandoff();
    }
    return {
      schema: "yaaw.orchestration-runtime/v1",
      status: "BLOCKED",
      terminal: "BLOCKED",
      reason: execution.repository_requirement === "IDENTITY" ? "REPOSITORY_IDENTITY_UNAVAILABLE" : "REPOSITORY_INSPECTION_UNAVAILABLE",
      workflow: selected.workflow,
      observed
    };
  }

  const handoff = await buildHandoff(selected, contracts, state, artifacts, framework, repository);

  if (mode === "check") {
    const persisted = await readJsonOrNull(handoffPath);
    if (persisted && deepEqual(persisted, handoff)) {
      return { schema: "yaaw.orchestration-runtime/v1", status: "HANDOFF_FRESH", workflow: handoff.workflow, role: handoff.role };
    }
    return { schema: "yaaw.orchestration-runtime/v1", status: "HANDOFF_STALE", workflow: selected.workflow, reason: "HANDOFF_BASIS_CHANGED" };
  }

  await mkdir(runtimeRoot, { recursive: true });
  await writeFile(observedPath, JSON.stringify(observed, null, 2) + "\n");
  await writeFile(handoffPath, JSON.stringify(handoff, null, 2) + "\n");
  return { schema: "yaaw.orchestration-runtime/v1", status: "DISPATCH_READY", workflow: handoff.workflow, role: handoff.role, handoff };
}

try {
  const result = await main();
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exitCode = ["DISPATCH_READY", "INSPECTED", "HANDOFF_FRESH", "ROOT_ACTION", "TERMINAL"].includes(result.status) ? 0 : 2;
} catch (error) {
  process.stdout.write(JSON.stringify({
    schema: "yaaw.orchestration-runtime/v1",
    status: "FRAMEWORK_STOP",
    reason: "FRAMEWORK_CONTRACT_INCONSISTENCY",
    error: String(error?.message ?? error)
  }, null, 2) + "\n");
  process.exitCode = 2;
}
