#!/usr/bin/env python3
"""Initialize YAAW durable documentation and workflow-state roots."""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / ".yaaw-core" / "templates"


def initialize_project(project_root: Path) -> list[Path]:
    project_root = project_root.resolve()
    docs = project_root / "docs"
    yaaw = project_root / ".yaaw"
    created: list[Path] = []

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

    return created


def main() -> int:
    parser = argparse.ArgumentParser(description="Initialize YAAW docs and autonomous workflow state.")
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
