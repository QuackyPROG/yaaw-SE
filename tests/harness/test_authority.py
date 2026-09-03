import unittest

from scripts.yaaw.authority import AuthorityError, AuthorityPolicy


class AuthorityTests(unittest.TestCase):
    def test_field_permissions(self):
        policy = AuthorityPolicy({"artifacts": {"DELIVERY_TICKET": {"fallback_mutators": [], "fields": {"qa_result": {"mutators": ["qa"]}}}}})
        self.assertTrue(policy.can_mutate("qa", "DELIVERY_TICKET", "qa_result"))
        self.assertFalse(policy.can_mutate("implementer", "DELIVERY_TICKET", "qa_result"))
        with self.assertRaises(AuthorityError):
            policy.require_mutation("implementer", "DELIVERY_TICKET", "qa_result")


if __name__ == "__main__":
    unittest.main()
