import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SYSTEM=ROOT/'.yaaw-core/system'
KERNEL=json.loads((SYSTEM/'kernel.yaml').read_text())

def read(rel): return (ROOT/rel).read_text(encoding='utf-8')

class AssumptionChallengeContractTest(unittest.TestCase):
    def test_reasoning_rule_is_consolidated_not_a_public_skill(self):
        text=(SYSTEM/'SYSTEM.md').read_text().lower()
        for marker in ('assumption challenge','material assumptions','facts before','future fog','zero is valid','store conclusions, not cognition'):
            self.assertIn(marker,text)
        self.assertNotIn('yaaw-grill',KERNEL['skills'])
        self.assertNotIn('yaaw-challenge',KERNEL['skills'])
        self.assertFalse((SYSTEM/'rules').exists())

    def test_prd_keeps_product_authority(self):
        text=read('.yaaw-core/system/roles/prd.md').lower()
        self.assertIn('product',text)
        self.assertIn('question-round',text)
        self.assertIn('future fog',text)
        self.assertIn('engineering',text)
        self.assertIn('record-decisions',text)

    def test_planner_establishes_repository_facts_before_questions(self):
        text=read('.yaaw-core/system/roles/planner.md').lower()
        for marker in ('facts before questions','discover','decision-frontier','question-round','future fog','research','record-decisions'):
            self.assertIn(marker,text)
        self.assertIn('never invent',text)

    def test_orchestrator_implementer_reviewer_do_not_gain_decision_challenge_authority(self):
        orchestrator=read('.yaaw-core/system/roles/orchestrator.md').lower()
        implementer=read('.yaaw-core/system/roles/implementer.md').lower()
        reviewer=read('.yaaw-core/system/roles/reviewer.md').lower()
        self.assertIn('traffic controller, not a super-agent',orchestrator)
        self.assertIn('never self-approve',implementer)
        self.assertIn('independent',reviewer)
        self.assertNotIn('question-round',orchestrator)
        self.assertNotIn('question-round',implementer)
        self.assertNotIn('question-round',reviewer)

if __name__=='__main__': unittest.main()
