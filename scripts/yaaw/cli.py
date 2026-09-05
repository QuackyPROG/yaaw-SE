"""Operator-facing CLI for deterministic yaaw-SE inspection and explicit mutation."""
from __future__ import annotations
import argparse, json
from dataclasses import asdict
from pathlib import Path
from .artifacts import validate_ticket_tree
from .change_set import ChangeSet
from .context import from_repository
from .domain_pack import install_pack
from .graph import TicketGraph
from .leases import LeaseStore
from .migrations import migrate_file, scan_structured
from .model import TicketState
from .mutation import IdempotencyStore, transition_ticket
from .policy_lint import lint_repository_policy
from .query import artifact_contract, load_ownership_rules, ticket_or_error
from .recovery import SnapshotStore, reconstruct_state
from .routing import Criticality, RouteSignals, decide
from .state import TransitionContext

def _graph(args): return TicketGraph.from_directory(Path(args.tickets))
def cmd_validate(args):
    graph=_graph(args); d=graph.diagnostics(); errors=list(validate_ticket_tree(Path(args.tickets))); errors.extend(f"missing blocker: {x}" for x in d.missing_blockers); errors.extend("cycle: "+" -> ".join(c+(c[0],)) for c in d.cycles); errors.extend(f"impossible READY: {x}" for x in d.impossible_ready)
    if not errors: print(f"OK: {len(graph.tickets)} structured tickets"); return 0
    [print(f"ERROR {e}") for e in errors]; return 1
def cmd_frontier(args):
    g=_graph(args); f=g.ready_frontier()
    if f: [print(f"{t.id}\t{t.kind.value}\tL{t.level}\t{t.owner}") for t in f]; return 0
    if g.unfinished(): print("FRONTIER EMPTY"); [print(f"- {r}") for r in g.deadlock_reasons()]; return 2
    print("No unfinished structured tickets"); return 0
def cmd_status(args):
    g=_graph(args); counts={}
    for t in g.tickets.values(): counts[t.status.value]=counts.get(t.status.value,0)+1
    print(json.dumps({"tickets":len(g.tickets),"states":counts,"frontier":[t.id for t in g.ready_frontier()],"deadlock_reasons":g.deadlock_reasons()},indent=2,sort_keys=True)); return 0
def cmd_ticket(args):
    t=ticket_or_error(_graph(args),args.id); print(json.dumps({"id":t.id,"kind":t.kind.value,"status":t.status.value,"level":t.level,"owner":t.owner,"blocked_by":list(t.blocked_by),"qa_required":t.qa_required,"acceptance":list(t.acceptance),"path":str(t.path) if t.path else None},indent=2,sort_keys=True)); return 0
def cmd_blocked(args):
    g=_graph(args); rows=[]
    for t in g.unfinished():
        if t.status is TicketState.BLOCKED or any(d in g.tickets and g.tickets[d].status is not TicketState.DONE for d in t.blocked_by): rows.append({"id":t.id,"status":t.status.value,"blocked_by":list(t.blocked_by)})
    print(json.dumps(rows,indent=2,sort_keys=True)); return 0
def cmd_owner(args):
    rules,default=load_ownership_rules(Path(args.ownership)); from .ownership import resolve; r=resolve(args.path,rules,default); print(json.dumps({"path":args.path,"owner":r.owner,"co_owners":list(r.co_owners),"pattern":r.pattern,"deny":r.deny,"source":r.source},indent=2,sort_keys=True)); return 0
def cmd_artifact(args): print(json.dumps(artifact_contract(Path(args.artifacts),args.id),indent=2,sort_keys=True)); return 0
def cmd_context(args):
    ticket=ticket_or_error(_graph(args),args.id)
    capsule=from_repository(ticket,args.role,root=Path(args.repo_root),budget_policy_path=Path(args.budget_policy) if args.budget_policy else None,retrieval=not args.no_retrieval,max_input_tokens=args.max_input_tokens)
    print(capsule.render(max_chars=args.max_chars if args.max_chars and args.max_chars>0 else None)); return 0
