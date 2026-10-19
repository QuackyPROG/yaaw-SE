#!/usr/bin/env node
import fs from 'node:fs';
import {init,batch,answer,propose,review,status,context,finalize} from '../src/prd-engine.mjs';

const [, ,command, ...args]=process.argv;
const workspaceIndex=args.indexOf('--workspace');
const workspace=workspaceIndex>=0?args[workspaceIndex+1]:process.cwd();
const inputFile=args.find(a=>!a.startsWith('--') && a!==workspace);
const loadInput=()=>{
  if(!inputFile) throw Error(`Command '${command}' requires a JSON file.`);
  return JSON.parse(fs.readFileSync(inputFile,'utf8'));
};
try {
  const commands={init:()=>init(workspace),batch:()=>batch(workspace,loadInput()),answer:()=>answer(workspace,loadInput()),
    propose:()=>propose(workspace,loadInput()),review:()=>review(workspace,loadInput()),
    status:()=>status(workspace),context:()=>context(workspace),finalize:()=>finalize(workspace,loadInput())};
  if(!commands[command]) throw Error('Usage: node bin/yaaw-prd.mjs <init|batch|answer|propose|review|status|context|finalize> [file.json] [--workspace path]');
  console.log(JSON.stringify(commands[command](),null,2));
} catch(e) {console.error(`YAAW PRD: ${e.message}`);process.exitCode=1;}
