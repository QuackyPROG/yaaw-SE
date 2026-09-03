import unittest

from scripts.yaaw.ownership import OwnershipError, OwnershipRule, matches, resolve, validate_rules


class OwnershipTests(unittest.TestCase):
    def test_specific_rule_wins(self):
        rules = [OwnershipRule("src/**", "core"), OwnershipRule("src/auth/**", "auth")]
        self.assertEqual(resolve("src/auth/login.py", rules).owner, "auth")

    def test_star_does_not_cross_directory(self):
        self.assertFalse(matches("src/auth/deep/x.py", "src/auth/*"))
        self.assertTrue(matches("src/auth/deep/x.py", "src/auth/**"))

    def test_exact_conflict_detected(self):
        self.assertTrue(validate_rules([OwnershipRule("src/**", "a"), OwnershipRule("src/**", "b")]))

    def test_equal_specificity_ambiguity_fails(self):
        with self.assertRaises(OwnershipError):
            resolve("src/x.py", [OwnershipRule("src/*.py", "a"), OwnershipRule("src/?.py", "b")])


if __name__ == "__main__":
    unittest.main()
