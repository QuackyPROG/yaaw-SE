import { contractImpact, acceptedHistory, repositoryImpact, lastReview, revisionImpact } from "./lifecycle-evidence.mjs";
const ACTIVE = new Set(["READY","IN_PROGRESS","REVIEW_REQUIRED","REPAIR_REQUIRED","PASS"]);
const TERMINAL = new Set(["PASS","CANCELLED"]);
const REVIEW_RESULT = { PASS:"PASS", REPAIR:"REPAIR_REQUIRED", REPLAN:"REPLAN_REQUIRED", BLOCKED:"BLOCKED" };
const idNum = value => Number(String(value??"").match(/(\d+)(?!.*\d)/)?.[1]??0);
const byId=(a,b)=>idNum(a)-idNum(b)||String(a).localeCompare(String(b));
const repoEq=(a,b)=>Boolean(a&&b&&a.status==="READY"&&b.status==="READY"&&a.algorithm===b.algorithm&&a.head_commit===b.head_commit&&a.worktree_digest===b.worktree_digest);
const currentSpecId=(state)=>String(state?.planning?.active_spec??"").match(/SPEC-[0-9]+/)?.[0]??null;
const sourceCurrent=(ticket,state,a)=>contractImpact(ticket,state,a).kind==="CURRENT";
const currentTicketIds=(state,a)=>Object.keys(a.tickets??{}).filter(id=>sourceCurrent(id,state,a)).sort(byId);
const dependenciesPass=(ticket,state,a,repo)=>(a.tickets?.[ticket]?.meta?.dependencies??[]).every(id=>{
  const pass=acceptedHistory(id,a);
  return state.tickets?.[id]==="PASS"&&contractImpact(id,state,a).kind==="CURRENT"&&Boolean(pass)&&repositoryImpact(id,pass,a,repo).kind==="CURRENT";
});
const evidenceFor=(ticket,a)=>Object.values(a.evidence??{}).filter(x=>x?.ticket===ticket&&x?.schema==="yaaw.evidence/v3");
const reviewFor=(ticket,a)=>Object.values(a.reviews??{}).filter(x=>x?.meta?.ticket===ticket&&x?.meta?.schema==="yaaw.review/v2").sort((x,y)=>Number(x.meta.round??0)-Number(y.meta.round??0));
const latestStart=(ticket,a)=>evidenceFor(ticket,a).filter(x=>x.kind==="implementation_start"&&x.result==="STARTED").sort((x,y)=>idNum(x.id)-idNum(y.id)).at(-1)??null;
const latestVerification=(ticket,a)=>evidenceFor(ticket,a).filter(x=>x.kind==="implementation_verification").sort((x,y)=>idNum(x.id)-idNum(y.id)).at(-1)??null;
const latestReview=(ticket,a)=>reviewFor(ticket,a).at(-1)??null;
const verificationCurrent=(v,ticket,a,repo)=>Boolean(v&&v.result==="PASS"&&Number(v.ticket_revision??0)===Number(a.tickets?.[ticket]?.meta?.revision??0)&&Number(v.spec_revision??0)===Number(a.specs?.[a.tickets?.[ticket]?.meta?.spec]?.meta?.revision??0)&&repoEq(v.repository,repo));
const reviewCurrent=(r,ticket,a,repo,v)=>Boolean(r&&REVIEW_RESULT[r.meta?.result]&&Number(r.meta.ticket_revision??0)===Number(a.tickets?.[ticket]?.meta?.revision??0)&&Number(r.meta.spec_revision??0)===Number(a.specs?.[a.tickets?.[ticket]?.meta?.spec]?.meta?.revision??0)&&repoEq(r.meta.repository,repo)&&Array.isArray(r.meta.evidence)&&r.meta.evidence.includes(v?.id));

