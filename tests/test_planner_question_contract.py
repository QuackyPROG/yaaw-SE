import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLANNER = ROOT / '.yaaw-core/system/roles/planner.md'


class PlannerQuestionContractTest(unittest.TestCase):
    def test_question_round_uses_bounded_decision_batches(self):
        text = PLANNER.read_text(encoding='utf-8')
        lower = text.lower()
        for marker in (
            '1 to 10',
            'never pad a batch to reach 10',
            'a.',
            'b.',
            'c.',
            'recommended: <label>',
            'two or more credible alternatives',
            'do not manufacture choices',
            'free-form answers',
            'label-only answers',
            'do not start another question round',
            'planning.record-decisions',
            'decision frontier has been recomputed',
        ):
            self.assertIn(marker, lower)

    def test_question_contract_preserves_planner_authority_and_filters(self):
        text = PLANNER.read_text(encoding='utf-8').lower()
        for marker in (
            'repository-answerable',
            'routine reversible',
            'future-dependent',
            'prerequisite-blocked',
            'product gaps return to prd',
            'advice, not new product authority',
        ):
            self.assertIn(marker, text)

    def test_record_decisions_persists_meaning_not_option_labels(self):
        text = PLANNER.read_text(encoding='utf-8').lower()
        self.assertIn('never persist a bare option label as engineering meaning', text)
        self.assertIn('persist conclusions rather than transcripts', text)
        self.assertIn('do not guess', text)


if __name__ == '__main__':
    unittest.main()
