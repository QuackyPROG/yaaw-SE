import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {init,batch,answer,propose,review,status,context,finalize,SECTIONS} from '../src/prd-engine.mjs';
const work = () => fs.mkdtempSync(path.join(os.tmpdir(),'yaaw-v3-'));
const question = (section='vision')=>({id:'Q1',section,question:'Who should this serve first?', choices:{A:'Individuals', B:'Teams',C:'Everyone'}, recommendation:'A'});
const proposeOne = (section='vision',replaceId)=>({requirements:[{section,statement:'The app helps individual people plan their weekly meals.',sources:['Q1'],...(replaceId?{replaceId}:{})}]});
const askAnswer = (dir,section='vision')=> {batch(dir,{questions:[question(section)]});answer(dir,{answers:{Q1:'A: individuals who cook at home.'}});};
const approve = (dir,p,more={}) => {const proposal=propose(dir,p);return review(dir,{basis:proposal.reviewBasis,verdict:'PASS',reviewer:'fresh-independent-review',findings:[],...more});};

test('init, decision acceptance, durable product and resumability',()=>{
  const dir=work();init(dir);assert.equal(status(dir).revision,0);
  askAnswer(dir);const p=propose(dir,proposeOne());
  assert.match(fs.readFileSync(path.join(dir,'.yaaw-core/project/product.md'),'utf8'),/NOT ACCEPTED[\s\S]*Candidate 1/);
  assert.equal(status(dir).accepted,0);
  assert.throws(()=>review(dir,{basis:'stale',verdict:'PASS',reviewer:'reviewer',findings:[]}),/Stale/);
  review(dir,{basis:p.reviewBasis,verdict:'PASS',reviewer:'separate-review',findings:[]});
  const doc=fs.readFileSync(path.join(dir,'.yaaw-core/project/product.md'),'utf8');
  assert.match(doc,/\*\*PR-0001\*\*/);assert.doesNotMatch(doc,/Candidate 1/);
  assert.equal(status(dir).revision,1);assert.equal(context(dir).requirements.length,1);
  assert.throws(()=>init(dir),/refusing overwrite/);
});

test('clarification rejects staging and allows only targeted next batch',()=>{
  const dir=work();init(dir);askAnswer(dir);
  const p=propose(dir,proposeOne());
  review(dir,{basis:p.reviewBasis,verdict:'CLARIFY',reviewer:'independent',findings:[{type:'AMBIGUITY',detail:'Unclear intended user group.'}]});
  assert.equal(status(dir).phase,'CLARIFICATION_REQUIRED');
  assert.equal(status(dir).accepted,0);
  assert.doesNotMatch(fs.readFileSync(path.join(dir,'.yaaw-core/project/product.md'),'utf8'),/Candidate 1/);
  assert.equal(batch(dir,{questions:[question()]}).round,2);
  assert.equal(status(dir).phase,'BATCH_OPEN');
});

test('replacement requires explicit decision and reviewer authorization',()=>{
  const dir=work();init(dir);askAnswer(dir);approve(dir,proposeOne());
  askAnswer(dir);
  const p=propose(dir,{requirements:[{section:'vision',statement:'The app helps household groups plan weekly meals together.',sources:['Q1'],replaceId:'PR-0001'}]});
  assert.throws(()=>review(dir,{basis:p.reviewBasis,verdict:'PASS',reviewer:'reviewer',findings:[]}),/authorization/);
  review(dir,{basis:p.reviewBasis,verdict:'PASS',reviewer:'reviewer',findings:[],authorizedReplacements:['PR-0001']});
  const r=context(dir).requirements;
  assert.equal(r.length,1);assert.equal(r[0].id,'PR-0001');assert.match(r[0].statement,/household groups/);
});

test('invalid batches and unresolved review cannot be bypassed',()=>{
  const dir=work();init(dir);
  assert.throws(()=>batch(dir,{questions:Array(11).fill(question())}),/1–10/);
  batch(dir,{questions:[question()]});
  assert.throws(()=>batch(dir,{questions:[question()]}),/Previous batch/);
  assert.throws(()=>answer(dir,{answers:{}}),/Answer every/);
  answer(dir,{answers:{Q1:'Free form: a small group of students.'}});
  assert.throws(()=>propose(dir,{requirements:[{section:'vision',statement:'A student group should use this product.',sources:['Q99']}]}),/cite answered/);
  assert.throws(()=>finalize(dir,{}),/Cannot finalize/);
});

test('finalize needs a concrete coverage/readiness statement',()=>{
  const dir=work();init(dir);askAnswer(dir);approve(dir,proposeOne());
  const coverage=Object.fromEntries(Object.keys(SECTIONS).map(key=>[key,key==='vision'?'COVERED':'NOT_APPLICABLE']));
  assert.throws(()=>finalize(dir,{verdict:'READY',reviewer:'fresh',blockers:[],sectionCoverage:{vision:'COVERED'}}),/all 8/);
  assert.deepEqual(finalize(dir,{verdict:'READY',reviewer:'fresh',blockers:[],sectionCoverage:coverage}),{status:'READY',revision:1});
  assert.equal(status(dir).status,'READY');
});
