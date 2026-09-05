#!/usr/bin/env python3
"""Semantic/structural validation for the YAAW-SE v2 workflow core."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"
NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


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


def main() -> int:
    workflows = load_json(CORE / "registries/workflows.json")
    skills = load_json(CORE / "registries/skills.json")
    expertise = load_json(CORE / "registries/expertise.json")
    errors: list[str] = []
    allowed_roles = {"prd", "planner", "implementer", "reviewer", "orchestrator"}

    # Canonical workflow contracts.
    workflow_paths = {}
    for workflow_id, entry in workflows.items():
        if entry.get("role") not in allowed_roles:
            errors.append(f"{workflow_id}: invalid role {entry.get('role')!r}")
        path = ROOT / entry.get("workflow", "")
        if not path.is_file():
            errors.append(f"{workflow_id}: missing workflow file {path.relative_to(ROOT)}")
            continue
        text = path.read_text(encoding="utf-8")
        if "## Purpose" not in text:
            errors.append(f"{workflow_id}: workflow lacks explicit Purpose section")
        workflow_paths[workflow_id] = entry["workflow"]

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

    # Expertise metadata richness and paths.
    expertise_required = {"path", "description", "signals", "usable_by", "required_context", "anti_patterns", "verification_expectations"}
    for expertise_id, entry in expertise.items():
        missing = expertise_required - set(entry)
        if missing:
            errors.append(f"{expertise_id}: missing expertise metadata {sorted(missing)}")
        path = ROOT / entry.get("path", "")
        if not path.is_file():
            errors.append(f"{expertise_id}: missing module {path.relative_to(ROOT)}")
        invalid = set(entry.get("usable_by", [])) - allowed_roles
        if invalid:
            errors.append(f"{expertise_id}: invalid usable_by roles {sorted(invalid)}")

    # Schemas parse and expose the contracts prose depends on.
    schemas = {}
    for schema_path in (CORE / "schemas").glob("*.json"):
        try:
            schema = load_json(schema_path)
            schemas[schema_path.name] = schema
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{schema_path.relative_to(ROOT)}: invalid JSON: {exc}")
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

    transitions = (CORE / "core/transitions.md").read_text(encoding="utf-8")
    for forbidden in ["DRAFT -> PASS", "READY -> PASS", "REPAIR_REQUIRED -> PASS"]:
        if forbidden not in transitions:
            errors.append(f"transition contract missing forbidden guard {forbidden}")
    if "PASS | REPLAN_REQUIRED" not in transitions:
        errors.append("transition contract must permit invalidation of stale PASS")

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

    print(f"YAAW core validation passed: {len(skills)} skills, {len(workflows)} workflows, {len(expertise)} expertise modules, {len(schemas)} schemas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
