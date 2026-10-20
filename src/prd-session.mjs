import fs from 'node:fs';
import path from 'node:path';
import {init,paths,batch,answer,propose,review,finalize,recover,defer,recordReadiness,status,context,SECTIONS} from './prd-engine.mjs';
import {createCodexWorker} from './codex-worker.mjs';

const sections=Object.keys(SECTIONS), str={type:'string'}, strings={type:'array',items:str};
const obj=p=>({type:'object',properties:p,required:Object.keys(p),additionalProperties:false});
const question=obj({id:str,section:{type:'string',enum:sections},question:str,choices:obj({A:str,B:str,C:str}),recommendation:{type:'string',enum:['A','B','C']},rationale:str});
const proposal=obj({section:{type:'string',enum:sections},statement:str,sources:strings,replaceId:{type:['string','null']}});
const finding=obj({type:str,detail:str,question:str});
export const SCHEMAS={
  INTERPRET:obj({requirements:{type:'array',items:proposal},assumptions:strings,openQuestions:strings,implications:strings}),
  FRONTIER:obj({readyCandidate:{type:'boolean'},questions:{type:'array',items:question},rationale:str}),
  AUDIT:obj({verdict:{type:'string',enum:['PASS','CLARIFY','REJECT','BLOCKED']},findings:{type:'array',items:finding},authorizedReplacements:strings}),
  READINESS:obj({verdict:{type:'string',enum:['READY','CLARIFY','BLOCKED']},blockers:{type:'array',items:finding},
    sectionCoverage:obj(Object.fromEntries(sections.map(k=>[k,{type:'string',enum:['COVERED','NOT_APPLICABLE']}]))),
    questions:{type:'array',items:question}}),
};
const ensure=(ok,msg)=>{if(!ok)throw Error(msg)};
const intro={id:'Q0',section:'vision',question:'What are you trying to build? Explain your idea in your own words. Focus on what the product should do and what people should experience.'};
function evidence(workspace) {
  const p=paths(workspace),ctx=context(workspace);
  const files=fs.existsSync(p.rounds)?fs.readdirSync(p.rounds).filter(f=>/^\d{4}\.json$/.test(f)).sort():[];
  const rounds=files.map(f=>JSON.parse(fs.readFileSync(path.join(p.rounds,f),'utf8')));
  return {contract:'PRD product intent ONLY. Original free-form answers override recommended choices. Do not invent unrequested technical decisions.',
    revision:ctx.status.revision,accepted:ctx.requirements,round:rounds.at(-1)??null,
    pastQuestions:rounds.map(r=>({round:r.number,questions:r.questions.map(q=>q.question),phase:r.phase,findings:r.review?.findings??[]}))};
}
function validateQuestions(items) {
  ensure(Array.isArray(items)&&items.length>=1&&items.length<=10,'Expected 1-10 meaningful questions');
  const seen=new Set();
  for(const q of items){
    ensure(q&&/^Q\d+$/.test(q.id)&&sections.includes(q.section)&&typeof q.question==='string'&&q.question.trim().endsWith('?')
      &&q.choices&&['A','B','C'].every(k=>typeof q.choices[k]==='string'&&q.choices[k].trim())
      &&['A','B','C'].includes(q.recommendation)&&!seen.has(q.question.toLowerCase()),
      'Invalid or repeated Discovery question');
    seen.add(q.question.toLowerCase());
  }
}
export function createPrdSession(worker=createCodexWorker()) {
  async function call(role,workspace,data,schema,previousId){
    const r=await worker(role,data,schema,workspace);
    ensure(r?.evidence?.completed===true&&r.evidence.role===role&&
      typeof r.evidence.executionId==='string'&&r.evidence.executionId.length>=5&&
      r.evidence.executionId!==previousId&&r.output&&typeof r.output==='object',
      'Independent worker execution evidence missing or reused');
    return r;
  }
  async function start(workspace) {
    if(!fs.existsSync(paths(workspace).product))init(workspace);
    return advance(workspace);
  }
  async function submit(workspace,input) {
    recover(workspace);
    ensure(status(workspace).phase==='BATCH_OPEN','No active questions');
    answer(workspace,input); // DURABLE ORIGINAL ANSWERS FIRST
    return advance(workspace);
  }
  async function advance(workspace,{retryBlocked=false}={}) {
    recover(workspace);
    for(let i=0;i<12;i++){
      const st=status(workspace),data=evidence(workspace);
      if(st.status==='READY')return {phase:'READY',revision:st.revision};
      if(st.phase==='DISCOVER'){
        const b=batch(workspace,{openEnded:true,questions:[intro]});
        return {phase:'AWAIT_ANSWERS',round:b.round,questions:b.questions};
      }
      if(st.phase==='BATCH_OPEN')return {phase:'AWAIT_ANSWERS',round:st.round,questions:data.round.questions};
      if(st.phase==='ANSWERED'||st.phase==='REJECTED'){
        if(st.phase==='REJECTED'&&(data.round.attempts??0)>=2)
          return {phase:'BLOCKED',reason:'Repeated rejected interpretations require manual inspection'};
        const d=await call('DISCOVERY',workspace,{...data,task:'INTERPRET answers into observable product behavior. cite ONLY current Q IDs. Explicit replacements need replaceId. Empty requirements when ambiguous.'},SCHEMAS.INTERPRET);
        const o=d.output;
        ensure(Array.isArray(o.requirements)&&Array.isArray(o.assumptions)&&Array.isArray(o.openQuestions)&&Array.isArray(o.implications),'Invalid interpretation');
        if(!o.requirements.length) {
          defer(workspace,(o.openQuestions.length?o.openQuestions:['Current answers require clarification']).map(detail=>({type:'UNRESOLVED',detail,question:detail})));
          continue;
        }
        propose(workspace,{requirements:o.requirements,assumptions:o.assumptions,openQuestions:o.openQuestions,implications:o.implications,executionId:d.evidence.executionId});
        continue;
      }
      if(st.phase==='REVIEW_PENDING'||st.phase==='BLOCKED'&&retryBlocked){
        const a=await call('AUDIT',workspace,{...data,task:'Compare staged proposals against exact user answers and all relevant accepted decisions. Reject unsupported features and request clarification for material ambiguity.'},SCHEMAS.AUDIT,data.round.discoveryExecutionId);
        const o=a.output;
        ensure(['PASS','CLARIFY','REJECT','BLOCKED'].includes(o.verdict)&&Array.isArray(o.findings)&&Array.isArray(o.authorizedReplacements),'Invalid audit output');
        ensure((o.verdict==='PASS'&&o.findings.length===0)||(o.verdict!=='PASS'&&o.findings.length>0),'Audit verdict/findings inconsistent');
        review(workspace,{basis:data.round.reviewBasis,verdict:o.verdict,reviewer:'codex-audit',findings:o.findings,authorizedReplacements:o.authorizedReplacements,auditExecutionId:a.evidence.executionId});
        if(o.verdict==='BLOCKED')return {phase:'BLOCKED',findings:o.findings};
        continue;
      }
      if(st.phase==='BLOCKED')return {phase:'BLOCKED',findings:context(workspace).latestFindings};
      if(st.phase==='ACCEPTED'||st.phase==='CLARIFICATION_REQUIRED'){
        const f=await call('DISCOVERY',workspace,{...data,task:'Generate next nonredundant high-impact product questions, 3-6 normally, 10 maximum, or readyCandidate when product substantially defined. Clarify flagged findings first.'},SCHEMAS.FRONTIER);
        const o=f.output;
        ensure(typeof o.readyCandidate==='boolean'&&Array.isArray(o.questions),'Invalid discovery frontier');
        if(o.readyCandidate&&st.phase==='ACCEPTED'){
          const p=paths(workspace),full=fs.readFileSync(p.product,'utf8');
          const first=fs.readdirSync(p.rounds).filter(x=>/^\d{4}\.json$/.test(x)).sort()[0];
          const firstAnswers=first?JSON.parse(fs.readFileSync(path.join(p.rounds,first),'utf8')).answers??{}:{};
          const a=await call('READINESS',workspace,{...data,fullProduct:full,originalVision:firstAnswers,
            task:'Independently audit complete user journeys, vision alignment, contradictions, exclusions, edge cases, scope, acceptance clarity, all eight PRD sections. Not applicable must be justified.'},SCHEMAS.READINESS,f.evidence.executionId);
          const r=a.output;
          ensure(['READY','CLARIFY','BLOCKED'].includes(r.verdict)&&Array.isArray(r.blockers)&&r.sectionCoverage&&Array.isArray(r.questions),'Invalid readiness audit');
          if(r.verdict==='READY'){
            ensure(r.blockers.length===0,'Readiness has blockers');
            finalize(workspace,{verdict:'READY',reviewer:'codex-readiness',auditExecutionId:a.evidence.executionId,blockers:[],sectionCoverage:r.sectionCoverage});
            return {phase:'READY',revision:status(workspace).revision};
          }
          recordReadiness(workspace,{verdict:r.verdict,blockers:r.blockers,auditExecutionId:a.evidence.executionId});
          if(r.verdict==='BLOCKED')return {phase:'BLOCKED',findings:r.blockers};
          validateQuestions(r.questions);
          const b=batch(workspace,{questions:r.questions});
          return {phase:'AWAIT_ANSWERS',round:b.round,questions:b.questions,readinessFindings:r.blockers};
        }
        validateQuestions(o.questions);
        const b=batch(workspace,{questions:o.questions});
        return {phase:'AWAIT_ANSWERS',round:b.round,questions:b.questions};
      }
      return {phase:'BLOCKED',reason:'Unknown checkpoint '+st.phase};
    }
    return {phase:'BLOCKED',reason:'Transition limit exceeded; inspect durable state'};
  }
  return {start,submit,advance};
}
