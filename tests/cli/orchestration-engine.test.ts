import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { applyReconciliation, planNext } from "../../.yaaw-core/system/tools/orchestration-engine.mjs";

const load = async (p:string)=>JSON.parse(await readFile(resolve(p),"utf8"));
const repo=(digest="sha256:repo")=>({schema:"yaaw.repository-identity/v2",algorithm:"yaaw-worktree-v2",status:"READY",workspace_scope:".",git_root_relation:"same",head_commit:"abc",dirty:true,worktree_digest:digest,components:{status_sha256:"x",unstaged_diff_sha256:"x",staged_diff_sha256:"x",untracked_manifest_sha256:"x"},changed_paths:[],error:null});

async function base(stateTicket:any="READY"){
  const transitions=await load(".yaaw-core/system/registries/transitions.json");
  const routingPolicy=await load(".yaaw-core/system/registries/routing-policy.json");
  const reconciliationPolicy=await load(".yaaw-core/system/registries/reconciliation-policy.json");
  const state={schema:"yaaw.project-state/v2",phase:"implementation",product:{artifact:".yaaw-core/project/product.md",status:"ready",revision:1},planning:{artifact:".yaaw-core/project/engineering.md",status:"ready",revision:1,current_frontier:"FRONTIER-001",readiness:"PASS",active_spec:".yaaw-core/project/specs/SPEC-001.md",scope_status:"UNKNOWN"},active_ticket:stateTicket?"TASK-001":null,tickets:stateTicket?{"TASK-001":stateTicket}:{},transition_sequence:1,last_transition:null,blocker:null,last_observed_commit:"abc",last_workflow:null};
  const artifacts:any={product:{path:".yaaw-core/project/product.md",meta:{revision:1,status:"ready"}},engineering:{path:".yaaw-core/project/engineering.md",meta:{schema:"yaaw.engineering/v2",revision:1,status:"ready",product_revision:1,current_frontier:"FRONTIER-001",readiness:"PASS",scope_status:"UNKNOWN"}},specs:{"SPEC-001":{path:".yaaw-core/project/specs/SPEC-001.md",meta:{id:"SPEC-001",revision:1,status:"ACCEPTED",product_revision:1,engineering_revision:1,frontier_id:"FRONTIER-001"}}},tickets:{"TASK-001":{path:".yaaw-core/project/tickets/TASK-001.md",meta:{id:"TASK-001",revision:1,spec:"SPEC-001",spec_revision:1,product_revision:1,engineering_revision:1,status:"READY",dependencies:[]}}},reviews:[],evidence:[],research:[],rules:[]};
  return {framework:{integrity_status:"HEALTHY"},repository:repo(),state,artifacts,evidence:artifacts.evidence,reviews:artifacts.reviews,intent:null,transitions,routingPolicy,reconciliationPolicy};
}
const start=(id="S1")=>({path:`.yaaw-core/project/evidence/EVIDENCE-TASK-001-${id}.json`,value:{schema:"yaaw.evidence/v3",id:`EVIDENCE-TASK-001-${id}`,ticket:"TASK-001",ticket_revision:1,spec_revision:1,kind:"implementation_start",result:"STARTED",repository:repo("sha256:before"),workflow:"implementation.implement-ticket",commands:[],checks:[]}});
const verify=(result="PASS",id="V1")=>({path:`.yaaw-core/project/evidence/EVIDENCE-TASK-001-${id}.json`,value:{schema:"yaaw.evidence/v3",id:`EVIDENCE-TASK-001-${id}`,ticket:"TASK-001",ticket_revision:1,spec_revision:1,kind:"implementation_verification",result,repository:repo(),workflow:"implementation.verify-ticket",commands:[],checks:[]}});
const review=(result="PASS",evidence=["EVIDENCE-TASK-001-V1"])=>({path:".yaaw-core/project/reviews/TASK-001-R1.md",value:{schema:"yaaw.review/v2",ticket:"TASK-001",round:1,result,ticket_revision:1,spec_revision:1,repository:repo(),evidence}});