def _transition_context(args): return TransitionContext(owner_resolved=args.owner_resolved,blockers_done=args.blockers_done,acceptance_bounded=args.acceptance_bounded,sources_current=args.sources_current,implementation_evidence=args.implementation_evidence,verification_complete=args.verification_complete,qa_satisfied=args.qa_satisfied,delivery_satisfied=args.delivery_satisfied)
def cmd_transition(args):
    t=ticket_or_error(_graph(args),args.id)
    if t.path is None: raise ValueError(f"ticket {t.id} has no repository path")
    if args.write and not args.operation_id: raise ValueError("--write requires --operation-id")
    print(json.dumps(transition_ticket(t.path,TicketState(args.to),_transition_context(args),operation_id=args.operation_id,store=IdempotencyStore(Path(args.idempotency_store)) if args.write else None,write=args.write),indent=2,sort_keys=True)); return 0
def cmd_lease_reclaim(args):
    g=_graph(args); active={t.id for t in g.tickets.values() if t.status in {TicketState.IN_PROGRESS,TicketState.VERIFYING}}; d=LeaseStore(Path(args.leases)).reclaim_stale(args.resource,active,write=args.write); print(json.dumps({"resource":d.resource,"reclaimable":d.reclaimable,"reason":d.reason,"write":args.write,"lease":asdict(d.lease) if d.lease else None},indent=2,sort_keys=True)); return 0
def cmd_recover(args): print(json.dumps(asdict(reconstruct_state(_graph(args),SnapshotStore(Path(args.snapshot)).load())),indent=2,sort_keys=True)); return 0
def _migration_paths(args):
    roots=[Path(v) for v in args.paths] if args.paths else [Path(args.root)]; result=set()
    for p in roots:
        if p.is_dir(): result.update(scan_structured(p))
        elif p.is_file(): result.add(p)
        else: raise ValueError(f"migration path does not exist: {p}")
    return sorted(result)
def cmd_migrate(args):
    rows=[]
    for p in _migration_paths(args):
        r=migrate_file(p,write=args.write)
        if r.changed: rows.append({"path":str(p),"changed":True,"write":args.write})
    print(json.dumps({"mode":"WRITE" if args.write else "DRY_RUN","changed":rows,"count":len(rows)},indent=2,sort_keys=True)); return 0
def _harness_version(): return int(json.loads(Path(".agents/router.json").read_text(encoding="utf-8"))["version"])
def cmd_domain_pack(args):
    p=install_pack(Path(args.source),Path(args.destination),Path(args.lock),harness_version=args.harness_version or _harness_version(),write=args.write,allow_downgrade=args.allow_downgrade,allow_replace=args.allow_replace); print(json.dumps({"action":p.action,"reason":p.reason,"write":args.write,"lock":asdict(p.lock)},indent=2,sort_keys=True)); return 0
def cmd_change_set(args):
    c=ChangeSet.from_dict(json.loads(Path(args.file).read_text(encoding="utf-8"))); completed=set(args.completed); print(json.dumps({"id":c.id,"state":c.state,"ready":[i.id for i in c.ready_changes(completed)],"release_sequence_valid":c.release_sequence_valid(completed)},indent=2,sort_keys=True)); return 0
def cmd_explain_route(args):
    d=decide(RouteSignals(default_level=args.default_level,uncertainty=args.uncertainty,subsystem_count=args.subsystems,interface_change=args.interface_change,architecture_scope=args.architecture_scope,migration_scope=args.migration_scope,criticality=Criticality[args.criticality],security_trust_boundary=args.security_trust_boundary,destructive=args.destructive,production_policy=args.production_policy)); print(json.dumps({"level":d.level,"qa":d.qa,"reasons":list(d.reasons)},indent=2)); return 0
def cmd_policy_lint(args):
    errors=lint_repository_policy(Path(args.ownership),Path(args.artifacts),Path(args.tickets))
    if errors: [print(f"ERROR {e}") for e in errors]; return 1
    print("OK: repository policy lint passed"); return 0
