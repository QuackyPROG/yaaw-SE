import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const SECTIONS = Object.freeze({
  vision: 'Vision and outcomes',
  people: 'People and context',
  problems: 'Problems and needs',
  features: 'Capabilities and priorities',
  journeys: 'User journeys and states',
  rules: 'Product rules and edge cases',
  experience: 'Experience and constraints',
  scope: 'Release scope and success criteria',
});
const sectionNames = Object.keys(SECTIONS);
const STAGED_BEGIN = '<!-- YAAW:PENDING:BEGIN -->';
const STAGED_END = '<!-- YAAW:PENDING:END -->';
const statusRegex = /<!-- YAAW:PRODUCT:status=(DRAFT|READY);revision=(\d+) -->/;
const reqRegex = /^- \*\*(PR-\d{4})\*\* \[([^\]]+)\] (.+)$/gm;

const ensure = (ok, msg) => { if (!ok) throw new Error(msg); };
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const atomic = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    const fd=fs.openSync(temp,'wx');
    try { fs.writeFileSync(fd,data); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(temp,file);
  } finally { if(fs.existsSync(temp)) fs.unlinkSync(temp); }
};
const jsonWrite = (file, value) => atomic(file, `${JSON.stringify(value, null, 2)}\n`);
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const escapeText = value => String(value).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function paths(workspace) {
  const root = path.resolve(workspace);
  return { root, project: path.join(root, '.yaaw-core/project'),
    product: path.join(root, '.yaaw-core/project/product.md'),
    rounds: path.join(root, '.yaaw-core/project/prd/rounds') };
}
export function productTemplate() {
  return `# Product requirements\n\n<!-- YAAW:PRODUCT:status=DRAFT;revision=0 -->\n\nThis document contains accepted product meaning only. Pending interpretations are explicitly unapproved. Implementation choices belong to engineering planning.\n\n${sectionNames.map(key => `## ${SECTIONS[key]}\n\n<!-- YAAW:SECTION:${key}:BEGIN -->\n<!-- YAAW:SECTION:${key}:END -->\n`).join('\n')}\n## Pending interpretations — NOT ACCEPTED\n\n${STAGED_BEGIN}\n${STAGED_END}\n`;
}
function initUnsafe(workspace) {
  const p = paths(workspace);
  ensure(!fs.existsSync(p.product), `Existing product file; refusing overwrite: ${p.product}`);
  atomic(p.product, productTemplate());
  fs.mkdirSync(p.rounds, {recursive:true});
  return {product:p.product, status:'DRAFT'};
}
function load(workspace) {
  const p = paths(workspace);
  ensure(fs.existsSync(p.product), 'Product not initialized; run init.');
  const doc = fs.readFileSync(p.product,'utf8');
  ensure(statusRegex.test(doc), 'Missing managed product metadata; do not edit YAAW markers.');
  for (const key of sectionNames) {
    ensure(doc.includes(`<!-- YAAW:SECTION:${key}:BEGIN -->`) && doc.includes(`<!-- YAAW:SECTION:${key}:END -->`), `Missing section markers: ${key}`);
  }
  ensure(doc.includes(STAGED_BEGIN) && doc.includes(STAGED_END), 'Missing pending section markers.');
  const files = fs.existsSync(p.rounds) ? fs.readdirSync(p.rounds).filter(f=>/^\d{4}\.json$/.test(f)).sort() : [];
  const lastFile=files.at(-1);
  const last=lastFile ? readJson(path.join(p.rounds,lastFile)) : null;
  return {p, doc, last, lastFile, next: files.length ? Number(lastFile.slice(0,4))+1 : 1};
}
function accepted(doc) {
  const accepted = [];
  for (const key of sectionNames) {
    const start=`<!-- YAAW:SECTION:${key}:BEGIN -->`, end=`<!-- YAAW:SECTION:${key}:END -->`;
    const body=doc.split(start)[1].split(end)[0];
    for (const match of body.matchAll(reqRegex)) accepted.push({id:match[1], source:match[2], statement:match[3], section:key});
  }
  return accepted;
}
function pending(doc, content='') {
  const left=doc.indexOf(STAGED_BEGIN)+STAGED_BEGIN.length;
  const right=doc.indexOf(STAGED_END);
  ensure(right>=left, 'Invalid pending markers.');
  return doc.slice(0,left)+ '\n' + content + (content?'\n':'') + doc.slice(right);
}
function saveRound(p, round) {
  jsonWrite(path.join(p.rounds,`${String(round.number).padStart(4,'0')}.json`),round);
}
function usedIds(p) {
  if(!fs.existsSync(p.rounds))return new Set();
  const used=new Set();
  for(const file of fs.readdirSync(p.rounds).filter(f=>/^\d{4}\.json$/.test(f))){
    const r=readJson(path.join(p.rounds,file));
    for(const id of [r.discoveryExecutionId,r.review?.auditExecutionId])
      if(id)used.add(id);
  }
  return used;
}
export function status(workspace) {
  const s=load(workspace), meta=s.doc.match(statusRegex), refs=accepted(s.doc);
  return {status:meta[1], revision:Number(meta[2]), phase:s.last?.phase??'DISCOVER', round:s.last?.number??0,
    accepted:refs.length, bySection:Object.fromEntries(sectionNames.map(k=>[k,refs.filter(r=>r.section===k).length])),
    reviewBasis:['REVIEW_PENDING','BLOCKED'].includes(s.last?.phase)?s.last.reviewBasis:undefined};
}
export function context(workspace) {
  const s=load(workspace), refs=accepted(s.doc);
  return {status:status(workspace), requirements:refs, pendingQuestions:s.last?.phase==='BATCH_OPEN'?s.last.questions:undefined,
    pendingProposals:['REVIEW_PENDING','BLOCKED'].includes(s.last?.phase)?s.last.proposals:undefined,
    latestFindings:['CLARIFICATION_REQUIRED','REJECTED','BLOCKED'].includes(s.last?.phase)?s.last.review?.findings:undefined};
}
function batchUnsafe(workspace, input) {
  const s=load(workspace);
  ensure(!s.last || ['ACCEPTED','CLARIFICATION_REQUIRED'].includes(s.last.phase), 'Previous batch must be completed or clarified first.');
  const initial = !s.last && input.openEnded === true;
  ensure(Array.isArray(input.questions) && input.questions.length>=1 && input.questions.length<=10, 'Question batch size must be 1–10.');
  const seen=new Set();
  for (const q of input.questions) {
    ensure(isObject(q) && typeof q.id==='string' && /^Q\d+$/.test(q.id) && !seen.has(q.id), 'Unique question IDs (Q1, Q2, ...) required.');
    seen.add(q.id);
    ensure(sectionNames.includes(q.section),`Invalid question section: ${q.section}`);
    ensure(typeof q.question==='string' && (initial && q.id==='Q0' || q.question.trim().endsWith('?')) && q.question.trim().length>=8,`Question ${q.id} must be a real, concise question.`);
    if (initial && input.questions.length===1 && q.id==='Q0') {
      ensure(q.question==='What are you trying to build? Explain your idea in your own words. Focus on what the product should do and what people should experience.', 'Invalid initial open question.');
    } else {
      ensure(isObject(q.choices) && ['A','B','C'].every(k=>typeof q.choices[k]==='string' && q.choices[k].trim()) && Object.keys(q.choices).length===3,`Question ${q.id} requires choices A/B/C.`);
      ensure(['A','B','C'].includes(q.recommendation),`Question ${q.id} requires recommendation A/B/C.`);
    }
  }
  const round={number:s.next, phase:'BATCH_OPEN', mode:s.last?.phase==='CLARIFICATION_REQUIRED'?'clarification':'discovery',
    questions:input.questions, parentRound:s.last?.phase==='CLARIFICATION_REQUIRED'?s.last.number:null};
  saveRound(s.p,round);
  if(s.doc.match(statusRegex)[1]==='READY')
    atomic(s.p.product,s.doc.replace(statusRegex,
      `<!-- YAAW:PRODUCT:status=DRAFT;revision=${s.doc.match(statusRegex)[2]} -->`));
  return {round:round.number, phase:round.phase, questions:round.questions};
}
function answerUnsafe(workspace, input) {
  const s=load(workspace);ensure(s.last?.phase==='BATCH_OPEN','No open question batch.');
  ensure(isObject(input.answers),'Answers must be an object keyed by question ID.');
  const ids=s.last.questions.map(q=>q.id);
  ensure(Object.keys(input.answers).length===ids.length && ids.every(k=>typeof input.answers[k]==='string' && input.answers[k].trim()),'Answer every question; free-form and "skip" are allowed.');
  const r={...s.last, answers:Object.fromEntries(ids.map(id=>[id,input.answers[id]])),phase:'ANSWERED'};
  saveRound(s.p,r);return {round:r.number, phase:r.phase, next:'interpret answers and propose product conclusions'};
}
function proposeUnsafe(workspace, input) {
  const s=load(workspace);ensure(['ANSWERED','REJECTED'].includes(s.last?.phase),'Answers required before proposing decisions.');
  ensure(Array.isArray(input.requirements) && input.requirements.length>0,'At least one proposed conclusion required.');
  const refs=accepted(s.doc), activeIds=new Set(refs.map(r=>r.id)), qids=new Set(s.last.questions.map(q=>q.id));
  const replaces=new Set();
  for(const r of input.requirements) {
    ensure(isObject(r) && sectionNames.includes(r.section),'Each requirement needs an approved section.');
    ensure(typeof r.statement==='string' && r.statement.trim().length>=12 && !/[\r\n]/.test(r.statement),'Use a standalone one-line product statement.');
    ensure(Array.isArray(r.sources) && r.sources.length && r.sources.every(id=>qids.has(id)),'Each proposal must cite answered questions in this round.');
    if(r.replaceId) {
      ensure(activeIds.has(r.replaceId),`Cannot replace missing requirement ${r.replaceId}`);
      ensure(refs.find(old=>old.id===r.replaceId).section===r.section, 'Changing a requirement section needs a new explicitly reviewed product decision.');
      ensure(!replaces.has(r.replaceId),`Cannot replace requirement twice: ${r.replaceId}`);
      replaces.add(r.replaceId);
    }
    ensure(!refs.some(old=>old.statement.toLowerCase()===escapeText(r.statement).toLowerCase() && !r.replaceId),'Duplicate accepted product statement.');
  }
  const proposals=input.requirements.map(r=>({section:r.section,statement:escapeText(r.statement),sources:r.sources,replaceId:r.replaceId??null}));
  if(input.executionId) {
    ensure(typeof input.executionId==='string' && input.executionId.length>=5,'Invalid Discovery execution ID.');
    ensure(!usedIds(s.p).has(input.executionId),'Discovery execution identity has already been used.');
  }
  const baseRevision=Number(s.doc.match(statusRegex)[2]);
  const basis=digest({accepted:refs,round:s.last.number,answers:s.last.answers,proposals});
  const r={...s.last, proposals,reviewBasis:basis,baseRevision,
    discoveryExecutionId:input.executionId??null,
    assumptions:input.assumptions??[], openQuestions:input.openQuestions??[],
    implications:input.implications??[], phase:'REVIEW_PENDING'};
  const formatted=proposals.map((p,i)=>`- **Candidate ${i+1}** (${p.section}; ${p.sources.join(', ')}${p.replaceId?`; replaces ${p.replaceId}`:''}): ${p.statement}`).join('\n');
  saveRound(s.p,r);atomic(s.p.product,pending(s.doc,formatted));
  return {round:r.number,phase:r.phase,reviewBasis:basis,requires:'fresh semantic drift review of accepted requirements and staged interpretation'};
}
function sectionUpdate(doc,key,id,source,statement,replaceId=null) {
  const begin=`<!-- YAAW:SECTION:${key}:BEGIN -->`,end=`<!-- YAAW:SECTION:${key}:END -->`;
  const index=doc.indexOf(end);
  if(replaceId) {
    const pattern=new RegExp(`^- \\*\\*${replaceId}\\*\\* \\[[^\\]]+\\] .+$`,'m');
    ensure(pattern.test(doc),`Replacement target missing: ${replaceId}`);
    return doc.replace(pattern,`- **${id}** [${source}] ${statement}`);
  }
  return doc.slice(0,index)+`- **${id}** [${source}] ${statement}\n`+doc.slice(index);
}

