#!/usr/bin/env python3
"""Validate the intentionally small yaaw-SE v2 public skill surface and yaaw-core presence."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS_ROOT = ROOT / ".agents" / "skills"
EXPECTED = {"yaaw-prd","yaaw-orchestrator","yaaw-planner","yaaw-implement","yaaw-review"}
MAX_DESCRIPTION_CHARS = 160
MAX_TOTAL_DESCRIPTION_CHARS = 800


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"ERROR: {message}")


def parse_frontmatter(path: Path) -> dict[str, str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    require(lines and lines[0].strip() == "---", f"{path.relative_to(ROOT)} missing YAML frontmatter")
    try:
        end = next(i for i, line in enumerate(lines[1:], start=1) if line.strip() == "---")
    except StopIteration:
        raise SystemExit(f"ERROR: {path.relative_to(ROOT)} has unterminated YAML frontmatter")
    out = {}
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        require(":" in line, f"{path.relative_to(ROOT)} unsupported frontmatter line: {line!r}")
        k,v=line.split(":",1); out[k.strip()]=v.strip().strip('"').strip("'")
    return out


def main() -> None:
    catalog=json.loads((ROOT/".agents/catalog.json").read_text(encoding="utf-8"))
    skills=catalog.get("skills",[])
    ids={s["id"] for s in skills}
    require(ids == EXPECTED, f"v2 public skills must be exactly {sorted(EXPECTED)}, got {sorted(ids)}")
    discovered={p.parent.name for p in SKILLS_ROOT.glob("*/SKILL.md")}
    require(discovered == EXPECTED, f"discovered skill dirs differ from v2 surface: {sorted(discovered)}")
    total=0
    for item in skills:
        path=ROOT/item["path"]
        meta=parse_frontmatter(path)
        require(meta.get("name")==item["id"], f"skill {item['id']} frontmatter mismatch")
        desc=meta.get("description","").strip(); require(desc, f"skill {item['id']} missing description")
        require(len(desc)<=MAX_DESCRIPTION_CHARS, f"skill {item['id']} description too long")
        total+=len(desc)
    require(total<=MAX_TOTAL_DESCRIPTION_CHARS, f"aggregate skill descriptions {total}>{MAX_TOTAL_DESCRIPTION_CHARS}")
    for required in (
        "_yaaw-core/README.md","_yaaw-core/core/levels.json","_yaaw-core/core/modules.json",
        "_yaaw-core/workflows/orchestrator/workflow.md","_yaaw-core/workflows/prd/workflow.md",
        "_yaaw-core/workflows/planner/workflow.md","_yaaw-core/workflows/implement/workflow.md","_yaaw-core/workflows/review/workflow.md",
        "_yaaw-core/modules/architecture/MODULE.md","_yaaw-core/modules/security/MODULE.md","_yaaw-core/modules/migration/MODULE.md","_yaaw-core/modules/frontend-design/MODULE.md","_yaaw-core/modules/testing/MODULE.md",
    ):
        require((ROOT/required).is_file(), f"required v2 core asset missing: {required}")
    levels=json.loads((ROOT/"_yaaw-core/core/levels.json").read_text(encoding="utf-8"))["levels"]
    require(set(levels)=={"0","1","2","3","4"}, "yaaw-core must preserve exactly L0-L4")
    print(f"OK: v2 exposes exactly 5 public skills; {total}/{MAX_TOTAL_DESCRIPTION_CHARS} description chars; yaaw-core workflows/modules present")

if __name__ == "__main__":
    main()
