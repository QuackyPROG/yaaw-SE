#!/usr/bin/env python3
"""Summarize yaaw-SE ephemeral runtime metrics without making them durable engineering truth."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from yaaw.metrics import load_jsonl, summarize


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--events", default=".yaaw/runtime/events.jsonl")
    args = parser.parse_args()
    report = summarize(load_jsonl(Path(args.events)))
    print(json.dumps(report.to_dict(), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
