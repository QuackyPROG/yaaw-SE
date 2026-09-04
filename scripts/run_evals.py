#!/usr/bin/env python3
"""Run deterministic adversarial conformance scenarios against yaaw-SE invariants."""
from __future__ import annotations

import argparse, json, tempfile
from pathlib import Path

from yaaw.authority import AuthorityPolicy
from yaaw.evidence import EvidenceRecord, require_passing_evidence
from yaaw.graph import TicketGraph
from yaaw.model import Ticket, TicketKind, TicketState
from yaaw.recovery import RuntimeSnapshot, SnapshotStore, reconstruct_state
from yaaw.retry import FailureClass, may_retry
from yaaw.routing import Criticality, RouteSignals, decide
from yaaw.security import inferred_minimum_risk
from yaaw.state import TransitionContext, validate_transition
from yaaw.trust import TrustClass, may_supply_instructions
from verify_task_scope import verify

ROOT=Path(__file__).resolve().parents[1]

def _ticket(data): return Ticket(id=data["id"],kind=TicketKind(data.get("kind","DELIVERY")),status=TicketState(data.get("status","DRAFT")),level=int(data.get("level",1)),owner=data.get("owner","owner"),blocked_by=tuple(data.get("blocked_by",[])),qa_required=bool(data.get("qa_required",False)),acceptance=tuple(data.get("acceptance",["observable outcome"])))

def evaluate(scenario):
    kind=scenario["type"]; inp=scenario.get("input",{}); expected=scenario.get("expect")
    if kind=="route":
        result=decide(RouteSignals(default_level=int(inp.get("default_level",0)),uncertainty=int(inp.get("uncertainty",0)),subsystem_count=int(inp.get("subsystem_count",1)),interface_change=bool(inp.get("interface_change",False)),architecture_scope=inp.get("architecture_scope","NONE"),migration_scope=inp.get("migration_scope","NONE"),criticality=Criticality[inp.get("criticality","LOW")],security_trust_boundary=bool(inp.get("security_trust_boundary",False)),destructive=bool(inp.get("destructive",False)),production_policy=bool(inp.get("production_policy",False)))); actual={"level":result.level,"qa":result.qa}
    elif kind=="command_risk": actual=inferred_minimum_risk(inp["command"]).name
    elif kind=="trust": actual={"may_supply_instructions":may_supply_instructions(TrustClass(inp["source"]))}
    elif kind=="retry": actual=may_retry(FailureClass(inp["failure"]),int(inp.get("attempts",0)))
    elif kind=="authority": actual=AuthorityPolicy.load(ROOT/".agents/authority.json").can_mutate(inp["role"],inp["artifact"],inp.get("field"))
    elif kind=="semantic_authority": actual=AuthorityPolicy.load(ROOT/".agents/authority.json").semantic_authority(inp["artifact"],inp.get("field"))
    elif kind=="scope": actual=verify(inp.get("paths",[]),inp.get("allowed",[]),inp.get("forbidden",[]))
    elif kind=="graph":
        graph=TicketGraph(_ticket(t) for t in inp.get("tickets",[])); d=graph.diagnostics(); actual={"missing_blockers":len(d.missing_blockers),"cycles":len(d.cycles),"frontier":[t.id for t in graph.ready_frontier()]}
    elif kind=="long_horizon":
        count=int(inp.get("count",100)); tickets=[Ticket("T000",TicketKind.DELIVERY,TicketState.DONE,3,"core"),Ticket("T001",TicketKind.DELIVERY,TicketState.READY,3,"core",("T000",))]; tickets.extend(Ticket(f"T{i:03d}",TicketKind.DELIVERY,TicketState.DRAFT,3,"core",(f"T{i-1:03d}",)) for i in range(2,count)); graph=TicketGraph(tickets); d=graph.diagnostics(); actual={"tickets":len(graph.tickets),"cycles":len(d.cycles),"frontier":[t.id for t in graph.ready_frontier()]}
    elif kind=="transition":
        ticket=_ticket(inp["ticket"]); ctx=TransitionContext(**inp.get("context",{}))
        try: validate_transition(ticket,TicketState(inp["target"]),ctx); actual={"allowed":True}
        except ValueError as exc: actual={"allowed":False,"contains":str(exc)}
        if isinstance(expected,dict) and "contains" in expected and not expected.get("allowed",False): return actual.get("allowed") is False and expected["contains"] in actual.get("contains",""),actual,expected
    elif kind=="evidence":
        recorded=inp.get("recorded_fingerprints",{"spec":"a"}); current=inp.get("current_fingerprints",recorded); record=EvidenceRecord.create(inp.get("verification_id","unit"),"test-command",int(inp.get("exit_code",0)),"CI",inp.get("recorded_commit","abc"),recorded); actual=require_passing_evidence([record],[inp.get("verification_id","unit")],inp.get("current_commit",inp.get("recorded_commit","abc")),current)
    elif kind=="failure_signature":
        with tempfile.TemporaryDirectory() as td:
            store=SnapshotStore(Path(td)/"snapshot.json"); store.save(RuntimeSnapshot("DEL-1","implementer","wt","abc",1,{})); outcome="CONTINUE"; count=0
            for _ in range(int(inp.get("attempts",3))):
                try: count=store.register_failure(inp.get("signature","same-failure"),int(inp.get("limit",2)))
                except RuntimeError: outcome="STOP_AND_REPLAN"; count=store.load().failure_signatures[inp.get("signature","same-failure")]; break
            actual={"count":count,"outcome":outcome}
    elif kind=="recovery":
        state=reconstruct_state(TicketGraph(_ticket(t) for t in inp.get("tickets",[])),None); actual={"active_work":state.active_work,"source":state.source}
    else: raise ValueError(f"unknown eval scenario type {kind!r}")
    return actual==expected,actual,expected

def run(path):
    data=json.loads(path.read_text(encoding="utf-8")); results=[]; passed=0
    for scenario in data.get("scenarios",[]):
        try: ok,actual,expected=evaluate(scenario); error=None
        except Exception as exc: ok,actual,expected,error=False,None,scenario.get("expect"),f"{type(exc).__name__}: {exc}"
        passed+=int(ok); results.append({"id":scenario.get("id"),"type":scenario.get("type"),"passed":ok,"actual":actual,"expected":expected,"error":error})
    return {"schema":"yaaw.eval-report/v1","scenario_file":str(path),"total":len(results),"passed":passed,"failed":len(results)-passed,"results":results}

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--scenarios",default="evals/scenarios.json"); parser.add_argument("--report"); args=parser.parse_args(); report=run(Path(args.scenarios))
    for result in report["results"]:
        print(f"{'PASS' if result['passed'] else 'FAIL'}: {result['id']}")
        if not result["passed"]: print(f"  expected={result['expected']!r}\n  actual={result['actual']!r}" + (f"\n  error={result['error']}" if result["error"] else ""))
    print(f"{report['passed']}/{report['total']} scenarios passed")
    if args.report: Path(args.report).write_text(json.dumps(report,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    return 0 if report["failed"]==0 else 1

if __name__=="__main__": raise SystemExit(main())
