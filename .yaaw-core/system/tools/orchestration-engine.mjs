const EXECUTABLE = new Set(["READY","IN_PROGRESS","REVIEW_REQUIRED","REPAIR_REQUIRED","PASS"]);
export const normalizeStatus=v=>String(v??"").trim().toLowerCase();
const num=(a,b)=>Number(a)===Number(b);
const specId=v=>String(v??"").match(/SPEC-[0-9]+/)?.[0]??null;
const legal=(t,a,b)=>(t?.legal??[]).some(x=>x.from===a&&x.to===b);
const currentRepo=(r,repo)=>Boolean(r?.value?.repository?.worktree_digest&&repo?.status==="READY"&&r.value.repository.worktree_digest===repo.worktree_digest);
const latest=(rows,pred)=>(rows??[]).filter(pred).sort((a,b)=>String(a.path).localeCompare(String(b.path))).at(-1)??null;

export function ticketSourceStatus(ticket,state,activeSpec){
  if(!ticket||!activeSpec)return "SPEC_SOURCE_STALE";
  if(!num(ticket.product_revision,state?.product?.revision))return "PRODUCT_SOURCE_STALE";
  if(!num(ticket.engineering_revision,state?.planning?.revision))return "ENGINEERING_SOURCE_STALE";
  if(String(ticket.spec)!==String(activeSpec.id))return "SPEC_SOURCE_STALE";
  if(!num(ticket.spec_revision,activeSpec.revision))return "TICKET_SOURCE_STALE";
  return "CURRENT";
}
export function currentAcceptedSpecs(state,a){
  return Object.entries(a?.specs??{}).filter(([,x])=>normalizeStatus(x?.meta?.status)==="accepted")
    .filter(([,x])=>num(x.meta.product_revision,state?.product?.revision))
    .filter(([,x])=>num(x.meta.engineering_revision,state?.planning?.revision))
    .filter(([,x])=>String(x.meta.frontier_id??"")===String(state?.planning?.current_frontier??""))
    .sort(([x],[y])=>x.localeCompare(y));
}
function activeSpec(state,a){const id=specId(state?.planning?.active_spec);const x=id&&a?.specs?.[id];return x?{id,...x.meta,path:x.path}:null;}
function ev(rows,id,tr,sr,kind){return latest(rows,x=>x?.value?.ticket===id&&x.value.kind===kind&&num(x.value.ticket_revision,tr)&&num(x.value.spec_revision,sr));}
function start(rows,id,tr,sr){const x=ev(rows,id,tr,sr,"implementation_start");return x?.value?.schema==="yaaw.evidence/v3"&&x.value.result==="STARTED"?x:null;}
function verify(rows,id,tr,sr){return ev(rows,id,tr,sr,"implementation_verification");}
function review(rows,id,tr,sr){return (rows??[]).filter(x=>x?.value?.ticket===id&&num(x.value.ticket_revision,tr)&&num(x.value.spec_revision,sr)).sort((a,b)=>Number(a.value.round)-Number(b.value.round)).at(-1)??null;}
function transition(id,subject,from,to,reason,evidence=[]){return{id,kind:"STATE",subject,from,to,reason,workflow:"orchestration.reconcile-state",evidence};}
function currentTicketIds(state,a){const s=activeSpec(state,a);return s?Object.keys(state?.tickets??{}).filter(id=>ticketSourceStatus(a?.tickets?.[id]?.meta,state,s)==="CURRENT"):[];}

