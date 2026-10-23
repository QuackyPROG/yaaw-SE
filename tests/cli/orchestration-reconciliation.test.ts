import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { deriveState, planNext } from "../../.yaaw-core/system/engine/routing.mjs";
const kernel=JSON.parse(await readFile(".yaaw-core/system/kernel.yaml","utf8"));
const doc=(meta:any,path:string)=>({meta,path,digest:"sha256:"+path});
const repository=(head="A",dirty=false)=>({schema:"yaaw.repository-identity/v2",algorithm:"yaaw-worktree-v3",status:"READY",head_commit:head,worktree_digest:"sha256:"+head,dirty,changed_paths:[]});
function fixture(status="PASS"){
 const a:any={
 product:doc({schema:"yaaw.product/v1",status:"ready",revision:1},"product"),
 engineering:doc({schema:"yaaw.engineering/v2",status:"ready",revision:1,readiness:"PASS",scope_status:"OPEN"},"engineering"),
 specs:{"SPEC-001":doc({id:"SPEC-001",schema:"yaaw.spec/v1",status:"ACCEPTED",revision:1,product_revision:1,engineering_revision:1,decision_ids:["ENG-001"],requirement_ids:["REQ-001"]},".yaaw-core/project/specs/SPEC-001.md")},
 tickets:{"TASK-001":doc({id:"TASK-001",schema:"yaaw.ticket/v1",revision:1,status,spec:"SPEC-001",spec_revision:1,product_revision:1,engineering_revision:1,decision_ids:["ENG-001"],requirement_ids:["REQ-001"],affected_paths:["src/feature1/"],dependencies:[],expertise:[]},"ticket1")},
 reviews:{},evidence:{},repository_changes:{},research:{},rules:{}
 };
 return a;
}
function accepted(a:any,r=repository(),result="PASS",round=2){
 a.evidence["V1"]={schema:"yaaw.evidence/v3",id:"V1",ticket:"TASK-001",ticket_revision:1,spec_revision:1,kind:"implementation_verification",result:"PASS",repository:r};
 a.reviews["TASK-001-R"+round+".md"]=doc({schema:"yaaw.review/v2",ticket:"TASK-001",round,result,ticket_revision:1,spec_revision:1,repository:r,evidence:["V1"],affected_paths:[...(a.tickets["TASK-001"].meta.affected_paths??[])],scope_verified:true},"review"+round);
 return a;
}
const next=(a:any,r=repository())=>planNext(kernel,deriveState(a),a,r,null);
const engRevision=(a:any,impact="NONE",ids:string[]=[])=>{
 a.engineering.meta.revision=2;
 a.engineering.meta.revision_changes=[{revision:2,impact,ids,reason:"Audited engineering revision 2"}];
};
function frontier2(a:any){
 a.specs["SPEC-002"]=doc({id:"SPEC-002",schema:"yaaw.spec/v1",status:"ACCEPTED",revision:1,product_revision:1,engineering_revision:2,decision_ids:["ENG-002"],requirement_ids:["REQ-002"]},".yaaw-core/project/specs/SPEC-002.md");
}
describe("scoped lifecycle regression matrix",()=>{

 it("T: a dirty historical foundation PASS is automatically routed to verification after SPEC-002",()=>{
   const original=repository("foundation",true),current=repository("spec2",true);
   const a=accepted(fixture("PASS"),original);engRevision(a);frontier2(a);
   a.tickets["TASK-002"]=doc({id:"TASK-002",schema:"yaaw.ticket/v1",revision:1,status:"READY",
     spec:"SPEC-002",spec_revision:1,product_revision:1,engineering_revision:2,
     decision_ids:["ENG-002"],affected_paths:["src/feature2/"],dependencies:["TASK-001"]},"task2");
   let p:any=next(a,current);
   expect(p.reconciliation?.id).toBe("REVERIFY_UNCERTAIN");
   expect(p.reconciliation?.subject).toBe("TASK-001");
   expect(p.reconciliation?.to).toBe("REVIEW_REQUIRED");
   a.tickets["TASK-001"].meta.status="REVIEW_REQUIRED";
   p=next(a,current);expect(p.workflow).toBe("implementation.verify-ticket");
 });
 it("U: independent matching scoped proof permits dependency despite unrelated dirty planning edits",()=>{
   const old=repository("foundation",true),now=repository("new planning",true);
   const a=accepted(fixture("PASS"),old);engRevision(a);frontier2(a);
   const scope={schema:"yaaw.scope-identity/v1",algorithm:"yaaw-scope-v1",status:"READY",
      paths:["src/feature1/"],digest:"sha256:"+("a".repeat(64)),files:2};
   a.evidence.V1.scope_identity=structuredClone(scope);
   a.reviews["TASK-001-R2.md"].meta.scope_identity=structuredClone(scope);
   a.scope_identities={"TASK-001":structuredClone(scope)};
   a.tickets["TASK-002"]=doc({id:"TASK-002",schema:"yaaw.ticket/v1",revision:1,status:"READY",
      spec:"SPEC-002",spec_revision:1,product_revision:1,engineering_revision:2,
      decision_ids:["ENG-002"],affected_paths:["src/feature2/"],dependencies:["TASK-001"]},"task2");
   const p:any=next(a,now);expect(p.workflow).toBe("implementation.implement-ticket");expect(p.ticket).toBe("TASK-002");
   expect(next(structuredClone(a),now)).toEqual(p);
   a.scope_identities["TASK-001"].digest="sha256:"+("b".repeat(64));
   const changed:any=next(a,now);
   expect(changed.reconciliation?.id).toBe("REVERIFY_REQUIRED");
   a.scope_identities["TASK-001"]=structuredClone(scope);
   a.evidence.V1.scope_identity.digest="sha256:"+("c".repeat(64));
   const mismatched:any=next(a,now);
   expect(mismatched.reconciliation?.id).toBe("REVERIFY_UNCERTAIN");
   expect(mismatched.reconciliation?.to).not.toBe("PASS");
 });
 it("A: historical PASS survives an unrelated engineering revision",()=>{
  const a=accepted(fixture());engRevision(a);
  const p:any=next(a);expect(a.tickets["TASK-001"].meta.status).toBe("PASS");expect(p.reconciliation?.to).not.toBe("REPLAN_REQUIRED");expect(p.workflow).toBe("planning.create-spec");
 });
 it("B: unrelated committed repository changes do not revoke historical PASS",()=>{
  const a=accepted(fixture());a.repository_changes.A={status:"KNOWN",paths:["src/feature2/new.ts"]};
  const p:any=next(a,repository("B"));expect(p.reconciliation?.id).not.toBe("ACCEPTANCE_STALE");expect(p.reconciliation?.to).not.toBe("REPLAN_REQUIRED");
 });
 it("C: material referenced decision change invalidates affected work",()=>{
  const a=accepted(fixture());engRevision(a,"SCOPED",["ENG-001"]);
  const p:any=next(a);expect(p.type).toBe("RECONCILE_REQUIRED");expect(p.reconciliation.id).toBe("CONTRACT_INVALIDATED");expect(p.reconciliation.to).toBe("REPLAN_REQUIRED");
 });
 it("C2: material affected repository path forces independent reverification",()=>{
  const a=accepted(fixture());a.repository_changes.A={status:"KNOWN",paths:["src/feature1/ui.ts"]};
  const p:any=next(a,repository("B"));expect(p.reconciliation.id).toBe("REVERIFY_REQUIRED");expect(p.reconciliation.to).toBe("REVIEW_REQUIRED");
 });
 it("D: the latest independent review REPLAN cannot be restored to PASS",()=>{
  const a=accepted(fixture("REPLAN_REQUIRED"),repository(),"REPLAN");
  const p:any=next(a);expect(p.reconciliation?.to).not.toBe("PASS");expect(p.workflow).toBe("planning.replan");
 });
 it("D2: stale PASS status does not override a newer independent REPLAN verdict",()=>{
  const a=accepted(fixture("PASS"),repository(),"REPLAN");
  const p:any=next(a);expect(p.type).toBe("RECONCILE_REQUIRED");
  expect(p.reconciliation.id).toBe("REVIEW_RESULT_UNAPPLIED");
  expect(p.reconciliation.to).toBe("REPLAN_REQUIRED");
 });
 it("E: stale REPLAN_REQUIRED metadata recovers only when historical acceptance is provable",()=>{
  const a=accepted(fixture("REPLAN_REQUIRED"));
  const p:any=next(a);expect(p.type).toBe("RECONCILE_REQUIRED");expect(p.reconciliation.id).toBe("RECOVER_ACCEPTED_HISTORY");expect(p.reconciliation.to).toBe("PASS");
  expect(p.reconciliation.evidence).toContain("V1");
 });
 it("F: PASS without matching review evidence is not accepted",()=>{
  const a=fixture("PASS");const p:any=next(a);expect(p.reconciliation.id).toBe("ACCEPTANCE_UNPROVEN");expect(p.reconciliation.to).toBe("REVIEW_REQUIRED");
 });
 it("F2: newer failed verification invalidates current readiness without erasing historical PASS",()=>{
   const a=accepted(fixture("PASS"));
   a.evidence["V2"]={schema:"yaaw.evidence/v3",id:"V2",ticket:"TASK-001",ticket_revision:1,spec_revision:1,kind:"implementation_verification",result:"FAIL",repository:repository()};
   const p:any=next(a);expect(p.reconciliation?.id).toBe("LATEST_VERIFICATION_FAILED");
   expect(p.reconciliation?.to).toBe("REVIEW_REQUIRED");
   expect(a.reviews["TASK-001-R2.md"].meta.result).toBe("PASS");
 });
 it("G: unexplained REPLAN_REQUIRED cannot dispatch planner.replan forever",()=>{
  const a=fixture("REPLAN_REQUIRED");const p:any=next(a);expect(p.workflow).not.toBe("planning.replan");expect(p.blocked).toMatch(/INSUFFICIENT_PROVENANCE/);
 });
 it("H: independent fresh derivations recover the same safe boundary",()=>{
  const a=accepted(fixture("REPLAN_REQUIRED"));expect(next(a)).toEqual(next(structuredClone(a)));
 });
 it("I: post-recovery planning frontier reaches spec, ticket, implementation, and review",()=>{
  const a=accepted(fixture("PASS"));engRevision(a);
  let p:any=next(a);expect(p.workflow).toBe("planning.create-spec");
  frontier2(a);p=next(a);expect(p.workflow).toBe("planning.create-tickets");
  a.tickets["TASK-002"]=doc({schema:"yaaw.ticket/v1",id:"TASK-002",revision:1,status:"READY",spec:"SPEC-002",spec_revision:1,product_revision:1,engineering_revision:2,decision_ids:["ENG-002"],requirement_ids:["REQ-002"],affected_paths:["src/feature2/"],dependencies:["TASK-001"],expertise:[]},"ticket2");
  p=next(a);expect(p.workflow).toBe("implementation.implement-ticket");expect(p.ticket).toBe("TASK-002");
  a.tickets["TASK-002"].meta.status="IN_PROGRESS";p=next(a);expect(p.workflow).toBe("implementation.verify-ticket");
  a.tickets["TASK-002"].meta.status="REVIEW_REQUIRED";p=next(a);expect(p.workflow).toBe("implementation.verify-ticket");
 });
 it("J: comsoc product 23/engineering 8/TASK-001-R2 fixture recovers when proved",()=>{
  const a=accepted(fixture("REPLAN_REQUIRED"));a.product.meta.revision=23;
  a.tickets["TASK-001"].meta.product_revision=23;a.specs["SPEC-001"].meta.product_revision=23;
  a.engineering.meta.revision=8;a.engineering.meta.revision_changes=[{revision:8,impact:"NONE",reason:"No referenced decision touched"}];
  a.tickets["TASK-001"].meta.engineering_revision=7;a.specs["SPEC-001"].meta.engineering_revision=7;
  a.engineering.meta.revision_changes.unshift(...[2,3,4,5,6,7].map(revision=>({revision,impact:"NONE",reason:"Historical neutral change recorded"})));
  const p:any=next(a);expect(p.reconciliation.id).toBe("RECOVER_ACCEPTED_HISTORY");
  a.engineering.meta.revision_changes[a.engineering.meta.revision_changes.length-1]={revision:8,impact:"ALL",reason:"Material global engineering change"};
  expect(next(a).workflow).toBe("planning.replan");
 });
 it("K: dependency admitted only if accepted dependency has applicable contract and code",()=>{
  const a=accepted(fixture());engRevision(a);frontier2(a);
  a.tickets["TASK-002"]=doc({id:"TASK-002",schema:"yaaw.ticket/v1",status:"READY",revision:1,spec:"SPEC-002",spec_revision:1,product_revision:1,engineering_revision:2,dependencies:["TASK-001"],decision_ids:["ENG-002"],affected_paths:["src/feature2/"]},"ticket2");
  expect(next(a).ticket).toBe("TASK-002");
  a.engineering.meta.revision_changes=[{revision:2,impact:"SCOPED",ids:["ENG-001"],reason:"Invalidates TASK-001's decision"}];
  expect(next(a).reconciliation.to).toBe("REPLAN_REQUIRED");
 });
 it("completion never relies on unaudited repository drift",()=>{
   const a=accepted(fixture());a.engineering.meta.scope_status="COMPLETE";
   a.repository_changes.A={status:"UNKNOWN",paths:[]};
   const p:any=next(a,repository("B"));
   expect(p.terminal).not.toBe("COMPLETE");expect(p.reconciliation?.id).toBe("REVERIFY_UNCERTAIN");
 });
 it("L: comsoc revision 23/7 to engineering 8 takes impact audit, uncertain-repo reverification, then next spec",()=>{
   const old=repository("foundation",true),current=repository("planning8",true);
   const a=accepted(fixture("REPLAN_REQUIRED"),old);
   a.evidence["EVIDENCE-TASK-001-V3"]={...a.evidence.V1,id:"EVIDENCE-TASK-001-V3",repository:old};
   delete a.evidence.V1;
   const originalReview=a.reviews["TASK-001-R2.md"];
   originalReview.meta.evidence=["EVIDENCE-TASK-001-V3"];
   a.product.meta.revision=23;
   a.specs["SPEC-001"].meta.product_revision=23;a.tickets["TASK-001"].meta.product_revision=23;
   a.engineering.meta.revision=8;
   a.specs["SPEC-001"].meta.engineering_revision=7;a.tickets["TASK-001"].meta.engineering_revision=7;
   const originalReviewCount=Object.keys(a.reviews).length;
   let p:any=next(a,current);
   expect(p.workflow).toBe("planning.audit-revision-impact");
   expect(p.ticket).toBe("TASK-001");
   expect(originalReview.meta.result).toBe("PASS");
   // Missing metadata is the only reason for the audit.
   expect(next(a,current).workflow).toBe("planning.audit-revision-impact");
   // The planner's complete revision-history classification is a durable engineering artifact.
   a.engineering.meta.revision_changes=[{revision:8,impact:"NONE",reason:"Foundation code/spec/ENG decisions unchanged by planning-only revision"}];
   p=next(a,current);
   expect(p.reconciliation?.id).toBe("REVERIFY_UNCERTAIN");
   expect(p.reconciliation?.to).toBe("REVIEW_REQUIRED");
   a.tickets["TASK-001"].meta.status="REVIEW_REQUIRED";
   p=next(a,current);expect(p.workflow).toBe("implementation.verify-ticket");
   a.evidence["EVIDENCE-TASK-001-V4"]={...a.evidence["EVIDENCE-TASK-001-V3"],id:"EVIDENCE-TASK-001-V4",repository:current};
   p=next(a,current);expect(p.workflow).toBe("review.review-ticket");
   a.reviews["TASK-001-R3.md"]=doc({...originalReview.meta,round:3,repository:current,evidence:["EVIDENCE-TASK-001-V4"]},"review3");
   p=next(a,current);expect(p.reconciliation?.id).toBe("REVIEW_RESULT_UNAPPLIED");expect(p.reconciliation?.to).toBe("PASS");
   a.tickets["TASK-001"].meta.status="PASS";
   p=next(a,current);expect(p.workflow).toBe("planning.create-spec");
   expect(a.tickets["TASK-001"].meta.revision).toBe(1);
   expect(a.specs["SPEC-001"].meta.revision).toBe(1);
   expect(originalReviewCount).toBe(1);
 });
 it("M: missing or mismatched immutable acceptance never shortcuts to PASS or review",()=>{
   const a=accepted(fixture("REPLAN_REQUIRED"));
   a.engineering.meta.revision=2;a.engineering.meta.revision_changes=[{revision:2,impact:"NONE",reason:"Verified planning-only refresh"}];
   delete a.evidence.V1;
   const p:any=next(a,repository("new",true));
   expect(p.reconciliation?.to).not.toBe("PASS");
   expect(p.reconciliation?.to).not.toBe("REVIEW_REQUIRED");
   expect(p.workflow).not.toBe("planning.replan");
 });
 it("M2: product revision provenance is audited by PRD, not engineering Planner",()=>{
   const a=accepted(fixture("REPLAN_REQUIRED"));
   a.product.meta.revision=2;
   let p:any=next(a);expect(p.workflow).toBe("prd.audit-revision-impact");expect(p.ticket).toBe("TASK-001");
   a.product.meta.revision_changes=[{revision:2,impact:"NONE",reason:"Audited extra product documentation, no accepted foundation requirement changed"}];
   p=next(a);expect(p.reconciliation?.id).toBe("RECOVER_ACCEPTED_HISTORY");
   a.product.meta.revision_changes=[{revision:2,impact:"SCOPED",ids:["REQ-001"],reason:"Changed foundation acceptance requirement"}];
   p=next(a);expect(p.workflow).toBe("planning.replan");
 });
 it("N: audited material revision never triggers historical PASS recovery",()=>{
   const a=accepted(fixture("REPLAN_REQUIRED"));
   a.engineering.meta.revision=2;
   a.engineering.meta.revision_changes=[{revision:2,impact:"SCOPED",ids:["ENG-001"],reason:"Changed accepted foundation decision"}];
   const p:any=next(a);expect(p.workflow).toBe("planning.replan");expect(p.reconciliation?.to).not.toBe("PASS");
 });
 it("O: prior equality-only invalidated_by marker is investigated, not repeated as material replan",()=>{
   const a=accepted(fixture("REPLAN_REQUIRED"));
   a.engineering.meta.revision=2;
   a.engineering.meta.revision_changes=[{revision:2,impact:"NONE",reason:"Only repository understanding and frontier changed"}];
   a.tickets["TASK-001"].meta.invalidated_by="Engineering revision 2 differs from original 1";
   const p:any=next(a);expect(p.workflow).toBe("planning.audit-revision-impact");expect(p.ticket).toBe("TASK-001");
   expect(p.reconciliation?.to).not.toBe("PASS");
   // An authorized, evidence-backed Planner correction removes only the false marker.
   delete a.tickets["TASK-001"].meta.invalidated_by;
   const q:any=next(a);expect(q.reconciliation?.id).toBe("RECOVER_ACCEPTED_HISTORY");expect(q.reconciliation?.to).toBe("PASS");
 });
 it("P: material change wins even when an equality-only marker is also present",()=>{
   const a=accepted(fixture("REPLAN_REQUIRED"));
   a.engineering.meta.revision=2;
   a.engineering.meta.revision_changes=[{revision:2,impact:"SCOPED",ids:["ENG-001"],reason:"Actual foundation decision changed"}];
   a.tickets["TASK-001"].meta.invalidated_by="Engineering revision 2 differs";
   const p:any=next(a);expect(p.workflow).toBe("planning.replan");
 });
 it("Q: missing immutable linked PASS cannot be converted to acceptance by marker cleanup",()=>{
   const a=fixture("REPLAN_REQUIRED");
   a.tickets["TASK-001"].meta.invalidated_by="revision drift";
   const p:any=next(a);expect(p.workflow).not.toBe("planning.audit-revision-impact");expect(p.reconciliation?.to).not.toBe("PASS");
 });

 it("S: planning.route dispatches only a Planner-owned current planning_next decision",()=>{
   const a=accepted(fixture("PASS"));
   a.engineering.meta.readiness="pending";
   expect(next(a).workflow).toBe("planning.route");
   a.engineering.meta.planning_next={
     workflow:"planning.decision-frontier",product_revision:1,engineering_revision:1,status:"ready",
     current_frontier:null,readiness:"pending",reason:"Prior foundation is PASS; plan the next frontier."
   };
   expect(next(a).workflow).toBe("planning.decision-frontier");
   a.engineering.meta.planning_next.product_revision=9;
   expect(next(a).workflow).toBe("planning.route");
   a.engineering.meta.planning_next.product_revision=1;
   a.engineering.meta.planning_next.workflow="implementation.implement-ticket";
   expect(next(a).workflow).toBe("planning.route");
   a.engineering.meta.planning_next.workflow="planning.decision-frontier";
   a.engineering.meta.planning_next.current_frontier="FRONTIER-OLD";
   expect(next(a).workflow).toBe("planning.route");
   delete a.engineering.meta.planning_next;
   a.engineering.meta.readiness="PASS";
   // New frontier source revision makes SPEC-001 historical, not the active spec.
   a.engineering.meta.revision=2;
   a.engineering.meta.revision_changes=[{revision:2,impact:"NONE",reason:"Next frontier only; accepted foundation decisions unchanged"}];
   expect(next(a).workflow).toBe("planning.create-spec");
 });
 it("R: reviewed work re-verifies before new frontier readiness but new tickets do not",()=>{
   const a=accepted(fixture("REVIEW_REQUIRED"),repository("foundation",true));
   a.engineering.meta.readiness="pending";
   a.engineering.meta.revision=2;
   a.engineering.meta.revision_changes=[{revision:2,impact:"NONE",reason:"Only current frontier readiness reset"}];
   const p:any=next(a,repository("after",true));
   expect(p.workflow).toBe("implementation.verify-ticket");expect(p.ticket).toBe("TASK-001");
   a.tickets["TASK-001"].meta.status="PASS";
   expect(next(a,repository("after",true)).reconciliation?.id).toBe("REVERIFY_UNCERTAIN");
   const b=fixture("REVIEW_REQUIRED");b.engineering.meta.readiness="pending";
   expect(next(b).workflow).toBe("planning.route");
 });
 it("legacy unscoped history is UNKNOWN and not silently accepted or falsely replanned",()=>{
  const a=accepted(fixture("REPLAN_REQUIRED"));engRevision(a);delete a.engineering.meta.revision_changes;
  const p:any=next(a);expect(p.reconciliation?.to).not.toBe("PASS");expect(p.reconciliation?.to).not.toBe("REPLAN_REQUIRED");
 });
});
