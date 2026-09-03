import unittest

from scripts.yaaw.context import from_ticket
from scripts.yaaw.model import Ticket, TicketKind, TicketState


class ContextTests(unittest.TestCase):
    def test_capsule_is_bounded_and_structured(self):
        ticket = Ticket("DEL-1", TicketKind.DELIVERY, TicketState.READY, 1, "core", acceptance=("observable",), metadata={"allowed_write": ["src/**"]})
        capsule = from_ticket(ticket, "implementer")
        rendered = capsule.render(2000)
        self.assertIn('"schema": "yaaw.handoff/v1"', rendered)
        self.assertIn("src/**", rendered)

    def test_oversized_capsule_fails(self):
        ticket = Ticket("DEL-1", TicketKind.DELIVERY, TicketState.READY, 1, "core", acceptance=("x" * 100,), metadata={})
        with self.assertRaises(ValueError):
            from_ticket(ticket, "implementer").render(20)


if __name__ == "__main__":
    unittest.main()
