#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const system=resolve(process.argv[2]??'.yaaw-core/system'),k=JSON.parse(await readFile(join(system,'kernel.yaml'),'utf8'));
const {dispatchableWorkflows,ROUTER_DISPATCH_TARGETS,validateSystemContracts}=await import(pathToFileURL(join(system,'engine/contracts.mjs'))),targets=dispatchableWorkflows(k);
const workflows=Object.fromEntries(Object.entries(k.workflows).map(([id,w])=>[id,{role:w.role,operation:w.operation,execution:w.role==='orchestrator'?'ROOT':targets.has(id)?'WORKER_DISPATCH':'INTERNAL',handoff:Boolean(k.handoffs[id]),public_skills:Object.entries(k.skills).filter(([,s])=>s.requested_workflow===id).map(([sid])=>sid),router_target:ROUTER_DISPATCH_TARGETS.includes(id)}]));
const errors=await validateSystemContracts(system,process.argv[3]?resolve(process.argv[3]):null);
console.log(JSON.stringify({workflows,handoffs:Object.keys(k.handoffs),skills:k.skills,router_targets:ROUTER_DISPATCH_TARGETS,dispatch_targets:[...targets].sort(),errors},null,2));if(errors.length)process.exitCode=1;
