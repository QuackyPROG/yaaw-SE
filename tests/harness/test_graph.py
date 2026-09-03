import unittest

from scripts.yaaw.graph import TicketGraph
from scripts.yaaw.model import Ticket, TicketKind, TicketState


def t(ticket_id, status, blocked=()):
    return Ticket(ticket_id, TicketKind.DELIVERY, status, 2, "core", blocked_by=tuple(blocked))


class GraphTests(unittest.TestCase):
    def test_frontier_only_contains_unblocked_ready(self):
        graph = TicketGraph([t("DEL-1", TicketState.DONE), t("DEL-2", TicketState.READY, ["DEL-1"])])
        self.assertEqual([x.id for x in graph.ready_frontier()], ["DEL-2"])

    def test_cycle_detection(self):
        graph = TicketGraph([t("DEL-1", TicketState.BLOCKED, ["DEL-2"]), t("DEL-2", TicketState.BLOCKED, ["DEL-1"])])
        self.assertTrue(graph.diagnostics().cycles)
        self.assertTrue(any("cycle" in r for r in graph.deadlock_reasons()))

    def test_missing_blocker(self):
        graph = TicketGraph([t("DEL-1", TicketState.BLOCKED, ["NOPE-1"])])
        self.assertEqual(graph.diagnostics().missing_blockers, ("DEL-1->NOPE-1",))


if __name__ == "__main__":
    unittest.main()
