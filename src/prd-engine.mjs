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
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, data, { flag: 'wx' });
  fs.renameSync(temp, file);
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
export function init(workspace) {
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
export function status(workspace) {
  const s=load(workspace), meta=s.doc.match(statusRegex), refs=accepted(s.doc);
  return {status:meta[1], revision:Number(meta[2]), phase:s.last?.phase??'NO_BATCH', round:s.last?.number??0,
    accepted:refs.length, bySection:Object.fromEntries(sectionNames.map(k=>[k,refs.filter(r=>r.section===k).length])),
    reviewBasis:s.last?.phase==='REVIEW_PENDING'?s.last.reviewBasis:undefined};
}
export function context(workspace) {
  const s=load(workspace), refs=accepted(s.doc);
  return {status:status(workspace), requirements:refs, pendingQuestions:s.last?.phase==='BATCH_OPEN'?s.last.questions:undefined,
    pendingProposals:s.last?.phase==='REVIEW_PENDING'?s.last.proposals:undefined,
    latestFindings:s.last?.phase==='CLARIFICATION_REQUIRED'?s.last.review.findings:undefined};
}
export function batch(workspace, input) {
  const s=load(workspace);
  ensure(!s.last || ['ACCEPTED','CLARIFICATION_REQUIRED'].includes(s.last.phase), 'Previous batch must be completed or clarified first.');
  ensure(Array.isArray(input.questions) && input.questions.length>=1 && input.questions.length<=10, 'Question batch size must be 1–10.');
  const seen=new Set();
  for (const q of input.questions) {
    ensure(isObject(q) && typeof q.id==='string' && /^Q\d+$/.test(q.id) && !seen.has(q.id), 'Unique question IDs (Q1, Q2, ...) required.');
    seen.add(q.id);
    ensure(sectionNames.includes(q.section),`Invalid question section: ${q.section}`);
    ensure(typeof q.question==='string' && q.question.trim().endsWith('?') && q.question.trim().length>=8,`Question ${q.id} must be a real, concise question.`);
    ensure(isObject(q.choices) && ['A','B','C'].every(k=>typeof q.choices[k]==='string' && q.choices[k].trim()) && Object.keys(q.choices).length===3,`Question ${q.id} requires choices A/B/C.`);
    ensure(['A','B','C'].includes(q.recommendation),`Question ${q.id} requires recommendation A/B/C.`);
  }
  const round={number:s.next, phase:'BATCH_OPEN', mode:s.last?.phase==='CLARIFICATION_REQUIRED'?'clarification':'discovery',
    questions:input.questions, parentRound:s.last?.phase==='CLARIFICATION_REQUIRED'?s.last.number:null};
  saveRound(s.p,round);
  return {round:round.number, phase:round.phase, questions:round.questions};
}
export function answer(workspace, input) {
  const s=load(workspace);ensure(s.last?.phase==='BATCH_OPEN','No open question batch.');
  ensure(isObject(input.answers),'Answers must be an object keyed by question ID.');
  const ids=s.last.questions.map(q=>q.id);
  ensure(Object.keys(input.answers).length===ids.length && ids.every(k=>typeof input.answers[k]==='string' && input.answers[k].trim()),'Answer every question; free-form and "skip" are allowed.');
  const r={...s.last, answers:Object.fromEntries(ids.map(id=>[id,input.answers[id]])),phase:'ANSWERED'};
  saveRound(s.p,r);return {round:r.number, phase:r.phase, next:'interpret answers and propose product conclusions'};
}
export function propose(workspace, input) {
  const s=load(workspace);ensure(s.last?.phase==='ANSWERED','Answers required before proposing decisions.');
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
  const basis=digest({accepted:refs,round:s.last.number,answers:s.last.answers,proposals});
  const r={...s.last, proposals,reviewBasis:basis,phase:'REVIEW_PENDING'};
  const formatted=proposals.map((p,i)=>`- **Candidate ${i+1}** (${p.section}; ${p.sources.join(', ')}${p.replaceId?`; replaces ${p.replaceId}`:''}): ${p.statement}`).join('\n');
  atomic(s.p.product,pending(s.doc,formatted));saveRound(s.p,r);
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
export function review(workspace,input) {
  const s=load(workspace);ensure(s.last?.phase==='REVIEW_PENDING','Nothing awaiting review.');
  ensure(isObject(input) && input.basis===s.last.reviewBasis,'Stale or missing review basis.');
  ensure(typeof input.reviewer==='string' && input.reviewer.trim().length>=3,'Reviewer identity/context required.');
  ensure(['PASS','CLARIFY'].includes(input.verdict),'Review verdict must be PASS or CLARIFY.');
  ensure(Array.isArray(input.findings),'Review findings array required.');
  if(input.verdict==='CLARIFY') ensure(input.findings.length>0,'Clarification needs concrete contradiction/ambiguity findings.');
  if(input.verdict==='PASS') {
    ensure(input.findings.length===0,'PASS cannot carry open findings.');
    const replacements=s.last.proposals.filter(r=>r.replaceId).map(r=>r.replaceId).sort();
    const auth=input.authorizedReplacements??[];
    ensure(Array.isArray(auth) && JSON.stringify([...auth].sort())===JSON.stringify(replacements),'Replacements require explicit review authorization referencing the user answer.');
  }
  let doc=pending(s.doc);
  if(input.verdict==='PASS') {
    let nextId=Math.max(0,...accepted(doc).map(r=>Number(r.id.slice(3))))+1;
    for (const p of s.last.proposals) {
      const id=p.replaceId??`PR-${String(nextId++).padStart(4,'0')}`;
      doc=sectionUpdate(doc,p.section,id,`round ${String(s.last.number).padStart(4,'0')} ${p.sources.join('+')}`,p.statement,p.replaceId);
    }
    const m=doc.match(statusRegex);
    doc=doc.replace(statusRegex,`<!-- YAAW:PRODUCT:status=DRAFT;revision=${Number(m[2])+1} -->`);
  }
  const r={...s.last, review:{verdict:input.verdict,reviewer:input.reviewer,findings:input.findings,
    basis:input.basis,authorizedReplacements:input.authorizedReplacements??[]},phase:input.verdict==='PASS'?'ACCEPTED':'CLARIFICATION_REQUIRED'};
  atomic(s.p.product,doc);saveRound(s.p,r);
  return {round:r.number,phase:r.phase,productRevision:status(workspace).revision,findings:r.review.findings};
}
export function finalize(workspace, input) {
  const s=load(workspace);
  ensure(s.last?.phase==='ACCEPTED','Cannot finalize while questions, proposals, or clarifications remain.');
  ensure(input?.verdict==='READY' && typeof input.reviewer==='string' && input.reviewer.trim(), 'Explicit independent readiness review required.');
  ensure(Array.isArray(input.blockers) && input.blockers.length===0,'Unresolved readiness blockers.');
  ensure(isObject(input.sectionCoverage) && sectionNames.every(k=>['COVERED','NOT_APPLICABLE'].includes(input.sectionCoverage[k])),'Readiness must assess all 8 product sections.');
  const refs=accepted(s.doc);
  for(const key of sectionNames) ensure(input.sectionCoverage[key]!=='COVERED'||refs.some(r=>r.section===key),`Section ${key} is not covered.`);
  const m=s.doc.match(statusRegex);
  const doc=s.doc.replace(statusRegex,`<!-- YAAW:PRODUCT:status=READY;revision=${m[2]} -->`);
  atomic(s.p.product,doc);
  jsonWrite(path.join(s.p.project,'prd/readiness.json'),{verdict:'READY',reviewer:input.reviewer,sectionCoverage:input.sectionCoverage,revision:Number(m[2])});
  return {status:'READY',revision:Number(m[2])};
}
