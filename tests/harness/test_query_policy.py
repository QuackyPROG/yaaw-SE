from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.graph import TicketGraph
from scripts.yaaw.policy_lint import lint_repository_policy
from scripts.yaaw.query import artifact_contract, load_ownership_rules, ticket_or_error
from scripts.yaaw.ownership import resolve


TICKET = """---yaaw-json
{"schema":"yaaw.ticket/v1","id":"DEL-1","kind":"DELIVERY","status":"READY","level":1,"owner":"auth","blocked_by":[],"acceptance":["returns 200 for valid session"],"allowed_write":["src/auth/**"],"forbidden_write":[],"qa":{"required":false}}
---
# DEL-1

## What to deliver
x

## Acceptance criteria
x

## Preservation invariants
x

## Allowed write scope
x

## Forbidden write scope
x

## Expected change surface
x

## Canonical sources
x

## Verification
x

## QA disposition
x

## Stop and replan triggers
x

## Implementation evidence
x

## QA result
x

## Delivery
x
"""


class QueryTests(unittest.TestCase):
    def test_owner_and_artifact_queries(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            ownership = root / "ownership.json"
            artifacts = root / "artifacts.json"
            ownership.write_text(json.dumps({
                "default_owner": "UNKNOWN_OWNER",
                "entries": [{"pattern": "src/auth/**", "owner": "auth"}],
            }))
            artifacts.write_text(json.dumps({
                "artifact_types": [{"id": "QA_REPORT", "owner": "qa"}],
            }))
            rules, default = load_ownership_rules(ownership)
            self.assertEqual(resolve("src/auth/a.py", rules, default).owner, "auth")
            self.assertEqual(artifact_contract(artifacts, "QA_REPORT")["owner"], "qa")

    def test_ticket_lookup(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "x.md").write_text(TICKET)
            graph = TicketGraph.from_directory(root)
            self.assertEqual(ticket_or_error(graph, "DEL-1").owner, "auth")


class PolicyLintTests(unittest.TestCase):
    def test_broad_write_is_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            tickets = root / "tickets"
            tickets.mkdir()
            (tickets / "x.md").write_text(TICKET.replace('"src/auth/**"', '"**"'))
            ownership = root / "ownership.json"
            artifacts = root / "artifacts.json"
            ownership.write_text(json.dumps({"default_owner": "UNKNOWN_OWNER", "entries": []}))
            artifacts.write_text(json.dumps({"artifact_types": []}))
            errors = lint_repository_policy(ownership, artifacts, tickets)
            self.assertTrue(any("dangerously broad allowed_write" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
