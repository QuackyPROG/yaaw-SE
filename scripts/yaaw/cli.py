"""Operator-facing CLI for deterministic yaaw-SE inspection and explicit mutation."""
from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from pathlib import Path

from .artifacts import validate_ticket_tree
from .context import from_ticket
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


def _graph(args: argparse.Namespace) -> TicketGraph:
    return TicketGraph.from_directory(Path(args.tickets))


def cmd_validate(args):
    graph = _graph(args); d = graph.diagnostics(); errors = list(validate_ticket_tree(Path(args.tickets)))
    errors.extend(f"missing blocker: {item}" for item in d.missing_blockers); errors.extend("cycle: " + " -> ".join(cycle + (cycle[0],)) for cycle in d.cycles); errors.extend(f"impossible READY: {item}" for item in d.impossible_ready)
    if not errors: print(f"OK: {len(graph.tickets)} structured tickets"); return 0
    for item in errors: print(f"ERROR {item}")
    return 1


def cmd_frontier(args):
    graph = _graph(args); frontier = graph.ready_frontier()
    if frontier:
        for ticket in frontier: print(f"{ticket.id}\t{ticket.kind.value}\tL{ticket.level}\t{ticket.owner}")
        return 0
    if graph.unfinished():
        print("FRONTIER EMPTY")
        for reason in graph.deadlock_reasons(): print(f"- {reason}")
        return 2
    print("No unfinished structured tickets"); return 0


def cmd_status(args):
    graph = _graph(args); counts = {}
    for ticket in graph.tickets.values(): counts[ticket.status.value] = counts.get(ticket.status.value, 0) + 1
    print(json.dumps({"tickets":len(graph.tickets),"states":counts,"frontier":[t.id for t in graph.ready_frontier()],"deadlock_reasons":graph.deadlock_reasons()}, indent=2, sort_keys=True)); return 0


def cmd_ticket(args):
    ticket = ticket_or_error(_graph(args), args.id); print(json.dumps({"id":ticket.id,"kind":ticket.kind.value,"status":ticket.status.value,"level":ticket.level,"owner":ticket.owner,"blocked_by":list(ticket.blocked_by),"qa_required":ticket.qa_required,"acceptance":list(ticket.acceptance),"path":str(ticket.path) if ticket.path else None}, indent=2, sort_keys=True)); return 0


def cmd_blocked(args):
    graph = _graph(args); rows=[]
    for ticket in graph.unfinished():
        if ticket.status is TicketState.BLOCKED or any(dep in graph.tickets and graph.tickets[dep].status is not TicketState.DONE for dep in ticket.blocked_by): rows.append({"id":ticket.id,"status":ticket.status.value,"blocked_by":list(ticket.blocked_by)})
    print(json.dumps(rows, indent=2, sort_keys=True)); return 0


def cmd_owner(args):
    rules, default_owner = load_ownership_rules(Path(args.ownership)); from .ownership import resolve; rule=resolve(args.path,rules,default_owner); print(json.dumps({"path":args.path,"owner":rule.owner,"co_owners":list(rule.co_owners),"pattern":rule.pattern,"deny":rule.deny,"source":rule.source}, indent=2, sort_keys=True)); return 0


def cmd_artifact(args): print(json.dumps(artifact_contract(Path(args.artifacts), args.id), indent=2, sort_keys=True)); return 0

def cmd_context(args): print(from_ticket(ticket_or_error(_graph(args), args.id), args.role).render(max_chars=args.max_chars)); return 0


def _transition_context(args):
    return TransitionContext(owner_resolved=args.owner_resolved, blockers_done=args.blockers_done, acceptance_bounded=args.acceptance_bounded, sources_current=args.sources_current, implementation_evidence=args.implementation_evidence, verification_complete=args.verification_complete, qa_satisfied=args.qa_satisfied, delivery_satisfied=args.delivery_satisfied)


def cmd_transition(args):
    ticket=ticket_or_error(_graph(args), args.id)
    if ticket.path is None: raise ValueError(f"ticket {ticket.id} has no repository path")
    if args.write and not args.operation_id: raise ValueError("--write requires --operation-id")
    result=transition_ticket(ticket.path, TicketState(args.to), _transition_context(args), operation_id=args.operation_id, store=IdempotencyStore(Path(args.idempotency_store)) if args.write else None, write=args.write)
    print(json.dumps(result, indent=2, sort_keys=True)); return 0


def cmd_lease_reclaim(args):
    graph=_graph(args); active={t.id for t in graph.tickets.values() if t.status in {TicketState.IN_PROGRESS,TicketState.VERIFYING}}; decision=LeaseStore(Path(args.leases)).reclaim_stale(args.resource, active, write=args.write); print(json.dumps({"resource":decision.resource,"reclaimable":decision.reclaimable,"reason":decision.reason,"write":args.write,"lease":asdict(decision.lease) if decision.lease else None}, indent=2, sort_keys=True)); return 0


def cmd_recover(args): print(json.dumps(asdict(reconstruct_state(_graph(args), SnapshotStore(Path(args.snapshot)).load())), indent=2, sort_keys=True)); return 0


