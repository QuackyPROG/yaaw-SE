import { readFile, writeFile, rm, cp, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { consumer, downstream, seal, run } from '../consumer-fixture.mjs';
import { validateContracts, validateSystemContracts, dispatchableWorkflows, ROUTER_DISPATCH_TARGETS } from '../../.yaaw-core/system/engine/contracts.mjs';
const kernel=JSON.parse(await readFile('.yaaw-core/system/kernel.yaml','utf8'));
const roots:string[]=[];
async function fixture(status='READY'){const root=await consumer();roots.push(root);await downstream(root,status);await seal(root);return root}
const path=(root:string,name:string)=>join(root,'.yaaw-core/project',name);
async function h(root:string){return JSON.parse(await readFile(join(root,'.yaaw-core/runtime/handoff.json'),'utf8'))}
async function change(root:string,name:string,from:string,to:string){const p=path(root,name);await writeFile(p,(await readFile(p,'utf8')).replace(from,to))}
async function basis(root:string){return Promise.all(['engineering.md','specs/SPEC-001.md','tickets/TASK-001.md'].map(n=>readFile(path(root,n),'utf8')))}
afterEach(async()=>{for(const root of roots.splice(0)){if(!resolve(root).includes('yaaw-contract-'))throw new Error('unexpected cleanup target');await rm(root,{recursive:true,force:true})}});

describe('product revision dispatch lifecycle',()=>{
  it('completed accepted scope still admits explicit product evolution',async()=>{
    for(const skill of ['yaaw-revise-prd','yaaw-refine-prd']){
      const root=await fixture('CANCELLED');await change(root,'engineering.md','scope_status: OPEN','scope_status: COMPLETE');
      expect(run(root,'--invoke-skill','yaaw-orchestrator').result.type).toBe('TERMINAL');
      expect(run(root,'--invoke-skill',skill).result.type).toBe('DISPATCH_READY');
    }
  });
  it('REVISION-1/2: direct and continuing material scope revision hand off legally and invalidate only through lifecycle',async()=>{
    const root=await fixture(),before=await basis(root);
    expect(run(root,'--invoke-skill','yaaw-revise-prd').result.workflow).toBe('prd.revise');
    const intentPath=join(root,'.yaaw-core/runtime/intent.json'),intent=JSON.parse(await readFile(intentPath,'utf8'));
    intent.note='Perform full UI redesign. Human approves replacing the prior exclusion.';await writeFile(intentPath,JSON.stringify(intent));
    expect(run(root).result.type).toBe('DISPATCH_READY');
    const handoff=await h(root);expect(handoff.reads).toEqual(['product']);expect(handoff.writes).toEqual(['product']);expect(handoff.result_vocabulary).toContain('HUMAN_INPUT_REQUIRED');
    // Controlled semantic-worker output, not a claim of automated language interpretation.
    await change(root,'product.md','revision: 7','revision: 8');await change(root,'product.md','UI redesign is outside current scope.','Full UI redesign is in accepted scope.\nProvenance: human-approved scope revision replaces the earlier exclusion.');
    expect(await basis(root)).toEqual(before);
    const observed=run(root,'--inspect-only').result.state;expect(observed.product.revision).toBe(8);expect(observed.planning.readiness).toBe('pending');expect(observed.planning.active_spec).toBeNull();
    const next=run(root).result;expect(next.type).toBe('RECONCILE_REQUIRED');expect(next.reconciliation.to).toBe('REPLAN_REQUIRED');
    expect(run(root,'--reconcile-one').result.type).toBe('RECONCILED');
    expect(await readFile(path(root,'engineering.md'),'utf8')).toBe(before[0]);expect(await readFile(path(root,'specs/SPEC-001.md'),'utf8')).toBe(before[1]);
    expect(run(root).result.type).toBe('INTENT_COMPLETE');
    const continued=run(root,'--invoke-skill','yaaw-orchestrator').result;expect(continued.workflow).toBe('planning.replan');expect((await h(root)).role).toBe('planner');
  });
  it('REVISION-2: stale engineering without tickets returns to Planner before creating a spec',async()=>{
    const root=await fixture();await rm(path(root,'tickets/TASK-001.md'));await change(root,'product.md','revision: 7','revision: 8');
    expect(run(root,'--invoke-skill','yaaw-orchestrator').result.workflow).toBe('planning.route');
  });
  it('REVISION-3: ambiguous revision remains draft and continues through product questions',async()=>{
    const root=await fixture();expect(run(root,'--invoke-skill','yaaw-revise-prd').result.type).toBe('DISPATCH_READY');expect((await h(root)).result_vocabulary).toContain('HUMAN_INPUT_REQUIRED');
    await change(root,'product.md','revision: 7','revision: 8');await change(root,'product.md','status: ready','status: draft');
    await writeFile(path(root,'product.md'),(await readFile(path(root,'product.md'),'utf8'))+'\n## Unresolved product questions\nWhich user workflows may materially change during the redesign?\n');
    expect(run(root).result.type).toBe('RECONCILE_REQUIRED');run(root,'--reconcile-one');
    expect(run(root).result.workflow).toBe('prd.route');expect(run(root,'--invoke-skill','yaaw-orchestrator').result.workflow).toBe('prd.route');expect(run(root,'--inspect-only').result.state.product.status).toBe('draft');
  });
  it('REVISION-4: direct refinement preserves revision and downstream source authority',async()=>{
    const root=await fixture(),before=await basis(root);expect(run(root,'--invoke-skill','yaaw-refine-prd').result.workflow).toBe('prd.refine');
    await change(root,'product.md','UI redesign is outside current scope.','The current scope excludes redesigning the user interface.');
    expect(run(root).result.type).toBe('INTENT_COMPLETE');expect(await basis(root)).toEqual(before);
    const state=run(root,'--inspect-only').result.state;expect(state.product.revision).toBe(7);expect(state.planning.readiness).toBe('PASS');expect(state.planning.active_spec).toContain('SPEC-001');
    expect(run(root,'--invoke-skill','yaaw-orchestrator').result.workflow).toBe('implementation.implement-ticket');
  });
});

describe('canonical dispatch completeness',()=>{
  it('CONTRACT-1: all public shortcut metadata and completion vocabularies resolve',async()=>{
    expect(await validateSystemContracts(resolve('.yaaw-core/system'),resolve('skills'))).toEqual([]);
    for(const [id,s] of Object.entries(kernel.skills) as any){
      const root=await fixture(id==='yaaw-review'?'REVIEW_REQUIRED':id==='yaaw-repair'?'REPAIR_REQUIRED':'READY');
      if(id==='yaaw-create-spec'){await rm(path(root,'specs/SPEC-001.md'));await rm(path(root,'tickets/TASK-001.md'))}
      if(id==='yaaw-prd')await change(root,'product.md','status: ready','status: draft');
      if(['yaaw-create-ticket','yaaw-create-tickets'].includes(id))await rm(path(root,'tickets/TASK-001.md'));
      if(id==='yaaw-planner'){await change(root,'engineering.md','readiness: PASS','readiness: pending')}
      const result=run(root,'--invoke-skill',id).result;expect(result.type,id).toBe('DISPATCH_READY');
      if(s.role!=='orchestrator'){expect(result.workflow,id).toBe(s.requested_workflow);expect((await h(root)).role).toBe(s.role)}
    }
  });
  it('CONTRACT-2: every actual router branch target constructs a handoff',async()=>{
    const seen=new Set<string>();
    for(const [state,expected] of [['READY','implementation.implement-ticket'],['DRAFT','planning.create-tickets'],['IN_PROGRESS','implementation.verify-ticket'],['REVIEW_REQUIRED','review.review-ticket'],['REPAIR_REQUIRED','implementation.repair-ticket'],['REPLAN_REQUIRED','planning.replan']]) {
      const root=await fixture(state);const r=run(root,'--invoke-skill','yaaw-orchestrator').result;expect(r.type).toBe('DISPATCH_READY');expect(r.workflow).toBe(expected);seen.add(r.workflow);expect((await h(root)).workflow).toBe(r.workflow);
    }
    for(const [name,expected] of [['product','prd.route'],['engineering','planning.route'],['spec','planning.create-spec']]){
      const root=await fixture();if(name==='product')await change(root,'product.md','status: ready','status: draft');
      if(name==='engineering')await change(root,'engineering.md','readiness: PASS','readiness: pending');
      if(name==='spec'){await rm(path(root,'specs/SPEC-001.md'));await rm(path(root,'tickets/TASK-001.md'))}
      const r=run(root,'--invoke-skill','yaaw-orchestrator').result;expect(r.type).toBe('DISPATCH_READY');expect(r.workflow).toBe(expected);seen.add(r.workflow);
    }
    expect([...seen].sort()).toEqual([...ROUTER_DISPATCH_TARGETS].sort());
  });
  it('internal operations cannot reach standalone dispatch through arbitrary cached intent',async()=>{
    const root=await fixture();run(root,'--invoke-skill','yaaw-revise-prd');
    const p=join(root,'.yaaw-core/runtime/intent.json'),i=JSON.parse(await readFile(p,'utf8'));i.requested_workflow='prd.record-decisions';await writeFile(p,JSON.stringify(i));
    expect(dispatchableWorkflows(kernel).has(i.requested_workflow)).toBe(false);expect(run(root).result.type).toBe('BLOCKED');
  });
  it('CONTRACT-3/4: orphan and unauthorized references fail semantic validation',()=>{
    const mutate=(fn:(k:any)=>void)=>{const k=structuredClone(kernel);fn(k);return validateContracts(k)};
    expect(mutate(k=>k.handoffs['unknown.workflow']=k.handoffs['prd.route']).join(' ')).toMatch(/no workflow/);
    expect(mutate(k=>k.workflows['prd.revise'].role='missing').join(' ')).toMatch(/owning role/);
    expect(mutate(k=>k.handoffs['prd.revise'].writes.push('engineering')).join(' ')).toMatch(/outside prd authority/);
    expect(mutate(k=>k.handoffs['prd.revise'].reads.push('engineering')).join(' ')).toMatch(/outside prd authority/);
    expect(mutate(k=>k.handoffs['prd.revise'].active_artifact='missing').join(' ')).toMatch(/active artifact/);
    expect(mutate(k=>k.handoffs['prd.revise'].required_modules.push('missing')).join(' ')).toMatch(/module/);
    expect(mutate(k=>k.handoffs['prd.revise'].result_vocabulary=['PASS']).join(' ')).toMatch(/result vocabulary/);
    expect(mutate(k=>k.skills['yaaw-revise-prd'].completion_kind='PLANNING_READY').join(' ')).toMatch(/completion semantics/);
    expect(mutate(k=>k.skills['new-shortcut']={...k.skills['yaaw-prd'],requested_workflow:'prd.create'}).join(' ')).toMatch(/prd.create: dispatch target has no handoff/);
  });
  it('corrupted but hash-consistent framework stops as framework defect without handoff fallback',async()=>{
    const root=await fixture(),p=join(root,'.yaaw-core/system/kernel.yaml'),k=JSON.parse(await readFile(p,'utf8'));delete k.handoffs['prd.revise'];await writeFile(p,JSON.stringify(k));await seal(root);
    const r=run(root,'--invoke-skill','yaaw-revise-prd');expect(r.exit).toBe(2);expect(r.result.reason).toBe('FRAMEWORK_CONTRACT_INCONSISTENCY');expect(r.result.diagnostic.workflow).toBe('prd.revise');expect(r.result.diagnostic.source_skill).toBe('yaaw-revise-prd');
  });
  it('damaged selected role and module references stop before dispatch',async()=>{
    for(const mutate of [
      (k:any)=>delete k.roles.prd.document,
      (k:any)=>k.workflows['prd.revise'].operation='missing-operation',
      (k:any)=>k.roles.prd.document='.yaaw-core/system/../outside.md',
      (k:any)=>k.roles.prd.document='.yaaw-core/system/roles/missing.md',
      (k:any)=>k.modules.changeability.path='.yaaw-core/system/../outside.md',
      (k:any)=>k.modules.changeability.path='.yaaw-core/system/modules/missing.md'
    ]) {
      const root=await fixture(),p=join(root,'.yaaw-core/system/kernel.yaml'),k=JSON.parse(await readFile(p,'utf8'));mutate(k);await writeFile(p,JSON.stringify(k));await seal(root);
      const skill=k.modules.changeability.path.includes('missing')?'yaaw-implement':'yaaw-revise-prd';
      const r=run(root,'--invoke-skill',skill);expect(r.exit).toBe(2);expect(r.result.reason).toBe('FRAMEWORK_CONTRACT_INCONSISTENCY');
    }
  });
  it('source core, payload generation and transformed payload verification all reject missing handoffs',async()=>{
    const root=await consumer();roots.push(root);
    for(const name of ['skills','installer/templates'])await cp(resolve(name),join(root,name),{recursive:true});
    await mkdir(join(root,'scripts'),{recursive:true});
    for(const name of ['validate_contracts.mjs','validate_core.py','build_npm_payload.mjs','verify_npm_payload.mjs'])await cp(resolve('scripts',name),join(root,'scripts',name));
    await cp(resolve('package.json'),join(root,'package.json'));
    const p=join(root,'.yaaw-core/system/kernel.yaml'),k=JSON.parse(await readFile(p,'utf8'));delete k.handoffs['prd.revise'];await writeFile(p,JSON.stringify(k));
    const core=spawnSync('python',[join(root,'scripts/validate_core.py')],{cwd:root,encoding:'utf8'});expect(core.status).not.toBe(0);expect(core.stderr).toContain('prd.revise');
    const build=spawnSync(process.execPath,[join(root,'scripts/build_npm_payload.mjs')],{cwd:root,encoding:'utf8'});expect(build.status).not.toBe(0);expect(build.stderr).toContain('prd.revise');
    const verify=spawnSync(process.execPath,[join(root,'scripts/verify_npm_payload.mjs')],{cwd:root,encoding:'utf8'});expect(verify.status).not.toBe(0);expect(verify.stderr).toContain('prd.revise');
  });
});