export function deriveState(a){
  const p=a.product?.meta??{},e=a.engineering?.meta??{};
  const product={artifact:a.product?.path??null,status:String(p.status??"missing"),revision:Number(p.revision??0)};
  const planning={artifact:a.engineering?.path??null,status:String(e.status??"missing"),revision:Number(e.revision??0),current_frontier:e.current_frontier??null,readiness:e.readiness??"pending",scope_status:e.scope_status??"UNKNOWN",active_spec:null};
  const accepted=Object.entries(a.specs??{}).filter(([,x])=>x.meta?.status==="ACCEPTED"&&Number(x.meta.product_revision??0)===product.revision&&Number(x.meta.engineering_revision??0)===planning.revision).sort(([x],[y])=>byId(x,y));
  if(accepted.length===1)planning.active_spec=accepted[0][1].path;
  const tickets=Object.fromEntries(Object.entries(a.tickets??{}).map(([id,x])=>[id,String(x.meta?.status??"DRAFT")]));
  const current=Object.keys(tickets).filter(id=>sourceCurrent(id,{product,planning,tickets},a));
  const allTerminal=current.length>0&&current.every(id=>TERMINAL.has(tickets[id]));
  let phase="implementation";
  if(product.status!=="ready")phase="product";
  else if(planning.status!=="ready"||planning.readiness!=="PASS")phase="planning";
  else if(allTerminal&&planning.scope_status==="COMPLETE")phase="complete";
  const precedence=["REPLAN_REQUIRED","REPAIR_REQUIRED","REVIEW_REQUIRED","IN_PROGRESS","READY","DRAFT","BLOCKED"];
  let active_ticket=null;for(const status of precedence){active_ticket=current.find(id=>tickets[id]===status)??null;if(active_ticket)break;}
  return {schema:"yaaw.derived-state/v1",phase,product,planning,active_ticket,tickets,accepted_specs:accepted.map(([id])=>id)};
}

function transition(kernel,ticket,from,to,id,reason,evidence=[],workflow="orchestration.reconcile-state"){
  const legal=kernel.lifecycle.legal.some(t=>t.from===from&&t.to===to&&(t.writer==="orchestrator"||t.owner==="orchestrator")&&(!t.causes||t.causes.includes(id)));
  if(!legal)return {id:"ILLEGAL_TRANSITION",kind:"BLOCKED",subject:ticket,from,to,reason:`illegal derived transition ${from} -> ${to}`,workflow:null,evidence:[]};
  return {id,kind:"TICKET_STATUS",subject:ticket,from,to,reason,workflow,evidence};
}

