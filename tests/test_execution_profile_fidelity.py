import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SYSTEM = ROOT / ".yaaw-core" / "system"

class ExecutionProfileFidelityContracts(unittest.TestCase):
    def test_provider_neutral_dispatch_requires_profile_fidelity(self):
        text = (SYSTEM / "core" / "dispatch-execution.md").read_text(encoding="utf-8")
        self.assertIn("Authority execution profile fidelity invariant", text)
        self.assertIn("HOST_EXECUTION_PROFILE_UNAVAILABLE", text)
        self.assertIn("HOST_ISOLATION_UNAVAILABLE", text)
        self.assertIn("HOST_INHERIT", text)
        self.assertIn("must not increment", text)

    def test_dispatch_workflow_distinguishes_host_stops_from_execution_failure(self):
        text = (SYSTEM / "workflows" / "orchestration" / "dispatch.md").read_text(encoding="utf-8")
        self.assertIn("BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE", text)
        self.assertIn("BLOCKED:HOST_ISOLATION_UNAVAILABLE", text)
        self.assertIn("BLOCKED:AUTHORITY_EXECUTION_FAILED", text)
        self.assertIn("does not increment the execution-failure ledger", text)

    def test_orchestrator_routes_but_does_not_invent_profiles(self):
        text = (SYSTEM / "roles" / "orchestrator.md").read_text(encoding="utf-8").lower()
        self.assertIn("never invents or substitutes provider/model settings", text)
        self.assertIn("no authority to choose arbitrary models or reasoning levels", text)

    def test_semantic_role_files_remain_provider_neutral(self):
        for name in ("prd.md", "planner.md", "implementer.md", "reviewer.md"):
            text = (SYSTEM / "roles" / name).read_text(encoding="utf-8").lower()
            self.assertNotIn("gpt-6-", text, name)
            self.assertNotIn("model_reasoning_effort", text, name)

    def test_io_contract_names_host_profile_stop(self):
        text = (SYSTEM / "core" / "io-contract.md").read_text(encoding="utf-8")
        self.assertIn("HOST_EXECUTION_PROFILE_UNAVAILABLE", text)
        self.assertIn("execution mechanism existed", text)
        self.assertIn("no authority worker ran", text)

    def test_codex_template_enforces_fail_closed_fidelity(self):
        text = (ROOT / "installer" / "templates" / "codex" / "yaaw-runtime.md").read_text(encoding="utf-8")
        for marker in (
            "Changing the execution mechanism is allowed",
            "Unknown is not assumed equivalent",
            "BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE",
            "must not increment the failure ledger",
            "same fidelity rules",
        ):
            self.assertIn(marker, text)

if __name__ == "__main__":
    unittest.main()
