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
  if(["STALE","SUPERSEDED"].includes(s.status))return {kind:"INVALIDATED",reason:"specification explicitly superseded"};
  if(s.status!=="ACCEPTED")return {kind:"UNKNOWN",reason:"specification not accepted"};
  if(n(t.spec_revision)!==n(s.revision)||n(t.product_revision)!==n(s.product_revision)||n(t.engineering_revision)!==n(s.engineering_revision))return {kind:"INVALIDATED",reason:"governing specification source basis changed"};
  const p=revisionImpact(n(t.product_revision),n(state.product.revision),a.product?.meta?.revision_changes,t.requirement_ids??s.requirement_ids??[]);
  const e=revisionImpact(n(t.engineering_revision),n(state.planning.revision),a.engineering?.meta?.revision_changes,t.decision_ids??s.decision_ids??[]);
  const proved=[p,e].find(x=>x.kind==="INVALIDATED");
  if(proved)return proved;
  // Legacy runtimes wrote invalidated_by on equality-only revision drift. Its presence
  // is an unresolved assertion, not independent proof of a contract defect. Do NOT
  // silently clear it or restore PASS: require an authorized Planner audit instead.
  if(typeof t.invalidated_by==="string"&&t.invalidated_by.trim())
    return {kind:"UNKNOWN",reason:`unaudited invalidated_by marker: ${t.invalidated_by}`};
  return [p,e].find(x=>x.kind==="UNKNOWN")??{kind:"CURRENT",reason:"source lineage proves contract applicable"};
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
  // Scoped proof is accepted only if independent Reviewer and linked Implementer
  // verification captured the SAME nonempty, certified application fingerprint.
  // Full repository identity still guards verification/review and every handoff.
  const reviewScope=pass.review.meta.scope_identity,verificationScope=pass.verification.scope_identity;
  const current=a.scope_identities?.[ticket],declared=a.tickets?.[ticket]?.meta?.affected_paths;
  if(reviewScope||verificationScope){
    const certified=pass.review.meta.scope_verified===true &&
      Array.isArray(declared)&&declared.length>0&&Array.isArray(pass.review.meta.affected_paths)&&
      JSON.stringify([...declared].sort())===JSON.stringify([...pass.review.meta.affected_paths].sort()) &&
      reviewScope?.schema==="yaaw.scope-identity/v1"&&reviewScope?.algorithm==="yaaw-scope-v1" &&
      reviewScope?.status==="READY"&&verificationScope?.status==="READY"&&
      Number.isInteger(reviewScope?.files)&&reviewScope.files>0&&
      /^sha256:[a-f0-9]{64}$/.test(reviewScope?.digest??"") &&
      JSON.stringify(reviewScope)===JSON.stringify(verificationScope) &&
      JSON.stringify(reviewScope.paths)===JSON.stringify([...declared].sort());
    if(!certified)return {kind:"UNKNOWN",reason:"scope attestation not independently corroborated"};
    if(repo?.status!=="READY"||current?.status!=="READY")
      return {kind:"UNKNOWN",reason:"current application scope unavailable for comparison"};
    return current.digest===reviewScope.digest?{kind:"CURRENT",reason:"independently certified application scope unchanged"}:
      {kind:"REVERIFY",reason:"reviewed application scope content changed"};
  }
  if(eq(old,repo))return {kind:"CURRENT",reason:"repository matches reviewed identity"};
  const delta=a.repository_changes?.[old?.head_commit??""],scopes=a.tickets?.[ticket]?.meta?.affected_paths;
  if(old?.dirty!==false||old?.status!=="READY"||repo?.status!=="READY"||delta?.status!=="KNOWN")return {kind:"UNKNOWN",reason:"historical worktree difference cannot be proven unrelated"};
  if(!Array.isArray(scopes)||!scopes.length||!scopes.every(p=>typeof p==="string"&&p.length>0&&!p.includes("*")&&!p.startsWith("/")))return {kind:"UNKNOWN",reason:"missing safe affected_paths provenance"};
  const reviewed=pass.review.meta.affected_paths;
  if(pass.review.meta.scope_verified!==true||!Array.isArray(reviewed)||JSON.stringify([...reviewed].sort())!==JSON.stringify([...scopes].sort()))
    return {kind:"UNKNOWN",reason:"affected_paths were not independently certified at the original review"};
  const affected=delta.paths.some(p=>scopes.some(scope=>scope.endsWith("/")?p.startsWith(scope):p===scope));
  return affected?{kind:"REVERIFY",reason:"changed repository path affects accepted ticket"}:{kind:"CURRENT",reason:"all changed paths proven outside declared scope"};
}
