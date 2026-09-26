import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures" / "lifecycle_cases.json"

class BehavioralConformanceTest(unittest.TestCase):
    def test_fixture_ids_are_unique_and_current(self):
        cases = json.loads(FIXTURES.read_text())["cases"]
        ids = [case["id"] for case in cases]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue({"C-spec-unadopted","D-ticket-unregistered","F-start-survives-loss","G-pass-verification","H-failed-verification","I-review-pass-lost-response","K-final-frontier"}.issubset(set(ids)))

    def test_python_oracle_is_only_a_node_compatibility_shim(self):
        text = (ROOT / "scripts" / "behavior_oracle.py").read_text()
        self.assertNotIn("def determine_next", text)
        self.assertNotIn("ticket_state_precedence", text)
        self.assertIn("run_lifecycle_cases.mjs", text)

if __name__ == "__main__":
    unittest.main()
