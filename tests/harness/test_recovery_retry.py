import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.recovery import RuntimeSnapshot, SnapshotStore
from scripts.yaaw.retry import FailureClass, may_retry


class RecoveryRetryTests(unittest.TestCase):
    def test_snapshot_roundtrip(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = SnapshotStore(Path(tmp) / "snapshot.json")
            snapshot = RuntimeSnapshot("DEL-1", "implementer", "wt", "abc", 1, {"x": 1})
            store.save(snapshot)
            self.assertEqual(store.load(), snapshot)
            store.clear()
            self.assertIsNone(store.load())

    def test_only_transient_failures_retry(self):
        self.assertTrue(may_retry(FailureClass.NETWORK_TRANSIENT, 0))
        self.assertFalse(may_retry(FailureClass.CONTRACT_INVALID, 0))


if __name__ == "__main__":
    unittest.main()