def build_parser():
    p=argparse.ArgumentParser(prog="yaaw",description="yaaw-SE deterministic workflow utilities"); p.add_argument("--tickets",default="tickets"); p.add_argument("--ownership",default=".agents/ownership.json"); p.add_argument("--artifacts",default=".agents/artifacts.json"); p.add_argument("--idempotency-store",default=".yaaw/runtime/idempotency.json"); p.add_argument("--leases",default=".yaaw/runtime/leases"); p.add_argument("--snapshot",default=".yaaw/runtime/controller-snapshot.json"); s=p.add_subparsers(dest="command",required=True)
    s.add_parser("validate").set_defaults(func=cmd_validate); s.add_parser("frontier").set_defaults(func=cmd_frontier); s.add_parser("status").set_defaults(func=cmd_status)
    q=s.add_parser("ticket"); q.add_argument("id"); q.set_defaults(func=cmd_ticket); s.add_parser("blocked").set_defaults(func=cmd_blocked); q=s.add_parser("owner"); q.add_argument("path"); q.set_defaults(func=cmd_owner); q=s.add_parser("artifact"); q.add_argument("id"); q.set_defaults(func=cmd_artifact); q=s.add_parser("context"); q.add_argument("id"); q.add_argument("--role",required=True); q.add_argument("--repo-root",default="."); q.add_argument("--budget-policy"); q.add_argument("--max-input-tokens",type=int); q.add_argument("--max-chars",type=int,default=0,help="optional legacy hard character cap; token budgeting is primary"); q.add_argument("--no-retrieval",action="store_true",help="diagnostic only: build contract without live repository retrieval"); q.set_defaults(func=cmd_context)
    q=s.add_parser("transition"); q.add_argument("id"); q.add_argument("--to",required=True,choices=[x.value for x in TicketState]); q.add_argument("--write",action="store_true"); q.add_argument("--operation-id"); [q.add_argument("--"+f.replace("_","-"),action="store_true") for f in ("owner_resolved","blockers_done","acceptance_bounded","sources_current","implementation_evidence","verification_complete","qa_satisfied","delivery_satisfied")]; q.set_defaults(func=cmd_transition)
    q=s.add_parser("lease-reclaim"); q.add_argument("resource"); q.add_argument("--write",action="store_true"); q.set_defaults(func=cmd_lease_reclaim); s.add_parser("recover").set_defaults(func=cmd_recover); q=s.add_parser("migrate"); q.add_argument("paths",nargs="*"); q.add_argument("--root",default="."); q.add_argument("--write",action="store_true"); q.set_defaults(func=cmd_migrate)
    q=s.add_parser("domain-pack",help="plan install/update by default; --write applies it"); q.add_argument("source"); q.add_argument("--destination",default=".yaaw/domain-pack.json"); q.add_argument("--lock",default=".yaaw/domain-pack.lock.json"); q.add_argument("--harness-version",type=int); q.add_argument("--write",action="store_true"); q.add_argument("--allow-downgrade",action="store_true"); q.add_argument("--allow-replace",action="store_true"); q.set_defaults(func=cmd_domain_pack)
    q=s.add_parser("change-set"); q.add_argument("file"); q.add_argument("--completed",nargs="*",default=[]); q.set_defaults(func=cmd_change_set)
    q=s.add_parser("explain-route"); q.add_argument("--default-level",type=int,default=0); q.add_argument("--uncertainty",type=int,default=0); q.add_argument("--subsystems",type=int,default=1); q.add_argument("--interface-change",action="store_true"); q.add_argument("--architecture-scope",choices=["NONE","LOCAL","SUBSYSTEM","SYSTEM","PROGRAM"],default="NONE"); q.add_argument("--migration-scope",choices=["NONE","REVERSIBLE","PERSISTENT","IRREVERSIBLE"],default="NONE"); q.add_argument("--criticality",choices=[c.name for c in Criticality],default="LOW"); q.add_argument("--security-trust-boundary",action="store_true"); q.add_argument("--destructive",action="store_true"); q.add_argument("--production-policy",action="store_true"); q.set_defaults(func=cmd_explain_route); s.add_parser("policy-lint").set_defaults(func=cmd_policy_lint); return p
def main(argv=None):
    args=build_parser().parse_args(argv)
    try: return args.func(args)
    except (KeyError,ValueError,PermissionError,RuntimeError) as exc: print(f"ERROR: {exc}"); return 2
