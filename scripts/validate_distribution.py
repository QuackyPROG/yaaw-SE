#!/usr/bin/env python3
"""Distribution-specific invariants for the YAAW-SE npm package."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE_ROOT = ROOT / ".yaaw-core"
SYSTEM = CORE_ROOT / "system"
LEGACY_RE = re.compile(r"(?<!-)\.yaaw/")
TEXT_SUFFIXES = {".md", ".json", ".py", ".ts", ".js", ".mjs", ".yml", ".yaml"}
PACKAGE_DIRS = {"core", "roles", "workflows", "expertise", "rules", "registries", "schemas", "templates", "tools"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    errors: list[str] = []

    if not SYSTEM.is_dir():
        errors.append("missing canonical .yaaw-core/system package root")
        paths = {}
    else:
        paths = load(SYSTEM / "registries" / "paths.json")

    expected = {
        "core_root": ".yaaw-core",
        "system_root": ".yaaw-core/system",
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

    actual_system_dirs = {p.name for p in SYSTEM.iterdir() if p.is_dir()} if SYSTEM.is_dir() else set()
    if actual_system_dirs != PACKAGE_DIRS:
        errors.append(f"system package directories drifted: {sorted(actual_system_dirs)}")

    for legacy in PACKAGE_DIRS | {"project", "runtime", "install"}:
        if (CORE_ROOT / legacy).exists():
            errors.append(f"source .yaaw-core/{legacy}/ must not exist outside .yaaw-core/system")

    scan_roots = [CORE_ROOT, ROOT / "skills", ROOT / "scripts", ROOT / "src", ROOT / "installer", ROOT / "tests", ROOT / "README.md", ROOT / "AGENTS.md"]
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

    for path in list((SYSTEM / "workflows").rglob("*.md")) + list((SYSTEM / "roles").rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        if "python scripts/init_project.py" in text:
            errors.append(f"source-checkout initializer dependency: {path.relative_to(ROOT)}")

    skills = load(SYSTEM / "registries" / "skills.json")
    workflows = load(SYSTEM / "registries" / "workflows.json")
    for skill_id, entry in skills.items():
        path = ROOT / "skills" / skill_id / "SKILL.md"
        if not path.is_file():
            errors.append(f"missing canonical skill {skill_id}")
            continue
        text = path.read_text(encoding="utf-8")
        if len(text.splitlines()) > 24:
            errors.append(f"public skill too large: {skill_id}")
        if ".yaaw-core/system/" not in text:
            errors.append(f"public skill does not point to canonical system root: {skill_id}")
        if entry.get("workflow_id") not in workflows:
            errors.append(f"public skill unresolved workflow: {skill_id}")

    bootstrap = ROOT / "installer" / "templates" / "bootstrap"
    for name in ("codex.md", "claude-code.md", "gemini-cli.md", "cline.md"):
        path = bootstrap / name
        if not path.is_file():
            errors.append(f"missing bootstrap template: {name}")
            continue
        text = path.read_text(encoding="utf-8")
        if ".yaaw-core/system/" not in text:
            errors.append(f"{name}: does not reference .yaaw-core/system")
        if len(text.splitlines()) > 30:
            errors.append(f"{name}: bootstrap template is too large")

    for rel in (".agents", ".codex", ".claude", ".gemini", ".cline"):
        if (ROOT / rel).exists():
            errors.append(f"provider adapter tree must be generated, not authored in source: {rel}")

    codex_runtime = ROOT / "installer" / "templates" / "codex" / "yaaw-runtime.md"
    if not codex_runtime.is_file():
        errors.append("missing Codex runtime adapter template")
    else:
        runtime_text = codex_runtime.read_text(encoding="utf-8")
        for required in ("yaaw_prd", "yaaw_planner", "yaaw_implementer", "yaaw_reviewer", "BLOCKED:HOST_ISOLATION_UNAVAILABLE", "orchestration.inspect-state"):
            if required not in runtime_text:
                errors.append(f"Codex runtime adapter missing contract token: {required}")
        if "yaaw_orchestrator" in runtime_text and "Never spawn" not in runtime_text:
            errors.append("Codex runtime adapter appears to define an Orchestrator child")

    installer_sources = "\n".join(p.read_text(encoding="utf-8") for p in (ROOT / "src" / "installer").rglob("*.ts"))
    if 'rm(".yaaw-core"' in installer_sources or "rm('.yaaw-core'" in installer_sources:
        errors.append("installer contains blanket .yaaw-core deletion")
    if "Installer-managed operation cannot mutate durable project memory" not in installer_sources:
        errors.append("installer lacks hard preflight guard for .yaaw-core/project")
    artifact_model = (SYSTEM / "core" / "artifact-model.md").read_text(encoding="utf-8")
    if ".yaaw-core/project" not in artifact_model or ".yaaw-core/system" not in artifact_model:
        errors.append("artifact model does not separate system and durable project ownership")
    if not (SYSTEM / "core" / "framework-integrity.md").is_file():
        errors.append("framework immutability contract is missing from package-managed system")
    if not (SYSTEM / "tools" / "framework-integrity.mjs").is_file():
        errors.append("framework integrity verifier is missing from package-managed system")
    else:
        framework_text = (SYSTEM / "core" / "framework-integrity.md").read_text(encoding="utf-8").lower()
        for marker in ("only installer authority may replace package-managed files", "backup-and-replace", "must never intentionally create, edit, delete, rename, or weaken"):
            if marker not in framework_text:
                errors.append(f"framework integrity contract missing distribution boundary marker: {marker}")

    if errors:
        print("YAAW distribution validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"YAAW distribution validation passed: {len(skills)} public skills, isolated system/project roots, 4 Tier-1 adapters")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
