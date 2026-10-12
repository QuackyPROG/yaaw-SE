import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
export async function seal(root, version='0.3.0-test') {
  const managedFiles={};
  async function walk(dir) { for(const e of await readdir(dir,{withFileTypes:true})) { const p=join(dir,e.name); if(e.isDirectory())await walk(p); else managedFiles[relative(root,p).replaceAll('\\','/')]={owner:'package:system',sha256:createHash('sha256').update(await readFile(p)).digest('hex')}; } }
  await walk(join(root,'.yaaw-core/system'));
  await writeFile(join(root,'.yaaw-core/install/manifest.json'),JSON.stringify({schema:'yaaw.installation/v2',yaawVersion:version,systemSchema:4,installationSchema:3,projectSchema:3,project:{root:'.'},managedFiles}));
}
export function run(root,...args) {
  const r=spawnSync(process.execPath,[join(root,'.yaaw-core/system/engine/runtime.mjs'),'--workspace',root,...args],{encoding:'utf8',windowsHide:true});
  return {exit:r.status,result:JSON.parse(r.stdout)};
}
export async function consumer(system=resolve('.yaaw-core/system')) {
  const root=await mkdtemp(join(tmpdir(),'yaaw-contract-'));
  await cp(system,join(root,'.yaaw-core/system'),{recursive:true});
  for(const d of ['project/specs','project/tickets','runtime','install'])await mkdir(join(root,'.yaaw-core',d),{recursive:true});
  await writeFile(join(root,'.yaaw-core/project/product.md'),'---\nschema: yaaw.product/v1\nrevision: 7\nstatus: ready\n---\n# Product\n## Scope\nMaintain existing user workflows.\n## Non-goals\nUI redesign is outside current scope.\n');
  return root;
}
export async function downstream(root,status='READY') {
  await writeFile(join(root,'.yaaw-core/project/engineering.md'),'---\nschema: yaaw.engineering/v2\nrevision: 3\nstatus: ready\nproduct_revision: 7\ncurrent_frontier: FRONTIER-001\nreadiness: PASS\nscope_status: OPEN\n---\n# Engineering\nExisting workflow maintenance only.\n');
  await writeFile(join(root,'.yaaw-core/project/specs/SPEC-001.md'),'---\nschema: yaaw.spec/v1\nid: SPEC-001\nrevision: 2\nstatus: ACCEPTED\nproduct_revision: 7\nengineering_revision: 3\nfrontier_id: FRONTIER-001\ndecision_ids: []\n---\n# Specification\n');
  await writeFile(join(root,'.yaaw-core/project/tickets/TASK-001.md'),`---\nschema: yaaw.ticket/v1\nid: TASK-001\nrevision: 1\nstatus: ${status}\nspec: SPEC-001\nspec_revision: 2\nproduct_revision: 7\nengineering_revision: 3\ndependencies: []\ndecision_ids: []\nexpertise: []\n---\n# Ticket\n`);
  for(const args of [['init'],['config','user.email','yaaw@example.test'],['config','user.name','YAAW Test'],['add','.'],['commit','-m','fixture']]) {
    const r=spawnSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true});if(r.status)throw new Error(r.stderr);
  }
}
