from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.budgets import Budget
from scripts.yaaw.controller import AdmissionError, Controller
from scripts.yaaw.evidence import EvidenceRecord, require_passing_evidence
from scripts.yaaw.graph import TicketGraph
from scripts.yaaw.leases import LeaseStore
from scripts.yaaw.model import Ticket, TicketKind, TicketState
from scripts.yaaw.routing import Criticality, RouteSignals, decide
from scripts.yaaw.state import TransitionContext, validate_transition

ROOT = Path(__file__).resolve().parents[2]
EXAMPLES = ROOT / "examples/workflow"


def route(signals: dict):
    return decide(RouteSignals(
        default_level=int(signals.get("default_level",0)),
        uncertainty=int(signals.get("uncertainty",0)),
        subsystem_count=int(signals.get("subsystem_count",1)),
        interface_change=bool(signals.get("interface_change",False)),
        architecture_scope=signals.get("architecture_scope","NONE"),
        migration_scope=signals.get("migration_scope","NONE"),
        criticality=Criticality[signals.get("criticality","LOW")],
        security_trust_boundary=bool(signals.get("security_trust_boundary",False)),
        destructive=bool(signals.get("destructive",False)),
        production_policy=bool(signals.get("production_policy",False)),
    ))


class WorkflowExamplesTests(unittest.TestCase):
    def test_l0_through_l4_examples_are_executable(self):
        data=json.loads((EXAMPLES/"scenarios.json").read_text(encoding="utf-8"))
        self.assertEqual(len(data["cases"]),5)
        for case in data["cases"]:
            decision=route(case["route"]); self.assertEqual(decision.level,case["expect"]["level"],case["id"]); self.assertEqual(decision.qa,case["expect"]["qa"],case["id"])
            artifact=case.get("artifact")
            if artifact:
                ticket=Ticket.from_markdown((EXAMPLES/artifact).read_text(encoding="utf-8"),EXAMPLES/artifact)
                self.assertEqual(ticket.level,case["expect"]["level"]); self.assertEqual([t.id for t in TicketGraph([ticket]).ready_frontier()],case["expect"]["frontier"])
            else:
                self.assertFalse(case["expect"]["durable_ticket"])

    def test_failure_examples_execute_real_gates(self):
        cases={case["id"]:case for case in json.loads((EXAMPLES/"failures.json").read_text(encoding="utf-8"))["cases"]}
        stop=cases["STOP_AND_REPLAN"]
        with tempfile.TemporaryDirectory() as td:
            controller=Controller(TicketGraph([]),Budget({"max_same_failure_signature":stop["limit"]}),LeaseStore(Path(td)/"leases"))
            with self.assertRaisesRegex(AdmissionError,stop["expect_contains"]):
                for _ in range(stop["attempts"]): controller.register_failure(stop["signature"])

        qa=cases["QA_REPAIR"]; ticket=Ticket.from_markdown('---yaaw-json\n'+json.dumps(qa["ticket"])+'\n---\n# qa\n')
        with self.assertRaisesRegex(ValueError,qa["expect_contains"]):
            validate_transition(ticket,TicketState.DONE,TransitionContext(verification_complete=True,qa_satisfied=False,delivery_satisfied=True))

        stale=cases["STALE_EVIDENCE"]; record=EvidenceRecord.create(verification_id=stale["verification_id"],command="test",exit_code=0,environment="CI",commit=stale["recorded_commit"],source_fingerprints={})
        self.assertEqual(require_passing_evidence([record],[stale["verification_id"]],stale["current_commit"],{}),stale["expect"])

        owner=cases["UNKNOWN_OWNER"]; ticket=Ticket.from_markdown('---yaaw-json\n'+json.dumps(owner["ticket"])+'\n---\n# owner\n'); graph=TicketGraph([ticket])
        with tempfile.TemporaryDirectory() as td:
            controller=Controller(graph,Budget({"max_agent_dispatches":1}),LeaseStore(Path(td)/"leases"))
            with self.assertRaisesRegex(AdmissionError,owner["expect_contains"]): controller.admit_dispatch(ticket.id,"worker",str(Path(td)/"wt"))

    def test_public_maturity_claims_are_explicit(self):
        readme=(ROOT/"README.md").read_text(encoding="utf-8")
        maturity=(ROOT/"docs/workflow/maturity.md").read_text(encoding="utf-8")
        self.assertIn("Beta / self-hosting",readme)
        self.assertIn("Machine-enforced",maturity)
        self.assertIn("Agent judgment",maturity)
        self.assertIn("Runtime-dependent",maturity)
        self.assertIn("not blanket production autonomy",maturity.lower())


if __name__=="__main__": unittest.main()