def _migration_paths(args):
    roots=[Path(value) for value in args.paths] if args.paths else [Path(args.root)]; result=set()
    for path in roots:
        if path.is_dir(): result.update(scan_structured(path))
        elif path.is_file(): result.add(path)
        else: raise ValueError(f"migration path does not exist: {path}")
    return sorted(result)


def cmd_migrate(args):
    rows=[]
    for path in _migration_paths(args):
        result=migrate_file(path, write=args.write)
        if result.changed: rows.append({"path":str(path),"changed":True,"write":args.write})
    print(json.dumps({"mode":"WRITE" if args.write else "DRY_RUN","changed":rows,"count":len(rows)}, indent=2, sort_keys=True)); return 0


def cmd_explain_route(args):
    decision=decide(RouteSignals(default_level=args.default_level, uncertainty=args.uncertainty, subsystem_count=args.subsystems, interface_change=args.interface_change, architecture_scope=args.architecture_scope, migration_scope=args.migration_scope, criticality=Criticality[args.criticality], security_trust_boundary=args.security_trust_boundary, destructive=args.destructive, production_policy=args.production_policy)); print(json.dumps({"level":decision.level,"qa":decision.qa,"reasons":list(decision.reasons)}, indent=2)); return 0


def cmd_policy_lint(args):
    errors=lint_repository_policy(Path(args.ownership),Path(args.artifacts),Path(args.tickets))
    if errors:
        for error in errors: print(f"ERROR {error}")
        return 1
    print("OK: repository policy lint passed"); return 0


def build_parser():
    parser=argparse.ArgumentParser(prog="yaaw",description="yaaw-SE deterministic workflow utilities"); parser.add_argument("--tickets",default="tickets"); parser.add_argument("--ownership",default=".agents/ownership.json"); parser.add_argument("--artifacts",default=".agents/artifacts.json"); parser.add_argument("--idempotency-store",default=".yaaw/runtime/idempotency.json"); parser.add_argument("--leases",default=".yaaw/runtime/leases"); parser.add_argument("--snapshot",default=".yaaw/runtime/controller-snapshot.json"); sub=parser.add_subparsers(dest="command",required=True)
    sub.add_parser("validate").set_defaults(func=cmd_validate); sub.add_parser("frontier").set_defaults(func=cmd_frontier); sub.add_parser("status").set_defaults(func=cmd_status)
    p=sub.add_parser("ticket"); p.add_argument("id"); p.set_defaults(func=cmd_ticket); sub.add_parser("blocked").set_defaults(func=cmd_blocked)
    p=sub.add_parser("owner"); p.add_argument("path"); p.set_defaults(func=cmd_owner); p=sub.add_parser("artifact"); p.add_argument("id"); p.set_defaults(func=cmd_artifact)
    p=sub.add_parser("context"); p.add_argument("id"); p.add_argument("--role",required=True); p.add_argument("--max-chars",type=int,default=16000); p.set_defaults(func=cmd_context)
    p=sub.add_parser("transition",help="dry-run by default; --write applies an atomic/idempotent transition"); p.add_argument("id"); p.add_argument("--to",required=True,choices=[s.value for s in TicketState]); p.add_argument("--write",action="store_true"); p.add_argument("--operation-id")
    for flag in ("owner_resolved","blockers_done","acceptance_bounded","sources_current","implementation_evidence","verification_complete","qa_satisfied","delivery_satisfied"): p.add_argument("--"+flag.replace("_","-"),action="store_true")
    p.set_defaults(func=cmd_transition)
    p=sub.add_parser("lease-reclaim",help="inspect by default; --write reclaims only expired/orphaned lease"); p.add_argument("resource"); p.add_argument("--write",action="store_true"); p.set_defaults(func=cmd_lease_reclaim)
    sub.add_parser("recover").set_defaults(func=cmd_recover); p=sub.add_parser("migrate",help="dry-run by default; --write applies declared migrations"); p.add_argument("paths",nargs="*"); p.add_argument("--root",default="."); p.add_argument("--write",action="store_true"); p.set_defaults(func=cmd_migrate)
    p=sub.add_parser("explain-route"); p.add_argument("--default-level",type=int,default=0); p.add_argument("--uncertainty",type=int,default=0); p.add_argument("--subsystems",type=int,default=1); p.add_argument("--interface-change",action="store_true"); p.add_argument("--architecture-scope",choices=["NONE","LOCAL","SUBSYSTEM","SYSTEM","PROGRAM"],default="NONE"); p.add_argument("--migration-scope",choices=["NONE","REVERSIBLE","PERSISTENT","IRREVERSIBLE"],default="NONE"); p.add_argument("--criticality",choices=[c.name for c in Criticality],default="LOW"); p.add_argument("--security-trust-boundary",action="store_true"); p.add_argument("--destructive",action="store_true"); p.add_argument("--production-policy",action="store_true"); p.set_defaults(func=cmd_explain_route)
    sub.add_parser("policy-lint").set_defaults(func=cmd_policy_lint); return parser


def main(argv=None):
    args=build_parser().parse_args(argv)
    try: return args.func(args)
    except (KeyError,ValueError,PermissionError,RuntimeError) as exc: print(f"ERROR: {exc}"); return 2
