from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.modes import OperatingMode
from scripts.yaaw.runtime_profiles import ModelCandidate, RoleRequirement, RuntimeProfileError, select_candidate, select_qa_candidate

CAPS = frozenset({"tool_use", "repository_read", "code_edit", "structured_output", "fresh_context"})


class RuntimeProfilesTests(unittest.TestCase):
    def test_fallback_cannot_downgrade_required_capability(self):
        requirement = RoleRequirement("high", frozenset({"tool_use", "code_edit"}))
        candidates = [ModelCandidate("weak", "a", "medium", CAPS), ModelCandidate("strong", "b", "high", CAPS)]
        self.assertEqual(select_candidate(candidates, requirement).model, "strong")

    def test_no_eligible_model_is_blocking(self):
        requirement = RoleRequirement("max", frozenset({"tool_use", "code_edit"}))
        with self.assertRaises(RuntimeProfileError):
            select_candidate([ModelCandidate("weak", "a", "high", CAPS)], requirement)

    def test_high_assurance_qa_diversifies_when_available(self):
        requirement = RoleRequirement("high", frozenset({"tool_use", "fresh_context"}))
        candidates = [ModelCandidate("same", "family-a", "high", CAPS), ModelCandidate("other", "family-b", "high", CAPS)]
        selected = select_qa_candidate(candidates, requirement, "family-a", "REQUIRE_DISTINCT_FAMILY_WHEN_AVAILABLE")
        self.assertEqual(selected.model, "other")


class OperatingModeTests(unittest.TestCase):
    def test_strict_strengthens_low_risk_qa(self):
        mode = OperatingMode("strict", 1, "INDEPENDENT", 1, False, "DENY_UNLESS_ALLOWED")
        self.assertEqual(mode.effective_qa("SELF_VERIFY"), "INDEPENDENT")

    def test_lightweight_never_weakens_high_assurance(self):
        mode = OperatingMode("lightweight", 2, "SELF_VERIFY", 1, True, "DOMAIN_POLICY")
        self.assertEqual(mode.effective_qa("HIGH_ASSURANCE"), "HIGH_ASSURANCE")


if __name__ == "__main__":
    unittest.main()
