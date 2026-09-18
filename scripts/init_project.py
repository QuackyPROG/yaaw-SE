#!/usr/bin/env python3
"""Initialize YAAW durable state and consumer-local VCS isolation."""
from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / ".yaaw-core" / "templates"
GUARD_PATH = ROOT / ".yaaw-core" / "vcs" / "guard.py"


class InitializationError(RuntimeError):
    pass


def _load_guard():
    spec = importlib.util.spec_from_file_location("yaaw_vcs_guard", GUARD_PATH)
    if spec is None or spec.loader is None:
        raise InitializationError(f"Cannot load YAAW VCS guard from {GUARD_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _looks_like_yaaw_markdown(path: Path, schema_prefix: str) -> bool:
    if not path.is_file():
        return False
    head = path.read_text(encoding="utf-8", errors="replace")[:512]
    return f"schema: {schema_prefix}" in head


def _classify_shared_artifact(
    project_root: Path,
    artifact_id: str,
    path: Path,
    *,
    schema_prefix: str | None = None,
    directory: bool = False,
) -> tuple[str, bool]:
    """Return ownership and whether bootstrap may create/adopt the path."""
    if not path.exists():
        return "yaaw", True
    if directory:
        files = [p for p in path.rglob("*") if p.is_file()]
        if not files:
            return "yaaw", True
        if schema_prefix and all(_looks_like_yaaw_markdown(p, schema_prefix) for p in files):
            return "yaaw", True
        raise InitializationError(
            f"PATH_OWNERSHIP_CONFLICT: {artifact_id} collides with pre-existing application content at {path}"
        )
    if schema_prefix and _looks_like_yaaw_markdown(path, schema_prefix):
        return "yaaw", True
    raise InitializationError(
        f"PATH_OWNERSHIP_CONFLICT: {artifact_id} collides with pre-existing application content at {path}"
    )


def _framework_mode(project_root: Path) -> bool:
    # The source framework itself must remain versionable.  The consumer marker
    # is never written when init_project.py is invoked at the framework root.
    return project_root.resolve() == ROOT.resolve()


def _write_json_if_missing(path: Path, value: dict, created: list[Path]) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
    created.append(path)


def initialize_project(project_root: Path) -> list[Path]:
    project_root = project_root.resolve()
    docs = project_root / "docs"
    yaaw = project_root / ".yaaw"
    created: list[Path] = []

    framework_mode = _framework_mode(project_root)

    # Detect shared-path collisions before adopting canonical YAAW locations.
    artifact_ownership: dict[str, str] = {}
    if not framework_mode:
        checks = (
            ("product", docs / "product" / "product.md", "yaaw.product/", False),
            ("engineering", docs / "engineering" / "engineering.md", "yaaw.engineering/", False),
            ("engineering_decision", docs / "engineering" / "decisions", "yaaw.engineering-decision/", True),
            ("spec", docs / "specs", "yaaw.spec/", True),
            ("rule", docs / "rules", "yaaw.rule/", True),
        )
        for artifact_id, path, schema_prefix, is_dir in checks:
            owner, _ = _classify_shared_artifact(
                project_root,
                artifact_id,
                path,
                schema_prefix=schema_prefix,
                directory=is_dir,
            )
            artifact_ownership[artifact_id] = owner

    for directory in (
        docs,
        docs / "product",
        docs / "engineering",
        docs / "engineering" / "decisions",
        docs / "specs",
        docs / "rules",
        yaaw,
        yaaw / "tickets",
        yaaw / "reviews",
        yaaw / "evidence",
        yaaw / "runtime",
        yaaw / "vcs",
        yaaw / "vcs" / "checkpoints",
    ):
        if not directory.exists():
            directory.mkdir(parents=True, exist_ok=True)
            created.append(directory)

    for template_name, destination in (
        ("product.md", docs / "product" / "product.md"),
        ("engineering.md", docs / "engineering" / "engineering.md"),
    ):
        if not destination.exists():
            shutil.copyfile(TEMPLATES / template_name, destination)
            created.append(destination)

    state_path = yaaw / "state.json"
    if not state_path.exists():
        state = json.loads((TEMPLATES / "project-state.json").read_text(encoding="utf-8"))
        state["product"]["status"] = "draft"
        state["product"]["revision"] = 1
        state["planning"]["status"] = "discovery"
        state["planning"]["revision"] = 1
        state["planning"]["current_frontier"] = "FRONTIER-001"
        state["last_workflow"] = None
        state_path.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
        created.append(state_path)

    if framework_mode:
        return created

    guard = _load_guard()
    if not guard.is_git_repository(project_root):
        raise InitializationError(
            "VCS_POLICY_VIOLATION: consumer VCS isolation requires an initialized Git repository"
        )

    manifest_path = yaaw / "install.json"
    manifest = {
        "schema": "yaaw.install/v1",
        "mode": "consumer",
        "vcs_isolation": "enabled",
        "artifact_ownership": artifact_ownership,
        "owned_paths": [
            "docs/product/product.md",
            "docs/engineering/engineering.md",
            "docs/engineering/decisions/**",
            "docs/specs/**",
            "docs/rules/**"
        ],
        "control_plane_patterns": [".yaaw/**", ".yaaw-core/**", "skills/yaaw-*/**"],
    }
    if manifest_path.exists():
        existing = json.loads(manifest_path.read_text(encoding="utf-8"))
        if existing.get("mode") != "consumer":
            raise InitializationError("VCS_POLICY_VIOLATION: existing install marker is not consumer mode")
        # Never silently replace an established ownership classification.
        for artifact_id, owner in artifact_ownership.items():
            prior = existing.get("artifact_ownership", {}).get(artifact_id)
            if prior not in (None, owner):
                raise InitializationError(
                    f"PATH_OWNERSHIP_CONFLICT: existing ownership for {artifact_id} is {prior!r}, not {owner!r}"
                )
        manifest = existing
    else:
        _write_json_if_missing(manifest_path, manifest, created)

    vcs_path = yaaw / "vcs.json"
    vcs_config = {
        "schema": "yaaw.vcs/v1",
        "mode": "consumer",
        "integration_branch": "main",
        "publish_branches": ["main"],
        "topic_branches": {"local_only": True},
        "worktree_branches": {"local_only": True},
    }
    _write_json_if_missing(vcs_path, vcs_config, created)

    try:
        guard.bootstrap_consumer(project_root, GUARD_PATH)
        observed = guard.inspect_repository(project_root)
    except guard.VcsGuardError as exc:
        raise InitializationError(str(exc)) from exc

    observed_path = yaaw / "runtime" / "vcs-observed.json"
    observed_path.write_text(json.dumps(observed, indent=2) + "\n", encoding="utf-8")
    if observed_path not in created:
        created.append(observed_path)

    return created


def main() -> int:
    parser = argparse.ArgumentParser(description="Initialize YAAW docs, workflow state, and consumer-local VCS isolation.")
    parser.add_argument("project_root", nargs="?", default=".", type=Path)
    args = parser.parse_args()
    try:
        created = initialize_project(args.project_root)
    except InitializationError as exc:
        print(str(exc))
        return 2
    if created:
        print("Initialized YAAW project artifacts:")
        for path in created:
            print(f"- {path}")
    else:
        print("YAAW project artifacts already initialized; nothing changed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
