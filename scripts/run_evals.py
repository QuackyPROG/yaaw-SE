#!/usr/bin/env python3
"""Run deterministic adversarial conformance scenarios against yaaw-SE invariants."""
from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from pathlib import Path

from yaaw.authority import AuthorityPolicy
from yaaw.evidence import EvidenceRecord, require_passing_evidence
from yaaw.graph import TicketGraph
from yaaw.model import Ticket, TicketKind, TicketState
from yaaw.retry import FailureClass, may_retry
from yaaw.routing import Criticality, RouteSignals, decide
from yaaw.security import inferred_minimum_risk
from yaaw.state import TransitionContext, validate_transition
from yaaw.trust import TrustClass, may_supply_instructions
from verify_task_scope import verify

ROOT = Path(__file__).resolve().parents[1]


def _ticket(data: dict) -> Ticket:
    return Ticket(
        id=data["id"],
        kind=TicketKind(data.get("kind", "DELIVERY")),
        status=TicketState(data.get("status", "DRAFT")),
        level=int(data.get("level", 1)),
        owner=data.get("owner", "owner"),
        blocked_by=tuple(data.get("blocked_by", [])),
        qa_required=bool(data.get("qa_required", False)),
        acceptance=tuple(data.get("acceptance", ["observable outcome"])),
    )


def evaluate(scenario: dict) -> tuple[bool, object, object]:
    kind = scenario["type"]
    inp = scenario.get("input", {})
    expected = scenario.get("expect")

    if kind == "route":
        criticality = Criticality[inp.get("criticality", "LOW")]
        result = decide(RouteSignals(
            default_level=int(inp.get("default_level", 0)),
            uncertainty=int(inp.get("uncertainty", 0)),
            subsystem_count=int(inp.get("subsystem_count", 1)),
            interface_change=bool(inp.get("interface_change", False)),
            architecture_scope=inp.get("architecture_scope", "NONE"),
            migration_scope=inp.get("migration_scope", "NONE"),
            criticality=criticality,
            security_trust_boundary=bool(inp.get("security_trust_boundary", False)),
            destructive=bool(inp.get("destructive", False)),
            production_policy=bool(inp.get("production_policy", False)),
        ))
        actual = {"level": result.level, "qa": result.qa}

    elif kind == "command_risk":
        actual = inferred_minimum_risk(inp["command"]).name

    elif kind == "trust":
        source = TrustClass(inp["source"])
        actual = {"may_supply_instructions": may_supply_instructions(source)}

    elif kind == "retry":
        actual = may_retry(FailureClass(inp["failure"]), int(inp.get("attempts", 0)))

    elif kind == "authority":
        policy = AuthorityPolicy.load(ROOT / ".agents/authority.json")
        actual = policy.can_mutate(inp["role"], inp["artifact"], inp.get("field"))

    elif kind == "semantic_authority":
        policy = AuthorityPolicy.load(ROOT / ".agents/authority.json")
        actual = policy.semantic_authority(inp["artifact"], inp.get("field"))

    elif kind == "scope":
        actual = verify(inp.get("paths", []), inp.get("allowed", []), inp.get("forbidden", []))

    elif kind == "graph":
        graph = TicketGraph(_ticket(t) for t in inp.get("tickets", []))
        diagnostics = graph.diagnostics()
        actual = {
            "missing_blockers": len(diagnostics.missing_blockers),
            "cycles": len(diagnostics.cycles),
            "frontier": [t.id for t in graph.ready_frontier()],
        }

    elif kind == "long_horizon":
        count = int(inp.get("count", 100))
        if count < 2:
            raise ValueError("long_horizon count must be >=2")
        tickets = [Ticket("T000", TicketKind.DELIVERY, TicketState.DONE, 3, "core")]
        tickets.append(Ticket("T001", TicketKind.DELIVERY, TicketState.READY, 3, "core", ("T000",)))
        for index in range(2, count):
            tickets.append(Ticket(f"T{index:03d}", TicketKind.DELIVERY, TicketState.DRAFT, 3, "core", (f"T{index-1:03d}",)))
        graph = TicketGraph(tickets)
        diagnostics = graph.diagnostics()
        actual = {"tickets": len(graph.tickets), "cycles": len(diagnostics.cycles), "frontier": [t.id for t in graph.ready_frontier()]}

    elif kind == "transition":
        ticket = _ticket(inp["ticket"])
        ctx = TransitionContext(**inp.get("context", {}))
        try:
            validate_transition(ticket, TicketState(inp["target"]), ctx)
            actual = {"allowed": True}
        except ValueError as exc:
            actual = {"allowed": False, "contains": str(exc)}
        if isinstance(expected, dict) and "contains" in expected and not expected.get("allowed", False):
            ok = actual.get("allowed") is False and expected["contains"] in actual.get("contains", "")
            return ok, actual, expected

    elif kind == "evidence":
        recorded_fingerprints = inp.get("recorded_fingerprints", {"spec": "a"})
        current_fingerprints = inp.get("current_fingerprints", recorded_fingerprints)
        record = EvidenceRecord.create(
            verification_id=inp.get("verification_id", "unit"),
            command="test-command",
            exit_code=int(inp.get("exit_code", 0)),
            environment="CI",
            commit=inp.get("recorded_commit", "abc"),
            source_fingerprints=recorded_fingerprints,
        )
        actual = require_passing_evidence(
            [record],
            [inp.get("verification_id", "unit")],
            inp.get("current_commit", inp.get("recorded_commit", "abc")),
            current_fingerprints,
        )

    else:
        raise ValueError(f"unknown eval scenario type {kind!r}")

    return actual == expected, actual, expected


def run(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    scenarios = data.get("scenarios", [])
    results = []
    passed = 0
    for scenario in scenarios:
        try:
            ok, actual, expected = evaluate(scenario)
            error = None
        except Exception as exc:
            ok, actual, expected, error = False, None, scenario.get("expect"), f"{type(exc).__name__}: {exc}"
        passed += int(ok)
        results.append({"id": scenario.get("id"), "type": scenario.get("type"), "passed": ok, "actual": actual, "expected": expected, "error": error})
    return {
        "schema": "yaaw.eval-report/v1",
        "scenario_file": str(path),
        "total": len(results),
        "passed": passed,
        "failed": len(results) - passed,
        "results": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenarios", default="evals/scenarios.json")
    parser.add_argument("--report")
    args = parser.parse_args()
    report = run(Path(args.scenarios))
    for result in report["results"]:
        marker = "PASS" if result["passed"] else "FAIL"
        print(f"{marker}: {result['id']}")
        if not result["passed"]:
            print(f"  expected={result['expected']!r}")
            print(f"  actual={result['actual']!r}")
            if result["error"]:
                print(f"  error={result['error']}")
    print(f"{report['passed']}/{report['total']} scenarios passed")
    if args.report:
        Path(args.report).write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 0 if report["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
