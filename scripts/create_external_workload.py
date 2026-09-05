#!/usr/bin/env python3
"""Create a pinned external workload manifest from two eval manifests."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from yaaw.workload_manifest import build_external_workload

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", required=True)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--ref", required=True)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--task", required=True)
    parser.add_argument("--allowed-scope", nargs="+", required=True)
    parser.add_argument("--verification", nargs="+", required=True)
    parser.add_argument("--baseline-manifest", required=True)
    parser.add_argument("--governed-manifest", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    value = build_external_workload(
        root=ROOT,
        workload_id=args.id,
        repository=args.repository,
        ref=args.ref,
        commit=args.commit,
        task=args.task,
        allowed_scope=args.allowed_scope,
        verification=args.verification,
        baseline_manifest_path=(ROOT / args.baseline_manifest),
        governed_manifest_path=(ROOT / args.governed_manifest),
    )
    output = (ROOT / args.output).resolve()
    try:
        output.relative_to(ROOT.resolve())
    except ValueError as exc:
        raise SystemExit(f"ERROR: output escapes repository root: {args.output}") from exc
    output.parent.mkdir(parents=True, exist_ok=True)
    rendered = json.dumps(value, indent=2, sort_keys=True) + "\n"
    output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
