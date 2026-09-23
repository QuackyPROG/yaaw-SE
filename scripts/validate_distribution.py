#!/usr/bin/env python3
"""Distribution-specific invariants for the YAAW-SE npm package."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"
LEGACY_RE = re.compile(r"(?<!-)\.yaaw/")
TEXT_SUFFIXES = {".md", ".json", ".py", ".ts", ".js", ".mjs", ".yml", ".yaml"}

PACKAGE_DIRS = {
    "core", "roles", "workflows", "expertise", "rules", "registries", "schemas", "templates", "tools"
}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    errors: list[str] = []

    paths = load(CORE / "registries" / "paths.json")
    expected = {
        "core_root": ".yaaw-core",
        "workspace_root": ".",
        "project_memory_root": ".yaaw-core/project",
        "runtime_root": ".yaaw-core/runtime",
        "install_root": ".yaaw-core/install",
        "product": ".yaaw-core/project/product.md",
        "engineering": ".yaaw-core/project/engineering.md",
        "research": ".yaaw-core/project/research",
        "state": ".yaaw-core/project/state.json",
        "specs": ".yaaw-core/project/specs",
        "tickets": ".yaaw-core/project/tickets",
        "reviews": ".yaaw-core/project/reviews",
        "evidence": ".yaaw-core/project/evidence",
        "project_rules": ".yaaw-core/project/rules",
    }
    for key, value in expected.items():
        if paths.get(key) != value:
            errors.append(f"paths registry {key} drifted: {paths.get(key)!r}")

    # No live legacy root in implementation, tests, or consumer docs.
    scan_roots = [CORE, ROOT / "skills", ROOT / "scripts", ROOT / "src", ROOT / "installer", ROOT / "tests", ROOT / "README.md", ROOT / "AGENTS.md"]
    for root in scan_roots:
        candidates = [root] if root.is_file() else [p for p in root.rglob("*") if p.is_file()]
        for path in candidates:
            if path.resolve() in {
                (ROOT / "scripts" / "validate_distribution.py").resolve(),
                (ROOT / "tests" / "test_distribution_contracts.py").resolve(),
            }:
                continue
            if path.suffix.lower() not in TEXT_SUFFIXES and path.name not in {"AGENTS.md", "README.md"}:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            if LEGACY_RE.search(text):
                errors.append(f"live legacy .yaaw root reference: {path.relative_to(ROOT)}")

    # Workflows installed into consumers must not depend on the source checkout.
    for path in list((CORE / "workflows").rglob("*.md")) + list((CORE / "roles").rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        if "python scripts/init_project.py" in text:
            errors.append(f"source-checkout initializer dependency: {path.relative_to(ROOT)}")

    # Package ownership and durable ownership must be structurally disjoint.
    if any(name in PACKAGE_DIRS for name in {"project", "runtime", "install"}):
        errors.append("package-owned directory set overlaps state directories")
    for forbidden in ("project", "runtime", "install"):
        if (CORE / forbidden).exists():
            errors.append(f"source .yaaw-core/{forbidden}/ must not contain repository-owned consumer state")

    if (CORE / "system").exists():
        errors.append("source contains legacy/parallel .yaaw-core/system framework root")
    if not (CORE / "tools" / "repository-identity.mjs").is_file():
        errors.append("canonical repository identity utility is not package-owned under .yaaw-core/tools")
    if not (CORE / "tools" / "framework-integrity.mjs").is_file():
        errors.append("framework integrity utility is not package-owned under .yaaw-core/tools")
    if not (CORE / "core" / "framework-integrity.md").is_file():
        errors.append("framework immutability contract is missing from package-owned core")

    # Public skills remain thin adapters into canonical core.
    skills = load(CORE / "registries" / "skills.json")
    workflows = load(CORE / "registries" / "workflows.json")
    for skill_id, entry in skills.items():
        path = ROOT / "skills" / skill_id / "SKILL.md"
        if not path.is_file():
            errors.append(f"missing canonical skill {skill_id}")
            continue
        text = path.read_text(encoding="utf-8")
        if len(text.splitlines()) > 24:
            errors.append(f"public skill too large: {skill_id}")
        if ".yaaw-core/" not in text:
            errors.append(f"public skill does not point to canonical core: {skill_id}")
        if entry.get("workflow_id") not in workflows:
            errors.append(f"public skill unresolved workflow: {skill_id}")

    # Bootstrap templates are intentionally tiny and cannot become workflow copies.
    bootstrap = ROOT / "installer" / "templates" / "bootstrap"
    for name in ("codex.md", "claude-code.md", "gemini-cli.md", "cline.md"):
        path = bootstrap / name
        if not path.is_file():
            errors.append(f"missing bootstrap template: {name}")
            continue
        text = path.read_text(encoding="utf-8")
        if ".yaaw-core/" not in text:
            errors.append(f"{name}: does not reference .yaaw-core")
        if len(text.splitlines()) > 30:
            errors.append(f"{name}: bootstrap template is too large")

    # Source repository does not author generated provider discovery trees.
    for rel in (".agents", ".claude", ".gemini", ".cline"):
        if (ROOT / rel).exists():
            errors.append(f"provider adapter tree must be generated, not authored in source: {rel}")

    # Core updater must contain a structural guard against blanket root deletion.
    installer_sources = "\n".join(
        p.read_text(encoding="utf-8")
        for p in (ROOT / "src" / "installer").rglob("*.ts")
    )
    if 'rm(".yaaw-core"' in installer_sources or "rm('.yaaw-core'" in installer_sources:
        errors.append("installer contains blanket .yaaw-core deletion")
    if ".yaaw-core/project" not in (CORE / "core" / "artifact-model.md").read_text(encoding="utf-8"):
        errors.append("artifact model does not identify durable project root")
    framework_text = (CORE / "core" / "framework-integrity.md").read_text(encoding="utf-8")
    for marker in ("only installer authority may replace package-managed files", "backup-and-replace", "must never intentionally create, edit, delete, rename, or weaken package-managed framework content"):
        if marker.lower() not in framework_text.lower():
            errors.append(f"framework integrity contract missing distribution boundary marker: {marker}")

    if errors:
        print("YAAW distribution validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"YAAW distribution validation passed: {len(skills)} public skills, one .yaaw-core root, 4 Tier-1 adapters")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
