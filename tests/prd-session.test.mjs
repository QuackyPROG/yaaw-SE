import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createPrdSession} from '../src/prd-session.mjs';
import {createCodexWorker} from '../src/codex-worker.mjs';
import {init,batch,answer,propose,review,recover,status,context,SECTIONS} from '../src/prd-engine.mjs';

const work=()=>fs.mkdtempSync(path.join(os.tmpdir(),'yaaw-v3-auto-'));
const Q={id:'Q1',section:'features',question:'Who may register for the product?',
  choices:{A:'Everyone',B:'Invited users',C:'Admins only'},recommendation:'A',rationale:'Lower friction'};
const req=(statement,replaceId=null)=>({section:'features',statement,sources:['Q1'],replaceId});
const discover=(requirements)=>({requirements,assumptions:[],openQuestions:[],implications:[]});
const frontier=(questions=[Q])=>({readyCandidate:questions.length===0,questions,rationale:'Product frontier'});
const verdict=(verdict='PASS',authorizedReplacements=[],findings=[])=>({verdict,authorizedReplacements,findings});
const finding=(detail)=>({type:'UNSUPPORTED',detail,question:'What behavior did you intend?'});
const coverage=()=>Object.fromEntries(Object.keys(SECTIONS).map(k=>[k,k==='features'?'COVERED':'NOT_APPLICABLE']));
const ready=()=>({verdict:'READY',blockers:[],questions:[],sectionCoverage:coverage()});
function scripted(steps){
  let id=0;
  const roles=[];
  const fn=async role=>{
    const step=steps.shift();
    assert.ok(step,'Unexpected worker invocation: '+role);
    assert.equal(role,step[0]);
    roles.push(role);
    return {output:step[1],evidence:{role,executionId:'fresh-worker-'+(++id),completed:true}};
  };
  return {fn,roles,remaining:steps};
}
const basicQ=()=>({id:'Q1',section:'features',question:'Who can use the service?',
  choices:{A:'Anyone',B:'Only invited',C:'Staff'},recommendation:'A'});

test('single entrypoint captures initial idea, audits corrections, renews contexts and marks READY',async()=>{
  const dir=work(),initial='Anyone can create an account.',corrected='Actually, users must receive an invitation before they can register.';
  const w=scripted([
    ['DISCOVERY',discover([{section:'features',statement:'Anyone can register for the service.',sources:['Q0'],replaceId:null}])],
    ['AUDIT',verdict()],
    ['DISCOVERY',frontier()],
    ['DISCOVERY',discover([req('A user must be invited before they can register.','PR-0001')])],
    ['AUDIT',verdict('PASS',['PR-0001'])],
    ['DISCOVERY',frontier([])],
    ['READINESS',ready()],
  ]);
  const flow=createPrdSession(w.fn);
  const first=await flow.start(dir);
  assert.equal(first.phase,'AWAIT_ANSWERS');
  assert.equal(first.questions.length,1);
  assert.equal(first.questions[0].id,'Q0');
  assert.match(first.questions[0].question,/What are you trying to build/);
  const next=await flow.submit(dir,{answers:{Q0:initial}});
  assert.equal(next.phase,'AWAIT_ANSWERS');
  assert.equal(next.round,2);
  assert.equal(status(dir).revision,1);
  const end=await flow.submit(dir,{answers:{Q1:corrected}});
  assert.equal(end.phase,'READY');
  assert.equal(status(dir).revision,2);
  const accepted=context(dir).requirements;
  assert.equal(accepted.length,1);
  assert.equal(accepted[0].id,'PR-0001');
  assert.match(accepted[0].statement,/invited/);
  assert.doesNotMatch(accepted[0].statement,/Anyone/);
  const rd=JSON.parse(fs.readFileSync(path.join(dir,'.yaaw-core/project/prd/rounds/0002.json'),'utf8'));
  assert.equal(rd.answers.Q1,corrected);
  assert.notEqual(rd.discoveryExecutionId,rd.review.auditExecutionId);
  assert.deepEqual(w.roles,['DISCOVERY','AUDIT','DISCOVERY','DISCOVERY','AUDIT','DISCOVERY','READINESS']);
  assert.equal(w.remaining.length,0);
});

test('audit rejects unsupported inference and never promotes it',async()=>{
  const dir=work();
  const w=scripted([
    ['DISCOVERY',discover([{section:'features',statement:'Expenses synchronize with every bank account automatically.',sources:['Q0'],replaceId:null}])],
    ['AUDIT',verdict('REJECT',[],[finding('User only asked to track expenses, not synchronize banks.')])],
    ['DISCOVERY',discover([{section:'features',statement:'Users can track their expenses.',sources:['Q0'],replaceId:null}])],
    ['AUDIT',verdict()],
    ['DISCOVERY',frontier()],
  ]);
  const flow=createPrdSession(w.fn);
  await flow.start(dir);
  const next=await flow.submit(dir,{answers:{Q0:'Users can track expenses.'}});
  assert.equal(next.phase,'AWAIT_ANSWERS');
  assert.equal(status(dir).accepted,1);
  assert.match(context(dir).requirements[0].statement,/track their expenses/);
  assert.doesNotMatch(fs.readFileSync(path.join(dir,'.yaaw-core/project/product.md'),'utf8'),/synchronize with every bank/);
  assert.equal(w.remaining.length,0);
});

