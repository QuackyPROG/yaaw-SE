#!/usr/bin/env python3
"""Compatibility entrypoint: execute lifecycle fixtures through the production Node engine."""
from __future__ import annotations
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def main() -> int:
    return subprocess.run(["node", "scripts/run_lifecycle_cases.mjs"], cwd=ROOT, check=False).returncode

if __name__ == "__main__":
    raise SystemExit(main())
