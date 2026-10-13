#!/usr/bin/env node
// Install the actual affected release, reproduce its failure, then update from the exact candidate tarball.
import { readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { downstream, run } from '../tests/consumer-fixture.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version;
const npmCli=[process.env.npm_execpath,join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),join(dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')].filter(Boolean).find(existsSync);
if(!npmCli)throw new Error('Cannot locate npm CLI');
function npm(args,capture=false){const r=spawnSync(process.execPath,[npmCli,...args],{cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,YAAW_DISABLE_AUTO_UPDATE:'1'}});if(r.status!==0)throw new Error(`npm ${args.join(' ')} failed: ${r.stdout}\n${r.stderr}`);if(!capture)console.log(r.stdout.trim());return r.stdout}
const pack=JSON.parse(npm(['pack','--json','--ignore-scripts'],true)),tarball=join(root,pack[0].filename),project=await mkdtemp(join(tmpdir(),'yaaw-dispatch-update-'));
async function snapshot(dir){const out={};async function walk(p){for(const e of await readdir(p,{withFileTypes:true})){const f=join(p,e.name);if(e.isDirectory())await walk(f);else out[f.slice(dir.length)]=(await readFile(f)).toString('base64')}}await walk(dir);return out}
try {
  npm(['exec','--yes','--package=yaaw-se@0.3.12','--','yaaw-se','install','--directory',project,'--tools','codex','--skills','standard','--yes']);
  const product=join(project,'.yaaw-core/project/product.md');await writeFile(product,'---\nschema: yaaw.product/v1\nrevision: 7\nstatus: ready\n---\n# Product\nUI redesign is outside current scope.\n');
  await downstream(project);
  const old=run(project,'--invoke-skill','yaaw-revise-prd');if(old.result.reason!=='FRAMEWORK_CONTRACT_INCONSISTENCY'||!old.result.error.includes('no handoff contract for prd.revise'))throw new Error(`Affected release did not reproduce: ${JSON.stringify(old)}`);
  const before=await snapshot(join(project,'.yaaw-core/project'));
  for(const name of ['observed-state.json','handoff.json','intent.json','dispatch-failures.json'])await writeFile(join(project,'.yaaw-core/runtime',name),'{}\n');
  npm(['exec','--yes',`--package=${tarball}`,'--','yaaw-se','install','--directory',project,'--action','quick-update','--yes']);
  const after=await snapshot(join(project,'.yaaw-core/project'));if(JSON.stringify(before)!==JSON.stringify(after))throw new Error('Update changed durable project memory');
  for(const name of ['observed-state.json','handoff.json','intent.json','dispatch-failures.json'])if(existsSync(join(project,'.yaaw-core/runtime',name)))throw new Error(`Cache survived update: ${name}`);
  const system=join(project,'.yaaw-core/system'),{validateSystemContracts}=await import(pathToFileURL(join(system,'engine/contracts.mjs')));
  const errors=await validateSystemContracts(system,join(project,'.agents/skills'));if(errors.length)throw new Error(errors.join('\n'));
  const current=run(project,'--invoke-skill','yaaw-revise-prd');if(current.result.type!=='DISPATCH_READY'||current.result.workflow!=='prd.revise')throw new Error(JSON.stringify(current));
  if(run(project).result.type!=='DISPATCH_READY')throw new Error('Orchestration continuation failed after update');
  const manifest=JSON.parse(await readFile(join(project,'.yaaw-core/install/manifest.json'),'utf8'));if(manifest.yaawVersion!==version)throw new Error('Candidate version not installed');
  console.log(`PASS: affected published 0.3.12 -> exact candidate ${version}; all durable project bytes preserved, caches regenerated, installed contracts validated, prd.revise resumes.`);
}finally {
  const target=resolve(project);if(!target.startsWith(resolve(tmpdir()))||!target.includes('yaaw-dispatch-update-'))throw new Error('Unsafe fixture cleanup');
  await rm(target,{recursive:true,force:true});await rm(tarball,{force:true});
}