function formattedProposals(r) {
  return r.proposals.map((p,i)=>`- **Candidate ${i+1}** (${p.section}; ${p.sources.join(', ')}${p.replaceId?`; replaces ${p.replaceId}`:''}): ${p.statement}`).join('\n');
}
function enactCommit(doc,r) {
  const current=Number(doc.match(statusRegex)?.[2]);
  ensure(current===r.baseRevision,'Stale product revision; refusing commit.');
  let result=pending(doc);
  let nextId=Math.max(0,...accepted(result).map(x=>Number(x.id.slice(3))))+1;
  for(const p of r.proposals) {
    const id=p.replaceId??`PR-${String(nextId++).padStart(4,'0')}`;
    result=sectionUpdate(result,p.section,id,
      `round ${String(r.number).padStart(4,'0')} ${p.sources.join('+')}`,p.statement,p.replaceId);
  }
  return result.replace(statusRegex,
    `<!-- YAAW:PRODUCT:status=DRAFT;revision=${current+1} -->`);
}
function recoverUnsafe(workspace) {
  const s=load(workspace);
  if(!s.last) return status(workspace);
  const r=s.last;
  if(r.phase==='BATCH_OPEN' && s.doc.match(statusRegex)[1]==='READY')
    atomic(s.p.product,s.doc.replace(statusRegex,
      `<!-- YAAW:PRODUCT:status=DRAFT;revision=${s.doc.match(statusRegex)[2]} -->`));
  if (r.phase==='COMMIT_PENDING') {
    ensure(r.review?.verdict==='PASS' && r.review.basis===r.reviewBasis,'Invalid commit journal.');
    const current=Number(s.doc.match(statusRegex)[2]);
    if(current===r.baseRevision) {
      atomic(s.p.product,enactCommit(s.doc,r));
    } else {
      ensure(current===r.baseRevision+1,'Conflicting product revision during recovery.');
      const items=accepted(s.doc);
      ensure(r.proposals.every(p=>items.some(x=>
        x.statement===p.statement && x.section===p.section &&
        x.id===(p.replaceId??x.id) &&
        x.source===`round ${String(r.number).padStart(4,'0')} ${p.sources.join('+')}`)),
        'Committed document disagrees with journal; refusing automatic recovery.');
    }
    saveRound(s.p,{...r,phase:'ACCEPTED'});
  } else if(['REVIEW_PENDING','BLOCKED'].includes(r.phase)) {
    ensure(Number(s.doc.match(statusRegex)[2])===r.baseRevision,
      'Staged proposal has stale product revision.');
    const expected=formattedProposals(r);
    if(s.doc.split(STAGED_BEGIN)[1].split(STAGED_END)[0].trim()!==expected)
      atomic(s.p.product,pending(s.doc,expected));
  } else if(['ANSWERED','REJECTED','CLARIFICATION_REQUIRED','ACCEPTED'].includes(r.phase)) {
    if(s.doc.split(STAGED_BEGIN)[1].split(STAGED_END)[0].trim())
      atomic(s.p.product,pending(s.doc));
  }
  const readyPath=path.join(s.p.project,'prd/readiness.json');
  if(fs.existsSync(readyPath)) {
    const ready=readJson(readyPath), current=fs.readFileSync(s.p.product,'utf8');
    if(ready.verdict==='READY' && ready.revision===Number(current.match(statusRegex)[2])
       && current.match(statusRegex)[1]==='DRAFT' && r.phase==='ACCEPTED') {
      atomic(s.p.product,current.replace(statusRegex,
        `<!-- YAAW:PRODUCT:status=READY;revision=${ready.revision} -->`));
    }
  }
  return status(workspace);
}
function reviewUnsafe(workspace,input) {
  const s=load(workspace);
  ensure(['REVIEW_PENDING','BLOCKED'].includes(s.last?.phase),'Nothing awaiting review.');
  ensure(isObject(input) && input.basis===s.last.reviewBasis,'Stale or missing review basis.');
  ensure(Number(s.doc.match(statusRegex)[2])===s.last.baseRevision,'Stale product revision.');
  ensure(typeof input.reviewer==='string' && input.reviewer.trim().length>=3,'Reviewer identity/context required.');
  ensure(['PASS','CLARIFY','REJECT','BLOCKED'].includes(input.verdict),'Invalid review verdict.');
  ensure(Array.isArray(input.findings),'Review findings array required.');
  if(input.verdict!=='PASS') ensure(input.findings.length>0,'Non-PASS needs specific findings.');
  if (s.last.discoveryExecutionId) {
    ensure(typeof input.auditExecutionId==='string' && input.auditExecutionId.length>=5
      && input.auditExecutionId!==s.last.discoveryExecutionId,
      'Independent Audit execution ID required and must differ from Discovery.');
    ensure(!usedIds(s.p).has(input.auditExecutionId),'Audit execution identity has already been used.');
  }
  const replacements=s.last.proposals.filter(r=>r.replaceId).map(r=>r.replaceId).sort();
  if(input.verdict==='PASS') {
    ensure(input.findings.length===0,'PASS cannot carry open findings.');
    ensure(Array.isArray(input.authorizedReplacements??[])
      && JSON.stringify([...(input.authorizedReplacements??[])].sort())===JSON.stringify(replacements),
      'Replacements require explicit review authorization referencing the user answer.');
  }
  const record={verdict:input.verdict,reviewer:input.reviewer,findings:input.findings,
    basis:input.basis,auditExecutionId:input.auditExecutionId??null,
    authorizedReplacements:input.authorizedReplacements??[]};
  const r={...s.last,review:record, attempts:s.last.attempts+(input.verdict==='REJECT'?1:0)|| (input.verdict==='REJECT'?1:0),
    phase:input.verdict==='PASS'?'COMMIT_PENDING':
      input.verdict==='CLARIFY'?'CLARIFICATION_REQUIRED':
      input.verdict==='REJECT'?'REJECTED':'BLOCKED'};
  // Journal *before* document mutation. Recovery never needs model judgment.
  saveRound(s.p,r);
  if(input.verdict==='PASS') {
    atomic(s.p.product,enactCommit(s.doc,r));
    saveRound(s.p,{...r,phase:'ACCEPTED'});
  } else if(input.verdict!=='BLOCKED') {
    atomic(s.p.product,pending(s.doc));
  }
  return {round:r.number,phase:input.verdict==='PASS'?'ACCEPTED':r.phase,
    productRevision:status(workspace).revision,findings:record.findings};
}
function deferUnsafe(workspace,findings) {
  const s=load(workspace);
  ensure(s.last?.phase==='ANSWERED','Only an answered round can be deferred.');
  ensure(Array.isArray(findings)&&findings.length>0,'Specify why the answers need clarification.');
  const r={...s.last,phase:'CLARIFICATION_REQUIRED',review:{
    verdict:'CLARIFY',reviewer:'no-safe-interpretation',findings,basis:null}};
  saveRound(s.p,r);
  return {phase:r.phase,round:r.number};
}
function recordReadinessUnsafe(workspace,input) {
  const s=load(workspace);
  ensure(s.last?.phase==='ACCEPTED','Readiness review requires an accepted round.');
  ensure(['CLARIFY','BLOCKED'].includes(input.verdict) &&
    Array.isArray(input.blockers)&&input.blockers.length>0,
    'Non-READY review needs blockers.');
  jsonWrite(path.join(s.p.project,'prd/readiness.json'),{
    verdict:input.verdict,revision:Number(s.doc.match(statusRegex)[2]),
    auditExecutionId:input.auditExecutionId??null,blockers:input.blockers,
  });
  return {phase:input.verdict,blockers:input.blockers};
}
function finalizeUnsafe(workspace, input) {
  const s=load(workspace);
  ensure(s.last?.phase==='ACCEPTED','Cannot finalize while questions, proposals, or clarifications remain.');
  ensure(input?.verdict==='READY' && typeof input.reviewer==='string' && input.reviewer.trim(), 'Explicit independent readiness review required.');
  ensure(Array.isArray(input.blockers) && input.blockers.length===0,'Unresolved readiness blockers.');
  ensure(isObject(input.sectionCoverage) && sectionNames.every(k=>['COVERED','NOT_APPLICABLE'].includes(input.sectionCoverage[k])),'Readiness must assess all 8 product sections.');
  const refs=accepted(s.doc);
  if(input.auditExecutionId)ensure(!usedIds(s.p).has(input.auditExecutionId),
    'Readiness reviewer must use a new independent execution context.');
  for(const key of sectionNames) ensure(input.sectionCoverage[key]!=='COVERED'||refs.some(r=>r.section===key),`Section ${key} is not covered.`);
  const m=s.doc.match(statusRegex);
  const doc=s.doc.replace(statusRegex,`<!-- YAAW:PRODUCT:status=READY;revision=${m[2]} -->`);
  jsonWrite(path.join(s.p.project,'prd/readiness.json'),{verdict:'READY',
    reviewer:input.reviewer,auditExecutionId:input.auditExecutionId??null,
    sectionCoverage:input.sectionCoverage,revision:Number(m[2])});
  atomic(s.p.product,doc);
  return {status:'READY',revision:Number(m[2])};
}


