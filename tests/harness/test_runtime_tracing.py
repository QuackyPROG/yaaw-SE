import json
import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.authority import AuthorityPolicy
from scripts.yaaw.budgets import Budget
from scripts.yaaw.controller import Controller
from scripts.yaaw.events import TraceContext, append_trace_event, validate_event
from scripts.yaaw.graph import TicketGraph
from scripts.yaaw.leases import LeaseStore
from scripts.yaaw.metrics import load_jsonl, summarize
from scripts.yaaw.model import Ticket, TicketKind, TicketState
from scripts.yaaw.ownership import OwnershipRule
from scripts.yaaw.runtime_gateway import ActionRequest, GatewayDenied, RuntimeGateway
from scripts.yaaw.security import CommandRisk, RoleCapabilities


class RuntimeTracingTests(unittest.TestCase):
    def make_gateway(self, root: Path) -> RuntimeGateway:
        ticket = Ticket("DEL-1", TicketKind.DELIVERY, TicketState.READY, 2, "implementer", acceptance=("observable",))
        controller = Controller(TicketGraph([ticket]), Budget({"max_agent_dispatches": 4}), LeaseStore(root / "leases"))
        authority = AuthorityPolicy({"artifacts": {}})
        rules = [OwnershipRule("src/**", "implementer")]
        caps = {"implementer": RoleCapabilities(CommandRisk.DEPENDENCY_MUTATION, mutate_product_code=True)}
        return RuntimeGateway(
            controller,
            authority,
            rules,
            "UNKNOWN_OWNER",
            caps,
            event_path=root / "events.jsonl",
            trace=TraceContext.new(run_id="run_test", trace_id="trace_test"),
        )

    def request(self, root: Path, **overrides) -> ActionRequest:
        data = dict(
            ticket_id="DEL-1",
            role="implementer",
            holder="worker",
            worktree=str(root / "wt"),
            command="echo token=supersecretvalue",
            declared_risk=CommandRisk.READ_ONLY,
            paths=("src/app.py",),
            allowed_paths=("src/**",),
            product_mutation=True,
        )
        data.update(overrides)
        return ActionRequest(**data)

    def test_trace_event_validation_requires_complete_correlation(self):
        with self.assertRaises(ValueError):
            validate_event({
                "schema": "yaaw.event/v1",
                "event": "X",
                "work_id": "W",
                "actor": "A",
                "timestamp": "2026-09-04T00:00:00+00:00",
                "run_id": "run_only",
            })

    def test_append_trace_event_redacts_nested_values(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "events.jsonl"
            append_trace_event(
                path,
                "CUSTOM",
                "W",
                "A",
                TraceContext.new(run_id="r", trace_id="t"),
                detail={"password": "password=hunter2", "nested": ["api_key=abcdefghi"]},
            )
            record = json.loads(path.read_text(encoding="utf-8"))
            payload = json.dumps(record)
            self.assertNotIn("hunter2", payload)
            self.assertNotIn("abcdefghi", payload)
            self.assertIn("[REDACTED]", payload)

    def test_gateway_emits_correlated_lifecycle_and_metrics(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            gateway = self.make_gateway(root)
            request = self.request(root)
            self.assertEqual(gateway.run(request, lambda req: "ok"), "ok")

            denied = self.request(root, command="rm -rf build")
            with self.assertRaises(GatewayDenied):
                gateway.run(denied, lambda req: "must-not-run")

            records = load_jsonl(root / "events.jsonl")
            self.assertEqual(
                [record["event"] for record in records],
                ["GATEWAY_ALLOWED", "ACTION_START", "ACTION_RESULT", "GATEWAY_DENIED"],
            )
            self.assertEqual({record["run_id"] for record in records}, {"run_test"})
            self.assertEqual({record["trace_id"] for record in records}, {"trace_test"})
            self.assertTrue(all(record.get("span_id") for record in records))
            self.assertNotIn("supersecretvalue", json.dumps(records))

            metrics = summarize(records)
            self.assertEqual(metrics.gateway_allowed, 1)
            self.assertEqual(metrics.gateway_denied, 1)
            self.assertEqual(metrics.action_failures, 0)
            self.assertEqual(metrics.runs, 1)
            self.assertEqual(metrics.traces, 1)
            self.assertGreaterEqual(metrics.total_duration_ms, 0)

    def test_gateway_records_action_error_and_releases_lease(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            gateway = self.make_gateway(root)
            request = self.request(root)

            def fail(_):
                raise RuntimeError("token=do-not-persist")

            with self.assertRaises(RuntimeError):
                gateway.run(request, fail)
            events = load_jsonl(root / "events.jsonl")
            self.assertEqual(events[-1]["event"], "ACTION_ERROR")
            self.assertNotIn("do-not-persist", json.dumps(events))
            self.assertEqual(summarize(events).action_failures, 1)

            admitted = gateway.admit(request)
            self.assertTrue(admitted.allowed)
            gateway.release(request, admitted)


if __name__ == "__main__":
    unittest.main()
