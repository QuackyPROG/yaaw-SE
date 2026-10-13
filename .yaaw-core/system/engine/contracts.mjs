import { readFile, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
// The router uses these values at each branch; there is no separate target inventory.
export const ROUTES = Object.freeze({product:'prd.route',planning:'planning.route',spec:'planning.create-spec',tickets:'planning.create-tickets',replan:'planning.replan',repair:'implementation.repair-ticket',review:'review.review-ticket',verify:'implementation.verify-ticket',implement:'implementation.implement-ticket'});
export const ROUTER_DISPATCH_TARGETS = Object.freeze([...new Set(Object.values(ROUTES))]);
// Typed worker outcomes consumed by the host continuation/lifecycle protocol.
const RESULTS = {
  'prd.route':['READY','HUMAN_INPUT_REQUIRED','BLOCKED'],
  'prd.revise':['READY','HUMAN_INPUT_REQUIRED','BLOCKED'],
  'prd.refine':['READY','HUMAN_INPUT_REQUIRED','BLOCKED'],
  'planning.route':['READY','HUMAN_INPUT_REQUIRED','REPLAN','BLOCKED'],
  'planning.readiness-review':['PASS','MISSING_DECISIONS','PRODUCT_GAP','REPLAN','BLOCKED'],
  'planning.create-spec':['SUCCESS','PRECONDITION_UNSATISFIED','BLOCKED'],
  'planning.create-tickets':['SUCCESS','PRECONDITION_UNSATISFIED','BLOCKED'],
  'planning.replan':['READY','HUMAN_INPUT_REQUIRED','BLOCKED'],
  'implementation.implement-ticket':['VERIFICATION_PASS','VERIFICATION_FAIL','REPLAN_REQUIRED','PRECONDITION_UNSATISFIED','BLOCKED'],
  'implementation.verify-ticket':['VERIFICATION_PASS','VERIFICATION_FAIL','IMPLEMENTATION_INCOMPLETE','REPLAN_REQUIRED','BLOCKED'],
  'implementation.repair-ticket':['VERIFICATION_PASS','VERIFICATION_FAIL','REPLAN_REQUIRED','BLOCKED'],
  'review.review-ticket':['PASS','REPAIR','REPLAN','BLOCKED']
};
// A shortcut's completion must describe the operation it actually requests.
const INTENTS = {
  CONTINUE:['orchestration.route','CONTINUE_UNTIL_STOP'],
  CONTINUE_PRODUCT:['prd.route','PRODUCT_READY'],
  REVISE_PRODUCT:['prd.revise','PRODUCT_REVISION_ADVANCED'],
  REFINE_PRODUCT:['prd.refine','PRODUCT_REFINED'],
  CONTINUE_PLANNING:['planning.route','PLANNING_READY'],
  PLANNING_REVIEW:['planning.readiness-review','PLANNING_READINESS_DECIDED'],
  CREATE_SPEC:['planning.create-spec','CURRENT_SPEC_ACCEPTED'],
  CREATE_TICKETS:['planning.create-tickets','CURRENT_TICKETS_REGISTERED'],
  IMPLEMENT:['implementation.implement-ticket','TICKET_REVIEW_REQUIRED'],
  REPAIR:['implementation.repair-ticket','TICKET_REVIEW_REQUIRED'],
  REVIEW:['review.review-ticket','TICKET_REVIEW_APPLIED']
};
export function dispatchableWorkflows(kernel) {
  return new Set([...ROUTER_DISPATCH_TARGETS,...Object.values(kernel.skills??{}).filter(s=>s.role!=='orchestrator').map(s=>s.requested_workflow),...Object.keys(kernel.handoffs??{})]);
}
const managedPath=p=>typeof p==='string'&&p.startsWith('.yaaw-core/system/')&&!p.includes('\\')&&!p.split('/').includes('..')&&p.endsWith('.md');
async function managedFile(system,path) {
  if(!managedPath(path))throw new Error(`invalid managed system reference ${path}`);
  const target=resolve(system,path.slice('.yaaw-core/system/'.length)),root=await realpath(system),actual=await realpath(target),rel=relative(root,actual);
  if(rel.startsWith('..')||isAbsolute(rel)||!(await lstat(target)).isFile())throw new Error(`invalid managed system file ${path}`);
  return target;
}
const operationHeader=(id,w)=>`## Operation: ${w.operation} (\`${id}\`)`;
export async function validateDispatchFiles(system,k,workflow,expertise=[]) {
  const paths=[k.roles[k.workflows[workflow]?.role]?.document,...expertise],errors=[];
  for(const path of paths)try{await managedFile(system,path)}catch{errors.push(`${workflow}: missing/invalid dispatch file ${path}`)}
  const w=k.workflows[workflow];
  try{const text=await readFile(await managedFile(system,k.roles[w.role].document),"utf8");if(!text.includes(operationHeader(workflow,w)))errors.push(`${workflow}: missing selected role operation`)}catch{}
  return errors;
}
const stringList=x=>Array.isArray(x)&&x.every(v=>typeof v==='string'&&v.length>0)&&new Set(x).size===x.length;
const sameSet=(a,b)=>stringList(a)&&stringList(b)&&a.length===b.length&&a.every(x=>b.includes(x));
export function validateContracts(k) {
  const errors=[],roles=k.roles??{},workflows=k.workflows??{},artifacts=k.artifacts??{},modules=k.modules??{},handoffs=k.handoffs??{};
  const error=(id,message)=>errors.push(`${id}: ${message}`);
  for(const [id,a] of Object.entries(artifacts)) {
    if(!roles[a.owner]&&!['lifecycle','installer','none'].includes(a.owner))error(id,'unknown artifact owner');
    if(a.embedded_in&&!artifacts[a.embedded_in])error(id,'unknown embedded artifact');
    if(!a.path&&!a.path_pattern&&!a.embedded_in&&!a.virtual)error(id,'artifact has no locator');
  }
  for(const [id,r] of Object.entries(roles)){
    if(!managedPath(r.document))error(id,'invalid role document reference');
    for(const kind of ['reads','writes']) {
    if(!stringList(r[kind]))error(id,`invalid role ${kind}`);
    else for(const a of r[kind])if(!artifacts[a])error(id,`unknown ${kind} artifact ${a}`);
  }
  }
  for(const [id,w] of Object.entries(workflows)) {
    if(!roles[w.role])error(id,`unknown owning role ${w.role}`);
    if(typeof w.operation!=='string'||!w.operation)error(id,'missing operation');
    if(!['NONE','INSPECT','IDENTITY'].includes(w.repository_requirement))error(id,'invalid repository requirement');
  }
  for(const [id,s] of Object.entries(k.skills??{})) {
    const w=workflows[s.requested_workflow];
    if(!w)error(id,`unknown requested workflow ${s.requested_workflow}`);
    else if(w.role!==s.role)error(id,'skill role differs from workflow owner');
    if(!roles[s.role])error(id,'unknown skill role');
    const intent=INTENTS[s.desired_outcome];
    if(!intent||s.requested_workflow!==intent[0]||s.completion_kind!==intent[1])error(id,'shortcut intent/workflow/completion semantics disagree');
  }
  for(const id of dispatchableWorkflows(k)) {
    const w=workflows[id];
    if(!w)error(id,'dispatch target has no workflow');
    if(w?.role==='orchestrator')error(id,'root operation cannot be a worker dispatch target');
    if(!handoffs[id])error(id,'dispatch target has no handoff contract');
  }
  for(const [id,h] of Object.entries(handoffs)) {
    const w=workflows[id],r=roles[w?.role];
    if(!w||!r){error(id,'handoff has no workflow/owning role');continue}
    for(const kind of ['reads','writes']) {
      if(!stringList(h[kind])){error(id,`invalid handoff ${kind}`);continue}
      for(const a of h[kind]) {
        if(!artifacts[a])error(id,`unknown ${kind} artifact ${a}`);
        if(!r[kind]?.includes(a))error(id,`${kind} outside ${w.role} authority: ${a}`);
      }
    }
    if(!artifacts[h.active_artifact])error(id,`unknown active artifact ${h.active_artifact}`);
    else if(!h.reads?.includes(h.active_artifact)&&!h.writes?.includes(h.active_artifact))error(id,'active artifact outside handoff I/O');
    if(!stringList(h.required_modules))error(id,'invalid required modules');
    else for(const m of h.required_modules)if(!modules[m]?.usable_by?.includes(w.role))error(id,`missing/unauthorized module ${m}`);
    if(typeof h.ticket_modules!=='boolean')error(id,'invalid ticket_modules');
    if(typeof h.expected_output!=='string'||!h.expected_output.trim())error(id,'missing expected output');
    if(!sameSet(h.result_vocabulary,RESULTS[id]))error(id,'result vocabulary incompatible with worker protocol');
  }
  for(const [id,m] of Object.entries(modules)) {
    if(!managedPath(m.path))error(id,'invalid module path reference');
    if(!stringList(m.usable_by)||m.usable_by.some(r=>!roles[r]))error(id,'unknown module role');
  }
  for(const row of k.lifecycle?.legal??[]) {
    if(!workflows[row.workflow]||!roles[row.owner])error('lifecycle','unresolved workflow/owner');
    if(row.writer&&!roles[row.writer])error('lifecycle','unknown writer');
  }
  const routing=k.lifecycle?.routing??{};
  for(const [name,value] of Object.entries(routing)) {
    if(name.endsWith('_workflow')&&!ROUTER_DISPATCH_TARGETS.includes(value))error(name,'routing workflow is not a router target');
  }
  for(const row of Object.values(routing.invalidation_routes??{}))if(!ROUTER_DISPATCH_TARGETS.includes(row.workflow))error('invalidation_routes','unknown router target');
  return errors;
}
export async function validateSystemContracts(system,skills=null) {
  const k=JSON.parse(await readFile(join(system,'kernel.yaml'),'utf8')),errors=validateContracts(k);
  async function textAt(path,id) {
    try{return await readFile(await managedFile(system,path),'utf8')}catch{errors.push(`${id}: missing/invalid referenced file ${path}`);return ''}
  }
  for(const [id,r] of Object.entries(k.roles??{})) {
    const text=await textAt(r.document,id);
    for(const [wid,w] of Object.entries(k.workflows??{}))if(w.role===id&&!text.includes(operationHeader(wid,w)))errors.push(`${wid}: missing role operation`);
  }
  for(const [id,m] of Object.entries(k.modules??{}))await textAt(m.path,id);
  if(skills) {
    const {readdir}=await import('node:fs/promises');
    const dirs=(await readdir(skills,{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>e.name);
    if(!sameSet(dirs,Object.keys(k.skills??{})))errors.push('public skill directory/catalog mismatch');
    for(const [id,s] of Object.entries(k.skills??{})) {
      try {
        const text=await readFile(join(skills,id,'SKILL.md'),'utf8');
        for(const marker of [`name: ${id}`,`ROLE: \`${s.role}\``,`WORKFLOW: \`${s.requested_workflow}\``,`INTENT: \`${s.desired_outcome}\``, 'system/engine/runtime.mjs',`--invoke-skill ${id}`])if(!text.includes(marker))errors.push(`${id}: skill metadata/runtime invocation mismatch (${marker})`);
      }catch{errors.push(`${id}: missing public skill`)}
    }
  }
  // Completion and intent enums are already machine contracts; do not duplicate them.
  const schema=JSON.parse(await readFile(join(system,'schemas/intent.schema.json'),'utf8'));
  for(const [id,s] of Object.entries(k.skills??{}))for(const field of ['desired_outcome','completion_kind'])if(!schema.properties[field].enum.includes(s[field]))errors.push(`${id}: invalid ${field}`);
  return errors;
}
