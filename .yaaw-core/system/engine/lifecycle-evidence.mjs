const n=x=>Number(x??0);
const eq=(a,b)=>Boolean(a&&b&&a.status==="READY"&&b.status==="READY"&&a.algorithm===b.algorithm&&a.head_commit===b.head_commit&&a.worktree_digest===b.worktree_digest);
export function revisionImpact(from,to,changes,ids){
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<from)return {kind:"UNKNOWN",reason:"invalid revision lineage"};
  if(from===to)return {kind:"CURRENT",reason:"revision unchanged"};
  for(let revision=from+1;revision<=to;revision++){
    const entries=(Array.isArray(changes)?changes:[]).filter(c=>c?.revision===revision);
    if(entries.length!==1)return {kind:"UNKNOWN",reason:`no unique impact record for revision ${revision}`};
    const c=entries[0];if(typeof c.reason!=="string"||!c.reason.trim())return {kind:"UNKNOWN",reason:"revision impact lacks rationale"};
    if(c.impact==="ALL")return {kind:"INVALIDATED",reason:`revision ${revision} affects all contracts`};
    if(c.impact==="NONE")continue;
    if(c.impact!=="SCOPED"||!Array.isArray(c.ids)||!c.ids.length||!Array.isArray(ids)||!ids.length)return {kind:"UNKNOWN",reason:"scoped contract provenance is insufficient"};
    if(c.ids.some(id=>ids.includes(id)))return {kind:"INVALIDATED",reason:`revision ${revision} affects referenced source`};
  }
  return {kind:"CURRENT",reason:"all intervening revisions proved unrelated"};
}
export function contractImpact(ticket,state,a){
  const t=a.tickets?.[ticket]?.meta,s=a.specs?.[t?.spec]?.meta;
  if(!t||!s)return {kind:"UNKNOWN",reason:"missing governing contract"};
  if(t.invalidated_by)return {kind:"INVALIDATED",reason:`explicit invalidation: ${t.invalidated_by}`};
  if(["STALE","SUPERSEDED"].includes(s.status))return {kind:"INVALIDATED",reason:"specification explicitly superseded"};
  if(s.status!=="ACCEPTED")return {kind:"UNKNOWN",reason:"specification not accepted"};
  if(n(t.spec_revision)!==n(s.revision)||n(t.product_revision)!==n(s.product_revision)||n(t.engineering_revision)!==n(s.engineering_revision))return {kind:"INVALIDATED",reason:"governing specification source basis changed"};
  const p=revisionImpact(n(t.product_revision),n(state.product.revision),a.product?.meta?.revision_changes,t.requirement_ids??s.requirement_ids??[]);
  const e=revisionImpact(n(t.engineering_revision),n(state.planning.revision),a.engineering?.meta?.revision_changes,t.decision_ids??s.decision_ids??[]);
  return [p,e].find(x=>x.kind==="INVALIDATED")??[p,e].find(x=>x.kind==="UNKNOWN")??{kind:"CURRENT",reason:"source lineage proves contract applicable"};
}
const evidence=(ticket,a)=>Object.values(a.evidence??{}).filter(v=>v?.schema==="yaaw.evidence/v3"&&v.ticket===ticket);
export function lastReview(ticket,a){return Object.values(a.reviews??{}).filter(r=>r?.meta?.schema==="yaaw.review/v2"&&r.meta.ticket===ticket).sort((x,y)=>n(x.meta.round)-n(y.meta.round)).at(-1)??null}
export function acceptedHistory(ticket,a){
  const t=a.tickets?.[ticket]?.meta,s=a.specs?.[t?.spec]?.meta,r=lastReview(ticket,a);
  if(!t||!s||r?.meta?.result!=="PASS"||!Array.isArray(r.meta.evidence)||n(r.meta.ticket_revision)!==n(t.revision)||n(r.meta.spec_revision)!==n(s.revision))return null;
  const verified=evidence(ticket,a).find(v=>v.kind==="implementation_verification"&&v.result==="PASS"&&r.meta.evidence.includes(v.id)&&n(v.ticket_revision)===n(t.revision)&&n(v.spec_revision)===n(s.revision)&&eq(v.repository,r.meta.repository));
  return verified?{review:r,verification:verified}:null;
}
export function repositoryImpact(ticket,pass,a,repo){
  if(!pass)return {kind:"UNKNOWN",reason:"missing linked historical acceptance"};
  const old=pass.review.meta.repository;
  if(eq(old,repo))return {kind:"CURRENT",reason:"repository matches reviewed identity"};
  const delta=a.repository_changes?.[old?.head_commit??""],scopes=a.tickets?.[ticket]?.meta?.affected_paths;
  if(old?.dirty!==false||old?.status!=="READY"||repo?.status!=="READY"||delta?.status!=="KNOWN")return {kind:"UNKNOWN",reason:"historical worktree difference cannot be proven unrelated"};
  if(!Array.isArray(scopes)||!scopes.length||!scopes.every(p=>typeof p==="string"&&p.length>0&&!p.includes("*")&&!p.startsWith("/")))return {kind:"UNKNOWN",reason:"missing safe affected_paths provenance"};
  const affected=delta.paths.some(p=>scopes.some(scope=>scope.endsWith("/")?p.startsWith(scope):p===scope));
  return affected?{kind:"REVERIFY",reason:"changed repository path affects accepted ticket"}:{kind:"CURRENT",reason:"all changed paths proven outside declared scope"};
}
