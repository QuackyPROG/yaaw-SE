import unittest

from scripts.yaaw.security import CommandRisk, EgressPolicy, RoleCapabilities, SecurityError, authorize_command, command_effects, inferred_minimum_risk, redact_secrets
from scripts.yaaw.trust import TrustClass, may_supply_instructions


class SecurityTests(unittest.TestCase):
    def test_destructive_command_cannot_be_underdeclared(self):
        caps = RoleCapabilities(CommandRisk.LOCAL_MUTATION)
        with self.assertRaises(SecurityError):
            authorize_command("rm -rf build", CommandRisk.READ_ONLY, caps)
        self.assertEqual(inferred_minimum_risk("rm -rf build"), CommandRisk.DESTRUCTIVE)

    def test_local_destructive_does_not_require_unrelated_capabilities(self):
        caps = RoleCapabilities(CommandRisk.DESTRUCTIVE, network=False, production=False, mutate_repo=False)
        authorize_command("rm -rf build", CommandRisk.READ_ONLY, caps)

    def test_git_commit_is_local_mutation_not_read_only(self):
        self.assertEqual(inferred_minimum_risk("git commit -m test"), CommandRisk.LOCAL_MUTATION)

    def test_git_push_requires_network_and_repository_capability(self):
        caps = RoleCapabilities(CommandRisk.REPOSITORY_SIDE_EFFECT, network=True, mutate_repo=False)
        with self.assertRaisesRegex(SecurityError, "remote repository"):
            authorize_command("git push origin HEAD", CommandRisk.READ_ONLY, caps)
        authorize_command("git push origin HEAD", CommandRisk.READ_ONLY, RoleCapabilities(CommandRisk.REPOSITORY_SIDE_EFFECT, network=True, mutate_repo=True))

    def test_dependency_install_requires_network_capability(self):
        self.assertEqual(inferred_minimum_risk("npm install left-pad"), CommandRisk.DEPENDENCY_MUTATION)
        with self.assertRaisesRegex(SecurityError, "network"):
            authorize_command("npm install left-pad", CommandRisk.DEPENDENCY_MUTATION, RoleCapabilities(CommandRisk.DEPENDENCY_MUTATION, network=False))

    def test_obvious_provider_mutation_has_production_floor(self):
        self.assertEqual(inferred_minimum_risk("terraform apply -auto-approve"), CommandRisk.PRODUCTION_SIDE_EFFECT)
        self.assertEqual(inferred_minimum_risk("kubectl apply -f deployment.yaml"), CommandRisk.PRODUCTION_SIDE_EFFECT)
        caps = RoleCapabilities(CommandRisk.PRODUCTION_SIDE_EFFECT, network=True, production=False)
        with self.assertRaisesRegex(SecurityError, "production/provider"):
            authorize_command("terraform apply -auto-approve", CommandRisk.READ_ONLY, caps)

    def test_destructive_provider_command_requires_provider_capability(self):
        effects = command_effects("kubectl delete namespace prod")
        self.assertEqual(effects.risk, CommandRisk.DESTRUCTIVE)
        self.assertTrue(effects.network)
        self.assertTrue(effects.production)
        with self.assertRaisesRegex(SecurityError, "production/provider"):
            authorize_command("kubectl delete namespace prod", CommandRisk.READ_ONLY, RoleCapabilities(CommandRisk.DESTRUCTIVE, network=True, production=False))

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