export function selectReconciliation({state,artifacts:a,evidence=[],reviews=[],repository,transitions,reconciliationPolicy}){
  const order=["PROJECT_STATE_SCHEMA_MIGRATION_REQUIRED","PRODUCT_LEDGER_SYNC","PLANNING_LEDGER_SYNC","ACTIVE_SPEC_UNADOPTED","TICKET_UNREGISTERED","CONTRACT_SOURCE_STALE","IMPLEMENTATION_STARTED","IMPLEMENTATION_VERIFIED","REVIEW_RESULT_UNAPPLIED","ACCEPTANCE_STALE","PROJECT_COMPLETION_SYNC"];
  const declared=(reconciliationPolicy?.priority??[]).map(x=>typeof x==="string"?x:x.id);
  if(declared.length&&JSON.stringify(declared)!==JSON.stringify(order))return{id:"RECONCILIATION_POLICY_DRIFT",kind:"BLOCKED",reason:"reconciliation priority differs from engine contract"};
  if(!state)return{id:"PROJECT_STATE_MISSING",kind:"BLOCKED",reason:"project state missing"};
  if(state.schema!=="yaaw.project-state/v2")return{id:"PROJECT_STATE_SCHEMA_MIGRATION_REQUIRED",kind:"BLOCKED",reason:"project schema requires installer migration"};

  const p=a?.product?.meta;
  if(p){
    if(Number(state.product.revision)>Number(p.revision))return{id:"PRODUCT_LEDGER_AHEAD",kind:"BLOCKED",reason:"state product revision is ahead of durable product"};
    if(Number(p.revision)>Number(state.product.revision)||normalizeStatus(p.status)!==normalizeStatus(state.product.status))
      return{id:"PRODUCT_LEDGER_SYNC",kind:"STATE",subject:"product",from:String(state.product.revision),to:String(p.revision),reason:"durable product metadata is ahead",workflow:"orchestration.reconcile-state",evidence:[a.product.path],patch:{revision:Number(p.revision),status:p.status}};
  }
  const e=a?.engineering?.meta;
  if(e){
    if(Number(state.planning.revision)>Number(e.revision))return{id:"PLANNING_LEDGER_AHEAD",kind:"BLOCKED",reason:"state planning revision is ahead of durable engineering"};
    const scope=e.scope_status??"UNKNOWN";
    if(Number(e.revision)>Number(state.planning.revision)||normalizeStatus(e.status)!==normalizeStatus(state.planning.status)||normalizeStatus(e.readiness)!==normalizeStatus(state.planning.readiness)||String(e.current_frontier??"")!==String(state.planning.current_frontier??"")||scope!==(state.planning.scope_status??"UNKNOWN"))
      return{id:"PLANNING_LEDGER_SYNC",kind:"STATE",subject:"planning",from:String(state.planning.revision),to:String(e.revision),reason:"durable engineering metadata is ahead",workflow:"orchestration.reconcile-state",evidence:[a.engineering.path],patch:{revision:Number(e.revision),status:e.status,readiness:e.readiness,current_frontier:e.current_frontier??null,scope_status:scope}};
  }

  const specs=currentAcceptedSpecs(state,a);
  if(specs.length>1)return{id:"MULTIPLE_CURRENT_ACCEPTED_SPECS",kind:"BLOCKED",reason:"multiple current accepted specs"};
  if(specs.length===1&&specId(state.planning.active_spec)!==specs[0][0]){
    const [id,x]=specs[0];return{id:"ACTIVE_SPEC_UNADOPTED",kind:"STATE",subject:id,from:state.planning.active_spec??null,to:x.path,reason:"current accepted spec not adopted",workflow:"orchestration.reconcile-state",evidence:[x.path],patch:{active_spec:x.path}};
  }

  const s=activeSpec(state,a);
  if(s){
    for(const [id,x] of Object.entries(a?.tickets??{}).sort(([x],[y])=>x.localeCompare(y))){
      if(Object.hasOwn(state.tickets??{},id))continue;
      if(!["DRAFT","READY"].includes(String(x?.meta?.status)))continue;
      if(ticketSourceStatus(x.meta,state,s)!=="CURRENT")continue;
      return{id:"TICKET_UNREGISTERED",kind:"STATE",subject:id,from:null,to:x.meta.status,reason:"current ticket artifact not registered",workflow:"orchestration.reconcile-state",evidence:[x.path],patch:{ticket:id,status:x.meta.status}};
    }
    for(const id of Object.keys(state.tickets??{}).sort()){
      const st=state.tickets[id];if(!EXECUTABLE.has(st))continue;
      const cause=ticketSourceStatus(a?.tickets?.[id]?.meta,state,s);
      if(cause!=="CURRENT"){
        if(!legal(transitions,st,"REPLAN_REQUIRED"))return{id:"ILLEGAL_INVALIDATION_TRANSITION",kind:"BLOCKED",reason:st+" cannot transition to REPLAN_REQUIRED"};
        return transition("CONTRACT_SOURCE_STALE",id,st,"REPLAN_REQUIRED",cause,[a?.tickets?.[id]?.path,s.path].filter(Boolean));
      }
    }
    for(const id of Object.keys(state.tickets??{}).sort()){
      const st=state.tickets[id],m=a?.tickets?.[id]?.meta;if(!m)continue;
      const tr=Number(m.revision),sr=Number(s.revision);
      if(st==="READY"){const x=start(evidence,id,tr,sr);if(x)return transition("IMPLEMENTATION_STARTED",id,"READY","IN_PROGRESS","IMPLEMENTATION_STARTED",[x.path]);}
      if(st==="IN_PROGRESS"){const x=verify(evidence,id,tr,sr);if(x?.value?.schema==="yaaw.evidence/v3"&&x.value.result==="PASS"&&currentRepo(x,repository))return transition("IMPLEMENTATION_VERIFIED",id,"IN_PROGRESS","REVIEW_REQUIRED","IMPLEMENTATION_VERIFIED",[x.path]);}
      if(st==="REVIEW_REQUIRED"){const x=review(reviews,id,tr,sr),to={PASS:"PASS",REPAIR:"REPAIR_REQUIRED",REPLAN:"REPLAN_REQUIRED",BLOCKED:"BLOCKED"}[x?.value?.result];if(x&&to&&currentRepo(x,repository)&&legal(transitions,"REVIEW_REQUIRED",to))return transition("REVIEW_RESULT_UNAPPLIED",id,"REVIEW_REQUIRED",to,"REVIEW_"+x.value.result,[x.path,...(x.value.evidence??[])]);}
      if(st==="PASS"){
        const v=verify(evidence,id,tr,sr),r=review(reviews,id,tr,sr);let reason=null;
        if(!r)reason="REVIEW_MISSING";else if(!r.value?.repository?.worktree_digest)reason="LEGACY_IDENTITY_UNVERIFIABLE";else if(!currentRepo(r,repository))reason="REVIEW_REPOSITORY_STALE";else if(!v||v.value?.schema!=="yaaw.evidence/v3"||v.value.result!=="PASS")reason="VERIFICATION_MISSING";else if(!currentRepo(v,repository))reason="VERIFICATION_REPOSITORY_STALE";
        if(reason&&legal(transitions,"PASS","REVIEW_REQUIRED"))return transition("ACCEPTANCE_STALE",id,"PASS","REVIEW_REQUIRED",reason,[r?.path,v?.path].filter(Boolean));
      }
    }
  }
  const vals=Object.values(state.tickets??{});
  if(vals.length&&vals.every(x=>x==="PASS"||x==="CANCELLED")&&state.planning.scope_status==="COMPLETE"&&state.phase!=="complete")
    return{id:"PROJECT_COMPLETION_SYNC",kind:"STATE",subject:"project",from:state.phase,to:"complete",reason:"all admitted tickets terminal and scope COMPLETE",workflow:"orchestration.reconcile-state",evidence:[]};
  return null;
}
function deps(id,a,state){return (a?.tickets?.[id]?.meta?.dependencies??[]).every(d=>state.tickets?.[d]==="PASS");}
function baseRoute(state,a,evidence,p){
  if(state?.blocker)return{kind:"BLOCKED",terminal:"BLOCKED",reason:state.blocker.kind??"PROJECT_BLOCKED"};
  if(normalizeStatus(state?.product?.status)!=="ready")return{kind:"DISPATCH_READY",workflow:p.product_unready_workflow};
  const tickets=state?.tickets??{},replan=Object.keys(tickets).sort().find(id=>tickets[id]==="REPLAN_REQUIRED");if(replan)return{kind:"DISPATCH_READY",workflow:"planning.replan",ticket:replan};
  if(normalizeStatus(state?.planning?.status)!=="ready"||state.planning.readiness!=="PASS")return{kind:"DISPATCH_READY",workflow:p.planning_unready_workflow};
  const s=activeSpec(state,a);if(!s||normalizeStatus(s.status)!=="accepted")return{kind:"DISPATCH_READY",workflow:p.missing_spec_workflow};
  const ids=currentTicketIds(state,a);if(!ids.length)return{kind:"DISPATCH_READY",workflow:p.missing_tickets_workflow};
  for(const [st,w] of [["REPAIR_REQUIRED","implementation.repair-ticket"],["REVIEW_REQUIRED","review.review-ticket"]]){const id=ids.find(x=>tickets[x]===st);if(id)return{kind:"DISPATCH_READY",workflow:w,ticket:id};}
  const ip=ids.find(x=>tickets[x]==="IN_PROGRESS");if(ip){const m=a.tickets[ip].meta;return start(evidence,ip,Number(m.revision),Number(s.revision))?{kind:"DISPATCH_READY",workflow:"implementation.verify-ticket",ticket:ip}:{kind:"ROOT_ACTION",workflow:"orchestration.recover-interruption",ticket:ip,reason:"IMPLEMENTATION_START_EVIDENCE_MISSING"};}
  const ready=ids.find(x=>tickets[x]==="READY"&&deps(x,a,state));if(ready)return{kind:"DISPATCH_READY",workflow:"implementation.implement-ticket",ticket:ready};
  const vals=ids.map(x=>tickets[x]);if(vals.some(x=>x==="BLOCKED"))return{kind:"BLOCKED",terminal:"BLOCKED",reason:"TICKET_BLOCKED"};
  if(vals.length&&vals.every(x=>x==="PASS"||x==="CANCELLED"))return state.planning.scope_status==="COMPLETE"?{kind:"TERMINAL",terminal:p.complete_terminal}:{kind:"DISPATCH_READY",workflow:p.next_frontier_workflow};
  return{kind:"ROOT_ACTION",workflow:"orchestration.recover-interruption",reason:"NO_SAFE_SEMANTIC_ROUTE"};
}
function legalNow(w,state,a){
  const s=activeSpec(state,a),t=state?.tickets??{};
  if(["prd.route","prd.revise","prd.refine"].includes(w))return true;
  if(["planning.route","planning.readiness-review"].includes(w))return normalizeStatus(state?.product?.status)==="ready";
  if(w==="planning.create-spec")return normalizeStatus(state.product.status)==="ready"&&normalizeStatus(state.planning.status)==="ready"&&state.planning.readiness==="PASS"&&!s;
  if(w==="planning.create-tickets")return Boolean(s)&&currentTicketIds(state,a).length===0;
  if(w==="implementation.implement-ticket")return Object.values(t).includes("READY");
  if(w==="implementation.repair-ticket")return Object.values(t).includes("REPAIR_REQUIRED");
  if(w==="review.review-ticket")return Object.values(t).includes("REVIEW_REQUIRED");
  return false;
}
export function intentComplete(i,state,a){
  if(!i)return false;const target=String(i.target_artifact??"").match(/TASK-[0-9]+/)?.[0]??null,o=i.desired_outcome;
  if(o==="CREATE_SPEC")return currentAcceptedSpecs(state,a).length===1;
  if(o==="CREATE_TICKETS")return currentTicketIds(state,a).length>0;
  if(o==="IMPLEMENT"||o==="REPAIR")return target?state.tickets?.[target]==="REVIEW_REQUIRED":Number(state?.last_transition?.sequence??0)>Number(i.created_from_transition_sequence??0)&&state.last_transition?.to==="REVIEW_REQUIRED";
  if(o==="REVIEW")return target?Boolean(state.tickets?.[target]&&state.tickets[target]!=="REVIEW_REQUIRED"):Number(state?.last_transition?.sequence??0)>Number(i.created_from_transition_sequence??0)&&state.last_transition?.workflow==="review.record-review";
  if(o==="CONTINUE_PRODUCT")return normalizeStatus(state.product?.status)==="ready";
  if(o==="PLANNING_REVIEW")return ["PASS","MISSING_DECISIONS","PRODUCT_GAP","REPLAN","BLOCKED"].includes(state.planning?.readiness);
  return false;
}
export function selectRoute({state,artifacts:a,evidence=[],intent,routingPolicy}){
  const normal=baseRoute(state,a,evidence,routingPolicy);if(!intent||intent.desired_outcome==="CONTINUE")return normal;
  if(intentComplete(intent,state,a))return{kind:"INTENT_COMPLETE",reason:intent.completion_kind};
  if(intent.requested_workflow&&legalNow(intent.requested_workflow,state,a)){const map={"implementation.implement-ticket":"READY","implementation.repair-ticket":"REPAIR_REQUIRED","review.review-ticket":"REVIEW_REQUIRED"},st=map[intent.requested_workflow],ticket=st&&Object.keys(state.tickets??{}).sort().find(id=>state.tickets[id]===st);return{kind:"DISPATCH_READY",workflow:intent.requested_workflow,...(ticket?{ticket}:{})};}
  if(["REVIEW","REPAIR"].includes(intent.desired_outcome))return{kind:"ROOT_ACTION",workflow:"orchestration.recover-interruption",reason:intent.desired_outcome+"_PRECONDITION_UNSATISFIED"};
  return normal;
}
export function applyReconciliation(state,r,repo){
  if(!r||r.kind!=="STATE")throw new Error("reconciliation is not applicable");const n=structuredClone(state),seq=Number(n.transition_sequence??0)+1;
  if(r.id==="PRODUCT_LEDGER_SYNC")Object.assign(n.product,r.patch);
  else if(r.id==="PLANNING_LEDGER_SYNC")Object.assign(n.planning,r.patch);
  else if(r.id==="ACTIVE_SPEC_UNADOPTED")n.planning.active_spec=r.patch.active_spec;
  else if(r.id==="TICKET_UNREGISTERED"){n.tickets[r.patch.ticket]=r.patch.status;if(!n.active_ticket&&r.patch.status==="READY")n.active_ticket=r.patch.ticket;}
  else if(r.id==="PROJECT_COMPLETION_SYNC"){n.phase="complete";n.active_ticket=null;}
  else if(r.subject?.startsWith?.("TASK-")){n.tickets[r.subject]=r.to;if(["IN_PROGRESS","REVIEW_REQUIRED","REPAIR_REQUIRED","REPLAN_REQUIRED"].includes(r.to))n.active_ticket=r.subject;if(["PASS","CANCELLED"].includes(r.to)&&n.active_ticket===r.subject)n.active_ticket=null;}
  n.transition_sequence=seq;n.last_transition={sequence:seq,subject:r.subject,from:r.from??null,to:r.to,workflow:r.workflow??"orchestration.reconcile-state",reason:r.reason,evidence:r.evidence??[],observed_commit:repo?.head_commit??null};n.last_observed_commit=repo?.head_commit??null;n.last_workflow=r.workflow??"orchestration.reconcile-state";return n;
}
export function planNext(input){
  if(input?.framework?.integrity_status!=="HEALTHY"){const s=input?.framework?.integrity_status??"UNKNOWN";return{kind:"FRAMEWORK_STOP",reason:s==="CONTRACT_INCONSISTENT"?"FRAMEWORK_CONTRACT_INCONSISTENCY":["UNKNOWN","MANIFEST_INVALID"].includes(s)?"FRAMEWORK_INTEGRITY_UNKNOWN":"FRAMEWORK_INTEGRITY_VIOLATION"};}
  const r=selectReconciliation(input);if(r?.kind==="BLOCKED")return{kind:"BLOCKED",terminal:"BLOCKED",reason:r.id,reconciliation:r};if(r)return{kind:"RECONCILE_REQUIRED",workflow:"orchestration.reconcile-state",reconciliation:r};return selectRoute(input);
}
export const handoffBasis=({selected,state,intent})=>({workflow:selected.workflow,ticket:selected.ticket??null,desired_intent:intent?.desired_outcome??null,transition_sequence:Number(state?.transition_sequence??0)});