export function selectReconciliation(kernel,state,a,repo){
  if((state.accepted_specs??[]).length>1)return {id:"MULTIPLE_CURRENT_SPECS",kind:"BLOCKED",subject:null,from:null,to:null,reason:"multiple current ACCEPTED specifications",workflow:null,evidence:[]};
  for(const ticket of Object.keys(state.tickets??{}).sort(byId)){
    const status=state.tickets[ticket],contract=contractImpact(ticket,state,a),pass=acceptedHistory(ticket,a),last=lastReview(ticket,a);
    const repository=repositoryImpact(ticket,pass,a,repo);
    if(status==="REPLAN_REQUIRED"&&last?.meta?.result!=="REPLAN"&&pass&&contract.kind==="CURRENT"){
      if(repository.kind==="CURRENT")return transition(kernel,ticket,status,"PASS","RECOVER_ACCEPTED_HISTORY","linked PASS remains applicable",[pass.review.path,pass.verification.id]);
      if(repository.kind==="REVERIFY"||repository.kind==="UNKNOWN"){
        if(repo?.status==="READY")return transition(kernel,ticket,status,"REVIEW_REQUIRED",repository.kind==="UNKNOWN"?"REVERIFY_UNCERTAIN":"REVERIFY_REQUIRED",repository.reason,[pass.review.path,pass.verification.id]);
      }
    }
    if(contract.kind==="INVALIDATED"&&status!=="REPLAN_REQUIRED"&&status!=="CANCELLED"&&(ACTIVE.has(status)))
      return transition(kernel,ticket,status,"REPLAN_REQUIRED","CONTRACT_INVALIDATED",contract.reason,[a.tickets[ticket].path],"planning.replan");
    // An independently recorded current REPLAN defeats an obsolete PASS status.
    // Never auto-restore a previous PASS over a newer, linked reviewer judgment.
    if(status==="PASS" && last?.meta?.result==="REPLAN") {
      const verification=latestVerification(ticket,a);
      if(verificationCurrent(verification,ticket,a,repo)&&reviewCurrent(last,ticket,a,repo,verification))
        return transition(kernel,ticket,status,"REPLAN_REQUIRED","REVIEW_RESULT_UNAPPLIED","independent current REPLAN requires Planner revision",[last.path,verification.id],"review.record-review");
    }
    if(status==="PASS"&&pass&&contract.kind==="CURRENT"){
      const latest=latestVerification(ticket,a),verified=pass.verification;
      // Newer failed verification at today's exact repository basis is a regression signal,
      // even though the original PASS is still part of immutable history.
      if(latest?.result!=="PASS" && latest && latest.id!==verified.id &&
         Number(latest.ticket_revision??0)===Number(a.tickets?.[ticket]?.meta?.revision??0)&&
         Number(latest.spec_revision??0)===Number(a.specs?.[a.tickets?.[ticket]?.meta?.spec]?.meta?.revision??0)&&
         repoEq(latest.repository,repo))
        return transition(kernel,ticket,status,"REVIEW_REQUIRED","LATEST_VERIFICATION_FAILED","newer current verification failed; re-establish validity",[latest.id,pass.review.path]);
    }
    if(status==="PASS"){
      if(!pass)return transition(kernel,ticket,status,"REVIEW_REQUIRED","ACCEPTANCE_UNPROVEN","claimed PASS lacks matching independent review and verification",[]);
      if(contract.kind==="CURRENT"&&repository.kind==="REVERIFY")return transition(kernel,ticket,status,"REVIEW_REQUIRED","REVERIFY_REQUIRED",repository.reason,[pass.review.path,pass.verification.id]);
      continue; // Preserve historical PASS under irrelevant revision/commit changes.
    }
    if(contract.kind!=="CURRENT"||status==="REPLAN_REQUIRED")continue;
    const start=latestStart(ticket,a),verification=latestVerification(ticket,a),review=latestReview(ticket,a);
    if(status==="READY"&&start){
      const t=a.tickets[ticket].meta;
      if(Number(start.ticket_revision??0)===Number(t.revision??0)&&Number(start.spec_revision??0)===Number(a.specs?.[t.spec]?.meta?.revision??0))
        return transition(kernel,ticket,"READY","IN_PROGRESS","IMPLEMENTATION_STARTED","implementation start evidence exists",[start.id],"implementation.implement-ticket");
    }
    if(status==="IN_PROGRESS"&&verificationCurrent(verification,ticket,a,repo))return transition(kernel,ticket,status,"REVIEW_REQUIRED","IMPLEMENTATION_VERIFIED","fresh PASS verification exists",[verification.id],"implementation.verify-ticket");
    if(status==="REPAIR_REQUIRED"&&verificationCurrent(verification,ticket,a,repo)&&!(review?.meta?.evidence??[]).includes(verification.id))return transition(kernel,ticket,status,"REVIEW_REQUIRED","IMPLEMENTATION_VERIFIED","fresh PASS verification after repair",[verification.id],"implementation.repair-ticket");
    if(status==="REVIEW_REQUIRED"&&verificationCurrent(verification,ticket,a,repo)&&reviewCurrent(review,ticket,a,repo,verification))
      return transition(kernel,ticket,status,REVIEW_RESULT[review.meta.result],"REVIEW_RESULT_UNAPPLIED",`review ${review.meta.result} authorizes lifecycle adoption`,[review.path,verification.id],"review.record-review");
  }
  return null;
}
function planningReady(state){return state.product.status==="ready"&&state.planning.status==="ready"&&state.planning.readiness==="PASS"}
function requestedTicket(intent,state){const t=String(intent?.target_artifact??"").match(/TASK-[0-9]+/)?.[0];return t&&state.tickets?.[t]?t:null}
export function intentComplete(intent,state,a){
  if(!intent)return false;const o=intent.desired_outcome,target=requestedTicket(intent,state),base=intent.created_from??{};
  if(o==="CONTINUE")return false;
  if(o==="CONTINUE_PRODUCT")return state.product.status==="ready";
  if(o==="REVISE_PRODUCT")return Number(state.product.revision)>Number(base.product_revision??0);
  if(o==="REFINE_PRODUCT")return Boolean(a.product?.digest&&base.product_digest&&a.product.digest!==base.product_digest);
  if(o==="CONTINUE_PLANNING")return planningReady(state);
  if(o==="PLANNING_REVIEW")return state.planning.readiness!==base.planning_readiness||a.engineering?.digest!==base.engineering_digest;
  if(o==="CREATE_SPEC")return Boolean(currentSpecId(state));
  if(o==="CREATE_TICKETS")return currentTicketIds(state,a).length>0;
  if(o==="IMPLEMENT"||o==="REPAIR")return Boolean(target&&state.tickets[target]==="REVIEW_REQUIRED");
  if(o==="REVIEW")return Boolean(target&&state.tickets[target]!=="REVIEW_REQUIRED");
  return false;
}

