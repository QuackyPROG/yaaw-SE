from __future__ import annotations
import hashlib, json, tempfile, unittest
from pathlib import Path
from scripts.yaaw.change_set import ChangeSet, ChangeSetError
from scripts.yaaw.domain_pack import DomainPack, DomainPackError, install_pack, plan_install
from scripts.yaaw.external_adapters import AdapterContract, ExternalObservationError, normalize_observation
from scripts.yaaw.repository_signals import codeowner_candidates, normalize_ruleset, observe_ownership, parse_codeowners

class RepositorySignalTests(unittest.TestCase):
    def test_codeowners_is_evidence_not_authority(self):
        entries=parse_codeowners("src/** @platform\nsrc/auth/** @security\n"); observed=codeowner_candidates("src/auth/login.py",entries); self.assertEqual(observed,("@security",)); result=observe_ownership("src/auth/login.py","auth",codeowners=observed); self.assertEqual(result.authoritative_owner,"auth"); self.assertTrue(result.conflict)
    def test_ruleset_normalization(self):
        r=normalize_ruleset("ruleset:17",{"rules":[{"type":"required_status_checks","parameters":{"required_status_checks":[{"context":"test"},{"context":"lint"}]}},{"type":"pull_request","parameters":{"required_approving_review_count":2}},{"type":"non_fast_forward"},{"type":"deletion"}]}); self.assertEqual(r.required_status_checks,("lint","test")); self.assertEqual(r.required_approvals,2); self.assertTrue(r.restrict_force_push); self.assertTrue(r.restrict_deletion)

class DomainPackLifecycleTests(unittest.TestCase):
    def pack(self,v,minimum=4): return DomainPack({"schema":"yaaw.domain-pack/v1","name":"demo","pack_version":v,"requires_yaaw":{"min_harness_version":minimum,"max_harness_version":None}},"memory")
    def test_install_update_and_downgrade(self):
        first=plan_install(self.pack("1.0.0"),None,harness_version=4); self.assertEqual(first.action,"INSTALL"); update=plan_install(self.pack("2.0.0"),first.lock,harness_version=4); self.assertEqual(update.action,"UPDATE")
        with self.assertRaises(DomainPackError): plan_install(self.pack("1.0.0"),update.lock,harness_version=4)
    def test_incompatible_harness_blocks(self):
        with self.assertRaises(DomainPackError): plan_install(self.pack("1.0.0",5),None,harness_version=4)
    def test_example_lock_matches_example_pack(self):
        root=Path(__file__).resolve().parents[2]; data=json.loads((root/"examples/domain-pack/.yaaw/domain-pack.json").read_text(encoding="utf-8")); lock=json.loads((root/"examples/domain-pack/.yaaw/domain-pack.lock.json").read_text(encoding="utf-8")); digest="sha256:"+hashlib.sha256(json.dumps(data,sort_keys=True,separators=(",",":")).encode()).hexdigest(); self.assertEqual(lock["digest"],digest)
    def test_install_is_dry_run_until_write(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td); source=root/"pack.json"; destination=root/"installed.json"; lock=root/"lock.json"; source.write_text(json.dumps(self.pack("1.0.0").data),encoding="utf-8"); plan=install_pack(source,destination,lock,harness_version=4,write=False); self.assertEqual(plan.action,"INSTALL"); self.assertFalse(destination.exists()); self.assertFalse(lock.exists()); install_pack(source,destination,lock,harness_version=4,write=True); self.assertTrue(destination.exists()); self.assertTrue(lock.exists())

class ExternalAdapterTests(unittest.TestCase):
    def test_stable_identity_and_evidence_only(self):
        c=AdapterContract("github-issue","TRACKER","node_id"); o=normalize_observation(c,{"node_id":"I_kw123"},observed_state="OPEN",source_ref="github:issue/42",freshness_token="etag:abc",observed_at="2026-09-04T00:00:00+00:00"); self.assertEqual(o.stable_id,"I_kw123"); self.assertEqual(o.authority,"EVIDENCE_ONLY")
        with self.assertRaises(ExternalObservationError): normalize_observation(c,{},observed_state="OPEN",source_ref="x",freshness_token="y")

class ChangeSetTests(unittest.TestCase):
    def test_frontier_and_release_order(self):
        c=ChangeSet.from_dict({"schema":"yaaw.change-set/v1","id":"CS-1","state":"READY","changes":[{"id":"api","repository":"org/api","work_id":"DEL-1","base_ref":"main","head_ref":"feat/api"},{"id":"web","repository":"org/web","work_id":"DEL-2","base_ref":"main","head_ref":"feat/web","depends_on":["api"]}],"release_order":["api","web"]}); self.assertEqual([x.id for x in c.ready_changes(set())],["api"]); self.assertEqual([x.id for x in c.ready_changes({"api"})],["web"]); self.assertTrue(c.release_sequence_valid(set()))
    def test_cycle_rejected(self):
        with self.assertRaises(ChangeSetError): ChangeSet.from_dict({"schema":"yaaw.change-set/v1","id":"CS-2","state":"READY","changes":[{"id":"a","repository":"org/a","work_id":"A","base_ref":"main","head_ref":"x","depends_on":["b"]},{"id":"b","repository":"org/b","work_id":"B","base_ref":"main","head_ref":"y","depends_on":["a"]}]})

if __name__=="__main__": unittest.main()
