#!/usr/bin/env node
// Independent, path-scoped application fingerprint. This supplements, never
// replaces, yaaw-worktree-v3 exact repository identity.
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parseFrontmatter } from "./frontmatter.mjs";

const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const UNKNOWN = reason => ({schema:"yaaw.scope-identity/v1",algorithm:"yaaw-scope-v1",status:"UNKNOWN",paths:[],digest:null,files:0,reason});
const valid = value => typeof value==="string" && value.length>0 && value.length<=1024 &&
  !value.includes("\\") && !value.includes("\0") && !value.includes("*") &&
  !value.includes(":") && !value.startsWith("/") && !value.includes("//") &&
  !value.endsWith("/.") && !value.endsWith("/..") &&
  value.split("/").every(s=>s!==""&&s!=="."&&s!=="..") &&
  ![".yaaw-core",".git"].includes(value.split("/")[0]);
const within=(root,path)=>path===root||path.startsWith(root+sep);
export function scopeIdentity(workspace, scopes) {
  const root=resolve(workspace);
  if(!Array.isArray(scopes)||scopes.length===0||scopes.length>128||!scopes.every(valid)||
     new Set(scopes).size!==scopes.length)return UNKNOWN("missing or unsafe independently reviewed affected_paths");
  const paths=[...scopes].sort(),entries=[],seen=new Set();
  const add=absolute=>{
    if(!within(root,absolute))throw Error("scope escapes workspace");
    const stat=lstatSync(absolute);
    if(stat.isSymbolicLink())throw Error("symlink in scoped application paths");
    if(stat.isDirectory()){
      for(const name of readdirSync(absolute).sort()){
        if(name===".git"||name===".yaaw-core")throw Error("control directory inside application scope");
        add(join(absolute,name));
      }
    }else if(stat.isFile()){
      const rel=relative(root,absolute).split(sep).join("/");
      if(!seen.has(rel)){
        seen.add(rel);if(entries.length>=10000)throw Error("scope exceeds 10000 files");
        entries.push([rel,digest(readFileSync(absolute))]);
      }
    }else throw Error("unsupported scoped application filesystem entry");
  };
  try{
    for(const scope of paths){
      const absolute=resolve(root,scope);
      if(!within(root,absolute))throw Error("scope escapes workspace");
      try{add(absolute)}catch(error){if(error?.code!=="ENOENT")throw error}
    }
    if(!entries.length)return UNKNOWN("no scoped application files; cannot attest coverage");
    entries.sort(([a],[b])=>a.localeCompare(b));
    const body=JSON.stringify({algorithm:"yaaw-scope-v1",paths,entries});
    return {schema:"yaaw.scope-identity/v1",algorithm:"yaaw-scope-v1",status:"READY",paths,digest:"sha256:"+digest(Buffer.from(body)),files:entries.length};
  }catch(error){return UNKNOWN(String(error?.message??error))}
}
function args(argv){
  let workspace=".",ticket=null;
  for(let i=0;i<argv.length;i++){
    if(argv[i]==="--workspace"&&argv[i+1])workspace=argv[++i];
    else if(argv[i]==="--ticket"&&/^TASK-[0-9]+$/.test(argv[i+1]??""))ticket=argv[++i];
    else throw Error("usage: scope-identity.mjs --workspace <path> --ticket TASK-NNN");
  }
  if(!ticket)throw Error("--ticket required");
  return{workspace,ticket};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{
    const {workspace,ticket}=args(process.argv.slice(2));
    const content=readFileSync(join(resolve(workspace),".yaaw-core","project","tickets",ticket+".md"),"utf8");
    const meta=parseFrontmatter(content);
    if(meta.id!==ticket)throw Error("ticket ID does not match file");
    const result=scopeIdentity(workspace,meta.affected_paths);
    console.log(JSON.stringify(result));if(result.status!=="READY")process.exitCode=2;
  }catch(error){console.log(JSON.stringify(UNKNOWN(String(error?.message??error))));process.exitCode=2}
}
