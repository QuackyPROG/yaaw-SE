#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { planNext } from "../.yaaw-core/system/tools/orchestration-engine.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const load=async p=>JSON.parse(await readFile(join(root,p),"utf8"));
const fixtures=await load("tests/fixtures/lifecycle_cases.json");
const transitions=await load(".yaaw-core/system/registries/transitions.json");
const routingPolicy=await load(".yaaw-core/system/registries/routing-policy.json");
const reconciliationPolicy=await load(".yaaw-core/system/registries/reconciliation-policy.json");

const repo=(digest="sha256:repo",status="READY")=>({schema:"yaaw.repository-identity/v2",algorithm:status==="READY"?"yaaw-worktree-v2":null,status,workspace_scope:".",git_root_relation:status==="READY"?"same":"none",head_commit:status==="READY"?"abc":null,dirty:status==="READY",worktree_digest:status==="READY"?digest:null,components:status==="READY"?{status_sha256:"x",unstaged_diff_sha256:"x",staged_diff_sha256:"x",untracked_manifest_sha256:"x"}:null,changed_paths:[],error:null});
function input(s={}){
  const ticketArtifactState=s.ticket_artifact_state??s.ticket_state;
  const stateTicket=s.state_ticket===false?null:s.ticket_state;
  const scope=s.scope_status??"UNKNOWN";
  const state={schema:"yaaw.project-state/v2",phase:s.phase??"implementation",product:{artifact:".yaaw-core/project/product.md",status:s.product_status??"ready",revision:1},planning:{artifact:".yaaw-core/project/engineering.md",status:s.planning_status??"ready",revision:1,current_frontier:"FRONTIER-001",readiness:s.readiness??"PASS",active_spec:s.active_spec===false?null:".yaaw-core/project/specs/SPEC-001.md",scope_status:scope},active_ticket:stateTicket?"TASK-001":null,tickets:stateTicket?{"TASK-001":stateTicket}:{},transition_sequence:1,last_transition:null,blocker:null,last_observed_commit:"abc",last_workflow:null};
  const artifacts={product:{path:".yaaw-core/project/product.md",meta:{schema:"yaaw.product/v1",revision:1,status:s.product_status??"ready"}},engineering:{path:".yaaw-core/project/engineering.md",meta:{schema:"yaaw.engineering/v2",revision:1,status:s.planning_status??"ready",product_revision:1,current_frontier:"FRONTIER-001",readiness:s.readiness??"PASS",scope_status:scope}},specs:{},tickets:{},reviews:[],evidence:[],research:[],rules:[],activeSpecId:s.active_spec===false?null:"SPEC-001"};
  if(s.spec!==false)artifacts.specs["SPEC-001"]={path:".yaaw-core/project/specs/SPEC-001.md",meta:{schema:"yaaw.spec/v1",id:"SPEC-001",revision:1,status:"ACCEPTED",product_revision:1,engineering_revision:1,frontier_id:"FRONTIER-001",decision_ids:[]}};
  if(ticketArtifactState)artifacts.tickets["TASK-001"]={path:".yaaw-core/project/tickets/TASK-001.md",meta:{schema:"yaaw.ticket/v1",id:"TASK-001",revision:1,spec:"SPEC-001",spec_revision:1,product_revision:s.source_stale?0:1,engineering_revision:1,status:ticketArtifactState,dependencies:[],decision_ids:[],expertise:[]}};
  const repository=repo("sha256:repo",s.repository_status??"READY");
  if(s.start)artifacts.evidence.push({path:".yaaw-core/project/evidence/EVIDENCE-TASK-001-S1.json",value:{schema:"yaaw.evidence/v3",id:"EVIDENCE-TASK-001-S1",ticket:"TASK-001",ticket_revision:1,spec_revision:1,kind:"implementation_start",result:"STARTED",repository:repo("sha256:before"),workflow:"implementation.implement-ticket",commands:[],checks:[]}});
  if(s.verify)artifacts.evidence.push({path:".yaaw-core/project/evidence/EVIDENCE-TASK-001-V1.json",value:{schema:"yaaw.evidence/v3",id:"EVIDENCE-TASK-001-V1",ticket:"TASK-001",ticket_revision:1,spec_revision:1,kind:"implementation_verification",result:s.verify,repository:repo("sha256:repo"),workflow:"implementation.verify-ticket",commands:[],checks:[]}});
  if(s.review)artifacts.reviews.push({path:".yaaw-core/project/reviews/TASK-001-R1.md",value:{schema:"yaaw.review/v2",ticket:"TASK-001",round:1,result:s.review,ticket_revision:1,spec_revision:1,repository:repo("sha256:repo"),evidence:["EVIDENCE-TASK-001-V1"]}});
  const intent=s.intent?{schema:"yaaw.intent/v2",source_skill:s.intent==="IMPLEMENT"?"yaaw-implement":"yaaw-review",desired_outcome:s.intent,requested_workflow:s.intent==="IMPLEMENT"?"implementation.implement-ticket":"review.review-ticket",target_artifact:null,completion_kind:s.intent==="IMPLEMENT"?"TICKET_REVIEW_REQUIRED":"TICKET_REVIEW_APPLIED",created_from_transition_sequence:1}:null;
  return {framework:{integrity_status:s.framework_status??"HEALTHY"},repository,state,artifacts,evidence:artifacts.evidence,reviews:artifacts.reviews,intent,transitions,routingPolicy,reconciliationPolicy};
}
const failures=[];
for(const c of fixtures.cases){
  const got=planNext(input(c.scenario));
  const e=c.expected;
  if(got.kind!==e.kind)failures.push(`${c.id}: kind expected ${e.kind} got ${got.kind}`);
  if("workflow" in e&&got.workflow!==e.workflow)failures.push(`${c.id}: workflow expected ${e.workflow} got ${got.workflow}`);
  if(e.reconciliation&&got.reconciliation?.id!==e.reconciliation)failures.push(`${c.id}: reconciliation expected ${e.reconciliation} got ${got.reconciliation?.id}`);
  if("to" in e&&got.reconciliation?.to!==e.to)failures.push(`${c.id}: reconciliation.to expected ${e.to} got ${got.reconciliation?.to}`);
}
if(failures.length){console.error("YAAW lifecycle production-engine fixtures failed:");for(const x of failures)console.error("- "+x);process.exit(1)}
console.log(`YAAW production orchestration engine passed ${fixtures.cases.length} lifecycle fixtures.`);
