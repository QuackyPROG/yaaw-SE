#!/usr/bin/env node
/** YAAW v3 PRD transaction gate. The model interprets intent; this tool enforces its persistence protocol. */
import { readFile, writeFile, mkdir, rename, access } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const ROOT = '.yaaw-core/project/prd';
const SECTIONS = ['vision', 'audience', 'problems', 'outcomes', 'features', 'journeys', 'edge-cases', 'scope', 'rules', 'acceptance'];
const LABELS = {
  vision:'Product vision',audience:'Intended users',problems:'User problems',outcomes:'Desired outcomes',
  features:'Features and capabilities',journeys:'User journeys', 'edge-cases':'Unusual situations and failure experiences',
  scope:'Scope and exclusions',rules:'Product rules and constraints',acceptance:'Observable acceptance criteria'
};
const args = process.argv.slice(2);
const command = args.shift();
function arg(name) { const i = args.indexOf(`--${name}`); return i < 0 ? undefined : args[i+1]; }
function fail(msg) { throw new Error(msg); }
function expect(v, msg) { if (!v) fail(msg); }
function hash(v) { return createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex'); }
function pathIn(base, name) { const p = resolve(base, name); expect(p.startsWith(base+'/'), `Path escapes workspace: ${name}`); return p; }
async function readJson(path) { return JSON.parse(await readFile(path,'utf8')); }
async function atomic(path, data) {
  await mkdir(dirname(path), {recursive:true}); const tmp=path+`.tmp-${randomUUID()}`;
  await writeFile(tmp, data,'utf8'); await rename(tmp,path);
}
async function saveJson(p,v) { await atomic(p,JSON.stringify(v,null,2)+'\n'); }
async function exists(p) { try { await access(p); return true; } catch { return false; } }
const workspace = resolve(arg('workspace') ?? process.cwd());
const store = resolve(workspace,ROOT);
const ledgerPath = join(store,'ledger.json');
const productPath = resolve(workspace,'.yaaw-core/project/product.md');
const roundsDir = join(store,'rounds');
const statePath = join(store,'state.json');
function show(x) { process.stdout.write(JSON.stringify(x,null,2)+'\n'); }
async function getContext() {
  expect(await exists(ledgerPath), 'PRD not initialized. Run init.');
  return {ledger:await readJson(ledgerPath),state:await readJson(statePath)};
}
function render(ledger,state) {
  const text=['# Product requirements','',`Status: **${state.status}**`,'',
    '> This describes what people need and what the product does, not how engineers will build it.',''];
  for (const sec of SECTIONS) {
    text.push('## '+LABELS[sec], '');
    const items=ledger.decisions.filter(d=>d.section===sec);
    if(!items.length) text.push('_Not yet established._','');
    else for(const d of items) text.push(`- **${d.key}:** ${d.statement}`,'');
  }
  text.push('## Open product questions','');
  if(!ledger.open_questions.length) text.push('_None recorded._','');
  else for(const q of ledger.open_questions) text.push(`- ${q}`,'');
  text.push('## Provenance','',`- Accepted interview rounds: ${ledger.history.length}`,
    '- Verbatim questions and answers are preserved under `project/prd/rounds/`.','');
  return text.join('\n');
}
function checkQuestions(q) {
  expect(Array.isArray(q.questions) && q.questions.length>=1 && q.questions.length<=10,'Ask 1–10 meaningful questions.');
  const ids=new Set();
  for(const x of q.questions) {
    expect(typeof x.id==='string' && /^Q-[A-Za-z0-9_-]+$/.test(x.id),'Each question needs stable Q-* id.');
    expect(!ids.has(x.id),'Duplicate question ID.'); ids.add(x.id);
    expect(SECTIONS.includes(x.section),'Unknown PRD section for '+x.id);
    expect(typeof x.question==='string' && x.question.trim().length>=8,'Question must be clear.');
    expect(x.options && typeof x.options==='object' && ['A','B','C'].every(k=>typeof x.options[k]==='string' && x.options[k].trim()),'Each question needs A/B/C choices.');
    expect(['A','B','C'].includes(x.recommendation),'Recommendation must identify A/B/C.');
    expect(typeof x.reason==='string' && x.reason.trim().length>=5,'Explain recommendation briefly.');
  }
}
function checkProposal(p, q, raw) {
  expect(Array.isArray(p.decisions) && Array.isArray(p.deferred) && Array.isArray(p.open_questions) && Array.isArray(p.resolved_open_questions),
    'Proposal needs decisions, deferred, open_questions, resolved_open_questions arrays.');
  const ids=new Set(q.questions.map(x=>x.id));
  const covered=new Set(); const keys=new Set();
  for(const d of p.decisions) {
    expect(ids.has(d.question_id),`Unknown question ID: ${d.question_id}`);
    expect(!covered.has(d.question_id), 'One decision or deferral per question in this initial protocol.');
    covered.add(d.question_id);
    expect(SECTIONS.includes(d.section),'Unknown decision section.');
    expect(typeof d.key==='string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.key), 'Use stable kebab-case decision key.');
    expect(!keys.has(d.key),'Two decisions cannot overwrite the same key in a round.'); keys.add(d.key);
    expect(typeof d.statement==='string' && d.statement.trim().length>=8,'Decision statement is missing.');
    expect(typeof d.source_quote==='string' && d.source_quote.trim().length>=1 && raw.includes(d.source_quote),
      `Decision ${d.key} must cite an exact excerpt from the user's raw answers.`);
  }
  for(const d of p.deferred) {
    expect(ids.has(d.question_id) && !covered.has(d.question_id),'Duplicate/unknown deferred question.');
    expect(typeof d.reason==='string' && d.reason.trim(),'Deferred question needs reason.');
    covered.add(d.question_id);
  }
  expect(covered.size===ids.size,'Every asked question needs an interpretation or explicit deferral.');
  expect(p.open_questions.every(x=>typeof x==='string' && x.trim()),'Open questions must be text.');
  expect(p.resolved_open_questions.every(x=>typeof x==='string' && x.trim()),'Resolved questions must be exact prior texts.');
}
async function run() {
  if(command==='init') {
    if(await exists(ledgerPath)) { show({ok:true, already_initialized:true, product:productPath}); return; }
    const ledger={schema:1,decisions:[],open_questions:[],history:[]};
    const state={schema:1,status:'DISCOVERY',round:0,pending:null};
    await mkdir(roundsDir,{recursive:true});
    await saveJson(ledgerPath,ledger); await saveJson(statePath,state); await atomic(productPath,render(ledger,state));
    show({ok:true,product:productPath, next:'prepare'}); return;
  }
  const {ledger,state}=await getContext();
  if(command==='status') { show({status:state.status,round:state.round,pending:state.pending,sections:SECTIONS.map(s=>({section:s,decisions:ledger.decisions.filter(x=>x.section===s).length})),open_questions:ledger.open_questions}); return; }
  if(command==='audit') {
    const actual=await readFile(productPath,'utf8');
    expect(actual===render(ledger,state),'Product projection differs from decision ledger/state; restore by verified recovery, do not continue.');
    show({ok:true,consistent:true,decision_count:ledger.decisions.length,rounds:ledger.history.length}); return;
  }
  if(command==='fingerprint') {
    expect(state.pending && state.pending.phase==='AWAITING_REVIEW','No answers await a reviewer.');
    expect(arg('proposal'),'--proposal JSON required.');
    const p=await readJson(pathIn(workspace,arg('proposal')));
    show({proposal_hash:hash(p),answers_hash:state.pending.answers_hash,context_hash:state.pending.context_hash}); return;
  }
  if(command==='prepare') {
    expect(state.status!=='READY','PRD ready; run a revision workflow for later changes.');
    expect(!state.pending,'Finish or resolve the current round before asking another batch.');
    expect(arg('questions'),'--questions JSON file is required.');
    const qs=await readJson(pathIn(workspace,arg('questions'))); checkQuestions(qs);
    const n=state.round+1; const dir=join(roundsDir,`round-${String(n).padStart(4,'0')}`);
    const contextHash=hash(ledger);
    await mkdir(dir,{recursive:true}); await saveJson(join(dir,'questions.json'),{...qs,context_hash:contextHash});
    state.round=n; state.pending={round:n,phase:'AWAITING_ANSWERS',context_hash:contextHash};
    await saveJson(statePath,state);
    show({ok:true,round:n,questions:qs.questions,notice:'Accept A/B/C, combinations or completely free-form answers. Do not force a choice.'}); return;
  }
  if(command==='capture') {
    expect(state.pending && state.pending.phase==='AWAITING_ANSWERS','No question batch awaits answers.');
    expect(arg('answers'),'--answers text file required.');
    const raw=await readFile(pathIn(workspace,arg('answers')),'utf8');
    expect(raw.trim().length>=1,'Answers cannot be empty.');
    const dir=join(roundsDir,`round-${String(state.pending.round).padStart(4,'0')}`);
    await atomic(join(dir,'answers.md'),raw);
    state.pending.phase='AWAITING_REVIEW'; state.pending.answers_hash=hash(raw);
    await saveJson(statePath,state);
    show({ok:true,next:'Generate a structured proposal, then request an independent semantic review before commit.',answers_hash:hash(raw)}); return;
  }
  if(command==='commit') {
    expect(state.pending && state.pending.phase==='AWAITING_REVIEW','No captured answers await review.');
    expect(arg('proposal') && arg('review'),'--proposal JSON and --review JSON required.');
    const dir=join(roundsDir,`round-${String(state.pending.round).padStart(4,'0')}`);
    const raw=await readFile(join(dir,'answers.md'),'utf8');
    expect(hash(raw)===state.pending.answers_hash,'Raw answers changed after capture.');
    expect(hash(ledger)===state.pending.context_hash,'Decision ledger changed mid-round; restart review.');
    const qs=await readJson(join(dir,'questions.json'));
    const p=await readJson(pathIn(workspace,arg('proposal')));
    checkProposal(p,qs,raw);
    const review=await readJson(pathIn(workspace,arg('review')));
    const pHash=hash(p);
    expect(review.proposal_hash===pHash,'Review was not performed against this exact proposal.');
    expect(review.answers_hash===hash(raw),'Review was not performed against these exact answers.');
    expect(review.context_hash===state.pending.context_hash,'Review was not performed against current prior decisions.');
    expect(review.verdict==='PASS' && typeof review.rationale==='string' && review.rationale.trim().length>=20,
      'Semantic reviewer must PASS with a substantive rationale; otherwise clarify with user.');
    expect(Array.isArray(review.unresolved_conflicts) && review.unresolved_conflicts.length===0,
      'Reviewer found unresolved conflicts; ask clarifying questions.');
    const conflicts=[];
    for(const d of p.decisions) {
      const old=ledger.decisions.find(x=>x.key===d.key);
      if(old && old.statement!==d.statement) conflicts.push({key:d.key,previous:old.statement,proposed:d.statement});
    }
    if(conflicts.length) {
      await saveJson(join(dir,'conflicts.json'),conflicts);
      fail('Prior decisions would change; do not silently overwrite. Use a separate explicit revision workflow after human clarification: '+conflicts.map(x=>x.key).join(', '));
    }
    expect(p.resolved_open_questions.every(x=>ledger.open_questions.includes(x)),
      'Cannot resolve an open question that does not exist.');
    const added=p.decisions.filter(d=>!ledger.decisions.some(x=>x.key===d.key));
    const updated={...ledger,decisions:[...ledger.decisions,...added.map(d=>({...d,round:state.pending.round}))],
      open_questions:[...new Set([...ledger.open_questions.filter(x=>!p.resolved_open_questions.includes(x)),...p.open_questions,...p.deferred.map(d=>d.reason)])],
      history:[...ledger.history,{round:state.pending.round,answers_hash:hash(raw),proposal_hash:pHash,review_verdict:'PASS',decision_keys:added.map(x=>x.key)}]};
    const nextState={...state,pending:null};
    // Persist the audit bundle first; ledger is canonical and PRD is a deterministic projection.
    await saveJson(join(dir,'proposal.json'),p); await saveJson(join(dir,'review.json'),review);
    await saveJson(ledgerPath,updated); await saveJson(statePath,nextState); await atomic(productPath,render(updated,nextState));
    expect((await readFile(productPath,'utf8'))===render(updated,nextState),'Post-commit projection check failed.');
    show({ok:true,round:state.pending.round,added:added.length,open_questions:updated.open_questions.length,next:'Reinspect PRD, resolve gaps, then prepare next batch or finalize.'}); return;
  }
  if(command==='finalize') {
    expect(!state.pending,'Cannot finalize with an unfinished question round.');
    expect(ledger.open_questions.length===0,'Cannot finalize while open questions exist.');
    const needed=['vision','audience','problems','features','journeys','scope','acceptance'];
    const missing=needed.filter(s=>!ledger.decisions.some(x=>x.section===s));
    expect(!missing.length,'Product requirements not ready; missing sections: '+missing.join(', '));
    state.status='READY'; await saveJson(statePath,state); await atomic(productPath,render(ledger,state));
    show({ok:true,status:'READY',product:productPath}); return;
  }
  fail('Usage: node scripts/prd.mjs <init|status|audit|prepare|capture|fingerprint|commit|finalize> [--workspace PATH] [--questions FILE|--answers FILE|--proposal FILE --review FILE]');
}
run().catch(e=>{process.stderr.write('PRD GATE: '+e.message+'\n');process.exitCode=1;});