function baseRoute(state,a,repo){
  if(state.product.status!=="ready")return{workflow:"prd.route",ticket:null};
  // Before opening a new frontier, resolve older accepted work's unknown source lineage.
  // This is a read/metadata audit, not permission to rewrite the completed contract.
  const audit=Object.keys(state.tickets).sort(byId).map(id=>{
    if(!["REPLAN_REQUIRED","PASS"].includes(state.tickets[id])||!acceptedHistory(id,a)||contractImpact(id,state,a).kind!=="UNKNOWN")return null;
    const t=a.tickets[id]?.meta,s=a.specs?.[t?.spec]?.meta;
    if(!t||!s)return null;
    const product=revisionImpact(Number(t.product_revision),Number(state.product.revision),a.product?.meta?.revision_changes,t.requirement_ids??s.requirement_ids??[]);
    const engineering=revisionImpact(Number(t.engineering_revision),Number(state.planning.revision),a.engineering?.meta?.revision_changes,t.decision_ids??s.decision_ids??[]);
    if(product.kind==="UNKNOWN")return{workflow:"prd.audit-revision-impact",ticket:id};
    if(engineering.kind==="UNKNOWN")return{workflow:"planning.audit-revision-impact",ticket:id};
    // Even with fully proved revision lineage, an opaque historic invalidation
    // marker must be examined by the contract owner before any acceptance recovery.
    if(typeof t.invalidated_by==="string"&&t.invalidated_by.trim())
      return{workflow:"planning.audit-revision-impact",ticket:id};
    return null;
  }).find(Boolean);
  if(audit)return audit;
  const invalid=Object.keys(state.tickets).sort(byId).find(id=>state.tickets[id]==="REPLAN_REQUIRED"&&(contractImpact(id,state,a).kind==="INVALIDATED"||lastReview(id,a)?.meta?.result==="REPLAN"));
  if(invalid)return{workflow:"planning.replan",ticket:invalid};
  // A previously accepted ticket undergoing repository re-verification is already
  // governed by its original current/applicable spec. A new frontier readiness reset
  // must not postpone its verification or independent review indefinitely.
  const recovering=Object.keys(state.tickets).sort(byId).find(id=>
    state.tickets[id]==="REVIEW_REQUIRED"&&Boolean(acceptedHistory(id,a))&&sourceCurrent(id,state,a));
  if(recovering)return{workflow:verificationCurrent(latestVerification(recovering,a),recovering,a,repo)?
    "review.review-ticket":"implementation.verify-ticket",ticket:recovering};
  if(state.planning.status!=="ready"||state.planning.readiness!=="PASS")return{workflow:"planning.route",ticket:null};
  const ids=currentTicketIds(state,a);
  for(const [status,workflow] of [["REPAIR_REQUIRED","implementation.repair-ticket"],["IN_PROGRESS","implementation.verify-ticket"]]){
    const id=ids.find(id=>state.tickets[id]===status);if(id)return{workflow,ticket:id};
  }
  const reviewing=ids.find(id=>state.tickets[id]==="REVIEW_REQUIRED");
  if(reviewing)return{workflow:verificationCurrent(latestVerification(reviewing,a),reviewing,a,repo)?"review.review-ticket":"implementation.verify-ticket",ticket:reviewing};
  const ready=ids.find(id=>state.tickets[id]==="READY"&&dependenciesPass(id,state,a,repo));if(ready)return{workflow:"implementation.implement-ticket",ticket:ready};
  const draft=ids.find(id=>state.tickets[id]==="DRAFT"&&dependenciesPass(id,state,a,repo));if(draft)return{workflow:"planning.create-tickets",ticket:draft};
  // Completion requires current applicability, not just ticket status labels.
  if(state.planning.scope_status==="COMPLETE"&&Object.keys(state.tickets).length>0&&Object.values(state.tickets).every(status=>TERMINAL.has(status))){
    const uncertain=Object.keys(state.tickets).find(id=>state.tickets[id]==="PASS"&&(!acceptedHistory(id,a)||contractImpact(id,state,a).kind!=="CURRENT"||repositoryImpact(id,acceptedHistory(id,a),a,repo).kind!=="CURRENT"));
    if(uncertain)return{blocked:`ACCEPTANCE_NOT_CURRENT:${uncertain}`,ticket:uncertain};
    return{terminal:"COMPLETE"};
  }
  if(!currentSpecId(state))return{workflow:"planning.create-spec",ticket:null};
  const activeSpec=currentSpecId(state);
  if(ids.length===0||!ids.some(id=>a.tickets?.[id]?.meta?.spec===activeSpec))return{workflow:"planning.create-tickets",ticket:null};
  if(ids.every(id=>TERMINAL.has(state.tickets[id]))){
    const dubious=Object.keys(state.tickets).find(id=>state.tickets[id]==="PASS"&&(contractImpact(id,state,a).kind!=="CURRENT"||repositoryImpact(id,acceptedHistory(id,a),a,repo).kind!=="CURRENT"));
    if(state.planning.scope_status==="COMPLETE"&&!dubious)return{terminal:"COMPLETE"};
    if(state.planning.scope_status!=="COMPLETE")return{workflow:"planning.route",ticket:null};
  }
  const blocked=ids.find(id=>state.tickets[id]==="BLOCKED");if(blocked)return{blocked:`ticket ${blocked} BLOCKED`,ticket:blocked};
  const uncertain=Object.keys(state.tickets).sort(byId).find(id=>state.tickets[id]==="REPLAN_REQUIRED"||(["READY","DRAFT","PASS"].includes(state.tickets[id])&&contractImpact(id,state,a).kind!=="CURRENT")||(state.tickets[id]==="PASS"&&repositoryImpact(id,acceptedHistory(id,a),a,repo).kind!=="CURRENT"));
  return{blocked:uncertain?`INSUFFICIENT_PROVENANCE:${uncertain}`:"no legal next workflow from durable artifacts",ticket:uncertain??null};
}
function legalRequested(workflow,ticket,state,a,repo){
  if(workflow==="prd.route"||workflow==="prd.revise"||workflow==="prd.refine")return true;
  if(workflow==="prd.audit-revision-impact")return Boolean(ticket&&acceptedHistory(ticket,a)&&contractImpact(ticket,state,a).kind==="UNKNOWN");
  if(workflow==="planning.route"||workflow==="planning.readiness-review")return state.product.status==="ready";
  if(workflow==="planning.audit-revision-impact")return state.product.status==="ready"&&Boolean(ticket&&acceptedHistory(ticket,a)&&contractImpact(ticket,state,a).kind==="UNKNOWN");
  if(workflow==="planning.create-spec")return planningReady(state)&&!currentSpecId(state);
  if(workflow==="planning.create-tickets")return planningReady(state)&&Boolean(currentSpecId(state));
  if(workflow==="implementation.implement-ticket")return Boolean(ticket&&state.tickets[ticket]==="READY"&&sourceCurrent(ticket,state,a)&&dependenciesPass(ticket,state,a,repo));
  if(workflow==="implementation.repair-ticket")return Boolean(ticket&&state.tickets[ticket]==="REPAIR_REQUIRED"&&sourceCurrent(ticket,state,a));
  if(workflow==="review.review-ticket")return Boolean(ticket&&state.tickets[ticket]==="REVIEW_REQUIRED"&&sourceCurrent(ticket,state,a));
  return true;
}

