const ACTIVE = new Set(["READY","IN_PROGRESS","REVIEW_REQUIRED","REPAIR_REQUIRED","PASS"]);
const TERMINAL = new Set(["PASS","CANCELLED"]);
const REVIEW_RESULT = { PASS:"PASS", REPAIR:"REPAIR_REQUIRED", REPLAN:"REPLAN_REQUIRED", BLOCKED:"BLOCKED" };
const idNum = value => Number(String(value??"").match(/(\d+)(?!.*\d)/)?.[1]??0);
const byId=(a,b)=>idNum(a)-idNum(b)||String(a).localeCompare(String(b));
const repoEq=(a,b)=>Boolean(a&&b&&a.status==="READY"&&b.status==="READY"&&a.algorithm===b.algorithm&&a.head_commit===b.head_commit&&a.worktree_digest===b.worktree_digest);
const currentSpecId=(state)=>String(state?.planning?.active_spec??"").match(/SPEC-[0-9]+/)?.[0]??null;
const sourceCurrent=(ticket,state,a)=>{
  const t=a.tickets?.[ticket]?.meta;if(!t)return false;
  const sid=String(t.spec??"");const s=a.specs?.[sid]?.meta;if(!s)return false;
  return Number(t.product_revision??0)===Number(state.product.revision??0)
    && Number(t.engineering_revision??0)===Number(state.planning.revision??0)
    && Number(t.spec_revision??0)===Number(s.revision??0)
    && Number(s.product_revision??0)===Number(state.product.revision??0)
    && Number(s.engineering_revision??0)===Number(state.planning.revision??0);
};
const currentTicketIds=(state,a)=>Object.keys(a.tickets??{}).filter(id=>sourceCurrent(id,state,a)).sort(byId);
const dependenciesPass=(ticket,state,a)=>((a.tickets?.[ticket]?.meta?.dependencies??[]).every(id=>state.tickets?.[id]==="PASS"));
const evidenceFor=(ticket,a)=>Object.values(a.evidence??{}).filter(x=>x?.ticket===ticket&&x?.schema==="yaaw.evidence/v3");
const reviewFor=(ticket,a)=>Object.values(a.reviews??{}).filter(x=>x?.meta?.ticket===ticket&&x?.meta?.schema==="yaaw.review/v2").sort((x,y)=>Number(x.meta.round??0)-Number(y.meta.round??0));
const latestStart=(ticket,a)=>evidenceFor(ticket,a).filter(x=>x.kind==="implementation_start"&&x.result==="STARTED").sort((x,y)=>idNum(x.id)-idNum(y.id)).at(-1)??null;
const latestVerification=(ticket,a)=>evidenceFor(ticket,a).filter(x=>x.kind==="implementation_verification").sort((x,y)=>idNum(x.id)-idNum(y.id)).at(-1)??null;
const latestReview=(ticket,a)=>reviewFor(ticket,a).at(-1)??null;
const verificationCurrent=(v,ticket,a,repo)=>Boolean(v&&v.result==="PASS"&&Number(v.ticket_revision??0)===Number(a.tickets?.[ticket]?.meta?.revision??0)&&Number(v.spec_revision??0)===Number(a.specs?.[a.tickets?.[ticket]?.meta?.spec]?.meta?.revision??0)&&repoEq(v.repository,repo));
const reviewCurrent=(r,ticket,a,repo,v)=>Boolean(r&&REVIEW_RESULT[r.meta?.result]&&Number(r.meta.ticket_revision??0)===Number(a.tickets?.[ticket]?.meta?.revision??0)&&Number(r.meta.spec_revision??0)===Number(a.specs?.[a.tickets?.[ticket]?.meta?.spec]?.meta?.revision??0)&&repoEq(r.meta.repository,repo)&&Array.isArray(r.meta.evidence)&&(!v||r.meta.evidence.includes(v.id)));

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
  const legal=kernel.lifecycle.legal.some(t=>t.from===from&&t.to===to);
  if(!legal)return {id:"ILLEGAL_TRANSITION",kind:"BLOCKED",subject:ticket,from,to,reason:`illegal derived transition ${from} -> ${to}`,workflow:null,evidence:[]};
  return {id,kind:"TICKET_STATUS",subject:ticket,from,to,reason,workflow,evidence};
}

