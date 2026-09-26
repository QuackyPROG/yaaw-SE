#!/usr/bin/env node
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readlinkSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ALGORITHM = "yaaw-worktree-v2";
const CONTROL_OUTPUT_EXCLUDES = [
  ".yaaw-core/runtime/**",
  ".yaaw-core/project/state.json",
  ".yaaw-core/project/evidence/**",
  ".yaaw-core/project/reviews/**"
];
const EXCLUDE_PATHSPECS = CONTROL_OUTPUT_EXCLUDES.map(path => `:(exclude)${path}`);
const hash = value => createHash("sha256").update(value).digest("hex");
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
const canonicalJson = value => JSON.stringify(stable(value));
function fail(status, message) {
  process.stdout.write(JSON.stringify({
    schema:"yaaw.repository-identity/v2", algorithm:null, status, workspace_scope:".",
    git_root_relation:status==="UNVERSIONED"?"none":"unknown", head_commit:null, dirty:null,
    worktree_digest:null, components:null, changed_paths:[], error:message
  })+"\n");
  process.exitCode=2;
}
function git(workspace,args) {
  const r=spawnSync("git",["-C",workspace,...args],{encoding:null,windowsHide:true,maxBuffer:64*1024*1024});
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error((r.stderr??Buffer.alloc(0)).toString("utf8").trim()||`git ${args.join(" ")} exited ${r.status}`);
  return r.stdout??Buffer.alloc(0);
}
const nulPaths=buf=>buf.toString("utf8").split("\0").filter(Boolean).map(p=>p.replaceAll("\\","/")).sort();
function untrackedRecord(workspace,path) {
  const absolute=resolve(workspace,path);
  const stat=lstatSync(absolute);
  if(stat.isSymbolicLink()) return {path,kind:"symlink",sha256:hash(Buffer.from(readlinkSync(absolute),"utf8"))};
  if(stat.isFile()) return {path,kind:"file",sha256:hash(readFileSync(absolute))};
  throw new Error(`unsupported untracked filesystem object: ${path}`);
}

const args=process.argv.slice(2);
let workspaceArg=".";
for(let i=0;i<args.length;i+=1){
  if(args[i]==="--workspace" && args[i+1]) {workspaceArg=args[i+1]; i+=1;}
  else {process.stderr.write("usage: repository-identity.mjs [--workspace <path>]\n"); process.exit(2);}
}
const workspace=resolve(workspaceArg);
let workspacePrefix;
try {
  const inside=git(workspace,["rev-parse","--is-inside-work-tree"]).toString("utf8").trim();
  if(inside!=="true") throw new Error("workspace is not inside a Git work tree");
  workspacePrefix=git(workspace,["rev-parse","--show-prefix"]).toString("utf8").trim().replaceAll("\\","/");
}
catch(error){ fail("UNVERSIONED",error instanceof Error?error.message:String(error)); }

if(workspacePrefix !== undefined){
  try {
      const head=git(workspace,["rev-parse","HEAD"]).toString("utf8").trim();
      const scoped=[".",...EXCLUDE_PATHSPECS];
      const status=git(workspace,["status","--porcelain=v1","-z","--untracked-files=all","--",...scoped]);
      const unstaged=git(workspace,["diff","--binary","--no-ext-diff","--no-textconv","HEAD","--",...scoped]);
      const staged=git(workspace,["diff","--cached","--binary","--no-ext-diff","--no-textconv","HEAD","--",...scoped]);
      const untracked=nulPaths(git(workspace,["ls-files","--others","--exclude-standard","-z","--",...scoped])).map(p=>untrackedRecord(workspace,p));
      const tracked=new Set([
        ...nulPaths(git(workspace,["diff","--name-only","-z","HEAD","--",...scoped])),
        ...nulPaths(git(workspace,["diff","--cached","--name-only","-z","HEAD","--",...scoped]))
      ]);
      const components={
        status_sha256:hash(status),
        unstaged_diff_sha256:hash(unstaged),
        staged_diff_sha256:hash(staged),
        untracked_manifest_sha256:hash(Buffer.from(canonicalJson(untracked),"utf8"))
      };
      const payload={algorithm:ALGORITHM,workspace_scope:".",head_commit:head,excluded:CONTROL_OUTPUT_EXCLUDES,...components,untracked};
      const changed_paths=[
        ...[...tracked].sort().map(path=>({path,kind:"tracked"})),
        ...untracked.map(x=>({path:x.path,kind:"untracked",sha256:x.sha256}))
      ].sort((a,b)=>a.path.localeCompare(b.path));
      process.stdout.write(JSON.stringify({
        schema:"yaaw.repository-identity/v2",algorithm:ALGORITHM,status:"READY",workspace_scope:".",
        git_root_relation:workspacePrefix?"ancestor":"same",head_commit:head,dirty:status.length>0,
        worktree_digest:"sha256:"+hash(Buffer.from(canonicalJson(payload),"utf8")),
        components,changed_paths,error:null
      })+"\n");
  } catch(error) {
    if(process.exitCode!==2) fail("IDENTITY_FAILED",error instanceof Error?error.message:String(error));
  }
}
