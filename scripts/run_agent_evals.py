#!/usr/bin/env python3
"""Run provider-neutral repeated agent-loop trials.

Default/CI use is the deterministic fake adapter. Real command runtimes are opt-in
and must provide explicit runtime/provider/model identity; their results are marked
OBSERVED only because the configured external adapter actually ran.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from yaaw.agent_eval import AdapterIdentity, CommandRuntimeAdapter, FakeRuntimeAdapter, load_manifest, run_trials
from yaaw.workload_evidence import fingerprint


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default="evals/agent-loop-fixture.json")
    parser.add_argument("--adapter", choices=["fake", "command"], default="fake")
    parser.add_argument("--report")
    parser.add_argument("--runtime-id")
    parser.add_argument("--provider")
    parser.add_argument("--model")
    parser.add_argument("--timeout-seconds", type=int, default=900)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()

    manifest = load_manifest(Path(args.manifest))
    if args.adapter == "fake":
        sequence = manifest.get("fixture", {}).get("sequence")
        if not isinstance(sequence, list) or not sequence or any(not isinstance(value, bool) for value in sequence):
            raise SystemExit("ERROR: fake adapter requires fixture.sequence boolean array in manifest")
        adapter = FakeRuntimeAdapter(sequence)
    else:
        command = list(args.command)
        if command and command[0] == "--":
            command = command[1:]
        missing = [name for name, value in (("runtime-id", args.runtime_id), ("provider", args.provider), ("model", args.model)) if not value]
        if missing:
            raise SystemExit("ERROR: command adapter requires --" + ", --".join(missing))
        adapter = CommandRuntimeAdapter(
            command,
            AdapterIdentity(args.runtime_id, args.provider, args.model, external=True),
            timeout_seconds=args.timeout_seconds,
        )

    report = run_trials(manifest, adapter)
    report["manifest_fingerprint"] = fingerprint(manifest)
    rendered = json.dumps(report, indent=2, sort_keys=True)
    print(rendered)
    if args.report:
        path = Path(args.report)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(rendered + "\n", encoding="utf-8")
    return 0 if report["thresholds_met"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
