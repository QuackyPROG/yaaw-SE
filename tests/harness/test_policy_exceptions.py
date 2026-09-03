import unittest
from datetime import datetime, timedelta, timezone

from scripts.yaaw.exceptions import PolicyException, PolicyExceptionError, require_exception


class PolicyExceptionTests(unittest.TestCase):
    def test_exception_must_be_explicit_and_unexpired(self):
        future = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        item = PolicyException("independent_qa", "HUMAN_RELEASE_AUTHORITY", "approval-1", future, "emergency mitigation")
        self.assertEqual(require_exception([item], "independent_qa", "HUMAN_RELEASE_AUTHORITY"), item)
        with self.assertRaises(PolicyExceptionError):
            require_exception([], "independent_qa", "HUMAN_RELEASE_AUTHORITY")


if __name__ == "__main__":
    unittest.main()
