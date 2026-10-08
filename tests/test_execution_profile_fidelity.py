import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SYSTEM=ROOT/'.yaaw-core/system'

class ExecutionProfileFidelityContracts(unittest.TestCase):
    def test_orchestrator_dispatch_preserves_host_profile_fidelity(self):
        text=(SYSTEM/'roles/orchestrator.md').read_text().lower()
        self.assertIn('required effective execution profile',text)
        self.assertIn('never silently substitute an incompatible profile',text)
        self.assertIn('isolated authority worker',text)

    def test_semantic_roles_are_provider_neutral(self):
        for name in ('prd.md','planner.md','implementer.md','reviewer.md'):
            text=(SYSTEM/'roles'/name).read_text().lower()
            self.assertNotIn('gpt-6-',text,name)
            self.assertNotIn('model_reasoning_effort',text,name)

    def test_codex_adapter_enforces_typed_profile_stops(self):
        text=(ROOT/'installer/templates/codex/yaaw-runtime.md').read_text()
        for marker in ('BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE','BLOCKED:HOST_ISOLATION_UNAVAILABLE','HOST_INHERIT','must not increment the failure ledger'):
            self.assertIn(marker,text)

if __name__=='__main__': unittest.main()
