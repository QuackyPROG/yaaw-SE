import unittest

from scripts.yaaw.security import CommandRisk, EgressPolicy, RoleCapabilities, SecurityError, authorize_command, inferred_minimum_risk, redact_secrets
from scripts.yaaw.trust import TrustClass, may_supply_instructions


class SecurityTests(unittest.TestCase):
    def test_destructive_command_cannot_be_underdeclared(self):
        caps = RoleCapabilities(CommandRisk.LOCAL_MUTATION)
        with self.assertRaises(SecurityError):
            authorize_command("rm -rf build", CommandRisk.READ_ONLY, caps)
        self.assertEqual(inferred_minimum_risk("rm -rf build"), CommandRisk.DESTRUCTIVE)

    def test_untrusted_content_cannot_supply_instructions(self):
        self.assertFalse(may_supply_instructions(TrustClass.PROJECT_CONTENT_UNTRUSTED))
        self.assertFalse(may_supply_instructions(TrustClass.EXTERNAL_CONTENT_UNTRUSTED))
        self.assertTrue(may_supply_instructions(TrustClass.PROJECT_POLICY_TRUSTED))

    def test_egress_allowlist(self):
        policy = EgressPolicy(True, ("docs.example.com",), False)
        policy.authorize("https://docs.example.com/api")
        with self.assertRaises(SecurityError):
            policy.authorize("https://evil.example.net")

    def test_redaction(self):
        text = redact_secrets("api_key=abcdef123456 token: xyz987")
        self.assertNotIn("abcdef123456", text)
        self.assertNotIn("xyz987", text)


if __name__ == "__main__":
    unittest.main()