test('semantic CLARIFY preserves exact answer and asks targeted follow-up',async()=>{
  const dir=work();
  const w=scripted([
    ['DISCOVERY',discover([{section:'features',statement:'Everyone can register immediately.',sources:['Q0'],replaceId:null}])],
    ['AUDIT',verdict('CLARIFY',[],[finding('The user did not specify registration permissions.')])],
    ['DISCOVERY',frontier()],
  ]);
  const flow=createPrdSession(w.fn);
  await flow.start(dir);
  const result=await flow.submit(dir,{answers:{Q0:'Build a social network.'}});
  assert.equal(result.phase,'AWAIT_ANSWERS');
  assert.equal(status(dir).accepted,0);
  const old=JSON.parse(fs.readFileSync(path.join(dir,'.yaaw-core/project/prd/rounds/0001.json'),'utf8'));
  assert.equal(old.answers.Q0,'Build a social network.');
  assert.equal(old.review.verdict,'CLARIFY');
});

test('answer persists before a failed worker and resumes without human repetition',async()=>{
  const dir=work();
  const flow=createPrdSession(async()=>{throw Error('Codex unavailable')});
  await flow.start(dir);
  await assert.rejects(()=>flow.submit(dir,{answers:{Q0:'A private journal for runners.'}}),/Codex unavailable/);
  assert.equal(status(dir).phase,'ANSWERED');
  const round=JSON.parse(fs.readFileSync(path.join(dir,'.yaaw-core/project/prd/rounds/0001.json'),'utf8'));
  assert.equal(round.answers.Q0,'A private journal for runners.');
});

test('crash after commit journal recovers exactly once without re-review',()=>{
  const dir=work();init(dir);
  batch(dir,{questions:[basicQ()]});answer(dir,{answers:{Q1:'Anyone can use it.'}});
  const p=propose(dir,{requirements:[{section:'features',statement:'Anyone can register for the service.',sources:['Q1']}]});
  let crash=true;
  const old=fs.renameSync;
  fs.renameSync=function(from,to){
    if(crash&&to.endsWith('product.md')){crash=false;throw Error('simulated process interruption')};
    return old.apply(this,arguments);
  };
  try{assert.throws(()=>review(dir,{basis:p.reviewBasis,verdict:'PASS',reviewer:'independent',findings:[]}),/simulated/)}
  finally{fs.renameSync=old}
  assert.equal(status(dir).phase,'COMMIT_PENDING');
  recover(dir);
  assert.equal(status(dir).phase,'ACCEPTED');
  assert.equal(status(dir).revision,1);
  assert.equal(context(dir).requirements.length,1);
  recover(dir);
  assert.equal(status(dir).revision,1);
});

test('crash during stage rehydrates pending proposal from journal',()=>{
  const dir=work();init(dir);
  batch(dir,{questions:[basicQ()]});answer(dir,{answers:{Q1:'Staff only.'}});
  let crash=true;
  const old=fs.renameSync;
  fs.renameSync=function(from,to){
    if(crash&&to.endsWith('product.md')){crash=false;throw Error('simulated stage crash')};
    return old.apply(this,arguments);
  };
  try{assert.throws(()=>propose(dir,{requirements:[{section:'features',statement:'Only staff members can register for this service.',sources:['Q1']}]}),/simulated/)}
  finally{fs.renameSync=old}
  assert.equal(status(dir).phase,'REVIEW_PENDING');
  recover(dir);
  assert.match(fs.readFileSync(path.join(dir,'.yaaw-core/project/product.md'),'utf8'),/Candidate 1/);
  assert.equal(status(dir).accepted,0);
});

test('fresh SDK adapter starts distinct read-only threads and rejects reuse',async()=>{
  let i=0,starts=[];
  class FakeCodex {
    startThread(options){
      starts.push(options);
      return {id:null,async run(prompt,args){
        this.id='unique-thread-'+(++i);
        assert.match(prompt,/NEW execution context/);
        assert.ok(args.outputSchema);
        return {finalResponse:'{"ok":true}'};
      }};
    }
  }
  const run=createCodexWorker({CodexClass:FakeCodex});
  const a=await run('DISCOVERY',{question:'first'},{type:'object'},work());
  const b=await run('AUDIT',{question:'second'},{type:'object'},work());
  assert.notEqual(a.evidence.executionId,b.evidence.executionId);
  assert.ok(starts.every(s=>s.sandboxMode==='read-only'&&s.approvalPolicy==='never'&&s.networkAccessEnabled===false));
});