export function planNext(kernel,state,a,repo,intent){
  const reconciliation=selectReconciliation(kernel,state,a,repo);if(reconciliation)return{type:"RECONCILE_REQUIRED",reconciliation};
  if(intentComplete(intent,state,a))return{type:"INTENT_COMPLETE",completion_kind:intent.completion_kind};
  if(intent&&intent.requested_workflow&&intent.requested_workflow!=="orchestration.route"){
    let ticket=requestedTicket(intent,state);
    if(!ticket&&intent.desired_outcome==="IMPLEMENT")ticket=Object.keys(state.tickets).sort(byId).find(id=>state.tickets[id]==="READY"&&dependenciesPass(id,state,a,repo))??null;
    if(!ticket&&intent.desired_outcome==="REPAIR")ticket=Object.keys(state.tickets).sort(byId).find(id=>state.tickets[id]==="REPAIR_REQUIRED")??null;
    if(!ticket&&intent.desired_outcome==="REVIEW")ticket=Object.keys(state.tickets).sort(byId).find(id=>state.tickets[id]==="REVIEW_REQUIRED")??null;
    if(legalRequested(intent.requested_workflow,ticket,state,a,repo))return{type:"ROUTE",workflow:intent.requested_workflow,ticket};
    return{type:"BLOCKED",reason:`PRECONDITION_UNSATISFIED:${intent.requested_workflow}`,ticket};
  }
  return{type:"ROUTE",...baseRoute(state,a,repo)};
}

export function chooseIntentTarget(skill,state,a,repo){
  if(!skill)return null;const ids=currentTicketIds(state,a);
  if(skill.desired_outcome==="IMPLEMENT")return ids.find(id=>state.tickets[id]==="READY"&&dependenciesPass(id,state,a,repo))??null;
  if(skill.desired_outcome==="REPAIR")return ids.find(id=>state.tickets[id]==="REPAIR_REQUIRED")??null;
  if(skill.desired_outcome==="REVIEW")return ids.find(id=>state.tickets[id]==="REVIEW_REQUIRED")??null;
  return null;
}
