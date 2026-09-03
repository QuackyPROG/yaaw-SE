import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.artifacts import validate_ticket_document

DELIVERY = '''---yaaw-json
{"schema":"yaaw.ticket/v1","id":"DEL-1","kind":"DELIVERY","status":"READY","level":1,"owner":"core","blocked_by":[],"acceptance":["HTTP 200 returns user id"],"qa":{"required":false},"allowed_write":["src/**"],"forbidden_write":[]}
---
# DEL-1

## What to deliver
x
## Acceptance criteria
x
## Preservation invariants
x
## Allowed write scope
x
## Forbidden write scope
x
## Expected change surface
x
## Canonical sources
x
## Verification
x
## QA disposition
x
## Stop and replan triggers
x
## Implementation evidence
x
## QA result
x
## Delivery
x
'''

class ArtifactTests(unittest.TestCase):
    def test_delivery_sections_are_unambiguous(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "ticket.md"
            path.write_text(DELIVERY, encoding="utf-8")
            self.assertEqual(validate_ticket_document(path), [])

    def test_duplicate_qa_result_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "ticket.md"
            path.write_text(DELIVERY + "\n## QA result\nagain\n", encoding="utf-8")
            self.assertTrue(any("duplicate headings" in e for e in validate_ticket_document(path)))

if __name__ == "__main__":
    unittest.main()