// Local one-writer lock; stale crashed-process locks are recoverable.
// Network filesystem and malicious parallel writers require external coordination.
function withLock(workspace, operation) {
  const p=paths(workspace);
  const file=path.join(p.project,'prd/transaction.lock');
  fs.mkdirSync(path.dirname(file),{recursive:true});
  let fd;
  for(let attempt=0;attempt<2;attempt++) {
    try { fd=fs.openSync(file,'wx');break; }
    catch(e) {
      if(e.code!=='EEXIST')throw e;
      let old=null;
      try { old=JSON.parse(fs.readFileSync(file,'utf8')); }catch{}
      let alive=true;
      if(old?.pid>0)try{process.kill(old.pid,0)}catch(err){if(err.code==='ESRCH')alive=false}
      else if(!old && fs.statSync(file).mtimeMs<Date.now()-120000)alive=false;
      if(alive||attempt)throw Error('PRD transaction locked by another process');
      fs.rmSync(file,{force:true});
    }
  }
  try {
    fs.writeFileSync(fd,JSON.stringify({pid:process.pid,createdAt:Date.now()}));
    fs.fsyncSync(fd);
    return operation();
  } finally {
    fs.closeSync(fd);
    fs.rmSync(file,{force:true});
  }
}
for(const name of ['init','batch','answer','propose','review','finalize','recover','defer','recordReadiness']) {
  // Public mutation entrypoints below are explicit wrappers to avoid nested locks.
}

export function init(workspace,...args) { return withLock(workspace,()=>initUnsafe(workspace,...args)); }
export function batch(workspace,...args) { return withLock(workspace,()=>batchUnsafe(workspace,...args)); }
export function answer(workspace,...args) { return withLock(workspace,()=>answerUnsafe(workspace,...args)); }
export function propose(workspace,...args) { return withLock(workspace,()=>proposeUnsafe(workspace,...args)); }
export function review(workspace,...args) { return withLock(workspace,()=>reviewUnsafe(workspace,...args)); }
export function finalize(workspace,...args) { return withLock(workspace,()=>finalizeUnsafe(workspace,...args)); }
export function recover(workspace,...args) { return withLock(workspace,()=>recoverUnsafe(workspace,...args)); }
export function defer(workspace,...args) { return withLock(workspace,()=>deferUnsafe(workspace,...args)); }
export function recordReadiness(workspace,...args) { return withLock(workspace,()=>recordReadinessUnsafe(workspace,...args)); }