export function selectReconciliation(kernel,state,a,repo){
  if((state.accepted_specs??[]).length>1)return {id:"MULTIPLE_CURRENT_SPECS",kind:"BLOCKED",subject:null,from:null,to:null,reason:"more than one current ACCEPTED specification exists",workflow:null,evidence:state.accepted_specs};
  const ids=Object.keys(state.tickets??{}).sort(byId);
  for(const ticket of ids){
    const status=state.tickets[ticket];
    if((ACTIVE.has(status)||status==="REPLAN_REQUIRED")&&!sourceCurrent(ticket,state,a)){
      if(status==="REPLAN_REQUIRED")continue;
      return transition(kernel,ticket,status,"REPLAN_REQUIRED","CONTRACT_SOURCE_STALE","ticket source revisions are stale",[],"planning.replan");
    }
  }
  for(const ticket of ids){
    const status=state.tickets[ticket];if(!sourceCurrent(ticket,state,a))continue;
    const start=latestStart(ticket,a),verification=latestVerification(ticket,a),review=latestReview(ticket,a);
    if(status==="READY"&&start){
      const t=a.tickets[ticket].meta;
      if(Number(start.ticket_revision??0)===Number(t.revision??0)&&Number(start.spec_revision??0)===Number(a.specs?.[t.spec]?.meta?.revision??0))return transition(kernel,ticket,"READY","IN_PROGRESS","IMPLEMENTATION_STARTED","implementation_start evidence exists",[start.id]);
    }
    if(status==="IN_PROGRESS"&&verificationCurrent(verification,ticket,a,repo))return transition(kernel,ticket,"IN_PROGRESS","REVIEW_REQUIRED","IMPLEMENTATION_VERIFIED","current PASS verification exists",[verification.id]);
    if(status==="REPAIR_REQUIRED"&&verificationCurrent(verification,ticket,a,repo)){
      const prior=review?.meta?.evidence??[];if(!prior.includes(verification.id))return transition(kernel,ticket,"REPAIR_REQUIRED","REVIEW_REQUIRED","IMPLEMENTATION_VERIFIED","fresh PASS verification exists after repair",[verification.id]);
    }
    if(status==="REVIEW_REQUIRED"&&reviewCurrent(review,ticket,a,repo,verification)){
      const to=REVIEW_RESULT[review.meta.result];return transition(kernel,ticket,"REVIEW_REQUIRED",to,"REVIEW_RESULT_UNAPPLIED",`review result ${review.meta.result} authorizes ${to}`,[review.path,verification?.id].filter(Boolean));
    }
    if(status==="PASS"){
      if(!verificationCurrent(verification,ticket,a,repo))return transition(kernel,ticket,"PASS","REVIEW_REQUIRED","ACCEPTANCE_STALE","accepted ticket lacks current PASS verification",verification?[verification.id]:[]);
      if(!reviewCurrent(review,ticket,a,repo,verification))return transition(kernel,ticket,"PASS","REVIEW_REQUIRED","ACCEPTANCE_STALE","accepted ticket lacks current review for repository/evidence basis",review?[review.path]:[]);
    }
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

function baseRoute(state,a){
  if(state.product.status!=="ready")return {workflow:"prd.route",ticket:null};
  const replan=Object.keys(state.tickets).sort(byId).find(id=>state.tickets[id]==="REPLAN_REQUIRED");if(replan)return{workflow:"planning.replan",ticket:replan};
  if(state.planning.status!=="ready"||state.planning.readiness!=="PASS")return{workflow:"planning.route",ticket:null};
  if(!currentSpecId(state))return{workflow:"planning.create-spec",ticket:null};
  const ids=currentTicketIds(state,a);
  const repair=ids.find(id=>state.tickets[id]==="REPAIR_REQUIRED");if(repair)return{workflow:"implementation.repair-ticket",ticket:repair};
  const review=ids.find(id=>state.tickets[id]==="REVIEW_REQUIRED");if(review)return{workflow:"review.review-ticket",ticket:review};
  const progress=ids.find(id=>state.tickets[id]==="IN_PROGRESS");if(progress)return{workflow:"implementation.verify-ticket",ticket:progress};
  const ready=ids.find(id=>state.tickets[id]==="READY"&&dependenciesPass(id,state,a));if(ready)return{workflow:"implementation.implement-ticket",ticket:ready};
  const draft=ids.find(id=>state.tickets[id]==="DRAFT"&&dependenciesPass(id,state,a));if(draft)return{workflow:"planning.create-tickets",ticket:draft};
  if(ids.length===0)return{workflow:"planning.create-tickets",ticket:null};
  if(ids.every(id=>TERMINAL.has(state.tickets[id]))){if(state.planning.scope_status==="COMPLETE")return{terminal:"COMPLETE"};return{workflow:"planning.route",ticket:null};}
  const blocked=ids.find(id=>state.tickets[id]==="BLOCKED");if(blocked)return{blocked:`ticket ${blocked} is BLOCKED`,ticket:blocked};
  return{blocked:"no legal next workflow from current durable artifacts",ticket:null};
}

function legalRequested(workflow,ticket,state,a){
  if(workflow==="prd.route"||workflow==="prd.revise"||workflow==="prd.refine")return true;
  if(workflow==="planning.route"||workflow==="planning.readiness-review")return state.product.status==="ready";
  if(workflow==="planning.create-spec")return planningReady(state)&&!currentSpecId(state);
  if(workflow==="planning.create-tickets")return planningReady(state)&&Boolean(currentSpecId(state));
  if(workflow==="implementation.implement-ticket")return Boolean(ticket&&state.tickets[ticket]==="READY"&&sourceCurrent(ticket,state,a)&&dependenciesPass(ticket,state,a));
  if(workflow==="implementation.repair-ticket")return Boolean(ticket&&state.tickets[ticket]==="REPAIR_REQUIRED"&&sourceCurrent(ticket,state,a));
  if(workflow==="review.review-ticket")return Boolean(ticket&&state.tickets[ticket]==="REVIEW_REQUIRED"&&sourceCurrent(ticket,state,a));
  return true;
}

export function planNext(kernel,state,a,repo,intent){
  const reconciliation=selectReconciliation(kernel,state,a,repo);if(reconciliation)return{type:"RECONCILE_REQUIRED",reconciliation};
  if(intentComplete(intent,state,a))return{type:"INTENT_COMPLETE",completion_kind:intent.completion_kind};
  if(state.phase==="complete")return{type:"TERMINAL",terminal:"COMPLETE"};
  if(intent&&intent.requested_workflow&&intent.requested_workflow!=="orchestration.route"){
    let ticket=requestedTicket(intent,state);
    if(!ticket&&intent.desired_outcome==="IMPLEMENT")ticket=Object.keys(state.tickets).sort(byId).find(id=>state.tickets[id]==="READY"&&dependenciesPass(id,state,a))??null;
    if(!ticket&&intent.desired_outcome==="REPAIR")ticket=Object.keys(state.tickets).sort(byId).find(id=>state.tickets[id]==="REPAIR_REQUIRED")??null;
    if(!ticket&&intent.desired_outcome==="REVIEW")ticket=Object.keys(state.tickets).sort(byId).find(id=>state.tickets[id]==="REVIEW_REQUIRED")??null;
    if(legalRequested(intent.requested_workflow,ticket,state,a))return{type:"ROUTE",workflow:intent.requested_workflow,ticket};
    return{type:"BLOCKED",reason:`PRECONDITION_UNSATISFIED:${intent.requested_workflow}`,ticket};
  }
  return{type:"ROUTE",...baseRoute(state,a)};
}

export function chooseIntentTarget(skill,state,a){
  if(!skill)return null;const ids=currentTicketIds(state,a);
  if(skill.desired_outcome==="IMPLEMENT")return ids.find(id=>state.tickets[id]==="READY"&&dependenciesPass(id,state,a))??null;
  if(skill.desired_outcome==="REPAIR")return ids.find(id=>state.tickets[id]==="REPAIR_REQUIRED")??null;
  if(skill.desired_outcome==="REVIEW")return ids.find(id=>state.tickets[id]==="REVIEW_REQUIRED")??null;
  return null;
}