describe("production orchestration engine",()=>{
  it("adopts one durable fact per pass without READY -> REVIEW_REQUIRED jumps",async()=>{
    const x:any=await base("READY"); x.evidence.push(start(),verify()); x.artifacts.evidence=x.evidence;
    const first:any=planNext(x); expect(first.reconciliation.id).toBe("IMPLEMENTATION_STARTED"); expect(first.reconciliation.to).toBe("IN_PROGRESS");
    x.state=applyReconciliation(x.state,first.reconciliation,x.repository);
    const second:any=planNext(x); expect(second.reconciliation.id).toBe("IMPLEMENTATION_VERIFIED"); expect(second.reconciliation.to).toBe("REVIEW_REQUIRED");
    const transitions=await load(".yaaw-core/system/registries/transitions.json");
    expect(transitions.legal.some((t:any)=>t.from==="READY"&&t.to==="REVIEW_REQUIRED")).toBe(false);
  });

  it("does not treat failed verification existence as review admission",async()=>{
    const x:any=await base("IN_PROGRESS"); x.evidence.push(start(),verify("FAIL")); x.artifacts.evidence=x.evidence;
    const p:any=planNext(x); expect(p.kind).toBe("DISPATCH_READY"); expect(p.workflow).toBe("implementation.verify-ticket");
  });

  it("adopts a valid review result instead of dispatching Reviewer again",async()=>{
    const x:any=await base("REVIEW_REQUIRED"); x.evidence.push(verify()); x.reviews.push(review()); x.artifacts.evidence=x.evidence; x.artifacts.reviews=x.reviews;
    const p:any=planNext(x); expect(p.reconciliation.id).toBe("REVIEW_RESULT_UNAPPLIED"); expect(p.reconciliation.to).toBe("PASS");
  });

  it("recovers missing review verification instead of terminally blocking",async()=>{
    const x:any=await base("REVIEW_REQUIRED"); x.reviews.push(review("PASS",["EVIDENCE-TASK-001-OLD"])); x.artifacts.reviews=x.reviews;
    const p:any=planNext(x); expect(p.kind).toBe("DISPATCH_READY"); expect(p.workflow).toBe("implementation.verify-ticket"); expect(p.ticket).toBe("TASK-001");
  });

  it("refreshes review when current PASS verification is not referenced",async()=>{
    const x:any=await base("REVIEW_REQUIRED"); x.evidence.push(verify()); x.reviews.push(review("PASS",["OTHER"])); x.artifacts.evidence=x.evidence; x.artifacts.reviews=x.reviews;
    const p:any=planNext(x); expect(p.kind).toBe("DISPATCH_READY"); expect(p.workflow).toBe("review.review-ticket"); expect(p.ticket).toBe("TASK-001");
  });

  it("repairs stale acceptance evidence before advancing to the next ready ticket",async()=>{
    const x:any=await base("PASS");
    x.state.tickets["TASK-003"]="READY";
    x.artifacts.tickets["TASK-003"]={path:".yaaw-core/project/tickets/TASK-003.md",meta:{id:"TASK-003",revision:1,spec:"SPEC-001",spec_revision:1,product_revision:1,engineering_revision:1,status:"READY",dependencies:["TASK-001"]}};
    const stale=verify("PASS","V1"); stale.value.repository=repo("sha256:stale");
    x.evidence.push(stale);
    x.reviews.push(review("PASS",["EVIDENCE-TASK-001-V1"]));
    x.artifacts.evidence=x.evidence; x.artifacts.reviews=x.reviews;

    const invalidate:any=planNext(x);
    expect(invalidate.reconciliation.id).toBe("ACCEPTANCE_STALE");
    expect(invalidate.reconciliation.to).toBe("REVIEW_REQUIRED");
    x.state=applyReconciliation(x.state,invalidate.reconciliation,x.repository);

    const recover:any=planNext(x);
    expect(recover.kind).toBe("DISPATCH_READY");
    expect(recover.workflow).toBe("implementation.verify-ticket");
    expect(recover.ticket).toBe("TASK-001");

    x.evidence.push(verify("PASS","V2")); x.artifacts.evidence=x.evidence;
    const rereview:any=planNext(x);
    expect(rereview.workflow).toBe("review.review-ticket");
    expect(rereview.ticket).toBe("TASK-001");

    x.reviews.push({path:".yaaw-core/project/reviews/TASK-001-R2.md",value:{schema:"yaaw.review/v2",ticket:"TASK-001",round:2,result:"PASS",ticket_revision:1,spec_revision:1,repository:repo(),evidence:["EVIDENCE-TASK-001-V2"]}});
    x.artifacts.reviews=x.reviews;
    const accept:any=planNext(x);
    expect(accept.reconciliation.id).toBe("REVIEW_RESULT_UNAPPLIED");
    expect(accept.reconciliation.to).toBe("PASS");
    x.state=applyReconciliation(x.state,accept.reconciliation,x.repository);

    const next:any=planNext(x);
    expect(next.kind).toBe("DISPATCH_READY");
    expect(next.workflow).toBe("implementation.implement-ticket");
    expect(next.ticket).toBe("TASK-003");
  });

  it("requires a new repair verification not already consumed by the REPAIR review",async()=>{
    const x:any=await base("REPAIR_REQUIRED"); x.evidence.push(verify("PASS","V1")); x.reviews.push(review("REPAIR",["EVIDENCE-TASK-001-V1"])); x.artifacts.evidence=x.evidence; x.artifacts.reviews=x.reviews;
    expect((planNext(x) as any).workflow).toBe("implementation.repair-ticket");
    x.evidence.push(verify("PASS","V2")); x.artifacts.evidence=x.evidence;
    const p:any=planNext(x); expect(p.reconciliation.to).toBe("REVIEW_REQUIRED");
  });

  it("blocks ambiguous multiple current accepted specs instead of guessing newest",async()=>{
    const x:any=await base(null); x.state.planning.active_spec=null;
    x.artifacts.specs["SPEC-002"]={path:".yaaw-core/project/specs/SPEC-002.md",meta:{id:"SPEC-002",revision:1,status:"ACCEPTED",product_revision:1,engineering_revision:1,frontier_id:"FRONTIER-001"}};
    const p:any=planNext(x); expect(p.kind).toBe("BLOCKED"); expect(p.reason).toBe("MULTIPLE_CURRENT_ACCEPTED_SPECS");
  });
});
