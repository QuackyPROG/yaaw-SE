import pathlib
import tomllib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG = ROOT / ".codex" / "config.toml"
ROLES = ("prd", "planner", "implementer", "reviewer")


class CodexRuntimePolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config = tomllib.loads(CONFIG.read_text())

    def test_controller_is_luna_max_fast(self):
        self.assertEqual(self.config["model"], "gpt-5.6-luna")
        self.assertEqual(self.config["model_reasoning_effort"], "max")
        self.assertEqual(self.config["service_tier"], "fast")

    def test_subagent_host_is_single_depth_and_multi_agent_enabled(self):
        self.assertTrue(self.config["features"]["multi_agent"])
        self.assertEqual(self.config["agents"]["max_depth"], 1)

    def test_every_role_has_high_xhigh_max_fast_variants(self):
        for role in ROLES:
            for suffix, effort in (("", "high"), ("_xhigh", "xhigh"), ("_max", "max")):
                key = role + suffix
                registration = self.config["agents"][key]
                self.assertIn(role.capitalize(), registration["description"])
                path = CONFIG.parent / registration["config_file"]
                self.assertTrue(path.is_file(), key)
                agent = tomllib.loads(path.read_text())
                self.assertEqual(agent["model"], "gpt-5.6-luna", key)
                self.assertEqual(agent["model_reasoning_effort"], effort, key)
                self.assertEqual(agent["service_tier"], "fast", key)

    def test_escalation_policy_preserves_authority(self):
        policy = (ROOT / ".yaaw-core" / "core" / "codex-runtime.md").read_text()
        for required in (
            "same semantic assignment",
            "Orchestrator-owned",
            "Max does not get broader writes than High",
            "Subagents never spawn peers",
            "cannot use memory or higher reasoning to manufacture `PASS`",
        ):
            self.assertIn(required, policy)


if __name__ == "__main__":
    unittest.main()
