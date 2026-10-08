import json
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SYSTEM=ROOT/'.yaaw-core/system'
FIXTURE=ROOT/'tests/fixtures/fresh_context_project/.yaaw-core/project'
CHALLENGE=ROOT/'tests/fixtures/assumption_challenge_fresh_context/.yaaw-core/project'

def parse(path:Path):
    lines=path.read_text().splitlines(); end=next(i for i in range(1,len(lines)) if lines[i].strip()=='---'); data={}
    for raw in lines[1:end]:
        if not raw or raw.startswith(' ') or ':' not in raw: continue
        key,value=raw.split(':',1); value=value.strip()
        if value.startswith('['): data[key]=json.loads(value)
        elif value in ('true','false'): data[key]=value=='true'
        elif re.fullmatch(r'\d+',value): data[key]=int(value)
        else: data[key]=value.strip("\"'")
    return data,'\n'.join(lines[end+1:])

class FreshContextConformanceTest(unittest.TestCase):
    def test_artifact_graph_reconstructs_without_chat_or_global_state(self):
        product,_=parse(FIXTURE/'product.md'); engineering,engineering_body=parse(FIXTURE/'engineering.md'); spec,spec_body=parse(FIXTURE/'specs/SPEC-001.md'); ticket,ticket_body=parse(FIXTURE/'tickets/TASK-001.md'); review,review_body=parse(FIXTURE/'reviews/TASK-001-R1.md'); evidence=json.loads((FIXTURE/'evidence/EVIDENCE-TASK-001-V1.json').read_text())
        self.assertFalse((FIXTURE/'state.json').exists())
        self.assertEqual(engineering['product_revision'],product['revision'])
        self.assertEqual(spec['product_revision'],product['revision'])
        self.assertEqual(spec['engineering_revision'],engineering['revision'])
        self.assertEqual(ticket['spec'],spec['id'])
        self.assertEqual(ticket['spec_revision'],spec['revision'])
        self.assertEqual(ticket['product_revision'],product['revision'])
        self.assertEqual(ticket['engineering_revision'],engineering['revision'])
        self.assertEqual(ticket['status'],'PASS')
        self.assertEqual(review['ticket'],ticket['id'])
        self.assertEqual(review['ticket_revision'],ticket['revision'])
        self.assertIn(evidence['id'],review['evidence'])
        combined='\n'.join([engineering_body,spec_body,ticket_body,review_body]).lower()
        self.assertNotIn('conversation transcript',combined)

    def test_fixture_frontmatter_covers_required_fields(self):
        pairs=[('product.schema.json',FIXTURE/'product.md'),('engineering-v2.schema.json',FIXTURE/'engineering.md'),('spec.schema.json',FIXTURE/'specs/SPEC-001.md'),('ticket.schema.json',FIXTURE/'tickets/TASK-001.md'),('review.schema.json',FIXTURE/'reviews/TASK-001-R1.md')]
        for schema_name,artifact in pairs:
            schema=json.loads((SYSTEM/'schemas'/schema_name).read_text()); meta,_=parse(artifact)
            self.assertTrue(set(schema['required']).issubset(meta),artifact.name)

    def test_challenged_conclusions_survive_without_transcript(self):
        product,product_body=parse(CHALLENGE/'product.md'); engineering,engineering_body=parse(CHALLENGE/'engineering.md')
        self.assertEqual(engineering['product_revision'],product['revision'])
        self.assertIn('Decision: Each workspace has exactly one active owner in V1.',product_body)
        self.assertIn('Rejected alternatives:',engineering_body)
        self.assertIn('## Current decision frontier',engineering_body)
        self.assertIn('## Future fog',engineering_body)
        combined=(product_body+'\n'+engineering_body).lower()
        for marker in ('user said','assistant asked','conversation transcript'):
            self.assertNotIn(marker,combined)

if __name__=='__main__': unittest.main()
