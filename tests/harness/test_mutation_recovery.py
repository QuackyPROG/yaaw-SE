from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.graph import TicketGraph
from scripts.yaaw.leases import LeaseStore
from scripts.yaaw.migrations import migrate_file
from scripts.yaaw.model import TicketState
from scripts.yaaw.mutation import IdempotencyStore, MutationError, transition_ticket
from scripts.yaaw.recovery import RuntimeSnapshot, SnapshotStore, reconstruct_state
from scripts.yaaw.state import TransitionContext


def ticket_text(status="DRAFT", ticket_id="DEL-1"):
    return f'''---yaaw-json
{{"schema":"yaaw.ticket/v1","id":"{ticket_id}","kind":"DELIVERY","status":"{status}","level":1,"owner":"auth","blocked_by":[],"acceptance":["returns 200 for valid session"],"qa":{{"required":false}}}}
---
# {ticket_id}

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


class MutationTests(unittest.TestCase):
    def test_transition_is_atomic_and_idempotent(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td); path=root/"ticket.md"; path.write_text(ticket_text(),encoding="utf-8"); store=IdempotencyStore(root/"ops.json"); ctx=TransitionContext(owner_resolved=True,blockers_done=True,acceptance_bounded=True,sources_current=True)
            first=transition_ticket(path,TicketState.READY,ctx,operation_id="op-1",store=store,write=True); self.assertTrue(first["changed"])
            replay=transition_ticket(path,TicketState.READY,ctx,operation_id="op-1",store=store,write=True); self.assertEqual(replay["to"],"READY"); self.assertEqual(TicketGraph.from_directory(root).tickets["DEL-1"].status,TicketState.READY)
            with self.assertRaises(MutationError): transition_ticket(path,TicketState.BLOCKED,TransitionContext(),operation_id="op-1",store=store,write=True)

    def test_dry_run_does_not_mutate(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td); path=root/"ticket.md"; original=ticket_text(); path.write_text(original,encoding="utf-8"); transition_ticket(path,TicketState.READY,TransitionContext(owner_resolved=True,blockers_done=True,acceptance_bounded=True,sources_current=True),write=False); self.assertEqual(path.read_text(encoding="utf-8"),original)


class LeaseRecoveryTests(unittest.TestCase):
    def test_orphan_reclaim_is_explicit(self):
        with tempfile.TemporaryDirectory() as td:
            store=LeaseStore(Path(td)); lease=store.acquire("worktree-a","holder-a","DEL-1",ttl_seconds=3600); decision=store.reclaim_stale("worktree-a",set(),write=False,now=lease.created_at+1); self.assertTrue(decision.reclaimable); self.assertEqual(decision.reason,"ORPHANED_WORK"); self.assertEqual(store.read("worktree-a").holder,"holder-a"); store.reclaim_stale("worktree-a",set(),write=True,now=lease.created_at+1); self.assertFalse(store._path("worktree-a").exists())

    def test_reconstructs_active_ticket_without_chat(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td); (root/"active.md").write_text(ticket_text("IN_PROGRESS","DEL-7"),encoding="utf-8"); state=reconstruct_state(TicketGraph.from_directory(root),None); self.assertEqual(state.active_work,"DEL-7"); self.assertEqual(state.source,"REPOSITORY")

    def test_failure_signatures_persist_and_escalate(self):
        with tempfile.TemporaryDirectory() as td:
            store=SnapshotStore(Path(td)/"snapshot.json"); store.save(RuntimeSnapshot("DEL-1","implementer","wt","abc",1,{})); self.assertEqual(store.register_failure("same-test",2),1); self.assertEqual(store.register_failure("same-test",2),2)
            with self.assertRaises(RuntimeError): store.register_failure("same-test",2)
            self.assertEqual(store.load().failure_signatures["same-test"],3)


class MigrationUxTests(unittest.TestCase):
    def test_migration_is_dry_run_until_write(self):
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/"ticket.md"; old='''---yaaw-json
{"schema":"yaaw.ticket/v0","id":"DEL-1","kind":"DELIVERY","status":"DRAFT","qa_required":false}
---
# old
'''; path.write_text(old,encoding="utf-8"); preview=migrate_file(path,write=False); self.assertTrue(preview.changed); self.assertEqual(path.read_text(encoding="utf-8"),old); applied=migrate_file(path,write=True); self.assertTrue(applied.changed); self.assertIn('"schema": "yaaw.ticket/v1"',path.read_text(encoding="utf-8"))


if __name__ == "__main__": unittest.main()
