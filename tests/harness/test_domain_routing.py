import unittest

from scripts.yaaw.domain_pack import DomainPack, DomainPackError, merge_packs
from scripts.yaaw.routing import Criticality, RouteSignals, decide


class DomainRoutingTests(unittest.TestCase):
    def test_pack_override_is_explicit(self):
        base = DomainPack({"schema": "yaaw.domain-pack/v1", "name": "base", "requires_yaaw": {}, "ownership": [{"pattern": "src/**", "owner": "core"}]}, "base")
        overlay = DomainPack({"schema": "yaaw.domain-pack/v1", "name": "repo", "requires_yaaw": {}, "ownership": [{"pattern": "src/**", "owner": "app"}]}, "repo")
        with self.assertRaises(DomainPackError):
            merge_packs(base, overlay)
        overlay2 = DomainPack({"schema": "yaaw.domain-pack/v1", "name": "repo", "requires_yaaw": {}, "ownership": [{"pattern": "src/**", "owner": "app", "override": True}]}, "repo")
        self.assertEqual(merge_packs(base, overlay2).data["ownership"][0]["owner"], "app")

    def test_tiny_bug_can_be_l0(self):
        self.assertEqual(decide(RouteSignals(default_level=0)).level, 0)

    def test_tiny_security_change_is_high_assurance(self):
        decision = decide(RouteSignals(default_level=0, security_trust_boundary=True, criticality=Criticality.CRITICAL))
        self.assertEqual(decision.level, 4)
        self.assertEqual(decision.qa, "HIGH_ASSURANCE")

    def test_local_architecture_is_not_automatic_l4(self):
        self.assertEqual(decide(RouteSignals(default_level=1, architecture_scope="LOCAL")).level, 1)


if __name__ == "__main__":
    unittest.main()
