#!/usr/bin/env python3
"""Validate Codex-discoverable yaaw-SE skill metadata and local context budget."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS_ROOT = ROOT / ".agents" / "skills"
MAX_DESCRIPTION_CHARS = 160
MAX_TOTAL_DESCRIPTION_CHARS = 1500


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"ERROR: {message}")


def parse_frontmatter(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    require(lines and lines[0].strip() == "---", f"{path.relative_to(ROOT)} missing YAML frontmatter")
    try:
        end = next(index for index, line in enumerate(lines[1:], start=1) if line.strip() == "---")
    except StopIteration:
        raise SystemExit(f"ERROR: {path.relative_to(ROOT)} has unterminated YAML frontmatter")

    metadata: dict[str, str] = {}
    for line in lines[1:end]:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        require(":" in line, f"{path.relative_to(ROOT)} has unsupported frontmatter line: {line!r}")
        key, value = line.split(":", 1)
        metadata[key.strip()] = value.strip().strip('"').strip("'")
    return metadata


def main() -> None:
    catalog = json.loads((ROOT / ".agents/catalog.json").read_text(encoding="utf-8"))
    skills = catalog.get("skills", [])
    require(skills, "catalog has no active skills")

    catalog_paths = {item["path"] for item in skills}
    discovered_paths = {
        str(path.relative_to(ROOT)).replace("\\", "/")
        for path in SKILLS_ROOT.glob("*/SKILL.md")
    }
    require(discovered_paths == catalog_paths,
            f"Codex-discoverable skill paths differ from active catalog: discovered={sorted(discovered_paths)} catalog={sorted(catalog_paths)}")

    total = 0
    for item in skills:
        skill_id = item["id"]
        path = ROOT / item["path"]
        require(item.get("status") not in {"DEPRECATED", "DEPRECATED_COMPATIBILITY_SHIM"},
                f"deprecated skill {skill_id} must not remain in the active catalog")
        require(item["path"] == f".agents/skills/{skill_id}/SKILL.md",
                f"skill {skill_id} path must match its directory")

        metadata = parse_frontmatter(path)
        require(metadata.get("name") == skill_id,
                f"skill {skill_id} frontmatter name mismatch: {metadata.get('name')!r}")
        description = metadata.get("description", "").strip()
        require(description, f"skill {skill_id} missing description")
        require(len(description) <= MAX_DESCRIPTION_CHARS,
                f"skill {skill_id} description is {len(description)} chars; max is {MAX_DESCRIPTION_CHARS}")
        total += len(description)

    require(total <= MAX_TOTAL_DESCRIPTION_CHARS,
            f"aggregate yaaw-SE skill descriptions are {total} chars; max is {MAX_TOTAL_DESCRIPTION_CHARS}")
    print(f"OK: {len(skills)} active skills; {total}/{MAX_TOTAL_DESCRIPTION_CHARS} description chars; max per skill {MAX_DESCRIPTION_CHARS}")


if __name__ == "__main__":
    main()
