import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.authority import AuthorityPolicy
from scripts.yaaw.budgets import Budget
from scripts.yaaw.controller import Controller
from scripts.yaaw.graph import TicketGraph
from scripts.yaaw.leases import LeaseStore
from scripts.yaaw.model import Ticket, TicketKind, TicketState
from scripts.yaaw.ownership import OwnershipRule
from scripts.yaaw.runtime_gateway import ActionRequest, GatewayDenied, RuntimeGateway
from scripts.yaaw.security import CommandRisk, RoleCapabilities


class RuntimeGatewayTests(unittest.TestCase):
    def make_gateway(self, *, owner="implementer", ticket_status=TicketState.READY):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        ticket = Ticket(
            "DEL-1",
            TicketKind.DELIVERY,
            ticket_status,
            2,
            owner,
            acceptance=("observable outcome",),
        )
        controller = Controller(
            TicketGraph([ticket]),
            Budget({"max_agent_dispatches": 8}),
            LeaseStore(Path(tmp.name) / "leases"),
        )
        authority = AuthorityPolicy(
            {
                "artifacts": {
                    "DELIVERY_TICKET": {
                        "fallback_mutators": ["orchestrator"],
                        "fields": {
                            "implementation_evidence": {"mutators": ["implementer"]},
                            "qa_result": {"mutators": ["qa"]},
                        },
                    }
                }
            }
        )
        rules = [
            OwnershipRule("src/auth/**", "implementer"),
            OwnershipRule("tests/auth/**", "qa", co_owners=("implementer",)),
            OwnershipRule("src/secret/**", "security", deny=True),
        ]
        caps = {
            "implementer": RoleCapabilities(CommandRisk.DEPENDENCY_MUTATION, network=False, production=False, mutate_repo=False, mutate_product_code=True),
            "qa": RoleCapabilities(CommandRisk.LOCAL_MUTATION, network=False, production=False, mutate_repo=False, mutate_product_code=False),
            "orchestrator": RoleCapabilities(CommandRisk.REPOSITORY_SIDE_EFFECT, network=True, production=False, mutate_repo=True, mutate_product_code=False),
        }
        return RuntimeGateway(controller, authority, rules, "UNKNOWN_OWNER", caps), tmp.name

    def request(self, worktree, **overrides):
        data = dict(
            ticket_id="DEL-1",
            role="implementer",
            holder="worker-1",
            worktree=worktree,
            paths=("src/auth/login.py",),
            allowed_paths=("src/auth/**",),
            product_mutation=True,
        )
        data.update(overrides)
        return ActionRequest(**data)

    def test_inspect_is_pure_and_admit_reserves(self):
        gateway, root = self.make_gateway()
        request = self.request(str(Path(root) / "wt"))
        inspected = gateway.inspect(request)
        self.assertTrue(inspected.allowed)
        self.assertFalse(inspected.reserved)
        admitted = gateway.admit(request)
        self.assertTrue(admitted.allowed)
        self.assertTrue(admitted.reserved)
        gateway.release(request, admitted)

    def test_underdeclared_destructive_command_is_denied(self):
        gateway, root = self.make_gateway()
        request = self.request(
            str(Path(root) / "wt"),
            command="rm -rf build",
            declared_risk=CommandRisk.READ_ONLY,
        )
        decision = gateway.inspect(request)
        self.assertFalse(decision.allowed)
        self.assertEqual(decision.effective_risk, "DESTRUCTIVE")
        self.assertTrue(any("exceeds role maximum" in reason for reason in decision.reasons))

    def test_stale_source_is_denied_before_reservation(self):
        gateway, root = self.make_gateway()
        decision = gateway.admit(self.request(str(Path(root) / "wt"), sources_current=False))
        self.assertFalse(decision.allowed)
        self.assertFalse(decision.reserved)
        self.assertTrue(any("stale source fingerprints" in reason for reason in decision.reasons))

    def test_scope_escape_and_unknown_ownership_fail_closed(self):
        gateway, root = self.make_gateway()
        outside = self.request(
            str(Path(root) / "wt1"),
            paths=("src/payments/pay.py",),
            allowed_paths=("src/auth/**",),
        )
        decision = gateway.inspect(outside)
        self.assertFalse(decision.allowed)
        self.assertIn("OUTSIDE_ALLOWED src/payments/pay.py", decision.reasons)
        self.assertTrue(any("unresolved ownership" in reason for reason in decision.reasons))

    def test_ticket_owner_must_match_resolved_path_owner(self):
        gateway, root = self.make_gateway(owner="qa")
        decision = gateway.inspect(self.request(str(Path(root) / "wt"), role="qa", product_mutation=False))
        self.assertFalse(decision.allowed)
        self.assertTrue(any("does not own" in reason for reason in decision.reasons))

    def test_field_authority_is_enforced(self):
        gateway, root = self.make_gateway()
        request = self.request(
            str(Path(root) / "wt"),
            role="qa",
            product_mutation=False,
            artifact="DELIVERY_TICKET",
            field="implementation_evidence",
        )
        decision = gateway.inspect(request)
        self.assertFalse(decision.allowed)
        self.assertTrue(any("may not mutate" in reason for reason in decision.reasons))

    def test_lease_collision_denies_second_admission(self):
        gateway, root = self.make_gateway()
        worktree = str(Path(root) / "wt")
        first = self.request(worktree, holder="worker-1")
        second = self.request(worktree, holder="worker-2")
        admitted = gateway.admit(first)
        self.assertTrue(admitted.allowed)
        denied = gateway.admit(second)
        self.assertFalse(denied.allowed)
        self.assertFalse(denied.reserved)
        gateway.release(first, admitted)

    def test_run_never_calls_runner_on_denial_and_releases_on_success(self):
        gateway, root = self.make_gateway()
        called = []
        denied = self.request(
            str(Path(root) / "deny"),
            paths=("src/secret/key.py",),
            allowed_paths=("src/**",),
        )
        with self.assertRaises(GatewayDenied):
            gateway.run(denied, lambda req: called.append(req))
        self.assertEqual(called, [])

        allowed = self.request(str(Path(root) / "ok"))
        result = gateway.run(allowed, lambda req: "ran")
        self.assertEqual(result, "ran")
        again = gateway.admit(allowed)
        self.assertTrue(again.allowed)
        gateway.release(allowed, again)

    def test_secret_like_command_is_redacted_in_decision(self):
        gateway, root = self.make_gateway()
        decision = gateway.inspect(
            self.request(
                str(Path(root) / "wt"),
                command="echo api_key=super-secret-value",
                declared_risk=CommandRisk.READ_ONLY,
            )
        )
        self.assertNotIn("super-secret-value", decision.redacted_command or "")
        self.assertIn("[REDACTED]", decision.redacted_command or "")


if __name__ == "__main__":
    unittest.main()
