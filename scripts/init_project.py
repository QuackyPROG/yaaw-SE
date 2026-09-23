#!/usr/bin/env python3
"""Development/conformance initializer for the one-root YAAW project layout."""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / ".yaaw-core" / "system" / "templates"


def initialize_project(project_root: Path) -> list[Path]:
    project_root = project_root.resolve()
    core = project_root / ".yaaw-core"
    project = core / "project"
    runtime = core / "runtime"
    install = core / "install"
    created: list[Path] = []

    for directory in (
        project,
        project / "research",
        project / "specs",
        project / "tickets",
        project / "reviews",
        project / "evidence",
        project / "rules",
        runtime,
        install,
    ):
        if not directory.exists():
            directory.mkdir(parents=True, exist_ok=True)
            created.append(directory)

    for template_name, destination_name in (
        ("product.md", "product.md"),
        ("engineering.md", "engineering.md"),
    ):
        destination = project / destination_name
        if not destination.exists():
            shutil.copyfile(TEMPLATES / template_name, destination)
            created.append(destination)

    state_path = project / "state.json"
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

    return created


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Development-only initializer for .yaaw-core/project durable state."
    )
    parser.add_argument("project_root", nargs="?", default=".", type=Path)
    args = parser.parse_args()
    created = initialize_project(args.project_root)
    if created:
        print("Initialized YAAW project artifacts:")
        for path in created:
            print(f"- {path}")
    else:
        print("YAAW project artifacts already initialized; nothing changed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
