#!/usr/bin/env python3
"""Semantic/structural validation for the YAAW-SE v2 workflow core."""
from __future__ import annotations

import json
import re
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"
NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SEMANTIC_ROLES = ("prd", "planner", "implementer", "reviewer")
ALL_ROLES = set(SEMANTIC_ROLES) | {"orchestrator"}


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def parse_frontmatter(path: Path):
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("missing opening YAML frontmatter")
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration as exc:
        raise ValueError("missing closing YAML frontmatter") from exc
    data = {}
    for raw in lines[1:end]:
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if ":" not in raw:
            raise ValueError(f"invalid frontmatter line: {raw}")
        key, value = raw.split(":", 1)
        key, value = key.strip(), value.strip()
        if value.startswith("["):
            data[key] = json.loads(value)
        elif value.lower() == "true":
            data[key] = True
        elif value.lower() == "false":
            data[key] = False
        elif value.lower() == "null":
            data[key] = None
        elif re.fullmatch(r"[0-9]+", value):
            data[key] = int(value)
        else:
            data[key] = value.strip("\"'")
    return data, "\n".join(lines[end + 1 :])


def require_headings(path: Path, headings: list[str], errors: list[str]):
    text = path.read_text(encoding="utf-8")
    for heading in headings:
        if f"## {heading}" not in text:
            errors.append(f"{path.relative_to(ROOT)}: missing heading '## {heading}'")


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def main() -> int:
    workflows = load_json(CORE / "registries/workflows.json")
    skills = load_json(CORE / "registries/skills.json")
    expertise = load_json(CORE / "registries/expertise.json")
    artifacts = load_json(CORE / "registries/artifacts.json")["artifacts"]
    role_io = load_json(CORE / "registries/role-io.json")["roles"]
    context_policy = load_json(CORE / "registries/context-policy.json")["roles"]
    transition_registry = load_json(CORE / "registries/transitions.json")
    errors: list[str] = []

    # Canonical workflow contracts and exact registry/file closure.
    registered_paths: set[str] = set()
    workflow_paths: dict[str, str] = {}
    for workflow_id, entry in workflows.items():
        role = entry.get("role")
        if role not in ALL_ROLES:
            errors.append(f"{workflow_id}: invalid role {role!r}")
        workflow_rel = entry.get("workflow", "")
        if workflow_rel in registered_paths:
            errors.append(f"{workflow_id}: duplicate workflow file registration {workflow_rel}")
        registered_paths.add(workflow_rel)
        path = ROOT / workflow_rel
        if not path.is_file():
            errors.append(f"{workflow_id}: missing workflow file {workflow_rel}")
            continue
        text = path.read_text(encoding="utf-8")
        if "## Purpose" not in text:
            errors.append(f"{workflow_id}: workflow lacks explicit Purpose section")
        if "## Inputs" not in text:
            errors.append(f"{workflow_id}: workflow lacks explicit Inputs section")
        workflow_paths[workflow_id] = workflow_rel

    actual_workflow_paths = {rel(p) for p in (CORE / "workflows").rglob("*.md")}
    if actual_workflow_paths != registered_paths:
        missing = sorted(registered_paths - actual_workflow_paths)
        unregistered = sorted(actual_workflow_paths - registered_paths)
        if missing:
            errors.append(f"registered workflow files missing from disk: {missing}")
        if unregistered:
            errors.append(f"workflow files missing registry entries: {unregistered}")

    if workflow_paths.get("orchestration.route") == workflow_paths.get("orchestration.dispatch"):
        errors.append("orchestration.route and orchestration.dispatch must be distinct contracts")

    # Public Agent Skills manifests and registry parity.
    skill_dirs = {p.name for p in (ROOT / "skills").iterdir() if p.is_dir()}
    if skill_dirs != set(skills):
        errors.append(f"skills directory/registry mismatch: dirs={sorted(skill_dirs)} registry={sorted(skills)}")
    descriptions = set()
    for skill_id, entry in skills.items():
        wf = entry.get("workflow_id")
        if wf not in workflows:
            errors.append(f"{skill_id}: unknown workflow {wf!r}")
            continue
        if entry.get("role") != workflows[wf].get("role"):
            errors.append(f"{skill_id}: role mismatch with {wf}")
        path = ROOT / "skills" / skill_id / "SKILL.md"
        try:
            meta, body = parse_frontmatter(path)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{skill_id}: invalid SKILL.md frontmatter: {exc}")
            continue
        name = meta.get("name")
        desc = meta.get("description")
        if name != skill_id or not isinstance(name, str) or not NAME_RE.fullmatch(name) or len(name) > 64:
            errors.append(f"{skill_id}: invalid/mismatched skill name {name!r}")
        if not isinstance(desc, str) or not desc or len(desc) > 1024:
            errors.append(f"{skill_id}: missing/invalid description")
        elif desc != entry.get("description"):
            errors.append(f"{skill_id}: manifest description differs from skills registry")
        elif desc in descriptions:
            errors.append(f"{skill_id}: duplicate skill description")
        else:
            descriptions.add(desc)
        if f"ROLE: `{entry['role']}`" not in body or f"WORKFLOW: `{wf}`" not in body:
            errors.append(f"{skill_id}: body does not declare registry role/workflow")
        if len(path.read_text(encoding="utf-8").splitlines()) > 24:
            errors.append(f"{skill_id}: public wrapper too large")

    # Artifact/path authority and role I/O consistency.
    expected_patterns = {
        "product": "docs/product/product.md",
        "engineering": "docs/engineering/engineering.md",
        "engineering_decision": "docs/engineering/decisions/ENG-*.md",
        "spec": "docs/specs/<SPEC-ID>.md",
        "rule": "docs/rules/**",
        "ticket": ".yaaw/tickets/<SPEC-ID>/<TASK-ID>.md",
        "evidence": ".yaaw/evidence/<SPEC-ID>/<TASK-ID>-V<VERSION>.json",
        "review": ".yaaw/reviews/<SPEC-ID>/<TASK-ID>/R<ROUND>.md",
        "intent": ".yaaw/runtime/intent.json",
        "observed_state": ".yaaw/runtime/observed-state.json",
        "handoff": ".yaaw/runtime/handoff.json",
        "state": ".yaaw/state.json",
    }
    for artifact_id, pattern in expected_patterns.items():
        if artifacts.get(artifact_id, {}).get("pattern") != pattern:
            errors.append(f"artifact path drift: {artifact_id} != {pattern}")

    if set(role_io) != ALL_ROLES:
        errors.append(f"role-io role coverage drift: {sorted(role_io)}")
    if set(context_policy) != ALL_ROLES:
        errors.append(f"context-policy role coverage drift: {sorted(context_policy)}")
    artifact_symbols = set(artifacts)
    for role, contract in role_io.items():
        reads = set(contract.get("reads", []))
        writes = set(contract.get("writes", []))
        forbidden = set(contract.get("forbidden_writes", []))
        unknown = (reads | writes | forbidden) - artifact_symbols
        if unknown:
            errors.append(f"{role}: unknown artifact symbols in role I/O: {sorted(unknown)}")
        overlap = writes & forbidden
        if overlap:
            errors.append(f"{role}: write/forbidden overlap: {sorted(overlap)}")
    for role in SEMANTIC_ROLES:
        if "state" in role_io[role].get("writes", []):
            errors.append(f"{role}: semantic role must not write state")
        role_text = (CORE / "roles" / f"{role}.md").read_text(encoding="utf-8")
        for heading in ("Reads", "Writes", "Must not write", "Return protocol"):
            if f"## {heading}" not in role_text:
                errors.append(f"roles/{role}.md: missing ## {heading}")
        if "`.yaaw/runtime/handoff.json` first" not in role_text:
            errors.append(f"roles/{role}.md: must require handoff first")
        if ".yaaw/state.json" not in role_text:
            errors.append(f"roles/{role}.md: state boundary must be explicit")

    if role_io.get("prd", {}).get("writes") != ["product"]:
        errors.append("PRD writes must remain product-only")
    if role_io.get("implementer", {}).get("writes") != ["application_files", "evidence"]:
        errors.append("Implementer writes must remain application_files + evidence")
    if role_io.get("reviewer", {}).get("writes") != ["review"]:
        errors.append("Reviewer writes must remain review-only")
    if "state" not in role_io.get("orchestrator", {}).get("writes", []):
        errors.append("Orchestrator must own state writes")

    # Context policy: product/routing roles cannot consume learned memory automatically.
    for role in ("prd", "orchestrator"):
        policy = context_policy[role]
        if policy.get("memory_mode") != "disabled" or policy.get("memory_phase") != "never":
            errors.append(f"{role}: learned memory must stay disabled")
        if policy.get("memory_target_tokens") != 0 or policy.get("deep_history_allowed") is not False:
            errors.append(f"{role}: disabled memory policy must have zero/no deep history")

    # PRD workflows must not contain executable learned-memory behavior.
    forbidden_prd_memory_phrases = (
        "when memory is enabled",
        "permitted memory results",
        "optional historical leads",
        "historical project-memory context",
        "using memory only",
    )
    for path in (CORE / "workflows" / "prd").glob("*.md"):
        lower = path.read_text(encoding="utf-8").lower()
        for phrase in forbidden_prd_memory_phrases:
            if phrase in lower:
                errors.append(f"{rel(path)}: PRD memory policy leak: {phrase!r}")

    # Canonical path drift guard across the control plane.
    forbidden_paths = (
        ".yaaw/product.md",
        ".yaaw/engineering.md",
        ".yaaw/specs/",
        ".yaaw/rules/",
        ".yaaw/evidence/EVIDENCE-",
        ".yaaw/reviews/TASK-",
    )
    scan_files = []
    for scan_root in (CORE / "core", CORE / "roles", CORE / "rules", CORE / "workflows", ROOT / "skills", ROOT / ".codex" / "agents"):
        scan_files.extend(p for p in scan_root.rglob("*") if p.is_file() and p.suffix in {".md", ".toml"})
    scan_files.extend([ROOT / "AGENTS.md", ROOT / "README.md", ROOT / "WORKFLOW.md"])
    for path in scan_files:
        text = path.read_text(encoding="utf-8")
        for stale in forbidden_paths:
            if stale in text:
                errors.append(f"{rel(path)}: stale canonical path {stale}")

    # Expertise metadata richness and paths.
    expertise_required = {"path", "description", "signals", "usable_by", "required_context", "anti_patterns", "verification_expectations"}
    for expertise_id, entry in expertise.items():
        missing = expertise_required - set(entry)
        if missing:
            errors.append(f"{expertise_id}: missing expertise metadata {sorted(missing)}")
        path = ROOT / entry.get("path", "")
        if not path.is_file():
            errors.append(f"{expertise_id}: missing module {rel(path)}")
        invalid = set(entry.get("usable_by", [])) - ALL_ROLES
        if invalid:
            errors.append(f"{expertise_id}: invalid usable_by roles {sorted(invalid)}")

    # Schemas parse and expose the contracts prose depends on.
    schemas = {}
    for schema_path in (CORE / "schemas").glob("*.json"):
        try:
            schema = load_json(schema_path)
            schemas[schema_path.name] = schema
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{rel(schema_path)}: invalid JSON: {exc}")
    state = schemas.get("project-state.schema.json", {})
    state_required = set(state.get("required", []))
    for field in {"transition_sequence", "last_transition", "blocker"}:
        if field not in state_required:
            errors.append(f"project-state schema must require {field}")
    review = schemas.get("review.schema.json", {})
    outcomes = set(review.get("properties", {}).get("result", {}).get("enum", []))
    if outcomes != {"PASS", "REPAIR", "REPLAN", "BLOCKED"}:
        errors.append(f"review outcomes drifted: {sorted(outcomes)}")
    if "evidence.schema.json" not in schemas or "observed-state.schema.json" not in schemas:
        errors.append("missing evidence or observed-state schema")

    # Templates: machine-readable metadata + required human-readable sections.
    template_meta = {
        "product.md": {"schema", "revision", "status"},
        "engineering.md": {"schema", "revision", "status", "product_revision", "current_frontier", "readiness"},
        "spec.md": {"schema", "id", "revision", "status", "product_revision", "engineering_revision", "frontier_id", "decision_ids"},
        "ticket.md": {"schema", "id", "revision", "spec", "spec_revision", "product_revision", "engineering_revision", "status", "dependencies", "decision_ids", "expertise"},
        "review.md": {"schema", "ticket", "round", "result", "ticket_revision", "spec_revision", "reviewed_head_commit", "reviewed_dirty", "reviewed_worktree_digest", "evidence"},
    }
    for filename, required in template_meta.items():
        path = CORE / "templates" / filename
        try:
            meta, _ = parse_frontmatter(path)
            missing = required - set(meta)
            if missing:
                errors.append(f"templates/{filename}: missing frontmatter {sorted(missing)}")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"templates/{filename}: invalid frontmatter: {exc}")

    require_headings(CORE / "templates/product.md", ["Goal", "Target users", "Expected behavior", "Scope", "Non-goals", "Accepted product decisions", "Unresolved product questions"], errors)
    require_headings(CORE / "templates/engineering.md", ["Product interpretation", "Existing system", "Decisions", "Current decision frontier", "Future fog", "Readiness status"], errors)
    require_headings(CORE / "templates/spec.md", ["Goal", "Engineering decisions", "Expected behavior", "Failure modes", "Testing expectations", "Acceptance conditions"], errors)
    require_headings(CORE / "templates/ticket.md", ["Goal", "Product requirements", "Engineering decisions", "Required behavior", "Allowed scope", "Acceptance criteria", "Required tests", "Dependencies"], errors)
    require_headings(CORE / "templates/review.md", ["Result rationale", "Reviewed state", "Findings", "Verification", "Evidence", "Next action"], errors)

    for json_template in ["project-state.json", "evidence.json", "handoff.json", "observed-state.json"]:
        try:
            load_json(CORE / "templates" / json_template)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"templates/{json_template}: invalid JSON: {exc}")

    # Routing/transition semantic guards.
    routing = (CORE / "core/routing.md").read_text(encoding="utf-8")
    markers = [
        "If a ticket is `REPLAN_REQUIRED`",
        "If a ticket is `REPAIR_REQUIRED`",
        "If a ticket is `REVIEW_REQUIRED`",
        "If a ticket is `IN_PROGRESS`",
        "ticket is `READY`",
    ]
    try:
        positions = [routing.index(m) for m in markers]
        if positions != sorted(positions):
            errors.append("routing precedence must be REPLAN -> REPAIR -> REVIEW -> IN_PROGRESS -> READY")
    except ValueError as exc:
        errors.append(f"routing contract missing explicit state marker: {exc}")

    transition_states = set(transition_registry.get("ticket_states", []))
    seen_transitions: set[tuple[str, str]] = set()
    for transition in transition_registry.get("legal", []):
        edge = (transition.get("from"), transition.get("to"))
        if edge in seen_transitions:
            errors.append(f"duplicate ticket transition: {edge}")
        seen_transitions.add(edge)
        if edge[0] not in transition_states or edge[1] not in transition_states:
            errors.append(f"transition uses unknown state: {edge}")
        if transition.get("owner") not in ALL_ROLES:
            errors.append(f"transition has invalid semantic owner: {transition}")
        if transition.get("state_writer") != "orchestrator":
            errors.append(f"ticket transition must be persisted by orchestrator: {transition}")
        if transition.get("workflow") not in workflows:
            errors.append(f"transition references unknown workflow: {transition}")

    transitions_text = (CORE / "core/transitions.md").read_text(encoding="utf-8")
    for forbidden in ["DRAFT -> PASS", "READY -> PASS", "REPAIR_REQUIRED -> PASS"]:
        if forbidden not in transitions_text:
            errors.append(f"transition contract missing forbidden guard {forbidden}")
    for phrase in ("semantic outcome owner", "Orchestrator persists every ticket lifecycle transition"):
        if phrase not in transitions_text:
            errors.append(f"transition prose missing ownership rule: {phrase}")
    if "PASS | REPLAN_REQUIRED" not in transitions_text:
        errors.append("transition contract must permit invalidation of stale PASS")

    # Cross-role invalidation must be coordinated, never directly cascaded by the triggering role.
    invalidation = (CORE / "core/invalidation.md").read_text(encoding="utf-8")
    for phrase in (
        "Triggering roles never mutate another role's semantic artifacts",
        "Planner applies semantic invalidation",
        "Orchestrator persists ticket lifecycle invalidation",
    ):
        if phrase not in invalidation:
            errors.append(f"invalidation contract missing ownership rule: {phrase}")

    # Known ambiguity regressions must stay fixed.
    prd_readiness = (CORE / "workflows/prd/readiness.md").read_text(encoding="utf-8")
    if "product/state" in prd_readiness:
        errors.append("prd.readiness must not instruct PRD to mutate state")
    planning_readiness = (CORE / "workflows/planning/readiness-review.md").read_text(encoding="utf-8")
    if "engineering.md`/state" in planning_readiness:
        errors.append("planning.readiness-review must not instruct Planner to mutate state")
    implement_ticket = (CORE / "workflows/implementation/implement-ticket.md").read_text(encoding="utf-8")
    if "return `SOURCE_SPEC_MISSING` or `STALE_SOURCE_REVISION`" in implement_ticket:
        errors.append("implementation precondition reasons must be nested under PRECONDITION_UNSATISFIED")
    if "PRECONDITION_UNSATISFIED` with reason `SOURCE_SPEC_MISSING` or `STALE_SOURCE_REVISION`" not in implement_ticket:
        errors.append("implement-ticket must encode source-spec failures as PRECONDITION_UNSATISFIED reasons")
    review_independence = (CORE / "rules/review-independence.md").read_text(encoding="utf-8")
    if "Only Reviewer may transition" in review_independence:
        errors.append("review-independence must distinguish acceptance authority from state writing")

    # Codex host configs must load the exact dynamic workflow instead of guessing by role.
    codex_config = tomllib.loads((ROOT / ".codex/config.toml").read_text(encoding="utf-8"))
    registered_agent_files: set[str] = set()
    for agent_name, registration in codex_config.get("agents", {}).items():
        if not isinstance(registration, dict) or "config_file" not in registration:
            continue
        config_rel = registration["config_file"]
        registered_agent_files.add(config_rel)
        path = ROOT / ".codex" / config_rel
        if not path.is_file():
            errors.append(f"Codex agent {agent_name}: missing {config_rel}")
            continue
        agent_cfg = tomllib.loads(path.read_text(encoding="utf-8"))
        instructions = agent_cfg.get("developer_instructions", "")
        role = agent_name.split("_", 1)[0]
        required_fragments = (
            "Read .yaaw/runtime/handoff.json first",
            ".yaaw-core/registries/workflows.json",
            "handoff.workflow",
            f".yaaw-core/roles/{role}.md",
        )
        for fragment in required_fragments:
            if fragment not in instructions:
                errors.append(f"{rel(path)}: missing dynamic load instruction {fragment!r}")

    actual_agent_files = {p.relative_to(ROOT / ".codex").as_posix() for p in (ROOT / ".codex/agents").glob("*.toml")}
    if actual_agent_files != registered_agent_files:
        errors.append(f"Codex agent file/registry mismatch: files={sorted(actual_agent_files)} registry={sorted(registered_agent_files)}")

    # CI must run when Codex contracts change too.
    workflow_yaml = (ROOT / ".github/workflows/validate.yml").read_text(encoding="utf-8")
    if "'.codex/**'" not in workflow_yaml:
        errors.append("validate.yml pull_request paths must include .codex/**")

    # Architecture invariants and public documentation parity.
    if (ROOT / ".agents").exists() or (ROOT / "agents").exists():
        errors.append("named agent layer must not exist")
    public_readme = (ROOT / "README.md").read_text(encoding="utf-8")
    for skill_id in skills:
        if f"@{skill_id}" not in public_readme:
            errors.append(f"README missing public skill @{skill_id}")
    if not (CORE / "core/invalidation.md").is_file() or not (CORE / "rules/repository-identity.md").is_file():
        errors.append("missing invalidation or repository-identity contract")

    if errors:
        print("YAAW core validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        "YAAW core validation passed: "
        f"{len(skills)} skills, {len(workflows)} workflows, {len(expertise)} expertise modules, "
        f"{len(schemas)} schemas, {len(role_io)} role I/O contracts"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
