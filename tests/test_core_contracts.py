import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SYSTEM=ROOT/'.yaaw-core'/'system'
KERNEL=json.loads((SYSTEM/'kernel.yaml').read_text())

class CoreContractsTest(unittest.TestCase):
    def test_compact_system_surface_is_exact(self):
        self.assertEqual({p.name for p in SYSTEM.iterdir()},{'SYSTEM.md','kernel.yaml','roles','modules','schemas','templates','engine'})
        for legacy in ('core','workflows','rules','registries','expertise','tools'):
            self.assertFalse((SYSTEM/legacy).exists(),legacy)

    def test_kernel_is_single_machine_contract(self):
        self.assertEqual(KERNEL['schema'],'yaaw.kernel/v1')
        for key in ('paths','artifacts','roles','workflows','handoffs','skills','modules','lifecycle'):
            self.assertIn(key,KERNEL)
        self.assertNotIn('state',KERNEL['paths'])
        self.assertEqual(KERNEL['paths']['project_root'],'.yaaw-core/project')

    def test_five_roles_own_operations_and_io(self):
        self.assertEqual(set(KERNEL['roles']),{'prd','planner','implementer','reviewer','orchestrator'})
        for workflow_id,wf in KERNEL['workflows'].items():
            role=KERNEL['roles'][wf['role']]
            text=(ROOT/role['document']).read_text()
            self.assertIn(f"Operation: {wf['operation']}",text,workflow_id)
        self.assertEqual(KERNEL['roles']['orchestrator']['writes'],['ticket_status','observed_state','handoff','intent','dispatch_failures'])
        self.assertNotIn('ticket',KERNEL['roles']['orchestrator']['writes'])

    def test_public_skills_are_thin_intent_entrypoints(self):
        for skill,entry in KERNEL['skills'].items():
            path=ROOT/'skills'/skill/'SKILL.md'
            self.assertTrue(path.is_file(),skill)
            text=path.read_text()
            self.assertTrue(text.startswith('---\n'))
            self.assertIn(f'name: {skill}',text)
            self.assertLessEqual(len(text.splitlines()),24)
            self.assertIn('.yaaw-core/system/engine/runtime.mjs',text)
            self.assertIn(entry['requested_workflow'],KERNEL['workflows'])

    def test_ticket_frontmatter_is_lifecycle_truth(self):
        states=set(KERNEL['lifecycle']['ticket_states'])
        ticket=json.loads((SYSTEM/'schemas/ticket.schema.json').read_text())
        self.assertEqual(set(ticket['properties']['status']['enum']),states)
        self.assertFalse((SYSTEM/'templates/project-state.json').exists())
        self.assertFalse((SYSTEM/'schemas/project-state.schema.json').exists())
        system=(SYSTEM/'SYSTEM.md').read_text().lower()
        self.assertIn('there is no durable global `state.json`',system)
        self.assertIn('ticket frontmatter `status` is the canonical lifecycle state',system)

    def test_lifecycle_preserves_independent_acceptance(self):
        legal={(row['from'],row['to']) for row in KERNEL['lifecycle']['legal']}
        for forbidden in [('DRAFT','PASS'),('READY','PASS'),('REPAIR_REQUIRED','PASS')]:
            self.assertNotIn(forbidden,legal)
        self.assertIn(('READY','IN_PROGRESS'),legal)
        self.assertIn(('IN_PROGRESS','REVIEW_REQUIRED'),legal)
        self.assertIn(('REVIEW_REQUIRED','PASS'),legal)
        reviewer=[r for r in KERNEL['lifecycle']['legal'] if r['from']=='REVIEW_REQUIRED' and r['to']=='PASS'][0]
        self.assertEqual(reviewer['owner'],'reviewer')
        self.assertEqual(reviewer.get('writer'),'orchestrator')

    def test_modules_are_optional_expertise_not_authority(self):
        for name,module in KERNEL['modules'].items():
            path=ROOT/module['path']
            self.assertTrue(path.is_file(),name)
            self.assertTrue(set(module['usable_by']).issubset({'planner','implementer','reviewer'}))
        change=(SYSTEM/'modules/changeability.md').read_text().lower()
        self.assertIn('main path',change)
        self.assertIn('invalid states',change)
        self.assertNotIn('yaaw-changeability',KERNEL['skills'])

    def test_runtime_is_derived_and_fail_closed(self):
        runtime=(SYSTEM/'engine/runtime.mjs').read_text()
        routing=(SYSTEM/'engine/routing.mjs').read_text()
        integrity=(SYSTEM/'engine/integrity.mjs').read_text()
        self.assertIn('deriveState',runtime)
        self.assertIn('patchStatus',runtime)
        self.assertNotIn('project/state.json',runtime)
        self.assertIn('TICKET_STATUS',routing)
        self.assertIn('status !== "HEALTHY"',integrity)

    def test_repository_identity_binds_application_not_control_outputs(self):
        identity=(SYSTEM/'engine/repository-identity.mjs').read_text()
        self.assertIn('yaaw-worktree-v3',identity)
        for excluded in ('.yaaw-core/runtime/**','.yaaw-core/project/tickets/**','.yaaw-core/project/evidence/**','.yaaw-core/project/reviews/**'):
            self.assertIn(excluded,identity)
        handoff=json.loads((SYSTEM/'schemas/handoff.schema.json').read_text())
        self.assertEqual(handoff['properties']['schema']['const'],'yaaw.handoff/v4')
        for field in ('basis','revisions','repository'):
            self.assertIn(field,handoff['required'])

    def test_system_contract_preserves_reasoning_invariants(self):
        text=(SYSTEM/'SYSTEM.md').read_text().lower()
        for marker in ('agents are disposable','store conclusions, not cognition','assumption challenge','research admission','changeability','ticket sizing','review independence','runtime deletion must never lose a semantic decision'):
            self.assertIn(marker,text)

if __name__=='__main__': unittest.main()
