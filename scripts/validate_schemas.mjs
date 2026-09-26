#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "../.yaaw-core/system/tools/frontmatter.mjs";

const HERE=dirname(fileURLToPath(import.meta.url));
const ROOT=resolve(HERE,"..");
const SCHEMA_DIR=join(ROOT,".yaaw-core","system","schemas");

function typeOk(v,t){if(t==="null")return v===null;if(t==="array")return Array.isArray(v);if(t==="object")return v!==null&&typeof v==="object"&&!Array.isArray(v);if(t==="integer")return Number.isInteger(v);return typeof v===t;}
export function validateValue(value,schema,schemas,path="$"){
  const errors=[];
  const check=(v,s,p)=>{
    if(s.$ref){const name=s.$ref.split("/").at(-1);const target=schemas[name];if(!target){errors.push(`${p}: unresolved $ref ${s.$ref}`);return}check(v,target,p);return}
    if(s.oneOf){const matches=s.oneOf.filter(x=>{const before=errors.length;const local=[];const old=errors.splice.bind(errors);void old;const e=[];const snapshot=errors.length;checkLocal(v,x,p,e);errors.length=snapshot;return e.length===0}).length;if(matches!==1)errors.push(`${p}: oneOf matched ${matches}`)}
    if(s.anyOf){const ok=s.anyOf.some(x=>{const e=[];checkLocal(v,x,p,e);return e.length===0});if(!ok)errors.push(`${p}: anyOf failed`)}
    if(s.allOf)for(const x of s.allOf)check(v,x,p);
    if(s.if){const e=[];checkLocal(v,s.if,p,e);if(e.length===0&&s.then)check(v,s.then,p)}
    if(s.type){const ts=Array.isArray(s.type)?s.type:[s.type];if(!ts.some(t=>typeOk(v,t))){errors.push(`${p}: type ${ts.join("|")} required`);return}}
    if("const" in s&&JSON.stringify(v)!==JSON.stringify(s.const))errors.push(`${p}: const mismatch`);
    if(s.enum&&!s.enum.some(x=>JSON.stringify(x)===JSON.stringify(v)))errors.push(`${p}: enum mismatch`);
    if(typeof v==="string"){if(s.minLength&&v.length<s.minLength)errors.push(`${p}: minLength`);if(s.pattern&&!new RegExp(s.pattern).test(v))errors.push(`${p}: pattern`)}
    if(typeof v==="number"&&s.minimum!==undefined&&v<s.minimum)errors.push(`${p}: minimum`);
    if(Array.isArray(v)){if(s.minItems!==undefined&&v.length<s.minItems)errors.push(`${p}: minItems`);if(s.uniqueItems&&new Set(v.map(JSON.stringify)).size!==v.length)errors.push(`${p}: uniqueItems`);if(s.items)v.forEach((x,i)=>check(x,s.items,`${p}[${i}]`))}
    if(v!==null&&typeof v==="object"&&!Array.isArray(v)){
      for(const k of s.required??[])if(!(k in v))errors.push(`${p}: missing ${k}`);
      for(const [k,x] of Object.entries(v)){if(s.properties?.[k])check(x,s.properties[k],`${p}.${k}`);else if(s.additionalProperties===false)errors.push(`${p}: unexpected ${k}`);else if(s.additionalProperties&&typeof s.additionalProperties==="object")check(x,s.additionalProperties,`${p}.${k}`)}
    }
  };
  const checkLocal=(v,s,p,out)=>{const before=errors.length;check(v,s,p);out.push(...errors.splice(before));};
  check(value,schema,path);return errors;
}
export { parseFrontmatter };
export async function loadSchemas(){const out={};for(const name of await readdir(SCHEMA_DIR))if(name.endsWith(".json"))out[name]=JSON.parse(await readFile(join(SCHEMA_DIR,name),"utf8"));return out}
export async function validateRepositoryTemplates(){
  const schemas=await loadSchemas(),templates=join(ROOT,".yaaw-core","system","templates"),pairs=[
    ["product.md","product.schema.json"],["engineering.md","engineering.schema.json"],["engineering-research.md","engineering-research.schema.json"],["spec.md","spec.schema.json"],["ticket.md","ticket.schema.json"],["review.md","review.schema.json"],
    ["project-state.json","project-state.schema.json"],["evidence.json","evidence.schema.json"],["handoff.json","handoff.schema.json"],["intent.json","intent.schema.json"],["observed-state.json","observed-state.schema.json"],["dispatch-failures.json","dispatch-failures.schema.json"]
  ],errors=[];
  for(const [template,schemaName] of pairs){const text=await readFile(join(templates,template),"utf8"),value=template.endsWith(".md")?parseFrontmatter(text):JSON.parse(text);for(const e of validateValue(value,schemas[schemaName],schemas,template))errors.push(e)}
  return errors;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const errors=await validateRepositoryTemplates();if(errors.length){console.error("YAAW schema/template validation failed:");errors.forEach(e=>console.error("- "+e));process.exit(1)}console.log("YAAW schema/template validation passed.")}
