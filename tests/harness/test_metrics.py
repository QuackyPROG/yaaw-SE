from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.metrics import load_jsonl, summarize


class MetricsTests(unittest.TestCase):
    def test_summary_tracks_quality_and_resource_signals(self):
        metrics = summarize([
            {"event": "ROUTE", "tokens": 100, "cost_usd": 0.01, "duration_ms": 20},
            {"event": "QA_RESULT", "result": "PASS", "tokens": 50, "cost_usd": 0.02, "duration_ms": 30},
            {"event": "QA_RESULT", "result": "REPAIR_REQUIRED", "tokens": 25, "duration_ms": 10},
        ])
        self.assertEqual(metrics.events, 3)
        self.assertEqual(metrics.counters["QA_RESULT"], 2)
        self.assertEqual(metrics.qa_pass_rate, 0.5)
        self.assertEqual(metrics.total_tokens, 175)
        self.assertEqual(metrics.total_cost_usd, 0.03)
        self.assertEqual(metrics.total_duration_ms, 60)

    def test_jsonl_loader_fails_on_non_object(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "events.jsonl"
            path.write_text(json.dumps([1, 2, 3]) + "\n")
            with self.assertRaises(ValueError):
                load_jsonl(path)


if __name__ == "__main__":
    unittest.main()
