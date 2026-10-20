#!/usr/bin/env node
import fs from 'node:fs';
import {init,batch,answer,propose,review,status,context,finalize,recover} from '../src/prd-engine.mjs';
import {createPrdSession} from '../src/prd-session.mjs';

const [,,command,...args]=process.argv;
const workspaceIndex=args.indexOf('--workspace');
const workspace=workspaceIndex>=0?args[workspaceIndex+1]:process.cwd();
const inputFile=args.find(a=>!a.startsWith('--')&&a!==workspace);
const loadInput=()=>{
  if(!inputFile)throw Error("Command '"+command+"' requires a JSON file.");
  return JSON.parse(fs.readFileSync(inputFile,'utf8'));
};
try {
  const commands={
    init:()=>init(workspace),batch:()=>batch(workspace,loadInput()),
    answer:()=>answer(workspace,loadInput()),propose:()=>propose(workspace,loadInput()),
    review:()=>review(workspace,loadInput()),status:()=>status(workspace),
    context:()=>context(workspace),finalize:()=>finalize(workspace,loadInput()),
    recover:()=>recover(workspace),
    start:()=>createPrdSession().start(workspace),
    submit:()=>createPrdSession().submit(workspace,loadInput()),
    continue:()=>createPrdSession().advance(workspace,{retryBlocked:args.includes('--retry-blocked')}),
  };
  if(!commands[command])throw Error('Usage: yaaw-prd <start|submit|continue|status|context|recover|init|batch|answer|propose|review|finalize> [answers.json] [--workspace path]');
  const result=await commands[command]();
  console.log(JSON.stringify(result,null,2));
}catch(e){console.error('YAAW PRD: '+e.message);process.exitCode=1;}
